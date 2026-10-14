import { Book, Chapter, BookItem } from '../types';
import { fetchFromFirestore } from '../lib/firestore-sync';
import { bookApiService, ImportResponsePayload } from './bookApiService';

export interface LegacyBookSnapshot {
  book: Book;
  chapters: Chapter[];
  items: BookItem[];
  isSample: boolean;
  sampleReason?: string;
}

export interface LegacySnapshot {
  source: 'local' | 'firestore';
  books: LegacyBookSnapshot[];
  totalCards: number;
  activeCards: number;
  totalReviews: number;
}

export interface BookDifferenceDetail {
  bookId: string;
  bookTitle: string;
  localBook?: LegacyBookSnapshot;
  firestoreBook?: LegacyBookSnapshot;
  differenceType: 'only_local' | 'only_firestore' | 'identical' | 'content_mismatch';
  details: string;
}

export interface ReconciliationComparison {
  hasData: boolean;
  hasConflict: boolean;
  isIdentical: boolean;
  localSnapshot: LegacySnapshot;
  firestoreSnapshot: LegacySnapshot;
  differences: BookDifferenceDetail[];
}

export interface ReconciliationImportResult {
  totalAttempted: number;
  successful: number;
  alreadyExisted: number;
  failed: number;
  results: Array<{
    bookId: string;
    title: string;
    isExisting: boolean;
    result?: ImportResponsePayload;
    error?: string;
  }>;
}

const INITIAL_SAMPLE_TITLES = [
  'nahwu & arabic grammar fundamentals',
  '40 hadith an-nawawi (selected)',
  "essential daily adhkar & du'a",
];

const INITIAL_SAMPLE_AUTHORS = [
  'ust. ahmad al-azhari',
  'imam an-nawawi (curated)',
  'personal collection',
];

/**
 * Detects if a book is purely an uncustomized initial sample book without active user learning
 */
export function detectSampleBook(book: Book, items: BookItem[]): { isSample: boolean; reason?: string } {
  // If book has a class ID, it is a classroom assignment, not a personal book
  if (book.classId) {
    return { isSample: true, reason: 'Buku penugasan kelas santri (bukan buku pribadi).' };
  }

  const cleanTitle = (book.title || '').trim().toLowerCase();
  const cleanAuthor = (book.authorName || '').trim().toLowerCase();

  const matchesTitle = INITIAL_SAMPLE_TITLES.some(t => cleanTitle.includes(t));
  const matchesAuthor = INITIAL_SAMPLE_AUTHORS.some(a => cleanAuthor.includes(a));

  // Check if user has active learning history or created custom cards
  const hasUserActivity = items.some(
    (item) => item.isActive || (item.fsrsData && (item.fsrsData.reps || 0) > 0) || (item.reviewLogs && item.reviewLogs.length > 0)
  );

  // If it's a sample title/author and has ZERO user reviews/activations, it's untouched sample data
  if ((matchesTitle || matchesAuthor || book.id === 'book-1' || book.id === 'book-2' || book.id === 'book-3') && !hasUserActivity) {
    return {
      isSample: true,
      reason: 'Buku sample bawaan sistem tanpa aktivitas belajar aktif oleh pengguna.',
    };
  }

  return { isSample: false };
}

function getUserKey(userId: string, key: string): string {
  return `unlupa_user_${userId}_${key}`;
}

/**
 * Reads legacy snapshot from LocalStorage for the current user
 */
export function readLocalStorageSnapshot(userId: string): LegacySnapshot {
  let rawBooks: Book[] = [];
  let rawChapters: Chapter[] = [];
  let rawItems: BookItem[] = [];

  try {
    const cachedBooks = localStorage.getItem(getUserKey(userId, 'books'));
    if (cachedBooks) {
      const parsed = JSON.parse(cachedBooks);
      if (Array.isArray(parsed)) rawBooks = parsed.filter(b => b && b.id && b.title);
    }

    const cachedChapters = localStorage.getItem(getUserKey(userId, 'chapters'));
    if (cachedChapters) {
      const parsed = JSON.parse(cachedChapters);
      if (Array.isArray(parsed)) rawChapters = parsed.filter(c => c && c.id && c.bookId);
    }

    const cachedItems = localStorage.getItem(getUserKey(userId, 'items'));
    if (cachedItems) {
      const parsed = JSON.parse(cachedItems);
      if (Array.isArray(parsed)) rawItems = parsed.filter(i => i && i.id && i.bookId);
    }
  } catch (e) {
    console.warn('[Reconciliation] Error parsing LocalStorage data:', e);
  }

  const books: LegacyBookSnapshot[] = rawBooks.map(book => {
    const bookChapters = rawChapters.filter(c => c.bookId === book.id);
    const bookItems = rawItems.filter(i => i.bookId === book.id);
    const sampleCheck = detectSampleBook(book, bookItems);
    return {
      book,
      chapters: bookChapters,
      items: bookItems,
      isSample: sampleCheck.isSample,
      sampleReason: sampleCheck.reason,
    };
  });

  const totalCards = books.reduce((acc, b) => acc + b.items.length, 0);
  const activeCards = books.reduce((acc, b) => acc + b.items.filter(i => i.isActive).length, 0);
  const totalReviews = books.reduce(
    (acc, b) => acc + b.items.reduce((r, i) => r + (i.reviewLogs?.length || 0), 0),
    0
  );

  return {
    source: 'local',
    books,
    totalCards,
    activeCards,
    totalReviews,
  };
}

/**
 * Reads legacy snapshot from Firestore for the current user
 */
export async function readFirestoreSnapshot(firebaseUid: string): Promise<LegacySnapshot> {
  let rawBooks: Book[] = [];
  let rawChapters: Chapter[] = [];
  let rawItems: BookItem[] = [];

  try {
    const [fetchedBooks, fetchedChapters, fetchedItems] = await Promise.all([
      fetchFromFirestore(firebaseUid, 'books'),
      fetchFromFirestore(firebaseUid, 'chapters'),
      fetchFromFirestore(firebaseUid, 'items'),
    ]);

    if (Array.isArray(fetchedBooks)) rawBooks = fetchedBooks.filter(b => b && b.id && b.title);
    if (Array.isArray(fetchedChapters)) rawChapters = fetchedChapters.filter(c => c && c.id && c.bookId);
    if (Array.isArray(fetchedItems)) rawItems = fetchedItems.filter(i => i && i.id && i.bookId);
  } catch (e) {
    console.warn('[Reconciliation] Error fetching Firestore snapshot:', e);
  }

  const books: LegacyBookSnapshot[] = rawBooks.map(book => {
    const bookChapters = rawChapters.filter(c => c.bookId === book.id);
    const bookItems = rawItems.filter(i => i.bookId === book.id);
    const sampleCheck = detectSampleBook(book, bookItems);
    return {
      book,
      chapters: bookChapters,
      items: bookItems,
      isSample: sampleCheck.isSample,
      sampleReason: sampleCheck.reason,
    };
  });

  const totalCards = books.reduce((acc, b) => acc + b.items.length, 0);
  const activeCards = books.reduce((acc, b) => acc + b.items.filter(i => i.isActive).length, 0);
  const totalReviews = books.reduce(
    (acc, b) => acc + b.items.reduce((r, i) => r + (i.reviewLogs?.length || 0), 0),
    0
  );

  return {
    source: 'firestore',
    books,
    totalCards,
    activeCards,
    totalReviews,
  };
}

/**
 * Compares LocalStorage and Firestore snapshots deeply
 */
export function compareSnapshots(
  local: LegacySnapshot,
  remote: LegacySnapshot
): ReconciliationComparison {
  const hasLocal = local.books.length > 0;
  const hasRemote = remote.books.length > 0;
  const hasData = hasLocal || hasRemote;

  const differences: BookDifferenceDetail[] = [];
  const processedIds = new Set<string>();

  // Compare each local book against remote
  for (const lb of local.books) {
    processedIds.add(lb.book.id);
    const rb = remote.books.find(r => r.book.id === lb.book.id || (r.book.title.trim().toLowerCase() === lb.book.title.trim().toLowerCase() && !r.isSample));

    if (!rb) {
      differences.push({
        bookId: lb.book.id,
        bookTitle: lb.book.title,
        localBook: lb,
        differenceType: 'only_local',
        details: `Hanya ada di perangkat lokal (${lb.items.length} kartu, ${lb.items.filter(i => i.isActive).length} aktif)`,
      });
      continue;
    }

    // Both exist: check content, card counts, reviews
    const cardCountMatch = lb.items.length === rb.items.length;
    const activeMatch = lb.items.filter(i => i.isActive).length === rb.items.filter(i => i.isActive).length;
    const reviewCountLocal = lb.items.reduce((sum, i) => sum + (i.reviewLogs?.length || 0), 0);
    const reviewCountRemote = rb.items.reduce((sum, i) => sum + (i.reviewLogs?.length || 0), 0);
    const reviewMatch = reviewCountLocal === reviewCountRemote;

    if (cardCountMatch && activeMatch && reviewMatch) {
      differences.push({
        bookId: lb.book.id,
        bookTitle: lb.book.title,
        localBook: lb,
        firestoreBook: rb,
        differenceType: 'identical',
        details: 'Identik di kedua sumber',
      });
    } else {
      differences.push({
        bookId: lb.book.id,
        bookTitle: lb.book.title,
        localBook: lb,
        firestoreBook: rb,
        differenceType: 'content_mismatch',
        details: `Lokal: ${lb.items.length} kartu (${reviewCountLocal} review) vs Cloud: ${rb.items.length} kartu (${reviewCountRemote} review)`,
      });
    }
  }

  // Find remote books not in local
  for (const rb of remote.books) {
    if (processedIds.has(rb.book.id)) continue;
    differences.push({
      bookId: rb.book.id,
      bookTitle: rb.book.title,
      firestoreBook: rb,
      differenceType: 'only_firestore',
      details: `Hanya ada di Cloud Firestore (${rb.items.length} kartu, ${rb.items.filter(i => i.isActive).length} aktif)`,
    });
  }

  const hasConflict = differences.some(d => d.differenceType === 'content_mismatch' || d.differenceType === 'only_local' || d.differenceType === 'only_firestore');
  const isIdentical = hasData && !hasConflict;

  return {
    hasData,
    hasConflict,
    isIdentical,
    localSnapshot: local,
    firestoreSnapshot: remote,
    differences,
  };
}

/**
 * Prepares the payload for POST /api/v1/books/import verbatim
 */
export function prepareBookImportPayload(book: Book, chapters: Chapter[], items: BookItem[]): any {
  return {
    legacyId: book.id,
    title: book.title,
    description: book.description || '',
    coverUrl: book.coverUrl || null,
    category: book.category || 'Umum',
    isPublic: Boolean(book.isPublic),
    price: book.price || 0,
    authorName: book.authorName || null,
    chapters: chapters.map(ch => ({
      legacyId: ch.id,
      title: ch.title,
      description: ch.description || undefined,
      material: ch.material || undefined,
      legacyParentId: ch.parentId || null,
      order: ch.order || 1,
    })),
    items: items.map(item => ({
      legacyId: item.id,
      legacyChapterId: item.chapterId || null,
      question: item.question,
      answer: item.answer,
      explanation: item.explanation || null,
      imageQ: item.imageQ || null,
      imageA: item.imageA || null,
      tags: item.tags || [],
      order: 1,
    })),
    // Include progress for active items or items with history
    progresses: items
      .filter(i => i.isActive || (i.fsrsData && (i.fsrsData.reps > 0 || (i.reviewLogs && i.reviewLogs.length > 0))))
      .map(item => ({
        legacyItemId: item.id,
        isActive: Boolean(item.isActive),
        status: item.status || (item.isActive ? 'active' : 'inactive'),
        stability: item.fsrsData?.stability ?? 0,
        difficulty: item.fsrsData?.difficulty ?? 5.0,
        reps: item.fsrsData?.reps ?? 0,
        lapses: item.fsrsData?.lapses ?? 0,
        lastReview: item.fsrsData?.lastReview || null,
        nextReview: item.fsrsData?.nextReview || null,
        state: (item.fsrsData?.state ? item.fsrsData.state.toUpperCase() : 'NEW') as any,
      })),
    // Review logs for items with progress
    reviewLogs: items.flatMap(item => {
      const hasProg = item.isActive || (item.fsrsData && (item.fsrsData.reps > 0 || (item.reviewLogs && item.reviewLogs.length > 0)));
      if (!hasProg || !item.reviewLogs || item.reviewLogs.length === 0) return [];
      return item.reviewLogs.map(log => ({
        legacyLogId: log.id || null,
        legacyItemId: item.id,
        date: log.date,
        rating: log.rating,
        previousInterval: (log as any).previousInterval ?? null,
        newInterval: (log as any).newInterval ?? null,
        wasDue: Boolean(log.wasDue),
      }));
    }),
  };
}

/**
 * Imports a full snapshot into the backend
 */
export async function importSnapshot(
  snapshot: LegacySnapshot,
  selectedBookIds?: string[]
): Promise<ReconciliationImportResult> {
  const booksToImport = snapshot.books.filter(b => {
    // Skip uncustomized sample books unless explicitly selected
    if (selectedBookIds && selectedBookIds.length > 0) {
      return selectedBookIds.includes(b.book.id);
    }
    return !b.isSample;
  });

  const results: ReconciliationImportResult['results'] = [];
  let successful = 0;
  let alreadyExisted = 0;
  let failed = 0;

  for (const bSnapshot of booksToImport) {
    try {
      const payload = prepareBookImportPayload(bSnapshot.book, bSnapshot.chapters, bSnapshot.items);
      const res = await bookApiService.importBook(payload);

      if (res.isExisting) {
        alreadyExisted++;
      } else {
        successful++;
      }

      results.push({
        bookId: bSnapshot.book.id,
        title: bSnapshot.book.title,
        isExisting: res.isExisting,
        result: res,
      });
    } catch (err: any) {
      failed++;
      results.push({
        bookId: bSnapshot.book.id,
        title: bSnapshot.book.title,
        isExisting: false,
        error: err?.message || 'Gagal mengimpor buku.',
      });
    }
  }

  return {
    totalAttempted: booksToImport.length,
    successful,
    alreadyExisted,
    failed,
    results,
  };
}
