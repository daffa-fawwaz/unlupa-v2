import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Book, BookItem, Chapter } from '../../types';
import { getNonQuranIntervalDays, isDue } from '../../lib/fsrs';
import { BilingualCardText } from '../common/BilingualCardText';
import { useApp } from '../../context/AppContext';
import { 
  Clock, 
  Flame, 
  Search, 
  ChevronDown, 
  ChevronRight,
  ArrowRight,
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ArrowLeft,
  GraduationCap,
  Users,
  Play, 
  BookOpen, 
  LogOut,
  MoreVertical,
  Edit3,
  Share2,
  Trash2,
  PlusCircle,
  Calendar,
  TrendingUp,
  History,
  Zap,
  ShieldCheck,
  Brain,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FireStrikeBar } from '../shared/FireStrikeBar';

export interface BookHeroCardProps {
  book: Book;
  items: BookItem[];
  chapters?: Chapter[];
  language: string;
  joinedClass?: {
    id: string;
    name: string;
    code: string;
    teacherName?: string;
  };
  linkedClasses?: {
    id: string;
    name: string;
    code: string;
    teacherName?: string;
    students?: any[];
  }[];
  isReadonly?: boolean;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  onStartReview?: () => void;
  onOpenCalendar?: () => void;
  onOpenCalendarOnDate?: (dateStr: string) => void;
  onSelectCard?: (item: BookItem) => void;
  onLeaveClass?: (classId: string) => void;
  onEditBook?: () => void;
  onPublishBook?: () => void;
  onDeleteBook?: () => void;
  onAddChapter?: () => void;
  onBack?: () => void;
  onNavigateTeaching?: () => void;
  onSelectClass?: (classId: string) => void;
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Polar coordinate helper for ellipse (0° = 12 o'clock / top)
function polarToCartesian(cx: number, cy: number, rx: number, ry: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + rx * Math.cos(angleInRadians),
    y: cy + ry * Math.sin(angleInRadians)
  };
}

// Wedge generator for 3D donut sectors
function describeWedge(
  cx: number,
  cy: number,
  rxOut: number,
  ryOut: number,
  rxIn: number,
  ryIn: number,
  startAngle: number,
  endAngle: number
): string {
  const diff = endAngle - startAngle;
  if (diff <= 0.05) return '';
  
  // Full 360 degree ring
  if (diff >= 359.9) {
    return [
      `M ${cx} ${cy - ryOut}`,
      `A ${rxOut} ${ryOut} 0 1 1 ${cx} ${cy + ryOut}`,
      `A ${rxOut} ${ryOut} 0 1 1 ${cx} ${cy - ryOut}`,
      `M ${cx} ${cy - ryIn}`,
      `A ${rxIn} ${ryIn} 0 1 0 ${cx} ${cy + ryIn}`,
      `A ${rxIn} ${ryIn} 0 1 0 ${cx} ${cy - ryIn}`,
      'Z'
    ].join(' ');
  }

  const safeEndAngle = endAngle;

  const startOut = polarToCartesian(cx, cy, rxOut, ryOut, startAngle);
  const endOut = polarToCartesian(cx, cy, rxOut, ryOut, safeEndAngle);
  const startIn = polarToCartesian(cx, cy, rxIn, ryIn, startAngle);
  const endIn = polarToCartesian(cx, cy, rxIn, ryIn, safeEndAngle);
  const largeArcFlag = diff <= 180 ? '0' : '1';

  return [
    `M ${startIn.x} ${startIn.y}`,
    `L ${startOut.x} ${startOut.y}`,
    `A ${rxOut} ${ryOut} 0 ${largeArcFlag} 1 ${endOut.x} ${endOut.y}`,
    `L ${endIn.x} ${endIn.y}`,
    `A ${rxIn} ${ryIn} 0 ${largeArcFlag} 0 ${startIn.x} ${startIn.y}`,
    'Z'
  ].join(' ');
}

// 3D Extrusion Wall for outer cylinder
function describeFrontWall(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  depth: number,
  startAngle: number,
  endAngle: number
): string {
  const diff = endAngle - startAngle;
  if (diff >= 359.9) {
    const p1 = polarToCartesian(cx, cy, rx, ry, 90);
    const p2 = polarToCartesian(cx, cy, rx, ry, 270);
    const p3 = { x: p2.x, y: p2.y + depth };
    const p4 = { x: p1.x, y: p1.y + depth };
    return [
      `M ${p1.x} ${p1.y}`,
      `A ${rx} ${ry} 0 0 1 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${rx} ${ry} 0 0 0 ${p4.x} ${p4.y}`,
      'Z'
    ].join(' ');
  }

  const frontStart = Math.max(90, Math.min(270, startAngle));
  const frontEnd = Math.max(90, Math.min(270, endAngle));
  if (frontEnd - frontStart <= 0.5) return '';

  const p1 = polarToCartesian(cx, cy, rx, ry, frontStart);
  const p2 = polarToCartesian(cx, cy, rx, ry, frontEnd);
  const p3 = { x: p2.x, y: p2.y + depth };
  const p4 = { x: p1.x, y: p1.y + depth };

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rx} ${ry} 0 0 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rx} ${ry} 0 0 0 ${p4.x} ${p4.y}`,
    'Z'
  ].join(' ');
}

type ProjectionViewMode = 'capsules' | 'wave' | 'pyramid';

export const BookHeroCard: React.FC<BookHeroCardProps> = ({
  book,
  items,
  chapters = [],
  language,
  joinedClass,
  linkedClasses = [],
  isReadonly,
  isExpanded: isExpandedProp,
  onToggleExpanded,
  onStartReview,
  onOpenCalendar,
  onOpenCalendarOnDate,
  onSelectCard,
  onLeaveClass,
  onEditBook,
  onPublishBook,
  onDeleteBook,
  onAddChapter,
  onBack,
  onNavigateTeaching,
  onSelectClass
}) => {
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = isExpandedProp !== undefined ? isExpandedProp : internalExpanded;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'high_freq' | 'mastered'>('all');
  const [imgError, setImgError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImgError(false);
  }, [book.coverUrl]);

  // Switcher Tab: 7 Hari vs Horizon vs Piramida Memori
  const [projectionMode, setProjectionMode] = useState<ProjectionViewMode>('capsules');
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [waveRange, setWaveRange] = useState<number>(7);
  const [selectedPyramidTier, setSelectedPyramidTier] = useState<string | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Chapter lookup map
  const chapterMap = useMemo(() => {
    const map = new Map<string, string>();
    chapters.forEach(c => map.set(c.id, c.title));
    return map;
  }, [chapters]);

  const totalCards = items.length;
  const activeItems = useMemo(() => items.filter(i => i.isActive), [items]);
  const activeCount = activeItems.length;
  const inactiveCount = Math.max(0, totalCards - activeCount);
  const activePercentage = totalCards > 0 ? Math.round((activeCount / totalCards) * 100) : 0;

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
  const { pastMap, futureMap, futureBreakdownMap, todayReviewsCount, todayActiveCount, todayMapanCount } = useMemo(() => {
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
      if (it.isActive && isDue(it.fsrsData?.nextReview, it.isActive, it.fsrsData?.lastReview)) {
        dueCount += 1;
        if (mapan) {
          todayMapanCount += 1;
        } else {
          todayActiveCount += 1;
        }
      }

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
    return { pastMap, futureMap, futureBreakdownMap, todayReviewsCount, todayActiveCount, todayMapanCount };
  }, [items, book.id, today, todayStr]);

  const { currentStreak } = useApp();

  // Process unified statistics (Mastery, Cards, Discipline & Pyramid Tiers)
  const {
    dueCount,
    overdueCount,
    onTimeCount,
    disciplineRate,
    masteredCount,
    masteryPct,
    activationPct,
    inactivePct,
    activeNonMasteredCount,
    itemRecords,
    pyramidTiers
  } = useMemo(() => {
    let dueToday = 0;
    let overdue = 0;
    let completedToday = 0;
    let mastered = 0;

    const tMapan: any[] = [];
    const tKokoh: any[] = [];
    const tKonsolidasi: any[] = [];
    const tKritis: any[] = [];

    const records = activeItems.map((item, index) => {
      const reps = item.fsrsData?.reps || 0;
      const lapses = item.fsrsData?.lapses || 0;
      const logCount = item.reviewLogs?.length || 0;
      const freq = Math.max(reps + lapses, logCount);

      const intervalDays = getNonQuranIntervalDays(item.fsrsData);
      const isMastered = intervalDays >= 336 || item.status === 'mastered';
      if (isMastered) {
        mastered++;
      }

      // Tier Categorization
      if (isMastered || intervalDays >= 336) {
        tMapan.push(item);
      } else if (intervalDays >= 100) {
        tKokoh.push(item);
      } else if (intervalDays >= 30) {
        tKonsolidasi.push(item);
      } else {
        tKritis.push(item);
      }

      const lastRevDate = item.fsrsData?.lastReview ? new Date(item.fsrsData.lastReview) : null;
      const isReviewedToday = lastRevDate ? lastRevDate.toDateString() === todayStr : false;
      if (isReviewedToday) {
        completedToday++;
      }

      const nextRevDate = item.fsrsData?.nextReview ? new Date(item.fsrsData.nextReview) : null;
      let itemDue = false;
      let itemOverdue = false;
      let overdueDays = 0;
      let diffDays = 0;

      if (!isReviewedToday) {
        if (!nextRevDate) {
          itemDue = true;
          dueToday++;
        } else {
          const nextCopy = new Date(nextRevDate);
          nextCopy.setHours(0, 0, 0, 0);
          const diffTime = nextCopy.getTime() - today.getTime();
          diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            itemOverdue = true;
            itemDue = true;
            overdueDays = Math.abs(diffDays);
            overdue++;
          } else if (diffDays === 0) {
            itemDue = true;
            dueToday++;
          }
        }
      }

      let lastReviewLabel = language === 'en' ? 'Never' : 'Belum pernah';
      if (lastRevDate) {
        const lastCopy = new Date(lastRevDate);
        lastCopy.setHours(0, 0, 0, 0);
        const pastDiff = Math.round((today.getTime() - lastCopy.getTime()) / (1000 * 60 * 60 * 24));
        if (pastDiff === 0) lastReviewLabel = language === 'en' ? 'Today' : 'Hari ini';
        else if (pastDiff === 1) lastReviewLabel = language === 'en' ? 'Yesterday' : 'Kemarin';
        else lastReviewLabel = `${pastDiff} ${language === 'en' ? 'd ago' : 'h lalu'}`;
      }

      return {
        id: item.id,
        itemIndex: (item as any).index || index + 1,
        title: item.question || `Kartu #${index + 1}`,
        chapterTitle: item.chapterId ? chapterMap.get(item.chapterId) : undefined,
        rawItem: item,
        frequency: freq,
        reps,
        lapses,
        intervalDays,
        isMastered,
        isReviewedToday,
        isDue: itemDue,
        isOverdue: itemOverdue,
        overdueDays,
        diffDays,
        lastReviewLabel,
      };
    });

    const onTime = activeCount > 0 ? Math.max(0, activeCount - overdue) : 0;
    const discRate = activeCount > 0 ? Math.round((onTime / activeCount) * 100) : 0;
    const actPct = totalCards > 0 ? Math.round((activeCount / totalCards) * 100) : 0;
    const mstPct = totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0;
    const inactPct = totalCards > 0 ? Math.max(0, 100 - actPct) : 0;
    const totalDue = items.filter(i => isDue(i.fsrsData?.nextReview, i.isActive, i.fsrsData?.lastReview)).length;
    const activeNonMastered = Math.max(0, activeCount - mastered);

    const pyramidTiers = [
      {
        id: 'mapan',
        level: 4,
        name: language === 'en' ? 'Mastered / Long-Term' : 'Mapan & Mutqin',
        badge: '≥ 336 Hari',
        desc: language === 'en' ? 'Solid in long-term memory' : 'Tersimpan kokoh di memori jangka panjang',
        colorFrom: '#10B981',
        colorTo: '#059669',
        textColor: '#059669',
        bgPill: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        items: tMapan,
        count: tMapan.length,
        percent: activeCount > 0 ? Math.round((tMapan.length / activeCount) * 100) : 0,
        tip: language === 'en' ? 'Periodic maintenance will keep these effortlessly accessible.' : 'Cukup murajaah berkala untuk menjaga kelancaran permanen.'
      },
      {
        id: 'kokoh',
        level: 3,
        name: language === 'en' ? 'Established / Stable' : 'Kokoh & Bertumbuh',
        badge: '100 – 335 Hari',
        desc: language === 'en' ? 'Strong recall stability' : 'Daya ingat kuat, menuju fase kemapanan penuh',
        colorFrom: '#0EA5E9',
        colorTo: '#0284C7',
        textColor: '#0284C7',
        bgPill: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
        items: tKokoh,
        count: tKokoh.length,
        percent: activeCount > 0 ? Math.round((tKokoh.length / activeCount) * 100) : 0,
        tip: language === 'en' ? 'Successful evaluations will elevate these to Mastered tier.' : 'Sesi evaluasi lancar berikutnya akan menaikkan materi ini ke level Mapan.'
      },
      {
        id: 'konsolidasi',
        level: 2,
        name: language === 'en' ? 'Consolidating' : 'Konsolidasi Memori',
        badge: '30 – 99 Hari',
        desc: language === 'en' ? 'Active neural consolidation' : 'Dalam pembentukan jejak memori berkelanjutan',
        colorFrom: '#F59E0B',
        colorTo: '#D97706',
        textColor: '#D97706',
        bgPill: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        items: tKonsolidasi,
        count: tKonsolidasi.length,
        percent: activeCount > 0 ? Math.round((tKonsolidasi.length / activeCount) * 100) : 0,
        tip: language === 'en' ? 'Consistent practice solidifies synaptic connections.' : 'Latihan rutin secara teratur mengokohkan sambungan ingatan.'
      },
      {
        id: 'kritis',
        level: 1,
        name: language === 'en' ? 'New Material' : 'Materi Baru',
        badge: '< 30 Hari',
        desc: language === 'en' ? 'Early consolidation phase' : 'Fase pengenalan awal yang memerlukan perhatian',
        colorFrom: '#F43F5E',
        colorTo: '#E11D48',
        textColor: '#E11D48',
        bgPill: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        items: tKritis,
        count: tKritis.length,
        percent: activeCount > 0 ? Math.round((tKritis.length / activeCount) * 100) : 0,
        tip: language === 'en' ? 'Frequent spaced reviews are essential here.' : 'Murajaah aktif dalam 1-3 hari pertama sangat krusial agar tidak lupa.'
      }
    ];

    return {
      dueCount: totalDue,
      overdueCount: overdue,
      onTimeCount: onTime,
      disciplineRate: discRate,
      masteredCount: mastered,
      masteryPct: mstPct,
      activationPct: actPct,
      inactivePct: inactPct,
      activeNonMasteredCount: activeNonMastered,
      itemRecords: records,
      pyramidTiers
    };
  }, [activeItems, items, today, todayStr, activeCount, totalCards, chapterMap, language]);

  // Isolated 80% Threshold & Per-Book Streak Calculation
  const effectiveStreak = useMemo(() => {
    if (activeCount === 0 || disciplineRate < 80) return 0;

    // Helper to format date into YYYY-MM-DD calendar string
    const toCalendarStr = (dInput: string | Date | number) => {
      const d = new Date(dInput);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayCalendarStr = toCalendarStr(today);
    const pastCalendarDates = new Set<string>();
    let todayHasExplicitLog = false;

    activeItems.forEach(item => {
      if (item.fsrsData?.lastReview) {
        const ds = toCalendarStr(item.fsrsData.lastReview);
        if (ds === todayCalendarStr) {
          todayHasExplicitLog = true;
        } else {
          pastCalendarDates.add(ds);
        }
      }
      if (Array.isArray(item.reviewLogs)) {
        item.reviewLogs.forEach(l => {
          if (l?.date) {
            const ds = toCalendarStr(l.date);
            if (ds === todayCalendarStr) {
              todayHasExplicitLog = true;
            } else {
              pastCalendarDates.add(ds);
            }
          }
        });
      }
    });

    // 1. Calculate consecutive past calendar days BEFORE today (i = 1, 2, 3...)
    let consecutivePastDays = 0;
    for (let i = 1; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const checkStr = toCalendarStr(checkDate);

      if (pastCalendarDates.has(checkStr)) {
        consecutivePastDays++;
      } else {
        break;
      }
    }

    // Past streak baseline is the maximum of consecutive past days or historical past review dates
    const pastStreak = Math.max(consecutivePastDays, pastCalendarDates.size);

    // 2. Today's +1 streak increment is earned ONLY IF at least 1 review was explicitly submitted today AND all due/overdue items are cleared
    const isTodayCompleted = todayHasExplicitLog && overdueCount === 0 && dueCount === 0;

    // 3. Effective streak:
    // If today's review is completed -> pastStreak + 1
    // If today's review is pending and not yet done today -> pastStreak
    return isTodayCompleted ? (pastStreak + 1) : pastStreak;
  }, [activeCount, disciplineRate, activeItems, today, todayStr, overdueCount, dueCount]);

  // 3D Isometric Donut Geometry with Outer Stability 3D Arc Segments
  const donut3D = useMemo(() => {
    const cx = 60;
    const cy = 37.5;
    const rxOut = 44;
    const ryOut = 23;
    const rxIn = 20;
    const ryIn = 10.5;
    const depth = 8;

    // Outer Stability Ring (Surrounding Active Sector)
    const rxOut2 = 52.5;
    const ryOut2 = 27.5;
    const rxIn2 = 46.5;
    const ryIn2 = 24.3;
    const depth2 = 6.5;

    const isZeroTotal = totalCards === 0;
    const total = isZeroTotal ? 1 : totalCards;
    const degActive = isZeroTotal ? 0 : (activeCount / total) * 360;
    const degInactive = isZeroTotal ? 360 : 360 - degActive;

    const startActive = 30;
    const endActive = startActive + degActive;
    const startInactive = endActive;
    const endInactive = startInactive + degInactive;

    // Primary Donut Paths
    const topActive = degActive > 0.1 ? describeWedge(cx, cy, rxOut, ryOut, rxIn, ryIn, startActive, endActive) : '';
    const wallActive = degActive > 0.1 ? describeFrontWall(cx, cy, rxOut, ryOut, depth, startActive, endActive) : '';
    const topInactive = degInactive > 0.1 ? describeWedge(cx, cy, rxOut, ryOut, rxIn, ryIn, startInactive, endInactive) : '';
    const wallInactive = degInactive > 0.1 ? describeFrontWall(cx, cy, rxOut, ryOut, depth, startInactive, endInactive) : '';

    // Outer Stability 3D Arc Segments along Active Sector
    const safeActiveCount = Math.max(1, activeCount);
    const countMapan = pyramidTiers[0]?.count || 0;
    const countKokoh = pyramidTiers[1]?.count || 0;
    const countKonsol = pyramidTiers[2]?.count || 0;
    const countBaru = pyramidTiers[3]?.count || 0;

    const spanMapan = (countMapan / safeActiveCount) * degActive;
    const spanKokoh = (countKokoh / safeActiveCount) * degActive;
    const spanKonsol = (countKonsol / safeActiveCount) * degActive;
    const spanBaru = (countBaru / safeActiveCount) * degActive;

    const a0 = startActive;
    const a1 = a0 + spanMapan;
    const a2 = a1 + spanKokoh;
    const a3 = a2 + spanKonsol;
    const a4 = a3 + spanBaru;

    const topArcMapan = activeCount > 0 && spanMapan > 0.5 ? describeWedge(cx, cy, rxOut2, ryOut2, rxIn2, ryIn2, a0, a1) : '';
    const wallArcMapan = activeCount > 0 && spanMapan > 0.5 ? describeFrontWall(cx, cy, rxOut2, ryOut2, depth2, a0, a1) : '';

    const topArcKokoh = activeCount > 0 && spanKokoh > 0.5 ? describeWedge(cx, cy, rxOut2, ryOut2, rxIn2, ryIn2, a1, a2) : '';
    const wallArcKokoh = activeCount > 0 && spanKokoh > 0.5 ? describeFrontWall(cx, cy, rxOut2, ryOut2, depth2, a1, a2) : '';

    const topArcKonsol = activeCount > 0 && spanKonsol > 0.5 ? describeWedge(cx, cy, rxOut2, ryOut2, rxIn2, ryIn2, a2, a3) : '';
    const wallArcKonsol = activeCount > 0 && spanKonsol > 0.5 ? describeFrontWall(cx, cy, rxOut2, ryOut2, depth2, a2, a3) : '';

    const topArcBaru = activeCount > 0 && spanBaru > 0.5 ? describeWedge(cx, cy, rxOut2, ryOut2, rxIn2, ryIn2, a3, a4) : '';
    const wallArcBaru = activeCount > 0 && spanBaru > 0.5 ? describeFrontWall(cx, cy, rxOut2, ryOut2, depth2, a3, a4) : '';

    return {
      cx, cy, rxOut, ryOut, rxIn, ryIn, depth,
      topActive, wallActive, topInactive, wallInactive,
      topArcMapan, wallArcMapan,
      topArcKokoh, wallArcKokoh,
      topArcKonsol, wallArcKonsol,
      topArcBaru, wallArcBaru
    };
  }, [totalCards, activeCount, pyramidTiers]);

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

  // 1. Data for 7-Day Vertical Capsules (Pekan 1-4 or 1-5)
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

      days.push({
        dayName: isToday 
          ? (language === 'en' ? 'TODAY' : 'HARI INI')
          : (language === 'en' ? dayNamesEn[d.getDay()] : dayNamesId[d.getDay()]),
        dateStr: `${d.getDate()} ${language === 'en' ? monthNamesEn[d.getMonth()] : monthNamesId[d.getMonth()]}`,
        count,
        activeCount,
        mapanCount,
        isToday
      });
    }

    const maxDayCount = Math.max(...days.map(d => d.count), 5);
    const avgPerDay = (weekTotal / 7).toFixed(1);

    return { days, weekTotal, maxDayCount, avgPerDay };
  }, [selectedWeek, today, todayReviewsCount, todayActiveCount, todayMapanCount, futureBreakdownMap, language]);

  // 2. Data for Horizon Wave (1 to 365 Days)
  const biDirectionalWave = useMemo(() => {
    const R = Math.max(1, Math.min(365, waveRange));
    const monthNamesId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const points: {
      offset: number;
      date: Date;
      dateStr: string;
      count: number;
      isToday: boolean;
      label: string;
    }[] = [];

    let totalPast = 0;
    let totalFuture = 0;

    for (let offset = -R; offset <= R; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      const dStr = formatLocalDate(d);

      let count = 0;
      if (offset < 0) {
        count = pastMap.get(dStr) || 0;
        totalPast += count;
      } else if (offset === 0) {
        count = todayReviewsCount;
      } else {
        count = futureMap.get(dStr) || 0;
        totalFuture += count;
      }

      const isToday = offset === 0;
      const monthLabel = language === 'en' ? monthNamesEn[d.getMonth()] : monthNamesId[d.getMonth()];
      const dateFormatted = `${d.getDate()} ${monthLabel}`;

      points.push({
        offset,
        date: d,
        dateStr: dStr,
        count,
        isToday,
        label: dateFormatted
      });
    }

    const maxCount = Math.max(...points.map(p => p.count), 5);
    const svgWidth = 500;
    const svgHeight = 76;
    const padX = 14;
    const padTop = 14;
    const padBottom = 16;
    const chartW = svgWidth - padX * 2;
    const chartH = svgHeight - padTop - padBottom;
    const totalPoints = points.length;

    const coords = points.map((p, i) => {
      const x = padX + (i / (totalPoints - 1)) * chartW;
      const normalizedH = p.count / maxCount;
      const y = svgHeight - padBottom - normalizedH * chartH;
      return { ...p, x, y };
    });

    const pathD = coords.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = arr[i - 1];
      const cx1 = (prev.x + pt.x) / 2;
      const cy1 = prev.y;
      const cx2 = (prev.x + pt.x) / 2;
      const cy2 = pt.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
    }, '');

    const groundY = svgHeight - padBottom;
    const areaD = `${pathD} L ${coords[coords.length - 1].x} ${groundY} L ${coords[0].x} ${groundY} Z`;

    const centerIdx = points.findIndex(p => p.isToday);
    const centerCoord = coords[centerIdx] || coords[Math.floor(coords.length / 2)];

    return {
      points,
      totalPast,
      totalFuture,
      maxCount,
      svgWidth,
      svgHeight,
      centerCoord,
      coords,
      pathD,
      areaD
    };
  }, [waveRange, pastMap, futureMap, todayReviewsCount, today, language]);

  // Filtered records for details table
  const filteredItems = useMemo(() => {
    let list = [...itemRecords];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(i => 
        (i.title || '').toLowerCase().includes(q) ||
        (i.chapterTitle || '').toLowerCase().includes(q)
      );
    }

    if (filterMode === 'due') {
      list = list.filter(i => i.isOverdue || i.isDue);
      list.sort((a, b) => b.overdueDays - a.overdueDays);
    } else if (filterMode === 'high_freq') {
      list.sort((a, b) => b.frequency - a.frequency);
    } else if (filterMode === 'mastered') {
      list = list.filter(i => i.isMastered);
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

  const activePyramidTierObj = pyramidTiers.find(t => t.id === selectedPyramidTier);
  const countMapan = pyramidTiers[0]?.count || 0;
  const countKokoh = pyramidTiers[1]?.count || 0;
  const countKonsol = pyramidTiers[2]?.count || 0;
  const countBaru = pyramidTiers[3]?.count || 0;

  return (
    <div className="clay-card p-3.5 sm:p-4 rounded-3xl relative overflow-visible flex flex-col gap-2.5 shadow-md border border-white/70 dark:border-slate-800/80 transition-all">
      
      {/* 1. Embedded Class Integration Bar for Enrolled Students (if any) */}
      {joinedClass && (
        <div className="flex flex-row items-center justify-between gap-2 pb-1 border-b border-black/[0.04] dark:border-white/[0.04]">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="text-[11px] font-bold text-[#18234A] dark:text-[#F8FAFC]">
              Kelas: {joinedClass.name}
            </span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#F27A3D]/15 text-[9px] font-mono font-bold text-[#F27A3D]">
              {joinedClass.code}
            </span>
            <span className="px-2 py-0.2 rounded-full clay-badge-emerald text-white text-[9px] font-bold">
              Terhubung Pengajar
            </span>
          </div>
          {onLeaveClass && (
            <button
              type="button"
              onClick={() => onLeaveClass(joinedClass.id)}
              className="px-2 py-0.5 rounded-full clay-pill text-rose-600 dark:text-rose-400 text-[9.5px] font-bold flex items-center gap-1 cursor-pointer shrink-0 hover:scale-105 active:scale-95"
            >
              <LogOut className="w-2.5 h-2.5" />
              <span>{language === 'en' ? 'Leave' : 'Keluar'}</span>
            </button>
          )}
        </div>
      )}

      {/* ========================================================
          1. TOP HEADER ROW (Selaras dengan QuranJuzBentoHero: Back button, Title & Quick Actions)
      ======================================================== */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 rounded-xl clay-pill flex items-center justify-center text-[#18234A] dark:text-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
              title={language === 'en' ? 'Back to Library' : 'Kembali ke Koleksi'}
            >
              <ArrowLeft className="w-4 h-4 text-[#FF6F3D]" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 
              title={book.title}
              className="text-sm sm:text-base font-black text-[#18234A] dark:text-[#F8FAFC] leading-snug line-clamp-2 break-words font-serif"
            >
              {book.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Ikon Toga: Menampilkan info keterkaitan kelas & bypass langsung ke ruang kelas */}
          <button
            type="button"
            onClick={() => setIsClassModalOpen(true)}
            className={`h-8 px-2 sm:px-2.5 rounded-xl clay-pill flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 hover:scale-105 active:scale-95 ${
              (linkedClasses.length > 0 || joinedClass)
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-[#5E6D88] dark:text-[#94A3B8]'
            }`}
            title={
              (linkedClasses.length > 0 || joinedClass)
                ? (language === 'en' 
                    ? `${linkedClasses.length > 0 ? linkedClasses.length : 1} Connected Class(es) • Click to open class directly` 
                    : `${linkedClasses.length > 0 ? linkedClasses.length : 1} Kelas Terhubung • Klik untuk bypass langsung ke kelas`)
                : (language === 'en' ? 'Class Association (0 Classes)' : 'Keterkaitan Kelas (0 Kelas Terhubung)')
            }
          >
            <GraduationCap className={`w-4 h-4 ${(linkedClasses.length > 0 || joinedClass) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline font-bold">
              {language === 'en' ? 'Class' : 'Kelas'}
            </span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              (linkedClasses.length > 0 || joinedClass)
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              {linkedClasses.length > 0 ? linkedClasses.length : (joinedClass ? 1 : 0)}
            </span>
          </button>

          {/* Menu Titik Tiga */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 rounded-xl clay-pill text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#FF6F3D] flex items-center justify-center cursor-pointer transition-all shadow-xs hover:scale-105 active:scale-95"
              title="Menu Pengaturan Buku"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 sm:w-48 py-1 rounded-2xl bg-white/95 dark:bg-[#182236]/95 backdrop-blur-md shadow-xl border border-black/[0.06] dark:border-white/[0.08] z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                {!isReadonly && onEditBook && (
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); onEditBook(); }}
                    className="w-full px-3 py-1.5 text-left text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] hover:bg-[#FF6F3D]/10 hover:text-[#FF6F3D] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#FF6F3D]" />
                    <span>{language === 'en' ? 'Edit Book Info' : 'Edit Info Buku'}</span>
                  </button>
                )}
                {!isReadonly && onAddChapter && (
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); onAddChapter(); }}
                    className="w-full px-3 py-1.5 text-left text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] hover:bg-[#FF6F3D]/10 hover:text-[#FF6F3D] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    <span>{language === 'en' ? 'Add Chapter' : 'Tambah Bab Baru'}</span>
                  </button>
                )}
                {!isReadonly && onPublishBook && (
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); onPublishBook(); }}
                    className="w-full px-3 py-1.5 text-left text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] hover:bg-[#FF6F3D]/10 hover:text-[#FF6F3D] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'en' ? 'Publish' : 'Publikasikan'}</span>
                  </button>
                )}
                {!isReadonly && onDeleteBook && (
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); onDeleteBook(); }}
                    className="w-full px-3 py-1.5 text-left text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer border-t border-black/[0.04] dark:border-white/[0.04] mt-0.5 pt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>{language === 'en' ? 'Delete Book' : 'Hapus Buku'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          2. MASTER HERO CONTENT ROW:
          - KIRI: COVER BUKU (PROPORSIONAL, ELEGAN)
          - TENGAH: 3D DONUT PIE CHART DENGAN OUTER STABILITY 3D ARC
          - KANAN: MASTERPIECE HIGH-DENSITY METRICS PANEL
      ======================================================== */}
      <div className="flex flex-row items-center gap-2.5 sm:gap-4 w-full">
        {/* Gambar Cover Buku 3D (Proporsional, Elegan) */}
        <div className="shrink-0 select-none self-center">
          <div className="w-18 sm:w-22 md:w-24 aspect-[1/1.36] rounded-r-[4px] rounded-l-[2px] overflow-hidden shadow-md shadow-black/25 dark:shadow-black/65 border-l-[3.5px] border-l-slate-900/60 relative flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5">
            <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/40 via-white/25 to-transparent pointer-events-none z-20" />
            <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-20" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/15 pointer-events-none z-20" />

            {book.coverUrl && !imgError ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              /* Handcrafted Moroccan Leather Kitab Fallback */
              <div className="w-full h-full bg-gradient-to-br from-[#0c2f24] via-[#08221b] to-[#04120e] p-1.5 flex flex-col justify-between text-amber-100 border border-amber-400/50 relative overflow-hidden select-none">
                <div className="absolute inset-0.5 border border-amber-300/30 rounded-r-[2px] pointer-events-none" />
                <div className="relative z-10 pt-0.5 text-center">
                  <span className="text-[6.5px] font-black uppercase tracking-widest text-amber-300 font-serif">
                    {language === 'en' ? 'Book' : 'Kitab'}
                  </span>
                </div>
                <div className="relative z-10 my-auto text-center px-0.5">
                  <BookOpen className="w-3 h-3 text-amber-300/80 mx-auto mb-0.5" />
                  <h3 className="font-serif font-bold text-[9px] sm:text-[10px] text-amber-50 leading-tight line-clamp-2 drop-shadow-xs">
                    {book.title}
                  </h3>
                </div>
                <div className="relative z-10 pb-0.5 text-center">
                  <span className="text-[5.5px] font-mono text-emerald-300/80">
                    {items.length} {language === 'en' ? 'cards' : 'kartu'}
                  </span>
                </div>
              </div>
            )}

            {/* Bookmark ribbon */}
            <div className="absolute bottom-0 right-1.5 w-1.5 sm:w-2 h-2.5 sm:h-3 bg-rose-600 shadow-sm transform translate-y-0.5 z-10" />

            {/* Readonly Badge on Cover */}
            {isReadonly && (
              <div className="absolute top-1 right-1 z-30 bg-black/75 backdrop-blur-xs text-amber-200 text-[6.5px] font-bold px-1 py-0.2 rounded shadow-2xs border border-amber-400/40">
                {language === 'en' ? 'Read-only' : 'Hanya Baca'}
              </div>
            )}
          </div>
        </div>

        {/* 3D Isometric Donut Pie Chart with Outer Stability 3D Arc */}
        <div className="shrink-0 select-none self-center">
          <div className="w-24 h-18 sm:w-28 sm:h-22 md:w-32 md:h-24 shrink-0 relative select-none flex items-center justify-center">
            <svg viewBox="0 0 120 75" className="w-full h-full overflow-visible drop-shadow-md">
              <defs>
                {/* Primary Donut Gradients */}
                <linearGradient id="bookActiveTop" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>
                <linearGradient id="bookActiveWall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284C7" />
                  <stop offset="100%" stopColor="#0369A1" />
                </linearGradient>

                <linearGradient id="bookInactiveTop" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F8FAFC" />
                  <stop offset="100%" stopColor="#CBD5E1" />
                </linearGradient>
                <linearGradient id="bookInactiveWall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#CBD5E1" />
                  <stop offset="100%" stopColor="#94A3B8" />
                </linearGradient>

                {/* Outer Stability Arc Gradients (Mapan, Kokoh, Konsol, Baru) */}
                <linearGradient id="arcMapanTop" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="arcMapanWall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>

                <linearGradient id="arcKokohTop" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#0EA5E9" />
                </linearGradient>
                <linearGradient id="arcKokohWall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>

                <linearGradient id="arcKonsolTop" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <linearGradient id="arcKonsolWall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D97706" />
                  <stop offset="100%" stopColor="#B45309" />
                </linearGradient>

                <linearGradient id="arcBaruTop" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FB7185" />
                  <stop offset="100%" stopColor="#E11D48" />
                </linearGradient>
                <linearGradient id="arcBaruWall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E11D48" />
                  <stop offset="100%" stopColor="#BE123C" />
                </linearGradient>
              </defs>

              {/* Base Isometric Shadow */}
              <ellipse 
                cx={donut3D.cx} 
                cy={donut3D.cy + donut3D.depth + 3.5} 
                rx={donut3D.rxOut + 5} 
                ry={donut3D.ryOut + 3} 
                fill="rgba(0,0,0,0.12)" 
                className="dark:fill-black/40"
                filter="blur(2.5px)" 
              />

              {/* Inactive 3D Wall & Top (Belum Aktif) */}
              {donut3D.wallInactive && <path d={donut3D.wallInactive} fill="url(#bookInactiveWall)" />}
              {donut3D.topInactive && <path d={donut3D.topInactive} fill="url(#bookInactiveTop)" stroke="white" strokeWidth="0.85" strokeOpacity="0.85" />}

              {/* Active 3D Wall & Top (Kartu Aktif) */}
              {donut3D.wallActive && <path d={donut3D.wallActive} fill="url(#bookActiveWall)" />}
              {donut3D.topActive && <path d={donut3D.topActive} fill="url(#bookActiveTop)" stroke="white" strokeWidth="0.95" strokeOpacity="0.9" />}

              {/* Outer Stability 3D Arc Segments along Active Sector (Mapan, Kokoh, Konsol, Baru) */}
              {donut3D.wallArcBaru && <path d={donut3D.wallArcBaru} fill="url(#arcBaruWall)" />}
              {donut3D.topArcBaru && <path d={donut3D.topArcBaru} fill="url(#arcBaruTop)" stroke="white" strokeWidth="0.7" strokeOpacity="0.8" />}

              {donut3D.wallArcKonsol && <path d={donut3D.wallArcKonsol} fill="url(#arcKonsolWall)" />}
              {donut3D.topArcKonsol && <path d={donut3D.topArcKonsol} fill="url(#arcKonsolTop)" stroke="white" strokeWidth="0.7" strokeOpacity="0.8" />}

              {donut3D.wallArcKokoh && <path d={donut3D.wallArcKokoh} fill="url(#arcKokohWall)" />}
              {donut3D.topArcKokoh && <path d={donut3D.topArcKokoh} fill="url(#arcKokohTop)" stroke="white" strokeWidth="0.7" strokeOpacity="0.8" />}

              {donut3D.wallArcMapan && <path d={donut3D.wallArcMapan} fill="url(#arcMapanWall)" />}
              {donut3D.topArcMapan && <path d={donut3D.topArcMapan} fill="url(#arcMapanTop)" stroke="white" strokeWidth="0.7" strokeOpacity="0.8" />}

              {/* Inner Center Raised Knob */}
              <ellipse 
                cx={donut3D.cx} 
                cy={donut3D.cy} 
                rx={donut3D.rxIn} 
                ry={donut3D.ryIn} 
                fill="#F8FAFC" 
                stroke="#CBD5E1" 
                strokeWidth="0.8"
                className="dark:fill-slate-900 dark:stroke-slate-800"
              />

              <text
                x={donut3D.cx}
                y={donut3D.cy - 1.2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="9"
                fontWeight="900"
                className="fill-slate-800 dark:fill-slate-100 font-mono tracking-tight"
              >
                {activePercentage}%
              </text>
              <text
                x={donut3D.cx}
                y={donut3D.cy + 5.2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="4.5"
                fontWeight="800"
                fill="#0284C7"
                className="font-sans dark:fill-sky-400"
              >
                {activeCount}/{totalCards} {language === 'en' ? 'Cards' : 'Kartu'}
              </text>
            </svg>
          </div>
        </div>

        {/* Masterpiece High-Density Metrics Panel (Right of 3D Chart) */}
        <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5 space-y-1 sm:space-y-1.5">
          {/* Baris 1: Status Kartu Utama (Kartu Aktif vs Total Kartu) */}
          <div className="flex items-center justify-between px-2 py-1 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 clay-inset text-[10px] sm:text-[11px] font-bold select-none">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 truncate">
              <span className="w-2 h-2 rounded-full bg-[#0EA5E9] shrink-0 shadow-xs" />
              <span className="truncate">{language === 'en' ? 'Active Cards' : 'Kartu Aktif'}</span>
            </span>
            <span className="font-mono text-slate-900 dark:text-white font-black shrink-0 text-right">
              {activeCount} <span className="text-[8.5px] font-normal text-slate-400">/ {totalCards}</span>
              <span className="text-[#0EA5E9] text-[9.5px] ml-1 font-bold">({activePercentage}%)</span>
            </span>
          </div>

          {/* Baris 2: 4 Status Stabilitas Memori (2x2 Grid Padat & Rapi: Mapan, Kokoh, Konsol, Baru) */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-2xs text-[9.5px] sm:text-[10px]">
            {/* Mapan */}
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded-lg bg-emerald-500/5" title="Mapan / Long-Term (≥ 336 hari)">
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
                <span className="truncate">{language === 'en' ? 'Master' : 'Mapan'}</span>
              </span>
              <span className="font-mono font-bold text-[#10B981] shrink-0 ml-1">
                {countMapan}
              </span>
            </div>

            {/* Kokoh */}
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded-lg bg-sky-500/5" title="Kokoh (100–335 hari)">
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] shrink-0" />
                <span className="truncate">{language === 'en' ? 'Strong' : 'Kokoh'}</span>
              </span>
              <span className="font-mono font-bold text-[#0EA5E9] shrink-0 ml-1">
                {countKokoh}
              </span>
            </div>

            {/* Konsol */}
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded-lg bg-amber-500/5" title="Konsolidasi (30–99 hari)">
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />
                <span className="truncate">{language === 'en' ? 'Consol' : 'Konsol'}</span>
              </span>
              <span className="font-mono font-bold text-[#F59E0B] shrink-0 ml-1">
                {countKonsol}
              </span>
            </div>

            {/* Baru */}
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded-lg bg-rose-500/5" title="Materi Baru (< 30 hari)">
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6F3D] shrink-0" />
                <span className="truncate">{language === 'en' ? 'New' : 'Baru'}</span>
              </span>
              <span className="font-mono font-bold text-[#FF6F3D] shrink-0 ml-1">
                {countBaru}
              </span>
            </div>
          </div>

          {/* Baris 3: Kartu Belum Aktif */}
          <div className="flex items-center justify-between px-1.5 text-[9px] sm:text-[9.5px] text-slate-500 dark:text-slate-400 select-none">
            <span className="flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
              <span className="truncate">{language === 'en' ? 'Inactive Cards' : 'Belum Aktif'}</span>
            </span>
            <span className="font-mono font-semibold shrink-0">{inactiveCount} {language === 'en' ? 'Cards' : 'Kartu'}</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. DIAGRAM KEDISIPLINAN LURUS MEMBENTANG PENUH (SELARAS DENGAN RUANG AL-QUR'AN):
          - Persis di bawah Cover & Donut
          - Baris 1: Kedisiplinan & Strike
          - Baris 2: Bar Bara Api
          - Baris 3: Status / Tombol Review
      ======================================================== */}
      <div className="w-full space-y-1 pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
        <div className="flex items-center justify-between text-[10.5px] sm:text-[11px] font-bold px-0.5">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Flame className={`w-3.5 h-3.5 shrink-0 drop-shadow-xs ${
              disciplineRate >= 100
                ? 'text-purple-500 fill-purple-500 animate-pulse'
                : 'text-zinc-400 fill-zinc-400'
            }`} />
            <span className="font-extrabold">{language === 'en' ? 'Discipline' : 'Kedisiplinan'}</span>
            <span className={`font-mono font-black text-xs ml-1 ${
              disciplineRate >= 100
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}>
              {disciplineRate}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink min-w-0 ml-auto text-right">
            <span className={`text-[10px] sm:text-[10.5px] font-bold font-mono truncate ${
              disciplineRate >= 100
                ? 'text-purple-600 dark:text-purple-300'
                : disciplineRate >= 80
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}>
              {disciplineRate >= 100
                ? `🔥 Strike ${effectiveStreak}`
                : disciplineRate >= 80
                ? `🔥 Strike ${effectiveStreak}${overdueCount > 0 ? `, ${overdueCount} miss` : ''}`
                : overdueCount > 0
                ? `Strike ${effectiveStreak}, ${overdueCount} miss`
                : `Strike ${effectiveStreak}`
              }
            </span>
          </div>
        </div>

        {/* SEAMLESS BLAZING PURPLE FIRE DISCIPLINE BAR */}
        <div className="w-full pt-0.5">
          <FireStrikeBar percentage={disciplineRate} size="normal" />
        </div>

        {/* SLIM STATUS ATAU TOMBOL AKSI REVIEW - PERSIS DI BAWAH BAR API */}
        {dueCount === 0 ? (
          <div className="w-full mt-1.5 py-1 px-3 rounded-xl neumorph-card bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 text-[10.5px] sm:text-[11px] font-bold shadow-2xs select-none">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{language === 'en' ? 'No reviews due today' : 'Tidak ada review hari ini'}</span>
          </div>
        ) : onStartReview ? (
          <button
            type="button"
            onClick={onStartReview}
            className={`w-full mt-1.5 py-1.5 px-3 rounded-xl text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer ${
              disciplineRate >= 100
                ? 'bg-gradient-to-r from-purple-700 via-fuchsia-600 to-indigo-700 shadow-purple-500/20 border border-purple-400/30'
                : disciplineRate >= 80
                ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 shadow-orange-500/20 border border-orange-400/30'
                : 'bg-gradient-to-r from-slate-800 via-zinc-800 to-slate-900 border border-slate-700/80 shadow-black/20'
            }`}
          >
            <div className="relative flex items-center justify-center shrink-0">
              <Flame className={`w-4 h-4 ${
                disciplineRate >= 100
                  ? 'text-fuchsia-200 fill-purple-400 drop-shadow-[0_0_6px_rgba(232,121,249,0.8)]'
                  : disciplineRate >= 80
                  ? 'text-amber-200 fill-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]'
                  : 'text-slate-400 fill-slate-600'
              }`} />
              <span className="absolute inset-0 flex items-center justify-center text-[8.5px] font-black text-white font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pt-0.5">
                {effectiveStreak}
              </span>
            </div>
            <span className={`whitespace-nowrap truncate font-extrabold tracking-tight text-[11px] sm:text-xs ${
              disciplineRate >= 100 ? 'text-purple-100' : disciplineRate >= 80 ? 'text-amber-100' : 'text-slate-300'
            }`}>
              {effectiveStreak === 0
                ? (language === 'en' ? `Start Your First Streak (${dueCount} cards)` : `Raih Strike Pertamamu (${dueCount} kartu)`)
                : disciplineRate >= 100
                ? (language === 'en' ? `Boost & Keep Your Streak (${dueCount} cards)` : `Tingkatkan & Pertahankan Strikemu (${dueCount} kartu)`)
                : (language === 'en' ? `Boost Discipline to 100% (${dueCount} cards)` : `Tingkatkan Disiplin ke 100% (${dueCount} kartu)`)
              }
            </span>
          </button>
        ) : null}
      </div>

      {/* ========================================================
          4. SUB-BAR & SWITCHER TABS [7 Hari | Lini Masa | Stabilitas]
          - Menghilangkan kata "Total" agar tidak terpotong
          - Kiri: 25 kartu (3,9 kartu per hari)
          - Kanan: Switcher Tabs Capsule [7 Hari | Lini Masa | Stabilitas]
          ======================================================== */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
        
        {/* Kiri: Ringkasan Kartu (Tanpa kata "Total" agar tidak terpotong) */}
        <div className="text-[10px] sm:text-[10.5px] text-slate-600 dark:text-slate-300 font-medium truncate flex items-center gap-1">
          <strong className="text-slate-900 dark:text-slate-100 font-black font-mono">
            {totalCards} {language === 'en' ? 'cards' : 'kartu'}
          </strong>
          {projectionMode === 'capsules' && (
            <span className="text-slate-400 font-normal">
              ({capsulesData.avgPerDay} {language === 'en' ? 'cards/day' : 'kartu per hari'})
            </span>
          )}
        </div>

        {/* Kanan: Switcher Tabs [Jadwal 7 Hari | Lini Masa | Stabilitas] + Ikon Kalender */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-0.5 p-0.5 rounded-xl clay-inset bg-slate-100 dark:bg-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setProjectionMode('capsules')}
              className={`px-2.5 py-1 rounded-lg text-[9.5px] sm:text-[10px] font-bold transition-all cursor-pointer ${
                projectionMode === 'capsules'
                  ? 'bg-white dark:bg-slate-700 text-[#FF6F3D] shadow-2xs font-black'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {language === 'en' ? '7-Day Schedule' : 'Jadwal 7 Hari'}
            </button>

            <button
              type="button"
              onClick={() => setProjectionMode('wave')}
              className={`px-2.5 py-1 rounded-lg text-[9.5px] sm:text-[10px] font-bold transition-all cursor-pointer ${
                projectionMode === 'wave'
                  ? 'bg-white dark:bg-slate-700 text-[#0EA5E9] shadow-2xs font-black'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {language === 'en' ? 'Timeline' : 'Lini Masa'}
            </button>

            <button
              type="button"
              onClick={() => setProjectionMode('pyramid')}
              className={`px-2.5 py-1 rounded-lg text-[9.5px] sm:text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                projectionMode === 'pyramid'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-black'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Brain className="w-3 h-3" />
              <span>{language === 'en' ? 'Stability' : 'Stabilitas'}</span>
            </button>
          </div>

          {/* Ikon Kalender Bersanding di Sebelah Switcher (Identik dengan Ruang Al-Qur'an) */}
          {(onOpenCalendar || onOpenCalendarOnDate) && (
            <button
              type="button"
              onClick={() => {
                if (onOpenCalendar) onOpenCalendar();
                else if (onOpenCalendarOnDate) onOpenCalendarOnDate(todayStr);
              }}
              className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-xl clay-pill text-indigo-500 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs transition-transform shrink-0"
              title={language === 'en' ? 'Review Calendar' : 'Kalender Murajaah'}
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* ========================================================
          4. DYNAMIC VIEW (Berdasarkan Switcher Aktif):
          - MODE A: 7 HARI (7 Kapsul Vertikal + Pemilih Pekan 1-5)
          - MODE B: HORIZON (Ombak Lini Masa 1 - 365 Hari)
          - MODE C: PIRAMIDA MEMORI (Persis Desain Piramida Beranda)
          ======================================================== */}
      {projectionMode === 'capsules' ? (
        /* MODE A: 7 HARI VERTICAL CAPSULES */
        <div className="space-y-1.5">
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 p-1.5 rounded-2xl neumorph-inset bg-slate-100/50 dark:bg-slate-900/40">
            {capsulesData.days.map((d, idx) => {
              const fillHeightPct = capsulesData.maxDayCount > 0 
                ? Math.round((d.count / capsulesData.maxDayCount) * 100) 
                : 0;

              return (
                <div key={idx} className="flex flex-col items-center justify-between text-center select-none py-0.5">
                  <span className={`text-[7.5px] sm:text-[8px] font-black leading-tight truncate w-full ${
                    d.isToday ? 'text-[#FF6F3D]' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {d.dayName}
                  </span>
                  <span className="text-[7px] text-slate-400 leading-tight">
                    {d.dateStr}
                  </span>

                  <div className="w-5 sm:w-6 h-12 sm:h-14 rounded-full clay-inset bg-slate-200/50 dark:bg-slate-800/60 my-1 p-0.5 flex flex-col justify-end items-center relative overflow-hidden">
                    {d.count > 0 ? (
                      <div 
                        className="w-full rounded-full transition-all duration-700 flex flex-col justify-end overflow-hidden shadow-xs"
                        style={{ height: `${Math.max(20, fillHeightPct)}%` }}
                      >
                        {d.isToday ? (
                          <div className="w-full h-full rounded-full bg-gradient-to-t from-[#E65320] to-[#FF7E4A]" />
                        ) : d.mapanCount > 0 && d.activeCount > 0 ? (
                          /* Stacked Two-Tone Bar: Mapan (Green) on top, Active (Blue) on bottom */
                          <div className="w-full h-full flex flex-col justify-end rounded-full overflow-hidden">
                            <div 
                              className="w-full bg-gradient-to-t from-[#059669] to-[#34D399] rounded-t-full transition-all border-b border-white/20"
                              style={{ height: `${(d.mapanCount / d.count) * 100}%` }}
                              title={`Mapan: ${d.mapanCount}`}
                            />
                            <div 
                              className="w-full bg-gradient-to-t from-[#0284C7] to-[#38BDF8] rounded-b-full transition-all"
                              style={{ height: `${(d.activeCount / d.count) * 100}%` }}
                              title={`Aktif: ${d.activeCount}`}
                            />
                          </div>
                        ) : d.mapanCount > 0 ? (
                          /* 100% Mapan (Green) */
                          <div className="w-full h-full rounded-full bg-gradient-to-t from-[#059669] to-[#34D399]" />
                        ) : (
                          /* 100% Aktif (Blue) */
                          <div className="w-full h-full rounded-full bg-gradient-to-t from-[#0284C7] to-[#38BDF8]" />
                        )}
                      </div>
                    ) : (
                      <div className="w-2 h-0.5 bg-slate-300 dark:bg-slate-600 rounded-full my-auto" />
                    )}
                  </div>

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

          {/* Pemilih Pekan 1-4 atau Pekan 1-5 sesuai siklus bulan */}
          <div className="flex items-center justify-between gap-1 pt-0.5 overflow-x-auto scrollbar-none">
            {availableWeeks.map((wk) => {
              const isSelected = selectedWeek === wk;
              return (
                <button
                  key={wk}
                  type="button"
                  onClick={() => setSelectedWeek(wk)}
                  className={`flex-1 py-1 px-1.5 rounded-xl text-[9px] sm:text-[9.5px] font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white shadow-2xs font-black scale-102'
                      : 'clay-pill text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Pekan {wk + 1}
                </button>
              );
            })}
          </div>
        </div>
      ) : projectionMode === 'wave' ? (
        /* MODE B: HORIZON OMBAK LINI MASA DENGAN SLIDER 1-365 HARI */
        <div className="space-y-1.5">
          <div className="flex flex-col gap-1 px-0.5">
            <div className="flex items-center justify-between text-[9px] sm:text-[9.5px] font-bold">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <History className="w-2.5 h-2.5" />
                <span>{biDirectionalWave.totalPast} murajaah lalu</span>
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-[#0284C7] dark:text-[#38BDF8] text-[8.5px] font-mono font-bold">
                ±{waveRange} Hari
              </span>
              <span className="flex items-center gap-1 text-[#0284C7] dark:text-[#38BDF8]">
                <TrendingUp className="w-2.5 h-2.5" />
                <span>{biDirectionalWave.totalFuture} jadwal depan</span>
              </span>
            </div>

            <div className="relative flex items-center w-full py-0.5">
              <input
                type="range"
                min={1}
                max={365}
                step={1}
                value={waveRange}
                onChange={(e) => setWaveRange(parseInt(e.target.value, 10) || 7)}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none z-10 accent-[#0EA5E9]"
                style={{
                  background: `linear-gradient(90deg, #10B981 0%, #059669 ${Math.max(5, ((waveRange - 1) / 364) * 50)}%, #0EA5E9 ${Math.min(95, 50 + ((waveRange - 1) / 364) * 50)}%, #38BDF8 100%)`
                }}
              />
            </div>
          </div>

          <div className="w-full h-16 sm:h-18 rounded-2xl neumorph-inset bg-slate-100/40 dark:bg-slate-900/40 p-1 relative overflow-hidden">
            <svg 
              viewBox={`0 0 ${biDirectionalWave.svgWidth} ${biDirectionalWave.svgHeight}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="bookHorizonGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                  <stop offset="48%" stopColor="#059669" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#FF6F3D" stopOpacity="1" />
                  <stop offset="52%" stopColor="#0284C7" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.8" />
                </linearGradient>

                <linearGradient id="bookHorizonAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path d={biDirectionalWave.areaD} fill="url(#bookHorizonAreaGrad)" />
              <path d={biDirectionalWave.pathD} fill="none" stroke="url(#bookHorizonGrad)" strokeWidth="2.5" strokeLinecap="round" />

              {biDirectionalWave.centerCoord && (
                <g>
                  <line 
                    x1={biDirectionalWave.centerCoord.x} 
                    y1={4} 
                    x2={biDirectionalWave.centerCoord.x} 
                    y2={biDirectionalWave.svgHeight - 12} 
                    stroke="#FF6F3D" 
                    strokeWidth="1.2" 
                    strokeDasharray="2,2" 
                  />
                  <circle 
                    cx={biDirectionalWave.centerCoord.x} 
                    cy={biDirectionalWave.centerCoord.y} 
                    r="4" 
                    fill="#FF6F3D" 
                    stroke="white" 
                    strokeWidth="1.5" 
                  />
                </g>
              )}
            </svg>
          </div>
        </div>
      ) : (
        /* MODE C: PIRAMIDA STABILITAS MEMORI (PERSIS DENGAN DESAIN BERANDA) */
        <div className="space-y-1.5">
          <div className="space-y-1.5">
            {pyramidTiers.map((tier) => {
              const isSelected = selectedPyramidTier === tier.id;
              const barWidthPercent = Math.max(tier.percent, tier.count > 0 ? 12 : 4);

              return (
                <div 
                  key={tier.id}
                  onClick={() => setSelectedPyramidTier(isSelected ? null : tier.id)}
                  className={`p-2 sm:p-2.5 rounded-2xl transition-all cursor-pointer relative group ${
                    isSelected 
                      ? 'neumorph-card ring-2 ring-[#10B981] scale-[1.005] shadow-xs' 
                      : 'neumorph-card hover:scale-[1.005] hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" 
                        style={{ backgroundColor: tier.colorFrom }} 
                      />
                      <span className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] truncate">
                        {tier.name}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-bold shrink-0 ${tier.bgPill}`}>
                        {tier.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-black text-[#18234A] dark:text-[#F8FAFC]">
                        {tier.count} <span className="text-[9.5px] font-medium text-[#8493AB]">({tier.percent}%)</span>
                      </span>
                      <ChevronRight className={`w-3 h-3 text-[#8493AB] transition-transform ${isSelected ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
                    </div>
                  </div>

                  {/* 3D Soft Progress Bar */}
                  <div className="w-full h-2 rounded-full neumorph-inset overflow-hidden p-0.5 relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidthPercent}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full shadow-xs"
                      style={{
                        background: `linear-gradient(to right, ${tier.colorFrom}, ${tier.colorTo})`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Tier Tip & Info */}
          <AnimatePresence>
            {activePyramidTierObj && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="neumorph-inset p-2.5 rounded-2xl space-y-1 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                    <span className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC]">
                      {activePyramidTierObj.name} • {activePyramidTierObj.count} {language === 'en' ? 'cards' : 'kartu'}
                    </span>
                  </div>
                  <span className="text-[9.5px] text-[#5E6D88] dark:text-[#94A3B8] font-medium">
                    {activePyramidTierObj.badge}
                  </span>
                </div>
                <p className="text-[10.5px] text-[#5E6D88] dark:text-[#94A3B8] leading-relaxed">
                  💡 <span className="font-semibold text-[#18234A] dark:text-[#F8FAFC]">{activePyramidTierObj.tip}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 5. Expandable Detailed Card Breakdown Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-3 sm:p-3.5 space-y-2.5 neumorph-inset rounded-2xl border-t border-black/[0.04] dark:border-white/[0.04] mt-1"
          >
            {/* Search & Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-[#5E6D88] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={language === 'en' ? 'Search card materials or chapter...' : 'Cari kartu materi atau bab...'}
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl neumorph-card text-[#18234A] dark:text-[#F8FAFC] placeholder-[#5E6D88] focus:outline-none focus:ring-1 focus:ring-[#FF6F3D]/40 transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5E6D88] hover:text-[#18234A] dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2 py-1 rounded-xl text-[10.5px] font-bold cursor-pointer transition-all shrink-0 ${
                    filterMode === 'all'
                      ? 'bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white shadow-2xs'
                      : 'neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]'
                  }`}
                >
                  Semua ({itemRecords.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterMode('due')}
                  className={`px-2 py-1 rounded-xl text-[10.5px] font-bold cursor-pointer transition-all shrink-0 flex items-center gap-1 ${
                    filterMode === 'due'
                      ? 'bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white shadow-2xs'
                      : 'neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Jatuh Tempo ({dueCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterMode('high_freq')}
                  className={`px-2 py-1 rounded-xl text-[10.5px] font-bold cursor-pointer transition-all shrink-0 flex items-center gap-1 ${
                    filterMode === 'high_freq'
                      ? 'bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white shadow-2xs'
                      : 'neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]'
                  }`}
                >
                  <Flame className="w-3 h-3" />
                  <span>Paling Sering</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterMode('mastered')}
                  className={`px-2 py-1 rounded-xl text-[10.5px] font-bold cursor-pointer transition-all shrink-0 flex items-center gap-1 ${
                    filterMode === 'mastered'
                      ? 'bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white shadow-2xs'
                      : 'neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Mapan ({masteredCount})</span>
                </button>
              </div>
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block neumorph-card rounded-2xl overflow-hidden">
              <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-300/40">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white/95 dark:bg-[#182236]/95 backdrop-blur-xs border-b border-black/[0.04] dark:border-white/[0.04] text-[9.5px] font-bold text-[#5E6D88] dark:text-[#94A3B8] uppercase tracking-wider z-10">
                    <tr>
                      <th scope="col" className="py-2 px-3 w-[45%]">Kartu Materi & Bab</th>
                      <th scope="col" className="py-2 px-3 w-[15%] text-center">Interval</th>
                      <th scope="col" className="py-2 px-3 w-[18%] text-center">Frekuensi</th>
                      <th scope="col" className="py-2 px-3 w-[22%] text-right">Status Jadwal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.03] text-xs">
                    {filteredItems.length > 0 ? (
                      filteredItems.map(item => (
                        <tr
                          key={item.id}
                          onClick={() => onSelectCard?.(item.rawItem)}
                          className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        >
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-[#FF6F3D] font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                                {item.itemIndex}
                              </span>
                              <div className="min-w-0">
                                <div className="font-bold text-[#18234A] dark:text-[#F8FAFC] truncate group-hover:text-[#FF6F3D] transition-colors text-xs">
                                  <BilingualCardText text={item.title} />
                                </div>
                                {item.chapterTitle && (
                                  <p className="text-[10px] text-[#5E6D88] dark:text-[#94A3B8] truncate mt-0.5">
                                    {item.chapterTitle}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-black/[0.03] dark:bg-white/[0.04] text-[11px] font-mono font-bold text-[#18234A] dark:text-[#F8FAFC]">
                              {item.intervalDays} {language === 'en' ? 'days' : 'hari'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="font-mono text-xs font-bold text-[#18234A] dark:text-[#F8FAFC]">
                              {item.frequency}x
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            {item.isOverdue ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                                Telat {item.overdueDays} hari
                              </span>
                            ) : item.isDue ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                                Jatuh Tempo Hari Ini
                              </span>
                            ) : item.isMastered ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                                Mapan
                              </span>
                            ) : (
                              <span className="text-[10.5px] text-[#5E6D88] dark:text-[#94A3B8] font-medium">
                                {item.lastReviewLabel}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-xs text-[#5E6D88]">
                          Tidak ada kartu yang cocok dengan pencarian / filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View (< md) */}
            <div className="md:hidden space-y-2 max-h-60 overflow-y-auto">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onSelectCard?.(item.rawItem)}
                    className="p-2.5 rounded-xl neumorph-card flex items-center justify-between gap-2 cursor-pointer active:scale-98 transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-orange-100 dark:bg-orange-950/40 text-[#FF6F3D] font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        {item.itemIndex}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-[#18234A] dark:text-[#F8FAFC] truncate">
                          <BilingualCardText text={item.title} />
                        </div>
                        {item.chapterTitle && (
                          <p className="text-[9.5px] text-[#5E6D88] truncate mt-0.5">
                            {item.chapterTitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {item.isOverdue ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[9.5px] font-bold">
                          +{item.overdueDays}h
                        </span>
                      ) : item.isDue ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[9.5px] font-bold">
                          Hari ini
                        </span>
                      ) : item.isMastered ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[9.5px] font-bold">
                          Mapan
                        </span>
                      ) : (
                        <span className="text-[9.5px] font-mono font-bold text-slate-500">
                          {item.intervalDays}h
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-[#5E6D88]">
                  Tidak ada kartu ditemukan.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Keterkaitan Kelas (Menampilkan info kelas terkait buku ini secara minimalis 1-2 baris) */}
      <AnimatePresence>
        {isClassModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-white dark:bg-[#182236] rounded-3xl p-4 sm:p-5 shadow-2xl border border-black/[0.06] dark:border-white/[0.08] space-y-3.5"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between gap-3 border-b border-black/[0.04] dark:border-white/[0.04] pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-[#18234A] dark:text-[#F8FAFC] truncate">
                        {language === 'en' ? 'Connected Classes' : 'Keterkaitan Kelas'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                        {linkedClasses.length > 0 ? linkedClasses.length : (joinedClass ? 1 : 0)} {language === 'en' ? 'Classes' : 'Kelas'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#687086] dark:text-[#94A3B8] font-medium truncate">
                      {language === 'en' 
                        ? 'Select a class to jump directly into its classroom' 
                        : 'Pilih kelas untuk langsung menuju ruang kelas tersebut'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="w-8 h-8 rounded-xl clay-pill flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer shrink-0 transition-transform active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Minimalist 1-2 Line Class Cards */}
              <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar pr-0.5">
                {linkedClasses.length > 0 ? (
                  linkedClasses.map(cls => (
                    <div 
                      key={cls.id}
                      onClick={() => {
                        setIsClassModalOpen(false);
                        if (onSelectClass) {
                          onSelectClass(cls.id);
                        } else if (onNavigateTeaching) {
                          onNavigateTeaching();
                        }
                      }}
                      className="group relative p-2.5 sm:py-2.5 sm:px-3 rounded-2xl clay-card-subtle hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-2.5 border border-black/[0.04] dark:border-white/[0.06] hover:border-indigo-400/50 shadow-2xs"
                      title={language === 'en' ? `Jump to ${cls.name}` : `Bypass langsung ke ${cls.name}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          {/* Line 1: Class Name & Class Code Badge */}
                          <div className="flex items-center gap-1.5 min-w-0 flex-nowrap">
                            <h4 className="text-xs sm:text-sm font-black text-[#18234A] dark:text-[#F8FAFC] truncate font-serif group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {cls.name}
                            </h4>
                            <span className="px-1.5 py-0.2 rounded-md bg-indigo-100/70 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono text-[9.5px] font-bold shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                              {cls.code}
                            </span>
                          </div>

                          {/* Line 2: Teacher & Student Count */}
                          <div className="flex items-center gap-2 text-[10.5px] text-[#5E6D88] dark:text-[#94A3B8] truncate mt-0.5">
                            {cls.teacherName && (
                              <span className="truncate">
                                {cls.teacherName}
                              </span>
                            )}
                            {cls.teacherName && <span className="opacity-40">•</span>}
                            <span className="inline-flex items-center gap-1 shrink-0 font-medium">
                              <Users className="w-3 h-3 text-indigo-500" />
                              <span>{cls.students ? cls.students.length : 0} {language === 'en' ? 'students' : 'santri'}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right CTA Button */}
                      <div className="shrink-0 flex items-center">
                        <span className="h-7 px-2.5 rounded-xl clay-pill text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center gap-1 transition-all shadow-2xs">
                          <span>{language === 'en' ? 'Open' : 'Buka'}</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  ))
                ) : joinedClass ? (
                  <div 
                    onClick={() => {
                      setIsClassModalOpen(false);
                      if (onSelectClass) {
                        onSelectClass(joinedClass.id);
                      } else if (onNavigateTeaching) {
                        onNavigateTeaching();
                      }
                    }}
                    className="group relative p-2.5 sm:py-2.5 sm:px-3 rounded-2xl clay-card-subtle hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-2.5 border border-black/[0.04] dark:border-white/[0.06] hover:border-indigo-400/50 shadow-2xs"
                    title={language === 'en' ? `Jump to ${joinedClass.name}` : `Bypass langsung ke ${joinedClass.name}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        {/* Line 1: Class Name & Class Code Badge */}
                        <div className="flex items-center gap-1.5 min-w-0 flex-nowrap">
                          <h4 className="text-xs sm:text-sm font-black text-[#18234A] dark:text-[#F8FAFC] truncate font-serif group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {joinedClass.name}
                          </h4>
                          <span className="px-1.5 py-0.2 rounded-md bg-indigo-100/70 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono text-[9.5px] font-bold shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                            {joinedClass.code}
                          </span>
                        </div>

                        {/* Line 2: Teacher */}
                        {joinedClass.teacherName && (
                          <p className="text-[10.5px] text-[#5E6D88] dark:text-[#94A3B8] truncate mt-0.5">
                            {joinedClass.teacherName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right CTA Button */}
                    <div className="shrink-0 flex items-center">
                      <span className="h-7 px-2.5 rounded-xl clay-pill text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center gap-1 transition-all shadow-2xs">
                        <span>{language === 'en' ? 'Open' : 'Buka'}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC]">
                      {language === 'en' ? 'No classes linked to this book yet.' : 'Buku ini belum terhubung ke kelas manapun.'}
                    </p>
                    <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] max-w-xs mx-auto">
                      {language === 'en' 
                        ? 'When a teacher creates a class and selects this book, it will appear here for fast jumping.'
                        : 'Saat guru membuat kelas di Ruang Mengajar dan memilih buku ini, kelas tersebut akan langsung terhubung ke sini.'}
                    </p>
                    {onNavigateTeaching && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsClassModalOpen(false);
                          onNavigateTeaching();
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Create Class with This Book' : 'Buat Kelas dengan Buku Ini'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {(linkedClasses.length > 0 || joinedClass) && (
                <div className="pt-2.5 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-[11px] text-[#5E6D88] dark:text-[#94A3B8]">
                  <span className="truncate">
                    💡 {language === 'en' ? 'Click any class above to jump directly into it' : 'Klik kelas untuk bypass langsung'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsClassModalOpen(false)}
                    className="px-2.5 py-1 rounded-lg clay-pill text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] hover:text-indigo-600 transition-colors cursor-pointer shrink-0 ml-2"
                  >
                    {language === 'en' ? 'Close' : 'Tutup'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
