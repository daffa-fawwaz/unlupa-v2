import React, { useMemo } from 'react';
import { detectScript, ScriptType } from '../../utils/bilingualHelper';

export interface BilingualCardTextProps {
  text: string;
  type?: 'question' | 'answer' | 'general';
  variant?: 'card-list' | 'detail-modal' | 'review' | 'compact';
  className?: string;
  emptyFallback?: string;
  clampLines?: boolean | number;
  language?: string;
}

interface TextBlock {
  id: string;
  text: string;
  script: ScriptType;
  isArabic: boolean;
  isTranslationTransition?: boolean;
}

/**
 * Isolates embedded Arabic snippets inside a Latin/Indonesian paragraph
 * so that quotes, colons, brackets, and sentences never reverse.
 */
export function renderBilingualInline(text: string): React.ReactNode {
  if (!text) return null;
  const arabicRegex = /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s،؛؟]{2,})/g;
  const parts = text.split(arabicRegex);
  if (parts.length <= 1) return text;
  
  return parts.map((part, i) => {
    if (i % 2 === 1 && /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(part)) {
      return (
        <bdi 
          key={i} 
          dir="rtl" 
          className="font-arabic font-semibold inline-block text-[1.14em] px-1 py-0.5 leading-[2.0] overflow-visible text-amber-950 dark:text-amber-100 align-baseline"
        >
          {part}
        </bdi>
      );
    }
    return part;
  });
}

/**
 * Parses raw text into semantic blocks:
 * 1. Inspects lines to separate Pure Arabic passages from Indonesian/Latin lines.
 * 2. Groups consecutive lines of the same script together.
 * 3. Detects transitions (e.g. Indonesian translation immediately following Arabic).
 */
function parseTextBlocks(rawText: string, isGeneral: boolean): TextBlock[] {
  if (!rawText || typeof rawText !== 'string') return [];

  // Split into individual non-empty lines
  const rawLines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (rawLines.length === 0) return [];

  interface ClassifiedLine {
    text: string;
    isArabic: boolean;
  }

  const classified: ClassifiedLine[] = rawLines.map(line => {
    const hasArabicLetters = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(line);
    const hasLatinLetters = /[a-zA-Z]/.test(line);
    // Pure Arabic: has Arabic letters and NO Latin words
    const isArabic = hasArabicLetters && !hasLatinLetters;
    return { text: line, isArabic };
  });

  // Group consecutive lines that share the same script
  const groups: { isArabic: boolean; lines: string[] }[] = [];
  for (const item of classified) {
    if (groups.length === 0) {
      groups.push({ isArabic: item.isArabic, lines: [item.text] });
    } else {
      const last = groups[groups.length - 1];
      if (last.isArabic === item.isArabic) {
        last.lines.push(item.text);
      } else {
        groups.push({ isArabic: item.isArabic, lines: [item.text] });
      }
    }
  }

  // Build TextBlock list and mark translation transitions
  let justSawArabic = false;
  return groups.map((g, idx) => {
    const text = g.lines.join('\n');
    let isTranslationTransition = false;

    if (g.isArabic) {
      justSawArabic = true;
    } else if (!isGeneral && justSawArabic) {
      isTranslationTransition = true;
      justSawArabic = false;
    }

    return {
      id: `block-${idx}`,
      text,
      script: g.isArabic ? 'arabic' : 'latin',
      isArabic: g.isArabic,
      isTranslationTransition
    };
  });
}

export const BilingualCardText: React.FC<BilingualCardTextProps> = ({
  text,
  type = 'general',
  variant = 'card-list',
  className = '',
  emptyFallback,
  clampLines = false,
  language = 'id'
}) => {
  const isGeneral = type === 'general';
  const blocks = useMemo(() => parseTextBlocks(text, isGeneral), [text, isGeneral]);

  if (!text || blocks.length === 0) {
    if (emptyFallback) {
      return (
        <span className={`text-slate-400 dark:text-slate-500 italic text-xs ${className}`}>
          {emptyFallback}
        </span>
      );
    }
    return null;
  }

  // 1. GENERAL TYPE (Used for Explanations, Articles, Long Syarah, Notes)
  // Pure, clean, editorial typography with NO badges or repetitive labels!
  if (isGeneral) {
    return (
      <div className={`w-full space-y-3.5 select-text ${className}`}>
        {blocks.map((block) => {
          if (block.isArabic) {
            return (
              <div
                key={block.id}
                dir="rtl"
                className="text-right font-arabic leading-loose tracking-wide text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 bg-amber-50/60 dark:bg-amber-950/20 border-r-4 border-amber-500/80 dark:border-amber-500/60 px-4 py-3 rounded-xl my-2 shadow-2xs"
              >
                {block.text}
              </div>
            );
          }

          // Latin paragraph / commentary
          return (
            <div
              key={block.id}
              dir="ltr"
              className="text-left text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-slate-200 font-normal whitespace-pre-line"
            >
              {renderBilingualInline(block.text)}
            </div>
          );
        })}
      </div>
    );
  }

  // 2. DETAIL MODAL VARIANT (Card Preview Modal)
  if (variant === 'detail-modal') {
    const isAnswer = type === 'answer';

    return (
      <div className={`w-full space-y-3 select-text ${className}`}>
        {blocks.map((block) => {
          if (block.isArabic) {
            return (
              <div
                key={block.id}
                dir="rtl"
                className={`text-right font-arabic leading-[2.2] tracking-wide py-1 px-1 overflow-visible ${
                  isAnswer
                    ? 'text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100'
                    : 'text-lg sm:text-xl font-bold text-slate-900 dark:text-white'
                }`}
              >
                {block.text}
              </div>
            );
          }

          // Latin section
          return (
            <div key={block.id} className="space-y-1.5">
              {block.isTranslationTransition && (
                <div className="pt-2 pb-1 border-t border-slate-200/70 dark:border-slate-700/70">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isAnswer
                      ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {isAnswer ? 'Terjemahan / Penjelasan' : 'Terjemahan'}
                  </span>
                </div>
              )}
              <div
                dir="ltr"
                className={`text-left leading-relaxed whitespace-pre-line ${
                  isAnswer
                    ? 'text-sm sm:text-base font-normal text-slate-800 dark:text-slate-200'
                    : 'text-sm sm:text-base font-normal text-slate-700 dark:text-slate-300'
                }`}
              >
                {renderBilingualInline(block.text)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 3. REVIEW VARIANT (Active Flashcard Study & Flipping - Professional Optical Typography)
  if (variant === 'review') {
    const isAnswer = type === 'answer';
    const totalCharCount = text.trim().length;

    // Optical sizing tailored to flashcard reading:
    // Short: 1-60 chars (e.g. "Apa hadis tentang niat?", "bshhsjs", single vocabulary) -> Large, bold, centered
    // Medium: 61-180 chars (1-2 sentences) -> Balanced, clear, centered
    // Long: > 180 chars (full paragraphs/hadith narrations) -> Comfortable reading size
    const isShort = totalCharCount <= 60;
    const isMedium = totalCharCount > 60 && totalCharCount <= 180;

    return (
      <div className={`w-full max-w-2xl mx-auto space-y-4 select-text flex flex-col items-center justify-center text-center ${className}`}>
        {blocks.map((block) => {
          if (block.isArabic) {
            return (
              <div
                key={block.id}
                dir="rtl"
                className={`w-full text-center font-arabic tracking-wide leading-[2.2] overflow-visible ${
                  isShort
                    ? 'text-2xl sm:text-3xl md:text-4xl font-bold'
                    : isMedium
                    ? 'text-xl sm:text-2xl md:text-3xl font-bold'
                    : 'text-lg sm:text-xl md:text-2xl font-semibold'
                } ${
                  isAnswer
                    ? 'text-emerald-900 dark:text-emerald-200'
                    : 'text-[#18234A] dark:text-[#F8FAFC]'
                }`}
              >
                {block.text}
              </div>
            );
          }

          return (
            <div key={block.id} className="w-full space-y-2.5 flex flex-col items-center justify-center">
              {block.isTranslationTransition && (
                <div className="pt-2 pb-1 flex items-center justify-center">
                  <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs ${
                    isAnswer
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40'
                      : 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border border-orange-300/40'
                  }`}>
                    {isAnswer ? 'Terjemahan / Arti' : 'Terjemahan'}
                  </span>
                </div>
              )}
              <div
                dir="ltr"
                className={`w-full text-center whitespace-pre-line ${
                  isShort
                    ? 'text-xl sm:text-2xl md:text-3xl font-bold text-[#18234A] dark:text-[#F8FAFC] tracking-tight leading-snug sm:leading-relaxed'
                    : isMedium
                    ? 'text-lg sm:text-xl md:text-2xl font-bold text-[#18234A] dark:text-[#F8FAFC] leading-relaxed'
                    : 'text-base sm:text-lg font-medium text-slate-800 dark:text-slate-100 leading-relaxed max-w-xl text-center'
                }`}
              >
                {renderBilingualInline(block.text)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 4. COMPACT VARIANT (Tables, mini rows)
  if (variant === 'compact') {
    return (
      <div className={`space-y-1 w-full text-xs ${className}`}>
        {blocks.map((block) => (
          <div
            key={block.id}
            dir={block.isArabic ? 'rtl' : 'ltr'}
            className={`${
              block.isArabic
                ? 'text-right font-arabic font-semibold text-slate-900 dark:text-white text-[13px] leading-[1.9] py-0.5 overflow-visible'
                : 'text-left font-normal text-slate-600 dark:text-slate-300 text-xs leading-normal whitespace-pre-line'
            }`}
          >
            {block.isArabic ? block.text : renderBilingualInline(block.text)}
          </div>
        ))}
      </div>
    );
  }

  // 5. DEFAULT / CARD-LIST VARIANT (Flashcard Items in Personal & Book Space)
  const isAnswer = type === 'answer';
  const clampClass = clampLines === true ? 'line-clamp-3 overflow-hidden text-ellipsis' : typeof clampLines === 'number' ? `line-clamp-${clampLines} overflow-hidden text-ellipsis` : '';

  return (
    <div className={`w-full select-text flex flex-col gap-1.5 sm:gap-2 ${clampClass} ${className}`}>
      {blocks.map((block) => {
        if (block.isArabic) {
          return (
            <div
              key={block.id}
              dir="rtl"
              className="w-full text-right font-arabic text-[14px] sm:text-[15.5px] font-bold text-slate-900 dark:text-slate-100 leading-[2.0] sm:leading-[2.1] py-0.5 px-0.5 overflow-visible tracking-wide whitespace-pre-line break-words"
            >
              {block.text}
            </div>
          );
        }

        return (
          <div key={block.id} className="w-full flex flex-col gap-1">
            {block.isTranslationTransition && (
              <div className="pt-1.5 pb-0.5 border-t border-slate-200/80 dark:border-slate-700/70 flex items-center gap-1.5">
                <span className={`text-[9px] sm:text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-2xs ${
                  isAnswer
                    ? 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/40'
                    : 'bg-indigo-100/90 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/40'
                }`}>
                  {isAnswer 
                    ? (language === 'en' ? 'Translation / Meaning' : 'Terjemahan / Arti')
                    : (language === 'en' ? 'Translation' : 'Terjemahan')
                  }
                </span>
              </div>
            )}
            <div
              dir="ltr"
              className={`w-full text-left text-xs sm:text-[13px] leading-relaxed whitespace-pre-line break-words ${
                isAnswer 
                  ? 'text-slate-800 dark:text-slate-200 font-normal' 
                  : 'text-slate-800 dark:text-slate-200 font-medium'
              }`}
            >
              {renderBilingualInline(block.text)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
