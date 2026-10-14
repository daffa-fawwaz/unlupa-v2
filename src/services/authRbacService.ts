import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { isFirestoreQuotaExceeded } from '../lib/firestore-quota';

/**
 * Known default administrator emails configured during registration
 */
export const DEFAULT_ADMIN_EMAILS = [
  'admin@anlupa.id',
  'admin@unlupa.com',
  'admin.unlupa@gmail.com',
  'admin@unlupa@gmail.com',
  'ulilalbabhsibs@gmail.com',
  'ulilalbababdullah@gmail.com'
];

/**
 * Check if a user has administrative privileges (Admin or Super Admin)
 */
export function isUserAdmin(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.role === 'admin' || profile.role === 'superadmin') return true;
  if (profile.email && DEFAULT_ADMIN_EMAILS.includes(profile.email.toLowerCase().trim())) {
    return true;
  }
  return false;
}

/**
 * Check and bootstrap Super Admin privileges.
 * 
 * Rules:
 * 1. Default configured email (admin@anlupa.id or project owner) is always Super Admin.
 * 2. The VERY FIRST user who logs in via Google automatically becomes Super Admin.
 * 3. All subsequent users become regular users ('user').
 */
export async function checkAndBootstrapSuperAdmin(user: User): Promise<'superadmin' | 'admin' | 'user'> {
  const userEmail = (user.email || '').toLowerCase().trim();
  const uid = user.uid;

  // Rule 1: Pre-configured admin emails
  if (DEFAULT_ADMIN_EMAILS.includes(userEmail)) {
    try {
      localStorage.setItem('unlupa_is_admin', 'true');
      localStorage.setItem('unlupa_superadmin_uid', uid);
    } catch {}
    return 'superadmin';
  }

  // Check local storage flag first (fast path & offline safe)
  let localSuperAdminUid = '';
  try {
    localSuperAdminUid = localStorage.getItem('unlupa_superadmin_uid') || '';
  } catch {}

  if (localSuperAdminUid === uid) {
    return 'superadmin';
  }

  // If local storage already has a different superadmin, check if current user is saved as admin
  if (localSuperAdminUid && localSuperAdminUid !== uid) {
    // Current user is not the first superadmin, check if they have admin privileges in db
  }

  // Try Firestore remote check if online & within quota
  if (!isFirestoreQuotaExceeded()) {
    try {
      const configRef = doc(db, 'system_meta', 'auth_setup');
      const configSnap = await getDoc(configRef);

      if (!configSnap.exists()) {
        // No superadmin exists yet in database! This user is the FIRST USER!
        // Bootstrap this user as Super Admin
        await setDoc(configRef, {
          superAdminUid: uid,
          superAdminEmail: userEmail,
          createdAt: serverTimestamp(),
          setupSource: 'first_google_login'
        });

        // Register in admins collection
        await setDoc(doc(db, 'admins', uid), {
          uid: uid,
          email: userEmail,
          role: 'superadmin',
          createdAt: serverTimestamp(),
          note: 'First user automatic Super Admin bootstrap'
        });

        try {
          localStorage.setItem('unlupa_is_admin', 'true');
          localStorage.setItem('unlupa_superadmin_uid', uid);
        } catch {}

        return 'superadmin';
      } else {
        const configData = configSnap.data();
        if (configData?.superAdminUid === uid) {
          try {
            localStorage.setItem('unlupa_is_admin', 'true');
            localStorage.setItem('unlupa_superadmin_uid', uid);
          } catch {}
          return 'superadmin';
        }

        // Check if user is in admins collection
        const adminDoc = await getDoc(doc(db, 'admins', uid));
        if (adminDoc.exists()) {
          const role = adminDoc.data()?.role || 'admin';
          try {
            localStorage.setItem('unlupa_is_admin', 'true');
          } catch {}
          return role === 'superadmin' ? 'superadmin' : 'admin';
        }
      }
    } catch (err) {
      console.warn('[RBAC] Remote check failed, using local bootstrap rule:', err);
    }
  }

  // Local fallback bootstrap rule if Firestore was unreachable or first time offline
  if (!localSuperAdminUid) {
    try {
      localStorage.setItem('unlupa_is_admin', 'true');
      localStorage.setItem('unlupa_superadmin_uid', uid);
    } catch {}
    return 'superadmin';
  }

  // Default: Regular user
  try {
    localStorage.removeItem('unlupa_is_admin');
  } catch {}
  return 'user';
}
