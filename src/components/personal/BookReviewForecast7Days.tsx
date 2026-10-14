import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  History, 
  Zap, 
  Flame,
  BarChart2
} from 'lucide-react';
import { Book, BookItem } from '../../types';
import { isDue } from '../../lib/fsrs';

interface Props {
  book: Book;
  items: BookItem[];
  language: string;
  onOpenCalendarOnDate?: (dateStr: string) => void;
  onStartReview?: () => void;
}

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type ProjectionViewMode = 'capsules' | 'wave';

export const BookReviewForecast7Days: React.FC<Props> = ({
  book,
  items,
  language,
  onOpenCalendarOnDate,
  onStartReview
}) => {
  const [projectionMode, setProjectionMode] = useState<ProjectionViewMode>('capsules');
  const [selectedWeek, setSelectedWeek] = useState<number>(0); // 0 = Pekan 1, 1 = Pekan 2, ...
  const [waveRange, setWaveRange] = useState<number>(7); // Default 7 Hari!

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const todayStr = useMemo(() => formatLocalDate(today), [today]);

  // Helper to determine if an item is Mapan (mastered)
  const isItemMapan = (it: BookItem) => {
    return it.status === 'mastered' || (it.fsrsData?.stability || 0) * 0.4025587 >= 30;
  };

  // Database History & Future Schedule Aggregator for this Book
  const { pastMap, futureMap, futureBreakdownMap, todayReviewsCount, todayActiveCount, todayMapanCount, dueCount } = useMemo(() => {
    const bookItems = (items || []).filter(it => it.bookId === book.id);
    const pastMap = new Map<string, number>();
    const futureMap = new Map<string, number>();
    const futureBreakdownMap = new Map<string, { total: number; activeCount: number; mapanCount: number }>();

    let completedToday = 0;
    let dueCount = 0;
    let todayActiveCount = 0;
    let todayMapanCount = 0;

    bookItems.forEach(it => {
      const mapan = isItemMapan(it);
      if (it.isActive && isDue(it.fsrsData?.nextReview, it.isActive)) {
        dueCount += 1;
        if (mapan) {
          todayMapanCount += 1;
        } else {
          todayActiveCount += 1;
        }
      }

      // 1. Process historical review logs from database
      if (Array.isArray(it.reviewLogs) && it.reviewLogs.length > 0) {
        it.reviewLogs.forEach(log => {
          if (log && log.date) {
            const logDate = new Date(log.date);
            logDate.setHours(0, 0, 0, 0);
            const dStr = formatLocalDate(logDate);
            if (logDate < today) {
              pastMap.set(dStr, (pastMap.get(dStr) || 0) + 1);
            } else if (dStr === todayStr) {
              completedToday += 1;
            }
          }
        });
      } else if (it.fsrsData?.lastReview) {
        const lastRev = new Date(it.fsrsData.lastReview);
        lastRev.setHours(0, 0, 0, 0);
        const dStr = formatLocalDate(lastRev);
        if (lastRev < today) {
          pastMap.set(dStr, (pastMap.get(dStr) || 0) + 1);
        } else if (dStr === todayStr) {
          completedToday += 1;
        }
      }

      // 2. Process future scheduled reviews
      if (it.isActive && it.fsrsData?.nextReview) {
        const nextDate = new Date(it.fsrsData.nextReview);
        nextDate.setHours(0, 0, 0, 0);
        const dStr = formatLocalDate(nextDate);
        if (nextDate > today) {
          const prev = futureBreakdownMap.get(dStr) || { total: 0, activeCount: 0, mapanCount: 0 };
          if (mapan) {
            prev.mapanCount += 1;
          } else {
            prev.activeCount += 1;
          }
          prev.total = prev.activeCount + prev.mapanCount;
          futureBreakdownMap.set(dStr, prev);
          futureMap.set(dStr, prev.total);
        }
      }
    });

    const todayReviewsCount = Math.max(completedToday, dueCount);

    return { pastMap, futureMap, futureBreakdownMap, todayReviewsCount, todayActiveCount, todayMapanCount, dueCount };
  }, [items, book.id, today, todayStr]);

  // Check whether Pekan 5 is needed or if month has already turned (tanggal 1 in week 1..4 or starts on week 5)
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
      return [0, 1, 2, 3];
    }
    return [0, 1, 2, 3, 4];
  }, [today]);

  useEffect(() => {
    if (selectedWeek >= availableWeeks.length) {
      setSelectedWeek(0);
    }
  }, [availableWeeks, selectedWeek]);

  // 1. Data for 7-Day Vertical Capsules (with Dynamic Weeks Switcher)
  const capsulesData = useMemo(() => {
    const dayNamesId = ['AHAD', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
    const dayNamesEn = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const monthNamesId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const weekOffsetDays = selectedWeek * 7;
    const days: {
      dayName: string;
      dateStr: string;
      count: number;
      activeCount: number;
      mapanCount: number;
      isToday: boolean;
      dateFormatted: string;
    }[] = [];

    let weekTotal = 0;

    for (let i = 0; i < 7; i++) {
      const dayOffset = weekOffsetDays + i;
      const d = new Date(today);
      d.setDate(today.getDate() + dayOffset);
      const dStr = formatLocalDate(d);

      let count = 0;
      let activeCount = 0;
      let mapanCount = 0;

      if (dayOffset === 0) {
        count = todayReviewsCount;
        activeCount = todayActiveCount;
        mapanCount = todayMapanCount;
        if (activeCount === 0 && mapanCount === 0 && count > 0) {
          activeCount = count;
        }
      } else if (dayOffset > 0) {
        const breakdown = futureBreakdownMap.get(dStr);
        count = breakdown?.total || 0;
        activeCount = breakdown?.activeCount || 0;
        mapanCount = breakdown?.mapanCount || 0;
      }

      weekTotal += count;
      const isToday = dayOffset === 0;

      const dayIndex = d.getDay();
      const monthIndex = d.getMonth();

      days.push({
        dayName: isToday 
          ? (language === 'en' ? 'TODAY' : 'HARI INI')
          : (language === 'en' ? dayNamesEn[dayIndex] : dayNamesId[dayIndex]),
        dateStr: `${d.getDate()} ${language === 'en' ? monthNamesEn[monthIndex] : monthNamesId[monthIndex]}`,
        count,
        activeCount,
        mapanCount,
        isToday,
        dateFormatted: `${d.getDate()} ${language === 'en' ? monthNamesEn[monthIndex] : monthNamesId[monthIndex]}`
      });
    }

    const maxDayCount = Math.max(1, ...days.map(d => d.count));
    const avgPerDay = (weekTotal / 7).toFixed(1);

    return {
      days,
      weekTotal,
      maxDayCount,
      avgPerDay
    };
  }, [selectedWeek, futureMap, todayReviewsCount, today, language]);

  // 2. BI-DIRECTIONAL HORIZON WAVE WITH INTERACTIVE FULL-WIDTH SLIDER (1 to 365 Days)
  const biDirectionalWave = useMemo(() => {
    const R = Math.max(1, Math.min(365, waveRange));
    const monthNamesId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const points: {
      offset: number;
      dateStr: string;
      count: number;
      isToday: boolean;
      isPast: boolean;
      isFuture: boolean;
      label: string;
    }[] = [];

    let pastTotal = 0;
    let futureTotal = 0;
    let peakPast = { offset: 0, count: 0, dateStr: '' };
    let peakFuture = { offset: 0, count: 0, dateStr: '' };

    for (let offset = -R; offset <= R; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      const dStr = formatLocalDate(d);

      let count = 0;
      if (offset < 0) {
        count = pastMap.get(dStr) || 0;
        pastTotal += count;
        if (count > peakPast.count) {
          peakPast = { offset, count, dateStr: dStr };
        }
      } else if (offset === 0) {
        count = todayReviewsCount;
      } else {
        count = futureMap.get(dStr) || 0;
        futureTotal += count;
        if (count > peakFuture.count) {
          peakFuture = { offset, count, dateStr: dStr };
        }
      }

      const label = offset === 0 
        ? (language === 'en' ? 'Today' : 'Hari Ini') 
        : `${d.getDate()} ${language === 'en' ? monthNamesEn[d.getMonth()] : monthNamesId[d.getMonth()]}`;

      points.push({
        offset,
        dateStr: dStr,
        count,
        isToday: offset === 0,
        isPast: offset < 0,
        isFuture: offset > 0,
        label
      });
    }

    const maxCount = Math.max(1, ...points.map(p => p.count));

    // SVG Layout geometry (Center is at exact 50% width!)
    const svgWidth = 280;
    const svgHeight = 58;
    const padX = 10;
    const padTop = 8;
    const padBottom = 8;
    const chartW = svgWidth - padX * 2;
    const chartH = svgHeight - padTop - padBottom;

    const coords = points.map((p, idx) => {
      const denom = Math.max(1, points.length - 1);
      const x = padX + (idx / denom) * chartW;
      const y = padTop + chartH - (p.count / maxCount) * chartH;
      return {
        x,
        y,
        count: p.count,
        isToday: p.isToday,
        isPast: p.isPast,
        isFuture: p.isFuture,
        offset: p.offset
      };
    });

    let pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cx = (p0.x + p1.x) / 2;
      pathD += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const areaD = `${pathD} L ${coords[coords.length - 1].x} ${svgHeight} L ${coords[0].x} ${svgHeight} Z`;

    const centerX = padX + 0.5 * chartW;
    const centerCoord = coords.find(c => c.isToday) || coords[Math.floor(coords.length / 2)];

    // X-axis Milestones
    const formatRangeLabel = (days: number, isNeg: boolean) => {
      if (days >= 365) return isNeg ? '-1 Thn' : '+1 Thn';
      if (days >= 60) return isNeg ? `-${Math.round(days / 30)} Bln` : `+${Math.round(days / 30)} Bln`;
      if (days >= 14 && days % 7 === 0) return isNeg ? `-${days / 7} Pkn` : `+${days / 7} Pkn`;
      return isNeg ? `-${days}h` : `+${days}h`;
    };

    let milestones = [];
    if (R === 1) {
      milestones = [
        { label: '-1h', isCenter: false },
        { label: language === 'en' ? 'Today' : 'Hari Ini', isCenter: true },
        { label: '+1h', isCenter: false }
      ];
    } else if (R === 2) {
      milestones = [
        { label: '-2h', isCenter: false },
        { label: language === 'en' ? 'Today' : 'Hari Ini', isCenter: true },
        { label: '+2h', isCenter: false }
      ];
    } else {
      milestones = [
        { label: formatRangeLabel(R, true), isCenter: false },
        { label: formatRangeLabel(Math.round(R / 2), true), isCenter: false },
        { label: language === 'en' ? 'Today' : 'Hari Ini', isCenter: true },
        { label: formatRangeLabel(Math.round(R / 2), false), isCenter: false },
        { label: formatRangeLabel(R, false), isCenter: false }
      ];
    }

    return {
      R,
      points,
      pastTotal,
      futureTotal,
      peakPast,
      peakFuture,
      svgWidth,
      svgHeight,
      centerX,
      centerCoord,
      coords,
      pathD,
      areaD,
      milestones
    };
  }, [waveRange, pastMap, futureMap, todayReviewsCount, today, language]);

  return (
    <div className="clay-card p-3.5 sm:p-4.5 rounded-3xl space-y-2.5 shadow-md border border-white/70 dark:border-slate-800/80 transition-all">
      
      {/* ========================================================
          HEADER KARTU PRAKIRAAN BEBAN BUKU (TERPADU)
      ======================================================== */}
      <div className="flex items-center justify-between gap-2.5 pb-1 border-b border-black/[0.04] dark:border-white/[0.04]">
        
        {/* Title & Icon */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#FF6F3D] to-[#E65320] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <TrendingUp className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight truncate leading-none">
              {language === 'en' ? 'Workload Forecast' : 'Prakiraan Beban Murajaah'}
            </h3>
            <span className="text-[9px] text-slate-400 font-medium block mt-0.5 leading-none">
              {book.title}
            </span>
          </div>
        </div>

        {/* Mode Switcher [7 Hari | Multi-Hari] & Ikon Kalender */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 p-0.5 rounded-xl clay-inset bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setProjectionMode('capsules')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                projectionMode === 'capsules'
                  ? 'bg-white dark:bg-slate-700 text-[#FF6F3D] shadow-2xs font-black'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              7 Hari
            </button>

            <button
              type="button"
              onClick={() => setProjectionMode('wave')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                projectionMode === 'wave'
                  ? 'bg-white dark:bg-slate-700 text-[#0EA5E9] shadow-2xs font-black'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Multi-Hari
            </button>
          </div>

          {/* Kalender Jadwal */}
          {onOpenCalendarOnDate && (
            <button
              type="button"
              onClick={() => onOpenCalendarOnDate(todayStr)}
              className="w-7 h-7 rounded-xl clay-pill text-indigo-500 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs"
              title={language === 'en' ? 'Schedule Calendar' : 'Kalender Jadwal'}
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* ========================================================
          ISI PRAKIRAAN BEBAN:
          MODE A: 7 KAPSUL VERTIKAL DENGAN PEMILIH PEKAN 1-5
          MODE B: OMBAK HORIZON DUA ARAH DENGAN FULL-WIDTH SLIDER BAR (7 - 365 Hari)
      ======================================================== */}
      {projectionMode === 'capsules' ? (
        /* MODE A: 7 KAPSUL VERTIKAL */
        <div className="space-y-1.5 pt-0.5">
          
          {/* Sub-bar Info */}
          <div className="flex items-center justify-between text-[9.5px] px-0.5">
            <span className="text-slate-500 font-medium">
              Total <strong className="text-slate-800 dark:text-slate-200">{capsulesData.weekTotal} kartu</strong> (~{capsulesData.avgPerDay} kartu/hari)
            </span>
            <span className="text-[8.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> {language === 'en' ? 'Managed Load' : 'Beban Terkendali'}
            </span>
          </div>

          {/* 7 Vertical Capsule Bars */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 p-1.5 rounded-2xl neumorph-inset bg-slate-100/50 dark:bg-slate-900/40">
            {capsulesData.days.map((d, idx) => {
              const fillHeightPct = capsulesData.maxDayCount > 0 
                ? Math.round((d.count / capsulesData.maxDayCount) * 100) 
                : 0;

              return (
                <div key={idx} className="flex flex-col items-center justify-between text-center select-none py-0.5">
                  
                  {/* Day Header */}
                  <span className={`text-[7.5px] sm:text-[8px] font-black leading-tight truncate w-full ${
                    d.isToday ? 'text-[#FF6F3D]' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {d.dayName}
                  </span>
                  <span className="text-[7px] text-slate-400 leading-tight">
                    {d.dateStr}
                  </span>

                  {/* Capsule Tube */}
                  <div className="w-5 sm:w-6 h-13 sm:h-15 rounded-full clay-inset bg-slate-200/50 dark:bg-slate-800/60 my-1 p-0.5 flex flex-col justify-end items-center relative overflow-hidden">
                    {d.count > 0 ? (
                      <div 
                        className="w-full rounded-full transition-all duration-700 flex flex-col justify-end overflow-hidden shadow-xs"
                        style={{ height: `${Math.max(20, fillHeightPct)}%` }}
                      >
                        {d.isToday ? (
                          <div className="w-full h-full rounded-full bg-gradient-to-t from-[#E65320] via-[#FF6F3D] to-[#FF9E7A] shadow-[0_0_6px_rgba(255,111,61,0.4)] relative overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-full" />
                          </div>
                        ) : d.mapanCount > 0 && d.activeCount > 0 ? (
                          /* Stacked Two-Tone Bar: Mapan (Green) on top, Active (Blue) on bottom */
                          <div className="w-full h-full flex flex-col justify-end rounded-full overflow-hidden relative">
                            <div 
                              className="w-full bg-gradient-to-t from-[#059669] via-[#10B981] to-[#6EE7B7] rounded-t-full transition-all border-b border-white/20 shadow-[0_0_4px_rgba(16,185,129,0.3)] relative overflow-hidden"
                              style={{ height: `${(d.mapanCount / d.count) * 100}%` }}
                              title={`Mapan: ${d.mapanCount}`}
                            >
                              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                            </div>
                            <div 
                              className="w-full bg-gradient-to-t from-[#0284C7] via-[#0EA5E9] to-[#7DD3FC] rounded-b-full transition-all shadow-[0_0_4px_rgba(14,165,233,0.3)] relative overflow-hidden"
                              style={{ height: `${(d.activeCount / d.count) * 100}%` }}
                              title={`Aktif: ${d.activeCount}`}
                            >
                              <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                            </div>
                          </div>
                        ) : d.mapanCount > 0 ? (
                          /* 100% Mapan (Green) */
                          <div className="w-full h-full rounded-full bg-gradient-to-t from-[#059669] via-[#10B981] to-[#6EE7B7] shadow-[0_0_6px_rgba(16,185,129,0.4)] relative overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-full" />
                          </div>
                        ) : (
                          /* 100% Aktif (Blue) */
                          <div className="w-full h-full rounded-full bg-gradient-to-t from-[#0284C7] via-[#0EA5E9] to-[#7DD3FC] shadow-[0_0_6px_rgba(14,165,233,0.4)] relative overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-full" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-2 h-0.5 bg-slate-300 dark:bg-slate-600 rounded-full my-auto" />
                    )}
                  </div>

                  {/* Count Badge */}
                  <div 
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-mono font-black ${
                      d.count > 0
                        ? d.isToday
                          ? 'bg-[#FF6F3D] text-white shadow-2xs'
                          : d.mapanCount > 0 && d.activeCount > 0
                          ? 'bg-gradient-to-tr from-[#0284C7] to-[#10B981] text-white shadow-2xs ring-1 ring-white/30'
                          : d.mapanCount > 0
                          ? 'bg-[#10B981] text-white shadow-2xs'
                          : 'bg-[#0EA5E9] text-white shadow-2xs'
                        : 'clay-pill text-slate-400'
                    }`}
                    title={
                      d.isToday 
                        ? `Hari ini: ${d.count} kartu jatuh tempo`
                        : d.mapanCount > 0 && d.activeCount > 0
                        ? `${d.count} kartu: ${d.activeCount} aktif (biru), ${d.mapanCount} mapan (hijau)`
                        : d.mapanCount > 0
                        ? `${d.mapanCount} kartu mapan (hijau)`
                        : `${d.activeCount} kartu aktif (biru)`
                    }
                  >
                    {d.count}
                  </div>

                </div>
              );
            })}
          </div>

          {/* Baris Pemilih Pekan: Pekan 1-4 atau Pekan 1-5 sesuai siklus bulan */}
          <div className="flex items-center justify-between gap-1 pt-0.5 overflow-x-auto scrollbar-none">
            {availableWeeks.map((wk) => {
              const isSelected = selectedWeek === wk;
              return (
                <button
                  key={wk}
                  type="button"
                  onClick={() => setSelectedWeek(wk)}
                  className={`flex-1 py-1 px-1 rounded-xl text-[9px] font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#FF6F3D] to-[#E65320] text-white shadow-2xs font-black scale-102 ring-1 ring-orange-300'
                      : 'neumorph-card text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Pekan {wk + 1}
                </button>
              );
            })}
          </div>

        </div>
      ) : (
        /* MODE B: OMBAK HORIZON DUA ARAH DENGAN DYNAMIC BI-COLOR SLIDER BAR (1 S/D 365 HARI) */
        <div className="space-y-1.5 pt-0.5">
          
          {/* Sub-bar & Interactive Range Slider Bar (Full Width Edge to Edge) */}
          <div className="space-y-1 px-0.5">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-slate-500 font-medium">
                Riwayat: <strong className="text-emerald-600 dark:text-emerald-400">{biDirectionalWave.pastTotal} selesai</strong> • Prediksi: <strong className="text-[#0EA5E9]">{biDirectionalWave.futureTotal} terjadwal</strong>
              </span>

              {/* Range Badge */}
              <span className="text-[9.5px] font-black text-[#0284C7] dark:text-[#38BDF8] font-mono px-2 py-0.5 rounded-md bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-sky-500/15 border border-sky-300 dark:border-sky-800 shrink-0 shadow-2xs">
                ±{biDirectionalWave.R === 365 ? (language === 'en' ? '1 Year (365d)' : '1 Tahun (365h)') : `${biDirectionalWave.R} ${language === 'en' ? 'Days' : 'Hari'}`}
              </span>
            </div>

            {/* Dynamic Bi-Color Slider Bar (Hijau untuk Masa Lalu di kiri, Biru untuk Masa Depan di kanan) */}
            <div className="pt-0.5 space-y-1">
              {(() => {
                const sliderPct = ((waveRange - 1) / (365 - 1)) * 100;
                return (
                  <input
                    type="range"
                    min={1}
                    max={365}
                    step={1}
                    value={waveRange}
                    onChange={(e) => setWaveRange(Number(e.target.value))}
                    style={{
                      background: `linear-gradient(to right, #10B981 0%, #059669 ${sliderPct}%, #0284C7 ${sliderPct}%, #38BDF8 100%)`
                    }}
                    className="w-full h-2.5 sm:h-3 rounded-full appearance-none cursor-pointer shadow-inner transition-all ring-1 ring-black/5 dark:ring-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0284C7] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:w-4.5 [&::-moz-range-thumb]:h-4.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#0284C7] [&::-moz-range-thumb]:shadow-md"
                    title={language === 'en' ? 'Slide to adjust day range (1 - 365 days)' : 'Geser slider untuk atur rentang hari (1 - 365 hari)'}
                  />
                );
              })()}

              <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 px-0.5">
                <span className="text-emerald-600 dark:text-emerald-400">1 {language === 'en' ? 'Day' : 'Hari'}</span>
                
                {/* Tombol pintas default 7 hari */}
                <button
                  type="button"
                  onClick={() => setWaveRange(7)}
                  className={`px-1.5 py-0.2 rounded-md font-mono text-[8px] transition-all cursor-pointer ${
                    waveRange === 7 
                      ? 'bg-[#FF6F3D]/15 text-[#FF6F3D] font-black border border-[#FF6F3D]/30' 
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline'
                  }`}
                  title={language === 'en' ? 'Reset to default 7 days' : 'Kembalikan ke default 7 hari'}
                >
                  {language === 'en' ? 'Default: 7d' : 'Default: 7 Hari'}
                </button>

                <span className="text-sky-600 dark:text-sky-400">365 {language === 'en' ? 'Days (1 Year)' : 'Hari (1 Tahun)'}</span>
              </div>
            </div>
          </div>

          {/* Neumorphic Inset Well dengan Ombak Horizon Dua Arah */}
          <div className="p-2 rounded-2xl neumorph-inset bg-slate-100/60 dark:bg-slate-900/60 relative">
            
            {/* Header Legend Mikro (Kiri = Riwayat, Kanan = Prediksi) */}
            <div className="flex items-center justify-between text-[7.5px] font-bold text-slate-400 px-1 pb-1">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <History className="w-2.5 h-2.5" />
                <span>{language === 'en' ? 'Past History' : 'Riwayat Masa Lalu'}</span>
              </span>
              <span className="flex items-center gap-1 text-[#FF6F3D]">
                <span>● {language === 'en' ? 'Today (Center)' : 'Hari Ini (Pusat)'}</span>
              </span>
              <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                <span>{language === 'en' ? 'Future Forecast' : 'Prediksi Masa Depan'}</span>
                <TrendingUp className="w-2.5 h-2.5" />
              </span>
            </div>

            {/* SVG Horizon Wave Line & Area */}
            <div className="w-full h-14 sm:h-16 relative">
              <svg viewBox={`0 0 ${biDirectionalWave.svgWidth} ${biDirectionalWave.svgHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  {/* Past-to-Future Dynamic Horizontal Gradient */}
                  <linearGradient id="bookHorizonWaveGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                    <stop offset="45%" stopColor="#059669" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#FF6F3D" stopOpacity="0.5" />
                    <stop offset="55%" stopColor="#0EA5E9" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.35" />
                  </linearGradient>

                  <linearGradient id="bookHorizonCurveStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="48%" stopColor="#059669" />
                    <stop offset="50%" stopColor="#FF6F3D" />
                    <stop offset="52%" stopColor="#0EA5E9" />
                    <stop offset="100%" stopColor="#38BDF8" />
                  </linearGradient>
                </defs>

                {/* Center Divider: Penanda Waktu HARI INI */}
                <line 
                  x1={biDirectionalWave.centerX} 
                  y1="4" 
                  x2={biDirectionalWave.centerX} 
                  y2={biDirectionalWave.svgHeight} 
                  stroke="rgba(255, 111, 61, 0.45)" 
                  strokeDasharray="2 2" 
                  strokeWidth="1.2"
                />

                {/* Area Fill */}
                <path
                  d={biDirectionalWave.areaD}
                  fill="url(#bookHorizonWaveGrad)"
                  className="transition-all duration-700 ease-out"
                />

                {/* Continuous Curve Stroke */}
                <path
                  d={biDirectionalWave.pathD}
                  fill="none"
                  stroke="url(#bookHorizonCurveStroke)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />

                {/* Highlight Center TODAY Node */}
                {biDirectionalWave.centerCoord && (
                  <g>
                    <circle
                      cx={biDirectionalWave.centerCoord.x}
                      cy={biDirectionalWave.centerCoord.y}
                      r="6"
                      fill="#FF6F3D"
                      opacity="0.3"
                      className="animate-ping"
                    />
                    <circle
                      cx={biDirectionalWave.centerCoord.x}
                      cy={biDirectionalWave.centerCoord.y}
                      r="3.5"
                      fill="#FF6F3D"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  </g>
                )}

                {/* Past & Future Nodes */}
                {biDirectionalWave.coords.map((c, i) => {
                  if (c.isToday || c.count === 0) return null;
                  return (
                    <circle
                      key={i}
                      cx={c.x}
                      cy={c.y}
                      r={c.isPast ? 2 : 2.5}
                      fill={c.isPast ? '#10B981' : '#0EA5E9'}
                      stroke="white"
                      strokeWidth="0.8"
                      opacity="0.9"
                    />
                  );
                })}
              </svg>
            </div>

            {/* X-axis 5 Milestones (Masa Lalu <-> Hari Ini <-> Masa Depan) */}
            <div className="flex items-center justify-between text-[7.5px] font-mono text-slate-400 px-1 pt-1">
              {biDirectionalWave.milestones.map((m, idx) => (
                <span 
                  key={idx} 
                  className={`leading-none ${m.isCenter ? 'font-black text-[#FF6F3D]' : 'text-slate-400 font-semibold'}`}
                >
                  {m.label}
                </span>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================
          TOMBOL AKSI UTAMA MURAJAAH (JIKA ADA JATUH TEMPO)
      ======================================================== */}
      {dueCount > 0 && onStartReview && (
        <button
          type="button"
          onClick={onStartReview}
          className="w-full py-1.5 rounded-2xl bg-gradient-to-r from-[#FF6F3D] to-[#E65320] text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all"
        >
          <Zap className="w-3.5 h-3.5 fill-white" />
          <span>{language === 'en' ? `Review Now (${dueCount} Cards Waiting)` : `Murajaah Sekarang (${dueCount} Kartu Menanti)`}</span>
        </button>
      )}

    </div>
  );
};
