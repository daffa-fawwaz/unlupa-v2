import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../../context/AppContext";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Library,
  Eye,
  Play,
  CalendarCheck,
  ChevronDown,
  FolderPlus,
  BookMarked,
  Layers,
  X,
  Check,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QuranPageItem, BookItem, Book } from "../../types";
import { isDue } from "../../lib/fsrs";

interface Props {
  onOpenQuranReview: (juzNumber?: number) => void;
  onOpenPersonalReview: () => void;
  onOpenMushafViewer: (pageNumber: number) => void;
}

export type MaterialFilter = "all" | "quran" | "personal" | "library" | "class";

// Helper to format Date as local YYYY-MM-DD
function formatLocalDate(d: Date | string | number | null | undefined): string {
  if (!d) return "";
  try {
    const dateObj = d instanceof Date ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return "";
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (e) {
    return "";
  }
}

export const VisualReviewCalendar: React.FC<Props> = ({
  onOpenQuranReview,
  onOpenPersonalReview,
  onOpenMushafViewer,
}) => {
  const { quranPages, items, books, myClasses, teachingClasses, language } =
    useApp();

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatLocalDate(today), [today]);

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0 - 11
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [filterType, setFilterType] = useState<MaterialFilter>("all");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(true);
  const [isBookDropdownOpen, setIsBookDropdownOpen] = useState<boolean>(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState<boolean>(false);

  // Classify Books into 3 Ruang Buku Categories
  const activeTeachingClasses = useMemo(
    () => (teachingClasses || []).filter((c) => c.status !== "closed"),
    [teachingClasses],
  );
  const activeJoinedClasses = useMemo(
    () => (myClasses || []).filter((c) => c.status !== "closed"),
    [myClasses],
  );

  const activeClassIds = useMemo(
    () =>
      new Set<string>([
        ...activeTeachingClasses.map((c) => c.id),
        ...activeJoinedClasses.map((c) => c.id),
      ]),
    [activeTeachingClasses, activeJoinedClasses],
  );

  const assignedBookIds = useMemo(() => {
    const set = new Set<string>();
    activeTeachingClasses.forEach((c) => {
      c.assignedBookIds?.forEach((id) => set.add(id));
    });
    return set;
  }, [activeTeachingClasses]);

  const joinedBookIds = useMemo(() => {
    const set = new Set<string>();
    activeJoinedClasses.forEach((c) => {
      c.assignedBookIds?.forEach((id) => set.add(id));
    });
    return set;
  }, [activeJoinedClasses]);

  const isBookInActiveClass = useMemo(
    () =>
      (b: Book): boolean => {
        if (b.classId) return activeClassIds.has(b.classId);
        if (b.id.startsWith("class-book-")) {
          return Array.from(activeClassIds).some((cid) =>
            b.id.startsWith(`class-book-${cid}-`),
          );
        }
        if (joinedBookIds.has(b.id) && b.isReadonly) {
          return true;
        }
        return false;
      },
    [activeClassIds, joinedBookIds],
  );

  // Specific categorized lists
  const isImportedOrLibraryBook = (b: any) =>
    Boolean(
      b.isReadonly ||
      b.isImported ||
      b.libraryEntryId ||
      b.category === "imported",
    );
  const personalBooks = useMemo(
    () =>
      (books || []).filter(
        (b) => !isBookInActiveClass(b) && !isImportedOrLibraryBook(b),
      ),
    [books, isBookInActiveClass],
  );
  const libraryBooks = useMemo(
    () =>
      (books || []).filter(
        (b) => !isBookInActiveClass(b) && isImportedOrLibraryBook(b),
      ),
    [books, isBookInActiveClass],
  );
  const classBooks = useMemo(
    () => (books || []).filter((b) => isBookInActiveClass(b)),
    [books, isBookInActiveClass],
  );

  const personalBookIdSet = useMemo(
    () => new Set(personalBooks.map((b) => b.id)),
    [personalBooks],
  );
  const libraryBookIdSet = useMemo(
    () => new Set(libraryBooks.map((b) => b.id)),
    [libraryBooks],
  );
  const classBookIdSet = useMemo(
    () => new Set(classBooks.map((b) => b.id)),
    [classBooks],
  );

  // Books available under current filter
  const currentCategoryBooks = useMemo(() => {
    if (filterType === "personal") return personalBooks;
    if (filterType === "library") return libraryBooks;
    if (filterType === "class") return classBooks;
    return books || [];
  }, [filterType, personalBooks, libraryBooks, classBooks, books]);

  // Active book object if a specific book is selected
  const activeSelectedBook = useMemo(() => {
    if (!selectedBookId) return null;
    return (books || []).find((b) => b.id === selectedBookId) || null;
  }, [books, selectedBookId]);

  // When switching filter type, reset selectedBookId if not in category
  const handleFilterChange = (newFilter: MaterialFilter) => {
    setFilterType(newFilter);
    setIsBookDropdownOpen(false);
    if (newFilter === "quran") {
      setSelectedBookId(null);
    } else if (selectedBookId) {
      const isStillAvailable =
        (newFilter === "personal" && personalBookIdSet.has(selectedBookId)) ||
        (newFilter === "library" && libraryBookIdSet.has(selectedBookId)) ||
        (newFilter === "class" && classBookIdSet.has(selectedBookId)) ||
        newFilter === "all";
      if (!isStillAvailable) {
        setSelectedBookId(null);
      }
    }
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
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
    setIsDetailsExpanded(true);
    setIsMonthPickerOpen(false);
  };

  // Month and Day labels
  const monthNamesId = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const monthNamesEn = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentMonthName =
    language === "en" ? monthNamesEn[currentMonth] : monthNamesId[currentMonth];

  const weekDayLabels =
    language === "en"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Ahd"];

  // Calculate days in the displayed month and grid structure
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    // Monday = 0, Tuesday = 1, ..., Sunday = 6
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

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
        dateObj: dObj,
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
        dateObj: dObj,
      });
    }

    // Next month padding to fill complete weeks (multiples of 7)
    const remainingSlots = 7 - (days.length % 7);
    if (remainingSlots < 7) {
      for (let i = 1; i <= remainingSlots; i++) {
        const dObj = new Date(currentYear, currentMonth + 1, i);
        days.push({
          dateStr: formatLocalDate(dObj),
          dayNumber: i,
          isCurrentMonth: false,
          isToday: formatLocalDate(dObj) === todayStr,
          dateObj: dObj,
        });
      }
    }

    return days;
  }, [currentYear, currentMonth, todayStr]);

  // Aggregate planned review sessions by date
  const scheduleData = useMemo(() => {
    const plannedMap = new Map<
      string,
      {
        quran: QuranPageItem[];
        personal: { item: BookItem; bookTitle: string }[];
      }
    >();

    const booksMap = new Map<string, string>();
    (books || []).forEach((b) => booksMap.set(b.id, b.title));

    // 1. Process Active Quran Pages (only if filter is 'all' or 'quran' and no specific book selected)
    const shouldIncludeQuran =
      (filterType === "all" || filterType === "quran") && !selectedBookId;

    if (shouldIncludeQuran) {
      (quranPages || []).forEach((p) => {
        if (!p.isActive) return;

        // Check planned next review
        const nextReview = p.fsrsData?.nextReview;
        if (nextReview) {
          const nextDate = new Date(nextReview);
          const nextStr = formatLocalDate(nextDate);

          // If nextReview is today or in the past (overdue), it counts towards TODAY's pending load
          if (nextDate <= today || isDue(nextReview, p.isActive)) {
            if (!plannedMap.has(todayStr)) {
              plannedMap.set(todayStr, { quran: [], personal: [] });
            }
            plannedMap.get(todayStr)!.quran.push(p);
          } else {
            // Future scheduled date
            if (!plannedMap.has(nextStr)) {
              plannedMap.set(nextStr, { quran: [], personal: [] });
            }
            plannedMap.get(nextStr)!.quran.push(p);
          }
        } else {
          // Activated but no review date yet -> due today
          if (!plannedMap.has(todayStr)) {
            plannedMap.set(todayStr, { quran: [], personal: [] });
          }
          plannedMap.get(todayStr)!.quran.push(p);
        }

        // Check recurrent weekly or monthly Mapan schedule
        if (p.mapanSchedule && p.mapanSchedule.mode !== "fsrs") {
          if (
            p.mapanSchedule.mode === "weekly" &&
            typeof p.mapanSchedule.weeklyDay === "number"
          ) {
            const targetDay = p.mapanSchedule.weeklyDay;
            calendarDays.forEach((calDay) => {
              if (calDay.isCurrentMonth && calDay.dateObj > today) {
                if (calDay.dateObj.getDay() === targetDay) {
                  if (!plannedMap.has(calDay.dateStr)) {
                    plannedMap.set(calDay.dateStr, { quran: [], personal: [] });
                  }
                  const entry = plannedMap.get(calDay.dateStr)!;
                  if (
                    !entry.quran.some((qp) => qp.pageNumber === p.pageNumber)
                  ) {
                    entry.quran.push(p);
                  }
                }
              }
            });
          } else if (
            p.mapanSchedule.mode === "monthly" &&
            typeof p.mapanSchedule.monthlyDate === "number"
          ) {
            const targetDateNum = p.mapanSchedule.monthlyDate;
            calendarDays.forEach((calDay) => {
              if (
                calDay.isCurrentMonth &&
                calDay.dayNumber === targetDateNum &&
                calDay.dateObj > today
              ) {
                if (!plannedMap.has(calDay.dateStr)) {
                  plannedMap.set(calDay.dateStr, { quran: [], personal: [] });
                }
                const entry = plannedMap.get(calDay.dateStr)!;
                if (!entry.quran.some((qp) => qp.pageNumber === p.pageNumber)) {
                  entry.quran.push(p);
                }
              }
            });
          }
        }
      });
    }

    // 2. Process Personal Items
    if (filterType !== "quran") {
      (items || []).forEach((it) => {
        if (!it.isActive) return;

        // Specific book filtering
        if (selectedBookId && it.bookId !== selectedBookId) {
          return;
        }

        // Category filtering if no single book selected
        if (!selectedBookId) {
          if (filterType === "personal" && !personalBookIdSet.has(it.bookId))
            return;
          if (filterType === "library" && !libraryBookIdSet.has(it.bookId))
            return;
          if (filterType === "class" && !classBookIdSet.has(it.bookId)) return;
        }

        const bTitle =
          booksMap.get(it.bookId) ||
          (language === "en" ? "Book Card" : "Kartu Kitab");
        const nextReview = it.fsrsData?.nextReview;

        if (nextReview) {
          const nextDate = new Date(nextReview);
          const nextStr = formatLocalDate(nextDate);

          if (nextDate <= today || isDue(nextReview, it.isActive)) {
            if (!plannedMap.has(todayStr)) {
              plannedMap.set(todayStr, { quran: [], personal: [] });
            }
            plannedMap
              .get(todayStr)!
              .personal.push({ item: it, bookTitle: bTitle });
          } else {
            if (!plannedMap.has(nextStr)) {
              plannedMap.set(nextStr, { quran: [], personal: [] });
            }
            plannedMap
              .get(nextStr)!
              .personal.push({ item: it, bookTitle: bTitle });
          }
        } else {
          if (!plannedMap.has(todayStr)) {
            plannedMap.set(todayStr, { quran: [], personal: [] });
          }
          plannedMap
            .get(todayStr)!
            .personal.push({ item: it, bookTitle: bTitle });
        }
      });
    }

    return { plannedMap };
  }, [
    quranPages,
    items,
    books,
    language,
    today,
    todayStr,
    calendarDays,
    filterType,
    selectedBookId,
    personalBookIdSet,
    libraryBookIdSet,
    classBookIdSet,
  ]);

  // Selected date details
  const selectedDateDetails = useMemo(() => {
    const planned = scheduleData.plannedMap.get(selectedDateStr) || {
      quran: [],
      personal: [],
    };

    const totalPlanned = planned.quran.length + planned.personal.length;
    const isDateToday = selectedDateStr === todayStr;
    const selectedObj = new Date(selectedDateStr + "T00:00:00");
    const isPast = selectedObj < new Date(todayStr + "T00:00:00");
    const isFuture = selectedObj > new Date(todayStr + "T00:00:00");

    let formattedTitle = selectedDateStr;
    try {
      formattedTitle = selectedObj.toLocaleDateString(
        language === "en" ? "en-US" : "id-ID",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        },
      );
    } catch {
      // fallback
    }

    return {
      formattedTitle,
      isDateToday,
      isPast,
      isFuture,
      totalPlanned,
      plannedQuran: planned.quran,
      plannedPersonal: planned.personal,
    };
  }, [selectedDateStr, scheduleData, todayStr, language]);

  return (
    <section className="neumorph-card p-3.5 sm:p-5 space-y-3.5 rounded-3xl">
      {/* 1. HEADER: TITLE WITH MONTH NAV ON THE RIGHT + FILTER TABS */}
      <div className="flex flex-col gap-2.5 pb-2.5 border-b border-black/[0.04] dark:border-white/[0.04]">
        {/* Row 1: Title (Left) + Month Switcher Capsule (Right) - Perfect Single Line Alignment */}
        <div className="flex items-center justify-between gap-2 w-full flex-nowrap">
          {/* Title & Icon Pod */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(255,111,61,0.3)]">
              <CalendarCheck className="w-4 h-4 text-white shrink-0" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight truncate">
                {language === "en" ? "Forecast" : "Prediksi"}
              </h3>
              {activeSelectedBook && (
                <p className="text-[10px] sm:text-[11px] font-semibold text-[#FF6F3D] truncate max-w-[140px] sm:max-w-xs leading-none mt-0.5">
                  {language === "en" ? "Filtering: " : "Memfilter: "}{" "}
                  {activeSelectedBook.title}
                </p>
              )}
            </div>
          </div>

          {/* Month Switcher Capsule with Dynamic Picker (Directly to the Right of Title) */}
          <div className="flex items-center gap-1 neumorph-card px-1 py-0.5 rounded-2xl shadow-xs shrink-0 relative z-20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevMonth();
              }}
              title={language === "en" ? "Previous Month" : "Bulan Sebelumnya"}
              className="w-6.5 h-6.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.05] flex items-center justify-center text-[#18234A] dark:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Dynamic Month-Year Picker Trigger */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMonthPickerOpen((prev) => !prev);
              }}
              className="px-2 py-0.5 text-xs font-black text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 active:scale-95"
              title={
                language === "en"
                  ? "Click to jump to any month or year"
                  : "Klik untuk lompat ke bulan atau tahun tertentu"
              }
            >
              <CalendarIcon className="w-3.5 h-3.5 text-[#FF6F3D]" />
              <span>
                {currentMonthName} {currentYear}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-[#5E6D88] transition-transform ${isMonthPickerOpen ? "rotate-180" : ""}`}
              />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNextMonth();
              }}
              title={language === "en" ? "Next Month" : "Bulan Berikutnya"}
              className="w-6.5 h-6.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.05] flex items-center justify-center text-[#18234A] dark:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Dynamic Month & Year & Quick Date Search Portal Modal */}
            {isMonthPickerOpen &&
              typeof document !== "undefined" &&
              createPortal(
                <div
                  className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200"
                  role="dialog"
                  aria-modal="true"
                  aria-label={
                    language === "en"
                      ? "Quick Date Search & Jump"
                      : "Pencarian Cepat Tanggal"
                  }
                >
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 -z-10"
                    onClick={() => setIsMonthPickerOpen(false)}
                  />
                  <div
                    className="relative w-full max-w-sm sm:max-w-md rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#151B28] text-[#18234A] dark:text-[#F8FAFC] max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header: Pencarian Cepat Tanggal */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.06] dark:border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(255,111,61,0.35)]">
                          <Search className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-black text-[#18234A] dark:text-[#F8FAFC] truncate">
                            {language === "en"
                              ? "Quick Date Search & Jump"
                              : "Pencarian Cepat Tanggal"}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {language === "en"
                              ? "Navigate instantly to any date, month, or year"
                              : "Lompat langsung ke tanggal, bulan, atau tahun"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsMonthPickerOpen(false)}
                        className="w-7 h-7 rounded-xl neumorph-card flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer shrink-0 transition-transform hover:scale-105 active:scale-95"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* SECTION 1: LOMPAT KE TANGGAL SPESIFIK (Input & Shortcuts) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          {language === "en"
                            ? "1. Direct Date Input:"
                            : "1. Masukkan Tanggal Langsung:"}
                        </span>
                        <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
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
                              const [y, m, d] = val.split("-").map(Number);
                              if (y && m && d) {
                                const newDate = new Date(y, m - 1, d);
                                handleJumpToDate(newDate);
                              }
                            }
                          }}
                          className="w-full py-2 px-3 rounded-xl neumorph-inset bg-slate-100/80 dark:bg-slate-900/80 text-xs font-bold font-mono text-[#18234A] dark:text-[#F8FAFC] border border-slate-200/80 dark:border-slate-700/80 focus:outline-hidden focus:ring-2 focus:ring-[#FF6F3D] cursor-pointer"
                        />
                      </div>

                      {/* Quick Date Shortcut Chips with DISTINCT HIGH-CONTRAST COLORS */}
                      <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                        {/* Hari Ini (Emerald Green) */}
                        <button
                          type="button"
                          onClick={() => handleJumpToDate(today)}
                          className="py-1.5 px-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 border border-emerald-500/40 text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                          title={
                            language === "en"
                              ? "Jump to Today"
                              : "Lompat ke Hari Ini"
                          }
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                          <span className="truncate">
                            {language === "en" ? "Today" : "Hari Ini"}
                          </span>
                        </button>

                        {/* Besok (Sky Blue) */}
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(today);
                            d.setDate(d.getDate() + 1);
                            handleJumpToDate(d);
                          }}
                          className="py-1.5 px-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-800 dark:text-sky-200 border border-sky-500/40 text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                          title={
                            language === "en"
                              ? "Jump to Tomorrow"
                              : "Lompat ke Besok"
                          }
                        >
                          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
                          <span className="truncate">
                            {language === "en" ? "Tmrw" : "Besok"}
                          </span>
                        </button>

                        {/* +7 Hari (Violet/Purple) */}
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(today);
                            d.setDate(d.getDate() + 7);
                            handleJumpToDate(d);
                          }}
                          className="py-1.5 px-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-800 dark:text-purple-200 border border-purple-500/40 text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                          title={
                            language === "en"
                              ? "Jump +7 Days"
                              : "Lompat +7 Hari ke Depan"
                          }
                        >
                          <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                          <span className="truncate">+7 Hari</span>
                        </button>

                        {/* Akhir Bulan (Amber/Gold) */}
                        <button
                          type="button"
                          onClick={() => {
                            const lastDay = new Date(
                              currentYear,
                              currentMonth + 1,
                              0,
                            );
                            handleJumpToDate(lastDay);
                          }}
                          className="py-1.5 px-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-500/40 text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                          title={
                            language === "en"
                              ? "Jump to End of Month"
                              : "Lompat ke Akhir Bulan Ini"
                          }
                        >
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                          <span className="truncate">
                            {language === "en" ? "End Mth" : "Akhir Bln"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* SECTION 2: PILIH TAHUN (DISTINCT INDIGO / BLUE THEME) */}
                    <div className="space-y-1.5 pt-1 border-t border-black/[0.04] dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {language === "en"
                            ? "2. Select Year (Indigo):"
                            : "2. Pilih Tahun (Indigo):"}
                        </span>
                        <span className="text-[10px] font-black font-mono text-slate-700 dark:text-slate-300">
                          {currentYear}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-indigo-50/60 dark:bg-slate-900/70 p-1 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                        <button
                          type="button"
                          onClick={() => setCurrentYear((y) => y - 1)}
                          className="w-7 h-7 rounded-lg neumorph-card flex items-center justify-center text-xs font-black text-[#18234A] dark:text-[#F8FAFC] hover:text-indigo-600 cursor-pointer"
                          title={
                            language === "en"
                              ? "Previous Year"
                              : "Tahun Sebelumnya"
                          }
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <span className="text-xs font-black font-mono text-indigo-700 dark:text-indigo-300">
                          {language === "en" ? "Year" : "Tahun"} {currentYear}
                        </span>

                        <button
                          type="button"
                          onClick={() => setCurrentYear((y) => y + 1)}
                          className="w-7 h-7 rounded-lg neumorph-card flex items-center justify-center text-xs font-black text-[#18234A] dark:text-[#F8FAFC] hover:text-indigo-600 cursor-pointer"
                          title={
                            language === "en" ? "Next Year" : "Tahun Berikutnya"
                          }
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quick Year Presets Row - DEEP INDIGO GRADIENT FOR ACTIVE */}
                      <div className="flex items-center justify-center gap-1 pt-0.5">
                        {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => setCurrentYear(yr)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer text-center ${
                              currentYear === yr
                                ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs font-black ring-1 ring-indigo-400/40"
                                : "neumorph-card text-slate-600 dark:text-slate-400 hover:text-indigo-600"
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
                          {language === "en"
                            ? "3. Select Month (Orange):"
                            : "3. Pilih Bulan (Oranye):"}
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
                        {(language === "en"
                          ? [
                              "Jan",
                              "Feb",
                              "Mar",
                              "Apr",
                              "May",
                              "Jun",
                              "Jul",
                              "Aug",
                              "Sep",
                              "Oct",
                              "Nov",
                              "Dec",
                            ]
                          : [
                              "Jan",
                              "Feb",
                              "Mar",
                              "Apr",
                              "Mei",
                              "Jun",
                              "Jul",
                              "Ags",
                              "Sep",
                              "Okt",
                              "Nov",
                              "Des",
                            ]
                        ).map((mName, mIdx) => {
                          const isSelectedMonth = currentMonth === mIdx;
                          const isCurrentRealMonth =
                            today.getFullYear() === currentYear &&
                            today.getMonth() === mIdx;

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
                                  ? "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs scale-102 ring-2 ring-orange-300 dark:ring-orange-600"
                                  : isCurrentRealMonth
                                    ? "ring-2 ring-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 neumorph-card font-black"
                                    : "neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-102 hover:text-[#FF6F3D]"
                              }`}
                            >
                              <span>{mName}</span>
                              {isCurrentRealMonth && !isSelectedMonth && (
                                <span
                                  className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500"
                                  title="Bulan Ini"
                                ></span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>,
                document.body,
              )}
          </div>
        </div>

        {/* Specific Material Tabs: Semua | Al-Qur'an | Pribadi | Pustaka | Kelas */}
        <div className="flex items-center gap-1.5 neumorph-inset p-1 rounded-2xl overflow-x-auto scrollbar-none">
          {/* 1. SEMUA */}
          <button
            type="button"
            onClick={() => handleFilterChange("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              filterType === "all"
                ? "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs"
                : "text-[#5E6D88] hover:text-[#18234A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>{language === "en" ? "All" : "Semua"}</span>
          </button>

          {/* 2. AL-QUR'AN */}
          <button
            type="button"
            onClick={() => handleFilterChange("quran")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              filterType === "quran"
                ? "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs"
                : "text-[#5E6D88] hover:text-[#18234A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>{language === "en" ? "Quran" : "Al-Qur'an"}</span>
            <span
              className={`px-1.5 py-0.2 text-[9px] font-black rounded-full leading-none shrink-0 ${
                filterType === "quran"
                  ? "bg-white/20 text-white"
                  : "bg-black/5 dark:bg-white/10 text-[#64748B] dark:text-[#94A3B8]"
              }`}
            >
              {(quranPages || []).filter((p) => p.isActive).length}
            </span>
          </button>

          {/* 3. PRIBADI (Kitab Mandiri) */}
          <button
            type="button"
            onClick={() => handleFilterChange("personal")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              filterType === "personal"
                ? "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs"
                : "text-[#5E6D88] hover:text-[#18234A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
            }`}
          >
            <BookMarked className="w-3.5 h-3.5 shrink-0" />
            <span>{language === "en" ? "Personal" : "Pribadi"}</span>
            <span
              className={`px-1.5 py-0.2 text-[9px] font-black rounded-full leading-none shrink-0 ${
                filterType === "personal"
                  ? "bg-white/20 text-white"
                  : "bg-black/5 dark:bg-white/10 text-[#64748B] dark:text-[#94A3B8]"
              }`}
            >
              {personalBooks.length}
            </span>
          </button>

          {/* 4. PUSTAKA */}
          <button
            type="button"
            onClick={() => handleFilterChange("library")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              filterType === "library"
                ? "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs"
                : "text-[#5E6D88] hover:text-[#18234A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
            }`}
          >
            <Library className="w-3.5 h-3.5 shrink-0" />
            <span>{language === "en" ? "Library" : "Pustaka"}</span>
            <span
              className={`px-1.5 py-0.2 text-[9px] font-black rounded-full leading-none shrink-0 ${
                filterType === "library"
                  ? "bg-white/20 text-white"
                  : "bg-black/5 dark:bg-white/10 text-[#64748B] dark:text-[#94A3B8]"
              }`}
            >
              {libraryBooks.length}
            </span>
          </button>

          {/* 5. KELAS */}
          <button
            type="button"
            onClick={() => handleFilterChange("class")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              filterType === "class"
                ? "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs"
                : "text-[#5E6D88] hover:text-[#18234A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5 shrink-0" />
            <span>{language === "en" ? "Class" : "Kelas"}</span>
            <span
              className={`px-1.5 py-0.2 text-[9px] font-black rounded-full leading-none shrink-0 ${
                filterType === "class"
                  ? "bg-white/20 text-white"
                  : "bg-black/5 dark:bg-white/10 text-[#64748B] dark:text-[#94A3B8]"
              }`}
            >
              {classBooks.length}
            </span>
          </button>
        </div>

        {/* Specific Book Selector (Dropdown / Selector Kitab) */}
        {filterType !== "quran" && currentCategoryBooks.length > 0 && (
          <div className="relative">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBookDropdownOpen((prev) => !prev)}
                className={`flex-1 px-3 py-2 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  selectedBookId
                    ? "neumorph-inset text-[#FF6F3D] ring-1 ring-[#FF6F3D]/30"
                    : "neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D]"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <BookMarked className="w-3.5 h-3.5 text-[#FF6F3D] shrink-0" />
                  <span className="truncate">
                    {selectedBookId && activeSelectedBook
                      ? `${activeSelectedBook.title}`
                      : filterType === "personal"
                        ? language === "en"
                          ? "All Personal Books (Accumulated)"
                          : "Semua Kitab Pribadi (Akumulatif)"
                        : filterType === "library"
                          ? language === "en"
                            ? "All Library Books (Accumulated)"
                            : "Semua Kitab Pustaka (Akumulatif)"
                          : filterType === "class"
                            ? language === "en"
                              ? "All Class Books (Accumulated)"
                              : "Semua Kitab Kelas (Akumulatif)"
                            : language === "en"
                              ? "All Books (Accumulated)"
                              : "Semua Kitab (Akumulatif)"}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {selectedBookId && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBookId(null);
                      }}
                      className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-[#5E6D88] hover:text-[#18234A]"
                      title={
                        language === "en"
                          ? "Show all books"
                          : "Tampilkan semua kitab"
                      }
                    >
                      <X className="w-3 h-3" />
                    </span>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform text-[#5E6D88] ${isBookDropdownOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>
            </div>

            {/* Dropdown Options */}
            <AnimatePresence>
              {isBookDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-1.5 z-30 neumorph-card p-1.5 rounded-2xl shadow-xl max-h-56 overflow-y-auto space-y-1"
                >
                  {/* Accumulated option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBookId(null);
                      setIsBookDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      !selectedBookId
                        ? "bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white shadow-xs"
                        : "hover:bg-black/[0.04] dark:hover:bg-white/[0.05] text-[#18234A] dark:text-[#F8FAFC]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {filterType === "personal"
                          ? language === "en"
                            ? "All Personal Books (Accumulated)"
                            : "Semua Kitab Pribadi (Akumulatif)"
                          : filterType === "library"
                            ? language === "en"
                              ? "All Library Books (Accumulated)"
                              : "Semua Kitab Pustaka (Akumulatif)"
                            : filterType === "class"
                              ? language === "en"
                                ? "All Class Books (Accumulated)"
                                : "Semua Kitab Kelas (Akumulatif)"
                              : language === "en"
                                ? "All Books (Accumulated)"
                                : "Semua Kitab (Akumulatif)"}
                      </span>
                    </div>
                    {!selectedBookId && (
                      <Check className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </button>

                  {/* Individual Books */}
                  {currentCategoryBooks.map((b) => {
                    const bookActiveCards = (items || []).filter(
                      (i) => i.bookId === b.id && i.isActive,
                    ).length;
                    const isSelected = selectedBookId === b.id;

                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setSelectedBookId(b.id);
                          setIsBookDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-semibold text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white font-bold shadow-xs"
                            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.05] text-[#18234A] dark:text-[#F8FAFC]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{b.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-1.5 py-0.2 text-[9px] rounded-full font-bold ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-black/5 dark:bg-white/10 text-[#8493AB]"
                            }`}
                          >
                            {bookActiveCards}{" "}
                            {language === "en" ? "active" : "kartu"}
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 2. CALENDAR MONTH GRID */}
      <div className="space-y-1.5">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
          {weekDayLabels.map((lbl, idx) => (
            <div
              key={lbl}
              className={`py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                idx === 4 || idx === 6
                  ? "text-[#FF6E65]"
                  : "text-[#64748B] dark:text-[#94A3B8]"
              }`}
            >
              {lbl}
            </div>
          ))}
        </div>

        {/* Day cells grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {calendarDays.map((day) => {
            const planned = scheduleData.plannedMap.get(day.dateStr);
            const qPlannedCount = planned?.quran.length || 0;
            const pPlannedCount = planned?.personal.length || 0;
            const totalPlanned = qPlannedCount + pPlannedCount;

            const isSelected = day.dateStr === selectedDateStr;
            const isToday = day.isToday;

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => {
                  setSelectedDateStr(day.dateStr);
                  setIsDetailsExpanded(true);
                }}
                className={`h-14 sm:h-16 p-1 rounded-2xl transition-all flex flex-col items-center justify-center relative cursor-pointer group ${
                  !day.isCurrentMonth
                    ? "opacity-20 pointer-events-none"
                    : isToday && isSelected
                      ? "neumorph-card ring-2 ring-emerald-500 dark:ring-emerald-400 scale-105 z-10 shadow-md bg-emerald-500/10"
                      : isToday
                        ? "neumorph-card ring-2 ring-emerald-500/60 dark:ring-emerald-400/60 bg-emerald-500/5"
                        : isSelected
                          ? "neumorph-card ring-2 ring-[#18234A] dark:ring-slate-300 scale-105 z-10 shadow-md"
                          : totalPlanned > 0
                            ? "neumorph-card hover:scale-[1.03]"
                            : "neumorph-card opacity-90 hover:opacity-100 hover:scale-[1.02]"
                }`}
              >
                {/* Date Number: Centered, distinct dark navy / white font (NEVER orange, completely separate from due total color) */}
                <div className="flex items-center justify-center relative my-0.5">
                  <span
                    className={`text-xs sm:text-sm font-black tracking-tight text-center ${
                      !day.isCurrentMonth
                        ? "text-slate-400 dark:text-slate-600"
                        : "text-[#18234A] dark:text-[#F8FAFC]"
                    }`}
                  >
                    {day.dayNumber}
                  </span>

                  {/* Subtle Today Beacon Indicator */}
                  {isToday && (
                    <span
                      className="absolute -top-1 -right-2 flex h-2 w-2"
                      title="Hari Ini"
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>

                {/* Total Due Badge (Warna total jatuh tempo: Oranye hangat, dibedakan jelas dari warna tanggal) */}
                {day.isCurrentMonth && totalPlanned > 0 ? (
                  <div className="flex items-center justify-center mt-0.5">
                    <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full font-black text-[9px] min-w-[18px] text-center bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white shadow-2xs leading-none">
                      {totalPlanned}
                    </span>
                  </div>
                ) : (
                  <span className="h-3 block" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SELECTED DATE DETAILS PANEL (BOUNDED SCROLLABLE CONTAINER, NO HISTORY STRIP) */}
      <div className="mt-3 pt-2.5 border-t border-black/[0.04] dark:border-white/5 rounded-3xl neumorph-inset p-2 overflow-hidden">
        {/* Header of Detail Box */}
        <div
          onClick={() => setIsDetailsExpanded((v) => !v)}
          className="p-2.5 sm:p-3 flex items-center justify-between gap-3 cursor-pointer rounded-2xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8.5 h-8.5 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center shrink-0 shadow-xs">
              <CalendarIcon className="w-4 h-4 text-white shrink-0" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-xs sm:text-sm text-[#18234A] dark:text-[#F8FAFC] capitalize truncate">
                  {selectedDateDetails.formattedTitle}
                </h4>
                {selectedDateDetails.isDateToday && (
                  <span className="px-2 py-0.2 rounded-full bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white font-extrabold text-[9px] shadow-2xs">
                    {language === "en" ? "Today" : "Hari Ini"}
                  </span>
                )}
                {selectedDateDetails.isFuture && (
                  <span className="px-2 py-0.2 rounded-full bg-amber-500 text-white font-bold text-[9px] shadow-2xs">
                    {language === "en" ? "Upcoming" : "Terjadwal"}
                  </span>
                )}
                {selectedDateDetails.isPast && (
                  <span className="px-2 py-0.2 rounded-full bg-slate-500 text-white font-bold text-[9px] shadow-2xs">
                    {language === "en" ? "Past Day" : "Lampau"}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] mt-0.5 font-medium truncate">
                {selectedDateDetails.totalPlanned > 0
                  ? `${selectedDateDetails.totalPlanned} ${language === "en" ? "items scheduled for murajaah" : "materi terjadwal murajaah"}`
                  : language === "en"
                    ? "No reviews scheduled on this date"
                    : "Tidak ada jadwal murajaah pada tanggal ini"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedDateDetails.isDateToday &&
              selectedDateDetails.totalPlanned > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedDateDetails.plannedQuran.length > 0) {
                      onOpenQuranReview();
                    } else {
                      onOpenPersonalReview();
                    }
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>
                    {language === "en" ? "Review Now" : "Mulai Murajaah"}
                  </span>
                </button>
              )}
            <button
              type="button"
              className="w-7 h-7 rounded-xl neumorph-card flex items-center justify-center text-[#18234A] dark:text-[#F8FAFC] cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${isDetailsExpanded ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Expandable Items Content with Bound Height & Scrollable List */}
        <AnimatePresence>
          {isDetailsExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-black/[0.04] dark:border-white/5 p-2.5 sm:p-3 space-y-2.5"
            >
              {/* PLANNED REVIEWS (BOUNDED HEIGHT CONTAINER) */}
              {selectedDateDetails.totalPlanned > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] uppercase tracking-wider">
                    <span>
                      {language === "en"
                        ? "Scheduled Material:"
                        : "Rincian Materi Terjadwal:"}
                    </span>
                    <span>
                      ({selectedDateDetails.totalPlanned}{" "}
                      {language === "en" ? "items" : "item"})
                    </span>
                  </div>

                  {/* Scrollable container to avoid stretching the card endlessly */}
                  <div className="max-h-60 sm:max-h-72 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-orange-300/40 dark:scrollbar-thumb-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Quran Pages */}
                      {selectedDateDetails.plannedQuran.map((p) => {
                        const stabilityDays = Math.round(
                          (p.fsrsData?.stability || 0) * 0.4025587,
                        );
                        const isMapan =
                          p.status === "mastered_for_now" ||
                          stabilityDays >= 30;

                        return (
                          <div
                            key={p.pageNumber}
                            className="p-2.5 rounded-2xl neumorph-card flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-[#18234A] dark:text-[#F8FAFC] truncate">
                                  Hal {p.pageNumber} • Juz {p.juzNumber}
                                </span>
                                {isMapan ? (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500 text-white shadow-2xs">
                                    Mapan ({stabilityDays}d)
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-white shadow-2xs">
                                    Aktif ({stabilityDays}d)
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] truncate mt-0.5 font-medium">
                                QS. {p.surahNameEn} ({p.ayahRange || "Ayat"})
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => onOpenMushafViewer(p.pageNumber)}
                                title={
                                  language === "en"
                                    ? "View Page"
                                    : "Lihat Halaman"
                                }
                                className="w-7 h-7 rounded-xl neumorph-inset flex items-center justify-center text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {selectedDateDetails.isDateToday && (
                                <button
                                  type="button"
                                  onClick={() => onOpenQuranReview(p.juzNumber)}
                                  title={
                                    language === "en"
                                      ? "Review Page"
                                      : "Murajaah"
                                  }
                                  className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all shadow-xs"
                                >
                                  <Play className="w-3.5 h-3.5 fill-white" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Personal Cards */}
                      {selectedDateDetails.plannedPersonal.map(
                        ({ item: it, bookTitle }) => {
                          const stabilityDays = Math.round(
                            (it.fsrsData?.stability || 0) * 0.4025587,
                          );

                          return (
                            <div
                              key={it.id}
                              className="p-2.5 rounded-2xl neumorph-card flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-xs text-[#18234A] dark:text-[#F8FAFC] truncate">
                                    {bookTitle}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#FF6F3D] text-white shadow-2xs">
                                    {stabilityDays}d
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] line-clamp-1 mt-0.5 font-medium">
                                  {it.question ||
                                    (language === "en"
                                      ? "Card Item"
                                      : "Kartu Materi")}
                                </p>
                              </div>

                              {selectedDateDetails.isDateToday && (
                                <button
                                  type="button"
                                  onClick={onOpenPersonalReview}
                                  title={
                                    language === "en"
                                      ? "Review Card"
                                      : "Murajaah"
                                  }
                                  className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] flex items-center justify-center text-white cursor-pointer shrink-0 active:scale-95 transition-all shadow-xs"
                                >
                                  <Play className="w-3.5 h-3.5 fill-white" />
                                </button>
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ZERO STATE FOR SELECTED DATE */}
              {selectedDateDetails.totalPlanned === 0 && (
                <div className="py-4 text-center space-y-1">
                  <p className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC]">
                    {language === "en"
                      ? "No review sessions scheduled on this date."
                      : "Tidak ada jadwal murajaah pada tanggal ini."}
                  </p>
                  <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] max-w-sm mx-auto font-medium">
                    {language === "en"
                      ? "Enjoy your free time, or use it for adding new memorization (Ziyadah) or reading."
                      : "Waktu luang optimal untuk menambah hafalan baru (Ziyadah) atau memperdalam pemahaman materi."}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
