import { api, ApiResponse } from '../lib/api';
import { Book, Chapter, BookItem, FSRSState } from '../types';

export interface BackendBook {
  id: string;
  userId?: string | null;
  masterBookId?: string | null;
  title: string;
  description: string;
  coverUrl?: string | null;
  isPublic: boolean;
  isReadonly: boolean;
  authorName?: string | null;
  category: string;
  price: number;
  downloads: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  chapters?: BackendChapter[];
  _count?: {
    chapters?: number;
    items?: number;
  };
}

export interface BackendChapter {
  id: string;
  bookId: string;
  parentId?: string | null;
  masterChapterId?: string | null;
  title: string;
  description?: string | null;
  material?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface BackendItemProgress {
  id: string;
  isActive: boolean;
  status: string;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  lastReview?: string | null;
  nextReview?: string | null;
  state: string;
}

export interface BackendItem {
  id: string;
  bookId: string;
  chapterId?: string | null;
  masterItemId?: string | null;
  question: string;
  answer: string;
  explanation?: string | null;
  imageQ?: string | null;
  imageA?: string | null;
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
  progress?: BackendItemProgress | null;
}

export interface BackendLearningStats {
  totalBooks: number;
  totalItems: number;
  activeItems: number;
  dueToday: number;
  avgStability: number;
  masteredCount: number;
}

export interface BackendDueCard {
  id: string;
  bookId: string;
  chapterId?: string | null;
  question: string;
  answer: string;
  explanation?: string | null;
  imageQ?: string | null;
  imageA?: string | null;
  tags: string[];
  bookTitle?: string;
  progress?: BackendItemProgress | null;
}

export interface ImportResponsePayload {
  success: boolean;
  message: string;
  isExisting: boolean;
  book: {
    id: string;
    legacyId: string;
    title: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    chaptersCount: number;
    itemsCount: number;
    progressCount: number;
    reviewLogsCount: number;
  };
  idMapping: {
    bookId: { legacy: string; new: string };
    chapters: Record<string, string>;
    items: Record<string, string>;
    progresses: Record<string, string>;
    reviewLogs: Record<string, string>;
  };
}

// ============================================================================
// DATA MAPPERS (Backend -> Frontend Types)
// ============================================================================

export function mapBackendBookToBook(b: BackendBook): Book {
  // A book is only imported if it is a clone of a master book or marked category 'imported'
  const isImported = Boolean(b.masterBookId || b.category === 'imported');
  // Original master creations are NEVER read-only for their author
  const isOriginalMaster = !b.masterBookId && b.category !== 'imported';
  const isReadonly = isOriginalMaster ? false : Boolean(b.isReadonly);

  return {
    id: b.id,
    userId: b.userId || null,
    classId: null,
    masterBookId: b.masterBookId || null,
    isImported: isImported,
    title: b.title,
    description: b.description || '',
    coverUrl: b.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    isPublic: Boolean(b.isPublic),
    isReadonly: isReadonly,
    authorName: b.authorName || 'Penulis Pribadi',
    category: b.category || '',
    price: b.price || 0,
    downloads: b.downloads || 0,
    rating: b.rating || 5.0,
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export function mapBackendChapterToChapter(c: BackendChapter): Chapter {
  return {
    id: c.id,
    bookId: c.bookId,
    masterChapterId: c.masterChapterId || null,
    parentId: c.parentId || null,
    title: c.title,
    description: c.description || undefined,
    material: c.material || undefined,
    order: c.order || 1,
  };
}

export function mapBackendItemToBookItem(item: BackendItem): BookItem {
  const p = item.progress;
  const fsrsState: FSRSState = p
    ? {
        stability: p.stability,
        difficulty: p.difficulty,
        reps: p.reps,
        lapses: p.lapses,
        lastReview: p.lastReview ? new Date(p.lastReview).toISOString() : null,
        nextReview: p.nextReview ? new Date(p.nextReview).toISOString() : null,
        state: (p.state ? p.state.toLowerCase() : 'new') as any,
      }
    : {
        stability: 0,
        difficulty: 5.0,
        reps: 0,
        lapses: 0,
        lastReview: null,
        nextReview: null,
        state: 'new',
      };

  return {
    id: item.id,
    bookId: item.bookId,
    masterItemId: item.masterItemId || null,
    chapterId: item.chapterId || null,
    question: item.question,
    answer: item.answer,
    explanation: item.explanation || undefined,
    imageQ: item.imageQ || undefined,
    imageA: item.imageA || undefined,
    tags: Array.isArray(item.tags) ? item.tags : [],
    isActive: Boolean(p?.isActive),
    status: (p?.status as any) || (p?.isActive ? 'active' : 'inactive'),
    fsrsData: fsrsState,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    reviewLogs: [],
  };
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export const bookApiService = {
  // --------------------------------------------------------------------------
  // Books
  // --------------------------------------------------------------------------
  async listBooks(scope: 'personal' | 'public' | 'all' = 'personal', options?: { category?: string; search?: string; page?: number; limit?: number }) {
    const params = new URLSearchParams();
    params.set('scope', scope);
    if (options?.category) params.set('category', options.category);
    if (options?.search) params.set('search', options.search);
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));

    const res = await api.get<{ items: BackendBook[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/v1/books?${params.toString()}`
    );
    return res.data;
  },

  async getBook(id: string) {
    const res = await api.get<BackendBook>(`/api/v1/books/${id}`);
    return res.data;
  },

  async createBook(input: {
    title: string;
    description?: string;
    coverUrl?: string | null;
    category?: string;
    isPublic?: boolean;
  }) {
    const res = await api.post<BackendBook>('/api/v1/books', input);
    return res.data;
  },

  async updateBook(
    id: string,
    input: {
      title?: string;
      description?: string;
      coverUrl?: string | null;
      category?: string;
      isPublic?: boolean;
      isReadonly?: boolean;
    }
  ) {
    const res = await api.put<BackendBook>(`/api/v1/books/${id}`, input);
    return res.data;
  },

  async deleteBook(id: string) {
    const res = await api.delete<{ success: boolean; message: string }>(`/api/v1/books/${id}`);
    return res.data;
  },

  async duplicateBook(id: string) {
    const res = await api.post<BackendBook>(`/api/v1/books/${id}/duplicate`);
    return res.data;
  },

  async importLibraryBook(id: string) {
    const res = await api.post<{ success: boolean; message: string; data: BackendBook }>(`/api/v1/books/${id}/import-library`);
    return res.data;
  },

  async getPublicLibrary(): Promise<any[]> {
    const res = await api.get<any[]>('/api/v1/books/public/library');
    return res.data;
  },

  // --------------------------------------------------------------------------
  // Chapters
  // --------------------------------------------------------------------------
  async listChapters(bookId: string) {
    const res = await api.get<BackendChapter[]>(`/api/v1/books/${bookId}/chapters`);
    return res.data;
  },

  async createChapter(
    bookId: string,
    input: {
      title: string;
      description?: string;
      material?: string;
      parentId?: string | null;
      order?: number;
    }
  ) {
    const res = await api.post<BackendChapter>(`/api/v1/books/${bookId}/chapters`, input);
    return res.data;
  },

  async updateChapter(
    id: string,
    input: {
      title?: string;
      description?: string;
      material?: string;
      parentId?: string | null;
      order?: number;
    }
  ) {
    const res = await api.put<BackendChapter>(`/api/v1/chapters/${id}`, input);
    return res.data;
  },

  async deleteChapter(id: string) {
    const res = await api.delete<{ success: boolean; message: string }>(`/api/v1/chapters/${id}`);
    return res.data;
  },

  // --------------------------------------------------------------------------
  // Items
  // --------------------------------------------------------------------------
  async listItems(bookId: string, chapterId?: string, limit = 200, page = 1) {
    const params = new URLSearchParams();
    if (chapterId) params.set('chapterId', chapterId);
    params.set('limit', String(limit));
    params.set('page', String(page));

    const res = await api.get<{ items: BackendItem[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/v1/books/${bookId}/items?${params.toString()}`
    );
    return res.data;
  },

  async createItem(
    bookId: string,
    input: {
      question: string;
      answer: string;
      explanation?: string;
      chapterId?: string | null;
      tags?: string[];
      imageQ?: string | null;
      imageA?: string | null;
      order?: number;
    }
  ) {
    const res = await api.post<BackendItem>(`/api/v1/books/${bookId}/items`, input);
    return res.data;
  },

  async updateItem(
    id: string,
    input: {
      question?: string;
      answer?: string;
      explanation?: string | null;
      chapterId?: string | null;
      tags?: string[];
      imageQ?: string | null;
      imageA?: string | null;
      order?: number;
    }
  ) {
    const res = await api.put<BackendItem>(`/api/v1/items/${id}`, input);
    return res.data;
  },

  async deleteItem(id: string) {
    const res = await api.delete<{ success: boolean; message: string }>(`/api/v1/items/${id}`);
    return res.data;
  },

  // --------------------------------------------------------------------------
  // FSRS & Learning Actions
  // --------------------------------------------------------------------------
  async activateItem(id: string) {
    const res = await api.post<BackendItemProgress>(`/api/v1/items/${id}/activate`);
    return res.data;
  },

  async deactivateItem(id: string) {
    const res = await api.post<BackendItemProgress>(`/api/v1/items/${id}/deactivate`);
    return res.data;
  },

  async reviewItem(id: string, rating: 1 | 2 | 3 | 4) {
    const res = await api.post<{
      progress: BackendItemProgress;
      reviewLog: {
        id: string;
        date: string;
        rating: number;
        previousInterval: number | null;
        newInterval: number | null;
        wasDue: boolean;
      };
    }>(`/api/v1/items/${id}/review`, { rating });
    return res.data;
  },

  async getItemProgress(id: string) {
    const res = await api.get<any>(`/api/v1/items/${id}/progress`);
    return res.data;
  },

  async getLearningStats() {
    const res = await api.get<BackendLearningStats>('/api/v1/learning/stats');
    return res.data;
  },

  async getDueCards(bookId?: string, limit = 50) {
    const params = new URLSearchParams();
    if (bookId) params.set('bookId', bookId);
    params.set('limit', String(limit));

    const res = await api.get<BackendDueCard[]>(`/api/v1/learning/due?${params.toString()}`);
    return res.data;
  },

  // --------------------------------------------------------------------------
  // Bulk Import (Fase 2B)
  // --------------------------------------------------------------------------
  async importBook(payload: any): Promise<ImportResponsePayload> {
    const res = await api.post<any>('/api/v1/books/import', payload);
    return (res as unknown) as ImportResponsePayload;
  },
};
