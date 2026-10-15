import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import {
  ShieldCheck,
  BookOpen,
  Library,
  Layers,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Compass,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  calculateInterval,
  QURAN_TARGET_RETENTION,
  QURAN_MAX_INTERVAL_DAYS,
  NON_QURAN_TARGET_RETENTION,
  NON_QURAN_MAX_INTERVAL_DAYS,
} from "../../lib/fsrs";

type CategoryFilter = "all" | "quran" | "books";

export const MemoryStabilityPyramidWidget: React.FC = () => {
  const { quranPages, items, books, language, setActiveSpace } = useApp();
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

  // Compute stability metrics across all active materials
  const pyramidData = useMemo(() => {
    const activeQuran = (quranPages || []).filter((p) => p.isActive);
    const activeItems = (items || []).filter((it) => it.isActive);

    const quranWithInterval = activeQuran.map((p) => {
      const stability = p.fsrsData?.stability || 0;
      const interval = calculateInterval(
        stability,
        QURAN_TARGET_RETENTION,
        QURAN_MAX_INTERVAL_DAYS,
      );
      const isMapan = p.status === "mastered_for_now" || interval >= 30;
      const isKokoh = interval >= 15 && interval < 30 && !isMapan;
      const isKonsolidasi = interval >= 7 && interval < 15;
      const isKritis = interval < 7;
      return {
        id: `quran-${p.pageNumber}`,
        title: `Hal ${p.pageNumber} • QS. ${p.surahNameEn}`,
        subtitle: `Juz ${p.juzNumber}`,
        interval,
        stability,
        type: "quran" as const,
        tier: isMapan
          ? "mapan"
          : isKokoh
            ? "kokoh"
            : isKonsolidasi
              ? "konsolidasi"
              : "kritis",
      };
    });

    const booksMap = new Map<string, string>();
    (books || []).forEach((b) => booksMap.set(b.id, b.title));

    const itemsWithInterval = activeItems.map((it) => {
      const stability = it.fsrsData?.stability || 0;
      const interval = calculateInterval(
        stability,
        NON_QURAN_TARGET_RETENTION,
        NON_QURAN_MAX_INTERVAL_DAYS,
      );
      const bTitle =
        booksMap.get(it.bookId) || (language === "en" ? "Book" : "Kitab");
      const isMapan = it.status === "mastered" || interval >= 336;
      const isKokoh = interval >= 100 && interval < 336 && !isMapan;
      const isKonsolidasi = interval >= 30 && interval < 100;
      const isKritis = interval < 30;
      return {
        id: `book-item-${it.id}`,
        title:
          it.question || (language === "en" ? "Card Item" : "Kartu Materi"),
        subtitle: bTitle,
        interval,
        stability,
        type: "book" as const,
        tier: isMapan
          ? "mapan"
          : isKokoh
            ? "kokoh"
            : isKonsolidasi
              ? "konsolidasi"
              : "kritis",
      };
    });

    const allMaterials = [
      ...(filter === "all" || filter === "quran" ? quranWithInterval : []),
      ...(filter === "all" || filter === "books" ? itemsWithInterval : []),
    ];

    const totalCount = allMaterials.length;

    // 4 FSRS Memory Stability Tiers
    const tierMapan = allMaterials.filter((m) => m.tier === "mapan");
    const tierKokoh = allMaterials.filter((m) => m.tier === "kokoh");
    const tierKonsolidasi = allMaterials.filter(
      (m) => m.tier === "konsolidasi",
    );
    const tierKritis = allMaterials.filter((m) => m.tier === "kritis");

    const badgeMap = {
      quran: {
        mapan: "≥ 30 Hari",
        kokoh: "15 – 29 Hari",
        konsolidasi: "7 – 14 Hari",
        kritis: "< 7 Hari",
      },
      books: {
        mapan: "≥ 336 Hari",
        kokoh: "100 – 335 Hari",
        konsolidasi: "30 – 99 Hari",
        kritis: "< 30 Hari",
      },
      all: {
        mapan:
          language === "en" ? "≥ 30d (Q) / 336d (B)" : "≥ 30h (Q) / 336h (K)",
        kokoh:
          language === "en"
            ? "15-29d (Q) / 100-335d (B)"
            : "15-29h (Q) / 100-335h (K)",
        konsolidasi:
          language === "en"
            ? "7-14d (Q) / 30-99d (B)"
            : "7-14h (Q) / 30-99h (K)",
        kritis: language === "en" ? "<7d (Q) / <30d (B)" : "<7h (Q) / <30h (K)",
      },
    };

    const currentBadge = badgeMap[filter];

    const tiers = [
      {
        id: "mapan",
        level: 4,
        name: language === "en" ? "Mastered / Long-Term" : "Mapan & Mutqin",
        badge: currentBadge.mapan,
        desc:
          language === "en"
            ? "Solid in long-term memory"
            : "Tersimpan kokoh di memori jangka panjang",
        colorFrom: "#10B981",
        colorTo: "#059669",
        textColor: "#059669",
        bgPill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        items: tierMapan,
        count: tierMapan.length,
        percent:
          totalCount > 0
            ? Math.round((tierMapan.length / totalCount) * 100)
            : 0,
        tip:
          language === "en"
            ? "Periodic maintenance will keep these effortlessly accessible."
            : "Cukup murajaah berkala untuk menjaga kelancaran permanen.",
      },
      {
        id: "kokoh",
        level: 3,
        name: language === "en" ? "Established / Stable" : "Kokoh & Bertumbuh",
        badge: currentBadge.kokoh,
        desc:
          language === "en"
            ? "Strong recall stability"
            : "Daya ingat kuat, menuju fase kemapanan penuh",
        colorFrom: "#0EA5E9",
        colorTo: "#0284C7",
        textColor: "#0284C7",
        bgPill: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
        items: tierKokoh,
        count: tierKokoh.length,
        percent:
          totalCount > 0
            ? Math.round((tierKokoh.length / totalCount) * 100)
            : 0,
        tip:
          language === "en"
            ? "Successful evaluations will elevate these to Mastered tier."
            : "Sesi evaluasi lancar berikutnya akan menaikkan materi ini ke level Mapan.",
      },
      {
        id: "konsolidasi",
        level: 2,
        name: language === "en" ? "Consolidating" : "Konsolidasi Memori",
        badge: currentBadge.konsolidasi,
        desc:
          language === "en"
            ? "Active neural consolidation"
            : "Dalam pembentukan jejak memori berkelanjutan",
        colorFrom: "#F59E0B",
        colorTo: "#D97706",
        textColor: "#D97706",
        bgPill: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        items: tierKonsolidasi,
        count: tierKonsolidasi.length,
        percent:
          totalCount > 0
            ? Math.round((tierKonsolidasi.length / totalCount) * 100)
            : 0,
        tip:
          language === "en"
            ? "Crucial phase: stay punctual with daily reviews."
            : "Fase krusial: jangan lewatkan jadwal agar intervalnya terus melipatganda.",
      },
      {
        id: "kritis",
        level: 1,
        name: language === "en" ? "Recent / Critical" : "Hafalan Baru & Kritis",
        badge: currentBadge.kritis,
        desc:
          language === "en"
            ? "Vulnerable to forgetting"
            : "Baru dihafal / masih rentan mengalami kelonggaran",
        colorFrom: "#FF7E4A",
        colorTo: "#E65320",
        textColor: "#E65320",
        bgPill: "bg-orange-500/10 text-[#FF6F3D] dark:text-orange-400",
        items: tierKritis,
        count: tierKritis.length,
        percent:
          totalCount > 0
            ? Math.round((tierKritis.length / totalCount) * 100)
            : 0,
        tip:
          language === "en"
            ? "Review daily until stability passes the threshold."
            : "Murajaah tepat waktu setiap hari agar segera lolos dari zona rentan.",
      },
    ];

    const masteredPercent =
      totalCount > 0 ? Math.round((tierMapan.length / totalCount) * 100) : 0;

    return { tiers, totalCount, masteredPercent };
  }, [quranPages, items, books, filter, language]);

  const activeSelectedTier = useMemo(() => {
    return pyramidData.tiers.find((t) => t.id === selectedTierId) || null;
  }, [pyramidData, selectedTierId]);

  return (
    <div className="neumorph-card p-4 sm:p-5 rounded-3xl space-y-4 h-full flex flex-col justify-between relative overflow-hidden">
      {/* 1. Header with Title & Filter Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8.5 h-8.5 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(16,185,129,0.35)]">
            <ShieldCheck className="w-4.5 h-4.5 text-white shrink-0" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#18234A] dark:text-[#F8FAFC] tracking-tight">
              {language === "en"
                ? "Memory Stability Pyramid"
                : "Piramida Stabilitas Memori"}
            </h3>
            <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-medium">
              {pyramidData.masteredPercent}%{" "}
              {language === "en"
                ? "in long-term retention"
                : "hafalan berstatus mapan"}{" "}
              ({pyramidData.totalCount}{" "}
              {language === "en" ? "total active" : "total materi"})
            </p>
          </div>
        </div>

        {/* Category Selector Capsule */}
        <div className="flex items-center gap-1 neumorph-inset p-1 rounded-2xl text-xs font-semibold self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setSelectedTierId(null);
            }}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              filter === "all"
                ? "bg-gradient-to-br from-[#10B981] to-[#059669] text-white font-bold shadow-xs"
                : "text-[#5E6D88] hover:text-[#18234A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
            }`}
          >
            {language === "en" ? "All" : "Semua"}
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("quran");
              setSelectedTierId(null);
            }}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              filter === "quran"
                ? "bg-gradient-to-br from-[#10B981] to-[#059669] text-white font-bold shadow-xs"
                : "text-[#5E6D88] hover:text-[#18234A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>{language === "en" ? "Quran" : "Al-Qur'an"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("books");
              setSelectedTierId(null);
            }}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              filter === "books"
                ? "bg-gradient-to-br from-[#10B981] to-[#059669] text-white font-bold shadow-xs"
                : "text-[#5E6D88] hover:text-[#18234A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
            }`}
          >
            <Library className="w-3 h-3" />
            <span>{language === "en" ? "Books" : "Kitab"}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive 3D Soft Clay Pyramid Blocks */}
      <div className="space-y-2 py-1">
        {pyramidData.tiers.map((tier) => {
          const isSelected = selectedTierId === tier.id;
          const barWidthPercent = Math.max(
            tier.percent,
            tier.count > 0 ? 12 : 6,
          );

          return (
            <div
              key={tier.id}
              onClick={() => setSelectedTierId(isSelected ? null : tier.id)}
              className={`p-2.5 sm:p-3 rounded-2xl transition-all cursor-pointer relative group ${
                isSelected
                  ? "neumorph-card ring-2 ring-[#10B981] scale-[1.01] shadow-md"
                  : "neumorph-card hover:scale-[1.01] hover:shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: tier.colorFrom }}
                  />
                  <span className="text-xs sm:text-sm font-bold text-[#18234A] dark:text-[#F8FAFC] truncate">
                    {tier.name}
                  </span>
                  <span
                    className={`px-2 py-0.2 rounded-full text-[9px] font-bold shrink-0 ${tier.bgPill}`}
                  >
                    {tier.badge}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-black text-[#18234A] dark:text-[#F8FAFC]">
                    {tier.count}{" "}
                    <span className="text-[10px] font-medium text-[#8493AB]">
                      ({tier.percent}%)
                    </span>
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-[#8493AB] transition-transform ${isSelected ? "rotate-90" : "group-hover:translate-x-0.5"}`}
                  />
                </div>
              </div>

              {/* 3D Soft Progress Bar */}
              <div className="w-full h-2.5 rounded-full neumorph-inset overflow-hidden p-0.5 relative">
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

      {/* 3. Selected Tier Detailed Breakdown Sheet */}
      <AnimatePresence>
        {activeSelectedTier && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="neumorph-inset p-3 rounded-2xl space-y-2.5 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                <span className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC]">
                  {activeSelectedTier.name} • {activeSelectedTier.count}{" "}
                  {language === "en" ? "items" : "materi"}
                </span>
              </div>
              <span className="text-[10px] text-[#5E6D88] dark:text-[#94A3B8] font-medium">
                {activeSelectedTier.badge}
              </span>
            </div>

            <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] leading-relaxed">
              💡{" "}
              <span className="font-semibold text-[#18234A] dark:text-[#F8FAFC]">
                {activeSelectedTier.tip}
              </span>
            </p>

            {/* Scrollable list of items in this tier */}
            {activeSelectedTier.items.length > 0 ? (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-emerald-300/40 dark:scrollbar-thumb-slate-700">
                {activeSelectedTier.items.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="px-2.5 py-1.5 rounded-xl neumorph-card flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-[#18234A] dark:text-[#F8FAFC] truncate max-w-[200px]">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-medium text-[#8493AB] shrink-0">
                      ~{item.interval} {language === "en" ? "days" : "hari"}
                    </span>
                  </div>
                ))}
                {activeSelectedTier.items.length > 8 && (
                  <p className="text-[10px] text-center text-[#8493AB] pt-1">
                    +{activeSelectedTier.items.length - 8}{" "}
                    {language === "en" ? "more items" : "materi lainnya"}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-center text-[#8493AB] py-2">
                {language === "en"
                  ? "No items in this tier currently."
                  : "Belum ada materi di tingkatan ini."}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
