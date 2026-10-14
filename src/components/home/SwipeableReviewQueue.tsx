import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Play, 
  CheckCircle2, 
  BookOpen, 
  Library, 
  GraduationCap, 
  ChevronRight, 
  ChevronLeft,
  BookMarked,
  Users,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JUZ_LIST } from '../../data/quranData';
import { isDue } from '../../lib/fsrs';
import { ClassGroup, ClassStudent } from '../../types';

interface Props {
  onOpenQuranReview: (juzNumber?: number) => void;
  onOpenPersonalReview: () => void;
}

export const SwipeableReviewQueue: React.FC<Props> = ({
  onOpenQuranReview,
  onOpenPersonalReview
}) => {
  const { 
    quranStats, 
    personalStats, 
    books, 
    myClasses, 
    teachingClasses, 
    language, 
    setActiveSpace,
    userProfile,
    quranSpaceCode,
    items
  } = useApp();

  const [activeTab, setActiveTab] = useState<number>(0);
  const [direction, setDirection] = useState<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Helper to determine if a student in a class has pending reviews
  const getStudentDueStatus = (student: ClassStudent, cls: ClassGroup) => {
    if (cls.type === 'quran') {
      const isCurrentUser = student.email === userProfile.email || student.id === `std-user-${userProfile.id}` || student.quranSpaceCode === quranSpaceCode;
      if (isCurrentUser) {
        const duePages = (quranStats?.dueList || []);
        if (duePages.length > 0) return { isDue: true, count: duePages.length };
        return { isDue: false, count: 0 };
      }
      if (student.quranData && student.quranData.length > 0) {
        const duePages = student.quranData.filter(p => p.isActive && isDue(p.fsrsData?.nextReview, p.isActive, p.fsrsData?.lastReview));
        if (duePages.length > 0) return { isDue: true, count: duePages.length };
      }
      if ((student.dueTodayCount || 0) > 0) {
        return { isDue: true, count: student.dueTodayCount };
      }
      if (student.frequentStruggles && student.frequentStruggles.length > 0) {
        return { isDue: true, count: student.frequentStruggles.length };
      }
      return { isDue: false, count: 0 };
    } else {
      const isCurrentUser = student.email === userProfile.email || student.id === `std-user-${userProfile.id}`;
      if (isCurrentUser) {
        const assignedId = cls.assignedBookIds?.[0];
        const classItems = items.filter(i => i.bookId === assignedId);
        const dueItems = classItems.filter(i => i.isActive && isDue(i.fsrsData?.nextReview, i.isActive, i.fsrsData?.lastReview));
        if (dueItems.length > 0) return { isDue: true, count: dueItems.length };
        return { isDue: false, count: 0 };
      }
      if (student.bookItemsData && student.bookItemsData.length > 0) {
        const dueItems = student.bookItemsData.filter(it => it.isActive && isDue(it.fsrsData?.nextReview, it.isActive, it.fsrsData?.lastReview));
        if (dueItems.length > 0) return { isDue: true, count: dueItems.length };
      }
      if ((student.dueTodayCount || 0) > 0) {
        return { isDue: true, count: student.dueTodayCount };
      }
      if (student.frequentStruggles && student.frequentStruggles.length > 0) {
        return { isDue: true, count: student.frequentStruggles.length };
      }
      return { isDue: false, count: 0 };
    }
  };

  // Cluster due Quran pages by Juz
  const dueQuranByJuz = useMemo(() => {
    const juzMap = new Map<number, number>();
    (quranStats?.dueList || []).forEach(p => {
      juzMap.set(p.juzNumber, (juzMap.get(p.juzNumber) || 0) + 1);
    });
    return Array.from(juzMap.entries())
      .map(([juz, count]) => ({ juz, count }))
      .sort((a, b) => a.juz - b.juz);
  }, [quranStats?.dueList]);

  // Cluster due Personal items by Book
  const duePersonalByBook = useMemo(() => {
    const bookMap = new Map<string, { title: string; count: number }>();
    (personalStats?.dueList || []).forEach(item => {
      const book = books.find(b => b.id === item.bookId);
      const title = book?.title || (language === 'en' ? 'General' : 'Umum');
      const cur = bookMap.get(item.bookId) || { title, count: 0 };
      bookMap.set(item.bookId, { title, count: cur.count + 1 });
    });
    return Array.from(bookMap.entries()).map(([bookId, data]) => ({
      bookId,
      title: data.title,
      count: data.count
    }));
  }, [personalStats?.dueList, books, language]);

  // Teaching stats with detailed student review verification
  const teachingSummary = useMemo(() => {
    let totalPendingStudents = 0;
    const classStats = (teachingClasses || []).map(cls => {
      const students = cls.students || [];
      const pendingStudents = students.filter(s => getStudentDueStatus(s, cls).isDue);
      totalPendingStudents += pendingStudents.length;
      return {
        class: cls,
        totalStudents: students.length,
        pendingCount: pendingStudents.length,
        isAllClear: students.length > 0 && pendingStudents.length === 0
      };
    });
    return {
      totalClasses: (teachingClasses || []).length,
      totalPendingStudents,
      classStats
    };
  }, [teachingClasses]);

  const tabs = [
    {
      id: 0,
      name: language === 'en' ? 'Al-Quran' : "Al-Qur'an",
      shortName: language === 'en' ? 'Quran' : "Al-Qur'an",
      icon: <BookOpen className="w-3.5 h-3.5" />,
      badge: quranStats?.dueToday || 0,
      space: 'quran' as const
    },
    {
      id: 1,
      name: language === 'en' ? 'Personal' : 'Pribadi',
      shortName: language === 'en' ? 'Personal' : 'Pribadi',
      icon: <Library className="w-3.5 h-3.5" />,
      badge: personalStats?.dueToday || 0,
      space: 'personal' as const
    },
    {
      id: 2,
      name: language === 'en' ? 'My Classes' : 'Meja Kelas',
      shortName: language === 'en' ? 'Classes' : 'Kelas',
      icon: <BookMarked className="w-3.5 h-3.5" />,
      badge: myClasses?.length || 0,
      space: 'teaching' as const
    },
    {
      id: 3,
      name: language === 'en' ? 'Teaching' : 'Ruang Guru',
      shortName: language === 'en' ? 'Teaching' : 'Guru',
      icon: <GraduationCap className="w-3.5 h-3.5" />,
      badge: teachingSummary.totalPendingStudents > 0 ? teachingSummary.totalPendingStudents : (teachingClasses?.length || 0),
      isAlertBadge: teachingSummary.totalPendingStudents > 0,
      space: 'teaching' as const
    }
  ];

  const totalTabs = tabs.length;

  const goToTab = (index: number) => {
    const nextIndex = (index + totalTabs) % totalTabs;
    setDirection(nextIndex > activeTab ? 1 : -1);
    setActiveTab(nextIndex);
  };

  // Robust isolated touch handling: prevents global space swipe from stealing touches
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!touchStartRef.current || e.changedTouches.length !== 1) {
      touchStartRef.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Only switch slides if horizontal swipe was intentional and dominant
    if (elapsed < 800 && Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      if (dx < 0) {
        // Swiped left -> Next tab
        goToTab(activeTab + 1);
      } else {
        // Swiped right -> Prev tab
        goToTab(activeTab - 1);
      }
    }
  };

  return (
    <div 
      data-no-swipe="true"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="neumorph-card overflow-hidden relative touch-pan-y h-full flex flex-col justify-between rounded-3xl"
    >
      {/* 1. TOP SEGMENTED NAVIGATION TABS */}
      <div className="px-3 sm:px-4 py-2.5 border-b border-black/[0.04] dark:border-white/[0.04] bg-[#EBEEF5]/60 dark:bg-[#0E1626]/60">
        <div className="flex items-center justify-between gap-2">
          {/* Segmented Pills for 4 Spaces */}
          <div className="grid grid-cols-4 gap-1.5 flex-1 min-w-0 neumorph-inset p-1 rounded-2xl">
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => goToTab(tab.id)}
                  title={tab.name}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-w-0 ${
                    isSelected
                      ? 'neumorph-card text-[#FF6F3D] font-bold shadow-xs scale-102'
                      : 'text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  <span className="shrink-0 text-current">{tab.icon}</span>
                  {tab.badge > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black shrink-0 min-w-[18px] h-4 inline-flex items-center justify-center leading-none ${
                      isSelected 
                        ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-2xs' 
                        : (tab as any).isAlertBadge
                        ? 'bg-gradient-to-br from-[#EF4444] to-[#DC2626] text-white shadow-2xs'
                        : 'bg-[#FF6F3D]/15 text-[#FF6F3D]'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Previous / Next Arrow Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => goToTab(activeTab - 1)}
              aria-label="Previous Slide"
              className="w-8 h-8 rounded-xl neumorph-card flex items-center justify-center text-[#18234A] dark:text-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2.3} />
            </button>
            <button
              type="button"
              onClick={() => goToTab(activeTab + 1)}
              aria-label="Next Slide"
              className="w-8 h-8 rounded-xl neumorph-card flex items-center justify-center text-[#18234A] dark:text-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2.3} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN SWIPEABLE CARD CONTENT */}
      <div className="p-3.5 sm:p-4 min-h-[190px] flex flex-col justify-between">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: direction * 35 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 35 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="space-y-3.5"
          >
            {/* SLIDE 0: AL-QUR'AN SPACE QUEUE */}
            {activeTab === 0 && (
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-black/[0.03] dark:border-white/[0.04]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl clay-icon-pod-orange flex items-center justify-center shrink-0 shadow-sm">
                      <BookOpen className="w-5 h-5 text-white shrink-0" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-[#1E293B] dark:text-[#F8FAFC] text-xs sm:text-sm tracking-tight truncate">
                          {language === 'en' ? 'Quran Memorization' : "Murajaah Al-Qur'an"}
                        </h4>
                        {quranStats.dueToday > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full clay-badge-orange text-white font-bold text-[10px] flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <Clock className="w-3 h-3 text-white" />
                            {quranStats.dueToday} {language === 'en' ? 'due' : 'tempo'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full clay-badge-emerald text-white font-bold text-[10px] flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                            {language === 'en' ? 'All Clear' : 'Lancar'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate font-medium">
                        {quranStats.active} {language === 'en' ? 'active pages' : 'halaman aktif'} • {quranStats.mastered} {language === 'en' ? 'mastered' : 'mapan'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                    {quranStats.dueToday > 0 && (
                      <button
                        onClick={() => onOpenQuranReview()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 clay-btn-primary font-bold text-xs cursor-pointer whitespace-nowrap"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>{language === 'en' ? 'Start' : 'Mulai'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveSpace('quran')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 clay-pill text-[#1E293B] dark:text-[#F8FAFC] font-bold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <span>{language === 'en' ? 'Open Quran' : 'Buka Quran'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Due Breakdown by Juz or Clean Zero State */}
                {dueQuranByJuz.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider block">
                      {language === 'en' ? 'Due by Juz:' : 'Rincian Tempo per Juz:'}
                    </span>
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-0.5 pt-0.5 w-full">
                      {dueQuranByJuz.map(({ juz, count }) => (
                        <button
                          key={juz}
                          onClick={() => onOpenQuranReview(juz)}
                          title={`Juz ${juz} (${count})`}
                          className="shrink-0 flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl clay-pill hover:scale-105 active:scale-95 transition-all text-left cursor-pointer group"
                        >
                          <span className="text-xs font-extrabold text-[#18234A] dark:text-[#F8FAFC] group-hover:text-[#F27A3D] transition-colors whitespace-nowrap">
                            J.{juz}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full clay-badge-orange text-white font-black text-[10px] shrink-0 min-w-[18px] h-4.5 inline-flex items-center justify-center leading-none shadow-2xs">
                            {count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 rounded-2xl clay-inset flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl clay-icon-pod-emerald flex items-center justify-center shrink-0 shadow-xs">
                        <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                      </div>
                      <div>
                        <p className="font-bold text-[#18234A] dark:text-[#F8FAFC] text-xs sm:text-sm">
                          {language === 'en' ? 'Quran memorization is up to date' : "Semua hafalan Al-Qur'an tuntas terjaga"}
                        </p>
                        <p className="text-[11px] text-[#687086] dark:text-[#94A3B8] mt-0.5">
                          {language === 'en' ? 'No pages currently due for review.' : 'Belum ada halaman yang jatuh tempo murajaah saat ini.'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveSpace('quran')}
                      className="px-4 py-2 rounded-2xl clay-pill text-[#F27A3D] font-bold text-xs hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
                    >
                      {language === 'en' ? 'Browse Quran' : 'Kelola Halaman'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SLIDE 1: PERSONAL LIBRARY QUEUE */}
            {activeTab === 1 && (
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-black/[0.03] dark:border-white/[0.04]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl clay-icon-pod-pacific flex items-center justify-center shrink-0 shadow-sm">
                      <Library className="w-5 h-5 text-white shrink-0" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-[#1E293B] dark:text-[#F8FAFC] text-xs sm:text-sm tracking-tight truncate">
                          {language === 'en' ? 'Personal Library' : 'Perpustakaan & Kitab'}
                        </h4>
                        {personalStats.dueToday > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full clay-badge-orange text-white font-bold text-[10px] flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <Clock className="w-3 h-3 text-white" />
                            {personalStats.dueToday} {language === 'en' ? 'due' : 'tempo'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full clay-badge-emerald text-white font-bold text-[10px] flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                            {language === 'en' ? 'All Clear' : 'Lancar'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate font-medium">
                        {personalStats.totalBooks} {language === 'en' ? 'books' : 'kitab'} • {personalStats.activeItems} {language === 'en' ? 'active flashcards' : 'kartu aktif'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                    {personalStats.dueToday > 0 && (
                      <button
                        onClick={onOpenPersonalReview}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 clay-btn-primary font-bold text-xs cursor-pointer whitespace-nowrap"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>{language === 'en' ? 'Start' : 'Mulai'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveSpace('personal')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 clay-pill text-[#1E293B] dark:text-[#F8FAFC] font-bold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <span>{language === 'en' ? 'Open Library' : 'Buka Kitab'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Due Breakdown by Book or Clean Zero State */}
                {duePersonalByBook.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider block">
                      {language === 'en' ? 'Due by Book:' : 'Tempo per Kitab:'}
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5 pt-0.5 w-full">
                      {duePersonalByBook.map(({ bookId, title, count }) => (
                        <button
                          key={bookId}
                          onClick={onOpenPersonalReview}
                          title={`${title} (${count} ${language === 'en' ? 'cards' : 'kartu'})`}
                          className="shrink-0 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl sm:rounded-2xl clay-pill hover:scale-105 active:scale-95 transition-all text-left cursor-pointer group"
                        >
                          <span className="text-xs font-extrabold text-[#18234A] dark:text-[#F8FAFC] group-hover:text-[#F27A3D] transition-colors whitespace-nowrap">
                            {title}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full clay-badge-orange text-white font-black text-[10px] shrink-0 min-w-[18px] h-4.5 inline-flex items-center justify-center leading-none shadow-2xs">
                            {count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 sm:p-4 rounded-2xl clay-inset flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl clay-icon-pod-emerald shrink-0 flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.2} />
                      </div>
                      <div>
                        <p className="font-bold text-[#1E293B] dark:text-[#F8FAFC] text-xs sm:text-sm">
                          {books.length === 0 ? 'Belum Ada Kitab di Perpustakaan' : 'Seluruh kartu materi tuntas dimurajaah'}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                          {books.length === 0 ? 'Unduh kitab dari katalog atau buat materi sendiri.' : 'Jadwal akan diperbarui sesuai interval memori.'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveSpace('personal')}
                      className="px-3.5 py-1.5 rounded-xl clay-pill text-[#FF6E65] font-bold text-xs hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
                    >
                      {books.length === 0 ? 'Tambah Kitab' : 'Buka Ruang'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SLIDE 2: MY CLASSES (SANTRI) */}
            {activeTab === 2 && (
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-black/[0.03] dark:border-white/[0.04]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl clay-icon-pod-emerald flex items-center justify-center shrink-0 shadow-sm">
                      <BookMarked className="w-5 h-5 text-white shrink-0" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-[#1E293B] dark:text-[#F8FAFC] text-xs sm:text-sm tracking-tight truncate">
                          {language === 'en' ? 'My Classes' : 'Meja Kelas & Kurikulum'}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full clay-badge-emerald text-white font-bold text-[10px] shrink-0 whitespace-nowrap">
                          {myClasses?.length || 0} {language === 'en' ? 'enrolled' : 'kelas'}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate font-medium">
                        {language === 'en' ? 'Classes you are participating in' : 'Daftar kelas bimbingan pengajar & target materi'}
                      </p>
                    </div>
                  </div>

                  {myClasses && myClasses.length > 0 && (
                    <button
                      onClick={() => setActiveSpace('teaching')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 clay-pill text-[#1E293B] dark:text-[#F8FAFC] font-bold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <span>{language === 'en' ? 'Open Classes' : 'Buka Meja Kelas'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {myClasses && myClasses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {myClasses.slice(0, 4).map((c) => {
                      const isQuran = c.type === 'quran';
                      
                      return (
                        <div
                          key={c.id}
                          onClick={() => setActiveSpace('teaching')}
                          className="p-3 rounded-2xl clay-card-subtle flex items-center justify-between gap-2.5 cursor-pointer group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs sm:text-sm text-[#1E293B] dark:text-[#F8FAFC] group-hover:text-[#FF6E65] truncate transition-colors">
                              {c.name}
                            </p>
                            <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate mt-0.5 flex items-center gap-1.5 font-medium">
                              <span>Ust. {c.teacherName || 'Pengajar'}</span>
                              <span className="text-[#FF6E65]">•</span>
                              <span className="font-mono text-[9px] clay-pill px-1.5 py-0.2 text-[#FF6E65] font-bold">
                                {c.code}
                              </span>
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="px-2 py-0.5 rounded-full clay-badge-emerald text-white font-bold text-[9px]">
                              {isQuran ? "Tahfizh" : 'Kitab'}
                            </span>
                            <ChevronRight className="w-3 h-3 text-[#64748B] group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-5 px-4 rounded-2xl clay-inset flex flex-col items-center text-center max-w-lg mx-auto">
                    <div className="w-10 h-10 rounded-2xl clay-icon-pod-emerald flex items-center justify-center mb-2 shadow-xs">
                      <BookMarked className="w-5 h-5 text-white" strokeWidth={2.2} />
                    </div>
                    <p className="font-bold text-xs sm:text-sm text-[#1E293B] dark:text-[#F8FAFC]">
                      {language === 'en' ? 'You have not joined any classes yet' : 'Belum bergabung ke kelas mana pun'}
                    </p>
                    <button
                      onClick={() => setActiveSpace('teaching')}
                      className="mt-3 px-4 py-2 clay-btn-primary text-white text-xs font-bold shrink-0 cursor-pointer active:scale-95 transition-all inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Join Class' : 'Gabung Kelas Sekarang'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SLIDE 3: TEACHING SPACE (USTADZ / GURU) */}
            {activeTab === 3 && (
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-black/[0.03] dark:border-white/[0.04]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl clay-icon-pod-orange flex items-center justify-center shrink-0 shadow-sm">
                      <GraduationCap className="w-5 h-5 text-white shrink-0" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-[#1E293B] dark:text-[#F8FAFC] text-xs sm:text-sm tracking-tight truncate">
                          {language === 'en' ? 'Teaching Space' : 'Ruang Guru & Evaluasi'}
                        </h4>
                        {teachingSummary.totalPendingStudents > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full clay-badge-orange text-white font-bold text-[10px] flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <AlertCircle className="w-3 h-3 text-white" />
                            {teachingSummary.totalPendingStudents} {language === 'en' ? 'pending' : 'santri perlu evaluasi'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full clay-badge-emerald text-white font-bold text-[10px] flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                            {language === 'en' ? 'All Up to Date' : 'Semua Tuntas'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate font-medium">
                        {teachingSummary.totalClasses} {language === 'en' ? 'classes' : 'kelas diampu'} • {teachingSummary.totalPendingStudents > 0 ? `${teachingSummary.totalPendingStudents} santri perlu evaluasi` : 'Seluruh santri tuntas'}
                      </p>
                    </div>
                  </div>

                  {teachingSummary.classStats && teachingSummary.classStats.length > 0 && (
                    <button
                      onClick={() => setActiveSpace('teaching')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 clay-pill text-[#1E293B] dark:text-[#F8FAFC] font-bold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <span>{language === 'en' ? 'Open Teaching' : 'Buka Ruang Guru'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {teachingSummary.classStats && teachingSummary.classStats.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {teachingSummary.classStats.slice(0, 4).map(({ class: c, totalStudents, pendingCount }) => (
                      <div
                        key={c.id}
                        onClick={() => setActiveSpace('teaching')}
                        className="p-3.5 rounded-2xl clay-card-subtle flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs sm:text-sm text-[#18234A] dark:text-[#F8FAFC] group-hover:text-[#F27A3D] truncate transition-colors">
                            {c.name}
                          </p>
                          <p className="text-[11px] text-[#687086] dark:text-[#94A3B8] truncate mt-0.5 flex items-center gap-1.5 font-medium">
                            <span>{totalStudents} santri</span>
                            <span className="text-[#F27A3D]">•</span>
                            <span className="font-mono text-[10px] clay-pill px-2 py-0.2 text-[#F27A3D] font-bold">
                              {c.code}
                            </span>
                          </p>

                          {/* Student Review Attention Status */}
                          <div className="mt-1.5">
                            {totalStudents === 0 ? (
                              <span className="text-[10px] font-medium text-[#687086] dark:text-[#94A3B8] flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Belum ada santri bergabung
                              </span>
                            ) : pendingCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full clay-badge-orange text-white text-[10px] font-bold">
                                <AlertCircle className="w-3 h-3 text-white shrink-0" />
                                <span>{pendingCount} santri belum review</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>Semua santri tuntas review</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="px-2.5 py-1 rounded-full clay-badge-orange text-white font-bold text-[10px] inline-flex items-center justify-center leading-none">
                            {c.type === 'quran' ? "Tahfizh" : 'Kitab'}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#687086] group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-7 px-5 rounded-2xl clay-inset flex flex-col items-center text-center max-w-lg mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-[#F27A3D] flex items-center justify-center mb-2.5 shadow-sm">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-bold text-sm text-[#18234A] dark:text-[#F8FAFC]">
                      {language === 'en' ? 'No teaching classes created yet' : 'Belum membuat kelas pengajaran'}
                    </p>
                    <p className="text-xs text-[#687086] dark:text-[#94A3B8] mt-1 max-w-sm leading-relaxed font-medium">
                      {language === 'en' 
                        ? 'Create a teaching class to monitor your students and assign curriculums.' 
                        : 'Buat kelas tahfizh / madrasah bimbingan Anda untuk memantau hafalan dan retensi santri.'}
                    </p>
                    <button
                      onClick={() => setActiveSpace('teaching')}
                      className="mt-4 px-5 py-2.5 clay-btn-primary text-white text-xs font-bold shrink-0 cursor-pointer active:scale-95 transition-all inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Create Class' : 'Buat Kelas Bimbingan'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 3. BOTTOM SLIDE INDICATORS & SWIPE HINT */}
        <div className="flex items-center justify-between pt-3.5 mt-2 border-t border-black/[0.03] dark:border-white/[0.04]">
          <span className="text-[11px] text-[#687086] dark:text-[#94A3B8] font-medium hidden sm:inline-block">
            {language === 'en' ? '← Swipe card left / right to switch queue' : '← Geser kartu untuk berganti antrean'}
          </span>
          <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => goToTab(tab.id)}
                aria-label={`Go to slide ${tab.name}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'w-7 bg-[#F27A3D]'
                    : 'w-2.5 bg-[#D5DAE1] dark:bg-slate-700 hover:bg-[#F27A3D]/50'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] text-[#F27A3D] font-bold tabular-nums clay-pill px-2.5 py-0.5">
            {activeTab + 1} / {totalTabs}
          </span>
        </div>
      </div>
    </div>
  );
};
