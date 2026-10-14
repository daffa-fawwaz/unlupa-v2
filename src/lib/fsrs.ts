import { FSRSState, MapanScheduleConfig } from '../types';
import {
  fsrs,
  generatorParameters,
  Rating,
  State,
  createEmptyCard,
  Card,
  FSRS6_DEFAULT_DECAY,
  default_w,
} from 'ts-fsrs';

/**
 * ============================================================================
 * UNLUPA DUAL MEMORY ENGINE ARCHITECTURE (POWERED BY OFFICIAL FSRS-6)
 * ============================================================================
 * 
 * Mengapa Retensi Al-Qur'an 95% (Bukan 50%)?
 * ----------------------------------------------------------------------------
 * Rumus Retrievability Resmi FSRS-6 (Power-Law Forgetting Curve):
 * R(t, S) = (1 + FACTOR * (t / S))^(-DECAY)
 * di mana:
 * - DECAY = 0.1542 (Parameter default resmi FSRS-6 w20)
 * - FACTOR = 0.9^(-1 / DECAY) - 1 ≈ 0.9803
 * 
 * S (Stability) adalah jumlah hari yang dibutuhkan hingga Retrievability (R)
 * turun ke tepat 90%: R(S) = (1 + FACTOR)^(-DECAY) = 0.90 (90%).
 * 
 * Interval Penjadwalan pada Target Retensi (r):
 * I(r, S) = (S / FACTOR) * (r^(-1 / DECAY) - 1)
 * 
 * Untuk Target Retensi 95% (Al-Qur'an):
 * I(0.95, S) ≈ S * 0.40
 * Artinya, hafalan Al-Qur'an diuji saat kekuatan memori masih 95% utuh!
 * 
 * 1. PADA RETENSI 95% (MESIN AL-QUR'AN):
 *    Algoritma memicu recall tepat saat kemungkinan ingat masih 95%.
 *    Pada titik ini, hafiz hanya mengalami sedikit kelonggaran memori,
 *    sehingga saat melafalkan ayat, hafalan langsung terkunci kembali (mutqin)
 *    tanpa salah sambung ayat (mutasyabihat).
 * 
 * 2. HANYA DUA TOMBOL PENILAIAN (AGAIN / HARD):
 *    Al-Qur'an itu mutlak (benar atau salah).
 *    - Rating 1: Perlu Murajaah (Again -> Rating.Again)
 *    - Rating 2: Lancar (Hard -> Rating.Hard)
 *    Tidak ada tombol Good/Easy untuk Al-Qur'an guna mencegah over-akselerasi.
 * 
 * 3. CAP MAKSIMAL 30 HARI (KHATAM BULANAN):
 *    Setelah interval mencapai 30 hari (pada stabilitas ~78 hari),
 *    hafalan berstatus "Mapan / Mutqin".
 */

export const QURAN_TARGET_RETENTION = 0.95; // 95% target retention for Holy Qur'an
export const NON_QURAN_TARGET_RETENTION = 0.92; // 92% target retention for general knowledge books
export const QURAN_MAX_INTERVAL_DAYS = 36500; // Tidak dibatasi 30 hari; interval adaptif bebas bertumbuh ke 100d, 200d, 1000d+
export const NON_QURAN_MAX_INTERVAL_DAYS = 36500; // General knowledge max interval

export const FSRS6_WEIGHTS: number[] = [...default_w];
export const FSRS_DECAY = FSRS6_DEFAULT_DECAY; // 0.1542
export const FSRS_FACTOR = Math.pow(0.9, -1 / FSRS_DECAY) - 1; // ≈ 0.980346

// Initialise Schedulers using the official ts-fsrs library
const quranScheduler = fsrs(generatorParameters({
  request_retention: QURAN_TARGET_RETENTION,
  maximum_interval: QURAN_MAX_INTERVAL_DAYS,
  enable_fuzz: false,
  enable_short_term: false,
}));

const nonQuranScheduler = fsrs(generatorParameters({
  request_retention: NON_QURAN_TARGET_RETENTION,
  maximum_interval: NON_QURAN_MAX_INTERVAL_DAYS,
  enable_fuzz: false,
  enable_short_term: false,
}));

export function createInitialFSRSState(): FSRSState {
  return {
    stability: 0,
    difficulty: 5.0,
    reps: 0,
    lapses: 0,
    lastReview: null,
    nextReview: null,
    state: 'new',
  };
}

/**
 * Canonical scheduling timezone for Unlupa.id: WIB (Asia/Jakarta, UTC+7)
 */
export const WIB_TIMEZONE = 'Asia/Jakarta';

/**
 * Get formatted calendar date YYYY-MM-DD in Asia/Jakarta (WIB) timezone
 */
export function getWIBDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: WIB_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Calculate difference in calendar days between two dates in Asia/Jakarta (WIB) timezone.
 * Returns (dateB_WIB - dateA_WIB) in integer days.
 */
export function getWIBCalendarDayDiff(dateA: Date | string, dateB: Date | string): number {
  const dA = typeof dateA === 'string' ? new Date(dateA) : dateA;
  const dB = typeof dateB === 'string' ? new Date(dateB) : dateB;

  if (isNaN(dA.getTime()) || isNaN(dB.getTime())) {
    return 0;
  }

  const strA = getWIBDateString(dA);
  const strB = getWIBDateString(dB);

  const [yA, mA, dDayA] = strA.split('-').map(Number);
  const [yB, mB, dDayB] = strB.split('-').map(Number);

  const utcA = Date.UTC(yA, mA - 1, dDayA);
  const utcB = Date.UTC(yB, mB - 1, dDayB);

  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate the previously scheduled interval in days from existing progress schedule.
 * Returns 0 for new cards, unreviewed cards, or cards without a valid prior schedule.
 */
export function calculatePreviousScheduledInterval(
  lastReview: Date | string | null | undefined,
  nextReview: Date | string | null | undefined,
  reps: number = 0
): number {
  if (reps === 0 || !lastReview || !nextReview) {
    return 0;
  }

  const lastDate = typeof lastReview === 'string' ? new Date(lastReview) : lastReview;
  const nextDate = typeof nextReview === 'string' ? new Date(nextReview) : nextReview;

  if (isNaN(lastDate.getTime()) || isNaN(nextDate.getTime())) {
    return 0;
  }

  const diffDays = getWIBCalendarDayDiff(lastDate, nextDate);
  return Math.max(0, diffDays);
}

/**
 * Check if item was reviewed today in Asia/Jakarta (WIB) calendar day
 */
export function isReviewedToday(lastReviewIso: string | null | undefined, referenceDate: Date = new Date()): boolean {
  if (!lastReviewIso) return false;
  const lastDate = new Date(lastReviewIso);
  if (isNaN(lastDate.getTime())) return false;

  const lastReviewWIB = getWIBDateString(lastDate);
  const todayWIB = getWIBDateString(referenceDate);

  return lastReviewWIB === todayWIB;
}

/**
 * Check if item is due today or overdue in Asia/Jakarta (WIB) calendar day
 */
export function isDue(
  nextReviewIso: string | null | undefined,
  isActive: boolean,
  lastReviewIso?: string | null | undefined,
  referenceDate: Date = new Date()
): boolean {
  if (!isActive) return false;

  // If already reviewed today in WIB, it is not due today anymore!
  if (lastReviewIso && isReviewedToday(lastReviewIso, referenceDate)) {
    return false;
  }

  // Activated but never reviewed yet
  if (!nextReviewIso) return true;

  const nextDate = new Date(nextReviewIso);
  if (isNaN(nextDate.getTime())) return true;

  const nextReviewWIB = getWIBDateString(nextDate);
  const todayWIB = getWIBDateString(referenceDate);

  return nextReviewWIB <= todayWIB;
}

/**
 * Convert internal FSRSState to ts-fsrs Card structure
 */
function stateToCard(state: FSRSState, reviewDate: Date): Card {
  if (!state.stability || state.reps === 0) {
    return createEmptyCard(reviewDate);
  }

  const lastRevDate = state.lastReview ? new Date(state.lastReview) : undefined;
  let elapsedDays = 0;
  if (lastRevDate && !isNaN(lastRevDate.getTime())) {
    elapsedDays = Math.max(0, getWIBCalendarDayDiff(lastRevDate, reviewDate));
  }

  return {
    due: state.nextReview ? new Date(state.nextReview) : reviewDate,
    stability: Math.max(0.1, state.stability),
    difficulty: Math.max(1, Math.min(10, state.difficulty || 5.0)),
    elapsed_days: elapsedDays,
    scheduled_days: 0,
    reps: state.reps || 0,
    lapses: state.lapses || 0,
    learning_steps: 0,
    state: State.Review,
    last_review: lastRevDate,
  };
}

/**
 * Calculate current Retrievability (Kekuatan Hafalan R) on day t given Stability S
 * Returns a value between 0.0 and 1.0 (e.g. 0.95 = 95% retention probability)
 */
export function calculateRetrievability(stability: number, daysSinceLastReview: number): number {
  if (stability <= 0) return 0;
  if (daysSinceLastReview <= 0) return 1.0;
  const r = Math.pow(1 + FSRS_FACTOR * (daysSinceLastReview / stability), -FSRS_DECAY);
  return Math.min(1.0, Math.max(0.0, r));
}

/**
 * Calculate review interval in days given Stability and Target Retention.
 * Formula: I(r, S) = (S / FACTOR) * (r^(-1 / DECAY) - 1)
 */
export function calculateInterval(stability: number, targetRetention: number, maxInterval: number): number {
  if (stability <= 0) return 1;
  const rawInterval = (stability / FSRS_FACTOR) * (Math.pow(targetRetention, -1 / FSRS_DECAY) - 1);
  const rounded = Math.max(1, Math.round(rawInterval));
  return Math.min(rounded, maxInterval);
}

/**
 * Menghitung jadwal peninjauan untuk item yang sudah berstatus Mapan (>30 hari)
 * Mendukung opsi:
 * - 'fsrs': FSRS adaptif murni (35d, 45d, 60d, dst.)
 * - 'weekly': Hari tetap dalam sepekan (mis. Setiap Jum'at, Senin, dll.)
 * - 'monthly': Tanggal tetap setiap bulan (mis. Setiap tgl 1, tgl 15, dll.)
 */
export function calculateNextMapanDate(
  config: MapanScheduleConfig | undefined,
  rawIntervalDays: number,
  fromDate: Date = new Date()
): { nextDate: Date; intervalDays: number } {
  if (!config || config.mode === 'fsrs') {
    const next = new Date(fromDate);
    const days = Math.max(1, rawIntervalDays);
    next.setDate(next.getDate() + days);
    return { nextDate: next, intervalDays: days };
  }

  if (config.mode === 'weekly' && typeof config.weeklyDay === 'number') {
    const targetDay = config.weeklyDay; // 0 = Ahad, 1 = Senin, ..., 5 = Jum'at, 6 = Sabtu
    const next = new Date(fromDate);
    const currentDay = next.getDay();
    let daysToAdd = (targetDay - currentDay + 7) % 7;
    if (daysToAdd === 0) daysToAdd = 7; // Review berikutnya di pekan depan
    next.setDate(next.getDate() + daysToAdd);
    return { nextDate: next, intervalDays: daysToAdd };
  }

  if (config.mode === 'monthly' && typeof config.monthlyDate === 'number') {
    const targetDate = Math.min(31, Math.max(1, config.monthlyDate));
    const next = new Date(fromDate);
    let nextMonth = next.getMonth() + 1;
    let nextYear = next.getFullYear();
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    const daysInTargetMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
    const actualDate = Math.min(targetDate, daysInTargetMonth);
    const scheduledDate = new Date(nextYear, nextMonth, actualDate, 9, 0, 0);
    const diffTime = scheduledDate.getTime() - fromDate.getTime();
    const days = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
    return { nextDate: scheduledDate, intervalDays: days };
  }

  const next = new Date(fromDate);
  const days = Math.max(1, rawIntervalDays);
  next.setDate(next.getDate() + days);
  return { nextDate: next, intervalDays: days };
}

/**
 * ============================================================================
 * MESIN 1: AL-QUR'AN MEMORY ENGINE
 * ============================================================================
 * Khusus dirancang untuk hafalan ayat suci Al-Qur'an:
 * - Target Retensi: 95% (0.95)
 * - Skala Umpan Balik: Tepat 2 Tingkat
 *   * Rating 1: Perlu Murajaah (Rating.Again) -> Mengatur ulang interval ke 1 hari (turun dari Mapan jika goyah)
 *   * Rating 2: Lancar (Rating.Hard) -> Perhitungan stability & interval terus berlanjut
 * - Status Mapan: Tercapai saat interval > 30 hari. Perhitungan stabilitas tidak berhenti.
 * - Ritme Mapan: Pengguna dapat memilih FSRS adaptif (35d, 45d, 60d...) atau mandiri (hari tetap mingguan / tanggal tetap bulanan).
 */
export function updateQuranFSRS(
  currentState: FSRSState,
  rating: 1 | 2 | 3,
  reviewDate: Date = new Date(),
  mapanSchedule?: MapanScheduleConfig
): { newState: FSRSState; nextIntervalDays: number; isMasteredForNow: boolean } {
  const reps = (currentState.reps || 0) + 1;
  const currentS = currentState.stability || 0;
  const difficulty = 10.0; // Standar kelancaran mutlak Al-Qur'an (D maksimum)

  // Hitung elapsed days dari review sebelumnya jika ada
  let elapsedDays = 0;
  if (currentState.lastReview) {
    const last = new Date(currentState.lastReview);
    if (!isNaN(last.getTime())) {
      elapsedDays = Math.max(0, getWIBCalendarDayDiff(last, reviewDate));
    }
  }

  let nextS = currentS;
  let lapses = currentState.lapses || 0;

  if (rating === 1) {
    // Rating 1: Perlu Murajaah (Again) -> Memori goyah, reset interval ke 1 hari
    // Status Mapan otomatis gugur kembali ke review reguler
    lapses += 1;
    nextS = Math.max(1.0, Number((currentS * 0.2).toFixed(2)));
  } else if (rating === 2) {
    // Rating 2: Kurang Lancar / Cukup / Terbata (Hard) -> Kenaikan bertahap konservatif
    if (!currentS || currentS <= 0 || reps === 1) {
      nextS = 2.70;
    } else {
      let inc: number;
      if (currentS < 74.5) {
        inc = 0.18635 * Math.pow(currentS, -0.20407);
      } else {
        inc = Math.max(0.30, 0.45 * Math.pow(currentS / 74.5, -0.12));
      }

      // Bonus ketahanan memori jika murajaah dilakukan tepat waktu atau melampaui interval
      const expectedInterval = currentS * 0.4025587;
      if (elapsedDays > expectedInterval && currentS > 0) {
        const decay = -FSRS_DECAY;
        const R = Math.pow(1 + FSRS_FACTOR * (elapsedDays / currentS), -decay);
        const boost = (Math.exp((1 - R) * 0.796) - 1) / (Math.exp((1 - QURAN_TARGET_RETENTION) * 0.796) - 1);
        inc = inc * Math.max(1.0, Math.min(2.5, boost));
      }
      nextS = Number((currentS * (1 + inc)).toFixed(2));
    }
  } else {
    // Rating 3: Lancar Mutqin / Mumtaz (Good) -> Kenaikan stabilitas lebih cepat & optimal
    if (!currentS || currentS <= 0 || reps === 1) {
      nextS = 5.50;
    } else {
      let inc: number;
      if (currentS < 74.5) {
        inc = 0.45 * Math.pow(currentS, -0.14);
      } else {
        inc = Math.max(0.60, 0.85 * Math.pow(currentS / 74.5, -0.10));
      }

      const expectedInterval = currentS * 0.4025587;
      if (elapsedDays > expectedInterval && currentS > 0) {
        const decay = -FSRS_DECAY;
        const R = Math.pow(1 + FSRS_FACTOR * (elapsedDays / currentS), -decay);
        const boost = (Math.exp((1 - R) * 0.796) - 1) / (Math.exp((1 - QURAN_TARGET_RETENTION) * 0.796) - 1);
        inc = inc * Math.max(1.0, Math.min(2.5, boost));
      }
      nextS = Number((currentS * (1 + inc)).toFixed(2));
    }
  }

  // Raw interval berdasarkan retensi 95%
  const rawInterval = Math.round(nextS * 0.4025587);
  // Item berstatus Mapan jika interval mencapai di atas 30 hari
  const isMasteredForNow = rawInterval > 30;

  let nextReviewDate: Date;
  let nextIntervalDays: number;

  if (rating === 1) {
    // Jika perlu murajaah (lupa/ragu), interval langsung 1 hari
    nextIntervalDays = 1;
    nextReviewDate = new Date(reviewDate);
    nextReviewDate.setDate(nextReviewDate.getDate() + 1);
  } else if (isMasteredForNow && mapanSchedule && mapanSchedule.mode !== 'fsrs') {
    // Jika mapan dan pengguna menyetel ritme mandiri (mingguan/bulanan)
    const scheduled = calculateNextMapanDate(mapanSchedule, rawInterval, reviewDate);
    nextReviewDate = scheduled.nextDate;
    nextIntervalDays = scheduled.intervalDays;
  } else {
    // Algoritma FSRS Adaptif (bisa melampaui 30 hari: 35d, 42d, 60d, 90d, dll.)
    nextIntervalDays = Math.max(1, rawInterval);
    nextReviewDate = new Date(reviewDate);
    nextReviewDate.setDate(nextReviewDate.getDate() + nextIntervalDays);
  }

  const newState: FSRSState = {
    stability: nextS,
    difficulty,
    reps,
    lapses,
    lastReview: reviewDate.toISOString(),
    nextReview: nextReviewDate.toISOString(),
    state: isMasteredForNow ? 'mastered' : 'review',
  };

  return { newState, nextIntervalDays, isMasteredForNow };
}

/**
 * ============================================================================
 * MESIN 2: BUKU & PENGETAHUAN UMUM MEMORY ENGINE
 * ============================================================================
 * Dirancang untuk buku, konsep ilmu pengetahuan, dan catatan kartu:
 * - Target Retensi: 92% (0.92) — penjadwalan presisi tinggi buku & ilmu
 * - Rotasi Maksimal: Terbuka (36.500 Hari)
 * - Skala Umpan Balik: 4 Tingkat (1: Again, 2: Hard, 3: Good, 4: Easy)
 */
export function updateNonQuranFSRS(
  currentState: FSRSState,
  rating: 1 | 2 | 3 | 4,
  reviewDate: Date = new Date()
): { newState: FSRSState; nextIntervalDays: number } {
  const ratingMap = {
    1: Rating.Again,
    2: Rating.Hard,
    3: Rating.Good,
    4: Rating.Easy,
  };

  const mappedRating = ratingMap[rating] as 1 | 2 | 3 | 4;
  const card = stateToCard(currentState, reviewDate);

  const record = nonQuranScheduler.next(card, reviewDate, mappedRating);
  const nextCard = record.card;

  const nextIntervalDays = Math.max(1, nextCard.scheduled_days);
  const nextReviewDate = new Date(reviewDate);
  nextReviewDate.setDate(nextReviewDate.getDate() + nextIntervalDays);

  const newState: FSRSState = {
    stability: Number(nextCard.stability.toFixed(2)),
    difficulty: Number(nextCard.difficulty.toFixed(2)),
    reps: nextCard.reps,
    lapses: nextCard.lapses,
    lastReview: reviewDate.toISOString(),
    nextReview: nextReviewDate.toISOString(),
    state: nextCard.reps >= 3 ? 'review' : 'learning',
  };

  return { newState, nextIntervalDays };
}

/**
 * Engine Object Modules (Clean Separation)
 */
export const quranMemoryEngine = {
  name: 'Mesin Khusus Al-Qur\'an',
  targetRetention: QURAN_TARGET_RETENTION,
  maxIntervalDays: QURAN_MAX_INTERVAL_DAYS,
  ratingsCount: 2,
  calculateInterval: (stability: number) => calculateInterval(stability, QURAN_TARGET_RETENTION, QURAN_MAX_INTERVAL_DAYS),
  calculateRetrievability: (stability: number, days: number) => calculateRetrievability(stability, days),
  update: updateQuranFSRS,
};

export const generalKnowledgeEngine = {
  name: 'Mesin Pengetahuan & Buku',
  targetRetention: NON_QURAN_TARGET_RETENTION,
  maxIntervalDays: NON_QURAN_MAX_INTERVAL_DAYS,
  ratingsCount: 4,
  calculateInterval: (stability: number) => calculateInterval(stability, NON_QURAN_TARGET_RETENTION, NON_QURAN_MAX_INTERVAL_DAYS),
  calculateRetrievability: (stability: number, days: number) => calculateRetrievability(stability, days),
  update: updateNonQuranFSRS,
};

/**
 * Predict next intervals for button labels in review UI
 */
export function predictQuranIntervals(
  currentState: FSRSState,
  mapanSchedule?: MapanScheduleConfig
): { 
  needReview: string; 
  hard: string;
  good: string;
  iKnow: string;
  1: string;
  2: string;
  3: string;
  needReviewDays: number;
  hardDays: number;
  goodDays: number;
  iKnowDays: number;
} {
  const simNeedReview = updateQuranFSRS(currentState, 1, new Date(), mapanSchedule);
  const simHard = updateQuranFSRS(currentState, 2, new Date(), mapanSchedule);
  const simGood = updateQuranFSRS(currentState, 3, new Date(), mapanSchedule);

  const r1 = `${simNeedReview.nextIntervalDays}d`;
  let r2 = `${simHard.nextIntervalDays}d`;
  let r3 = `${simGood.nextIntervalDays}d`;

  if (simGood.isMasteredForNow && mapanSchedule && mapanSchedule.mode !== 'fsrs') {
    if (mapanSchedule.mode === 'weekly' && typeof mapanSchedule.weeklyDay === 'number') {
      const dayNames = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
      r3 = dayNames[mapanSchedule.weeklyDay] || `${simGood.nextIntervalDays}d`;
    } else if (mapanSchedule.mode === 'monthly' && typeof mapanSchedule.monthlyDate === 'number') {
      r3 = `Tgl ${mapanSchedule.monthlyDate}`;
    }
  }

  return {
    needReview: r1,
    hard: r2,
    good: r3,
    iKnow: r2,
    1: r1,
    2: r2,
    3: r3,
    needReviewDays: simNeedReview.nextIntervalDays,
    hardDays: simHard.nextIntervalDays,
    goodDays: simGood.nextIntervalDays,
    iKnowDays: simHard.nextIntervalDays,
  };
}

export function predictNonQuranIntervals(currentState: FSRSState, reviewDate: Date = new Date()): {
  again: string;
  hard: string;
  good: string;
  easy: string;
  1: string;
  2: string;
  3: string;
  4: string;
  againDays: number;
  hardDays: number;
  goodDays: number;
  easyDays: number;
} {
  const sim1 = updateNonQuranFSRS(currentState, 1, reviewDate);
  const sim2 = updateNonQuranFSRS(currentState, 2, reviewDate);
  const sim3 = updateNonQuranFSRS(currentState, 3, reviewDate);
  const sim4 = updateNonQuranFSRS(currentState, 4, reviewDate);

  const formatDays = (days: number) => {
    if (days <= 1) return '1d';
    if (days < 365) return `${days}d`;
    return `${(days / 365).toFixed(1)}y`;
  };

  const a = formatDays(sim1.nextIntervalDays);
  const h = formatDays(sim2.nextIntervalDays);
  const g = formatDays(sim3.nextIntervalDays);
  const e = formatDays(sim4.nextIntervalDays);

  return {
    again: a,
    hard: h,
    good: g,
    easy: e,
    1: a,
    2: h,
    3: g,
    4: e,
    againDays: sim1.nextIntervalDays,
    hardDays: sim2.nextIntervalDays,
    goodDays: sim3.nextIntervalDays,
    easyDays: sim4.nextIntervalDays,
  };
}

export function calculateStabilityDays(stability: number): number {
  if (!stability || stability <= 0) return 0;
  return Math.max(1, Math.round(stability * 0.4025587));
}

export type QuranIntervalClusterKey = '<5' | '<10' | '<15' | '<20' | '<30' | '>30';

export function getQuranPageClusterKey(page: { status?: string; fsrsData: { stability?: number } }): QuranIntervalClusterKey {
  const rawInterval = Math.round((page.fsrsData.stability || 0) * 0.4025587);
  const isMapan = page.status === 'mastered_for_now' || rawInterval >= 30;
  if (isMapan) return '>30';
  if (rawInterval < 5) return '<5';
  if (rawInterval < 10) return '<10';
  if (rawInterval < 15) return '<15';
  if (rawInterval < 20) return '<20';
  return '<30';
}

export type BookIntervalClusterKey = '<75' | '<150' | '<225' | '<300' | '<375' | '>375';

export function getBookItemClusterKey(item: { fsrsData: FSRSState }): BookIntervalClusterKey {
  const intervalDays = getNonQuranIntervalDays(item.fsrsData);
  if (intervalDays >= 375) return '>375';
  if (intervalDays < 75) return '<75';
  if (intervalDays < 150) return '<150';
  if (intervalDays < 225) return '<225';
  if (intervalDays < 300) return '<300';
  return '<375';
}

/**
 * Calculates interval for Quran (without artificial 30-day ceiling)
 */
export function getIntervalDays(fsrsData: FSRSState): number {
  if (fsrsData.stability && fsrsData.stability > 0) {
    return calculateStabilityDays(fsrsData.stability);
  }
  
  if (!fsrsData.lastReview || !fsrsData.nextReview) {
    return 0;
  }
  
  const last = new Date(fsrsData.lastReview);
  const next = new Date(fsrsData.nextReview);
  
  const diffDays = getWIBCalendarDayDiff(last, next);
  return Math.max(1, diffDays);
}

/**
 * Calculates accurate interval in days for Non-Quran knowledge & books.
 * Can exceed 300+ days (not capped to 30 days).
 */
export function getNonQuranIntervalDays(fsrsData: FSRSState): number {
  if (!fsrsData) return 0;
  let fromDates = 0;
  if (fsrsData.lastReview && fsrsData.nextReview) {
    const last = new Date(fsrsData.lastReview);
    const next = new Date(fsrsData.nextReview);
    fromDates = Math.max(0, getWIBCalendarDayDiff(last, next));
  }
  let fromStability = 0;
  if (fsrsData.stability && fsrsData.stability > 0) {
    fromStability = calculateInterval(fsrsData.stability, NON_QURAN_TARGET_RETENTION, NON_QURAN_MAX_INTERVAL_DAYS);
  }
  return Math.max(fromDates, fromStability);
}
