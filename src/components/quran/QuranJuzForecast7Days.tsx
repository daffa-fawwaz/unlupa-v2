import React, { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Flame,
} from "lucide-react";
import { QuranPageItem } from "../../types";
import { isDue } from "../../lib/fsrs";

interface Props {
  juzNumber: number;
  quranPages: QuranPageItem[];
  language: string;
  onOpenCalendarOnDate?: (dateStr: string) => void;
}

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const QuranJuzForecast7Days: React.FC<Props> = ({
  juzNumber,
  quranPages,
  language,
  onOpenCalendarOnDate,
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatLocalDate(today), [today]);

  const availableWeeks = useMemo(() => {
    let hasCrossedToNewMonthBeforeWeek5 = false;
    for (let offset = 1; offset <= 28; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      if (d.getDate() === 1) {
        hasCrossedToNewMonthBeforeWeek5 = true;
        break;
      }
    }
    if (hasCrossedToNewMonthBeforeWeek5) {
      return [1, 2, 3, 4];
    }
    return [1, 2, 3, 4, 5];
  }, [today]);

  useEffect(() => {
    if (selectedWeek > availableWeeks.length) {
      setSelectedWeek(1);
    }
  }, [availableWeeks, selectedWeek]);

  // Generate 7 days for the selected week (Week 1 = Days +0..+6, Week 2 = Days +7..+13, etc.)
  const weekDays = useMemo(() => {
    const startOffset = (selectedWeek - 1) * 7;
    const days: {
      date: Date;
      dateStr: string;
      dayName: string;
      dateDisplay: string;
      isToday: boolean;
    }[] = [];

    const dayNamesId = ["Ahd", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const dayNamesEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNamesId = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const monthNamesEn = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    for (let i = 0; i < 7; i++) {
      const dayOffset = startOffset + i;
      const d = new Date(today);
      d.setDate(today.getDate() + dayOffset);
      const dStr = formatLocalDate(d);
      const dayIndex = d.getDay();
      const monthIndex = d.getMonth();

      const isRealToday = dStr === todayStr;
      const dayName = isRealToday
        ? language === "en"
          ? "Today"
          : "Hari Ini"
        : language === "en"
          ? dayNamesEn[dayIndex]
          : dayNamesId[dayIndex];
      const dateDisplay = `${d.getDate()} ${language === "en" ? monthNamesEn[monthIndex] : monthNamesId[monthIndex]}`;

      days.push({
        date: d,
        dateStr: dStr,
        dayName,
        dateDisplay,
        isToday: isRealToday,
      });
    }
    return days;
  }, [today, todayStr, selectedWeek, language]);

  // Map review load for each of the 7 days in the active week for this Juz
  const forecastData = useMemo(() => {
    const countMap = new Map<
      string,
      { total: number; activeCount: number; mapanCount: number }
    >();
    weekDays.forEach((d) =>
      countMap.set(d.dateStr, { total: 0, activeCount: 0, mapanCount: 0 }),
    );

    const isPageMapan = (p: QuranPageItem) => {
      return (
        p.status === "mastered_for_now" ||
        !!p.mapanCelebrated ||
        (p.fsrsData?.stability || 0) * 0.4025587 >= 30
      );
    };

    const juzPages = (quranPages || []).filter(
      (p) => p.juzNumber === juzNumber && p.isActive,
    );

    juzPages.forEach((p) => {
      const nextReview = p.fsrsData?.nextReview;

      let primaryDueDate: Date;
      if (nextReview) {
        const nextDate = new Date(nextReview);
        if (nextDate < today || isDue(nextReview, p.isActive)) {
          primaryDueDate = new Date(today);
        } else {
          primaryDueDate = nextDate;
        }
      } else {
        primaryDueDate = new Date(today);
      }

      const primaryStr = formatLocalDate(primaryDueDate);
      if (countMap.has(primaryStr)) {
        const entry = countMap.get(primaryStr)!;
        if (isPageMapan(p)) {
          entry.mapanCount += 1;
        } else {
          entry.activeCount += 1;
        }
        entry.total = entry.activeCount + entry.mapanCount;
      }
    });

    let maxLoad = 1;
    let totalScheduledWeek = 0;
    let peakDay = weekDays[0];
    let peakCount = 0;

    weekDays.forEach((d) => {
      const entry = countMap.get(d.dateStr) || {
        total: 0,
        activeCount: 0,
        mapanCount: 0,
      };
      if (entry.total > maxLoad) maxLoad = entry.total;
      totalScheduledWeek += entry.total;
      if (entry.total > peakCount) {
        peakCount = entry.total;
        peakDay = d;
      }
    });

    return {
      countMap,
      maxLoad,
      totalScheduledWeek,
      averagePerDay: (totalScheduledWeek / 7).toFixed(1),
      peakDay,
      peakCount,
    };
  }, [quranPages, juzNumber, weekDays, today]);

  const hasHighLoad = forecastData.peakCount >= 10;

  return (
    <div className="neumorph-card p-3.5 sm:p-4.5 rounded-3xl space-y-3 shadow-md border border-white/50 dark:border-slate-800/80">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8.5 h-8.5 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-[#18234A] dark:text-[#F8FAFC] truncate">
              {language === "en"
                ? `Workload Projection for Juz ${juzNumber}`
                : `Prakiraan Beban Murajaah Juz ${juzNumber}`}
            </h3>
            <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-medium truncate">
              {language === "en"
                ? `Total ${forecastData.totalScheduledWeek} pages scheduled in Week ${selectedWeek}`
                : `Total ${forecastData.totalScheduledWeek} halaman terjadwal (Pekan ${selectedWeek})`}
            </p>
          </div>
        </div>

        {/* Load Status Badge & Top Calendar Button */}
        <div className="flex items-center gap-2 shrink-0">
          {hasHighLoad ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold">
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              <span>{language === "en" ? "Heavy Peak" : "Puncak Padat"}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>{language === "en" ? "Balanced" : "Beban Terkendali"}</span>
            </span>
          )}

          {onOpenCalendarOnDate && (
            <button
              type="button"
              onClick={() => onOpenCalendarOnDate(todayStr)}
              className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white text-[10px] font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer hover:scale-105 active:scale-95 shrink-0"
            >
              <Calendar className="w-3 h-3 text-white" />
              <span>{language === "en" ? "Calendar" : "Kalender"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 7-Day Interactive Pillar Columns Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
        {weekDays.map((day) => {
          const dayStats = forecastData.countMap.get(day.dateStr) || {
            total: 0,
            activeCount: 0,
            mapanCount: 0,
          };
          const totalPages = dayStats.total;

          // Compute relative height percentage (min 18%, max 100%)
          const heightPct =
            forecastData.maxLoad > 0
              ? Math.max(
                  18,
                  Math.round((totalPages / forecastData.maxLoad) * 100),
                )
              : 18;

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() =>
                onOpenCalendarOnDate && onOpenCalendarOnDate(day.dateStr)
              }
              className={`flex flex-col items-center justify-between p-2 rounded-2xl transition-all cursor-pointer group text-center select-none ${
                day.isToday
                  ? "neumorph-card ring-2 ring-[#FF6F3D] shadow-md scale-102 bg-white dark:bg-[#162035]"
                  : "neumorph-inset hover:scale-105 active:scale-95"
              }`}
              title={`${day.dayName}, ${day.dateDisplay}: ${totalPages} halaman (${dayStats.activeCount} aktif, ${dayStats.mapanCount} mapan)`}
            >
              {/* Day Name */}
              <span
                className={`text-[11px] font-black block uppercase tracking-tight ${
                  day.isToday
                    ? "text-[#FF6F3D]"
                    : "text-[#18234A] dark:text-[#F8FAFC]"
                }`}
              >
                {day.dayName}
              </span>

              {/* Date */}
              <span className="text-[10px] text-[#5E6D88] dark:text-[#94A3B8] font-mono font-bold">
                {day.dateDisplay}
              </span>

              {/* Visual Bar Indicator */}
              <div className="w-full h-12 flex items-end justify-center my-1.5 px-1">
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full max-w-[28px] rounded-lg transition-all duration-300 shadow-inner flex flex-col justify-end overflow-hidden"
                >
                  {totalPages === 0 ? (
                    <div className="w-full h-full bg-black/5 dark:bg-white/10" />
                  ) : day.isToday ? (
                    <div className="w-full h-full bg-gradient-to-t from-[#FF7E4A] to-[#FFA180]" />
                  ) : dayStats.mapanCount > 0 && dayStats.activeCount > 0 ? (
                    <div className="w-full h-full flex flex-col justify-end rounded-lg overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-[#059669] to-[#34D399] border-b border-white/20"
                        style={{
                          height: `${(dayStats.mapanCount / totalPages) * 100}%`,
                        }}
                        title={`Mapan: ${dayStats.mapanCount}`}
                      />
                      <div
                        className="w-full bg-gradient-to-t from-[#0284C7] to-[#38BDF8]"
                        style={{
                          height: `${(dayStats.activeCount / totalPages) * 100}%`,
                        }}
                        title={`Aktif: ${dayStats.activeCount}`}
                      />
                    </div>
                  ) : dayStats.mapanCount > 0 ? (
                    <div className="w-full h-full bg-gradient-to-t from-[#059669] to-[#34D399]" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-t from-[#0284C7] to-[#38BDF8]" />
                  )}
                </div>
              </div>

              {/* Card Count Pill */}
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] leading-tight ${
                  totalPages === 0
                    ? "text-[#8493AB]"
                    : day.isToday
                      ? "bg-[#FF6F3D] text-white shadow-2xs"
                      : dayStats.mapanCount > 0 && dayStats.activeCount > 0
                        ? "bg-gradient-to-tr from-[#0284C7] to-[#10B981] text-white shadow-2xs ring-1 ring-white/30"
                        : dayStats.mapanCount > 0
                          ? "bg-[#10B981] text-white shadow-2xs"
                          : "bg-[#0EA5E9] text-white shadow-2xs"
                }`}
              >
                {totalPages}
              </span>
            </button>
          );
        })}
      </div>

      {/* Week Selector Pills - Proportional grid from corner to corner */}
      <div
        className={`grid ${availableWeeks.length === 4 ? "grid-cols-4" : "grid-cols-5"} gap-1.5 w-full pt-2 border-t border-black/[0.04] dark:border-white/[0.04]`}
      >
        {availableWeeks.map((wk) => (
          <button
            key={wk}
            type="button"
            onClick={() => setSelectedWeek(wk)}
            className={`py-1.5 px-1 rounded-xl text-[10px] sm:text-xs font-black transition-all cursor-pointer text-center truncate ${
              selectedWeek === wk
                ? "bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white shadow-xs scale-105"
                : "neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-white"
            }`}
          >
            {language === "en" ? `Wk ${wk}` : `Pekan ${wk}`}
          </button>
        ))}
      </div>
    </div>
  );
};
