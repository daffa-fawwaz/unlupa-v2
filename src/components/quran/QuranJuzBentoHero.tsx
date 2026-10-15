import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  CloudDownload,
  Download,
  CheckCircle2,
  Loader2,
  Zap,
  Flame,
  History,
  TrendingUp,
  Clock,
  Sliders,
  Brain,
  ChevronRight,
  Info,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { JuzMeta } from "../../data/quranData";
import { QuranPageItem } from "../../types";
import { isDue } from "../../lib/fsrs";
import { StreakCounter, FireStrikeBar } from "../shared/StreakCounter";
import { QuranJuzCoverArt } from "./QuranJuzCoverArt";
import { useApp } from "../../context/AppContext";

interface Props {
  juz: JuzMeta;
  quranPages: QuranPageItem[];
  activeCount: number;
  dueCount: number;
  mapanCount: number;
  language: string;
  isDownloadingJuz: boolean;
  downloadProgress: { current: number; total: number } | null;
  juzOfflineStatus: {
    total: number;
    cached: number;
    isFullyCached: boolean;
  } | null;
  onDownloadJuz: () => void;
  onStartReview: () => void;
  onOpenCalendar: () => void;
  onBack?: () => void;
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Polar coordinate helper for isometric 3D ellipse
function polarToCartesian(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + rx * Math.cos(angleInRadians),
    y: cy + ry * Math.sin(angleInRadians),
  };
}

// Wedge generator for donut sectors
function describeWedge(
  cx: number,
  cy: number,
  rxOut: number,
  ryOut: number,
  rxIn: number,
  ryIn: number,
  startAngle: number,
  endAngle: number,
): string {
  const diff = endAngle - startAngle;
  if (diff <= 0.05) return "";

  if (diff >= 359.9) {
    return [
      `M ${cx} ${cy - ryOut}`,
      `A ${rxOut} ${ryOut} 0 1 1 ${cx} ${cy + ryOut}`,
      `A ${rxOut} ${ryOut} 0 1 1 ${cx} ${cy - ryOut}`,
      `M ${cx} ${cy - ryIn}`,
      `A ${rxIn} ${ryIn} 0 1 0 ${cx} ${cy + ryIn}`,
      `A ${rxIn} ${ryIn} 0 1 0 ${cx} ${cy - ryIn}`,
      "Z",
    ].join(" ");
  }

  const safeEndAngle = endAngle;

  const startOut = polarToCartesian(cx, cy, rxOut, ryOut, startAngle);
  const endOut = polarToCartesian(cx, cy, rxOut, ryOut, safeEndAngle);
  const startIn = polarToCartesian(cx, cy, rxIn, ryIn, startAngle);
  const endIn = polarToCartesian(cx, cy, rxIn, ryIn, safeEndAngle);
  const largeArcFlag = diff <= 180 ? "0" : "1";

  return [
    `M ${startIn.x} ${startIn.y}`,
    `L ${startOut.x} ${startOut.y}`,
    `A ${rxOut} ${ryOut} 0 ${largeArcFlag} 1 ${endOut.x} ${endOut.y}`,
    `L ${endIn.x} ${endIn.y}`,
    `A ${rxIn} ${ryIn} 0 ${largeArcFlag} 0 ${startIn.x} ${startIn.y}`,
    "Z",
  ].join(" ");
}

// 3D Extrusion Wall for outer cylinder
function describeFrontWall(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  depth: number,
  startAngle: number,
  endAngle: number,
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
      "Z",
    ].join(" ");
  }

  const frontStart = Math.max(90, Math.min(270, startAngle));
  const frontEnd = Math.max(90, Math.min(270, endAngle));
  if (frontEnd - frontStart <= 0.5) return "";

  const p1 = polarToCartesian(cx, cy, rx, ry, frontStart);
  const p2 = polarToCartesian(cx, cy, rx, ry, frontEnd);
  const p3 = { x: p2.x, y: p2.y + depth };
  const p4 = { x: p1.x, y: p1.y + depth };

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rx} ${ry} 0 0 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rx} ${ry} 0 0 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

type ProjectionViewMode = "capsules" | "wave" | "pyramid";

export const QuranJuzBentoHero: React.FC<Props> = ({
  juz,
  quranPages,
  activeCount,
  dueCount,
  mapanCount,
  language,
  isDownloadingJuz,
  downloadProgress,
  juzOfflineStatus,
  onDownloadJuz,
  onStartReview,
  onOpenCalendar,
  onBack,
}) => {
  const totalPages = juz.totalPages;
  const inactiveCount = Math.max(0, totalPages - activeCount);
  const activePercentage =
    totalPages > 0 ? Math.round((activeCount / totalPages) * 100) : 0;
  const mapanPercentage =
    totalPages > 0 ? Math.round((mapanCount / totalPages) * 100) : 0;

  // Projection View Modes
  const [projectionMode, setProjectionMode] =
    useState<ProjectionViewMode>("capsules");
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);
  const [waveRange, setWaveRange] = useState<number>(7); // Default 7 Hari!
  const [selectedPyramidTier, setSelectedPyramidTier] = useState<string | null>(
    null,
  );

  // Today reference
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Database History & Future Schedule Aggregator for this Juz
  const {
    pastMap,
    futureMap,
    futureBreakdownMap,
    todayReviewsCount,
    todayActiveCount,
    todayMapanCount,
  } = useMemo(() => {
    const isPageMapan = (p: QuranPageItem) => {
      return (
        p.status === "mastered_for_now" ||
        !!p.mapanCelebrated ||
        (p.fsrsData?.stability || 0) * 0.4025587 >= 30
      );
    };

    const juzPages = (quranPages || []).filter(
      (p) => p.juzNumber === juz.juzNumber,
    );
    const pastMap = new Map<string, number>();
    const futureMap = new Map<string, number>();
    const futureBreakdownMap = new Map<
      string,
      { total: number; activeCount: number; mapanCount: number }
    >();
    const todayStr = formatLocalDate(today);

    let completedToday = 0;
    let todayActiveCount = 0;
    let todayMapanCount = 0;

    juzPages.forEach((p) => {
      if (Array.isArray(p.reviewLogs) && p.reviewLogs.length > 0) {
        p.reviewLogs.forEach((log) => {
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
      } else if (p.fsrsData?.lastReview) {
        const lastRev = new Date(p.fsrsData.lastReview);
        lastRev.setHours(0, 0, 0, 0);
        const dStr = formatLocalDate(lastRev);
        if (lastRev < today) {
          pastMap.set(dStr, (pastMap.get(dStr) || 0) + 1);
        } else if (dStr === todayStr) {
          completedToday += 1;
        }
      }

      if (p.isActive && p.fsrsData?.nextReview) {
        const nextDate = new Date(p.fsrsData.nextReview);
        nextDate.setHours(0, 0, 0, 0);
        const dStr = formatLocalDate(nextDate);
        const mapan = isPageMapan(p);

        if (nextDate > today) {
          const prev = futureBreakdownMap.get(dStr) || {
            total: 0,
            activeCount: 0,
            mapanCount: 0,
          };
          if (mapan) {
            prev.mapanCount += 1;
          } else {
            prev.activeCount += 1;
          }
          prev.total = prev.activeCount + prev.mapanCount;
          futureBreakdownMap.set(dStr, prev);
          futureMap.set(dStr, prev.total);
        } else if (dStr === todayStr) {
          if (mapan) {
            todayMapanCount += 1;
          } else {
            todayActiveCount += 1;
          }
        }
      }
    });

    const todayReviewsCount = Math.max(completedToday, dueCount);

    return {
      pastMap,
      futureMap,
      futureBreakdownMap,
      todayReviewsCount,
      todayActiveCount,
      todayMapanCount,
    };
  }, [quranPages, juz.juzNumber, today, dueCount]);

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
    if (selectedWeekIndex >= availableWeeks.length) {
      setSelectedWeekIndex(0);
    }
  }, [availableWeeks, selectedWeekIndex]);

  // 1. Data for 7-Day Vertical Capsules (with Dynamic Weeks Switcher)
  const capsulesData = useMemo(() => {
    const dayNames = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];
    const monthNames = [
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

    const weekOffsetDays = selectedWeekIndex * 7;
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

      days.push({
        dayName: isToday ? "HARI INI" : dayNames[d.getDay()],
        dateStr: `${d.getDate()} ${monthNames[d.getMonth()]}`,
        count,
        activeCount,
        mapanCount,
        isToday,
        dateFormatted: `${d.getDate()} ${monthNames[d.getMonth()]}`,
      });
    }

    const maxDayCount = Math.max(1, ...days.map((d) => d.count));
    const avgPerDay = (weekTotal / 7).toFixed(1);

    return {
      days,
      weekTotal,
      maxDayCount,
      avgPerDay,
    };
  }, [
    selectedWeekIndex,
    futureBreakdownMap,
    todayReviewsCount,
    todayActiveCount,
    todayMapanCount,
    today,
  ]);

  // 2. BI-DIRECTIONAL HORIZON WAVE WITH INTERACTIVE SLIDER (Range 1 to 365 Days)
  const biDirectionalWave = useMemo(() => {
    const R = Math.max(1, Math.min(365, waveRange)); // Dynamic range between 1 and 365 days
    const monthNames = [
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

    const totalDays = 2 * R + 1;
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
    let peakPast = { offset: 0, count: 0, dateStr: "" };
    let peakFuture = { offset: 0, count: 0, dateStr: "" };

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

      const label =
        offset === 0
          ? "Hari Ini"
          : `${d.getDate()} ${monthNames[d.getMonth()]}`;

      points.push({
        offset,
        dateStr: dStr,
        count,
        isToday: offset === 0,
        isPast: offset < 0,
        isFuture: offset > 0,
        label,
      });
    }

    const maxCount = Math.max(1, ...points.map((p) => p.count));

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
        offset: p.offset,
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
    const centerCoord =
      coords.find((c) => c.isToday) || coords[Math.floor(coords.length / 2)];

    // X-axis Milestones
    const formatRangeLabel = (days: number, isNeg: boolean) => {
      if (days >= 365) return isNeg ? "-1 Thn" : "+1 Thn";
      if (days >= 60)
        return isNeg
          ? `-${Math.round(days / 30)} Bln`
          : `+${Math.round(days / 30)} Bln`;
      if (days >= 14 && days % 7 === 0)
        return isNeg ? `-${days / 7} Pkn` : `+${days / 7} Pkn`;
      return isNeg ? `-${days}h` : `+${days}h`;
    };

    let milestones = [];
    if (R === 1) {
      milestones = [
        { label: "-1h", isCenter: false },
        { label: "Hari Ini", isCenter: true },
        { label: "+1h", isCenter: false },
      ];
    } else if (R === 2) {
      milestones = [
        { label: "-2h", isCenter: false },
        { label: "Hari Ini", isCenter: true },
        { label: "+2h", isCenter: false },
      ];
    } else {
      milestones = [
        { label: formatRangeLabel(R, true), isCenter: false },
        { label: formatRangeLabel(Math.round(R / 2), true), isCenter: false },
        { label: "Hari Ini", isCenter: true },
        { label: formatRangeLabel(Math.round(R / 2), false), isCenter: false },
        { label: formatRangeLabel(R, false), isCenter: false },
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
      milestones,
    };
  }, [waveRange, pastMap, futureMap, todayReviewsCount, today]);

  // Memory Stability Tiers for this Juz (Tingkat Stabilitas Memori FSRS)
  const pyramidTiers = useMemo(() => {
    const juzPages = (quranPages || []).filter(
      (p) => p.juzNumber === juz.juzNumber && p.isActive,
    );

    const tMapan: QuranPageItem[] = [];
    const tKokoh: QuranPageItem[] = [];
    const tKonsolidasi: QuranPageItem[] = [];
    const tKritis: QuranPageItem[] = [];

    juzPages.forEach((p) => {
      const stability = p.fsrsData?.stability || 0;
      const rawInterval = Math.round(stability * 0.4025587);
      const isMastered = p.status === "mastered_for_now" || rawInterval >= 30;

      if (isMastered || rawInterval >= 30) {
        tMapan.push(p);
      } else if (rawInterval >= 15) {
        tKokoh.push(p);
      } else if (rawInterval >= 7) {
        tKonsolidasi.push(p);
      } else {
        tKritis.push(p);
      }
    });

    const activeTotal = juzPages.length;

    return [
      {
        id: "mapan",
        level: 4,
        name: language === "en" ? "Mastered" : "Mapan",
        badge: "≥ 30 Hari",
        desc:
          language === "en"
            ? "Solid in long-term memory"
            : "Tersimpan kokoh di memori jangka panjang",
        colorFrom: "#10B981",
        colorTo: "#059669",
        textColor: "#059669",
        bgPill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        count: tMapan.length,
        percent:
          activeTotal > 0 ? Math.round((tMapan.length / activeTotal) * 100) : 0,
        tip:
          language === "en"
            ? "Periodic maintenance keeps recall effortless."
            : "Cukup murajaah berkala untuk menjaga kelancaran permanen.",
      },
      {
        id: "kokoh",
        level: 3,
        name: language === "en" ? "Strong" : "Kokoh",
        badge: "15 – 29 Hari",
        desc:
          language === "en"
            ? "Strong recall stability"
            : "Daya ingat kuat, menuju fase kemapanan penuh",
        colorFrom: "#0EA5E9",
        colorTo: "#0284C7",
        textColor: "#0284C7",
        bgPill: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
        count: tKokoh.length,
        percent:
          activeTotal > 0 ? Math.round((tKokoh.length / activeTotal) * 100) : 0,
        tip:
          language === "en"
            ? "Successful evaluations will elevate pages to Mastered tier."
            : "Sesi murajaah lancar berikutnya akan menaikkan halaman ini ke level Mapan.",
      },
      {
        id: "konsolidasi",
        level: 2,
        name: language === "en" ? "Consol" : "Konsol",
        badge: "7 – 14 Hari",
        desc:
          language === "en"
            ? "Active neural consolidation"
            : "Dalam pembentukan jejak memori berkelanjutan",
        colorFrom: "#F59E0B",
        colorTo: "#D97706",
        textColor: "#D97706",
        bgPill: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        count: tKonsolidasi.length,
        percent:
          activeTotal > 0
            ? Math.round((tKonsolidasi.length / activeTotal) * 100)
            : 0,
        tip:
          language === "en"
            ? "Consistent practice solidifies synaptic connections."
            : "Latihan rutin secara teratur mengokohkan sambungan ingatan.",
      },
      {
        id: "kritis",
        level: 1,
        name: language === "en" ? "New" : "Baru",
        badge: "< 7 Hari",
        desc:
          language === "en"
            ? "Early consolidation phase"
            : "Fase pengenalan awal yang memerlukan perhatian khusus",
        colorFrom: "#FF6F3D",
        colorTo: "#E11D48",
        textColor: "#E11D48",
        bgPill: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
        count: tKritis.length,
        percent:
          activeTotal > 0
            ? Math.round((tKritis.length / activeTotal) * 100)
            : 0,
        tip:
          language === "en"
            ? "Frequent spaced reviews are essential here."
            : "Murajaah aktif dalam 1-3 hari pertama sangat krusial agar tidak lupa.",
      },
    ];
  }, [quranPages, juz.juzNumber, language]);

  // 3D Isometric Donut Geometry with Outer Stability Arc (Al-Qur'an Juz Hero Masterpiece)
  const donut3D = useMemo(() => {
    const cx = 58;
    const cy = 34;
    // Primary Donut (Active vs Inactive)
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

    const isZeroTotal = totalPages === 0;
    const total = isZeroTotal ? 1 : totalPages;
    const degActive = isZeroTotal ? 0 : (activeCount / total) * 360;
    const degInactive = isZeroTotal ? 360 : 360 - degActive;

    const startActive = 30;
    const endActive = startActive + degActive;
    const startInactive = endActive;
    const endInactive = startInactive + degInactive;

    // Primary Donut Paths
    const topActive =
      degActive > 0.1
        ? describeWedge(
            cx,
            cy,
            rxOut,
            ryOut,
            rxIn,
            ryIn,
            startActive,
            endActive,
          )
        : "";
    const wallActive =
      degActive > 0.1
        ? describeFrontWall(cx, cy, rxOut, ryOut, depth, startActive, endActive)
        : "";
    const topInactive =
      degInactive > 0.1
        ? describeWedge(
            cx,
            cy,
            rxOut,
            ryOut,
            rxIn,
            ryIn,
            startInactive,
            endInactive,
          )
        : "";
    const wallInactive =
      degInactive > 0.1
        ? describeFrontWall(
            cx,
            cy,
            rxOut,
            ryOut,
            depth,
            startInactive,
            endInactive,
          )
        : "";

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

    const topArcMapan =
      activeCount > 0 && spanMapan > 0.5
        ? describeWedge(cx, cy, rxOut2, ryOut2, rxIn2, ryIn2, a0, a1)
        : "";
    const wallArcMapan =
      activeCount > 0 && spanMapan > 0.5
        ? describeFrontWall(cx, cy, rxOut2, ryOut2, depth2, a0, a1)
        : "";

    const topArcKokoh =
      activeCount > 0 && spanKokoh > 0.5
        ? describeWedge(cx, cy, rxOut2, ryOut2, rxIn2, ryIn2, a1, a2)
        : "";
    const wallArcKokoh =
      activeCount > 0 && spanKokoh > 0.5
        ? describeFrontWall(cx, cy, rxOut2, ryOut2, depth2, a1, a2)
        : "";

    const topArcKonsol =
      activeCount > 0 && spanKonsol > 0.5
        ? describeWedge(cx, cy, rxOut2, ryOut2, rxIn2, ryIn2, a2, a3)
        : "";
    const wallArcKonsol =
      activeCount > 0 && spanKonsol > 0.5
        ? describeFrontWall(cx, cy, rxOut2, ryOut2, depth2, a2, a3)
        : "";

    const topArcBaru =
      activeCount > 0 && spanBaru > 0.5
        ? describeWedge(cx, cy, rxOut2, ryOut2, rxIn2, ryIn2, a3, a4)
        : "";
    const wallArcBaru =
      activeCount > 0 && spanBaru > 0.5
        ? describeFrontWall(cx, cy, rxOut2, ryOut2, depth2, a3, a4)
        : "";

    return {
      cx,
      cy,
      rxOut,
      ryOut,
      rxIn,
      ryIn,
      depth,
      topActive,
      wallActive,
      topInactive,
      wallInactive,
      topArcMapan,
      wallArcMapan,
      topArcKokoh,
      wallArcKokoh,
      topArcKonsol,
      wallArcKonsol,
      topArcBaru,
      wallArcBaru,
    };
  }, [totalPages, activeCount, pyramidTiers]);

  const { currentStreak } = useApp();

  // Isolated Discipline & Per-Juz Streak Calculation
  const { overdueCount, onTimeCount, disciplineRate, effectiveStreak } =
    useMemo(() => {
      const juzPages = (quranPages || []).filter(
        (p) => p.juzNumber === juz.juzNumber && p.isActive,
      );
      const totalActiveJuzPages = juzPages.length;

      if (totalActiveJuzPages === 0) {
        return {
          overdueCount: 0,
          onTimeCount: 0,
          disciplineRate: 0,
          effectiveStreak: 0,
        };
      }

      let overdue = 0;
      juzPages.forEach((p) => {
        if (p.fsrsData?.nextReview) {
          const nextDate = new Date(p.fsrsData.nextReview);
          nextDate.setHours(0, 0, 0, 0);
          if (nextDate < today) {
            overdue += 1;
          }
        }
      });

      const onTime = Math.max(0, totalActiveJuzPages - overdue);
      const rate = Math.round((onTime / totalActiveJuzPages) * 100);

      // 80% Threshold Rule for THIS Juz:
      if (rate < 80) {
        return {
          overdueCount: overdue,
          onTimeCount: onTime,
          disciplineRate: rate,
          effectiveStreak: 0,
        };
      }

      // Helper to format date into YYYY-MM-DD calendar string
      const toCalendarStr = (dInput: string | Date | number) => {
        const d = new Date(dInput);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const todayCalendarStr = toCalendarStr(today);
      const pastCalendarDates = new Set<string>();
      let todayHasExplicitLog = false;

      juzPages.forEach((p) => {
        if (p.fsrsData?.lastReview) {
          const ds = toCalendarStr(p.fsrsData.lastReview);
          if (ds === todayCalendarStr) {
            todayHasExplicitLog = true;
          } else {
            pastCalendarDates.add(ds);
          }
        }
        if (Array.isArray(p.reviewLogs)) {
          p.reviewLogs.forEach((l) => {
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
      const isTodayCompleted =
        todayHasExplicitLog && overdue === 0 && dueCount === 0;

      // 3. Effective streak:
      // If today's review is completed (or today has explicit log) -> pastStreak + 1
      // If today's review is pending and not yet done today -> pastStreak
      const calculatedStreak = isTodayCompleted ? pastStreak + 1 : pastStreak;

      return {
        overdueCount: overdue,
        onTimeCount: onTime,
        disciplineRate: rate,
        effectiveStreak: calculatedStreak,
      };
    }, [quranPages, juz.juzNumber, today, dueCount]);

  const activePyramidTierObj = pyramidTiers.find(
    (t) => t.id === selectedPyramidTier,
  );

  return (
    <div className="neumorph-card rounded-3xl p-3 sm:p-4 shadow-md border border-white/70 dark:border-slate-800/80 transition-all space-y-3">
      {/* ========================================================
          1. TOP HEADER ROW (Placed above chart to ensure zero text truncation)
      ======================================================== */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 rounded-xl clay-pill flex items-center justify-center text-[#18234A] dark:text-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
              title={
                language === "en"
                  ? "Back to Quran Space"
                  : "Kembali ke Ruang Al-Qur'an"
              }
            >
              <ArrowLeft className="w-4 h-4 text-[#FF6F3D]" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1
              title={`${juz.surahSpan || juz.nameEn} • Juz ${juz.juzNumber}`}
              className="text-sm sm:text-base font-black text-[#18234A] dark:text-[#F8FAFC] leading-tight truncate flex items-baseline gap-1.5"
            >
              <span className="truncate">{juz.surahSpan || juz.nameEn}</span>
              <span className="text-xs font-bold text-[#FF6F3D] shrink-0 font-sans px-2 py-0.5 rounded-full bg-orange-500/10">
                Juz {juz.juzNumber}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onDownloadJuz}
            disabled={isDownloadingJuz}
            className={`w-8 h-8 rounded-xl clay-pill flex items-center justify-center cursor-pointer shadow-xs shrink-0 transition-all ${
              juzOfflineStatus?.isFullyCached
                ? "text-emerald-500"
                : isDownloadingJuz
                  ? "text-amber-500"
                  : "text-[#0EA5E9] hover:text-[#0284C7] hover:scale-105 active:scale-95"
            }`}
            title={
              juzOfflineStatus?.isFullyCached
                ? "Tersimpan Offline"
                : isDownloadingJuz
                  ? `Mengunduh... ${downloadProgress?.current || 0}/${downloadProgress?.total || 20}`
                  : language === "en"
                    ? "Download Juz Pages"
                    : "Download Halaman Juz"
            }
          >
            {isDownloadingJuz ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : juzOfflineStatus?.isFullyCached ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================
          2. LOWER CONTENT ROW: 3D Donut Chart + Status Items
      ======================================================== */}
      <div className="flex flex-row items-center gap-2.5 sm:gap-4 w-full">
        {/* 3D Isometric Donut Pie Chart with Outer Stability 3D Arc */}
        <div className="shrink-0 select-none self-center">
          <div className="w-28 h-20 sm:w-32 sm:h-24 shrink-0 relative select-none flex items-center justify-center">
            <svg
              viewBox="0 0 120 75"
              className="w-full h-full overflow-visible drop-shadow-md"
            >
              <defs>
                {/* Primary Donut Gradients */}
                <linearGradient id="juzActiveTop" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>
                <linearGradient id="juzActiveWall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284C7" />
                  <stop offset="100%" stopColor="#0369A1" />
                </linearGradient>

                <linearGradient id="juzInactiveTop" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F8FAFC" />
                  <stop offset="100%" stopColor="#CBD5E1" />
                </linearGradient>
                <linearGradient
                  id="juzInactiveWall"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
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
              {donut3D.wallInactive && (
                <path d={donut3D.wallInactive} fill="url(#juzInactiveWall)" />
              )}
              {donut3D.topInactive && (
                <path
                  d={donut3D.topInactive}
                  fill="url(#juzInactiveTop)"
                  stroke="white"
                  strokeWidth="0.85"
                  strokeOpacity="0.85"
                />
              )}

              {/* Active 3D Wall & Top (Halaman Aktif) */}
              {donut3D.wallActive && (
                <path d={donut3D.wallActive} fill="url(#juzActiveWall)" />
              )}
              {donut3D.topActive && (
                <path
                  d={donut3D.topActive}
                  fill="url(#juzActiveTop)"
                  stroke="white"
                  strokeWidth="0.95"
                  strokeOpacity="0.9"
                />
              )}

              {/* Outer Stability 3D Arc Segments along Active Sector (Mapan, Kokoh, Konsol, Baru) */}
              {donut3D.wallArcBaru && (
                <path d={donut3D.wallArcBaru} fill="url(#arcBaruWall)" />
              )}
              {donut3D.topArcBaru && (
                <path
                  d={donut3D.topArcBaru}
                  fill="url(#arcBaruTop)"
                  stroke="white"
                  strokeWidth="0.7"
                  strokeOpacity="0.8"
                />
              )}

              {donut3D.wallArcKonsol && (
                <path d={donut3D.wallArcKonsol} fill="url(#arcKonsolWall)" />
              )}
              {donut3D.topArcKonsol && (
                <path
                  d={donut3D.topArcKonsol}
                  fill="url(#arcKonsolTop)"
                  stroke="white"
                  strokeWidth="0.7"
                  strokeOpacity="0.8"
                />
              )}

              {donut3D.wallArcKokoh && (
                <path d={donut3D.wallArcKokoh} fill="url(#arcKokohWall)" />
              )}
              {donut3D.topArcKokoh && (
                <path
                  d={donut3D.topArcKokoh}
                  fill="url(#arcKokohTop)"
                  stroke="white"
                  strokeWidth="0.7"
                  strokeOpacity="0.8"
                />
              )}

              {donut3D.wallArcMapan && (
                <path d={donut3D.wallArcMapan} fill="url(#arcMapanWall)" />
              )}
              {donut3D.topArcMapan && (
                <path
                  d={donut3D.topArcMapan}
                  fill="url(#arcMapanTop)"
                  stroke="white"
                  strokeWidth="0.7"
                  strokeOpacity="0.8"
                />
              )}

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
                {activeCount}/{totalPages} Hal
              </text>
            </svg>
          </div>
        </div>

        {/* Masterpiece High-Density Metrics Panel (Right of 3D Chart) */}
        <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5 space-y-1 sm:space-y-1.5">
          {/* Baris 1: Status Halaman Utama (Halaman Aktif vs Total Halaman) */}
          <div className="flex items-center justify-between px-2 py-1 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 clay-inset text-[10px] sm:text-[11px] font-bold select-none">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 truncate">
              <span className="w-2 h-2 rounded-full bg-[#0EA5E9] shrink-0 shadow-xs" />
              <span className="truncate">
                {language === "en" ? "Active Pages" : "Halaman Aktif"}
              </span>
            </span>
            <span className="font-mono text-slate-900 dark:text-white font-black shrink-0 text-right">
              {activeCount}{" "}
              <span className="text-[8.5px] font-normal text-slate-400">
                / {totalPages}
              </span>
              <span className="text-[#0EA5E9] text-[9.5px] ml-1 font-bold">
                ({activePercentage}%)
              </span>
            </span>
          </div>

          {/* Baris 2: 4 Status Stabilitas Memori (2x2 Grid Padat & Rapi: Mapan, Kokoh, Konsol, Baru) */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-2xs text-[9.5px] sm:text-[10px]">
            {/* Mapan */}
            <div
              className="flex items-center justify-between px-1.5 py-0.5 rounded-lg bg-emerald-500/5"
              title="Mapan / Mutqin (≥ 30 hari)"
            >
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
                <span className="truncate">
                  {language === "en" ? "Master" : "Mapan"}
                </span>
              </span>
              <span className="font-mono font-bold text-[#10B981] shrink-0 ml-1">
                {pyramidTiers[0]?.count || 0}
              </span>
            </div>

            {/* Kokoh */}
            <div
              className="flex items-center justify-between px-1.5 py-0.5 rounded-lg bg-sky-500/5"
              title="Kokoh (15–29 hari)"
            >
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] shrink-0" />
                <span className="truncate">
                  {language === "en" ? "Strong" : "Kokoh"}
                </span>
              </span>
              <span className="font-mono font-bold text-[#0EA5E9] shrink-0 ml-1">
                {pyramidTiers[1]?.count || 0}
              </span>
            </div>

            {/* Konsol */}
            <div
              className="flex items-center justify-between px-1.5 py-0.5 rounded-lg bg-amber-500/5"
              title="Konsolidasi (7–14 hari)"
            >
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />
                <span className="truncate">
                  {language === "en" ? "Consol" : "Konsol"}
                </span>
              </span>
              <span className="font-mono font-bold text-[#F59E0B] shrink-0 ml-1">
                {pyramidTiers[2]?.count || 0}
              </span>
            </div>

            {/* Baru */}
            <div
              className="flex items-center justify-between px-1.5 py-0.5 rounded-lg bg-rose-500/5"
              title="Hafalan Baru (< 7 hari)"
            >
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6F3D] shrink-0" />
                <span className="truncate">
                  {language === "en" ? "New" : "Baru"}
                </span>
              </span>
              <span className="font-mono font-bold text-[#FF6F3D] shrink-0 ml-1">
                {pyramidTiers[3]?.count || 0}
              </span>
            </div>
          </div>

          {/* Baris 3: Halaman Belum Aktif */}
          <div className="flex items-center justify-between px-1.5 text-[9px] sm:text-[9.5px] text-slate-500 dark:text-slate-400 select-none">
            <span className="flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
              <span className="truncate">
                {language === "en" ? "Inactive Pages" : "Belum Aktif"}
              </span>
            </span>
            <span className="font-mono font-semibold shrink-0">
              {inactiveCount} Hal
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          DIAGRAM KEDISIPLINAN LURUS MEMBENTANG PENUH:
          - HEADER: Kedisiplinan & Strike (tanpa "hari", format miss rapi)
          - SEAMLESS BLAZING PURPLE FIRE DISCIPLINE BAR
          - PERSIS DI BAWAH BAR:
            * Jika dueCount === 0: Ikon & Teks "Tidak ada review hari ini"
            * Jika dueCount > 0: Tombol "Tingkatkan & Pertahankan Strikemu (X halaman)"
      ======================================================== */}
      <div className="w-full space-y-1 pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
        <div className="flex items-center justify-between text-[10.5px] sm:text-[11px] font-bold px-0.5">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Flame
              className={`w-3.5 h-3.5 shrink-0 drop-shadow-xs ${
                disciplineRate >= 100
                  ? "text-purple-500 fill-purple-500 animate-pulse"
                  : "text-zinc-400 fill-zinc-400"
              }`}
            />
            <span className="font-extrabold">
              {language === "en" ? "Discipline" : "Kedisiplinan"}
            </span>
            <span
              className={`font-mono font-black text-xs ml-1 ${
                disciplineRate >= 100
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {disciplineRate}%
            </span>
          </div>

          <div className="flex items-center gap-1 shrink min-w-0 ml-auto text-right">
            <span
              className={`text-[10px] sm:text-[10.5px] font-bold font-mono truncate ${
                disciplineRate >= 100
                  ? "text-purple-600 dark:text-purple-300"
                  : disciplineRate >= 80
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {disciplineRate >= 100
                ? `🔥 Strike ${effectiveStreak}`
                : disciplineRate >= 80
                  ? `🔥 Strike ${effectiveStreak}${overdueCount > 0 ? `, ${overdueCount} miss` : ""}`
                  : overdueCount > 0
                    ? `Strike ${effectiveStreak}, ${overdueCount} miss`
                    : `Strike ${effectiveStreak}`}
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
            <span>
              {language === "en"
                ? "No reviews due today"
                : "Tidak ada review hari ini"}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartReview}
            className={`w-full mt-1.5 py-1.5 px-3 rounded-xl text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer ${
              disciplineRate >= 100
                ? "bg-gradient-to-r from-purple-700 via-fuchsia-600 to-indigo-700 shadow-purple-500/20 border border-purple-400/30"
                : disciplineRate >= 80
                  ? "bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 shadow-orange-500/20 border border-orange-400/30"
                  : "bg-gradient-to-r from-slate-800 via-zinc-800 to-slate-900 border border-slate-700/80 shadow-black/20"
            }`}
          >
            <div className="relative flex items-center justify-center shrink-0">
              <Flame
                className={`w-4 h-4 ${
                  disciplineRate >= 100
                    ? "text-fuchsia-200 fill-purple-400 drop-shadow-[0_0_6px_rgba(232,121,249,0.8)]"
                    : disciplineRate >= 80
                      ? "text-amber-200 fill-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]"
                      : "text-slate-400 fill-slate-600"
                }`}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[8.5px] font-black text-white font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pt-0.5">
                {effectiveStreak}
              </span>
            </div>
            <span
              className={`whitespace-nowrap truncate font-extrabold tracking-tight text-[11px] sm:text-xs ${
                disciplineRate >= 100
                  ? "text-purple-100"
                  : disciplineRate >= 80
                    ? "text-amber-100"
                    : "text-slate-300"
              }`}
            >
              {effectiveStreak === 0
                ? language === "en"
                  ? `Start Your First Streak (${dueCount} pages)`
                  : `Raih Strike Pertamamu (${dueCount} halaman)`
                : disciplineRate >= 100
                  ? language === "en"
                    ? `Boost & Keep Your Streak (${dueCount} pages)`
                    : `Tingkatkan & Pertahankan Strikemu (${dueCount} halaman)`
                  : language === "en"
                    ? `Boost Discipline to 100% (${dueCount} pages)`
                    : `Tingkatkan Disiplin ke 100% (${dueCount} halaman)`}
            </span>
          </button>
        )}
      </div>

      {/* ========================================================
          BARIS TENGAH (SUB-BAR):
          - KIRI: Singkat (~1.4/hari)
          - KANAN: SWITCHER TABS [7 Hari | Lini Masa | Stabilitas] + IKON KALENDER
          ======================================================== */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-black/[0.04] dark:border-white/[0.05]">
        {/* Kiri: Kesimpulan Ringkas & Padat */}
        <div className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 font-bold truncate flex items-center gap-1 shrink-0">
          {projectionMode === "capsules" ? (
            <span className="text-slate-600 dark:text-slate-300 font-bold font-mono">
              ~{capsulesData.avgPerDay}/hari
            </span>
          ) : projectionMode === "wave" ? (
            <span className="text-slate-600 dark:text-slate-300 font-bold">
              Lini Masa
            </span>
          ) : (
            <span className="text-slate-600 dark:text-slate-300 font-bold">
              Stabilitas
            </span>
          )}
        </div>

        {/* Kanan: Switcher [7 Hari | Lini Masa | Stabilitas] + Ikon Kalender */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Switcher Tabs */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-2xl clay-inset bg-slate-100 dark:bg-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setProjectionMode("capsules")}
              className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                projectionMode === "capsules"
                  ? "bg-white dark:bg-slate-700 text-[#FF6F3D] shadow-xs font-black ring-1 ring-orange-200 dark:ring-orange-800"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {language === "en" ? "7-Day Schedule" : "Jadwal 7 Hari"}
            </button>

            <button
              type="button"
              onClick={() => setProjectionMode("wave")}
              className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                projectionMode === "wave"
                  ? "bg-white dark:bg-slate-700 text-[#0EA5E9] shadow-xs font-black ring-1 ring-sky-200 dark:ring-sky-800"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {language === "en" ? "Timeline" : "Lini Masa"}
            </button>

            <button
              type="button"
              onClick={() => setProjectionMode("pyramid")}
              className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                projectionMode === "pyramid"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-black ring-1 ring-emerald-200 dark:ring-emerald-800"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Brain className="w-3 h-3" />
              <span>{language === "en" ? "Stability" : "Stabilitas"}</span>
            </button>
          </div>

          {/* Ikon Kalender Bersanding di Sebelah Switcher */}
          <button
            type="button"
            onClick={onOpenCalendar}
            className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-xl clay-pill text-indigo-500 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs transition-transform shrink-0"
            title={language === "en" ? "Review Calendar" : "Kalender Murajaah"}
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================
          BAGIAN BAWAH: PRAKIRAAN BEBAN (7 KAPSUL | OMBAK LINI MASA | STABILITAS MEMORI)
      ======================================================== */}
      {projectionMode === "capsules" ? (
        /* MODE A: 7 KAPSUL VERTIKAL DENGAN PEMILIH PEKAN 1-5 */
        <div className="space-y-1.5 pt-0.5">
          {/* 7 Vertical Capsule Bars */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 p-1.5 rounded-2xl neumorph-inset bg-slate-100/50 dark:bg-slate-900/40">
            {capsulesData.days.map((d, idx) => {
              const fillHeightPct =
                capsulesData.maxDayCount > 0
                  ? Math.round((d.count / capsulesData.maxDayCount) * 100)
                  : 0;

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-between text-center select-none py-0.5"
                >
                  {/* Day Header */}
                  <span
                    className={`text-[7.5px] sm:text-[8px] font-black leading-tight truncate w-full ${
                      d.isToday
                        ? "text-[#FF6F3D]"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
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
                              style={{
                                height: `${(d.mapanCount / d.count) * 100}%`,
                              }}
                              title={`Mapan: ${d.mapanCount}`}
                            >
                              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                            </div>
                            <div
                              className="w-full bg-gradient-to-t from-[#0284C7] via-[#0EA5E9] to-[#7DD3FC] rounded-b-full transition-all shadow-[0_0_4px_rgba(14,165,233,0.3)] relative overflow-hidden"
                              style={{
                                height: `${(d.activeCount / d.count) * 100}%`,
                              }}
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
                          ? "bg-[#FF6F3D] text-white shadow-2xs"
                          : d.mapanCount > 0 && d.activeCount > 0
                            ? "bg-gradient-to-tr from-[#0284C7] to-[#10B981] text-white shadow-2xs ring-1 ring-white/30"
                            : d.mapanCount > 0
                              ? "bg-[#10B981] text-white shadow-2xs"
                              : "bg-[#0EA5E9] text-white shadow-2xs"
                        : "clay-pill text-slate-400"
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
              const isSelected = selectedWeekIndex === wk;
              return (
                <button
                  key={wk}
                  type="button"
                  onClick={() => setSelectedWeekIndex(wk)}
                  className={`flex-1 py-1 px-1 rounded-xl text-[9px] font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                    isSelected
                      ? "bg-gradient-to-r from-[#FF6F3D] to-[#E65320] text-white shadow-2xs font-black scale-102 ring-1 ring-orange-300"
                      : "neumorph-card text-slate-500 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Pekan {wk + 1}
                </button>
              );
            })}
          </div>
        </div>
      ) : projectionMode === "wave" ? (
        /* MODE B: OMBAK LINI MASA DUA ARAH DENGAN DYNAMIC BI-COLOR SLIDER BAR (1 S/D 365 HARI) */
        <div className="space-y-1.5 pt-0.5">
          {/* Sub-bar & Interactive Range Slider Bar (1 s/d 365 Hari - Full Width Edge to Edge) */}
          <div className="space-y-1 px-0.5">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-slate-500 font-medium">
                Riwayat:{" "}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {biDirectionalWave.pastTotal} selesai
                </strong>{" "}
                • Prediksi:{" "}
                <strong className="text-[#0EA5E9]">
                  {biDirectionalWave.futureTotal} terjadwal
                </strong>
              </span>

              {/* Range Badge */}
              <span className="text-[9.5px] font-black text-[#0284C7] dark:text-[#38BDF8] font-mono px-2 py-0.5 rounded-md bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-sky-500/15 border border-sky-300 dark:border-sky-800 shrink-0 shadow-2xs">
                ±
                {biDirectionalWave.R === 365
                  ? "1 Tahun (365h)"
                  : `${biDirectionalWave.R} Hari`}
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
                      background: `linear-gradient(to right, #10B981 0%, #059669 ${sliderPct}%, #0284C7 ${sliderPct}%, #38BDF8 100%)`,
                    }}
                    className="w-full h-2.5 sm:h-3 rounded-full appearance-none cursor-pointer shadow-inner transition-all ring-1 ring-black/5 dark:ring-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0284C7] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:w-4.5 [&::-moz-range-thumb]:h-4.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#0284C7] [&::-moz-range-thumb]:shadow-md"
                    title="Geser slider untuk atur rentang hari (1 - 365 hari)"
                  />
                );
              })()}

              <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 px-0.5">
                <span className="text-emerald-600 dark:text-emerald-400">
                  1 Hari
                </span>
                <span className="text-sky-600 dark:text-sky-400">
                  365 Hari (1 Tahun)
                </span>
              </div>
            </div>
          </div>

          {/* Neumorphic Inset Well dengan Ombak Horizon Dua Arah */}
          <div className="p-2 rounded-2xl neumorph-inset bg-slate-100/60 dark:bg-slate-900/60 relative">
            {/* Header Legend Mikro (Kiri = Riwayat, Kanan = Prediksi) */}
            <div className="flex items-center justify-between text-[7.5px] font-bold text-slate-400 px-1 pb-1">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <History className="w-2.5 h-2.5" />
                <span>Riwayat Masa Lalu</span>
              </span>
              <span className="flex items-center gap-1 text-[#FF6F3D]">
                <span>● Hari Ini (Pusat)</span>
              </span>
              <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                <span>Prediksi Masa Depan</span>
                <TrendingUp className="w-2.5 h-2.5" />
              </span>
            </div>

            {/* SVG Horizon Wave Line & Area */}
            <div className="w-full h-14 sm:h-16 relative">
              <svg
                viewBox={`0 0 ${biDirectionalWave.svgWidth} ${biDirectionalWave.svgHeight}`}
                className="w-full h-full overflow-visible"
              >
                <defs>
                  {/* Past-to-Future Dynamic Horizontal Gradient */}
                  <linearGradient
                    id="horizonWaveGradientPure"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                    <stop offset="45%" stopColor="#059669" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#FF6F3D" stopOpacity="0.5" />
                    <stop offset="55%" stopColor="#0EA5E9" stopOpacity="0.4" />
                    <stop
                      offset="100%"
                      stopColor="#38BDF8"
                      stopOpacity="0.35"
                    />
                  </linearGradient>

                  <linearGradient
                    id="horizonCurveStrokePure"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
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
                  fill="url(#horizonWaveGradientPure)"
                  className="transition-all duration-700 ease-out"
                />

                {/* Continuous Curve Stroke */}
                <path
                  d={biDirectionalWave.pathD}
                  fill="none"
                  stroke="url(#horizonCurveStrokePure)"
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
                      fill={c.isPast ? "#10B981" : "#0EA5E9"}
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
                  className={`leading-none ${m.isCenter ? "font-black text-[#FF6F3D]" : "text-slate-400 font-semibold"}`}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* MODE C: STABILITAS MEMORI (PERSIS DENGAN RUANG BUKU & BERANDA) */
        <div className="space-y-1.5 pt-0.5">
          <div className="space-y-1.5">
            {pyramidTiers.map((tier) => {
              const isSelected = selectedPyramidTier === tier.id;
              const barWidthPercent = Math.max(
                tier.percent,
                tier.count > 0 ? 12 : 4,
              );

              return (
                <div
                  key={tier.id}
                  onClick={() =>
                    setSelectedPyramidTier(isSelected ? null : tier.id)
                  }
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer relative group bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/90 dark:border-white/5 ${
                    isSelected
                      ? "ring-2 ring-emerald-500 scale-[1.005]"
                      : "hover:scale-[1.005] hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)]"
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
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-bold shrink-0 ${tier.bgPill}`}
                      >
                        {tier.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-black text-[#18234A] dark:text-[#F8FAFC]">
                        {tier.count}{" "}
                        <span className="text-[9.5px] font-medium text-[#8493AB]">
                          ({tier.percent}%)
                        </span>
                      </span>
                      <ChevronRight
                        className={`w-3 h-3 text-[#8493AB] transition-transform ${isSelected ? "rotate-90" : "group-hover:translate-x-0.5"}`}
                      />
                    </div>
                  </div>

                  {/* 3D Soft Progress Bar */}
                  <div className="w-full h-2 rounded-full neumorph-inset overflow-hidden p-0.5 relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidthPercent}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full shadow-xs"
                      style={{
                        background: `linear-gradient(to right, ${tier.colorFrom}, ${tier.colorTo})`,
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
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="neumorph-inset p-2.5 rounded-2xl space-y-1 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                    <span className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC]">
                      {activePyramidTierObj.name} • {activePyramidTierObj.count}{" "}
                      {language === "en" ? "pages" : "halaman"}
                    </span>
                  </div>
                  <span className="text-[9.5px] text-[#5E6D88] dark:text-[#94A3B8] font-medium">
                    {activePyramidTierObj.badge}
                  </span>
                </div>
                <p className="text-[10.5px] text-[#5E6D88] dark:text-[#94A3B8] leading-relaxed">
                  💡{" "}
                  <span className="font-semibold text-[#18234A] dark:text-[#F8FAFC]">
                    {activePyramidTierObj.tip}
                  </span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
