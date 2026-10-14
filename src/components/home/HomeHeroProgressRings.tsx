import React from 'react';
import { BookOpen, Library, ArrowRight, Flame } from 'lucide-react';
import { QuranPageItem, BookItem, Language } from '../../types';
import { getNonQuranIntervalDays } from '../../lib/fsrs';
import { FireStrikeBar } from '../shared/FireStrikeBar';

interface Props {
  language: Language;
  quranPages: QuranPageItem[];
  items: BookItem[];
  currentStreak?: number;
  onNavigateQuran: () => void;
  onNavigateBooks: () => void;
}

export const HomeHeroProgressRings: React.FC<Props> = ({
  language,
  quranPages,
  items,
  currentStreak = 0,
  onNavigateQuran,
  onNavigateBooks
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Al-Qur'an Calculations
  const totalQuranPages = 604;
  const activeQuranPages = quranPages.filter(p => p.isActive).length;
  const quranActivePct = ((activeQuranPages / totalQuranPages) * 100);
  
  // Mutqin for Quran: stability >= 30 or interval >= 30 days (true permanent long-term retention)
  const mutqinQuranPages = quranPages.filter(p => 
    p.isActive && (p.status === 'mastered_for_now' || (p.fsrsData?.stability >= 30 || Math.round((p.fsrsData?.stability || 0) * 0.4025587) >= 30))
  ).length;

  // Quran Discipline:
  const overdueQuranPages = quranPages.filter(p => {
    if (!p.isActive || !p.fsrsData?.nextReview) return false;
    const nDate = new Date(p.fsrsData.nextReview);
    nDate.setHours(0, 0, 0, 0);
    return nDate < today;
  }).length;
  const onTimeQuran = activeQuranPages > 0 ? Math.max(0, activeQuranPages - overdueQuranPages) : activeQuranPages;
  const quranDisciplineRate = activeQuranPages > 0 ? Math.round((onTimeQuran / activeQuranPages) * 100) : 100;

  // Quran tier counts (4 Stabilitas Memori FSRS Quran: Mapan >=30h, Kokoh 15-29h, Konsolidasi 7-14h, Baru <7h)
  const quranActiveList = quranPages.filter(p => p.isActive);
  const qQuranTiers = quranActiveList.reduce((acc, p) => {
    const stability = p.fsrsData?.stability || 0;
    const interval = Math.round(stability * 0.4025587);
    const isMapan = p.status === 'mastered_for_now' || interval >= 30;
    const isKokoh = interval >= 15 && interval < 30 && !isMapan;
    const isKonsolidasi = interval >= 7 && interval < 15;
    const isBaru = interval < 7;
    if (isMapan) acc.mapan++;
    else if (isKokoh) acc.kokoh++;
    else if (isKonsolidasi) acc.konsolidasi++;
    else acc.baru++;
    return acc;
  }, { mapan: 0, kokoh: 0, konsolidasi: 0, baru: 0 });

  // 2. Ruang Buku (Non Al-Qur'an) Calculations
  const totalBookItems = items.length;
  const activeBookItems = items.filter(i => i.isActive).length;
  const booksActivePct = totalBookItems > 0 ? ((activeBookItems / totalBookItems) * 100) : 0;
  
  // Mutqin/Mapan for Books: interval >= 336 days (or status === 'mastered')
  const mutqinBookItems = items.filter(i => 
    i.isActive && (i.status === 'mastered' || getNonQuranIntervalDays(i.fsrsData) >= 336)
  ).length;

  // Books Discipline:
  const overdueBookItems = items.filter(i => {
    if (!i.isActive || !i.fsrsData?.nextReview) return false;
    const nDate = new Date(i.fsrsData.nextReview);
    nDate.setHours(0, 0, 0, 0);
    return nDate < today;
  }).length;
  const onTimeBooks = activeBookItems > 0 ? Math.max(0, activeBookItems - overdueBookItems) : activeBookItems;
  const booksDisciplineRate = activeBookItems > 0 ? Math.round((onTimeBooks / activeBookItems) * 100) : 100;

  // Books tier counts (4 Stabilitas Memori FSRS Kitab: Mapan >=336h, Kokoh 100-335h, Konsolidasi 30-99h, Baru <30h)
  const booksActiveList = items.filter(i => i.isActive);
  const bBooksTiers = booksActiveList.reduce((acc, i) => {
    const stability = i.fsrsData?.stability || 0;
    const interval = getNonQuranIntervalDays(i.fsrsData);
    const isMapan = i.status === 'mastered' || interval >= 336;
    const isKokoh = interval >= 100 && interval < 336 && !isMapan;
    const isKonsolidasi = interval >= 30 && interval < 100;
    const isBaru = interval < 30;
    if (isMapan) acc.mapan++;
    else if (isKokoh) acc.kokoh++;
    else if (isKonsolidasi) acc.konsolidasi++;
    else acc.baru++;
    return acc;
  }, { mapan: 0, kokoh: 0, konsolidasi: 0, baru: 0 });

  // Concentric 4-Ring SVG Constants (Radius & Circumference)
  // Ring 1 (Mapan / Mutqin - Emerald #10B981)
  const r1 = 43;
  const c1 = 2 * Math.PI * r1;
  // Ring 2 (Kokoh - Electric Sky #0EA5E9)
  const r2 = 35.5;
  const c2 = 2 * Math.PI * r2;
  // Ring 3 (Konsolidasi - Amber #F59E0B)
  const r3 = 28;
  const c3 = 2 * Math.PI * r3;
  // Ring 4 (Baru - Coral #FF6F3D)
  const r4 = 20.5;
  const c4 = 2 * Math.PI * r4;

  // Proportion ratios for Quran rings
  const totalActiveQuran = Math.max(1, activeQuranPages);
  const qRatio1 = activeQuranPages > 0 ? qQuranTiers.mapan / totalActiveQuran : 0;
  const qRatio2 = activeQuranPages > 0 ? qQuranTiers.kokoh / totalActiveQuran : 0;
  const qRatio3 = activeQuranPages > 0 ? qQuranTiers.konsolidasi / totalActiveQuran : 0;
  const qRatio4 = activeQuranPages > 0 ? qQuranTiers.baru / totalActiveQuran : 0;

  // Proportion ratios for Books rings
  const totalActiveBooks = Math.max(1, activeBookItems);
  const bRatio1 = activeBookItems > 0 ? bBooksTiers.mapan / totalActiveBooks : 0;
  const bRatio2 = activeBookItems > 0 ? bBooksTiers.kokoh / totalActiveBooks : 0;
  const bRatio3 = activeBookItems > 0 ? bBooksTiers.konsolidasi / totalActiveBooks : 0;
  const bRatio4 = activeBookItems > 0 ? bBooksTiers.baru / totalActiveBooks : 0;

  return (
    <div className="space-y-2 sm:space-y-2.5 w-full">
      
      {/* ========================================================
          1. BARIS DUA KARTU HERO (AL-QUR'AN & RUANG BUKU)
          ======================================================== */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 w-full">
        
        {/* Card 1 (Sebelah Kiri): Al-Qur'an */}
        <button
          type="button"
          onClick={onNavigateQuran}
          className="neumorph-card p-2.5 sm:p-3.5 rounded-3xl flex flex-col justify-between text-left hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group shadow-sm relative overflow-hidden space-y-2"
        >
          {/* Header Atas */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center shrink-0 shadow-[0_2px_6px_rgba(255,111,61,0.35)]">
                <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <span className="text-xs sm:text-[13px] font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight truncate">
                {language === 'en' ? 'Al-Quran' : language === 'ar' ? 'القرآن' : 'Al-Quran'}
              </span>
            </div>
            <div className="text-[#8493AB] group-hover:text-[#FF6F3D] group-hover:translate-x-0.5 transition-all shrink-0">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Bagian Visual: Cincin Tunggal (4 Ring Konsentris) + Vertical Energy Pillar Disiplin */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-4 w-full my-0.5 select-none">
            {/* Circular Progress Gauge */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 overflow-visible">
                {/* Background Track Rings */}
                <circle cx="50" cy="50" r={r1} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-emerald-500/15 dark:text-emerald-500/10" />
                <circle cx="50" cy="50" r={r2} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-sky-500/15 dark:text-sky-500/10" />
                <circle cx="50" cy="50" r={r3} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-amber-500/15 dark:text-amber-500/10" />
                <circle cx="50" cy="50" r={r4} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-orange-500/15 dark:text-orange-500/10" />

                {/* Ring 1 (Terluar): Mapan & Mutqin (Emerald Green #10B981) */}
                <circle
                  cx="50" cy="50" r={r1}
                  stroke="#10B981" strokeWidth="3" fill="transparent"
                  strokeDasharray={c1}
                  strokeDashoffset={c1 - (c1 * qRatio1)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />

                {/* Ring 2: Kokoh (Electric Sky #0EA5E9) */}
                <circle
                  cx="50" cy="50" r={r2}
                  stroke="#0EA5E9" strokeWidth="3" fill="transparent"
                  strokeDasharray={c2}
                  strokeDashoffset={c2 - (c2 * qRatio2)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />

                {/* Ring 3: Konsolidasi (Amber Yellow #F59E0B) */}
                <circle
                  cx="50" cy="50" r={r3}
                  stroke="#F59E0B" strokeWidth="3" fill="transparent"
                  strokeDasharray={c3}
                  strokeDashoffset={c3 - (c3 * qRatio3)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />

                {/* Ring 4 (Terdalam): Baru (Coral Warm #FF6F3D) */}
                <circle
                  cx="50" cy="50" r={r4}
                  stroke="#FF6F3D" strokeWidth="3" fill="transparent"
                  strokeDasharray={c4}
                  strokeDashoffset={c4 - (c4 * qRatio4)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center Knob */}
              <div className="absolute inset-0 m-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full neumorph-dial-knob flex flex-col items-center justify-center pointer-events-none shadow-xs">
                <span className="text-[11px] sm:text-xs font-black font-mono text-[#18234A] dark:text-[#F8FAFC] leading-none">
                  {quranActivePct < 1 && quranActivePct > 0 ? quranActivePct.toFixed(1) : Math.round(quranActivePct)}%
                </span>
                <span className="text-[6.5px] sm:text-[7px] text-[#8493AB] font-extrabold uppercase mt-0.5 tracking-tight">
                  604 Hal
                </span>
              </div>
            </div>

            {/* Vertical Energy Tube */}
            <div className="flex flex-col items-center justify-between h-20 sm:h-24 py-1 px-1 rounded-2xl neumorph-inset bg-slate-100/60 dark:bg-slate-900/50 shrink-0 w-8.5 sm:w-10">
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500 shrink-0 drop-shadow-xs" />
              <div className="w-2.5 sm:w-3 flex-1 my-1 rounded-full clay-inset bg-slate-200/50 dark:bg-slate-800/60 p-0.5 flex flex-col justify-end items-center relative overflow-hidden">
                <div 
                  className="w-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-t from-amber-500 via-orange-500 to-emerald-400 shadow-xs"
                  style={{ height: `${Math.max(15, quranDisciplineRate)}%` }}
                />
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 shrink-0" />
            </div>
          </div>

          {/* Bagian Bawah: Inset Metrics Tray (Kata Singkat: Mapan, Kokoh, Konsol, Baru) */}
          <div className="w-full neumorph-inset p-1.5 sm:p-2 rounded-2xl space-y-1 text-[10px] sm:text-[11px]">
            {/* Baris 1: Hafalan Aktif */}
            <div className="flex items-center justify-between px-0.5">
              <span className="flex items-center gap-1.5 text-[#5E6D88] dark:text-[#94A3B8] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6F3D] shrink-0" />
                <span>{language === 'en' ? 'Active' : 'Hafalan Aktif'}</span>
              </span>
              <span className="font-mono font-bold text-[#18234A] dark:text-[#F8FAFC]">
                {activeQuranPages} <span className="font-sans font-normal text-[8.5px] text-[#8493AB]">/ 604</span>
              </span>
            </div>

            {/* Baris 2: 4 Status Stabilitas (Kata Pendek & Jelas, Bebas Potongan Teks) */}
            <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5 px-0.5 py-1 border-y border-black/[0.04] dark:border-white/[0.04] text-[9.5px]">
              {/* Mapan */}
              <div className="flex items-center justify-between" title="Mapan / Mutqin (≥ 30 hari)">
                <span className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
                  <span>{language === 'en' ? 'Master' : 'Mapan'}</span>
                </span>
                <span className="font-mono font-bold text-[#10B981] shrink-0">
                  {qQuranTiers.mapan}
                </span>
              </div>

              {/* Kokoh */}
              <div className="flex items-center justify-between" title="Kokoh & Bertumbuh (15–29 hari)">
                <span className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] shrink-0" />
                  <span>{language === 'en' ? 'Strong' : 'Kokoh'}</span>
                </span>
                <span className="font-mono font-bold text-[#0EA5E9] shrink-0">
                  {qQuranTiers.kokoh}
                </span>
              </div>

              {/* Konsol (Konsolidasi) */}
              <div className="flex items-center justify-between" title="Konsolidasi (7–14 hari)">
                <span className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />
                  <span>{language === 'en' ? 'Consol' : 'Konsol'}</span>
                </span>
                <span className="font-mono font-bold text-[#F59E0B] shrink-0">
                  {qQuranTiers.konsolidasi}
                </span>
              </div>

              {/* Baru (Hafalan Baru) */}
              <div className="flex items-center justify-between" title="Hafalan Baru (< 7 hari)">
                <span className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6F3D] shrink-0" />
                  <span>{language === 'en' ? 'New' : 'Baru'}</span>
                </span>
                <span className="font-mono font-bold text-[#FF6F3D] shrink-0">
                  {qQuranTiers.baru}
                </span>
              </div>
            </div>

            {/* Baris 3: Disiplin */}
            <div className="flex items-center justify-between px-0.5 pt-0.5">
              <span className="flex items-center gap-1.5 text-[#5E6D88] dark:text-[#94A3B8] font-semibold">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${quranDisciplineRate >= 100 ? 'bg-purple-500 shadow-xs' : 'bg-zinc-400'}`} />
                <span>{language === 'en' ? 'Discipline' : 'Disiplin'}</span>
              </span>
              <span className={`font-mono font-bold ${quranDisciplineRate >= 100 ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                {quranDisciplineRate}%
              </span>
            </div>
          </div>
        </button>

        {/* Card 2 (Sebelah Kanan): Ruang Buku */}
        <button
          type="button"
          onClick={onNavigateBooks}
          className="neumorph-card p-2.5 sm:p-3.5 rounded-3xl flex flex-col justify-between text-left hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group shadow-sm relative overflow-hidden space-y-2"
        >
          {/* Header Atas */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-[0_2px_6px_rgba(59,130,246,0.35)]">
                <Library className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <span className="text-xs sm:text-[13px] font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight truncate">
                {language === 'en' ? 'Books Space' : language === 'ar' ? 'فضاء الكتب' : 'Ruang Buku'}
              </span>
            </div>
            <div className="text-[#8493AB] group-hover:text-[#3B82F6] group-hover:translate-x-0.5 transition-all shrink-0">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Bagian Visual: Cincin Tunggal (4 Ring Konsentris) + Vertical Energy Pillar Disiplin */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-4 w-full my-0.5 select-none">
            {/* Circular Progress Gauge */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 overflow-visible">
                {/* Background Track Rings */}
                <circle cx="50" cy="50" r={r1} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-emerald-500/15 dark:text-emerald-500/10" />
                <circle cx="50" cy="50" r={r2} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-sky-500/15 dark:text-sky-500/10" />
                <circle cx="50" cy="50" r={r3} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-amber-500/15 dark:text-amber-500/10" />
                <circle cx="50" cy="50" r={r4} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-blue-500/15 dark:text-blue-500/10" />

                {/* Ring 1 (Terluar): Mapan & Mutqin (Emerald Green #10B981) */}
                <circle
                  cx="50" cy="50" r={r1}
                  stroke="#10B981" strokeWidth="3" fill="transparent"
                  strokeDasharray={c1}
                  strokeDashoffset={c1 - (c1 * bRatio1)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />

                {/* Ring 2: Kokoh (Electric Sky #0EA5E9) */}
                <circle
                  cx="50" cy="50" r={r2}
                  stroke="#0EA5E9" strokeWidth="3" fill="transparent"
                  strokeDasharray={c2}
                  strokeDashoffset={c2 - (c2 * bRatio2)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />

                {/* Ring 3: Konsolidasi (Amber Yellow #F59E0B) */}
                <circle
                  cx="50" cy="50" r={r3}
                  stroke="#F59E0B" strokeWidth="3" fill="transparent"
                  strokeDasharray={c3}
                  strokeDashoffset={c3 - (c3 * bRatio3)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />

                {/* Ring 4 (Terdalam): Baru (Blue Royal #3B82F6) */}
                <circle
                  cx="50" cy="50" r={r4}
                  stroke="#3B82F6" strokeWidth="3" fill="transparent"
                  strokeDasharray={c4}
                  strokeDashoffset={c4 - (c4 * bRatio4)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center Knob */}
              <div className="absolute inset-0 m-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full neumorph-dial-knob flex flex-col items-center justify-center pointer-events-none shadow-xs">
                <span className="text-[11px] sm:text-xs font-black font-mono text-[#18234A] dark:text-[#F8FAFC] leading-none">
                  {booksActivePct < 1 && booksActivePct > 0 ? booksActivePct.toFixed(1) : Math.round(booksActivePct)}%
                </span>
                <span className="text-[6.5px] sm:text-[7px] text-[#8493AB] font-extrabold uppercase mt-0.5 tracking-tight">
                  {totalBookItems} Item
                </span>
              </div>
            </div>

            {/* Vertical Energy Tube */}
            <div className="flex flex-col items-center justify-between h-20 sm:h-24 py-1 px-1 rounded-2xl neumorph-inset bg-slate-100/60 dark:bg-slate-900/50 shrink-0 w-8.5 sm:w-10">
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500 shrink-0 drop-shadow-xs" />
              <div className="w-2.5 sm:w-3 flex-1 my-1 rounded-full clay-inset bg-slate-200/50 dark:bg-slate-800/60 p-0.5 flex flex-col justify-end items-center relative overflow-hidden">
                <div 
                  className="w-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-t from-amber-500 via-orange-500 to-emerald-400 shadow-xs"
                  style={{ height: `${Math.max(15, booksDisciplineRate)}%` }}
                />
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 shrink-0" />
            </div>
          </div>

          {/* Bagian Bawah: Inset Metrics Tray (Kata Singkat: Mapan, Kokoh, Konsol, Baru) */}
          <div className="w-full neumorph-inset p-1.5 sm:p-2 rounded-2xl space-y-1 text-[10px] sm:text-[11px]">
            {/* Baris 1: Materi Aktif */}
            <div className="flex items-center justify-between px-0.5">
              <span className="flex items-center gap-1.5 text-[#5E6D88] dark:text-[#94A3B8] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shrink-0" />
                <span>{language === 'en' ? 'Active' : 'Materi Aktif'}</span>
              </span>
              <span className="font-mono font-bold text-[#18234A] dark:text-[#F8FAFC]">
                {activeBookItems} <span className="font-sans font-normal text-[8.5px] text-[#8493AB]">/ {totalBookItems}</span>
              </span>
            </div>

            {/* Baris 2: 4 Status Stabilitas (Kata Pendek & Jelas, Bebas Potongan Teks) */}
            <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5 px-0.5 py-1 border-y border-black/[0.04] dark:border-white/[0.04] text-[9.5px]">
              {/* Mapan */}
              <div className="flex items-center justify-between" title="Mapan (≥ 336 hari)">
                <span className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
                  <span>{language === 'en' ? 'Master' : 'Mapan'}</span>
                </span>
                <span className="font-mono font-bold text-[#10B981] shrink-0">
                  {bBooksTiers.mapan}
                </span>
              </div>

              {/* Kokoh */}
              <div className="flex items-center justify-between" title="Kokoh & Bertumbuh (100–335 hari)">
                <span className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] shrink-0" />
                  <span>{language === 'en' ? 'Strong' : 'Kokoh'}</span>
                </span>
                <span className="font-mono font-bold text-[#0EA5E9] shrink-0">
                  {bBooksTiers.kokoh}
                </span>
              </div>

              {/* Konsol (Konsolidasi) */}
              <div className="flex items-center justify-between" title="Konsolidasi (30–99 hari)">
                <span className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />
                  <span>{language === 'en' ? 'Consol' : 'Konsol'}</span>
                </span>
                <span className="font-mono font-bold text-[#F59E0B] shrink-0">
                  {bBooksTiers.konsolidasi}
                </span>
              </div>

              {/* Baru (Materi Baru) */}
              <div className="flex items-center justify-between" title="Materi Baru (< 30 hari)">
                <span className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shrink-0" />
                  <span>{language === 'en' ? 'New' : 'Baru'}</span>
                </span>
                <span className="font-mono font-bold text-[#3B82F6] shrink-0">
                  {bBooksTiers.baru}
                </span>
              </div>
            </div>

            {/* Baris 3: Disiplin */}
            <div className="flex items-center justify-between px-0.5 pt-0.5">
              <span className="flex items-center gap-1.5 text-[#5E6D88] dark:text-[#94A3B8] font-semibold">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${booksDisciplineRate >= 100 ? 'bg-purple-500 shadow-xs' : 'bg-zinc-400'}`} />
                <span>{language === 'en' ? 'Discipline' : 'Disiplin'}</span>
              </span>
              <span className={`font-mono font-bold ${booksDisciplineRate >= 100 ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                {booksDisciplineRate}%
              </span>
            </div>
          </div>
        </button>

      </div>

      {/* ========================================================
          2. DUA BAR MENYALA-NYALA MURNI (TANPA KOTAK & TANPA TEKS BERLEBIH)
          - Kiri: Tepat di bawah Kartu Al-Qur'an (Bar Plasma Kedisiplinan Al-Qur'an)
          - Kanan: Tepat di bawah Kartu Ruang Buku (Bar Plasma Kedisiplinan Ruang Buku)
          ======================================================== */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 w-full px-1">
        <FireStrikeBar percentage={quranDisciplineRate} size="normal" />
        <FireStrikeBar percentage={booksDisciplineRate} size="normal" />
      </div>

    </div>
  );
};
