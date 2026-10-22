import React, { useEffect, useState } from "react";
import { BookItem, Language } from "../../types";
import {
  isDue,
  isReviewedToday,
  getNonQuranIntervalDays,
  predictNonQuranIntervals,
} from "../../lib/fsrs";
import { BilingualCardText } from "../common/BilingualCardText";
import { AdaptiveFlashcardImage } from "../common/AdaptiveFlashcardImage";
import { AudioRecorderPlayer } from "../shared/AudioRecorderPlayer";
import { AudioStorageService } from "../../lib/AudioStorageService";
import { soundEffects } from "../../lib/soundFeedback";
import { triggerXpReward } from "../common/FloatingXpToast";
import { ImageLightboxModal } from "../common/ImageLightboxModal";
import {
  BookOpen,
  Brain,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  Edit2,
  Eye,
  Flame,
  Lock,
  Maximize2,
  Mic,
  MoreVertical,
  Play,
  Power,
  RefreshCw,
  Square,
  Trash2,
  Unlock,
  X,
} from "lucide-react";

export interface ItemRowProps {
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  isReadonly?: boolean;
  item: BookItem;
  onPreview: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onReview?: (rating: 1 | 2 | 3 | 4) => void;
  /** Teachers grading a student must not collect XP themselves. */
  skipXpReward?: boolean;
  onDelete?: () => void;
  onMove?: () => void;
  isBulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  language: Language;
}

export const ItemCardRow: React.FC<ItemRowProps & { onEdit?: () => void }> = ({
  item,
  onPreview,
  onEdit,
  onActivate,
  onDeactivate,
  onReview,
  skipXpReward,
  onDelete,
  onMove,
  isBulkMode,
  isSelected,
  onToggleSelect,
  language,
  activeMenuId,
  setActiveMenuId,
  isReadonly
}) => {
  const [showInlineQuestion, setShowInlineQuestion] = useState(true);
  const [showInlineAnswer, setShowInlineAnswer] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [justReviewedRating, setJustReviewedRating] = useState<number | null>(null);
  const [showAudio, setShowAudio] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string | null; title: string } | null>(null);
  const [allowEarlyReview, setAllowEarlyReview] = useState(false);

  useEffect(() => {
    let mounted = true;
    AudioStorageService.hasAudio(item.id).then(exists => {
      if (mounted) setHasAudio(exists);
    });

    const handleAudioChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemId: string | number }>;
      if (String(customEvent.detail?.itemId) === String(item.id)) {
        AudioStorageService.hasAudio(item.id).then(exists => {
          if (mounted) setHasAudio(exists);
        });
      }
    };

    window.addEventListener('audio-updated', handleAudioChange);

    return () => {
      mounted = false;
      window.removeEventListener('audio-updated', handleAudioChange);
    };
  }, [item.id]);

  const isDueToday = isDue(item.fsrsData?.nextReview, item.isActive, item.fsrsData?.lastReview);
  const reviewedToday = isReviewedToday(item.fsrsData.lastReview);
  const showDimmed = reviewedToday && !isDueToday;
  const intervalDays = getNonQuranIntervalDays(item.fsrsData);
  const isMapan = item.isActive && (intervalDays >= 336 || item.status === 'mastered');
  const intervals = predictNonQuranIntervals(item.fsrsData);
  
  const formatDate = (d: string | null) => {
    if (!d) return language === 'en' ? 'Today' : 'Hari ini';
    const nextDate = new Date(d);
    const formatted = nextDate.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { month: 'short', day: 'numeric' });
    if (isDueToday) {
      return language === 'en' ? `Today (${formatted})` : `Hari ini (${formatted})`;
    }
    return formatted;
  };

  const getFullDueDateStr = (d: string | null) => {
    if (!d) return language === 'en' ? 'Today' : 'Hari ini';
    const nextDate = new Date(d);
    return nextDate.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const menuId = `item-${item.id}`;
  const isMenuOpen = activeMenuId === menuId;

  return (
    <div className={`group relative p-3 sm:p-3.5 transition-all flex flex-col justify-between gap-2 rounded-2xl ${isMenuOpen ? 'z-50 ring-2 ring-amber-500/20' : ''} ${
      isSelected
        ? 'ring-2 ring-amber-500 shadow-md clay-card-subtle'
        : isDueToday
        ? 'clay-card-subtle ring-1.5 ring-[#FF6E65]/60 shadow-[0_4px_16px_rgba(255,110,101,0.15)]'
        : item.isActive
        ? 'clay-card-subtle'
        : 'border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 opacity-75 hover:opacity-100'
    }`}>
      
      {/* Top Header Bar: Activation Power Button + Metrics (Flame, Brain, Due Date) + Action Pods (Mic, Toggle Jawaban, More Options) */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-black/[0.04] dark:border-white/[0.04]">
        {/* Left: Checkbox (if bulk) + Power Button + Metrics */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {/* Bulk Selection Checkbox */}
          {isBulkMode && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleSelect?.(); }}
              className="p-1 rounded-md text-amber-600 hover:scale-105 transition-transform shrink-0 cursor-pointer"
              title={isSelected ? 'Deselect' : 'Select'}
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-[#F27A3D]" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}

          {/* Quick 1-Touch Power/Active Button (Al-Qur'an Style: Blue for Activation) */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); item.isActive ? onDeactivate() : onActivate(); }}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 ${
              item.isActive
                ? 'bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] text-white shadow-[0_2px_8px_rgba(14,165,233,0.35)] hover:scale-105'
                : 'clay-pill text-slate-400 dark:text-slate-500 hover:text-[#0EA5E9] hover:scale-105'
            }`}
            title={item.isActive 
              ? (language === 'en' ? 'Deactivate Card' : 'Nonaktifkan Kartu')
              : (language === 'en' ? 'Activate Card' : 'Aktifkan Kartu')
            }
          >
            {item.isActive ? (
              <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
            ) : (
              <Power className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {/* Mapan Badge (Green is for Mapan) */}
          {isMapan && (
            <span 
              className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] flex items-center gap-1 border border-emerald-500/20 shrink-0" 
              title={language === 'en' ? `Mastered (Interval: ${intervalDays} days)` : `Kartu Mapan (Interval: ${intervalDays} hari)`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>{language === 'en' ? 'Mastered' : 'Mapan'}</span>
            </span>
          )}

          {/* Compact Metrics: Flame (Reps) + Brain (Interval) + Calendar (Due) */}
          <div className="flex items-center gap-2 text-xs min-w-0">
            <div 
              className="flex items-center gap-1 text-slate-500 dark:text-slate-400 shrink-0" 
              title={language === 'en' ? `Reviewed: ${item.fsrsData.reps} times` : `Direview: ${item.fsrsData.reps} kali`}
            >
              <Flame className="w-3.5 h-3.5 text-[#FF6E65] fill-[#FF6E65] shrink-0" />
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{item.fsrsData.reps}×</span>
            </div>

            <div 
              className="flex items-center gap-1 text-slate-500 dark:text-slate-400 shrink-0" 
              title={language === 'en' ? `Interval: ${intervalDays} days` : `Interval: ${intervalDays} hari`}
            >
              <Brain className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{intervalDays}d</span>
            </div>

            <div 
              className="flex items-center gap-1 text-slate-500 dark:text-slate-400 truncate max-w-[75px] sm:max-w-[110px]" 
              title={language === 'en' ? `Due Date: ${getFullDueDateStr(item.fsrsData.nextReview)}` : `Jatuh tempo: ${getFullDueDateStr(item.fsrsData.nextReview)}`}
            >
              <CalendarClock className={`w-3.5 h-3.5 shrink-0 ${isDueToday ? 'text-[#FF6E65]' : 'text-slate-400'}`} />
              <span className={`text-[10.5px] font-semibold truncate ${isDueToday ? 'text-[#FF6E65] font-black' : ''}`}>
                {formatDate(item.fsrsData.nextReview)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Action Pods: [Mic Audio] + [👁 Jawaban] + [More Options ...] */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Audio Mic Button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowAudio(!showAudio); }}
            className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 ${
              showAudio
                ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-[0_2px_8px_rgba(255,111,61,0.4)]'
                : hasAudio 
                ? 'bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]' 
                : 'clay-pill text-slate-500 dark:text-slate-400 hover:text-indigo-600'
            }`}
            title={language === 'en' ? 'Voice Recording' : 'Rekaman Suara Mandiri'}
          >
            <Mic className="w-3.5 h-3.5" />
            {hasAudio && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Pop-up Button (Replaces old Answer toggle in header) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 clay-pill text-[#FF6F3D] dark:text-[#FF8A65] hover:bg-orange-50 dark:hover:bg-orange-950/40 shadow-2xs"
            title={language === 'en' ? 'Open full screen pop-up view' : 'Buka tampilan pop-up penuh'}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Pop-up' : 'Pop-up'}</span>
          </button>

          {/* More Options Menu */}
          {!isReadonly && (
            <div className="relative shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === menuId ? null : menuId); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {activeMenuId === menuId && (
                <div 
                  className="absolute right-0 top-full mt-1 w-28 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-30 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => { setActiveMenuId(null); onPreview(); }}
                    className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'en' ? 'Pop-up' : 'Pop-up'}</span>
                  </button>
                  {onEdit && (
                    <button
                      onClick={() => { setActiveMenuId(null); onEdit(); }}
                      className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{language === 'en' ? 'Edit' : 'Edit'}</span>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => { setActiveMenuId(null); onDelete(); }}
                      className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Delete' : 'Hapus'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Body: Intelligent Flashcard Front (Question) & Back (Answer) Flip Container */}
      <div className="py-1 min-w-0">
        {!showInlineAnswer ? (
          /* FRONT CARD (QUESTION) */
          <div 
            key={`inline-front-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              soundEffects.playCardFlip('forward');
              setShowInlineAnswer(true);
            }}
            className="w-full p-3 sm:p-4 rounded-2xl clay-card-subtle bg-[#EEF3FA] dark:bg-[#121B2B] border border-slate-200/80 dark:border-slate-800 hover:border-amber-400/50 dark:hover:border-amber-600/50 transition-all cursor-pointer group/card flex flex-col gap-2.5 relative animate-card-flip-reverse"
          >
            {/* Top Corner: Pertanyaan Label & Flip Card Button */}
            <div className="flex items-center justify-between gap-2 w-full">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {language === 'en' ? 'Question' : 'Pertanyaan'}
              </span>

              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  soundEffects.playCardFlip('forward');
                  setShowInlineAnswer(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl clay-pill text-amber-600 dark:text-amber-400 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer shadow-2xs group-hover/card:scale-105"
                title={language === 'en' ? 'Click to flip card' : 'Klik untuk balik kartu'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">
                  {language === 'en' ? 'Flip' : 'Balik'}
                </span>
              </div>
            </div>

            {/* If BOTH imageQ and question text exist: side-by-side (Image left, Structured Text right) */}
            {item.imageQ && item.imageQ.trim() !== '' && item.question?.trim() ? (
              <div className="flex flex-row items-stretch gap-3 sm:gap-4 w-full">
                {/* Visual Pod: Edge-to-edge presentation, fills container capacity without empty whitespace */}
                <div className="w-[42%] sm:w-[38%] max-w-[210px] shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs self-stretch flex items-stretch">
                  <AdaptiveFlashcardImage
                    src={item.imageQ}
                    alt="Pertanyaan"
                    title={language === 'en' ? 'Question Visual' : 'Gambar Pertanyaan'}
                    language={language}
                    fit="cover"
                    className="w-full h-full rounded-xl"
                    onEnlarge={() => setLightboxImage({ url: item.imageQ || null, title: language === 'en' ? 'Question Visual' : 'Gambar Pertanyaan' })}
                  />
                </div>
                {/* Text Content Pod: Top-aligned, dedicated card container styling, pristine typography */}
                <div className="flex-1 min-w-0 flex flex-col justify-start py-0.5">
                  <div className="w-full select-text p-2.5 sm:p-3 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60 shadow-2xs">
                    <BilingualCardText text={item.question} type="question" variant="card-list" clampLines={false} language={language} />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* If ONLY imageQ (no text): Centered full-width image */}
                {item.imageQ && item.imageQ.trim() !== '' && (
                  <div className="w-full rounded-xl overflow-hidden bg-white/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80 p-2 flex items-center justify-center shadow-2xs">
                    <AdaptiveFlashcardImage
                      src={item.imageQ}
                      alt="Pertanyaan"
                      title={language === 'en' ? 'Question Visual' : 'Gambar Pertanyaan'}
                      language={language}
                      onEnlarge={() => setLightboxImage({ url: item.imageQ || null, title: language === 'en' ? 'Question Visual' : 'Gambar Pertanyaan' })}
                    />
                  </div>
                )}

                {/* If ONLY question text (no image): Text displayed */}
                {item.question?.trim() && (
                  <div className="w-full min-w-0 select-text p-1 sm:p-1.5">
                    <BilingualCardText text={item.question} type="question" variant="card-list" language={language} />
                  </div>
                )}
              </>
            )}

            {/* Full-Width Audio Recorder / Player Footer (From left to right edge) */}
            {showAudio && (
              <div 
                className="pt-2 mt-1 border-t border-slate-200/60 dark:border-slate-800/60 w-full"
                onClick={e => e.stopPropagation()}
              >
                <AudioRecorderPlayer 
                  itemId={item.id}
                  itemType="book"
                  itemLabel={language === 'en' ? 'Voice Note' : 'Setoran Suara'}
                  language={language} 
                  compact={false}
                  variant="card"
                  onHasRecordingChange={setHasAudio}
                />
              </div>
            )}
          </div>
        ) : (
          /* BACK CARD (ANSWER) */
          <div 
            key={`inline-back-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              soundEffects.playCardFlip('backward');
              setShowInlineAnswer(false);
            }}
            className="w-full p-3 sm:p-4 rounded-2xl clay-card-subtle bg-[#FEFCE8] dark:bg-[#1F1B16] border border-amber-200/80 dark:border-amber-900/40 shadow-sm cursor-pointer group/card flex flex-col gap-2.5 relative animate-card-flip"
          >
            {/* Top Corner: Jawaban Label & Flip Back Button */}
            <div className="flex items-center justify-between gap-2 w-full">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {language === 'en' ? 'Answer' : 'Jawaban'}
              </span>

              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  soundEffects.playCardFlip('backward');
                  setShowInlineAnswer(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl clay-pill text-amber-700 dark:text-amber-300 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer shadow-2xs group-hover/card:scale-105"
                title={language === 'en' ? 'Click to flip back' : 'Klik untuk balik ke pertanyaan'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">
                  {language === 'en' ? 'Question' : 'Tanya'}
                </span>
              </div>
            </div>

            {/* If BOTH imageA and answer text exist: side-by-side (Image left, Structured Text right) */}
            {item.imageA && item.imageA.trim() !== '' && item.answer?.trim() ? (
              <div className="flex flex-row items-stretch gap-3 sm:gap-4 w-full">
                {/* Visual Pod: Edge-to-edge presentation, fills container capacity without empty whitespace */}
                <div className="w-[42%] sm:w-[38%] max-w-[210px] shrink-0 rounded-xl overflow-hidden bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 shadow-2xs self-stretch flex items-stretch">
                  <AdaptiveFlashcardImage
                    src={item.imageA}
                    alt="Jawaban"
                    title={language === 'en' ? 'Answer Visual' : 'Gambar Jawaban'}
                    language={language}
                    fit="cover"
                    className="w-full h-full rounded-xl"
                    onEnlarge={() => setLightboxImage({ url: item.imageA || null, title: language === 'en' ? 'Answer Visual' : 'Gambar Jawaban' })}
                  />
                </div>
                {/* Text Content Pod: Top-aligned, dedicated card container styling, pristine typography */}
                <div className="flex-1 min-w-0 flex flex-col justify-start py-0.5">
                  <div className="w-full select-text p-2.5 sm:p-3 rounded-xl bg-white/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 shadow-2xs">
                    <BilingualCardText text={item.answer} type="answer" variant="card-list" clampLines={false} language={language} />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* If ONLY imageA (no text): Centered full-width image */}
                {item.imageA && item.imageA.trim() !== '' && (
                  <div className="w-full rounded-xl overflow-hidden bg-white/75 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 p-2 flex items-center justify-center shadow-2xs">
                    <AdaptiveFlashcardImage
                      src={item.imageA}
                      alt="Jawaban"
                      title={language === 'en' ? 'Answer Visual' : 'Gambar Jawaban'}
                      language={language}
                      onEnlarge={() => setLightboxImage({ url: item.imageA || null, title: language === 'en' ? 'Answer Visual' : 'Gambar Jawaban' })}
                    />
                  </div>
                )}

                {/* If ONLY answer text (no image): Text displayed */}
                {item.answer?.trim() && (
                  <div className="w-full min-w-0 select-text p-1 sm:p-1.5">
                    <BilingualCardText text={item.answer} type="answer" variant="card-list" language={language} />
                  </div>
                )}
              </>
            )}

            {/* Explanation Button if available */}
            {item.explanation && (
              <div className="flex items-center justify-end pt-1.5 border-t border-amber-200/60 dark:border-amber-900/50">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExplanationModal(true);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-amber-900/80 text-amber-700 dark:text-amber-100 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs border border-amber-200/60"
                  title={language === 'en' ? 'Open detailed explanation' : 'Buka rincian penjelasan'}
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
                  <span>{language === 'en' ? 'Explanation' : 'Penjelasan'}</span>
                </button>
              </div>
            )}

            {/* Full-Width Audio Recorder / Player Footer (From left to right edge) */}
            {showAudio && (
              <div 
                className="pt-2 mt-1 border-t border-amber-200/60 dark:border-amber-900/50 w-full"
                onClick={e => e.stopPropagation()}
              >
                <AudioRecorderPlayer 
                  itemId={item.id}
                  itemType="book"
                  itemLabel={language === 'en' ? 'Voice Note' : 'Setoran Suara'}
                  language={language} 
                  compact={false}
                  variant="card"
                  onHasRecordingChange={setHasAudio}
                />
              </div>
            )}
          </div>
        )}
      </div>





      {/* 4 Evaluation / Rating Buttons (Active when card is Due and not reviewed today, or when unlocked for early review) */}
      {item.isActive ? (
        <div className="pt-2 border-t border-black/[0.03] dark:border-white/[0.04]">
          {(!isDueToday || reviewedToday) && !allowEarlyReview ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1 text-[10.5px] text-slate-500 dark:text-slate-400 px-0.5">
                <span className="flex items-center gap-1 font-medium truncate">
                  <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  {reviewedToday 
                    ? (language === 'en' ? 'Already reviewed today' : 'Sudah direview hari ini')
                    : (language === 'en' ? `Next review: ${formatDate(item.fsrsData.nextReview)}` : `Jadwal review: ${formatDate(item.fsrsData.nextReview)}`)}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAllowEarlyReview(true);
                  }}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-bold hover:underline cursor-pointer shrink-0 ml-1 flex items-center gap-1 transition-colors"
                  title={language === 'en' ? 'Unlock to review now' : 'Buka kunci untuk review sekarang'}
                >
                  <Unlock className="w-3 h-3" />
                  <span>
                    {reviewedToday
                      ? (language === 'en' ? 'Review Again' : 'Review Ulang')
                      : (language === 'en' ? 'Review Early' : 'Review Lebih Awal')}
                  </span>
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5 opacity-40 select-none">
                <button
                  type="button"
                  disabled
                  className="py-1.5 px-1 rounded-xl clay-rating-rose text-center flex flex-col items-center justify-center cursor-not-allowed"
                  title={language === 'en' ? 'Locked (Click Review Early to unlock)' : 'Terkunci (Klik Review Lebih Awal untuk membuka)'}
                >
                  <Lock className="w-3 h-3 text-rose-500 mb-0.5" />
                  <span className="text-[10px] font-bold leading-tight">{language === 'en' ? 'Again' : 'Lagi'}</span>
                </button>
                <button
                  type="button"
                  disabled
                  className="py-1.5 px-1 rounded-xl clay-rating-gold text-center flex flex-col items-center justify-center cursor-not-allowed"
                  title={language === 'en' ? 'Locked (Click Review Early to unlock)' : 'Terkunci (Klik Review Lebih Awal untuk membuka)'}
                >
                  <Lock className="w-3 h-3 text-amber-500 mb-0.5" />
                  <span className="text-[10px] font-bold leading-tight">{language === 'en' ? 'Hard' : 'Sulit'}</span>
                </button>
                <button
                  type="button"
                  disabled
                  className="py-1.5 px-1 rounded-xl clay-rating-emerald text-center flex flex-col items-center justify-center cursor-not-allowed"
                  title={language === 'en' ? 'Locked (Click Review Early to unlock)' : 'Terkunci (Klik Review Lebih Awal untuk membuka)'}
                >
                  <Lock className="w-3 h-3 text-emerald-500 mb-0.5" />
                  <span className="text-[10px] font-bold leading-tight">{language === 'en' ? 'Good' : 'Baik'}</span>
                </button>
                <button
                  type="button"
                  disabled
                  className="py-1.5 px-1 rounded-xl clay-rating-orange text-center flex flex-col items-center justify-center cursor-not-allowed"
                  title={language === 'en' ? 'Locked (Click Review Early to unlock)' : 'Terkunci (Klik Review Lebih Awal untuk membuka)'}
                >
                  <Lock className="w-3 h-3 text-[#FF6E65] mb-0.5" />
                  <span className="text-[10px] font-bold leading-tight">{language === 'en' ? 'Easy' : 'Mudah'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              {allowEarlyReview && (
                <div className="flex items-center justify-between text-[10px] text-amber-600 dark:text-amber-400 font-bold mb-1.5 px-1">
                  <span className="flex items-center gap-1">
                    <Unlock className="w-3 h-3" />
                    {language === 'en' ? 'Early Review Mode Active' : 'Mode Review Bebas Aktif'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAllowEarlyReview(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[10px] underline cursor-pointer"
                  >
                    {language === 'en' ? 'Cancel' : 'Batal'}
                  </button>
                </div>
              )}
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEffects.playRatingFeedback(1);
                    if (!skipXpReward) triggerXpReward(2, language === 'en' ? 'Card Review (+2 XP)' : 'Review Kartu (+2 XP)');
                    setAllowEarlyReview(false);
                    onReview?.(1);
                  }}
                  className="py-1.5 px-1 rounded-xl clay-rating-btn clay-rating-rose text-center transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                  title={language === 'en' ? 'Review again' : 'Lupa total / Ulang lagi'}
                >
                  <span className="text-[11px] font-bold leading-tight">{language === 'en' ? 'Again' : 'Lagi'}</span>
                  <span className="text-[9px] font-bold opacity-85 mt-0.5">{intervals.again}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEffects.playRatingFeedback(2);
                    if (!skipXpReward) triggerXpReward(2, language === 'en' ? 'Card Review (+2 XP)' : 'Review Kartu (+2 XP)');
                    setAllowEarlyReview(false);
                    onReview?.(2);
                  }}
                  className="py-1.5 px-1 rounded-xl clay-rating-btn clay-rating-gold text-center transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                  title={language === 'en' ? 'Hard to recall' : 'Ingat dengan susah payah'}
                >
                  <span className="text-[11px] font-bold leading-tight">{language === 'en' ? 'Hard' : 'Sulit'}</span>
                  <span className="text-[9px] font-bold opacity-85 mt-0.5">{intervals.hard}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEffects.playRatingFeedback(3);
                    if (!skipXpReward) triggerXpReward(4, language === 'en' ? 'Mastered Bonus (+4 XP)' : 'Mantap (+4 XP)');
                    setAllowEarlyReview(false);
                    onReview?.(3);
                  }}
                  className="py-1.5 px-1 rounded-xl clay-rating-btn clay-rating-emerald text-center transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                  title={language === 'en' ? 'Good recall' : 'Ingat dengan baik'}
                >
                  <span className="text-[11px] font-bold leading-tight">{language === 'en' ? 'Good' : 'Baik'}</span>
                  <span className="text-[9px] font-bold opacity-85 mt-0.5">{intervals.good}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEffects.playRatingFeedback(4);
                    if (!skipXpReward) triggerXpReward(4, language === 'en' ? 'Easy Bonus (+4 XP)' : 'Sangat Lancar (+4 XP)');
                    setAllowEarlyReview(false);
                    onReview?.(4);
                  }}
                  className="py-1.5 px-1 rounded-xl clay-rating-btn clay-rating-orange text-center transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                  title={language === 'en' ? 'Easy recall' : 'Sangat mudah / Refleks langsung hafal'}
                >
                  <span className="text-[11px] font-bold leading-tight">{language === 'en' ? 'Easy' : 'Mudah'}</span>
                  <span className="text-[9px] font-bold opacity-85 mt-0.5">{intervals.easy}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="pt-2 border-t border-black/[0.03] dark:border-white/[0.04]">
          <div className="p-2 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between gap-2 text-xs text-slate-500">
            <span className="text-[10.5px] font-medium">
              {language === 'en' ? 'Card is inactive. Activate to review.' : 'Kartu belum aktif. Aktifkan kartu untuk memulai review.'}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onActivate(); }}
              className="px-2.5 py-1 rounded-lg bg-sky-500 text-white font-bold text-[10.5px] hover:bg-sky-600 active:scale-95 transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>{language === 'en' ? 'Activate' : 'Aktifkan'}</span>
            </button>
          </div>
        </div>
      )}



      {/* Pop-up Modal for Material Explanation / Notes */}
      {showExplanationModal && item.explanation && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setShowExplanationModal(false);
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl clay-icon-pod-pacific flex items-center justify-center text-white shadow-xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold">
                    {language === 'en' ? 'Detailed Explanation & Material Notes' : 'Rincian Penjelasan & Catatan Materi'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {language === 'en' ? 'Additional reference for this knowledge card' : 'Materi lengkap pendukung kartu hafalan ini'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed select-text space-y-3 font-sans shadow-inner">
              <BilingualCardText 
                text={item.explanation}
                type="general"
                variant="detail-modal"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="px-5 py-2 rounded-xl clay-btn-primary text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                {language === 'en' ? 'Close' : 'Tutup Rincian'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Viewer for ItemCardRow */}
      <ImageLightboxModal 
        isOpen={Boolean(lightboxImage)}
        imageUrl={lightboxImage?.url || null}
        title={lightboxImage?.title}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};
