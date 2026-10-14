import React from 'react';
import { ShieldCheck, Play, CalendarCheck, CloudDownload, CheckCircle2, Loader2, Zap, Flame } from 'lucide-react';
import { JuzMeta } from '../../data/quranData';

interface Props {
  juz: JuzMeta;
  activeCount: number;
  dueCount: number;
  mapanCount: number;
  language: string;
  isDownloadingJuz: boolean;
  downloadProgress: { current: number; total: number } | null;
  juzOfflineStatus: { total: number; cached: number; isFullyCached: boolean } | null;
  onDownloadJuz: () => void;
  onStartReview: () => void;
  onOpenCalendar: () => void;
  onFilterTabChange: (tab: 'all' | 'due' | 'active' | 'mapan') => void;
  activeFilterTab: 'all' | 'due' | 'active' | 'mapan';
}

export const QuranJuzUnifiedHero: React.FC<Props> = ({
  juz,
  activeCount,
  dueCount,
  mapanCount,
  language,
  isDownloadingJuz,
  downloadProgress,
  juzOfflineStatus,
  onDownloadJuz,
  onStartReview,
  onOpenCalendar,
  onFilterTabChange,
  activeFilterTab
}) => {
  const totalPages = juz.totalPages;
  const inactiveCount = Math.max(0, totalPages - activeCount);
  
  const mapanRatio = totalPages > 0 ? mapanCount / totalPages : 0;
  const activeRatio = totalPages > 0 ? activeCount / totalPages : 0;
  const dueRatio = totalPages > 0 ? dueCount / totalPages : 0;

  const mapanPercentage = Math.round(mapanRatio * 100);

  // Concentric Rings Radii
  // Outer Ring: Active (r = 40, width = 5)
  const rOuter = 40;
  const cOuter = 2 * Math.PI * rOuter;
  const offsetOuter = cOuter - activeRatio * cOuter;

  // Middle Ring: Mapan (r = 31, width = 5)
  const rMiddle = 31;
  const cMiddle = 2 * Math.PI * rMiddle;
  const offsetMiddle = cMiddle - mapanRatio * cMiddle;

  // Inner Ring: Due (r = 22, width = 5)
  const rInner = 22;
  const cInner = 2 * Math.PI * rInner;
  const offsetInner = cInner - dueRatio * cInner;

  return (
    <div className="neumorph-card p-4 sm:p-5 rounded-3xl space-y-3.5 shadow-md border border-white/50 dark:border-slate-800/80 bg-gradient-to-br from-white/80 via-[#F8FAFC]/90 to-[#EEF2F6]/90 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-950/90">
      {/* Top Clean Header Row: Juz Title + Action Buttons */}
      <div className="flex items-center justify-between gap-2 border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
        {/* Left: Clean Juz Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white font-black text-xs sm:text-sm shrink-0 flex items-center justify-center shadow-[0_4px_12px_rgba(255,111,61,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.7)]">
            J{juz.juzNumber}
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-base font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight whitespace-nowrap">
              Juz {juz.juzNumber} • Hal {juz.startPage}-{juz.endPage} ({totalPages} hal)
            </h2>
          </div>
        </div>

        {/* Right: Calendar Icon + Download Icon */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenCalendar}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl neumorph-card text-[#FF6F3D] hover:scale-110 active:scale-95 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title={language === 'en' ? `Open Review Schedule Calendar` : `Buka Kalender Jadwal Murajaah`}
          >
            <CalendarCheck className="w-4 h-4 text-[#FF6F3D]" />
          </button>

          {isDownloadingJuz ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl neumorph-inset text-[#0EA5E9] font-bold text-[10px]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0EA5E9]" />
              <span className="hidden sm:inline">
                {language === 'en' ? `Downloading (${downloadProgress?.current}/${downloadProgress?.total})...` : `Mengunduh (${downloadProgress?.current}/${downloadProgress?.total})...`}
              </span>
            </div>
          ) : juzOfflineStatus?.isFullyCached ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/20" title="Tersedia Offline">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onDownloadJuz}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl neumorph-card text-[#0EA5E9] hover:scale-110 active:scale-95 flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title={language === 'en' ? 'Download Juz for offline reading' : 'Unduh Juz ini untuk dibaca offline'}
            >
              <CloudDownload className="w-4 h-4 text-[#0EA5E9]" />
            </button>
          )}
        </div>
      </div>

      {/* Symmetric 3-Column Layout: Left Cards (2) | Center Ring Gauge | Right Cards (2) */}
      <div className="grid grid-cols-12 items-center gap-2 sm:gap-4 p-3 sm:p-3.5 rounded-2xl neumorph-inset bg-white/40 dark:bg-black/20">
        {/* Left Side: Halaman Aktif (Top Left) & Jatuh Tempo (Bottom Left) */}
        <div className="col-span-4 flex flex-col gap-2 min-w-0">
          {/* Card 1: Halaman Aktif */}
          <button
            type="button"
            onClick={() => onFilterTabChange('all')}
            className={`p-2 sm:p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              activeFilterTab === 'all'
                ? 'neumorph-card ring-2 ring-[#0EA5E9] scale-102 shadow-xs'
                : 'neumorph-card opacity-90 hover:opacity-100 hover:scale-[1.02]'
            }`}
          >
            <div className="flex items-center gap-1.5 justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0EA5E9] shrink-0 shadow-2xs" />
              <span className="text-xs sm:text-sm font-black font-mono text-[#18234A] dark:text-[#F8FAFC] leading-none">
                {activeCount} / {totalPages}
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] uppercase mt-1 truncate max-w-full">
              Halaman Aktif
            </span>
          </button>

          {/* Card 2: Jatuh Tempo */}
          <button
            type="button"
            onClick={() => onFilterTabChange('due')}
            className={`p-2 sm:p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              activeFilterTab === 'due'
                ? 'neumorph-card ring-2 ring-[#FF7E4A] scale-102 shadow-xs'
                : 'neumorph-card opacity-90 hover:opacity-100 hover:scale-[1.02]'
            }`}
          >
            <div className="flex items-center gap-1.5 justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF7E4A] shrink-0 shadow-2xs" />
              <span className={`text-xs sm:text-sm font-black font-mono leading-none ${dueCount > 0 ? 'text-[#FF6F3D]' : 'text-[#18234A] dark:text-[#F8FAFC]'}`}>
                {dueCount} Hal
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] uppercase mt-1 truncate max-w-full">
              Jatuh Tempo
            </span>
          </button>
        </div>

        {/* Center Column: Triple Concentric Ring Diagram (DEAD CENTER) */}
        <div className="col-span-4 flex flex-col items-center justify-center min-w-0 my-auto">
          <div className="relative w-24 h-28 sm:w-30 sm:h-30 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 overflow-visible">
              {/* Background Track Rings */}
              <circle cx="50" cy="50" r={rOuter} stroke="#D2DBE8" strokeWidth="4" fill="transparent" className="dark:stroke-[#1E293B]" />
              <circle cx="50" cy="50" r={rMiddle} stroke="#D2DBE8" strokeWidth="4" fill="transparent" className="dark:stroke-[#1E293B]" />
              <circle cx="50" cy="50" r={rInner} stroke="#D2DBE8" strokeWidth="4" fill="transparent" className="dark:stroke-[#1E293B]" />

              {/* Active Outer Ring (Sky Blue #0EA5E9) */}
              <circle
                cx="50"
                cy="50"
                r={rOuter}
                stroke="#0EA5E9"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={cOuter}
                strokeDashoffset={offsetOuter}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />

              {/* Mapan Middle Ring (Emerald Green #10B981) */}
              <circle
                cx="50"
                cy="50"
                r={rMiddle}
                stroke="#10B981"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={cMiddle}
                strokeDashoffset={offsetMiddle}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />

              {/* Due Inner Ring (Warm Orange #FF7E4A) */}
              <circle
                cx="50"
                cy="50"
                r={rInner}
                stroke="#FF7E4A"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={cInner}
                strokeDashoffset={offsetInner}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Center Knob */}
            <div className="absolute inset-0 m-auto w-11 h-11 sm:w-12 sm:h-12 rounded-full neumorph-dial-knob flex flex-col items-center justify-center pointer-events-none shadow-xs">
              <span className="text-xs sm:text-sm font-black font-mono text-[#18234A] dark:text-[#F8FAFC] leading-none">
                {mapanPercentage}%
              </span>
              <span className="text-[7px] text-[#8493AB] font-extrabold uppercase mt-0.5 tracking-tight">
                Mapan
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Ayat Mapan (Top Right) & Belum Aktif (Bottom Right) */}
        <div className="col-span-4 flex flex-col gap-2 min-w-0">
          {/* Card 3: Ayat Mapan */}
          <button
            type="button"
            onClick={() => onFilterTabChange('mapan')}
            className={`p-2 sm:p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              activeFilterTab === 'mapan'
                ? 'neumorph-card ring-2 ring-[#10B981] scale-102 shadow-xs'
                : 'neumorph-card opacity-90 hover:opacity-100 hover:scale-[1.02]'
            }`}
          >
            <div className="flex items-center gap-1.5 justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0 shadow-2xs" />
              <span className="text-xs sm:text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 leading-none">
                {mapanCount} Hal
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] uppercase mt-1 truncate max-w-full">
              Ayat Mapan
            </span>
          </button>

          {/* Card 4: Belum Aktif */}
          <button
            type="button"
            onClick={() => onFilterTabChange('active')}
            className={`p-2 sm:p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              activeFilterTab === 'active'
                ? 'neumorph-card ring-2 ring-slate-400 scale-102 shadow-xs'
                : 'neumorph-card opacity-80 hover:opacity-100 hover:scale-[1.02]'
            }`}
          >
            <div className="flex items-center gap-1.5 justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0 shadow-2xs" />
              <span className="text-xs sm:text-sm font-black font-mono text-[#8493AB] leading-none">
                {inactiveCount} Hal
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] uppercase mt-1 truncate max-w-full">
              Belum Aktif
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
