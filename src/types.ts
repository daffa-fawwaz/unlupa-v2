export type AppSpace = 'dashboard' | 'quran' | 'personal' | 'teaching' | 'leaderboard' | 'admin';

export type Language = 'en' | 'id' | 'ar';

export type Theme = 'light' | 'dark';

export interface QuranStats {
  total: number;
  active: number;
  mastered: number;
  dueToday: number;
  dueList: QuranPageItem[];
  
  // Breakdown specific stats for Report Modal (added because QuranReportModal uses them)
  intervalOver30: number;
  intervalLessThan30: number;
  intervalLessThan20: number;
  intervalLessThan10: number;
  intervalLessThan5: number;
}

export interface FSRSState {
  stability: number;       // S: Memory stability in days
  difficulty: number;      // D: Memory difficulty (1 - 10)
  reps: number;            // Total successful reviews
  lapses: number;          // Total failed reviews
  lastReview: string | null; // ISO timestamp
  nextReview: string | null; // ISO timestamp
  state: 'new' | 'learning' | 'review' | 'mastered';
}

export type MapanScheduleMode = 'fsrs' | 'weekly' | 'monthly';

export interface MapanScheduleConfig {
  mode: MapanScheduleMode;
  weeklyDay?: number; // 0 = Ahad, 1 = Senin, ..., 5 = Jum'at, 6 = Sabtu
  monthlyDate?: number; // 1 to 31
}

export interface PageReviewLog {
  id: string;
  date: string; // ISO timestamp
  rating: 1 | 2 | 3; // 1: Ngulang (Again), 2: Kurang Lancar / Cukup (Hard), 3: Lancar Mutqin (Good)
  previousInterval: number; // in days
  newInterval: number; // in days
  wasDue?: boolean;
  
  // Optional feedback / evaluation notes
  notes?: string;
  issueTypes?: ('kelancaran' | 'tajwid' | 'makharijul' | 'konsentrasi')[];
  problemAyahs?: string; // e.g. "255, 257"
  reviewerName?: string; // If reviewed by a teacher
}

export interface PageIssue {
  id: string;
  createdAt: string; // ISO timestamp
  resolvedAt?: string; // ISO timestamp
  isResolved: boolean;
  ayah: string; // e.g. "6", "6-10"
  type: 'kelancaran' | 'lupa' | 'tajwid' | 'makharijul';
  detail?: string; // e.g. "mad", "ikhfa", or specific letter
  note?: string;
}

export interface QuranPageItem {
  pageNumber: number;      // 1 to 604
  juzNumber: number;       // 1 to 30
  surahNameEn: string;     // e.g. "Al-Baqarah"
  surahNameAr: string;     // e.g. "البقرة"
  surahNumber: number;     // 1 to 114
  ayahRange: string;       // e.g. "1 - 5"
  isActive: boolean;       // Activated for review?
  activatedAt?: string;    // ISO timestamp when this page was first activated (Ziyadah)
  imageUrl?: string;       // Real printed Mushaf page image URL
  status: 'inactive' | 'active' | 'mastered_for_now';
  mapanCelebrated?: boolean;
  fsrsData: FSRSState;
  mapanSchedule?: MapanScheduleConfig;
  reviewLogs?: PageReviewLog[]; // History of reviews and evaluations
  issues?: PageIssue[]; // Track specific issues/mistakes for this page
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: 'hadir' | 'izin' | 'sakit' | 'alfa';
  note?: string;
}


export interface Chapter {
  id: string;
  bookId: string;
  masterChapterId?: string | null;
  parentId?: string | null;
  title: string;
  description?: string;
  material?: string;
  order: number;
}

export interface BookItemReviewLog {
  id: string;
  date: string; // ISO timestamp
  rating: number; // 1 | 2 | 3 | 4
  wasDue?: boolean;
}

export interface BookItem {
  id: string;
  bookId: string;
  masterItemId?: string | null;
  chapterId?: string | null;
  question: string;
  answer: string;
  explanation?: string;    // Materi tambahan atau rincian penjelasan jawaban (opsional, default hide di flashcard)
  imageQ?: string;
  imageA?: string;
  tags: string[];
  isActive: boolean;       // Active in FSRS review
  status: 'inactive' | 'active' | 'mastered';
  fsrsData: FSRSState;
  order?: number;
  createdAt: string;
  reviewLogs?: BookItemReviewLog[];
}

export interface Book {
  id: string;
  userId?: string | null;
  classId?: string | null;
  masterBookId?: string | null;
  title: string;
  description: string;
  coverUrl?: string;
  isPublic: boolean;
  isReadonly: boolean;
  isImported?: boolean;
  libraryEntryId?: string;
  authorName?: string;
  category?: string;
  price?: number;
  downloads?: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuranFeedbackItem {
  id: string;
  date: string;
  pageNumber?: number;
  rating?: 1 | 2 | 3; // 1: Perlu Ulang, 2: Cukup, 3: Lancar Mutqin
  teacherName: string;
  note: string;
}

export interface ClassStudent {
  id: string;
  quranSpaceCode?: string; // Kode unik ruang Al-Qur'an santri
  name: string;
  email: string;
  avatarUrl: string;
  activeItemsCount: number;
  dueTodayCount: number;
  averageStability: number;
  lastActive: string;
  retentionRate: number; // e.g. 95%
  frequentStruggles: string[]; // items or pages often marked "Need review"
  quranData?: QuranPageItem[]; // Live/stored Quran pages for this student
  bookItemsData?: BookItem[]; // Live/stored Book items (flashcards) for this student in Kitab class
  teacherFeedbacks?: QuranFeedbackItem[]; // Feedbacks & daily evaluations
}

export interface AssignedBookData {
  book: Book;
  chapters: Chapter[];
  items: BookItem[];
}

export interface ClassGroup {
  id: string;
  teacherId: string;
  teacherName: string;
  name: string;
  code: string;            // e.g. "ABC-1234"
  type: 'quran' | 'non-quran';
  description: string;
  coverUrl?: string;
  requiredJuzList?: number[];
  assignedBookIds?: string[];
  assignedBooksData?: AssignedBookData[]; // Embedded book package for instant multi-user sync!
  students: ClassStudent[];
  createdAt: string;
  status?: 'active' | 'closed';
  closedAt?: string;
}

export type OnboardingPageKey = 'home' | 'quran' | 'personal' | 'teaching';

export interface UserOnboardingPreferences {
  enabled: boolean; // Master toggle: Aktif / Nonaktif
  home: boolean;
  quran: boolean;
  personal: boolean;
  teaching: boolean;
}

export interface UserProfile {
  id: string;
  backendId?: string;
  quranSpaceCode: string; // Kode unik ruang Al-Qur'an akun ini
  fullName: string;
  email: string;
  avatarUrl: string;
  plan: 'free' | 'premium' | 'institutional';
  role?: 'user' | 'admin' | 'superadmin';
  onboardingPreferences?: UserOnboardingPreferences;
}

export interface TierLimitConfig {
  maxBooks: number;
  maxCardsPerBook: number;
  maxDailyAIGenerations: number;
  maxActiveQuranJuz: number;
  maxAudioRecordings: number;
  maxJoinedClasses: number;
  maxQuranClasses: number;
  maxNonQuranClasses: number;
  allowCreateClass: boolean;
  allowExportReport: boolean;
  allowAISmartExtractor: boolean;
}

export type PaymentMethod = 
  | 'qris' 
  | 'bca_va' 
  | 'mandiri_va' 
  | 'bri_va' 
  | 'gopay' 
  | 'shopeepay' 
  | 'credit_card';

export type TransactionStatus = 'pending' | 'success' | 'failed' | 'refunded';

export type TransactionType = 'book_purchase' | 'subscription_pro_monthly' | 'subscription_pro_yearly';

export interface BookTransaction {
  id: string; // e.g. "INV-20260914-8392"
  userId: string;
  userEmail: string;
  userName: string;
  type: TransactionType;
  bookId?: string;
  libraryEntryId?: string;
  bookTitle: string;
  bookCoverUrl?: string;
  authorName: string;
  authorId?: string;
  amount: number; // in IDR
  platformFee: number; // in IDR (e.g. 15%)
  authorRoyalty: number; // in IDR (e.g. 85%)
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  paidAt: string;
  createdAt: string;
}

export interface SystemTierConfig {
  freeTier: TierLimitConfig;
  premiumTier: TierLimitConfig;
  pricing: {
    monthlyIDR: number;
    yearlyIDR: number;
    monthlyUSD: number;
  };
  updatedAt: string;
  updatedBy?: string;
}

export function createDefaultTierConfig(): SystemTierConfig {
  return {
    freeTier: {
      maxBooks: 3,
      maxCardsPerBook: 50,
      maxDailyAIGenerations: 3,
      maxActiveQuranJuz: 3,
      maxAudioRecordings: 10,
      maxJoinedClasses: 2,
      maxQuranClasses: 1,
      maxNonQuranClasses: 1,
      allowCreateClass: true,
      allowExportReport: false,
      allowAISmartExtractor: false,
    },
    premiumTier: {
      maxBooks: 9999,
      maxCardsPerBook: 9999,
      maxDailyAIGenerations: 30,
      maxActiveQuranJuz: 30,
      maxAudioRecordings: 9999,
      maxJoinedClasses: 9999,
      maxQuranClasses: 9999,
      maxNonQuranClasses: 9999,
      allowCreateClass: true,
      allowExportReport: true,
      allowAISmartExtractor: true,
    },
    pricing: {
      monthlyIDR: 49000,
      yearlyIDR: 399000,
      monthlyUSD: 4.99,
    },
    updatedAt: new Date().toISOString(),
    updatedBy: 'System Default',
  };
}

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


export type BlockType = 'text' | 'image' | 'arabic' | 'multiple-choice' | 'ordering' | 'video';

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  content: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  content: string;
}

export interface ArabicWord {
  id: string;
  arabic: string;
  translation: string;
  example?: string;
  newLine?: boolean; // If true, starts a new line / baris baru
}

export interface ArabicBlock extends BaseBlock {
  type: 'arabic';
  content: ArabicWord[];
}

export interface MultipleChoiceBlock extends BaseBlock {
  type: 'multiple-choice';
  content: {
    question: string;
    options: { id: string; text: string }[];
    correctOptionId: string;
  };
}

export interface OrderingBlock extends BaseBlock {
  type: 'ordering';
  content: {
    items: { id: string; text: string }[]; 
  };
}

export type ContentBlock = TextBlock | ImageBlock | ArabicBlock | MultipleChoiceBlock | OrderingBlock | VideoBlock;

export interface PageDocument {
  id: string;
  bookId: string;
  chapterId?: string | null;
  title: string;
  blocks: ContentBlock[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Gamifikasi, XP, dan Leaderboard
// ==========================================
export type GamificationRankTier = 'mubtadi' | 'thalib' | 'muwazhib' | 'hafizh' | 'mutqin' | 'sayyid';

export interface GamificationLevel {
  tier: GamificationRankTier;
  titleId: string;
  titleAr: string;
  minXp: number;
  badgeColor: string;
  badgeBg: string;
  iconName: string;
}

export interface UserGamificationStats {
  totalXp: number;
  quranXp: number;
  disciplineXp: number;
  streakDays: number;
  currentMilestoneDays: number; // 7, 14, 21, 28, 35... (weekly milestone)
  daysToMilestone: number;
  completedMilestonesCount: number;
  onTimeReviewCount: number;
  disciplineRate: number; // 0 - 100% ketepatan waktu
  disciplineScore: number; // Skor indeks kedisiplinan gabungan
  reviewedPagesCount: number; // Total lembar halaman Al-Qur'an yang direview
  currentTier: GamificationRankTier;
  tierTitleId: string;
  tierTitleAr: string;
  nextTierXp: number;
  progressToNextTier: number; // 0 - 100 percentage
  weeklyXpGain: number;
}

export interface LeaderboardUserEntry {
  id: string;
  name: string;
  avatarUrl: string;
  quranSpaceCode?: string;
  totalXp: number;
  quranXp: number;
  streakDays: number;
  activePagesCount: number;
  tier: GamificationRankTier;
  tierTitleId: string;
  tierTitleAr: string;
  isCurrentUser?: boolean;
  region?: string;
  lastActive: string;
  retentionRate?: number;
  disciplineRate?: number; // 0 - 100% ketepatan waktu
  disciplineScore?: number; // Skor indeks kedisiplinan (Disiplin % + streak)
  reviewedPagesCount?: number; // Total halaman yang direview
  rank?: number;
  disciplineRank?: number; // Peringkat dalam mode kedisiplinan murni
}

export interface QuranFriendshipGroup {
  id: string;
  name: string;
  code: string; // e.g. "KELUARGA-8821"
  description: string;
  creatorId: string;
  creatorName: string;
  createdAt: string;
  members: LeaderboardUserEntry[];
}

