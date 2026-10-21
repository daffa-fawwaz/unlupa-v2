import { api } from '../lib/api';

export interface AdminBookItem {
  id: string;
  userId: string | null;
  masterBookId: string | null;
  title: string;
  description: string;
  coverUrl: string | null;
  category: string;
  authorName: string;
  price: number;
  downloads: number;
  rating: number;
  isPublic: boolean;
  isReadonly: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    role: string;
  } | null;
  stats: {
    totalChapters: number;
    totalItems: number;
    totalClones: number;
    totalSales: number;
  };
}

export interface AdminBookChapter {
  id: string;
  bookId: string;
  parentId: string | null;
  title: string;
  description?: string;
  material?: string;
  order: number;
  createdAt: string;
}

export interface AdminBookCardItem {
  id: string;
  bookId: string;
  chapterId: string | null;
  question: string;
  answer: string;
  explanation?: string;
  tags: string[];
  imageQ?: string | null;
  imageA?: string | null;
  order: number;
  createdAt: string;
}

export interface AdminBookDetails extends AdminBookItem {
  chapters: AdminBookChapter[];
  items: AdminBookCardItem[];
}

export const adminBookApiService = {
  /**
   * Get all published library books with admin stats
   */
  async getPublishedBooks(params?: { search?: string; category?: string }): Promise<AdminBookItem[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category && params.category !== 'ALL') query.set('category', params.category);

    const qs = query.toString();
    const endpoint = `/api/v1/admin/books${qs ? `?${qs}` : ''}`;
    const res = await api.get<AdminBookItem[]>(endpoint);
    return res.data || [];
  },

  /**
   * Get complete details of a specific book (chapters, cards/items, author)
   */
  async getBookDetails(bookId: string): Promise<AdminBookDetails> {
    const res = await api.get<AdminBookDetails>(`/api/v1/admin/books/${bookId}`);
    return res.data;
  },

  /**
   * Admin pulls a book from the public library (unpublishes it)
   */
  async unpublishBook(bookId: string): Promise<{ success: boolean; message: string }> {
    const res = await api.patch<{ success: boolean; message: string }>(`/api/v1/admin/books/${bookId}/unpublish`);
    return {
      success: true,
      message: res.message || 'Buku berhasil ditarik dari publikasi.',
    };
  },

  /**
   * Admin permanently deletes a book and all its materials
   */
  async deleteBook(bookId: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; message: string }>(`/api/v1/admin/books/${bookId}`);
    return {
      success: true,
      message: res.message || 'Buku berhasil dihapus dari library.',
    };
  },
};
