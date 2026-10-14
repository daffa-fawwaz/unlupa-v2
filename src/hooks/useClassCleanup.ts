import React, { useCallback, useEffect } from 'react';
import { 
  cleanupClassFromDatabase, 
  cleanupClassFromAllMembersStorage,
  isClassBook,
  extractClassIdFromBook,
  ClassCleanupOptions
} from '../services/classLifecycleService';
import { Book, Chapter, BookItem, ClassGroup } from '../types';

export interface UseClassCleanupProps {
  teachingClasses: ClassGroup[];
  setTeachingClasses: React.Dispatch<React.SetStateAction<ClassGroup[]>>;
  myClasses: ClassGroup[];
  setMyClasses: React.Dispatch<React.SetStateAction<ClassGroup[]>>;
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
  chapters: Chapter[];
  setChapters: React.Dispatch<React.SetStateAction<Chapter[]>>;
  items: BookItem[];
  setItems: React.Dispatch<React.SetStateAction<BookItem[]>>;
  editingClassBookId?: string | null;
  setEditingClassBookId?: (id: string | null) => void;
}

/**
 * Lifecycle hook for Class-related data.
 * When a teacher closes or deletes a class, triggers a cascaded update in the database
 * and local storage to remove associated Class Books from all members' 'Class Books' categories,
 * ensuring that student libraries reflect current active class membership only.
 */
export function useClassCleanup({
  teachingClasses,
  setTeachingClasses,
  myClasses,
  setMyClasses,
  books,
  setBooks,
  chapters,
  setChapters,
  items,
  setItems,
  editingClassBookId,
  setEditingClassBookId
}: UseClassCleanupProps) {

  /**
   * Main cleanup trigger for when a teacher closes or deletes a class.
   */
  const triggerClassCleanup = useCallback(async (
    classId: string, 
    options: ClassCleanupOptions = { action: 'delete' }
  ) => {
    const isDelete = options.action !== 'close';
    const classBookPrefix = `class-book-${classId}-`;

    // 1. Cascaded update in multi-member local storage
    cleanupClassFromAllMembersStorage(classId, options);

    // 2. Cascaded update in Firestore Database (asynchronous & resilient)
    cleanupClassFromDatabase(classId, options).catch(err => {
      console.warn('Background database class cleanup notice:', err);
    });

    // 3. Immediate reactive state updates for the current active session
    if (isDelete) {
      setTeachingClasses(prev => prev.filter(c => c.id !== classId));
    } else {
      setTeachingClasses(prev => prev.map(c => 
        c.id === classId 
          ? { ...c, status: 'closed', closedAt: new Date().toISOString() } 
          : c
      ));
    }

    // Always remove from student active enrolled classes so membership is revoked
    setMyClasses(prev => prev.filter(c => c.id !== classId));

    // Remove all associated Class Books for this class
    setBooks(prev => prev.filter(b => {
      if (b.classId === classId) return false;
      if (b.id.startsWith(classBookPrefix)) return false;
      return true;
    }));

    // Remove associated chapters
    setChapters(prev => prev.filter(c => !c.bookId.startsWith(classBookPrefix)));

    // Remove associated items
    setItems(prev => prev.filter(i => !i.bookId.startsWith(classBookPrefix)));

    // Reset editing state if applicable
    if (editingClassBookId && editingClassBookId.startsWith(classBookPrefix)) {
      setEditingClassBookId?.(null);
    }
  }, [
    setTeachingClasses,
    setMyClasses,
    setBooks,
    setChapters,
    setItems,
    editingClassBookId,
    setEditingClassBookId
  ]);

  /**
   * Lifecycle integrity check:
   * Ensures that the student's library reflects current active class membership only.
   * If any orphaned class books exist (from classes that are no longer active),
   * they are automatically cleaned up from state.
   */
  useEffect(() => {
    const activeClassIds = new Set<string>();

    // Active joined classes (excluding closed)
    myClasses.forEach(c => {
      if (c.status !== 'closed') {
        activeClassIds.add(c.id);
      }
    });

    // Active teaching classes (excluding closed)
    teachingClasses.forEach(c => {
      if (c.status !== 'closed') {
        activeClassIds.add(c.id);
      }
    });

    // Find any orphaned class books
    const orphanedBooks = books.filter(b => {
      if (!isClassBook(b)) return false;
      const classId = extractClassIdFromBook(b);
      // If it doesn't belong to any active class, it's orphaned
      return !classId || !activeClassIds.has(classId);
    });

    if (orphanedBooks.length > 0) {
      const orphanedBookIds = new Set(orphanedBooks.map(b => b.id));
      setBooks(prev => prev.filter(b => !orphanedBookIds.has(b.id)));
      setChapters(prev => prev.filter(c => !orphanedBookIds.has(c.bookId)));
      setItems(prev => prev.filter(i => !orphanedBookIds.has(i.bookId)));
    }
  }, [myClasses, teachingClasses, books, setBooks, setChapters, setItems]);

  return {
    triggerClassCleanup
  };
}
