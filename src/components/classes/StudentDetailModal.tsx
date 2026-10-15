import React, { useState, useMemo, useEffect } from "react";
import {
  ClassStudent,
  ClassGroup,
  QuranPageItem,
  QuranFeedbackItem,
  BookItem,
  Chapter,
} from "../../types";
import { useApp } from "../../context/AppContext";
import { isDue, getIntervalDays } from "../../lib/fsrs";
import { MushafPageViewerModal } from "../quran/MushafPageViewerModal";
import { BilingualCardText } from "../common/BilingualCardText";
import {
  X,
  Check,
  RotateCcw,
  BookOpen,
  Send,
  Calendar,
  CheckCircle2,
  MessageSquare,
  Clock,
  User,
  Flame,
  Eye,
  Brain,
  Award,
  AlertCircle,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkles,
  BookMarked,
} from "lucide-react";

function getNextReviewInfo(
  nextReviewStr?: string | null,
  isActive?: boolean,
): string {
  if (!nextReviewStr || !isActive) {
    return "Belum dijadwalkan";
  }
  try {
    const target = new Date(nextReviewStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const t = new Date(target);
    t.setHours(0, 0, 0, 0);
    const diffDays = Math.round((t.getTime() - today.getTime()) / 86400000);

    if (diffDays < 0) {
      return `Terlambat ${Math.abs(diffDays)} hari`;
    } else if (diffDays === 0) {
      return "Hari Ini ⚠️ (Jatuh Tempo)";
    } else if (diffDays === 1) {
      return "Besok";
    } else {
      return `${diffDays} hari lagi`;
    }
  } catch {
    return "Telah dijadwalkan";
  }
}

interface StudentDetailModalProps {
  student: ClassStudent;
  classGroup: ClassGroup;
  isOpen: boolean;
  onClose: () => void;
  onOpenQuranSpace?: () => void;
  onOpenBookSpace?: () => void;
  initialTab?: "due" | "all_pages" | "feedback" | "retention";
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  classGroup,
  isOpen,
  onClose,
  onOpenQuranSpace,
  onOpenBookSpace,
  initialTab = "due",
}) => {
  const {
    quranPages,
    quranSpaceCode,
    teacherFeedbacks,
    reviewStudentQuranPage,
    addStudentDailyFeedback,
    reviewStudentBookItem,
    activateStudentBookItem,
    deactivateStudentBookItem,
    bypassStudentBookItemMapan,
    getLiveStudentQuranData,
    getLiveStudentBookItems,
    books,
    chapters,
    items,
    language,
  } = useApp();

  const isQuran = classGroup.type === "quran";

  const [activeTab, setActiveTab] = useState<
    "due" | "all_pages" | "feedback" | "retention"
  >(initialTab);
  const [dailyNote, setDailyNote] = useState("");
  const [inlineNotes, setInlineNotes] = useState<Record<string, string>>({});
  const [previewPageNumber, setPreviewPageNumber] = useState<number | null>(
    null,
  );
  const [actionSuccessMessage, setActionSuccessMessage] = useState<
    string | null
  >(null);
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!isOpen) return null;

  const isCurrentUser =
    student.quranSpaceCode === quranSpaceCode ||
    student.id.includes(quranSpaceCode);

  // ---------------------------------------------------------------------------
  // DATA PREPARATION: QURAN
  // ---------------------------------------------------------------------------
  const studentActivePages: QuranPageItem[] = useMemo(() => {
    if (!isQuran) return [];
    if (isCurrentUser) {
      return quranPages.filter((p) => p.isActive);
    }
    const liveData = getLiveStudentQuranData(student.id);
    if (liveData && liveData.length > 0) {
      return liveData.filter((p) => p.isActive);
    }
    return (student.quranData || []).filter((p) => p.isActive);
  }, [
    isQuran,
    isCurrentUser,
    quranPages,
    getLiveStudentQuranData,
    student.id,
    student.quranData,
  ]);

  const studentDuePages = useMemo(() => {
    return studentActivePages.filter((p) =>
      isDue(p.fsrsData.nextReview, p.isActive, p.fsrsData.lastReview),
    );
  }, [studentActivePages]);

  // ---------------------------------------------------------------------------
  // DATA PREPARATION: NON-QURAN (KITAB)
  // ---------------------------------------------------------------------------
  const assignedBookId =
    classGroup.assignedBookIds?.[0] || books[0]?.id || "book-1";
  const assignedBook = books.find((b) => b.id === assignedBookId) || books[0];
  const assignedClassBookId = `class-book-${classGroup.id}-${assignedBookId}`;

  const bookChapters = useMemo(() => {
    if (isQuran) return [];
    const directChaps = chapters.filter(
      (c) => c.bookId === assignedBookId || c.bookId === assignedClassBookId,
    );
    if (directChaps.length > 0) return directChaps;
    return chapters.filter((c) => c.bookId === assignedBook?.id);
  }, [
    isQuran,
    chapters,
    assignedBookId,
    assignedClassBookId,
    assignedBook?.id,
  ]);

  const studentBookItems: BookItem[] = useMemo(() => {
    if (isQuran) return [];
    const rawLiveItems = getLiveStudentBookItems(student.id);
    let pool: BookItem[] = [];
    if (rawLiveItems && rawLiveItems.length > 0) {
      pool = rawLiveItems;
    } else if (student.bookItemsData && student.bookItemsData.length > 0) {
      pool = student.bookItemsData;
    } else {
      pool = items.filter(
        (i) => i.bookId === assignedBookId || i.bookId === assignedClassBookId,
      );
    }

    const masterItems = items.filter(
      (i) => i.bookId === assignedBookId || i.bookId === assignedBook?.id,
    );
    if (masterItems.length === 0) return pool;

    const studentMap = new Map<string, BookItem>(
      pool.map((i) => [i.masterItemId || i.id, i]),
    );

    return masterItems.map((m) => {
      const found = studentMap.get(m.id);
      if (found) {
        return {
          ...m,
          isActive: found.isActive,
          status: found.status,
          fsrsData: found.fsrsData,
          reviewLogs: found.reviewLogs || [],
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
  }, [
    isQuran,
    getLiveStudentBookItems,
    student.id,
    student.bookItemsData,
    items,
    assignedBookId,
    assignedClassBookId,
    assignedBook?.id,
  ]);

  const studentActiveItems = useMemo(() => {
    return studentBookItems.filter((i) => i.isActive);
  }, [studentBookItems]);

  const studentDueItems = useMemo(() => {
    return studentActiveItems.filter((i) =>
      isDue(i.fsrsData?.nextReview, i.isActive, i.fsrsData?.lastReview),
    );
  }, [studentActiveItems]);

  // Combined feedbacks for display
  const feedbacksList: QuranFeedbackItem[] = isCurrentUser
    ? teacherFeedbacks
    : student.teacherFeedbacks || [];

  // Compute stability
  const computedAverageStability = useMemo(() => {
    if (isQuran) {
      if (studentActivePages.length === 0) return student.averageStability || 0;
      const total = studentActivePages.reduce(
        (acc, p) => acc + (p.fsrsData?.stability || 0),
        0,
      );
      return Math.round((total / studentActivePages.length) * 10) / 10;
    } else {
      if (studentActiveItems.length === 0) return student.averageStability || 0;
      const total = studentActiveItems.reduce(
        (acc, i) => acc + (i.fsrsData?.stability || 0),
        0,
      );
      return Math.round((total / studentActiveItems.length) * 10) / 10;
    }
  }, [
    isQuran,
    studentActivePages,
    studentActiveItems,
    student.averageStability,
  ]);

  // Handler for Quran review
  const handleQuranReview = (pageNumber: number, rating: 1 | 2) => {
    const note = inlineNotes[String(pageNumber)]?.trim();
    reviewStudentQuranPage(classGroup.id, student.id, pageNumber, rating, note);

    setActionSuccessMessage(
      rating === 2
        ? `Halaman ${pageNumber} berhasil dinilai Lancar (Mutqin). Interval memori bertambah.`
        : `Halaman ${pageNumber} dicatat Perlu Murajaah Ulang.`,
    );

    setInlineNotes((prev) => {
      const copy = { ...prev };
      delete copy[String(pageNumber)];
      return copy;
    });

    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  // Handler for Non-Quran card review
  const handleBookItemReview = (itemId: string, rating: 1 | 2 | 3 | 4) => {
    const note = inlineNotes[itemId]?.trim();
    reviewStudentBookItem(classGroup.id, student.id, itemId, rating, note);

    const labels: Record<number, string> = {
      1: "Perlu Belajar Ulang",
      2: "Masih Sulit",
      3: "Sudah Paham (Bagus)",
      4: "Sangat Menguasai (Mudah)",
    };

    setActionSuccessMessage(
      `Materi dinilai: "${labels[rating]}". Kekuatan memori santri diperbarui.`,
    );

    setInlineNotes((prev) => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });

    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyNote.trim()) return;

    addStudentDailyFeedback(classGroup.id, student.id, dailyNote.trim());
    setDailyNote("");
    setActionSuccessMessage(
      "Catatan dan evaluasi guru berhasil dikirim kepada santri.",
    );
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const totalActiveCount = isQuran
    ? studentActivePages.length
    : studentActiveItems.length;
  const totalDueCount = isQuran
    ? studentDuePages.length
    : studentDueItems.length;
  const totalMasterCount = isQuran ? 604 : studentBookItems.length;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-[#faf8f5] dark:bg-slate-900/90 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3.5 min-w-0">
            <img
              src={
                student.avatarUrl ||
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23EEF2F6"/><circle cx="50" cy="46" r="16" fill="%23FDBA74"/><path d="M22 84 C22 66 36 62 50 62 C64 62 78 66 78 84 Z" fill="%233B82F6"/></svg>'
              }
              alt={student.name}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-xs shrink-0"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                  {student.name}
                </h3>
                {student.quranSpaceCode && (
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 shrink-0">
                    ID: {student.quranSpaceCode}
                  </span>
                )}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                  {classGroup.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {student.email || "Akun Santri"} • Terakhir aktif:{" "}
                <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                  {student.lastActive || "Baru saja"}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isQuran && onOpenQuranSpace && (
              <button
                onClick={() => {
                  onClose();
                  onOpenQuranSpace();
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-indigo-200 dark:border-indigo-800"
                title="Buka Ruang Quran Santri"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buka Mushaf Santri</span>
              </button>
            )}

            {!isQuran && onOpenBookSpace && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBookSpace();
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-emerald-200 dark:border-emerald-800"
                title="Buka Halaman Kitab Santri"
              >
                <BookMarked className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buka Halaman Kitab</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 sm:p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-center shrink-0">
          <div className="bg-[#fcfaf7] dark:bg-slate-800/60 p-2.5 rounded-2xl border border-[#ede6db] dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              {isQuran ? "Halaman Aktif" : "Materi Aktif"}
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">
              {totalActiveCount}{" "}
              <span className="text-xs font-normal text-slate-400">
                / {totalMasterCount}
              </span>
            </span>
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
            <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400 block">
              Tugas Harian (Due)
            </span>
            <span className="text-xl font-black text-amber-700 dark:text-amber-300 mt-0.5 block">
              {totalDueCount}{" "}
              <span className="text-xs font-normal text-amber-600/70">
                {isQuran ? "halaman" : "kartu"}
              </span>
            </span>
          </div>

          <div className="bg-blue-50/60 dark:bg-blue-950/30 p-2.5 rounded-2xl border border-blue-200/60 dark:border-blue-900/40">
            <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-400 block">
              Stabilitas Memori
            </span>
            <span className="text-xl font-black text-blue-700 dark:text-blue-300 mt-0.5 block">
              {computedAverageStability}{" "}
              <span className="text-xs font-normal text-blue-600/70">hari</span>
            </span>
          </div>

          <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-2.5 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40">
            <span className="text-[10px] uppercase font-bold text-indigo-800 dark:text-indigo-400 block">
              Status Review
            </span>
            <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 mt-0.5 block">
              {totalDueCount === 0 ? "Tuntas" : `${totalDueCount} Pending`}
            </span>
          </div>
        </div>

        {/* Action Success Alert */}
        {actionSuccessMessage && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 pt-2 shrink-0 gap-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("due")}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "due"
                ? "border-indigo-600 text-indigo-700 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <span>Tugas Review Hari Ini (Due)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
              {totalDueCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("all_pages")}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "all_pages"
                ? "border-indigo-600 text-indigo-700 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <span>
              {isQuran ? "Semua Halaman Aktif" : "Semua Materi Kitab"}
            </span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
              {totalActiveCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("feedback")}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "feedback"
                ? "border-indigo-600 text-indigo-700 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <span>Catatan & Evaluasi Guru</span>
            {feedbacksList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 text-[10px] font-bold">
                {feedbacksList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("retention")}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "retention"
                ? "border-indigo-600 text-indigo-700 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-indigo-600" />
            <span>Kurva Daya Ingat</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: DUE TASKS */}
          {activeTab === "due" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isQuran
                    ? "Daftar halaman yang dijadwalkan untuk disimak (tasmi') hari ini."
                    : "Daftar kartu hafalan kitab yang jatuh tempo untuk diuji dan disimak hari ini."}
                </p>
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  {totalDueCount} {isQuran ? "Halaman" : "Kartu"} Pending
                </span>
              </div>

              {/* Quran Due Pages */}
              {isQuran &&
                (studentDuePages.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-[#faf8f5] dark:bg-slate-800/40 border border-[#ece6d9] dark:border-slate-800 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Santri ini telah menyelesaikan seluruh murajaah hari ini!
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Tidak ada halaman yang jatuh tempo saat ini. Anda dapat
                      melihat tab "Semua Halaman Aktif" jika ingin menyimak
                      halaman lainnya.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentDuePages.map((page) => (
                      <div
                        key={page.pageNumber}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 shadow-2xs space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-[#f7f4ed] dark:bg-slate-700 text-slate-900 dark:text-white font-black text-sm flex items-center justify-center border border-[#ece6d9] dark:border-slate-600 shrink-0">
                              {page.pageNumber}
                            </div>
                            <div className="truncate">
                              <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                Hal. {page.pageNumber} (QS. {page.surahNameEn})
                              </h5>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Total review:{" "}
                                <span className="font-semibold">
                                  {page.fsrsData.reps || 0} kali
                                </span>{" "}
                                • Stabilitas interval:{" "}
                                <span className="font-semibold">
                                  {getIntervalDays(page.fsrsData)} hari
                                </span>
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                Jadwal:{" "}
                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                  {getNextReviewInfo(
                                    page.fsrsData.nextReview,
                                    page.isActive,
                                  )}
                                </span>
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              setPreviewPageNumber(page.pageNumber)
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Mushaf</span>
                          </button>
                        </div>

                        {/* Optional teacher note for this page */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                          <input
                            type="text"
                            placeholder="Catatan tasmi' (opsional, mis: Makhraj & Tajwid baik)..."
                            value={inlineNotes[String(page.pageNumber)] || ""}
                            onChange={(e) =>
                              setInlineNotes({
                                ...inlineNotes,
                                [String(page.pageNumber)]: e.target.value,
                              })
                            }
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() =>
                                handleQuranReview(page.pageNumber, 1)
                              }
                              className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 text-xs font-semibold border border-amber-200 dark:border-amber-800 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                              <span>Perlu Ulang</span>
                            </button>

                            <button
                              onClick={() =>
                                handleQuranReview(page.pageNumber, 2)
                              }
                              className="flex-1 sm:flex-none px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Lancar (Mutqin)</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

              {/* Non-Quran (Kitab) Due Items */}
              {!isQuran &&
                (studentDueItems.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-[#faf8f5] dark:bg-slate-800/40 border border-[#ece6d9] dark:border-slate-800 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Santri ini telah menuntaskan seluruh tugas review kitab
                      hari ini!
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Tidak ada materi kartu yang jatuh tempo saat ini. Anda
                      dapat menyimak materi lainnya di tab "Semua Materi Kitab".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentDueItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 shadow-2xs space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                              {bookChapters.find((c) => c.id === item.chapterId)
                                ?.title || "Materi Kitab"}
                            </span>
                            <span>
                              Stabilitas:{" "}
                              <strong className="text-slate-700 dark:text-slate-300">
                                {getIntervalDays(item.fsrsData)} hari
                              </strong>{" "}
                              • Review: {item.fsrsData?.reps || 0}x
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
                            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                              PERTANYAAN / MATAN:
                            </span>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              <BilingualCardText
                                text={item.question}
                                type="question"
                                variant="compact"
                              />
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                              JAWABAN / PENJELASAN:
                            </span>
                            <div className="text-slate-700 dark:text-slate-300">
                              <BilingualCardText
                                text={item.answer}
                                type="answer"
                                variant="compact"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Review rating buttons */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                          <input
                            type="text"
                            placeholder="Catatan untuk santri (opsional)..."
                            value={inlineNotes[item.id] || ""}
                            onChange={(e) =>
                              setInlineNotes({
                                ...inlineNotes,
                                [item.id]: e.target.value,
                              })
                            }
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />

                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            <button
                              onClick={() => handleBookItemReview(item.id, 1)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800 cursor-pointer active:scale-95"
                              title="Perlu Belajar Ulang"
                            >
                              1. Lagi
                            </button>
                            <button
                              onClick={() => handleBookItemReview(item.id, 2)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-800 cursor-pointer active:scale-95"
                              title="Masih Sulit"
                            >
                              2. Sulit
                            </button>
                            <button
                              onClick={() => handleBookItemReview(item.id, 3)}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 text-[11px] font-bold border border-blue-200 dark:border-blue-800 cursor-pointer active:scale-95"
                              title="Sudah Paham"
                            >
                              3. Bagus
                            </button>
                            <button
                              onClick={() => handleBookItemReview(item.id, 4)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer active:scale-95 shadow-2xs"
                              title="Sangat Menguasai"
                            >
                              4. Mudah
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          )}

          {/* TAB 2: ALL MATERIALS */}
          {activeTab === "all_pages" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isQuran
                    ? "Daftar seluruh halaman Al-Qur'an aktif santri ini."
                    : `Daftar bab dan materi ${assignedBook?.title || "kitab"} santri.`}
                </p>
                <span className="text-[11px] font-semibold text-slate-500">
                  Total Aktif: {totalActiveCount}
                </span>
              </div>

              {/* Quran All Pages */}
              {isQuran &&
                (studentActivePages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic">
                    Belum ada halaman yang diaktivasi oleh santri ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {studentActivePages.map((page) => {
                      const pageIsDue = isDue(
                        page.fsrsData.nextReview,
                        page.isActive,
                      );
                      return (
                        <div
                          key={page.pageNumber}
                          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center justify-between gap-2.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-[#f7f4ed] dark:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center border border-[#ece6d9] dark:border-slate-600 shrink-0">
                              {page.pageNumber}
                            </div>
                            <div className="truncate">
                              <h6 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                Hal. {page.pageNumber} (QS. {page.surahNameEn})
                              </h6>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Review: {page.fsrsData.reps || 0}x • Kekuatan:{" "}
                                {getIntervalDays(page.fsrsData)} hari
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {pageIsDue ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                                Due
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                                Aman
                              </span>
                            )}

                            <button
                              onClick={() =>
                                setPreviewPageNumber(page.pageNumber)
                              }
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                              title="Lihat Mushaf"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

              {/* Non-Quran All Items / Chapters */}
              {!isQuran &&
                (bookChapters.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic">
                    Belum ada bab atau materi yang ditautkan pada kelas ini.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookChapters.map((chap, idx) => {
                      const chapItems = studentBookItems.filter(
                        (i) => i.chapterId === chap.id,
                      );
                      const activeInChap = chapItems.filter(
                        (i) => i.isActive,
                      ).length;
                      const isExpanded =
                        expandedChapterId === chap.id ||
                        (expandedChapterId === null && idx === 0);

                      return (
                        <div
                          key={chap.id}
                          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 overflow-hidden shadow-2xs"
                        >
                          <button
                            onClick={() =>
                              setExpandedChapterId(isExpanded ? null : chap.id)
                            }
                            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div>
                                <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                  {chap.title}
                                </h5>
                                <span className="text-[10px] text-slate-400">
                                  {chapItems.length} total kartu •{" "}
                                  {activeInChap} aktif dipelajari
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                {activeInChap} Aktif
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="p-3 pt-0 space-y-2 border-t border-slate-100 dark:border-slate-700/60">
                              {chapItems.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-2 text-center">
                                  Belum ada item dalam bab ini.
                                </p>
                              ) : (
                                chapItems.map((item, itemIdx) => {
                                  const itemDue = isDue(
                                    item.fsrsData?.nextReview,
                                    item.isActive,
                                    item.fsrsData?.lastReview,
                                  );
                                  return (
                                    <div
                                      key={item.id}
                                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                                    >
                                      <div className="flex-1 space-y-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-mono text-slate-400">
                                            #{itemIdx + 1}
                                          </span>
                                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                            <BilingualCardText
                                              text={item.question}
                                              type="question"
                                              variant="compact"
                                            />
                                          </div>
                                        </div>
                                        <div className="text-[11px] text-slate-500 pl-4 border-l-2 border-slate-200 dark:border-slate-700 truncate">
                                          <BilingualCardText
                                            text={item.answer}
                                            type="answer"
                                            variant="compact"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                        <div className="text-right text-[10px] text-slate-400">
                                          <span className="block font-bold text-indigo-600 dark:text-indigo-400">
                                            {getIntervalDays(item.fsrsData)}{" "}
                                            hari
                                          </span>
                                          <span>
                                            {item.fsrsData?.reps || 0}x review
                                          </span>
                                        </div>

                                        <button
                                          onClick={() => {
                                            if (item.isActive) {
                                              deactivateStudentBookItem(
                                                classGroup.id,
                                                student.id,
                                                item.id,
                                              );
                                              setActionSuccessMessage(
                                                "Kartu dinonaktifkan untuk santri.",
                                              );
                                            } else {
                                              activateStudentBookItem(
                                                classGroup.id,
                                                student.id,
                                                item.id,
                                              );
                                              setActionSuccessMessage(
                                                "Kartu diaktifkan untuk santri.",
                                              );
                                            }
                                            setTimeout(
                                              () =>
                                                setActionSuccessMessage(null),
                                              2500,
                                            );
                                          }}
                                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                            item.isActive
                                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                              : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-emerald-50"
                                          }`}
                                        >
                                          {item.isActive ? "Aktif" : "Aktifkan"}
                                        </button>
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
                ))}
            </div>
          )}

          {/* TAB 3: TEACHER EVALUATION & FEEDBACK */}
          {activeTab === "feedback" && (
            <div className="space-y-4">
              <form
                onSubmit={handleSendFeedback}
                className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-slate-800/60 border border-[#ede6db] dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                    Beri Catatan & Evaluasi Harian untuk Santri
                  </h5>
                </div>

                <textarea
                  rows={3}
                  required
                  placeholder={
                    isQuran
                      ? "Tuliskan evaluasi tasmi', makhraj, tajwid, atau motivasi murajaah untuk santri ini..."
                      : "Tuliskan catatan evaluasi pemahaman kaidah, ketuntasan bab, atau motivasi hafalan santri ini..."
                  }
                  value={dailyNote}
                  onChange={(e) => setDailyNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Catatan ke Santri</span>
                  </button>
                </div>
              </form>

              {/* Feedback History */}
              <div className="space-y-2.5">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                  Riwayat Evaluasi Guru ({feedbacksList.length})
                </h5>

                {feedbacksList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3 text-center">
                    Belum ada riwayat catatan guru untuk santri ini.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {feedbacksList.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-indigo-600" />
                            {item.teacherName || "Pengajar"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(item.date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {item.pageNumber && (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 border border-amber-300/40 dark:border-amber-700/50 text-amber-900 dark:text-amber-300 text-[10px] font-bold">
                              Halaman {item.pageNumber}
                            </span>
                            {item.rating && (
                              <span
                                className={`text-[10px] font-bold ${item.rating === 2 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
                              >
                                {item.rating === 2
                                  ? "✓ Lancar Mutqin"
                                  : "↻ Perlu Murajaah Ulang"}
                              </span>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-0.5">
                          {item.note}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: KURVA DAYA INGAT (RETENTION CURVE - CLEAN, NO "FSRS" TEXT) */}
          {activeTab === "retention" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-emerald-50/40 to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-indigo-200/60 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                      Kurva Daya Ingat & Retensi Hafalan
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Proyeksi kekuatan memori dan daya tahan hafalan santri
                      berdasarkan frekuensi pengulangan dan interval stabilitas
                      hafalan.
                    </p>
                  </div>
                </div>

                {/* Metrics Summary */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-center shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Stabilitas Rata-rata
                    </span>
                    <span className="text-base font-black text-indigo-700 dark:text-indigo-300">
                      {computedAverageStability} hari
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-center shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Total Materi Aktif
                    </span>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {totalActiveCount}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-center shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Tingkat Retensi
                    </span>
                    <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                      {Math.min(
                        99,
                        Math.round(85 + (computedAverageStability || 5) * 0.5),
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Retention Curve Graph / Bars */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h6 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                    Simulasi Probabilitas Daya Ingat Seiring Waktu
                  </h6>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Model Kurva Daya Ingat
                  </span>
                </div>

                <div className="space-y-2.5 pt-2">
                  {[
                    {
                      day: "Hari ke-1 (Setelah Setoran)",
                      prob: 98,
                      color: "bg-emerald-500",
                    },
                    {
                      day: "Hari ke-3",
                      prob: Math.max(
                        70,
                        Math.round(
                          98 - (3 / Math.max(2, computedAverageStability)) * 25,
                        ),
                      ),
                      color: "bg-emerald-400",
                    },
                    {
                      day: "Hari ke-7 (Minggu Pertama)",
                      prob: Math.max(
                        60,
                        Math.round(
                          92 - (7 / Math.max(3, computedAverageStability)) * 20,
                        ),
                      ),
                      color: "bg-blue-500",
                    },
                    {
                      day: "Hari ke-14 (2 Minggu)",
                      prob: Math.max(
                        50,
                        Math.round(
                          88 -
                            (14 / Math.max(5, computedAverageStability)) * 18,
                        ),
                      ),
                      color: "bg-blue-400",
                    },
                    {
                      day: "Hari ke-30 (1 Bulan)",
                      prob: Math.max(
                        45,
                        Math.round(
                          85 -
                            (30 / Math.max(8, computedAverageStability)) * 15,
                        ),
                      ),
                      color: "bg-amber-500",
                    },
                    {
                      day: "Hari ke-60 (2 Bulan)",
                      prob: Math.max(
                        40,
                        Math.round(
                          80 -
                            (60 / Math.max(12, computedAverageStability)) * 12,
                        ),
                      ),
                      color: "bg-purple-500",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.day}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.prob}% Retensi
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                          style={{ width: `${item.prob}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  💡 <strong>Catatan Pengajar:</strong> Kurva di atas
                  memproyeksikan estimasi daya ingat santri. Semakin konsisten
                  santri menyimak dan murajaah tepat pada jadwal hari jatuh
                  tempo (due), semakin tinggi stabilitas hafalan jangka panjang
                  yang terbentuk.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-[#faf8f5] dark:bg-slate-900/90 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isQuran
              ? "Terhubung via Kode Ruang Al-Qur'an santri"
              : `Terhubung via Kitab: ${assignedBook?.title || "Kelas"}`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Mushaf Page Viewer Modal if teacher wants to inspect the text */}
      {previewPageNumber !== null && (
        <MushafPageViewerModal
          pageNumber={previewPageNumber}
          isOpen={true}
          onClose={() => setPreviewPageNumber(null)}
          onNavigatePage={(p) => setPreviewPageNumber(p)}
        />
      )}
    </div>
  );
};
