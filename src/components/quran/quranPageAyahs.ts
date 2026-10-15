import { QURAN_PAGES_METADATA } from "../../data/quranPagesMetadata";
import { SURAH_LIST } from "../../data/quranData";
import { PageAyahInfo } from "./MushafAyahCorrectionPopover";

export type { PageAyahInfo };

// In-memory cache for fetched page verses
const PAGE_VERSES_CACHE: Map<number, PageAyahInfo[]> = new Map();

/**
 * Returns the list of verses present on a given Mushaf page.
 * Immediately computes from QURAN_PAGES_METADATA, estimating 1-15 lines proportionally,
 * and asynchronously enriches with exact line numbers and Uthmani text.
 */
export function getPageAyahsMetadata(pageNumber: number): PageAyahInfo[] {
  if (PAGE_VERSES_CACHE.has(pageNumber)) {
    return PAGE_VERSES_CACHE.get(pageNumber)!;
  }

  const meta = QURAN_PAGES_METADATA[pageNumber - 1];
  if (!meta) {
    return [];
  }

  const [s1Str, a1Str] = meta.startVerseKey.split(":");
  const [s2Str, a2Str] = meta.endVerseKey.split(":");
  const startSurah = parseInt(s1Str, 10);
  const startAyah = parseInt(a1Str, 10);
  const endSurah = parseInt(s2Str, 10);
  const endAyah = parseInt(a2Str, 10);

  const rawVerses: {
    s: number;
    a: number;
    surahInfo: (typeof SURAH_LIST)[0] | undefined;
  }[] = [];

  for (let s = startSurah; s <= endSurah; s++) {
    const surahInfo = SURAH_LIST[s - 1];
    const sAyah = s === startSurah ? startAyah : 1;
    const eAyah =
      s === endSurah ? endAyah : surahInfo ? surahInfo.ayahsCount : 50;

    for (let a = sAyah; a <= eAyah; a++) {
      rawVerses.push({ s, a, surahInfo });
    }
  }

  const totalVerses = Math.max(1, rawVerses.length);

  const ayahs: PageAyahInfo[] = rawVerses.map((item, idx) => {
    // Proportional fallback distribution between line 1 and 15
    const estimatedLine = Math.min(
      15,
      Math.max(1, Math.round(((idx + 1) / totalVerses) * 14) + 1),
    );
    return {
      surahNumber: item.s,
      surahNameEn: item.surahInfo ? item.surahInfo.nameEn : `Surah ${item.s}`,
      surahNameAr: item.surahInfo ? item.surahInfo.nameAr : "",
      ayahNumber: item.a,
      verseKey: `${item.s}:${item.a}`,
      startLine: estimatedLine,
      endLine: estimatedLine,
    };
  });

  PAGE_VERSES_CACHE.set(pageNumber, ayahs);
  return ayahs;
}

/**
 * Enriches cached page ayahs with exact Mushaf 15-line positions (line_number) and authentic Arabic text.
 * Calculates verse startLine (baris awal ayat pada mushaf standar) and endLine (baris penutup ayat).
 */
export async function fetchPageAyahsWithText(
  pageNumber: number,
): Promise<PageAyahInfo[]> {
  const baseAyahs = getPageAyahsMetadata(pageNumber);

  // If already enriched with exact lines from API, return cached immediately
  if (
    baseAyahs.length > 0 &&
    baseAyahs[0].arabicText &&
    (baseAyahs as any)._isExactLines
  ) {
    return baseAyahs;
  }

  try {
    // Fetch words=true for exact line_number (1 to 15 in standard Madinah Mushaf)
    // and uthmani for clean arabic text in parallel
    const [wordsRes, uthmaniRes] = await Promise.all([
      fetch(
        `https://api.quran.com/api/v4/verses/by_page/${pageNumber}?words=true`,
      ),
      fetch(
        `https://api.quran.com/api/v4/quran/verses/uthmani?page_number=${pageNumber}`,
      ).catch(() => null),
    ]);

    let startLineMap = new Map<string, number>();
    let endLineMap = new Map<string, number>();
    let markerLineMap = new Map<string, number>();
    if (wordsRes.ok) {
      const wordsData = await wordsRes.json();
      if (wordsData && Array.isArray(wordsData.verses)) {
        for (const v of wordsData.verses) {
          if (Array.isArray(v.words) && v.words.length > 0) {
            const lines = v.words.map((w: any) => w.line_number || 1);
            const startLine = Math.min(...lines);
            const endLine = Math.max(...lines);
            // The exact line where the ayah number circle appears in the Mushaf
            const endWord = v.words.find(
              (w: any) => w.char_type_name === "end",
            );
            const markerLine =
              endWord && endWord.line_number ? endWord.line_number : endLine;

            startLineMap.set(v.verse_key, Math.min(15, Math.max(1, startLine)));
            endLineMap.set(v.verse_key, Math.min(15, Math.max(1, endLine)));
            markerLineMap.set(
              v.verse_key,
              Math.min(15, Math.max(1, markerLine)),
            );
          }
        }
      }
    }

    let textMap = new Map<string, string>();
    if (uthmaniRes && uthmaniRes.ok) {
      const uthmaniData = await uthmaniRes.json();
      if (uthmaniData && Array.isArray(uthmaniData.verses)) {
        for (const v of uthmaniData.verses) {
          textMap.set(v.verse_key, v.text_uthmani);
        }
      }
    }

    const enriched = baseAyahs.map((a) => {
      const exactStart = startLineMap.get(a.verseKey);
      const exactEnd = endLineMap.get(a.verseKey);
      const exactMarker = markerLineMap.get(a.verseKey);
      return {
        ...a,
        startLine:
          exactStart !== undefined ? exactStart : a.startLine || a.endLine,
        endLine: exactEnd !== undefined ? exactEnd : a.endLine,
        markerLine:
          exactMarker !== undefined ? exactMarker : a.markerLine || a.endLine,
        arabicText: textMap.get(a.verseKey) || a.arabicText,
      };
    });

    (enriched as any)._isExactLines = startLineMap.size > 0;
    PAGE_VERSES_CACHE.set(pageNumber, enriched);
    return enriched;
  } catch (e) {
    // Graceful offline fallback
    console.debug(
      "Using cached/estimated verse line numbers for page",
      pageNumber,
      e,
    );
  }

  return baseAyahs;
}
