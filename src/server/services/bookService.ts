import crypto from 'crypto';
import { prisma } from '../db';
import { Book, Chapter, BookItem, Prisma } from '@prisma/client';
import { createError } from '../middleware/errorHandler';

export const UNLUPA_LEGACY_IMPORT_NAMESPACE = '7b9c3e41-6a2d-4f80-9e15-8c7a2d4e6f90';

export interface ImportChapterInput {
  legacyId: string;
  title: string;
  description?: string;
  material?: string;
  legacyParentId?: string | null;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportItemInput {
  legacyId: string;
  legacyChapterId?: string | null;
  question: string;
  answer: string;
  explanation?: string | null;
  imageQ?: string | null;
  imageA?: string | null;
  tags?: string[];
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportProgressInput {
  legacyItemId: string;
  isActive: boolean;
  status?: string;
  stability: number;
  difficulty: number;
  reps?: number;
  lapses?: number;
  lastReview?: string | null;
  nextReview?: string | null;
  state?: 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportReviewLogInput {
  legacyLogId?: string | null;
  legacyItemId: string;
  date: string;
  rating: number;
  previousInterval?: number | null;
  newInterval?: number | null;
  wasDue?: boolean;
}

export interface ImportBookInput {
  legacyId: string;
  title: string;
  description?: string;
  coverUrl?: string | null;
  category?: string;
  isPublic?: boolean;
  price?: number;
  authorName?: string;
  userId?: string; // ignored by backend to enforce verified token identity
  createdAt?: string;
  updatedAt?: string;
  chapters?: ImportChapterInput[];
  items?: ImportItemInput[];
  progresses?: ImportProgressInput[];
  reviewLogs?: ImportReviewLogInput[];
}

export interface ImportBookResult {
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

/**
 * Standard RFC 4122 UUID v5 generator
 */
export function parseUuid(uuid: string): Buffer {
  const hex = uuid.replace(/-/g, '');
  return Buffer.from(hex, 'hex');
}

export function uuidv5(name: string, namespace: string): string {
  const nsBuffer = parseUuid(namespace);
  const nameBuffer = Buffer.from(name, 'utf8');
  const hash = crypto.createHash('sha1').update(Buffer.concat([nsBuffer, nameBuffer])).digest();

  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 4122

  const hex = bytes.toString('hex');
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join('-');
}

/**
 * Validates chapter relationships and sorts them topologically (parents before children)
 */
export function sortChaptersTopologically(chapters: ImportChapterInput[]): ImportChapterInput[] {
  const chapterMap = new Map<string, ImportChapterInput>();
  for (const ch of chapters) {
    if (chapterMap.has(ch.legacyId)) {
      throw createError(`Duplikat legacyId bab: ${ch.legacyId}`, 422, 'DUPLICATE_CHAPTER_ID');
    }
    chapterMap.set(ch.legacyId, ch);
  }

  // Validate parentId references
  for (const ch of chapters) {
    if (ch.legacyParentId) {
      if (ch.legacyParentId === ch.legacyId) {
        throw createError(`Bab tidak boleh menjadi parent untuk dirinya sendiri: ${ch.legacyId}`, 422, 'CIRCULAR_CHAPTER_REFERENCE');
      }
      if (!chapterMap.has(ch.legacyParentId)) {
        throw createError(`Parent bab tidak ditemukan dalam payload: ${ch.legacyParentId}`, 422, 'INVALID_CHAPTER_REFERENCE');
      }
    }
  }

  const sorted: ImportChapterInput[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(id: string) {
    if (visiting.has(id)) {
      throw createError(`Hierarki bab mengandung siklus (circular reference) pada ${id}`, 422, 'CIRCULAR_CHAPTER_REFERENCE');
    }
    if (!visited.has(id)) {
      visiting.add(id);
      const ch = chapterMap.get(id)!;
      if (ch.legacyParentId) {
        visit(ch.legacyParentId);
      }
      visiting.delete(id);
      visited.add(id);
      sorted.push(ch);
    }
  }

  for (const ch of chapters) {
    if (!visited.has(ch.legacyId)) {
      visit(ch.legacyId);
    }
  }

  return sorted;
}

export interface ProcessedReviewLog {
  id: string;
  legacyKey: string;
  progressId: string;
  date: string;
  rating: number;
  previousInterval?: number | null;
  newInterval?: number | null;
  wasDue?: boolean;
}

export function compareReviewLogs(a: ImportReviewLogInput, b: ImportReviewLogInput): number {
  if (a.legacyItemId !== b.legacyItemId) {
    return a.legacyItemId < b.legacyItemId ? -1 : 1;
  }
  const aHasId = Boolean(a.legacyLogId && a.legacyLogId.trim() !== '');
  const bHasId = Boolean(b.legacyLogId && b.legacyLogId.trim() !== '');
  if (aHasId && bHasId) {
    return a.legacyLogId!.localeCompare(b.legacyLogId!);
  }
  if (aHasId && !bHasId) return -1;
  if (!aHasId && bHasId) return 1;

  // Both have no legacyLogId: compare deterministically by all available history fields
  const aTime = new Date(a.date).getTime();
  const bTime = new Date(b.date).getTime();
  if (aTime !== bTime) return aTime - bTime;

  if (a.rating !== b.rating) return a.rating - b.rating;

  const aDue = a.wasDue ? 1 : 0;
  const bDue = b.wasDue ? 1 : 0;
  if (aDue !== bDue) return aDue - bDue;

  const aPrev = a.previousInterval !== undefined && a.previousInterval !== null ? a.previousInterval : -999999;
  const bPrev = b.previousInterval !== undefined && b.previousInterval !== null ? b.previousInterval : -999999;
  if (Math.abs(aPrev - bPrev) > 1e-12) return aPrev - bPrev;

  const aNew = a.newInterval !== undefined && a.newInterval !== null ? a.newInterval : -999999;
  const bNew = b.newInterval !== undefined && b.newInterval !== null ? b.newInterval : -999999;
  if (Math.abs(aNew - bNew) > 1e-12) return aNew - bNew;

  return 0;
}

export function processItemReviewLogs(
  userId: string,
  idMapping: { items: Record<string, string>; progresses: Record<string, string> },
  logs: ImportReviewLogInput[]
): ProcessedReviewLog[] {
  // Sort logs deterministically to guarantee that array permutations produce the exact same UUIDs
  const sortedLogs = [...logs].sort(compareReviewLogs);
  const tupleOccurrences = new Map<string, number>();
  const processed: ProcessedReviewLog[] = [];

  for (const log of sortedLogs) {
    const itemUuid = idMapping.items[log.legacyItemId];
    if (!itemUuid) {
      throw createError(`Log review merujuk pada item yang tidak valid: ${log.legacyItemId}`, 422, 'INVALID_ITEM_REFERENCE');
    }

    const progressUuid = idMapping.progresses[log.legacyItemId];
    if (!progressUuid) {
      throw createError(
        `Log review untuk item ${log.legacyItemId} tidak memiliki data progres terkait.`,
        422,
        'MISSING_PROGRESS_FOR_REVIEW_LOGS'
      );
    }

    const dateIso = new Date(log.date).toISOString();
    let logUuid: string;
    let legacyKey: string;

    if (log.legacyLogId && log.legacyLogId.trim() !== '') {
      logUuid = uuidv5(`${userId}:item:${itemUuid}:log_id:${log.legacyLogId}`, UNLUPA_LEGACY_IMPORT_NAMESPACE);
      legacyKey = log.legacyLogId;
    } else {
      const prevStr = log.previousInterval !== undefined && log.previousInterval !== null ? String(log.previousInterval) : 'null';
      const newStr = log.newInterval !== undefined && log.newInterval !== null ? String(log.newInterval) : 'null';
      const tupleKey = `${dateIso}:${log.rating}:${Boolean(log.wasDue)}:${prevStr}:${newStr}`;
      const occIndex = tupleOccurrences.get(tupleKey) || 0;
      tupleOccurrences.set(tupleKey, occIndex + 1);

      logUuid = uuidv5(
        `${userId}:item:${itemUuid}:log_tuple:${tupleKey}:occ:${occIndex}`,
        UNLUPA_LEGACY_IMPORT_NAMESPACE
      );
      legacyKey = `${log.legacyItemId}:${dateIso}:occ_${occIndex}`;
    }

    processed.push({
      id: logUuid,
      legacyKey,
      progressId: progressUuid,
      date: dateIso,
      rating: log.rating,
      previousInterval: log.previousInterval,
      newInterval: log.newInterval,
      wasDue: log.wasDue,
    });
  }

  return processed;
}

export async function verifyExistingBookDeep(
  client: Prisma.TransactionClient | typeof prisma,
  bookUuid: string,
  userId: string,
  input: ImportBookInput,
  idMapping: {
    chapters: Record<string, string>;
    items: Record<string, string>;
    progresses: Record<string, string>;
    reviewLogs: Record<string, string>;
  },
  processedLogs: ProcessedReviewLog[]
): Promise<{ isMatch: boolean; reason?: string }> {
  const existingBook = await client.book.findUnique({
    where: { id: bookUuid },
    include: {
      chapters: { orderBy: { order: 'asc' } },
      items: {
        orderBy: { order: 'asc' },
        include: {
          userProgresses: {
            where: { userId },
            include: {
              reviewLogs: { orderBy: { date: 'asc' } },
            },
          },
        },
      },
    },
  });

  if (!existingBook) {
    return { isMatch: false, reason: 'BOOK_NOT_FOUND' };
  }

  if (existingBook.userId !== userId) {
    throw createError('Buku ini dimiliki oleh pengguna lain.', 403, 'BOOK_OWNERSHIP_MISMATCH');
  }

  // 1. Verbatim Book check
  if (existingBook.title !== input.title) return { isMatch: false, reason: 'TITLE_MISMATCH' };
  if ((existingBook.description || '') !== (input.description || '')) return { isMatch: false, reason: 'DESCRIPTION_MISMATCH' };
  if ((existingBook.coverUrl || null) !== (input.coverUrl || null)) return { isMatch: false, reason: 'COVER_MISMATCH' };
  if ((existingBook.category || '') !== (input.category || '')) return { isMatch: false, reason: 'CATEGORY_MISMATCH' };
  if (existingBook.isPublic !== Boolean(input.isPublic)) return { isMatch: false, reason: 'IS_PUBLIC_MISMATCH' };
  if (existingBook.price !== (input.price ?? 0)) return { isMatch: false, reason: 'PRICE_MISMATCH' };

  // 2. Chapters check
  const payloadChapters = input.chapters || [];
  if (existingBook.chapters.length !== payloadChapters.length) {
    return { isMatch: false, reason: 'CHAPTER_COUNT_MISMATCH' };
  }
  for (const ch of payloadChapters) {
    const chUuid = idMapping.chapters[ch.legacyId];
    const dbCh = existingBook.chapters.find((c) => c.id === chUuid);
    if (!dbCh) return { isMatch: false, reason: `CHAPTER_NOT_FOUND:${ch.legacyId}` };
    if (dbCh.title !== ch.title) return { isMatch: false, reason: `CHAPTER_TITLE_MISMATCH:${ch.legacyId}` };
    if ((dbCh.description || null) !== (ch.description || null)) return { isMatch: false, reason: `CHAPTER_DESC_MISMATCH:${ch.legacyId}` };
    if ((dbCh.material || null) !== (ch.material || null)) return { isMatch: false, reason: `CHAPTER_MATERIAL_MISMATCH:${ch.legacyId}` };
    if (dbCh.order !== (ch.order ?? 1)) return { isMatch: false, reason: `CHAPTER_ORDER_MISMATCH:${ch.legacyId}` };
    const expectedParentId = ch.legacyParentId ? idMapping.chapters[ch.legacyParentId] : null;
    if (dbCh.parentId !== expectedParentId) return { isMatch: false, reason: `CHAPTER_PARENT_MISMATCH:${ch.legacyId}` };
  }

  // 3. Items check
  const payloadItems = input.items || [];
  if (existingBook.items.length !== payloadItems.length) {
    return { isMatch: false, reason: 'ITEM_COUNT_MISMATCH' };
  }
  for (const item of payloadItems) {
    const itemUuid = idMapping.items[item.legacyId];
    const dbItem = existingBook.items.find((i) => i.id === itemUuid);
    if (!dbItem) return { isMatch: false, reason: `ITEM_NOT_FOUND:${item.legacyId}` };
    if (dbItem.question !== item.question) return { isMatch: false, reason: `ITEM_QUESTION_MISMATCH:${item.legacyId}` };
    if (dbItem.answer !== item.answer) return { isMatch: false, reason: `ITEM_ANSWER_MISMATCH:${item.legacyId}` };
    if ((dbItem.explanation || null) !== (item.explanation || null)) return { isMatch: false, reason: `ITEM_EXPLANATION_MISMATCH:${item.legacyId}` };
    if ((dbItem.imageQ || null) !== (item.imageQ || null)) return { isMatch: false, reason: `ITEM_IMAGEQ_MISMATCH:${item.legacyId}` };
    if ((dbItem.imageA || null) !== (item.imageA || null)) return { isMatch: false, reason: `ITEM_IMAGEA_MISMATCH:${item.legacyId}` };
    if (dbItem.order !== (item.order ?? 1)) return { isMatch: false, reason: `ITEM_ORDER_MISMATCH:${item.legacyId}` };
    const expectedChapterId = item.legacyChapterId ? idMapping.chapters[item.legacyChapterId] : null;
    if (dbItem.chapterId !== expectedChapterId) return { isMatch: false, reason: `ITEM_CHAPTER_MISMATCH:${item.legacyId}` };

    const dbTags = [...(dbItem.tags || [])].sort();
    const itemTags = [...(item.tags || [])].sort();
    if (dbTags.length !== itemTags.length || dbTags.some((t, i) => t !== itemTags[i])) {
      return { isMatch: false, reason: `ITEM_TAGS_MISMATCH:${item.legacyId}` };
    }
  }

  // 4. Progress check
  const dbProgresses = existingBook.items.flatMap((i) => i.userProgresses);
  const payloadProgresses = input.progresses || [];
  if (dbProgresses.length !== payloadProgresses.length) {
    return { isMatch: false, reason: 'PROGRESS_COUNT_MISMATCH' };
  }
  for (const prog of payloadProgresses) {
    const progUuid = idMapping.progresses[prog.legacyItemId];
    const dbProg = dbProgresses.find((p) => p.id === progUuid);
    if (!dbProg) return { isMatch: false, reason: `PROGRESS_NOT_FOUND:${prog.legacyItemId}` };
    if (dbProg.isActive !== Boolean(prog.isActive)) return { isMatch: false, reason: `PROGRESS_ACTIVE_MISMATCH:${prog.legacyItemId}` };
    const expectedStatus = prog.status ?? (prog.isActive ? 'active' : 'inactive');
    if (dbProg.status !== expectedStatus) return { isMatch: false, reason: `PROGRESS_STATUS_MISMATCH:${prog.legacyItemId}` };
    if (Math.abs(dbProg.stability - prog.stability) > 1e-12) return { isMatch: false, reason: `PROGRESS_STABILITY_MISMATCH:${prog.legacyItemId}` };
    if (Math.abs(dbProg.difficulty - prog.difficulty) > 1e-12) return { isMatch: false, reason: `PROGRESS_DIFFICULTY_MISMATCH:${prog.legacyItemId}` };
    if (dbProg.reps !== (prog.reps ?? 0)) return { isMatch: false, reason: `PROGRESS_REPS_MISMATCH:${prog.legacyItemId}` };
    if (dbProg.lapses !== (prog.lapses ?? 0)) return { isMatch: false, reason: `PROGRESS_LAPSES_MISMATCH:${prog.legacyItemId}` };
    if (dbProg.state !== (prog.state ?? 'NEW')) return { isMatch: false, reason: `PROGRESS_STATE_MISMATCH:${prog.legacyItemId}` };

    const dbLastReviewIso = dbProg.lastReview ? dbProg.lastReview.toISOString() : null;
    const payloadLastReviewIso = prog.lastReview ? new Date(prog.lastReview).toISOString() : null;
    if (dbLastReviewIso !== payloadLastReviewIso) return { isMatch: false, reason: `PROGRESS_LAST_REVIEW_MISMATCH:${prog.legacyItemId}` };

    const dbNextReviewIso = dbProg.nextReview ? dbProg.nextReview.toISOString() : null;
    const payloadNextReviewIso = prog.nextReview ? new Date(prog.nextReview).toISOString() : null;
    if (dbNextReviewIso !== payloadNextReviewIso) return { isMatch: false, reason: `PROGRESS_NEXT_REVIEW_MISMATCH:${prog.legacyItemId}` };
  }

  // 5. Review logs check
  const dbLogs = dbProgresses.flatMap((p) => p.reviewLogs);
  if (dbLogs.length !== processedLogs.length) {
    return { isMatch: false, reason: 'REVIEW_LOGS_COUNT_MISMATCH' };
  }
  for (const log of processedLogs) {
    const dbLog = dbLogs.find((l) => l.id === log.id);
    if (!dbLog) return { isMatch: false, reason: `REVIEW_LOG_NOT_FOUND:${log.id}` };
    if (dbLog.date.toISOString() !== new Date(log.date).toISOString()) return { isMatch: false, reason: `REVIEW_LOG_DATE_MISMATCH:${log.id}` };
    if (dbLog.rating !== log.rating) return { isMatch: false, reason: `REVIEW_LOG_RATING_MISMATCH:${log.id}` };
    if (dbLog.wasDue !== Boolean(log.wasDue)) return { isMatch: false, reason: `REVIEW_LOG_WAS_DUE_MISMATCH:${log.id}` };

    const dbPrev = dbLog.previousInterval ?? null;
    const payloadPrev = log.previousInterval !== undefined ? log.previousInterval : null;
    if (dbPrev !== payloadPrev) {
      if (dbPrev !== null && payloadPrev !== null && Math.abs(dbPrev - payloadPrev) > 1e-12) {
        return { isMatch: false, reason: `REVIEW_LOG_PREV_INT_MISMATCH:${log.id}` };
      } else if (dbPrev !== payloadPrev) {
        return { isMatch: false, reason: `REVIEW_LOG_PREV_INT_MISMATCH:${log.id}` };
      }
    }

    const dbNew = dbLog.newInterval ?? null;
    const payloadNew = log.newInterval !== undefined ? log.newInterval : null;
    if (dbNew !== payloadNew) {
      if (dbNew !== null && payloadNew !== null && Math.abs(dbNew - payloadNew) > 1e-12) {
        return { isMatch: false, reason: `REVIEW_LOG_NEW_INT_MISMATCH:${log.id}` };
      } else if (dbNew !== payloadNew) {
        return { isMatch: false, reason: `REVIEW_LOG_NEW_INT_MISMATCH:${log.id}` };
      }
    }
  }

  return { isMatch: true };
}

export interface BookListFilter {
  userId?: string;
  scope?: 'personal' | 'public' | 'all';
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateBookInput {
  title: string;
  description?: string;
  coverUrl?: string | null;
  category?: string;
  isPublic?: boolean;
}

export interface UpdateBookInput {
  title?: string;
  description?: string;
  coverUrl?: string | null;
  category?: string;
  isPublic?: boolean;
  isReadonly?: boolean;
}

export interface CreateChapterInput {
  title: string;
  description?: string;
  material?: string;
  parentId?: string | null;
  order?: number;
}

export interface UpdateChapterInput {
  title?: string;
  description?: string;
  material?: string;
  parentId?: string | null;
  order?: number;
}

export interface CreateBookItemInput {
  question: string;
  answer: string;
  explanation?: string;
  chapterId?: string | null;
  tags?: string[];
  imageQ?: string;
  imageA?: string;
  order?: number;
}

export interface UpdateBookItemInput {
  question?: string;
  answer?: string;
  explanation?: string;
  chapterId?: string | null;
  tags?: string[];
  imageQ?: string;
  imageA?: string;
  order?: number;
}

/**
 * Normalizes text to ensure proper bilingual newline separation
 */
export function normalizeBilingualText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (trimmed.includes('\n')) return trimmed;

  const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(trimmed);
  const hasLatin = /[a-zA-Z]/.test(trimmed);

  if (hasArabic && hasLatin) {
    const matchArabThenLatin = trimmed.match(
      /^([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\d،؛؟!.ﷺ:()'"\-—]+?[؟!.؛،:\s])\s*([A-Za-z][\s\S]*)$/
    );
    if (matchArabThenLatin) {
      return `${matchArabThenLatin[1].trim()}\n${matchArabThenLatin[2].trim()}`;
    }
    const matchLatinThenArab = trimmed.match(
      /^([a-zA-Z0-9\s'"()?!:.,\u00C0-\u024F\u1E00-\u1EFF\-—]+?[!?:.])\s*([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\d،؛؟!.ﷺ:()'"\-—]+)$/
    );
    if (matchLatinThenArab) {
      return `${matchLatinThenArab[1].trim()}\n${matchLatinThenArab[2].trim()}`;
    }
  }
  return trimmed;
}

/**
 * Helper to enforce book read and access authorization.
 * Rules:
 * 1. Owner (userId === currentUserId) always has full access.
 * 2. If not owner and book is private (!isPublic): rejected with 403 FORBIDDEN.
 * 3. If not owner and book is public:
 *    - If price > 0: rejected with 403 PAID_CONTENT_ACCESS_DENIED (AUDIT-4-07).
 *    - If price <= 0: allowed (free public book).
 */
export async function checkBookAccess(
  book: { id?: string; userId: string | null; isPublic: boolean; price?: number | null },
  currentUserId: string
): Promise<void> {
  if (book.userId === currentUserId) return;

  if (!book.isPublic) {
    // Check if current user is an enrolled student in an active class where this book is assigned
    if (book.id) {
      const isClassStudent = await prisma.classMember.findFirst({
        where: {
          studentId: currentUserId,
          class: {
            status: 'ACTIVE',
            OR: [
              { assignedBookIds: { has: book.id } },
              { assignedBooks: { some: { bookId: book.id } } },
            ],
          },
        },
      });
      if (isClassStudent) return;

      const isClassTeacher = await prisma.class.findFirst({
        where: {
          teacherId: currentUserId,
          status: 'ACTIVE',
          OR: [
            { assignedBookIds: { has: book.id } },
            { assignedBooks: { some: { bookId: book.id } } },
          ],
        },
      });
      if (isClassTeacher) return;
    }

    throw createError('Anda tidak memiliki akses ke buku privat ini.', 403, 'FORBIDDEN');
  }

  const price = typeof book.price === 'number' ? book.price : 0;
  if (price > 0) {
    throw createError(
      'Buku ini merupakan konten berbayar dan memerlukan verifikasi transaksi pembelian.',
      403,
      'PAID_CONTENT_ACCESS_DENIED'
    );
  }
}

/**
 * Service for managing Books, Chapters, and Items in PostgreSQL
 */
export const bookService = {
  /**
   * List books with pagination and filtering
   */
  async listBooks(currentUserId: string, filter: BookListFilter) {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.BookWhereInput = {};

    if (filter.scope === 'public') {
      where.isPublic = true;
    } else if (filter.scope === 'all') {
      where.OR = [
        { userId: currentUserId },
        { isPublic: true },
      ];
    } else {
      // Default: personal books owned by caller
      where.userId = currentUserId;
    }

    if (filter.category) {
      where.category = { equals: filter.category, mode: 'insensitive' };
    }

    if (filter.search && filter.search.trim()) {
      const term = filter.search.trim();
      where.AND = [
        {
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: {
              chapters: true,
              items: true,
            },
          },
        },
      }),
      prisma.book.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Get single book details by ID with authorization check
   */
  async getBookById(bookId: string, currentUserId: string) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        chapters: {
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        },
        _count: {
          select: {
            items: true,
            chapters: true,
          },
        },
      },
    });

    if (!book) {
      throw createError('Buku tidak ditemukan.', 404, 'BOOK_NOT_FOUND');
    }

    // Authorization: User must own the book OR book must be free public (AUDIT-4-07)
    await checkBookAccess(book, currentUserId);

    return book;
  },

  /**
   * Create a new book
   */
  async createBook(currentUserId: string, authorName: string, input: CreateBookInput) {
    return prisma.book.create({
      data: {
        userId: currentUserId,
        authorName: authorName,
        title: input.title.trim(),
        description: input.description?.trim() || '',
        coverUrl: input.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
        category: input.category?.trim() || '',
        isPublic: Boolean(input.isPublic),
        isReadonly: false,
      },
    });
  },

  /**
   * Update an existing book (owner only)
   */
  async updateBook(bookId: string, currentUserId: string, input: UpdateBookInput) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw createError('Buku tidak ditemukan.', 404, 'BOOK_NOT_FOUND');
    }

    if (book.userId !== currentUserId) {
      throw createError('Hanya pemilik buku yang dapat mengubah isi buku.', 403, 'FORBIDDEN');
    }

    const data: Prisma.BookUpdateInput = {};
    if (input.title !== undefined) data.title = input.title.trim();
    if (input.description !== undefined) data.description = input.description.trim();
    if (input.coverUrl !== undefined) data.coverUrl = input.coverUrl;
    if (input.category !== undefined) data.category = input.category.trim();
    if (input.isPublic !== undefined) data.isPublic = input.isPublic;
    if (input.isReadonly !== undefined) data.isReadonly = input.isReadonly;

    return prisma.book.update({
      where: { id: bookId },
      data,
    });
  },

  /**
   * Delete a book (owner only)
   */
  async deleteBook(bookId: string, currentUserId: string) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw createError('Buku tidak ditemukan.', 404, 'BOOK_NOT_FOUND');
    }

    if (book.userId !== currentUserId) {
      throw createError('Hanya pemilik buku yang dapat menghapus buku.', 403, 'FORBIDDEN');
    }

    // Cascade deletion is handled by Prisma foreign keys
    await prisma.book.delete({ where: { id: bookId } });
    return { success: true, message: 'Buku berhasil dihapus.' };
  },

  /**
   * Duplicate a book as an editable personal copy
   * Mirrors `duplicateBookAsEditable` from frontend
   */
  async duplicateBook(bookId: string, currentUserId: string, authorName: string) {
    const sourceBook = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        chapters: {
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        },
        items: {
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!sourceBook) {
      throw createError('Buku sumber tidak ditemukan.', 404, 'BOOK_NOT_FOUND');
    }

    // Must be owner or free public book to allow duplication (AUDIT-4-07)
    await checkBookAccess(sourceBook, currentUserId);

    // Execute atomic transaction for book, chapters, and items duplication
    return prisma.$transaction(async (tx) => {
      // 1. Create new book record
      const duplicatedBook = await tx.book.create({
        data: {
          userId: currentUserId,
          masterBookId: sourceBook.id,
          title: `${sourceBook.title} (Salinan Edit)`,
          description: sourceBook.description,
          coverUrl: sourceBook.coverUrl,
          category: sourceBook.category,
          authorName: authorName,
          isPublic: false,
          isReadonly: false,
        },
      });

      // 2. Duplicate chapters while mapping old parentId to new chapter IDs
      const chapterIdMap = new Map<string, string>();

      // First pass: create chapters without parentId
      for (const ch of sourceBook.chapters) {
        const newCh = await tx.chapter.create({
          data: {
            bookId: duplicatedBook.id,
            masterChapterId: ch.id,
            title: ch.title,
            description: ch.description,
            material: ch.material,
            order: ch.order,
          },
        });
        chapterIdMap.set(ch.id, newCh.id);
      }

      // Second pass: update parentId hierarchy for sub-chapters
      for (const ch of sourceBook.chapters) {
        if (ch.parentId && chapterIdMap.has(ch.parentId)) {
          const newChId = chapterIdMap.get(ch.id);
          const newParentId = chapterIdMap.get(ch.parentId);
          if (newChId && newParentId) {
            await tx.chapter.update({
              where: { id: newChId },
              data: { parentId: newParentId },
            });
          }
        }
      }

      // 3. Duplicate items into new book and map chapter IDs
      if (sourceBook.items.length > 0) {
        const newItemsData = sourceBook.items.map((item) => ({
          bookId: duplicatedBook.id,
          masterItemId: item.id,
          chapterId: item.chapterId ? chapterIdMap.get(item.chapterId) || null : null,
          question: item.question,
          answer: item.answer,
          explanation: item.explanation,
          imageQ: item.imageQ,
          imageA: item.imageA,
          tags: item.tags,
          order: item.order,
        }));

        await tx.bookItem.createMany({
          data: newItemsData,
        });
      }

      return duplicatedBook;
    });
  },

  // --------------------------------------------------------------------------
  // CHAPTER OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * List chapters of a book
   */
  async listChapters(bookId: string, currentUserId: string) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw createError('Buku tidak ditemukan.', 404, 'BOOK_NOT_FOUND');
    }

    await checkBookAccess(book, currentUserId);

    return prisma.chapter.findMany({
      where: { bookId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
  },

  /**
   * Create a chapter inside a book (owner only)
   */
  async createChapter(bookId: string, currentUserId: string, input: CreateChapterInput) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw createError('Buku tidak ditemukan.', 404, 'BOOK_NOT_FOUND');
    }

    if (book.userId !== currentUserId) {
      throw createError('Hanya pemilik buku yang dapat menambah bab.', 403, 'FORBIDDEN');
    }

    // If parentId is specified, verify it exists and belongs to this book
    if (input.parentId) {
      const parent = await prisma.chapter.findUnique({ where: { id: input.parentId } });
      if (!parent || parent.bookId !== bookId) {
        throw createError('Bab induk (parentId) tidak valid atau berada pada buku lain.', 400, 'INVALID_PARENT_CHAPTER');
      }
    }

    let order = input.order;
    if (order === undefined) {
      const count = await prisma.chapter.count({ where: { bookId } });
      order = count + 1;
    }

    return prisma.chapter.create({
      data: {
        bookId,
        title: input.title.trim(),
        description: input.description?.trim(),
        material: input.material?.trim(),
        parentId: input.parentId || null,
        order,
      },
    });
  },

  /**
   * Update a chapter (owner only)
   * Prevents self-parenting and cyclic descendant hierarchies (AUDIT-4-08)
   */
  async updateChapter(chapterId: string, currentUserId: string, input: UpdateChapterInput) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { book: true },
    });

    if (!chapter) {
      throw createError('Bab tidak ditemukan.', 404, 'CHAPTER_NOT_FOUND');
    }

    if (chapter.book.userId !== currentUserId) {
      throw createError('Hanya pemilik buku yang dapat mengubah bab.', 403, 'FORBIDDEN');
    }

    const data: Prisma.ChapterUncheckedUpdateInput = {};
    if (input.title !== undefined) data.title = input.title.trim();
    if (input.description !== undefined) data.description = input.description ? input.description.trim() : null;
    if (input.material !== undefined) data.material = input.material ? input.material.trim() : null;

    if (input.parentId !== undefined) {
      if (input.parentId !== null) {
        if (input.parentId === chapterId) {
          throw createError('Bab tidak dapat menjadi induk bagi dirinya sendiri.', 400, 'CYCLIC_CHAPTER_HIERARCHY');
        }

        // Fetch all chapters of this book to validate hierarchy and detect cycles
        const allBookChapters = await prisma.chapter.findMany({
          where: { bookId: chapter.bookId },
          select: { id: true, parentId: true },
        });

        const parentExists = allBookChapters.some((c) => c.id === input.parentId);
        if (!parentExists) {
          throw createError('Bab induk tidak valid atau berada pada buku lain.', 400, 'INVALID_PARENT_CHAPTER');
        }

        // Check if input.parentId is a descendant of chapterId (cycle detection)
        const parentMap = new Map(allBookChapters.map((c) => [c.id, c.parentId]));
        let currId: string | null = input.parentId;
        const visited = new Set<string>();

        while (currId) {
          if (currId === chapterId) {
            throw createError(
              'Hierarki bab tidak valid: bab induk tidak boleh berada di dalam sub-bab dari bab ini (terdeteksi siklus hierarki).',
              400,
              'CYCLIC_CHAPTER_HIERARCHY'
            );
          }
          if (visited.has(currId)) {
            break;
          }
          visited.add(currId);
          currId = parentMap.get(currId) || null;
        }

        data.parentId = input.parentId;
      } else {
        data.parentId = null;
      }
    }
    if (input.order !== undefined) data.order = input.order;

    return prisma.chapter.update({
      where: { id: chapterId },
      data,
    });
  },

  /**
   * Delete a chapter (owner only)
   */
  async deleteChapter(chapterId: string, currentUserId: string) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { book: true },
    });

    if (!chapter) {
      throw createError('Bab tidak ditemukan.', 404, 'CHAPTER_NOT_FOUND');
    }

    if (chapter.book.userId !== currentUserId) {
      throw createError('Hanya pemilik buku yang dapat menghapus bab.', 403, 'FORBIDDEN');
    }

    await prisma.chapter.delete({ where: { id: chapterId } });
    return { success: true, message: 'Bab berhasil dihapus.' };
  },

  // --------------------------------------------------------------------------
  // BOOK ITEMS OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * List items of a book with user-specific FSRS progress
   */
  async listItems(bookId: string, currentUserId: string, chapterId?: string, page = 1, limit = 50) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw createError('Buku tidak ditemukan.', 404, 'BOOK_NOT_FOUND');
    }

    await checkBookAccess(book, currentUserId);

    const where: Prisma.BookItemWhereInput = { bookId };
    if (chapterId) {
      where.chapterId = chapterId;
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(200, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [rawItems, total] = await Promise.all([
      prisma.bookItem.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        include: {
          userProgresses: {
            where: { userId: currentUserId },
          },
        },
      }),
      prisma.bookItem.count({ where }),
    ]);

    // Format items with merged progress for convenience
    const items = rawItems.map((item) => {
      const progress = item.userProgresses[0] || null;
      return {
        id: item.id,
        bookId: item.bookId,
        chapterId: item.chapterId,
        masterItemId: item.masterItemId,
        question: item.question,
        answer: item.answer,
        explanation: item.explanation,
        imageQ: item.imageQ,
        imageA: item.imageA,
        tags: item.tags,
        order: item.order,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        progress: progress ? {
          id: progress.id,
          isActive: progress.isActive,
          status: progress.status,
          stability: progress.stability,
          difficulty: progress.difficulty,
          reps: progress.reps,
          lapses: progress.lapses,
          lastReview: progress.lastReview,
          nextReview: progress.nextReview,
          state: progress.state,
        } : null,
      };
    });

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  },

  /**
   * Get single item details with user progress
   */
  async getItemById(itemId: string, currentUserId: string) {
    const item = await prisma.bookItem.findUnique({
      where: { id: itemId },
      include: {
        book: true,
        chapter: true,
        userProgresses: {
          where: { userId: currentUserId },
        },
      },
    });

    if (!item) {
      throw createError('Kartu materi tidak ditemukan.', 404, 'ITEM_NOT_FOUND');
    }

    await checkBookAccess(item.book, currentUserId);

    const progress = item.userProgresses[0] || null;

    return {
      id: item.id,
      bookId: item.bookId,
      chapterId: item.chapterId,
      chapter: item.chapter ? { id: item.chapter.id, title: item.chapter.title } : null,
      masterItemId: item.masterItemId,
      question: item.question,
      answer: item.answer,
      explanation: item.explanation,
      imageQ: item.imageQ,
      imageA: item.imageA,
      tags: item.tags,
      order: item.order,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      progress: progress ? {
        id: progress.id,
        isActive: progress.isActive,
        status: progress.status,
        stability: progress.stability,
        difficulty: progress.difficulty,
        reps: progress.reps,
        lapses: progress.lapses,
        lastReview: progress.lastReview,
        nextReview: progress.nextReview,
        state: progress.state,
      } : null,
    };
  },

  /**
   * Create a new item inside a book (owner only)
   */
  async createItem(bookId: string, currentUserId: string, input: CreateBookItemInput) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw createError('Buku tidak ditemukan.', 404, 'BOOK_NOT_FOUND');
    }

    if (book.userId !== currentUserId) {
      throw createError('Hanya pemilik buku yang dapat menambah kartu materi.', 403, 'FORBIDDEN');
    }

    if (input.chapterId) {
      const chapter = await prisma.chapter.findUnique({ where: { id: input.chapterId } });
      if (!chapter || chapter.bookId !== bookId) {
        throw createError('Bab tidak valid untuk buku ini.', 400, 'INVALID_CHAPTER');
      }
    }

    let order = input.order;
    if (order === undefined) {
      const count = await prisma.bookItem.count({ where: { bookId } });
      order = count + 1;
    }

    return prisma.bookItem.create({
      data: {
        bookId,
        chapterId: input.chapterId || null,
        question: normalizeBilingualText(input.question),
        answer: normalizeBilingualText(input.answer),
        explanation: input.explanation ? normalizeBilingualText(input.explanation) : null,
        imageQ: input.imageQ || null,
        imageA: input.imageA || null,
        tags: input.tags || [],
        order,
      },
    });
  },

  /**
   * Update an item (owner only)
   */
  async updateItem(itemId: string, currentUserId: string, input: UpdateBookItemInput) {
    const item = await prisma.bookItem.findUnique({
      where: { id: itemId },
      include: { book: true },
    });

    if (!item) {
      throw createError('Kartu materi tidak ditemukan.', 404, 'ITEM_NOT_FOUND');
    }

    if (item.book.userId !== currentUserId) {
      throw createError('Hanya pemilik buku yang dapat mengubah kartu materi.', 403, 'FORBIDDEN');
    }

    if (input.chapterId) {
      const chapter = await prisma.chapter.findUnique({ where: { id: input.chapterId } });
      if (!chapter || chapter.bookId !== item.bookId) {
        throw createError('Bab tidak valid untuk buku ini.', 400, 'INVALID_CHAPTER');
      }
    }

    const data: Prisma.BookItemUncheckedUpdateInput = {};
    if (input.question !== undefined) data.question = normalizeBilingualText(input.question);
    if (input.answer !== undefined) data.answer = normalizeBilingualText(input.answer);
    if (input.explanation !== undefined) {
      data.explanation = input.explanation ? normalizeBilingualText(input.explanation) : null;
    }
    if (input.chapterId !== undefined) data.chapterId = input.chapterId;
    if (input.tags !== undefined) data.tags = input.tags;
    if (input.imageQ !== undefined) data.imageQ = input.imageQ;
    if (input.imageA !== undefined) data.imageA = input.imageA;
    if (input.order !== undefined) data.order = input.order;

    return prisma.bookItem.update({
      where: { id: itemId },
      data,
    });
  },

  /**
   * Delete an item (owner only)
   */
  async deleteItem(itemId: string, currentUserId: string) {
    const item = await prisma.bookItem.findUnique({
      where: { id: itemId },
      include: { book: true },
    });

    if (!item) {
      throw createError('Kartu materi tidak ditemukan.', 404, 'ITEM_NOT_FOUND');
    }

    if (item.book.userId !== currentUserId) {
      throw createError('Hanya pemilik buku yang dapat menghapus kartu materi.', 403, 'FORBIDDEN');
    }

    await prisma.bookItem.delete({ where: { id: itemId } });
    return { success: true, message: 'Kartu materi berhasil dihapus.' };
  },

  /**
   * Bulk import for book, chapter hierarchy, cards, FSRS progress, and review logs (Stage 5 - Fase 2B)
   */
  async importBook(
    currentUserId: string,
    defaultAuthorName: string | null,
    input: ImportBookInput
  ): Promise<ImportBookResult> {
    // 1. Pre-validate cover size (2 MB limit)
    if (input.coverUrl) {
      const rawByteLength = Buffer.byteLength(input.coverUrl, 'utf8');
      if (rawByteLength > 2 * 1024 * 1024) {
        throw createError('Ukuran cover melebihi batas maksimum 2 MB.', 422, 'COVER_IMAGE_TOO_LARGE');
      }
    }

    // 2. Validate and topologically sort chapters
    const sortedChapters = sortChaptersTopologically(input.chapters || []);

    // 3. Compute deterministic UUIDs
    const bookUuid = uuidv5(`${currentUserId}:book:${input.legacyId}`, UNLUPA_LEGACY_IMPORT_NAMESPACE);

    const idMapping = {
      bookId: { legacy: input.legacyId, new: bookUuid },
      chapters: {} as Record<string, string>,
      items: {} as Record<string, string>,
      progresses: {} as Record<string, string>,
      reviewLogs: {} as Record<string, string>,
    };

    for (const ch of sortedChapters) {
      idMapping.chapters[ch.legacyId] = uuidv5(
        `${currentUserId}:book:${input.legacyId}:chapter:${ch.legacyId}`,
        UNLUPA_LEGACY_IMPORT_NAMESPACE
      );
    }

    const itemMap = new Map<string, ImportItemInput>();
    for (const item of input.items || []) {
      if (itemMap.has(item.legacyId)) {
        throw createError(`Duplikat legacyId kartu item: ${item.legacyId}`, 422, 'DUPLICATE_ITEM_ID');
      }
      if (item.legacyChapterId && !idMapping.chapters[item.legacyChapterId]) {
        throw createError(`Item merujuk pada bab yang tidak valid: ${item.legacyChapterId}`, 422, 'INVALID_CHAPTER_REFERENCE');
      }
      itemMap.set(item.legacyId, item);
      idMapping.items[item.legacyId] = uuidv5(
        `${currentUserId}:book:${input.legacyId}:item:${item.legacyId}`,
        UNLUPA_LEGACY_IMPORT_NAMESPACE
      );
    }

    const progressMap = new Map<string, ImportProgressInput>();
    for (const prog of input.progresses || []) {
      if (!itemMap.has(prog.legacyItemId)) {
        throw createError(`Progres merujuk pada item yang tidak valid: ${prog.legacyItemId}`, 422, 'INVALID_ITEM_REFERENCE');
      }
      if (progressMap.has(prog.legacyItemId)) {
        throw createError(`Duplikat progres untuk item: ${prog.legacyItemId}`, 422, 'DUPLICATE_PROGRESS_ITEM');
      }
      progressMap.set(prog.legacyItemId, prog);
      const itemUuid = idMapping.items[prog.legacyItemId];
      idMapping.progresses[prog.legacyItemId] = uuidv5(
        `${currentUserId}:progress:${itemUuid}`,
        UNLUPA_LEGACY_IMPORT_NAMESPACE
      );
    }

    // Process review logs with deterministic UUIDs
    const processedLogs = processItemReviewLogs(currentUserId, idMapping, input.reviewLogs || []);
    for (const log of processedLogs) {
      idMapping.reviewLogs[log.legacyKey] = log.id;
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await tx.book.findUnique({
          where: { id: bookUuid },
        });

        if (existing) {
          // Deep verification inside atomic transaction
          const verification = await verifyExistingBookDeep(tx, bookUuid, currentUserId, input, idMapping, processedLogs);
          if (verification.isMatch) {
            return {
              isExisting: true,
              book: {
                id: existing.id,
                legacyId: input.legacyId,
                title: existing.title,
                isPublic: existing.isPublic,
                createdAt: existing.createdAt.toISOString(),
                updatedAt: existing.updatedAt.toISOString(),
              },
              stats: {
                chaptersCount: sortedChapters.length,
                itemsCount: (input.items || []).length,
                progressCount: (input.progresses || []).length,
                reviewLogsCount: processedLogs.length,
              },
              idMapping,
            };
          } else {
            throw createError(
              'Buku dengan identitas ini sudah ada dengan data yang berbeda atau tidak dapat diverifikasi.',
              409,
              'IMPORT_PAYLOAD_CONFLICT',
              { reason: verification.reason }
            );
          }
        }

        // 4. Create Book
        const createdBook = await tx.book.create({
          data: {
            id: bookUuid,
            userId: currentUserId,
            title: input.title,
            description: input.description ?? '',
            coverUrl: input.coverUrl ?? null,
            category: input.category ?? '',
            isPublic: Boolean(input.isPublic),
            price: input.price ?? 0,
            authorName: input.authorName || defaultAuthorName || null,
            createdAt: input.createdAt ? new Date(input.createdAt) : undefined,
            updatedAt: input.updatedAt ? new Date(input.updatedAt) : undefined,
          },
        });

        // 5. Create Chapters (topologically ordered)
        for (const ch of sortedChapters) {
          const chUuid = idMapping.chapters[ch.legacyId];
          const parentUuid = ch.legacyParentId ? idMapping.chapters[ch.legacyParentId] : null;
          await tx.chapter.create({
            data: {
              id: chUuid,
              bookId: bookUuid,
              parentId: parentUuid,
              title: ch.title,
              description: ch.description ?? null,
              material: ch.material ?? null,
              order: ch.order ?? 1,
              createdAt: ch.createdAt ? new Date(ch.createdAt) : undefined,
              updatedAt: ch.updatedAt ? new Date(ch.updatedAt) : undefined,
            },
          });
        }

        // 6. Create Items (verbatim question & answer)
        for (const item of input.items || []) {
          const itemUuid = idMapping.items[item.legacyId];
          const chUuid = item.legacyChapterId ? idMapping.chapters[item.legacyChapterId] : null;
          await tx.bookItem.create({
            data: {
              id: itemUuid,
              bookId: bookUuid,
              chapterId: chUuid,
              question: item.question,
              answer: item.answer,
              explanation: item.explanation ?? null,
              imageQ: item.imageQ ?? null,
              imageA: item.imageA ?? null,
              tags: item.tags ?? [],
              order: item.order ?? 1,
              createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
              updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
            },
          });
        }

        // 7. Create Progresses (verbatim FSRS values without rounding)
        for (const prog of input.progresses || []) {
          const itemUuid = idMapping.items[prog.legacyItemId];
          const progUuid = idMapping.progresses[prog.legacyItemId];
          await tx.userBookItemProgress.create({
            data: {
              id: progUuid,
              userId: currentUserId,
              bookItemId: itemUuid,
              isActive: Boolean(prog.isActive),
              status: prog.status ?? (prog.isActive ? 'active' : 'inactive'),
              stability: prog.stability,
              difficulty: prog.difficulty,
              reps: prog.reps ?? 0,
              lapses: prog.lapses ?? 0,
              lastReview: prog.lastReview ? new Date(prog.lastReview) : null,
              nextReview: prog.nextReview ? new Date(prog.nextReview) : null,
              state: (prog.state as any) ?? 'NEW',
              createdAt: prog.createdAt ? new Date(prog.createdAt) : undefined,
              updatedAt: prog.updatedAt ? new Date(prog.updatedAt) : undefined,
            },
          });
        }

        // 8. Create Review Logs (verbatim interval, rating, wasDue)
        for (const log of processedLogs) {
          await tx.bookItemReviewLog.create({
            data: {
              id: log.id,
              userBookItemProgressId: log.progressId,
              date: new Date(log.date),
              rating: log.rating,
              previousInterval: log.previousInterval !== undefined ? log.previousInterval : null,
              newInterval: log.newInterval !== undefined ? log.newInterval : null,
              wasDue: Boolean(log.wasDue),
            },
          });
        }

        return {
          isExisting: false,
          book: {
            id: createdBook.id,
            legacyId: input.legacyId,
            title: createdBook.title,
            isPublic: createdBook.isPublic,
            createdAt: createdBook.createdAt.toISOString(),
            updatedAt: createdBook.updatedAt.toISOString(),
          },
          stats: {
            chaptersCount: sortedChapters.length,
            itemsCount: (input.items || []).length,
            progressCount: (input.progresses || []).length,
            reviewLogsCount: processedLogs.length,
          },
          idMapping,
        };
      });
    } catch (error: any) {
      // Handle concurrent race condition (P2002 Unique Constraint violation)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const verification = await verifyExistingBookDeep(
          prisma,
          bookUuid,
          currentUserId,
          input,
          idMapping,
          processedLogs
        );
        if (verification.isMatch) {
          const existing = await prisma.book.findUnique({ where: { id: bookUuid } });
          if (existing) {
            return {
              isExisting: true,
              book: {
                id: existing.id,
                legacyId: input.legacyId,
                title: existing.title,
                isPublic: existing.isPublic,
                createdAt: existing.createdAt.toISOString(),
                updatedAt: existing.updatedAt.toISOString(),
              },
              stats: {
                chaptersCount: sortedChapters.length,
                itemsCount: (input.items || []).length,
                progressCount: (input.progresses || []).length,
                reviewLogsCount: processedLogs.length,
              },
              idMapping,
            };
          }
        } else {
          throw createError(
            'Buku dengan identitas ini sudah ada dengan data yang berbeda atau tidak dapat diverifikasi.',
            409,
            'IMPORT_PAYLOAD_CONFLICT',
            { reason: verification.reason }
          );
        }
      }

      throw error;
    }
  },

  /**
   * Clone/import a public library book into user's personal space
   */
  async importLibraryBook(currentUserId: string, masterBookId: string) {
    const masterBook = await prisma.book.findUnique({
      where: { id: masterBookId },
      include: {
        chapters: { orderBy: { order: 'asc' } },
        items: { orderBy: { order: 'asc' } },
      },
    });

    if (!masterBook) {
      throw createError('Buku perpustakaan tidak ditemukan.', 404, 'BOOK_NOT_FOUND');
    }

    // Verify access: must be public or owned by user
    if (!masterBook.isPublic && masterBook.userId !== currentUserId) {
      throw createError('Anda tidak memiliki izin untuk mengimpor buku privat ini.', 403, 'FORBIDDEN');
    }

    // Check if user already imported this book
    const existingClone = await prisma.book.findFirst({
      where: {
        userId: currentUserId,
        masterBookId: masterBook.id,
      },
      include: {
        chapters: true,
        items: true,
      },
    });

    if (existingClone) {
      // If the master book license is editable (!isReadonly), synchronize clone to editable
      if (existingClone.isReadonly && !masterBook.isReadonly) {
        const updatedClone = await prisma.book.update({
          where: { id: existingClone.id },
          data: { isReadonly: false },
          include: {
            chapters: true,
            items: true,
          },
        });
        return {
          isExisting: true,
          book: updatedClone,
        };
      }
      return {
        isExisting: true,
        book: existingClone,
      };
    }

    // Clone book inside transaction
    const cloned = await prisma.$transaction(async (tx) => {
      const newBook = await tx.book.create({
        data: {
          userId: currentUserId,
          masterBookId: masterBook.id,
          title: masterBook.title,
          description: masterBook.description || '',
          coverUrl: masterBook.coverUrl,
          category: 'imported',
          isPublic: false,
          isReadonly: Boolean(masterBook.isReadonly),
          authorName: masterBook.authorName || 'Penulis Pribadi',
          price: 0,
          downloads: 0,
          rating: 5.0,
        },
      });

      // Clone chapters preserving hierarchy
      const chapterIdMap = new Map<string, string>();
      for (const ch of masterBook.chapters) {
        const createdCh = await tx.chapter.create({
          data: {
            bookId: newBook.id,
            masterChapterId: ch.id,
            parentId: ch.parentId ? (chapterIdMap.get(ch.parentId) || null) : null,
            title: ch.title,
            description: ch.description,
            material: ch.material,
            order: ch.order,
          },
        });
        chapterIdMap.set(ch.id, createdCh.id);
      }

      // Clone items
      for (const item of masterBook.items) {
        await tx.bookItem.create({
          data: {
            bookId: newBook.id,
            chapterId: item.chapterId ? (chapterIdMap.get(item.chapterId) || null) : null,
            masterItemId: item.id,
            question: item.question,
            answer: item.answer,
            explanation: item.explanation,
            imageQ: item.imageQ,
            imageA: item.imageA,
            tags: item.tags,
            order: item.order,
          },
        });
      }

      return newBook;
    });

    return {
      isExisting: false,
      book: cloned,
    };
  },

  /**
   * Get all public books structured as library entries
   */
  async getPublicLibrary() {
    const books = await prisma.book.findMany({
      where: { isPublic: true },
      include: {
        chapters: {
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        },
        items: {
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return books.map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description || '',
      category: b.category || 'Umum & Akademik',
      curator: b.authorName || 'Penulis Komunitas',
      downloads: b.downloads || 0,
      rating: b.rating || 5.0,
      verified: true,
      book: {
        id: b.id,
        userId: b.userId || null,
        masterBookId: b.masterBookId || null,
        title: b.title,
        description: b.description || '',
        coverUrl: b.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
        isPublic: true,
        isReadonly: Boolean(b.isReadonly),
        authorName: b.authorName || 'Penulis Komunitas',
        category: b.category || 'Umum & Akademik',
        price: b.price || 0,
        downloads: b.downloads || 0,
        rating: b.rating || 5.0,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      },
      chapters: b.chapters.map((c) => ({
        id: c.id,
        bookId: c.bookId,
        masterChapterId: c.masterChapterId || null,
        parentId: c.parentId || null,
        title: c.title,
        description: c.description || undefined,
        material: c.material || undefined,
        order: c.order || 1,
      })),
      items: b.items.map((it) => ({
        id: it.id,
        bookId: it.bookId,
        chapterId: it.chapterId || null,
        masterItemId: it.masterItemId || null,
        question: it.question,
        answer: it.answer,
        explanation: it.explanation || undefined,
        imageQ: it.imageQ || undefined,
        imageA: it.imageA || undefined,
        tags: it.tags || [],
        order: it.order || 1,
        isActive: false,
        status: 'inactive' as const,
        fsrsData: {
          stability: 0,
          difficulty: 0,
          reps: 0,
          lapses: 0,
          state: 'new' as const,
          lastReview: null,
          nextReview: null,
        },
        reviewLogs: [],
        createdAt: it.createdAt.toISOString(),
      })),
      tags: ['community'],
    }));
  },
};


