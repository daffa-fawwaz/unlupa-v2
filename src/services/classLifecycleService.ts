import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc, 
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Book, Chapter, BookItem, ClassGroup } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Class Lifecycle Notice:', JSON.stringify(errInfo));
  return errInfo;
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
    // Pattern: ['class', 'book', classId, ...rest]
    if (parts.length >= 3) {
      // parts[2] might be the classId prefix, or classId has format cls-1234
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
 * Trigger cascaded update in Firestore database to remove associated Class Books
 * and synchronize the class document and student references.
 */
export async function cleanupClassFromDatabase(
  classId: string, 
  options: ClassCleanupOptions = { action: 'delete' }
): Promise<{ success: boolean; affectedBooksCount: number; message: string }> {
  let affectedBooksCount = 0;
  const isDelete = options.action === 'delete';

  try {
    const classDocPath = `classes/${classId}`;
    const classRef = doc(db, 'classes', classId);

    // 1. Update or Delete the Class document in Firestore
    try {
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        if (isDelete) {
          await deleteDoc(classRef);
        } else {
          await updateDoc(classRef, {
            status: 'closed',
            closedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, isDelete ? OperationType.DELETE : OperationType.UPDATE, classDocPath);
    }

    // 2. Clean up students subcollection in Firestore if present
    try {
      const studentsPath = `classes/${classId}/students`;
      const studentsSnap = await getDocs(collection(db, 'classes', classId, 'students'));
      if (!studentsSnap.empty) {
        const batch = writeBatch(db);
        studentsSnap.docs.forEach(d => {
          batch.delete(d.ref);
        });
        await batch.commit();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `classes/${classId}/students`);
    }

    // 3. Query and cascaded remove associated Class Books from the database
    try {
      const booksPath = 'books';
      const q = query(collection(db, booksPath), where('classId', '==', classId));
      const querySnap = await getDocs(q);
      
      if (!querySnap.empty) {
        const batch = writeBatch(db);
        for (const bookDoc of querySnap.docs) {
          affectedBooksCount++;
          // Clean up subcollections if needed
          try {
            const chapSnap = await getDocs(collection(db, 'books', bookDoc.id, 'chapters'));
            chapSnap.docs.forEach(c => batch.delete(c.ref));
            const itemSnap = await getDocs(collection(db, 'books', bookDoc.id, 'items'));
            itemSnap.docs.forEach(it => batch.delete(it.ref));
          } catch {
            // ignore subcollection read errors
          }
          batch.delete(bookDoc.ref);
        }
        await batch.commit();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'books');
    }

    return {
      success: true,
      affectedBooksCount,
      message: `Successfully cascaded cleanup for class ${classId}`
    };
  } catch (error) {
    const errorInfo = handleFirestoreError(error, OperationType.WRITE, `classes/${classId}`);
    return {
      success: false,
      affectedBooksCount,
      message: errorInfo.error
    };
  }
}

/**
 * Cascaded cleanup across all members' local storage data for this class.
 * Removes associated Class Books and updates class membership for every user profile stored.
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
        // Filter out books belonging to this deleted/closed class
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
          // Completely remove class from enrolled list
          updatedClasses = userClasses.filter(c => c.id !== classId);
          if (updatedClasses.length !== userClasses.length) {
            modified = true;
          }
        } else {
          // Closed: remove or mark as closed so it no longer grants active membership
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
