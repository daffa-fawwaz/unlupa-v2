import React, { useState, useMemo } from 'react';
import { ClassStudent, ClassGroup, BookItem, Chapter } from '../../types';
import { useApp } from '../../context/AppContext';
import { isDue, getIntervalDays, updateNonQuranFSRS, calculateRetrievability, predictNonQuranIntervals } from '../../lib/fsrs';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Award, 
  CheckCircle2, 
  UserMinus, 
  Printer, 
  Share2, 
  Layers, 
  Brain, 
  TrendingUp, 
  Check, 
  RotateCcw, 
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Sparkles,
  BookMarked,
  RefreshCw,
} from "lucide-react";
import { soundEffects } from '../../lib/soundFeedback';
import { BilingualCardText } from "../common/BilingualCardText";
import { TeacherReportPrintView } from "./TeacherReportPrintView";
import './teacher-clay.css';

interface StudentBookViewProps {
  student: ClassStudent;
  classGroup: ClassGroup;
  onClose: () => void;
}

type Rating = 1 | 2 | 3 | 4;

/** Rating meta shared by the grading buttons and the "already graded" state. */
const RATING_META: Record<Rating, { label: string; variant: string; title: string }> = {
  1: { label: "Lagi", variant: "clay-rating-rose", title: "Perlu Belajar Ulang" },
  2: { label: "Sulit", variant: "clay-rating-gold", title: "Masih Sulit" },
  3: { label: "Bagus", variant: "clay-rating-emerald", title: "Sudah Paham" },
  4: { label: "Mudah", variant: "clay-rating-orange", title: "Sangat Menguasai" },
};

export const StudentBookView: React.FC<StudentBookViewProps> = ({
  student,
  classGroup,
  onClose,
}) => {
  const {
    books,
    chapters,
    items,
    userProfile,
    getLiveStudentBookItems,
    reviewStudentBookItem,
    activateStudentBookItem,
    deactivateStudentBookItem,
    bypassStudentBookItemMapan,
    removeStudentFromClass,
  } = useApp();

  const assignedBookId = classGroup.assignedBookIds?.[0] || books[0]?.id || 'book-1';
  const assignedPkg = classGroup.assignedBooksData?.find((p: any) => p?.book?.id === assignedBookId || p?.book?.masterBookId === assignedBookId) || classGroup.assignedBooksData?.[0];
  const assignedBook = assignedPkg?.book || books.find(b => b.id === assignedBookId) || books[0];
  const assignedClassBookId = `class-book-${classGroup.id}-${assignedBookId}`;
  const isCurrentUser = student.id === userProfile.id || student.id === `std-user-${userProfile.id}` || (student.name && userProfile.fullName && student.name.toLowerCase().includes(userProfile.fullName.toLowerCase()));

  // Local state
  const [viewMode, setViewMode] = useState<
    "chapters" | "testing" | "retention"
  >("chapters");
  const [searchFilter, setSearchFilter] = useState("");
  const [filterDueOnly, setFilterDueOnly] = useState(false);
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(
    null,
  );
  const [testingCardIndex, setTestingCardIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [localReviewedItems, setLocalReviewedItems] = useState<Record<string, { rating: 1 | 2 | 3 | 4; reviewedAt: string }>>({});
  // Which cards are currently flipped to the answer side — same flip mechanic
  // as the bab/sub-bab review page in the student's own book view.
  const [revealedItemIds, setRevealedItemIds] = useState<Record<string, boolean>>({});
  // Cards the teacher explicitly unlocked to re-grade after a first assessment.
  const [regradingItemIds, setRegradingItemIds] = useState<Record<string, boolean>>({});

  // Chapters of the assigned book
  const bookChapters = useMemo(() => {
    if (assignedPkg?.chapters && assignedPkg.chapters.length > 0) return assignedPkg.chapters;
    const direct = chapters.filter(c => c.bookId === assignedBookId || c.bookId === assignedClassBookId);
    if (direct.length > 0) return direct;
    return chapters.filter(c => c.bookId === assignedBook?.id);
  }, [assignedPkg, chapters, assignedBookId, assignedClassBookId, assignedBook?.id]);

  // Student items for this book
  const studentItems: BookItem[] = useMemo(() => {
    const rawLive = getLiveStudentBookItems(student.id);

    const masterItems = (assignedPkg?.items && assignedPkg.items.length > 0)
      ? assignedPkg.items
      : items.filter(i => i.bookId === assignedBookId || i.bookId === assignedBook?.id);

    const studentMap = new Map<string, BookItem>();
    const registerItem = (it: BookItem) => {
      if (!it) return;
      if (it.id) studentMap.set(it.id, it);
      if (it.masterItemId) studentMap.set(it.masterItemId, it);
      if (it.id && it.id.startsWith('class-item-')) {
        const parts = it.id.split('-');
        if (parts.length >= 5) {
          const suffixUuid = parts.slice(-5).join('-');
          studentMap.set(suffixUuid, it);
        }
      }
      if (it.question) {
        studentMap.set(`q:${it.question.trim().toLowerCase()}`, it);
      }
    };

    if (Array.isArray(student.bookItemsData)) {
      student.bookItemsData.forEach(registerItem);
    }
    if (Array.isArray(rawLive)) {
      rawLive.forEach(registerItem);
    }
    if (isCurrentUser) {
      items.filter(i => 
        i.bookId === assignedBookId || 
        i.bookId === assignedClassBookId ||
        i.bookId?.startsWith(`class-book-${classGroup.id}-`)
      ).forEach(registerItem);
    }

    if (masterItems.length === 0) {
      return (student.bookItemsData && student.bookItemsData.length > 0) 
        ? student.bookItemsData 
        : (rawLive || []);
    }

    return masterItems.map(m => {
      const found = studentMap.get(m.id) ||
        (m.masterItemId ? studentMap.get(m.masterItemId) : undefined) ||
        (m.id?.startsWith('class-item-') ? studentMap.get(m.id.split('-').slice(-5).join('-')) : undefined) ||
        (m.question ? studentMap.get(`q:${m.question.trim().toLowerCase()}`) : undefined);

      const localReview = localReviewedItems[m.id] || 
        (found?.id && localReviewedItems[found.id]) || 
        (m.masterItemId && localReviewedItems[m.masterItemId]) ||
        (m.id?.startsWith('class-item-') ? localReviewedItems[m.id.split('-').slice(-5).join('-')] : undefined);

      if (found || localReview) {
        const baseFsrs = found?.fsrsData || m.fsrsData;
        let finalFsrs = baseFsrs;
        let finalStatus = found?.status || (found?.isActive ? 'active' : 'inactive');

        if (localReview) {
          const { newState, nextIntervalDays } = updateNonQuranFSRS(baseFsrs, localReview.rating);
          finalFsrs = newState;
          finalStatus = nextIntervalDays >= 375 ? 'mastered' : 'active';
        }

        return {
          ...m,
          isActive: Boolean(found?.isActive) || Boolean(localReview),
          status: finalStatus,
          fsrsData: finalFsrs,
          reviewLogs: found?.reviewLogs || []
        };
      }
      return {
        ...m,
        isActive: false,
        status: "inactive" as const,
        fsrsData: {
          stability: 0,
          difficulty: 5.0,
          reps: 0,
          lapses: 0,
          lastReview: null,
          nextReview: null,
          state: "new" as const,
        },
        reviewLogs: [],
      };
    });
  }, [getLiveStudentBookItems, student.id, student.bookItemsData, items, assignedBookId, assignedClassBookId, assignedBook?.id, assignedPkg, isCurrentUser, classGroup.id, localReviewedItems]);

  const activeItems = useMemo(
    () => studentItems.filter((i) => i.isActive),
    [studentItems],
  );
  const dueItems = useMemo(
    () =>
      activeItems.filter((i) =>
        isDue(i.fsrsData?.nextReview, i.isActive, i.fsrsData?.lastReview),
      ),
    [activeItems],
  );
  const masteredItems = useMemo(
    () =>
      activeItems.filter(
        (i) => (i.fsrsData?.stability || 0) >= 300 || i.status === "mastered",
      ),
    [activeItems],
  );

  const computedAverageStability = useMemo(() => {
    if (activeItems.length === 0) return student.averageStability || 0;
    const total = activeItems.reduce(
      (acc, i) => acc + (i.fsrsData?.stability || 0),
      0,
    );
    return Math.round((total / activeItems.length) * 10) / 10;
  }, [activeItems, student.averageStability]);

  const retentionRate = useMemo(() => {
    if (activeItems.length === 0) {
      if (!computedAverageStability) return 0;
      return Math.round(calculateRetrievability(computedAverageStability, 1) * 100);
    }
    const now = Date.now();
    let totalRetrievability = 0;
    for (const it of activeItems) {
      const s = it.fsrsData?.stability || 0;
      if (s <= 0) {
        totalRetrievability += 0.90;
        continue;
      }
      const lastRev = it.fsrsData?.lastReview;
      const daysPassed = lastRev 
        ? Math.max(0, (now - new Date(lastRev).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      totalRetrievability += calculateRetrievability(s, daysPassed);
    }
    return Math.min(100, Math.max(0, Math.round((totalRetrievability / activeItems.length) * 100)));
  }, [activeItems, computedAverageStability]);

  const retentionProjections = useMemo(() => {
    const s = computedAverageStability;
    const intervals = [
      { day: "Hari ke-1 (Setelah Setoran)", days: 1 },
      { day: "Hari ke-3", days: 3 },
      { day: "Hari ke-7 (Minggu Pertama)", days: 7 },
      { day: "Hari ke-14 (2 Minggu)", days: 14 },
      { day: "Hari ke-30 (1 Bulan)", days: 30 },
      { day: "Hari ke-60 (2 Bulan)", days: 60 },
    ];

    return intervals.map(intv => {
      let prob = 0;
      if (s > 0) {
        prob = Math.round(calculateRetrievability(s, intv.days) * 100);
      } else {
        prob = Math.max(10, Math.round(100 / (1 + intv.days * 0.5)));
      }

      let color = "bg-emerald-500";
      if (prob < 60) color = "bg-rose-500";
      else if (prob < 75) color = "bg-amber-500";
      else if (prob < 85) color = "bg-blue-500";
      else if (prob < 93) color = "bg-emerald-400";

      return {
        day: intv.day,
        prob,
        color
      };
    });
  }, [computedAverageStability]);

  const handleGradeCard = (itemId: string, rating: 1 | 2 | 3 | 4) => {
    setLocalReviewedItems(prev => ({
      ...prev,
      [itemId]: { rating, reviewedAt: new Date().toISOString() }
    }));
    // Lock the card again after a corrected assessment, so it can only be
    // graded once more (and only deliberately).
    setRegradingItemIds(prev => {
      if (!(itemId in prev)) return prev;
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    reviewStudentBookItem(classGroup.id, student.id, itemId, rating);
    const labels: Record<number, string> = {
      1: "Perlu Belajar Ulang (Again)",
      2: "Masih Sulit (Hard)",
      3: "Sudah Paham (Good)",
      4: "Sangat Menguasai (Easy)",
    };
    setActionNotice(
      `Kartu dinilai "${labels[rating]}". Stabilitas memori santri diperbarui.`,
    );
    setTimeout(() => setActionNotice(null), 3000);
  };

  const isItemRevealed = (itemId: string) => Boolean(revealedItemIds[itemId]);

  const flipItem = (itemId: string, reveal: boolean) => {
    soundEffects.playCardFlip(reveal ? "forward" : "backward");
    setRevealedItemIds((prev) => ({ ...prev, [itemId]: reveal }));
  };

  /** Next-review interval each rating would produce, like the review page. */
  const getRatingIntervals = (item: BookItem) => {
    try {
      const prediction = predictNonQuranIntervals(item.fsrsData);
      return {
        again: prediction.again,
        hard: prediction.hard,
        good: prediction.good,
        easy: prediction.easy,
      };
    } catch {
      return { again: "1d", hard: "2d", good: "3d", easy: "4d" };
    }
  };

  const testingIntervals = activeItems[testingCardIndex]
    ? getRatingIntervals(activeItems[testingCardIndex])
    : { again: "1d", hard: "2d", good: "3d", easy: "4d" };

  /** The rating this teacher already gave the card in this session, if any. */
  const getLocalReview = (item?: BookItem) => {
    if (!item) return undefined;
    return (
      localReviewedItems[item.id] ||
      (item.masterItemId ? localReviewedItems[item.masterItemId] : undefined) ||
      (item.id?.startsWith("class-item-")
        ? localReviewedItems[item.id.split("-").slice(-5).join("-")]
        : undefined)
    );
  };

  const currentTestingItem = activeItems[testingCardIndex];
  const testingGradedRating = getLocalReview(currentTestingItem)?.rating;

  /**
   * A card that already has an assessment for today is locked so it cannot be
   * graded twice by accident — same guard as the student's own review page.
   * This also survives a page reload because the server-side review date is
   * checked too, not just this session's local state.
   */
  const isItemLocked = (item?: BookItem) => {
    if (!item) return false;
    if (getLocalReview(item)) return !regradingItemIds[item.id];

    const lastReview = item.fsrsData?.lastReview;
    if (!lastReview) return false;
    const last = new Date(lastReview);
    const now = new Date();
    const reviewedToday =
      last.getFullYear() === now.getFullYear() &&
      last.getMonth() === now.getMonth() &&
      last.getDate() === now.getDate();
    return reviewedToday && !regradingItemIds[item.id];
  };

  const unlockRegrade = (itemId: string) =>
    setRegradingItemIds((prev) => ({ ...prev, [itemId]: true }));

  const handleShareWhatsApp = () => {
    const reportData = {
      studentName: student.name,
      studentId: student.quranSpaceCode || student.id,
      className: classGroup.name,
      teacherName: userProfile.fullName,
      date: new Date().toISOString(),
    };
    const encoded = btoa(encodeURIComponent(JSON.stringify(reportData)));
    const shareUrl = `${window.location.origin}?report=${encoded}`;

    if (navigator.share) {
      navigator
        .share({
          title: `Rapor Kitab: ${student.name}`,
          text: `Assalamu'alaikum, berikut laporan hafalan kitab santri atas nama ${student.name} pada kelas ${classGroup.name}:`,
          url: shareUrl,
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            navigator.clipboard.writeText(shareUrl).then(() => {
              alert(
                "Link rapor berhasil disalin! Silakan bagikan ke wali santri.",
              );
            });
          }
        });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert("Link rapor berhasil disalin! Silakan bagikan ke wali santri.");
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[110] clay-teacher-scope clay-teacher-canvas overflow-y-auto">
      {/* Sticky Teacher Navigation Bar */}
      <div className="print:hidden sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer shrink-0"
            title="Kembali ke Kelas"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali ke Kelas</span>
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block leading-tight truncate">
                {student.name}
              </span>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-md font-mono font-semibold shrink-0">
                {student.quranSpaceCode || "SANTRI"}
              </span>
              <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Kitab Santri
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block truncate">
              {classGroup.name} •{" "}
              <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                {assignedBook?.title}
              </strong>
            </span>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("chapters")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "chapters"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Materi Bab
            </button>
            <button
              onClick={() => {
                setViewMode("testing");
                setTestingCardIndex(0);
                setIsAnswerRevealed(false);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "testing"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Uji Hafalan</span>
            </button>
            <button
              onClick={() => setViewMode("retention")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "retention"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Brain className="w-3 h-3 text-indigo-500" />
              <span>Kurva Daya Ingat</span>
            </button>
          </div>

          <button
            onClick={handleShareWhatsApp}
            className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            title="Bagikan Link Rapor ke WhatsApp"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            title="Cetak Laporan Rapor (PDF)"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (
                window.confirm(
                  `Keluarkan ${student.name} dari daftar santri kelas ini?`,
                )
              ) {
                removeStudentFromClass(classGroup.id, student.id);
                onClose();
              }
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/50 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            title="Keluarkan santri dari kelas ini"
          >
            <UserMinus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <TeacherReportPrintView
        classGroup={classGroup}
        student={student}
        teacher={userProfile}
      />

      {/* Main Content Focused Strictly on this Student's Assigned Book */}
      <div className="print:hidden p-3 sm:p-6 pb-24 max-w-5xl mx-auto space-y-5 animate-in fade-in duration-200">
        {/* Mobile View Mode Switcher */}
        <div className="flex sm:hidden items-center justify-around bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setViewMode("chapters")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
              viewMode === "chapters"
                ? "bg-white dark:bg-slate-900 shadow-2xs text-slate-900 dark:text-white"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Materi Bab
          </button>
          <button
            onClick={() => {
              setViewMode("testing");
              setTestingCardIndex(0);
              setIsAnswerRevealed(false);
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
              viewMode === "testing"
                ? "bg-white dark:bg-slate-900 shadow-2xs text-indigo-600 dark:text-indigo-400"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Uji Hafalan
          </button>
          <button
            onClick={() => setViewMode("retention")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
              viewMode === "retention"
                ? "bg-white dark:bg-slate-900 shadow-2xs text-indigo-600 dark:text-indigo-400"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Kurva Ingat
          </button>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* 4 Hero Metric Cards for this Book */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Materi Aktif
              </span>
              <BookOpen className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {activeItems.length}{" "}
              <span className="text-xs font-normal text-slate-400">
                / {studentItems.length}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Tugas Review
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div
              className={`text-2xl font-black ${dueItems.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}
            >
              {dueItems.length}{" "}
              <span className="text-xs font-normal text-slate-400">
                hari ini
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Mapan / Mutqin
              </span>
              <Award className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {masteredItems.length}{" "}
              <span className="text-xs font-normal text-slate-400">kartu</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Tingkat Retensi
              </span>
              <Brain className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {retentionRate}%{" "}
              <span className="text-xs font-normal text-slate-400">est.</span>
            </div>
          </div>
        </div>

        {/* VIEW MODE 1: CHAPTERS & FLASHCARDS EXPLORER */}
        {viewMode === "chapters" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Daftar Bab & Materi Kartu Santri
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterDueOnly(!filterDueOnly)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    filterDueOnly
                      ? "bg-amber-500 border-amber-600 text-white shadow-2xs"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {filterDueOnly
                    ? "Tampilkan Semua"
                    : `Hanya Perlu Review (${dueItems.length})`}
                </button>
              </div>
            </div>

            {bookChapters.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Belum Ada Bab Materi
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Kitab ini belum memiliki bab yang dibuat.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookChapters.map((chap, idx) => {
                  let chapItems = studentItems.filter(
                    (i) => i.chapterId === chap.id,
                  );
                  if (filterDueOnly) {
                    chapItems = chapItems.filter(
                      (i) =>
                        i.isActive &&
                        isDue(
                          i.fsrsData?.nextReview,
                          i.isActive,
                          i.fsrsData?.lastReview,
                        ),
                    );
                  }
                  const activeCount = chapItems.filter(
                    (i) => i.isActive,
                  ).length;
                  const isExpanded =
                    expandedChapterId === chap.id ||
                    (expandedChapterId === null && idx === 0);

                  return (
                    <div
                      key={chap.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
                    >
                      <button
                        onClick={() =>
                          setExpandedChapterId(isExpanded ? null : chap.id)
                        }
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                              {chap.title}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {chapItems.length} kartu materi • {activeCount}{" "}
                              aktif dipelajari
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {activeCount} Aktif
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 pt-0 space-y-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30">
                          {chapItems.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-3 text-center">
                              {filterDueOnly
                                ? "Tidak ada kartu yang jatuh tempo di bab ini."
                                : "Belum ada kartu materi dalam bab ini."}
                            </p>
                          ) : (
                            chapItems.map((item, itemIdx) => {
                              const itemDue = isDue(
                                item.fsrsData?.nextReview,
                                item.isActive,
                                item.fsrsData?.lastReview,
                              );
                              const ratingIntervals = getRatingIntervals(item);
                              const gradedRating = getLocalReview(item)?.rating;
                              return (
                                <div
                                  key={item.id}
                                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs shadow-2xs"
                                >
                                  {/* Top Bar of Card */}
                                  <div className="flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-slate-400">
                                        #{itemIdx + 1}
                                      </span>
                                      {item.isActive ? (
                                        itemDue ? (
                                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                                            Perlu Review (Due)
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold text-[10px]">
                                            Aman Terjadwal
                                          </span>
                                        )
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]">
                                          Belum Diaktivasi
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-400">
                                        Stabilitas:{" "}
                                        <strong className="text-indigo-600 dark:text-indigo-400">
                                          {getIntervalDays(item.fsrsData)} hari
                                        </strong>{" "}
                                        • {item.fsrsData?.reps || 0}x
                                      </span>
                                      <button
                                        onClick={() => {
                                          if (item.isActive) {
                                            deactivateStudentBookItem(
                                              classGroup.id,
                                              student.id,
                                              item.id,
                                            );
                                            setActionNotice(
                                              "Kartu dinonaktifkan.",
                                            );
                                          } else {
                                            activateStudentBookItem(
                                              classGroup.id,
                                              student.id,
                                              item.id,
                                            );
                                            setActionNotice(
                                              "Kartu diaktifkan untuk santri.",
                                            );
                                          }
                                          setTimeout(
                                            () => setActionNotice(null),
                                            2500,
                                          );
                                        }}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                          item.isActive
                                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                        }`}
                                      >
                                        {item.isActive
                                          ? "Nonaktifkan"
                                          : "Aktifkan"}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Card Question & Answer — clay flip card, same as the bab/sub-bab review page */}
                                  <div className="space-y-1.5">
                                    {!isItemRevealed(item.id) ? (
                                      /* FRONT CARD (QUESTION) */
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          flipItem(item.id, true);
                                        }}
                                        className="w-full p-3 sm:p-4 rounded-2xl clay-card-subtle bg-[#EEF3FA] dark:bg-[#121B2B] border border-slate-200/80 dark:border-slate-800 hover:border-amber-400/50 dark:hover:border-amber-600/50 transition-all cursor-pointer group/card flex flex-col gap-2.5 relative animate-card-flip-reverse"
                                      >
                                        <div className="flex items-center justify-between gap-2 w-full">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                            Pertanyaan / Matan
                                          </span>

                                          <div
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              flipItem(item.id, true);
                                            }}
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl clay-pill text-amber-600 dark:text-amber-400 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer shadow-2xs group-hover/card:scale-105"
                                            title="Klik untuk balik kartu"
                                          >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold">
                                              Balik
                                            </span>
                                          </div>
                                        </div>

                                        <div className="w-full select-text p-2.5 sm:p-3 rounded-xl bg-[rgba(255,255,255,0.62)] dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60 shadow-2xs">
                                          <BilingualCardText
                                            text={item.question}
                                            type="question"
                                            variant="card-list"
                                            clampLines={false}
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      /* BACK CARD (ANSWER) */
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          flipItem(item.id, false);
                                        }}
                                        className="w-full p-3 sm:p-4 rounded-2xl clay-card-subtle bg-[#FEFCE8] dark:bg-[#1F1B16] border border-amber-200/80 dark:border-amber-900/40 shadow-sm cursor-pointer group/card flex flex-col gap-2.5 relative animate-card-flip"
                                      >
                                        <div className="flex items-center justify-between gap-2 w-full">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                            Jawaban
                                          </span>

                                          <div
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              flipItem(item.id, false);
                                            }}
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl clay-pill text-amber-700 dark:text-amber-300 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer shadow-2xs group-hover/card:scale-105"
                                            title="Klik untuk balik ke pertanyaan"
                                          >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold">
                                              Tanya
                                            </span>
                                          </div>
                                        </div>

                                        <div className="w-full select-text p-2.5 sm:p-3 rounded-xl bg-[rgba(255,255,255,0.72)] dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 shadow-2xs">
                                          <BilingualCardText
                                            text={item.answer}
                                            type="answer"
                                            variant="card-list"
                                            clampLines={false}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Teacher Review Grading Buttons — same clay rating component as the review page */}
                                  <div className="pt-2 border-t border-black/[0.03] dark:border-white/[0.04] flex items-center justify-between gap-2 flex-wrap">
                                    {isItemLocked(item) ? (
                                      /* Already assessed — locked so the card cannot be graded twice by accident */
                                      <>
                                        <span
                                          className={`clay-rating-btn ${gradedRating ? RATING_META[gradedRating].variant : "clay-rating-emerald"} clay-badge-static`}
                                          title={gradedRating ? RATING_META[gradedRating].title : "Sudah dinilai hari ini"}
                                        >
                                          <Check />
                                          <span>
                                            {gradedRating
                                              ? `Sudah Dinilai: ${RATING_META[gradedRating].label}`
                                              : "Sudah Dinilai Hari Ini"}
                                          </span>
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            unlockRegrade(item.id);
                                          }}
                                          className="clay-inset clay-chip text-[#5E6D88] dark:text-slate-300 cursor-pointer hover:text-[#FF6F3D] transition-colors"
                                          title="Ubah nilai setoran kartu ini"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                          <span>Ubah Nilai</span>
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-[10px] font-semibold text-slate-400">
                                          Nilai Setoran Santri:
                                        </span>
                                        <div className="grid grid-cols-4 gap-1.5 flex-1 min-w-[210px] max-w-[300px]">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleGradeCard(item.id, 1);
                                            }}
                                            className="py-1.5 px-1 rounded-xl clay-rating-btn clay-rating-rose text-center transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                                            title="Perlu Belajar Ulang"
                                          >
                                            <span className="text-[11px] font-bold leading-tight">
                                              Lagi
                                            </span>
                                            <span className="text-[9px] font-bold opacity-85 mt-0.5">
                                              {ratingIntervals.again}
                                            </span>
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleGradeCard(item.id, 2);
                                            }}
                                            className="py-1.5 px-1 rounded-xl clay-rating-btn clay-rating-gold text-center transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                                            title="Masih Sulit"
                                          >
                                            <span className="text-[11px] font-bold leading-tight">
                                              Sulit
                                            </span>
                                            <span className="text-[9px] font-bold opacity-85 mt-0.5">
                                              {ratingIntervals.hard}
                                            </span>
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleGradeCard(item.id, 3);
                                            }}
                                            className="py-1.5 px-1 rounded-xl clay-rating-btn clay-rating-emerald text-center transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                                            title="Sudah Paham (Bagus)"
                                          >
                                            <span className="text-[11px] font-bold leading-tight">
                                              Bagus
                                            </span>
                                            <span className="text-[9px] font-bold opacity-85 mt-0.5">
                                              {ratingIntervals.good}
                                            </span>
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleGradeCard(item.id, 4);
                                            }}
                                            className="py-1.5 px-1 rounded-xl clay-rating-btn clay-rating-orange text-center transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                                            title="Sangat Menguasai (Mudah)"
                                          >
                                            <span className="text-[11px] font-bold leading-tight">
                                              Mudah
                                            </span>
                                            <span className="text-[9px] font-bold opacity-85 mt-0.5">
                                              {ratingIntervals.easy}
                                            </span>
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW MODE 2: INTERACTIVE TESTING SESSION */}
        {viewMode === "testing" && (
          <div className="space-y-4 max-w-2xl mx-auto">
            {activeItems.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-base text-slate-800 dark:text-slate-200">
                  Belum Ada Kartu yang Diaktivasi
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Silakan aktivasi kartu terlebih dahulu pada tab "Materi Bab"
                  agar santri dapat diuji.
                </p>
                <button
                  onClick={() => setViewMode("chapters")}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                >
                  Buka Materi Bab
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Kartu {testingCardIndex + 1} dari {activeItems.length}
                  </span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    Mode Pengujian Lisan Santri
                  </span>
                </div>

                  {/* The Flashcard — same clay flip card as the bab/sub-bab review page */}
                  <div className="p-3 sm:p-4 rounded-2xl clay-card-subtle bg-[#EEF3FA] dark:bg-[#121B2B] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                        {bookChapters.find(
                          (c) =>
                            c.id === activeItems[testingCardIndex]?.chapterId,
                        )?.title || "Pertanyaan"}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        Stabilitas:{" "}
                        {getIntervalDays(activeItems[testingCardIndex]?.fsrsData)}{" "}
                        hari
                      </span>
                    </div>

                    {!isAnswerRevealed ? (
                      /* FRONT CARD (QUESTION) */
                      <div
                        onClick={() => {
                          soundEffects.playCardFlip("forward");
                          setIsAnswerRevealed(true);
                        }}
                        className="w-full p-3 sm:p-4 rounded-2xl clay-card-subtle bg-[#EEF3FA] dark:bg-[#121B2B] border border-slate-200/80 dark:border-slate-800 hover:border-amber-400/50 dark:hover:border-amber-600/50 transition-all cursor-pointer group/card flex flex-col gap-2.5 relative animate-card-flip-reverse"
                      >
                        <div className="flex items-center justify-between gap-2 w-full">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Soal / Matan
                          </span>

                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              soundEffects.playCardFlip("forward");
                              setIsAnswerRevealed(true);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl clay-pill text-amber-600 dark:text-amber-400 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer shadow-2xs group-hover/card:scale-105"
                            title="Klik untuk balik kartu"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">
                              Balik
                            </span>
                          </div>
                        </div>

                        <div className="w-full select-text p-2.5 sm:p-3 rounded-xl bg-[rgba(255,255,255,0.62)] dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60 shadow-2xs">
                          <BilingualCardText
                            text={activeItems[testingCardIndex]?.question}
                            type="question"
                            variant="card-list"
                            clampLines={false}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                      /* BACK CARD (ANSWER) */
                      <div
                        onClick={() => {
                          soundEffects.playCardFlip("backward");
                          setIsAnswerRevealed(false);
                        }}
                        className="w-full p-3 sm:p-4 rounded-2xl clay-card-subtle bg-[#FEFCE8] dark:bg-[#1F1B16] border border-amber-200/80 dark:border-amber-900/40 shadow-sm cursor-pointer group/card flex flex-col gap-2.5 relative animate-card-flip"
                      >
                        <div className="flex items-center justify-between gap-2 w-full">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            Kunci Jawaban
                          </span>

                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              soundEffects.playCardFlip("backward");
                              setIsAnswerRevealed(false);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl clay-pill text-amber-700 dark:text-amber-300 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer shadow-2xs group-hover/card:scale-105"
                            title="Klik untuk balik ke pertanyaan"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">
                              Tanya
                            </span>
                          </div>
                        </div>

                        <div className="w-full select-text p-2.5 sm:p-3 rounded-xl bg-[rgba(255,255,255,0.72)] dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 shadow-2xs">
                          <BilingualCardText
                            text={activeItems[testingCardIndex]?.answer}
                            type="answer"
                            variant="card-list"
                            clampLines={false}
                          />
                        </div>
                      </div>

                      {/* Grading Action — same clay rating component as the review page */}
                      <div className="space-y-2">
                        {isItemLocked(currentTestingItem) ? (
                          /* Already assessed — locked so the card cannot be graded twice by accident */
                          <div className="flex flex-col items-center gap-2">
                            <span
                              className={`clay-rating-btn ${testingGradedRating ? RATING_META[testingGradedRating].variant : "clay-rating-emerald"} clay-badge-static`}
                              title={testingGradedRating ? RATING_META[testingGradedRating].title : "Sudah dinilai hari ini"}
                            >
                              <Check />
                              <span>
                                {testingGradedRating
                                  ? `Sudah Dinilai: ${RATING_META[testingGradedRating].label}`
                                  : "Sudah Dinilai Hari Ini"}
                              </span>
                            </span>
                            <button
                              onClick={() =>
                                currentTestingItem && unlockRegrade(currentTestingItem.id)
                              }
                              className="clay-inset clay-chip text-[#5E6D88] dark:text-slate-300 cursor-pointer hover:text-[#FF6F3D] transition-colors"
                              title="Ubah nilai setoran kartu ini"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Ubah Nilai</span>
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-[10px] font-semibold text-slate-400 block text-center">
                              Nilai Setoran Santri:
                            </span>
                            <div className="grid grid-cols-4 gap-1.5">
                          <button
                            onClick={() => {
                              handleGradeCard(
                                activeItems[testingCardIndex].id,
                                1,
                              );
                              setIsAnswerRevealed(false);
                              setTestingCardIndex(
                                (prev) => (prev + 1) % activeItems.length,
                              );
                            }}
                            className="py-1.5 px-1 rounded-xl clay-rating-btn clay-rating-rose text-center transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                            title="Perlu Belajar Ulang"
                          >
                            <span className="text-[11px] font-bold leading-tight">
                              Lagi
                            </span>
                            <span className="text-[9px] font-bold opacity-85 mt-0.5">
                              {testingIntervals.again}
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              handleGradeCard(
                                activeItems[testingCardIndex].id,
                                2,
                              );
                              setIsAnswerRevealed(false);
                              setTestingCardIndex(
                                (prev) => (prev + 1) % activeItems.length,
                              );
                            }}
                            className="py-1.5 px-1 rounded-xl clay-rating-btn clay-rating-gold text-center transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                            title="Masih Sulit"
                          >
                            <span className="text-[11px] font-bold leading-tight">
                              Sulit
                            </span>
                            <span className="text-[9px] font-bold opacity-85 mt-0.5">
                              {testingIntervals.hard}
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              handleGradeCard(
                                activeItems[testingCardIndex].id,
                                3,
                              );
                              setIsAnswerRevealed(false);
                              setTestingCardIndex(
                                (prev) => (prev + 1) % activeItems.length,
                              );
                            }}
                            className="py-1.5 px-1 rounded-xl clay-rating-btn clay-rating-emerald text-center transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                            title="Sudah Paham (Bagus)"
                          >
                            <span className="text-[11px] font-bold leading-tight">
                              Bagus
                            </span>
                            <span className="text-[9px] font-bold opacity-85 mt-0.5">
                              {testingIntervals.good}
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              handleGradeCard(
                                activeItems[testingCardIndex].id,
                                4,
                              );
                              setIsAnswerRevealed(false);
                              setTestingCardIndex(
                                (prev) => (prev + 1) % activeItems.length,
                              );
                            }}
                            className="py-1.5 px-1 rounded-xl clay-rating-btn clay-rating-orange text-center transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                            title="Sangat Menguasai (Mudah)"
                          >
                            <span className="text-[11px] font-bold leading-tight">
                              Mudah
                            </span>
                            <span className="text-[9px] font-bold opacity-85 mt-0.5">
                              {testingIntervals.easy}
                            </span>
                          </button>
                            </div>
                          </>
                        )}
                      </div>
                      </>
                    )}
                  </div>

                {/* Navigation Between Cards */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setIsAnswerRevealed(false);
                      setTestingCardIndex((prev) =>
                        prev > 0 ? prev - 1 : activeItems.length - 1,
                      );
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                  >
                    ← Sebelumnya
                  </button>
                  <button
                    onClick={() => {
                      setIsAnswerRevealed(false);
                      setTestingCardIndex(
                        (prev) => (prev + 1) % activeItems.length,
                      );
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                  >
                    Lewati / Berikutnya →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW MODE 3: KURVA DAYA INGAT (RETENTION CURVE) */}
        {viewMode === "retention" && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50 via-emerald-50/40 to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-indigo-200/60 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    Kurva Daya Ingat & Retensi Hafalan Kitab
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Analisis daya tahan memori santri pada kitab{" "}
                    <strong>{assignedBook?.title}</strong>.
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-center shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Stabilitas Rata-rata
                  </span>
                  <span className="text-lg font-black text-indigo-700 dark:text-indigo-300">
                    {computedAverageStability} hari
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-center shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Materi Aktif
                  </span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    {activeItems.length}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-center shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Tingkat Retensi
                  </span>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                    {retentionRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Retention Forecast */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Proyeksi Retensi Daya Ingat (FSRS-6 Memory Model)
                </h5>
                <span className="text-[10px] font-semibold text-slate-400">
                  Model Kurva Daya Ingat (FSRS-6)
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {retentionProjections.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.day}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.prob}% Retensi
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                        style={{ width: `${item.prob}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                💡 <strong>Catatan Pengajar:</strong> Kurva ini memproyeksikan
                estimasi daya ingat santri pada kitab ini. Uji hafalan secara
                berkala tepat saat jatuh tempo akan melipatgandakan interval
                stabilitas memori jangka panjang santri.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
