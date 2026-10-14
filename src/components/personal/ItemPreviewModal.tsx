import React, { useState, useEffect } from 'react';
import { BookItem, Language } from '../../types';
import { X, CheckCircle2, ChevronLeft, ChevronRight, BookOpen, ChevronDown, ChevronUp, FileText, Maximize2, Power, Layers, Play } from 'lucide-react';
import { AudioRecorderPlayer } from '../shared/AudioRecorderPlayer';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { BilingualCardText } from '../common/BilingualCardText';
import { ImageLightboxModal } from '../common/ImageLightboxModal';
import { AdaptiveFlashcardImage } from '../common/AdaptiveFlashcardImage';

interface Props {
  item: BookItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  language: Language;
}

export const ItemPreviewModal: React.FC<Props> = ({
  item,
  isOpen,
  onClose,
  onNavigateNext,
  onNavigatePrev,
  onActivate,
  onDeactivate,
  language,
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [lightbox, setLightbox] = useState<{ isOpen: boolean; url: string | null; title: string }>({
    isOpen: false,
    url: null,
    title: ''
  });

  useEffect(() => {
    setShowExplanation(false);
  }, [item?.id]);

  // Swipe to navigate between flashcards inside modal preview or dismiss
  useSwipeGesture(null, {
    disabled: !isOpen || Boolean(typeof document !== 'undefined' && document.body.getAttribute('data-annotation-open') === 'true'),
    onSwipeLeft: () => {
      if (onNavigateNext) onNavigateNext();
    },
    onSwipeRight: () => {
      if (onNavigatePrev) {
        onNavigatePrev();
      } else {
        onClose();
      }
    },
    onSwipeDown: () => {
      onClose();
    },
    threshold: 40,
  });

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="clay-modal w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header: Clean & Focused */}
        <div className="px-5 py-3.5 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl clay-icon-pod-orange flex items-center justify-center shrink-0 shadow-xs">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-[#18234A] dark:text-[#F8FAFC] truncate">
                  {language === "en" ? "Flashcard Detail" : "Detail Kartu Materi"}
                </span>
                <span className={`text-[10px] font-bold shrink-0 ${
                  item.isActive 
                    ? "text-sky-600 dark:text-sky-400" 
                    : "text-[#8493AB]"
                }`}>
                  {item.isActive ? (language === "en" ? "● Active" : "● Aktif") : (language === "en" ? "○ Inactive" : "○ Nonaktif")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(onNavigatePrev || onNavigateNext) && (
              <div className="flex items-center gap-0.5 clay-inset p-0.5 rounded-xl">
                <button
                  disabled={!onNavigatePrev}
                  onClick={onNavigatePrev}
                  className="p-1 rounded-lg text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC] disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title={language === "en" ? "Previous Card (Swipe Right)" : "Kartu Sebelumnya (Usap Kanan)"}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={!onNavigateNext}
                  onClick={onNavigateNext}
                  className="p-1 rounded-lg text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC] disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title={language === "en" ? "Next Card (Swipe Left)" : "Kartu Berikutnya (Usap Kiri)"}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl clay-icon-pod-neutral flex items-center justify-center text-[#5E6D88] hover:text-[#18234A] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
              title={language === "en" ? "Close" : "Tutup"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audio Recording Strip (Dedicated Clean Sub-Bar) */}
        <div className="px-5 py-2 bg-black/[0.015] dark:bg-white/[0.015] border-b border-black/[0.04] dark:border-white/[0.04] shrink-0">
          <AudioRecorderPlayer 
            itemId={item.id}
            itemType="book"
            itemLabel={language === "en" ? "Voice Note" : "Setoran Suara"}
            language={language} 
            compact={true}
            variant="mushaf-dock"
          />
        </div>
        {/* Content: Question (+ image) and Answer (+ image) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Question */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6F3D] block mb-1.5">
              {language === 'en' ? 'Question' : 'Pertanyaan'}
            </span>
            {item.imageQ && (
              <div className="mb-3">
                <AdaptiveFlashcardImage
                  src={item.imageQ}
                  alt="Question visual"
                  title={language === 'en' ? 'Question Visual' : 'Gambar Pertanyaan'}
                  language={language}
                  onEnlarge={() => setLightbox({ isOpen: true, url: item.imageQ || null, title: language === 'en' ? 'Question Visual' : 'Gambar Pertanyaan' })}
                />
              </div>
            )}
            {item.question?.trim() && (
              <div className="clay-card-subtle p-4 sm:p-5 rounded-2xl select-text">
                <BilingualCardText 
                  text={item.question} 
                  type="question" 
                  variant="detail-modal"
                  language={language}
                />
              </div>
            )}
          </div>

          {/* Answer */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1.5">
              {language === 'en' ? 'Answer' : 'Jawaban'}
            </span>
            {item.imageA && (
              <div className="mb-3">
                <AdaptiveFlashcardImage
                  src={item.imageA}
                  alt="Answer visual"
                  title={language === 'en' ? 'Answer Visual' : 'Gambar Jawaban'}
                  language={language}
                  onEnlarge={() => setLightbox({ isOpen: true, url: item.imageA || null, title: language === 'en' ? 'Answer Visual' : 'Gambar Jawaban' })}
                />
              </div>
            )}
            {item.answer?.trim() && (
              <div className="clay-card-subtle p-4 sm:p-5 rounded-2xl select-text">
                <BilingualCardText 
                  text={item.answer} 
                  type="answer" 
                  variant="detail-modal"
                  language={language}
                />
              </div>
            )}
          </div>

          {/* Explanation / Additional Material */}
          {item.explanation && (
            <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
              {showExplanation ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6F3D] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      {language === "en" ? "Explanation / Notes" : "Penjelasan"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowExplanation(false)}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC] clay-card-subtle flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                    >
                      <span>{language === "en" ? "Hide" : "Sembunyikan"}</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="clay-inset p-4 sm:p-5 rounded-2xl select-text animate-in fade-in duration-150">
                    <BilingualCardText 
                      text={item.explanation} 
                      type="general" 
                      variant="detail-modal"
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowExplanation(true)}
                  className="w-full py-2.5 px-3 rounded-2xl clay-inset text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#FF6F3D] dark:hover:text-[#FF6F3D] text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:scale-[1.01] active:scale-[0.99]"
                >
                  <BookOpen className="w-4 h-4 text-[#FF6F3D]" />
                  <span>{language === "en" ? "Explanation / Notes" : "Penjelasan"}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {!item.isActive && onActivate ? (
              <button
                type="button"
                onClick={onActivate}
                className="px-4 py-2 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span>{language === 'en' ? 'Activate Card' : 'Aktifkan Kartu'}</span>
              </button>
            ) : item.isActive && onDeactivate ? (
              <button
                type="button"
                onClick={onDeactivate}
                className="px-4 py-2 rounded-2xl clay-card-subtle text-[#5E6D88] hover:text-rose-600 font-bold text-xs transition-all cursor-pointer"
              >
                <span>{language === 'en' ? 'Deactivate Card' : 'Nonaktifkan Kartu'}</span>
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl clay-card-subtle text-[#18234A] dark:text-[#F8FAFC] font-bold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            {language === 'en' ? 'Close' : 'Tutup'}
          </button>
        </div>
      </div>

      {/* Lightbox Zoom Viewer */}
      <ImageLightboxModal 
        isOpen={lightbox.isOpen}
        imageUrl={lightbox.url}
        title={lightbox.title}
        onClose={() => setLightbox({ isOpen: false, url: null, title: '' })}
      />
    </div>
  );
};
