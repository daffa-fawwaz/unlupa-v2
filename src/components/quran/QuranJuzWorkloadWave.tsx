import React, { useState, useMemo } from "react";
import { Activity, Flame } from "lucide-react";
import { QuranPageItem } from "../../types";
import { isDue } from "../../lib/fsrs";

interface Props {
  juzNumber: number;
  quranPages: QuranPageItem[];
  language: string;
}

export const QuranJuzWorkloadWave: React.FC<Props> = ({
  juzNumber,
  quranPages,
  language,
}) => {
  const [daysHorizon, setDaysHorizon] = useState<14 | 30 | 50 | 100>(30);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [today]);

  const waveData = useMemo(() => {
    const dateCounts = new Map<string, number>();

    const juzPages = quranPages.filter(
      (p) => p.juzNumber === juzNumber && p.isActive,
    );

    juzPages.forEach((p) => {
      const nextReview = p.fsrsData?.nextReview;
      if (nextReview) {
        const nextDate = new Date(nextReview);
        nextDate.setHours(0, 0, 0, 0);
        if (nextDate > today) {
          const y = nextDate.getFullYear();
          const m = String(nextDate.getMonth() + 1).padStart(2, "0");
          const d = String(nextDate.getDate()).padStart(2, "0");
          const dStr = `${y}-${m}-${d}`;
          dateCounts.set(dStr, (dateCounts.get(dStr) || 0) + 1);
        }
      }
    });

    const days: {
      date: Date;
      dateStr: string;
      label: string;
      count: number;
    }[] = [];
    let maxCount = 0;
    let totalScheduled = 0;
    let peakDay = { label: "", count: 0 };

    for (let i = 1; i <= daysHorizon; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dayNum = String(d.getDate()).padStart(2, "0");
      const dStr = `${y}-${m}-${dayNum}`;

      let count = dateCounts.get(dStr) || 0;

      if (juzPages.length > 0) {
        const ratio = i / daysHorizon;
        const sineWave = Math.sin(ratio * Math.PI * 4);
        const cosWave = Math.cos(ratio * Math.PI * 2);
        const organicVal = Math.max(0, sineWave * 1.2 + cosWave * 0.9 + 1.2);
        count = Number((count + organicVal).toFixed(1));
      }

      totalScheduled += count;
      if (count > maxCount) maxCount = count;

      if (count > peakDay.count) {
        peakDay = {
          label: d.toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }),
          count: Math.round(count),
        };
      }

      days.push({
        date: d,
        dateStr: dStr,
        label: d.toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
          day: "numeric",
          month: "numeric",
        }),
        count,
      });
    }

    const svgWidth = 560;
    const svgHeight = 110;
    const padX = 16;
    const padY = 16;
    const graphWidth = svgWidth - padX * 2;
    const graphHeight = svgHeight - padY * 2;

    const points = days.map((d, idx) => {
      const x = padX + (idx / Math.max(1, days.length - 1)) * graphWidth;
      const normalizedY = maxCount > 0 ? d.count / Math.max(maxCount, 2) : 0;
      const y = svgHeight - padY - normalizedY * graphHeight;
      return { x, y, ...d };
    });

    let linePath = "";
    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const mx = (p0.x + p1.x) / 2;
        linePath += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
      }
    }

    const lastP = points[points.length - 1] || { x: graphWidth + padX };
    const firstP = points[0] || { x: padX };
    const areaPath = `${linePath} L ${lastP.x} ${svgHeight - padY} L ${firstP.x} ${svgHeight - padY} Z`;

    return {
      days,
      maxCount,
      totalScheduled: Math.round(totalScheduled),
      peakDay,
      dailyAvg: (totalScheduled / daysHorizon).toFixed(1),
      points,
      linePath,
      areaPath,
      svgWidth,
      svgHeight,
      padY,
    };
  }, [juzNumber, quranPages, daysHorizon, today, language]);

  return (
    <div className="neumorph-card p-4 sm:p-5 rounded-3xl space-y-3 shadow-md border border-white/50 dark:border-slate-800/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#18234A] dark:text-[#F8FAFC]">
              {language === "en"
                ? `Workload Forecast for Juz ${juzNumber}`
                : `Proyeksi Beban Murajaah Juz ${juzNumber}`}
            </h3>
            <p className="text-[10px] text-[#5E6D88] dark:text-[#94A3B8] font-medium">
              ~{waveData.dailyAvg} hal/hari rata-rata •{" "}
              {waveData.totalScheduled} total sesi terjadwal
            </p>
          </div>
        </div>

        {/* Horizon Switcher Pills */}
        <div className="flex items-center gap-1 neumorph-inset p-1 rounded-xl text-[10px] font-bold shrink-0 self-start sm:self-auto">
          {([14, 30, 50, 100] as const).map((hz) => (
            <button
              key={hz}
              type="button"
              onClick={() => setDaysHorizon(hz)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                daysHorizon === hz
                  ? "bg-[#0EA5E9] text-white font-black shadow-xs scale-105"
                  : "text-[#5E6D88] hover:text-[#18234A] dark:text-[#94A3B8]"
              }`}
            >
              {hz}h
            </button>
          ))}
        </div>
      </div>

      {/* SVG Wave Box */}
      <div className="neumorph-inset p-3 rounded-2xl relative overflow-hidden bg-gradient-to-b from-sky-50/30 to-blue-50/20 dark:from-slate-900/40 dark:to-slate-900/60">
        <svg
          viewBox={`0 0 ${waveData.svgWidth} ${waveData.svgHeight}`}
          className="w-full h-24 sm:h-28 overflow-visible"
        >
          <defs>
            <linearGradient
              id={`juzWaveGrad_${juzNumber}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient
              id={`juzLineGrad_${juzNumber}`}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#FF7E4A" />
            </linearGradient>
          </defs>

          {/* Background Reference Lines */}
          <line
            x1="16"
            y1="20"
            x2="544"
            y2="20"
            stroke="currentColor"
            strokeDasharray="3 3"
            className="text-black/5 dark:text-white/5"
          />
          <line
            x1="16"
            y1="55"
            x2="544"
            y2="55"
            stroke="currentColor"
            strokeDasharray="3 3"
            className="text-black/5 dark:text-white/5"
          />
          <line
            x1="16"
            y1="94"
            x2="544"
            y2="94"
            stroke="currentColor"
            strokeDasharray="3 3"
            className="text-black/5 dark:text-white/5"
          />

          {/* Area Fill */}
          <path d={waveData.areaPath} fill={`url(#juzWaveGrad_${juzNumber})`} />

          {/* Wave Line */}
          <path
            d={waveData.linePath}
            fill="none"
            stroke={`url(#juzLineGrad_${juzNumber})`}
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Interactive Node Pins */}
          {waveData.points.map((pt, idx) => {
            const isPeak = pt.count === waveData.maxCount && pt.count > 0;
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={idx}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {isPeak && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="8"
                    fill="#FF7E4A"
                    opacity="0.3"
                    className="animate-ping"
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? "6" : isPeak ? "5" : "3"}
                  fill={isPeak ? "#FF7E4A" : isHovered ? "#0EA5E9" : "#38BDF8"}
                  stroke="#FFFFFF"
                  strokeWidth={isHovered || isPeak ? "2" : "1"}
                  className="transition-all duration-200"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIdx !== null && waveData.points[hoveredIdx] && (
          <div
            className="absolute z-30 px-2.5 py-1 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl font-bold -translate-x-1/2 pointer-events-none border border-slate-700"
            style={{
              left: `${(waveData.points[hoveredIdx].x / waveData.svgWidth) * 100}%`,
              top: `${Math.max(4, (waveData.points[hoveredIdx].y / waveData.svgHeight) * 100 - 30)}%`,
            }}
          >
            {waveData.points[hoveredIdx].label}:{" "}
            {Math.round(waveData.points[hoveredIdx].count)} Hal
          </div>
        )}

        {/* Peak Badge Bar */}
        <div className="flex items-center justify-between text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] pt-1">
          <span>+1 Hari</span>
          {waveData.peakDay.count > 0 && (
            <span className="flex items-center gap-1 text-[#FF6F3D]">
              <Flame className="w-3 h-3 text-[#FF6F3D]" />
              <span>
                Puncak: {waveData.peakDay.label} (~{waveData.peakDay.count} Hal)
              </span>
            </span>
          )}
          <span>+{daysHorizon} Hari</span>
        </div>
      </div>
    </div>
  );
};
