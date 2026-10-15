import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  getIntervalDays,
  isDue,
  QuranIntervalClusterKey,
  isReviewedToday,
  getQuranPageClusterKey,
} from "../../lib/fsrs";
import { useApp } from "../../context/AppContext";
import { useSwipeGesture } from "../../hooks/useSwipeGesture";
import { soundEffects } from "../../lib/soundFeedback";
import {
  JUZ_LIST,
  getQuranPageImageUrl,
  getJuzForPage,
  generateCleanQuranPages,
} from "../../data/quranData";
import { QuranPageItem } from "../../types";
import { QuranReviewModal } from "./QuranReviewModal";
import { MushafPageViewerModal } from "./MushafPageViewerModal";
import { MapanScheduleModal } from "./MapanScheduleModal";
import { QuranPageFeedbackModal } from "./QuranPageFeedbackModal";
import { QuranPageCard } from "./QuranPageCard";
import { IntervalPagesModal } from "./IntervalPagesModal";
import { ConnectedClassesModal } from "./ConnectedClassesModal";
import { QuranReviewCalendarModal } from "./QuranReviewCalendarModal";
import { QuranSearchModal } from "./QuranSearchModal";
import { JoinClassModal } from "../common/JoinClassModal";
import { QuranJuzBentoHero } from "./QuranJuzBentoHero";
import { QuranJuzSpectrumMap } from "./QuranJuzSpectrumMap";
import { QuranMemoryStabilityBadge } from "./QuranMemoryStabilityBadge";
import confetti from "canvas-confetti";
import { MemoryMetricGrid } from "../common/MemoryMetricGrid";
import { UnifiedDueCard, DueFilterPill } from "../common/UnifiedDueCard";
import { getJuzOfflineStatus, cacheJuzOffline } from "../../lib/offlineStorage";
import {
  Eye,
  FileText,
  MessageSquare,
  Search,
  ArrowLeft,
  ChevronRight,
  Play,
  RotateCcw,
  CheckCircle2,
  Power,
  Plus,
  Check,
  Calendar,
  CalendarCheck,
  Award,
  LayoutGrid,
  List,
  HardDrive,
  CloudDownload,
  Loader2,
  Flame,
  Brain,
  CalendarClock,
  Copy,
  Link,
  HelpCircle,
  Users,
  KeyRound,
  MoreVertical,
} from "lucide-react";

const InfoTooltip: React.FC<{
  text: string;
  textEn: string;
  language: string;
}> = ({ text, textEn, language }) => (
  <div className="relative group flex items-center">
    <HelpCircle className="w-3 h-3 text-slate-400 hover:text-blue-500 cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] sm:text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-center leading-snug border border-slate-700">
      {language === "en" ? textEn : text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

export const QuranSpace: React.FC = () => {
  const {
    quranPages,
    quranStats,
    activateQuranPage,
    deactivateQuranPage,
    reviewQuranPage,
    language,
    quranSpaceCode,
    userProfile,
    joinClassByCode,
    myClasses,
    leaveClass,
    setActiveSpace,
    spaceResetCounter,
    isFeatureAllowed,
    openUpgradeModal,
  } = useApp();

  const handleTogglePageActive = (pageNumber: number) => {
    const target = quranPages.find(
      (p) => Number(p.pageNumber) === Number(pageNumber),
    );
    if (!target) return;
    if (target.isActive) {
      deactivateQuranPage(pageNumber);
    } else {
      const check = isFeatureAllowed("quran_juz", target.juzNumber);
      if (!check.allowed) {
        openUpgradeModal(
          check.reason,
          language === "en"
            ? `Free plan allows up to ${check.limit} active Juz concurrently. Upgrade to Unlupa Pro to memorize and review all 30 Juz simultaneously.`
            : `Akun Free dibatasi hingga ${check.limit} Juz aktif sekaligus. Upgrade ke Unlupa Pro untuk mengaktifkan seluruh 30 Juz tanpa batas.`,
        );
        return;
      }
      activateQuranPage(pageNumber);
      // Automatically switch to 'all' (Semua) if activating from 'inactive' tab,
      // so the card remains right in front of the user in strict sequential order without vanishing!
      if (activeFilterTab === "inactive") {
        setActiveFilterTab("all");
      }
    }
  };

  const lastHandledResetCountRef = useRef(spaceResetCounter?.count || 0);

  // Reset to root dashboard if user clicks Quran space tab
  useEffect(() => {
    if (
      spaceResetCounter?.space === "quran" &&
      spaceResetCounter.count > lastHandledResetCountRef.current
    ) {
      lastHandledResetCountRef.current = spaceResetCounter.count;
      setSelectedJuzNumber(null);
    }
  }, [spaceResetCounter]);

  const [inputClassCode, setInputClassCode] = useState("");
  const [joinStatus, setJoinStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Navigation state between Screen 1 (Dashboard) and Screen 2 (Juz Page List)
  const [selectedJuzNumber, setSelectedJuzNumber] = useState<number | null>(
    null,
  );
  const [activeFilterTab, setActiveFilterTab] = useState<
    "all" | "due" | "active" | "mapan" | "inactive"
  >("due");
  const [viewDensity, setViewDensity] = useState<"grid" | "compact">("grid");
  const [pageRange, setPageRange] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const [highlightedPageNum, setHighlightedPageNum] = useState<number | null>(
    null,
  );

  // Select page from spectrum map: show it immediately right under the spectrum map without scrolling down to the footer
  const handleJumpToPageCard = (pageNumber: number) => {
    // If user clicks the currently isolated single page, toggle back to full Juz view
    if (pageRange?.from === pageNumber && pageRange?.to === pageNumber) {
      if (selectedJuz) {
        setPageRange({ from: selectedJuz.startPage, to: selectedJuz.endPage });
      }
      setHighlightedPageNum(null);
      return;
    }

    // Set pageRange to this exact page so it immediately appears right below the spectrum map
    setPageRange({ from: pageNumber, to: pageNumber });
    setActiveFilterTab("all");
    setHighlightedPageNum(pageNumber);

    setTimeout(() => {
      setHighlightedPageNum((prev) => (prev === pageNumber ? null : prev));
    }, 2500);
  };

  // Sync page range and scroll to top when selecting a Juz
  useEffect(() => {
    if (selectedJuzNumber !== null) {
      const targetJuz = JUZ_LIST.find((j) => j.juzNumber === selectedJuzNumber);
      if (targetJuz) {
        setPageRange({ from: targetJuz.startPage, to: targetJuz.endPage });

        // Always default to 'all' so all 20 pages in this Juz are immediately visible!
        setActiveFilterTab("all");
      }
      // Always direct user to top of the Juz (first page visible at the top)
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    } else {
      setPageRange(null);
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [selectedJuzNumber]);

  // Offline caching status for current Juz
  const [juzOfflineStatus, setJuzOfflineStatus] = useState<{
    total: number;
    cached: number;
    isFullyCached: boolean;
  } | null>(null);
  const [isDownloadingJuz, setIsDownloadingJuz] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [isConnectedClassesOpen, setIsConnectedClassesOpen] = useState(false);
  const [isQuranSearchOpen, setIsQuranSearchOpen] = useState(false);
  const [isJoinClassOpen, setIsJoinClassOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadAllProgress, setDownloadAllProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  const handleDownloadAllJuz = async () => {
    if (isDownloadingAll) return;
    setIsDownloadingAll(true);
    setDownloadAllProgress({ current: 0, total: 30 });
    for (let j = 1; j <= 30; j++) {
      await cacheJuzOffline(j, () => {});
      setDownloadAllProgress({ current: j, total: 30 });
    }
    setIsDownloadingAll(false);
    setDownloadAllProgress(null);
    alert(
      language === "en"
        ? "All 30 Juz downloaded successfully for offline reading!"
        : "Semua 30 Juz berhasil diunduh untuk dibaca secara offline!",
    );
    setIsDownloadModalOpen(false);
  };

  useEffect(() => {
    if (selectedJuzNumber) {
      getJuzOfflineStatus(selectedJuzNumber).then(setJuzOfflineStatus);
    } else {
      setJuzOfflineStatus(null);
    }
  }, [selectedJuzNumber]);

  const handleDownloadJuz = async () => {
    if (!selectedJuzNumber || isDownloadingJuz) return;
    setIsDownloadingJuz(true);
    setDownloadProgress({ current: 0, total: 20 });
    await cacheJuzOffline(selectedJuzNumber, (current, total) => {
      setDownloadProgress({ current, total });
    });
    const updated = await getJuzOfflineStatus(selectedJuzNumber);
    setJuzOfflineStatus(updated);
    setIsDownloadingJuz(false);
    setDownloadProgress(null);
  };

  // Modals state
  const [reviewModalConfig, setReviewModalConfig] = useState<{
    isOpen: boolean;
    juzFilter: number | null;
    initialPageNumber?: number;
  }>({
    isOpen: false,
    juzFilter: null,
  });
  const [previewPageNumber, setPreviewPageNumber] = useState<number | null>(
    null,
  );
  const [justReviewedPage, setJustReviewedPage] = useState<{
    pageNumber: number;
    rating: 1 | 2 | 3;
  } | null>(null);
  const [selectedMapanPage, setSelectedMapanPage] =
    useState<QuranPageItem | null>(null);
  const [isMapanModalOpen, setIsMapanModalOpen] = useState(false);
  const [feedbackPage, setFeedbackPage] = useState<QuranPageItem | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isQuranCalendarOpen, setIsQuranCalendarOpen] = useState(false);
  const [intervalModalConfig, setIntervalModalConfig] = useState<{
    isOpen: boolean;
    clusterKey: QuranIntervalClusterKey | null;
    pages: QuranPageItem[];
  }>({ isOpen: false, clusterKey: null, pages: [] });
  const [mapanCelebrationNotice, setMapanCelebrationNotice] = useState<{
    pageNumber: number;
    surah: string;
  } | null>(null);

  // Gestur usap (swipe navigation) for Quran Space:
  // - Jika modal atau pop up terbuka: usap kanan menutup modal
  // - Jika berada di dalam Juz tertentu: usap kanan kembali ke daftar Juz (halaman utama Qur'an)
  // - Jika di halaman utama Qur'an: usap kanan ke Beranda (dashboard), usap kiri ke Ruang Buku (personal)
  useSwipeGesture(null, {
    disabled:
      previewPageNumber !== null ||
      reviewModalConfig.isOpen ||
      Boolean(
        typeof document !== "undefined" &&
        document.body.getAttribute("data-annotation-open") === "true",
      ),
    onSwipeRight: () => {
      if (isQuranCalendarOpen) {
        setIsQuranCalendarOpen(false);
      } else if (isReportModalOpen) {
        setIsReportModalOpen(false);
      } else if (isFeedbackModalOpen) {
        setIsFeedbackModalOpen(false);
      } else if (isMapanModalOpen) {
        setIsMapanModalOpen(false);
      } else if (intervalModalConfig.isOpen) {
        setIntervalModalConfig({ isOpen: false, clusterKey: null, pages: [] });
      } else if (selectedJuzNumber !== null) {
        // Kembali dari sub-halaman Juz ke halaman utama Al-Qur'an
        soundEffects.playCardFlip("backward");
        setSelectedJuzNumber(null);
      } else {
        // Berada di halaman utama Al-Qur'an -> usap kanan berpindah ke Beranda
        soundEffects.playCardFlip("backward");
        setActiveSpace("dashboard");
      }
    },
    onSwipeLeft: () => {
      // Hanya berpindah ruang jika berada di halaman utama Al-Qur'an (tidak sedang di dalam lapis Juz atau modal)
      if (
        selectedJuzNumber === null &&
        !isQuranCalendarOpen &&
        !isReportModalOpen &&
        !isFeedbackModalOpen &&
        !isMapanModalOpen &&
        !intervalModalConfig.isOpen
      ) {
        soundEffects.playCardFlip("forward");
        setActiveSpace("personal");
      }
    },
    threshold: 40,
    minRatio: 1.15,
  });

  const t = {
    overallProgress: {
      en: "OVERALL MEMORIZATION PROGRESS",
      id: "TOTAL PROGRES HAFALAN",
      ar: "التقدم العام في الحفظ",
    },
    pagesMapan: { en: "Mastered", id: "Mapan", ar: "متقن" },
    pagesDueToday: { en: "Due Today", id: "Jatuh Tempo", ar: "مراجعة" },
    activated: { en: "Active", id: "Aktif", ar: "مفعل" },
    notActivated: {
      en: "Not yet activated",
      id: "Belum diaktivasi",
      ar: "غير مفعل",
    },
    allCaughtUp: {
      en: "All caught up",
      id: "Semua sudah dimurajaah",
      ar: "تمت المراجعة بالكامل",
    },
    inJuz: { en: "In Juz", id: "Pada Juz", ar: "في الجزء" },
    acrossJuz: { en: "Across Juz", id: "Pada Juz", ar: "في الأجزاء" },
    due: { en: "due", id: "jatuh tempo", ar: "مراجعة" },
    review: { en: "Review", id: "Murajaah", ar: "مراجعة" },
    mapan: { en: "Mastered", id: "Mapan", ar: "متقن" },
    all: { en: "All", id: "Semua", ar: "الكل" },
    active: { en: "Active", id: "Aktif", ar: "نشط" },
  };

  const selectedJuz = selectedJuzNumber
    ? JUZ_LIST.find((j) => j.juzNumber === selectedJuzNumber) || null
    : null;

  // Find all Juz numbers that have pages due today
  const dueJuzMap = new Map<number, number>();
  (quranStats?.dueList || []).forEach((item) => {
    dueJuzMap.set(item.juzNumber, (dueJuzMap.get(item.juzNumber) || 0) + 1);
  });
  const dueJuzNumbers = Array.from(dueJuzMap.keys()).sort((a, b) => a - b);

  // Subtitle text for "Across Juz 1, 28 & 29"
  const dueJuzDescription =
    dueJuzNumbers.length === 0
      ? language === "en"
        ? "All caught up"
        : "Semua sudah dimurajaah"
      : dueJuzNumbers.length === 1
        ? language === "en"
          ? `In Juz ${dueJuzNumbers[0]}`
          : `Pada Juz ${dueJuzNumbers[0]}`
        : dueJuzNumbers.length === 2
          ? language === "en"
            ? `Across Juz ${dueJuzNumbers[0]} & ${dueJuzNumbers[1]}`
            : `Pada Juz ${dueJuzNumbers[0]} & ${dueJuzNumbers[1]}`
          : language === "en"
            ? `Across Juz ${dueJuzNumbers.slice(0, -1).join(", ")} & ${dueJuzNumbers[dueJuzNumbers.length - 1]}`
            : `Pada Juz ${dueJuzNumbers.slice(0, -1).join(", ")} & ${dueJuzNumbers[dueJuzNumbers.length - 1]}`;

  // Handle direct review action on page card
  const handleInlineReview = (pageNumber: number, rating: 1 | 2 | 3) => {
    const res = reviewQuranPage(pageNumber, rating);
    setJustReviewedPage({ pageNumber, rating });
    setTimeout(() => {
      setJustReviewedPage((prev) =>
        prev?.pageNumber === pageNumber ? null : prev,
      );
    }, 1800);

    if (res?.justBecameMastered) {
      confetti({
        particleCount: 110,
        spread: 85,
        origin: { y: 0.55 },
        colors: ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6"],
      });
      const target = quranPages.find((p) => p.pageNumber === pageNumber);
      if (target) {
        setSelectedMapanPage(target);
        setIsMapanModalOpen(true);
        setMapanCelebrationNotice({
          pageNumber,
          surah: target.surahNameEn,
        });
        setTimeout(() => setMapanCelebrationNotice(null), 6000);
      }
    }
  };

  // Format accurate due date for CalendarClock icon
  const formatAccurateDueDate = (page: QuranPageItem) => {
    if (!page.fsrsData.nextReview)
      return language === "en" ? "Today" : "Hari ini";
    const nextDate = new Date(page.fsrsData.nextReview);
    const now = new Date();
    const isDue = nextDate <= now;
    const formatted = nextDate.toLocaleDateString(
      language === "id" ? "id-ID" : "en-US",
      {
        day: "numeric",
        month: "short",
      },
    );
    if (isDue) {
      return language === "en"
        ? `Today (${formatted})`
        : `Hari ini (${formatted})`;
    }
    return formatted;
  };

  const getFullDueDateStr = (page: QuranPageItem) => {
    if (!page.fsrsData.nextReview)
      return language === "en" ? "Today" : "Hari ini";
    const nextDate = new Date(page.fsrsData.nextReview);
    return nextDate.toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Filter and sort pages when inside Screen 2 (Juz Page List) - strictly sequential by pageNumber!
  const currentJuzPages = useMemo(() => {
    if (!selectedJuz) return [];

    // Primary query from quranPages
    let pagesInJuz = quranPages.filter((p) => {
      const pNum = Number(p.pageNumber);
      return pNum >= selectedJuz.startPage && pNum <= selectedJuz.endPage;
    });

    // Fallback: If quranPages array somehow had missing pages for this Juz, fill from clean defaults
    const expectedCount = selectedJuz.endPage - selectedJuz.startPage + 1;
    if (pagesInJuz.length < expectedCount) {
      const cleanAll = generateCleanQuranPages();
      const existingMap = new Map<number, QuranPageItem>();
      pagesInJuz.forEach((p) => existingMap.set(Number(p.pageNumber), p));

      const fullList: QuranPageItem[] = [];
      for (
        let pNum = selectedJuz.startPage;
        pNum <= selectedJuz.endPage;
        pNum++
      ) {
        const found = existingMap.get(pNum);
        if (found) {
          fullList.push(found);
        } else {
          const cleanDefault = cleanAll.find((c) => c.pageNumber === pNum);
          if (cleanDefault) fullList.push(cleanDefault);
        }
      }
      pagesInJuz = fullList;
    }

    return pagesInJuz.sort(
      (a, b) => Number(a.pageNumber) - Number(b.pageNumber),
    );
  }, [selectedJuz, quranPages]);

  function pageHasMapan(page: QuranPageItem) {
    return (
      page.status === "mastered_for_now" ||
      !!page.mapanCelebrated ||
      (page.isActive &&
        (page.fsrsData.stability >= 74.5 ||
          Math.round(page.fsrsData.stability * 0.4025587) >= 30))
    );
  }

  const displayedPages = useMemo(() => {
    if (!currentJuzPages || currentJuzPages.length === 0) return [];

    let filtered = currentJuzPages.filter((page) => {
      const isDuePage = isDue(
        page.fsrsData?.nextReview,
        page.isActive,
        page.fsrsData?.lastReview,
      );
      const isMapan = pageHasMapan(page);

      if (activeFilterTab === "due")
        return (
          isDuePage ||
          (page.isActive && isReviewedToday(page.fsrsData?.lastReview))
        );
      if (activeFilterTab === "active") return page.isActive;
      if (activeFilterTab === "mapan") return isMapan;
      if (activeFilterTab === "inactive") return !page.isActive;

      return true; // 'all'
    });

    // Sub-range filter only if user explicitly dragged a sweep sub-range inside this Juz
    if (activeFilterTab === "all" && pageRange && selectedJuz) {
      const minP = Math.min(Number(pageRange.from), Number(pageRange.to));
      const maxP = Math.max(Number(pageRange.from), Number(pageRange.to));
      if (minP >= selectedJuz.startPage && maxP <= selectedJuz.endPage) {
        if (minP > selectedJuz.startPage || maxP < selectedJuz.endPage) {
          const sub = filtered.filter(
            (p) => Number(p.pageNumber) >= minP && Number(p.pageNumber) <= maxP,
          );
          if (sub.length > 0) {
            filtered = sub;
          }
        }
      }
    }

    return filtered.sort((a, b) => Number(a.pageNumber) - Number(b.pageNumber));
  }, [currentJuzPages, activeFilterTab, pageRange, selectedJuz]);

  // Calculate stats for current Juz in Screen 2
  const currentJuzActiveCount = currentJuzPages.filter(
    (p) => p.isActive,
  ).length;
  const currentJuzDueCount = currentJuzPages.filter((p) =>
    isDue(p.fsrsData.nextReview, p.isActive, p.fsrsData.lastReview),
  ).length;
  const currentJuzMapanCount = currentJuzPages.filter((p) =>
    pageHasMapan(p),
  ).length;

  return (
    <div className="space-y-4 pb-20 md:pb-10 max-w-5xl mx-auto">
      {/* Header Bar: Clean Title + Juz/Active pill on the Left, Search + More Options Menu on the Right */}
      {selectedJuzNumber === null && (
        <div className="flex items-center justify-between w-full mb-3 gap-2 flex-nowrap">
          {/* Left: Room Title & Clean Count Pill (Fixed shrink-0 to prevent any overlap or clipping) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <h1 className="text-base sm:text-xl md:text-2xl font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight shrink-0 clay-title whitespace-nowrap">
              {language === "en"
                ? "Quran Room"
                : language === "id"
                  ? "Ruang Al-Qur'an"
                  : "غرفة القرآن"}
            </h1>
            <span
              className="flex items-center justify-center px-2 sm:px-3 h-7 sm:h-9 rounded-xl sm:rounded-2xl clay-pill text-[#FF6F3D] text-[10px] sm:text-xs font-black shrink-0 shadow-2xs whitespace-nowrap"
              title={`${JUZ_LIST.length} ${language === "en" ? "Juz" : "Juz"}`}
            >
              30 Juz
            </span>
          </div>

          {/* Right: Unified Search Trigger Bar and Contextual Options Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            {/* Unified Search Trigger Bar - compact icon on mobile to never overlap the 30 Juz pill */}
            <button
              type="button"
              onClick={() => setIsQuranSearchOpen(true)}
              className="w-7 h-7 sm:w-auto sm:h-9 px-0 sm:pl-3 sm:pr-3.5 rounded-xl sm:rounded-2xl clay-inset flex items-center justify-center sm:gap-2 text-xs font-semibold text-[#8E9BAE] hover:text-[#18234A] dark:hover:text-[#F8FAFC] transition-all cursor-pointer group shadow-2xs shrink-0"
              title={
                language === "en"
                  ? "Search Quran (Pages, Surah, Juz)..."
                  : "Cari Al-Qur'an (Halaman, Surah, Juz)..."
              }
            >
              <Search className="w-3.5 h-3.5 text-[#FF6F3D] group-hover:scale-110 transition-transform shrink-0" />
              <span className="hidden sm:inline truncate">
                {language === "en" ? "Search..." : "Cari..."}
              </span>
              <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white/70 dark:bg-black/20 rounded shadow-2xs border border-black/5 dark:border-white/5">
                ⌘K
              </kbd>
            </button>

            {/* More Options Dropdown (Titik Tiga) to keep header clean and prevent overlapping icons */}
            <div className="relative shrink-0" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                  isMoreMenuOpen
                    ? "clay-btn-primary text-white scale-105"
                    : "neumorph-card text-[#707E94] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC] hover:scale-105 active:scale-95"
                }`}
                title={
                  language === "en" ? "More Quran Options" : "Opsi Lainnya"
                }
                aria-label="More options"
                aria-expanded={isMoreMenuOpen}
              >
                <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {isMoreMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {language === "en" ? "Features & Tools" : "Fitur & Menu"}
                  </div>

                  {/* Connected Classes */}
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsConnectedClassesOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#FF6F3D] flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <span>
                        {language === "en"
                          ? "Connected Classes"
                          : "Kelas Terhubung"}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-900/40 text-[#FF6F3D]">
                      {myClasses.length}
                    </span>
                  </button>

                  {/* Join Class With Code */}
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsJoinClassOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <span>
                      {language === "en"
                        ? "Join Class with Code"
                        : "Masuk Kelas (Kode)"}
                    </span>
                  </button>

                  {/* Offline Download Manager */}
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsDownloadModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-[#0EA5E9] flex items-center justify-center shrink-0">
                      <CloudDownload className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span>
                        {language === "en"
                          ? "Offline Manager"
                          : "Kelola Offline"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {language === "en"
                          ? "Download for offline use"
                          : "Unduh untuk mode offline"}
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedJuzNumber === null ? (
        <div className="space-y-4">
          {/* Standard Minimalist Due Card (Unified Across All Rooms) */}
          <UnifiedDueCard
            language={language}
            title={language === "en" ? "Daily Review" : "Kartu Jatuh Tempo"}
            dueCount={quranStats.dueToday}
            totalActiveCount={quranStats.active}
            itemTypeLabel={language === "en" ? "pages" : "halaman"}
            primaryActionLabel={
              language === "en"
                ? `All (${quranStats.dueToday})`
                : `Semua (${quranStats.dueToday})`
            }
            pillGridCols={5}
            onStartAll={() =>
              setReviewModalConfig({ isOpen: true, juzFilter: null })
            }
            onOpenCalendar={() => setIsQuranCalendarOpen(true)}
            filterPills={dueJuzNumbers.map((juzNum) => ({
              id: juzNum,
              label: `J.${juzNum}`,
              count: dueJuzMap.get(juzNum) || 0,
              onClick: () =>
                setReviewModalConfig({ isOpen: true, juzFilter: juzNum }),
            }))}
            allCaughtUpTitle={
              language === "en"
                ? "All Quran pages reviewed today!"
                : "Semua hafalan Al-Qur'an sudah dimurajaah!"
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {JUZ_LIST.map((juz) => {
              const activeCount = quranPages.filter(
                (p) => p.juzNumber === juz.juzNumber && p.isActive,
              ).length;
              const dueCount = quranPages.filter(
                (p) =>
                  p.juzNumber === juz.juzNumber &&
                  isDue(
                    p.fsrsData.nextReview,
                    p.isActive,
                    p.fsrsData.lastReview,
                  ),
              ).length;
              const masteredCount = quranPages.filter(
                (p) => p.juzNumber === juz.juzNumber && pageHasMapan(p),
              ).length;

              return (
                <div
                  key={juz.juzNumber}
                  onClick={() => {
                    setSelectedJuzNumber(juz.juzNumber);
                    setActiveFilterTab("all");
                  }}
                  className="neumorph-card p-4 rounded-3xl hover:-translate-y-1 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="shrink-0 group-hover:scale-105 transition-transform">
                      <QuranMemoryStabilityBadge
                        juzNumber={juz.juzNumber}
                        quranPages={quranPages}
                        size="sm"
                      />
                    </div>
                    <div className="truncate">
                      <h4 className="font-extrabold text-sm sm:text-base text-[#18234A] dark:text-[#F8FAFC] group-hover:text-[#FF6F3D] truncate transition-colors">
                        Juz {juz.juzNumber}
                      </h4>
                      <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] truncate font-medium">
                        {juz.surahSpan}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="neumorph-inset px-2.5 py-0.5 rounded-full text-[10px] text-[#18234A] dark:text-[#F8FAFC] font-extrabold">
                      {activeCount} / {juz.totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      {dueCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white font-black text-[9px] shadow-2xs">
                          {dueCount} {t.due[language]}
                        </span>
                      )}
                      {masteredCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-black text-[9px] shadow-2xs">
                          {masteredCount} {t.mapan[language]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 1. Bento Hero Modern (Donut Pie Chart, Proyeksi Beban Mulai Hari Ini, 4 Pekan, Aksi) */}
          {selectedJuz && (
            <QuranJuzBentoHero
              juz={selectedJuz}
              quranPages={quranPages}
              activeCount={currentJuzActiveCount}
              dueCount={currentJuzDueCount}
              mapanCount={currentJuzMapanCount}
              language={language}
              isDownloadingJuz={isDownloadingJuz}
              downloadProgress={downloadProgress}
              juzOfflineStatus={juzOfflineStatus}
              onDownloadJuz={handleDownloadJuz}
              onStartReview={() => {
                const firstDue = currentJuzPages.find((p) =>
                  isDue(
                    p.fsrsData?.nextReview,
                    p.isActive,
                    p.fsrsData?.lastReview,
                  ),
                );
                setReviewModalConfig({
                  isOpen: true,
                  juzFilter: selectedJuzNumber,
                  initialPageNumber: firstDue?.pageNumber,
                });
              }}
              onOpenCalendar={() => setIsQuranCalendarOpen(true)}
              onBack={() => {
                setSelectedJuzNumber(null);
                setActiveFilterTab("all");
              }}
            />
          )}

          {/* 2. Peta Spektrum & Seleksi Sapu Halaman (SATU KOTAK TUNGGAL TANPA SLIDE / ZERO GESTURE CONFLICT) */}
          {selectedJuz && pageRange && (
            <QuranJuzSpectrumMap
              key={selectedJuz.juzNumber}
              juzNumber={selectedJuz.juzNumber}
              quranPages={quranPages}
              startPage={selectedJuz.startPage}
              endPage={selectedJuz.endPage}
              totalPages={selectedJuz.totalPages}
              language={language}
              fromPage={pageRange.from}
              toPage={pageRange.to}
              onChangeRange={(from, to) => setPageRange({ from, to })}
              onSelectPage={(pageNumber) => {
                handleJumpToPageCard(pageNumber);
              }}
              onReviewDuePage={(pageNumber) => {
                setReviewModalConfig({
                  isOpen: true,
                  juzFilter: selectedJuz.juzNumber,
                  initialPageNumber: pageNumber,
                });
              }}
              activeFilterTab={activeFilterTab}
              onFilterTabChange={(tab) => {
                setActiveFilterTab(tab);
                if (selectedJuz) {
                  setPageRange({
                    from: selectedJuz.startPage,
                    to: selectedJuz.endPage,
                  });
                }
              }}
              isDownloadingJuz={isDownloadingJuz}
              downloadProgress={downloadProgress}
              juzOfflineStatus={juzOfflineStatus}
              onDownloadJuz={handleDownloadJuz}
            />
          )}

          {/* Section Header: PAGES IN JUZ */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#18234A] dark:text-[#F8FAFC]">
                  {language === "en"
                    ? `DAFTAR HALAMAN JUZ ${selectedJuzNumber}`
                    : `DAFTAR HALAMAN JUZ ${selectedJuzNumber}`}
                </h4>
                {selectedJuz?.surahSpan && (
                  <span className="text-[10px] font-bold text-[#FF6F3D] bg-orange-500/10 px-2.5 py-0.5 rounded-lg border border-orange-500/20">
                    {selectedJuz.surahSpan}
                  </span>
                )}
                {/* Concise single page filter pill if active */}
                {selectedJuz &&
                  pageRange &&
                  pageRange.from === pageRange.to && (
                    <div className="flex items-center gap-1.5 bg-sky-500/10 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-lg text-[11px] font-bold border border-sky-500/30">
                      <span>Hal {pageRange.from}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedJuz)
                            setPageRange({
                              from: selectedJuz.startPage,
                              to: selectedJuz.endPage,
                            });
                        }}
                        className="text-xs font-black text-sky-600 hover:text-sky-800 dark:text-sky-400 cursor-pointer underline ml-0.5"
                      >
                        Semua
                      </button>
                    </div>
                  )}
              </div>
              <span className="text-xs font-mono font-bold text-[#5E6D88] dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
                {displayedPages.length}{" "}
                {language === "en" ? "Pages" : "Halaman"}
              </span>
            </div>

            {/* Bilateral Zigzag Split-Card List (Left/Right Mushaf Orientation) */}
            <div className="space-y-3.5">
              {displayedPages.length === 0 ? (
                <div className="py-10 px-6 rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-center space-y-4 shadow-xs">
                  <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40">
                    {activeFilterTab === "mapan"
                      ? "🌱"
                      : activeFilterTab === "due"
                        ? "🎉"
                        : "📖"}
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h5 className="text-base font-bold text-[#18234A] dark:text-white">
                      {activeFilterTab === "mapan"
                        ? "Belum Ada Halaman Mapan di Juz Ini"
                        : activeFilterTab === "due"
                          ? "Tidak Ada Halaman Jatuh Tempo"
                          : activeFilterTab === "active"
                            ? "Belum Ada Halaman Aktif"
                            : activeFilterTab === "inactive"
                              ? "Semua Halaman Sudah Diaktifkan"
                              : "Tidak Ada Halaman"}
                    </h5>
                    <p className="text-xs text-[#5E6D88] dark:text-slate-400 leading-relaxed">
                      {activeFilterTab === "mapan"
                        ? "Halaman akan otomatis berstatus Mapan (Mutqin) saat interval murajaah mencapai ≥30 hari atau setelah disahkan oleh guru halaqah."
                        : activeFilterTab === "due"
                          ? "Alhamdulillah! Semua jadwal murajaah di juz ini sudah selesai atau belum waktunya di-review hari ini."
                          : activeFilterTab === "active"
                            ? "Aktifkan halaman hafalan untuk mulai menjadwalkan murajaah berjarak (spaced repetition)."
                            : activeFilterTab === "inactive"
                              ? "Seluruh halaman di Juz ini sudah masuk ke daftar murajaah aktif."
                              : "Tidak ada halaman yang cocok dengan filter yang dipilih."}
                    </p>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFilterTab("all");
                        if (selectedJuz) {
                          setPageRange({
                            from: selectedJuz.startPage,
                            to: selectedJuz.endPage,
                          });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold clay-btn-primary text-white shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
                    >
                      <span>
                        Tampilkan Semua Halaman ({currentJuzPages.length})
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                displayedPages.map((page) => (
                  <QuranPageCard
                    key={page.pageNumber}
                    page={page}
                    language={language}
                    onToggleActive={(pageNumber) => {
                      handleTogglePageActive(pageNumber);
                    }}
                    onOpenMapanModal={(p) => {
                      setSelectedMapanPage(p);
                      setIsMapanModalOpen(true);
                    }}
                    onOpenFeedbackModal={(p) => {
                      setFeedbackPage(p);
                      setIsFeedbackModalOpen(true);
                    }}
                    onOpenMushafViewer={(pageNumber) => {
                      setPreviewPageNumber(pageNumber);
                    }}
                    onInlineReview={(pageNumber, rating) => {
                      handleInlineReview(pageNumber, rating);
                    }}
                    isJustReviewed={
                      justReviewedPage?.pageNumber === page.pageNumber
                    }
                    justReviewedRating={
                      justReviewedPage?.pageNumber === page.pageNumber
                        ? justReviewedPage.rating
                        : undefined
                    }
                    isHighlighted={highlightedPageNum === page.pageNumber}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal (supports filtering by specific Juz and specific page) */}
      <QuranReviewModal
        isOpen={reviewModalConfig.isOpen}
        juzFilter={reviewModalConfig.juzFilter}
        initialPageNumber={reviewModalConfig.initialPageNumber}
        onClose={() =>
          setReviewModalConfig({
            isOpen: false,
            juzFilter: null,
            initialPageNumber: undefined,
          })
        }
        onSelectNextJuz={(nextJuz) =>
          setReviewModalConfig({
            isOpen: true,
            juzFilter: nextJuz,
            initialPageNumber: undefined,
          })
        }
      />

      {/* Fullscreen Mushaf Page Viewer Modal */}
      {previewPageNumber !== null && (
        <MushafPageViewerModal
          pageNumber={previewPageNumber}
          isOpen={true}
          onClose={() => setPreviewPageNumber(null)}
          onNavigatePage={(p) => setPreviewPageNumber(p)}
          onOpenFeedback={(p) => {
            const pageItem = quranPages.find((item) => item.pageNumber === p);
            if (pageItem) {
              setFeedbackPage(pageItem);
              setIsFeedbackModalOpen(true);
            }
          }}
        />
      )}

      {/* Mastered / Mapan Custom Rhythm Schedule Modal */}
      <MapanScheduleModal
        isOpen={isMapanModalOpen}
        onClose={() => {
          setIsMapanModalOpen(false);
          setSelectedMapanPage(null);
        }}
        page={selectedMapanPage}
      />

      {/* Stability Interval Clusters Modal */}
      <IntervalPagesModal
        isOpen={intervalModalConfig.isOpen}
        onClose={() =>
          setIntervalModalConfig((prev) => ({ ...prev, isOpen: false }))
        }
        clusterKey={intervalModalConfig.clusterKey}
        quranPages={quranPages}
        language={language}
        onToggleActive={(pageNumber) => {
          const target = quranPages.find((p) => p.pageNumber === pageNumber);
          if (target?.isActive) {
            deactivateQuranPage(pageNumber);
          } else {
            activateQuranPage(pageNumber);
          }
        }}
        onOpenMapanModal={(page) => {
          setSelectedMapanPage(page);
          setIsMapanModalOpen(true);
        }}
        onOpenFeedbackModal={(page) => {
          setFeedbackPage(page);
          setIsFeedbackModalOpen(true);
        }}
        onOpenMushafViewer={(pageNumber) => {
          setPreviewPageNumber(pageNumber);
        }}
        onInlineReview={(pageNumber, rating) => {
          handleInlineReview(pageNumber, rating);
        }}
        justReviewedPage={justReviewedPage}
      />

      {/* Quran Page Issue & Feedback Modal */}
      <QuranPageFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          setFeedbackPage(null);
        }}
        page={feedbackPage}
      />

      {/* Floating Mapan Celebration Banner/Toast */}
      {mapanCelebrationNotice && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-slate-900 dark:bg-slate-850 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-amber-400/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-md w-[92%]">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-300">
              {language === "en"
                ? "Mabruk! Page Mastered (Mapan)!"
                : "Mabruk! Halaman Resmi Mapan!"}
            </p>
            <p className="text-[11px] text-slate-300 truncate">
              {language === "en"
                ? `Page ${mapanCelebrationNotice.pageNumber} (${mapanCelebrationNotice.surah}) rotation reached >30 days.`
                : `Hal ${mapanCelebrationNotice.pageNumber} (${mapanCelebrationNotice.surah}) telah mencapai rotasi >30 hari.`}
            </p>
          </div>
          <button
            onClick={() => {
              const target = quranPages.find(
                (p) => p.pageNumber === mapanCelebrationNotice.pageNumber,
              );
              if (target) {
                setSelectedMapanPage(target);
                setIsMapanModalOpen(true);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-transform active:scale-95"
          >
            {language === "en" ? "Set Rhythm" : "Atur Ritme"}
          </button>
        </div>
      )}

      {/* Connected Classes Modal */}
      <ConnectedClassesModal
        isOpen={isConnectedClassesOpen}
        onClose={() => setIsConnectedClassesOpen(false)}
        language={language}
        connectedClasses={myClasses}
        onLeaveClass={leaveClass}
      />

      {/* Planned Quran Review Calendar Modal */}
      <QuranReviewCalendarModal
        isOpen={isQuranCalendarOpen}
        onClose={() => setIsQuranCalendarOpen(false)}
        quranPages={quranPages}
        language={language}
        initialJuzFilter={selectedJuzNumber}
        onStartReview={(juz) =>
          setReviewModalConfig({ isOpen: true, juzFilter: juz || null })
        }
        onOpenMushafViewer={(pageNumber) => setPreviewPageNumber(pageNumber)}
      />

      {/* Quran Surah & Juz Search Modal */}
      <QuranSearchModal
        isOpen={isQuranSearchOpen}
        onClose={() => setIsQuranSearchOpen(false)}
        language={language}
        onSelectJuz={(juzNumber) => {
          setSelectedJuzNumber(juzNumber);
        }}
        onSelectPage={(pageNumber) => {
          const juz = getJuzForPage(pageNumber);
          setSelectedJuzNumber(juz);
          setPreviewPageNumber(pageNumber);
        }}
      />

      {/* Join Class Code Modal */}
      <JoinClassModal
        isOpen={isJoinClassOpen}
        onClose={() => setIsJoinClassOpen(false)}
        language={language}
      />

      {/* Offline Download Manager Modal */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="neumorph-card p-6 max-w-md w-full space-y-4 animate-in zoom-in-95 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CloudDownload className="w-5 h-5 text-[#0EA5E9]" />
                <span>
                  {language === "en"
                    ? "Offline Download Manager"
                    : "Kelola Unduhan Offline"}
                </span>
              </h3>
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === "en"
                ? "Download all 30 Juz for offline use, or open any specific Juz to download individually."
                : "Unduh seluruh 30 Juz sekaligus untuk akses offline, atau buka Juz spesifik untuk mengunduh per Juz."}
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isDownloadingAll}
                onClick={handleDownloadAllJuz}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDownloadingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>
                      {language === "en"
                        ? `Downloading All (${downloadAllProgress?.current}/30)...`
                        : `Mengunduh Semua (${downloadAllProgress?.current}/30)...`}
                    </span>
                  </>
                ) : (
                  <>
                    <CloudDownload className="w-4 h-4" />
                    <span>
                      {language === "en"
                        ? "Download All 30 Juz"
                        : "Unduh Semua 30 Juz"}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDownloadModalOpen(false);
                  alert(
                    language === "en"
                      ? "Click on any Juz card in the list below to download or view offline status for that specific Juz."
                      : "Klik pada kartu Juz manapun di daftar utama untuk mengunduh atau melihat status offline Juz tersebut.",
                  );
                }}
                className="w-full py-2.5 rounded-2xl neumorph-card text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#FF6F3D] transition-colors cursor-pointer text-center"
              >
                {language === "en"
                  ? "Select Specific Juz from List"
                  : "Pilih Juz Tertentu dari Daftar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
