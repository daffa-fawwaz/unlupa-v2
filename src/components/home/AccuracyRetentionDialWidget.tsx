import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import {
  Award,
  CheckCircle2,
  Flame,
  RotateCcw,
  TrendingUp,
  Target,
  AlertCircle,
  BookOpen,
  Library,
  Layers,
  ChevronRight,
} from "lucide-react";
import { motion } from "motion/react";

type AccuracyFilter = "all" | "quran" | "books";

export const AccuracyRetentionDialWidget: React.FC = () => {
  const { quranPages, items, language } = useApp();
  const [filter, setFilter] = useState<AccuracyFilter>("all");

  const metrics = useMemo(() => {
    let countMutqin = 0; // Rating 3 (Quran) or 3/4 (Books)
    let countLancar = 0; // Rating 2
    let countUlang = 0; // Rating 1
    let totalReviews = 0;

    // Quran review logs
    if (filter === "all" || filter === "quran") {
      (quranPages || []).forEach((p) => {
        (p.reviewLogs || []).forEach((log) => {
          totalReviews++;
          if (log.rating === 3) countMutqin++;
          else if (log.rating === 2) countLancar++;
          else countUlang++;
        });
      });
    }

    // Books review logs
    if (filter === "all" || filter === "books") {
      (items || []).forEach((it) => {
        (it.reviewLogs || []).forEach((log) => {
          totalReviews++;
          if (log.rating === 3 || log.rating === 4) countMutqin++;
          else if (log.rating === 2) countLancar++;
          else countUlang++;
        });
      });
    }

    const successfulReviews = countMutqin + countLancar;
    const accuracyPercent =
      totalReviews > 0
        ? Math.round((successfulReviews / totalReviews) * 100)
        : 100;

    const mutqinPercent =
      totalReviews > 0 ? Math.round((countMutqin / totalReviews) * 100) : 0;
    const lancarPercent =
      totalReviews > 0 ? Math.round((countLancar / totalReviews) * 100) : 0;
    const ulangPercent =
      totalReviews > 0 ? Math.max(0, 100 - mutqinPercent - lancarPercent) : 0;

    return {
      totalReviews,
      successfulReviews,
      accuracyPercent,
      countMutqin,
      countLancar,
      countUlang,
      mutqinPercent,
      lancarPercent,
      ulangPercent,
    };
  }, [quranPages, items, filter]);

  // SVG Gauge calculations
  const radius = 42;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  // Semi-circle arc (180 degrees)
  const semiArc = circumference * 0.5;
  const strokeDashoffset = semiArc - (semiArc * metrics.accuracyPercent) / 100;

  // Status message
  const statusInfo = useMemo(() => {
    if (metrics.totalReviews === 0) {
      return {
        label: language === "en" ? "Ready" : "Siap Murajaah",
        summary:
          language === "en"
            ? "Start your first review session to measure accuracy."
            : "Mulai sesi murajaah untuk mengukur tingkat kelancaran Anda.",
        color: "text-[#10B981]",
      };
    }
    if (metrics.accuracyPercent >= 85) {
      return {
        label: language === "en" ? "Excellent" : "Sangat Lancar",
        summary:
          language === "en"
            ? "Superb retention! Most of your reviews are fluent with minimal errors."
            : "Hafalan sangat kuat. Mayoritas sesi diselesaikan dengan lancar dan minim salah.",
        color: "text-[#10B981]",
      };
    }
    if (metrics.accuracyPercent >= 60) {
      return {
        label: language === "en" ? "Good" : "Cukup Terjaga",
        summary:
          language === "en"
            ? "Good progress. Routine reviews will consolidate your memory into permanent state."
            : "Performa baik. Rutin murajaah akan mematangkan hafalan ke memori jangka panjang.",
        color: "text-[#FF7E4A]",
      };
    }
    return {
      label: language === "en" ? "Needs Focus" : "Perlu Penguatan",
      summary:
        language === "en"
          ? "Focus on repeated items to quickly stabilize weak spots."
          : "Fokus tuntaskan materi bertanda merah untuk memperkokoh titik lemah.",
      color: "text-[#EF4444]",
    };
  }, [metrics, language]);

  return (
    <div className="neumorph-card p-4 sm:p-5 rounded-3xl space-y-4 h-full flex flex-col justify-between relative overflow-hidden">
      {/* 1. Header with Direct Title, Filter Tabs & Percentage Badge */}
      <div className="flex flex-col gap-2.5 pb-3 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8.5 h-8.5 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(16,185,129,0.35)]">
              <Award className="w-4.5 h-4.5 text-white shrink-0" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#18234A] dark:text-[#F8FAFC] tracking-tight truncate">
                {language === "en"
                  ? "Review Accuracy & Quality"
                  : "Kualitas Hasil Murajaah"}
              </h3>
              <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-medium">
                {metrics.totalReviews > 0
                  ? `${metrics.totalReviews} ${language === "en" ? "evaluations completed" : "sesi evaluasi tercatat"}`
                  : language === "en"
                    ? "No evaluation yet"
                    : "Belum ada evaluasi"}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-2xl neumorph-card text-xs font-black text-[#10B981] flex items-center gap-1 shrink-0 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            <span>
              {metrics.accuracyPercent}%{" "}
              {language === "en" ? "Passed" : "Lancar"}
            </span>
          </span>
        </div>

        {/* Quick Filter: All vs Quran vs Books */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl neumorph-inset bg-black/[0.02] dark:bg-white/[0.02] self-start sm:self-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`flex-1 sm:flex-none px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
              filter === "all"
                ? "neumorph-card text-[#18234A] dark:text-[#F8FAFC] shadow-xs"
                : "text-[#8493AB] hover:text-[#18234A] dark:hover:text-[#F8FAFC]"
            }`}
          >
            {language === "en" ? "All" : "Semua"}
          </button>
          <button
            type="button"
            onClick={() => setFilter("quran")}
            className={`flex-1 sm:flex-none px-3 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
              filter === "quran"
                ? "neumorph-card text-[#10B981] shadow-xs"
                : "text-[#8493AB] hover:text-[#10B981]"
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>{language === "en" ? "Qur'an" : "Al-Qur'an"}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("books")}
            className={`flex-1 sm:flex-none px-3 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
              filter === "books"
                ? "neumorph-card text-[#FF6F3D] shadow-xs"
                : "text-[#8493AB] hover:text-[#FF6F3D]"
            }`}
          >
            <Library className="w-3 h-3" />
            <span>{language === "en" ? "Books" : "Kitab"}</span>
          </button>
        </div>
      </div>

      {/* 2. Central Section: Dynamic Clean Semi-Gauge & Proportion Distribution */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 py-1">
        {/* Semi-Circle High-Tech Gauge */}
        <div className="relative w-36 h-20 flex flex-col items-center justify-end shrink-0">
          <svg className="w-36 h-20 overflow-visible" viewBox="0 0 100 55">
            {/* Background Arc */}
            <path
              d="M 8 50 A 42 42 0 0 1 92 50"
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="text-black/[0.06] dark:text-white/[0.08]"
            />
            {/* Active Filled Arc */}
            <motion.path
              d="M 8 50 A 42 42 0 0 1 92 50"
              fill="none"
              stroke="url(#qualityGaugeGrad)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={semiArc}
              initial={{ strokeDashoffset: semiArc }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <defs>
              <linearGradient
                id="qualityGaugeGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="35%" stopColor="#F59E0B" />
                <stop offset="70%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
          </svg>

          {/* Centered Score Inside Semi Gauge */}
          <div className="absolute bottom-0 inset-x-0 flex flex-col items-center justify-center">
            <span className="text-2xl sm:text-3xl font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight leading-none">
              {metrics.accuracyPercent}%
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-wider mt-0.5 ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Segmented Proportion Bar & Breakdown Summary */}
        <div className="flex-1 w-full space-y-2">
          {/* Connected Distribution Bar */}
          <div className="w-full h-3 rounded-full bg-black/[0.04] dark:bg-white/[0.06] overflow-hidden flex p-0.5 gap-0.5">
            {metrics.totalReviews === 0 ? (
              <div className="w-full h-full rounded-full bg-black/10 dark:bg-white/10" />
            ) : (
              <>
                {metrics.mutqinPercent > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.mutqinPercent}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full bg-gradient-to-r from-[#10B981] to-[#059669]"
                    title={`Lancar: ${metrics.mutqinPercent}%`}
                  />
                )}
                {metrics.lancarPercent > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.lancarPercent}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#D97706]"
                    title={`Cukup: ${metrics.lancarPercent}%`}
                  />
                )}
                {metrics.ulangPercent > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.ulangPercent}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="h-full rounded-full bg-gradient-to-r from-[#EF4444] to-[#DC2626]"
                    title={`Perlu Ulang: ${metrics.ulangPercent}%`}
                  />
                )}
              </>
            )}
          </div>

          {/* Quick Stats Grid: 3 Clean Compact Columns */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
            {/* Lancar (Mutqin) */}
            <div className="p-2 rounded-2xl neumorph-card flex flex-col items-center text-center justify-between border-t-2 border-[#10B981]/50">
              <span className="text-[10px] font-bold text-[#10B981] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>{language === "en" ? "Fluent" : "Lancar"}</span>
              </span>
              <div className="my-0.5">
                <span className="text-sm sm:text-base font-black text-[#18234A] dark:text-[#F8FAFC]">
                  {metrics.countMutqin}
                </span>
                <span className="text-[10px] text-[#8493AB] ml-1">
                  ({metrics.mutqinPercent}%)
                </span>
              </div>
            </div>

            {/* Cukup (Moderate) */}
            <div className="p-2 rounded-2xl neumorph-card flex flex-col items-center text-center justify-between border-t-2 border-[#F59E0B]/50">
              <span className="text-[10px] font-bold text-[#F59E0B] flex items-center gap-1">
                <Flame className="w-3 h-3 shrink-0" />
                <span>{language === "en" ? "Moderate" : "Cukup"}</span>
              </span>
              <div className="my-0.5">
                <span className="text-sm sm:text-base font-black text-[#18234A] dark:text-[#F8FAFC]">
                  {metrics.countLancar}
                </span>
                <span className="text-[10px] text-[#8493AB] ml-1">
                  ({metrics.lancarPercent}%)
                </span>
              </div>
            </div>

            {/* Perlu Ulang (Need Review) */}
            <div className="p-2 rounded-2xl neumorph-card flex flex-col items-center text-center justify-between border-t-2 border-[#EF4444]/50">
              <span className="text-[10px] font-bold text-[#EF4444] flex items-center gap-1">
                <RotateCcw className="w-3 h-3 shrink-0" />
                <span>{language === "en" ? "Repeat" : "Ulang"}</span>
              </span>
              <div className="my-0.5">
                <span className="text-sm sm:text-base font-black text-[#18234A] dark:text-[#F8FAFC]">
                  {metrics.countUlang}
                </span>
                <span className="text-[10px] text-[#8493AB] ml-1">
                  ({metrics.ulangPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Concise 1-Line Actionable Insight */}
      <div className="p-2.5 sm:p-3 rounded-2xl neumorph-inset bg-black/[0.015] dark:bg-white/[0.015] flex items-start gap-2.5">
        <div className="w-5 h-5 rounded-lg bg-[#FF6F3D]/10 text-[#FF6F3D] flex items-center justify-center shrink-0 mt-0.5">
          <TrendingUp className="w-3.5 h-3.5 shrink-0" />
        </div>
        <p className="text-[11px] sm:text-xs text-[#5E6D88] dark:text-[#94A3B8] font-medium leading-relaxed">
          {statusInfo.summary}
        </p>
      </div>
    </div>
  );
};
