import React, { useState, useMemo } from 'react';
import { QuranPageItem } from '../../types';
import { getIntervalDays } from '../../lib/fsrs';
import { 
  RotateCw, 
  ShieldCheck, 
  Clock, 
  BookOpen,
  CheckCircle2,
  Calendar
} from 'lucide-react';

function pageHasMapan(page: QuranPageItem) {
  return page.status === 'mastered_for_now' || (page.isActive && (page.fsrsData.stability >= 74.5 || Math.round(page.fsrsData.stability * 0.4025587) > 30));
}

interface QuranJuz30TrackerProps {
  quranPages: QuranPageItem[];
  language: string;
  targetJuzNumber?: number; // default 30
  onSelectPage?: (pageNumber: number) => void;
  onOpenCalendar?: () => void;
}

export const QuranJuz30Tracker: React.FC<QuranJuz30TrackerProps> = ({
  quranPages,
  language,
  targetJuzNumber = 30,
  onOpenCalendar,
}) => {
  const [scopeFilter, setScopeFilter] = useState<'juz30' | 'all_active'>('juz30');

  const todayStr = useMemo(() => new Date().toDateString(), []);

  // Filter target pages by selected scope
  const targetPages = useMemo(() => {
    if (scopeFilter === 'juz30') {
      return quranPages.filter(p => p.juzNumber === targetJuzNumber);
    }
    return quranPages.filter(p => p.isActive);
  }, [quranPages, scopeFilter, targetJuzNumber]);

  const activePages = useMemo(() => targetPages.filter(p => p.isActive), [targetPages]);
  const totalActive = activePages.length;

  // Process verified metrics
  const {
    totalFrequency,
    onTimeCount,
    overdueCount,
    dueTodayCount,
    onTimeRate,
  } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalFreq = 0;
    let overdue = 0;
    let dueToday = 0;

    targetPages.forEach(page => {
      const reps = page.fsrsData?.reps || 0;
      const lapses = page.fsrsData?.lapses || 0;
      const logCount = page.reviewLogs?.length || 0;
      const freq = Math.max(reps + lapses, logCount);
      
      if (page.isActive) {
        totalFreq += freq;
      }

      const lastRevDate = page.fsrsData?.lastReview ? new Date(page.fsrsData.lastReview) : null;
      const isReviewedToday = lastRevDate ? lastRevDate.toDateString() === todayStr : false;

      if (page.isActive) {
        if (page.fsrsData?.nextReview) {
          const nextDate = new Date(page.fsrsData.nextReview);
          nextDate.setHours(0, 0, 0, 0);
          const diffTime = nextDate.getTime() - today.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          if (!isReviewedToday) {
            if (diffDays < 0) {
              overdue++;
              dueToday++;
            } else if (diffDays === 0) {
              dueToday++;
            }
          }
        } else {
          if (!isReviewedToday) {
            dueToday++;
          }
        }
      }
    });

    const onTime = totalActive > 0 ? (totalActive - overdue) : totalActive;
    const rate = totalActive > 0 ? Math.round((onTime / totalActive) * 100) : 100;

    return {
      totalFrequency: totalFreq,
      onTimeCount: onTime,
      overdueCount: overdue,
      dueTodayCount: dueToday,
      onTimeRate: rate,
    };
  }, [targetPages, todayStr, totalActive]);

  return (
    <div className="clay-card p-4 sm:p-5 relative overflow-hidden space-y-3.5 transition-all">
      {/* 1. Header Bar: Title, Scope Switcher & Schedule Calendar Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.03] dark:border-white/[0.04]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl clay-icon-pod-emerald flex items-center justify-center shrink-0 shadow-sm">
            <BookOpen className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-[#18234A] dark:text-[#F8FAFC] leading-tight tracking-tight truncate">
              {language === 'en' ? 'Muraja\'ah Tracking & Schedule Accuracy' : 'Pelacakan Muraja\'ah & Ketepatan Jadwal'}
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium mt-0.5 truncate">
              {scopeFilter === 'juz30' 
                ? `Juz ${targetJuzNumber} • ${totalActive} halaman aktif` 
                : `Seluruh Mushaf • ${totalActive} halaman aktif`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          {/* Clay Inset Scope Switcher */}
          <div className="p-1 clay-inset rounded-2xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setScopeFilter('juz30')}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                scopeFilter === 'juz30'
                  ? 'clay-pill text-[#F27A3D] shadow-2xs scale-102'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-white'
              }`}
            >
              Juz {targetJuzNumber}
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('all_active')}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                scopeFilter === 'all_active'
                  ? 'clay-pill text-[#F27A3D] shadow-2xs scale-102'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-white'
              }`}
            >
              {language === 'en' ? 'All Active' : 'Semua Aktif'}
            </button>
          </div>

          {/* Direct Calendar Trigger Button */}
          {onOpenCalendar && (
            <button
              type="button"
              onClick={onOpenCalendar}
              title={language === 'en' ? 'View Schedule Calendar' : 'Buka Kalender Jadwal'}
              className="px-3.5 py-1.5 rounded-2xl clay-pill text-[#F27A3D] text-xs font-extrabold flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5 text-[#F27A3D]" />
              <span>{language === 'en' ? 'Schedule' : 'Kalender Jadwal'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 4 Sleek 3D Claymorphic Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Pengulangan */}
        <div className="p-3.5 rounded-2xl clay-inset flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-[#64748B] dark:text-[#94A3B8] text-xs">
            <span className="font-extrabold uppercase tracking-wider text-[10px]">Total Pengulangan</span>
            <RotateCw className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#18234A] dark:text-[#F8FAFC] tabular-nums tracking-tight">
            {totalFrequency} <span className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8]">kali</span>
          </div>
          <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-medium truncate">
            Akumulasi sesi muraja'ah
          </div>
        </div>

        {/* Bebas Tunggakan */}
        <div className="p-3.5 rounded-2xl clay-inset flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase tracking-wider text-[10px] text-emerald-700 dark:text-emerald-400">Bebas Tunggakan</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
            {onTimeCount} <span className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8]">/ {totalActive}</span>
          </div>
          <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium truncate">
            Jadwal tepat waktu
          </div>
        </div>

        {/* Kepatuhan Jadwal / Disiplin */}
        <div className="p-3.5 rounded-2xl clay-inset flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase tracking-wider text-[10px] text-[#F27A3D]">Tingkat Disiplin</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#F27A3D] shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#F27A3D] tabular-nums tracking-tight">
            {onTimeRate}%
          </div>
          <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-medium truncate">
            Kepatuhan Jadwal
          </div>
        </div>

        {/* Perlu Muraja'ah / Tempo */}
        <div className="p-3.5 rounded-2xl clay-inset flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase tracking-wider text-[10px] text-rose-500">Perlu Muraja'ah</span>
            <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
            {dueTodayCount} <span className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8]">hal</span>
          </div>
          <div className="text-[10px] text-rose-500/80 font-medium truncate">
            {overdueCount > 0 ? `${overdueCount} halaman terlambat` : 'Jatuh tempo hari ini'}
          </div>
        </div>
      </div>
    </div>
  );
};
