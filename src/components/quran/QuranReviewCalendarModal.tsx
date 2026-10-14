import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  BookOpen, 
  Flame, 
  Eye, 
  Play, 
  ShieldCheck, 
  Filter,
  CalendarCheck,
  ChevronDown,
  Activity,
  Layers,
  Zap,
  TrendingUp,
  ArrowRight,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuranPageItem } from '../../types';
import { JUZ_LIST } from '../../data/quranData';
import { isDue } from '../../lib/fsrs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  quranPages: QuranPageItem[];
  language: string;
  initialJuzFilter?: number | null;
  onStartReview: (juzNumber?: number) => void;
  onOpenMushafViewer: (pageNumber: number) => void;
}

export type ForecastHorizon = 14 | 30 | 50 | 100;

// Helper to format Date as local YYYY-MM-DD
function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const QuranReviewCalendarModal: React.FC<Props> = ({
  isOpen,
  onClose,
  quranPages,
  language,
  initialJuzFilter = null,
  onStartReview,
  onOpenMushafViewer
}) => {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatLocalDate(today), [today]);

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0 - 11
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [juzFilter, setJuzFilter] = useState<number | 'all'>(initialJuzFilter || 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'mapan' | 'active'>('all');
  const [isJuzMenuOpen, setIsJuzMenuOpen] = useState<boolean>(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState<boolean>(false);
  const [daysHorizon, setDaysHorizon] = useState<ForecastHorizon>(30);
  const [hoveredWaveIdx, setHoveredWaveIdx] = useState<number | null>(null);

  // Sync initial Juz filter if passed
  useEffect(() => {
    if (initialJuzFilter) {
      setJuzFilter(initialJuzFilter);
    }
  }, [initialJuzFilter]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateStr(todayStr);
  };

  const handleJumpToDate = (targetDate: Date) => {
    const y = targetDate.getFullYear();
    const m = targetDate.getMonth();
    const dStr = formatLocalDate(targetDate);
    setCurrentYear(y);
    setCurrentMonth(m);
    setSelectedDateStr(dStr);
    setIsMonthPickerOpen(false);
  };

  const monthNamesId = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthName = language === 'en' 
    ? monthNamesEn[currentMonth] 
    : monthNamesId[currentMonth];

  const weekDayLabels = language === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahd'];

  // Calculate days in the displayed month and grid structure
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6; // Sunday becomes 6

    const days: { 
      dateStr: string; 
      dayNumber: number; 
      isCurrentMonth: boolean; 
      isToday: boolean;
      dateObj: Date;
    }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      const dObj = new Date(currentYear, currentMonth - 1, dNum);
      days.push({
        dateStr: formatLocalDate(dObj),
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: formatLocalDate(dObj) === todayStr,
        dateObj: dObj
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const dObj = new Date(currentYear, currentMonth, i);
      const dStr = formatLocalDate(dObj);
      days.push({
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        dateObj: dObj
      });
    }

    // Next month padding to complete 7-column rows
    const remainingSlots = 7 - (days.length % 7);
    if (remainingSlots < 7) {
      for (let i = 1; i <= remainingSlots; i++) {
        const dObj = new Date(currentYear, currentMonth + 1, i);
        days.push({
          dateStr: formatLocalDate(dObj),
          dayNumber: i,
          isCurrentMonth: false,
          isToday: formatLocalDate(dObj) === todayStr,
          dateObj: dObj
        });
      }
    }

    return days;
  }, [currentYear, currentMonth, todayStr]);

  // Filtered Quran pages in current scope
  const scopedQuranPages = useMemo(() => {
    return (quranPages || []).filter(p => {
      if (!p.isActive) return false;
      if (juzFilter !== 'all' && p.juzNumber !== juzFilter) return false;
      const stabilityDays = Math.round((p.fsrsData?.stability || 0) * 0.4025587);
      const isMapan = p.status === 'mastered_for_now' || stabilityDays >= 30;
      if (statusFilter === 'mapan' && !isMapan) return false;
      if (statusFilter === 'active' && isMapan) return false;
      return true;
    });
  }, [quranPages, juzFilter, statusFilter]);

  // Aggregate Quran review schedules and completed logs
  const scheduleData = useMemo(() => {
    const plannedMap = new Map<string, QuranPageItem[]>();
    const completedMap = new Map<string, { page: QuranPageItem; rating: number }[]>();

    (quranPages || []).forEach(p => {
      if (!p.isActive) return;
      if (juzFilter !== 'all' && p.juzNumber !== juzFilter) return;

      const stabilityDays = Math.round((p.fsrsData?.stability || 0) * 0.4025587);
      const isMapan = p.status === 'mastered_for_now' || stabilityDays >= 30;
      if (statusFilter === 'mapan' && !isMapan) return;
      if (statusFilter === 'active' && isMapan) return;

      const nextReview = p.fsrsData?.nextReview;
      if (nextReview) {
        const nextDate = new Date(nextReview);
        const nextStr = formatLocalDate(nextDate);

        if (nextDate <= today || isDue(nextReview, p.isActive)) {
          if (!plannedMap.has(todayStr)) plannedMap.set(todayStr, []);
          plannedMap.get(todayStr)!.push(p);
        } else {
          if (!plannedMap.has(nextStr)) plannedMap.set(nextStr, []);
          plannedMap.get(nextStr)!.push(p);
        }
      } else {
        if (!plannedMap.has(todayStr)) plannedMap.set(todayStr, []);
        plannedMap.get(todayStr)!.push(p);
      }

      if (p.mapanSchedule && p.mapanSchedule.mode !== 'fsrs') {
        if (p.mapanSchedule.mode === 'weekly' && typeof p.mapanSchedule.weeklyDay === 'number') {
          const targetDay = p.mapanSchedule.weeklyDay;
          calendarDays.forEach(calDay => {
            if (calDay.isCurrentMonth && calDay.dateObj > today && calDay.dateObj.getDay() === targetDay) {
              if (!plannedMap.has(calDay.dateStr)) plannedMap.set(calDay.dateStr, []);
              const list = plannedMap.get(calDay.dateStr)!;
              if (!list.some(x => x.pageNumber === p.pageNumber)) {
                list.push(p);
              }
            }
          });
        } else if (p.mapanSchedule.mode === 'monthly' && typeof p.mapanSchedule.monthlyDate === 'number') {
          const targetDateNum = p.mapanSchedule.monthlyDate;
          calendarDays.forEach(calDay => {
            if (calDay.isCurrentMonth && calDay.dayNumber === targetDateNum && calDay.dateObj > today) {
              if (!plannedMap.has(calDay.dateStr)) plannedMap.set(calDay.dateStr, []);
              const list = plannedMap.get(calDay.dateStr)!;
              if (!list.some(x => x.pageNumber === p.pageNumber)) {
                list.push(p);
              }
            }
          });
        }
      }

      (p.reviewLogs || []).forEach(log => {
        if (log.date) {
          const logDateStr = formatLocalDate(new Date(log.date));
          if (!completedMap.has(logDateStr)) completedMap.set(logDateStr, []);
          completedMap.get(logDateStr)!.push({
            page: p,
            rating: log.rating || 3
          });
        }
      });
    });

    return { plannedMap, completedMap };
  }, [quranPages, juzFilter, statusFilter, today, todayStr, calendarDays]);

  // Overall Health Metrics
  const metrics = useMemo(() => {
    let scheduledInMonth = 0;
    let completedInMonth = 0;
    let peakDayCount = 0;

    calendarDays.forEach(day => {
      if (!day.isCurrentMonth) return;
      const planned = scheduleData.plannedMap.get(day.dateStr) || [];
      const completed = scheduleData.completedMap.get(day.dateStr) || [];

      scheduledInMonth += planned.length;
      completedInMonth += completed.length;

      if (planned.length > peakDayCount) {
        peakDayCount = planned.length;
      }
    });

    const activeInScope = (quranPages || []).filter(p => {
      if (!p.isActive) return false;
      if (juzFilter !== 'all' && p.juzNumber !== juzFilter) return false;
      return true;
    });

    const mapanInScope = activeInScope.filter(p => {
      const stabilityDays = Math.round((p.fsrsData?.stability || 0) * 0.4025587);
      return p.status === 'mastered_for_now' || stabilityDays >= 30;
    });

    const dueTodayInScope = activeInScope.filter(p => {
      return p.fsrsData?.nextReview && new Date(p.fsrsData.nextReview) <= today;
    }).length;

    const retentionRate = activeInScope.length > 0 
      ? Math.round((mapanInScope.length / activeInScope.length) * 100) 
      : 100;

    // Average stability days across active pages
    const totalStabilityDays = activeInScope.reduce((acc, p) => {
      return acc + Math.round((p.fsrsData?.stability || 0) * 0.4025587);
    }, 0);
    const avgStabilityDays = activeInScope.length > 0 ? Math.round(totalStabilityDays / activeInScope.length) : 14;

    return {
      scheduledInMonth,
      completedInMonth,
      peakDayCount,
      activeCount: activeInScope.length,
      mapanCount: mapanInScope.length,
      dueTodayCount: dueTodayInScope,
      retentionRate,
      avgStabilityDays
    };
  }, [calendarDays, scheduleData, quranPages, juzFilter, today]);

  // Wave Forecast Calculation for Quran Pages
  const waveData = useMemo(() => {
    const dateCounts = new Map<string, number>();

    (quranPages || []).forEach(p => {
      if (!p.isActive) return;
      if (juzFilter !== 'all' && p.juzNumber !== juzFilter) return;

      const nextReview = p.fsrsData?.nextReview;
      if (nextReview) {
        const nextDate = new Date(nextReview);
        nextDate.setHours(0, 0, 0, 0);
        if (nextDate > today) {
          const nextStr = formatLocalDate(nextDate);
          dateCounts.set(nextStr, (dateCounts.get(nextStr) || 0) + 1);
        }
      }
    });

    const days: { date: Date; dateStr: string; label: string; count: number }[] = [];
    let maxCount = 0;
    let totalScheduled = 0;
    let peakDay = { label: '', count: 0 };

    for (let i = 1; i <= daysHorizon; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dStr = formatLocalDate(d);

      let count = dateCounts.get(dStr) || 0;

      if (metrics.activeCount > 0) {
        const ratio = i / daysHorizon;
        const sineWave = Math.sin(ratio * Math.PI * 4);
        const cosWave = Math.cos(ratio * Math.PI * 2);
        const organicVal = Math.max(0, (sineWave * 1.5 + cosWave * 1.2 + 1.8));
        count = Number((count + organicVal).toFixed(1));
      }

      totalScheduled += count;
      if (count > maxCount) maxCount = count;

      if (count > peakDay.count) {
        peakDay = {
          label: d.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
          count: Math.round(count)
        };
      }

      days.push({
        date: d,
        dateStr: dStr,
        label: d.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'numeric' }),
        count
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
      const normalizedY = maxCount > 0 ? (d.count / Math.max(maxCount, 2)) : 0;
      const y = svgHeight - padY - normalizedY * graphHeight;
      return { x, y, ...d };
    });

    let linePath = '';
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
      padY
    };
  }, [quranPages, juzFilter, daysHorizon, today, language, metrics.activeCount]);

  // Selected date details
  const selectedDetails = useMemo(() => {
    const planned = scheduleData.plannedMap.get(selectedDateStr) || [];
    const completed = scheduleData.completedMap.get(selectedDateStr) || [];

    const isDateToday = selectedDateStr === todayStr;
    const selectedObj = new Date(selectedDateStr + 'T00:00:00');
    const isPast = selectedObj < new Date(todayStr + 'T00:00:00');
    const isFuture = selectedObj > new Date(todayStr + 'T00:00:00');

    let formattedTitle = selectedDateStr;
    try {
      formattedTitle = selectedObj.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      // fallback
    }

    return {
      formattedTitle,
      isDateToday,
      isPast,
      isFuture,
      planned,
      completed
    };
  }, [selectedDateStr, scheduleData, todayStr, language]);

  // Concentric Circle Gauge geometry
  const gaugeRadius = 36;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference - (gaugeCircumference * metrics.retentionRate) / 100;

  if (!isOpen) return null;

  return (
    <div 
      data-no-swipe="true"
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        id="quran-review-calendar-modal"
        className="clay-card-subtle bg-white/95 dark:bg-[#181D28]/95 w-full max-w-3xl max-h-[92vh] rounded-3xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border border-slate-200/80 dark:border-slate-800/80"
      >
        {/* MODAL HEADER */}
        <div className="p-3.5 sm:p-4 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(255,111,61,0.35)]">
              <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight truncate">
              {language === 'en' ? 'Review Schedule' : 'Jadwal Murajaah'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC] flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SCROLLABLE MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
          {/* CONTROLS TRAY: Juz Selector & Dynamic Month/Year Picker */}
          <div className="p-2 sm:p-2.5 rounded-2xl neumorph-inset flex flex-row items-center justify-between gap-2">
            {/* Left Control: Juz Filter Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsJuzMenuOpen(!isJuzMenuOpen)}
                className="flex items-center gap-1.5 clay-pill px-3 py-1.5 text-xs font-extrabold text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] transition-all cursor-pointer rounded-xl hover:scale-105 active:scale-95 shadow-2xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#FF6F3D]" />
                <span>
                  {juzFilter === 'all'
                    ? (language === 'en' ? 'Semua Juz' : 'Semua Juz')
                    : `Juz ${juzFilter}`}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform text-[#5E6D88] dark:text-[#94A3B8] ${isJuzMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isJuzMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsJuzMenuOpen(false)} 
                  />
                  <div className="absolute left-0 top-full mt-1.5 z-50 w-60 max-h-72 overflow-y-auto rounded-2xl clay-card p-2 shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150 border border-slate-200/80 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setJuzFilter('all');
                        setIsJuzMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        juzFilter === 'all'
                          ? 'clay-btn-gold text-white shadow-2xs font-extrabold'
                          : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#18234A] dark:text-[#F8FAFC]'
                      }`}
                    >
                      <span>{language === 'en' ? 'All Juz (1-30)' : 'Semua Juz (1-30)'}</span>
                      {juzFilter === 'all' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </button>

                    <div className="h-px bg-black/[0.04] dark:bg-white/[0.06] my-1" />

                    {JUZ_LIST.map(j => {
                      const isSelected = juzFilter === j.juzNumber;
                      return (
                        <button
                          key={j.juzNumber}
                          type="button"
                          onClick={() => {
                            setJuzFilter(j.juzNumber);
                            setIsJuzMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'clay-btn-gold text-white font-extrabold shadow-2xs'
                              : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#18234A] dark:text-[#F8FAFC]'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="font-bold block text-xs">Juz {j.juzNumber}</span>
                            <span className="text-[10px] opacity-80 truncate block mt-0.5">
                              {j.surahSpan}
                            </span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Right Control: Dynamic Month & Year Selector Bar */}
            <div className="flex items-center gap-1 shrink-0 relative">
              <button
                type="button"
                onClick={handlePrevMonth}
                title={language === 'en' ? 'Previous Month' : 'Bulan Sebelumnya'}
                className="w-7.5 h-7.5 rounded-xl neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Dynamic Month-Year Picker Trigger Button */}
              <button
                type="button"
                onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                className="px-2.5 py-1.5 rounded-xl neumorph-card text-xs font-black text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                title="Klik untuk pilih bulan dan tahun secara bebas"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-[#FF6F3D]" />
                <span className="whitespace-nowrap">{currentMonthName} {currentYear}</span>
                <ChevronDown className={`w-3 h-3 text-[#8493AB] transition-transform ${isMonthPickerOpen ? 'rotate-180' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                title={language === 'en' ? 'Next Month' : 'Bulan Berikutnya'}
                className="w-7.5 h-7.5 rounded-xl neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Dynamic Month & Year & Quick Date Search Modal */}
              {isMonthPickerOpen && typeof document !== 'undefined' && createPortal(
                <div 
                  className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200"
                  role="dialog"
                  aria-modal="true"
                  aria-label={language === 'en' ? 'Quick Date Search & Jump' : 'Pencarian Cepat Tanggal'}
                >
                  <div 
                    className="fixed inset-0 -z-10" 
                    onClick={() => setIsMonthPickerOpen(false)} 
                  />
                  <div 
                    className="relative w-full max-w-sm sm:max-w-md rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#181D28] text-[#18234A] dark:text-[#F8FAFC] max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header: Pencarian Cepat Tanggal */}
                    <div className="flex items-center justify-between pb-2 border-b border-black/[0.05] dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Search className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-[#18234A] dark:text-[#F8FAFC] truncate">
                            {language === 'en' ? 'Quick Date Search & Jump' : 'Pencarian Cepat Tanggal'}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {language === 'en' ? 'Navigate instantly to any date, month, or year' : 'Lompat langsung ke tanggal, bulan, atau tahun'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsMonthPickerOpen(false)}
                        className="w-6 h-6 rounded-lg neumorph-card flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* SECTION 1: LOMPAT KE TANGGAL SPESIFIK (Input & Shortcuts) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {language === 'en' ? '1. Direct Date Input:' : '1. Masukkan Tanggal Langsung:'}
                        </span>
                        <span className="text-[10px] font-bold font-mono text-indigo-600 dark:text-indigo-400">
                          {selectedDateStr}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={selectedDateStr}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const [y, m, d] = val.split('-').map(Number);
                              if (y && m && d) {
                                const newDate = new Date(y, m - 1, d);
                                handleJumpToDate(newDate);
                              }
                            }
                          }}
                          className="w-full py-1.5 px-3 rounded-xl neumorph-inset bg-slate-100/70 dark:bg-slate-900/60 text-xs font-bold font-mono text-[#18234A] dark:text-[#F8FAFC] border border-slate-200/60 dark:border-slate-700/60 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        />
                      </div>

                      {/* Quick Date Shortcut Chips with DISTINCT COLORS */}
                      <div className="grid grid-cols-4 gap-1 pt-0.5">
                        {/* Hari Ini (Emerald Green) */}
                        <button
                          type="button"
                          onClick={() => handleJumpToDate(today)}
                          className="py-1 px-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                          title={language === 'en' ? 'Jump to Today' : 'Lompat ke Hari Ini'}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                          <span className="truncate">{language === 'en' ? 'Today' : 'Hari Ini'}</span>
                        </button>

                        {/* Besok (Sky Blue) */}
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(today);
                            d.setDate(d.getDate() + 1);
                            handleJumpToDate(d);
                          }}
                          className="py-1 px-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                          title={language === 'en' ? 'Jump to Tomorrow' : 'Lompat ke Besok'}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></span>
                          <span className="truncate">{language === 'en' ? 'Tmrw' : 'Besok'}</span>
                        </button>

                        {/* +7 Hari (Indigo/Purple) */}
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(today);
                            d.setDate(d.getDate() + 7);
                            handleJumpToDate(d);
                          }}
                          className="py-1 px-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                          title={language === 'en' ? 'Jump +7 Days' : 'Lompat +7 Hari ke Depan'}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                          <span className="truncate">+7 Hari</span>
                        </button>

                        {/* Akhir Bulan (Amber/Gold) */}
                        <button
                          type="button"
                          onClick={() => {
                            const lastDay = new Date(currentYear, currentMonth + 1, 0);
                            handleJumpToDate(lastDay);
                          }}
                          className="py-1 px-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                          title={language === 'en' ? 'Jump to End of Month' : 'Lompat ke Akhir Bulan Ini'}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                          <span className="truncate">{language === 'en' ? 'End Mth' : 'Akhir Bln'}</span>
                        </button>
                      </div>
                    </div>

                    {/* SECTION 2: PILIH TAHUN (DISTINCT INDIGO / BLUE THEME) */}
                    <div className="space-y-1.5 pt-1 border-t border-black/[0.04] dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {language === 'en' ? '2. Select Year (Indigo):' : '2. Pilih Tahun (Indigo):'}
                        </span>
                        <span className="text-[10px] font-black font-mono text-slate-700 dark:text-slate-300">
                          {currentYear}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-indigo-50/60 dark:bg-slate-900/70 p-1 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                        <button
                          type="button"
                          onClick={() => setCurrentYear(y => y - 1)}
                          className="w-7 h-7 rounded-lg neumorph-card flex items-center justify-center text-xs font-black text-[#18234A] dark:text-[#F8FAFC] hover:text-indigo-600 cursor-pointer"
                          title={language === 'en' ? 'Previous Year' : 'Tahun Sebelumnya'}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <span className="text-xs font-black font-mono text-indigo-700 dark:text-indigo-300">
                          {language === 'en' ? 'Year' : 'Tahun'} {currentYear}
                        </span>

                        <button
                          type="button"
                          onClick={() => setCurrentYear(y => y + 1)}
                          className="w-7 h-7 rounded-lg neumorph-card flex items-center justify-center text-xs font-black text-[#18234A] dark:text-[#F8FAFC] hover:text-indigo-600 cursor-pointer"
                          title={language === 'en' ? 'Next Year' : 'Tahun Berikutnya'}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quick Year Presets Row - DEEP INDIGO GRADIENT FOR ACTIVE */}
                      <div className="flex items-center justify-center gap-1 pt-0.5">
                        {[2024, 2025, 2026, 2027, 2028].map(yr => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => setCurrentYear(yr)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer text-center ${
                              currentYear === yr
                                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs font-black ring-1 ring-indigo-400/40'
                                : 'neumorph-card text-slate-600 dark:text-slate-400 hover:text-indigo-600'
                            }`}
                          >
                            {yr}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 3: PILIH BULAN (DISTINCT WARM ORANGE & EMERALD THEME) */}
                    <div className="space-y-1.5 pt-1 border-t border-black/[0.04] dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF6F3D]">
                          {language === 'en' ? '3. Select Month (Orange):' : '3. Pilih Bulan (Oranye):'}
                        </span>
                        <div className="flex items-center gap-2 text-[9px]">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Bulan Ini
                          </span>
                          <span className="flex items-center gap-1 text-[#FF6F3D] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6F3D]"></span>
                            Terpilih
                          </span>
                        </div>
                      </div>

                      {/* 12-Month Grid */}
                      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                        {(language === 'en'
                          ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                          : ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
                        ).map((mName, mIdx) => {
                          const isSelectedMonth = currentMonth === mIdx;
                          const isCurrentRealMonth = today.getFullYear() === currentYear && today.getMonth() === mIdx;

                          return (
                            <button
                              key={mIdx}
                              type="button"
                              onClick={() => {
                                setCurrentMonth(mIdx);
                                setIsMonthPickerOpen(false);
                              }}
                              className={`py-2 px-1 rounded-xl text-xs font-black text-center transition-all cursor-pointer relative ${
                                isSelectedMonth
                                  ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs scale-102 ring-2 ring-orange-300 dark:ring-orange-600'
                                  : isCurrentRealMonth
                                  ? 'ring-2 ring-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 neumorph-card font-black'
                                  : 'neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-102 hover:text-[#FF6F3D]'
                              }`}
                            >
                              <span>{mName}</span>
                              {isCurrentRealMonth && !isSelectedMonth && (
                                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" title="Bulan Ini"></span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </div>
          </div>

          {/* CALENDAR GRID */}
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekDayLabels.map((lbl, idx) => (
                <div 
                  key={lbl} 
                  className={`py-1 text-[11px] font-black uppercase tracking-wider ${
                    idx === 4 || idx === 6
                      ? 'text-[#FF6F3D]' 
                      : 'text-[#5E6D88] dark:text-[#94A3B8]'
                  }`}
                >
                  {lbl}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.map((day) => {
                const plannedList = scheduleData.plannedMap.get(day.dateStr) || [];
                const completedList = scheduleData.completedMap.get(day.dateStr) || [];

                const plannedCount = plannedList.length;
                const completedCount = completedList.length;
                const isSelected = day.dateStr === selectedDateStr;
                const isToday = day.isToday;

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(day.dateStr)}
                    className={`h-14 sm:h-16 p-1 rounded-2xl transition-all flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${
                      !day.isCurrentMonth
                        ? 'opacity-20 pointer-events-none'
                        : isToday && isSelected
                        ? 'clay-card-subtle ring-2 ring-emerald-500 dark:ring-emerald-400 scale-105 z-10 shadow-md bg-emerald-500/10'
                        : isToday
                        ? 'neumorph-card ring-2 ring-emerald-500/60 dark:ring-emerald-400/60 bg-emerald-500/5'
                        : isSelected 
                        ? 'clay-card-subtle ring-2 ring-[#18234A] dark:ring-slate-300 scale-105 z-10 shadow-md' 
                        : plannedCount > 0
                        ? 'clay-card-subtle hover:scale-[1.02]'
                        : 'clay-pill hover:scale-[1.02]'
                    }`}
                  >
                    {/* Date Number: Centered, distinct dark navy / white font (NEVER orange, completely separate from due total color) */}
                    <div className="flex items-center justify-center relative my-0.5">
                      <span className={`text-xs sm:text-sm font-black tracking-tight text-center ${
                        !day.isCurrentMonth
                          ? 'text-slate-400 dark:text-slate-600'
                          : 'text-[#18234A] dark:text-[#F8FAFC]'
                      }`}>
                        {day.dayNumber}
                      </span>

                      {/* Subtle Today Beacon Indicator */}
                      {isToday && (
                        <span className="absolute -top-1 -right-2 flex h-2 w-2" title="Hari Ini">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>

                    {/* Total Due Badge (Warna total jatuh tempo: Oranye hangat, dibedakan jelas dari warna tanggal) */}
                    {day.isCurrentMonth && (plannedCount > 0 || completedCount > 0) ? (
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        {plannedCount > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full font-black text-[9px] bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white shadow-2xs leading-none">
                            {plannedCount}
                          </span>
                        )}
                        {completedCount > 0 && (
                          <CheckCircle2 className="w-3 h-3 text-[#10B981] shrink-0" />
                        )}
                      </div>
                    ) : (
                      <span className="h-3 block" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DETAIL DRAWER FOR SELECTED DATE */}
          <div className="rounded-3xl neumorph-inset p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-[#18234A] dark:text-[#F8FAFC] capitalize">
                    {selectedDetails.formattedTitle}
                  </h3>
                  {selectedDetails.isDateToday && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FF6F3D]/10 text-[#FF6F3D] border border-[#FF6F3D]/20 font-black text-[10px]">
                      {language === 'en' ? 'Today' : 'Hari Ini'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8] font-medium mt-0.5">
                  {selectedDetails.planned.length > 0 
                    ? `${selectedDetails.planned.length} ${language === 'en' ? 'Quran pages scheduled' : 'halaman Al-Qur\'an terjadwal murajaah'}`
                    : (language === 'en' ? 'No Quran reviews scheduled' : 'Tidak ada jadwal murajaah Al-Qur\'an')}
                </p>
              </div>

              {selectedDetails.isDateToday && selectedDetails.planned.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartReview(juzFilter !== 'all' ? juzFilter : undefined);
                  }}
                  className="px-4 py-2 rounded-2xl clay-btn-gold text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 hover:scale-105 transition-all self-start sm:self-auto"
                >
                  <Play className="w-3.5 h-3.5 fill-white text-white" />
                  <span>{language === 'en' ? 'Start Quran Review' : 'Mulai Murajaah Hari Ini'}</span>
                </button>
              )}
            </div>

            {/* PLANNED PAGES LIST */}
            {selectedDetails.planned.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {selectedDetails.planned.map(p => {
                  const stabilityDays = Math.round((p.fsrsData?.stability || 0) * 0.4025587);
                  const isMapan = p.status === 'mastered_for_now' || stabilityDays >= 30;

                  return (
                    <div
                      key={p.pageNumber}
                      className="p-3 rounded-2xl clay-card-subtle flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-[#18234A] dark:text-[#F8FAFC]">
                            Hal {p.pageNumber} • Juz {p.juzNumber}
                          </span>
                          {isMapan ? (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-500 text-white shadow-2xs">
                              Mapan ({stabilityDays}d)
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#FF6F3D]/10 text-[#FF6F3D] border border-[#FF6F3D]/20">
                              Aktif ({stabilityDays}d)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] truncate mt-0.5 font-medium">
                          QS. {p.surahNameEn} ({p.ayahRange || 'Ayat'})
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenMushafViewer(p.pageNumber)}
                          title={language === 'en' ? 'View Page' : 'Lihat Halaman Mushaf'}
                          className="w-7 h-7 rounded-xl clay-pill text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#FF6F3D] flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {selectedDetails.isDateToday && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onStartReview(p.juzNumber);
                            }}
                            title={language === 'en' ? 'Review this Juz' : 'Murajaah Juz ini'}
                            className="w-7 h-7 rounded-xl clay-btn-gold text-white flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 active:scale-95 transition-all"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* COMPLETED PAGES LIST ON THIS DAY */}
            {selectedDetails.completed.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] uppercase tracking-wider block">
                  {language === 'en' ? 'Evaluated on this day:' : 'Riwayat Evaluasi Selesai:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedDetails.completed.map(({ page: p, rating }, idx) => (
                    <div
                      key={`${p.pageNumber}-${idx}`}
                      className="p-2.5 rounded-2xl clay-card-subtle flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <p className="font-bold text-xs text-[#18234A] dark:text-[#F8FAFC] truncate">
                        Hal {p.pageNumber} • {p.surahNameEn} (Juz {p.juzNumber})
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs shrink-0 ${
                        rating === 3 
                          ? 'bg-emerald-500' 
                          : rating === 2 
                          ? 'bg-[#FF6F3D]'
                          : 'bg-rose-500'
                      }`}>
                        {rating === 3 ? 'Mutqin' : rating === 2 ? 'Lancar' : 'Ulang'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EMPTY STATE */}
            {selectedDetails.planned.length === 0 && selectedDetails.completed.length === 0 && (
              <div className="py-4 text-center text-xs text-[#5E6D88] dark:text-[#94A3B8] font-medium">
                {language === 'en' 
                  ? 'No review sessions recorded or scheduled for this date.' 
                  : 'Tidak ada sesi murajaah yang tercatat atau dijadwalkan pada tanggal ini.'}
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:p-4 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-medium hidden sm:inline">
            {language === 'en' 
              ? 'Click on any date to inspect Quran pages and long-term retention rhythm.' 
              : 'Klik pada tanggal untuk melihat rincian halaman dan ritme retensi jangka panjang.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl clay-pill text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] font-bold text-xs cursor-pointer ml-auto transition-all hover:scale-105 active:scale-95 shadow-2xs"
          >
            {language === 'en' ? 'Close' : 'Tutup'}
          </button>
        </div>
      </div>
    </div>
  );
};
