import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { GamificationRankTier } from '../../types';

export const leaderboardRouter = Router();

function getTierFromXp(xp: number): {
  tier: GamificationRankTier;
  tierTitleId: string;
  tierTitleAr: string;
} {
  if (xp >= 4000) {
    return {
      tier: 'mutqin',
      tierTitleId: 'Mutqin Mumtaz (Penjaga Kokoh)',
      tierTitleAr: 'متقن ممتاز',
    };
  }
  if (xp >= 2200) {
    return {
      tier: 'hafizh',
      tierTitleId: 'Hafizh Mujid (Penghafal Disiplin)',
      tierTitleAr: 'حافظ مجيد',
    };
  }
  if (xp >= 1000) {
    return {
      tier: 'muwazhib',
      tierTitleId: 'Muwazhib (Penjaga Konsisten)',
      tierTitleAr: 'مواظب على الورد',
    };
  }
  if (xp >= 350) {
    return {
      tier: 'thalib',
      tierTitleId: 'Thalib Mujtahid (Penuntut Tekun)',
      tierTitleAr: 'طالب مجتهد',
    };
  }
  return {
    tier: 'mubtadi',
    tierTitleId: "Mubtadi' (Pemula Bertekad)",
    tierTitleAr: 'مبتدئ مواظب',
  };
}

/**
 * GET /api/v1/leaderboard
 * Ambil daftar peringkat global dari seluruh pengguna Unlupa berdasarkan total XP terbanyak
 */
leaderboardRouter.get('/leaderboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        quranSpaceCode: true,
        email: true,
        onboardingPreferences: true,
        createdAt: true,
        userQuranPages: {
          select: {
            isActive: true,
            status: true,
            reps: true,
            reviewLogs: {
              select: {
                rating: true,
                date: true,
              },
            },
          },
        },
        bookProgresses: {
          select: {
            isActive: true,
            status: true,
            reps: true,
            reviewLogs: {
              select: {
                rating: true,
                date: true,
              },
            },
          },
        },
      },
    });

    const entries = users.map((user) => {
      // 1. Hitung Quran XP
      let quranActiveCount = 0;
      let quranReviewLogsCount = 0;
      let quranMutqinBonusXp = 0;
      let quranLancarBonusXp = 0;

      const reviewDates = new Set<string>();

      user.userQuranPages.forEach((p) => {
        if (p.isActive) quranActiveCount++;
        (p.reviewLogs || []).forEach((l) => {
          quranReviewLogsCount++;
          if (l.rating === 3) quranMutqinBonusXp += 3;
          else if (l.rating === 2) quranLancarBonusXp += 2;
          if (l.date) {
            reviewDates.add(new Date(l.date).toISOString().slice(0, 10));
          }
        });
      });

      const quranHadReview = quranReviewLogsCount > 0;
      const quranDisciplineBaseXp = quranHadReview ? 25 : 0;
      const quranSheetsRepetitionXp = quranReviewLogsCount * 2;
      const quranRatingBonusXp = quranMutqinBonusXp + quranLancarBonusXp;
      const quranZiyadahXp = quranActiveCount * 50;

      // 2. Hitung Flashcard Kitab XP
      let bookReviewLogsCount = 0;
      let bookMasteredBonusXp = 0;
      let bookActiveCount = 0;

      user.bookProgresses.forEach((b) => {
        if (b.isActive) bookActiveCount++;
        (b.reviewLogs || []).forEach((l) => {
          bookReviewLogsCount++;
          if (l.rating >= 3) bookMasteredBonusXp += 2;
          if (l.date) {
            reviewDates.add(new Date(l.date).toISOString().slice(0, 10));
          }
        });
      });

      const bookXp =
        (bookReviewLogsCount > 0 ? 15 : 0) +
        bookReviewLogsCount * 2 +
        bookMasteredBonusXp +
        bookActiveCount * 5;

      // 3. Streak & Milestones
      const streakDays = Math.max(1, reviewDates.size);
      const quranStreakXp = streakDays * 50;
      const completedMilestonesCount = Math.floor(streakDays / 7);
      const milestoneBonusXp = completedMilestonesCount * 100;

      const quranXp =
        quranDisciplineBaseXp +
        quranSheetsRepetitionXp +
        quranRatingBonusXp +
        quranZiyadahXp +
        quranStreakXp +
        milestoneBonusXp;

      const totalXp = quranXp + bookXp;
      const tierInfo = getTierFromXp(totalXp);

      const prefs = (user.onboardingPreferences as any) || {};
      const region = prefs.region || prefs.city || 'Indonesia';

      const disciplineRate = 95 + Math.min(5, streakDays);
      const disciplineScore = Math.round(disciplineRate * 10 + streakDays * 5);

      return {
        id: user.id,
        name: user.fullName || 'Santri Unlupa',
        avatarUrl: user.avatarUrl || null,
        quranSpaceCode: user.quranSpaceCode || 'UNL-QRN',
        totalXp,
        quranXp,
        bookXp,
        streakDays,
        activePagesCount: quranActiveCount,
        reviewedPagesCount: quranReviewLogsCount,
        activeBookItemsCount: bookActiveCount,
        reviewedBookItemsCount: bookReviewLogsCount,
        tier: tierInfo.tier,
        tierTitleId: tierInfo.tierTitleId,
        tierTitleAr: tierInfo.tierTitleAr,
        region,
        lastActive: 'Baru saja',
        retentionRate: 98,
        disciplineRate,
        disciplineScore,
      };
    });

    // Urutkan berdasarkan totalXp tertinggi (paling banyak XP)
    entries.sort((a, b) => b.totalXp - a.totalXp);

    // Hitung rank
    const rankedByXp = entries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    // Hitung juga discipline rank
    const sortedByDiscipline = [...rankedByXp].sort((a, b) => b.disciplineScore - a.disciplineScore);
    const disciplineRankMap = new Map<string, number>();
    sortedByDiscipline.forEach((entry, idx) => {
      disciplineRankMap.set(entry.id, idx + 1);
    });

    const finalResult = rankedByXp.map((entry) => ({
      ...entry,
      disciplineRank: disciplineRankMap.get(entry.id) || entry.rank,
    }));

    res.status(200).json({
      success: true,
      data: finalResult,
      totalUsers: finalResult.length,
    });
  } catch (error) {
    next(error);
  }
});
