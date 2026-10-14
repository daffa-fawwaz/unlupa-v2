import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore,
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  setLogLevel
} from 'firebase/firestore';
import { isFirestoreQuotaExceeded, markFirestoreQuotaExceeded } from './firestore-quota';
import firebaseConfigData from '../../firebase-applet-config.json';

// Silence verbose internal backoff and warning logs from Firestore SDK
try {
  setLogLevel('silent');
} catch {
  // ignore
}

// Flexible configuration: Prioritizes standard environment variables (for custom VPS/domain/cloud deployment), with fallback to local JSON configuration.
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigData?.apiKey || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData?.authDomain || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData?.projectId || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData?.storageBucket || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData?.messagingSenderId || '',
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigData?.appId || ''
};

// Initialize Firebase securely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use custom provisioned database ID or fallback to standard (default)
const customDatabaseId = env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigData?.firestoreDatabaseId || '(default)';
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, customDatabaseId);

// Google Auth Provider setup with select_account prompt
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Perform secure Google Sign-In (optimized for Mobile & Web)
 */
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // If popup is blocked by iframe or browser policy, fallback to redirect
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user') {
      try {
        await signInWithRedirect(auth, googleProvider);
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult?.user) {
          return redirectResult.user;
        }
      } catch (redirectErr) {
        console.warn('Redirect sign-in fallback notice:', redirectErr);
      }
    }
    throw error;
  }
}

/**
 * Check if the browser is returning from a redirect sign in
 */
export async function handleRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.error('Error handling redirect result:', error);
    return null;
  }
}

/**
 * Sign in securely with Email & Password
 */
export async function loginWithEmailPassword(email: string, password: string): Promise<User> {
  const sanitizedEmail = email.trim().toLowerCase();
  const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
  return userCredential.user;
}

/**
 * Register a new user with Email, Password, and optional Full Name
 */
export async function registerWithEmailPassword(
  email: string,
  password: string,
  fullName?: string
): Promise<User> {
  const sanitizedEmail = email.trim().toLowerCase();
  const userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
  const user = userCredential.user;

  if (fullName && fullName.trim()) {
    try {
      await updateProfile(user, { displayName: fullName.trim() });
    } catch (profileErr) {
      console.warn('Failed to update displayName on register:', profileErr);
    }
  }

  return user;
}

/**
 * Sign in or Register quickly with Email & Password (legacy wrapper)
 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
  const sanitizedEmail = email.trim().toLowerCase();
  try {
    // Try sign in first
    const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
    return userCredential.user;
  } catch (error: any) {
    // If user not found, automatically register securely
    if (error?.code === 'auth/user-not-found' || error?.code === 'auth/invalid-credential') {
      try {
        const newUserCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
        return newUserCredential.user;
      } catch (createErr) {
        throw createErr;
      }
    }
    throw error;
  }
}

/**
 * Passwordless Magic Link Authentication for ultra-simple Mobile Login
 */
export async function sendEmailLoginLink(email: string): Promise<void> {
  const sanitizedEmail = email.trim().toLowerCase();
  const actionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, sanitizedEmail, actionCodeSettings);
  window.localStorage.setItem('unlupa_email_for_signin', sanitizedEmail);
}

/**
 * Complete Passwordless Sign-In if incoming link is detected
 */
export async function completeEmailLinkSignIn(): Promise<User | null> {
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem('unlupa_email_for_signin');
    if (!email) {
      email = window.prompt('Mohon masukkan email Anda untuk konfirmasi login:');
    }
    if (email) {
      const result = await signInWithEmailLink(auth, email, window.location.href);
      window.localStorage.removeItem('unlupa_email_for_signin');
      return result.user;
    }
  }
  return null;
}

/**
 * Secure Logout
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

import { checkAndBootstrapSuperAdmin } from '../services/authRbacService';

/**
 * Sync user profile to Firestore securely with automated Super Admin bootstrap
 */
export async function syncUserProfileToFirestore(user: User): Promise<'superadmin' | 'admin' | 'user'> {
  // Determine role based on RBAC rules (First Google user is Super Admin, default emails, or regular user)
  const determinedRole = await checkAndBootstrapSuperAdmin(user);

  // If daily quota is already marked as exceeded, return role immediately
  if (isFirestoreQuotaExceeded()) {
    return determinedRole;
  }

  // Throttle profile sync to avoid burning daily write units on every page reload
  const throttleKey = `hifdz_profile_synced_${user.uid}`;
  try {
    const lastSync = localStorage.getItem(throttleKey);
    if (lastSync && Date.now() - Number(lastSync) < 12 * 3600 * 1000) {
      // Synced in the last 12 hours, return role
      return determinedRole;
    }
  } catch {
    // ignore
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    
    if (!snap.exists()) {
      await setDoc(userRef, {
        id: user.uid,
        email: user.email || '',
        fullName: user.displayName || user.email?.split('@')[0] || 'Penghafal Qur\'an',
        avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        role: determinedRole,
        plan: determinedRole === 'superadmin' ? 'institutional' : 'free',
        emailVerified: user.emailVerified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      const existingData = snap.data();
      const existingRole = existingData?.role;
      const finalRole = (existingRole === 'superadmin' || determinedRole === 'superadmin')
        ? 'superadmin'
        : (existingRole === 'admin' || determinedRole === 'admin')
        ? 'admin'
        : 'user';

      await updateDoc(userRef, {
        lastLoginAt: new Date().toISOString(),
        emailVerified: user.emailVerified,
        role: finalRole,
        updatedAt: new Date().toISOString()
      });
    }

    try {
      localStorage.setItem(throttleKey, String(Date.now()));
    } catch {
      // ignore
    }
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes('resource-exhausted') || error?.code === 'resource-exhausted') {
      markFirestoreQuotaExceeded(4);
      console.warn('[Firestore] Profile sync skipped: daily quota reached (operating in offline/local-first mode).');
    } else {
      console.warn('Firestore profile sync notice (offline-safe):', error);
    }
  }

  return determinedRole;
}
