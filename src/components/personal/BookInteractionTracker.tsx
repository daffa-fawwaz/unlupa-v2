import React, { useState, useMemo } from "react";
import { Book, BookItem, Chapter } from "../../types";
import { getNonQuranIntervalDays } from "../../lib/fsrs";
import { BilingualCardText } from "../common/BilingualCardText";
import {
  ShieldCheck,
  Clock,
  Flame,
  Search,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  X,
  Activity,
  Play,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BookInteractionTrackerProps {
  book: Book;
  items: BookItem[];
  chapters?: Chapter[];
  language: string;
  dueCount?: number;
  onStartReview?: () => void;
  onSelectCard?: (item: BookItem) => void;
  onOpenCalendar?: () => void;
}

export const BookInteractionTracker: React.FC<BookInteractionTrackerProps> = ({
  book,
  items,
  chapters = [],
  language,
  dueCount,
  onStartReview,
  onSelectCard,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<
    "all" | "due" | "high_freq" | "mastered"
  >("all");

  // Chapter lookup map
  const chapterMap = useMemo(() => {
    const map = new Map<string, string>();
    chapters.forEach((c) => map.set(c.id, c.title));
    return map;
  }, [chapters]);

  // Active items calculation
  const activeItems = useMemo(() => items.filter((i) => i.isActive), [items]);
  const totalActive = activeItems.length;

  const todayStr = useMemo(() => new Date().toDateString(), []);

  // Process item statistics
  const {
    totalFrequency,
    onTimeCount,
    overdueCount,
    dueTodayCount,
    completedTodayCount,
    onTimeRate,
    masteredCount,
    masteryRate,
    itemRecords,
  } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalFreq = 0;
    let overdue = 0;
    let dueToday = 0;
    let completedToday = 0;
    let mastered = 0;

    const records = activeItems.map((item, index) => {
      const reps = item.fsrsData?.reps || 0;
      const lapses = item.fsrsData?.lapses || 0;
      const logCount = item.reviewLogs?.length || 0;
      const freq = Math.max(reps + lapses, logCount);
      totalFreq += freq;

      const intervalDays = getNonQuranIntervalDays(item.fsrsData);
      const isMastered = intervalDays >= 30 || item.status === "mastered";
      if (isMastered) {
        mastered++;
      }

      const lastRevDate = item.fsrsData?.lastReview
        ? new Date(item.fsrsData.lastReview)
        : null;
      const isReviewedToday = lastRevDate
        ? lastRevDate.toDateString() === todayStr
        : false;
      if (isReviewedToday) {
        completedToday++;
      }

      const nextRevDate = item.fsrsData?.nextReview
        ? new Date(item.fsrsData.nextReview)
        : null;
      let isDue = false;
      let isOverdue = false;
      let overdueDays = 0;
      let diffDays = 0;

      if (!isReviewedToday) {
        if (!nextRevDate) {
          isDue = true;
          dueToday++;
        } else {
          const nextCopy = new Date(nextRevDate);
          nextCopy.setHours(0, 0, 0, 0);
          const diffTime = nextCopy.getTime() - today.getTime();
          diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            isOverdue = true;
            isDue = true;
            overdueDays = Math.abs(diffDays);
            overdue++;
          } else if (diffDays === 0) {
            isDue = true;
            dueToday++;
          }
        }
      }

      let lastReviewLabel = language === "en" ? "Never" : "Belum pernah";
      if (lastRevDate) {
        const lastCopy = new Date(lastRevDate);
        lastCopy.setHours(0, 0, 0, 0);
        const pastDiff = Math.round(
          (today.getTime() - lastCopy.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (pastDiff === 0)
          lastReviewLabel = language === "en" ? "Today" : "Hari ini";
        else if (pastDiff === 1)
          lastReviewLabel = language === "en" ? "Yesterday" : "Kemarin";
        else
          lastReviewLabel = `${pastDiff} ${language === "en" ? "d ago" : "h lalu"}`;
      }

      return {
        id: item.id,
        itemIndex: (item as any).index || index + 1,
        title: item.question || `Kartu #${index + 1}`,
        chapterTitle: item.chapterId
          ? chapterMap.get(item.chapterId)
          : undefined,
        rawItem: item,
        frequency: freq,
        reps,
        lapses,
        intervalDays,
        isMastered,
        isReviewedToday,
        isDue,
        isOverdue,
        overdueDays,
        diffDays,
        lastReviewLabel,
      };
    });

    const onTime =
      totalActive > 0 ? Math.max(0, totalActive - overdue) : totalActive;
    const rate =
      totalActive > 0 ? Math.round((onTime / totalActive) * 100) : 100;
    const mRate =
      totalActive > 0 ? Math.round((mastered / totalActive) * 100) : 0;

    return {
      totalFrequency: totalFreq,
      onTimeCount: onTime,
      overdueCount: overdue,
      dueTodayCount: dueToday,
      completedTodayCount: completedToday,
      onTimeRate: rate,
      masteredCount: mastered,
      masteryRate: mRate,
      itemRecords: records,
    };
  }, [activeItems, todayStr, totalActive, chapterMap, language]);

  // Filtered records for details table
  const filteredItems = useMemo(() => {
    let list = [...itemRecords];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          (i.title || "").toLowerCase().includes(q) ||
          (i.chapterTitle || "").toLowerCase().includes(q),
      );
    }

    if (filterMode === "due") {
      list = list.filter((i) => i.isOverdue || i.isDue);
      list.sort((a, b) => b.overdueDays - a.overdueDays);
    } else if (filterMode === "high_freq") {
      list.sort((a, b) => b.frequency - a.frequency);
    } else if (filterMode === "mastered") {
      list = list.filter((i) => i.isMastered);
      list.sort((a, b) => b.intervalDays - a.intervalDays);
    } else {
      list.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.isDue && !b.isDue) return -1;
        if (!a.isDue && b.isDue) return 1;
        return b.frequency - a.frequency;
      });
    }

    return list;
  }, [itemRecords, searchQuery, filterMode]);

  return (
    <div
      data-no-swipe="true"
      className="clay-card-subtle bg-white/80 dark:bg-[#181D28]/80 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-3.5 sm:p-5 space-y-3.5 transition-all duration-300 shadow-xs"
    >
      {/* 1. COMPACT TOP HEADER */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-black/[0.04] dark:border-white/[0.04]">
        {/* Left Title & Subtitle */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Activity className="w-4 h-4 text-white shrink-0" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight truncate">
              {language === "en"
                ? "Study Frequency & Schedule Adherence"
                : "Pelacakan Belajar & Ketepatan Jadwal"}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-semibold truncate">
              {book.title} • {totalActive}{" "}
              {language === "en" ? "active cards" : "kartu aktif"}
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {dueCount && dueCount > 0 && onStartReview ? (
            <button
              type="button"
              onClick={onStartReview}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 clay-btn-gold text-white font-black text-xs shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>
                {language === "en"
                  ? `Review (${dueCount})`
                  : `Review (${dueCount})`}
              </span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-xl neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] hover:scale-105 active:scale-95 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <span>
              {isExpanded
                ? language === "en"
                  ? "Close"
                  : "Tutup Rincian"
                : `${language === "en" ? "Details" : "Rincian"} (${itemRecords.length})`}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#5E6D88] transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* ========================================================
          2. TOP GRID (DUAL CARDS - SIDE BY SIDE) 
          EXACTLY MATCHING HOMEHEROPROGRESSRINGS.TSX FROM BERANDA
          ======================================================== */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 w-full">
        {/* Card 1 (Left): Ketepatan Jadwal */}
        <div className="neumorph-card p-3 sm:p-4 rounded-3xl flex flex-col items-center justify-between text-center transition-all shadow-sm relative overflow-hidden">
          {/* Top: Dual Concentric Circular Gauge with Raised Tactile Knob */}
          <div className="relative w-22 h-22 sm:w-26 sm:h-26 shrink-0 my-1 flex items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full transform -rotate-90"
            >
              <defs>
                <linearGradient
                  id="jadwalOuterGradCompact"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
                <linearGradient
                  id="jadwalInnerGradCompact"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#FF6F3D" />
                  <stop offset="100%" stopColor="#FFA180" />
                </linearGradient>
                <filter
                  id="jadwalGlow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feDropShadow
                    dx="0"
                    dy="2"
                    stdDeviation="2.5"
                    floodColor="#10B981"
                    floodOpacity="0.4"
                  />
                </filter>
              </defs>

              {/* Sunken Outer Track */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#D2DBE8"
                strokeWidth="7"
                fill="transparent"
                className="dark:stroke-[#1B263B]"
              />
              {/* Active Arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#jadwalOuterGradCompact)"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={
                  2 * Math.PI * 40 -
                  (2 * Math.PI * 40 * Math.min(100, Math.max(0, onTimeRate))) /
                    100
                }
                strokeLinecap="round"
                filter="url(#jadwalGlow)"
                className="transition-all duration-1000 ease-out"
              />

              {/* Sunken Inner Track */}
              <circle
                cx="50"
                cy="50"
                r="30"
                stroke="#DCE4EE"
                strokeWidth="5"
                fill="transparent"
                className="dark:stroke-[#151F30]"
              />
              {/* Inner Overdue Arc */}
              <circle
                cx="50"
                cy="50"
                r="30"
                stroke="url(#jadwalInnerGradCompact)"
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 30}
                strokeDashoffset={
                  2 * Math.PI * 30 -
                  (2 *
                    Math.PI *
                    30 *
                    Math.min(
                      100,
                      Math.max(
                        0,
                        totalActive > 0
                          ? (overdueCount / totalActive) * 100
                          : 0,
                      ),
                    )) /
                    100
                }
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Center 3D Raised Dial Knob */}
            <div className="absolute inset-0 m-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full neumorph-dial-knob flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs sm:text-sm font-black font-mono text-[#18234A] dark:text-[#F8FAFC] leading-none">
                {onTimeRate}%
              </span>
              <span className="text-[7.5px] sm:text-[8.5px] text-[#8493AB] dark:text-[#8493AB] font-extrabold uppercase mt-0.5 tracking-tight">
                Disiplin
              </span>
            </div>
          </div>

          {/* Bottom Title & Metrics Tray */}
          <div className="w-full mt-1.5 space-y-1 sm:space-y-1.5">
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-[#18234A] dark:text-[#F8FAFC]">
              <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-lg bg-gradient-to-br from-[#10B981] to-[#059669] text-white flex items-center justify-center shrink-0 shadow-[0_2px_6px_rgba(16,185,129,0.35)]">
                <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </div>
              <span className="text-xs sm:text-sm font-extrabold truncate">
                Ketepatan
              </span>
              <ArrowRight className="w-3 h-3 text-[#8493AB] shrink-0" />
            </div>

            <div className="neumorph-inset p-1.5 sm:p-2 rounded-xl space-y-1 text-[10px] sm:text-xs">
              <div className="flex items-center justify-between px-1">
                <span className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
                  <span>Tepat Waktu</span>
                </span>
                <span className="font-mono font-bold text-[#10B981]">
                  {onTimeCount}{" "}
                  <span className="font-sans font-normal text-[9px] text-[#8493AB]">
                    / {totalActive}
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between px-1 border-t border-black/[0.04] dark:border-white/[0.04] pt-0.5">
                <span className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6F3D] shrink-0" />
                  <span>Terlambat</span>
                </span>
                <span className="font-mono font-bold text-[#FF6F3D]">
                  {overdueCount}{" "}
                  <span className="font-sans font-normal text-[9px] text-[#8493AB]">
                    kartu
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 (Right): Status Masteri */}
        <div className="neumorph-card p-3 sm:p-4 rounded-3xl flex flex-col items-center justify-between text-center transition-all shadow-sm relative overflow-hidden">
          {/* Top: Dual Concentric Circular Gauge with Raised Tactile Knob */}
          <div className="relative w-22 h-22 sm:w-26 sm:h-26 shrink-0 my-1 flex items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full transform -rotate-90"
            >
              <defs>
                <linearGradient
                  id="masteryOuterGradCompact"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>
                <linearGradient
                  id="masteryInnerGradCompact"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
                <filter
                  id="masteryGlow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feDropShadow
                    dx="0"
                    dy="2"
                    stdDeviation="2.5"
                    floodColor="#38BDF8"
                    floodOpacity="0.4"
                  />
                </filter>
              </defs>

              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#D2DBE8"
                strokeWidth="7"
                fill="transparent"
                className="dark:stroke-[#1B263B]"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#masteryOuterGradCompact)"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={
                  2 * Math.PI * 40 -
                  (2 * Math.PI * 40 * Math.min(100, Math.max(0, masteryRate))) /
                    100
                }
                strokeLinecap="round"
                filter="url(#masteryGlow)"
                className="transition-all duration-1000 ease-out"
              />

              <circle
                cx="50"
                cy="50"
                r="30"
                stroke="#DCE4EE"
                strokeWidth="5"
                fill="transparent"
                className="dark:stroke-[#151F30]"
              />
              <circle
                cx="50"
                cy="50"
                r="30"
                stroke="url(#masteryInnerGradCompact)"
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 30}
                strokeDashoffset={
                  2 * Math.PI * 30 -
                  (2 * Math.PI * 30 * Math.min(100, Math.max(0, masteryRate))) /
                    100
                }
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            <div className="absolute inset-0 m-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full neumorph-dial-knob flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs sm:text-sm font-black font-mono text-[#18234A] dark:text-[#F8FAFC] leading-none">
                {masteryRate}%
              </span>
              <span className="text-[7.5px] sm:text-[8.5px] text-[#8493AB] dark:text-[#8493AB] font-extrabold uppercase mt-0.5 tracking-tight">
                Mapan
              </span>
            </div>
          </div>

          {/* Bottom Title & Metrics Tray */}
          <div className="w-full mt-1.5 space-y-1 sm:space-y-1.5">
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-[#18234A] dark:text-[#F8FAFC]">
              <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-lg bg-gradient-to-br from-[#38BDF8] to-[#0284C7] text-white flex items-center justify-center shrink-0 shadow-[0_2px_6px_rgba(56,189,248,0.35)]">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </div>
              <span className="text-xs sm:text-sm font-extrabold truncate">
                Status Masteri
              </span>
              <ArrowRight className="w-3 h-3 text-[#8493AB] shrink-0" />
            </div>

            <div className="neumorph-inset p-1.5 sm:p-2 rounded-xl space-y-1 text-[10px] sm:text-xs">
              <div className="flex items-center justify-between px-1">
                <span className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6F3D] shrink-0" />
                  <span>Perlu Review</span>
                </span>
                <span className="font-mono font-bold text-[#FF6F3D]">
                  {dueTodayCount}{" "}
                  <span className="font-sans font-normal text-[9px] text-[#8493AB]">
                    / {totalActive}
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between px-1 border-t border-black/[0.04] dark:border-white/[0.04] pt-0.5">
                <span className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
                  <span>Mapan</span>
                </span>
                <span className="font-mono font-bold text-[#10B981]">
                  {masteredCount}{" "}
                  <span className="font-sans font-normal text-[9px] text-[#8493AB]">
                    ({masteryRate}%)
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. EXPANDED RINCIAN DATA SECTION
          ======================================================== */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-3.5 sm:p-4 space-y-3 neumorph-inset border-t border-black/[0.04] dark:border-white/[0.04]"
          >
            {/* Controls Bar: Search & Cohesive Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-[#5E6D88] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kartu materi atau bab..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl neumorph-card text-[#18234A] dark:text-[#F8FAFC] placeholder-[#5E6D88] focus:outline-none focus:ring-1 focus:ring-[#FF6F3D]/40 transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5E6D88] hover:text-[#18234A] dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all shrink-0 ${
                    filterMode === "all"
                      ? "bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white shadow-2xs"
                      : "neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]"
                  }`}
                >
                  Semua ({itemRecords.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterMode("due")}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all shrink-0 flex items-center gap-1 ${
                    filterMode === "due"
                      ? "bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white shadow-2xs"
                      : "neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Jatuh Tempo ({dueTodayCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterMode("high_freq")}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all shrink-0 flex items-center gap-1 ${
                    filterMode === "high_freq"
                      ? "bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white shadow-2xs"
                      : "neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]"
                  }`}
                >
                  <Flame className="w-3 h-3" />
                  <span>Paling Sering</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterMode("mastered")}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all shrink-0 flex items-center gap-1 ${
                    filterMode === "mastered"
                      ? "bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white shadow-2xs"
                      : "neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]"
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Mapan ({masteredCount})</span>
                </button>
              </div>
            </div>

            {/* Compact Table View (>= md) */}
            <div className="hidden md:block neumorph-card rounded-2xl overflow-hidden">
              <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-300/40">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white/95 dark:bg-[#182236]/95 backdrop-blur-xs border-b border-black/[0.04] dark:border-white/[0.04] text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] uppercase tracking-wider z-10">
                    <tr>
                      <th scope="col" className="py-2 px-3 w-[45%]">
                        Kartu Materi & Bab
                      </th>
                      <th scope="col" className="py-2 px-3 w-[15%] text-center">
                        Interval
                      </th>
                      <th scope="col" className="py-2 px-3 w-[18%] text-center">
                        Frekuensi
                      </th>
                      <th scope="col" className="py-2 px-3 w-[22%] text-right">
                        Status Jadwal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.03] text-xs">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => onSelectCard?.(item.rawItem)}
                          className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        >
                          <td className="py-2 px-3">
                            <div className="flex items-start gap-2.5">
                              <div className="w-6 h-6 rounded-lg neumorph-inset text-[#FF6F3D] font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                {item.itemIndex}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-[#18234A] dark:text-[#F8FAFC] line-clamp-1 group-hover:text-[#FF6F3D] transition-colors">
                                  <BilingualCardText
                                    text={item.title}
                                    type="question"
                                    variant="compact"
                                  />
                                </div>
                                {item.chapterTitle && (
                                  <div className="text-[10px] text-[#5E6D88] dark:text-[#94A3B8] truncate">
                                    {item.chapterTitle}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-2 px-3 text-center">
                            <div className="font-bold text-[#18234A] dark:text-[#F8FAFC] tabular-nums">
                              {item.intervalDays}h
                            </div>
                            <div className="text-[9px] text-[#5E6D88] dark:text-[#94A3B8]">
                              {item.lastReviewLabel}
                            </div>
                          </td>

                          <td className="py-2 px-3 text-center">
                            <div className="font-bold text-[#18234A] dark:text-[#F8FAFC] tabular-nums">
                              {item.frequency}x diulang
                            </div>
                            <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              {item.reps} lancar{" "}
                              {item.lapses > 0 ? `• ${item.lapses} ulang` : ""}
                            </div>
                          </td>

                          <td className="py-2 px-3 text-right">
                            {item.isReviewedToday ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-bold shadow-2xs">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Selesai Hari Ini</span>
                              </span>
                            ) : item.isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold shadow-2xs">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>Terlambat {item.overdueDays}h</span>
                              </span>
                            ) : item.isDue ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-bold shadow-2xs">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Jatuh Tempo</span>
                              </span>
                            ) : item.isMastered ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-teal-500 text-white text-[9px] font-bold shadow-2xs">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Mapan</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full neumorph-card text-[#5E6D88] dark:text-[#94A3B8] text-[9px] font-semibold">
                                <span>
                                  {item.diffDays > 0
                                    ? `${item.diffDays}h lagi`
                                    : "Terjadwal"}
                                </span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-6 text-center text-xs text-[#5E6D88] dark:text-[#94A3B8]"
                        >
                          Tidak ada kartu yang cocok dengan kriteria pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View (< md) */}
            <div className="md:hidden space-y-2 max-h-72 overflow-y-auto pr-0.5 scrollbar-thin">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectCard?.(item.rawItem)}
                    className="p-2.5 rounded-2xl neumorph-card space-y-1.5 active:scale-[0.99] transition-transform cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-lg neumorph-inset text-[#FF6F3D] font-mono font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                          {item.itemIndex}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#18234A] dark:text-[#F8FAFC] line-clamp-1">
                            <BilingualCardText
                              text={item.title}
                              type="question"
                              variant="compact"
                            />
                          </div>
                          {item.chapterTitle && (
                            <div className="text-[9px] text-[#5E6D88] dark:text-[#94A3B8] truncate">
                              {item.chapterTitle}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {item.isReviewedToday ? (
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[8px] font-bold">
                            Selesai
                          </span>
                        ) : item.isOverdue ? (
                          <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[8px] font-bold">
                            Terlambat {item.overdueDays}h
                          </span>
                        ) : item.isDue ? (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[8px] font-bold">
                            Jatuh Tempo
                          </span>
                        ) : item.isMastered ? (
                          <span className="px-1.5 py-0.2 rounded-full bg-teal-500 text-white text-[8px] font-bold">
                            Mapan
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded-full neumorph-card text-[#5E6D88] text-[8px] font-semibold">
                            {item.diffDays > 0
                              ? `${item.diffDays}h lagi`
                              : "Terjadwal"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-[#5E6D88] dark:text-[#94A3B8] pt-1 border-t border-black/[0.03] dark:border-white/[0.04]">
                      <span>
                        Interval:{" "}
                        <strong className="text-[#18234A] dark:text-[#F8FAFC]">
                          {item.intervalDays} hari
                        </strong>{" "}
                        ({item.lastReviewLabel})
                      </span>
                      <span>
                        Diulang:{" "}
                        <strong className="text-[#18234A] dark:text-[#F8FAFC]">
                          {item.frequency}x
                        </strong>
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-[#5E6D88] dark:text-[#94A3B8]">
                  Tidak ada kartu yang cocok dengan kriteria pencarian.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
