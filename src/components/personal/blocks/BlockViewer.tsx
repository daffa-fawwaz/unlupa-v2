import React, { useState, useEffect } from 'react';
import { 
  ContentBlock, ArabicWord, MultipleChoiceBlock, OrderingBlock 
} from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Languages, Eye, EyeOff, CheckCircle2, XCircle, 
  RotateCcw, ArrowUp, ArrowDown, HelpCircle, ListOrdered,
  Maximize2, X, PenLine, Link as LinkIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ImageAnnotationModal } from './ImageAnnotationModal';

interface BlockViewerProps {
  blocks: ContentBlock[];
}

export const isArabicScript = (text?: string): boolean => {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
};

export const BlockViewer: React.FC<BlockViewerProps> = ({ blocks }) => {
  return (
    <div className="space-y-8 w-full text-slate-800 dark:text-slate-200">
      {blocks.map((block) => (
        <div key={block.id} className="w-full">
          {block.type === 'text' && (
            <SmartTextViewer content={block.content || ''} />
          )}
          
          {block.type === 'image' && block.content && (
            <ImageViewerBlock src={block.content} />
          )}

          {block.type === 'arabic' && (
            <ArabicBlockViewer words={Array.isArray(block.content) ? block.content : []} />
          )}

          {block.type === 'multiple-choice' && (
            <MultipleChoiceBlockViewer block={block as MultipleChoiceBlock} />
          )}

          {block.type === 'ordering' && (
            <OrderingBlockViewer block={block as OrderingBlock} />
          )}

          {block.type === 'video' && block.content && (
            <VideoBlockViewer url={block.content as string} />
          )}
        </div>
      ))}
    </div>
  );
};

/* ========================================================================= */
/* --- 0. SMART TEXT & BILINGUAL VIEWER ------------------------------------ */
/* ========================================================================= */

const getRawTextFromChildren = (children: React.ReactNode): string => {
  if (!children) return '';
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(getRawTextFromChildren).join('');
  if (React.isValidElement(children)) {
    return getRawTextFromChildren((children.props as any)?.children);
  }
  return '';
};

/**
 * Isolates Arabic segments inside mixed paragraphs with <bdi>
 * so punctuation, quotes, and brackets never invert.
 */
const renderFormattedChildren = (children: React.ReactNode): React.ReactNode => {
  if (typeof children === 'string') {
    const arabicRegex = /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s،؛؟]{2,})/g;
    const parts = children.split(arabicRegex);
    if (parts.length <= 1) return children;
    return parts.map((part, i) => {
      if (i % 2 === 1 && /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(part)) {
        return (
          <bdi key={i} dir="rtl" className="font-arabic font-normal inline-block text-[1.15em] px-0.5 leading-normal text-amber-900 dark:text-amber-200">
            {part}
          </bdi>
        );
      }
      return part;
    });
  }
  if (Array.isArray(children)) {
    return children.map((c, idx) => (
      <React.Fragment key={idx}>
        {renderFormattedChildren(c)}
      </React.Fragment>
    ));
  }
  return children;
};

export const SmartTextViewer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed text-slate-800 dark:text-slate-200 w-full">
      <ReactMarkdown
        components={{
          p: ({ children }) => {
            const rawText = getRawTextFromChildren(children);
            const hasArabic = isArabicScript(rawText);
            const isPureArabic = hasArabic && !/[a-zA-Z]/.test(rawText);

            if (isPureArabic) {
              return (
                <p dir="rtl" className="font-arabic text-xl sm:text-2xl text-right leading-[2.3] text-amber-950 dark:text-amber-100 my-4 tracking-wide select-text">
                  {children}
                </p>
              );
            }

            // Mixed or Indonesian paragraph: strictly LTR with isolated Arabic
            return (
              <p dir="ltr" className="text-base sm:text-lg leading-relaxed text-slate-800 dark:text-slate-200 my-3 text-left">
                {renderFormattedChildren(children)}
              </p>
            );
          },
          blockquote: ({ children }) => {
            const rawText = getRawTextFromChildren(children);
            const isPureArabic = isArabicScript(rawText) && !/[a-zA-Z]/.test(rawText);

            if (isPureArabic) {
              return (
                <blockquote dir="rtl" className="my-5 p-4 sm:p-6 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border-r-4 border-amber-500 text-slate-800 dark:text-slate-200 shadow-2xs font-arabic text-right leading-loose not-italic">
                  {children}
                </blockquote>
              );
            }

            // Mixed or Indonesian callout: Left accent bar, LTR flow
            return (
              <blockquote dir="ltr" className="my-5 p-4 sm:p-6 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border-l-4 border-amber-500 text-slate-800 dark:text-slate-200 shadow-2xs text-left not-italic leading-relaxed">
                {children}
              </blockquote>
            );
          },
          li: ({ children }) => {
            const raw = getRawTextFromChildren(children);
            const isPureArab = isArabicScript(raw) && !/[a-zA-Z]/.test(raw);
            return (
              <li dir={isPureArab ? 'rtl' : 'ltr'} className={`my-1.5 leading-relaxed ${isPureArab ? 'text-right font-arabic' : 'text-left'}`}>
                {renderFormattedChildren(children)}
              </li>
            );
          },
          h1: ({ children }) => {
            const raw = getRawTextFromChildren(children);
            const isPureArab = isArabicScript(raw) && !/[a-zA-Z]/.test(raw);
            return (
              <h1 dir={isPureArab ? 'rtl' : 'ltr'} className={`font-bold my-4 ${isPureArab ? 'font-arabic text-3xl leading-loose text-amber-800 dark:text-amber-200 text-right' : 'text-2xl sm:text-3xl text-slate-900 dark:text-white text-left'}`}>
                {renderFormattedChildren(children)}
              </h1>
            );
          },
          h2: ({ children }) => {
            const raw = getRawTextFromChildren(children);
            const isPureArab = isArabicScript(raw) && !/[a-zA-Z]/.test(raw);
            return (
              <h2 dir={isPureArab ? 'rtl' : 'ltr'} className={`font-bold my-3 ${isPureArab ? 'font-arabic text-2xl leading-loose text-amber-800 dark:text-amber-300 text-right' : 'text-xl sm:text-2xl text-slate-900 dark:text-white text-left'}`}>
                {renderFormattedChildren(children)}
              </h2>
            );
          },
          h3: ({ children }) => {
            const raw = getRawTextFromChildren(children);
            const isPureArab = isArabicScript(raw) && !/[a-zA-Z]/.test(raw);
            return (
              <h3 dir={isPureArab ? 'rtl' : 'ltr'} className={`font-semibold my-2.5 ${isPureArab ? 'font-arabic text-xl leading-relaxed text-amber-700 dark:text-amber-400 text-right' : 'text-lg sm:text-xl text-slate-900 dark:text-white text-left'}`}>
                {renderFormattedChildren(children)}
              </h3>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

/* ========================================================================= */
/* --- 0.1 RESPONSIVE IMAGE VIEWER BLOCK ----------------------------------- */
/* ========================================================================= */
const ImageViewerBlock: React.FC<{ src: string }> = ({ src }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnnotating, setIsAnnotating] = useState(false);

  // Suppress space swipe gestures while viewing image fullscreen or annotating
  useEffect(() => {
    if (isFullscreen || isAnnotating) {
      document.body.setAttribute('data-image-modal-open', 'true');
      document.body.classList.add('is-image-modal-open');
    }
    return () => {
      document.body.removeAttribute('data-image-modal-open');
      document.body.classList.remove('is-image-modal-open');
    };
  }, [isFullscreen, isAnnotating]);

  return (
    <div className="w-full space-y-2" data-no-swipe="true">
      <div className="relative group/img rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm w-full bg-slate-50 dark:bg-slate-950" data-no-swipe="true">
        <img 
          src={src} 
          alt="Materi Pembelajaran" 
          className="w-full h-auto max-h-[70vh] object-contain mx-auto block cursor-pointer transition-transform duration-200 hover:scale-[1.01]" 
          onClick={() => setIsAnnotating(true)}
        />
        
        {/* Action Toolbar on Hover / Touch */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10" data-no-swipe="true">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAnnotating(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            title="Buka Mode Anotasi"
          >
            <PenLine className="w-3.5 h-3.5" />
            <span className="text-[11px]">Anotasi</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm shadow-md transition-all cursor-pointer"
            title="Perbesar Layar Penuh"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Perbesar</span>
          </button>
        </div>
      </div>

      {/* Interactive Tablet Annotation Modal */}
      <ImageAnnotationModal
        src={src}
        isOpen={isAnnotating}
        onClose={() => setIsAnnotating(false)}
      />

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div 
          data-no-swipe="true"
          data-lightbox="true"
          data-image-modal="true"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onTouchCancel={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[150] bg-slate-950/95 backdrop-blur-md flex flex-col p-2 sm:p-6 animate-in fade-in touch-none"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="flex items-center justify-between p-2 text-white">
            <span className="text-xs font-medium text-slate-300">Tampilan Penuh Gambar</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullscreen(false);
                  setIsAnnotating(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Buka Mode Anotasi"
              >
                <PenLine className="w-3.5 h-3.5" />
                <span>Anotasi</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden min-h-0 min-w-0" onClick={(e) => e.stopPropagation()}>
            <img 
              src={src} 
              alt="Materi Pembelajaran Penuh" 
              className="w-full h-full object-contain rounded-xl shadow-2xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* --- 1. ARABIC BLOCK VIEWER (Interactive Word-by-Word Reader) ------------ */
/* ========================================================================= */
const ArabicBlockViewer: React.FC<{ words: ArabicWord[] }> = ({ words }) => {
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [showAllTranslations, setShowAllTranslations] = useState(false);

  if (!words || words.length === 0) return null;

  return (
    <div className="p-4 sm:p-6 rounded-3xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 shadow-xs space-y-3.5">
      {/* Header bar with interlinear toggle */}
      <div className="flex items-center justify-between pb-2.5 border-b border-amber-200/50 dark:border-amber-900/30">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
          <Languages className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Teks Arab Interaktif</span>
        </div>

        <button
          type="button"
          onClick={() => setShowAllTranslations(!showAllTranslations)}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
            showAllTranslations
              ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
              : 'bg-white/80 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100/50 dark:hover:bg-amber-950/50'
          }`}
        >
          {showAllTranslations ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{showAllTranslations ? 'Tutup Arti' : 'Tampilkan Arti'}</span>
        </button>
      </div>

      {/* Words in natural RTL flow - Line-by-line layout matching original sentences/paragraphs */}
      <div className="p-3 sm:p-5 bg-white dark:bg-slate-900/95 rounded-2xl border border-amber-100 dark:border-amber-950 shadow-2xs space-y-3 sm:space-y-4">
        {(() => {
          const lines: ArabicWord[][] = [];
          let currentLine: ArabicWord[] = [];
          words.forEach((word, index) => {
            if (word.newLine && index > 0 && currentLine.length > 0) {
              lines.push(currentLine);
              currentLine = [word];
            } else {
              currentLine.push(word);
            }
          });
          if (currentLine.length > 0) lines.push(currentLine);

          return lines.map((lineWords, lineIndex) => (
            <div 
              key={lineIndex}
              dir="rtl" 
              className="flex flex-wrap items-center gap-x-1.5 sm:gap-x-2.5 gap-y-2.5 sm:gap-y-3.5 leading-loose"
            >
              {lineWords.map((word) => {
                const isSelected = activeWordId === word.id;
                const isTransArabic = isArabicScript(word.translation);
                const isExampleArabic = isArabicScript(word.example);

                return (
                  <div key={word.id} className="relative inline-flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => setActiveWordId(isSelected ? null : word.id)}
                      className={`font-arabic text-xl sm:text-2xl px-1.5 py-0.5 rounded-lg transition-all cursor-pointer select-none leading-relaxed border ${
                        isSelected 
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm font-bold scale-105' 
                          : 'text-amber-800 dark:text-amber-300 border-transparent hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/70 dark:hover:bg-amber-950/40'
                      }`}
                      title={word.translation || 'Klik untuk arti'}
                    >
                      {word.arabic}
                    </button>

                    {/* Translation Badge (Always visible if showAllTranslations is on) */}
                    {showAllTranslations && (word.translation || word.example) && (
                      <div 
                        dir={isTransArabic ? 'rtl' : 'ltr'}
                        className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md mt-1 max-w-[140px] text-center truncate"
                      >
                        {word.translation || word.example}
                      </div>
                    )}

                    {/* Floating Tooltip (when clicked individually) */}
                    <AnimatePresence>
                      {!showAllTranslations && isSelected && (word.translation || word.example) && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.95 }}
                          className="absolute top-full mt-2 z-20 w-max max-w-[220px] left-1/2 -translate-x-1/2"
                        >
                          <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs px-3 py-2 rounded-xl shadow-xl space-y-1 border border-slate-700 dark:border-slate-300">
                            {word.translation && (
                              <div 
                                dir={isTransArabic ? 'rtl' : 'ltr'} 
                                className={`font-semibold ${isTransArabic ? 'font-arabic text-sm text-right text-amber-400 dark:text-amber-700' : 'text-left'}`}
                              >
                                {word.translation}
                              </div>
                            )}
                            {word.example && (
                              <div 
                                dir={isExampleArabic ? 'rtl' : 'ltr'} 
                                className={`text-[11px] pt-1 border-t border-slate-800 dark:border-slate-200 opacity-90 ${isExampleArabic ? 'font-arabic text-right text-amber-300 dark:text-amber-600' : 'text-left text-slate-300 dark:text-slate-600'}`}
                              >
                                {word.example}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ));
        })()}
      </div>
    </div>
  );
};

/* ========================================================================= */
/* --- 2. MULTIPLE CHOICE BLOCK VIEWER (Interactive Practice) -------------- */
/* ========================================================================= */
const MultipleChoiceBlockViewer: React.FC<{ block: MultipleChoiceBlock }> = ({ block }) => {
  const content = block.content;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!content || !content.options || content.options.length === 0) return null;

  const isCorrect = selectedOptionId === content.correctOptionId;

  const handleCheck = () => {
    if (!selectedOptionId) return;
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setSelectedOptionId(null);
    setIsSubmitted(false);
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/40 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-indigo-200/50 dark:border-indigo-900/30">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
          <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Kuis Pemahaman</span>
        </div>
        {isSubmitted && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Ulangi</span>
          </button>
        )}
      </div>

      {/* Pertanyaan */}
      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
        {content.question || 'Pilihlah jawaban yang paling tepat:'}
      </h4>

      {/* Opsi Jawaban */}
      <div className="space-y-2.5">
        {content.options.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const isSelected = selectedOptionId === opt.id;
          const isRightAnswer = opt.id === content.correctOptionId;

          let optionStyle = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700';
          if (isSubmitted) {
            if (isRightAnswer) {
              optionStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
            } else if (isSelected && !isRightAnswer) {
              optionStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
            }
          } else if (isSelected) {
            optionStyle = 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 shadow-2xs';
          }

          return (
            <button
              key={opt.id}
              type="button"
              disabled={isSubmitted}
              onClick={() => setSelectedOptionId(opt.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${optionStyle}`}
            >
              <span className={`w-7 h-7 rounded-xl font-bold font-mono text-xs flex items-center justify-center shrink-0 ${
                isSelected 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}>
                {letter}
              </span>
              <span className="text-sm font-medium flex-1 text-slate-800 dark:text-slate-200">
                {opt.text}
              </span>
              {isSubmitted && isRightAnswer && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              {isSubmitted && isSelected && !isRightAnswer && (
                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Action / Result */}
      {!isSubmitted ? (
        <button
          type="button"
          onClick={handleCheck}
          disabled={!selectedOptionId}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
        >
          <span>Periksa Jawaban</span>
        </button>
      ) : (
        <div className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-bold ${
          isCorrect 
            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
        }`}>
          {isCorrect ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Maa syaa Allah, jawaban Anda tepat sekali!</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Jawaban kurang tepat. Coba periksa materi dan coba lagi!</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* --- 3. ORDERING BLOCK VIEWER (Interactive Arrange Practice) -------------- */
/* ========================================================================= */
const OrderingBlockViewer: React.FC<{ block: OrderingBlock }> = ({ block }) => {
  const originalItems = block.content?.items || [];
  const [items, setItems] = useState<{ id: string; text: string }[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Shuffle items initially
  useEffect(() => {
    if (originalItems.length > 0) {
      // Create a deterministic or simple shuffle
      const shuffled = [...originalItems].sort(() => Math.random() - 0.5);
      setItems(shuffled);
      setIsSubmitted(false);
    }
  }, [block.id]);

  if (originalItems.length === 0) return null;

  const move = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    setIsSubmitted(false);
  };

  const checkOrder = () => {
    // Check if current order matches original order
    const match = items.every((item, idx) => item.id === originalItems[idx].id);
    setIsCorrect(match);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    const shuffled = [...originalItems].sort(() => Math.random() - 0.5);
    setItems(shuffled);
    setIsSubmitted(false);
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-900/40 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-teal-200/50 dark:border-teal-900/30">
        <div className="flex items-center gap-2 text-xs font-bold text-teal-900 dark:text-teal-300">
          <ListOrdered className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Latihan Urutan</span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Acak</span>
        </button>
      </div>

      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        Susunlah butir-butir di bawah ini ke urutan yang benar dengan menekan tombol panah:
      </p>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div 
            key={item.id}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
          >
            <span className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400 text-xs font-bold font-mono flex items-center justify-center shrink-0">
              {idx + 1}
            </span>

            <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">
              {item.text}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(idx, 'up')}
                disabled={idx === 0}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                title="Pindah Ke Atas"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => move(idx, 'down')}
                disabled={idx === items.length - 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                title="Pindah Ke Bawah"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!isSubmitted ? (
        <button
          type="button"
          onClick={checkOrder}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
        >
          <span>Periksa Urutan</span>
        </button>
      ) : (
        <div className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-bold ${
          isCorrect 
            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
        }`}>
          {isCorrect ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Hebat! Urutan yang Anda susun sudah benar.</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Urutan belum tepat. Coba geser kembali dengan tombol panah!</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* --- 5. VIDEO VIEWER BLOCK ----------------------------------------------- */
/* ========================================================================= */
const VideoBlockViewer: React.FC<{ url: string }> = ({ url }) => {
  const getEmbedUrl = (videoUrl: string) => {
    try {
      const urlObj = new URL(videoUrl);
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        let videoId = '';
        if (urlObj.hostname.includes('youtu.be')) {
          videoId = urlObj.pathname.slice(1);
        } else {
          videoId = urlObj.searchParams.get('v') || '';
        }
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      }
      return videoUrl; // Fallback
    } catch (e) {
      return videoUrl;
    }
  };

  const embedUrl = getEmbedUrl(url);
  const isEmbeddable = embedUrl.includes('youtube.com/embed');

  if (!isEmbeddable) {
    return (
      <div className="w-full p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-500">
            <LinkIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Video Eksternal</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-sm">{url}</p>
          </div>
        </div>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          Buka Video
        </a>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900 aspect-video relative">
      <iframe
        src={embedUrl}
        className="absolute top-0 left-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video Player"
      />
    </div>
  );
};

