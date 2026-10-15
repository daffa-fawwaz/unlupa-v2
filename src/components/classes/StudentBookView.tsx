import React, { useState, useMemo } from "react";
import { ClassStudent, ClassGroup, BookItem, Chapter } from "../../types";
import { useApp } from "../../context/AppContext";
import { isDue, getIntervalDays } from "../../lib/fsrs";
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
  Eye,
  HelpCircle,
  Sparkles,
  BookMarked,
} from "lucide-react";
import { BilingualCardText } from "../common/BilingualCardText";
import { TeacherReportPrintView } from "./TeacherReportPrintView";

interface StudentBookViewProps {
  student: ClassStudent;
  classGroup: ClassGroup;
  onClose: () => void;
}

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

  const assignedBookId =
    classGroup.assignedBookIds?.[0] || books[0]?.id || "book-1";
  const assignedBook = books.find((b) => b.id === assignedBookId) || books[0];
  const assignedClassBookId = `class-book-${classGroup.id}-${assignedBookId}`;

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

  // Chapters of the assigned book
  const bookChapters = useMemo(() => {
    const direct = chapters.filter(
      (c) => c.bookId === assignedBookId || c.bookId === assignedClassBookId,
    );
    if (direct.length > 0) return direct;
    return chapters.filter((c) => c.bookId === assignedBook?.id);
  }, [chapters, assignedBookId, assignedClassBookId, assignedBook?.id]);

  // Student items for this book
  const studentItems: BookItem[] = useMemo(() => {
    const rawLive = getLiveStudentBookItems(student.id);
    let pool: BookItem[] = [];
    if (rawLive && rawLive.length > 0) {
      pool = rawLive;
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
    getLiveStudentBookItems,
    student.id,
    student.bookItemsData,
    items,
    assignedBookId,
    assignedClassBookId,
    assignedBook?.id,
  ]);

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
    return Math.min(99, Math.round(85 + (computedAverageStability || 5) * 0.5));
  }, [computedAverageStability]);

  const handleGradeCard = (itemId: string, rating: 1 | 2 | 3 | 4) => {
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
    <div className="fixed inset-0 z-[110] bg-[#faf8f5] dark:bg-slate-950 overflow-y-auto">
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

                                  {/* Card Question & Answer */}
                                  <div className="space-y-1.5">
                                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
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
                                    <div className="p-2.5 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                                        JAWABAN:
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

                                  {/* Teacher Review Grading Buttons */}
                                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                                    <span className="text-[10px] font-semibold text-slate-400">
                                      Nilai Setoran Santri:
                                    </span>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <button
                                        onClick={() =>
                                          handleGradeCard(item.id, 1)
                                        }
                                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-800 cursor-pointer active:scale-95"
                                        title="Perlu Belajar Ulang"
                                      >
                                        1. Lagi
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleGradeCard(item.id, 2)
                                        }
                                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800 cursor-pointer active:scale-95"
                                        title="Masih Sulit"
                                      >
                                        2. Sulit
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleGradeCard(item.id, 3)
                                        }
                                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800 cursor-pointer active:scale-95"
                                        title="Sudah Paham (Bagus)"
                                      >
                                        3. Bagus
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleGradeCard(item.id, 4)
                                        }
                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer active:scale-95 shadow-2xs"
                                        title="Sangat Menguasai (Mudah)"
                                      >
                                        4. Mudah
                                      </button>
                                    </div>
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

                {/* The Flashcard */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {bookChapters.find(
                        (c) =>
                          c.id === activeItems[testingCardIndex]?.chapterId,
                      )?.title || "Pertanyaan"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Stabilitas:{" "}
                      {getIntervalDays(activeItems[testingCardIndex]?.fsrsData)}{" "}
                      hari
                    </span>
                  </div>

                  {/* Question */}
                  <div className="py-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      SOAL / MATAN:
                    </span>
                    <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                      <BilingualCardText
                        text={activeItems[testingCardIndex]?.question}
                        type="question"
                      />
                    </div>
                  </div>

                  {/* Reveal Answer Button */}
                  {!isAnswerRevealed ? (
                    <button
                      onClick={() => setIsAnswerRevealed(true)}
                      className="w-full py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm border border-indigo-200 dark:border-indigo-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Periksa Kunci Jawaban</span>
                    </button>
                  ) : (
                    <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                      <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">
                          KUNCI JAWABAN:
                        </span>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                          <BilingualCardText
                            text={activeItems[testingCardIndex]?.answer}
                            type="answer"
                          />
                        </div>
                      </div>

                      {/* Grading Action */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block text-center">
                          Bagaimana pelafalan / hafalan santri?
                        </span>
                        <div className="grid grid-cols-4 gap-2">
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
                            className="py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800 cursor-pointer active:scale-95"
                          >
                            1. Lagi
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
                            className="py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800 cursor-pointer active:scale-95"
                          >
                            2. Sulit
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
                            className="py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 cursor-pointer active:scale-95"
                          >
                            3. Bagus
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
                            className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer active:scale-95 shadow-2xs"
                          >
                            4. Mudah
                          </button>
                        </div>
                      </div>
                    </div>
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
                  Simulasi Probabilitas Daya Ingat Seiring Waktu
                </h5>
                <span className="text-[10px] font-semibold text-slate-400">
                  Model Kurva Daya Ingat
                </span>
              </div>

              <div className="space-y-3 pt-1">
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
                        88 - (14 / Math.max(5, computedAverageStability)) * 18,
                      ),
                    ),
                    color: "bg-blue-400",
                  },
                  {
                    day: "Hari ke-30 (1 Bulan)",
                    prob: Math.max(
                      45,
                      Math.round(
                        85 - (30 / Math.max(8, computedAverageStability)) * 15,
                      ),
                    ),
                    color: "bg-amber-500",
                  },
                  {
                    day: "Hari ke-60 (2 Bulan)",
                    prob: Math.max(
                      40,
                      Math.round(
                        80 - (60 / Math.max(12, computedAverageStability)) * 12,
                      ),
                    ),
                    color: "bg-purple-500",
                  },
                ].map((item, idx) => (
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
