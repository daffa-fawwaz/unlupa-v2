import React, { useState, useMemo } from 'react';
import { ClassStudent, ClassGroup, BookItem, Chapter } from '../../types';
import { useApp } from '../../context/AppContext';
import { isDue, getIntervalDays, updateNonQuranFSRS, calculateRetrievability, predictNonQuranIntervals } from '../../lib/fsrs';
import { 
  ArrowLeft, 
  ArrowRight,
  BookOpen, 
  FileText, 
  CheckCircle2, 
  ChevronLeft,
  CircleDashed,
  Clock,
  Flame,
  Folder,
  Layers,
  MoreVertical,
  Play,
  Search,
  UserMinus, 
  Printer, 
  Share2, 
  ListOrdered,
  Brain, 
  TrendingUp, 
  Check, 
  RotateCcw, 
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  HelpCircle,
  Sparkles,
  BookMarked,
  RefreshCw,
} from "lucide-react";
import { soundEffects } from '../../lib/soundFeedback';
import { BilingualCardText } from "../common/BilingualCardText";
import { BookHeroCard } from "../personal/BookHeroCard";
import { ItemCardRow } from "../personal/ItemCardRow";
import { ItemPreviewModal } from "../personal/ItemPreviewModal";
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
    language,
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
  const [testingCardIndex, setTestingCardIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [localReviewedItems, setLocalReviewedItems] = useState<Record<string, { rating: 1 | 2 | 3 | 4; reviewedAt: string }>>({});
  // Which cards are currently flipped to the answer side — same flip mechanic
  // as the bab/sub-bab review page in the student's own book view.
  const [revealedItemIds, setRevealedItemIds] = useState<Record<string, boolean>>({});
  // Cards the teacher explicitly unlocked to re-grade after a first assessment.
  const [regradingItemIds, setRegradingItemIds] = useState<Record<string, boolean>>({});
  // Kebab menu + pop-up preview state for the shared card row component.
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<BookItem | null>(null);
  // Book → chapter → sub-chapter navigation, mirroring the book detail page.
  const [bookLevel, setBookLevel] = useState<"book" | "chapter" | "subchapter">("book");
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [activeSubChapterId, setActiveSubChapterId] = useState<string | null>(null);
  const [cardFilter, setCardFilter] = useState<"all" | "due" | "active" | "inactive">("all");
  const [cardSearch, setCardSearch] = useState("");
  const [chapterMenuId, setChapterMenuId] = useState<string | null>(null);

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

  const navigableChapters = bookChapters.filter((c) => !c.parentId);

  const openChapter = (chapterId: string) => {
    setActiveChapterId(chapterId);
    setActiveSubChapterId(null);
    setCardFilter("all");
    setCardSearch("");
    setBookLevel("chapter");
  };

  const openSubChapter = (subChapterId: string) => {
    setActiveSubChapterId(subChapterId);
    setCardFilter("all");
    setCardSearch("");
    setBookLevel("subchapter");
  };

  const goToBook = () => {
    setActiveChapterId(null);
    setActiveSubChapterId(null);
    setCardFilter("all");
    setCardSearch("");
    setBookLevel("book");
  };

  const stepChapter = (offset: number) => {
    if (!activeChapterId) return;
    const index = navigableChapters.findIndex((c) => c.id === activeChapterId);
    if (index < 0) return;
    const next = navigableChapters[index + offset];
    if (next) openChapter(next.id);
  };

  /** Card buckets + the filtered list for a chapter or sub-chapter. */
  const chapterCardData = (chapterId: string | null) => {
    const all = chapterId
      ? studentItems.filter((i) => i.chapterId === chapterId)
      : [];
    const due = all.filter(
      (i) =>
        i.isActive &&
        isDue(i.fsrsData?.nextReview, i.isActive, i.fsrsData?.lastReview),
    );
    const active = all.filter((i) => i.isActive);
    const inactive = all.filter((i) => !i.isActive);

    let filtered = all;
    if (cardFilter === "due") filtered = due;
    else if (cardFilter === "active") filtered = active;
    else if (cardFilter === "inactive") filtered = inactive;

    const query = cardSearch.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(
        (i) =>
          (i.question || "").toLowerCase().includes(query) ||
          (i.answer || "").toLowerCase().includes(query) ||
          (i.tags || []).some((t) => (t || "").toLowerCase().includes(query)),
      );
    }

    return { all, due, active, inactive, filtered };
  };

  return (
    <div className="fixed inset-0 z-[110] clay-teacher-canvas overflow-y-auto">
      {/* Sticky Teacher Navigation Bar */}
      <div className="print:hidden sticky top-0 z-40 bg-[#EBEEF5]/90 dark:bg-[#0E1626]/90 backdrop-blur-md border-b border-white/70 dark:border-white/5 px-3 sm:px-6 py-2.5 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl clay-pill text-xs font-semibold text-[#18234A] dark:text-[#F8FAFC] transition-colors shadow-2xs cursor-pointer shrink-0"
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
          <div className="hidden sm:flex items-center clay-inset p-1">
            <button
              onClick={() => setViewMode("chapters")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "chapters"
                  ? "clay-pill text-[#18234A] dark:text-[#F8FAFC] shadow-xs"
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
                  ? "clay-pill text-[#18234A] dark:text-[#F8FAFC] shadow-xs"
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
                  ? "clay-pill text-[#18234A] dark:text-[#F8FAFC] shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Brain className="w-3 h-3 text-indigo-500" />
              <span>Kurva Daya Ingat</span>
            </button>
          </div>

          <button
            onClick={handleShareWhatsApp}
            className="p-2 rounded-xl clay-pill text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            title="Bagikan Link Rapor ke WhatsApp"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl clay-pill text-slate-500 hover:text-[#FF6F3D] dark:hover:text-[#FF8A65] transition-colors cursor-pointer"
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
            className="p-2 rounded-xl clay-pill text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
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

      {/* Flashcard pop-up preview — same component as the book detail page */}
      <ItemPreviewModal
        item={previewItem}
        isOpen={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        language={language}
      />

      {/* Main Content Focused Strictly on this Student's Assigned Book */}
      <div className="print:hidden p-3 sm:p-6 pb-24 max-w-5xl mx-auto space-y-5 animate-in fade-in duration-200">
        {/* Action Notice */}
        {actionNotice && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Book Hero — identical to the student's own book detail page, plus the student's name */}
        <BookHeroCard
          book={assignedBook}
          items={studentItems}
          chapters={bookChapters}
          language={language}
          studentName={student.name}
          joinedClassBadge="Progres Santri"
          joinedClass={{
            id: classGroup.id,
            name: classGroup.name,
            code: classGroup.code,
            teacherName: classGroup.teacherName,
          }}
          linkedClasses={[
            {
              id: classGroup.id,
              name: classGroup.name,
              code: classGroup.code,
              teacherName: classGroup.teacherName,
              students: [student],
            },
          ]}
          isReadonly
          onBack={onClose}
          onStartReview={() => {
            setViewMode("testing");
            setTestingCardIndex(0);
            setIsAnswerRevealed(false);
          }}
        />

        {/* Mobile View Mode Switcher */}
        <div className="flex sm:hidden items-center justify-around clay-inset p-1">
          <button
            onClick={() => setViewMode("chapters")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
              viewMode === "chapters"
                ? "clay-pill text-[#18234A] dark:text-[#F8FAFC] shadow-xs"
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
                ? "clay-pill text-[#18234A] dark:text-[#F8FAFC] shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Uji Hafalan
          </button>
          <button
            onClick={() => setViewMode("retention")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
              viewMode === "retention"
                ? "clay-pill text-[#18234A] dark:text-[#F8FAFC] shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Kurva Ingat
          </button>
        </div>

        {/* VIEW MODE 1: BOOK -> CHAPTER -> SUB-CHAPTER (same flow as the book detail page) */}
        {viewMode === "chapters" && (
          <div className="space-y-3">
            {bookLevel === "book" && (
              <>
                {/* Table of Contents header */}
                <div className="flex items-center justify-between gap-2 px-1 w-full flex-nowrap">
                  <div className="flex items-center gap-2 shrink min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl clay-icon-pod-gold flex items-center justify-center shrink-0 shadow-xs">
                      <ListOrdered className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <h2 className="text-xs sm:text-base font-black text-[#451E08] dark:text-[#FDE68A] clay-title truncate">
                      Daftar Isi Kitab Santri
                    </h2>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
                    <button
                      type="button"
                      onClick={() => setFilterDueOnly(!filterDueOnly)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap ${
                        filterDueOnly
                          ? "clay-btn-primary text-white"
                          : "clay-pill text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC]"
                      }`}
                    >
                      {filterDueOnly
                        ? "Tampilkan Semua"
                        : `Hanya Perlu Review (${dueItems.length})`}
                    </button>
                  </div>
                </div>

                {navigableChapters.length === 0 ? (
                  <div className="p-8 text-center clay-card">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      Belum Ada Bab Materi
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Kitab ini belum memiliki bab yang dibuat.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {navigableChapters.map((chap) => {
                      const childChapters = bookChapters.filter(
                        (c) => c.parentId === chap.id,
                      );
                      const items = studentItems.filter(
                        (i) => i.chapterId === chap.id,
                      );

                      return (
                        <div
                          key={chap.id}
                          className="group flex items-center justify-between gap-2.5 rounded-2xl py-2.5 px-3 sm:px-3.5 clay-card-subtle hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-xs"
                        >
                          <div
                            className="flex items-center gap-2 min-w-0 flex-1"
                            onClick={() => openChapter(chap.id)}
                          >
                            <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                              <div className="w-2 h-2 rounded-full bg-[#F27A3D] shadow-xs" />
                            </div>
                            <div className="min-w-0 flex-1 flex items-center gap-2">
                              <h3 className="font-bold text-[#18234A] dark:text-[#F8FAFC] truncate group-hover:text-[#F27A3D] transition-colors text-xs sm:text-sm">
                                {chap.title}
                              </h3>
                              {chap.description && (
                                <span className="text-[11px] text-[#687086] dark:text-[#94A3B8] truncate hidden md:inline font-medium">
                                  — {chap.description}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            <span className="text-[10px] font-extrabold text-[#451E08] dark:text-[#FDE68A] clay-pill px-2 py-0.5 shadow-2xs whitespace-nowrap">
                              {items.length} item
                            </span>

                            {childChapters.length > 0 && (
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 clay-pill px-2 py-0.5 shadow-2xs whitespace-nowrap">
                                {childChapters.length} subbab
                              </span>
                            )}

                            <div className="relative shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setChapterMenuId(
                                    chapterMenuId === chap.id ? null : chap.id,
                                  );
                                }}
                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                                title="Pilihan"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {chapterMenuId === chap.id && (
                                <div
                                  className="absolute right-0 top-full mt-1 w-44 clay-card p-1 z-50 flex flex-col gap-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => {
                                      setChapterMenuId(null);
                                      setFilterDueOnly(true);
                                      openChapter(chap.id);
                                    }}
                                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] hover:bg-[#FF6F3D]/10 hover:text-[#FF6F3D] flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-[#FF6F3D]" />
                                    <span>Hanya Perlu Review</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setChapterMenuId(null);
                                      openChapter(chap.id);
                                    }}
                                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] hover:bg-[#FF6F3D]/10 hover:text-[#FF6F3D] flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <ArrowRight className="w-3.5 h-3.5 text-[#FF6F3D]" />
                                    <span>Buka Detail Bab</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            <ChevronRight className="w-4 h-4 text-[#687086] dark:text-[#94A3B8] shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {(bookLevel === "chapter" || bookLevel === "subchapter") &&
              activeChapterId && (() => {
                const isSubLevel =
                  bookLevel === "subchapter" && Boolean(activeSubChapterId);
                const activeChapter =
                  bookChapters.find((c) => c.id === activeChapterId) || null;
                if (!activeChapter) return null;

                const currentChapter = isSubLevel
                  ? bookChapters.find((c) => c.id === activeSubChapterId) ||
                    activeChapter
                  : activeChapter;
                const subChapters = bookChapters.filter(
                  (c) => c.parentId === activeChapter.id,
                );
                const data = chapterCardData(currentChapter.id);
                const siblings = isSubLevel ? subChapters : navigableChapters;
                const stepperIndex = siblings.findIndex(
                  (c) => c.id === currentChapter.id,
                );

                return (
                  <div className="space-y-3">
                    {/* Top bar: back + breadcrumb + chapter stepper */}
                    <div className="flex items-center justify-between gap-3 px-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => {
                            if (isSubLevel) {
                              setActiveSubChapterId(null);
                              setBookLevel("chapter");
                            } else {
                              goToBook();
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl clay-pill text-xs font-semibold text-[#18234A] dark:text-[#F8FAFC] cursor-pointer shrink-0"
                          title="Kembali"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Buku</span>
                        </button>

                        <div className="flex items-center gap-1 text-xs text-slate-500 overflow-x-auto no-scrollbar py-0.5 min-w-0">
                          <span
                            onClick={goToBook}
                            className="hover:text-[#FF6F3D] cursor-pointer font-medium truncate max-w-[120px] sm:max-w-[180px]"
                          >
                            {assignedBook?.title}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600 shrink-0">
                            /
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[220px]">
                            {currentChapter.title}
                          </span>
                        </div>
                      </div>

                      {siblings.length > 1 && (
                        <div className="hidden md:flex items-center gap-0.5 clay-inset p-0.5 rounded-lg">
                          <button
                            disabled={stepperIndex <= 0}
                            onClick={() => {
                              const previous = siblings[stepperIndex - 1];
                              if (!previous) return;
                              if (isSubLevel) openSubChapter(previous.id);
                              else openChapter(previous.id);
                            }}
                            className="p-1 rounded-md text-slate-600 dark:text-slate-300 disabled:opacity-25 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 px-1.5 select-none whitespace-nowrap">
                            {stepperIndex + 1} / {siblings.length}
                          </span>
                          <button
                            disabled={stepperIndex >= siblings.length - 1}
                            onClick={() => {
                              const next = siblings[stepperIndex + 1];
                              if (!next) return;
                              if (isSubLevel) openSubChapter(next.id);
                              else openChapter(next.id);
                            }}
                            className="p-1 rounded-md text-slate-600 dark:text-slate-300 disabled:opacity-25 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Chapter banner */}
                    <div className="clay-card py-2.5 px-3.5 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-2.5 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0 flex-wrap sm:flex-nowrap">
                        <h1 className="text-base sm:text-lg font-black text-[#18234A] dark:text-[#F8FAFC] truncate font-serif shrink-0 max-w-[200px] sm:max-w-[320px]">
                          {currentChapter.title}
                        </h1>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold clay-pill text-slate-600 dark:text-slate-300">
                            {data.all.length} Kartu
                          </span>

                          {data.due.length > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold clay-badge-orange flex items-center gap-1">
                              <Flame className="w-3 h-3 text-white" />
                              <span>{data.due.length} Perlu Diulang</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold clay-badge-emerald flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                              <span>Selesai</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 clay-pill px-2 py-0.5 shadow-2xs whitespace-nowrap">
                          {data.active.length} Aktif
                        </span>
                      </div>
                    </div>

                    {/* Subchapters panel */}
                    {!isSubLevel && subChapters.length > 0 && (
                      <div className="clay-card p-3 sm:p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-[#687086] shrink-0" />
                          <span className="text-sm font-bold text-[#18234A] dark:text-[#F8FAFC] font-serif">
                            Subchapters ({subChapters.length})
                          </span>
                        </div>

                        <div className="space-y-2">
                          {subChapters.map((sub) => {
                            const subItems = studentItems.filter(
                              (i) => i.chapterId === sub.id,
                            );
                            return (
                              <div
                                key={sub.id}
                                onClick={() => openSubChapter(sub.id)}
                                className="group flex items-center justify-between gap-2.5 rounded-2xl py-2.5 px-3 clay-pill hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <CornerDownRight className="w-3.5 h-3.5 text-[#687086] shrink-0" />
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-[#18234A] dark:text-[#F8FAFC] truncate group-hover:text-[#F27A3D] transition-colors text-xs sm:text-sm">
                                      {sub.title}
                                    </h4>
                                    <p className="text-[11px] text-[#687086] dark:text-[#94A3B8] font-medium truncate mt-0.5">
                                      {subItems.length} cards
                                    </p>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-[#687086] dark:text-[#94A3B8] shrink-0" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Filter tabs & search bar */}
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="grid grid-cols-4 gap-1 p-1 clay-inset rounded-2xl w-full sm:w-auto">
                          {(
                            [
                              {
                                key: "all",
                                label: "Semua",
                                count: data.all.length,
                                icon: <Layers className="w-3.5 h-3.5 shrink-0 hidden xs:inline" />,
                                active: "clay-pill text-[#FF6E65] shadow-2xs",
                                chip: "bg-[#FF6E65] text-white",
                                idle: "text-[#687086] dark:text-[#94A3B8] hover:text-[#18234A]",
                              },
                              {
                                key: "due",
                                label: "Review",
                                count: data.due.length,
                                icon: <Clock className="w-3.5 h-3.5 shrink-0 hidden xs:inline" />,
                                active: "clay-pill text-[#FF6E65] shadow-2xs",
                                chip: "bg-[#FF6E65] text-white",
                                idle: "text-[#687086] dark:text-[#94A3B8] hover:text-[#18234A]",
                              },
                              {
                                key: "active",
                                label: "Aktif",
                                count: data.active.length,
                                icon: <Play className="w-3 h-3 fill-current shrink-0 hidden xs:inline" />,
                                active: "clay-pill text-sky-600 shadow-2xs",
                                chip: "bg-sky-600 text-white",
                                idle: "text-[#687086] dark:text-[#94A3B8] hover:text-[#18234A]",
                              },
                              {
                                key: "inactive",
                                label: "Nonaktif",
                                count: data.inactive.length,
                                icon: <CircleDashed className="w-3.5 h-3.5 shrink-0 hidden xs:inline" />,
                                active: "clay-pill text-[#687086] shadow-2xs",
                                chip: "bg-slate-500 text-white",
                                idle: "text-[#687086] dark:text-[#94A3B8] hover:text-[#18234A]",
                              },
                            ] as const
                          ).map((filter) => (
                            <button
                              key={filter.key}
                              type="button"
                              onClick={() =>
                                setCardFilter(filter.key as "all" | "due" | "active" | "inactive")
                              }
                              className={`py-1 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none text-center ${
                                cardFilter === filter.key
                                  ? filter.active
                                  : filter.idle
                              }`}
                            >
                              {filter.icon}
                              <span className="truncate">{filter.label}</span>
                              <span
                                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                                  cardFilter === filter.key ? filter.chip : "clay-pill"
                                }`}
                              >
                                {filter.count}
                              </span>
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1 sm:flex-initial">
                            <Search className="w-3.5 h-3.5 text-[#687086] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="Cari kartu..."
                              value={cardSearch}
                              onChange={(e) => setCardSearch(e.target.value)}
                              className="w-full sm:w-48 pl-8 pr-3 py-1.5 rounded-xl clay-inset text-xs text-[#18234A] dark:text-[#F8FAFC] placeholder:text-[#687086] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cards list */}
                    {data.filtered.length === 0 ? (
                      <div className="clay-card p-6 text-center space-y-2">
                        <FileText className="w-10 h-10 mx-auto text-[#687086] opacity-60" />
                        <h4 className="font-bold text-sm text-[#18234A] dark:text-[#F8FAFC]">
                          Belum ada kartu di bagian ini
                        </h4>
                        <p className="text-xs text-[#687086] dark:text-[#94A3B8] max-w-sm mx-auto">
                          Santri belum memiliki kartu hafalan pada bagian ini.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {data.filtered.map((item) => (
                          <ItemCardRow
                            key={item.id}
                            activeMenuId={activeMenuId}
                            setActiveMenuId={setActiveMenuId}
                            isReadonly
                            item={item}
                            isBulkMode={false}
                            isSelected={false}
                            onPreview={() => setPreviewItem(item)}
                            onActivate={() => {
                              activateStudentBookItem(
                                classGroup.id,
                                student.id,
                                item.id,
                              );
                              setActionNotice("Kartu diaktifkan untuk santri.");
                              setTimeout(() => setActionNotice(null), 2500);
                            }}
                            onDeactivate={() => {
                              deactivateStudentBookItem(
                                classGroup.id,
                                student.id,
                                item.id,
                              );
                              setActionNotice("Kartu dinonaktifkan.");
                              setTimeout(() => setActionNotice(null), 2500);
                            }}
                            onReview={(rating) => handleGradeCard(item.id, rating)}
                            skipXpReward
                            language={language}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
          </div>
        )}

        {/* VIEW MODE 2: INTERACTIVE TESTING SESSION */}
        {viewMode === "testing" && (
          <div className="space-y-4 max-w-2xl mx-auto">
            {activeItems.length === 0 ? (
              <div className="p-8 text-center clay-card space-y-3">
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
                    className="px-4 py-2 rounded-xl clay-pill text-xs font-semibold text-[#18234A] dark:text-[#F8FAFC] cursor-pointer"
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
                    className="px-4 py-2 rounded-xl clay-pill text-xs font-semibold text-[#18234A] dark:text-[#F8FAFC] cursor-pointer"
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
