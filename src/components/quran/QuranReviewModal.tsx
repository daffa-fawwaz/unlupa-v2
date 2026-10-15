import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { useSwipeGesture } from "../../hooks/useSwipeGesture";
import { soundEffects } from "../../lib/soundFeedback";
import { QuranPageItem, MapanScheduleConfig } from "../../types";
import { predictQuranIntervals, isDue } from "../../lib/fsrs";
import {
  getQuranPageImageUrl,
  getJuzForPage,
  JUZ_LIST,
} from "../../data/quranData";
import {
  getOfflinePageUrl,
  cachePageOffline,
  logOfflineReview,
} from "../../lib/offlineStorage";
import { MushafPageViewerModal } from "./MushafPageViewerModal";
import { QuranPageFeedbackModal } from "./QuranPageFeedbackModal";
import { MushafInteractiveCanvas } from "./MushafInteractiveCanvas";
import { COLOR_PRESETS } from "./MushafDrawingCanvas";
import {
  MushafAyahCorrectionPopover,
  PageAyahInfo,
} from "./MushafAyahCorrectionPopover";
import { Mushaf15LineGutter } from "./Mushaf15LineGutter";
import { getPageAyahsMetadata, fetchPageAyahsWithText } from "./quranPageAyahs";
import { AudioRecorderPlayer } from "../shared/AudioRecorderPlayer";
import {
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  Trophy,
  ArrowRight,
  Maximize2,
  Loader2,
  Zap,
  CalendarDays,
  CalendarCheck2,
  Check,
  Lock,
  AlertCircle,
  MessageSquare,
  Pencil,
  Undo2,
  Trash2,
  Highlighter,
  Mic,
  Volume2,
  Square,
} from "lucide-react";
import confetti from "canvas-confetti";
import { triggerXpReward } from "../common/FloatingXpToast";

const WEEK_DAYS = [
  { id: 0, labelId: "Ahad", labelEn: "Sun" },
  { id: 1, labelId: "Senin", labelEn: "Mon" },
  { id: 2, labelId: "Selasa", labelEn: "Tue" },
  { id: 3, labelId: "Rabu", labelEn: "Wed" },
  { id: 4, labelId: "Kamis", labelEn: "Thu" },
  { id: 5, labelId: "Jum'at", labelEn: "Fri" },
  { id: 6, labelId: "Sabtu", labelEn: "Sat" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialPageNumber?: number;
  juzFilter?: number | null;
  onSelectNextJuz?: (nextJuzNumber: number) => void;
}

export const QuranReviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialPageNumber,
  juzFilter,
  onSelectNextJuz,
}) => {
  const {
    quranPages,
    quranStats,
    reviewQuranPage,
    updateQuranMapanSchedule,
    addQuranPageIssue,
    resolveQuranPageIssue,
    language,
    isTeacherMode,
    activeSpace,
  } = useApp();
  const isTeacher = isTeacherMode || activeSpace === "teaching";
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullViewerOpen, setIsFullViewerOpen] = useState(false);
  const [fullViewerPage, setFullViewerPage] = useState<number | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isPageRevealed, setIsPageRevealed] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [activeAyahPopover, setActiveAyahPopover] =
    useState<PageAyahInfo | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [feedbackIssues, setFeedbackIssues] = useState<
    ("kelancaran" | "tajwid" | "makharijul" | "konsentrasi")[]
  >([]);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#F59E0B");
  const [drawingStrokeType, setDrawingStrokeType] = useState<
    "pen" | "highlighter"
  >("highlighter");

  // Audio recording & player dock states
  const [isAudioDockOpen, setIsAudioDockOpen] = useState(false);
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [hasAudioRecording, setHasAudioRecording] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ isDrawingMode?: boolean }>).detail;
      if (detail && typeof detail.isDrawingMode === "boolean") {
        setIsDrawingActive(detail.isDrawingMode);
      }
    };
    window.addEventListener("mushaf-drawing-mode-changed", handler);
    return () =>
      window.removeEventListener("mushaf-drawing-mode-changed", handler);
  }, []);

  // Gestur swipe untuk menutup modal muraja'ah Al-Qur'an (usap ke kanan atau ke bawah)
  useSwipeGesture(null, {
    disabled: !isOpen || isDrawingActive,
    onSwipeRight: () => {
      soundEffects.playCardFlip("backward");
      onClose();
    },
    onSwipeDown: () => {
      soundEffects.playSoftClick();
      onClose();
    },
    threshold: 40,
    minRatio: 1.15,
  });

  const [masteredCelebration, setMasteredCelebration] = useState<{
    pageNumber: number;
    surahName: string;
    juzNumber: number;
  } | null>(null);

  const [celebrationMode, setCelebrationMode] = useState<
    "fsrs" | "weekly" | "monthly"
  >("fsrs");
  const [celebrationWeeklyDay, setCelebrationWeeklyDay] = useState<number>(5);
  const [celebrationMonthlyDate, setCelebrationMonthlyDate] =
    useState<number>(1);
  const computeDueQueue = (
    pagesList: QuranPageItem[],
    filterJuz?: number | null,
    targetInitialPage?: number,
  ): QuranPageItem[] => {
    const targetJuzMeta = filterJuz
      ? JUZ_LIST.find((j) => j.juzNumber === Number(filterJuz))
      : null;

    const directDuePages = pagesList.filter((p) => {
      if (!p || !p.isActive) return false;
      const pageIsDue = isDue(
        p.fsrsData?.nextReview,
        p.isActive,
        p.fsrsData?.lastReview,
      );
      if (!pageIsDue) return false;
      if (!filterJuz) return true;

      const pNum = Number(p.pageNumber);
      if (
        targetJuzMeta &&
        pNum >= targetJuzMeta.startPage &&
        pNum <= targetJuzMeta.endPage
      ) {
        return true;
      }
      const pageJuz = getJuzForPage(pNum);
      return (
        Number(p.juzNumber) === Number(filterJuz) ||
        pageJuz === Number(filterJuz)
      );
    });

    const filtered = directDuePages
      .slice()
      .sort((a, b) => Number(a.pageNumber) - Number(b.pageNumber));

    if (targetInitialPage) {
      const targetNum = Number(targetInitialPage);
      const existingIdx = filtered.findIndex(
        (p) => Number(p.pageNumber) === targetNum,
      );
      if (existingIdx >= 0) {
        if (existingIdx > 0) {
          const [target] = filtered.splice(existingIdx, 1);
          filtered.unshift(target);
        }
      } else {
        const targetPage = pagesList.find(
          (p) => Number(p.pageNumber) === targetNum,
        );
        if (targetPage) {
          filtered.unshift(targetPage);
        }
      }
    }

    // Safety fallback: if juzFilter was specified but no due page was found,
    // yet this juz has active pages, find the first active due or active page
    if (filtered.length === 0 && targetJuzMeta) {
      const juzPages = pagesList.filter((p) => {
        const pNum = Number(p.pageNumber);
        return (
          pNum >= targetJuzMeta.startPage &&
          pNum <= targetJuzMeta.endPage &&
          p.isActive
        );
      });
      const anyDue = juzPages.filter((p) =>
        isDue(p.fsrsData?.nextReview, p.isActive, p.fsrsData?.lastReview),
      );
      if (anyDue.length > 0) {
        return anyDue.sort(
          (a, b) => Number(a.pageNumber) - Number(b.pageNumber),
        );
      }
    }

    return filtered;
  };

  const [sessionQueue, setSessionQueue] = useState<QuranPageItem[]>(() => {
    if (!isOpen) return [];
    return computeDueQueue(quranPages, juzFilter, initialPageNumber);
  });
  const [justRated, setJustRated] = useState<{
    rating: 1 | 2 | 3;
    label: string;
  } | null>(null);

  // Synchronously initialize queue when modal is opened from closed state so there is NEVER a blank/empty render
  const [prevOpenState, setPrevOpenState] = useState(isOpen);
  const [prevJuzFilter, setPrevJuzFilter] = useState(juzFilter);
  const [prevInitialPage, setPrevInitialPage] = useState(initialPageNumber);

  if (
    isOpen &&
    (!prevOpenState ||
      prevJuzFilter !== juzFilter ||
      prevInitialPage !== initialPageNumber)
  ) {
    setPrevOpenState(true);
    setPrevJuzFilter(juzFilter);
    setPrevInitialPage(initialPageNumber);
    const initialQueue = computeDueQueue(
      quranPages,
      juzFilter,
      initialPageNumber,
    );
    setSessionQueue(initialQueue);
    setCurrentIndex(0);
    setReviewedCount(0);
    setIsPageRevealed(false);
    setMasteredCelebration(null);
    setJustRated(null);
    setIsFeedbackOpen(false);
    setFeedbackNotes("");
    setFeedbackIssues([]);
  } else if (!isOpen && prevOpenState) {
    setPrevOpenState(false);
    setPrevJuzFilter(undefined);
    setPrevInitialPage(undefined);
    setSessionQueue([]);
  }

  // Backup snapshot effect in case quranPages data arrives/updates while open
  useEffect(() => {
    if (isOpen && sessionQueue.length === 0) {
      const freshQueue = computeDueQueue(
        quranPages,
        juzFilter,
        initialPageNumber,
      );
      if (freshQueue.length > 0) {
        setSessionQueue(freshQueue);
      }
    }
  }, [isOpen, quranPages, juzFilter, initialPageNumber]);

  const queue: QuranPageItem[] = sessionQueue;

  // Retrieve latest state of the current item from quranPages to ensure accurate updates
  const currentItem = queue[currentIndex]
    ? quranPages.find((p) => p.pageNumber === queue[currentIndex].pageNumber) ||
      queue[currentIndex]
    : null;

  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const [pageAyahs, setPageAyahs] = useState<PageAyahInfo[]>([]);

  useEffect(() => {
    let active = true;
    if (currentItem) {
      setImageLoading(true);
      // Immediate metadata lines
      setPageAyahs(getPageAyahsMetadata(currentItem.pageNumber));

      // Async fetch exact 15-line mapping & Uthmani text
      fetchPageAyahsWithText(currentItem.pageNumber).then((enriched) => {
        if (active && enriched.length > 0) {
          setPageAyahs(enriched);
        }
      });

      (async () => {
        const cached = await getOfflinePageUrl(currentItem.pageNumber);
        if (active) {
          if (cached) {
            setLocalImageUrl(cached);
            setImageLoading(false);
          } else {
            setLocalImageUrl(null);
          }
        }
      })();
    }
    return () => {
      active = false;
    };
  }, [currentItem?.pageNumber]);

  // Keyboard accessibility: Space/Enter to toggle reveal, 1-3 to rate
  useEffect(() => {
    if (
      !isOpen ||
      isFullViewerOpen ||
      isFeedbackOpen ||
      justRated ||
      masteredCelebration ||
      !currentItem
    )
      return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing notes or input
      const target = e.target as HTMLElement | null;
      if (
        target &&
        ["input", "textarea", "select"].includes(target.tagName.toLowerCase())
      ) {
        return;
      }

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        soundEffects.playCardFlip(isPageRevealed ? "backward" : "forward");
        setIsPageRevealed((prev) => !prev);
      } else if (e.key === "1") {
        handleRating(1);
      } else if (e.key === "2") {
        handleRating(2);
      } else if (e.key === "3") {
        handleRating(3);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    isFullViewerOpen,
    isFeedbackOpen,
    justRated,
    masteredCelebration,
    currentItem,
    isPageRevealed,
  ]);

  const advanceQueue = () => {
    if (masteredCelebration) {
      const config: MapanScheduleConfig = {
        mode: celebrationMode,
        weeklyDay:
          celebrationMode === "weekly" ? celebrationWeeklyDay : undefined,
        monthlyDate:
          celebrationMode === "monthly" ? celebrationMonthlyDate : undefined,
      };
      updateQuranMapanSchedule(masteredCelebration.pageNumber, config);
    }
    setMasteredCelebration(null);
    setCurrentIndex((prev) => prev + 1);
    setIsPageRevealed(false);
    setIsFeedbackOpen(false);
    setFeedbackNotes("");
    setFeedbackIssues([]);

    if (currentIndex + 1 >= queue.length) {
      // Completed queue! Trigger celebration and full session XP
      soundEffects.playMasteredCelebration();
      triggerXpReward(
        25,
        language === "en"
          ? "Full Session Discipline!"
          : "Sesi Murajaah Selesai!",
      );
    } else {
      // Animasi audio pembalikan kartu ketika diberikan item berikutnya untuk di-review
      soundEffects.playCardFlip("forward");
    }
  };

  const handleRating = async (rating: 1 | 2 | 3) => {
    if (!currentItem) return;

    // Trigger immediate tactile audio sound feedback & animated XP gain
    if (rating === 3) {
      soundEffects.playMasteredCelebration();
      triggerXpReward(
        5,
        language === "en" ? "Mutqin Bonus (+5 XP)" : "Mutqin (+5 XP)",
      );
    } else if (rating === 2) {
      soundEffects.playReviewSuccess();
      triggerXpReward(
        4,
        language === "en" ? "Fluent Bonus (+4 XP)" : "Lancar (+4 XP)",
      );
    } else {
      soundEffects.playReviewAgain();
      triggerXpReward(
        2,
        language === "en" ? "Page Review (+2 XP)" : "Lembar Murajaah (+2 XP)",
      );
    }

    const wasMasteredBefore =
      currentItem.status === "mastered_for_now" ||
      (currentItem.fsrsData?.stability || 0) * 0.4025587 >= 30;

    // Execute state transition in context
    const updatedResult = await reviewQuranPage(
      currentItem.pageNumber,
      rating,
      feedbackNotes || feedbackIssues.length > 0
        ? {
            notes: feedbackNotes || undefined,
            issueTypes: feedbackIssues.length > 0 ? feedbackIssues : undefined,
          }
        : undefined,
    );
    setReviewedCount((prev) => prev + 1);

    // Also write to offline storage log
    logOfflineReview("quran", currentItem.pageNumber, rating);

    const isNowMastered = updatedResult?.isMasteredForNow || false;

    // Check if this review newly crossed the Mapan threshold (>30 days interval)
    if (!wasMasteredBefore && isNowMastered) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setMasteredCelebration({
        pageNumber: currentItem.pageNumber,
        surahName: currentItem.surahNameEn,
        juzNumber: currentItem.juzNumber,
      });
      return;
    }

    const ratingLabel =
      rating === 3
        ? language === "en"
          ? "Mutqin Saved"
          : "Tersimpan: Mutqin"
        : rating === 2
          ? language === "en"
            ? "Fluent Saved"
            : "Tersimpan: Lancar"
          : language === "en"
            ? "Scheduled for tomorrow"
            : "Dijadwalkan ulang besok";

    setJustRated({ rating, label: ratingLabel });

    // Brief delay to display positive visual feedback before moving to next item
    setTimeout(() => {
      setJustRated(null);
      advanceQueue();
    }, 450);
  };

  const isFinished = currentIndex >= queue.length && queue.length > 0;
  const currentImageUrl = currentItem
    ? getQuranPageImageUrl(currentItem.pageNumber, 1260)
    : "";

  // Check which other Juz have due items remaining
  const otherDueJuzMap = new Map<number, number>();
  (quranStats?.dueList || []).forEach((p) => {
    if (!juzFilter || p.juzNumber !== juzFilter) {
      otherDueJuzMap.set(
        p.juzNumber,
        (otherDueJuzMap.get(p.juzNumber) || 0) + 1,
      );
    }
  });
  const otherDueJuzNumbers = Array.from(otherDueJuzMap.keys()).sort(
    (a, b) => a - b,
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="neumorph-card bg-[#EEF2F7] dark:bg-[#141C2B] text-slate-900 dark:text-slate-100 w-full max-w-4xl h-[95vh] rounded-3xl shadow-2xl border border-white/60 dark:border-white/5 overflow-hidden flex flex-col">
        {/* Unified Sleek Single-Tier Top Header (Row 2 removed, progress integrated, direct 1-touch record) */}
        {!isFinished && currentItem && !masteredCelebration ? (
          <div className="border-b border-black/[0.04] dark:border-white/[0.04] bg-white/95 dark:bg-[#182236]/95 backdrop-blur-md shrink-0 shadow-xs z-20">
            {/* Single Row: Page metadata + Review progress on left, Action buttons on right */}
            <div className="px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
              {/* Left: Page Badge, Surah, Ayat Range & Session Progress all parallel in one single level */}
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                {/* Badge Nomor Halaman (hanya angka nomor halaman tanpa kata 'Hal') */}
                <div
                  className="h-7 sm:h-8 min-w-[28px] sm:min-w-[32px] px-2 rounded-xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-xs"
                  title={`Halaman ${currentItem.pageNumber}`}
                >
                  <span>{currentItem.pageNumber}</span>
                </div>

                {/* Info Sejajar: Surat, Rentang Ayat (tanpa teks 'Ayat'), Progres, & Juz */}
                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                  <h3 className="font-black text-xs sm:text-sm text-[#18234A] dark:text-[#F8FAFC] truncate">
                    {currentItem.surahNameEn}
                  </h3>

                  {/* Rentang Angka Ayat Sejajar di Samping Nama Surat (tanpa awalan kata 'Ayat') */}
                  <span className="text-[10.5px] sm:text-[11.5px] font-semibold text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap shrink-0">
                    {currentItem.ayahRange}
                  </span>

                  {/* Progres Review (1 / 4) Berdampingan di Samping Nama Surat & Ayat */}
                  <div
                    className="flex items-center px-1.5 py-0.5 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 text-[#FF6F3D] font-black text-[10px] sm:text-[11px] shrink-0 border border-orange-500/20"
                    title={`Progres sesi: ${currentIndex + 1} dari ${queue.length} (${Math.round(((currentIndex + 1) / queue.length) * 100)}%)`}
                  >
                    <span>
                      {currentIndex + 1}/{queue.length}
                    </span>
                  </div>

                  {/* Juz Badge */}
                  <span className="hidden xs:inline-flex text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md neumorph-inset font-bold text-[#64748B] dark:text-[#94A3B8] shrink-0">
                    Juz {currentItem.juzNumber}
                  </span>

                  {/* Surah Arabic Name (Desktop Besar) */}
                  <span
                    className="font-serif text-xs font-bold text-[#FF6F3D] hidden xl:inline ml-0.5 truncate"
                    dir="rtl"
                  >
                    سُورَةُ {currentItem.surahNameAr}
                  </span>
                </div>
              </div>

              {/* Right: Actions (Direct Record/Audio, Pencil, Hide/Reveal, Issue Tracker, Fullscreen, Close) */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Mode Rekam Langsung (1-Touch Direct Record / Toggle Audio Dock) */}
                <button
                  type="button"
                  onClick={() => {
                    if (isAudioRecording) {
                      window.dispatchEvent(
                        new CustomEvent("trigger-stop-recording", {
                          detail: { itemId: currentItem.pageNumber },
                        }),
                      );
                    } else if (!hasAudioRecording) {
                      setIsAudioDockOpen(true);
                      window.dispatchEvent(
                        new CustomEvent("trigger-start-recording", {
                          detail: { itemId: currentItem.pageNumber },
                        }),
                      );
                    } else {
                      setIsAudioDockOpen((prev) => !prev);
                    }
                  }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
                    isAudioRecording
                      ? "bg-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-400"
                      : hasAudioRecording
                        ? isAudioDockOpen
                          ? "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs"
                          : "neumorph-card text-[#FF6F3D] dark:text-[#FF7E4A] hover:scale-105"
                        : "neumorph-card text-[#5E6D88] hover:text-[#FF6F3D] dark:text-[#94A3B8] dark:hover:text-white hover:scale-105"
                  }`}
                  title={
                    isAudioRecording
                      ? language === "en"
                        ? "Stop & Save Recording"
                        : "Stop & Simpan Rekaman"
                      : hasAudioRecording
                        ? language === "en"
                          ? "Audio Player (Click to open/close)"
                          : "Putar Audio Rekaman (Buka/Tutup Bilah)"
                        : language === "en"
                          ? "Record Voice (Direct 1-Touch)"
                          : "Rekam Suara (Sekali Klik Langsung Merekam)"
                  }
                >
                  {isAudioRecording ? (
                    <Square className="w-3 h-3 fill-white" />
                  ) : hasAudioRecording ? (
                    <Volume2 className="w-3.5 h-3.5" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Mode Coret / Stabilo Langsung di Mushaf */}
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("toggle-mushaf-drawing", {
                        detail: { pageNumber: currentItem.pageNumber },
                      }),
                    );
                  }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
                    isDrawingActive
                      ? "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs ring-1 ring-orange-300"
                      : "neumorph-card text-[#5E6D88] hover:text-[#FF6F3D] dark:text-[#94A3B8] dark:hover:text-white hover:scale-105"
                  }`}
                  title={
                    language === "en"
                      ? "Highlighter & Pen (Mark directly on mushaf)"
                      : "Mode Coret Stabilo / Pensil (Tandai di mushaf)"
                  }
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </button>

                {/* Mode Toggle: Reveal / Hide Mushaf */}
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playCardFlip(
                      isPageRevealed ? "backward" : "forward",
                    );
                    setIsPageRevealed((prev) => !prev);
                  }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
                    isPageRevealed
                      ? "neumorph-inset text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]"
                      : "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs hover:scale-105"
                  }`}
                  title={
                    isPageRevealed
                      ? language === "en"
                        ? "Hide Mushaf (Test Recall)"
                        : "Tutup Mushaf (Uji Hafalan)"
                      : language === "en"
                        ? "Reveal Mushaf"
                        : "Buka Halaman Mushaf"
                  }
                >
                  {isPageRevealed ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Pelacakan Masalah / Catatan Koreksi */}
                <button
                  type="button"
                  onClick={() => setIsFeedbackOpen(true)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 relative ${
                    (currentItem.issues || []).filter((i) => !i.isResolved)
                      .length > 0
                      ? "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs"
                      : "neumorph-card text-[#5E6D88] hover:text-[#FF6F3D] dark:text-[#94A3B8] dark:hover:text-white hover:scale-105"
                  }`}
                  title={
                    language === "en"
                      ? "Track Memorization Issues / Corrections"
                      : "Catatan Kesalahan & Koreksi"
                  }
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {(currentItem.issues || []).filter((i) => !i.isResolved)
                    .length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#182236]">
                      {
                        (currentItem.issues || []).filter((i) => !i.isResolved)
                          .length
                      }
                    </span>
                  )}
                </button>

                {/* Fullscreen Viewer */}
                <button
                  type="button"
                  onClick={() => {
                    setFullViewerPage(currentItem.pageNumber);
                    setIsFullViewerOpen(true);
                  }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl neumorph-card text-[#5E6D88] hover:text-[#FF6F3D] dark:text-[#94A3B8] dark:hover:text-white hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center justify-center"
                  title={
                    language === "en" ? "Fullscreen Mushaf" : "Buka Layar Penuh"
                  }
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl neumorph-card flex items-center justify-center text-[#5E6D88] hover:text-rose-600 dark:text-[#94A3B8] dark:hover:text-rose-400 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs ml-0.5"
                  title="Tutup Sesi"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Micro-Progress Hairline along Header Base (Zero vertical space overhead) */}
            <div className="w-full bg-black/[0.04] dark:bg-white/[0.04] h-1 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#FF7E4A] via-[#E65320] to-[#FF7E4A] h-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(6, ((currentIndex + 1) / queue.length) * 100))}%`,
                }}
              />
            </div>
          </div>
        ) : (
          /* Standard Header for Finished / Empty / Celebration State */
          <div className="px-4 sm:px-5 py-3 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between bg-white/90 dark:bg-[#182236]/90 backdrop-blur-md shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(255,111,61,0.35)] shrink-0">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-sm sm:text-base text-[#18234A] dark:text-[#F8FAFC] tracking-tight truncate">
                  {juzFilter
                    ? language === "en"
                      ? `Murajaah Juz ${juzFilter}`
                      : `Murajaah Juz ${juzFilter}`
                    : language === "en"
                      ? "Quran Daily Murajaah"
                      : "Murajaah Harian Al-Qur'an"}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl neumorph-card flex items-center justify-center text-[#5E6D88] hover:text-[#18234A] dark:text-[#94A3B8] dark:hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 flex flex-col min-h-0">
          {masteredCelebration ? (
            /* Celebration Screen for Mapan Achievement with Custom Schedule Options */
            <div className="py-4 my-auto max-w-lg mx-auto animate-in zoom-in-95 duration-300 w-full text-left space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white mx-auto flex items-center justify-center mb-3 shadow-lg shadow-orange-500/25">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <span className="inline-block text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white mb-2 shadow-xs">
                  {language === "en"
                    ? "Mastered / Mutqin Status Achieved"
                    : "Hafalan Lulus & Mapan (Mutqin)"}
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-[#18234A] dark:text-[#F8FAFC]">
                  {language === "en"
                    ? "Mabruk! Page Successfully Mastered!"
                    : "Mabruk! Selamat, Halaman Ini Sudah Mapan!"}
                </h4>
                <p className="text-xs sm:text-sm text-[#5E6D88] dark:text-[#94A3B8] mt-2 leading-relaxed">
                  {language === "en"
                    ? `Page ${masteredCelebration.pageNumber} (${masteredCelebration.surahName}, Juz ${masteredCelebration.juzNumber}) is officially Mastered! You can continue with the app's default adaptive scheduling, or choose a custom weekly/monthly rhythm below:`
                    : `Halaman ${masteredCelebration.pageNumber} (${masteredCelebration.surahName}, Juz ${masteredCelebration.juzNumber}) telah resmi Mapan! Anda bisa tetap melanjutkan ritme murajaah adaptif otomatis, atau memilih ritme mingguan/bulanan:`}
                </p>
              </div>

              {/* Selection cards for schedule */}
              <div className="space-y-2.5 mb-5">
                {/* 1. App Adaptive Schedule */}
                <div
                  onClick={() => setCelebrationMode("fsrs")}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer flex flex-col gap-1.5 ${
                    celebrationMode === "fsrs"
                      ? "neumorph-card ring-2 ring-[#FF6F3D] shadow-md bg-gradient-to-br from-orange-500/5 to-transparent"
                      : "neumorph-card hover:scale-[1.01]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-xl ${celebrationMode === "fsrs" ? "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white" : "neumorph-inset text-[#5E6D88]"}`}
                      >
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-[#18234A] dark:text-[#F8FAFC]">
                        {language === "en"
                          ? "App Adaptive Schedule (Recommended)"
                          : "Penjadwalan Adaptif Otomatis (Rekomendasi)"}
                      </span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${celebrationMode === "fsrs" ? "bg-[#FF6F3D] text-white" : "border border-slate-300"}`}
                    >
                      {celebrationMode === "fsrs" && (
                        <Check className="w-3 h-3 stroke-[3]" />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] pl-7 leading-relaxed">
                    {language === "en"
                      ? "Intervals adapt automatically based on your recall. If recitation ever falters, the app automatically schedules it for an earlier review."
                      : "Jadwal pengulangan diatur secara adaptif oleh aplikasi. Jika hafalan kelak terasa goyah saat diulang, sistem otomatis menjadwalkan murajaah lebih awal."}
                  </p>
                </div>

                {/* 2. Weekly Fixed Day */}
                <div
                  onClick={() => setCelebrationMode("weekly")}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer flex flex-col gap-1.5 ${
                    celebrationMode === "weekly"
                      ? "neumorph-card ring-2 ring-[#10B981] shadow-md bg-gradient-to-br from-emerald-500/5 to-transparent"
                      : "neumorph-card hover:scale-[1.01]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-xl ${celebrationMode === "weekly" ? "bg-gradient-to-br from-[#10B981] to-[#059669] text-white" : "neumorph-inset text-[#5E6D88]"}`}
                      >
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-[#18234A] dark:text-[#F8FAFC]">
                        {language === "en"
                          ? "Weekly Fixed Day"
                          : "Jadwal Mingguan (Pilih Hari)"}
                      </span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${celebrationMode === "weekly" ? "bg-[#10B981] text-white" : "border border-slate-300"}`}
                    >
                      {celebrationMode === "weekly" && (
                        <Check className="w-3 h-3 stroke-[3]" />
                      )}
                    </div>
                  </div>
                  {celebrationMode === "weekly" && (
                    <div className="pt-2 pl-7 space-y-1.5">
                      <span className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-bold block">
                        {language === "en"
                          ? "Murajaah every:"
                          : "Murajaah setiap hari:"}
                      </span>
                      <div className="grid grid-cols-7 gap-1">
                        {WEEK_DAYS.map((day) => (
                          <button
                            key={day.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCelebrationWeeklyDay(day.id);
                            }}
                            className={`py-1.5 px-1 rounded-xl text-[11px] font-black text-center cursor-pointer transition-all ${
                              celebrationWeeklyDay === day.id
                                ? "bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-xs"
                                : "neumorph-inset text-[#5E6D88] hover:text-[#18234A]"
                            }`}
                          >
                            {language === "en" ? day.labelEn : day.labelId}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Monthly Fixed Date */}
                <div
                  onClick={() => setCelebrationMode("monthly")}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer flex flex-col gap-1.5 ${
                    celebrationMode === "monthly"
                      ? "neumorph-card ring-2 ring-[#FF6F3D] shadow-md bg-gradient-to-br from-orange-500/5 to-transparent"
                      : "neumorph-card hover:scale-[1.01]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-xl ${celebrationMode === "monthly" ? "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white" : "neumorph-inset text-[#5E6D88]"}`}
                      >
                        <CalendarCheck2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-[#18234A] dark:text-[#F8FAFC]">
                        {language === "en"
                          ? "Monthly Fixed Date"
                          : "Jadwal Bulanan (Pilih Tanggal 1–31)"}
                      </span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${celebrationMode === "monthly" ? "bg-[#FF6F3D] text-white" : "border border-slate-300"}`}
                    >
                      {celebrationMode === "monthly" && (
                        <Check className="w-3 h-3 stroke-[3]" />
                      )}
                    </div>
                  </div>
                  {celebrationMode === "monthly" && (
                    <div className="pt-2 pl-7 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#5E6D88] dark:text-[#94A3B8] font-bold">
                          {language === "en"
                            ? "Review date (1 - 31):"
                            : "Tanggal murajaah tiap bulan (1 - 31):"}
                        </span>
                        <span className="font-black px-2 py-0.5 rounded-lg bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-2xs">
                          {language === "en"
                            ? `Day ${celebrationMonthlyDate}`
                            : `Tanggal ${celebrationMonthlyDate}`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="31"
                        value={celebrationMonthlyDate}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          setCelebrationMonthlyDate(parseInt(e.target.value))
                        }
                        className="w-full accent-[#FF6F3D] cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[#5E6D88] font-bold">
                        <span>Tgl 1</span>
                        <span>Tgl 10</span>
                        <span>Tgl 20</span>
                        <span>Tgl 31</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={advanceQueue}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white font-black text-sm shadow-[0_4px_14px_rgba(255,111,61,0.4)] transition-all active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>
                    {language === "en"
                      ? "Save & Continue"
                      : "Simpan & Lanjut ke Halaman Berikutnya"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : isFinished ? (
            <div className="text-center py-8 my-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white mx-auto flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-black text-[#18234A] dark:text-[#F8FAFC]">
                {juzFilter
                  ? language === "en"
                    ? `Juz ${juzFilter} Murajaah Complete!`
                    : `Murajaah Juz ${juzFilter} Selesai!`
                  : language === "en"
                    ? "Murajaah Complete!"
                    : "Murajaah Hari Ini Selesai!"}
              </h4>
              <p className="text-sm text-[#5E6D88] dark:text-[#94A3B8] max-w-sm mx-auto font-medium">
                {language === "en"
                  ? `Alhamdulillah! You reviewed ${reviewedCount} page${reviewedCount === 1 ? "" : "s"}. Next intervals have been updated.`
                  : `Alhamdulillah! Anda telah mereview ${reviewedCount} halaman. Jadwal murajaah telah dihitung dan diperbarui.`}
              </p>

              {/* Next Due Juz Suggestions if any remain (Compact High-Density Grid: min 4 items per row) */}
              {otherDueJuzNumbers.length > 0 && (
                <div className="mt-5 p-3.5 sm:p-4 rounded-3xl neumorph-card max-w-lg mx-auto text-left space-y-2.5 border border-white/60 dark:border-white/5">
                  <p className="text-[11px] sm:text-xs font-black text-[#18234A] dark:text-[#F8FAFC] uppercase tracking-wider">
                    {language === "en"
                      ? "Other Juz due today:"
                      : "Juz lain yang masih due hari ini:"}
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
                    {otherDueJuzNumbers.map((nextJuz) => {
                      const dueCount = otherDueJuzMap.get(nextJuz) || 0;
                      return (
                        <button
                          key={nextJuz}
                          type="button"
                          onClick={() => {
                            if (onSelectNextJuz) {
                              onSelectNextJuz(nextJuz);
                              setCurrentIndex(0);
                              setReviewedCount(0);
                              setIsPageRevealed(true);
                            }
                          }}
                          className="py-1.5 px-1 rounded-xl neumorph-card hover:scale-105 active:scale-95 text-xs font-black text-[#18234A] dark:text-[#F8FAFC] transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer border border-white/60 dark:border-white/5"
                          title={`Juz ${nextJuz}: ${dueCount} due`}
                        >
                          <span className="text-[10px] sm:text-xs font-black">
                            Juz {nextJuz}
                          </span>
                          <span className="px-1 py-0.2 rounded-full bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white text-[9px] font-black shrink-0 shadow-2xs leading-none">
                            {dueCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-br from-[#18234A] to-[#0E1626] text-white font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-sm shadow-md cursor-pointer"
                >
                  <span>
                    {language === "en"
                      ? "Return to Quran Room"
                      : "Kembali ke Ruang Al-Qur'an"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : !currentItem ? (
            /* Safe Fallback: Empty Queue or No Active Pages Due */
            <div className="text-center py-8 my-auto space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-black text-[#18234A] dark:text-[#F8FAFC]">
                {language === "en"
                  ? "No Due Pages in This Session"
                  : "Tidak Ada Halaman yang Jatuh Tempo"}
              </h4>
              <p className="text-xs sm:text-sm text-[#5E6D88] dark:text-[#94A3B8] font-medium leading-relaxed">
                {language === "en"
                  ? "All pages in this selection are currently up to date! Great job maintaining your memorization rhythm."
                  : "Seluruh hafalan pada pilihan ini telah dimurajaah atau belum jatuh tempo hari ini. Pertahankan konsistensi Anda!"}
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-xs sm:text-sm shadow-md cursor-pointer"
                >
                  <span>{language === "en" ? "Close" : "Tutup"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Quran Printed Page Image Container with Open Book Spread & Half-Cut Adjacent Page */}
              <div className="flex-1 w-full rounded-3xl overflow-hidden relative flex items-center justify-center bg-[#F3F4F6] dark:bg-[#0B1120] shadow-inner border border-black/[0.06] dark:border-black/20 p-1 sm:p-2.5 min-h-0">
                {isPageRevealed ? (
                  <>
                    {imageLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EEF2F7] dark:bg-[#141C2B] z-10">
                        <Loader2 className="w-7 h-7 text-[#FF6F3D] animate-spin mb-2" />
                        <span className="text-xs text-[#5E6D88] dark:text-[#94A3B8] font-bold">
                          Memuat Halaman Mushaf...
                        </span>
                      </div>
                    )}
                    {(() => {
                      const pageNum = currentItem.pageNumber;
                      const isRightPage = pageNum % 2 !== 0; // Odd = Right page
                      const adjacentPageNum = isRightPage
                        ? pageNum - 1
                        : pageNum + 1;
                      const adjacentImageUrl = getQuranPageImageUrl(
                        adjacentPageNum,
                        1024,
                      );

                      return (
                        <div className="flex items-center justify-center h-full w-full select-none">
                          {/* Unified Open Book Spread: Both pages locked to the EXACT same height & authentic proportions */}
                          <div className="flex items-stretch h-full max-h-[calc(100vh-170px)] sm:max-h-[680px] max-w-full aspect-[1.28/1.48] shadow-2xl rounded-[4px] overflow-hidden border border-amber-900/25 dark:border-slate-700/80 bg-[#FCFBF7] dark:bg-slate-900">
                            {/* If Right Page (odd, e.g. 601), show half-cut adjacent left page (e.g. 600) */}
                            {isRightPage && adjacentPageNum >= 1 && (
                              <div className="w-[24%] sm:w-[25%] shrink-0 min-w-[58px] max-w-[130px] h-full relative flex border-r border-amber-900/20 select-none">
                                <img
                                  src={adjacentImageUrl}
                                  alt={`Halaman ${adjacentPageNum}`}
                                  className="absolute inset-0 w-full h-full object-cover object-right select-none opacity-30 grayscale-[35%] pointer-events-none"
                                />
                                {/* Spine Shadow on right edge of adjacent left page */}
                                <div className="absolute inset-y-0 right-0 w-3 sm:w-4 bg-gradient-to-l from-black/30 via-black/10 to-transparent pointer-events-none z-10" />

                                {/* 15-Line Vertical Ayah Gutter pinned right along the spine */}
                                <div className="relative z-20 w-full h-full flex items-center justify-center pointer-events-auto px-0.5">
                                  <Mushaf15LineGutter
                                    ayahs={pageAyahs}
                                    issues={currentItem.issues || []}
                                    onSelectAyah={(ayah) =>
                                      setActiveAyahPopover(ayah)
                                    }
                                    language={language}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Main Review Page (Dominant, authentic 1/1.48 aspect ratio, full height matching adjacent page) */}
                            <div className="flex-1 h-full min-w-0 relative flex items-center justify-center">
                              <MushafInteractiveCanvas
                                pageNumber={pageNum}
                                imageUrl={localImageUrl || currentImageUrl}
                                isRightPage={isRightPage}
                                issues={currentItem.issues || []}
                                onSelectAyah={(ayah) =>
                                  setActiveAyahPopover(ayah)
                                }
                                language={language}
                                onImageLoad={() => {
                                  setImageLoading(false);
                                  cachePageOffline(pageNum);
                                }}
                              />
                            </div>

                            {/* If Left Page (even, e.g. 490), show half-cut adjacent right page (e.g. 491) */}
                            {!isRightPage && (
                              <div className="w-[24%] sm:w-[25%] shrink-0 min-w-[58px] max-w-[130px] h-full relative flex border-l border-amber-900/20 select-none">
                                <img
                                  src={adjacentImageUrl}
                                  alt={`Halaman ${adjacentPageNum}`}
                                  className="absolute inset-0 w-full h-full object-cover object-left select-none opacity-30 grayscale-[35%] pointer-events-none"
                                />
                                {/* Spine Shadow on left edge of adjacent right page */}
                                <div className="absolute inset-y-0 left-0 w-3 sm:w-4 bg-gradient-to-r from-black/30 via-black/10 to-transparent pointer-events-none z-10" />

                                {/* 15-Line Vertical Ayah Gutter pinned left along the spine */}
                                <div className="relative z-20 w-full h-full flex items-center justify-center pointer-events-auto px-0.5">
                                  <Mushaf15LineGutter
                                    ayahs={pageAyahs}
                                    issues={currentItem.issues || []}
                                    onSelectAyah={(ayah) =>
                                      setActiveAyahPopover(ayah)
                                    }
                                    language={language}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <div className="text-center p-6 my-auto flex flex-col items-center justify-center space-y-3 max-w-sm">
                    <div className="w-16 h-16 rounded-3xl neumorph-card flex items-center justify-center text-[#FF6F3D] bg-orange-500/5 shadow-inner">
                      <BookOpen className="w-8 h-8 text-[#FF6F3D]" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-[#18234A] dark:text-[#F8FAFC]">
                        {language === "en"
                          ? "Recall Mode (From Memory)"
                          : "Mode Uji Hafalan (Luar Kepala)"}
                      </h4>
                      <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8] mt-1 leading-relaxed">
                        {language === "en"
                          ? "Recite from memory, then reveal the mushaf to check your accuracy."
                          : "Lantunkan ayat secara mandiri, lalu buka mushaf untuk memverifikasi kelancaran."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playCardFlip("forward");
                        setIsPageRevealed(true);
                      }}
                      className="px-6 py-2.5 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white text-xs font-black shadow-[0_4px_12px_rgba(255,111,61,0.35)] cursor-pointer hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>
                        {language === "en"
                          ? "Reveal Mushaf Page"
                          : "Lihat Halaman Mushaf"}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Horizontal Drawing Toolbar (Placed between Mushaf and 3 Rating Buttons - Ultra-slim, no text clutter) */}
              {isDrawingActive && (
                <div className="mt-1 shrink-0 px-2 sm:px-3 py-1 rounded-xl bg-white/95 dark:bg-[#182236]/95 border border-black/10 dark:border-white/10 shadow-md flex items-center justify-between sm:justify-center gap-1.5 sm:gap-3 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none w-full max-w-md mx-auto overflow-hidden">
                  {/* Left: Stabilo vs Pena Toggle - Pure icons without text */}
                  <div className="flex items-center p-0.5 rounded-xl neumorph-inset gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setDrawingStrokeType("highlighter");
                        window.dispatchEvent(
                          new CustomEvent("set-mushaf-drawing-type", {
                            detail: { strokeType: "highlighter" },
                          }),
                        );
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                        drawingStrokeType === "highlighter"
                          ? "bg-[#FF7E4A] text-white shadow-2xs"
                          : "text-[#5E6D88] hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                      title="Stabilo (Tebal & Transparan)"
                      aria-label="Stabilo"
                    >
                      <Highlighter className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDrawingStrokeType("pen");
                        window.dispatchEvent(
                          new CustomEvent("set-mushaf-drawing-type", {
                            detail: { strokeType: "pen" },
                          }),
                        );
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                        drawingStrokeType === "pen"
                          ? "bg-[#FF7E4A] text-white shadow-2xs"
                          : "text-[#5E6D88] hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                      title="Pena (Garis Halus)"
                      aria-label="Pena"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Center: 4 Color Presets */}
                  <div className="flex items-center gap-1.5 sm:gap-2 px-1 sm:px-2.5 border-x border-black/[0.08] dark:border-white/[0.08] shrink-0">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setDrawingColor(p.color);
                          window.dispatchEvent(
                            new CustomEvent("set-mushaf-drawing-color", {
                              detail: { color: p.color },
                            }),
                          );
                        }}
                        style={{ backgroundColor: p.color }}
                        className={`w-5 h-5 rounded-full transition-transform cursor-pointer shadow-xs ${
                          drawingColor === p.color
                            ? "scale-125 ring-2 ring-white dark:ring-slate-900 ring-offset-2 ring-offset-[#FF6F3D]/40"
                            : "hover:scale-110 opacity-75"
                        }`}
                        title={p.label}
                        aria-label={p.label}
                      />
                    ))}
                  </div>

                  {/* Right: Undo, Clear, and Dedicated Selesai Button */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto sm:ml-0">
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent("mushaf-drawing-undo"),
                        );
                      }}
                      className="p-1.5 rounded-xl neumorph-card text-[#5E6D88] hover:text-[#18234A] dark:hover:text-white transition-colors cursor-pointer"
                      title="Undo Coretan"
                      aria-label="Undo Coretan"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent("mushaf-drawing-clear"),
                        );
                      }}
                      className="p-1.5 rounded-xl neumorph-card text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Hapus Semua Coretan"
                      aria-label="Hapus Semua Coretan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent("toggle-mushaf-drawing", {
                            detail: { enabled: false },
                          }),
                        );
                      }}
                      className="h-7 px-2.5 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0 ml-0.5 sm:ml-1"
                      title="Selesai Coret"
                      aria-label="Selesai Coret"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                      <span>Selesai</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Horizontal Audio Player & Recorder Dock (Directly Above 3 Rating Buttons, Hidden by Default) */}
              <div
                className={
                  isAudioDockOpen || isAudioRecording
                    ? "mt-1.5 shrink-0 animate-in fade-in select-none"
                    : "hidden"
                }
              >
                <AudioRecorderPlayer
                  itemId={currentItem.pageNumber}
                  itemType="quran"
                  itemLabel={`Hal ${currentItem.pageNumber}`}
                  language={language}
                  compact={false}
                  variant="mushaf-dock"
                  onHasRecordingChange={(hasRec) =>
                    setHasAudioRecording(hasRec)
                  }
                  onRecordingStateChange={(rec) => {
                    setIsAudioRecording(rec);
                    if (rec) setIsAudioDockOpen(true);
                  }}
                  onClose={() => setIsAudioDockOpen(false)}
                />
              </div>

              {/* Rating Buttons */}
              <div className="mt-2 shrink-0 space-y-1">
                {/* Soft Confirmation Feedback Pill */}
                {justRated && (
                  <div className="flex items-center justify-center gap-2 py-1.5 px-4 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-md animate-in fade-in zoom-in-95 duration-150">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span className="text-xs font-black">
                      {justRated.label}
                    </span>
                  </div>
                )}

                {/* 3 Feedback Rating Buttons (Single-Row Minimalist & Proportional) */}
                {(() => {
                  const isItemDue = isDue(
                    currentItem.fsrsData.nextReview,
                    currentItem.isActive,
                  );
                  const isMapanEver =
                    currentItem.status === "mastered_for_now" ||
                    !!currentItem.mapanCelebrated ||
                    (currentItem.fsrsData.stability || 0) * 0.4025587 >= 30;
                  const isRating3Allowed = isMapanEver || isTeacher;
                  const qIntervals = predictQuranIntervals(
                    currentItem.fsrsData,
                    currentItem.mapanSchedule,
                  );

                  return (
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                      {/* Rating 1: Belum (Review) */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isItemDue) handleRating(1);
                        }}
                        disabled={!isItemDue || !!justRated}
                        className={`h-10 sm:h-11 px-1.5 sm:px-2 rounded-2xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shadow-xs border ${
                          justRated?.rating === 1
                            ? "bg-gradient-to-br from-rose-500 to-rose-600 text-white scale-105 shadow-md border-rose-600"
                            : isItemDue
                              ? "bg-gradient-to-b from-[#FFF5F5] to-[#FFEBEB] dark:from-[#2E141C] dark:to-[#220E15] border-rose-300/80 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 hover:scale-[1.02] active:scale-95 shadow-[0_2px_8px_rgba(244,63,94,0.08)]"
                              : "neumorph-inset opacity-40 text-slate-400 dark:text-slate-500 cursor-not-allowed border-transparent"
                        }`}
                        title={
                          language === "en"
                            ? "Needs Review (Scheduled for tomorrow)"
                            : "Belum lancar (Dijadwalkan ulang besok)"
                        }
                      >
                        <span className="font-black text-xs sm:text-sm">
                          {language === "en"
                            ? "Review"
                            : language === "id"
                              ? "Belum"
                              : "مراجعة"}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 leading-none shrink-0">
                          {qIntervals.needReviewDays}
                          {language === "en" ? "d" : " hr"}
                        </span>
                      </button>

                      {/* Rating 2: Lancar (Fluent) */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isItemDue) handleRating(2);
                        }}
                        disabled={!isItemDue || !!justRated}
                        className={`h-10 sm:h-11 px-1.5 sm:px-2 rounded-2xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shadow-xs border ${
                          justRated?.rating === 2
                            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white scale-105 shadow-md border-blue-600"
                            : isItemDue
                              ? "bg-gradient-to-b from-[#F0F7FF] to-[#E0EFFF] dark:from-[#11243B] dark:to-[#0B1A2C] border-blue-300/80 dark:border-blue-900/60 text-blue-800 dark:text-blue-200 hover:scale-[1.02] active:scale-95 shadow-[0_2px_8px_rgba(37,99,235,0.08)]"
                              : "neumorph-inset opacity-40 text-slate-400 dark:text-slate-500 cursor-not-allowed border-transparent"
                        }`}
                        title={
                          language === "en"
                            ? "Fluent (Extends interval)"
                            : "Lancar (Meningkatkan interval murajaah)"
                        }
                      >
                        <span className="font-black text-xs sm:text-sm">
                          {language === "en"
                            ? "Fluent"
                            : language === "id"
                              ? "Lancar"
                              : "حاضر"}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 leading-none shrink-0">
                          +{qIntervals.hardDays}
                          {language === "en" ? "d" : " hr"}
                        </span>
                      </button>

                      {/* Rating 3: Mutqin (Mastered) */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isItemDue && isRating3Allowed) handleRating(3);
                        }}
                        disabled={
                          !isItemDue || !isRating3Allowed || !!justRated
                        }
                        className={`h-10 sm:h-11 px-1.5 sm:px-2 rounded-2xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 shadow-xs border ${
                          justRated?.rating === 3
                            ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white scale-105 shadow-md border-emerald-600"
                            : isItemDue && isRating3Allowed
                              ? "bg-gradient-to-b from-[#F0FDF4] to-[#DCFCE7] dark:from-[#0E2E20] dark:to-[#091F16] border-emerald-400/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-[0_2px_8px_rgba(16,185,129,0.1)]"
                              : "neumorph-inset opacity-40 text-[#5E6D88] dark:text-[#94A3B8] cursor-not-allowed border-transparent"
                        }`}
                        title={
                          !isRating3Allowed
                            ? language === "en"
                              ? "Locked: Available once item reaches Mastered (>30d interval) or via Teacher in Class"
                              : "Terkunci: Aktif otomatis setelah hafalan mencapai status Mapan (>30 hari) atau dinilai oleh Guru di Ruang Mengajar"
                            : isTeacher && !isMapanEver
                              ? language === "en"
                                ? "Mutqin (Teacher Assessment / Direct Boost)"
                                : "Lancar Mutqin (Penilaian Guru Halaqah)"
                              : language === "en"
                                ? "Fluent Mutqin (Optimal interval boost)"
                                : "Lancar Mutqin (Kenaikan cepat optimal)"
                        }
                      >
                        <span className="font-black text-xs sm:text-sm">
                          {language === "en" ? "Mutqin" : "Mutqin"}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 leading-none shrink-0">
                          {isRating3Allowed
                            ? `+${qIntervals.goodDays}${language === "en" ? "d" : " hr"}`
                            : "🔒 Mapan"}
                        </span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Direct Ayah Correction Popover (Offline-Style Clicking Ayah on Mushaf) */}
        {currentItem && (
          <MushafAyahCorrectionPopover
            isOpen={Boolean(activeAyahPopover)}
            onClose={() => setActiveAyahPopover(null)}
            pageNumber={currentItem.pageNumber}
            activeAyah={activeAyahPopover}
            existingIssues={currentItem.issues || []}
            onSaveIssue={(issue) => {
              addQuranPageIssue(currentItem.pageNumber, issue);
            }}
            onResolveIssue={(issueId) => {
              resolveQuranPageIssue(currentItem.pageNumber, issueId);
            }}
            language={language}
          />
        )}

        {/* Standardized Quran Page Issue & Feedback Modal (Identical to Quran Space) */}
        {currentItem && (
          <QuranPageFeedbackModal
            isOpen={isFeedbackOpen}
            onClose={() => setIsFeedbackOpen(false)}
            page={currentItem}
          />
        )}

        {/* Fullscreen Mushaf Page Viewer Sub-Modal (Minimalist Enlarged View) */}
        {currentItem && (
          <MushafPageViewerModal
            pageNumber={fullViewerPage ?? currentItem.pageNumber}
            isOpen={isFullViewerOpen}
            onClose={() => {
              setIsFullViewerOpen(false);
              setFullViewerPage(null);
            }}
            onNavigatePage={(p) => setFullViewerPage(p)}
            onOpenFeedback={() => setIsFeedbackOpen(true)}
            minimal={true}
            hideAudioDock={true}
          />
        )}
      </div>
    </div>
  );
};
