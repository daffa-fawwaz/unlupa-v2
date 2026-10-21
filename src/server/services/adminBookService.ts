import { prisma } from '../db';
import { createError } from '../middleware/errorHandler';
import { classEventBus } from '../routes/class.routes';

export const adminBookService = {
  /**
   * List all published/public books with comprehensive metadata and counts
   */
  async listPublishedBooks(query?: { search?: string; category?: string }) {
    const whereClause: any = {
      isPublic: true,
    };

    if (query?.category && query.category !== 'ALL') {
      whereClause.category = query.category;
    }

    if (query?.search && query.search.trim()) {
      const search = query.search.trim();
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { authorName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const books = await prisma.book.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
        _count: {
          select: {
            chapters: true,
            items: true,
            clones: true,
            transactions: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return books.map((b) => ({
      id: b.id,
      userId: b.userId,
      masterBookId: b.masterBookId,
      title: b.title,
      description: b.description || '',
      coverUrl: b.coverUrl,
      category: b.category || 'Umum & Akademik',
      authorName: b.authorName || b.user?.fullName || 'Penulis Komunitas',
      price: b.price || 0,
      downloads: b.downloads || b._count.clones || 0,
      rating: b.rating || 5.0,
      isPublic: b.isPublic,
      isReadonly: b.isReadonly,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      author: b.user ? {
        id: b.user.id,
        email: b.user.email,
        fullName: b.user.fullName,
        avatarUrl: b.user.avatarUrl,
        role: b.user.role,
      } : null,
      stats: {
        totalChapters: b._count.chapters,
        totalItems: b._count.items,
        totalClones: b._count.clones,
        totalSales: b._count.transactions,
      },
    }));
  },

  /**
   * Get complete details of any book (including all chapters and cards/items)
   */
  async getBookDetails(bookId: string) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            role: true,
            quranSpaceCode: true,
          },
        },
        chapters: {
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        },
        items: {
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        },
        _count: {
          select: {
            clones: true,
            transactions: true,
          },
        },
      },
    });

    if (!book) {
      throw createError('Buku tidak ditemukan di database.', 404, 'BOOK_NOT_FOUND');
    }

    return {
      id: book.id,
      userId: book.userId,
      masterBookId: book.masterBookId,
      title: book.title,
      description: book.description || '',
      coverUrl: book.coverUrl,
      category: book.category || 'Umum & Akademik',
      authorName: book.authorName || book.user?.fullName || 'Penulis Komunitas',
      price: book.price || 0,
      downloads: book.downloads || book._count.clones || 0,
      rating: book.rating || 5.0,
      isPublic: book.isPublic,
      isReadonly: book.isReadonly,
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
      author: book.user ? {
        id: book.user.id,
        email: book.user.email,
        fullName: book.user.fullName,
        avatarUrl: book.user.avatarUrl,
        role: book.user.role,
        quranSpaceCode: book.user.quranSpaceCode,
      } : null,
      stats: {
        totalChapters: book.chapters.length,
        totalItems: book.items.length,
        totalClones: book._count.clones,
        totalSales: book._count.transactions,
      },
      chapters: book.chapters.map((ch) => ({
        id: ch.id,
        bookId: ch.bookId,
        parentId: ch.parentId,
        title: ch.title,
        description: ch.description,
        material: ch.material,
        order: ch.order,
        createdAt: ch.createdAt.toISOString(),
      })),
      items: book.items.map((it) => ({
        id: it.id,
        bookId: it.bookId,
        chapterId: it.chapterId,
        question: it.question,
        answer: it.answer,
        explanation: it.explanation,
        tags: it.tags || [],
        imageQ: it.imageQ,
        imageA: it.imageA,
        order: it.order,
        createdAt: it.createdAt.toISOString(),
      })),
    };
  },

  /**
   * Admin unpublishes a book from public library (sets isPublic = false)
   */
  async unpublishBook(bookId: string) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw createError('Buku tidak ditemukan.', 404, 'BOOK_NOT_FOUND');
    }

    const updated = await prisma.book.update({
      where: { id: bookId },
      data: { isPublic: false },
    });

    // Notify connected clients that library has updated
    classEventBus.emit('class_updated', {
      type: 'LIBRARY_BOOK_UPDATED',
      bookId,
      isPublic: false,
      title: updated.title,
    });

    return {
      success: true,
      message: `Buku "${updated.title}" berhasil ditarik dari publikasi perpustakaan.`,
      book: updated,
    };
  },

  /**
   * Admin permanently deletes a book from database
   */
  async deleteBook(bookId: string) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw createError('Buku tidak ditemukan.', 404, 'BOOK_NOT_FOUND');
    }

    const bookTitle = book.title;

    // Prisma cascades chapters, items, user progresses
    await prisma.book.delete({ where: { id: bookId } });

    // Notify connected clients to refresh their library
    classEventBus.emit('class_updated', {
      type: 'LIBRARY_BOOK_UPDATED',
      bookId,
      isDeleted: true,
      title: bookTitle,
    });

    return {
      success: true,
      message: `Buku "${bookTitle}" dan seluruh materinya berhasil dihapus permanen.`,
    };
  },
};
