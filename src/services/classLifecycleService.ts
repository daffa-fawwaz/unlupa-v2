import { Book, Chapter, BookItem, ClassGroup } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

/**
 * Checks whether a given book is a Class-related book
 */
export function isClassBook(book: Book): boolean {
  return (
    book.category === 'class' ||
    Boolean(book.classId) ||
    book.id.startsWith('class-book-')
  );
}

/**
 * Extracts classId from a class book id (pattern: "class-book-{classId}-{masterBookId}")
 */
export function extractClassIdFromBook(book: Book): string | null {
  if (book.classId) return book.classId;
  if (book.id.startsWith('class-book-')) {
    const parts = book.id.split('-');
    if (parts.length >= 3) {
      const match = book.id.match(/^class-book-([^-]+(?:-[^-]+)?)-/);
      if (match && match[1]) {
        return match[1];
      }
      return parts[2];
    }
  }
  return null;
}

/**
 * Validates if a class book corresponds to an active class membership.
 * Returns true if active, or false if it belongs to a deleted/closed class.
 */
export function isActiveClassBook(book: Book, activeClassIds: Set<string>): boolean {
  if (!isClassBook(book)) return true; // Not a class book, unaffected
  const classId = extractClassIdFromBook(book);
  if (!classId) return false;
  return activeClassIds.has(classId);
}

export interface ClassCleanupOptions {
  action?: 'delete' | 'close';
}

/**
 * Cleanup class helper (Database cleanup is handled authoritatively by backend classApiService)
 */
export async function cleanupClassFromDatabase(
  _classId: string, 
  _options: ClassCleanupOptions = { action: 'delete' }
): Promise<{ success: boolean; affectedBooksCount: number; message: string }> {
  return {
    success: true,
    affectedBooksCount: 0,
    message: 'Class cleanup processed.'
  };
}

/**
 * Removes associated Class Books and updates class membership for every user profile stored in localStorage.
 */
export function cleanupClassFromAllMembersStorage(
  classId: string,
  options: ClassCleanupOptions = { action: 'delete' }
): { affectedUsersCount: number; affectedBooksCount: number } {
  let affectedUsersCount = 0;
  let affectedBooksCount = 0;

  if (typeof window === 'undefined' || !window.localStorage) {
    return { affectedUsersCount, affectedBooksCount };
  }

  const isDelete = options.action === 'delete';
  const classBookPrefix = `class-book-${classId}-`;

  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('unlupa_user_')) {
        keys.push(k);
      }
    }

    // 1. Process all user books: unlupa_user_{uid}_books
    keys.filter(k => k.endsWith('_books')).forEach(k => {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) return;
        const userBooks: Book[] = JSON.parse(raw);
        if (!Array.isArray(userBooks)) return;

        const initialLength = userBooks.length;
        const filteredBooks = userBooks.filter(b => {
          if (b.classId === classId) return false;
          if (b.id.startsWith(classBookPrefix)) return false;
          return true;
        });

        if (filteredBooks.length !== initialLength) {
          affectedBooksCount += (initialLength - filteredBooks.length);
          affectedUsersCount++;
          localStorage.setItem(k, JSON.stringify(filteredBooks));
        }
      } catch (e) {
        console.warn('Error cleaning up member books in localStorage:', e);
      }
    });

    // 2. Process all user my_classes: unlupa_user_{uid}_my_classes
    keys.filter(k => k.endsWith('_my_classes')).forEach(k => {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) return;
        const userClasses: ClassGroup[] = JSON.parse(raw);
        if (!Array.isArray(userClasses)) return;

        let modified = false;
        let updatedClasses: ClassGroup[] = [];

        if (isDelete) {
          updatedClasses = userClasses.filter(c => c.id !== classId);
          if (updatedClasses.length !== userClasses.length) {
            modified = true;
          }
        } else {
          updatedClasses = userClasses.filter(c => c.id !== classId);
          modified = true;
        }

        if (modified) {
          localStorage.setItem(k, JSON.stringify(updatedClasses));
        }
      } catch (e) {
        console.warn('Error cleaning up member my_classes in localStorage:', e);
      }
    });

    // 3. Process all user chapters: unlupa_user_{uid}_chapters
    keys.filter(k => k.endsWith('_chapters')).forEach(k => {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) return;
        const userChapters: Chapter[] = JSON.parse(raw);
        if (!Array.isArray(userChapters)) return;

        const filtered = userChapters.filter(c => !c.bookId.startsWith(classBookPrefix));
        if (filtered.length !== userChapters.length) {
          localStorage.setItem(k, JSON.stringify(filtered));
        }
      } catch (e) {
        console.warn('Error cleaning up member chapters in localStorage:', e);
      }
    });

    // 4. Process all user items: unlupa_user_{uid}_items
    keys.filter(k => k.endsWith('_items')).forEach(k => {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) return;
        const userItems: BookItem[] = JSON.parse(raw);
        if (!Array.isArray(userItems)) return;

        const filtered = userItems.filter(i => !i.bookId.startsWith(classBookPrefix));
        if (filtered.length !== userItems.length) {
          localStorage.setItem(k, JSON.stringify(filtered));
        }
      } catch (e) {
        console.warn('Error cleaning up member items in localStorage:', e);
      }
    });

  } catch (err) {
    console.error('Error during multi-member localStorage cascaded cleanup:', err);
  }

  return { affectedUsersCount, affectedBooksCount };
}
