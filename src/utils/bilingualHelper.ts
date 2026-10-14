/**
 * Bilingual (Arabic & Latin/Indonesian) text helper utilities.
 * Ensures questions and answers with mixed scripts have clean, proportional,
 * and BiDi-safe formatting without text overlaps or punctuation jumping.
 */

export type ScriptType = 'arabic' | 'latin' | 'neutral';

export interface BilingualSegment {
  id: string;
  text: string;
  script: ScriptType;
  isArabic: boolean;
}

/**
 * Accurately detects whether the predominant script in a line is Arabic or Latin.
 * Handles honorifics like ﷺ, quotes, and transliterated words gracefully.
 */
export function detectScript(str: string): ScriptType {
  if (!str || typeof str !== 'string') return 'neutral';
  
  // Count standard Arabic letters (excluding standalone symbols)
  const arabicLetters = (str.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
  // Count Latin characters
  const latinLetters = (str.match(/[a-zA-Z]/g) || []).length;
  
  if (arabicLetters === 0 && latinLetters === 0) {
    // Check if Arabic presentation forms exist (e.g. ﷺ)
    if (/[\uFB50-\uFDFF\uFE70-\uFEFF]/.test(str)) {
      return 'arabic';
    }
    return 'neutral';
  }
  
  // CRITICAL: Any sentence or block containing Latin characters (Indonesian, English, etc.)
  // must have 'latin' (LTR) directionality so sentences, quotes, dialogue markers like 'Guru:',
  // and parentheses are never inverted or scrambled backwards.
  if (latinLetters > 0) {
    return 'latin';
  }
  
  return 'arabic';
}

/**
 * Checks if a string contains both substantial Arabic and Latin content.
 */
export function isBilingualText(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
  const hasLatin = /[a-zA-Z]/.test(text);
  return hasArabic && hasLatin;
}

/**
 * Normalizes bilingual text by ensuring Arabic and Latin segments
 * are separated by clean newline characters (`\n`).
 * If they are joined in a single line, splits at the language boundary.
 */
export function normalizeBilingualText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  
  // If already separated by newlines, clean up multiple blank lines
  if (trimmed.includes('\n')) {
    return trimmed
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .join('\n');
  }
  
  // If text has both Arabic and Latin on a single line, split at the boundary
  if (isBilingualText(trimmed)) {
    // 1. Arabic followed by Latin (e.g. "سُوْرَةُ النَّبَإِ مِنْ أَيِّ السُّوَرِ؟ Surah An-Naba'...")
    const matchArabThenLatin = trimmed.match(
      /^([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\d،؛؟!.ﷺ:()'"\-—]+?[؟!.؛،:\s])\s*([A-Za-z][\s\S]*)$/
    );
    if (matchArabThenLatin) {
      const part1 = matchArabThenLatin[1].trim();
      const part2 = matchArabThenLatin[2].trim();
      if (detectScript(part1) === 'arabic' && detectScript(part2) === 'latin') {
        return `${part1}\n${part2}`;
      }
    }
    
    // 2. Latin followed by Arabic (e.g. "Surah An-Naba': سُوْرَةُ النَّبَإِ...")
    const matchLatinThenArab = trimmed.match(
      /^([a-zA-Z0-9\s'"()?!:.,\u00C0-\u024F\u1E00-\u1EFF\-—]+?[!?:.])\s*([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\d،؛؟!.ﷺ:()'"\-—]+)$/
    );
    if (matchLatinThenArab) {
      const part1 = matchLatinThenArab[1].trim();
      const part2 = matchLatinThenArab[2].trim();
      if (detectScript(part1) === 'latin' && detectScript(part2) === 'arabic') {
        return `${part1}\n${part2}`;
      }
    }
  }
  
  return trimmed;
}

/**
 * Splits any card question or answer into structured segments with detected script,
 * allowing safe per-segment BiDi rendering (RTL for Arabic, LTR for Latin).
 */
export function splitBilingualSegments(rawText: string): BilingualSegment[] {
  if (!rawText || typeof rawText !== 'string') return [];
  
  const normalized = normalizeBilingualText(rawText);
  const rawLines = normalized.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  if (rawLines.length === 0) return [];
  
  return rawLines.map((line, idx) => {
    const script = detectScript(line);
    return {
      id: `seg-${idx}`,
      text: line,
      script,
      isArabic: script === 'arabic'
    };
  });
}
