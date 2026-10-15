import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  Flame,
  LayoutGrid,
  Maximize2,
  EyeOff,
  Eye,
  BookOpen,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QuranPageItem, Language } from "../../types";
import { isDue } from "../../lib/fsrs";
import { getQuranPageImageUrl } from "../../data/quranData";

export type SpectrumViewMode =
  | "micro8"
  | "compact4"
  | "expanded4"
  | "spread2"
  | "hidden";

interface Props {
  juzNumber: number;
  quranPages: QuranPageItem[];
  startPage: number;
  endPage: number;
  totalPages: number;
  language: Language;
  fromPage: number;
  toPage: number;
  onChangeRange: (from: number, to: number) => void;
  onSelectPage: (pageNumber: number) => void;
  onReviewDuePage?: (pageNumber: number) => void;
  activeFilterTab?: "all" | "due" | "active" | "mapan" | "inactive";
  onFilterTabChange?: (
    tab: "all" | "due" | "active" | "mapan" | "inactive",
  ) => void;
  isDownloadingJuz?: boolean;
  downloadProgress?: { current: number; total: number } | null;
  juzOfflineStatus?: {
    total: number;
    cached: number;
    isFullyCached: boolean;
  } | null;
  onDownloadJuz?: () => void;
}

interface PageSlotData {
  slotIndex: number;
  pageNumber: number;
  item?: QuranPageItem;
  isActive: boolean;
  stabilityDays: number;
  isMapan: boolean;
  isDueToday: boolean;
  statusType: "mapan" | "due" | "active" | "inactive";
  isSelected: boolean;
  isLeftPage: boolean;
  isAvailable: boolean;
}

interface SpreadData {
  spreadIndex: number;
  leftPage: PageSlotData; // Left side of spread (Even page, e.g. Page 22 or Page 2) -> Spine on RIGHT, Badge on LEFT
  rightPage: PageSlotData; // Right side of spread (Odd page, e.g. Page 23 or Page 1) -> Spine on LEFT, Badge on RIGHT
  hasAvailablePages: boolean;
}

interface RowData {
  rowIndex: number;
  spreads: SpreadData[]; // Rendered in LTR DOM order (highest spread index on left, lowest on right for RTL reading)
  hasAvailablePages: boolean;
}

export const QuranJuzSpectrumMap: React.FC<Props> = ({
  juzNumber,
  quranPages,
  startPage,
  endPage,
  totalPages,
  language,
  fromPage,
  toPage,
  onChangeRange,
  onSelectPage,
  onReviewDuePage,
  activeFilterTab = "all",
  onFilterTabChange,
}) => {
  // View mode state: 'micro8' (8 pages/row = 3 rows), 'compact4' (4 pages/row compact), 'expanded4' (4 pages/row full), 'spread2' (2 pages/row = 1 spread), 'hidden'
  const [viewMode, setViewMode] = useState<SpectrumViewMode>(() => {
    try {
      const saved = localStorage.getItem(
        "quran_spectrum_view_mode",
      ) as SpectrumViewMode;
      if (
        saved === "micro8" ||
        saved === "compact4" ||
        saved === "expanded4" ||
        saved === "spread2" ||
        saved === "hidden"
      ) {
        return saved;
      }
      // Migrate legacy mode names
      if ((saved as string) === "compact") return "micro8";
      if ((saved as string) === "expanded") return "expanded4";
    } catch (e) {}
    return "hidden"; // Default: Ditutup secara default!
  });

  const handleSetViewMode = (mode: SpectrumViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("quran_spectrum_view_mode", mode);
    } catch (e) {}
  };

  // Quick stats for filter tab badges
  const filterCounts = useMemo(() => {
    const juzPagesList = (quranPages || []).filter(
      (p) => p.juzNumber === juzNumber,
    );
    const activeList = juzPagesList.filter((p) => p.isActive);
    const dueList = activeList.filter((p) =>
      isDue(p.fsrsData?.nextReview, p.isActive, p.fsrsData?.lastReview),
    );
    const mapanList = activeList.filter((p) => {
      const stabilityDays = Math.round(
        (p.fsrsData?.stability || 0) * 0.4025587,
      );
      return (
        p.status === "mastered_for_now" ||
        !!p.mapanCelebrated ||
        stabilityDays >= 30
      );
    });
    return {
      all: totalPages,
      due: dueList.length,
      active: activeList.length,
      inactive: Math.max(0, totalPages - activeList.length),
      mapan: mapanList.length,
    };
  }, [quranPages, juzNumber, totalPages]);

  // Dynamic Spreads & Rows calculation based on current viewMode (8, 4, or 2 pages per row)
  const rows = useMemo(() => {
    const allPages: number[] = [];
    for (let i = 0; i < totalPages; i++) {
      allPages.push(startPage + i);
    }

    const pagesPerRow =
      viewMode === "micro8" ? 8 : viewMode === "spread2" ? 2 : 4;
    const spreadsPerRow = pagesPerRow / 2;
    const totalSlots =
      Math.ceil(Math.max(24, totalPages) / pagesPerRow) * pagesPerRow;
    const totalRowCount = totalSlots / pagesPerRow;

    const rowList: RowData[] = [];
    let pageArrayIndex = 0;

    for (let r = 0; r < totalRowCount; r++) {
      const rowPages: { pageNumber: number; isAvailable: boolean }[] = [];
      let rowHasAvailable = false;

      for (let p = 0; p < pagesPerRow; p++) {
        const hasPage = pageArrayIndex < allPages.length;
        const targetPageNum = hasPage
          ? allPages[pageArrayIndex]
          : startPage + totalPages - 1;
        const isAvailable = hasPage;

        if (isAvailable) {
          pageArrayIndex++;
          rowHasAvailable = true;
        }

        rowPages.push({ pageNumber: targetPageNum, isAvailable });
      }

      const createSlot = (
        pageInfo: { pageNumber: number; isAvailable: boolean },
        slotIndex: number,
      ): PageSlotData => {
        const targetPageNum = pageInfo.pageNumber;
        const isAvailable = pageInfo.isAvailable;
        const item = isAvailable
          ? quranPages.find((pt) => pt.pageNumber === targetPageNum)
          : undefined;
        const isActive = item?.isActive ?? false;
        const stabilityDays = item
          ? Math.round((item.fsrsData?.stability || 0) * 0.4025587)
          : 0;
        const isMapan = item
          ? item.status === "mastered_for_now" ||
            !!item.mapanCelebrated ||
            stabilityDays >= 30
          : false;
        const isDueToday = item
          ? isDue(
              item.fsrsData?.nextReview,
              item.isActive,
              item.fsrsData?.lastReview,
            )
          : false;

        let statusType: "mapan" | "due" | "active" | "inactive" = "inactive";
        if (isActive) {
          if (isMapan) statusType = "mapan";
          else if (isDueToday) statusType = "due";
          else statusType = "active";
        }

        const isSelected =
          fromPage === toPage
            ? targetPageNum === fromPage
            : targetPageNum >= fromPage && targetPageNum <= toPage;

        // In Madani Mushaf layout:
        // Even pages (2, 4, 6, ..., 22, 24) are on the LEFT (Halaman Kiri).
        // Odd pages (1, 3, 5, ..., 21, 23) are on the RIGHT (Halaman Kanan).
        const isLeft = targetPageNum % 2 === 0;

        return {
          slotIndex,
          pageNumber: targetPageNum,
          item,
          isActive,
          stabilityDays,
          isMapan,
          isDueToday,
          statusType,
          isSelected,
          isLeftPage: isLeft,
          isAvailable,
        };
      };

      const rowSpreads: SpreadData[] = [];

      for (let s = 0; s < spreadsPerRow; s++) {
        const pIndex0 = s * 2; // First page in sequence (lower number, e.g. 22 or 1)
        const pIndex1 = s * 2 + 1; // Second page in sequence (higher number, e.g. 23 or 2)

        // In Arabic Mushaf RTL reading layout:
        // The first page in sequence (pIndex0, lower number) is placed on the RIGHT side of the spread
        // The second page in sequence (pIndex1, higher number) is placed on the LEFT side of the spread
        const spreadRightSlot = createSlot(
          rowPages[pIndex0],
          r * pagesPerRow + pIndex0,
        );
        const spreadLeftSlot = createSlot(
          rowPages[pIndex1],
          r * pagesPerRow + pIndex1,
        );

        rowSpreads.push({
          spreadIndex: s,
          leftPage: spreadLeftSlot,
          rightPage: spreadRightSlot,
          hasAvailablePages:
            rowPages[pIndex0].isAvailable || rowPages[pIndex1].isAvailable,
        });
      }

      // Reverse rowSpreads for normal LTR DOM layout so Spread 0 (containing lowest pages) renders on the far right (Arabic reading RTL)
      const domOrderedSpreads = [...rowSpreads].reverse();

      rowList.push({
        rowIndex: r,
        spreads: domOrderedSpreads,
        hasAvailablePages: rowHasAvailable,
      });
    }

    return rowList;
  }, [totalPages, startPage, quranPages, fromPage, toPage, viewMode]);

  // Render individual page tile with precise spine gradation & outer selection borders
  const renderPageTile = (slot: PageSlotData, isLeftSideOfSpread: boolean) => {
    const isMicro = viewMode === "micro8";
    const isCompact = viewMode === "compact4";
    const isSpread2 = viewMode === "spread2";

    if (!slot.isAvailable) {
      return (
        <div
          className={`relative ${
            isMicro
              ? "h-10 sm:h-12 md:h-14"
              : isCompact
                ? "h-13 sm:h-16 md:h-18"
                : "aspect-[1/1.50]"
          } bg-slate-100/25 dark:bg-slate-800/10 select-none opacity-20 rounded-[3px]`}
        />
      );
    }

    const imgUrl = getQuranPageImageUrl(slot.pageNumber, 1024);
    const isSelected = slot.isSelected;
    const isLeftPage = slot.isLeftPage;
    const isDue = slot.statusType === "due";

    const isJuz1 = juzNumber === 1;
    const pageIndexInJuz = slot.pageNumber - startPage;

    // Sesuai permintaan:
    // - Halaman 1 dan 2 di setiap juz (kecuali juz 1) dan seluruh juz 1 posisi gradasinya sudah benar.
    // - Untuk halaman ke-3 sampai halaman terakhir di setiap juz (kecuali juz 1), posisinya di pinggir bagian dalam (inner edge):
    //   * Halaman kiri pada spread: inner fold ada di sisi KANAN (right-0), badge nomor halaman di KIRI (left-0.5)
    //   * Halaman kanan pada spread: inner fold ada di sisi KIRI (left-0), badge nomor halaman di KANAN (right-0.5)
    let isSpineOnRight = isLeftPage;
    let isBadgeOnLeft = isLeftPage;

    if (!isJuz1 && pageIndexInJuz >= 2) {
      isSpineOnRight = isLeftSideOfSpread;
      isBadgeOnLeft = isLeftSideOfSpread;
    }

    // Filter visibility check
    let isDimmedByFilter = false;
    if (activeFilterTab === "due" && slot.statusType !== "due")
      isDimmedByFilter = true;
    if (activeFilterTab === "active" && !slot.isActive) isDimmedByFilter = true;
    if (activeFilterTab === "inactive" && slot.isActive)
      isDimmedByFilter = true;
    if (activeFilterTab === "mapan" && slot.statusType !== "mapan")
      isDimmedByFilter = true;

    // Selection border styling:
    // Left page of spread -> left outer border
    // Right page of spread -> right outer border
    const selectionClasses = isSelected
      ? isLeftSideOfSpread
        ? "border-l-3 sm:border-l-4 border-[#0EA5E9] z-20"
        : "border-r-3 sm:border-r-4 border-[#0EA5E9] z-20"
      : "border border-amber-900/15 dark:border-slate-700/40";

    return (
      <div
        key={slot.pageNumber}
        onClick={() => {
          if (slot.statusType === "due" && onReviewDuePage) {
            onReviewDuePage(slot.pageNumber);
          } else {
            onSelectPage(slot.pageNumber);
          }
        }}
        className={`relative ${
          isMicro
            ? "h-10 sm:h-12 md:h-14"
            : isCompact
              ? "h-13 sm:h-16 md:h-18"
              : "aspect-[1/1.50]"
        } overflow-hidden cursor-pointer group select-none transition-all duration-150 bg-[#FCFBF7] dark:bg-slate-900 rounded-[3px] shadow-2xs ${selectionClasses} ${
          isDimmedByFilter ? "opacity-25 grayscale-[60%]" : "opacity-100"
        }`}
        title={`Halaman ${slot.pageNumber} (${isLeftPage ? "Halaman Kiri" : "Halaman Kanan"}) • ${slot.statusType.toUpperCase()} ${slot.statusType === "due" ? "• Klik untuk review" : "• Klik untuk lihat"}`}
      >
        {/* Scanned Real Madani Mushaf Page Image */}
        <img
          src={imgUrl}
          alt={`Halaman ${slot.pageNumber}`}
          loading="lazy"
          className={`w-full h-full object-contain object-top select-none transition-transform duration-150 group-hover:scale-105 ${
            isDue ? "filter blur-[1px] brightness-95" : ""
          } ${!slot.isActive ? "grayscale-[65%] opacity-70" : ""}`}
        />

        {/* Binding Spine Gradation (Jilid Tengah Buku Terbuka):
            - Sisi dalam (inner spine) dilengkungkan dengan bayangan jilid buku otentik
        */}
        <div
          className={`absolute inset-y-0 pointer-events-none z-10 ${
            isSpineOnRight
              ? "right-0 w-1.5 sm:w-2.5 bg-gradient-to-l from-black/25 via-black/8 to-transparent"
              : "left-0 w-1.5 sm:w-2.5 bg-gradient-to-r from-black/25 via-black/8 to-transparent"
          }`}
        />

        {/* Status Indicator & Page Number Overlay (Oval Badge positioned on outer corner) */}
        <div
          className={`absolute ${isMicro ? "bottom-0" : "bottom-0.5"} ${isBadgeOnLeft ? "left-0.5" : "right-0.5"} z-20 pointer-events-none`}
        >
          {slot.statusType === "due" ? (
            <span
              className={`px-0.5 py-0.1 sm:px-1 sm:py-0.2 rounded-md bg-gradient-to-r from-[#FB923C] via-[#F97316] to-[#EA580C] text-white font-black ${
                isMicro
                  ? "text-[5.5px] sm:text-[6.5px]"
                  : isCompact
                    ? "text-[6.5px] sm:text-[7.5px]"
                    : "text-[7.5px] sm:text-[8.5px]"
              } leading-none shadow-xs flex items-center gap-0.5`}
            >
              <Flame className="w-1.5 h-1.5 fill-white text-white shrink-0 hidden sm:inline" />
              <span>{slot.pageNumber}</span>
            </span>
          ) : slot.statusType === "mapan" ? (
            <span
              className={`px-0.5 py-0.1 sm:px-1 sm:py-0.2 rounded-md bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-black ${
                isMicro
                  ? "text-[5.5px] sm:text-[6.5px]"
                  : isCompact
                    ? "text-[6.5px] sm:text-[7.5px]"
                    : "text-[7.5px] sm:text-[8.5px]"
              } leading-none shadow-xs flex items-center gap-0.5`}
            >
              <CheckCircle2 className="w-1.5 h-1.5 text-white shrink-0 hidden sm:inline" />
              <span>{slot.pageNumber}</span>
            </span>
          ) : slot.statusType === "active" ? (
            <span
              className={`px-0.5 py-0.1 sm:px-1 sm:py-0.2 rounded-md bg-gradient-to-r from-[#38BDF8] to-[#0284C7] text-white font-bold ${
                isMicro
                  ? "text-[5.5px] sm:text-[6.5px]"
                  : isCompact
                    ? "text-[6.5px] sm:text-[7.5px]"
                    : "text-[7.5px] sm:text-[8.5px]"
              } leading-none shadow-xs`}
            >
              {slot.pageNumber}
            </span>
          ) : (
            <span
              className={`px-0.5 py-0.1 sm:px-1 sm:py-0.2 rounded-md bg-black/60 text-white/90 font-mono ${
                isMicro
                  ? "text-[5px] sm:text-[6px]"
                  : isCompact
                    ? "text-[6px] sm:text-[7px]"
                    : "text-[7px] sm:text-[8px]"
              } leading-none`}
            >
              {slot.pageNumber}
            </span>
          )}
        </div>
      </div>
    );
  };

  const handleFilterClick = (
    tab: "all" | "due" | "active" | "mapan" | "inactive",
  ) => {
    if (onFilterTabChange) onFilterTabChange(tab);
    onChangeRange(startPage, endPage);
    if (viewMode === "hidden") {
      handleSetViewMode("micro8");
    }

    // Smooth scroll the Spectrum Map to the top of the screen (Hero card sinks above)
    setTimeout(() => {
      const container = document.getElementById("quran-juz-spectrum-container");
      if (container) {
        container.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 40);
  };

  return (
    <div
      id="quran-juz-spectrum-container"
      className="clay-card p-2.5 sm:p-3.5 rounded-3xl space-y-2.5 transition-all duration-200 shadow-sm border border-white/60 dark:border-slate-800/80 select-none scroll-mt-3"
    >
      {/* ========================================================
          1. BARIS 1: 5 FILTER BUTTONS (LARGER TOP-RIGHT BADGES & FULL TEXT VISIBILITY)
      ======================================================== */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full pt-1.5">
        {/* Tombol 1: Review */}
        <button
          type="button"
          onClick={() => handleFilterClick("due")}
          className={`relative py-1.5 sm:py-2 px-1 rounded-xl text-[10.5px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 text-center min-w-0 ${
            activeFilterTab === "due"
              ? "bg-gradient-to-b from-[#FB923C] via-[#F97316] to-[#EA580C] text-white shadow-xs font-black ring-1 ring-orange-300"
              : "clay-pill text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]"
          }`}
          title="Tampilkan halaman yang harus di-review (jatuh tempo)"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeFilterTab === "due" ? "bg-white" : "bg-orange-500"}`}
          />
          <span className="truncate">Review</span>
          {filterCounts.due > 0 && (
            <span
              className={`absolute -top-2 -right-1 min-w-[17px] h-[17px] px-1 text-[9px] font-black rounded-full flex items-center justify-center leading-none shadow-xs border border-white/60 dark:border-slate-800 ${
                activeFilterTab === "due"
                  ? "bg-white text-orange-600 font-extrabold"
                  : "bg-orange-500 text-white"
              }`}
            >
              {filterCounts.due}
            </span>
          )}
        </button>

        {/* Tombol 2: Semua */}
        <button
          type="button"
          onClick={() => handleFilterClick("all")}
          className={`relative py-1.5 sm:py-2 px-1 rounded-xl text-[10.5px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
            activeFilterTab === "all"
              ? "clay-btn-primary text-white shadow-xs font-black"
              : "clay-pill text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]"
          }`}
          title="Tampilkan semua halaman pada Juz ini"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeFilterTab === "all" ? "bg-white" : "bg-[#0EA5E9]"}`}
          />
          <span className="truncate">Semua</span>
          <span
            className={`absolute -top-2 -right-1 min-w-[17px] h-[17px] px-1 text-[9px] font-black rounded-full flex items-center justify-center leading-none shadow-xs border border-white/60 dark:border-slate-800 ${
              activeFilterTab === "all"
                ? "bg-white text-sky-600 font-extrabold"
                : "bg-sky-600 text-white"
            }`}
          >
            {filterCounts.all}
          </span>
        </button>

        {/* Tombol 3: Halaman Aktif */}
        <button
          type="button"
          onClick={() => handleFilterClick("active")}
          className={`relative py-1.5 sm:py-2 px-1 rounded-xl text-[10.5px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 text-center min-w-0 ${
            activeFilterTab === "active"
              ? "clay-btn-primary text-white shadow-xs font-black"
              : "clay-pill text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]"
          }`}
          title="Tampilkan halaman aktif"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeFilterTab === "active" ? "bg-white" : "bg-[#0EA5E9]"}`}
          />
          <span className="truncate">Aktif</span>
          {filterCounts.active > 0 && (
            <span
              className={`absolute -top-2 -right-1 min-w-[17px] h-[17px] px-1 text-[9px] font-black rounded-full flex items-center justify-center leading-none shadow-xs border border-white/60 dark:border-slate-800 ${
                activeFilterTab === "active"
                  ? "bg-white text-sky-600 font-extrabold"
                  : "bg-sky-600 text-white"
              }`}
            >
              {filterCounts.active}
            </span>
          )}
        </button>

        {/* Tombol 4: Belum Aktif */}
        <button
          type="button"
          onClick={() => handleFilterClick("inactive")}
          className={`relative py-1.5 sm:py-2 px-1 rounded-xl text-[10.5px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 text-center min-w-0 ${
            activeFilterTab === "inactive"
              ? "bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-xs font-black ring-1 ring-slate-400"
              : "clay-pill text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]"
          }`}
          title="Tampilkan halaman yang belum diaktivasi"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeFilterTab === "inactive" ? "bg-white" : "bg-slate-400"}`}
          />
          <span className="truncate">Belum</span>
          {filterCounts.inactive > 0 && (
            <span
              className={`absolute -top-2 -right-1 min-w-[17px] h-[17px] px-1 text-[9px] font-black rounded-full flex items-center justify-center leading-none shadow-xs border border-white/60 dark:border-slate-800 ${
                activeFilterTab === "inactive"
                  ? "bg-white text-slate-700 font-extrabold"
                  : "bg-slate-600 text-white"
              }`}
            >
              {filterCounts.inactive}
            </span>
          )}
        </button>

        {/* Tombol 5: Mapan */}
        <button
          type="button"
          onClick={() => handleFilterClick("mapan")}
          className={`relative py-1.5 sm:py-2 px-1 rounded-xl text-[10.5px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 text-center min-w-0 ${
            activeFilterTab === "mapan"
              ? "bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-xs font-black ring-1 ring-emerald-300"
              : "clay-pill text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]"
          }`}
          title="Tampilkan halaman mapan (mutqin)"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeFilterTab === "mapan" ? "bg-white" : "bg-emerald-500"}`}
          />
          <span className="truncate">Mapan</span>
          {filterCounts.mapan > 0 && (
            <span
              className={`absolute -top-2 -right-1 min-w-[17px] h-[17px] px-1 text-[9px] font-black rounded-full flex items-center justify-center leading-none shadow-xs border border-white/60 dark:border-slate-800 ${
                activeFilterTab === "mapan"
                  ? "bg-white text-emerald-600 font-extrabold"
                  : "bg-emerald-600 text-white"
              }`}
            >
              {filterCounts.mapan}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================
          2. BARIS 2: JUDUL PETA SATU JUZ (KIRI) + MULTI-MODE SWITCHER (KANAN)
      ======================================================== */}
      <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
        {/* Left: Clean Single-line Title */}
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <BookOpen className="w-4 h-4 text-[#FF6F3D] shrink-0" />
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight whitespace-nowrap">
            {language === "en" ? "Full Juz Map" : "Peta Satu Juz"}
          </span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0 whitespace-nowrap">
            • Juz {juzNumber}
          </span>
        </div>

        {/* Right: Multi-Density Switcher Capsule (8 Hlm / 3 Baris · 4 Hlm Padat · 4 Hlm Besar · 2 Hlm Fokus · Tutup) */}
        <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 clay-inset rounded-xl shrink-0 overflow-x-auto">
          {/* 1. Mode 8 Halaman / 3 Baris Penuh (Ultra-Padat) */}
          <button
            type="button"
            onClick={() => handleSetViewMode("micro8")}
            className={`px-1.5 sm:px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer select-none ${
              viewMode === "micro8"
                ? "clay-pill text-[#FF6F3D] shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            }`}
            title="Mode Mikro: 8 Halaman/Baris (Hanya 3 Baris - Paling Padat)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black">8</span>
          </button>

          {/* 2. Mode 4 Halaman Kompak (Padat) */}
          <button
            type="button"
            onClick={() => handleSetViewMode("compact4")}
            className={`px-1.5 sm:px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer select-none ${
              viewMode === "compact4"
                ? "clay-pill text-[#FF6F3D] shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            }`}
            title="Mode Kompak: 4 Halaman/Baris (Padat)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black">4</span>
          </button>

          {/* 3. Mode 4 Halaman Besar (Lega) */}
          <button
            type="button"
            onClick={() => handleSetViewMode("expanded4")}
            className={`px-1.5 sm:px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer select-none ${
              viewMode === "expanded4"
                ? "clay-pill text-[#0EA5E9] shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            }`}
            title="Mode Besar: 4 Halaman/Baris (Lega)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black">4+</span>
          </button>

          {/* 4. Mode 2 Halaman Fokus (1 Spread Besar per Baris) */}
          <button
            type="button"
            onClick={() => handleSetViewMode("spread2")}
            className={`px-1.5 sm:px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer select-none ${
              viewMode === "spread2"
                ? "clay-pill text-[#10B981] shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            }`}
            title="Mode Fokus: 2 Halaman/Baris (1 Spread Besar)"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black">2</span>
          </button>

          {/* 5. Mode Sembunyi / Tutup */}
          <button
            type="button"
            onClick={() =>
              handleSetViewMode(viewMode === "hidden" ? "micro8" : "hidden")
            }
            className={`px-1.5 sm:px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer select-none ${
              viewMode === "hidden"
                ? "clay-pill text-amber-600 dark:text-amber-400 shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            }`}
            title={
              viewMode === "hidden"
                ? "Tampilkan Peta Satu Juz"
                : "Sembunyikan Peta Satu Juz"
            }
          >
            {viewMode === "hidden" ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================
          3. PETA SPEKTRUM MUSHAF DYNAMIC DENSITY (ANIMATED COLLAPSE / 8 / 4 / 4+ / 2)
      ======================================================== */}
      <AnimatePresence initial={false}>
        {viewMode !== "hidden" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`clay-inset ${
              viewMode === "micro8"
                ? "p-1.5 sm:p-2 space-y-1 sm:space-y-1.5 w-full"
                : viewMode === "compact4"
                  ? "p-1.5 sm:p-2 space-y-1 sm:space-y-1.5 max-w-[340px] sm:max-w-[420px] md:max-w-[480px] mx-auto"
                  : viewMode === "spread2"
                    ? "p-2 sm:p-3 space-y-2 sm:space-y-2.5 max-w-[360px] sm:max-w-[460px] mx-auto"
                    : "p-2 sm:p-2.5 space-y-1.5 sm:space-y-2 w-full"
            } rounded-2xl bg-slate-50/60 dark:bg-slate-900/50 overflow-hidden`}
          >
            {rows.map((row) => {
              if (!row.hasAvailablePages) return null;

              return (
                <div
                  key={`row-${row.rowIndex}`}
                  className={`flex flex-row items-center justify-between ${
                    viewMode === "micro8"
                      ? "gap-0.5 sm:gap-1"
                      : viewMode === "compact4"
                        ? "gap-1 sm:gap-1.5"
                        : "gap-1.5 sm:gap-2"
                  } w-full`}
                >
                  {row.spreads.map((spread) => (
                    <div
                      key={`spread-${row.rowIndex}-${spread.spreadIndex}`}
                      className="grid grid-cols-2 gap-0 relative rounded-[3px] overflow-hidden shadow-2xs border border-amber-900/20 dark:border-slate-700/60 bg-[#FCFBF7] dark:bg-slate-900 flex-1 min-w-0"
                    >
                      {/* Left Page of Spread (isLeftSideOfSpread = true, Even page) -> Selection border on outer left */}
                      {renderPageTile(spread.leftPage, true)}

                      {/* Right Page of Spread (isLeftSideOfSpread = false, Odd page) -> Selection border on outer right */}
                      {renderPageTile(spread.rightPage, false)}
                    </div>
                  ))}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
