import React, { useState, useEffect } from "react";
import { QuranPageItem, Language } from "../../types";
import { useApp } from "../../context/AppContext";
import {
  isDue,
  isReviewedToday,
  getIntervalDays,
  predictQuranIntervals,
} from "../../lib/fsrs";
import { AudioStorageService } from "../../lib/AudioStorageService";
import { AudioRecorderPlayer } from "../shared/AudioRecorderPlayer";
import { getQuranPageImageUrl } from "../../data/quranData";
import {
  Play,
  Power,
  MessageSquare,
  Eye,
  Flame,
  Brain,
  CalendarClock,
  Mic,
  Lock,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

interface Props {
  page: QuranPageItem;
  language: Language;
  onToggleActive: (pageNumber: number) => void;
  onOpenMapanModal: (page: QuranPageItem) => void;
  onOpenFeedbackModal: (page: QuranPageItem) => void;
  onOpenMushafViewer: (pageNumber: number) => void;
  onInlineReview?: (pageNumber: number, rating: 1 | 2 | 3) => void;
  isJustReviewed?: boolean;
  justReviewedRating?: 1 | 2 | 3;
  isHighlighted?: boolean;
}

export const QuranPageCard: React.FC<Props> = ({
  page,
  language,
  onToggleActive,
  onOpenMapanModal,
  onOpenFeedbackModal,
  onOpenMushafViewer,
  onInlineReview,
  isJustReviewed,
  justReviewedRating,
  isHighlighted,
}) => {
  const [showAudio, setShowAudio] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let mounted = true;
    AudioStorageService.hasAudio(page.pageNumber).then((exists) => {
      if (mounted) setHasAudio(exists);
    });

    const handleAudioChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemId: string | number }>;
      if (String(customEvent.detail?.itemId) === String(page.pageNumber)) {
        AudioStorageService.hasAudio(page.pageNumber).then((exists) => {
          if (mounted) setHasAudio(exists);
        });
      }
    };

    window.addEventListener("audio-updated", handleAudioChange);
    return () => {
      mounted = false;
      window.removeEventListener("audio-updated", handleAudioChange);
    };
  }, [page.pageNumber]);

  // Standard Madinah Mushaf Orientation:
  // Even page numbers (22, 24, 26, 62...) are on the LEFT side of the open Mushaf.
  // Odd page numbers (23, 25, 27, 63...) are on the RIGHT side of the open Mushaf.
  const isLeftPage = Number(page.pageNumber) % 2 === 0;

  const isDueToday = isDue(
    page.fsrsData.nextReview,
    page.isActive,
    page.fsrsData.lastReview,
  );
  const reviewedToday = isReviewedToday(page.fsrsData.lastReview);
  const showDimmed = reviewedToday && !isDueToday;
  const isMapan =
    page.status === "mastered_for_now" ||
    !!page.mapanCelebrated ||
    (page.fsrsData.stability || 0) * 0.4025587 >= 30;
  const isMutqinUnlocked = isMapan;

  const formatAccurateDueDate = () => {
    if (!page.fsrsData.nextReview)
      return language === "en" ? "Today" : "Hari ini";
    const nextDate = new Date(page.fsrsData.nextReview);
    const now = new Date();
    const isOverdue = nextDate <= now;
    const formatted = nextDate.toLocaleDateString(
      language === "id" ? "id-ID" : "en-US",
      {
        day: "numeric",
        month: "short",
      },
    );
    if (isOverdue) {
      return language === "en"
        ? `Today (${formatted})`
        : `Hari ini (${formatted})`;
    }
    return formatted;
  };

  const getFullDueDateStr = () => {
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

  const pageInterval =
    getIntervalDays(page.fsrsData) ||
    Math.max(1, Math.round((page.fsrsData.stability || 0) * 0.4025587));
  const unresolvedIssuesCount = page.issues
    ? page.issues.filter((i) => !i.isResolved).length
    : 0;
  const qIntervals = predictQuranIntervals(page.fsrsData, page.mapanSchedule);
  const pageImageUrl = getQuranPageImageUrl(page.pageNumber, 1024);

  /* ========================================================
     BAGIAN 1: THUMBNAIL ASLI LEMBARAN MUSHAF MADINAH (CLAYMORPHIC RECTANGULAR FRAME)
     - Bentuk Persegi Panjang Otentik (Kotak Lembaran)
     - Halaman Kiri: Sisi kiri kotak lurus (luar), sisi kanan melengkung berbayang (jilid buku tengah)
     - Halaman Kanan: Sisi kiri melengkung berbayang (jilid buku tengah), sisi kanan kotak lurus (luar)
     ======================================================== */
  const renderMushafThumbnail = () => (
    <div
      onClick={() => onOpenMushafViewer(page.pageNumber)}
      className={`relative w-22 sm:w-26 md:w-28 shrink-0 aspect-[1/1.45] overflow-hidden cursor-pointer group bg-[#FCFBF7] dark:bg-slate-950 transition-all hover:scale-[1.03] active:scale-95 select-none ${
        isLeftPage
          ? "rounded-l-[3px] rounded-r-[9px] border-l border-y border-r-2 border-amber-900/25 dark:border-amber-500/30 shadow-[3px_4px_12px_rgba(0,0,0,0.16)]"
          : "rounded-l-[9px] rounded-r-[3px] border-r border-y border-l-2 border-amber-900/25 dark:border-amber-500/30 shadow-[-3px_4px_12px_rgba(0,0,0,0.16)]"
      }`}
      title={`Buka Mushaf Cetak Halaman ${page.pageNumber}`}
    >
      {/* Real scanned Madani mushaf page */}
      {!imageError ? (
        <img
          src={pageImageUrl}
          alt={`Mushaf Halaman ${page.pageNumber}`}
          loading="lazy"
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover object-top select-none transition-transform group-hover:scale-105 ${
            isDueToday ? "filter blur-[1.5px] brightness-95" : ""
          }`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-amber-100/60 dark:bg-slate-800">
          <BookOpen className="w-6 h-6 text-amber-700/60 dark:text-amber-400/60 mb-1" />
          <span className="text-[10px] font-bold text-amber-900 dark:text-amber-200">
            Hal {page.pageNumber}
          </span>
        </div>
      )}

      {/* 3D Binding Spine Gutter Shadow (Lekukan jilid tengah buku) */}
      <div
        className={`absolute inset-y-0 pointer-events-none z-10 ${
          isLeftPage
            ? "right-0 w-3.5 bg-gradient-to-l from-black/50 via-black/15 to-transparent border-r border-black/35"
            : "left-0 w-3.5 bg-gradient-to-r from-black/50 via-black/15 to-transparent border-l border-black/35"
        }`}
      />

      {/* Hover Eye Overlay Indicator */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center pointer-events-none">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 text-white rounded-full p-1.5 shadow-md">
          <Eye className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );

  /* ========================================================
     BAGIAN 2: DETAIL INFORMASI, METRIK MEMORI & AKSI EVALUASI (CLAYMORPHIC)
     ======================================================== */
  const renderDetailsAndActions = () => (
    <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5 py-0.5">
      {/* Row 1: Header (Clay Badges, Title + Clay Action Pods) */}
      <div>
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            {/* Clay Badges */}
            {isDueToday && (
              <span className="px-2.5 py-0.5 rounded-full clay-badge-orange text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Flame className="w-2.5 h-2.5 fill-white text-white" />
                <span>Jatuh Tempo</span>
              </span>
            )}
            {isMapan && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMapanModal(page);
                }}
                className="px-2.5 py-0.5 rounded-full clay-badge-emerald text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs hover:scale-105 transition-transform cursor-pointer"
                title="Atur Ritme Murajaah Mapan"
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                <span>Mapan</span>
              </button>
            )}
            {!isDueToday && !isMapan && page.isActive && (
              <span className="px-2 py-0.5 rounded-full clay-pill text-[#5E6D88] dark:text-[#94A3B8] text-[9.5px] font-bold">
                Terkendali
              </span>
            )}
          </div>

          {/* Claymorphic Action Pods ([Catatan] [Mic] [Eye] [Play/Power]) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Catatan Kesalahan */}
            <button
              type="button"
              onClick={() => onOpenFeedbackModal(page)}
              className="relative w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-xl clay-icon-pod-neutral flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
              title="Catatan Evaluasi / Tajwid"
            >
              <MessageSquare className="w-3.5 h-3.5" strokeWidth={2.2} />
              {unresolvedIssuesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full clay-badge-rose text-white text-[7.5px] font-black flex items-center justify-center shadow-xs">
                  {unresolvedIssuesCount}
                </span>
              )}
            </button>

            {/* Voice Record */}
            <button
              type="button"
              onClick={() => setShowAudio(!showAudio)}
              className={`relative w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs ${
                showAudio || hasAudio
                  ? "clay-icon-pod-pacific text-white shadow-xs"
                  : "clay-icon-pod-neutral"
              }`}
              title="Rekaman Suara Tasmi' Mandiri"
            >
              <Mic className="w-3.5 h-3.5" strokeWidth={2.2} />
              {hasAudio && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#10B981] rounded-full ring-1 ring-white dark:ring-[#141C2B]" />
              )}
            </button>

            {/* Eye Mushaf */}
            <button
              type="button"
              onClick={() => onOpenMushafViewer(page.pageNumber)}
              className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-xl clay-icon-pod-neutral flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
              title="Lihat Mushaf Cetak Layar Penuh"
            >
              <Eye className="w-3.5 h-3.5" strokeWidth={2.2} />
            </button>

            {/* Activation Button */}
            <button
              type="button"
              onClick={() => onToggleActive(page.pageNumber)}
              className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 ${
                page.isActive
                  ? "clay-icon-pod-pacific text-white shadow-xs hover:scale-105"
                  : "clay-icon-pod-neutral hover:text-[#0EA5E9]"
              }`}
              title={page.isActive ? "Nonaktifkan Halaman" : "Aktivasi Halaman"}
            >
              {page.isActive ? (
                <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
              ) : (
                <Power className="w-3.5 h-3.5 text-[#8493AB]" />
              )}
            </button>
          </div>
        </div>

        {/* Page Title: Surah & Ayat */}
        <div
          onClick={() => onOpenMushafViewer(page.pageNumber)}
          className="mt-1.5 cursor-pointer group/title"
        >
          <h3 className="font-black text-xs sm:text-sm text-[#18234A] dark:text-[#F8FAFC] group-hover/title:text-[#FF6F3D] transition-colors leading-tight truncate">
            Hal {page.pageNumber} <span className="text-[#FF6F3D]">•</span>{" "}
            {page.surahNameEn}
          </h3>
          <p className="text-[10.5px] text-[#5E6D88] dark:text-[#94A3B8] font-semibold truncate mt-0.5">
            Ayat {page.ayahRange}
          </p>
        </div>
      </div>

      {/* Row 2: FSRS Memory Metrics Inset Bar (Reps, Interval, Next Review) */}
      {page.isActive ? (
        <div className="clay-inset px-2.5 py-1 rounded-xl flex items-center justify-between gap-1 text-[9.5px]">
          {/* Reps */}
          <div
            className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] shrink-0"
            title={`Sudah direview: ${page.fsrsData.reps} kali`}
          >
            <Flame className="w-2.5 h-2.5 text-[#FF6F3D] fill-[#FF6F3D] shrink-0" />
            <span className="font-black text-[#18234A] dark:text-[#F8FAFC]">
              {page.fsrsData.reps}×
            </span>
          </div>

          {/* Interval */}
          <div
            className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] shrink-0"
            title={`Interval murajaah: ${pageInterval} hari`}
          >
            <Brain className="w-2.5 h-2.5 text-[#5E6D88] dark:text-[#94A3B8] shrink-0" />
            <span className="font-bold text-[#18234A] dark:text-[#F8FAFC]">
              {pageInterval} hr
            </span>
          </div>

          {/* Due Date */}
          <div
            className="flex items-center gap-1 text-[#5E6D88] dark:text-[#94A3B8] truncate"
            title={`Jatuh tempo: ${getFullDueDateStr()}`}
          >
            <CalendarClock
              className={`w-2.5 h-2.5 shrink-0 ${isDueToday ? "text-[#FF6F3D]" : "text-[#8493AB]"}`}
            />
            <span
              className={`font-bold truncate ${isDueToday ? "text-[#FF6F3D] font-black" : ""}`}
            >
              {formatAccurateDueDate()}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-[9.5px] text-[#8493AB] italic px-1">
          Belum diaktivasi di jadwal murajaah
        </div>
      )}

      {/* Row 3: Claymorphic Evaluation Quick Rating (Belum: Orange, Lancar: Bright Blue, Mutqin: Emerald) */}
      {page.isActive ? (
        <div className="flex items-center gap-1.5 sm:gap-2 w-full justify-between">
          {/* Rating 1: Belum (Claymorphic Warna Orange Cerah & Hangat) */}
          <button
            type="button"
            onClick={() => {
              if (isDueToday && onInlineReview)
                onInlineReview(page.pageNumber, 1);
            }}
            disabled={!isDueToday || !onInlineReview}
            className={`py-1.5 px-1 sm:px-2 flex-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              isJustReviewed && justReviewedRating === 1
                ? "bg-gradient-to-b from-[#FB923C] via-[#F97316] to-[#EA580C] text-white scale-105 shadow-md ring-2 ring-orange-400"
                : isDueToday
                  ? "bg-gradient-to-b from-[#FB923C] via-[#F97316] to-[#EA580C] text-white hover:brightness-110 active:scale-95 shadow-[0_5px_14px_rgba(249,115,22,0.38),inset_0_2px_3px_rgba(255,255,255,0.85),inset_0_-2px_3px_rgba(0,0,0,0.18)] border border-orange-200/60 dark:border-orange-400/40"
                  : "clay-inset text-slate-700 dark:text-slate-200 font-bold cursor-not-allowed border border-amber-900/10 dark:border-slate-700/50"
            }`}
            title={
              !isDueToday
                ? `Hanya aktif saat jatuh tempo (${formatAccurateDueDate()})`
                : "Belum lancar (Review 1 hari)"
            }
          >
            <span
              className={`text-[10px] sm:text-[10.5px] font-black leading-tight drop-shadow-xs ${isDueToday ? "text-white" : "text-slate-700 dark:text-slate-200"}`}
            >
              {qIntervals.needReviewDays || 1} hr
            </span>
            <span
              className={`text-[8.5px] font-black uppercase tracking-wider leading-none mt-0.5 drop-shadow-xs ${isDueToday ? "text-white/95" : "text-slate-700 dark:text-slate-200"}`}
            >
              Belum
            </span>
          </button>

          {/* Rating 2: Lancar (Claymorphic Warna Biru Cerah / Sky Blue Tegas) */}
          <button
            type="button"
            onClick={() => {
              if (isDueToday && onInlineReview)
                onInlineReview(page.pageNumber, 2);
            }}
            disabled={!isDueToday || !onInlineReview}
            className={`py-1.5 px-1 sm:px-2 flex-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              isJustReviewed && justReviewedRating === 2
                ? "bg-gradient-to-b from-[#38BDF8] via-[#0284C7] to-[#0369A1] text-white scale-105 shadow-md ring-2 ring-sky-300"
                : isDueToday
                  ? "bg-gradient-to-b from-[#38BDF8] via-[#0284C7] to-[#0369A1] text-white hover:brightness-110 active:scale-95 shadow-[0_5px_14px_rgba(2,132,199,0.38),inset_0_2px_3px_rgba(255,255,255,0.85),inset_0_-2px_3px_rgba(0,0,0,0.18)] border border-sky-200/60 dark:border-sky-400/40"
                  : "clay-inset text-slate-700 dark:text-slate-200 font-bold cursor-not-allowed border border-amber-900/10 dark:border-slate-700/50"
            }`}
            title={
              !isDueToday
                ? `Hanya aktif saat jatuh tempo (${formatAccurateDueDate()})`
                : `Lancar (+${qIntervals.hardDays} hari)`
            }
          >
            <span
              className={`text-[10px] sm:text-[10.5px] font-black leading-tight drop-shadow-xs ${isDueToday ? "text-white" : "text-slate-700 dark:text-slate-200"}`}
            >
              +{qIntervals.hardDays} hr
            </span>
            <span
              className={`text-[8.5px] font-black uppercase tracking-wider leading-none mt-0.5 drop-shadow-xs ${isDueToday ? "text-white/95" : "text-slate-700 dark:text-slate-200"}`}
            >
              Lancar
            </span>
          </button>

          {/* Rating 3: Mutqin (Claymorphic Warna Hijau Zamrud) */}
          {isMutqinUnlocked ? (
            <button
              type="button"
              onClick={() => {
                if (isDueToday && onInlineReview)
                  onInlineReview(page.pageNumber, 3);
              }}
              disabled={!isDueToday || !onInlineReview}
              className={`py-1.5 px-1 sm:px-2 flex-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                isJustReviewed && justReviewedRating === 3
                  ? "bg-gradient-to-b from-[#34D399] via-[#10B981] to-[#059669] text-white scale-105 shadow-md ring-2 ring-emerald-300"
                  : isDueToday
                    ? "bg-gradient-to-b from-[#34D399] via-[#10B981] to-[#059669] text-white hover:brightness-110 active:scale-95 shadow-[0_5px_14px_rgba(16,185,129,0.38),inset_0_2px_3px_rgba(255,255,255,0.85),inset_0_-2px_3px_rgba(0,0,0,0.18)] border border-emerald-200/60 dark:border-emerald-400/40"
                    : "clay-inset text-slate-700 dark:text-slate-200 font-bold cursor-not-allowed border border-amber-900/10 dark:border-slate-700/50"
              }`}
              title={
                !isDueToday
                  ? `Hanya aktif saat jatuh tempo (${formatAccurateDueDate()})`
                  : `Mutqin (+${qIntervals.goodDays} hari)`
              }
            >
              <span
                className={`text-[10px] sm:text-[10.5px] font-black leading-tight drop-shadow-xs ${isDueToday ? "text-white" : "text-slate-700 dark:text-slate-200"}`}
              >
                +{qIntervals.goodDays} hr
              </span>
              <span
                className={`text-[8.5px] font-black uppercase tracking-wider leading-none mt-0.5 drop-shadow-xs ${isDueToday ? "text-white/95" : "text-slate-700 dark:text-slate-200"}`}
              >
                Mutqin
              </span>
            </button>
          ) : (
            <div
              className="py-1.5 px-1 sm:px-2 flex-1 rounded-2xl clay-inset flex flex-col items-center justify-center cursor-not-allowed select-none text-slate-700 dark:text-slate-200 border border-amber-900/10 dark:border-slate-700/50"
              title="Terkunci sampai halaman mencapai status Mapan (interval ≥ 30 hari)"
            >
              <div className="flex items-center gap-0.5 text-[9.5px] font-black leading-tight text-slate-700 dark:text-slate-200">
                <Lock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                <span>{qIntervals.goodDays}hr</span>
              </div>
              <span className="text-[8px] font-bold text-slate-600 dark:text-slate-300 leading-none mt-0.5">
                Mutqin
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[9.5px] text-[#8493AB] italic">
            Status Nonaktif
          </span>
          <button
            type="button"
            onClick={() => onToggleActive(page.pageNumber)}
            className="px-3 py-1 rounded-xl clay-btn-primary text-white text-[10.5px] font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
          >
            + Aktifkan
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div
      id={`quran-page-card-${page.pageNumber}`}
      className={`clay-card p-2.5 sm:p-3 rounded-3xl transition-all relative overflow-hidden group ${
        isHighlighted
          ? "ring-4 ring-[#0EA5E9] shadow-[0_0_30px_rgba(14,165,233,0.5)] scale-[1.01] z-10 duration-300"
          : isDueToday
            ? "ring-2 ring-[#FF6F3D]/80 shadow-[0_6px_20px_rgba(255,111,61,0.22)]"
            : showDimmed
              ? "opacity-85"
              : page.isActive
                ? ""
                : "opacity-70 hover:opacity-100"
      }`}
    >
      {/* 
        Uniform Left-Thumbnail Layout (No Zigzag):
        - Thumbnail always on the LEFT
        - Details & Actions always on the RIGHT
        - Spine curvature on thumbnail reflects whether it's a left page or right page
      */}
      <div className="flex items-stretch gap-2.5 sm:gap-3.5 w-full">
        {/* Sisi Kiri: Real Scanned Mushaf Page Thumbnail */}
        {renderMushafThumbnail()}
        {/* Sisi Kanan: Detail Informasi & Aksi */}
        {renderDetailsAndActions()}
      </div>

      {/* Inline Audio Recorder Player Drawer */}
      {showAudio && (
        <div className="mt-2.5 pt-2 border-t border-black/[0.04] dark:border-white/[0.04] animate-in fade-in duration-200">
          <AudioRecorderPlayer
            itemId={page.pageNumber}
            itemType="quran"
            itemLabel={`Hal ${page.pageNumber}`}
            language={language}
            variant="card"
            onHasRecordingChange={(has) => setHasAudio(has)}
            onOpenFeedback={() => onOpenFeedbackModal(page)}
          />
        </div>
      )}
    </div>
  );
};
