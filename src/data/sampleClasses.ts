import { ClassGroup, QuranPageItem, BookItem } from '../types';
import { getSurahForPage, getJuzForPage } from './quranData';
import { INITIAL_ITEMS } from './sampleBooks';

export function createSampleStudentBookItems(sourceItems: BookItem[], activeCount: number, dueCount: number): BookItem[] {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000 * 2);
  const future = new Date(today.getTime() + 86400000 * 12);
  const distantFuture = new Date(today.getTime() + 86400000 * 320);

  return sourceItems.map((item, index) => {
    const isActive = index < activeCount;
    const isDue = isActive && index < dueCount;
    const isMastered = isActive && !isDue && index >= dueCount && index < dueCount + 5;

    return {
      ...item,
      isActive,
      status: isMastered ? 'mastered' : isActive ? 'active' : 'inactive',
      fsrsData: {
        stability: isMastered ? 340.0 : isDue ? 4.5 : isActive ? 18.2 : 0,
        difficulty: 5.0,
        reps: isMastered ? 12 : isDue ? 2 : isActive ? 5 : 0,
        lapses: isDue ? 1 : 0,
        lastReview: isActive ? yesterday.toISOString() : null,
        nextReview: isDue ? today.toISOString() : isMastered ? distantFuture.toISOString() : isActive ? future.toISOString() : null,
        state: isMastered ? 'mastered' : isActive ? 'review' : 'new',
      }
    };
  });
}

export function createSampleStudentQuranPages(activePageNumbers: number[], duePageNumbers: number[]): QuranPageItem[] {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  const future = new Date(today.getTime() + 86400000 * 5);

  const pages: QuranPageItem[] = [];
  for (let pageNumber = 1; pageNumber <= 604; pageNumber++) {
    const surah = getSurahForPage(pageNumber);
    const juz = getJuzForPage(pageNumber);
    const isActive = activePageNumbers.includes(pageNumber);
    const isDue = duePageNumbers.includes(pageNumber);
    const isMastered = isActive && !isDue && pageNumber <= 5;

    pages.push({
      pageNumber,
      juzNumber: juz,
      surahNumber: surah.surahNumber,
      surahNameEn: surah.nameEn,
      surahNameAr: surah.nameAr,
      ayahRange: surah.ayahRange,
      isActive,
      imageUrl: `https://quran.ksu.edu.sa/png_pages/${pageNumber}.png`,
      status: isMastered ? 'mastered_for_now' : isActive ? 'active' : 'inactive',
      mapanCelebrated: isMastered,
      fsrsData: {
        stability: isMastered ? 78.0 : isDue ? 4.2 : isActive ? 18.5 : 0,
        difficulty: 10.0,
        reps: isMastered ? 8 : isDue ? 2 : isActive ? 5 : 0,
        lapses: isDue ? 1 : 0,
        lastReview: isActive ? yesterday.toISOString() : null,
        nextReview: isDue ? today.toISOString() : isActive ? future.toISOString() : null,
        state: isMastered ? 'mastered' : isActive ? 'review' : 'new',
      }
    });
  }

  return pages;
}

// Clean production slate: no dummy or mock classes
export const INITIAL_CLASSES: ClassGroup[] = [];
