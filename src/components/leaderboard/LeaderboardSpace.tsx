import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { soundEffects } from '../../lib/soundFeedback';
import { isUserAdmin } from '../../services/authRbacService';
import { leaderboardApiService } from '../../services/leaderboardApiService';
import { wsService } from '../../services/websocketService';
import { 
  Trophy, 
  Flame, 
  BookOpen, 
  GraduationCap,
  CalendarCheck, 
  CheckCircle2, 
  Sparkles, 
  Search, 
  Globe, 
  BookMarked, 
  Info,
  Clock,
  TrendingUp,
  Award,
  Zap,
  Target
} from 'lucide-react';
import { 
  calculateUserGamificationStats, 
  getQuranGlobalLeaderboard, 
  INDONESIA_REGIONS,
  ISLAMIC_AVATARS,
  GAMIFICATION_LEVELS,
  GamificationRankTier,
  LeaderboardUserEntry
} from '../../services/gamificationService';

export const LeaderboardSpace: React.FC = () => {
  const { 
    userProfile, 
    quranPages, 
    items, 
    currentStreak, 
    myClasses, 
    language,
    joinClassByCode,
    setActiveSpace
  } = useApp();

  // Scope Utama:
  // 1. 'quran' = Peringkat Al-Qur'an (Terbuka, Nasional & Regional, serta Grup Keluarga)
  // 2. 'class' = Peringkat Kelas (Terdiri dari Kelas Al-Qur'an dan Kelas Kitab)
  const [mainScope, setMainScope] = useState<'quran' | 'class'>('quran');


  // Sub-kategori untuk Peringkat Kelas:
  // 'quran-class' = Kelas Al-Qur'an
  // 'non-quran-class' = Kelas Kitab
  const [classSubTab, setClassSubTab] = useState<'quran-class' | 'non-quran-class'>('quran-class');

  // DUA TOLOK UKUR PENILAIAN (Default: Akumulasi XP Terbanyak)
  // 'xp' = Akumulasi Riwayat Hafalan & Review (Total capaian ikhtiar hafalan dari awal bergabung)
  // 'discipline' = Kedisiplinan & Keistiqomahan (Tepat waktu murajaah & streak harian - adil bagi semua)
  const [rankingCriterion, setRankingCriterion] = useState<'discipline' | 'xp'>('xp');

  // Real Data Peringkat Santri Unlupa dari Server Database
  const [serverLeaderboard, setServerLeaderboard] = useState<LeaderboardUserEntry[]>([]);
  const [isLoadingServerLeaderboard, setIsLoadingServerLeaderboard] = useState<boolean>(true);

  // Ambil data peringkat global secara berkala dan tangkap event realtime via WebSocket
  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await leaderboardApiService.getGlobalLeaderboard();
      if (data && data.length > 0) {
        setServerLeaderboard(data);
      }
    } catch (err) {
      console.warn('[LeaderboardSpace] Gagal mengambil peringkat dari server:', err);
    } finally {
      setIsLoadingServerLeaderboard(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    // Dengarkan event WebSocket realtime: jika ada review murid/santri, refresh leaderboard otomatis
    const handleRealtimeReview = () => {
      fetchLeaderboard();
    };

    wsService.on('STUDENT_BOOK_REVIEWED', handleRealtimeReview);
    wsService.on('STUDENT_QURAN_REVIEWED', handleRealtimeReview);

    return () => {
      wsService.off('STUDENT_BOOK_REVIEWED', handleRealtimeReview);
      wsService.off('STUDENT_QURAN_REVIEWED', handleRealtimeReview);
    };
  }, [fetchLeaderboard]);

  // Filter Wilayah Regional Terbuka
  const [selectedRegion, setSelectedRegion] = useState<string>(INDONESIA_REGIONS[0]);

  // Pencarian Cepat Santri
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Daftar Kelas Santri
  const quranClasses = useMemo(() => {
    return (myClasses || []).filter(c => c.type === 'quran');
  }, [myClasses]);

  const nonQuranClasses = useMemo(() => {
    return (myClasses || []).filter(c => c.type === 'non-quran');
  }, [myClasses]);

  // ID Kelas terpilih
  const [selectedQuranClassId, setSelectedQuranClassId] = useState<string>(() => {
    return quranClasses[0]?.id || '';
  });

  const [selectedBookClassId, setSelectedBookClassId] = useState<string>(() => {
    return nonQuranClasses[0]?.id || '';
  });

  // Notifikasi Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isJoinClassModalOpen, setIsJoinClassModalOpen] = useState(false);
  const [joinClassCodeInput, setJoinClassCodeInput] = useState('');
  const [showXpPhilosophyModal, setShowXpPhilosophyModal] = useState(false);

  // Swipe navigation support for Leaderboard Space:
  // - Tutup modal pencarian / filosofi XP jika terbuka
  // - Usap ke kanan: kembali ke Ruang Mengajar (teaching)
  // - Usap ke kiri: berpindah ke Admin (jika admin) atau Beranda (dashboard)
  useSwipeGesture(null, {
    disabled: Boolean(typeof document !== 'undefined' && document.body.getAttribute('data-annotation-open') === 'true'),
    onSwipeRight: () => {
      if (isSearchModalOpen) {
        setIsSearchModalOpen(false);
        return;
      }
      if (showXpPhilosophyModal) {
        setShowXpPhilosophyModal(false);
        return;
      }
      if (isJoinClassModalOpen) {
        setIsJoinClassModalOpen(false);
        return;
      }
      soundEffects.playCardFlip('backward');
      setActiveSpace('teaching');
    },
    onSwipeDown: () => {
      if (isSearchModalOpen) setIsSearchModalOpen(false);
      else if (showXpPhilosophyModal) setShowXpPhilosophyModal(false);
      else if (isJoinClassModalOpen) setIsJoinClassModalOpen(false);
    },
    onSwipeLeft: () => {
      if (isSearchModalOpen || showXpPhilosophyModal || isJoinClassModalOpen) return;
      soundEffects.playCardFlip('forward');
      if (isUserAdmin(userProfile)) {
        setActiveSpace('admin');
      } else {
        setActiveSpace('dashboard');
      }
    },
    threshold: 40,
    minRatio: 1.15,
  });

  // Gamification Stats Pengguna Aktif (Dihitung secara proporsional: 25 XP basis + 2 XP/lembar + 50 XP Ziyadah)
  const userStats = useMemo(() => {
    return calculateUserGamificationStats(quranPages, items, currentStreak);
  }, [quranPages, items, currentStreak]);

  // Data Entri Pengguna Aktif (Sinkron dengan Real XP dari Server & Optimistic Local State)
  const currentUserEntry: LeaderboardUserEntry = useMemo(() => {
    const serverMe = serverLeaderboard.find(
      u => u.id === userProfile.id || (u.quranSpaceCode && u.quranSpaceCode === userProfile.quranSpaceCode)
    );
    const effectiveTotalXp = Math.max(userStats.totalXp, serverMe?.totalXp || 0);
    const effectiveQuranXp = Math.max(userStats.quranXp, serverMe?.quranXp || 0);
    const effectiveStreak = Math.max(currentStreak, serverMe?.streakDays || 1);

    return {
      id: userProfile.id,
      name: userProfile.fullName || 'Anda',
      avatarUrl: userProfile.avatarUrl || serverMe?.avatarUrl || ISLAMIC_AVATARS.malePeci,
      quranSpaceCode: userProfile.quranSpaceCode || serverMe?.quranSpaceCode || 'QRN-USER',
      totalXp: effectiveTotalXp,
      quranXp: effectiveQuranXp,
      streakDays: effectiveStreak,
      activePagesCount: Math.max(quranPages.filter(p => p.isActive).length, serverMe?.activePagesCount || 0),
      reviewedPagesCount: Math.max(userStats.reviewedPagesCount, serverMe?.reviewedPagesCount || 0),
      disciplineRate: userStats.disciplineRate,
      disciplineScore: userStats.disciplineScore,
      tier: userStats.currentTier,
      tierTitleId: userStats.tierTitleId,
      tierTitleAr: userStats.tierTitleAr,
      isCurrentUser: true,
      region: serverMe?.region || 'Indonesia',
      lastActive: 'Aktif saat ini',
      retentionRate: 98,
    };
  }, [userProfile, userStats, currentStreak, quranPages, serverLeaderboard]);

  // Peringkat Global Seluruh Pengguna Unlupa (Diurutkan berdasarkan akumulasi XP terbanyak)
  const globalLeaderboard = useMemo(() => {
    if (serverLeaderboard && serverLeaderboard.length > 0) {
      // Petakan seluruh user dari server database
      let list: LeaderboardUserEntry[] = serverLeaderboard.map((u) => {
        const isMe = u.id === userProfile.id || (u.quranSpaceCode && u.quranSpaceCode === userProfile.quranSpaceCode);
        if (isMe) {
          return {
            ...u,
            name: userProfile.fullName ? `${userProfile.fullName}` : u.name,
            avatarUrl: userProfile.avatarUrl || u.avatarUrl || ISLAMIC_AVATARS.malePeci,
            totalXp: Math.max(u.totalXp, currentUserEntry.totalXp),
            quranXp: Math.max(u.quranXp, currentUserEntry.quranXp),
            streakDays: Math.max(u.streakDays, currentStreak),
            activePagesCount: Math.max(u.activePagesCount, quranPages.filter(p => p.isActive).length),
            reviewedPagesCount: Math.max(u.reviewedPagesCount, userStats.reviewedPagesCount),
            disciplineRate: currentUserEntry.disciplineRate || u.disciplineRate,
            disciplineScore: currentUserEntry.disciplineScore || u.disciplineScore,
            isCurrentUser: true,
          };
        }
        return {
          ...u,
          avatarUrl: u.avatarUrl || ISLAMIC_AVATARS.malePeci,
          isCurrentUser: false,
        };
      });

      // Jika user yang aktif saat ini belum ada di data server (misal akun baru)
      const hasMe = list.some(u => u.isCurrentUser);
      if (!hasMe && currentUserEntry) {
        list.push({ ...currentUserEntry, isCurrentUser: true });
      }

      // Filter regional jika bukan 'Semua Wilayah (Nasional & Global)'
      if (selectedRegion && selectedRegion !== 'Semua Wilayah (Nasional & Global)') {
        list = list.filter(u => u.isCurrentUser || u.region === selectedRegion);
      }

      // Urutkan berdasarkan kriteria ranking (Default: XP terbanyak di seluruh Unlupa)
      if (rankingCriterion === 'xp') {
        list.sort((a, b) => b.totalXp - a.totalXp);
      } else {
        list.sort((a, b) => 
          (b.disciplineScore || 0) - (a.disciplineScore || 0) || 
          (b.disciplineRate || 0) - (a.disciplineRate || 0)
        );
      }

      return list.map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));
    }

    // Fallback jika server belum selesai memuat atau offline
    return getQuranGlobalLeaderboard(currentUserEntry, selectedRegion, rankingCriterion);
  }, [serverLeaderboard, currentUserEntry, userProfile, currentStreak, quranPages, userStats, selectedRegion, rankingCriterion]);


  // Santri di Halaqah Al-Qur'an Terpilih
  const selectedQuranClass = useMemo(() => {
    return quranClasses.find(c => c.id === selectedQuranClassId) || quranClasses[0];
  }, [quranClasses, selectedQuranClassId]);

  const quranClassStudentsSorted = useMemo(() => {
    if (!selectedQuranClass) return [];
    const list = (selectedQuranClass.students || []).map((std) => {
      const isMe = std.id === `std-user-${userProfile.id}` || std.id === userProfile.id;
      const pagesCount = isMe ? quranPages.filter(p => p.isActive).length : std.activeItemsCount;
      const streak = isMe ? currentStreak : Math.max(3, (std.averageStability || 10) > 15 ? 14 : 7);
      const reviewedCount = isMe ? userStats.reviewedPagesCount : Math.round(pagesCount * 2.5);
      const discRate = isMe ? userStats.disciplineRate : Math.min(100, Math.max(80, std.retentionRate || 95));
      const discScore = isMe ? userStats.disciplineScore : Math.round(discRate * 10 + streak * 5);
      const xp = isMe ? userStats.quranXp : Math.round(25 + reviewedCount * 2 + discRate * 8 + streak * 50);
      
      let tier: GamificationRankTier = 'mubtadi';
      let titleId = GAMIFICATION_LEVELS[0].titleId;
      let titleAr = GAMIFICATION_LEVELS[0].titleAr;
      for (let i = GAMIFICATION_LEVELS.length - 1; i >= 0; i--) {
        if (xp >= GAMIFICATION_LEVELS[i].minXp) {
          tier = GAMIFICATION_LEVELS[i].tier;
          titleId = GAMIFICATION_LEVELS[i].titleId;
          titleAr = GAMIFICATION_LEVELS[i].titleAr;
          break;
        }
      }

      return {
        id: std.id,
        name: isMe ? `${userProfile.fullName} (Anda)` : std.name,
        avatarUrl: std.avatarUrl || ISLAMIC_AVATARS.malePeci,
        quranSpaceCode: std.quranSpaceCode,
        totalXp: xp,
        quranXp: xp,
        streakDays: streak,
        activePagesCount: pagesCount,
        reviewedPagesCount: reviewedCount,
        disciplineRate: discRate,
        disciplineScore: discScore,
        tier,
        tierTitleId: titleId,
        tierTitleAr: titleAr,
        isCurrentUser: isMe,
        lastActive: std.lastActive,
        retentionRate: std.retentionRate,
      };
    });

    if (rankingCriterion === 'discipline') {
      list.sort((a, b) => 
        (b.disciplineScore || 0) - (a.disciplineScore || 0) || 
        (b.disciplineRate || 0) - (a.disciplineRate || 0)
      );
    } else {
      list.sort((a, b) => b.totalXp - a.totalXp);
    }

    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [selectedQuranClass, userProfile, quranPages, currentStreak, userStats, rankingCriterion]);

  // Santri di Kelas Non Al-Qur'an (Kitab) Terpilih
  const selectedBookClass = useMemo(() => {
    return nonQuranClasses.find(c => c.id === selectedBookClassId) || nonQuranClasses[0];
  }, [nonQuranClasses, selectedBookClassId]);

  const bookClassStudentsSorted = useMemo(() => {
    if (!selectedBookClass) return [];
    const list = (selectedBookClass.students || []).map((std) => {
      const isMe = std.id === `std-user-${userProfile.id}` || std.id === userProfile.id;
      const itemsCount = isMe ? items.filter(i => i.isActive).length : std.activeItemsCount;
      const streak = isMe ? currentStreak : Math.max(4, Math.round((std.averageStability || 12) / 2));
      const discRate = isMe ? userStats.disciplineRate : Math.min(100, Math.max(82, std.retentionRate || 94));
      const discScore = isMe ? userStats.disciplineScore : Math.round(discRate * 10 + streak * 5);
      const xp = isMe ? (userStats.totalXp - userStats.quranXp) + itemsCount * 5 : Math.round(15 + itemsCount * 2 + streak * 30 + discRate * 6);

      let tier: GamificationRankTier = 'mubtadi';
      let titleId = GAMIFICATION_LEVELS[0].titleId;
      let titleAr = GAMIFICATION_LEVELS[0].titleAr;
      for (let i = GAMIFICATION_LEVELS.length - 1; i >= 0; i--) {
        if (xp >= GAMIFICATION_LEVELS[i].minXp) {
          tier = GAMIFICATION_LEVELS[i].tier;
          titleId = GAMIFICATION_LEVELS[i].titleId;
          titleAr = GAMIFICATION_LEVELS[i].titleAr;
          break;
        }
      }

      return {
        id: std.id,
        name: isMe ? `${userProfile.fullName} (Anda)` : std.name,
        avatarUrl: std.avatarUrl || ISLAMIC_AVATARS.malePeci,
        totalXp: xp,
        quranXp: 0,
        streakDays: streak,
        activePagesCount: itemsCount,
        reviewedPagesCount: itemsCount,
        disciplineRate: discRate,
        disciplineScore: discScore,
        tier,
        tierTitleId: titleId,
        tierTitleAr: titleAr,
        isCurrentUser: isMe,
        lastActive: std.lastActive,
        retentionRate: std.retentionRate,
      };
    });

    if (rankingCriterion === 'discipline') {
      list.sort((a, b) => 
        (b.disciplineScore || 0) - (a.disciplineScore || 0) || 
        (b.disciplineRate || 0) - (a.disciplineRate || 0)
      );
    } else {
      list.sort((a, b) => b.totalXp - a.totalXp);
    }

    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [selectedBookClass, userProfile, items, currentStreak, userStats, rankingCriterion]);

  // Hasil Pencarian Cepat
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return globalLeaderboard.filter(u => 
      u.name.toLowerCase().includes(q) || 
      (u.region && u.region.toLowerCase().includes(q)) ||
      (u.tierTitleId && u.tierTitleId.toLowerCase().includes(q))
    );
  }, [globalLeaderboard, searchQuery]);

  // Menentukan Posisi Santri Saat Ini di Peringkat Aktif
  const activeRankingContext = useMemo(() => {
    let currentList: LeaderboardUserEntry[] = globalLeaderboard;
    let scopeName = "Nasional (Seluruh Santri Unlupa)";

    if (mainScope === 'class') {
      if (classSubTab === 'quran-class') {
        currentList = quranClassStudentsSorted;
        scopeName = selectedQuranClass?.name || "Kelas Al-Qur'an";
      } else {
        currentList = bookClassStudentsSorted;
        scopeName = selectedBookClass?.name || "Kelas Kitab";
      }
    }

    const myIndex = currentList.findIndex(u => u.isCurrentUser || u.id === userProfile.id);
    const myRank = myIndex >= 0 ? myIndex + 1 : 1;
    const totalParticipants = currentList.length;
    const userAboveMe = myIndex > 0 ? currentList[myIndex - 1] : null;

    let pointsToNext = 0;
    if (userAboveMe) {
      if (rankingCriterion === 'discipline') {
        const myScore = currentUserEntry.disciplineScore || 0;
        const aboveScore = userAboveMe.disciplineScore || 0;
        pointsToNext = Math.max(1, aboveScore - myScore);
      } else {
        const myXp = currentUserEntry.totalXp;
        const aboveXp = userAboveMe.totalXp;
        pointsToNext = Math.max(1, aboveXp - myXp);
      }
    }

    return {
      myRank,
      totalParticipants,
      scopeName,
      userAboveMe,
      pointsToNext,
    };
  }, [
    mainScope, 
    classSubTab, 
    globalLeaderboard, 
    quranClassStudentsSorted, 
    bookClassStudentsSorted, 
    userProfile.id, 
    selectedQuranClass, 
    selectedBookClass,
    rankingCriterion,
    currentUserEntry
  ]);

  const handleJoinClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinClassCodeInput.trim().toUpperCase();
    if (!code) return;

    const res = await joinClassByCode(code);
    setIsJoinClassModalOpen(false);
    setJoinClassCodeInput('');
    if (res.success) {
      setToastMessage(`Berhasil bergabung ke kelas!`);
    } else {
      setToastMessage(res.message || 'Kode kelas tidak ditemukan');
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  // SVG Ring Progress Calculations
  const disciplineRingPct = userStats.disciplineRate;
  const streakMilestonePct = Math.min(100, Math.round((currentStreak / Math.max(1, userStats.currentMilestoneDays)) * 100));
  const activeQuranPct = Math.min(100, Math.round((quranPages.filter(p => p.isActive).length / 604) * 100));

  // Ring 1 (Outer - Emerald: Disiplin Waktu)
  const r1 = 32;
  const c1 = 2 * Math.PI * r1;
  const strokeOffset1 = c1 - (disciplineRingPct / 100) * c1;

  // Ring 2 (Middle - Coral: Streak Istiqamah)
  const r2 = 23;
  const c2 = 2 * Math.PI * r2;
  const strokeOffset2 = c2 - (streakMilestonePct / 100) * c2;

  // Ring 3 (Inner - Indigo: Ziyadah / Hafalan Aktif)
  const r3 = 15;
  const c3 = 2 * Math.PI * r3;
  const strokeOffset3 = c3 - (activeQuranPct / 100) * c3;

  return (
    <div className="space-y-4 pb-20 md:pb-10 max-w-5xl mx-auto">
      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-[#18234A] text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border border-white/20 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* HEADER BAR: Ruang Peringkat & Pencarian Santri                 */}
      {/* ============================================================== */}
      <div className="flex items-center justify-between w-full mb-2 gap-2 flex-nowrap">
        {/* Left: Judul Ruang Peringkat Bersih & Anggun */}
        <div className="flex items-center gap-2 shrink-0">
          <h1 className="text-base sm:text-xl md:text-2xl font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight shrink-0 clay-title whitespace-nowrap">
            {language === 'en' ? 'Ranking Space' : language === 'id' ? 'Ruang Peringkat' : 'لوحة الصدارة'}
          </h1>
        </div>

        {/* Right: Kolom Pencarian Cepat Santri (Kompak & Responsif) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="w-7 h-7 sm:w-auto sm:h-9 px-0 sm:pl-3 sm:pr-3.5 rounded-xl sm:rounded-2xl clay-inset flex items-center justify-center sm:gap-2 text-xs font-semibold text-[#8E9BAE] hover:text-[#18234A] dark:hover:text-[#F8FAFC] transition-all cursor-pointer group shadow-2xs shrink-0"
            title={language === 'en' ? 'Search santri...' : 'Cari santri...'}
          >
            <Search className="w-3.5 h-3.5 text-[#FF6F3D] group-hover:scale-110 transition-transform shrink-0" />
            <span className="hidden sm:inline truncate">{language === 'en' ? 'Search santri...' : 'Cari santri...'}</span>
            <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white/70 dark:bg-black/20 rounded shadow-2xs border border-black/5 dark:border-white/5">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BANNER NOTICE: FITUR DALAM TAHAP PENGEMBANGAN (BETA)           */}
      {/* ============================================================== */}
      <div className="neumorph-card p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-amber-500/25 bg-gradient-to-r from-amber-500/[0.08] via-orange-500/[0.04] to-transparent flex items-start sm:items-center gap-3 shadow-xs">
        <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 ring-1 ring-amber-500/20">
          <Sparkles className="w-5 h-5 animate-pulse text-amber-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-xs sm:text-sm font-black text-[#18234A] dark:text-[#F8FAFC]">
              Fitur Leaderboard Sedang Dalam Tahap Pengembangan
            </h3>
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              Versi Beta
            </span>
          </div>
          <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] leading-relaxed">
            Saat ini antarmuka peringkat menghimpun <strong>Peringkat Al-Qur'an tingkat Nasional</strong> dari seluruh santri di Unlupa secara real-time berdasarkan total perolehan XP dan keistiqomahan murajaah harian. Fitur liga berkala, filter daerah lanjutan, dan penghargaan khusus sedang disempurnakan.
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* KARTU HERO PERSONAL (KOMPAK, MINIMALIS, & DI ATAS)             */}
      {/* Dinamis bereaksi terhadap ruang lingkup & tolak ukur aktif     */}
      {/* ============================================================== */}
      <section className="neumorph-card p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-white/70 dark:border-white/5 relative overflow-hidden bg-gradient-to-br from-white/40 via-transparent to-orange-500/[0.03]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Kolom 1: Profil Santri, Posisi Peringkat & Ruang Lingkup */}
          <div className="flex items-center gap-3 min-w-0 w-full lg:w-auto">
            <div className="relative shrink-0">
              <img 
                src={userProfile.avatarUrl || ISLAMIC_AVATARS.malePeci} 
                alt={userProfile.fullName} 
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover ring-2 ring-[#FF6F3D]/25 shadow-xs"
              />
              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-black uppercase shadow-xs flex items-center gap-0.5">
                <Trophy className="w-2.5 h-2.5" />
                <span>#{activeRankingContext.myRank}</span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight truncate">
                  {userProfile.fullName}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-orange-500/10 text-[#FF6F3D] border border-orange-500/20">
                  {userStats.tierTitleId}
                </span>
              </div>

              <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-medium mt-0.5 truncate">
                Peringkat <strong>#{activeRankingContext.myRank}</strong> dari {activeRankingContext.totalParticipants} santri di <em className="text-[#18234A] dark:text-[#F8FAFC] not-italic font-bold">{activeRankingContext.scopeName}</em>
              </p>

              {/* Status Selisih Poin / Motivasi Kompak */}
              <div className="mt-1.5 text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1.5 w-fit">
                <Zap className="w-3 h-3 text-emerald-500 shrink-0" />
                {activeRankingContext.myRank === 1 ? (
                  <span>Mabruk! Anda saat ini memimpin di posisi puncak.</span>
                ) : activeRankingContext.userAboveMe ? (
                  <span>Berjarak <strong>{activeRankingContext.pointsToNext} poin</strong> dari peringkat #{activeRankingContext.myRank - 1}.</span>
                ) : (
                  <span>Istiqamah murajaah tepat waktu untuk menaikkan peringkat.</span>
                )}
              </div>
            </div>
          </div>

          {/* Kolom 2: Diagram Cincin (Multi-Ring Chart) Kompak & Presisi */}
          <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-2.5 rounded-2xl neumorph-inset shrink-0 w-full lg:w-auto justify-center lg:justify-start">
            <div className="relative w-18 h-18 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 76 76">
                {/* Background Tracks */}
                <circle cx="38" cy="38" r={r1} stroke="currentColor" strokeWidth="4.5" fill="transparent" className="text-black/5 dark:text-white/5" />
                <circle cx="38" cy="38" r={r2} stroke="currentColor" strokeWidth="4.5" fill="transparent" className="text-black/5 dark:text-white/5" />

                {/* Ring 1 (Luar: Disiplin Waktu - Emerald) */}
                <circle
                  cx="38"
                  cy="38"
                  r={r1}
                  stroke="#10B981"
                  strokeWidth="4.5"
                  strokeDasharray={c1}
                  strokeDashoffset={strokeOffset1}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />

                {/* Ring 2 (Dalam: Streak Istiqamah - Orange) */}
                <circle
                  cx="38"
                  cy="38"
                  r={r2}
                  stroke="#FF6F3D"
                  strokeWidth="4.5"
                  strokeDasharray={c2}
                  strokeDashoffset={strokeOffset2}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              {/* Pusat Cincin: Posisi Peringkat Santri */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[11px] sm:text-xs font-black text-[#18234A] dark:text-[#F8FAFC] leading-none">
                  #{activeRankingContext.myRank}
                </span>
                <span className="text-[7px] font-bold text-[#8E9BAE] uppercase tracking-tighter mt-0.5">
                  Posisi
                </span>
              </div>
            </div>

            {/* Legenda Ring Kompak */}
            <div className="space-y-1 text-left text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
                <span className="text-[#5E6D88] dark:text-[#94A3B8]">Kedisiplinan:</span>
                <strong className="text-[#18234A] dark:text-[#F8FAFC] font-black">{userStats.disciplineRate}%</strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF6F3D] shrink-0" />
                <span className="text-[#5E6D88] dark:text-[#94A3B8]">Streak:</span>
                <strong className="text-[#18234A] dark:text-[#F8FAFC] font-black">{currentStreak} hari</strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#6366F1] shrink-0" />
                <span className="text-[#5E6D88] dark:text-[#94A3B8]">Ziyadah Aktif:</span>
                <strong className="text-[#18234A] dark:text-[#F8FAFC] font-black">{quranPages.filter(p => p.isActive).length} hal</strong>
              </div>
            </div>
          </div>

          {/* Kolom 3: 3 Kotak Rincian Proporsional & Nilai Aktif */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full lg:w-auto shrink-0">
            {/* Box 1: Tolok Ukur Aktif */}
            <div className="p-2 rounded-xl neumorph-card flex flex-col justify-between text-center min-w-[70px] sm:min-w-[78px]">
              <span className="text-[8px] sm:text-[9px] font-black uppercase text-[#5E6D88] dark:text-[#94A3B8]">
                {rankingCriterion === 'discipline' ? 'Skor Disiplin' : 'Total XP'}
              </span>
              <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 my-0.5">
                {rankingCriterion === 'discipline' 
                  ? `${(currentUserEntry.disciplineScore || (currentUserEntry.disciplineRate || 95) * 10).toLocaleString()} pt`
                  : currentUserEntry.totalXp.toLocaleString()}
              </span>
              <span className="text-[8px] text-[#5E6D88] dark:text-[#94A3B8]">
                {rankingCriterion === 'discipline' ? 'Tepat Waktu' : 'Riwayat'}
              </span>
            </div>

            {/* Box 2: Basis Disiplin */}
            <div className="p-2 rounded-xl neumorph-card flex flex-col justify-between text-center min-w-[70px] sm:min-w-[78px]">
              <span className="text-[8px] sm:text-[9px] font-black uppercase text-[#5E6D88] dark:text-[#94A3B8]">Basis Disiplin</span>
              <span className="text-xs sm:text-sm font-black text-[#FF6F3D] my-0.5">+25 XP</span>
              <span className="text-[8px] text-[#5E6D88] dark:text-[#94A3B8]">Per Hari</span>
            </div>

            {/* Box 3: Pengulangan Lembar */}
            <div className="p-2 rounded-xl neumorph-card flex flex-col justify-between text-center min-w-[70px] sm:min-w-[78px]">
              <span className="text-[8px] sm:text-[9px] font-black uppercase text-[#5E6D88] dark:text-[#94A3B8]">Ulang Lembar</span>
              <span className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400 my-0.5">+{userStats.reviewedPagesCount * 2} XP</span>
              <span className="text-[8px] text-[#5E6D88] dark:text-[#94A3B8]">2 XP/Lembar</span>
            </div>
          </div>
        </div>

        {/* Footer Baris Ringkas: Filosofi Poin */}
        <div className="mt-2.5 pt-2 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between gap-2 text-[10px]">
          <div className="flex items-center gap-1.5 text-[#5E6D88] dark:text-[#94A3B8] truncate">
            <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">Penilaian adil: +25 XP basis kedisiplinan penuh, +2 XP/lembar murajaah, dan +50 XP ziyadah.</span>
          </div>

          <button
            type="button"
            onClick={() => setShowXpPhilosophyModal(true)}
            className="text-[#FF6F3D] hover:underline cursor-pointer font-bold shrink-0 flex items-center gap-0.5"
          >
            <span>Filosofi Poin</span>
          </button>
        </div>
      </section>

      {/* ============================================================== */}
      {/* NAVIGASI RUANG LINGKUP & TOLOK UKUR PENILAIAN                   */}
      {/* Terletak Tepat di Bawah Kartu Hero                              */}
      {/* ============================================================== */}
      <div className="space-y-2.5">
        {/* Baris 1: 2 Pilar Utama (Peringkat Al-Qur'an vs Peringkat Kelas) & Tolok Ukur Penilaian */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Main Scope Tabs */}
          <div className="p-1 rounded-2xl clay-inset flex gap-1 w-full sm:w-fit">
            {/* Pilar 1: Peringkat Al-Qur'an */}
            <button
              type="button"
              onClick={() => setMainScope('quran')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mainScope === 'quran'
                  ? 'clay-btn-primary text-white shadow-xs'
                  : 'text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Peringkat Al-Qur'an</span>
            </button>

            {/* Pilar 2: Peringkat Kelas (Sesuai arahan: satu aja 'Peringkat Kelas') */}
            <button
              type="button"
              onClick={() => setMainScope('class')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mainScope === 'class'
                  ? 'clay-btn-primary text-white shadow-xs'
                  : 'text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Peringkat Kelas</span>
            </button>
          </div>

          {/* Tolok Ukur Penilaian (Default: Kedisiplinan & Keistiqomahan) */}
          <div className="p-1 rounded-xl clay-inset flex gap-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setRankingCriterion('discipline')}
              className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                rankingCriterion === 'discipline'
                  ? 'clay-btn-primary text-white shadow-2xs'
                  : 'text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]'
              }`}
              title="Urutkan berdasarkan persentase tepat waktu & streak harian (adil bagi semua santri)"
            >
              <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Kedisiplinan & Keistiqomahan</span>
            </button>

            <button
              type="button"
              onClick={() => setRankingCriterion('xp')}
              className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                rankingCriterion === 'xp'
                  ? 'clay-btn-primary text-white shadow-2xs'
                  : 'text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]'
              }`}
              title="Urutkan berdasarkan akumulasi total riwayat capaian hafalan dari awal bergabung"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Akumulasi Riwayat</span>
            </button>
          </div>
        </div>

        {/* Baris 2: Sub-lingkup Hanya Untuk Peringkat Kelas */}
        {mainScope === 'class' && (
          <div className="flex items-center gap-2 border-b border-black/[0.05] dark:border-white/[0.05] pb-2 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setClassSubTab('quran-class')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                classSubTab === 'quran-class'
                  ? 'clay-pill text-[#FF6F3D] shadow-2xs font-black'
                  : 'text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#FF6F3D]" />
              <span>Kelas Al-Qur'an</span>
            </button>

            <button
              type="button"
              onClick={() => setClassSubTab('non-quran-class')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                classSubTab === 'non-quran-class'
                  ? 'clay-pill text-[#FF6F3D] shadow-2xs font-black'
                  : 'text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5 text-amber-500" />
              <span>Kelas Kitab</span>
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 1. TAB KONTEN: PERINGKAT AL-QUR'AN (NASIONAL)                   */}
      {/* ============================================================== */}
      {mainScope === 'quran' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {/* Cakupan Wilayah Nasional Santri Unlupa & Status Realtime */}
            <div className="flex items-center justify-between gap-2 neumorph-card p-2.5 sm:p-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#FF6F3D]" />
                  <span className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC]">Cakupan: Nasional (Seluruh Santri Unlupa)</span>
                </div>
                <div className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Leaderboard Aktif</span>
                </div>
              </div>

              <span className="text-[11px] font-bold text-[#5E6D88] dark:text-[#94A3B8]">
                {globalLeaderboard.length} Santri Terdaftar
              </span>
            </div>

              {/* Tabel Peringkat Seluruh Pengguna Unlupa Terbuka */}
              <div className="neumorph-card rounded-2xl overflow-hidden border border-white/60 dark:border-white/5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black/[0.05] dark:border-white/[0.05] text-[10px] font-black uppercase text-[#5E6D88] dark:text-[#94A3B8] bg-black/[0.01]">
                        <th className="py-2.5 px-3 w-10 text-center">Rank</th>
                        <th className="py-2.5 px-3">Santri</th>
                        <th className="py-2.5 px-3 hidden sm:table-cell">Wilayah</th>
                        <th className="py-2.5 px-3 text-center">Streak</th>
                        <th className="py-2.5 px-3 text-center">
                          {rankingCriterion === 'discipline' ? 'Disiplin Waktu' : 'Hafalan Aktif'}
                        </th>
                        <th className="py-2.5 px-3 text-right">
                          {rankingCriterion === 'discipline' ? 'Skor Disiplin' : 'Total XP'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.03] text-xs font-medium">
                      {isLoadingServerLeaderboard && globalLeaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-[#5E6D88]">
                            <div className="flex items-center justify-center gap-2">
                              <Sparkles className="w-4 h-4 animate-spin text-[#FF6F3D]" />
                              <span>Memuat data peringkat santri Unlupa...</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        globalLeaderboard.map((user, idx) => {
                          const currentRank = rankingCriterion === 'discipline' ? (user.disciplineRank || idx + 1) : (user.rank || idx + 1);
                          return (
                            <tr 
                              key={user.id} 
                              className={`transition-colors ${
                                user.isCurrentUser 
                                  ? 'bg-[#FF6F3D]/10 font-bold' 
                                  : 'hover:bg-black/[0.02]'
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center">
                                {currentRank === 1 ? '🥇' : currentRank === 2 ? '🥈' : currentRank === 3 ? '🥉' : `#${currentRank}`}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={user.avatarUrl || ISLAMIC_AVATARS.malePeci} 
                                    alt={user.name} 
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = ISLAMIC_AVATARS.malePeci;
                                    }}
                                    className="w-7 h-7 rounded-xl object-cover shrink-0 ring-1 ring-black/10" 
                                  />
                                  <div className="min-w-0">
                                    <span className="font-bold text-[#18234A] dark:text-[#F8FAFC] truncate block">
                                      {user.name} {user.isCurrentUser && '(Anda)'}
                                    </span>
                                    <span className="text-[9px] text-[#5E6D88] block truncate">
                                      {user.tierTitleId}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            <td className="py-2.5 px-3 hidden sm:table-cell text-[#5E6D88] text-[11px]">
                              {user.region}
                            </td>
                            <td className="py-2.5 px-3 text-center text-orange-500 font-bold">
                              {user.streakDays}h
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {rankingCriterion === 'discipline' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  {user.disciplineRate || 95}% Tepat
                                </span>
                              ) : (
                                <span className="text-[#5E6D88]">
                                  {user.activePagesCount} hal
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-[#18234A] dark:text-[#F8FAFC]">
                              {rankingCriterion === 'discipline' 
                                ? `${(user.disciplineScore || (user.disciplineRate || 95) * 10).toLocaleString()} pt` 
                                : user.totalXp.toLocaleString()}
                            </td>
                          </tr>
                        );
                      }))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* ============================================================== */}
      {/* 2. TAB KONTEN: PERINGKAT KELAS                                 */}
      {/* ============================================================== */}
      {mainScope === 'class' && (
        <div className="space-y-4">
          {/* Sub Kategori 1: Kelas Al-Qur'an */}
          {classSubTab === 'quran-class' && (
            <div className="space-y-3">
              {quranClasses.length > 0 ? (
                <>
                  <div className="neumorph-card p-2.5 sm:p-3 rounded-2xl flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC]">Pilih Kelas Al-Qur'an:</span>
                    <select
                      value={selectedQuranClassId}
                      onChange={(e) => setSelectedQuranClassId(e.target.value)}
                      className="bg-[#EBEEF5] dark:bg-[#10192A] text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] px-3 py-1.5 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#FF6F3D] cursor-pointer"
                    >
                      {quranClasses.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name} ({cls.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="neumorph-card rounded-2xl overflow-hidden border border-white/60 dark:border-white/5">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-black/[0.05] text-[10px] font-black uppercase text-[#5E6D88] bg-black/[0.01]">
                          <th className="py-2.5 px-3 w-10 text-center">Rank</th>
                          <th className="py-2.5 px-3">Santri</th>
                          <th className="py-2.5 px-3 text-center">Streak</th>
                          <th className="py-2.5 px-3 text-center">
                            {rankingCriterion === 'discipline' ? 'Disiplin Waktu' : 'Hafalan Aktif'}
                          </th>
                          <th className="py-2.5 px-3 text-right">
                            {rankingCriterion === 'discipline' ? 'Skor Disiplin' : 'Total XP'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.03]">
                        {quranClassStudentsSorted.map((student, idx) => {
                          const rankNum = idx + 1;
                          return (
                            <tr key={student.id} className={student.isCurrentUser ? 'bg-[#FF6F3D]/10 font-bold' : ''}>
                              <td className="py-2.5 px-3 text-center">
                                {rankNum === 1 ? '🥇' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : `#${rankNum}`}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <img src={student.avatarUrl || ISLAMIC_AVATARS.malePeci} alt={student.name} className="w-6 h-6 rounded-lg object-cover" />
                                  <span>{student.name}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center text-orange-500 font-bold">{student.streakDays}h</td>
                              <td className="py-2.5 px-3 text-center">
                                {rankingCriterion === 'discipline' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    {student.disciplineRate || 95}% Tepat
                                  </span>
                                ) : (
                                  <span className="text-[#5E6D88]">{student.activePagesCount} hal</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-black">
                                {rankingCriterion === 'discipline' 
                                  ? `${(student.disciplineScore || (student.disciplineRate || 95) * 10).toLocaleString()} pt` 
                                  : student.totalXp.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="neumorph-card p-6 rounded-2xl text-center space-y-2">
                  <BookOpen className="w-8 h-8 text-sky-500 mx-auto" />
                  <h4 className="font-bold text-xs text-[#18234A] dark:text-[#F8FAFC]">Belum Tergabung di Kelas Al-Qur'an</h4>
                  <p className="text-[11px] text-[#5E6D88]">Masukkan kode kelas dari ustadz/guru untuk melihat peringkat santri sekelas.</p>
                  <button
                    type="button"
                    onClick={() => setIsJoinClassModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white text-xs font-bold cursor-pointer"
                  >
                    Gabung Kelas Al-Qur'an
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sub Kategori 2: Kelas Kitab */}
          {classSubTab === 'non-quran-class' && (
            <div className="space-y-3">
              {nonQuranClasses.length > 0 ? (
                <>
                  <div className="neumorph-card p-2.5 sm:p-3 rounded-2xl flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC]">Pilih Kelas Kitab:</span>
                    <select
                      value={selectedBookClassId}
                      onChange={(e) => setSelectedBookClassId(e.target.value)}
                      className="bg-[#EBEEF5] dark:bg-[#10192A] text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] px-3 py-1.5 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#FF6F3D] cursor-pointer"
                    >
                      {nonQuranClasses.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name} ({cls.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="neumorph-card rounded-2xl overflow-hidden border border-white/60 dark:border-white/5">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-black/[0.05] text-[10px] font-black uppercase text-[#5E6D88] bg-black/[0.01]">
                          <th className="py-2.5 px-3 w-10 text-center">Rank</th>
                          <th className="py-2.5 px-3">Nama Santri</th>
                          <th className="py-2.5 px-3 text-center">Streak</th>
                          <th className="py-2.5 px-3 text-center">Materi Aktif</th>
                          <th className="py-2.5 px-3 text-right">
                            {rankingCriterion === 'discipline' ? 'Skor Disiplin' : 'XP Kitab'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.03]">
                        {bookClassStudentsSorted.map((student, idx) => {
                          const rankNum = idx + 1;
                          return (
                            <tr key={student.id} className={student.isCurrentUser ? 'bg-[#FF6F3D]/10 font-bold' : ''}>
                              <td className="py-2.5 px-3 text-center">
                                {rankNum === 1 ? '🥇' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : `#${rankNum}`}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <img src={student.avatarUrl || ISLAMIC_AVATARS.malePeci} alt={student.name} className="w-6 h-6 rounded-lg object-cover" />
                                  <span>{student.name}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center text-orange-500 font-bold">{student.streakDays}h</td>
                              <td className="py-2.5 px-3 text-center text-[#5E6D88]">{student.activePagesCount} materi</td>
                              <td className="py-2.5 px-3 text-right font-black">
                                {rankingCriterion === 'discipline'
                                  ? `${(student.disciplineScore || (student.disciplineRate || 95) * 10).toLocaleString()} pt`
                                  : student.totalXp.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="neumorph-card p-6 rounded-2xl text-center space-y-2">
                  <BookMarked className="w-8 h-8 text-amber-500 mx-auto" />
                  <h4 className="font-bold text-xs text-[#18234A] dark:text-[#F8FAFC]">Belum Tergabung di Kelas Kitab</h4>
                  <p className="text-[11px] text-[#5E6D88]">Peringkat materi kitab berlaku di dalam kelas santri yang mempelajari kitab yang sama.</p>
                  <button
                    type="button"
                    onClick={() => setIsJoinClassModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white text-xs font-bold cursor-pointer"
                  >
                    Gabung Kelas Kitab
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: LIVE SEARCH SANTRI                                      */}
      {/* ============================================================== */}
      {isSearchModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsSearchModalOpen(false)}
        >
          <div 
            className="neumorph-card bg-[#EEF2F7] dark:bg-[#141C2B] p-4 rounded-3xl max-w-sm w-full space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-black/[0.05]">
              <h3 className="font-bold text-xs text-[#18234A] dark:text-[#F8FAFC]">Cari Santri</h3>
              <button onClick={() => setIsSearchModalOpen(false)} className="text-xs text-[#5E6D88] font-bold cursor-pointer">✕</button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama santri atau wilayah..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#EBEEF5] dark:bg-[#10192A] text-xs font-medium border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#FF6F3D]"
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1 pr-1 text-xs">
              {searchResults.length > 0 ? (
                searchResults.slice(0, 6).map(u => (
                  <div
                    key={u.id}
                    onClick={() => setIsSearchModalOpen(false)}
                    className="p-2 rounded-xl neumorph-card flex items-center justify-between cursor-pointer hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-2">
                      <img src={u.avatarUrl || ISLAMIC_AVATARS.malePeci} alt={u.name} className="w-6 h-6 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold text-[11px] text-[#18234A] dark:text-[#F8FAFC]">{u.name}</p>
                        <p className="text-[9px] text-[#5E6D88]">{u.region}</p>
                      </div>
                    </div>
                    <span className="font-black text-xs text-[#FF6F3D]">{u.totalXp.toLocaleString()} XP</span>
                  </div>
                ))
              ) : searchQuery.trim() ? (
                <p className="text-center text-xs text-[#5E6D88] py-4">Tidak ada santri yang sesuai.</p>
              ) : (
                <p className="text-center text-[11px] text-[#5E6D88] py-2">Ketik nama untuk mencari peringkat santri.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: FILOSOFI XP & SISTEM PERINGKAT UNLUPA.ID                */}
      {/* ============================================================== */}
      {showXpPhilosophyModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowXpPhilosophyModal(false)}
        >
          <div 
            className="neumorph-card bg-[#EEF2F7] dark:bg-[#141C2B] p-5 rounded-3xl max-w-md w-full space-y-3 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.05]">
              <h3 className="font-black text-sm text-[#18234A] dark:text-[#F8FAFC]">
                Filosofi Poin & Sistem Peringkat unlupa.id
              </h3>
              <button onClick={() => setShowXpPhilosophyModal(false)} className="text-xs text-[#5E6D88] font-bold cursor-pointer">✕</button>
            </div>

            <div className="text-xs text-[#5E6D88] dark:text-[#94A3B8] space-y-2.5 leading-relaxed">
              {/* Point 1: Proporsionalitas Review */}
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                <p className="font-bold text-xs mb-0.5">🌿 Proporsionalitas Poin Murajaah</p>
                <p className="text-[11px]">
                  Santri mendapatkan <strong>+25 XP</strong> sebagai basis kedisiplinan penuh tepat waktu, ditambah <strong>+2 XP per lembar halaman</strong> yang diulang. Mengulang 3 lembar = 25 + (3 × 2) = 31 XP. Proporsional dan tidak terjadi inflasi poin.
                </p>
              </div>

              {/* Point 2: Ziyadah Al-Qur'an */}
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-300">
                <p className="font-bold text-xs mb-0.5">📖 Semangat Ziyadah Al-Qur'an (+50 XP)</p>
                <p className="text-[11px]">
                  Menghafal halaman Al-Qur'an baru adalah perjuangan mulia yang berat dan hanya diaktivasi <strong>satu kali seumur hidup</strong> (maksimal 604 halaman mushaf). Oleh karenanya, aktivasi halaman baru Al-Qur'an diapresiasi tinggi dengan <strong>+50 XP</strong>.
                </p>
              </div>

              {/* Point 3: Dua Tolok Ukur yang Adil */}
              <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-900 dark:text-orange-300">
                <p className="font-bold text-xs mb-0.5">⚖️ Dua Tolok Ukur yang Adil</p>
                <p className="text-[11px]">
                  <strong>1. Kedisiplinan & Keistiqomahan (Utama):</strong> Mengukur 100% ketepatan waktu murajaah & streak tanpa memandang jumlah juz. Santri baru dengan 1 Juz bisa memimpin jika istiqamah!<br />
                  <strong>2. Akumulasi Riwayat Hafalan:</strong> Menghargai seluruh ikhtiar hafalan dari awal bergabung tanpa mereset riwayat santri senior.
                </p>
              </div>

              {/* Point 4: Kejujuran Mutqin */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300">
                <p className="font-bold text-xs mb-0.5">💎 Kejujuran Nilai: Bonus Mutqin Sangat Kecil (+3 XP)</p>
                <p className="text-[11px]">
                  Bonus rating mutqin sengaja dibatasi kecil (+3 XP) agar santri tidak tergoda memilih rating bohong. Mengakui lupa saat jadwal tiba tetap mendapatkan +25 XP kedisiplinan penuh!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowXpPhilosophyModal(false)}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white text-xs font-bold cursor-pointer"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}


      {/* ============================================================== */}
      {/* MODAL: GABUNG KELAS DENGAN KODE                                 */}
      {/* ============================================================== */}
      {isJoinClassModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsJoinClassModalOpen(false)}
        >
          <div 
            className="neumorph-card bg-[#EEF2F7] dark:bg-[#141C2B] p-5 rounded-3xl max-w-sm w-full space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.05]">
              <h3 className="font-bold text-xs text-[#18234A] dark:text-[#F8FAFC]">Gabung Halaqah / Kelas dengan Kode</h3>
              <button onClick={() => setIsJoinClassModalOpen(false)} className="text-xs text-[#5E6D88] font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleJoinClassSubmit} className="space-y-2.5">
              <div>
                <label className="text-[11px] font-bold text-[#18234A] dark:text-[#F8FAFC] block mb-1">Kode Kelas Guru:</label>
                <input
                  type="text"
                  required
                  value={joinClassCodeInput}
                  onChange={(e) => setJoinClassCodeInput(e.target.value.toUpperCase())}
                  placeholder="Misal: CLS-4912 / QRN-8812"
                  className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase bg-[#EBEEF5] dark:bg-[#10192A] border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#FF6F3D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsJoinClassModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#5E6D88] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white text-xs font-bold cursor-pointer"
                >
                  Gabung
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
