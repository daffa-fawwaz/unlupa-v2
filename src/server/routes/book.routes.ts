import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import {
  bookService,
  CreateBookInput,
  UpdateBookInput,
  CreateChapterInput,
  UpdateChapterInput,
  CreateBookItemInput,
  UpdateBookItemInput,
  ImportBookInput,
} from '../services/bookService';

export const bookRouter = Router();

// Protect all book endpoints with Firebase Authentication
bookRouter.use(authenticate);

function getParam(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] || '';
  return val || '';
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

const createBookSchema = z.object({
  title: z.string().trim().min(1, 'Judul buku wajib diisi').max(200, 'Judul buku maksimal 200 karakter'),
  description: z.string().trim().max(2000, 'Deskripsi maksimal 2000 karakter').optional().default(''),
  coverUrl: z.string().trim().url('URL cover tidak valid').optional().nullable(),
  category: z.string().trim().max(100).optional().default(''),
  isPublic: z.boolean().optional().default(false),
});

const updateBookSchema = z.object({
  title: z.string().trim().min(1, 'Judul buku tidak boleh kosong').max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  coverUrl: z.string().trim().url('URL cover tidak valid').optional().nullable(),
  category: z.string().trim().max(100).optional(),
  isPublic: z.boolean().optional(),
});

const createChapterSchema = z.object({
  title: z.string().trim().min(1, 'Judul bab wajib diisi').max(200, 'Judul bab maksimal 200 karakter'),
  description: z.string().trim().max(2000).optional(),
  material: z.string().trim().optional(),
  parentId: z.string().uuid('Format parentId tidak valid').optional().nullable(),
  order: z.number().int().optional(),
});

const updateChapterSchema = z.object({
  title: z.string().trim().min(1, 'Judul bab tidak boleh kosong').max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  material: z.string().trim().optional(),
  parentId: z.string().uuid('Format parentId tidak valid').optional().nullable(),
  order: z.number().int().optional(),
});

const createItemSchema = z.object({
  question: z.string().trim().min(1, 'Pertanyaan/soal kartu wajib diisi'),
  answer: z.string().trim().min(1, 'Jawaban kartu wajib diisi'),
  explanation: z.string().trim().optional(),
  chapterId: z.string().uuid('Format chapterId tidak valid').optional().nullable(),
  tags: z.array(z.string().trim()).optional().default([]),
  imageQ: z.string().trim().optional().nullable(),
  imageA: z.string().trim().optional().nullable(),
  order: z.number().int().optional(),
});

const updateItemSchema = z.object({
  question: z.string().trim().min(1, 'Pertanyaan tidak boleh kosong').optional(),
  answer: z.string().trim().min(1, 'Jawaban tidak boleh kosong').optional(),
  explanation: z.string().trim().optional().nullable(),
  chapterId: z.string().uuid('Format chapterId tidak valid').optional().nullable(),
  tags: z.array(z.string().trim()).optional(),
  imageQ: z.string().trim().optional().nullable(),
  imageA: z.string().trim().optional().nullable(),
  order: z.number().int().optional(),
});

const importChapterSchema = z.object({
  legacyId: z.string().trim().min(1, 'legacyId bab wajib diisi'),
  title: z.string().trim().min(1, 'Judul bab wajib diisi').max(200),
  description: z.string().trim().max(2000).optional(),
  material: z.string().optional(),
  legacyParentId: z.string().trim().optional().nullable(),
  order: z.number().int().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const importItemSchema = z.object({
  legacyId: z.string().trim().min(1, 'legacyId item wajib diisi'),
  legacyChapterId: z.string().trim().optional().nullable(),
  question: z.string().min(1, 'Pertanyaan wajib diisi'),
  answer: z.string().min(1, 'Jawaban wajib diisi'),
  explanation: z.string().optional().nullable(),
  imageQ: z.string().optional().nullable(),
  imageA: z.string().optional().nullable(),
  tags: z.array(z.string().trim()).optional().default([]),
  order: z.number().int().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const importProgressSchema = z.object({
  legacyItemId: z.string().trim().min(1, 'legacyItemId progres wajib diisi'),
  isActive: z.boolean().default(false),
  status: z.string().trim().optional(),
  stability: z.number(),
  difficulty: z.number(),
  reps: z.number().int().optional().default(0),
  lapses: z.number().int().optional().default(0),
  lastReview: z.string().optional().nullable(),
  nextReview: z.string().optional().nullable(),
  state: z.enum(['NEW', 'LEARNING', 'REVIEW', 'MASTERED']).optional().default('NEW'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const importReviewLogSchema = z.object({
  legacyLogId: z.string().trim().optional().nullable(),
  legacyItemId: z.string().trim().min(1, 'legacyItemId log review wajib diisi'),
  date: z.string().min(1, 'Timestamp date log wajib diisi'),
  rating: z.number().int().min(1).max(4),
  previousInterval: z.number().optional().nullable(),
  newInterval: z.number().optional().nullable(),
  wasDue: z.boolean().optional().default(false),
});

const importBookSchema = z.object({
  legacyId: z.string().trim().min(1, 'legacyId buku wajib diisi'),
  title: z.string().trim().min(1, 'Judul buku wajib diisi').max(200),
  description: z.string().max(2000).optional(),
  coverUrl: z.string().optional().nullable(),
  category: z.string().trim().max(100).optional().default('Umum'),
  isPublic: z.boolean().optional().default(false),
  price: z.number().int().optional().default(0),
  authorName: z.string().trim().optional().nullable(),
  userId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  chapters: z.array(importChapterSchema).optional().default([]),
  items: z.array(importItemSchema).optional().default([]),
  progresses: z.array(importProgressSchema).optional().default([]),
  reviewLogs: z.array(importReviewLogSchema).optional().default([]),
});

// ============================================================================
// 1. BOOK ROUTES
// ============================================================================

/**
 * GET /api/v1/books
 * List books (personal, public, or all) with search and pagination
 */
bookRouter.get('/books', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const scope = (req.query.scope as any) || 'personal';
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const page = parseInt(String(req.query.page || 1), 10);
    const limit = parseInt(String(req.query.limit || 20), 10);

    const result = await bookService.listBooks(currentUserId, {
      scope,
      category,
      search,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/books/:id
 * Retrieve single book details by ID
 */
bookRouter.get('/books/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const bookId = getParam(req.params.id);
    const book = await bookService.getBookById(bookId, currentUserId);
    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/books/import
 * Bulk import legacy book, chapters, items, FSRS progress, and review logs (Stage 5 - Fase 2B)
 */
bookRouter.post('/books/import', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const authorName = req.user!.fullName || null;

    // 1. Explicit 2 MB limit check on coverUrl
    if (req.body && req.body.coverUrl) {
      const rawByteLength = Buffer.byteLength(String(req.body.coverUrl), 'utf8');
      if (rawByteLength > 2 * 1024 * 1024) {
        throw createError('Ukuran cover melebihi batas maksimum 2 MB.', 422, 'COVER_IMAGE_TOO_LARGE');
      }
    }

    // 2. Validate payload schema
    const validatedInput = importBookSchema.parse(req.body) as ImportBookInput;

    // 3. Delegate to transactional importBook service
    const result = await bookService.importBook(currentUserId, authorName, validatedInput);

    const statusCode = result.isExisting ? 200 : 201;
    res.status(statusCode).json({
      success: true,
      message: result.isExisting
        ? 'Buku dengan data identik sudah diimpor sebelumnya.'
        : 'Buku, materi, progres, dan histori review berhasil diimpor.',
      isExisting: result.isExisting,
      book: result.book,
      stats: result.stats,
      idMapping: result.idMapping,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/books
 * Create a new personal book
 */
bookRouter.post('/books', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const authorName = req.user!.fullName;
    const validatedData = createBookSchema.parse(req.body) as CreateBookInput;

    const newBook = await bookService.createBook(currentUserId, authorName, validatedData);
    res.status(201).json({
      success: true,
      data: newBook,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/books/:id
 * Update an existing book (owner only)
 */
bookRouter.put('/books/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const bookId = getParam(req.params.id);
    const validatedData = updateBookSchema.parse(req.body) as UpdateBookInput;

    const updatedBook = await bookService.updateBook(bookId, currentUserId, validatedData);
    res.status(200).json({
      success: true,
      data: updatedBook,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/books/:id
 * Delete a book (owner only, cascades chapters and items)
 */
bookRouter.delete('/books/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const bookId = getParam(req.params.id);
    const result = await bookService.deleteBook(bookId, currentUserId);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/books/:id/duplicate
 * Duplicate a book (either personal or public) as an editable personal copy
 */
bookRouter.post('/books/:id/duplicate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const authorName = req.user!.fullName;
    const bookId = getParam(req.params.id);
    const duplicatedBook = await bookService.duplicateBook(bookId, currentUserId, authorName);

    res.status(201).json({
      success: true,
      data: duplicatedBook,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 2. CHAPTER ROUTES
// ============================================================================

/**
 * GET /api/v1/books/:bookId/chapters
 * List chapters in a book
 */
bookRouter.get('/books/:bookId/chapters', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const bookId = getParam(req.params.bookId);
    const chapters = await bookService.listChapters(bookId, currentUserId);
    res.status(200).json({
      success: true,
      data: chapters,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/books/:bookId/chapters
 * Create a new chapter in a book (owner only)
 */
bookRouter.post('/books/:bookId/chapters', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const bookId = getParam(req.params.bookId);
    const validatedData = createChapterSchema.parse(req.body) as CreateChapterInput;

    const newChapter = await bookService.createChapter(bookId, currentUserId, validatedData);
    res.status(201).json({
      success: true,
      data: newChapter,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/chapters/:id
 * Update a chapter (owner only)
 */
bookRouter.put('/chapters/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const chapterId = getParam(req.params.id);
    const validatedData = updateChapterSchema.parse(req.body) as UpdateChapterInput;

    const updatedChapter = await bookService.updateChapter(chapterId, currentUserId, validatedData);
    res.status(200).json({
      success: true,
      data: updatedChapter,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/chapters/:id
 * Delete a chapter (owner only)
 */
bookRouter.delete('/chapters/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const chapterId = getParam(req.params.id);
    const result = await bookService.deleteChapter(chapterId, currentUserId);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 3. BOOK ITEM (FLASHCARD) ROUTES
// ============================================================================

/**
 * GET /api/v1/books/:bookId/items
 * List items in a book with user-specific learning progress
 */
bookRouter.get('/books/:bookId/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const bookId = getParam(req.params.bookId);
    const chapterId = typeof req.query.chapterId === 'string' ? req.query.chapterId : undefined;
    const page = parseInt(String(req.query.page || 1), 10);
    const limit = parseInt(String(req.query.limit || 50), 10);

    const result = await bookService.listItems(bookId, currentUserId, chapterId, page, limit);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/items/:id
 * Get single item details with user progress
 */
bookRouter.get('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const itemId = getParam(req.params.id);
    const item = await bookService.getItemById(itemId, currentUserId);
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/books/:bookId/items
 * Create a new item in a book (owner only)
 */
bookRouter.post('/books/:bookId/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const bookId = getParam(req.params.bookId);
    const validatedData = createItemSchema.parse(req.body) as CreateBookItemInput;

    const newItem = await bookService.createItem(bookId, currentUserId, validatedData);
    res.status(201).json({
      success: true,
      data: newItem,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/items/:id
 * Update an item (owner only)
 */
bookRouter.put('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const itemId = getParam(req.params.id);
    const validatedData = updateItemSchema.parse(req.body) as UpdateBookItemInput;

    const updatedItem = await bookService.updateItem(itemId, currentUserId, validatedData);
    res.status(200).json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/items/:id
 * Delete an item (owner only)
 */
bookRouter.delete('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const itemId = getParam(req.params.id);
    const result = await bookService.deleteItem(itemId, currentUserId);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
});
