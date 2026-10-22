import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { BookItem, Chapter } from "../../types";
import { predictNonQuranIntervals } from "../../lib/fsrs";
import {
  X,
  Trophy,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Maximize2,
  RotateCw,
  Sparkles,
  HelpCircle,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import { AudioRecorderPlayer } from "../shared/AudioRecorderPlayer";
import { useSwipeGesture } from "../../hooks/useSwipeGesture";
import { soundEffects } from "../../lib/soundFeedback";
import { triggerXpReward } from "../common/FloatingXpToast";
import { BilingualCardText } from "../common/BilingualCardText";
import { ImageLightboxModal } from "../common/ImageLightboxModal";
import { AdaptiveFlashcardImage } from "../common/AdaptiveFlashcardImage";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  specificBookId?: string;
  specificChapterId?: string;
  customChapters?: Chapter[];
}

export const PersonalReviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  specificBookId,
  specificChapterId,
  customChapters,
}) => {
  const { personalStats, reviewItem, books, chapters, language } = useApp();
  const allChapters = customChapters && customChapters.length > 0 ? customChapters : chapters;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"forward" | "backward">(
    "forward",
  );
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionQueue, setSessionQueue] = useState<BookItem[]>([]);
  const [justRated, setJustRated] = useState<{
    rating: 1 | 2 | 3 | 4;
    label: string;
    interval: string;
  } | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{
    url: string | null;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const q = specificChapterId
        ? specificChapterId === "__unassigned__"
          ? personalStats.dueList.filter(
              (i) =>
                (!i.chapterId || !allChapters.some((c) => c.id === i.chapterId)) &&
                (specificBookId ? i.bookId === specificBookId : true),
            )
          : personalStats.dueList.filter(
              (i) => i.chapterId === specificChapterId,
            )
        : specificBookId
          ? personalStats.dueList.filter((i) => i.bookId === specificBookId)
          : personalStats.dueList;
      setSessionQueue(q);
      setCurrentIndex(0);
      setReviewedCount(0);
      setShowAnswer(false);
      setShowExplanation(false);
      setFlipDirection("forward");
      setJustRated(null);
      if (q.length === 0) {
        onClose();
      }
    } else {
      setSessionQueue([]);
    }
  }, [isOpen, specificBookId, specificChapterId, allChapters]);

  useEffect(() => {
    setShowExplanation(false);
  }, [currentIndex]);

  const queue = sessionQueue;
  const currentItem = queue[currentIndex] || null;
  const currentBook = currentItem
    ? books.find((b) => b.id === currentItem.bookId)
    : null;
  const currentChapter = currentItem
    ? (allChapters.find((c) => c.id === currentItem.chapterId) || chapters.find((c) => c.id === currentItem.chapterId))
    : null;
  const isFinished = queue.length > 0 && currentIndex >= queue.length;

  const handleToggleAnswer = () => {
    if (!currentItem) return;
    const nextState = !showAnswer;
    const dir = nextState ? "forward" : "backward";
    setFlipDirection(dir);
    soundEffects.playCardFlip(dir);
    setShowAnswer(nextState);
  };

  const handleRating = (rating: 1 | 2 | 3 | 4) => {
    if (!currentItem || justRated) return;

    // Tactile audio feedback & animated floating XP
    soundEffects.playRatingFeedback(rating);
    if (rating >= 3) {
      triggerXpReward(
        4,
        language === "en" ? "Mastered Bonus (+4 XP)" : "Mantap (+4 XP)",
      );
    } else {
      triggerXpReward(
        2,
        language === "en" ? "Card Review (+2 XP)" : "Review Kartu (+2 XP)",
      );
    }

    const intervals = predictNonQuranIntervals(currentItem.fsrsData);
    const ratingLabels = {
      1: language === "en" ? "Review Again" : "Perlu Diulang",
      2: language === "en" ? "Hard" : "Sukar / Berat",
      3: language === "en" ? "Good" : "Baik / Mantap",
      4: language === "en" ? "Easy" : "Sangat Lancar",
    };

    setJustRated({
      rating,
      label: ratingLabels[rating],
      interval: intervals[rating],
    });

    // Smooth transition to next card
    setTimeout(() => {
      reviewItem(currentItem.id, rating);
      const nextReviewedCount = reviewedCount + 1;
      setReviewedCount(nextReviewedCount);
      setShowAnswer(false);
      setFlipDirection("forward");
      setJustRated(null);

      if (currentIndex + 1 < queue.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Complete review session celebration & full session XP
        try {
          confetti({
            particleCount: 75,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // Confetti silent fallback
        }
        soundEffects.playMasteredCelebration();
        triggerXpReward(
          25,
          language === "en" ? "Session Complete!" : "Sesi Review Selesai!",
        );
        setCurrentIndex(queue.length);
      }
    }, 280);
  };

  // Keyboard accessibility: Space/Enter to flip, 1-4 to rate
  useEffect(() => {
    if (!isOpen || !currentItem || isFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.code === "Space" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleToggleAnswer();
      } else if (showAnswer && !justRated) {
        if (e.key === "1") {
          e.preventDefault();
          handleRating(1);
        } else if (e.key === "2") {
          e.preventDefault();
          handleRating(2);
        } else if (e.key === "3") {
          e.preventDefault();
          handleRating(3);
        } else if (e.key === "4") {
          e.preventDefault();
          handleRating(4);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentItem, showAnswer, justRated, isFinished]);

  // Swipe support during card review session
  useSwipeGesture(null, {
    disabled:
      !isOpen ||
      Boolean(
        typeof document !== "undefined" &&
        document.body.getAttribute("data-annotation-open") === "true",
      ),
    onSwipeRight: () => {
      if (isFinished) {
        onClose();
      } else if (showAnswer) {
        handleToggleAnswer(); // Flip back to question
      } else if (currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
        setShowAnswer(false);
      } else {
        onClose();
      }
    },
    onSwipeDown: () => {
      onClose();
    },
    onSwipeLeft: () => {
      if (isFinished) return;
      if (!showAnswer) {
        handleToggleAnswer(); // Flip to answer
      } else {
        handleRating(3); // Default to 'Good' on swipe left after answer is shown
      }
    },
    threshold: 45,
  });

  if (!isOpen) return null;

  const progressPercent =
    queue.length > 0
      ? Math.round(
          (Math.min(currentIndex + (isFinished ? 0 : 1), queue.length) /
            queue.length) *
            100,
        )
      : 100;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
      {/* Symmetrical Modal Envelope strictly consistent with QuranReviewModal */}
      <div className="neumorph-card bg-[#EEF2F7] dark:bg-[#141C2B] text-slate-900 dark:text-slate-100 w-full max-w-5xl xl:max-w-6xl h-[95vh] rounded-3xl shadow-2xl border border-white/60 dark:border-white/5 overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between bg-white/90 dark:bg-[#182236]/90 backdrop-blur-md shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(255,111,61,0.35)] shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base text-[#18234A] dark:text-[#F8FAFC] tracking-tight truncate">
                {currentBook
                  ? currentBook.title
                  : language === "en"
                    ? "Flashcard Review Session"
                    : "Sesi Review Kartu Jatuh Tempo"}
              </h3>
              <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-medium truncate">
                {currentBook
                  ? currentChapter
                    ? currentChapter.title
                    : chapters.some((c) => c.bookId === currentBook.id)
                      ? language === "en"
                        ? "Direct Cards (No Chapter)"
                        : "Kartu Langsung (Tanpa Bab)"
                      : language === "en"
                        ? "Book Flashcards"
                        : "Kartu Hafalan Buku"
                  : queue.length > 0
                    ? language === "en"
                      ? `${queue.length} flashcards due in this session`
                      : `${queue.length} kartu due untuk sesi ini`
                    : language === "en"
                      ? "All Due Flashcards"
                      : "Semua Kartu Jatuh Tempo"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isFinished && currentItem && (
              <span className="text-xs font-black px-3 py-1 rounded-full neumorph-card text-[#FF6F3D] shadow-2xs">
                {currentIndex + 1} / {queue.length}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl neumorph-card flex items-center justify-center text-[#5E6D88] hover:text-[#18234A] dark:text-[#94A3B8] dark:hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
              title={language === "en" ? "Close session" : "Tutup sesi"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual Review Progress Bar (Consistent with QuranReviewModal) */}
        {!isFinished && queue.length > 0 && (
          <div className="bg-white/40 dark:bg-black/20 px-4 sm:px-5 py-2 border-b border-black/[0.04] dark:border-white/[0.04] shrink-0">
            <div className="flex items-center justify-between text-xs text-[#5E6D88] dark:text-[#94A3B8] font-semibold mb-1">
              <span>
                {language === "en" ? "Session Progress" : "Progres Sesi"}:{" "}
                {Math.min(currentIndex + 1, queue.length)} / {queue.length} (
                {progressPercent}%)
              </span>
              <span className="font-black text-[#FF6F3D]">
                {Math.max(0, queue.length - currentIndex - 1)}{" "}
                {language === "en" ? "remaining" : "kartu tersisa"}
              </span>
            </div>
            <div className="w-full neumorph-inset h-2 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-[#FF7E4A] to-[#E65320] h-full rounded-full transition-all duration-300 ease-out shadow-xs"
                style={{
                  width: `${Math.min(100, Math.max(8, progressPercent))}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col min-h-0">
          {isFinished ? (
            /* Celebration Screen Matching QuranReviewModal */
            <div className="text-center py-8 my-auto space-y-4 max-w-md mx-auto animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white mx-auto flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-black text-[#18234A] dark:text-[#F8FAFC]">
                {language === "en"
                  ? "Review Session Complete!"
                  : "Sesi Review Kartu Selesai!"}
              </h4>
              <p className="text-sm text-[#5E6D88] dark:text-[#94A3B8] max-w-sm mx-auto font-medium">
                {language === "en"
                  ? `Alhamdulillah! You reviewed ${reviewedCount} card${reviewedCount === 1 ? "" : "s"}. Next review intervals have been updated.`
                  : `Alhamdulillah! Anda telah mereview ${reviewedCount} kartu materi. Jadwal pengulangan adaptif telah dihitung dan diperbarui.`}
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-br from-[#18234A] to-[#0E1626] text-white font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-sm shadow-md cursor-pointer"
                >
                  <span>
                    {language === "en"
                      ? "Return to Books"
                      : "Kembali ke Ruang Buku"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : !currentItem ? (
            /* Safe Fallback: Empty Queue */
            <div className="text-center py-8 my-auto space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-black text-[#18234A] dark:text-[#F8FAFC]">
                {language === "en"
                  ? "No Due Cards in This Session"
                  : "Tidak Ada Kartu yang Jatuh Tempo"}
              </h4>
              <p className="text-xs sm:text-sm text-[#5E6D88] dark:text-[#94A3B8] font-medium leading-relaxed">
                {language === "en"
                  ? "All flashcards in this selection are up to date! Keep up your steady learning rhythm."
                  : "Seluruh kartu flashcard pada pilihan ini telah dimurajaah atau belum jatuh tempo hari ini."}
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
            <div className="flex flex-col flex-1 min-h-0 space-y-2">
              {/* MAIN FLASHCARD CANVAS: Rock-Solid, Maximized Width and Height (Middle info bar removed for maximum reading area) */}
              <div className="flex-1 w-full rounded-3xl overflow-hidden relative flex items-center justify-center bg-[#F3F4F6] dark:bg-[#0B1120] shadow-inner border border-black/[0.06] dark:border-black/20 p-2 sm:p-4 md:p-6 min-h-0">
                {/* 3D Perspective Stage: Expanded Width and Height */}
                <div className="w-full max-w-4xl xl:max-w-5xl h-full flex flex-col relative perspective-1200">
                  {/* The Physical 3D Flip Card */}
                  <div
                    key={`review-card-${currentItem.id}-${showAnswer ? "answer" : "question"}`}
                    onClick={handleToggleAnswer}
                    className={`w-full h-full rounded-3xl p-5 sm:p-7 md:p-8 flex flex-col shadow-xl border cursor-pointer select-none transition-all relative overflow-hidden group ${
                      showAnswer
                        ? "bg-gradient-to-br from-[#FFFDF7] to-[#FFF8EA] dark:from-[#1D1B16] dark:to-[#171410] border-amber-300/70 dark:border-amber-900/50 text-[#18234A] dark:text-[#F8FAFC]"
                        : "bg-gradient-to-br from-white to-[#F8FAFC] dark:from-[#182236] dark:to-[#121B2B] border-slate-200/80 dark:border-slate-800 text-[#18234A] dark:text-[#F8FAFC]"
                    } ${flipDirection === "backward" ? "animate-card-flip-reverse" : "animate-card-flip"}`}
                  >
                    {!showAnswer ? (
                      /* FRONT FACE: QUESTION */
                      <>
                        {/* Top Card Face Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.05] shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#FF6F3D] animate-pulse" />
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#FF6F3D]">
                              {language === "en" ? "Question" : "Pertanyaan"}
                            </span>
                          </div>
                          {/* Subtle, Semi-Transparent Indicator */}
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#FF6F3D] transition-colors">
                            <RotateCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" />
                            <span className="text-[10px] sm:text-[11px] font-bold">
                              {language === "en" ? "Flip" : "Balik"}
                            </span>
                          </div>
                        </div>

                        {/* Centered Question Content with Optical Upper-Center Balance */}
                        <div className="flex-1 flex flex-col justify-center items-center text-center overflow-y-auto px-2 sm:px-6 py-4 min-h-0 w-full pb-8 sm:pb-14">
                          {currentItem.imageQ && (
                            <div
                              className="mb-4 max-h-56 rounded-2xl overflow-hidden shadow-xs shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <AdaptiveFlashcardImage
                                src={currentItem.imageQ}
                                alt="Question"
                                title={
                                  language === "en"
                                    ? "Question Image"
                                    : "Gambar Pertanyaan"
                                }
                                language={language}
                                onEnlarge={() =>
                                  setLightboxImage({
                                    url: currentItem.imageQ || null,
                                    title:
                                      language === "en"
                                        ? "Question Image"
                                        : "Gambar Pertanyaan",
                                  })
                                }
                              />
                            </div>
                          )}

                          {currentItem.question?.trim() && (
                            <div className="w-full select-text max-w-2xl mx-auto flex flex-col items-center justify-center">
                              <BilingualCardText
                                text={currentItem.question}
                                type="question"
                                variant="review"
                              />
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      /* BACK FACE: ANSWER */
                      <>
                        {/* Top Card Face Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.05] shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                              {language === "en" ? "Answer" : "Jawaban"}
                            </span>
                            {/* Toggle Explanation Button directly in Card Header */}
                            {currentItem.explanation && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowExplanation((prev) => !prev);
                                }}
                                className={`ml-2 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                                  showExplanation
                                    ? "bg-[#18234A] text-white dark:bg-[#F8FAFC] dark:text-[#18234A]"
                                    : "neumorph-card text-[#5E6D88] hover:text-[#18234A] dark:text-[#94A3B8]"
                                }`}
                                title={
                                  language === "en"
                                    ? "Toggle Explanation"
                                    : "Lihat Catatan Materi"
                                }
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>
                                  {showExplanation
                                    ? language === "en"
                                      ? "Hide Note"
                                      : "Tutup Catatan"
                                    : language === "en"
                                      ? "Note"
                                      : "Catatan"}
                                </span>
                              </button>
                            )}
                          </div>
                          {/* Subtle, Semi-Transparent Indicator */}
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#10B981] transition-colors">
                            <RotateCw className="w-2.5 h-2.5 group-hover:-rotate-180 transition-transform duration-300" />
                            <span className="text-[10px] sm:text-[11px] font-bold">
                              {language === "en" ? "Flip" : "Balik"}
                            </span>
                          </div>
                        </div>

                        {/* Centered Answer Content with Optical Upper-Center Balance */}
                        <div className="flex-1 flex flex-col justify-center items-center text-center overflow-y-auto px-2 sm:px-6 py-4 min-h-0 w-full pb-8 sm:pb-14">
                          {currentItem.imageA && (
                            <div
                              className="mb-4 max-h-56 rounded-2xl overflow-hidden shadow-xs shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <AdaptiveFlashcardImage
                                src={currentItem.imageA}
                                alt="Answer"
                                title={
                                  language === "en"
                                    ? "Answer Image"
                                    : "Gambar Jawaban"
                                }
                                language={language}
                                onEnlarge={() =>
                                  setLightboxImage({
                                    url: currentItem.imageA || null,
                                    title:
                                      language === "en"
                                        ? "Answer Image"
                                        : "Gambar Jawaban",
                                  })
                                }
                              />
                            </div>
                          )}

                          {currentItem.answer?.trim() && (
                            <div className="w-full select-text max-w-2xl mx-auto flex flex-col items-center justify-center">
                              <BilingualCardText
                                text={currentItem.answer}
                                type="answer"
                                variant="review"
                              />
                            </div>
                          )}

                          {/* Collapsible Explanation Accordion (Cleanly nested inside back face) */}
                          {currentItem.explanation && showExplanation && (
                            <div
                              className="mt-4 p-4 rounded-2xl clay-inset text-left w-full max-w-2xl text-[#18234A] dark:text-[#F8FAFC] select-text max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#FF6F3D] mb-1.5">
                                <FileText className="w-3 h-3" />
                                <span>
                                  {language === "en"
                                    ? "Material Explanation"
                                    : "Penjelasan Materi"}
                                </span>
                              </div>
                              <div className="text-xs sm:text-sm leading-relaxed">
                                <BilingualCardText
                                  text={currentItem.explanation}
                                  type="general"
                                  variant="detail-modal"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* BOTTOM RATING ACTION BAR: Always Anchored at Bottom with Rock-Solid Sizing */}
              <div className="mt-auto shrink-0 pt-1.5 space-y-1.5">
                {/* Soft confirmation micro-banner */}
                {justRated && (
                  <div className="flex items-center justify-center gap-2 py-1.5 px-4 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-md animate-in fade-in zoom-in-95 duration-150">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span className="text-xs font-black">
                      {justRated.label}
                    </span>
                    <span className="text-[11px] font-semibold opacity-90">
                      ({justRated.interval})
                    </span>
                  </div>
                )}

                {!showAnswer ? (
                  /* FRONT VIEW: Symmetrical Action Bar with Mic Recording on Question Face */
                  <div className="flex items-center gap-2 sm:gap-3 w-full">
                    <button
                      type="button"
                      onClick={handleToggleAnswer}
                      className="flex-1 h-11 sm:h-12 px-4 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white font-black text-sm shadow-[0_4px_14px_rgba(255,111,61,0.35)] transition-all active:scale-98 hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span>
                        {language === "en" ? "Show Answer" : "Buka Jawaban"}
                      </span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                    <div className="shrink-0 flex items-center justify-center">
                      <AudioRecorderPlayer
                        itemId={currentItem.id}
                        itemType="book"
                        itemLabel={
                          language === "en" ? "Voice Note" : "Setoran Suara"
                        }
                        language={language}
                        compact={true}
                        variant="review-front"
                      />
                    </div>
                  </div>
                ) : (
                  /* BACK VIEW: Minimalist Slim Audio Player ABOVE 4 Clean Feedback Buttons */
                  (() => {
                    const p = predictNonQuranIntervals(currentItem.fsrsData);
                    return (
                      <div className="space-y-2 w-full">
                        {/* Slim Minimalist Audio Playback Strip (Only renders when voice note exists!) */}
                        <AudioRecorderPlayer
                          itemId={currentItem.id}
                          itemType="book"
                          itemLabel={
                            language === "en" ? "Voice Note" : "Setoran Suara"
                          }
                          language={language}
                          compact={true}
                          variant="review-back"
                        />

                        {/* 4 FSRS Rating Buttons in Clean, Symmetrical 4-Column Grid */}
                        <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 w-full">
                          {/* 1. Lagi (Again) */}
                          <button
                            type="button"
                            onClick={() => handleRating(1)}
                            disabled={!!justRated}
                            className={`h-11 sm:h-12 px-1 sm:px-2 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs border ${
                              justRated?.rating === 1
                                ? "bg-rose-500 text-white scale-102 shadow-md border-rose-600"
                                : "bg-rose-50/90 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-900/60 hover:border-rose-300 active:scale-95"
                            }`}
                            title={
                              language === "en"
                                ? "Again (Shortcut: 1)"
                                : "Lagi (Shortcut: 1)"
                            }
                          >
                            <div className="flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap overflow-hidden">
                              <span className="font-black text-xs sm:text-sm leading-none">
                                {language === "en" ? "Again" : "Lagi"}
                              </span>
                              <span className="text-[10px] sm:text-xs font-bold opacity-75 leading-none">
                                · {p[1]}
                              </span>
                            </div>
                          </button>

                          {/* 2. Sulit (Hard) */}
                          <button
                            type="button"
                            onClick={() => handleRating(2)}
                            disabled={!!justRated}
                            className={`h-11 sm:h-12 px-1 sm:px-2 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs border ${
                              justRated?.rating === 2
                                ? "bg-amber-500 text-white scale-102 shadow-md border-amber-600"
                                : "bg-amber-50/90 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-900/60 hover:border-amber-300 active:scale-95"
                            }`}
                            title={
                              language === "en"
                                ? "Hard (Shortcut: 2)"
                                : "Sulit (Shortcut: 2)"
                            }
                          >
                            <div className="flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap overflow-hidden">
                              <span className="font-black text-xs sm:text-sm leading-none">
                                {language === "en" ? "Hard" : "Sulit"}
                              </span>
                              <span className="text-[10px] sm:text-xs font-bold opacity-75 leading-none">
                                · {p[2]}
                              </span>
                            </div>
                          </button>

                          {/* 3. Baik (Good) */}
                          <button
                            type="button"
                            onClick={() => handleRating(3)}
                            disabled={!!justRated}
                            className={`h-11 sm:h-12 px-1 sm:px-2 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs border ${
                              justRated?.rating === 3
                                ? "bg-blue-600 text-white scale-102 shadow-md border-blue-700"
                                : "bg-blue-50/90 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-900/60 hover:border-blue-300 active:scale-95"
                            }`}
                            title={
                              language === "en"
                                ? "Good (Shortcut: 3)"
                                : "Baik (Shortcut: 3)"
                            }
                          >
                            <div className="flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap overflow-hidden">
                              <span className="font-black text-xs sm:text-sm leading-none">
                                {language === "en" ? "Good" : "Baik"}
                              </span>
                              <span className="text-[10px] sm:text-xs font-bold opacity-75 leading-none">
                                · {p[3]}
                              </span>
                            </div>
                          </button>

                          {/* 4. Mudah (Easy) */}
                          <button
                            type="button"
                            onClick={() => handleRating(4)}
                            disabled={!!justRated}
                            className={`h-11 sm:h-12 px-1 sm:px-2 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs border ${
                              justRated?.rating === 4
                                ? "bg-emerald-600 text-white scale-102 shadow-md border-emerald-700"
                                : "bg-emerald-50/90 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-300 active:scale-95"
                            }`}
                            title={
                              language === "en"
                                ? "Easy (Shortcut: 4)"
                                : "Mudah (Shortcut: 4)"
                            }
                          >
                            <div className="flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap overflow-hidden">
                              <span className="font-black text-xs sm:text-sm leading-none">
                                {language === "en" ? "Easy" : "Mudah"}
                              </span>
                              <span className="text-[10px] sm:text-xs font-bold opacity-75 leading-none">
                                · {p[4]}
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Zoom Viewer for Flashcard Review */}
      <ImageLightboxModal
        isOpen={Boolean(lightboxImage)}
        imageUrl={lightboxImage?.url || null}
        title={lightboxImage?.title}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};
