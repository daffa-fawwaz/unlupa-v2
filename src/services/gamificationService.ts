import { 
  QuranPageItem, 
  BookItem, 
  UserProfile, 
  GamificationRankTier, 
  GamificationLevel, 
  UserGamificationStats, 
  LeaderboardUserEntry, 
  QuranFriendshipGroup,
  ClassGroup 
} from '../types';

export type {
  GamificationRankTier,
  GamificationLevel,
  UserGamificationStats,
  LeaderboardUserEntry,
  QuranFriendshipGroup
};

/**
 * Jenjang Peringkat / Mutqin Tiers
 */
export const GAMIFICATION_LEVELS: GamificationLevel[] = [
  {
    tier: 'mubtadi',
    titleId: 'Mubtadi\' (Pemula Bertekad)',
    titleAr: 'مبتدئ مواظب',
    minXp: 0,
    badgeColor: '#10B981',
    badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    iconName: 'Sprout',
  },
  {
    tier: 'thalib',
    titleId: 'Thalib Mujtahid (Penuntut Tekun)',
    titleAr: 'طالب مجتهد',
    minXp: 350,
    badgeColor: '#0EA5E9',
    badgeBg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    iconName: 'BookOpen',
  },
  {
    tier: 'muwazhib',
    titleId: 'Muwazhib (Penjaga Konsisten)',
    titleAr: 'مواظب على الورد',
    minXp: 1000,
    badgeColor: '#6366F1',
    badgeBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    iconName: 'Shield',
  },
  {
    tier: 'hafizh',
    titleId: 'Hafizh Mujid (Penghafal Disiplin)',
    titleAr: 'حافظ مجيد',
    minXp: 2200,
    badgeColor: '#F59E0B',
    badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    iconName: 'Award',
  },
  {
    tier: 'mutqin',
    titleId: 'Mutqin Mumtaz (Penjaga Kokoh)',
    titleAr: 'متقن ممتاز',
    minXp: 4500,
    badgeColor: '#EC4899',
    badgeBg: 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30',
    iconName: 'Flame',
  },
  {
    tier: 'sayyid',
    titleId: 'Sayyidul Huffazh (Teladan Keistiqamahan)',
    titleAr: 'قدوة الحفاظ',
    minXp: 8000,
    badgeColor: '#8B5CF6',
    badgeBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    iconName: 'Crown',
  },
];

/**
 * Aturan Perolehan XP:
 * Sesuai prinsip Spaced Repetition murni:
 * 1. TIDAK PERNAH MENGHUKUM LUPA! Review tepat waktu walau rating 1 atau 2 tetap mendapat XP Kedisiplinan.
 * 2. On-Time Review: +25 XP
 * 3. Bonus Mutqin / Lancar: +10 XP
 * 4. Ziyadah (Halaman Baru diaktifkan): +15 XP
 * 5. Streak Istiqamah: +50 XP per hari streak
 * 6. Milestone Mingguan (7, 14, 21, 28, 35, dst): +100 XP per pekan tercapai
 */
export function calculateUserGamificationStats(
  quranPages: QuranPageItem[],
  bookItems: BookItem[],
  streakDays: number
): UserGamificationStats {
  const safeQuran = Array.isArray(quranPages) ? quranPages : [];
  const safeItems = Array.isArray(bookItems) ? bookItems : [];

  // 1. Hitung total review Al-Qur'an per lembar halaman yang direview
  let quranReviewLogsCount = 0;
  let quranMutqinBonusXp = 0;
  let quranLancarBonusXp = 0;
  const quranZiyadahCount = safeQuran.filter(p => p.isActive).length;

  safeQuran.forEach(page => {
    if (page.reviewLogs && page.reviewLogs.length > 0) {
      page.reviewLogs.forEach(log => {
        // Setiap lembar halaman yang direview dihitung tepat waktu
        quranReviewLogsCount++;
        if (log.rating === 3) {
          // Bonus mutqin dibuat kecil (+3 XP) agar santri jujur dan tidak tergoda mengejar rating palsu
          quranMutqinBonusXp += 3;
        } else if (log.rating === 2) {
          // Bonus lancar (+2 XP)
          quranLancarBonusXp += 2;
        }
      });
    }
  });

  // Kedisiplinan Al-Qur'an:
  // - Basis kedisiplinan penuh: 25 XP (diperoleh jika melakukan murajaah tepat waktu)
  // - Ditambah pengulangan lembar halaman: +2 XP per lembar halaman yang diulang/dimurajaah
  // - Bonus Mutqin (Rating 3): +3 XP per lembar
  // - Bonus Lancar (Rating 2): +2 XP per lembar
  // - Ziyadah / Aktivasi Halaman Al-Qur'an Baru: +50 XP per halaman (halaman terbatas 604 & seumur hidup)
  const quranHadReview = quranReviewLogsCount > 0;
  const quranDisciplineBaseXp = quranHadReview ? 25 : 0;
  const quranSheetsRepetitionXp = quranReviewLogsCount * 2;
  const quranRatingBonusXp = quranMutqinBonusXp + quranLancarBonusXp;
  const quranZiyadahXp = quranZiyadahCount * 50;
  const quranStreakXp = streakDays * 50;

  // Milestone Streak Mingguan: Kenaikan bertahap per 7 hari (7, 14, 21, 28, 35, dst.)
  const completedMilestonesCount = Math.floor(streakDays / 7);
  const milestoneBonusXp = completedMilestonesCount * 100;

  const currentMilestoneDays = (completedMilestonesCount + 1) * 7;
  const daysToMilestone = Math.max(0, currentMilestoneDays - streakDays);

  const quranXp = quranDisciplineBaseXp + quranSheetsRepetitionXp + quranRatingBonusXp + quranZiyadahXp + quranStreakXp + milestoneBonusXp;

  // 2. Hitung review item Buku / Kitab
  let bookReviewLogsCount = 0;
  let bookMasteredBonusXp = 0;
  const bookActiveCount = safeItems.filter(i => i.isActive).length;
  safeItems.forEach(item => {
    if (item.reviewLogs && item.reviewLogs.length > 0) {
      item.reviewLogs.forEach(log => {
        bookReviewLogsCount++;
        if (log.rating >= 3) {
          bookMasteredBonusXp += 2;
        }
      });
    }
  });
  // Flashcard kitab: basis 15 XP + 2 XP/kartu + aktivasi 5 XP/kartu
  const bookXp = (bookReviewLogsCount > 0 ? 15 : 0) + bookReviewLogsCount * 2 + bookMasteredBonusXp + bookActiveCount * 5;
  const totalXp = quranXp + bookXp;

  // 3. Hitung Tingkat Kedisiplinan Tepat Waktu (Discipline Rate)
  const activeQuranPages = safeQuran.filter(p => p.isActive);
  const overdueQuranCount = activeQuranPages.filter(p => {
    if (!p.fsrsData?.nextReview) return false;
    const nDate = new Date(p.fsrsData.nextReview);
    nDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return nDate < today;
  }).length;

  const totalActiveQuran = activeQuranPages.length;
  const disciplineRate = totalActiveQuran > 0
    ? Math.max(0, Math.min(100, Math.round(((totalActiveQuran - overdueQuranCount) / totalActiveQuran) * 100)))
    : 100;

  // Skor Kedisiplinan gabungan (Persentase Disiplin × 10 + Streak × 5)
  const disciplineScore = Math.round((disciplineRate * 10) + (streakDays * 5));

  // Tentukan Tier
  let currentTier: GamificationRankTier = 'mubtadi';
  let tierTitleId = GAMIFICATION_LEVELS[0].titleId;
  let tierTitleAr = GAMIFICATION_LEVELS[0].titleAr;
  let nextTierXp = GAMIFICATION_LEVELS[1].minXp;
  let minTierXp = 0;

  for (let i = GAMIFICATION_LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= GAMIFICATION_LEVELS[i].minXp) {
      currentTier = GAMIFICATION_LEVELS[i].tier;
      tierTitleId = GAMIFICATION_LEVELS[i].titleId;
      tierTitleAr = GAMIFICATION_LEVELS[i].titleAr;
      minTierXp = GAMIFICATION_LEVELS[i].minXp;
      nextTierXp = GAMIFICATION_LEVELS[i + 1]?.minXp || GAMIFICATION_LEVELS[i].minXp * 1.5;
      break;
    }
  }

  const progressRange = Math.max(1, nextTierXp - minTierXp);
  const progressToNextTier = Math.min(100, Math.max(0, Math.round(((totalXp - minTierXp) / progressRange) * 100)));

  return {
    totalXp,
    quranXp,
    disciplineXp: quranDisciplineBaseXp + quranSheetsRepetitionXp + (bookReviewLogsCount > 0 ? 15 : 0) + bookReviewLogsCount * 2,
    streakDays,
    currentMilestoneDays,
    daysToMilestone,
    completedMilestonesCount,
    onTimeReviewCount: quranReviewLogsCount + bookReviewLogsCount,
    disciplineRate,
    disciplineScore,
    reviewedPagesCount: quranReviewLogsCount,
    currentTier,
    tierTitleId,
    tierTitleAr,
    nextTierXp,
    progressToNextTier,
    weeklyXpGain: Math.min(totalXp, 120 + streakDays * 35),
  };
}

/**
 * Daftar Wilayah Santri Global & Regional
 */
export const INDONESIA_REGIONS = [
  'Semua Wilayah (Nasional & Global)',
  'Jawa Timur',
  'DKI Jakarta & Banten',
  'Jawa Barat',
  'Jawa Tengah & DIY',
  'Sumatera Utara & Aceh',
  'Sumatera Barat & Riau',
  'Sulawesi Selatan',
  'Kalimantan Timur & Barat',
  'Luar Negeri (Mesir, Saudi, Yaman)',
];

/**
 * Islamic SVG Avatar Generators
 * Clean, respectful, non-photorealistic Islamic avatars with hijab & kufi cap.
 */
export const ISLAMIC_AVATARS = {
  malePeci: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#F1F5F9" />
      <path d="M28 32 C28 20 72 20 72 32 L72 38 L28 38 Z" fill="#1E293B" />
      <circle cx="50" cy="46" r="16" fill="#FDBA74" />
      <path d="M22 84 C22 66 36 62 50 62 C64 62 78 66 78 84 Z" fill="#3B82F6" />
      <rect x="42" y="62" width="16" height="22" fill="#FFFFFF" rx="3" />
    </svg>
  `)}`,
  femaleHijabGreen: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#F0FDF4" />
      <path d="M24 38 C24 20 76 20 76 38 C76 56 68 76 68 84 L32 84 C32 76 24 56 24 38 Z" fill="#059669" />
      <circle cx="50" cy="44" r="13" fill="#FED7AA" />
      <path d="M20 86 C20 74 34 72 50 72 C66 72 80 74 80 86 Z" fill="#047857" />
    </svg>
  `)}`,
  maleKufiTeal: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#F0FDFA" />
      <path d="M30 30 C30 18 70 18 70 30 L70 36 L30 36 Z" fill="#0D9488" />
      <circle cx="50" cy="46" r="16" fill="#FDBA74" />
      <path d="M22 84 C22 66 36 62 50 62 C64 62 78 66 78 84 Z" fill="#14B8A6" />
    </svg>
  `)}`,
  femaleHijabPurple: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#FAF5FF" />
      <path d="M24 38 C24 20 76 20 76 38 C76 56 68 76 68 84 L32 84 C32 76 24 56 24 38 Z" fill="#7C3AED" />
      <circle cx="50" cy="44" r="13" fill="#FED7AA" />
      <path d="M20 86 C20 74 34 72 50 72 C66 72 80 74 80 86 Z" fill="#6D28D9" />
    </svg>
  `)}`,
  maleSorbanNavy: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#EEF2F6" />
      <path d="M26 32 C26 18 74 18 74 32 L74 38 L26 38 Z" fill="#0F172A" />
      <circle cx="50" cy="46" r="16" fill="#FDBA74" />
      <path d="M22 84 C22 66 36 62 50 62 C64 62 78 66 78 84 Z" fill="#1E293B" />
      <rect x="42" y="62" width="16" height="22" fill="#E2E8F0" rx="3" />
    </svg>
  `)}`,
  femaleHijabPink: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#FDF2F8" />
      <path d="M24 38 C24 20 76 20 76 38 C76 56 68 76 68 84 L32 84 C32 76 24 56 24 38 Z" fill="#DB2777" />
      <circle cx="50" cy="44" r="13" fill="#FED7AA" />
      <path d="M20 86 C20 74 34 72 50 72 C66 72 80 74 80 86 Z" fill="#BE185D" />
    </svg>
  `)}`,
};

/**
 * Generator Peserta Global Al-Qur'an (100% Menggunakan Avatar Islami Berhijab & Berpeci)
 */
export function getQuranGlobalLeaderboard(
  currentUserEntry?: LeaderboardUserEntry, 
  regionFilter?: string,
  sortMode: 'discipline' | 'xp' = 'discipline'
): LeaderboardUserEntry[] {
  const baseEntries: LeaderboardUserEntry[] = [
    {
      id: 'g-user-1',
      name: 'Muhammad Al-Fatih',
      avatarUrl: ISLAMIC_AVATARS.malePeci,
      quranSpaceCode: 'QRN-JKT-091',
      totalXp: 5420,
      quranXp: 5420,
      streakDays: 42,
      activePagesCount: 140,
      reviewedPagesCount: 380,
      disciplineRate: 98,
      disciplineScore: 98 * 10 + 42 * 5,
      tier: 'mutqin',
      tierTitleId: 'Mutqin Mumtaz (Penjaga Kokoh)',
      tierTitleAr: 'متقن ممتاز',
      region: 'DKI Jakarta & Banten',
      lastActive: '5 menit lalu',
      retentionRate: 98,
    },
    {
      id: 'g-user-2',
      name: 'Aisyah Humaira',
      avatarUrl: ISLAMIC_AVATARS.femaleHijabGreen,
      quranSpaceCode: 'QRN-SBY-112',
      totalXp: 4890,
      quranXp: 4890,
      streakDays: 35,
      activePagesCount: 110,
      reviewedPagesCount: 320,
      disciplineRate: 99,
      disciplineScore: 99 * 10 + 35 * 5,
      tier: 'mutqin',
      tierTitleId: 'Mutqin Mumtaz (Penjaga Kokoh)',
      tierTitleAr: 'متقن ممتاز',
      region: 'Jawa Timur',
      lastActive: '12 menit lalu',
      retentionRate: 97,
    },
    {
      id: 'g-user-3',
      name: 'Abdullah Azzam',
      avatarUrl: ISLAMIC_AVATARS.maleKufiTeal,
      quranSpaceCode: 'QRN-BDG-045',
      totalXp: 3950,
      quranXp: 3950,
      streakDays: 28,
      activePagesCount: 85,
      reviewedPagesCount: 260,
      disciplineRate: 96,
      disciplineScore: 96 * 10 + 28 * 5,
      tier: 'hafizh',
      tierTitleId: 'Hafizh Mujid (Penghafal Disiplin)',
      tierTitleAr: 'حافظ مجيد',
      region: 'Jawa Barat',
      lastActive: '30 menit lalu',
      retentionRate: 95,
    },
    {
      id: 'g-user-4',
      name: 'Fathimah Az-Zahra',
      avatarUrl: ISLAMIC_AVATARS.femaleHijabPurple,
      quranSpaceCode: 'QRN-YOG-201',
      totalXp: 3120,
      quranXp: 3120,
      streakDays: 21,
      activePagesCount: 65,
      reviewedPagesCount: 190,
      disciplineRate: 100,
      disciplineScore: 100 * 10 + 21 * 5,
      tier: 'hafizh',
      tierTitleId: 'Hafizh Mujid (Penghafal Disiplin)',
      tierTitleAr: 'حافظ مجيد',
      region: 'Jawa Tengah & DIY',
      lastActive: '1 jam lalu',
      retentionRate: 96,
    },
    {
      id: 'g-user-5',
      name: 'Zaid bin Tsabit',
      avatarUrl: ISLAMIC_AVATARS.maleSorbanNavy,
      quranSpaceCode: 'QRN-MDN-088',
      totalXp: 2450,
      quranXp: 2450,
      streakDays: 21,
      activePagesCount: 50,
      reviewedPagesCount: 145,
      disciplineRate: 95,
      disciplineScore: 95 * 10 + 21 * 5,
      tier: 'hafizh',
      tierTitleId: 'Hafizh Mujid (Penghafal Disiplin)',
      tierTitleAr: 'حافظ مجيد',
      region: 'Sumatera Utara & Aceh',
      lastActive: '2 jam lalu',
      retentionRate: 94,
    },
    {
      id: 'g-user-6',
      name: 'Salma Al-Khansa',
      avatarUrl: ISLAMIC_AVATARS.femaleHijabPink,
      quranSpaceCode: 'QRN-MKS-319',
      totalXp: 1850,
      quranXp: 1850,
      streakDays: 14,
      activePagesCount: 40,
      reviewedPagesCount: 110,
      disciplineRate: 97,
      disciplineScore: 97 * 10 + 14 * 5,
      tier: 'muwazhib',
      tierTitleId: 'Muwazhib (Penjaga Konsisten)',
      tierTitleAr: 'مواظب على الورد',
      region: 'Sulawesi Selatan',
      lastActive: '3 jam lalu',
      retentionRate: 93,
    },
    {
      id: 'g-user-7',
      name: 'Ibrahim Khalil',
      avatarUrl: ISLAMIC_AVATARS.malePeci,
      quranSpaceCode: 'QRN-KTM-502',
      totalXp: 1240,
      quranXp: 1240,
      streakDays: 14,
      activePagesCount: 28,
      reviewedPagesCount: 80,
      disciplineRate: 94,
      disciplineScore: 94 * 10 + 14 * 5,
      tier: 'muwazhib',
      tierTitleId: 'Muwazhib (Penjaga Konsisten)',
      tierTitleAr: 'مواظب على الورد',
      region: 'Kalimantan Timur & Barat',
      lastActive: 'Hari ini',
      retentionRate: 91,
    },
    {
      id: 'g-user-8',
      name: 'Khadijah Al-Kubra',
      avatarUrl: ISLAMIC_AVATARS.femaleHijabGreen,
      quranSpaceCode: 'QRN-KSA-007',
      totalXp: 890,
      quranXp: 890,
      streakDays: 7,
      activePagesCount: 20,
      reviewedPagesCount: 50,
      disciplineRate: 100,
      disciplineScore: 100 * 10 + 7 * 5,
      tier: 'thalib',
      tierTitleId: 'Thalib Mujtahid (Penuntut Tekun)',
      tierTitleAr: 'طالب مجتهد',
      region: 'Luar Negeri (Mesir, Saudi, Yaman)',
      lastActive: 'Hari ini',
      retentionRate: 92,
    },
  ];

  let list = [...baseEntries];

  if (currentUserEntry) {
    const existingIdx = list.findIndex(e => e.id === currentUserEntry.id);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...currentUserEntry, isCurrentUser: true };
    } else {
      list.push({ ...currentUserEntry, isCurrentUser: true });
    }
  }

  // Filter regional jika bukan Semua
  if (regionFilter && regionFilter !== 'Semua Wilayah (Nasional & Global)') {
    list = list.filter(item => item.isCurrentUser || item.region === regionFilter);
  }

  // Hitung rank XP dan rank Disiplin
  const byXp = [...list].sort((a, b) => b.totalXp - a.totalXp);
  const byDiscipline = [...list].sort((a, b) => 
    (b.disciplineScore || 0) - (a.disciplineScore || 0) || 
    (b.disciplineRate || 0) - (a.disciplineRate || 0)
  );

  const mapped = list.map(item => {
    const rXp = byXp.findIndex(x => x.id === item.id) + 1;
    const rDisc = byDiscipline.findIndex(x => x.id === item.id) + 1;
    return {
      ...item,
      rank: rXp,
      disciplineRank: rDisc,
    };
  });

  // Urutkan sesuai pilihan sortMode
  if (sortMode === 'discipline') {
    mapped.sort((a, b) => (a.disciplineRank || 999) - (b.disciplineRank || 999));
  } else {
    mapped.sort((a, b) => (a.rank || 999) - (b.rank || 999));
  }

  return mapped;
}

/**
 * Grup Lingkaran Al-Qur'an Keluarga / Sahabat Mandiri
 */
export function getSavedFriendshipGroups(userId: string): QuranFriendshipGroup[] {
  try {
    const key = `unlupa_friendship_groups_${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse friendship groups', e);
  }

  // Default contoh grup keluarga dengan avatar Islami
  return [
    {
      id: 'grp-family-1',
      name: 'Keluarga Besar Penghafal Al-Qur\'an',
      code: 'KELUARGA-8821',
      description: 'Grup murajaah harian keluarga besar untuk saling memotivasi & memantau keistiqomahan hafalan.',
      creatorId: userId,
      creatorName: 'Keluarga Kami',
      createdAt: new Date().toISOString(),
      members: [
        {
          id: userId,
          name: 'Saya (Anda)',
          avatarUrl: ISLAMIC_AVATARS.malePeci,
          totalXp: 1450,
          quranXp: 1450,
          streakDays: 9,
          activePagesCount: 30,
          reviewedPagesCount: 65,
          disciplineRate: 97,
          disciplineScore: 97 * 10 + 9 * 5,
          tier: 'muwazhib',
          tierTitleId: 'Muwazhib (Penjaga Konsisten)',
          tierTitleAr: 'مواظب على الورد',
          isCurrentUser: true,
          lastActive: 'Aktif sekarang',
          retentionRate: 96,
        },
        {
          id: 'fam-2',
          name: 'Kakak (Hafizh)',
          avatarUrl: ISLAMIC_AVATARS.maleKufiTeal,
          totalXp: 2180,
          quranXp: 2180,
          streakDays: 16,
          activePagesCount: 55,
          reviewedPagesCount: 160,
          disciplineRate: 96,
          disciplineScore: 96 * 10 + 16 * 5,
          tier: 'hafizh',
          tierTitleId: 'Hafizh Mujid (Penghafal Disiplin)',
          tierTitleAr: 'حافظ مجيد',
          lastActive: 'Pagi tadi',
          retentionRate: 98,
        },
        {
          id: 'fam-3',
          name: 'Adik (Ziyadah Juz 30)',
          avatarUrl: ISLAMIC_AVATARS.femaleHijabPink,
          totalXp: 820,
          quranXp: 820,
          streakDays: 6,
          activePagesCount: 15,
          reviewedPagesCount: 45,
          disciplineRate: 100,
          disciplineScore: 100 * 10 + 6 * 5,
          tier: 'thalib',
          tierTitleId: 'Thalib Mujtahid (Penuntut Tekun)',
          tierTitleAr: 'طالب مجتهد',
          lastActive: 'Kemarin',
          retentionRate: 92,
        },
        {
          id: 'fam-4',
          name: 'Ayah',
          avatarUrl: ISLAMIC_AVATARS.maleSorbanNavy,
          totalXp: 1620,
          quranXp: 1620,
          streakDays: 12,
          activePagesCount: 25,
          reviewedPagesCount: 80,
          disciplineRate: 94,
          disciplineScore: 94 * 10 + 12 * 5,
          tier: 'muwazhib',
          tierTitleId: 'Muwazhib (Penjaga Konsisten)',
          tierTitleAr: 'مواظب على الورد',
          lastActive: 'Subuh tadi',
          retentionRate: 94,
        },
        {
          id: 'fam-5',
          name: 'Ibu',
          avatarUrl: ISLAMIC_AVATARS.femaleHijabGreen,
          totalXp: 1940,
          quranXp: 1940,
          streakDays: 14,
          activePagesCount: 32,
          reviewedPagesCount: 95,
          disciplineRate: 98,
          disciplineScore: 98 * 10 + 14 * 5,
          tier: 'muwazhib',
          tierTitleId: 'Muwazhib (Penjaga Konsisten)',
          tierTitleAr: 'مواظب على الورد',
          lastActive: '1 jam lalu',
          retentionRate: 95,
        },
      ],
    },
  ];
}

export function saveFriendshipGroups(userId: string, groups: QuranFriendshipGroup[]): void {
  try {
    const key = `unlupa_friendship_groups_${userId}`;
    localStorage.setItem(key, JSON.stringify(groups));
  } catch (e) {
    console.warn('Failed to save friendship groups', e);
  }
}
