import React from 'react';
import { Play, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { Language } from '../../types';

export interface DueFilterPill {
  id: string | number;
  label: string;
  count: number;
  badge?: string;
  onClick: () => void;
  active?: boolean;
}

export interface UnifiedDueCardProps {
  language: Language;
  title?: string;
  subtitle?: string;
  dueCount: number;
  totalActiveCount?: number;
  itemTypeLabel?: string; // e.g. "Halaman", "Kartu", "Tugas"
  onStartAll: () => void;
  onOpenCalendar?: () => void;
  filterPills?: DueFilterPill[];
  pillGridCols?: 3 | 4 | 5 | 6 | 'books' | 'quran' | 'personal' | 'classes';
  allCaughtUpTitle?: string;
  allCaughtUpSubtitle?: string;
  nextUpcomingText?: string;
  primaryActionLabel?: string;
  className?: string;
}

export const UnifiedDueCard: React.FC<UnifiedDueCardProps> = ({
  language,
  title,
  dueCount,
  onStartAll,
  onOpenCalendar,
  filterPills = [],
  pillGridCols = 5,
  allCaughtUpTitle,
  primaryActionLabel,
  className = '',
}) => {
  const defaultTitle = title || (language === 'en' ? 'Review Queue' : 'Antrean Murajaah');
  const defaultPrimaryLabel = primaryActionLabel || (language === 'en' ? `Review All (${dueCount})` : `Murajaah Semua (${dueCount})`);
  const noReviewLabel = allCaughtUpTitle || (language === 'en' ? 'All items reviewed for today!' : 'Semua materi telah tuntas dimurajaah hari ini!');

  const colsKey = String(pillGridCols);
  const isBooksMode = colsKey === '3' || colsKey === 'books' || colsKey === 'personal' || colsKey === 'classes' || colsKey === '4';
  
  let gridLayoutClass = 'grid grid-cols-5 gap-1 sm:gap-1.5';
  if (colsKey === '3' || colsKey === 'books' || colsKey === 'personal' || colsKey === 'classes') {
    gridLayoutClass = 'grid grid-cols-3 gap-1.5 sm:gap-2';
  } else if (colsKey === '4') {
    gridLayoutClass = 'grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2';
  } else if (colsKey === '5' || colsKey === 'quran') {
    gridLayoutClass = 'grid grid-cols-5 gap-1 sm:gap-1.5';
  } else if (colsKey === '6') {
    gridLayoutClass = 'grid grid-cols-6 gap-1 sm:gap-1.5';
  }

  if (dueCount === 0) {
    return (
      <div className={`neumorph-card px-4 py-3.5 rounded-3xl flex items-center justify-between gap-3 transition-all ${className}`}>
        <div className="inline-flex items-center gap-3 text-xs sm:text-sm font-bold text-[#10B981]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <span>{noReviewLabel}</span>
        </div>
        {onOpenCalendar && (
          <button
            type="button"
            onClick={onOpenCalendar}
            title={language === 'en' ? 'View Schedule Calendar' : 'Lihat Kalender Jadwal'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl neumorph-card text-[#FF6F3D] text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 text-[#FF6F3D]" />
            <span className="hidden sm:inline">{language === 'en' ? 'Schedule' : 'Jadwal'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`neumorph-card p-4 sm:p-5 rounded-3xl space-y-3.5 transition-all ${className}`}>
      {/* 1. Header Bar: Title, Calendar trigger, and Primary Action Button */}
      <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(255,111,61,0.35)]">
            <Clock className="w-4.5 h-4.5 text-white shrink-0" />
          </div>
          <span className="text-xs sm:text-base font-bold text-[#18234A] dark:text-[#F8FAFC] truncate">
            {defaultTitle}
          </span>
          {onOpenCalendar && (
            <button
              type="button"
              onClick={onOpenCalendar}
              title={language === 'en' ? 'View Schedule Calendar' : 'Lihat Kalender Jadwal'}
              className="w-8 h-8 rounded-xl neumorph-card text-[#FF6F3D] hover:scale-105 active:scale-95 flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              <Calendar className="w-4 h-4 text-[#FF6F3D]" />
            </button>
          )}
        </div>

        {/* Primary Action Button (Review All) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStartAll();
          }}
          title={language === 'en' ? `Review all due items (${dueCount})` : `Murajaah semua item tempo (${dueCount})`}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white text-xs font-bold cursor-pointer active:scale-95 transition-all shadow-[0_4px_12px_rgba(255,111,61,0.35)] shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-white text-white shrink-0" />
          <span>{defaultPrimaryLabel}</span>
        </button>
      </div>

      {/* 2. Detailed Filter Pills (Juz / Books / Classes) - Smooth Horizontal Scroll with No Text Truncation */}
      {filterPills.length > 0 && (
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pt-1 pb-0.5 w-full">
          {filterPills.map((pill) => (
            <button
              type="button"
              key={pill.id}
              onClick={(e) => {
                e.stopPropagation();
                pill.onClick();
              }}
              title={`Murajaah ${pill.label} (${pill.count})`}
              className="shrink-0 flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-2xl neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-105 active:scale-95 text-xs font-extrabold transition-all cursor-pointer group"
            >
              <span className="group-hover:text-[#FF6F3D] transition-colors whitespace-nowrap text-xs font-extrabold">
                {pill.label}
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black text-white bg-gradient-to-br from-[#FF7E4A] to-[#E65320] min-w-[18px] h-4.5 inline-flex items-center justify-center text-center whitespace-nowrap shadow-2xs">
                {pill.count}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
