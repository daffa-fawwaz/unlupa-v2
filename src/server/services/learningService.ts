import { prisma } from '../db';
import { FSRSStateEnum, Prisma } from '@prisma/client';
import { createError } from '../middleware/errorHandler';
import {
  updateNonQuranFSRS,
  isDue,
  createInitialFSRSState,
  calculatePreviousScheduledInterval,
} from '../../lib/fsrs';
import { FSRSState } from '../../types';
import { checkBookAccess } from './bookService';

export interface LearningStats {
  totalBooks: number;
  totalItems: number;
  activeItems: number;
  dueToday: number;
  avgStability: number;
  masteredCount: number;
}

export const learningService = {
  /**
   * Calculate personal non-Quran learning statistics for a user
   * Consistently evaluates due cards according to canonical WIB (Asia/Jakarta) calendar days (AUDIT-4-06)
   */
  async getStats(userId: string): Promise<LearningStats> {
    const nowWIB = new Date();
    const [totalBooks, totalItems, activeProgresses] = await Promise.all([
      prisma.book.count({ where: { userId } }),
      prisma.bookItem.count({ where: { book: { userId } } }),
      prisma.userBookItemProgress.findMany({
        where: { userId, isActive: true },
        select: {
          stability: true,
          status: true,
          nextReview: true,
          lastReview: true,
          isActive: true,
        },
      }),
    ]);

    let dueTodayCount = 0;
    let totalStability = 0;
    let masteredCount = 0;

    for (const p of activeProgresses) {
      totalStability += p.stability || 0;
      if (p.stability >= 300 || p.status === 'mastered') {
        masteredCount++;
      }

      const nextIso = p.nextReview ? p.nextReview.toISOString() : null;
      const lastIso = p.lastReview ? p.lastReview.toISOString() : null;
      if (isDue(nextIso, p.isActive, lastIso, nowWIB)) {
        dueTodayCount++;
      }
    }

    const avgStability = activeProgresses.length > 0
      ? Math.round(totalStability / activeProgresses.length)
      : 0;

    return {
      totalBooks,
      totalItems,
      activeItems: activeProgresses.length,
      dueToday: dueTodayCount,
      avgStability,
      masteredCount,
    };
  },

  /**
   * Get flashcards currently due for review for the authenticated user
   * Consistently filters due cards according to canonical WIB (Asia/Jakarta) calendar days (AUDIT-4-06)
   */
  async getDueCards(userId: string, bookId?: string, limit = 50) {
    const nowWIB = new Date();
    const where: Prisma.UserBookItemProgressWhereInput = {
      userId,
      isActive: true,
    };

    if (bookId) {
      where.bookItem = { bookId };
    }

    // Retrieve active progresses with card material details
    const progresses = await prisma.userBookItemProgress.findMany({
      where,
      include: {
        bookItem: {
          include: {
            book: {
              select: { id: true, title: true, isPublic: true },
            },
            chapter: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: [
        { nextReview: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Filter cards that are due today according to the FSRS isDue rule in WIB
    const dueProgresses = progresses.filter((p) => {
      const nextIso = p.nextReview ? p.nextReview.toISOString() : null;
      const lastIso = p.lastReview ? p.lastReview.toISOString() : null;
      return isDue(nextIso, p.isActive, lastIso, nowWIB);
    });

    const cappedDue = dueProgresses.slice(0, Math.min(200, Math.max(1, limit)));

    return cappedDue.map((p) => ({
      progressId: p.id,
      itemId: p.bookItemId,
      bookId: p.bookItem.bookId,
      bookTitle: p.bookItem.book.title,
      chapterId: p.bookItem.chapterId,
      chapterTitle: p.bookItem.chapter?.title || null,
      question: p.bookItem.question,
      answer: p.bookItem.answer,
      explanation: p.bookItem.explanation,
      imageQ: p.bookItem.imageQ,
      imageA: p.bookItem.imageA,
      tags: p.bookItem.tags,
      fsrs: {
        stability: p.stability,
        difficulty: p.difficulty,
        reps: p.reps,
        lapses: p.lapses,
        lastReview: p.lastReview,
        nextReview: p.nextReview,
        state: p.state,
        status: p.status,
      },
    }));
  },

  /**
   * Activate a book item card for FSRS review
   */
  async activateItem(itemId: string, userId: string) {
    const item = await prisma.bookItem.findUnique({
      where: { id: itemId },
      include: { book: true },
    });

    if (!item) {
      throw createError('Kartu materi tidak ditemukan.', 404, 'ITEM_NOT_FOUND');
    }

    // Enforce book access and reject paid public books for non-owners (AUDIT-4-07)
    checkBookAccess(item.book, userId);

    const existingProgress = await prisma.userBookItemProgress.findUnique({
      where: {
        userId_bookItemId: {
          userId,
          bookItemId: itemId,
        },
      },
    });

    const today = new Date();

    if (!existingProgress) {
      // First activation: create new progress record
      return prisma.userBookItemProgress.create({
        data: {
          userId,
          bookItemId: itemId,
          isActive: true,
          status: 'active',
          stability: 0,
          difficulty: 5.0,
          reps: 0,
          lapses: 0,
          nextReview: today,
          state: FSRSStateEnum.NEW,
        },
      });
    }

    // Re-activation: preserve past stability and history
    const hasHistory = (existingProgress.reps || 0) > 0 || Boolean(existingProgress.lastReview);
    const nextReviewDate = hasHistory && existingProgress.nextReview
      ? existingProgress.nextReview
      : today;

    return prisma.userBookItemProgress.update({
      where: { id: existingProgress.id },
      data: {
        isActive: true,
        status: existingProgress.status === 'inactive' ? 'active' : existingProgress.status,
        nextReview: nextReviewDate,
        state: hasHistory ? FSRSStateEnum.REVIEW : FSRSStateEnum.NEW,
      },
    });
  },

  /**
   * Deactivate a book item card from FSRS review (preserves history)
   */
  async deactivateItem(itemId: string, userId: string) {
    const existingProgress = await prisma.userBookItemProgress.findUnique({
      where: {
        userId_bookItemId: {
          userId,
          bookItemId: itemId,
        },
      },
    });

    if (!existingProgress) {
      // Not activated yet, nothing to deactivate
      return { success: true, message: 'Kartu materi sudah dalam keadaan nonaktif.' };
    }

    const updated = await prisma.userBookItemProgress.update({
      where: { id: existingProgress.id },
      data: {
        isActive: false,
      },
    });

    return updated;
  },

  /**
   * Submit an FSRS review for a book item card
   * Executes atomic updates on UserBookItemProgress and logs BookItemReviewLog with PostgreSQL row-level lock (AUDIT-4-09)
   */
  async submitReview(itemId: string, userId: string, rating: 1 | 2 | 3 | 4) {
    const item = await prisma.bookItem.findUnique({
      where: { id: itemId },
      include: { book: true },
    });

    if (!item) {
      throw createError('Kartu materi tidak ditemukan.', 404, 'ITEM_NOT_FOUND');
    }

    // Enforce book access and reject paid public books for non-owners (AUDIT-4-07)
    checkBookAccess(item.book, userId);

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      try {
        return await prisma.$transaction(async (tx) => {
          // 1. Atomically ensure the progress record exists
          await tx.$executeRaw`
            INSERT INTO "user_book_item_progresses" 
            ("id", "userId", "bookItemId", "isActive", "status", "stability", "difficulty", "reps", "lapses", "state", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), ${userId}::uuid, ${itemId}::uuid, true, 'active', 0, 5.0, 0, 0, 'NEW', NOW(), NOW())
            ON CONFLICT ("userId", "bookItemId") DO NOTHING
          `;

          // 2. Lock the progress row exclusively FOR UPDATE inside this transaction (AUDIT-4-09)
          const lockedRows = await tx.$queryRaw<any[]>`
            SELECT * FROM "user_book_item_progresses" 
            WHERE "userId" = ${userId}::uuid AND "bookItemId" = ${itemId}::uuid
            FOR UPDATE
          `;

          if (!lockedRows || lockedRows.length === 0) {
            throw createError('Gagal mengunci state kartu untuk review.', 500, 'CONCURRENCY_ERROR');
          }

          const progress = lockedRows[0];
          const reviewDate = new Date();

          // 3. Check wasDue before review calculation using canonical WIB dates (AUDIT-4-06)
          const nextIso = progress.nextReview ? new Date(progress.nextReview).toISOString() : null;
          const lastIso = progress.lastReview ? new Date(progress.lastReview).toISOString() : null;
          const wasDue = isDue(nextIso, progress.isActive, lastIso, reviewDate);

          // 4. Convert locked progress to FSRSState and calculate next interval with official FSRS algorithm
          const currentFSRSState: FSRSState = {
            stability: Number(progress.stability) || 0,
            difficulty: Number(progress.difficulty) || 5.0,
            reps: Number(progress.reps) || 0,
            lapses: Number(progress.lapses) || 0,
            lastReview: lastIso,
            nextReview: nextIso,
            state: String(progress.state).toLowerCase() as any,
          };

          const { newState, nextIntervalDays } = updateNonQuranFSRS(currentFSRSState, rating, reviewDate);

          // 5. Determine status and enum state based on interval and reps
          const newStatus = nextIntervalDays >= 375
            ? 'mastered'
            : (progress.isActive ? 'active' : 'inactive');

          let nextStateEnum: FSRSStateEnum;
          if (nextIntervalDays >= 375) {
            nextStateEnum = FSRSStateEnum.MASTERED;
          } else if (newState.reps >= 3) {
            nextStateEnum = FSRSStateEnum.REVIEW;
          } else {
            nextStateEnum = FSRSStateEnum.LEARNING;
          }

          // 6. Execute atomic updates in the same transaction
          const updatedProgress = await tx.userBookItemProgress.update({
            where: { id: progress.id },
            data: {
              stability: newState.stability,
              difficulty: newState.difficulty,
              reps: newState.reps,
              lapses: newState.lapses,
              lastReview: new Date(newState.lastReview!),
              nextReview: new Date(newState.nextReview!),
              state: nextStateEnum,
              status: newStatus,
            },
          });

          // Calculate previous scheduled interval in days from locked state BEFORE applying new review
          const previousIntervalDays = calculatePreviousScheduledInterval(
            progress.lastReview,
            progress.nextReview,
            Number(progress.reps) || 0
          );

          const newLog = await tx.bookItemReviewLog.create({
            data: {
              userBookItemProgressId: progress.id,
              date: reviewDate,
              rating,
              previousInterval: previousIntervalDays,
              newInterval: nextIntervalDays,
              wasDue,
            },
          });

          return {
            progress: updatedProgress,
            reviewLog: newLog,
            nextIntervalDays,
          };
        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
          timeout: 10000,
        });
      } catch (err: any) {
        if (
          attempt < maxRetries &&
          (err?.code === 'P2034' || err?.message?.includes('deadlock') || err?.message?.includes('could not serialize'))
        ) {
          await new Promise((r) => setTimeout(r, 50 * Math.pow(2, attempt)));
          continue;
        }
        throw err;
      }
    }

    throw createError('Gagal menyelesaikan review karena konflik konkurensi.', 409, 'CONCURRENCY_CONFLICT');
  },

  /**
   * Get learning progress and recent review history for a specific card
   */
  async getItemProgress(itemId: string, userId: string) {
    const progress = await prisma.userBookItemProgress.findUnique({
      where: {
        userId_bookItemId: {
          userId,
          bookItemId: itemId,
        },
      },
      include: {
        reviewLogs: {
          orderBy: { date: 'desc' },
          take: 50,
        },
      },
    });

    if (!progress) {
      return null;
    }

    return progress;
  },
};
