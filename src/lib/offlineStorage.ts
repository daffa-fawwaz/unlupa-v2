/**
 * Offline Storage Engine for Unlupa.id
 *
 * Provides resilient, local-first offline support:
 * 1. CacheStorage & IndexedDB for 604 Mushaf page images (zero-network instant loading).
 * 2. Juz batch offline downloader (save entire Juz for airplane mode / offline murajaah).
 * 3. Offline mutation log & sync queue for reviews performed while disconnected.
 * 4. Full database backup & restore functionality.
 */

import { getQuranPageImageUrl } from '../data/quranData';
import { JUZ_LIST } from '../data/quranData';

const CACHE_NAME = 'unlupa-mushaf-pages-v1';
const DB_NAME = 'unlupa_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'mushaf_blobs';
const QUEUE_STORAGE_KEY = 'unlupa_offline_sync_queue';

/**
 * Open or initialize IndexedDB for blob storage fallback
 */
function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if a Quran page is already stored in local offline cache
 */
export async function isPageCachedOffline(pageNumber: number): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const padded = String(pageNumber).padStart(3, '0');
  const targetUrl = `https://files.quran.app/hafs/madani/width_1260/page${padded}.png`;

  try {
    if ('caches' in window) {
      // Check SW cache first
      const swCache = await caches.open('quran-mushaf-pages-cache');
      let match = await swCache.match(targetUrl);
      
      if (!match) {
        // Fallback to manual cache
        const cache = await caches.open(CACHE_NAME);
        match = await cache.match(targetUrl);
      }
      
      if (match) return true;
    }

    // Secondary check in IndexedDB (for legacy blobs)
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(pageNumber);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn(`[OfflineStorage] Check error for page ${pageNumber}`, err);
    return false;
  }
}

/**
 * Get an offline URL for a page. If stored locally in CacheStorage/IndexedDB, returns an instant local URL.
 */
export async function getOfflinePageUrl(pageNumber: number): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const padded = String(pageNumber).padStart(3, '0');
  const targetUrl = `https://files.quran.app/hafs/madani/width_1260/page${padded}.png`;

  try {
    if ('caches' in window) {
      const swCache = await caches.open('quran-mushaf-pages-cache');
      let match = await swCache.match(targetUrl);
      
      if (!match) {
        const fallbackCache = await caches.open(CACHE_NAME);
        match = await fallbackCache.match(targetUrl);
      }
      
      if (match) {
        // Cached response is opaque (no-cors), so we can't extract the blob.
        // Instead, just return the targetUrl so the `img src` calls it,
        // and the Service Worker will instantly serve it from cache!
        return targetUrl;
      }
    }

    // Check IndexedDB for legacy blobs
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(pageNumber);
      req.onsuccess = () => {
        if (req.result instanceof Blob) {
          resolve(URL.createObjectURL(req.result));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Fetch and save a page image directly into local CacheStorage & IndexedDB
 */
export async function cachePageOffline(pageNumber: number): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const padded = String(pageNumber).padStart(3, '0');
  const targetUrl = `https://files.quran.app/hafs/madani/width_1260/page${padded}.png`;

  try {
    // Check if already in cache
    const alreadyCached = await isPageCachedOffline(pageNumber);
    if (alreadyCached) return true;

    // Fetch from CDN using 'no-cors' because files.quran.app does not provide CORS headers
    const response = await fetch(targetUrl, { mode: 'no-cors' });
    
    // Opaque responses (no-cors) have status 0, so we skip checking response.ok
    if (response.type !== 'opaque' && !response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    // 1. Store in CacheStorage
    if ('caches' in window) {
      // Put directly into PWA runtime cache so the Service Worker can serve it!
      const swCache = await caches.open('quran-mushaf-pages-cache');
      await swCache.put(targetUrl, response.clone());
      
      // Also put in manual cache as fallback
      const cache = await caches.open(CACHE_NAME);
      await cache.put(targetUrl, response);
    }

    // Note: We cannot extract blob from an opaque response, 
    // so we skip putting it in IndexedDB for new caches.
    // The Service Worker will perfectly serve it from CacheStorage anyway.

    return true;
  } catch (err) {
    console.error(`[OfflineStorage] Failed to cache page ${pageNumber}`, err);
    return false;
  }
}

/**
 * Get offline status for an entire Juz
 */
export async function getJuzOfflineStatus(juzNumber: number): Promise<{
  total: number;
  cached: number;
  isFullyCached: boolean;
}> {
  const juz = JUZ_LIST.find((j) => j.juzNumber === juzNumber);
  if (!juz) return { total: 0, cached: 0, isFullyCached: false };

  const total = juz.endPage - juz.startPage + 1;
  let cached = 0;

  for (let p = juz.startPage; p <= juz.endPage; p++) {
    const isCached = await isPageCachedOffline(p);
    if (isCached) cached++;
  }

  return {
    total,
    cached,
    isFullyCached: cached === total,
  };
}

/**
 * Download and cache an entire Juz for offline reading
 */
export async function cacheJuzOffline(
  juzNumber: number,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  const juz = JUZ_LIST.find((j) => j.juzNumber === juzNumber);
  if (!juz) return { success: 0, failed: 0 };

  const total = juz.endPage - juz.startPage + 1;
  let success = 0;
  let failed = 0;

  for (let i = 0; i < total; i++) {
    const pageNum = juz.startPage + i;
    try {
      const ok = await cachePageOffline(pageNum);
      if (ok) success++;
      else failed++;
    } catch {
      failed++;
    }

    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return { success, failed };
}

/**
 * Offline Sync Queue Management
 */
export interface OfflineReviewRecord {
  id: string;
  type: 'quran' | 'personal';
  pageOrItemId: number | string;
  rating: number;
  timestamp: string;
  synced: boolean;
}

export function logOfflineReview(
  type: 'quran' | 'personal',
  pageOrItemId: number | string,
  rating: number
): void {
  if (typeof window === 'undefined') return;

  try {
    const existing: OfflineReviewRecord[] = JSON.parse(
      localStorage.getItem(QUEUE_STORAGE_KEY) || '[]'
    );
    const newRecord: OfflineReviewRecord = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      pageOrItemId,
      rating,
      timestamp: new Date().toISOString(),
      synced: false,
    };
    existing.push(newRecord);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Error logging offline review', e);
  }
}

export function getOfflineQueue(): OfflineReviewRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearOfflineQueue(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(QUEUE_STORAGE_KEY);
}

/**
 * Full Database Backup & Restore Engine
 */
export function exportFullDatabaseBackup(): string {
  if (typeof window === 'undefined') return '{}';

  const backupData: Record<string, any> = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    localStorage: {},
  };

  // Collect all unlupa keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('unlupa_') || key.startsWith('UNLUPA_'))) {
      backupData.localStorage[key] = localStorage.getItem(key);
    }
  }

  return JSON.stringify(backupData, null, 2);
}

export function downloadDatabaseBackup(): void {
  if (typeof window === 'undefined') return;
  const json = exportFullDatabaseBackup();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `unlupa-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function restoreDatabaseBackup(source: string | File): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    let jsonString = '';
    if (typeof source === 'string') {
      jsonString = source;
    } else {
      jsonString = await source.text();
    }

    const parsed = JSON.parse(jsonString);
    if (!parsed.localStorage || typeof parsed.localStorage !== 'object') {
      throw new Error('Invalid backup format');
    }

    Object.entries(parsed.localStorage).forEach(([key, val]) => {
      if (typeof val === 'string') {
        localStorage.setItem(key, val);
      }
    });

    return true;
  } catch (err) {
    console.error('Failed to restore backup', err);
    return false;
  }
}
