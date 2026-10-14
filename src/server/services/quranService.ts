import { prisma } from '../db';
import { QuranPageStatus, FSRSStateEnum, MapanScheduleMode, Prisma } from '@prisma/client';
import { createError } from '../middleware/errorHandler';
import { updateQuranFSRS, isDue } from '../../lib/fsrs';
import { FSRSState } from '../../types';

export interface ReviewQuranPageInput {
  rating: 1 | 2 | 3;
  notes?: string;
  issueTypes?: string[];
  problemAyahs?: string;
  reviewerName?: string;
}

export const quranService = {
  /**
   * Get all active or customized Quran pages for a specific user
   */
  async getUserQuranPages(userId: string) {
    if (!userId) {
      throw createError('User ID tidak valid', 400, 'INVALID_USER_ID');
    }

    const pages = await prisma.userQuranPage.findMany({
      where: { userId },
      include: {
        reviewLogs: {
          orderBy: { date: 'desc' },
          take: 50,
        },
      },
      orderBy: { pageNumber: 'asc' },
    });

    return pages;
  },

  /**
   * Get single Quran page details and review history
   */
  async getUserQuranPage(userId: string, pageNumber: number) {
    if (!userId || !pageNumber || pageNumber < 1 || pageNumber > 604) {
      throw createError('Nomor halaman tidak valid (1-604)', 400, 'INVALID_PAGE_NUMBER');
    }

    const page = await prisma.userQuranPage.findUnique({
      where: {
        userId_pageNumber: { userId, pageNumber },
      },
      include: {
        reviewLogs: {
          orderBy: { date: 'desc' },
          take: 50,
        },
      },
    });

    return page;
  },

  /**
   * Activate a Quran page for user's murajaah schedule
   */
  async activateQuranPage(userId: string, pageNumber: number) {
    if (!userId || !pageNumber || pageNumber < 1 || pageNumber > 604) {
      throw createError('Nomor halaman tidak valid (1-604)', 400, 'INVALID_PAGE_NUMBER');
    }

    const now = new Date();

    const existing = await prisma.userQuranPage.findUnique({
      where: {
        userId_pageNumber: { userId, pageNumber },
      },
    });

    if (existing) {
      const nextStatus = existing.status === QuranPageStatus.INACTIVE
        ? QuranPageStatus.ACTIVE
        : existing.status;

      const updated = await prisma.userQuranPage.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          status: nextStatus,
          activatedAt: existing.activatedAt || now,
          nextReview: existing.nextReview || now,
        },
        include: {
          reviewLogs: {
            orderBy: { date: 'desc' },
            take: 50,
          },
        },
      });
      return updated;
    }

    const created = await prisma.userQuranPage.create({
      data: {
        userId,
        pageNumber,
        isActive: true,
        activatedAt: now,
        status: QuranPageStatus.ACTIVE,
        state: FSRSStateEnum.NEW,
        stability: 0,
        difficulty: 10.0,
        reps: 0,
        lapses: 0,
        nextReview: now,
      },
      include: {
        reviewLogs: {
          orderBy: { date: 'desc' },
          take: 50,
        },
      },
    });

    return created;
  },

  /**
   * Deactivate a Quran page from user's murajaah schedule (preserves FSRS history)
   */
  async deactivateQuranPage(userId: string, pageNumber: number) {
    if (!userId || !pageNumber || pageNumber < 1 || pageNumber > 604) {
      throw createError('Nomor halaman tidak valid (1-604)', 400, 'INVALID_PAGE_NUMBER');
    }

    const existing = await prisma.userQuranPage.findUnique({
      where: {
        userId_pageNumber: { userId, pageNumber },
      },
    });

    if (!existing) {
      // If record did not exist yet, create inactive placeholder
      return await prisma.userQuranPage.create({
        data: {
          userId,
          pageNumber,
          isActive: false,
          status: QuranPageStatus.INACTIVE,
          state: FSRSStateEnum.NEW,
        },
        include: {
          reviewLogs: true,
        },
      });
    }

    const updated = await prisma.userQuranPage.update({
      where: { id: existing.id },
      data: {
        isActive: false,
      },
      include: {
        reviewLogs: {
          orderBy: { date: 'desc' },
          take: 50,
        },
      },
    });

    return updated;
  },

  /**
   * Submit an FSRS-6 evaluation review for a Quran page
   */
  async reviewQuranPage(userId: string, pageNumber: number, input: ReviewQuranPageInput) {
    if (!userId || !pageNumber || pageNumber < 1 || pageNumber > 604) {
      throw createError('Nomor halaman tidak valid (1-604)', 400, 'INVALID_PAGE_NUMBER');
    }

    if (![1, 2, 3].includes(input.rating)) {
      throw createError('Rating harus bernilai 1, 2, atau 3', 400, 'INVALID_RATING');
    }

    const now = new Date();

    return await prisma.$transaction(async (tx) => {
      // 1. Get or create page record
      let page = await tx.userQuranPage.findUnique({
        where: {
          userId_pageNumber: { userId, pageNumber },
        },
      });

      if (!page) {
        page = await tx.userQuranPage.create({
          data: {
            userId,
            pageNumber,
            isActive: true,
            activatedAt: now,
            status: QuranPageStatus.ACTIVE,
            state: FSRSStateEnum.NEW,
            stability: 0,
            difficulty: 10.0,
            reps: 0,
            lapses: 0,
            nextReview: now,
          },
        });
      }

      // 2. Prepare FSRS State representation
      const currentState: FSRSState = {
        stability: page.stability,
        difficulty: page.difficulty,
        reps: page.reps,
        lapses: page.lapses,
        lastReview: page.lastReview ? page.lastReview.toISOString() : null,
        nextReview: page.nextReview ? page.nextReview.toISOString() : null,
        state: (page.state.toLowerCase() as FSRSState['state']) || 'new',
      };

      const previousInterval = Math.round((currentState.stability || 0) * 0.4025587);

      // 3. Compute accurate FSRS-6 state update
      const fsrsResult = updateQuranFSRS(currentState, input.rating, now);

      const nextStateEnum = fsrsResult.newState.state.toUpperCase() as FSRSStateEnum;
      const nextStatusEnum = fsrsResult.isMasteredForNow
        ? QuranPageStatus.MASTERED_FOR_NOW
        : QuranPageStatus.ACTIVE;

      // 4. Update page with new FSRS memory values
      const updatedPage = await tx.userQuranPage.update({
        where: { id: page.id },
        data: {
          isActive: true,
          status: nextStatusEnum,
          stability: fsrsResult.newState.stability,
          difficulty: fsrsResult.newState.difficulty,
          reps: fsrsResult.newState.reps,
          lapses: fsrsResult.newState.lapses,
          lastReview: fsrsResult.newState.lastReview ? new Date(fsrsResult.newState.lastReview) : now,
          nextReview: fsrsResult.newState.nextReview ? new Date(fsrsResult.newState.nextReview) : null,
          state: nextStateEnum,
          mapanCelebrated: page.mapanCelebrated || fsrsResult.isMasteredForNow,
        },
      });

      // 5. Create immutable review log record
      const reviewLog = await tx.quranPageReviewLog.create({
        data: {
          userQuranPageId: page.id,
          date: now,
          rating: input.rating,
          previousInterval,
          newInterval: fsrsResult.nextIntervalDays,
          wasDue: isDue(currentState.nextReview, page.isActive, currentState.lastReview),
          notes: input.notes?.trim() || null,
          issueTypes: input.issueTypes || [],
          problemAyahs: input.problemAyahs?.trim() || null,
          reviewerName: input.reviewerName?.trim() || null,
        },
      });

      return {
        page: updatedPage,
        reviewLog,
        fsrsResult,
      };
    });
  },
};
