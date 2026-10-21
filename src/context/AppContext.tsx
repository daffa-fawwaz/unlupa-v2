import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  AppSpace, 
  Language, 
  Theme,
  QuranPageItem, 
  Book, 
  Chapter, 
  BookItem, PageDocument, 
  ClassGroup, 
  ClassStudent,
  AssignedBookData,
  QuranFeedbackItem,
  UserProfile,
  FSRSState,
  MapanScheduleConfig,
  QuranStats,
  PageReviewLog,
  BookItemReviewLog,
  OnboardingPageKey,
  UserOnboardingPreferences,
  SystemTierConfig,
  TierLimitConfig,
  createDefaultTierConfig,
  createInitialFSRSState,
  BookTransaction,
  PaymentMethod
} from '../types';
import { generateInitialQuranPages, generateCleanQuranPages, ensureComplete604Pages, getSurahForPage, getJuzForPage } from '../data/quranData';
import { INITIAL_BOOKS, INITIAL_CHAPTERS, INITIAL_ITEMS, CURATED_LIBRARY, LibraryEntry } from '../data/sampleBooks';
import { INITIAL_CLASSES, createSampleStudentQuranPages, createSampleStudentBookItems } from '../data/sampleClasses';
import { updateQuranFSRS, updateNonQuranFSRS, isDue, isReviewedToday, calculateNextMapanDate } from '../lib/fsrs';
import { normalizeBilingualText } from '../utils/bilingualHelper';
import { api, ApiError, getAuthToken, clearAuthToken, BackendUserResponse } from '../lib/api';

export interface AuthUser {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: string;
  avatarUrl?: string | null;
}
import { UpgradePlanModal } from '../components/common/UpgradePlanModal';
import { BookCheckoutModal } from '../components/common/BookCheckoutModal';
import { useClassCleanup } from '../hooks/useClassCleanup';
import { triggerXpReward } from '../components/common/FloatingXpToast';
import { isUserAdmin } from '../services/authRbacService';
import { 
  bookApiService, 
  mapBackendBookToBook, 
  mapBackendChapterToChapter, 
  mapBackendItemToBookItem 
} from '../services/bookApiService';
import {
  readLocalStorageSnapshot,
  readFirestoreSnapshot,
  compareSnapshots,
  ReconciliationComparison,
} from '../services/legacyReconciliationService';
import { LegacyDataReconciliationModal } from '../components/personal/LegacyDataReconciliationModal';
import { classApiService } from '../services/classApiService';
import { wsService } from '../services/websocketService';

function isValidUUID(val: string | null | undefined): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

interface PersonalStats {
  totalBooks: number;
  totalItems: number;
  activeItems: number;
  dueToday: number;
  avgStability: number;
  dueList: BookItem[];
}

interface AppContextType {
  activeSpace: AppSpace;
  setActiveSpace: (space: AppSpace) => void;
  selectedTeachingClassId: string | null;
  setSelectedTeachingClassId: (id: string | null) => void;
  editingClassBookId: string | null;
  setEditingClassBookId: (id: string | null) => void;
  selectedPersonalBookId: string | null;
  setSelectedPersonalBookId: (id: string | null) => void;
  spaceResetCounter: { space: AppSpace; count: number };
  resetSpaceToRoot: (space: AppSpace) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isLandingPageOpen: boolean;
  setIsLandingPageOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  // Professional Page Walkthrough & Onboarding Controls
  isOnboardingEnabled: boolean;
  setIsOnboardingEnabled: (enabled: boolean) => void;
  isWalkthroughOpen: boolean;
  setIsWalkthroughOpen: (open: boolean) => void;
  activeWalkthroughPage: OnboardingPageKey;
  openPageWalkthrough: (page: OnboardingPageKey) => void;
  closePageWalkthrough: () => void;
  togglePageOnboarding: (page: OnboardingPageKey, enabled?: boolean) => void;
  setAllPageOnboarding: (enabled: boolean) => void;
  resetOnboardingStatus: (page?: OnboardingPageKey) => void;
  isOnboardingSettingsOpen: boolean;
  setIsOnboardingSettingsOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
  openLoginModal: () => void;
  openRegisterModal: () => void;
  currentUser: AuthUser | null;
  initiateUserSession: (backendUser: BackendUserResponse, options?: { isNewRegistration?: boolean }) => Promise<void>;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  updateUserProfile: (data: Partial<UserProfile>) => void;
  logout: () => Promise<void>;
  backendAuthStatus: 'unauthenticated' | 'loading' | 'authenticated' | 'error';
  backendAuthError: string | null;
  attendanceExceptions: Record<string, 'izin' | 'sakit'>;
  markAttendanceException: (date: string, status: 'izin' | 'sakit' | null) => void;
  quranSpaceCode: string;
  teacherFeedbacks: QuranFeedbackItem[];
  isTeacherMode?: boolean;

  // Tier Limits & Dynamic Admin Config
  tierConfig: SystemTierConfig;
  updateTierConfig: (newConfig: Partial<SystemTierConfig>) => void;
  dailyAIUsage: { date: string; count: number };
  recordAIUsage: () => boolean;
  isFeatureAllowed: (
    feature: 'create_book' | 'ai_builder' | 'ai_extractor' | 'create_class' | 'export_report' | 'quran_juz' | 'audio_recording' | 'join_class',
    countOrJuz?: number,
    classType?: 'quran' | 'non-quran'
  ) => { allowed: boolean; reason?: string; limit?: number; current?: number };
  isUpgradeModalOpen: boolean;
  setIsUpgradeModalOpen: (open: boolean) => void;
  upgradeModalContext: { feature?: string; message?: string };
  openUpgradeModal: (feature?: string, message?: string) => void;

  
  // Data
  quranPages: QuranPageItem[];
  books: Book[];
  chapters: Chapter[];
  items: BookItem[];
  pages: PageDocument[];
  createPage: (data: { bookId: string; chapterId?: string; title: string; blocks: any[] }) => PageDocument;
  updatePage: (id: string, data: Partial<PageDocument>) => void;
  deletePage: (id: string) => void;
  myClasses: ClassGroup[];
  teachingClasses: ClassGroup[];
  library: LibraryEntry[];

  // Computed Stats
  quranStats: QuranStats;
  personalStats: PersonalStats;
  myClassesStats: { dueToday: number };
  currentStreak: number;
  totalActiveMaterials: number;
  totalMasteredMaterials: number;

  // Actions
  activateQuranPage: (pageNumber: number) => void;
  deactivateQuranPage: (pageNumber: number) => void;
  reviewQuranPage: (pageNumber: number, rating: 1 | 2 | 3, feedback?: { notes?: string; issueTypes?: ('kelancaran' | 'tajwid' | 'makharijul' | 'konsentrasi')[]; problemAyahs?: string; }) => { 
    newState: FSRSState; 
    nextIntervalDays: number; 
    isMasteredForNow: boolean;
    justBecameMastered: boolean;
  } | null;
  bypassQuranPageToMapan: (pageNumber: number) => void;
  resetQuranPageMapan: (pageNumber: number) => void;
  updateQuranMapanSchedule: (pageNumber: number, config: MapanScheduleConfig) => void;
  setGlobalMapanSchedule: (config: MapanScheduleConfig) => void;
  addQuranPageFeedback: (pageNumber: number, feedback: { notes?: string; issueTypes?: ('kelancaran' | 'tajwid' | 'makharijul' | 'konsentrasi')[]; problemAyahs?: string; }) => void;
  addQuranPageIssue: (pageNumber: number, issue: Omit<import('../types').PageIssue, 'id' | 'createdAt' | 'isResolved'>) => void;
  resolveQuranPageIssue: (pageNumber: number, issueId: string) => void;
  
  activateItem: (itemId: string) => void;
  deactivateItem: (itemId: string) => void;
  reviewItem: (itemId: string, rating: 1 | 2 | 3 | 4) => void;
  
  createBook: (data: { id?: string; title: string; description: string; coverUrl?: string; isPublic?: boolean; category?: string; authorName?: string; price?: number; isReadonly?: boolean }) => Book;
  createBookWithContent: (bookData: {
    title: string;
    description?: string;
    coverUrl?: string;
    category?: string;
    chapters?: Array<{
      title: string;
      description?: string;
      material?: string;
      cards?: Array<{
        question: string;
        answer: string;
        explanation?: string;
      }>;
    }>;
  }) => Promise<Book>;
  updateBook: (id: string, data: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  
  createChapter: (data: { id?: string; bookId: string; title: string; description?: string; material?: string; parentId?: string | null; order?: number }) => Chapter;
  updateChapter: (id: string, data: Partial<Chapter>) => void;
  deleteChapter: (chapterId: string) => void;
  
  createItem: (data: { id?: string; bookId: string; chapterId?: string; question: string; answer: string; explanation?: string; tags?: string[]; imageQ?: string; imageA?: string; audioQ?: string; audioA?: string; order?: number }) => BookItem;
  updateItem: (id: string, data: Partial<BookItem>) => void;
  reorderItems: (newItems: BookItem[]) => void;
  deleteItem: (itemId: string) => void;

  importFromLibrary: (libId: string) => Promise<void> | void;
  importFromJSON: (jsonStr: string) => { success: boolean; message: string };
  exportBookJSON: (bookId: string) => string;
  publishBookToLibrary: (bookId: string, allowEdit?: boolean, pricing?: { isPaid: boolean; price?: number }) => Promise<{ success: boolean; message: string }>;

  duplicateBookAsEditable: (bookId: string) => Book | null;

  // Backend Sync & Data Reconciliation
  isBooksLoading: boolean;
  booksError: string | null;
  reconciliationComparison: ReconciliationComparison | null;
  isReconciliationModalOpen: boolean;
  setIsReconciliationModalOpen: (open: boolean) => void;
  openReconciliationModal: () => void;
  refreshBooksFromBackend: () => Promise<void>;
  refreshClassesFromBackend: () => Promise<void>;
  refreshLibraryFromBackend: () => Promise<void>;

  // Marketplace, Transactions & Invoices
  transactions: BookTransaction[];
  purchasedBookIds: string[];
  isBookPurchased: (libraryEntryId: string, book?: Book) => boolean;
  purchaseBook: (entry: LibraryEntry, paymentMethod: PaymentMethod) => Promise<{ success: boolean; transaction: BookTransaction }>;
  subscribeToPro: (cycle: 'monthly' | 'yearly', paymentMethod: PaymentMethod) => Promise<{ success: boolean; transaction: BookTransaction }>;
  isCheckoutModalOpen: boolean;
  selectedCheckoutEntry: LibraryEntry | null;
  openCheckoutModal: (entry: LibraryEntry) => void;
  closeCheckoutModal: () => void;

  joinClassByCode: (code: string) => Promise<{ success: boolean; message: string }>;
  leaveClass: (classId: string) => void;
  createTeachingClass: (data: { 
    name: string; 
    type: 'quran' | 'non-quran'; 
    description?: string; 
    coverUrl?: string;
    code?: string;
    requiredJuzList?: number[];
    assignedBookIds?: string[];
  }) => Promise<ClassGroup>;
  deleteTeachingClass: (classId: string) => void;
  closeTeachingClass: (classId: string) => void;
  reopenTeachingClass: (classId: string) => void;
  updateTeachingClass: (id: string, data: Partial<ClassGroup>) => void;
  syncBookToClasses: (bookId: string, targetClassIds?: string[]) => Promise<void>;
  removeStudentFromClass: (classId: string, studentId: string) => void;
  reviewStudentQuranPage: (classId: string, studentId: string, pageNumber: number, rating: 1 | 2 | 3, note?: string) => void;
  addStudentDailyFeedback: (classId: string, studentId: string, note: string) => void;
  activateStudentQuranPage: (classId: string, studentId: string, pageNumber: number) => void;
  deactivateStudentQuranPage: (classId: string, studentId: string, pageNumber: number) => void;
  bypassStudentQuranPageMapan: (classId: string, studentId: string, pageNumber: number) => void;
  resetStudentQuranPageMapan: (classId: string, studentId: string, pageNumber: number) => void;

  reviewStudentBookItem: (classId: string, studentId: string, itemId: string, rating: 1 | 2 | 3 | 4, note?: string) => void;
  activateStudentBookItem: (classId: string, studentId: string, itemId: string) => void;
  deactivateStudentBookItem: (classId: string, studentId: string, itemId: string) => void;
  bypassStudentBookItemMapan: (classId: string, studentId: string, itemId: string) => void;
  resetStudentBookItemMapan: (classId: string, studentId: string, itemId: string) => void;

  getLiveStudentQuranData: (studentId: string) => QuranPageItem[];
  getLiveStudentBookItems: (studentId: string) => BookItem[];

  resetToDefaults: () => void;
}

export const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  QURAN_PAGES: 'unlupa_quran_pages_v6',
  BOOKS: 'unlupa_books_v3',
  CHAPTERS: 'unlupa_chapters_v3',
  ITEMS: 'unlupa_items_v3',
  MY_CLASSES: 'unlupa_my_classes_v2',
  TEACHING_CLASSES: 'unlupa_teaching_classes_v2',
  ACTIVE_SPACE: 'unlupa_active_space_v2',
  LANGUAGE: 'unlupa_lang_v2',
  THEME: 'unlupa_theme_v1',
  ONBOARDING_SEEN: 'unlupa_onboarding_seen_v2',
  QURAN_SPACE_CODE: 'unlupa_quran_space_code_v1',
  TEACHER_FEEDBACKS: 'unlupa_teacher_feedbacks_v1',
  ATTENDANCE_EXCEPTIONS: 'unlupa_attendance_exceptions_v1',
};

const DEFAULT_ISLAMIC_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="48" fill="#F1F5F9" />
    <path d="M28 32 C28 20 72 20 72 32 L72 38 L28 38 Z" fill="#1E293B" />
    <circle cx="50" cy="46" r="16" fill="#FDBA74" />
    <path d="M22 84 C22 66 36 62 50 62 C64 62 78 66 78 84 Z" fill="#3B82F6" />
    <rect x="42" y="62" width="16" height="22" fill="#FFFFFF" rx="3" />
  </svg>
`)}`;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSpace, setActiveSpace] = useState<AppSpace>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_SPACE);
      const validSpaces: AppSpace[] = ['dashboard', 'quran', 'personal', 'teaching', 'leaderboard', 'admin'];
      if (saved && validSpaces.includes(saved as AppSpace)) {
        return saved as AppSpace;
      }
    } catch (e) {
      console.warn('Error reading active space from localStorage', e);
    }
    return 'dashboard';
  });
  const [editingClassBookId, setEditingClassBookId] = useState<string | null>(null);
  const [selectedTeachingClassId, setSelectedTeachingClassId] = useState<string | null>(null);
  const [selectedPersonalBookId, setSelectedPersonalBookId] = useState<string | null>(null);

  const [spaceResetCounter, setSpaceResetCounter] = useState<{ space: AppSpace; count: number }>({
    space: 'quran',
    count: 0,
  });

  const resetSpaceToRoot = (space: AppSpace) => {
    if (space === 'personal') {
      setSelectedPersonalBookId(null);
      setEditingClassBookId(null);
    }
    if (space === 'teaching') {
      setSelectedTeachingClassId(null);
    }
    setSpaceResetCounter(prev => ({ space, count: prev.count + 1 }));
  };

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return (saved as Language) || 'en';
  });

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error('Error setting theme class', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [isLandingPageOpen, setIsLandingPageOpen] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      // Priority 1: Explicit URL parameters or hash
      if (params.get('landing') === 'true' || window.location.hash === '#landing') return true;
      if (params.get('app') === 'true' || window.location.hash === '#app') return false;

      // Priority 2: In-app session flag within active browser tab
      if (sessionStorage.getItem('unlupa_in_app') === 'true') return false;

      // Clean up legacy permanent suppression
      localStorage.removeItem('unlupa_seen_app');

      // Default: Direct to landing page on initial access to localhost:3000
      return true;
    } catch (e) { /* ignore */ }
    return true;
  });
  
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return !localStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN);
  });

  const [quranSpaceCode] = useState<string>(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.QURAN_SPACE_CODE);
    if (cached) return cached;
    const code = 'UNL-QRN-7842';
    try { localStorage.setItem(STORAGE_KEYS.QURAN_SPACE_CODE, code); } catch (e) { /* ignore */ }
    return code;
  });

  const [teacherFeedbacks, setTeacherFeedbacks] = useState<QuranFeedbackItem[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.TEACHER_FEEDBACKS);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { /* ignore */ }
    }
    return [
      {
        id: 'tf-welcome',
        date: new Date(Date.now() - 3600000 * 4).toISOString(),
        pageNumber: 1,
        rating: 2,
        teacherName: 'Ust. Ahmad Al-Hafizh',
        note: 'Alhamdulillah tasmi\' Al-Fatihah sangat lancar mutqin. Terus istiqamahkan jadwal murajaah harian.',
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TEACHER_FEEDBACKS, JSON.stringify(teacherFeedbacks));
    } catch (e) {
      console.error(e);
    }
  }, [teacherFeedbacks]);

  const defaultOnboardingPreferences: UserOnboardingPreferences = {
    enabled: true,
    home: true,
    quran: true,
    personal: true,
    teaching: true,
  };

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    let savedEnabled: boolean | null = null;
    try {
      const stored = localStorage.getItem('unlupa_onboarding_enabled');
      if (stored !== null) savedEnabled = stored === 'true';
    } catch (e) { /* ignore */ }

    const savedUser = localStorage.getItem('unlupa_user_profile_v1');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        const resolvedEnabled = savedEnabled !== null 
          ? savedEnabled 
          : (parsed.onboardingPreferences?.enabled !== undefined ? parsed.onboardingPreferences.enabled : true);
        const cleanAvatar = (!parsed.avatarUrl || parsed.avatarUrl.includes('photo-1534528741775-53994a69daeb'))
          ? DEFAULT_ISLAMIC_AVATAR
          : parsed.avatarUrl;
        const token = getAuthToken();
        const hasSession = Boolean(token);
        return {
          ...parsed,
          id: hasSession ? (parsed.id || 'guest') : 'guest',
          backendId: hasSession ? (parsed.backendId || (parsed.id && parsed.id !== 'guest' ? parsed.id : undefined)) : undefined,
          fullName: hasSession ? (parsed.fullName || 'Tamu / Murid') : 'Tamu / Murid',
          avatarUrl: cleanAvatar,
          onboardingPreferences: {
            ...defaultOnboardingPreferences,
            ...(parsed.onboardingPreferences || {}),
            enabled: resolvedEnabled
          }
        };
      } catch (e) { /* ignore */ }
    }
    return {
      id: 'guest',
      quranSpaceCode: 'UNL-QRN-GUEST',
      fullName: 'Tamu / Murid',
      email: '',
      avatarUrl: DEFAULT_ISLAMIC_AVATAR,
      role: 'user',
      plan: 'free',
      onboardingPreferences: {
        ...defaultOnboardingPreferences,
        enabled: savedEnabled !== null ? savedEnabled : true,
      },
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('unlupa_user_profile_v1', JSON.stringify(userProfile));
    } catch (e) { /* ignore */ }
  }, [userProfile]);

  const updateUserProfile = (data: Partial<UserProfile>) => {
    setUserProfile(prev => {
      const updated = { ...prev, ...data };
      try {
        localStorage.setItem('unlupa_user_profile_v1', JSON.stringify(updated));
      } catch (e) { /* ignore */ }
      return updated;
    });
  };

  // Backend Authentication Bridge State
  const [backendAuthStatus, setBackendAuthStatus] = useState<'unauthenticated' | 'loading' | 'authenticated' | 'error'>('unauthenticated');
  const [backendAuthError, setBackendAuthError] = useState<string | null>(null);
  const activeMeAbortControllerRef = useRef<AbortController | null>(null);

  // Dynamic Tier Limits Configuration
  const [tierConfig, setTierConfig] = useState<SystemTierConfig>(() => {
    try {
      const saved = localStorage.getItem('unlupa_system_tier_config_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...createDefaultTierConfig(), ...parsed };
      }
    } catch (e) { /* ignore */ }
    return createDefaultTierConfig();
  });

  const updateTierConfig = (newConfig: Partial<SystemTierConfig>) => {
    setTierConfig(prev => {
      const updated = { ...prev, ...newConfig, updatedAt: new Date().toISOString() };
      try {
        localStorage.setItem('unlupa_system_tier_config_v1', JSON.stringify(updated));
      } catch (e) { /* ignore */ }
      return updated;
    });
  };

  // Daily AI Usage Tracking
  const [dailyAIUsage, setDailyAIUsage] = useState<{ date: string; count: number }>(() => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const saved = localStorage.getItem(`unlupa_daily_ai_${userProfile.id}_${today}`);
      if (saved) {
        return { date: today, count: Number(saved) || 0 };
      }
    } catch (e) { /* ignore */ }
    return { date: today, count: 0 };
  });

  const recordAIUsage = (): boolean => {
    const today = new Date().toISOString().split('T')[0];
    const isPro = userProfile.plan === 'premium' || userProfile.plan === 'institutional' || userProfile.role === 'admin' || userProfile.role === 'superadmin';
    const limits = isPro ? tierConfig.premiumTier : tierConfig.freeTier;
    
    const currentCount = dailyAIUsage.date === today ? dailyAIUsage.count : 0;
    if (currentCount >= limits.maxDailyAIGenerations) {
      return false;
    }
    
    const newCount = currentCount + 1;
    setDailyAIUsage({ date: today, count: newCount });
    try {
      localStorage.setItem(`unlupa_daily_ai_${userProfile.id}_${today}`, String(newCount));
    } catch (e) { /* ignore */ }
    return true;
  };

  // Graceful Upgrade Modal state
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeModalContext, setUpgradeModalContext] = useState<{ feature?: string; message?: string }>({});

  const openUpgradeModal = (feature?: string, message?: string) => {
    setUpgradeModalContext({ feature, message });
    setIsUpgradeModalOpen(true);
  };

  const closeUpgradeModal = () => {
    setIsUpgradeModalOpen(false);
  };

  // Helper to check if a specific action is within limits
  const isFeatureAllowed = (
    feature: 'create_book' | 'ai_builder' | 'ai_extractor' | 'create_class' | 'export_report' | 'quran_juz' | 'audio_recording' | 'join_class',
    countOrJuz?: number,
    classType?: 'quran' | 'non-quran'
  ): { allowed: boolean; reason?: string; limit?: number; current?: number } => {
    const isPro = userProfile.plan === 'premium' || userProfile.plan === 'institutional' || userProfile.role === 'admin' || userProfile.role === 'superadmin';
    const limits = isPro ? tierConfig.premiumTier : tierConfig.freeTier;

    switch (feature) {
      case 'create_book': {
        const userBooks = books.filter(b => !b.classId);
        const allowed = isPro || userBooks.length < limits.maxBooks;
        return {
          allowed,
          limit: limits.maxBooks,
          current: userBooks.length,
          reason: allowed ? undefined : (language === 'en' 
            ? `Free plan limit is ${limits.maxBooks} books.` 
            : `Batas pembuatan buku akun Free adalah ${limits.maxBooks} buku.`)
        };
      }
      case 'ai_builder': {
        const today = new Date().toISOString().split('T')[0];
        const todayCount = dailyAIUsage.date === today ? dailyAIUsage.count : 0;
        const allowed = isPro || todayCount < limits.maxDailyAIGenerations;
        return {
          allowed,
          limit: limits.maxDailyAIGenerations,
          current: todayCount,
          reason: allowed ? undefined : (language === 'en'
            ? `Daily AI limit is ${limits.maxDailyAIGenerations} generations per day.`
            : `Kuota harian AI Builder akun Free adalah ${limits.maxDailyAIGenerations}x per hari.`)
        };
      }
      case 'ai_extractor': {
        const allowed = isPro || limits.allowAISmartExtractor;
        return {
          allowed,
          reason: allowed ? undefined : (language === 'en'
            ? 'Smart AI Extractor is exclusive to Unlupa Pro.'
            : 'Fitur Smart AI Extractor tersedia eksklusif untuk pengguna Unlupa Pro.')
        };
      }
      case 'create_class': {
        if (isPro) {
          return { allowed: true };
        }

        const quranClasses = teachingClasses.filter(c => c.type === 'quran');
        const nonQuranClasses = teachingClasses.filter(c => c.type !== 'quran');

        const maxQuran = limits.maxQuranClasses ?? 1;
        const maxNonQuran = limits.maxNonQuranClasses ?? 1;

        if (classType === 'quran') {
          const allowed = quranClasses.length < maxQuran;
          return {
            allowed,
            limit: maxQuran,
            current: quranClasses.length,
            reason: allowed ? undefined : (language === 'en'
              ? `Free accounts can create up to ${maxQuran} Al-Qur'an class. Upgrade to Unlupa Pro for unlimited classes.`
              : `Batas pembuatan kelas Al-Qur'an untuk akun Free adalah maksimal ${maxQuran} kelas. Upgrade ke Unlupa Pro untuk membuat kelas tanpa batas.`)
          };
        } else if (classType === 'non-quran') {
          const allowed = nonQuranClasses.length < maxNonQuran;
          return {
            allowed,
            limit: maxNonQuran,
            current: nonQuranClasses.length,
            reason: allowed ? undefined : (language === 'en'
              ? `Free accounts can create up to ${maxNonQuran} Kitab/Materi class. Upgrade to Unlupa Pro for unlimited classes.`
              : `Batas pembuatan kelas Non-Qur'an (Kitab) untuk akun Free adalah maksimal ${maxNonQuran} kelas. Upgrade ke Unlupa Pro untuk membuat kelas tanpa batas.`)
          };
        }

        const canCreateAny = quranClasses.length < maxQuran || nonQuranClasses.length < maxNonQuran;
        return {
          allowed: canCreateAny,
          reason: canCreateAny ? undefined : (language === 'en'
            ? 'Free accounts can create up to 1 Al-Qur\'an class and 1 Kitab class. Upgrade to Unlupa Pro for unlimited classes.'
            : 'Akun Free dibatasi maksimal 1 kelas Al-Qur\'an dan 1 kelas Kitab. Upgrade ke Unlupa Pro untuk membuat kelas tanpa batas.')
        };
      }
      case 'export_report': {
        const allowed = isPro || limits.allowExportReport;
        return {
          allowed,
          reason: allowed ? undefined : (language === 'en'
            ? 'Report and transcript exports require Unlupa Pro.'
            : 'Ekspor rapor dan laporan cetak memerlukan akun Unlupa Pro.')
        };
      }
      case 'quran_juz': {
        const activeJuzSet = new Set(quranPages.filter(p => p.isActive).map(p => p.juzNumber));
        if (countOrJuz && activeJuzSet.has(countOrJuz)) {
          return { allowed: true };
        }
        const allowed = isPro || activeJuzSet.size < limits.maxActiveQuranJuz;
        return {
          allowed,
          limit: limits.maxActiveQuranJuz,
          current: activeJuzSet.size,
          reason: allowed ? undefined : (language === 'en'
            ? `Free plan limit is ${limits.maxActiveQuranJuz} active Juz.`
            : `Batas Juz aktif akun Free adalah ${limits.maxActiveQuranJuz} Juz.`)
        };
      }
      case 'audio_recording': {
        const allowed = isPro || (countOrJuz ?? 0) < limits.maxAudioRecordings;
        return {
          allowed,
          limit: limits.maxAudioRecordings,
          current: countOrJuz ?? 0,
          reason: allowed ? undefined : (language === 'en'
            ? `Free plan audio limit is ${limits.maxAudioRecordings} recordings.`
            : `Batas rekaman audio suara akun Free adalah ${limits.maxAudioRecordings} rekaman.`)
        };
      }
      case 'join_class': {
        const allowed = isPro || myClasses.length < limits.maxJoinedClasses;
        return {
          allowed,
          limit: limits.maxJoinedClasses,
          current: myClasses.length,
          reason: allowed ? undefined : (language === 'en'
            ? `Free plan limit is ${limits.maxJoinedClasses} joined classes.`
            : `Batas bergabung kelas akun Free adalah ${limits.maxJoinedClasses} kelas.`)
        };
      }
      default:
        return { allowed: true };
    }
  };

  // Professional Page Walkthrough & Onboarding State
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState<boolean>(false);
  const [activeWalkthroughPage, setActiveWalkthroughPage] = useState<OnboardingPageKey>('home');
  const [isOnboardingSettingsOpen, setIsOnboardingSettingsOpen] = useState<boolean>(false);

  const isOnboardingEnabled = userProfile.onboardingPreferences?.enabled !== false;

  const setIsOnboardingEnabled = (enabled: boolean) => {
    try {
      localStorage.setItem('unlupa_onboarding_enabled', enabled ? 'true' : 'false');
    } catch (e) { /* ignore */ }
    setUserProfile(prev => ({
      ...prev,
      onboardingPreferences: {
        ...(prev.onboardingPreferences || defaultOnboardingPreferences),
        enabled,
      },
    }));
  };

  const openPageWalkthrough = (page: OnboardingPageKey) => {
    setActiveWalkthroughPage(page);
    setIsWalkthroughOpen(true);
  };

  const closePageWalkthrough = () => {
    setIsWalkthroughOpen(false);
  };

  const togglePageOnboarding = (page: OnboardingPageKey, enabled?: boolean) => {
    setUserProfile(prev => {
      const currentPrefs = prev.onboardingPreferences || defaultOnboardingPreferences;
      const newValue = enabled !== undefined ? enabled : !currentPrefs[page];
      const updatedPrefs = { ...currentPrefs, [page]: newValue };
      return {
        ...prev,
        onboardingPreferences: updatedPrefs,
      };
    });
  };

  const setAllPageOnboarding = (enabled: boolean) => {
    try {
      localStorage.setItem('unlupa_onboarding_enabled', enabled ? 'true' : 'false');
    } catch (e) { /* ignore */ }
    setUserProfile(prev => ({
      ...prev,
      onboardingPreferences: {
        ...(prev.onboardingPreferences || defaultOnboardingPreferences),
        enabled: enabled,
        home: enabled,
        quran: enabled,
        personal: enabled,
        classes: enabled,
        teaching: enabled,
      },
    }));
  };

  const resetOnboardingStatus = (page?: OnboardingPageKey) => {
    const pages: OnboardingPageKey[] = page ? [page] : ['home', 'quran', 'personal', 'teaching'];
    pages.forEach(p => {
      try {
        localStorage.removeItem(`unlupa_walkthrough_seen_${p}`);
      } catch (e) {
        /* ignore */
      }
    });
  };


  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Scoped user storage helpers
  const getUserKey = (userId: string, keyName: string) => `unlupa_user_${userId}_${keyName}`;

  const getLiveStudentQuranData = useCallback((studentId: string): QuranPageItem[] => {
    try {
      const realId = studentId.startsWith('std-user-') ? studentId.replace('std-user-', '') : studentId;
      const cached = localStorage.getItem(getUserKey(realId, 'quran_pages'));
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Failed to read live student quran data', e);
    }
    return [];
  }, []);

  const getLiveStudentBookItems = useCallback((studentId: string): BookItem[] => {
    try {
      const realId = studentId.startsWith('std-user-') ? studentId.replace('std-user-', '') : studentId;
      const cached = localStorage.getItem(getUserKey(realId, 'items'));
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Failed to read live student book items', e);
    }
    return [];
  }, []);

  // Helper to load user-isolated data (defaults to clean 0-state for new accounts)
  const loadUserData = (userId: string) => {
    // 1. Quran Pages: default is clean 604 pages, all inactive
    let loadedQuranPages: QuranPageItem[] = generateCleanQuranPages();
    try {
      const cachedQuran = localStorage.getItem(getUserKey(userId, 'quran_pages'));
      if (cachedQuran) {
        const parsed = JSON.parse(cachedQuran);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedQuranPages = parsed.map(page => {
            if (!page || typeof page !== 'object') return null;
            const pageNum = Number(page.pageNumber) || 1;
            const surah = getSurahForPage(pageNum);
            const juz = getJuzForPage(pageNum);
            const safeFsrs = page.fsrsData && typeof page.fsrsData === 'object'
              ? {
                  stability: Number(page.fsrsData.stability) || 0,
                  difficulty: Number(page.fsrsData.difficulty) || 5.0,
                  reps: Number(page.fsrsData.reps) || 0,
                  lapses: Number(page.fsrsData.lapses) || 0,
                  lastReview: page.fsrsData.lastReview || null,
                  nextReview: page.fsrsData.nextReview || null,
                  state: page.fsrsData.state || 'new',
                }
              : createInitialFSRSState();

            return {
              ...page,
              pageNumber: pageNum,
              isActive: Boolean(page.isActive),
              status: page.status || (page.isActive ? 'active' : 'inactive'),
              mapanCelebrated: Boolean(page.mapanCelebrated),
              fsrsData: safeFsrs,
              reviewLogs: Array.isArray(page.reviewLogs) ? page.reviewLogs : [],
              issues: Array.isArray(page.issues) ? page.issues : [],
              juzNumber: juz,
              surahNumber: surah.surahNumber,
              surahNameEn: surah.nameEn,
              surahNameAr: surah.nameAr,
              ayahRange: surah.ayahRange,
            };
          }).filter(Boolean) as QuranPageItem[];
        }
      }
    } catch (e) {
      console.warn('Error loading quran pages for user', userId, e);
      loadedQuranPages = generateCleanQuranPages();
    }

    if (!loadedQuranPages || loadedQuranPages.length < 604) {
      loadedQuranPages = ensureComplete604Pages(loadedQuranPages || []);
    }

    // 2. Books
    let loadedBooks: Book[] = [];
    try {
      const cachedBooks = localStorage.getItem(getUserKey(userId, 'books'));
      if (cachedBooks) {
        const parsed = JSON.parse(cachedBooks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedBooks = parsed.filter(b => b && typeof b === 'object' && b.id && b.title);
        }
      }
    } catch (e) {
      console.warn('Error loading books', e);
      loadedBooks = [];
    }

    // 3. Chapters
    let loadedChapters: Chapter[] = [];
    try {
      const cachedChapters = localStorage.getItem(getUserKey(userId, 'chapters'));
      if (cachedChapters) {
        const parsed = JSON.parse(cachedChapters);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedChapters = parsed.filter(c => c && typeof c === 'object' && c.id && c.bookId);
        }
      }
    } catch (e) {
      console.warn('Error loading chapters', e);
      loadedChapters = [];
    }

    // 4. Items
    let loadedItems: BookItem[] = [];
    try {
      const cachedItems = localStorage.getItem(getUserKey(userId, 'items'));
      if (cachedItems) {
        const parsed = JSON.parse(cachedItems);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedItems = parsed.filter(item => item && typeof item === 'object' && item.id).map((item: any) => ({
            ...item,
            isActive: Boolean(item.isActive),
            status: item.status || (item.isActive ? 'active' : 'inactive'),
            fsrsData: item.fsrsData && typeof item.fsrsData === 'object'
              ? item.fsrsData
              : createInitialFSRSState(),
            reviewLogs: Array.isArray(item.reviewLogs) ? item.reviewLogs : [],
            question: item.question ? normalizeBilingualText(item.question) : item.question,
            answer: item.answer ? normalizeBilingualText(item.answer) : item.answer,
            explanation: item.explanation ? normalizeBilingualText(item.explanation) : item.explanation
          }));
        }
      }
    } catch (e) {
      console.warn('Error loading items', e);
      loadedItems = [];
    }

    // 5. My Classes: default is clean []
    let loadedMyClasses: ClassGroup[] = [];
    try {
      const cachedMyClasses = localStorage.getItem(getUserKey(userId, 'my_classes'));
      if (cachedMyClasses) {
        const parsed = JSON.parse(cachedMyClasses);
        if (Array.isArray(parsed)) {
          loadedMyClasses = parsed.filter(c => c && typeof c === 'object' && c.id);
        }
      }
    } catch (e) {
      console.warn('Error loading my_classes', e);
      loadedMyClasses = [];
    }

    // 6. Teaching Classes: default is INITIAL_CLASSES
    let loadedTeachingClasses: ClassGroup[] = [];
    try {
      const cachedTeachingClasses = localStorage.getItem(getUserKey(userId, 'teaching_classes'));
      if (cachedTeachingClasses) {
        const parsed = JSON.parse(cachedTeachingClasses);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedTeachingClasses = parsed.filter(c => c && typeof c === 'object' && c.id);
        }
      }
      if (loadedTeachingClasses.length === 0) {
        loadedTeachingClasses = INITIAL_CLASSES;
      }
    } catch (e) {
      console.warn('Error loading teaching_classes', e);
      loadedTeachingClasses = INITIAL_CLASSES;
    }

    // 7. Teacher Feedbacks: default is clean []
    let loadedTeacherFeedbacks: QuranFeedbackItem[] = [];
    try {
      const cachedFeedbacks = localStorage.getItem(getUserKey(userId, 'teacher_feedbacks'));
      if (cachedFeedbacks) {
        const parsed = JSON.parse(cachedFeedbacks);
        if (Array.isArray(parsed)) {
          loadedTeacherFeedbacks = parsed.filter(f => f && typeof f === 'object' && f.id);
        }
      }
    } catch (e) {
      console.warn('Error loading teacher feedbacks', e);
      loadedTeacherFeedbacks = [];
    }

    // 8. Attendance Exceptions: default is clean {}
    let loadedAttendanceExceptions: Record<string, 'izin' | 'sakit'> = {};
    try {
      const cachedAttendance = localStorage.getItem(getUserKey(userId, 'attendance_exceptions'));
      if (cachedAttendance) {
        const parsed = JSON.parse(cachedAttendance);
        if (parsed && typeof parsed === 'object') loadedAttendanceExceptions = parsed;
      }
    } catch (e) {
      console.warn('Error loading attendance exceptions', e);
      loadedAttendanceExceptions = {};
    }

    // 9. Pages / Material Documents: default is clean []
    let loadedPages: PageDocument[] = [];
    try {
      const cachedPages = localStorage.getItem(getUserKey(userId, 'pages'));
      if (cachedPages) {
        const parsed = JSON.parse(cachedPages);
        if (Array.isArray(parsed)) {
          loadedPages = parsed.filter(p => p && typeof p === 'object' && p.id);
        }
      }
    } catch (e) {
      console.warn('Error loading pages', e);
      loadedPages = [];
    }

    return {
      quranPages: loadedQuranPages,
      books: loadedBooks,
      chapters: loadedChapters,
      items: loadedItems,
      pages: loadedPages,
      myClasses: loadedMyClasses,
      teachingClasses: loadedTeachingClasses,
      teacherFeedbacks: loadedTeacherFeedbacks,
      attendanceExceptions: loadedAttendanceExceptions,
    };
  };

  // Use lazy initialization for state to avoid dependency loop with userProfile.id
  const [quranPages, setQuranPages] = useState<QuranPageItem[]>(() => loadUserData(userProfile.id).quranPages);
  const [books, setBooks] = useState<Book[]>(() => loadUserData(userProfile.id).books);
  const [chapters, setChapters] = useState<Chapter[]>(() => loadUserData(userProfile.id).chapters);
  const [items, setItems] = useState<BookItem[]>(() => loadUserData(userProfile.id).items);
  const [pages, setPages] = useState<PageDocument[]>(() => loadUserData(userProfile.id).pages);
  const [myClasses, setMyClasses] = useState<ClassGroup[]>(() => loadUserData(userProfile.id).myClasses);
  const [teachingClasses, setTeachingClasses] = useState<ClassGroup[]>(() => loadUserData(userProfile.id).teachingClasses);
  const [attendanceExceptions, setAttendanceExceptions] = useState<Record<string, 'izin' | 'sakit'>>(() => loadUserData(userProfile.id).attendanceExceptions);
  const [isBooksLoading, setIsBooksLoading] = useState<boolean>(false);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [reconciliationComparison, setReconciliationComparison] = useState<ReconciliationComparison | null>(null);
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState<boolean>(false);

  // Ref to track which user's data is currently loaded in memory, preventing race condition overwrites
  const loadedUserIdRef = useRef<string>(userProfile.id);
  // Ref to track remote sync updates to prevent infinite echo loops back to Firestore
  const isRemoteSyncRef = useRef<boolean>(false);

  const openLoginModal = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalMode('register');
    setIsAuthModalOpen(true);
  };

  // In-flight request deduplication and timestamp throttling to prevent request burst / rate limit
  const inFlightBooksRefreshRef = useRef<Promise<void> | null>(null);
  const lastBooksRefreshTimeRef = useRef<number>(0);
  const inFlightClassesRefreshRef = useRef<Promise<void> | null>(null);
  const lastClassesRefreshTimeRef = useRef<number>(0);
  const inFlightLibraryRefreshRef = useRef<Promise<void> | null>(null);
  const lastLibraryRefreshTimeRef = useRef<number>(0);

  const refreshBooksFromBackend = useCallback(async (force = false) => {
    const currentUid = loadedUserIdRef.current;
    if (currentUid === 'guest') return;

    if (inFlightBooksRefreshRef.current) {
      return inFlightBooksRefreshRef.current;
    }

    const now = Date.now();
    if (!force && now - lastBooksRefreshTimeRef.current < 15000) {
      return;
    }

    const runSync = async () => {
      try {
        setIsBooksLoading(true);
        const bookListRes = await bookApiService.listBooks('personal', { limit: 100 });
        if (loadedUserIdRef.current !== currentUid) return;

      const mappedBooks = (bookListRes.items || []).map(mapBackendBookToBook);
      const allChapters: Chapter[] = [];
      const allItems: BookItem[] = [];

      for (const b of mappedBooks) {
        if (loadedUserIdRef.current !== currentUid) return;
        try {
          const [chRes, itRes] = await Promise.all([
            bookApiService.listChapters(b.id),
            bookApiService.listItems(b.id, undefined, 500),
          ]);
          if (loadedUserIdRef.current !== currentUid) return;
          if (Array.isArray(chRes)) {
            allChapters.push(...chRes.map(mapBackendChapterToChapter));
          }
          if (itRes && Array.isArray(itRes.items)) {
            allItems.push(...itRes.items.map(mapBackendItemToBookItem));
          }
        } catch (err) {
          console.warn(`[Sync] Failed to load chapters/items for book ${b.id}:`, err);
        }
      }

      if (loadedUserIdRef.current === currentUid) {
        let finalSavedBooks: Book[] = mappedBooks;
        let finalSavedChapters: Chapter[] = allChapters;
        let finalSavedItems: BookItem[] = allItems;

        setBooks(prev => {
          const mappedIds = new Set(mappedBooks.map(b => b.id));
          const mappedMasterIds = new Set(mappedBooks.map(b => b.masterBookId).filter(Boolean));
          const mappedTitles = new Set(mappedBooks.map(b => (b.title || '').trim().toLowerCase()));

          // Retain valid class books from prev
          const classBooksMap = new Map<string, Book>();
          prev.filter(b => Boolean(b.classId) || b.id.startsWith('class-book-') || b.category === 'class').forEach(b => {
            classBooksMap.set(b.id, b);
          });

          // Also synthesize from myClasses so fresh browsers immediately have class books!
          myClasses.forEach(cls => {
            if (cls.type === 'non-quran' && Array.isArray(cls.assignedBooksData)) {
              cls.assignedBooksData.forEach(pkg => {
                if (pkg?.book) {
                  const cBookId = `class-book-${cls.id}-${pkg.book.id}`;
                  if (!classBooksMap.has(cBookId)) {
                    classBooksMap.set(cBookId, {
                      ...pkg.book,
                      id: cBookId,
                      classId: cls.id,
                      masterBookId: pkg.book.id,
                      userId: currentUid,
                      category: 'class',
                      isReadonly: true,
                      isPublic: false,
                      authorName: `${cls.name} • ${cls.teacherName || 'Pengajar'}`,
                      createdAt: pkg.book.createdAt || new Date().toISOString(),
                      updatedAt: pkg.book.updatedAt || new Date().toISOString(),
                    });
                  }
                }
              });
            }
          });

          // Other extra books: filter out anything already mapped by backend (by id, masterBookId, or title)
          const extraBooks = prev.filter(b => {
            if (mappedIds.has(b.id)) return false;
            if (b.masterBookId && mappedMasterIds.has(b.masterBookId)) return false;
            if (mappedMasterIds.has(b.id)) return false;
            if (b.title && mappedTitles.has(b.title.trim().toLowerCase()) && (b.isImported || b.category === 'imported')) return false;
            if (classBooksMap.has(b.id)) return false;
            return b.isImported || library.some(l => l.book.id === b.id || l.id === b.libraryEntryId);
          });

          finalSavedBooks = [...mappedBooks, ...Array.from(classBooksMap.values()), ...extraBooks];
          return finalSavedBooks;
        });

        setChapters(prev => {
          const mappedChapIds = new Set(allChapters.map(c => c.id));
          const extraChapters = prev.filter(c => 
            !mappedChapIds.has(c.id) && (
              c.id.startsWith('class-chap-') || 
              library.some(l => l.chapters.some(lc => lc.id === c.id))
            )
          );
          finalSavedChapters = [...allChapters, ...extraChapters];
          return finalSavedChapters;
        });

        setItems(prev => {
          const mappedItemIds = new Set(allItems.map(i => i.id));
          const extraItems = prev.filter(i => 
            !mappedItemIds.has(i.id) && (
              i.id.startsWith('class-item-') || 
              library.some(l => l.items.some(li => li.id === i.id))
            )
          );
          finalSavedItems = [...allItems, ...extraItems];
          return finalSavedItems;
        });

        setBooksError(null);
        try {
          localStorage.setItem(getUserKey(currentUid, 'books'), JSON.stringify(finalSavedBooks));
          localStorage.setItem(getUserKey(currentUid, 'chapters'), JSON.stringify(finalSavedChapters));
          localStorage.setItem(getUserKey(currentUid, 'items'), JSON.stringify(finalSavedItems));
        } catch (e) {}
      }
    } catch (err: any) {
      if (loadedUserIdRef.current === currentUid) {
        console.warn('[Sync] Failed to refresh books from backend:', err);
        setBooksError(err?.message || 'Gagal menyinkronkan buku dari backend');
      }
    } finally {
      lastBooksRefreshTimeRef.current = Date.now();
      inFlightBooksRefreshRef.current = null;
      if (loadedUserIdRef.current === currentUid) {
        setIsBooksLoading(false);
      }
    }
  };

    inFlightBooksRefreshRef.current = runSync();
    return inFlightBooksRefreshRef.current;
  }, []);

  const refreshClassesFromBackend = useCallback(async (force = false) => {
    const currentUid = loadedUserIdRef.current;
    if (currentUid === 'guest') return;

    if (inFlightClassesRefreshRef.current) {
      return inFlightClassesRefreshRef.current;
    }

    const now = Date.now();
    if (!force && now - lastClassesRefreshTimeRef.current < 15000) {
      return;
    }

    const runSync = async () => {
      try {
        const [backendTeaching, backendJoined] = await Promise.all([
          classApiService.getTeachingClasses(),
          classApiService.getJoinedClasses(),
        ]);
        if (loadedUserIdRef.current === currentUid) {
          if (Array.isArray(backendTeaching)) {
            setTeachingClasses(backendTeaching);
          }
          if (Array.isArray(backendJoined)) {
            setMyClasses(backendJoined);
          }
        }
      } catch (err) {
        console.warn('[Sync] Failed to refresh classes from backend:', err);
      } finally {
        lastClassesRefreshTimeRef.current = Date.now();
        inFlightClassesRefreshRef.current = null;
      }
    };

    inFlightClassesRefreshRef.current = runSync();
    return inFlightClassesRefreshRef.current;
  }, []);

  const openReconciliationModal = useCallback(async () => {
    const currentUid = loadedUserIdRef.current;
    if (currentUid === 'guest') return;
    try {
      const localSnap = readLocalStorageSnapshot(currentUid);
      const remoteSnap = await readFirestoreSnapshot(currentUid);
      if (loadedUserIdRef.current !== currentUid) return;
      const comparison = compareSnapshots(localSnap, remoteSnap);
      setReconciliationComparison(comparison);
      setIsReconciliationModalOpen(true);
    } catch (err) {
      console.warn('[Reconciliation] Failed to open modal:', err);
    }
  }, []);

  const logout = async () => {
    try {
      if (activeMeAbortControllerRef.current) {
        activeMeAbortControllerRef.current.abort();
        activeMeAbortControllerRef.current = null;
      }
      setBackendAuthStatus('unauthenticated');
      setBackendAuthError(null);
      setIsBooksLoading(false);
      setBooksError(null);
      setReconciliationComparison(null);
      setIsReconciliationModalOpen(false);

      await api.logout();
      clearAuthToken();
      wsService.disconnect();
      setCurrentUser(null);
      const guestId = 'guest';
      const guestProfile: UserProfile = {
        id: guestId,
        backendId: undefined,
        quranSpaceCode: 'UNL-QRN-GUEST',
        fullName: 'Tamu / Murid',
        email: '',
        avatarUrl: DEFAULT_ISLAMIC_AVATAR,
        plan: 'free',
        onboardingPreferences: userProfile.onboardingPreferences || defaultOnboardingPreferences,
      };
      loadedUserIdRef.current = guestId;
      setUserProfile(guestProfile);
      
      // Load clean guest state FIRST before switching identity
      const guestData = loadUserData(guestId);
      setQuranPages(guestData.quranPages);
      setBooks(guestData.books);
      setChapters(guestData.chapters);
      setItems(guestData.items);
      setPages(guestData.pages);
      setMyClasses(guestData.myClasses);
      setTeachingClasses(guestData.teachingClasses);
      setTeacherFeedbacks(guestData.teacherFeedbacks);
      setAttendanceExceptions(guestData.attendanceExceptions);

      loadedUserIdRef.current = guestId;
      setUserProfile(guestProfile);

      if ((window as any).__unsubFirestoreListeners) {
        (window as any).__unsubFirestoreListeners();
        (window as any).__unsubFirestoreListeners = null;
      }

      // Return to landing page after logout and clear in-app session
      try {
        sessionStorage.removeItem('unlupa_in_app');
        if (window.location.hash === '#app') {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } catch (e) {}
      setIsLandingPageOpen(true);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const initiateUserSession = async (backendUser: BackendUserResponse, options?: { isNewRegistration?: boolean }) => {
    if (activeMeAbortControllerRef.current) {
      activeMeAbortControllerRef.current.abort();
      activeMeAbortControllerRef.current = null;
    }

    const targetId = backendUser.id;
    const isNewRegistration = Boolean(options?.isNewRegistration);

    // If this is a new registration, guarantee reconciliation modal is closed and clean local state
    if (isNewRegistration) {
      setIsReconciliationModalOpen(false);
      setReconciliationComparison(null);
      try {
        localStorage.removeItem(getUserKey(targetId, 'books'));
        localStorage.removeItem(getUserKey(targetId, 'chapters'));
        localStorage.removeItem(getUserKey(targetId, 'items'));
        localStorage.setItem(getUserKey(targetId, 'reconciliation_dismissed'), 'true');
      } catch (e) {}
    }

    // 1. Switch to this account's isolated data FIRST before async operations or identity updates
    const accountData = loadUserData(targetId);
    setQuranPages(accountData.quranPages);
    setBooks(accountData.books);
    setChapters(accountData.chapters);
    setItems(accountData.items);
    setPages(accountData.pages);
    setMyClasses(accountData.myClasses);
    setTeachingClasses(accountData.teachingClasses);
    setTeacherFeedbacks(accountData.teacherFeedbacks);
    setAttendanceExceptions(accountData.attendanceExceptions);

    // 2. Set active user identity
    loadedUserIdRef.current = targetId;

    const authUser: AuthUser = {
      id: targetId,
      uid: targetId,
      email: backendUser.email,
      displayName: backendUser.fullName,
      role: backendUser.role.toLowerCase(),
      avatarUrl: backendUser.avatarUrl,
    };
    setCurrentUser(authUser);

    const roleLower = backendUser.role.toLowerCase() as 'user' | 'admin' | 'superadmin';
    const planLower = backendUser.plan.toLowerCase() as 'free' | 'premium' | 'institutional';

    const updatedProfileCandidate: UserProfile = {
      id: targetId,
      backendId: backendUser.id,
      email: backendUser.email || '',
      fullName: backendUser.fullName || 'User',
      avatarUrl: backendUser.avatarUrl || '',
      quranSpaceCode: backendUser.quranSpaceCode || 'UNL-QRN',
      role: roleLower,
      plan: planLower,
      onboardingPreferences: (backendUser.onboardingPreferences as UserOnboardingPreferences) || undefined,
    };

    setUserProfile(prev => ({
      ...prev,
      ...updatedProfileCandidate,
      email: backendUser.email || prev.email,
      fullName: backendUser.fullName || prev.fullName,
      avatarUrl: backendUser.avatarUrl || prev.avatarUrl,
      quranSpaceCode: backendUser.quranSpaceCode || prev.quranSpaceCode,
      onboardingPreferences: (backendUser.onboardingPreferences as UserOnboardingPreferences) || prev.onboardingPreferences,
    }));

    if (isUserAdmin(updatedProfileCandidate)) {
      setActiveSpace('admin');
    }

    setBackendAuthStatus('authenticated');
    setBackendAuthError(null);

    // 3. Fetch authoritative Quran pages from PostgreSQL backend
    try {
      const backendPages = await api.getQuranPages();
      if (Array.isArray(backendPages) && backendPages.length > 0 && loadedUserIdRef.current === targetId) {
        setQuranPages(prev => {
          const backendMap = new Map(backendPages.map(bp => [Number(bp.pageNumber), bp]));
          const merged = prev.map(p => {
            const bp = backendMap.get(Number(p.pageNumber));
            if (!bp) return p;
            return {
              ...p,
              pageNumber: Number(p.pageNumber),
              isActive: Boolean(bp.isActive),
              status: (bp.status === 'MASTERED_FOR_NOW' ? 'mastered_for_now' : (bp.isActive ? 'active' : 'inactive')) as ('active' | 'inactive' | 'mastered_for_now'),
              activatedAt: bp.activatedAt ? new Date(bp.activatedAt).toISOString() : p.activatedAt,
              mapanCelebrated: Boolean(bp.mapanCelebrated),
              fsrsData: {
                stability: Number(bp.stability) || 0,
                difficulty: Number(bp.difficulty) || 10.0,
                reps: Number(bp.reps) || 0,
                lapses: Number(bp.lapses) || 0,
                lastReview: bp.lastReview ? new Date(bp.lastReview).toISOString() : null,
                nextReview: bp.nextReview ? new Date(bp.nextReview).toISOString() : null,
                state: (bp.state ? bp.state.toLowerCase() : 'new') as FSRSState['state'],
              },
              reviewLogs: Array.isArray(bp.reviewLogs) ? bp.reviewLogs.map((rl: any) => ({
                id: rl.id,
                date: rl.date ? new Date(rl.date).toISOString() : new Date().toISOString(),
                rating: rl.rating as 1 | 2 | 3,
                previousInterval: rl.previousInterval,
                newInterval: rl.newInterval,
                wasDue: Boolean(rl.wasDue),
                notes: rl.notes,
                issueTypes: rl.issueTypes,
                problemAyahs: rl.problemAyahs,
              })) : (p.reviewLogs || []),
            };
          });
          try {
            localStorage.setItem(getUserKey(targetId, 'quran_pages'), JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
    } catch (quranErr) {
      console.warn('[Auth] Failed to load backend Quran pages:', quranErr);
    }

    // Check backend books and trigger reconciliation if legacy books exist
    try {
      const bookListRes = await bookApiService.listBooks('personal', { limit: 1 });
      if (loadedUserIdRef.current === targetId) {
        if (bookListRes.total > 0) {
          await refreshBooksFromBackend();
        } else {
          // Never trigger reconciliation for newly registered users, recently created users, or if dismissed
          const isDismissed = localStorage.getItem(getUserKey(targetId, 'reconciliation_dismissed')) === 'true';
          const isRecentlyCreated = Boolean(backendUser.createdAt && (Date.now() - new Date(backendUser.createdAt).getTime() < 24 * 60 * 60 * 1000));

          if (!isNewRegistration && !isDismissed && !isRecentlyCreated) {
            const localSnap = readLocalStorageSnapshot(targetId);
            const remoteSnap = await readFirestoreSnapshot(targetId);
            if (loadedUserIdRef.current === targetId) {
              const comparison = compareSnapshots(localSnap, remoteSnap);
              const hasRealBooks = comparison.differences.some(d => {
                const b = d.localBook || d.firestoreBook;
                return b && !b.isSample;
              });
              if (comparison.hasData && hasRealBooks) {
                setReconciliationComparison(comparison);
                setIsReconciliationModalOpen(true);
              }
            }
          } else {
            // Guarantee overlay is closed and clean state for new user
            setIsReconciliationModalOpen(false);
            setReconciliationComparison(null);
            if (isNewRegistration || (isRecentlyCreated && bookListRes.total === 0)) {
              setBooks([]);
              setChapters([]);
              setItems([]);
              try {
                localStorage.removeItem(getUserKey(targetId, 'books'));
                localStorage.removeItem(getUserKey(targetId, 'chapters'));
                localStorage.removeItem(getUserKey(targetId, 'items'));
              } catch (e) {}
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Auth] Book backend check notice:', err);
    }

    // Fetch authoritative classes from PostgreSQL backend
    try {
      const [backendTeaching, backendJoined] = await Promise.all([
        classApiService.getTeachingClasses(),
        classApiService.getJoinedClasses(),
      ]);
      if (loadedUserIdRef.current === targetId) {
        if (Array.isArray(backendTeaching)) {
          if (backendTeaching.length > 0) {
            setTeachingClasses(backendTeaching);
          } else {
            // If backend has 0 classes, auto-migrate any local class created before login
            const localToMigrate = (accountData.teachingClasses || []).filter(c => c && c.id && c.id.startsWith('cls-'));
            if (localToMigrate.length > 0) {
              for (const locCls of localToMigrate) {
                try {
                  const synced = await classApiService.createClass({
                    name: locCls.name,
                    type: locCls.type,
                    code: locCls.code,
                    description: locCls.description,
                    coverUrl: locCls.coverUrl,
                    requiredJuzList: locCls.requiredJuzList,
                    assignedBookIds: locCls.assignedBookIds,
                  });
                  backendTeaching.push(synced);
                } catch (e) {
                  console.warn('[Sync] Auto-migrate local class notice:', e);
                }
              }
            }
            setTeachingClasses(backendTeaching);
          }
        }
        if (Array.isArray(backendJoined)) {
          setMyClasses(backendJoined);
        }
      }
    } catch (classErr) {
      console.warn('[Auth] Failed to load backend classes:', classErr);
    }

  };

  // Restore authenticated JWT session on mount
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setBackendAuthStatus('unauthenticated');
      setUserProfile(prev => {
        if (prev.backendId || prev.id !== 'guest') {
          return {
            ...prev,
            id: 'guest',
            backendId: undefined,
            fullName: 'Tamu / Murid',
          };
        }
        return prev;
      });
      return;
    }

    const controller = new AbortController();
    activeMeAbortControllerRef.current = controller;
    setBackendAuthStatus('loading');
    setBackendAuthError(null);

    api.getMe(controller.signal)
      .then(async (backendUser) => {
        if (controller.signal.aborted) return;
        await initiateUserSession(backendUser);
      })
      .catch((err: any) => {
        if (controller.signal.aborted || err?.isAborted) return;
        console.warn('[Auth] Stored JWT session invalid or expired:', err?.message || err);
        clearAuthToken();
        setBackendAuthStatus('unauthenticated');
        setCurrentUser(null);
        const guestId = 'guest';
        loadedUserIdRef.current = guestId;
        setUserProfile({
          id: guestId,
          backendId: undefined,
          quranSpaceCode: 'UNL-QRN-GUEST',
          fullName: 'Tamu / Murid',
          email: '',
          avatarUrl: DEFAULT_ISLAMIC_AVATAR,
          role: 'user',
          plan: 'free',
          onboardingPreferences: defaultOnboardingPreferences,
        });
      })
      .finally(() => {
        if (activeMeAbortControllerRef.current === controller) {
          activeMeAbortControllerRef.current = null;
        }
      });

    return () => {
      if (activeMeAbortControllerRef.current) {
        activeMeAbortControllerRef.current.abort();
        activeMeAbortControllerRef.current = null;
      }
    };
  }, []);

  const [library, setLibrary] = useState<LibraryEntry[]>(() => {
    return CURATED_LIBRARY;
  });
  
  // Auto-purge legacy massive library cache from localStorage to prevent QuotaExceededError
  useEffect(() => {
    try {
      localStorage.removeItem('ai_quran_library');
    } catch (e) { /* ignore */ }
  }, []);

  // Authoritative Public Library Sync from PostgreSQL backend
  const refreshLibraryFromBackend = useCallback(async (force = false) => {
    if (inFlightLibraryRefreshRef.current) {
      return inFlightLibraryRefreshRef.current;
    }

    const now = Date.now();
    if (!force && now - lastLibraryRefreshTimeRef.current < 15000) {
      return;
    }

    const runSync = async () => {
      try {
        // 1. Fetch authoritative public library entries from PostgreSQL backend
        const backendEntries = await bookApiService.getPublicLibrary();

        setLibrary(_prev => {
          const merged: LibraryEntry[] = [];
          const seenIds = new Set<string>();
          const seenTitles = new Set<string>();

          // Priority 1: PostgreSQL backend public books
          if (Array.isArray(backendEntries)) {
            backendEntries.forEach(entry => {
              if (entry && entry.id && !seenIds.has(entry.id)) {
                seenIds.add(entry.id);
                if (entry.book?.id) seenIds.add(entry.book.id);
                if (entry.title) seenTitles.add(entry.title.trim().toLowerCase());
                merged.push(entry);
              }
            });
          }

          // Priority 2: Official Curated foundation books (strict from CURATED_LIBRARY)
          CURATED_LIBRARY.forEach(entry => {
            const entryBookId = entry.book?.id || entry.id;
            const entryTitle = (entry.title || entry.book?.title || '').trim().toLowerCase();
            if (!seenIds.has(entry.id) && !seenIds.has(entryBookId) && !seenTitles.has(entryTitle)) {
              seenIds.add(entry.id);
              seenIds.add(entryBookId);
              seenTitles.add(entryTitle);
              merged.push(entry);
            }
          });

          return merged;
        });
      } catch (err) {
        console.warn('[Library] Failed to refresh library from backend:', err);
      } finally {
        lastLibraryRefreshTimeRef.current = Date.now();
        inFlightLibraryRefreshRef.current = null;
      }
    };

    inFlightLibraryRefreshRef.current = runSync();
    return inFlightLibraryRefreshRef.current;
  }, []);

  // Initial load of public library on mount
  useEffect(() => {
    refreshLibraryFromBackend();
  }, [refreshLibraryFromBackend]);

  // Sync to localStorage scoped by user
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SPACE, activeSpace);
    } catch (e) { /* ignore */ }
  }, [activeSpace]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    } catch (e) { /* ignore */ }
  }, [language]);

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(getUserKey(userProfile.id, 'quran_pages'), JSON.stringify(quranPages));
    } catch (e) { /* ignore */ }
  }, [quranPages, userProfile.id]);

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(getUserKey(userProfile.id, 'books'), JSON.stringify(books));
    } catch (e) { /* ignore */ }
  }, [books, userProfile.id]);

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(getUserKey(userProfile.id, 'chapters'), JSON.stringify(chapters));
    } catch (e) { /* ignore */ }
  }, [chapters, userProfile.id]);

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(getUserKey(userProfile.id, 'items'), JSON.stringify(items));
    } catch (e) { /* ignore */ }
  }, [items, userProfile.id]);

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(getUserKey(userProfile.id, 'pages'), JSON.stringify(pages));
    } catch (e) { /* ignore */ }
  }, [pages, userProfile.id]);

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(getUserKey(userProfile.id, 'my_classes'), JSON.stringify(myClasses));
    } catch (e) { /* ignore */ }
  }, [myClasses, userProfile.id]);

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(getUserKey(userProfile.id, 'teaching_classes'), JSON.stringify(teachingClasses));
    } catch (e) { /* ignore */ }
  }, [teachingClasses, userProfile.id]);

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(getUserKey(userProfile.id, 'teacher_feedbacks'), JSON.stringify(teacherFeedbacks));
    } catch (e) { /* ignore */ }
  }, [teacherFeedbacks, userProfile.id]);

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(getUserKey(userProfile.id, 'attendance_exceptions'), JSON.stringify(attendanceExceptions));
    } catch (e) { /* ignore */ }
  }, [attendanceExceptions, userProfile.id]);

  // Manual sync of book changes to teaching classes (only executed when class owner chooses "Ya")
  const syncBookToClasses = useCallback(async (bookId: string, targetClassIds?: string[]) => {
    const latestBook = books.find(b => b.id === bookId || b.masterBookId === bookId);
    if (!latestBook) return;
    const actualBookId = latestBook.id;
    const latestChapters = chapters.filter(c => c.bookId === actualBookId || (latestBook.masterBookId && c.bookId === latestBook.masterBookId));
    const latestItems = items.filter(i => i.bookId === actualBookId || (latestBook.masterBookId && i.bookId === latestBook.masterBookId));

    const relevantClasses = teachingClasses.filter(cls => {
      if (cls.status === 'closed') return false;
      if (targetClassIds && targetClassIds.length > 0 && !targetClassIds.includes(cls.id)) return false;
      
      const isAssigned = cls.assignedBookIds?.includes(bookId) || 
                         cls.assignedBookIds?.includes(actualBookId) ||
                         Boolean(latestBook.masterBookId && cls.assignedBookIds?.includes(latestBook.masterBookId));
      const isInData = cls.assignedBooksData?.some((p: any) => 
        p?.book?.id === bookId || 
        p?.book?.id === actualBookId ||
        p?.book?.masterBookId === bookId ||
        p?.book?.masterBookId === actualBookId ||
        (latestBook.title && p?.book?.title?.trim().toLowerCase() === latestBook.title.trim().toLowerCase())
      );
      const isDirectClassId = latestBook.classId === cls.id;
      const isPrefixMatch = latestBook.id.startsWith(`class-book-${cls.id}-`);
      const isTitleMatch = cls.type === 'non-quran' && cls.name.trim().toLowerCase() === latestBook.title.trim().toLowerCase();

      return isAssigned || isInData || isDirectClassId || isPrefixMatch || isTitleMatch;
    });

    for (const cls of relevantClasses) {
      const existingPackages = Array.isArray(cls.assignedBooksData) ? cls.assignedBooksData : [];
      let replaced = false;

      const updatedPackages: AssignedBookData[] = existingPackages.map((pkg: any) => {
        const isMatch = pkg?.book?.id === bookId || 
                        pkg?.book?.id === actualBookId || 
                        pkg?.book?.masterBookId === bookId || 
                        pkg?.book?.masterBookId === actualBookId ||
                        (latestBook.masterBookId && (pkg?.book?.id === latestBook.masterBookId || pkg?.book?.masterBookId === latestBook.masterBookId)) ||
                        (latestBook.title && pkg?.book?.title?.trim().toLowerCase() === latestBook.title.trim().toLowerCase());
        if (isMatch) {
          replaced = true;
          return {
            book: latestBook,
            chapters: latestChapters,
            items: latestItems,
          };
        }
        return pkg;
      });

      if (!replaced) {
        updatedPackages.push({
          book: latestBook,
          chapters: latestChapters,
          items: latestItems,
        });
      }

      const updatedBookIds = Array.from(new Set([...(cls.assignedBookIds || []), actualBookId, bookId].filter(Boolean)));

      const updatedCls: ClassGroup = {
        ...cls,
        assignedBookIds: updatedBookIds,
        assignedBooksData: updatedPackages,
      };

      if (userProfile.id !== 'guest' && (userProfile.backendId || getAuthToken())) {
        try {
          await classApiService.updateClass(cls.id, { 
            assignedBookIds: updatedBookIds,
            assignedBooksData: updatedPackages 
          });
        } catch (err) {
          console.warn('[Classes] Failed to update backend assignedBooksData:', err);
        }
      }

      setTeachingClasses(prev => prev.map(c => c.id === cls.id ? updatedCls : c));
      // Also update myClasses if enrolled on the same device/session!
      setMyClasses(prev => prev.map(c => c.id === cls.id ? updatedCls : c));

      // Broadcast to all other open tabs immediately via BroadcastChannel
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const ch = new BroadcastChannel('unlupa_class_sync');
          ch.postMessage({
            type: 'CLASS_BOOK_UPDATED',
            classId: cls.id,
            assignedBooksData: updatedPackages,
            assignedBookIds: updatedBookIds,
          });
          ch.close();
        }
      } catch (bcErr) {
        console.warn('[Sync] BroadcastChannel notice:', bcErr);
      }

      // Also update all local student copies for this class on this device if any exist
      const matchingClassBooks = books.filter(b => 
        b.category === 'class' && (
          b.classId === cls.id || 
          b.id.startsWith(`class-book-${cls.id}-`)
        )
      );

      const targetClassBookIds = new Set<string>(matchingClassBooks.map(b => b.id));
      targetClassBookIds.add(`class-book-${cls.id}-${bookId}`);
      if (latestBook.id) targetClassBookIds.add(`class-book-${cls.id}-${latestBook.id}`);
      if (latestBook.masterBookId) targetClassBookIds.add(`class-book-${cls.id}-${latestBook.masterBookId}`);

      setBooks(prev => prev.map(b => {
        if (targetClassBookIds.has(b.id)) {
          return {
            ...b,
            title: latestBook.title,
            description: latestBook.description,
            coverUrl: latestBook.coverUrl,
            category: 'class',
            updatedAt: new Date().toISOString(),
          };
        }
        return b;
      }));

      setChapters(prev => {
        let updated = [...prev];
        targetClassBookIds.forEach(cBookId => {
          const otherChapters = updated.filter(c => c.bookId !== cBookId);
          const existingClassChapters = updated.filter(c => c.bookId === cBookId);
          const existingChapterMap = new Map(existingClassChapters.map(c => [c.masterChapterId || c.id, c]));

          const mappedChapters: Chapter[] = latestChapters.map(mc => {
            const existing = existingChapterMap.get(mc.id);
            return {
              id: existing ? existing.id : `class-chap-${cls.id}-${mc.id}`,
              masterChapterId: mc.id,
              bookId: cBookId,
              title: mc.title,
              description: mc.description,
              material: mc.material,
              order: mc.order,
              parentId: mc.parentId ? `class-chap-${cls.id}-${mc.parentId}` : null,
            };
          });

          updated = [...otherChapters, ...mappedChapters];
        });
        return updated;
      });

      setItems(prev => {
        let updated = [...prev];
        targetClassBookIds.forEach(cBookId => {
          const otherItems = updated.filter(i => i.bookId !== cBookId);
          const existingClassItems = updated.filter(i => i.bookId === cBookId);
          const existingItemMap = new Map(existingClassItems.map(i => [i.masterItemId || i.id, i]));

          const mappedItems: BookItem[] = latestItems.map(mi => {
            const existing = existingItemMap.get(mi.id);
            if (existing) {
              return {
                ...existing,
                chapterId: mi.chapterId ? `class-chap-${cls.id}-${mi.chapterId}` : null,
                question: mi.question,
                answer: mi.answer,
                explanation: mi.explanation,
                imageQ: mi.imageQ,
                imageA: mi.imageA,
                tags: mi.tags || existing.tags,
              };
            }
            return {
              id: `class-item-${cls.id}-${mi.id}`,
              masterItemId: mi.id,
              bookId: cBookId,
              chapterId: mi.chapterId ? `class-chap-${cls.id}-${mi.chapterId}` : null,
              question: mi.question,
              answer: mi.answer,
              explanation: mi.explanation,
              imageQ: mi.imageQ,
              imageA: mi.imageA,
              tags: mi.tags || [],
              isActive: false,
              status: 'inactive' as const,
              fsrsData: createInitialFSRSState(),
              reviewLogs: [],
              createdAt: new Date().toISOString(),
            };
          });

          updated = [...otherItems, ...mappedItems];
        });
        return updated;
      });
    }
  }, [books, chapters, items, teachingClasses, userProfile.id]);

  // When a student receives updated assignedBooksData from their joined classes, reconcile student's class books
  useEffect(() => {
    if (myClasses.length === 0) return;
    myClasses.forEach(cls => {
      if (cls.type !== 'non-quran' || !cls.assignedBooksData || cls.assignedBooksData.length === 0) return;
      cls.assignedBooksData.forEach(pkg => {
        if (!pkg?.book) return;
        const masterBookId = pkg.book.id;
        const classBookId = `class-book-${cls.id}-${masterBookId}`;

        const targetBookIds = new Set<string>();
        targetBookIds.add(classBookId);
        if (pkg.book.masterBookId) targetBookIds.add(`class-book-${cls.id}-${pkg.book.masterBookId}`);

        // Update or Insert class book
        setBooks(prev => {
          const matchingIndex = prev.findIndex(b => 
            targetBookIds.has(b.id) || 
            (b.category === 'class' && (
              b.id === classBookId ||
              (b.classId === cls.id && (b.masterBookId === masterBookId || b.title === pkg.book.title)) ||
              (b.masterBookId === masterBookId && b.title === pkg.book.title)
            ))
          );

          if (matchingIndex === -1) {
            // Book does not exist in student's state yet! ADD IT!
            const newClassBook: Book = {
              ...pkg.book,
              id: classBookId,
              classId: cls.id,
              masterBookId: masterBookId,
              userId: userProfile.id,
              category: 'class',
              isReadonly: true,
              isPublic: false,
              authorName: `${cls.name} • ${cls.teacherName || 'Pengajar'}`,
              createdAt: pkg.book.createdAt || new Date().toISOString(),
              updatedAt: pkg.book.updatedAt || new Date().toISOString(),
            };
            return [newClassBook, ...prev];
          }

          const existing = prev[matchingIndex];
          targetBookIds.add(existing.id);

          if (
            existing.title !== pkg.book.title ||
            existing.description !== pkg.book.description ||
            existing.coverUrl !== pkg.book.coverUrl
          ) {
            const updated = [...prev];
            updated[matchingIndex] = {
              ...existing,
              title: pkg.book.title,
              description: pkg.book.description,
              coverUrl: pkg.book.coverUrl,
              updatedAt: new Date().toISOString(),
            };
            return updated;
          }
          return prev;
        });

        // Reconcile chapters (adding new chapters like "BAB 2", "BAB 3", "BAB 4"!)
        if (Array.isArray(pkg.chapters) && pkg.chapters.length > 0) {
          setChapters(prev => {
            let updated = [...prev];
            targetBookIds.forEach(cBookId => {
              const otherChapters = updated.filter(ch => ch.bookId !== cBookId);
              const existingClassChapters = updated.filter(ch => ch.bookId === cBookId);
              const existingMap = new Map(existingClassChapters.map(ch => [ch.masterChapterId || ch.id, ch]));

              const reconciledChapters: Chapter[] = pkg.chapters.map((mc: any) => {
                const existing = existingMap.get(mc.id);
                return {
                  id: existing ? existing.id : `class-chap-${cls.id}-${mc.id}`,
                  masterChapterId: mc.id,
                  bookId: cBookId,
                  title: mc.title,
                  description: mc.description,
                  material: mc.material,
                  order: mc.order,
                  parentId: mc.parentId ? `class-chap-${cls.id}-${mc.parentId}` : null,
                };
              });

              updated = [...otherChapters, ...reconciledChapters];
            });
            return updated;
          });
        }

        // Reconcile items (adding new items while preserving student progress!)
        if (Array.isArray(pkg.items) && pkg.items.length > 0) {
          setItems(prev => {
            let updated = [...prev];
            targetBookIds.forEach(cBookId => {
              const otherItems = updated.filter(i => i.bookId !== cBookId);
              const existingClassItems = updated.filter(i => i.bookId === cBookId);
              const existingMap = new Map(existingClassItems.map(i => [i.masterItemId || i.id, i]));

              const reconciledItems: BookItem[] = pkg.items.map((mi: any) => {
                const existing = existingMap.get(mi.id);
                if (existing) {
                  return {
                    ...existing,
                    chapterId: mi.chapterId ? `class-chap-${cls.id}-${mi.chapterId}` : null,
                    question: mi.question,
                    answer: mi.answer,
                    explanation: mi.explanation,
                    imageQ: mi.imageQ,
                    imageA: mi.imageA,
                    tags: mi.tags || existing.tags,
                  };
                }
                return {
                  id: `class-item-${cls.id}-${mi.id}`,
                  masterItemId: mi.id,
                  bookId: cBookId,
                  chapterId: mi.chapterId ? `class-chap-${cls.id}-${mi.chapterId}` : null,
                  question: mi.question,
                  answer: mi.answer,
                  explanation: mi.explanation,
                  imageQ: mi.imageQ,
                  imageA: mi.imageA,
                  tags: mi.tags || [],
                  isActive: false,
                  status: 'inactive' as const,
                  fsrsData: createInitialFSRSState(),
                  reviewLogs: [],
                  createdAt: new Date().toISOString(),
                };
              });

              updated = [...otherItems, ...reconciledItems];
            });
            return updated;
          });
        }
      });
    });
  }, [myClasses, userProfile.id]);

  // Real-time: Multi-tab cross-sync via BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel('unlupa_class_sync');
    ch.onmessage = (event) => {
      if (event?.data?.type === 'CLASS_BOOK_UPDATED' && event?.data?.classId) {
        const { classId, assignedBooksData, assignedBookIds } = event.data;
        setMyClasses(prev => prev.map(c => {
          if (c.id === classId) {
            return {
              ...c,
              assignedBookIds: assignedBookIds || c.assignedBookIds,
              assignedBooksData: assignedBooksData || c.assignedBooksData,
            };
          }
          return c;
        }));
        setTeachingClasses(prev => prev.map(c => {
          if (c.id === classId) {
            return {
              ...c,
              assignedBookIds: assignedBookIds || c.assignedBookIds,
              assignedBooksData: assignedBooksData || c.assignedBooksData,
            };
          }
          return c;
        }));
      } else if (event?.data?.type === 'STUDENT_BOOK_REVIEWED') {
        const { studentId, itemId, fsrsData, newLog } = event.data;
        const cleanCurrentId = userProfile.id.replace(/^std-user-/, '').replace(/^user-/, '');
        const cleanTargetId = (studentId || '').replace(/^std-user-/, '').replace(/^user-/, '');
        if (cleanCurrentId === cleanTargetId) {
          const backendTargetId = resolveBackendItemId(itemId);
          setItems(prev => prev.map(item => {
            const itemBackend = resolveBackendItemId(item.id);
            const match = item.id === itemId || 
              (item.masterItemId && item.masterItemId === itemId) || 
              (backendTargetId && (item.id === backendTargetId || item.masterItemId === backendTargetId || itemBackend === backendTargetId));
            if (match) {
              return {
                ...item,
                isActive: true,
                fsrsData: fsrsData || item.fsrsData,
                status: (fsrsData?.stability || 0) >= 300 ? 'mastered' : 'active',
                reviewLogs: newLog ? [...(item.reviewLogs || []), newLog].slice(-100) : item.reviewLogs,
              };
            }
            return item;
          }));
        }
      } else if (event?.data?.type === 'LIBRARY_BOOK_UPDATED' || event?.data?.type === 'LIBRARY_UPDATED') {
        refreshLibraryFromBackend();
      }
    };
    return () => {
      ch.close();
    };
  }, [refreshLibraryFromBackend]);

  // Real-time: Full-duplex WebSocket synchronization across all devices and browsers
  useEffect(() => {
    if (userProfile.id === 'guest') return;
    const token = getAuthToken();
    wsService.connect(token || undefined);

    // Join all relevant class rooms for this user
    myClasses.forEach(c => wsService.joinRoom(`class:${c.id}`));
    teachingClasses.forEach(c => wsService.joinRoom(`class:${c.id}`));

    const unsubReview = wsService.on('STUDENT_BOOK_REVIEWED', (payload: any) => {
      const { studentId, itemId, classId, progress, reviewLog } = payload;
      const cleanCurrentId = userProfile.id.replace(/^std-user-/, '').replace(/^user-/, '');
      const cleanTargetId = (studentId || '').replace(/^std-user-/, '').replace(/^user-/, '');

      // 1. If current user is the student whose card was reviewed
      if (cleanCurrentId === cleanTargetId) {
        const backendTargetId = resolveBackendItemId(itemId);
        let updatedFSRS: FSRSState | null = null;
        let updatedStatus: any = 'active';

        if (progress) {
          updatedFSRS = {
            stability: Number(progress.stability),
            difficulty: Number(progress.difficulty),
            reps: Number(progress.reps),
            lapses: Number(progress.lapses),
            lastReview: progress.lastReview ? new Date(progress.lastReview).toISOString() : new Date().toISOString(),
            nextReview: progress.nextReview ? new Date(progress.nextReview).toISOString() : null,
            state: (progress.state ? String(progress.state).toLowerCase() : 'review') as any,
          };
          updatedStatus = progress.status || 'active';
        }

        setItems(prev => {
          let matched = false;
          const updated = prev.map(item => {
            const itemBackend = resolveBackendItemId(item.id);
            const match = item.id === itemId || 
              (item.masterItemId && item.masterItemId === itemId) || 
              (backendTargetId && (item.id === backendTargetId || item.masterItemId === backendTargetId || itemBackend === backendTargetId));

            if (match) {
              matched = true;
              return {
                ...item,
                isActive: true,
                status: updatedStatus,
                fsrsData: updatedFSRS || item.fsrsData,
                reviewLogs: reviewLog ? [...(item.reviewLogs || []), reviewLog].slice(-100) : item.reviewLogs,
              };
            }
            return item;
          });
          if (matched) {
            try {
              localStorage.setItem(getUserKey(userProfile.id, 'items'), JSON.stringify(updated));
            } catch (e) {}
          }
          return matched ? updated : prev;
        });

        // Background refresh to guarantee full data consistency
        refreshBooksFromBackend();
      }

      // 2. If current user is teacher observing class
      setTeachingClasses(prev => prev.map(cls => {
        if (classId && cls.id !== classId) return cls;
        return {
          ...cls,
          students: cls.students.map(std => {
            const stdCleanId = std.id.replace(/^std-user-/, '').replace(/^user-/, '');
            if (stdCleanId !== cleanTargetId) return std;

            const backendTargetId = resolveBackendItemId(itemId);
            const updatedItems = (std.bookItemsData || []).map(it => {
              const itBackend = resolveBackendItemId(it.id);
              const match = it.id === itemId || 
                (it.masterItemId && it.masterItemId === itemId) || 
                (backendTargetId && (it.id === backendTargetId || it.masterItemId === backendTargetId || itBackend === backendTargetId));
              if (match && progress) {
                return {
                  ...it,
                  isActive: true,
                  status: (progress.status as any) || it.status,
                  fsrsData: {
                    stability: Number(progress.stability),
                    difficulty: Number(progress.difficulty),
                    reps: Number(progress.reps),
                    lapses: Number(progress.lapses),
                    lastReview: progress.lastReview ? new Date(progress.lastReview).toISOString() : new Date().toISOString(),
                    nextReview: progress.nextReview ? new Date(progress.nextReview).toISOString() : null,
                    state: (progress.state ? String(progress.state).toLowerCase() : 'review') as any,
                  }
                };
              }
              return it;
            });

            const activeCount = updatedItems.filter(i => i.isActive).length;
            const dueCount = updatedItems.filter(i => isDue(i.fsrsData?.nextReview, i.isActive, i.fsrsData?.lastReview)).length;
            const avgStability = activeCount > 0
              ? Math.round(updatedItems.filter(i => i.isActive).reduce((acc, i) => acc + (i.fsrsData.stability || 0), 0) / activeCount)
              : 0;

            return {
              ...std,
              bookItemsData: updatedItems,
              activeItemsCount: activeCount,
              dueTodayCount: dueCount,
              averageStability: avgStability,
            };
          })
        };
      }));
    });

    const unsubQuran = wsService.on('STUDENT_QURAN_REVIEWED', (payload: any) => {
      const { studentId, pageNumber, rating } = payload;
      const cleanCurrentId = userProfile.id.replace(/^std-user-/, '').replace(/^user-/, '');
      const cleanTargetId = (studentId || '').replace(/^std-user-/, '').replace(/^user-/, '');
      if (cleanCurrentId === cleanTargetId) {
        setQuranPages(prev => prev.map(p => {
          if (p.pageNumber === pageNumber) {
            const { newState } = updateQuranFSRS(p.fsrsData, rating);
            return {
              ...p,
              fsrsData: newState,
            };
          }
          return p;
        }));
      }
    });

    const unsubClassBook = wsService.on('CLASS_BOOK_UPDATED', () => {
      refreshClassesFromBackend(true);
      refreshBooksFromBackend(true);
    });

    return () => {
      unsubReview();
      unsubQuran();
      unsubClassBook();
    };
  }, [userProfile.id, refreshBooksFromBackend, refreshClassesFromBackend]);

  // Real-time: Cross-device push notifications via Server-Sent Events (SSE) (fallback)
  useEffect(() => {
    if (userProfile.id === 'guest' || !userProfile.backendId) return;
    const token = getAuthToken();
    if (!token) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/v1/classes/events/stream?token=${encodeURIComponent(token)}`);
      
      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload?.type === 'CLASS_BOOK_UPDATED' && payload?.classId) {
            const { classId, assignedBooksData, assignedBookIds } = payload;
            setMyClasses(prev => prev.map(c => {
              if (c.id === classId) {
                return {
                  ...c,
                  assignedBookIds: assignedBookIds || c.assignedBookIds,
                  assignedBooksData: assignedBooksData || c.assignedBooksData,
                };
              }
              return c;
            }));
            setTeachingClasses(prev => prev.map(c => {
              if (c.id === classId) {
                return {
                  ...c,
                  assignedBookIds: assignedBookIds || c.assignedBookIds,
                  assignedBooksData: assignedBooksData || c.assignedBooksData,
                };
              }
              return c;
            }));
            refreshClassesFromBackend(true);
          } else if (payload?.type === 'LIBRARY_BOOK_UPDATED' || payload?.type === 'LIBRARY_UPDATED') {
            refreshLibraryFromBackend(true);
          }
        } catch (err) {}
      };
    } catch (sseErr) {
      console.warn('[SSE] EventSource init notice:', sseErr);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [userProfile.backendId, refreshClassesFromBackend, refreshLibraryFromBackend]);

  // Real-time: Auto-sync on window focus (throttled 60s) & relaxed 90s fallback polling
  useEffect(() => {
    if (userProfile.id === 'guest' || !userProfile.backendId) return;

    let lastFocusSync = 0;
    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFocusSync < 60000) return; // at most once every 60s
      lastFocusSync = now;
      refreshClassesFromBackend();
      refreshBooksFromBackend();
      refreshLibraryFromBackend();
    };
    window.addEventListener('focus', handleFocus);

    // Fallback polling relaxed from 10s to 90s
    const interval = setInterval(() => {
      refreshClassesFromBackend();
      refreshLibraryFromBackend();
    }, 90000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [userProfile.backendId, refreshClassesFromBackend, refreshBooksFromBackend, refreshLibraryFromBackend]);

  const markAttendanceException = (date: string, status: 'izin' | 'sakit' | null) => {
    setAttendanceExceptions(prev => {
      const next = { ...prev };
      if (!status) {
        delete next[date];
      } else {
        next[date] = status;
      }
      return next;
    });
  };

  // Marketplace, Transactions & Invoices
  const [transactions, setTransactions] = useState<BookTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('unlupa_system_transactions_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { /* ignore */ }
    return [
      {
        id: 'INV-20260228-8921',
        userId: 'usr-student-demo-01',
        userName: 'Ahmad Fadhil Hidayat',
        userEmail: 'fadhil.hidayat@example.com',
        type: 'book_purchase',
        bookId: 'lib-book-7',
        libraryEntryId: 'lib-7',
        bookTitle: 'Shahih Riyadhus Shalihin (Edisi Eksklusif Adab & Niat)',
        authorName: 'Imam Abu Zakariyya An-Nawawi (Tahqiq & Syarah)',
        amount: 35000,
        platformFee: 5250,
        authorRoyalty: 29750,
        paymentMethod: 'qris',
        status: 'success',
        paidAt: '2026-02-28T10:15:30.000Z',
        createdAt: '2026-02-28T10:14:00.000Z',
      },
      {
        id: 'INV-20260301-4192',
        userId: 'usr-student-demo-02',
        userName: 'Siti Maryam Az-Zahra',
        userEmail: 'maryam.azzahra@example.com',
        type: 'book_purchase',
        bookId: 'lib-book-8',
        libraryEntryId: 'lib-8',
        bookTitle: 'Alfiyyah Ibnu Malik - Jilid 1 (1000 Bait Kaidah Nahwu)',
        authorName: 'Al-Allamah Jamaluddin Muhammad bin Malik',
        amount: 65000,
        platformFee: 9750,
        authorRoyalty: 55250,
        paymentMethod: 'bca_va',
        status: 'success',
        paidAt: '2026-03-01T14:22:10.000Z',
        createdAt: '2026-03-01T14:20:00.000Z',
      },
      {
        id: 'INV-20260302-7734',
        userId: 'usr-student-demo-03',
        userName: 'Muhammad Zaki Ar-Rasyid',
        userEmail: 'zaki.rasyid@example.com',
        type: 'book_purchase',
        bookId: 'lib-book-9',
        libraryEntryId: 'lib-9',
        bookTitle: 'Mandhumah Al-Jazariyyah (Tajwid Tingkat Lanjutan)',
        authorName: 'Al-Imam Syamsuddin Muhammad Ibnul Jazari',
        amount: 25000,
        platformFee: 3750,
        authorRoyalty: 21250,
        paymentMethod: 'gopay',
        status: 'success',
        paidAt: '2026-03-02T09:45:00.000Z',
        createdAt: '2026-03-02T09:43:00.000Z',
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('unlupa_system_transactions_v1', JSON.stringify(transactions));
    } catch (e) { /* ignore */ }
  }, [transactions]);

  const [purchasedBookIds, setPurchasedBookIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(getUserKey(userProfile.id, 'purchased_books'));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { /* ignore */ }
    return [];
  });

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(getUserKey(userProfile.id, 'purchased_books'), JSON.stringify(purchasedBookIds));
    } catch (e) { /* ignore */ }
  }, [purchasedBookIds, userProfile.id]);

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [selectedCheckoutEntry, setSelectedCheckoutEntry] = useState<LibraryEntry | null>(null);

  const openCheckoutModal = (entry: LibraryEntry) => {
    alert(
      language === 'en'
        ? `The purchase feature for "${entry.book.title}" is currently under development. For now, this book cannot be purchased or used yet.`
        : `Fitur pembelian untuk buku "${entry.book.title}" saat ini masih dalam tahap integrasi & pengembangan. Untuk sementara waktu, buku ini belum dapat dibeli atau digunakan.`
    );
  };

  const closeCheckoutModal = () => {
    setIsCheckoutModalOpen(false);
    setSelectedCheckoutEntry(null);
  };

  const isBookPurchased = (libraryEntryId: string, book?: Book): boolean => {
    if (userProfile.plan === 'institutional') return true;
    const price = book?.price ?? library.find(l => l.id === libraryEntryId || l.book.id === libraryEntryId)?.book.price ?? 0;
    if (price <= 0) return true;
    if (purchasedBookIds.includes(libraryEntryId) || (book?.id && purchasedBookIds.includes(book.id))) return true;
    return books.some(b => b.id === (book?.id || libraryEntryId) || b.id === `lib-book-${libraryEntryId.replace('lib-', '')}`);
  };

  const purchaseBook = async (entry: LibraryEntry, paymentMethod: PaymentMethod): Promise<{ success: boolean; transaction: BookTransaction }> => {
    const amount = entry.book.price || 0;
    const platformFee = Math.round(amount * 0.15);
    const authorRoyalty = amount - platformFee;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const txId = `INV-${dateStr}-${randSuffix}`;

    const newTx: BookTransaction = {
      id: txId,
      userId: userProfile.id,
      userName: userProfile.fullName || 'Pengguna Unlupa',
      userEmail: userProfile.email || 'user@unlupa.id',
      type: 'book_purchase',
      bookId: entry.book.id,
      libraryEntryId: entry.id,
      bookTitle: entry.book.title,
      bookCoverUrl: entry.book.coverUrl,
      authorName: entry.book.authorName || entry.curator || 'Penulis Kitab',
      amount,
      platformFee,
      authorRoyalty,
      paymentMethod,
      status: 'success',
      paidAt: now.toISOString(),
      createdAt: now.toISOString(),
    };

    setTransactions(prev => [newTx, ...prev]);
    setPurchasedBookIds(prev => Array.from(new Set([...prev, entry.id, entry.book.id])));
    
    // Auto import to user's personal space
    importFromLibrary(entry.id);

    return { success: true, transaction: newTx };
  };

  const subscribeToPro = async (cycle: 'monthly' | 'yearly', paymentMethod: PaymentMethod): Promise<{ success: boolean; transaction: BookTransaction }> => {
    const amount = cycle === 'yearly' ? (tierConfig?.pricing?.yearlyIDR || 399000) : (tierConfig?.pricing?.monthlyIDR || 49000);
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const txId = `INV-SUBS-${dateStr}-${randSuffix}`;

    const newTx: BookTransaction = {
      id: txId,
      userId: userProfile.id,
      userName: userProfile.fullName || 'Pengguna Unlupa',
      userEmail: userProfile.email || 'user@unlupa.id',
      type: cycle === 'yearly' ? 'subscription_pro_yearly' : 'subscription_pro_monthly',
      bookTitle: cycle === 'yearly' ? 'Langganan Unlupa Pro (1 Tahun Penuh)' : 'Langganan Unlupa Pro (1 Bulan)',
      authorName: 'Unlupa Official Platform',
      amount,
      platformFee: amount,
      authorRoyalty: 0,
      paymentMethod,
      status: 'success',
      paidAt: now.toISOString(),
      createdAt: now.toISOString(),
    };

    setTransactions(prev => [newTx, ...prev]);
    updateUserProfile({ plan: 'premium' });

    return { success: true, transaction: newTx };
  };

  // Handle Onboarding dismissal
  const handleCloseOnboarding = (open: boolean) => {
    setIsOnboardingOpen(open);
    if (!open) {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, 'true');
    }
  };

  // Quran Actions
  const activateQuranPage = (pageNumber: number) => {
    const targetNum = Number(pageNumber);
    triggerXpReward(50, language === 'en' ? 'New Page Ziyadah! (+50 XP)' : 'Ziyadah Halaman Baru! (+50 XP)');
    const currentUid = loadedUserIdRef.current;

    setQuranPages(prev => {
      const updated = prev.map(p => {
        if (Number(p.pageNumber) !== targetNum) return p;
        const today = new Date();
        const isMapan = p.status === 'mastered_for_now' || (p.fsrsData.stability >= 74.5 || Math.round((p.fsrsData.stability || 0) * 0.4025587) > 30);
        
        // CRITICAL: Preserve existing nextReview date if card already has prior FSRS schedule data!
        const hasHistory = (p.fsrsData.reps || 0) > 0 || Boolean(p.fsrsData.lastReview) || Boolean(p.fsrsData.nextReview);
        const nextReviewDate = hasHistory && p.fsrsData.nextReview ? p.fsrsData.nextReview : today.toISOString();

        const newState: 'new' | 'learning' | 'review' | 'mastered' = (p.fsrsData.reps || 0) > 0 ? (isMapan ? 'mastered' : 'review') : 'new';

        return {
          ...p,
          pageNumber: targetNum,
          isActive: true,
          activatedAt: p.activatedAt || today.toISOString(),
          status: isMapan ? 'mastered_for_now' : (p.status === 'inactive' ? 'active' : p.status),
          fsrsData: {
            ...p.fsrsData,
            nextReview: nextReviewDate,
            state: newState,
          }
        };
      });
      try {
        localStorage.setItem(getUserKey(currentUid, 'quran_pages'), JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Persist to PostgreSQL backend if authenticated
    if (currentUid && currentUid !== 'guest') {
      api.activateQuranPage(targetNum).catch(err => {
        console.error('[Quran] Backend activation failed:', err);
      });
    }
  };

  const deactivateQuranPage = (pageNumber: number) => {
    const targetNum = Number(pageNumber);
    const currentUid = loadedUserIdRef.current;

    setQuranPages(prev => {
      const updated = prev.map(p => {
        if (Number(p.pageNumber) !== targetNum) return p;
        return {
          ...p,
          pageNumber: targetNum,
          isActive: false,
          // Preserve p.status and full fsrsData history (reps, stability, lapses, etc.)
        };
      });
      try {
        localStorage.setItem(getUserKey(currentUid, 'quran_pages'), JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Persist to PostgreSQL backend if authenticated
    if (currentUid && currentUid !== 'guest') {
      api.deactivateQuranPage(targetNum).catch(err => {
        console.error('[Quran] Backend deactivation failed:', err);
      });
    }
  };

  const reviewQuranPage = (
    pageNumber: number,
    rating: 1 | 2 | 3,
    feedback?: { notes?: string; issueTypes?: ('kelancaran' | 'tajwid' | 'makharijul' | 'konsentrasi')[]; problemAyahs?: string; }
  ): { newState: FSRSState; nextIntervalDays: number; isMasteredForNow: boolean; justBecameMastered: boolean } | null => {
    let result: { newState: FSRSState; nextIntervalDays: number; isMasteredForNow: boolean; justBecameMastered: boolean } | null = null;
    const currentUid = loadedUserIdRef.current;

    setQuranPages(prev => {
      const updated = prev.map(p => {
        if (p.pageNumber !== pageNumber) return p;

        // Periksa apakah halaman ini sebelumnya memang sudah berstatus Mapan atau sudah pernah dirayakan
        const wasAlreadyMastered = p.status === 'mastered_for_now' || !!p.mapanCelebrated || (p.fsrsData.stability >= 74.5 || Math.round((p.fsrsData.stability || 0) * 0.4025587) > 30);
        
        const previousInterval = Math.round((p.fsrsData.stability || 0) * 0.4025587);
        const res = updateQuranFSRS(p.fsrsData, rating, new Date(), p.mapanSchedule);
        
        // Halaman HANYA dianggap "baru saja Mapan" jika sebelumnya belum pernah mapan, dan hasil review ini mencapai batas Mapan (>30 hari)
        const justBecameMastered = !wasAlreadyMastered && res.isMasteredForNow;
        
        result = { ...res, justBecameMastered };
        
        const wasDue = isDue(p.fsrsData.nextReview, p.isActive, p.fsrsData.lastReview);
        const reviewLog: PageReviewLog = {
          id: Math.random().toString(36).substring(7),
          date: new Date().toISOString(),
          rating,
          previousInterval,
          newInterval: res.nextIntervalDays,
          wasDue,
          notes: feedback?.notes,
          issueTypes: feedback?.issueTypes,
          problemAyahs: feedback?.problemAyahs
        };

        return {
          ...p,
          status: (res.isMasteredForNow ? 'mastered_for_now' : 'active') as ('active' | 'inactive' | 'mastered_for_now'),
          mapanCelebrated: p.mapanCelebrated || justBecameMastered || res.isMasteredForNow,
          fsrsData: res.newState,
          reviewLogs: [...(p.reviewLogs || []), reviewLog].slice(-100)
        };
      });

      try {
        localStorage.setItem(getUserKey(currentUid, 'quran_pages'), JSON.stringify(updated));
      } catch (e) {}

      return updated;
    });

    // Persist to PostgreSQL backend if authenticated
    if (currentUid && currentUid !== 'guest') {
      api.reviewQuranPage(pageNumber, {
        rating,
        notes: feedback?.notes,
        issueTypes: feedback?.issueTypes,
        problemAyahs: feedback?.problemAyahs,
      }).then(serverRes => {
        if (serverRes?.reviewLog?.id) {
          setQuranPages(prev => prev.map(p => {
            if (p.pageNumber !== pageNumber) return p;
            const logs = [...(p.reviewLogs || [])];
            if (logs.length > 0 && logs[logs.length - 1].rating === rating) {
              logs[logs.length - 1] = { ...logs[logs.length - 1], id: serverRes.reviewLog.id };
            }
            return { ...p, reviewLogs: logs };
          }));
        }
      }).catch(err => {
        console.error('[Quran] Backend review persistence failed:', err);
      });
    }

    return result;
  };

  const bypassQuranPageToMapan = (pageNumber: number, config?: MapanScheduleConfig) => {
    setQuranPages(prev => prev.map(p => {
      if (p.pageNumber !== pageNumber) return p;
      const scheduled = calculateNextMapanDate(config || p.mapanSchedule, 35, new Date());
      return {
        ...p,
        isActive: true,
        status: 'mastered_for_now',
        mapanCelebrated: true,
        mapanSchedule: config || p.mapanSchedule,
        fsrsData: {
          stability: 87.0,
          difficulty: 5.0,
          reps: Math.max(p.fsrsData.reps, 25),
          lapses: p.fsrsData.lapses,
          lastReview: new Date().toISOString(),
          nextReview: scheduled.nextDate.toISOString(),
          state: 'mastered',
        }
      };
    }));
  };

  const addQuranPageIssue = (pageNumber: number, issue: Omit<import('../types').PageIssue, 'id' | 'createdAt' | 'isResolved'>) => {
    setQuranPages(prev => prev.map(p => {
      if (p.pageNumber !== pageNumber) return p;
      const newIssue = {
        ...issue,
        id: Math.random().toString(36).substring(7),
        createdAt: new Date().toISOString(),
        isResolved: false
      };
      return {
        ...p,
        issues: [...(p.issues || []), newIssue]
      };
    }));
  };

  const resolveQuranPageIssue = (pageNumber: number, issueId: string) => {
    setQuranPages(prev => prev.map(p => {
      if (p.pageNumber !== pageNumber) return p;
      return {
        ...p,
        issues: (p.issues || []).map(issue => 
          issue.id === issueId 
            ? { ...issue, isResolved: true, resolvedAt: new Date().toISOString() } 
            : issue
        )
      };
    }));
  };

  const addQuranPageFeedback = (pageNumber: number, feedback: { notes?: string; issueTypes?: ('kelancaran' | 'tajwid' | 'makharijul' | 'konsentrasi')[]; problemAyahs?: string; }) => {
    setQuranPages(prev => prev.map(p => {
      if (p.pageNumber !== pageNumber) return p;
      
      const newLog = {
        id: Math.random().toString(36).substring(7),
        date: new Date().toISOString(),
        rating: 2 as 1 | 2 | 3, // Default mapping if just a note without formal review
        previousInterval: Math.round((p.fsrsData.stability || 0) * 0.4025587),
        newInterval: Math.round((p.fsrsData.stability || 0) * 0.4025587),
        notes: feedback.notes,
        issueTypes: feedback.issueTypes,
        problemAyahs: feedback.problemAyahs
      };
      
      return {
        ...p,
        reviewLogs: [...(p.reviewLogs || []), newLog]
      };
    }));
  };

  const updateQuranMapanSchedule = (pageNumber: number, config: MapanScheduleConfig) => {
    setQuranPages(prev => prev.map(p => {
      if (p.pageNumber !== pageNumber) return p;
      let nextReview = p.fsrsData.nextReview;
      const rawInterval = Math.round((p.fsrsData.stability || 78) * 0.4025587);
      if (p.status === 'mastered_for_now' || rawInterval > 30) {
        const scheduled = calculateNextMapanDate(config, rawInterval, new Date(p.fsrsData.lastReview || new Date()));
        nextReview = scheduled.nextDate.toISOString();
      }
      return {
        ...p,
        mapanSchedule: config,
        mapanCelebrated: true,
        fsrsData: {
          ...p.fsrsData,
          nextReview,
        },
      };
    }));
  };

  const setGlobalMapanSchedule = (config: MapanScheduleConfig) => {
    setQuranPages(prev => prev.map(p => {
      const rawInterval = Math.round(p.fsrsData.stability * 0.4025587);
      if (p.status === 'mastered_for_now' || rawInterval > 30) {
        const scheduled = calculateNextMapanDate(config, rawInterval, new Date());
        return {
          ...p,
          mapanSchedule: config,
          mapanCelebrated: true,
          fsrsData: {
            ...p.fsrsData,
            nextReview: scheduled.nextDate.toISOString(),
          }
        };
      }
      return {
        ...p,
        mapanSchedule: config,
      };
    }));
  };

  const resetQuranPageMapan = (pageNumber: number) => {
    setQuranPages(prev => prev.map(p => {
      if (p.pageNumber !== pageNumber) return p;
      return {
        ...p,
        isActive: true,
        status: 'active',
        mapanCelebrated: false,
        fsrsData: {
          stability: 1.3,
          difficulty: 5.0,
          reps: 0,
          lapses: 0,
          lastReview: null,
          nextReview: new Date().toISOString(),
          state: 'new',
        }
      };
    }));
  };

  // Helper to resolve backend item UUID for both master items and joined class items
  const resolveBackendItemId = (targetId: string): string | null => {
    if (isValidUUID(targetId)) return targetId;
    const it = items.find(i => i.id === targetId);
    if (it?.masterItemId && isValidUUID(it.masterItemId)) return it.masterItemId;
    if (targetId.startsWith('class-item-')) {
      const parts = targetId.split('-');
      if (parts.length >= 5) {
        const candidate = parts.slice(-5).join('-');
        if (isValidUUID(candidate)) return candidate;
      }
    }
    return null;
  };

  // Non-Quran Item Actions
  const activateItem = (itemId: string) => {
    triggerXpReward(5, language === 'en' ? 'New Card Activated (+5 XP)' : 'Kartu Baru Aktif (+5 XP)');
    let previousSnapshot: BookItem[] = [];
    setItems(prev => {
      previousSnapshot = prev;
      return prev.map(item => {
        if (item.id !== itemId) return item;
        const today = new Date();
        const hasHistory = (item.fsrsData.reps || 0) > 0 || Boolean(item.fsrsData.lastReview) || Boolean(item.fsrsData.nextReview);
        const nextReviewDate = hasHistory && item.fsrsData.nextReview ? item.fsrsData.nextReview : today.toISOString();

        return {
          ...item,
          isActive: true,
          status: item.status === 'inactive' ? 'active' : item.status,
          fsrsData: {
            ...item.fsrsData,
            nextReview: nextReviewDate,
            state: (item.fsrsData.reps || 0) > 0 ? 'review' : 'new',
          }
        };
      });
    });

    const token = getAuthToken();
    const backendItemId = resolveBackendItemId(itemId);
    if (userProfile.id !== 'guest' && userProfile.backendId && token && backendAuthStatus === 'authenticated' && backendItemId) {
      const currentUid = userProfile.id;
      bookApiService.activateItem(backendItemId)
        .then(progress => {
          if (loadedUserIdRef.current !== currentUid) return;
          setItems(prev => prev.map(item => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              isActive: progress.isActive,
              status: (progress.status as any) || item.status,
              fsrsData: {
                stability: progress.stability,
                difficulty: progress.difficulty,
                reps: progress.reps,
                lapses: progress.lapses,
                lastReview: progress.lastReview ? new Date(progress.lastReview).toISOString() : null,
                nextReview: progress.nextReview ? new Date(progress.nextReview).toISOString() : null,
                state: (progress.state ? progress.state.toLowerCase() : 'new') as any,
              }
            };
          }));
        })
        .catch(err => {
          if (loadedUserIdRef.current !== currentUid) return;
          console.warn('[BookAPI] activateItem sync notice, kept locally:', err?.message || err);
          if (err?.status === 401 || err?.statusCode === 401 || err?.message?.includes('Token')) {
            clearAuthToken();
            setBackendAuthStatus('unauthenticated');
          }
        });
    }
  };

  const deactivateItem = (itemId: string) => {
    let previousSnapshot: BookItem[] = [];
    setItems(prev => {
      previousSnapshot = prev;
      return prev.map(item => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          isActive: false,
        };
      });
    });

    const token = getAuthToken();
    const backendItemId = resolveBackendItemId(itemId);
    if (userProfile.id !== 'guest' && userProfile.backendId && token && backendAuthStatus === 'authenticated' && backendItemId) {
      const currentUid = userProfile.id;
      bookApiService.deactivateItem(backendItemId)
        .then(res => {
          if (loadedUserIdRef.current !== currentUid) return;
          setItems(prev => prev.map(item => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              isActive: res ? res.isActive : false,
            };
          }));
        })
        .catch(err => {
          if (loadedUserIdRef.current !== currentUid) return;
          console.warn('[BookAPI] deactivateItem sync notice, kept locally:', err?.message || err);
          if (err?.status === 401 || err?.statusCode === 401 || err?.message?.includes('Token')) {
            clearAuthToken();
            setBackendAuthStatus('unauthenticated');
          }
        });
    }
  };

  const reviewItem = (itemId: string, rating: 1 | 2 | 3 | 4) => {
    let previousSnapshot: BookItem[] = [];
    setItems(prev => {
      previousSnapshot = prev;
      return prev.map(item => {
        if (item.id !== itemId) return item;
        const isDueBeforeReview = isDue(item.fsrsData?.nextReview, item.isActive, item.fsrsData?.lastReview);
        const { newState, nextIntervalDays } = updateNonQuranFSRS(item.fsrsData, rating);
        const newLog = {
          id: Math.random().toString(36).substring(7),
          date: new Date().toISOString(),
          rating,
          wasDue: isDueBeforeReview,
        };
        return {
          ...item,
          status: nextIntervalDays >= 375 ? 'mastered' : (item.isActive ? 'active' : 'inactive'),
          fsrsData: newState,
          reviewLogs: [...(item.reviewLogs || []), newLog].slice(-100),
        };
      });
    });

    const token = getAuthToken();
    const backendItemId = resolveBackendItemId(itemId);
    if (userProfile.id !== 'guest' && userProfile.backendId && token && backendAuthStatus === 'authenticated' && backendItemId) {
      const currentUid = userProfile.id;
      bookApiService.reviewItem(backendItemId, rating)
        .then(res => {
          if (loadedUserIdRef.current !== currentUid) return;
          const p = res.progress;
          const log = res.reviewLog;
          setItems(prev => prev.map(item => {
            if (item.id !== itemId) return item;
            const backendFSRS: FSRSState = {
              stability: p.stability,
              difficulty: p.difficulty,
              reps: p.reps,
              lapses: p.lapses,
              lastReview: p.lastReview ? new Date(p.lastReview).toISOString() : null,
              nextReview: p.nextReview ? new Date(p.nextReview).toISOString() : null,
              state: (p.state ? p.state.toLowerCase() : 'review') as any,
            };
            const mappedLog = {
              id: log.id,
              date: new Date(log.date).toISOString(),
              rating: log.rating,
              wasDue: log.wasDue,
            };
            return {
              ...item,
              status: (p.status as any) || item.status,
              fsrsData: backendFSRS,
              reviewLogs: [...(item.reviewLogs || []).filter(l => l.id !== mappedLog.id), mappedLog].slice(-100),
            };
          }));
        })
        .catch(err => {
          if (loadedUserIdRef.current !== currentUid) return;
          console.warn('[BookAPI] reviewItem sync notice, kept locally:', err?.message || err);
          if (err?.status === 401 || err?.statusCode === 401 || err?.message?.includes('Token')) {
            clearAuthToken();
            setBackendAuthStatus('unauthenticated');
          }
        });
    }
  };

  // Book & Chapter Operations
  const createBook = (data: { id?: string; title: string; description: string; coverUrl?: string; isPublic?: boolean; category?: string; authorName?: string; price?: number; isReadonly?: boolean }): Book => {
    const tempId = data.id && isValidUUID(data.id) ? data.id : crypto.randomUUID();
    const newBook: Book = {
      id: tempId,
      userId: userProfile.id,
      title: data.title,
      description: data.description,
      coverUrl: data.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      isPublic: data.isPublic ?? false,
      category: data.category || '',
      isReadonly: false,
      authorName: data.authorName || userProfile.fullName,
      price: data.price || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setBooks(prev => {
      const next = [newBook, ...prev];
      try {
        localStorage.setItem(getUserKey(userProfile.id, 'books'), JSON.stringify(next));
        localStorage.setItem(getUserKey('guest', 'books'), JSON.stringify(next));
        localStorage.setItem('unlupa_active_book_backup', JSON.stringify({ book: newBook, timestamp: Date.now() }));
      } catch (e) {}
      return next;
    });

    const token = getAuthToken();
    if (userProfile.id !== 'guest' && userProfile.backendId && token && backendAuthStatus === 'authenticated') {
      const currentUid = userProfile.id;
      bookApiService.createBook({
        title: newBook.title,
        description: newBook.description,
        coverUrl: newBook.coverUrl,
        category: newBook.category,
        isPublic: newBook.isPublic,
      })
      .then(res => {
        if (loadedUserIdRef.current !== currentUid) return;
        const backendBook = mapBackendBookToBook(res);
        setBooks(prev => {
          const updated = prev.map(b => b.id === tempId ? backendBook : b);
          try {
            localStorage.setItem(getUserKey(currentUid, 'books'), JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
        setChapters(prev => {
          const updated = prev.map(c => c.bookId === tempId ? { ...c, bookId: backendBook.id } : c);
          try {
            localStorage.setItem(getUserKey(currentUid, 'chapters'), JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
        setItems(prev => {
          const updated = prev.map(i => i.bookId === tempId ? { ...i, bookId: backendBook.id } : i);
          try {
            localStorage.setItem(getUserKey(currentUid, 'items'), JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
        setSelectedPersonalBookId(prev => prev === tempId ? backendBook.id : prev);
      })
      .catch(err => {
        if (loadedUserIdRef.current !== currentUid) return;
        console.warn('[BookAPI] createBook backend sync notice, book safely kept locally:', err?.message || err);
        if (err?.status === 401 || err?.statusCode === 401 || err?.message?.includes('Token')) {
          clearAuthToken();
          setBackendAuthStatus('unauthenticated');
        }
      });
    }

    return newBook;
  };

  const createBookWithContent = async (bookData: {
    title: string;
    description?: string;
    coverUrl?: string;
    category?: string;
    chapters?: Array<{
      title: string;
      description?: string;
      material?: string;
      cards?: Array<{
        question: string;
        answer: string;
        explanation?: string;
      }>;
    }>;
  }): Promise<Book> => {
    const bookId = crypto.randomUUID();
    const newBook: Book = {
      id: bookId,
      userId: userProfile.id,
      title: bookData.title.trim() || (language === 'en' ? 'New Book' : 'Buku Baru'),
      description: bookData.description?.trim() || '',
      coverUrl: bookData.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      isPublic: false,
      category: bookData.category?.trim() || '',
      isReadonly: false,
      authorName: userProfile.fullName || 'Tamu / Murid',
      price: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newChapters: Chapter[] = [];
    const newItems: BookItem[] = [];

    if (Array.isArray(bookData.chapters)) {
      bookData.chapters.forEach((ch, chIdx) => {
        const chapterId = crypto.randomUUID();
        newChapters.push({
          id: chapterId,
          bookId: bookId,
          masterChapterId: null,
          title: ch.title?.trim() || (language === 'en' ? `Chapter ${chIdx + 1}` : `Bab ${chIdx + 1}`),
          description: ch.description?.trim() || '',
          material: ch.material || '',
          parentId: null,
          order: chIdx + 1,
        });

        if (Array.isArray(ch.cards)) {
          ch.cards.forEach((card, cardIdx) => {
            const itemId = crypto.randomUUID();
            newItems.push({
              id: itemId,
              bookId: bookId,
              chapterId: chapterId,
              masterItemId: null,
              question: normalizeBilingualText(card.question),
              answer: normalizeBilingualText(card.answer),
              explanation: card.explanation ? normalizeBilingualText(card.explanation) : '',
              tags: [],
              order: cardIdx + 1,
              isActive: false,
              status: 'inactive',
              fsrsData: {
                stability: 0,
                difficulty: 5.0,
                reps: 0,
                lapses: 0,
                state: 'new',
                lastReview: null,
                nextReview: null,
              },
              reviewLogs: [],
              createdAt: new Date().toISOString(),
            });
          });
        }
      });
    }

    // 1. Instantly save all into local state & localStorage (synchronous & local-first)
    setBooks(prev => {
      const next = [newBook, ...prev];
      try {
        localStorage.setItem(getUserKey(userProfile.id, 'books'), JSON.stringify(next));
        localStorage.setItem(getUserKey('guest', 'books'), JSON.stringify(next));
        localStorage.setItem('unlupa_active_book_backup', JSON.stringify({ book: newBook, timestamp: Date.now() }));
      } catch (e) {}
      return next;
    });

    if (newChapters.length > 0) {
      setChapters(prev => {
        const next = [...prev, ...newChapters];
        try {
          localStorage.setItem(getUserKey(userProfile.id, 'chapters'), JSON.stringify(next));
          localStorage.setItem(getUserKey('guest', 'chapters'), JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    if (newItems.length > 0) {
      setItems(prev => {
        const next = [...prev, ...newItems];
        try {
          localStorage.setItem(getUserKey(userProfile.id, 'items'), JSON.stringify(next));
          localStorage.setItem(getUserKey('guest', 'items'), JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    setSelectedPersonalBookId(bookId);

    // 2. If authenticated and token is valid, sync transactionally in background
    const token = getAuthToken();
    if (userProfile.id !== 'guest' && userProfile.backendId && token && backendAuthStatus === 'authenticated') {
      const currentUid = userProfile.id;
      const payload = {
        legacyId: bookId,
        title: newBook.title,
        description: newBook.description,
        coverUrl: newBook.coverUrl,
        category: newBook.category || 'Umum',
        isPublic: false,
        chapters: newChapters.map(ch => ({
          legacyId: ch.id,
          title: ch.title,
          order: ch.order,
        })),
        items: newItems.map(item => ({
          legacyId: item.id,
          legacyChapterId: item.chapterId,
          question: item.question,
          answer: item.answer,
          explanation: item.explanation || null,
          tags: item.tags || [],
          order: item.order || 1,
        })),
        progresses: [],
      };

      bookApiService.importBook(payload)
        .then(res => {
          if (loadedUserIdRef.current !== currentUid) return;
          if (res?.book?.id) {
            const serverBookId = res.book.id;
            const chapterMapping = res.idMapping?.chapters || {};
            const itemMapping = res.idMapping?.items || {};

            setBooks(prev => {
              const updated = prev.map(b => b.id === bookId ? { ...b, id: serverBookId } : b);
              try {
                localStorage.setItem(getUserKey(currentUid, 'books'), JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });

            setChapters(prev => {
              const updated = prev.map(c => {
                if (c.bookId !== bookId) return c;
                return {
                  ...c,
                  id: chapterMapping[c.id] || c.id,
                  bookId: serverBookId,
                };
              });
              try {
                localStorage.setItem(getUserKey(currentUid, 'chapters'), JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });

            setItems(prev => {
              const updated = prev.map(i => {
                if (i.bookId !== bookId) return i;
                return {
                  ...i,
                  id: itemMapping[i.id] || i.id,
                  bookId: serverBookId,
                  chapterId: i.chapterId ? (chapterMapping[i.chapterId] || i.chapterId) : undefined,
                };
              });
              try {
                localStorage.setItem(getUserKey(currentUid, 'items'), JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });

            setSelectedPersonalBookId(prev => prev === bookId ? serverBookId : prev);
          }
        })
        .catch(err => {
          if (loadedUserIdRef.current !== currentUid) return;
          console.warn('[BookAPI] Bulk import background sync notice, book kept safely locally:', err?.message || err);
          if (err?.status === 401 || err?.statusCode === 401 || err?.message?.includes('Token')) {
            clearAuthToken();
            setBackendAuthStatus('unauthenticated');
          }
        });
    }

    return newBook;
  };

  const updateBook = (id: string, data: Partial<Book>) => {
    let previousSnapshot: Book[] = [];
    setBooks(prev => {
      previousSnapshot = prev;
      const updated = prev.map(b => {
        if (b.id === id) {
          return {
            ...b,
            ...data,
            coverUrl: data.coverUrl !== undefined ? data.coverUrl : b.coverUrl,
            updatedAt: new Date().toISOString()
          };
        }
        if (b.masterBookId === id && (b.category === 'class' || Boolean(b.classId) || b.id.startsWith('class-book-'))) {
          return {
            ...b,
            title: data.title !== undefined ? data.title : b.title,
            description: data.description !== undefined ? data.description : b.description,
            coverUrl: data.coverUrl !== undefined ? data.coverUrl : b.coverUrl,
            updatedAt: new Date().toISOString()
          };
        }
        return b;
      });
      try {
        localStorage.setItem(getUserKey(userProfile.id, 'books'), JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    const token = getAuthToken();
    if (userProfile.id !== 'guest' && userProfile.backendId && token && backendAuthStatus === 'authenticated' && isValidUUID(id)) {
      const currentUid = userProfile.id;
      bookApiService.updateBook(id, {
        title: data.title,
        description: data.description,
        coverUrl: data.coverUrl,
        category: data.category,
        isPublic: data.isPublic,
      }).catch(err => {
        if (loadedUserIdRef.current !== currentUid) return;
        console.warn('[BookAPI] updateBook sync notice, kept locally:', err?.message || err);
        if (err?.status === 401 || err?.statusCode === 401 || err?.message?.includes('Token')) {
          clearAuthToken();
          setBackendAuthStatus('unauthenticated');
        }
      });
    }
  };

  const deleteBook = (id: string) => {
    const classBookIds = books.filter(b => b.masterBookId === id).map(b => b.id);
    const allBookIdsToDelete = [id, ...classBookIds];

    setBooks(prev => prev.filter(b => !allBookIdsToDelete.includes(b.id)));
    setChapters(prev => prev.filter(c => !allBookIdsToDelete.includes(c.bookId)));
    setItems(prev => prev.filter(i => !allBookIdsToDelete.includes(i.bookId)));
    setPages(prev => prev.filter(p => !allBookIdsToDelete.includes(p.bookId)));

    const token = getAuthToken();
    if (userProfile.id !== 'guest' && userProfile.backendId && token && backendAuthStatus === 'authenticated' && isValidUUID(id)) {
      const currentUid = userProfile.id;
      bookApiService.deleteBook(id).catch(err => {
        if (loadedUserIdRef.current !== currentUid) return;
        console.warn('[BookAPI] deleteBook sync notice:', err?.message || err);
        if (err?.status === 401 || err?.statusCode === 401 || err?.message?.includes('Token')) {
          clearAuthToken();
          setBackendAuthStatus('unauthenticated');
        }
      });
    }
  };

  const duplicateBookAsEditable = (bookId: string): Book | null => {
    const targetBook = books.find(b => b.id === bookId);
    if (!targetBook) return null;

    const newBookId = `book-copy-${Date.now()}`;
    const newBook: Book = {
      ...targetBook,
      id: newBookId,
      userId: userProfile.id,
      title: `${targetBook.title} (${language === 'en' ? 'Editable Copy' : 'Salinan Edit'})`,
      isReadonly: false,
      isPublic: false,
      authorName: userProfile.fullName,
      category: 'personal',
      classId: null,
      masterBookId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Map old chapter IDs to new chapter IDs
    const chapterIdMap = new Map<string, string>();
    const oldChapters = chapters.filter(c => c.bookId === bookId);
    const newChapters: Chapter[] = oldChapters.map((ch, idx) => {
      const newChapId = `chap-copy-${Date.now()}-${idx}`;
      chapterIdMap.set(ch.id, newChapId);
      return {
        ...ch,
        id: newChapId,
        bookId: newBookId,
        masterChapterId: null,
        parentId: null,
      };
    });

    // Fix hierarchy parentIds
    newChapters.forEach(nc => {
      const oldCh = oldChapters.find(oc => chapterIdMap.get(oc.id) === nc.id);
      if (oldCh && oldCh.parentId) {
        nc.parentId = chapterIdMap.get(oldCh.parentId) || null;
      }
    });

    // Map items
    const oldItems = items.filter(i => i.bookId === bookId);
    const newItems: BookItem[] = oldItems.map((item, idx) => ({
      ...item,
      id: `item-copy-${Date.now()}-${idx}`,
      bookId: newBookId,
      masterItemId: null,
      chapterId: item.chapterId ? (chapterIdMap.get(item.chapterId) || null) : null,
      isActive: false,
      status: 'inactive' as const,
      fsrsData: {
        stability: 0,
        difficulty: 5.0,
        reps: 0,
        lapses: 0,
        lastReview: null,
        nextReview: null,
        state: 'new' as const,
      },
      reviewLogs: [],
      createdAt: new Date().toISOString(),
    }));

    setBooks(prev => [newBook, ...prev]);
    setChapters(prev => [...prev, ...newChapters]);
    setItems(prev => [...prev, ...newItems]);

    // Backend duplicate call if authenticated with valid UUID
    if (userProfile.id !== 'guest' && userProfile.backendId && isValidUUID(bookId)) {
      const currentUid = userProfile.id;
      bookApiService.duplicateBook(bookId)
        .then(async () => {
          if (loadedUserIdRef.current !== currentUid) return;
          await refreshBooksFromBackend();
        })
        .catch(err => {
          if (loadedUserIdRef.current !== currentUid) return;
          console.warn('[BookAPI] duplicateBook backend sync notice:', err);
        });
    }

    return newBook;
  };

  const createChapter = (data: { id?: string; bookId: string; title: string; description?: string; material?: string; parentId?: string | null; order?: number }): Chapter => {
    const tempId = data.id && isValidUUID(data.id) ? data.id : crypto.randomUUID();
    const newChapter: Chapter = {
      id: tempId,
      bookId: data.bookId,
      masterChapterId: null,
      title: data.title,
      description: data.description,
      material: data.material,
      parentId: data.parentId || null,
      order: data.order !== undefined ? data.order : chapters.filter(c => c.bookId === data.bookId).length + 1,
    };

    // Also mirror to class books derived from this master book
    const derivedClassBooks = books.filter(b => b.masterBookId === data.bookId);
    const derivedClassChapters: Chapter[] = derivedClassBooks.map(cb => ({
      id: `class-chap-${cb.classId}-${newChapter.id}`,
      bookId: cb.id,
      masterChapterId: newChapter.id,
      title: newChapter.title,
      description: newChapter.description,
      parentId: newChapter.parentId ? `class-chap-${cb.classId}-${newChapter.parentId}` : null,
      order: newChapter.order,
    }));

    setChapters(prev => {
      const nextChapters = [...prev, newChapter, ...derivedClassChapters];
      try {
        localStorage.setItem(getUserKey(userProfile.id, 'chapters'), JSON.stringify(nextChapters));
        localStorage.setItem(getUserKey('guest', 'chapters'), JSON.stringify(nextChapters));
      } catch (e) {}
      return nextChapters;
    });

    const token = getAuthToken();
    if (userProfile.id !== 'guest' && userProfile.backendId && token && backendAuthStatus === 'authenticated' && isValidUUID(data.bookId)) {
      const currentUid = userProfile.id;
      bookApiService.createChapter(data.bookId, {
        title: newChapter.title,
        description: newChapter.description,
        material: newChapter.material,
        parentId: isValidUUID(newChapter.parentId) ? newChapter.parentId : null,
        order: newChapter.order,
      })
      .then(res => {
        if (loadedUserIdRef.current !== currentUid) return;
        const backendChapter = mapBackendChapterToChapter(res);
        setChapters(prev => prev.map(c => c.id === tempId ? backendChapter : c));
        setItems(prev => prev.map(i => i.chapterId === tempId ? { ...i, chapterId: backendChapter.id } : i));
      })
      .catch(err => {
        if (loadedUserIdRef.current !== currentUid) return;
        console.warn('[BookAPI] createChapter backend sync notice, chapter safely kept locally:', err?.message || err);
        if (err?.status === 401 || err?.statusCode === 401 || err?.message?.includes('Token')) {
          clearAuthToken();
          setBackendAuthStatus('unauthenticated');
        }
      });
    }

    return newChapter;
  };

  const updateChapter = (id: string, data: Partial<Chapter>) => {
    let previousSnapshot: Chapter[] = [];
    setChapters(prev => {
      previousSnapshot = prev;
      return prev.map(c => {
        if (c.id === id) {
          return { ...c, ...data };
        }
        if (c.masterChapterId === id) {
          const chapBook = books.find(b => b.id === c.bookId);
          if (chapBook && (chapBook.category === 'class' || Boolean(chapBook.classId) || chapBook.id.startsWith('class-book-'))) {
            return {
              ...c,
              title: data.title !== undefined ? data.title : c.title,
              description: data.description !== undefined ? data.description : c.description,
              order: data.order !== undefined ? data.order : c.order,
            };
          }
        }
        return c;
      });
    });

    const token = getAuthToken();
    if (userProfile.id !== 'guest' && userProfile.backendId && token && backendAuthStatus === 'authenticated' && isValidUUID(id)) {
      const currentUid = userProfile.id;
      bookApiService.updateChapter(id, {
        title: data.title,
        description: data.description,
        material: data.material,
        parentId: isValidUUID(data.parentId) ? data.parentId : (data.parentId === null ? null : undefined),
        order: data.order,
      }).catch(err => {
        if (loadedUserIdRef.current !== currentUid) return;
        console.warn('[BookAPI] updateChapter sync notice, kept locally:', err?.message || err);
        if (err?.status === 401 || err?.statusCode === 401 || err?.message?.includes('Token')) {
          clearAuthToken();
          setBackendAuthStatus('unauthenticated');
        }
      });
    }
  };

  const deleteChapter = (chapterId: string) => {
    const getDescendants = (id: string, all: Chapter[]): string[] => {
      const children = all.filter(c => c.parentId === id);
      let ids = children.map(c => c.id);
      children.forEach(c => {
        ids = [...ids, ...getDescendants(c.id, all)];
      });
      return ids;
    };
    const masterIdsToDelete = [chapterId, ...getDescendants(chapterId, chapters)];
    const classChapterIdsToDelete = chapters
      .filter(c => {
        if (!c.masterChapterId || !masterIdsToDelete.includes(c.masterChapterId)) return false;
        const chapBook = books.find(b => b.id === c.bookId);
        return Boolean(chapBook && (chapBook.category === 'class' || Boolean(chapBook.classId) || chapBook.id.startsWith('class-book-')));
      })
      .map(c => c.id);
    const allIdsToDelete = [...masterIdsToDelete, ...classChapterIdsToDelete];

    setChapters(prev => prev.filter(c => !allIdsToDelete.includes(c.id)));
    setItems(prevItems => prevItems.filter(i => i.chapterId ? !allIdsToDelete.includes(i.chapterId) : true));
    setPages(prevPages => prevPages.filter(p => p.chapterId ? !allIdsToDelete.includes(p.chapterId) : true));

    const token = getAuthToken();
    if (userProfile.id !== 'guest' && userProfile.backendId && token && backendAuthStatus === 'authenticated' && isValidUUID(chapterId)) {
      const currentUid = userProfile.id;
      bookApiService.deleteChapter(chapterId).catch(err => {
        if (loadedUserIdRef.current !== currentUid) return;
        console.warn('[BookAPI] deleteChapter sync notice:', err?.message || err);
        if (err?.status === 401 || err?.statusCode === 401 || err?.message?.includes('Token')) {
          clearAuthToken();
          setBackendAuthStatus('unauthenticated');
        }
      });
    }
  };

  
  const createPage = (data: { bookId: string; chapterId?: string; title: string; blocks: any[] }): PageDocument => {
    const newPage: PageDocument = {
      id: crypto.randomUUID(),
      bookId: data.bookId,
      chapterId: data.chapterId || null,
      title: data.title,
      blocks: data.blocks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPages(prev => [...prev, newPage]);
    return newPage;
  };

  const updatePage = (id: string, data: Partial<PageDocument>) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p));
  };

  const deletePage = (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
  };

  const createItem = (data: { 
    id?: string;
    bookId: string; 
    chapterId?: string; 
    question: string; 
    answer: string; 
    explanation?: string;
    tags?: string[];
    imageQ?: string;
    imageA?: string;
    order?: number;
  }): BookItem => {
    const tempId = data.id && isValidUUID(data.id) ? data.id : crypto.randomUUID();
    const newItem: BookItem = {
      id: tempId,
      bookId: data.bookId,
      masterItemId: null,
      chapterId: data.chapterId,
      question: data.question ? normalizeBilingualText(data.question) : data.question,
      answer: data.answer ? normalizeBilingualText(data.answer) : data.answer,
      explanation: data.explanation ? normalizeBilingualText(data.explanation) : (data.explanation || undefined),
      imageQ: data.imageQ,
      imageA: data.imageA,
      tags: data.tags || [],
      isActive: false, // Default is Inactive as per Master Plan
      status: 'inactive',
      fsrsData: {
        stability: 0,
        difficulty: 5.0,
        reps: 0,
        lapses: 0,
        lastReview: null,
        nextReview: null,
        state: 'new',
      },
      createdAt: new Date().toISOString(),
    };

    // Also mirror to class books derived from this master book (with fresh learning state)
    const derivedClassBooks = books.filter(b => b.masterBookId === data.bookId);
    const derivedClassItems: BookItem[] = derivedClassBooks.map(cb => ({
      id: `class-item-${cb.classId}-${newItem.id}`,
      bookId: cb.id,
      masterItemId: newItem.id,
      chapterId: newItem.chapterId ? `class-chap-${cb.classId}-${newItem.chapterId}` : null,
      question: newItem.question,
      answer: newItem.answer,
      explanation: newItem.explanation,
      imageQ: newItem.imageQ,
      imageA: newItem.imageA,
      tags: newItem.tags || [],
      isActive: false,
      status: 'inactive',
      fsrsData: createInitialFSRSState(),
      reviewLogs: [],
      createdAt: new Date().toISOString(),
    }));

    setItems(prev => {
      const nextItems = [...prev, newItem, ...derivedClassItems];
      try {
        localStorage.setItem(getUserKey(userProfile.id, 'items'), JSON.stringify(nextItems));
        localStorage.setItem(getUserKey('guest', 'items'), JSON.stringify(nextItems));
      } catch (e) {}
      return nextItems;
    });

    const token = getAuthToken();
    if (userProfile.id !== 'guest' && userProfile.backendId && token && backendAuthStatus === 'authenticated' && isValidUUID(data.bookId)) {
      const currentUid = userProfile.id;
      bookApiService.createItem(data.bookId, {
        question: newItem.question,
        answer: newItem.answer,
        explanation: newItem.explanation,
        chapterId: isValidUUID(newItem.chapterId) ? newItem.chapterId : null,
        tags: newItem.tags,
        imageQ: newItem.imageQ,
        imageA: newItem.imageA,
        order: data.order,
      })
      .then(res => {
        if (loadedUserIdRef.current !== currentUid) return;
        const backendItem = mapBackendItemToBookItem(res);
        setItems(prev => prev.map(i => i.id === tempId ? backendItem : i));
      })
      .catch(err => {
        if (loadedUserIdRef.current !== currentUid) return;
        console.warn('[BookAPI] createItem backend sync notice, card safely kept locally:', err?.message || err);
        if (err?.status === 401 || err?.statusCode === 401 || err?.message?.includes('Token')) {
          clearAuthToken();
          setBackendAuthStatus('unauthenticated');
        }
      });
    }

    return newItem;
  };

  const reorderItems = (newItems: BookItem[]) => {
    setItems(newItems);
  };

  const updateItem = (id: string, data: Partial<BookItem>) => {
    let previousSnapshot: BookItem[] = [];
    setItems(prev => {
      previousSnapshot = prev;
      return prev.map(i => {
        if (i.id === id) {
          return {
            ...i,
            ...data,
            question: data.question !== undefined ? normalizeBilingualText(data.question) : i.question,
            answer: data.answer !== undefined ? normalizeBilingualText(data.answer) : i.answer,
            explanation: data.explanation !== undefined ? (data.explanation ? normalizeBilingualText(data.explanation) : '') : i.explanation,
          };
        }
        // If this is a class item mirroring the master item being updated:
        // Update content & layout, but PRESERVE student's activation, FSRS state, and review logs!
        if (i.masterItemId === id) {
          const itemBook = books.find(b => b.id === i.bookId);
          if (itemBook && (itemBook.category === 'class' || Boolean(itemBook.classId) || itemBook.id.startsWith('class-book-'))) {
            return {
              ...i,
              question: data.question !== undefined ? normalizeBilingualText(data.question) : i.question,
              answer: data.answer !== undefined ? normalizeBilingualText(data.answer) : i.answer,
              explanation: data.explanation !== undefined ? (data.explanation ? normalizeBilingualText(data.explanation) : '') : i.explanation,
              imageQ: data.imageQ !== undefined ? data.imageQ : i.imageQ,
              imageA: data.imageA !== undefined ? data.imageA : i.imageA,
              tags: data.tags !== undefined ? data.tags : i.tags,
            };
          }
        }
        return i;
      });
    });

    const token = getAuthToken();
    if (userProfile.id !== 'guest' && userProfile.backendId && token && backendAuthStatus === 'authenticated' && isValidUUID(id)) {
      const currentUid = userProfile.id;
      bookApiService.updateItem(id, {
        question: data.question,
        answer: data.answer,
        explanation: data.explanation,
        chapterId: isValidUUID(data.chapterId) ? data.chapterId : (data.chapterId === null ? null : undefined),
        tags: data.tags,
        imageQ: data.imageQ,
        imageA: data.imageA,
        order: data.order,
      }).catch(err => {
        if (loadedUserIdRef.current !== currentUid) return;
        console.warn('[BookAPI] updateItem sync notice, kept locally:', err?.message || err);
        if (err?.status === 401 || err?.statusCode === 401 || err?.message?.includes('Token')) {
          clearAuthToken();
          setBackendAuthStatus('unauthenticated');
        }
      });
    }
  };

  const deleteItem = (itemId: string) => {
    setItems(prev => prev.filter(i => {
      if (i.id === itemId) return false;
      if (i.masterItemId === itemId) {
        const itemBook = books.find(b => b.id === i.bookId);
        if (itemBook && (itemBook.category === 'class' || Boolean(itemBook.classId) || itemBook.id.startsWith('class-book-'))) {
          return false;
        }
      }
      return true;
    }));

    const token = getAuthToken();
    if (userProfile.id !== 'guest' && userProfile.backendId && token && backendAuthStatus === 'authenticated' && isValidUUID(itemId)) {
      const currentUid = userProfile.id;
      bookApiService.deleteItem(itemId).catch(err => {
        if (loadedUserIdRef.current !== currentUid) return;
        console.warn('[BookAPI] deleteItem sync notice:', err?.message || err);
        if (err?.status === 401 || err?.statusCode === 401 || err?.message?.includes('Token')) {
          clearAuthToken();
          setBackendAuthStatus('unauthenticated');
        }
      });
    }
  };

  // Library & Import/Export
  const importFromLibrary = async (libId: string) => {
    const entry = library.find(l => l.id === libId);
    if (!entry) return;

    if ((entry.book.price || 0) > 0) {
      alert(
        language === 'en'
          ? `The purchase feature for "${entry.book.title}" is currently under development. For now, this book cannot be used yet.`
          : `Fitur pembelian untuk buku "${entry.book.title}" saat ini masih dalam tahap pengembangan sehingga belum bisa digunakan.`
      );
      return;
    }

    // Check if already imported
    const alreadyImported = books.some(b => b.id === entry.book.id || b.masterBookId === entry.book.id);
    if (alreadyImported) {
      alert(language === 'en' ? 'This book is already in your Personal Space!' : 'Buku ini sudah ada di Ruang Buku Anda!');
      return;
    }

    // 1. If authenticated in backend and entry.book.id is a valid UUID, persist clone to PostgreSQL backend!
    if (userProfile.id !== 'guest' && userProfile.backendId && isValidUUID(entry.book.id)) {
      try {
        await bookApiService.importLibraryBook(entry.book.id);
        await refreshBooksFromBackend();
        return;
      } catch (backendErr) {
        console.warn('[Library] Backend importLibraryBook failed, falling back to local clone:', backendErr);
      }
    }

    // Fallback: Local in-memory clone with decoupled unique IDs
    const newBookId = crypto.randomUUID();
    const chapterIdMap = new Map<string, string>();
    const clonedChapters: Chapter[] = (entry.chapters || []).map((ch, idx) => {
      const newChapId = crypto.randomUUID();
      chapterIdMap.set(ch.id, newChapId);
      return {
        ...ch,
        id: newChapId,
        bookId: newBookId,
        masterChapterId: ch.id,
        parentId: null,
        order: ch.order || (idx + 1),
      };
    });

    // Remap parentId in hierarchy
    clonedChapters.forEach(c => {
      const orig = entry.chapters.find(oc => chapterIdMap.get(oc.id) === c.id);
      if (orig && orig.parentId && chapterIdMap.has(orig.parentId)) {
        c.parentId = chapterIdMap.get(orig.parentId) || null;
      }
    });

    const clonedItems: BookItem[] = (entry.items || []).map((it) => {
      const newItemId = crypto.randomUUID();
      return {
        ...it,
        id: newItemId,
        bookId: newBookId,
        masterItemId: it.id,
        chapterId: it.chapterId && chapterIdMap.has(it.chapterId) ? chapterIdMap.get(it.chapterId)! : null,
        isActive: false,
        status: 'inactive' as const,
        fsrsData: createInitialFSRSState(),
        reviewLogs: [],
        createdAt: new Date().toISOString(),
      };
    });

    const importedBook: Book = {
      ...entry.book,
      id: newBookId,
      userId: userProfile.id,
      masterBookId: entry.book.id,
      isPublic: false,
      isReadonly: Boolean(entry.book.isReadonly),
      isImported: true,
      category: 'imported',
      libraryEntryId: libId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setBooks(prev => [importedBook, ...prev]);
    setChapters(prev => [...prev, ...clonedChapters]);
    setItems(prev => [...prev, ...clonedItems]);
  };

  const importFromJSON = (jsonStr: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.book || !parsed.book.title) {
        return { success: false, message: 'Invalid format: missing book title.' };
      }
      const newBook: Book = {
        ...parsed.book,
        id: `book-imp-${Date.now()}`,
        isReadonly: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newChapters: Chapter[] = (parsed.chapters || []).map((ch: any, idx: number) => ({
        id: `chap-imp-${Date.now()}-${idx}`,
        bookId: newBook.id,
        title: ch.title || 'Materi',
        description: ch.description,
        order: idx + 1,
      }));

      const newItems: BookItem[] = (parsed.items || []).map((item: any, idx: number) => ({
        id: `item-imp-${Date.now()}-${idx}`,
        bookId: newBook.id,
        chapterId: newChapters[0]?.id || null,
        question: normalizeBilingualText(item.question || 'Untitled question'),
        answer: normalizeBilingualText(item.answer || 'Untitled answer'),
        explanation: item.explanation ? normalizeBilingualText(item.explanation) : (item.explanation || undefined),
        tags: item.tags || [],
        isActive: false, // inactive initially
        status: 'inactive',
        fsrsData: createInitialFSRSState(),
        reviewLogs: [],
        createdAt: new Date().toISOString(),
      }));

      setBooks(prev => [newBook, ...prev]);
      setChapters(prev => [...prev, ...newChapters]);
      setItems(prev => [...prev, ...newItems]);
      return { success: true, message: `Successfully imported "${newBook.title}" with ${newItems.length} items!` };
    } catch (e: any) {
      return { success: false, message: e.message || 'JSON parsing failed.' };
    }
  };

  
  const publishBookToLibrary = async (
    bookId: string, 
    allowEdit = false, 
    pricing?: { isPaid: boolean; price?: number }
  ) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return { success: false, message: 'Book not found' };

    const bookChapters = chapters.filter(c => c.bookId === bookId);
    const bookItems = items.filter(i => i.bookId === bookId).map(i => ({
      ...i,
      isActive: false,
      status: 'inactive' as const,
      fsrsData: { stability: 0, difficulty: 0, reps: 0, lapses: 0, state: 'new', lastReview: null, nextReview: null } as FSRSState
    }));
    
    const isPaid = Boolean(pricing?.isPaid && (pricing.price || 0) > 0);
    const priceAmount = isPaid ? (pricing?.price || 0) : 0;

    // Check if book was already published in library -> update existing library entry
    const existingEntryIndex = library.findIndex(l => l.book?.id === bookId || l.id === bookId);
    if (existingEntryIndex >= 0) {
      const updatedEntry: LibraryEntry = {
        ...library[existingEntryIndex],
        title: book.title,
        curator: book.authorName || 'Penulis Pribadi',
        book: {
          ...book,
          isReadonly: !allowEdit,
          price: priceAmount,
          isPublic: true,
        },
        chapters: bookChapters,
        items: bookItems,
      };

      if (userProfile.id !== 'guest' && userProfile.backendId && isValidUUID(bookId)) {
        try {
          await bookApiService.updateBook(bookId, { isPublic: true, isReadonly: !allowEdit });
        } catch (err: any) {
          console.error('[BookAPI] publishBookToLibrary error updating isPublic in DB:', err);
        }
      }

      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, isPublic: true, isReadonly: false } : b));

      setLibrary(prev => {
        const next = [...prev];
        next[existingEntryIndex] = updatedEntry;
        return next;
      });

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const ch = new BroadcastChannel('unlupa_class_sync');
          ch.postMessage({ type: 'LIBRARY_BOOK_UPDATED', bookId });
          setTimeout(() => ch.close(), 1000);
        } catch (bcErr) {}
      }

      await refreshLibraryFromBackend();

      return {
        success: true,
        message: language === 'en'
          ? 'Book publication & license updated successfully!'
          : 'Pengaturan publikasi & lisensi kitab di Pustaka berhasil diperbarui!'
      };
    }
    
    const newEntry = {
      id: `lib-${Date.now()}`,
      title: book.title,
      description: book.description || 'Community published book',
      category: book.category || 'Community',
      curator: book.authorName || 'Penulis Pribadi',
      downloads: 0,
      rating: 5.0,
      verified: true,
      book: { 
        ...book, 
        isReadonly: !allowEdit,
        price: priceAmount,
        isPublic: true
      },
      chapters: bookChapters,
      items: bookItems,
      tags: ['community']
    };

    // 1. Persist isPublic: true and allowEdit permission setting to PostgreSQL backend if authenticated
    if (userProfile.id !== 'guest' && userProfile.backendId && isValidUUID(bookId)) {
      try {
        await bookApiService.updateBook(bookId, { isPublic: true, isReadonly: !allowEdit });
      } catch (err: any) {
        console.error('[BookAPI] publishBookToLibrary error updating isPublic in DB:', err);
      }
    }

    // 2. Update local books state so this book is marked isPublic: true, while author ALWAYS retains edit access (isReadonly: false)
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, isPublic: true, isReadonly: false } : b));
    
    setLibrary(prev => [newEntry, ...prev]);

    // 4. Refresh authoritative library from backend and broadcast
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const ch = new BroadcastChannel('unlupa_class_sync');
        ch.postMessage({ type: 'LIBRARY_BOOK_UPDATED', bookId });
        setTimeout(() => ch.close(), 1000);
      } catch (bcErr) {}
    }
    await refreshLibraryFromBackend();

    return { 
      success: true, 
      message: language === 'en' 
        ? 'Alhamdulillah, book successfully published to Library!' 
        : 'Alhamdulillah, kitab berhasil dipublikasikan ke Pustaka!' 
    };
  };

  const exportBookJSON = (bookId: string): string => {
    const book = books.find(b => b.id === bookId);
    if (!book) return '{}';
    const bookChapters = chapters.filter(c => c.bookId === bookId);
    const bookItems = items.filter(i => i.bookId === bookId);
    return JSON.stringify({
      version: '2.0',
      exportedAt: new Date().toISOString(),
      book,
      chapters: bookChapters,
      items: bookItems,
    }, null, 2);
  };

  // Classes Operations
  


  const joinClassByCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: language === 'en' ? 'Class code cannot be empty.' : 'Kode kelas tidak boleh kosong.' };
    }

    // 1. Try finding and joining via PostgreSQL backend first!
    let targetClass: ClassGroup | null = null;
    let backendErrorMessage: string | null = null;
    if (userProfile.id !== 'guest' && userProfile.backendId) {
      try {
        const backendJoined = await classApiService.joinClassByCode(cleanCode);
        if (backendJoined) {
          targetClass = backendJoined;
        }
      } catch (apiErr: any) {
        if (apiErr?.status === 400 && (apiErr?.code === 'ALREADY_JOINED' || apiErr?.message?.includes('sudah bergabung'))) {
          return { success: false, message: language === 'en' ? 'You have already joined this class.' : 'Anda sudah bergabung di kelas ini.' };
        }
        if (apiErr?.status === 400 && (apiErr?.code === 'CLASS_CLOSED' || apiErr?.message?.includes('ditutup'))) {
          return { success: false, message: language === 'en' ? 'This class has been closed by the teacher.' : 'Kelas ini telah ditutup oleh pengajar.' };
        }
        if (apiErr?.status === 404) {
          // If not found in PostgreSQL, allow checking local or Firestore below
        } else {
          console.warn('[Classes] Backend join error:', apiErr);
          backendErrorMessage = apiErr?.message || null;
        }
      }
    }

    // Fallback: local teachingClasses
    if (!targetClass) {
      targetClass = teachingClasses.find(c => c.code.toUpperCase() === cleanCode) || null;
    }
    
    if (!targetClass) {
      return { 
        success: false, 
        message: backendErrorMessage || (language === 'en' ? 'Class not found.' : 'Kelas tidak ditemukan.') 
      };
    }

    // 2. Check if user is already in that class
    const alreadyEnrolled = myClasses.some(c => c.id === targetClass!.id) || (targetClass.students || []).some(s => s.quranSpaceCode === quranSpaceCode || s.id === `std-user-${userProfile.id}`);
    if (alreadyEnrolled) {
      return { success: false, message: language === 'en' ? 'You have already joined this class.' : 'Anda sudah bergabung di kelas ini.' };
    }

    // 3. Create student representation of the current user
    let userStudent: ClassStudent;

    let studentClassRecord = { ...targetClass };

    if (targetClass.type === 'non-quran') {
      const assignedIds = targetClass.assignedBookIds && targetClass.assignedBookIds.length > 0 
        ? targetClass.assignedBookIds 
        : ['book-1'];

      const studentClassBookIds: string[] = [];
      const newClassBooks: Book[] = [];
      const newClassChapters: Chapter[] = [];
      const newClassItems: BookItem[] = [];

      for (const masterBookId of assignedIds) {
        // 1. Look in class's embedded assignedBooksData (best for cross-user custom books)
        let bookPkg = targetClass.assignedBooksData?.find((p: any) => p.book?.id === masterBookId);
        let masterBook = bookPkg?.book || books.find(b => b.id === masterBookId) || INITIAL_BOOKS.find(b => b.id === masterBookId);
        let sourceChapters = bookPkg?.chapters || chapters.filter(c => c.bookId === masterBookId);
        if (sourceChapters.length === 0) {
          sourceChapters = INITIAL_CHAPTERS.filter(c => c.bookId === masterBookId);
        }
        let sourceItems = bookPkg?.items || items.filter(i => i.bookId === masterBookId);
        if (sourceItems.length === 0) {
          sourceItems = INITIAL_ITEMS.filter(i => i.bookId === masterBookId);
        }

        if (!masterBook) continue;

        const classBookId = `class-book-${targetClass.id}-${masterBook.id}`;
        studentClassBookIds.push(classBookId);

        const classBook: Book = {
          ...masterBook,
          id: classBookId,
          classId: targetClass.id,
          masterBookId: masterBook.id,
          userId: userProfile.id,
          category: 'class',
          isReadonly: true,
          isPublic: false,
          authorName: `${targetClass.name} • ${targetClass.teacherName || 'Pengajar'}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        newClassBooks.push(classBook);

        const classChaptersList: Chapter[] = sourceChapters.map((mc: any) => ({
          id: `class-chap-${targetClass.id}-${mc.id}`,
          masterChapterId: mc.id,
          bookId: classBookId,
          title: mc.title,
          description: mc.description,
          order: mc.order,
          parentId: mc.parentId ? `class-chap-${targetClass.id}-${mc.parentId}` : null,
        }));
        newClassChapters.push(...classChaptersList);

        const classItemsList: BookItem[] = sourceItems.map((mi: any) => ({
          id: `class-item-${targetClass.id}-${mi.id}`,
          masterItemId: mi.id,
          bookId: classBookId,
          chapterId: mi.chapterId ? `class-chap-${targetClass.id}-${mi.chapterId}` : null,
          question: mi.question,
          answer: mi.answer,
          imageQ: mi.imageQ,
          imageA: mi.imageA,
          tags: mi.tags || [],
          isActive: false,                    // Clean fresh learning state starting from 0!
          status: 'inactive' as const,        // Clean fresh learning state!
          fsrsData: createInitialFSRSState(), // Clean fresh learning state!
          reviewLogs: [],                     // Clean fresh learning state!
          createdAt: new Date().toISOString(),
        }));
        newClassItems.push(...classItemsList);
      }

      // Inject the class books, chapters, and items into student workspace without modifying personal books
      setBooks(prev => {
        const withoutOldClassBooks = prev.filter(b => !studentClassBookIds.includes(b.id));
        return [...newClassBooks, ...withoutOldClassBooks];
      });
      setChapters(prev => {
        const withoutOldClassChapters = prev.filter(c => !studentClassBookIds.includes(c.bookId));
        return [...withoutOldClassChapters, ...newClassChapters];
      });
      setItems(prev => {
        const withoutOldClassItems = prev.filter(i => !studentClassBookIds.includes(i.bookId));
        return [...withoutOldClassItems, ...newClassItems];
      });

      studentClassRecord.assignedBookIds = studentClassBookIds;

      userStudent = {
        id: `std-user-${userProfile.id}`,
        quranSpaceCode: quranSpaceCode,
        name: userProfile.fullName || 'Santri',
        email: userProfile.email,
        avatarUrl: userProfile.avatarUrl,
        activeItemsCount: 0,
        dueTodayCount: 0,
        averageStability: 0,
        retentionRate: 92,
        lastActive: 'Baru saja bergabung',
        frequentStruggles: [],
        bookItemsData: newClassItems,
        teacherFeedbacks: [],
      };

    } else {
      const activePages = quranPages.filter(p => p.isActive);
      const duePages = quranPages.filter(p => isDue(p.fsrsData.nextReview, p.isActive, p.fsrsData.lastReview));
      const avgStability = activePages.length > 0 
        ? Number((activePages.reduce((acc, p) => acc + p.fsrsData.stability, 0) / activePages.length).toFixed(1))
        : 0;

      userStudent = {
        id: `std-user-${userProfile.id}`,
        quranSpaceCode: quranSpaceCode,
        name: userProfile.fullName || 'Santri',
        email: userProfile.email,
        avatarUrl: userProfile.avatarUrl,
        activeItemsCount: activePages.length,
        dueTodayCount: duePages.length,
        averageStability: avgStability,
        retentionRate: 95,
        lastActive: 'Baru saja aktif',
        frequentStruggles: [],
        quranData: quranPages,
        teacherFeedbacks: [],
      };
    }

    // 4. Add student to target class in teachingClasses if teacher is current user
    if (targetClass.teacherId === userProfile.id) {
      setTeachingClasses(prev => prev.map(cls => {
        if (cls.id !== targetClass.id) return cls;
        return {
          ...cls,
          students: [userStudent, ...cls.students]
        };
      }));
    }

    // 5. CRITICAL: Add class to student's myClasses so it appears in "Kelas Saya"
    setMyClasses(prev => {
      if (prev.some(c => c.id === studentClassRecord.id)) return prev;
      return [studentClassRecord, ...prev];
    });

    return { 
      success: true, 
      message: language === 'en' 
        ? `Successfully joined class "${targetClass.name}"!` 
        : `Berhasil bergabung dengan kelas "${targetClass.name}"!` 
    };
  };

  const createTeachingClass = async (data: { 
    name: string; 
    type: 'quran' | 'non-quran'; 
    description?: string; 
    coverUrl?: string;
    code?: string;
    requiredJuzList?: number[];
    assignedBookIds?: string[];
  }): Promise<ClassGroup> => {
    const isPro = userProfile.plan === 'premium' || userProfile.plan === 'institutional' || userProfile.role === 'admin' || userProfile.role === 'superadmin';
    if (!isPro) {
      const limits = tierConfig.freeTier;
      if (data.type === 'quran') {
        const quranCount = teachingClasses.filter(c => c.type === 'quran').length;
        const maxQuran = limits.maxQuranClasses ?? 1;
        if (quranCount >= maxQuran) {
          throw new Error(language === 'en'
            ? `Free accounts are limited to ${maxQuran} Al-Qur'an class.`
            : `Batas akun Free adalah maksimal ${maxQuran} kelas Al-Qur'an. Upgrade ke Pro untuk membuat lebih banyak kelas.`);
        }
      } else {
        const nonQuranCount = teachingClasses.filter(c => c.type !== 'quran').length;
        const maxNonQuran = limits.maxNonQuranClasses ?? 1;
        if (nonQuranCount >= maxNonQuran) {
          throw new Error(language === 'en'
            ? `Free accounts are limited to ${maxNonQuran} Kitab/Materi class.`
            : `Batas akun Free adalah maksimal ${maxNonQuran} kelas Non-Qur'an (Kitab). Upgrade ke Pro untuk membuat lebih banyak kelas.`);
        }
      }
    }

    const rawCode = data.code?.trim().toUpperCase();
    const finalCode = rawCode || `${data.type === 'quran' ? 'QRN' : 'CLS'}-${Math.floor(1000 + Math.random() * 9000)}`;

    // For non-quran (Kitab) classes: bundle the complete book package!
    let assignedBooksData: AssignedBookData[] | undefined = undefined;
    if (data.type === 'non-quran') {
      const bIds = data.assignedBookIds && data.assignedBookIds.length > 0 
        ? data.assignedBookIds 
        : [books[0]?.id].filter(Boolean);
      
      assignedBooksData = bIds.map(bId => {
        const foundBook = books.find(b => b.id === bId) || INITIAL_BOOKS.find(b => b.id === bId);
        if (!foundBook) return null;
        const bChaps = chapters.filter(c => c.bookId === bId);
        const bItems = items.filter(i => i.bookId === bId);
        return {
          book: foundBook,
          chapters: bChaps.length > 0 ? bChaps : INITIAL_CHAPTERS.filter(c => c.bookId === bId),
          items: bItems.length > 0 ? bItems : INITIAL_ITEMS.filter(i => i.bookId === bId),
        };
      }).filter(Boolean) as AssignedBookData[];
    }

    let newClass: ClassGroup;
    if (userProfile.id !== 'guest' && userProfile.backendId) {
      try {
        const backendCreated = await classApiService.createClass({
          name: data.name.trim(),
          type: data.type,
          code: finalCode,
          description: data.description?.trim() || '',
          coverUrl: data.coverUrl,
          requiredJuzList: data.type === 'quran' ? (data.requiredJuzList || [1, 2, 3, 4, 5]) : undefined,
          assignedBookIds: data.type === 'non-quran' ? (data.assignedBookIds || [books[0]?.id].filter(Boolean)) : undefined,
          assignedBooksData: assignedBooksData,
        });

        newClass = {
          ...backendCreated,
          assignedBooksData: assignedBooksData || backendCreated.assignedBooksData,
        };
      } catch (backendErr: any) {
        if (backendErr?.status === 403 || backendErr?.code === 'QUOTA_EXCEEDED') {
          throw new Error(backendErr.message || 'Batas kelas akun tercapai.');
        }
        console.warn('[Classes] Failed to create class on PostgreSQL backend, fallback to local:', backendErr);
        newClass = {
          id: `cls-${Date.now()}`,
          teacherId: userProfile.id,
          teacherName: userProfile.fullName,
          name: data.name,
          code: finalCode,
          type: data.type,
          description: data.description || '',
          coverUrl: data.coverUrl,
          requiredJuzList: data.type === 'quran' ? (data.requiredJuzList || [1, 2, 3, 4, 5]) : undefined,
          assignedBookIds: data.type === 'non-quran' ? (data.assignedBookIds || [books[0]?.id].filter(Boolean)) : undefined,
          assignedBooksData: assignedBooksData,
          students: [],
          createdAt: new Date().toISOString(),
        };
      }
    } else {
      newClass = {
        id: `cls-${Date.now()}`,
        teacherId: userProfile.id,
        teacherName: userProfile.fullName,
        name: data.name,
        code: finalCode,
        type: data.type,
        description: data.description || '',
        coverUrl: data.coverUrl,
        requiredJuzList: data.type === 'quran' ? (data.requiredJuzList || [1, 2, 3, 4, 5]) : undefined,
        assignedBookIds: data.type === 'non-quran' ? (data.assignedBookIds || [books[0]?.id].filter(Boolean)) : undefined,
        assignedBooksData: assignedBooksData,
        students: [],
        createdAt: new Date().toISOString(),
      };
    }
    setTeachingClasses(prev => [newClass, ...prev]);
    return newClass;
  };

  const { triggerClassCleanup } = useClassCleanup({
    teachingClasses,
    setTeachingClasses,
    myClasses,
    setMyClasses,
    books,
    setBooks,
    chapters,
    setChapters,
    items,
    setItems,
    editingClassBookId,
    setEditingClassBookId,
  });

  const deleteTeachingClass = (classId: string) => {
    classApiService.deleteClass(classId).catch(err => console.warn('[Classes] Backend delete notice:', err));
    triggerClassCleanup(classId, { action: 'delete' });
  };

  const closeTeachingClass = (classId: string) => {
    classApiService.updateClass(classId, { status: 'closed' }).catch(err => console.warn('[Classes] Backend close notice:', err));
    triggerClassCleanup(classId, { action: 'close' });
  };

  const reopenTeachingClass = (classId: string) => {
    classApiService.updateClass(classId, { status: 'active' }).catch(err => console.warn('[Classes] Backend reopen notice:', err));
    setTeachingClasses(prev => prev.map(c => c.id === classId ? { ...c, status: 'active', closedAt: undefined } : c));
  };

  const updateTeachingClass = (id: string, data: Partial<ClassGroup>) => {
    classApiService.updateClass(id, data as any).catch(err => console.warn('[Classes] Backend update notice:', err));
    setTeachingClasses(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const leaveClass = (classId: string) => {
    classApiService.leaveClass(classId).catch(err => console.warn('[Classes] Backend leave notice:', err));
    setMyClasses(prev => prev.filter(c => c.id !== classId));
    setBooks(prev => prev.filter(b => b.classId !== classId && !b.id.startsWith(`class-book-${classId}-`)));
    setChapters(prev => prev.filter(c => !c.bookId.startsWith(`class-book-${classId}-`)));
    setItems(prev => prev.filter(i => !i.bookId.startsWith(`class-book-${classId}-`)));

    setTeachingClasses(prev => prev.map(cls => {
      if (cls.id !== classId) return cls;
      return {
        ...cls,
        students: cls.students.filter(s => s.quranSpaceCode !== quranSpaceCode && s.id !== `std-user-${userProfile.id}`)
      };
    }));
  };

  const removeStudentFromClass = (classId: string, studentId: string) => {
    classApiService.removeStudent(classId, studentId).catch(err => console.warn('[Classes] Backend remove student notice:', err));
    setTeachingClasses(prev => prev.map(cls => {
      if (cls.id !== classId) return cls;
      return {
        ...cls,
        students: cls.students.filter(s => s.id !== studentId)
      };
    }));

    // If the student being removed is the current user, remove from myClasses and clean up class books
    if (studentId === `std-user-${userProfile.id}`) {
      setMyClasses(prev => prev.filter(c => c.id !== classId));
      setBooks(prev => prev.filter(b => b.classId !== classId && !b.id.startsWith(`class-book-${classId}-`)));
      setChapters(prev => prev.filter(c => !c.bookId.startsWith(`class-book-${classId}-`)));
      setItems(prev => prev.filter(i => !i.bookId.startsWith(`class-book-${classId}-`)));
    }
  };

  const ensureStudentQuranData = (std: ClassStudent): QuranPageItem[] => {
    if (std.quranData && std.quranData.length >= 604) {
      return std.quranData;
    }
    const live = getLiveStudentQuranData(std.id);
    if (live && live.length >= 604) {
      return live;
    }
    if (std.quranData && std.quranData.length > 0) {
      const activeNums = std.quranData.filter(p => p.isActive).map(p => p.pageNumber);
      const dueNums = std.quranData.filter(p => isDue(p.fsrsData.nextReview, p.isActive, p.fsrsData.lastReview)).map(p => p.pageNumber);
      return createSampleStudentQuranPages(activeNums, dueNums);
    }
    return generateCleanQuranPages();
  };

  const activateStudentQuranPage = (classId: string, studentId: string, pageNumber: number) => {
    if (studentId === `std-user-${userProfile.id}`) {
      activateQuranPage(pageNumber);
    }
    if (studentId && !studentId.startsWith('sample-')) {
      classApiService.activateStudentQuranPage(classId, studentId, pageNumber).catch(err => {
        console.warn('[Sync] Backend student activate page error:', err);
      });
    }
    setTeachingClasses(prev => prev.map(cls => {
      if (cls.id !== classId) return cls;
      return {
        ...cls,
        students: cls.students.map(std => {
          if (std.id !== studentId) return std;
          const pages = ensureStudentQuranData(std);
          const newPages = pages.map(p => {
            if (p.pageNumber !== pageNumber) return p;
            return {
              ...p,
              isActive: true,
              status: 'active' as const,
              fsrsData: {
                stability: 0,
                difficulty: 10,
                reps: 0,
                lapses: 0,
                lastReview: null,
                nextReview: new Date().toISOString(),
                state: 'new' as const,
              }
            };
          });
          const activeCount = newPages.filter(p => p.isActive).length;
          return {
            ...std,
            quranData: newPages,
            activeItemsCount: activeCount,
          };
        })
      };
    }));
  };

  const deactivateStudentQuranPage = (classId: string, studentId: string, pageNumber: number) => {
    if (studentId === `std-user-${userProfile.id}`) {
      deactivateQuranPage(pageNumber);
    }
    if (studentId && !studentId.startsWith('sample-')) {
      classApiService.deactivateStudentQuranPage(classId, studentId, pageNumber).catch(err => {
        console.warn('[Sync] Backend student deactivate page error:', err);
      });
    }
    setTeachingClasses(prev => prev.map(cls => {
      if (cls.id !== classId) return cls;
      return {
        ...cls,
        students: cls.students.map(std => {
          if (std.id !== studentId) return std;
          const pages = ensureStudentQuranData(std);
          const newPages = pages.map(p => {
            if (p.pageNumber !== pageNumber) return p;
            return {
              ...p,
              isActive: false,
              status: 'inactive' as const,
            };
          });
          const activeCount = newPages.filter(p => p.isActive).length;
          return {
            ...std,
            quranData: newPages,
            activeItemsCount: activeCount,
          };
        })
      };
    }));
  };

  const bypassStudentQuranPageMapan = (classId: string, studentId: string, pageNumber: number) => {
    if (studentId === `std-user-${userProfile.id}`) {
      bypassQuranPageToMapan(pageNumber);
    }
    setTeachingClasses(prev => prev.map(cls => {
      if (cls.id !== classId) return cls;
      return {
        ...cls,
        students: cls.students.map(std => {
          if (std.id !== studentId) return std;
          const pages = ensureStudentQuranData(std);
          const newPages = pages.map(p => {
            if (p.pageNumber !== pageNumber) return p;
            const now = new Date();
            const future = new Date(now.getTime() + 300 * 86400000);
            return {
              ...p,
              isActive: true,
              status: 'mastered_for_now' as const,
              mapanCelebrated: true,
              fsrsData: {
                ...p.fsrsData,
                stability: 745.0,
                difficulty: 1.0,
                reps: Math.max(p.fsrsData.reps, 15),
                lastReview: now.toISOString(),
                nextReview: future.toISOString(),
                state: 'mastered' as const,
              }
            };
          });
          return { ...std, quranData: newPages };
        })
      };
    }));
  };

  const resetStudentQuranPageMapan = (classId: string, studentId: string, pageNumber: number) => {
    if (studentId === `std-user-${userProfile.id}`) {
      resetQuranPageMapan(pageNumber);
    }
    setTeachingClasses(prev => prev.map(cls => {
      if (cls.id !== classId) return cls;
      return {
        ...cls,
        students: cls.students.map(std => {
          if (std.id !== studentId) return std;
          const pages = ensureStudentQuranData(std);
          const newPages = pages.map(p => {
            if (p.pageNumber !== pageNumber) return p;
            return {
              ...p,
              status: 'active' as const,
              mapanCelebrated: false,
              fsrsData: {
                ...p.fsrsData,
                stability: 1.0,
                difficulty: 10.0,
                nextReview: new Date().toISOString(),
                state: 'review' as const,
              }
            };
          });
          return { ...std, quranData: newPages };
        })
      };
    }));
  };

  const reviewStudentQuranPage = (classId: string, studentId: string, pageNumber: number, rating: 1 | 2 | 3, note?: string) => {
    // If it's the current user, we can actually review the page!
    if (studentId === `std-user-${userProfile.id}`) {
      reviewQuranPage(pageNumber, rating);
    }
    
    // Create feedback
    const defaultNote = rating === 3 ? 'Lancar Mutqin' : rating === 2 ? 'Lancar' : 'Belum / Perlu Ulang';
    if (studentId && !studentId.startsWith('sample-')) {
      classApiService.reviewStudentQuranPage(classId, studentId, pageNumber, {
        rating,
        notes: note || defaultNote,
      }).catch(err => {
        console.warn('[Sync] Backend student review page error:', err);
      });
    }
    const feedback: import('../types').QuranFeedbackItem = {
      id: `fb-${Date.now()}`,
      date: new Date().toISOString(),
      pageNumber,
      rating,
      note: note || defaultNote,
      teacherName: userProfile.fullName
    };
    
    setTeacherFeedbacks(prev => [feedback, ...prev]);

    setTeachingClasses(prev => prev.map(cls => {
      if (cls.id !== classId) return cls;
      return {
        ...cls,
        students: cls.students.map(std => {
          if (std.id !== studentId) return std;
          
          const pages = ensureStudentQuranData(std);
          // Apply FSRS rating directly to the student's quranData
          const newQuranData = pages.map(p => {
            if (p.pageNumber !== pageNumber) return p;
            const res = updateQuranFSRS(p.fsrsData, rating, new Date(), p.mapanSchedule);
            return {
              ...p,
              status: (res.isMasteredForNow ? 'mastered_for_now' : 'active') as 'mastered_for_now' | 'active',
              fsrsData: res.newState,
            };
          });

          // Recalculate derived stats
          const activePages = newQuranData.filter(p => p.isActive);
          const activeItemsCount = activePages.length;
          const dueTodayCount = activePages.filter(p => isDue(p.fsrsData?.nextReview, p.isActive, p.fsrsData?.lastReview)).length;
          const avgStability = activePages.length > 0 
            ? Math.round(activePages.reduce((acc, p) => acc + (p.fsrsData.stability || 0), 0) / activePages.length)
            : 0;

          return {
            ...std,
            quranData: newQuranData,
            activeItemsCount,
            dueTodayCount,
            averageStability: avgStability,
            teacherFeedbacks: [feedback, ...(std.teacherFeedbacks || [])]
          };
        })
      };
    }));
  };

  const addStudentDailyFeedback = (classId: string, studentId: string, note: string) => {
    const feedback: import('../types').QuranFeedbackItem = {
      id: `fb-${Date.now()}`,
      date: new Date().toISOString(),
      note,
      teacherName: userProfile.fullName
    };
    
    setTeacherFeedbacks(prev => [feedback, ...prev]);

    setTeachingClasses(prev => prev.map(cls => {
      if (cls.id !== classId) return cls;
      return {
        ...cls,
        students: cls.students.map(std => {
          if (std.id !== studentId) return std;
          return {
            ...std,
            teacherFeedbacks: [feedback, ...(std.teacherFeedbacks || [])]
          };
        })
      };
    }));
  };

  const ensureStudentBookData = (std: ClassStudent, bookId: string): BookItem[] => {
    const masterItems = items.filter(i => i.bookId === bookId);
    const sourcePool = masterItems.length > 0 ? masterItems : INITIAL_ITEMS.filter(i => i.bookId === bookId);
    
    if (std.bookItemsData && std.bookItemsData.length > 0) {
      const stdMap = new Map<string, BookItem>(std.bookItemsData.map(i => [i.id, i]));
      return sourcePool.map(masterItem => {
        const stdItem = stdMap.get(masterItem.id);
        if (stdItem) {
          return {
            ...masterItem,
            isActive: stdItem.isActive,
            status: stdItem.status,
            fsrsData: stdItem.fsrsData,
            reviewLogs: stdItem.reviewLogs || []
          };
        }
        return {
          ...masterItem,
          isActive: false,
          status: 'inactive' as const,
          fsrsData: createInitialFSRSState(),
          reviewLogs: []
        };
      });
    }
    return createSampleStudentBookItems(sourcePool.length > 0 ? sourcePool : INITIAL_ITEMS, std.activeItemsCount || 15, std.dueTodayCount || 0);
  };

  const activateStudentBookItem = (classId: string, studentId: string, itemId: string) => {
    if (studentId === `std-user-${userProfile.id}`) {
      activateItem(itemId);
    }
    setTeachingClasses(prev => prev.map(cls => {
      if (cls.id !== classId) return cls;
      const assignedBookId = cls.assignedBookIds?.[0] || books[0]?.id || 'book-1';
      return {
        ...cls,
        students: cls.students.map(std => {
          if (std.id !== studentId) return std;
          const bookItems = ensureStudentBookData(std, assignedBookId);
          const updatedItems = bookItems.map(i => {
            if (i.id !== itemId) return i;
            return {
              ...i,
              isActive: true,
              status: i.status === 'inactive' ? 'active' as const : i.status,
              fsrsData: {
                ...i.fsrsData,
                nextReview: new Date().toISOString(),
                state: i.fsrsData.reps > 0 ? 'review' as const : 'new' as const,
              }
            };
          });
          const activeCount = updatedItems.filter(i => i.isActive).length;
          const dueCount = updatedItems.filter(i => isDue(i.fsrsData?.nextReview, i.isActive, i.fsrsData?.lastReview)).length;
          return {
            ...std,
            bookItemsData: updatedItems,
            activeItemsCount: activeCount,
            dueTodayCount: dueCount,
          };
        })
      };
    }));
  };

  const deactivateStudentBookItem = (classId: string, studentId: string, itemId: string) => {
    if (studentId === `std-user-${userProfile.id}`) {
      deactivateItem(itemId);
    }
    setTeachingClasses(prev => prev.map(cls => {
      if (cls.id !== classId) return cls;
      const assignedBookId = cls.assignedBookIds?.[0] || books[0]?.id || 'book-1';
      return {
        ...cls,
        students: cls.students.map(std => {
          if (std.id !== studentId) return std;
          const bookItems = ensureStudentBookData(std, assignedBookId);
          const updatedItems = bookItems.map(i => {
            if (i.id !== itemId) return i;
            return {
              ...i,
              isActive: false,
              status: 'inactive' as const,
            };
          });
          const activeCount = updatedItems.filter(i => i.isActive).length;
          const dueCount = updatedItems.filter(i => isDue(i.fsrsData?.nextReview, i.isActive, i.fsrsData?.lastReview)).length;
          return {
            ...std,
            bookItemsData: updatedItems,
            activeItemsCount: activeCount,
            dueTodayCount: dueCount,
          };
        })
      };
    }));
  };

  const bypassStudentBookItemMapan = (classId: string, studentId: string, itemId: string) => {
    setTeachingClasses(prev => prev.map(cls => {
      if (cls.id !== classId) return cls;
      const assignedBookId = cls.assignedBookIds?.[0] || books[0]?.id || 'book-1';
      return {
        ...cls,
        students: cls.students.map(std => {
          if (std.id !== studentId) return std;
          const bookItems = ensureStudentBookData(std, assignedBookId);
          const now = new Date();
          const future = new Date(now.getTime() + 320 * 86400000);
          const updatedItems = bookItems.map(i => {
            if (i.id !== itemId) return i;
            return {
              ...i,
              isActive: true,
              status: 'mastered' as const,
              fsrsData: {
                ...i.fsrsData,
                stability: 365.0,
                difficulty: 3.0,
                reps: Math.max(i.fsrsData.reps, 10),
                lastReview: now.toISOString(),
                nextReview: future.toISOString(),
                state: 'mastered' as const,
              }
            };
          });
          return {
            ...std,
            bookItemsData: updatedItems,
          };
        })
      };
    }));
  };

  const resetStudentBookItemMapan = (classId: string, studentId: string, itemId: string) => {
    setTeachingClasses(prev => prev.map(cls => {
      if (cls.id !== classId) return cls;
      const assignedBookId = cls.assignedBookIds?.[0] || books[0]?.id || 'book-1';
      return {
        ...cls,
        students: cls.students.map(std => {
          if (std.id !== studentId) return std;
          const bookItems = ensureStudentBookData(std, assignedBookId);
          const updatedItems = bookItems.map(i => {
            if (i.id !== itemId) return i;
            return {
              ...i,
              status: 'active' as const,
              fsrsData: {
                ...i.fsrsData,
                stability: 1.0,
                difficulty: 5.0,
                nextReview: new Date().toISOString(),
                state: 'review' as const,
              }
            };
          });
          return {
            ...std,
            bookItemsData: updatedItems,
          };
        })
      };
    }));
  };

  const reviewStudentBookItem = (classId: string, studentId: string, itemId: string, rating: 1 | 2 | 3 | 4, note?: string) => {
    const cleanStudentId = studentId.replace(/^std-user-/, '').replace(/^user-/, '');
    const backendItemId = resolveBackendItemId(itemId);

    const isMatchingItem = (i: BookItem) => {
      if (i.id === itemId) return true;
      if (i.masterItemId && i.masterItemId === itemId) return true;
      if (backendItemId && (i.id === backendItemId || i.masterItemId === backendItemId)) return true;
      const iBack = resolveBackendItemId(i.id);
      if (backendItemId && iBack && iBack === backendItemId) return true;
      return false;
    };

    if (cleanStudentId === userProfile.id.replace(/^std-user-/, '').replace(/^user-/, '')) {
      reviewItem(itemId, rating);
    }

    const ratingLabels: Record<number, string> = {
      1: 'Perlu Belajar Ulang (Again)',
      2: 'Masih Sulit (Hard)',
      3: 'Sudah Paham (Good)',
      4: 'Sangat Menguasai (Easy)'
    };
    const feedback: QuranFeedbackItem = {
      id: `fb-book-${Date.now()}`,
      date: new Date().toISOString(),
      rating: rating >= 3 ? 2 : 1,
      note: note || `Review Guru: ${ratingLabels[rating]}`,
      teacherName: userProfile.fullName,
    };

    setTeacherFeedbacks(prev => [feedback, ...prev]);

    // Find current FSRS state for this item
    const targetCls = teachingClasses.find(c => c.id === classId);
    const targetStd = targetCls?.students?.find(s => s.id === studentId || s.id === cleanStudentId || s.id === `std-user-${cleanStudentId}`);
    const existingItem = targetStd?.bookItemsData?.find(isMatchingItem) || items.find(isMatchingItem);
    const { newState, nextIntervalDays } = updateNonQuranFSRS(existingItem?.fsrsData, rating);
    const isMastered = nextIntervalDays >= 375;
    const newLog = {
      id: Math.random().toString(36).substring(7),
      date: new Date().toISOString(),
      rating,
      wasDue: true,
    };

    setTeachingClasses(prev => prev.map(cls => {
      if (cls.id !== classId) return cls;
      const assignedBookId = cls.assignedBookIds?.[0] || books[0]?.id || 'book-1';
      return {
        ...cls,
        students: cls.students.map(std => {
          if (std.id !== studentId && std.id !== cleanStudentId && std.id !== `std-user-${cleanStudentId}`) return std;

          const currentList: BookItem[] = (Array.isArray(std.bookItemsData) && std.bookItemsData.length > 0)
            ? [...std.bookItemsData]
            : ensureStudentBookData(std, assignedBookId);

          let matched = false;
          const updatedItems = currentList.map(i => {
            if (isMatchingItem(i)) {
              matched = true;
              return {
                ...i,
                isActive: true,
                status: isMastered ? 'mastered' as const : 'active' as const,
                fsrsData: newState,
                reviewLogs: [...(i.reviewLogs || []), newLog].slice(-100),
              };
            }
            return i;
          });

          if (!matched) {
            const baseCard = items.find(isMatchingItem);
            if (baseCard) {
              updatedItems.push({
                ...baseCard,
                isActive: true,
                status: isMastered ? 'mastered' as const : 'active' as const,
                fsrsData: newState,
                reviewLogs: [newLog],
              });
            }
          }

          const activeCount = updatedItems.filter(i => i.isActive).length;
          const dueCount = updatedItems.filter(i => isDue(i.fsrsData?.nextReview, i.isActive, i.fsrsData?.lastReview)).length;
          const avgStability = activeCount > 0
            ? Math.round(updatedItems.filter(i => i.isActive).reduce((acc, i) => acc + (i.fsrsData.stability || 0), 0) / activeCount)
            : 0;

          return {
            ...std,
            bookItemsData: updatedItems,
            activeItemsCount: activeCount,
            dueTodayCount: dueCount,
            averageStability: avgStability,
            teacherFeedbacks: [feedback, ...(std.teacherFeedbacks || [])]
          };
        })
      };
    }));

    // Local cached items update for student if on this machine
    try {
      const cached = localStorage.getItem(getUserKey(cleanStudentId, 'items'));
      if (cached) {
        const parsed: BookItem[] = JSON.parse(cached);
        const updatedLocal = parsed.map(localItem => {
          if (isMatchingItem(localItem)) {
            return {
              ...localItem,
              isActive: true,
              status: isMastered ? 'mastered' as const : 'active' as const,
              fsrsData: newState,
              reviewLogs: [...(localItem.reviewLogs || []), newLog].slice(-100),
            };
          }
          return localItem;
        });
        localStorage.setItem(getUserKey(cleanStudentId, 'items'), JSON.stringify(updatedLocal));
      }
    } catch (e) { /* ignore */ }

    // If student is currently active user, update items state
    if (userProfile.id === cleanStudentId) {
      setItems(prev => prev.map(item => isMatchingItem(item) ? {
        ...item,
        isActive: true,
        status: isMastered ? 'mastered' : 'active',
        fsrsData: newState,
        reviewLogs: [...(item.reviewLogs || []), newLog].slice(-100),
      } : item));
    }

    // Broadcast realtime update to other tabs
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const ch = new BroadcastChannel('unlupa_class_sync');
        ch.postMessage({
          type: 'STUDENT_BOOK_REVIEWED',
          classId,
          studentId: cleanStudentId,
          itemId: backendItemId || itemId,
          rating,
          fsrsData: newState,
          newLog,
        });
        ch.close();
      }
    } catch (e) { /* ignore */ }

    // Call PostgreSQL backend API to persist progress & review log
    if (backendItemId) {
      classApiService.reviewStudentBookItem(classId, cleanStudentId, backendItemId, rating, note)
        .then(res => {
          if (res?.data?.progress) {
            const p = res.data.progress;
            const backendFSRS: FSRSState = {
              stability: Number(p.stability),
              difficulty: Number(p.difficulty),
              reps: Number(p.reps),
              lapses: Number(p.lapses),
              lastReview: p.lastReview ? new Date(p.lastReview).toISOString() : null,
              nextReview: p.nextReview ? new Date(p.nextReview).toISOString() : null,
              state: (p.state ? String(p.state).toLowerCase() : 'review') as any,
            };

            setTeachingClasses(prev => prev.map(c => {
              if (c.id !== classId) return c;
              return {
                ...c,
                students: c.students.map(s => {
                  if (s.id !== studentId && s.id !== cleanStudentId && s.id !== `std-user-${cleanStudentId}`) return s;
                  const itemsWithBackend = (s.bookItemsData || []).map(it => {
                    if (isMatchingItem(it)) {
                      return { ...it, fsrsData: backendFSRS, status: (p.status as any) || it.status };
                    }
                    return it;
                  });
                  return { ...s, bookItemsData: itemsWithBackend };
                })
              };
            }));
          }
        })
        .catch(err => {
          console.warn('[reviewStudentBookItem] API call notice:', err);
        });
    }
  };

  const resetToDefaults = () => {
    if (confirm(language === 'en' ? 'Are you sure you want to reset all data?' : 'Yakin ingin mereset semua data?')) {
      const keys = ['quran_pages', 'books', 'chapters', 'items', 'pages', 'my_classes', 'teaching_classes', 'teacher_feedbacks', 'attendance_exceptions'];
      keys.forEach(k => localStorage.removeItem(getUserKey(userProfile.id, k)));
      setQuranPages(generateCleanQuranPages());
      setBooks([]);
      setChapters([]);
      setItems([]);
      setPages([]);
      setMyClasses([]);
      setTeachingClasses([]);
      setTeacherFeedbacks([]);
      setAttendanceExceptions({});
    }
  };





  const quranStats = useMemo(() => {
    const pages = Array.isArray(quranPages) ? quranPages : [];
    const active = pages.filter(p => p && p.isActive);
    // Count mastered across ALL pages (even inactive ones retain their mastery)
    const mastered = pages.filter(p => p && (p.status === 'mastered_for_now' || p.mapanCelebrated || (p.fsrsData?.stability ?? 0) >= 74.5 || Math.round((p.fsrsData?.stability || 0) * 0.4025587) > 30));
    const dueList = active.filter(p => p && isDue(p.fsrsData?.nextReview, p.isActive, p.fsrsData?.lastReview));

    // Calculate interval breakdowns safely
    const intervalOver30 = active.filter(p => p && (p.status === 'mastered_for_now' || Math.round((p.fsrsData?.stability || 0) * 0.4025587) > 30)).length;
    const intervalLessThan30 = active.filter(p => p && Math.round((p.fsrsData?.stability || 0) * 0.4025587) <= 30 && Math.round((p.fsrsData?.stability || 0) * 0.4025587) > 19).length + intervalOver30;
    const intervalLessThan20 = active.filter(p => p && Math.round((p.fsrsData?.stability || 0) * 0.4025587) <= 19 && Math.round((p.fsrsData?.stability || 0) * 0.4025587) > 9).length + intervalLessThan30;
    const intervalLessThan10 = active.filter(p => p && Math.round((p.fsrsData?.stability || 0) * 0.4025587) <= 9 && Math.round((p.fsrsData?.stability || 0) * 0.4025587) > 4).length + intervalLessThan20;
    const intervalLessThan5 = active.filter(p => p && Math.round((p.fsrsData?.stability || 0) * 0.4025587) <= 4).length;

    return {
      total: 604,
      active: active.length,
      mastered: mastered.length,
      dueToday: dueList.length,
      dueList,
      intervalOver30,
      intervalLessThan30,
      intervalLessThan20,
      intervalLessThan10,
      intervalLessThan5
    };
  }, [quranPages]);

  const bookStats = useMemo(() => {
    const safeBooks = Array.isArray(books) ? books : [];
    const safeItems = Array.isArray(items) ? items : [];
    const active = safeItems.filter(i => i && i.isActive);
    const dueList = active.filter(i => i && isDue(i.fsrsData?.nextReview, i.isActive, i.fsrsData?.lastReview));
    const totalStability = active.reduce((sum, item) => sum + (item.fsrsData?.stability || 0), 0);
    const avgStability = active.length > 0 ? Math.round(totalStability / active.length) : 0;
    
    return {
      totalBooks: safeBooks.length,
      totalItems: safeItems.length,
      activeItems: active.length,
      dueToday: dueList.length,
      avgStability,
      dueList
    };
  }, [books, items]);

  const myClassesStats = useMemo(() => {
    let dueToday = 0;
    const safeClasses = Array.isArray(myClasses) ? myClasses : [];
    const safeItems = Array.isArray(items) ? items : [];
    const myBookClasses = safeClasses.filter(c => c && c.type === 'non-quran');
    myBookClasses.forEach(cls => {
      if (!cls) return;
      const assignedBookIds = Array.isArray(cls.assignedBookIds) ? cls.assignedBookIds : [];
      const classItems = safeItems.filter(i => i && assignedBookIds.includes(i.bookId));
      const activeItems = classItems.filter(i => i && i.isActive);
      const dueItems = activeItems.filter(i => i && isDue(i.fsrsData?.nextReview, i.isActive, i.fsrsData?.lastReview));
      dueToday += dueItems.length;
    });
    return { dueToday };
  }, [myClasses, items]);

  const nonQuranActiveCount = useMemo(() => (Array.isArray(items) ? items : []).filter(i => i && i.isActive).length, [items]);
  const nonQuranMasteredCount = useMemo(() => (Array.isArray(items) ? items : []).filter(i => i && i.isActive && (i.fsrsData?.stability || 0) >= 300).length, [items]);

  const totalActiveMaterials = (quranStats?.active || 0) + nonQuranActiveCount;
  const totalMasteredMaterials = (quranStats?.mastered || 0) + nonQuranMasteredCount;

  const currentStreak = useMemo(() => {
    try {
      const safeQuran = Array.isArray(quranPages) ? quranPages : [];
      const safeItems = Array.isArray(items) ? items : [];

      const activeQuran = safeQuran.filter(p => p?.isActive);
      const activeItems = safeItems.filter(i => i?.isActive);
      const totalActive = activeQuran.length + activeItems.length;

      if (totalActive === 0) return 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check overdue items today
      const overdueQuran = activeQuran.filter(p => {
        if (!p.fsrsData?.nextReview) return false;
        const nDate = new Date(p.fsrsData.nextReview);
        nDate.setHours(0, 0, 0, 0);
        return nDate < today;
      }).length;

      const overdueItems = activeItems.filter(i => {
        if (!i.fsrsData?.nextReview) return false;
        const nDate = new Date(i.fsrsData.nextReview);
        nDate.setHours(0, 0, 0, 0);
        return nDate < today;
      }).length;

      const totalOverdueToday = overdueQuran + overdueItems;
      const todayDisciplineRate = Math.round(((totalActive - totalOverdueToday) / totalActive) * 100);

      // CRITICAL RULE: IF DISCIPLINE < 80%, STREAK RESETS TO 0!
      if (todayDisciplineRate < 80) {
        return 0;
      }

      // If discipline >= 80%, calculate consecutive days of discipline
      let pastConsecutiveDays = 0;
      for (let i = 1; i < 60; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toDateString();

        let hadActivity = false;
        for (const p of safeQuran) {
          if (!p) continue;
          if (p.reviewLogs?.some(l => l?.date && new Date(l.date).toDateString() === dateStr)) {
            hadActivity = true;
            break;
          }
        }
        if (!hadActivity) {
          for (const item of safeItems) {
            if (!item) continue;
            if (item.reviewLogs?.some(l => l?.date && new Date(l.date).toDateString() === dateStr)) {
              hadActivity = true;
              break;
            }
          }
        }

        if (hadActivity) {
          pastConsecutiveDays++;
        } else {
          break;
        }
      }

      // Total streak = 1 (today) + past consecutive days
      return 1 + pastConsecutiveDays;
    } catch (e) {
      console.warn('Error calculating discipline streak', e);
      return 0;
    }
  }, [quranPages, items]);

  return (
        <AppContext.Provider value={{
      activeSpace, setActiveSpace,
      selectedTeachingClassId, setSelectedTeachingClassId,
      editingClassBookId, setEditingClassBookId,
      selectedPersonalBookId, setSelectedPersonalBookId,
      spaceResetCounter, resetSpaceToRoot,
      language, setLanguage,
      theme, setTheme, toggleTheme,
      isLandingPageOpen, setIsLandingPageOpen,
      isOnboardingOpen, setIsOnboardingOpen,
      isOnboardingEnabled, setIsOnboardingEnabled,
      isWalkthroughOpen, setIsWalkthroughOpen,
      activeWalkthroughPage,
      openPageWalkthrough, closePageWalkthrough,
      togglePageOnboarding, setAllPageOnboarding, resetOnboardingStatus,
      isOnboardingSettingsOpen, setIsOnboardingSettingsOpen,
      isAuthModalOpen, setIsAuthModalOpen,
      authModalMode, setAuthModalMode,
      openLoginModal, openRegisterModal,
      currentUser, userProfile, setUserProfile, updateUserProfile, logout, initiateUserSession,
      backendAuthStatus, backendAuthError,
      attendanceExceptions, markAttendanceException,
      quranSpaceCode,
      teacherFeedbacks,
      isTeacherMode: activeSpace === 'teaching',

      tierConfig, updateTierConfig,
      dailyAIUsage, recordAIUsage,
      isFeatureAllowed,
      isUpgradeModalOpen, setIsUpgradeModalOpen,
      upgradeModalContext, openUpgradeModal,
      
      quranPages, quranStats,
      activateQuranPage, deactivateQuranPage, reviewQuranPage,
      bypassQuranPageToMapan, resetQuranPageMapan,
      updateQuranMapanSchedule, setGlobalMapanSchedule,
      addQuranPageFeedback, addQuranPageIssue, resolveQuranPageIssue,
      
      books, chapters, items, pages, createPage, updatePage, deletePage, personalStats: bookStats, myClassesStats,
      currentStreak, totalActiveMaterials, totalMasteredMaterials,
      activateItem, deactivateItem, reviewItem,
      createBook, createBookWithContent, updateBook, deleteBook, duplicateBookAsEditable,
      createChapter, updateChapter, deleteChapter,
      createItem, updateItem, deleteItem, reorderItems,
      importFromLibrary, importFromJSON, exportBookJSON, publishBookToLibrary, library,
      
      // Backend Sync & Data Reconciliation
      isBooksLoading,
      booksError,
      reconciliationComparison,
      isReconciliationModalOpen,
      setIsReconciliationModalOpen,
      openReconciliationModal,
      refreshBooksFromBackend,
      refreshClassesFromBackend,
      refreshLibraryFromBackend,

      transactions, purchasedBookIds, isBookPurchased, purchaseBook, subscribeToPro,
      isCheckoutModalOpen, selectedCheckoutEntry, openCheckoutModal, closeCheckoutModal,

      myClasses, teachingClasses, joinClassByCode, leaveClass, createTeachingClass, deleteTeachingClass, closeTeachingClass, reopenTeachingClass, updateTeachingClass, syncBookToClasses, removeStudentFromClass,
      reviewStudentQuranPage, addStudentDailyFeedback, 
      activateStudentQuranPage, deactivateStudentQuranPage, 
      bypassStudentQuranPageMapan, resetStudentQuranPageMapan,
      reviewStudentBookItem, activateStudentBookItem, deactivateStudentBookItem,
      bypassStudentBookItemMapan, resetStudentBookItemMapan,
      getLiveStudentQuranData, getLiveStudentBookItems,
      resetToDefaults
    }}>

      {children}

      {/* Legacy Data Reconciliation Modal */}
      <LegacyDataReconciliationModal
        isOpen={isReconciliationModalOpen}
        onClose={() => {
          setIsReconciliationModalOpen(false);
          if (loadedUserIdRef.current && loadedUserIdRef.current !== 'guest') {
            try {
              localStorage.setItem(getUserKey(loadedUserIdRef.current, 'reconciliation_dismissed'), 'true');
            } catch (e) {}
          }
        }}
        comparison={reconciliationComparison}
        onImportSuccess={async () => {
          if (loadedUserIdRef.current && loadedUserIdRef.current !== 'guest') {
            try {
              localStorage.setItem(getUserKey(loadedUserIdRef.current, 'reconciliation_dismissed'), 'true');
            } catch (e) {}
          }
          await refreshBooksFromBackend();
          setIsReconciliationModalOpen(false);
        }}
      />

      {/* Global Upgrade to Pro Modal */}
      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={closeUpgradeModal}
        triggeredFeature={upgradeModalContext.feature}
        triggerMessage={upgradeModalContext.message}
      />

      {/* Global Book Purchase Checkout Modal */}
      <BookCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={closeCheckoutModal}
        entry={selectedCheckoutEntry}
      />
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
