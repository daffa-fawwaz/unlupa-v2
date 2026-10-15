import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { TrendingUp, Flame, History } from "lucide-react";
import { motion } from "motion/react";

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const WorkloadForecastWaveWidget: React.FC = () => {
  const { quranPages, items, language } = useApp();
  const [daysHorizon, setDaysHorizon] = useState<number>(30); // Default 30 Hari
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);

  const forecastData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Map of date string to item counts
    const dateCounts = new Map<
      string,
      { quran: number; books: number; total: number }
    >();

    // 1. Project Quran items
    (quranPages || []).forEach((p) => {
      if (!p.isActive) return;

      const nextReview = p.fsrsData?.nextReview;
      if (nextReview) {
        const nextDate = new Date(nextReview);
        nextDate.setHours(0, 0, 0, 0);
        if (nextDate > today) {
          const nextStr = formatLocalDate(nextDate);
          if (!dateCounts.has(nextStr)) {
            dateCounts.set(nextStr, { quran: 0, books: 0, total: 0 });
          }
          const entry = dateCounts.get(nextStr)!;
          entry.quran += 1;
          entry.total += 1;
        }
      }

      if (
        p.status === "mastered_for_now" &&
        p.mapanSchedule &&
        p.mapanSchedule.mode !== "fsrs"
      ) {
        for (let d = 1; d <= daysHorizon; d++) {
          const futureDate = new Date(today);
          futureDate.setDate(today.getDate() + d);
          const fStr = formatLocalDate(futureDate);

          if (
            p.mapanSchedule.mode === "weekly" &&
            p.mapanSchedule.weeklyDay === futureDate.getDay()
          ) {
            if (!dateCounts.has(fStr))
              dateCounts.set(fStr, { quran: 0, books: 0, total: 0 });
            dateCounts.get(fStr)!.quran += 1;
            dateCounts.get(fStr)!.total += 1;
          } else if (
            p.mapanSchedule.mode === "monthly" &&
            p.mapanSchedule.monthlyDate === futureDate.getDate()
          ) {
            if (!dateCounts.has(fStr))
              dateCounts.set(fStr, { quran: 0, books: 0, total: 0 });
            dateCounts.get(fStr)!.quran += 1;
            dateCounts.get(fStr)!.total += 1;
          }
        }
      }
    });

    // 2. Project Personal Book items
    (items || []).forEach((it) => {
      if (!it.isActive) return;
      const nextReview = it.fsrsData?.nextReview;
      if (nextReview) {
        const nextDate = new Date(nextReview);
        nextDate.setHours(0, 0, 0, 0);
        if (nextDate > today) {
          const nextStr = formatLocalDate(nextDate);
          if (!dateCounts.has(nextStr)) {
            dateCounts.set(nextStr, { quran: 0, books: 0, total: 0 });
          }
          const entry = dateCounts.get(nextStr)!;
          entry.books += 1;
          entry.total += 1;
        }
      }
    });

    // Generate days array from tomorrow up to horizon
    const days: {
      date: Date;
      dateStr: string;
      label: string;
      dayOfWeek: string;
      count: number;
      quranCount: number;
      booksCount: number;
    }[] = [];

    let maxCount = 0;
    let totalScheduled = 0;
    let peakDay = { dateStr: "", label: "", count: 0 };

    for (let i = 1; i <= daysHorizon; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dStr = formatLocalDate(d);

      const entry = dateCounts.get(dStr) || { quran: 0, books: 0, total: 0 };
      const count = entry.total;

      totalScheduled += count;
      if (count > maxCount) {
        maxCount = count;
      }
      if (count > peakDay.count) {
        peakDay = {
          dateStr: dStr,
          label: d.toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }),
          count,
        };
      }

      const dayLabel = d.toLocaleDateString(
        language === "en" ? "en-US" : "id-ID",
        { day: "numeric", month: "numeric" },
      );
      const dayOfWeek = d.toLocaleDateString(
        language === "en" ? "en-US" : "id-ID",
        { weekday: "narrow" },
      );

      days.push({
        date: d,
        dateStr: dStr,
        label: dayLabel,
        dayOfWeek,
        count,
        quranCount: entry.quran,
        booksCount: entry.books,
      });
    }

    const dailyAvg = (totalScheduled / daysHorizon).toFixed(1);

    return { days, maxCount, totalScheduled, peakDay, dailyAvg };
  }, [quranPages, items, daysHorizon, language]);

  // Construct SVG Wave coordinates
  const svgWidth = 600;
  const svgHeight = 100;
  const paddingX = 14;
  const paddingY = 14;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  const points = useMemo(() => {
    const numPoints = forecastData.days.length;
    if (numPoints <= 1) return [];
    const effectiveMax = Math.max(forecastData.maxCount, 2);

    return forecastData.days.map((d, idx) => {
      const x = paddingX + (idx / (numPoints - 1)) * graphWidth;
      const normalizedY = d.count > 0 ? d.count / effectiveMax : 0;
      const y = svgHeight - paddingY - normalizedY * graphHeight;
      return { x, y, ...d };
    });
  }, [forecastData, graphWidth, graphHeight]);

  // Build smooth bezier path
  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const mx = (p0.x + p1.x) / 2;
      d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return "";
    const last = points[points.length - 1];
    const first = points[0];
    return `${pathD} L ${last.x} ${svgHeight - paddingY} L ${first.x} ${svgHeight - paddingY} Z`;
  }, [pathD, points, svgHeight]);

  const activeHoveredPoint =
    hoveredDayIdx !== null ? points[hoveredDayIdx] : null;
  const sliderPercentage = ((daysHorizon - 1) / (365 - 1)) * 100;

  return (
    <div className="neumorph-card p-3 sm:p-4 rounded-3xl space-y-2 relative overflow-hidden transition-all shadow-md border border-white/70 dark:border-slate-800/80">
      {/* 1. Header Ringkas: Judul + Peak Badge di Samping Kanan */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#38BDF8] to-[#0284C7] text-white flex items-center justify-center shrink-0 shadow-[0_2px_6px_rgba(56,189,248,0.35)]">
            <TrendingUp className="w-3.5 h-3.5 text-white shrink-0" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight truncate">
              {language === "en" ? "Murajaah Timeline" : "Lini Masa Murajaah"}
            </h3>
            <p className="text-[9.5px] sm:text-[10px] text-[#5E6D88] dark:text-[#94A3B8] font-medium truncate">
              ~{forecastData.dailyAvg}{" "}
              {language === "en" ? "items/day" : "materi/hari"} •{" "}
              {forecastData.totalScheduled}{" "}
              {language === "en" ? "scheduled" : "terjadwal"}
            </p>
          </div>
        </div>

        {/* Peak Badge di Samping Kanan Judul */}
        <div className="flex items-center gap-1.5 shrink-0">
          {forecastData.peakDay.count > 0 ? (
            <span className="px-2 py-0.5 rounded-full neumorph-card text-[9.5px] sm:text-[10px] font-bold text-[#FF6F3D] flex items-center gap-1 shadow-2xs">
              <Flame className="w-3 h-3 fill-[#FF6F3D] text-[#FF6F3D]" />
              <span>
                {forecastData.peakDay.label} ({forecastData.peakDay.count})
              </span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full neumorph-inset text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              0 Jadwal
            </span>
          )}

          <span className="px-2 py-0.5 rounded-full bg-[#0284C7]/10 text-[#0284C7] dark:text-[#38BDF8] text-[9.5px] sm:text-[10px] font-mono font-bold">
            {daysHorizon}h
          </span>
        </div>
      </div>

      {/* 2. Interactive Range Slider Bar (1 s/d 365 Hari) */}
      <div className="space-y-0.5 px-0.5">
        <div className="relative flex items-center w-full py-0.5">
          <input
            type="range"
            min={1}
            max={365}
            step={1}
            value={daysHorizon}
            onChange={(e) => {
              setDaysHorizon(parseInt(e.target.value, 10) || 30);
              setHoveredDayIdx(null);
            }}
            style={{
              background: `linear-gradient(to right, #0EA5E9 0%, #0284C7 ${sliderPercentage}%, #E2E8F0 ${sliderPercentage}%, #CBD5E1 100%)`,
            }}
            className="w-full h-2 rounded-full appearance-none cursor-pointer shadow-inner transition-all accent-[#0284C7] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0284C7] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:scale-115 [&::-webkit-slider-thumb]:transition-transform"
            title="Geser slider untuk mengatur rentang hari"
          />
        </div>

        <div className="flex items-center justify-between text-[8.5px] font-bold text-slate-400 px-0.5">
          <span className="text-[#0284C7] dark:text-[#38BDF8]">1 Hari</span>
          <div className="flex items-center gap-1.5">
            {[7, 30, 90, 365].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDaysHorizon(preset)}
                className={`px-1.5 py-0.2 rounded font-mono text-[8px] transition-all cursor-pointer ${
                  daysHorizon === preset
                    ? "bg-[#0284C7]/15 text-[#0284C7] font-black border border-[#0284C7]/30"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {preset}h
              </button>
            ))}
          </div>
          <span className="text-[#0284C7] dark:text-[#38BDF8]">
            365 Hari (1 Thn)
          </span>
        </div>
      </div>

      {/* 3. Interactive Soft Wave Chart */}
      <div className="relative pt-0.5">
        <div className="w-full h-24 sm:h-28 neumorph-inset rounded-2xl p-1.5 relative overflow-hidden flex items-center justify-center">
          <svg
            className="w-full h-full overflow-visible"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
          >
            {/* Guide Lines */}
            <line
              x1={paddingX}
              y1={svgHeight - paddingY}
              x2={svgWidth - paddingX}
              y2={svgHeight - paddingY}
              stroke="currentColor"
              strokeWidth="1"
              className="text-black/[0.05] dark:text-white/[0.05]"
            />

            {/* Gradient Area Fill */}
            <defs>
              <linearGradient id="homeWaveAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#0284C7" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="homeWaveLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="60%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#FF7E4A" />
              </linearGradient>
            </defs>

            {forecastData.totalScheduled > 0 && (
              <motion.path
                d={areaD}
                fill="url(#homeWaveAreaGrad)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}

            {/* Main Wave Curve */}
            <motion.path
              d={pathD}
              fill="none"
              stroke={
                forecastData.totalScheduled > 0
                  ? "url(#homeWaveLineGrad)"
                  : "#94A3B8"
              }
              strokeWidth={forecastData.totalScheduled > 0 ? "3" : "1.5"}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />

            {/* Interactive Data Pins */}
            {points.map((p, idx) => {
              const isPeak =
                forecastData.maxCount > 0 && p.count === forecastData.maxCount;
              const isHovered = hoveredDayIdx === idx;
              const shouldRenderPin = p.count > 0 || isHovered;

              return (
                <g key={idx} className="cursor-pointer">
                  <rect
                    x={p.x - Math.max(4, graphWidth / points.length / 2)}
                    y={0}
                    width={Math.max(8, graphWidth / points.length)}
                    height={svgHeight}
                    fill="transparent"
                    onMouseEnter={() => setHoveredDayIdx(idx)}
                    onMouseLeave={() => setHoveredDayIdx(null)}
                    onClick={() => setHoveredDayIdx(idx)}
                  />

                  {shouldRenderPin && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 4.5 : isPeak ? 3.5 : 2}
                      fill={isPeak ? "#FF6F3D" : "#0284C7"}
                      stroke="#FFFFFF"
                      strokeWidth={isHovered ? 1.5 : 1}
                      className="transition-all shadow-xs"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Floating Hover Tooltip */}
          {activeHoveredPoint && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-1.5 left-1/2 transform -translate-x-1/2 px-2.5 py-1 rounded-xl neumorph-card shadow-lg flex items-center gap-1.5 text-[10.5px] font-bold pointer-events-none z-20"
            >
              <span className="text-[#18234A] dark:text-[#F8FAFC]">
                {activeHoveredPoint.date.toLocaleDateString(
                  language === "en" ? "en-US" : "id-ID",
                  { weekday: "short", day: "numeric", month: "short" },
                )}
                :
              </span>
              <span
                className={
                  activeHoveredPoint.count > 0
                    ? "text-[#0284C7] font-black"
                    : "text-[#5E6D88] dark:text-[#94A3B8]"
                }
              >
                {activeHoveredPoint.count}{" "}
                {language === "en" ? "items" : "materi"}
              </span>
              {activeHoveredPoint.quranCount > 0 && (
                <span className="text-[9.5px] text-[#8493AB]">
                  ({activeHoveredPoint.quranCount} Quran •{" "}
                  {activeHoveredPoint.booksCount} Kitab)
                </span>
              )}
            </motion.div>
          )}

          {forecastData.totalScheduled === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] px-2.5 py-1 rounded-xl neumorph-card">
                {language === "en"
                  ? "No future reviews scheduled in this horizon"
                  : "Belum ada murajaah jatuh tempo di rentang ini"}
              </span>
            </div>
          )}
        </div>

        {/* Days Ribbon Labels */}
        <div className="flex justify-between items-center px-1.5 pt-1 text-[8.5px] font-bold text-[#8493AB]">
          <span>
            +1 {language === "en" ? "d" : "h"} (
            {forecastData.days[0]?.dayOfWeek})
          </span>
          <span>
            +{Math.round(daysHorizon / 2)} {language === "en" ? "d" : "h"}
          </span>
          <span>
            +{daysHorizon} {language === "en" ? "d" : "h"}
          </span>
        </div>
      </div>
    </div>
  );
};
