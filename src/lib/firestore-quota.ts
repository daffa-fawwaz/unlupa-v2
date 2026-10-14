const QUOTA_STORAGE_KEY = 'hifdz_firestore_quota_until';

/**
 * Checks if Firestore write quota is currently marked as exceeded.
 * Uses persistent storage so page reloads don't immediately trigger new failing writes.
 */
export const isFirestoreQuotaExceeded = (): boolean => {
  try {
    const until = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (until) {
      const untilNum = Number(until);
      if (Date.now() < untilNum) {
        return true;
      }
      localStorage.removeItem(QUOTA_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
  return false;
};

/**
 * Mark Firestore quota as exceeded for a given duration (default 4 hours).
 */
export const markFirestoreQuotaExceeded = (hours = 4): void => {
  try {
    const expireAt = Date.now() + hours * 3600 * 1000;
    localStorage.setItem(QUOTA_STORAGE_KEY, String(expireAt));
  } catch {
    // ignore
  }
};

/**
 * Clears quota flag if user upgrades or manual retry is requested.
 */
export const clearFirestoreQuotaExceeded = (): void => {
  try {
    localStorage.removeItem(QUOTA_STORAGE_KEY);
  } catch {
    // ignore
  }
};
