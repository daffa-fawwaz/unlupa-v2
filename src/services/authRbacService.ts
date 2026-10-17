import { UserProfile } from '../types';

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
