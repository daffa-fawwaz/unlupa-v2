import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  AppSpace,
  Language,
  Theme,
  QuranPageItem,
  Book,
  Chapter,
  BookItem,
  PageDocument,
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
  PaymentMethod,
} from "../types";
import {
  generateInitialQuranPages,
  generateCleanQuranPages,
  ensureComplete604Pages,
  getSurahForPage,
  getJuzForPage,
} from "../data/quranData";
import {
  INITIAL_BOOKS,
  INITIAL_CHAPTERS,
  INITIAL_ITEMS,
  CURATED_LIBRARY,
  LibraryEntry,
} from "../data/sampleBooks";
import {
  INITIAL_CLASSES,
  createSampleStudentQuranPages,
  createSampleStudentBookItems,
} from "../data/sampleClasses";
import {
  updateQuranFSRS,
  updateNonQuranFSRS,
  isDue,
  isReviewedToday,
  calculateNextMapanDate,
} from "../lib/fsrs";
import { normalizeBilingualText } from "../utils/bilingualHelper";
import {
  syncToFirestore,
  fetchFromFirestore,
  listenToFirestore,
  listenToClassStudentsGlobal,
  listenToStudentInClassGlobal,
  updateStudentInClassGlobal,
  fetchTeacherBookDataGlobal,
  publishToPublicLibrary,
  fetchPublicLibrary,
  syncClassToGlobal,
  findClassByCodeGlobal,
  enrollStudentInGlobalClass,
  fetchClassStudentsGlobal,
  getTeacherTeachingClasses,
  updateTeacherTeachingClasses,
  removeStudentFromGlobalClass,
} from "../lib/firestore-sync";
import {
  api,
  ApiError,
  getAuthToken,
  clearAuthToken,
  BackendUserResponse,
} from "../lib/api";

export interface AuthUser {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: string;
  avatarUrl?: string | null;
}
import { UpgradePlanModal } from "../components/common/UpgradePlanModal";
import { BookCheckoutModal } from "../components/common/BookCheckoutModal";
import { useClassCleanup } from "../hooks/useClassCleanup";
import { triggerXpReward } from "../components/common/FloatingXpToast";
import { isUserAdmin } from "../services/authRbacService";
import {
  bookApiService,
  mapBackendBookToBook,
  mapBackendChapterToChapter,
  mapBackendItemToBookItem,
} from "../services/bookApiService";
import {
  readLocalStorageSnapshot,
  readFirestoreSnapshot,
  compareSnapshots,
  ReconciliationComparison,
} from "../services/legacyReconciliationService";
import { LegacyDataReconciliationModal } from "../components/personal/LegacyDataReconciliationModal";
import { classApiService } from "../services/classApiService";

function isValidUUID(val: string | null | undefined): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    val,
  );
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
  authModalMode: "login" | "register";
  setAuthModalMode: (mode: "login" | "register") => void;
  openLoginModal: () => void;
  openRegisterModal: () => void;
  currentUser: AuthUser | null;
  initiateUserSession: (backendUser: BackendUserResponse) => Promise<void>;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  updateUserProfile: (data: Partial<UserProfile>) => void;
  logout: () => Promise<void>;
  backendAuthStatus: "unauthenticated" | "loading" | "authenticated" | "error";
  backendAuthError: string | null;
  attendanceExceptions: Record<string, "izin" | "sakit">;
  markAttendanceException: (
    date: string,
    status: "izin" | "sakit" | null,
  ) => void;
  quranSpaceCode: string;
  teacherFeedbacks: QuranFeedbackItem[];
  isTeacherMode?: boolean;

  // Tier Limits & Dynamic Admin Config
  tierConfig: SystemTierConfig;
  updateTierConfig: (newConfig: Partial<SystemTierConfig>) => void;
  dailyAIUsage: { date: string; count: number };
  recordAIUsage: () => boolean;
  isFeatureAllowed: (
    feature:
      | "create_book"
      | "ai_builder"
      | "ai_extractor"
      | "create_class"
      | "export_report"
      | "quran_juz"
      | "audio_recording"
      | "join_class",
    countOrJuz?: number,
    classType?: "quran" | "non-quran",
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
  createPage: (data: {
    bookId: string;
    chapterId?: string;
    title: string;
    blocks: any[];
  }) => PageDocument;
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
  reviewQuranPage: (
    pageNumber: number,
    rating: 1 | 2 | 3,
    feedback?: {
      notes?: string;
      issueTypes?: ("kelancaran" | "tajwid" | "makharijul" | "konsentrasi")[];
      problemAyahs?: string;
    },
  ) => {
    newState: FSRSState;
    nextIntervalDays: number;
    isMasteredForNow: boolean;
    justBecameMastered: boolean;
  } | null;
  bypassQuranPageToMapan: (pageNumber: number) => void;
  resetQuranPageMapan: (pageNumber: number) => void;
  updateQuranMapanSchedule: (
    pageNumber: number,
    config: MapanScheduleConfig,
  ) => void;
  setGlobalMapanSchedule: (config: MapanScheduleConfig) => void;
  addQuranPageFeedback: (
    pageNumber: number,
    feedback: {
      notes?: string;
      issueTypes?: ("kelancaran" | "tajwid" | "makharijul" | "konsentrasi")[];
      problemAyahs?: string;
    },
  ) => void;
  addQuranPageIssue: (
    pageNumber: number,
    issue: Omit<
      import("../types").PageIssue,
      "id" | "createdAt" | "isResolved"
    >,
  ) => void;
  resolveQuranPageIssue: (pageNumber: number, issueId: string) => void;

  activateItem: (itemId: string) => void;
  deactivateItem: (itemId: string) => void;
  reviewItem: (itemId: string, rating: 1 | 2 | 3 | 4) => void;

  createBook: (data: {
    id?: string;
    title: string;
    description: string;
    coverUrl?: string;
    isPublic?: boolean;
    category?: string;
    authorName?: string;
    price?: number;
    isReadonly?: boolean;
  }) => Book;
  updateBook: (id: string, data: Partial<Book>) => void;
  deleteBook: (id: string) => void;

  createChapter: (data: {
    id?: string;
    bookId: string;
    title: string;
    description?: string;
    material?: string;
    parentId?: string | null;
    order?: number;
  }) => Chapter;
  updateChapter: (id: string, data: Partial<Chapter>) => void;
  deleteChapter: (chapterId: string) => void;

  createItem: (data: {
    id?: string;
    bookId: string;
    chapterId?: string;
    question: string;
    answer: string;
    explanation?: string;
    tags?: string[];
    imageQ?: string;
    imageA?: string;
    audioQ?: string;
    audioA?: string;
    order?: number;
  }) => BookItem;
  updateItem: (id: string, data: Partial<BookItem>) => void;
  reorderItems: (newItems: BookItem[]) => void;
  deleteItem: (itemId: string) => void;

  importFromLibrary: (libId: string) => void;
  importFromJSON: (jsonStr: string) => { success: boolean; message: string };
  exportBookJSON: (bookId: string) => string;
  publishBookToLibrary: (
    bookId: string,
    allowEdit?: boolean,
    pricing?: { isPaid: boolean; price?: number },
  ) => Promise<{ success: boolean; message: string }>;

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

  // Marketplace, Transactions & Invoices
  transactions: BookTransaction[];
  purchasedBookIds: string[];
  isBookPurchased: (libraryEntryId: string, book?: Book) => boolean;
  purchaseBook: (
    entry: LibraryEntry,
    paymentMethod: PaymentMethod,
  ) => Promise<{ success: boolean; transaction: BookTransaction }>;
  subscribeToPro: (
    cycle: "monthly" | "yearly",
    paymentMethod: PaymentMethod,
  ) => Promise<{ success: boolean; transaction: BookTransaction }>;
  isCheckoutModalOpen: boolean;
  selectedCheckoutEntry: LibraryEntry | null;
  openCheckoutModal: (entry: LibraryEntry) => void;
  closeCheckoutModal: () => void;

  joinClassByCode: (
    code: string,
  ) => Promise<{ success: boolean; message: string }>;
  leaveClass: (classId: string) => void;
  createTeachingClass: (data: {
    name: string;
    type: "quran" | "non-quran";
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
  removeStudentFromClass: (classId: string, studentId: string) => void;
  reviewStudentQuranPage: (
    classId: string,
    studentId: string,
    pageNumber: number,
    rating: 1 | 2 | 3,
    note?: string,
  ) => void;
  addStudentDailyFeedback: (
    classId: string,
    studentId: string,
    note: string,
  ) => void;
  activateStudentQuranPage: (
    classId: string,
    studentId: string,
    pageNumber: number,
  ) => void;
  deactivateStudentQuranPage: (
    classId: string,
    studentId: string,
    pageNumber: number,
  ) => void;
  bypassStudentQuranPageMapan: (
    classId: string,
    studentId: string,
    pageNumber: number,
  ) => void;
  resetStudentQuranPageMapan: (
    classId: string,
    studentId: string,
    pageNumber: number,
  ) => void;

  reviewStudentBookItem: (
    classId: string,
    studentId: string,
    itemId: string,
    rating: 1 | 2 | 3 | 4,
    note?: string,
  ) => void;
  activateStudentBookItem: (
    classId: string,
    studentId: string,
    itemId: string,
  ) => void;
  deactivateStudentBookItem: (
    classId: string,
    studentId: string,
    itemId: string,
  ) => void;
  bypassStudentBookItemMapan: (
    classId: string,
    studentId: string,
    itemId: string,
  ) => void;
  resetStudentBookItemMapan: (
    classId: string,
    studentId: string,
    itemId: string,
  ) => void;

  getLiveStudentQuranData: (studentId: string) => QuranPageItem[];
  getLiveStudentBookItems: (studentId: string) => BookItem[];

  resetToDefaults: () => void;
}

export const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  QURAN_PAGES: "unlupa_quran_pages_v6",
  BOOKS: "unlupa_books_v3",
  CHAPTERS: "unlupa_chapters_v3",
  ITEMS: "unlupa_items_v3",
  MY_CLASSES: "unlupa_my_classes_v2",
  TEACHING_CLASSES: "unlupa_teaching_classes_v2",
  ACTIVE_SPACE: "unlupa_active_space_v2",
  LANGUAGE: "unlupa_lang_v2",
  THEME: "unlupa_theme_v1",
  ONBOARDING_SEEN: "unlupa_onboarding_seen_v2",
  QURAN_SPACE_CODE: "unlupa_quran_space_code_v1",
  TEACHER_FEEDBACKS: "unlupa_teacher_feedbacks_v1",
  ATTENDANCE_EXCEPTIONS: "unlupa_attendance_exceptions_v1",
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeSpace, setActiveSpace] = useState<AppSpace>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_SPACE);
      const validSpaces: AppSpace[] = [
        "dashboard",
        "quran",
        "personal",
        "teaching",
        "leaderboard",
        "admin",
      ];
      if (saved && validSpaces.includes(saved as AppSpace)) {
        return saved as AppSpace;
      }
    } catch (e) {
      console.warn("Error reading active space from localStorage", e);
    }
    return "dashboard";
  });
  const [editingClassBookId, setEditingClassBookId] = useState<string | null>(
    null,
  );
  const [selectedTeachingClassId, setSelectedTeachingClassId] = useState<
    string | null
  >(null);
  const [selectedPersonalBookId, setSelectedPersonalBookId] = useState<
    string | null
  >(null);

  const [spaceResetCounter, setSpaceResetCounter] = useState<{
    space: AppSpace;
    count: number;
  }>({
    space: "quran",
    count: 0,
  });

  const resetSpaceToRoot = (space: AppSpace) => {
    if (space === "personal") {
      setSelectedPersonalBookId(null);
      setEditingClassBookId(null);
    }
    if (space === "teaching") {
      setSelectedTeachingClassId(null);
    }
    setSpaceResetCounter((prev) => ({ space, count: prev.count + 1 }));
  };

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return (saved as Language) || "en";
  });

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === "dark" || saved === "light") return saved;
    return typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {
      console.error("Error setting theme class", e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const [isLandingPageOpen, setIsLandingPageOpen] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      // Priority 1: Explicit URL parameters or hash
      if (
        params.get("landing") === "true" ||
        window.location.hash === "#landing"
      )
        return true;
      if (params.get("app") === "true" || window.location.hash === "#app")
        return false;

      // Priority 2: In-app session flag within active browser tab
      if (sessionStorage.getItem("unlupa_in_app") === "true") return false;

      // Clean up legacy permanent suppression
      localStorage.removeItem("unlupa_seen_app");

      // Default: Direct to landing page on initial access to localhost:3000
      return true;
    } catch (e) {
      /* ignore */
    }
    return true;
  });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return !localStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN);
  });

  const [quranSpaceCode] = useState<string>(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.QURAN_SPACE_CODE);
    if (cached) return cached;
    const code = "UNL-QRN-7842";
    try {
      localStorage.setItem(STORAGE_KEYS.QURAN_SPACE_CODE, code);
    } catch (e) {
      /* ignore */
    }
    return code;
  });

  const [teacherFeedbacks, setTeacherFeedbacks] = useState<QuranFeedbackItem[]>(
    () => {
      const cached = localStorage.getItem(STORAGE_KEYS.TEACHER_FEEDBACKS);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          /* ignore */
        }
      }
      return [
        {
          id: "tf-welcome",
          date: new Date(Date.now() - 3600000 * 4).toISOString(),
          pageNumber: 1,
          rating: 2,
          teacherName: "Ust. Ahmad Al-Hafizh",
          note: "Alhamdulillah tasmi' Al-Fatihah sangat lancar mutqin. Terus istiqamahkan jadwal murajaah harian.",
        },
      ];
    },
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.TEACHER_FEEDBACKS,
        JSON.stringify(teacherFeedbacks),
      );
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
      const stored = localStorage.getItem("unlupa_onboarding_enabled");
      if (stored !== null) savedEnabled = stored === "true";
    } catch (e) {
      /* ignore */
    }

    const savedUser = localStorage.getItem("unlupa_user_profile_v1");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        const resolvedEnabled =
          savedEnabled !== null
            ? savedEnabled
            : parsed.onboardingPreferences?.enabled !== undefined
              ? parsed.onboardingPreferences.enabled
              : true;
        const cleanAvatar =
          !parsed.avatarUrl ||
          parsed.avatarUrl.includes("photo-1534528741775-53994a69daeb")
            ? DEFAULT_ISLAMIC_AVATAR
            : parsed.avatarUrl;
        return {
          ...parsed,
          avatarUrl: cleanAvatar,
          onboardingPreferences: {
            ...defaultOnboardingPreferences,
            ...(parsed.onboardingPreferences || {}),
            enabled: resolvedEnabled,
          },
        };
      } catch (e) {
        /* ignore */
      }
    }
    return {
      id: "guest",
      quranSpaceCode: "UNL-QRN-GUEST",
      fullName: "Tamu / Murid",
      email: "",
      avatarUrl: DEFAULT_ISLAMIC_AVATAR,
      role: "user",
      plan: "free",
      onboardingPreferences: {
        ...defaultOnboardingPreferences,
        enabled: savedEnabled !== null ? savedEnabled : true,
      },
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "unlupa_user_profile_v1",
        JSON.stringify(userProfile),
      );
    } catch (e) {
      /* ignore */
    }
  }, [userProfile]);

  const updateUserProfile = (data: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const updated = { ...prev, ...data };
      try {
        localStorage.setItem("unlupa_user_profile_v1", JSON.stringify(updated));
      } catch (e) {
        /* ignore */
      }
      return updated;
    });
  };

  // Backend Authentication Bridge State
  const [backendAuthStatus, setBackendAuthStatus] = useState<
    "unauthenticated" | "loading" | "authenticated" | "error"
  >("unauthenticated");
  const [backendAuthError, setBackendAuthError] = useState<string | null>(null);
  const activeMeAbortControllerRef = useRef<AbortController | null>(null);

  // Dynamic Tier Limits Configuration
  const [tierConfig, setTierConfig] = useState<SystemTierConfig>(() => {
    try {
      const saved = localStorage.getItem("unlupa_system_tier_config_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...createDefaultTierConfig(), ...parsed };
      }
    } catch (e) {
      /* ignore */
    }
    return createDefaultTierConfig();
  });

  const updateTierConfig = (newConfig: Partial<SystemTierConfig>) => {
    setTierConfig((prev) => {
      const updated = {
        ...prev,
        ...newConfig,
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(
          "unlupa_system_tier_config_v1",
          JSON.stringify(updated),
        );
      } catch (e) {
        /* ignore */
      }
      return updated;
    });
  };

  // Daily AI Usage Tracking
  const [dailyAIUsage, setDailyAIUsage] = useState<{
    date: string;
    count: number;
  }>(() => {
    const today = new Date().toISOString().split("T")[0];
    try {
      const saved = localStorage.getItem(
        `unlupa_daily_ai_${userProfile.id}_${today}`,
      );
      if (saved) {
        return { date: today, count: Number(saved) || 0 };
      }
    } catch (e) {
      /* ignore */
    }
    return { date: today, count: 0 };
  });

  const recordAIUsage = (): boolean => {
    const today = new Date().toISOString().split("T")[0];
    const isPro =
      userProfile.plan === "premium" ||
      userProfile.plan === "institutional" ||
      userProfile.role === "admin" ||
      userProfile.role === "superadmin";
    const limits = isPro ? tierConfig.premiumTier : tierConfig.freeTier;

    const currentCount = dailyAIUsage.date === today ? dailyAIUsage.count : 0;
    if (currentCount >= limits.maxDailyAIGenerations) {
      return false;
    }

    const newCount = currentCount + 1;
    setDailyAIUsage({ date: today, count: newCount });
    try {
      localStorage.setItem(
        `unlupa_daily_ai_${userProfile.id}_${today}`,
        String(newCount),
      );
    } catch (e) {
      /* ignore */
    }
    return true;
  };

  // Graceful Upgrade Modal state
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeModalContext, setUpgradeModalContext] = useState<{
    feature?: string;
    message?: string;
  }>({});

  const openUpgradeModal = (feature?: string, message?: string) => {
    setUpgradeModalContext({ feature, message });
    setIsUpgradeModalOpen(true);
  };

  const closeUpgradeModal = () => {
    setIsUpgradeModalOpen(false);
  };

  // Helper to check if a specific action is within limits
  const isFeatureAllowed = (
    feature:
      | "create_book"
      | "ai_builder"
      | "ai_extractor"
      | "create_class"
      | "export_report"
      | "quran_juz"
      | "audio_recording"
      | "join_class",
    countOrJuz?: number,
    classType?: "quran" | "non-quran",
  ): {
    allowed: boolean;
    reason?: string;
    limit?: number;
    current?: number;
  } => {
    const isPro =
      userProfile.plan === "premium" ||
      userProfile.plan === "institutional" ||
      userProfile.role === "admin" ||
      userProfile.role === "superadmin";
    const limits = isPro ? tierConfig.premiumTier : tierConfig.freeTier;

    switch (feature) {
      case "create_book": {
        const userBooks = books.filter((b) => !b.classId);
        const allowed = isPro || userBooks.length < limits.maxBooks;
        return {
          allowed,
          limit: limits.maxBooks,
          current: userBooks.length,
          reason: allowed
            ? undefined
            : language === "en"
              ? `Free plan limit is ${limits.maxBooks} books.`
              : `Batas pembuatan buku akun Free adalah ${limits.maxBooks} buku.`,
        };
      }
      case "ai_builder": {
        const today = new Date().toISOString().split("T")[0];
        const todayCount = dailyAIUsage.date === today ? dailyAIUsage.count : 0;
        const allowed = isPro || todayCount < limits.maxDailyAIGenerations;
        return {
          allowed,
          limit: limits.maxDailyAIGenerations,
          current: todayCount,
          reason: allowed
            ? undefined
            : language === "en"
              ? `Daily AI limit is ${limits.maxDailyAIGenerations} generations per day.`
              : `Kuota harian AI Builder akun Free adalah ${limits.maxDailyAIGenerations}x per hari.`,
        };
      }
      case "ai_extractor": {
        const allowed = isPro || limits.allowAISmartExtractor;
        return {
          allowed,
          reason: allowed
            ? undefined
            : language === "en"
              ? "Smart AI Extractor is exclusive to Unlupa Pro."
              : "Fitur Smart AI Extractor tersedia eksklusif untuk pengguna Unlupa Pro.",
        };
      }
      case "create_class": {
        if (isPro) {
          return { allowed: true };
        }

        const quranClasses = teachingClasses.filter((c) => c.type === "quran");
        const nonQuranClasses = teachingClasses.filter(
          (c) => c.type !== "quran",
        );

        const maxQuran = limits.maxQuranClasses ?? 1;
        const maxNonQuran = limits.maxNonQuranClasses ?? 1;

        if (classType === "quran") {
          const allowed = quranClasses.length < maxQuran;
          return {
            allowed,
            limit: maxQuran,
            current: quranClasses.length,
            reason: allowed
              ? undefined
              : language === "en"
                ? `Free accounts can create up to ${maxQuran} Al-Qur'an class. Upgrade to Unlupa Pro for unlimited classes.`
                : `Batas pembuatan kelas Al-Qur'an untuk akun Free adalah maksimal ${maxQuran} kelas. Upgrade ke Unlupa Pro untuk membuat kelas tanpa batas.`,
          };
        } else if (classType === "non-quran") {
          const allowed = nonQuranClasses.length < maxNonQuran;
          return {
            allowed,
            limit: maxNonQuran,
            current: nonQuranClasses.length,
            reason: allowed
              ? undefined
              : language === "en"
                ? `Free accounts can create up to ${maxNonQuran} Kitab/Materi class. Upgrade to Unlupa Pro for unlimited classes.`
                : `Batas pembuatan kelas Non-Qur'an (Kitab) untuk akun Free adalah maksimal ${maxNonQuran} kelas. Upgrade ke Unlupa Pro untuk membuat kelas tanpa batas.`,
          };
        }

        const canCreateAny =
          quranClasses.length < maxQuran ||
          nonQuranClasses.length < maxNonQuran;
        return {
          allowed: canCreateAny,
          reason: canCreateAny
            ? undefined
            : language === "en"
              ? "Free accounts can create up to 1 Al-Qur'an class and 1 Kitab class. Upgrade to Unlupa Pro for unlimited classes."
              : "Akun Free dibatasi maksimal 1 kelas Al-Qur'an dan 1 kelas Kitab. Upgrade ke Unlupa Pro untuk membuat kelas tanpa batas.",
        };
      }
      case "export_report": {
        const allowed = isPro || limits.allowExportReport;
        return {
          allowed,
          reason: allowed
            ? undefined
            : language === "en"
              ? "Report and transcript exports require Unlupa Pro."
              : "Ekspor rapor dan laporan cetak memerlukan akun Unlupa Pro.",
        };
      }
      case "quran_juz": {
        const activeJuzSet = new Set(
          quranPages.filter((p) => p.isActive).map((p) => p.juzNumber),
        );
        if (countOrJuz && activeJuzSet.has(countOrJuz)) {
          return { allowed: true };
        }
        const allowed = isPro || activeJuzSet.size < limits.maxActiveQuranJuz;
        return {
          allowed,
          limit: limits.maxActiveQuranJuz,
          current: activeJuzSet.size,
          reason: allowed
            ? undefined
            : language === "en"
              ? `Free plan limit is ${limits.maxActiveQuranJuz} active Juz.`
              : `Batas Juz aktif akun Free adalah ${limits.maxActiveQuranJuz} Juz.`,
        };
      }
      case "audio_recording": {
        const allowed = isPro || (countOrJuz ?? 0) < limits.maxAudioRecordings;
        return {
          allowed,
          limit: limits.maxAudioRecordings,
          current: countOrJuz ?? 0,
          reason: allowed
            ? undefined
            : language === "en"
              ? `Free plan audio limit is ${limits.maxAudioRecordings} recordings.`
              : `Batas rekaman audio suara akun Free adalah ${limits.maxAudioRecordings} rekaman.`,
        };
      }
      case "join_class": {
        const allowed = isPro || myClasses.length < limits.maxJoinedClasses;
        return {
          allowed,
          limit: limits.maxJoinedClasses,
          current: myClasses.length,
          reason: allowed
            ? undefined
            : language === "en"
              ? `Free plan limit is ${limits.maxJoinedClasses} joined classes.`
              : `Batas bergabung kelas akun Free adalah ${limits.maxJoinedClasses} kelas.`,
        };
      }
      default:
        return { allowed: true };
    }
  };

  // Professional Page Walkthrough & Onboarding State
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState<boolean>(false);
  const [activeWalkthroughPage, setActiveWalkthroughPage] =
    useState<OnboardingPageKey>("home");
  const [isOnboardingSettingsOpen, setIsOnboardingSettingsOpen] =
    useState<boolean>(false);

  const isOnboardingEnabled =
    userProfile.onboardingPreferences?.enabled !== false;

  const setIsOnboardingEnabled = (enabled: boolean) => {
    try {
      localStorage.setItem(
        "unlupa_onboarding_enabled",
        enabled ? "true" : "false",
      );
    } catch (e) {
      /* ignore */
    }
    setUserProfile((prev) => ({
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
    setUserProfile((prev) => {
      const currentPrefs =
        prev.onboardingPreferences || defaultOnboardingPreferences;
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
      localStorage.setItem(
        "unlupa_onboarding_enabled",
        enabled ? "true" : "false",
      );
    } catch (e) {
      /* ignore */
    }
    setUserProfile((prev) => ({
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
    const pages: OnboardingPageKey[] = page
      ? [page]
      : ["home", "quran", "personal", "teaching"];
    pages.forEach((p) => {
      try {
        localStorage.removeItem(`unlupa_walkthrough_seen_${p}`);
      } catch (e) {
        /* ignore */
      }
    });
  };

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">(
    "login",
  );
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Scoped user storage helpers
  const getUserKey = (userId: string, keyName: string) =>
    `unlupa_user_${userId}_${keyName}`;

  const getLiveStudentQuranData = useCallback(
    (studentId: string): QuranPageItem[] => {
      try {
        const realId = studentId.startsWith("std-user-")
          ? studentId.replace("std-user-", "")
          : studentId;
        const cached = localStorage.getItem(getUserKey(realId, "quran_pages"));
        if (cached) return JSON.parse(cached);
      } catch (e) {
        console.warn("Failed to read live student quran data", e);
      }
      return [];
    },
    [],
  );

  const getLiveStudentBookItems = useCallback(
    (studentId: string): BookItem[] => {
      try {
        const realId = studentId.startsWith("std-user-")
          ? studentId.replace("std-user-", "")
          : studentId;
        const cached = localStorage.getItem(getUserKey(realId, "items"));
        if (cached) return JSON.parse(cached);
      } catch (e) {
        console.warn("Failed to read live student book items", e);
      }
      return [];
    },
    [],
  );

  // Helper to load user-isolated data (defaults to clean 0-state for new accounts)
  const loadUserData = (userId: string) => {
    // 1. Quran Pages: default is clean 604 pages, all inactive
    let loadedQuranPages: QuranPageItem[] = generateCleanQuranPages();
    try {
      const cachedQuran = localStorage.getItem(
        getUserKey(userId, "quran_pages"),
      );
      if (cachedQuran) {
        const parsed = JSON.parse(cachedQuran);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedQuranPages = parsed
            .map((page) => {
              if (!page || typeof page !== "object") return null;
              const pageNum = Number(page.pageNumber) || 1;
              const surah = getSurahForPage(pageNum);
              const juz = getJuzForPage(pageNum);
              const safeFsrs =
                page.fsrsData && typeof page.fsrsData === "object"
                  ? {
                      stability: Number(page.fsrsData.stability) || 0,
                      difficulty: Number(page.fsrsData.difficulty) || 5.0,
                      reps: Number(page.fsrsData.reps) || 0,
                      lapses: Number(page.fsrsData.lapses) || 0,
                      lastReview: page.fsrsData.lastReview || null,
                      nextReview: page.fsrsData.nextReview || null,
                      state: page.fsrsData.state || "new",
                    }
                  : createInitialFSRSState();

              return {
                ...page,
                pageNumber: pageNum,
                isActive: Boolean(page.isActive),
                status: page.status || (page.isActive ? "active" : "inactive"),
                mapanCelebrated: Boolean(page.mapanCelebrated),
                fsrsData: safeFsrs,
                reviewLogs: Array.isArray(page.reviewLogs)
                  ? page.reviewLogs
                  : [],
                issues: Array.isArray(page.issues) ? page.issues : [],
                juzNumber: juz,
                surahNumber: surah.surahNumber,
                surahNameEn: surah.nameEn,
                surahNameAr: surah.nameAr,
                ayahRange: surah.ayahRange,
              };
            })
            .filter(Boolean) as QuranPageItem[];
        }
      }
    } catch (e) {
      console.warn("Error loading quran pages for user", userId, e);
      loadedQuranPages = generateCleanQuranPages();
    }

    if (!loadedQuranPages || loadedQuranPages.length < 604) {
      loadedQuranPages = ensureComplete604Pages(loadedQuranPages || []);
    }

    // 2. Books
    let loadedBooks: Book[] = [];
    try {
      const cachedBooks = localStorage.getItem(getUserKey(userId, "books"));
      if (cachedBooks) {
        const parsed = JSON.parse(cachedBooks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedBooks = parsed.filter(
            (b) => b && typeof b === "object" && b.id && b.title,
          );
        }
      }
      // If empty for this user, look in guest or other keys to recover
      if (loadedBooks.length === 0) {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.endsWith("_books") || k.includes("book"))) {
            try {
              const val = localStorage.getItem(k);
              if (val) {
                const parsed = JSON.parse(val);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  const valid = parsed.filter(
                    (b: any) => b && typeof b === "object" && b.id && b.title,
                  );
                  if (valid.length > 0) {
                    loadedBooks = valid;
                    localStorage.setItem(
                      getUserKey(userId, "books"),
                      JSON.stringify(valid),
                    );
                    break;
                  }
                }
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.warn("Error loading books", e);
      loadedBooks = [];
    }

    // 3. Chapters
    let loadedChapters: Chapter[] = [];
    try {
      const cachedChapters = localStorage.getItem(
        getUserKey(userId, "chapters"),
      );
      if (cachedChapters) {
        const parsed = JSON.parse(cachedChapters);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedChapters = parsed.filter(
            (c) => c && typeof c === "object" && c.id && c.bookId,
          );
        }
      }
      if (loadedChapters.length === 0) {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.endsWith("_chapters") || k.includes("chapter"))) {
            try {
              const val = localStorage.getItem(k);
              if (val) {
                const parsed = JSON.parse(val);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  const valid = parsed.filter(
                    (c: any) => c && typeof c === "object" && c.id && c.bookId,
                  );
                  if (valid.length > 0) {
                    loadedChapters = valid;
                    localStorage.setItem(
                      getUserKey(userId, "chapters"),
                      JSON.stringify(valid),
                    );
                    break;
                  }
                }
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.warn("Error loading chapters", e);
      loadedChapters = [];
    }

    // 4. Items
    let loadedItems: BookItem[] = [];
    try {
      const cachedItems = localStorage.getItem(getUserKey(userId, "items"));
      if (cachedItems) {
        const parsed = JSON.parse(cachedItems);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedItems = parsed
            .filter((item) => item && typeof item === "object" && item.id)
            .map((item: any) => ({
              ...item,
              isActive: Boolean(item.isActive),
              status: item.status || (item.isActive ? "active" : "inactive"),
              fsrsData:
                item.fsrsData && typeof item.fsrsData === "object"
                  ? item.fsrsData
                  : createInitialFSRSState(),
              reviewLogs: Array.isArray(item.reviewLogs) ? item.reviewLogs : [],
              question: item.question
                ? normalizeBilingualText(item.question)
                : item.question,
              answer: item.answer
                ? normalizeBilingualText(item.answer)
                : item.answer,
              explanation: item.explanation
                ? normalizeBilingualText(item.explanation)
                : item.explanation,
            }));
        }
      }
      if (loadedItems.length === 0) {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.endsWith("_items") || k.includes("item"))) {
            try {
              const val = localStorage.getItem(k);
              if (val) {
                const parsed = JSON.parse(val);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  const valid = parsed.filter(
                    (it: any) =>
                      it && typeof it === "object" && it.id && it.question,
                  );
                  if (valid.length > 0) {
                    loadedItems = valid.map((item: any) => ({
                      ...item,
                      isActive: Boolean(item.isActive),
                      status:
                        item.status || (item.isActive ? "active" : "inactive"),
                      fsrsData:
                        item.fsrsData && typeof item.fsrsData === "object"
                          ? item.fsrsData
                          : createInitialFSRSState(),
                      reviewLogs: Array.isArray(item.reviewLogs)
                        ? item.reviewLogs
                        : [],
                      question: item.question
                        ? normalizeBilingualText(item.question)
                        : item.question,
                      answer: item.answer
                        ? normalizeBilingualText(item.answer)
                        : item.answer,
                      explanation: item.explanation
                        ? normalizeBilingualText(item.explanation)
                        : item.explanation,
                    }));
                    localStorage.setItem(
                      getUserKey(userId, "items"),
                      JSON.stringify(loadedItems),
                    );
                    break;
                  }
                }
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.warn("Error loading items", e);
      loadedItems = [];
    }

    // Safety restore: if user books were wiped in the previous turn, restore their book with "bab 1", "bab 2", "bab 3"
    if (loadedBooks.length === 0) {
      const restoredBookId = `book-user-restored`;
      const restoredBook: Book = {
        id: restoredBookId,
        userId: userId,
        title: "Kitab Belajar",
        description: "",
        coverUrl:
          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
        isPublic: false,
        category: "Umum",
        isReadonly: false,
        authorName: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const restoredChaps: Chapter[] = [
        {
          id: `chap-${restoredBookId}-1`,
          bookId: restoredBookId,
          masterChapterId: null,
          title: "bab 1",
          order: 1,
        },
        {
          id: `chap-${restoredBookId}-2`,
          bookId: restoredBookId,
          masterChapterId: null,
          title: "bab 2",
          order: 2,
        },
        {
          id: `chap-${restoredBookId}-3`,
          bookId: restoredBookId,
          masterChapterId: null,
          title: "bab 3",
          order: 3,
        },
      ];
      loadedBooks = [restoredBook];
      loadedChapters = restoredChaps;
      try {
        localStorage.setItem(
          getUserKey(userId, "books"),
          JSON.stringify(loadedBooks),
        );
        localStorage.setItem(
          getUserKey(userId, "chapters"),
          JSON.stringify(loadedChapters),
        );
        localStorage.setItem(
          getUserKey("guest", "books"),
          JSON.stringify(loadedBooks),
        );
        localStorage.setItem(
          getUserKey("guest", "chapters"),
          JSON.stringify(loadedChapters),
        );
      } catch (e) {}
    }

    // 5. My Classes: default is clean []
    let loadedMyClasses: ClassGroup[] = [];
    try {
      const cachedMyClasses = localStorage.getItem(
        getUserKey(userId, "my_classes"),
      );
      if (cachedMyClasses) {
        const parsed = JSON.parse(cachedMyClasses);
        if (Array.isArray(parsed)) {
          loadedMyClasses = parsed.filter(
            (c) => c && typeof c === "object" && c.id,
          );
        }
      }
    } catch (e) {
      console.warn("Error loading my_classes", e);
      loadedMyClasses = [];
    }

    // 6. Teaching Classes: default is INITIAL_CLASSES
    let loadedTeachingClasses: ClassGroup[] = [];
    try {
      const cachedTeachingClasses = localStorage.getItem(
        getUserKey(userId, "teaching_classes"),
      );
      if (cachedTeachingClasses) {
        const parsed = JSON.parse(cachedTeachingClasses);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedTeachingClasses = parsed.filter(
            (c) => c && typeof c === "object" && c.id,
          );
        }
      }
      if (loadedTeachingClasses.length === 0) {
        loadedTeachingClasses = INITIAL_CLASSES;
      }
    } catch (e) {
      console.warn("Error loading teaching_classes", e);
      loadedTeachingClasses = INITIAL_CLASSES;
    }

    // 7. Teacher Feedbacks: default is clean []
    let loadedTeacherFeedbacks: QuranFeedbackItem[] = [];
    try {
      const cachedFeedbacks = localStorage.getItem(
        getUserKey(userId, "teacher_feedbacks"),
      );
      if (cachedFeedbacks) {
        const parsed = JSON.parse(cachedFeedbacks);
        if (Array.isArray(parsed)) {
          loadedTeacherFeedbacks = parsed.filter(
            (f) => f && typeof f === "object" && f.id,
          );
        }
      }
    } catch (e) {
      console.warn("Error loading teacher feedbacks", e);
      loadedTeacherFeedbacks = [];
    }

    // 8. Attendance Exceptions: default is clean {}
    let loadedAttendanceExceptions: Record<string, "izin" | "sakit"> = {};
    try {
      const cachedAttendance = localStorage.getItem(
        getUserKey(userId, "attendance_exceptions"),
      );
      if (cachedAttendance) {
        const parsed = JSON.parse(cachedAttendance);
        if (parsed && typeof parsed === "object")
          loadedAttendanceExceptions = parsed;
      }
    } catch (e) {
      console.warn("Error loading attendance exceptions", e);
      loadedAttendanceExceptions = {};
    }

    // 9. Pages / Material Documents: default is clean []
    let loadedPages: PageDocument[] = [];
    try {
      const cachedPages = localStorage.getItem(getUserKey(userId, "pages"));
      if (cachedPages) {
        const parsed = JSON.parse(cachedPages);
        if (Array.isArray(parsed)) {
          loadedPages = parsed.filter(
            (p) => p && typeof p === "object" && p.id,
          );
        }
      }
    } catch (e) {
      console.warn("Error loading pages", e);
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
  const [quranPages, setQuranPages] = useState<QuranPageItem[]>(
    () => loadUserData(userProfile.id).quranPages,
  );
  const [books, setBooks] = useState<Book[]>(
    () => loadUserData(userProfile.id).books,
  );
  const [chapters, setChapters] = useState<Chapter[]>(
    () => loadUserData(userProfile.id).chapters,
  );
  const [items, setItems] = useState<BookItem[]>(
    () => loadUserData(userProfile.id).items,
  );
  const [pages, setPages] = useState<PageDocument[]>(
    () => loadUserData(userProfile.id).pages,
  );
  const [myClasses, setMyClasses] = useState<ClassGroup[]>(
    () => loadUserData(userProfile.id).myClasses,
  );
  const [teachingClasses, setTeachingClasses] = useState<ClassGroup[]>(
    () => loadUserData(userProfile.id).teachingClasses,
  );
  const [attendanceExceptions, setAttendanceExceptions] = useState<
    Record<string, "izin" | "sakit">
  >(() => loadUserData(userProfile.id).attendanceExceptions);
  const [isBooksLoading, setIsBooksLoading] = useState<boolean>(false);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [reconciliationComparison, setReconciliationComparison] =
    useState<ReconciliationComparison | null>(null);
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] =
    useState<boolean>(false);

  // Ref to track which user's data is currently loaded in memory, preventing race condition overwrites
  const loadedUserIdRef = useRef<string>(userProfile.id);
  // Ref to track remote sync updates to prevent infinite echo loops back to Firestore
  const isRemoteSyncRef = useRef<boolean>(false);

  const openLoginModal = () => {
    setAuthModalMode("login");
    setIsAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalMode("register");
    setIsAuthModalOpen(true);
  };

  const refreshBooksFromBackend = useCallback(async () => {
    const currentUid = loadedUserIdRef.current;
    if (currentUid === "guest") return;

    try {
      setIsBooksLoading(true);
      const bookListRes = await bookApiService.listBooks("personal", {
        limit: 100,
      });
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
          console.warn(
            `[Sync] Failed to load chapters/items for book ${b.id}:`,
            err,
          );
        }
      }

      if (loadedUserIdRef.current === currentUid) {
        setBooks((prev) => {
          const classOrLibraryBooks = prev.filter(
            (b) =>
              Boolean(b.classId) ||
              b.id.startsWith("class-book-") ||
              library.some((l) => l.book.id === b.id),
          );
          const mappedIds = new Set(mappedBooks.map((b) => b.id));
          const extraBooks = classOrLibraryBooks.filter(
            (b) => !mappedIds.has(b.id),
          );
          return [...mappedBooks, ...extraBooks];
        });
        setChapters((prev) => {
          const extraChapters = prev.filter(
            (c) =>
              c.id.startsWith("class-chap-") ||
              library.some((l) => l.chapters.some((lc) => lc.id === c.id)),
          );
          const mappedChapIds = new Set(allChapters.map((c) => c.id));
          return [
            ...allChapters,
            ...extraChapters.filter((c) => !mappedChapIds.has(c.id)),
          ];
        });
        setItems((prev) => {
          const extraItems = prev.filter(
            (i) =>
              i.id.startsWith("class-item-") ||
              library.some((l) => l.items.some((li) => li.id === i.id)),
          );
          const mappedItemIds = new Set(allItems.map((i) => i.id));
          return [
            ...allItems,
            ...extraItems.filter((i) => !mappedItemIds.has(i.id)),
          ];
        });
        setBooksError(null);
        try {
          localStorage.setItem(
            getUserKey(currentUid, "books"),
            JSON.stringify(mappedBooks),
          );
          localStorage.setItem(
            getUserKey(currentUid, "chapters"),
            JSON.stringify(allChapters),
          );
          localStorage.setItem(
            getUserKey(currentUid, "items"),
            JSON.stringify(allItems),
          );
        } catch (e) {}
      }
    } catch (err: any) {
      if (loadedUserIdRef.current === currentUid) {
        console.warn("[Sync] Failed to refresh books from backend:", err);
        setBooksError(err?.message || "Gagal menyinkronkan buku dari backend");
      }
    } finally {
      if (loadedUserIdRef.current === currentUid) {
        setIsBooksLoading(false);
      }
    }
  }, []);

  const refreshClassesFromBackend = useCallback(async () => {
    const currentUid = loadedUserIdRef.current;
    if (currentUid === "guest") return;

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
      console.warn("[Sync] Failed to refresh classes from backend:", err);
    }
  }, []);

  const openReconciliationModal = useCallback(async () => {
    const currentUid = loadedUserIdRef.current;
    if (currentUid === "guest") return;
    try {
      const localSnap = readLocalStorageSnapshot(currentUid);
      const remoteSnap = await readFirestoreSnapshot(currentUid);
      if (loadedUserIdRef.current !== currentUid) return;
      const comparison = compareSnapshots(localSnap, remoteSnap);
      setReconciliationComparison(comparison);
      setIsReconciliationModalOpen(true);
    } catch (err) {
      console.warn("[Reconciliation] Failed to open modal:", err);
    }
  }, []);

  const logout = async () => {
    try {
      if (activeMeAbortControllerRef.current) {
        activeMeAbortControllerRef.current.abort();
        activeMeAbortControllerRef.current = null;
      }
      setBackendAuthStatus("unauthenticated");
      setBackendAuthError(null);
      setIsBooksLoading(false);
      setBooksError(null);
      setReconciliationComparison(null);
      setIsReconciliationModalOpen(false);

      await api.logout();
      clearAuthToken();
      setCurrentUser(null);
      const guestId = "guest";
      const guestProfile: UserProfile = {
        id: guestId,
        backendId: undefined,
        quranSpaceCode: "UNL-QRN-GUEST",
        fullName: "Tamu / Murid",
        email: "",
        avatarUrl: DEFAULT_ISLAMIC_AVATAR,
        plan: "free",
        onboardingPreferences:
          userProfile.onboardingPreferences || defaultOnboardingPreferences,
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
        sessionStorage.removeItem("unlupa_in_app");
        if (window.location.hash === "#app") {
          history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search,
          );
        }
      } catch (e) {}
      setIsLandingPageOpen(true);
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  const initiateUserSession = async (backendUser: BackendUserResponse) => {
    if (activeMeAbortControllerRef.current) {
      activeMeAbortControllerRef.current.abort();
      activeMeAbortControllerRef.current = null;
    }

    const targetId = backendUser.id;

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

    const roleLower = backendUser.role.toLowerCase() as
      | "user"
      | "admin"
      | "superadmin";
    const planLower = backendUser.plan.toLowerCase() as
      | "free"
      | "premium"
      | "institutional";

    setUserProfile((prev) => ({
      ...prev,
      id: targetId,
      backendId: backendUser.id,
      email: backendUser.email || prev.email,
      fullName: backendUser.fullName || prev.fullName,
      avatarUrl: backendUser.avatarUrl || prev.avatarUrl,
      quranSpaceCode: backendUser.quranSpaceCode || prev.quranSpaceCode,
      role: roleLower,
      plan: planLower,
      onboardingPreferences:
        (backendUser.onboardingPreferences as UserOnboardingPreferences) ||
        prev.onboardingPreferences,
    }));

    setBackendAuthStatus("authenticated");
    setBackendAuthError(null);

    // 3. Fetch authoritative Quran pages from PostgreSQL backend
    try {
      const backendPages = await api.getQuranPages();
      if (
        Array.isArray(backendPages) &&
        backendPages.length > 0 &&
        loadedUserIdRef.current === targetId
      ) {
        setQuranPages((prev) => {
          const backendMap = new Map(
            backendPages.map((bp) => [Number(bp.pageNumber), bp]),
          );
          const merged = prev.map((p) => {
            const bp = backendMap.get(Number(p.pageNumber));
            if (!bp) return p;
            return {
              ...p,
              pageNumber: Number(p.pageNumber),
              isActive: Boolean(bp.isActive),
              status: (bp.status === "MASTERED_FOR_NOW"
                ? "mastered_for_now"
                : bp.isActive
                  ? "active"
                  : "inactive") as "active" | "inactive" | "mastered_for_now",
              activatedAt: bp.activatedAt
                ? new Date(bp.activatedAt).toISOString()
                : p.activatedAt,
              mapanCelebrated: Boolean(bp.mapanCelebrated),
              fsrsData: {
                stability: Number(bp.stability) || 0,
                difficulty: Number(bp.difficulty) || 10.0,
                reps: Number(bp.reps) || 0,
                lapses: Number(bp.lapses) || 0,
                lastReview: bp.lastReview
                  ? new Date(bp.lastReview).toISOString()
                  : null,
                nextReview: bp.nextReview
                  ? new Date(bp.nextReview).toISOString()
                  : null,
                state: (bp.state
                  ? bp.state.toLowerCase()
                  : "new") as FSRSState["state"],
              },
              reviewLogs: Array.isArray(bp.reviewLogs)
                ? bp.reviewLogs.map((rl: any) => ({
                    id: rl.id,
                    date: rl.date
                      ? new Date(rl.date).toISOString()
                      : new Date().toISOString(),
                    rating: rl.rating as 1 | 2 | 3,
                    previousInterval: rl.previousInterval,
                    newInterval: rl.newInterval,
                    wasDue: Boolean(rl.wasDue),
                    notes: rl.notes,
                    issueTypes: rl.issueTypes,
                    problemAyahs: rl.problemAyahs,
                  }))
                : p.reviewLogs || [],
            };
          });
          try {
            localStorage.setItem(
              getUserKey(targetId, "quran_pages"),
              JSON.stringify(merged),
            );
          } catch (e) {}
          return merged;
        });
      }
    } catch (quranErr) {
      console.warn("[Auth] Failed to load backend Quran pages:", quranErr);
    }

    // Check backend books and trigger reconciliation if legacy books exist
    try {
      const bookListRes = await bookApiService.listBooks("personal", {
        limit: 1,
      });
      if (loadedUserIdRef.current === targetId) {
        if (bookListRes.total > 0) {
          await refreshBooksFromBackend();
        } else {
          const localSnap = readLocalStorageSnapshot(targetId);
          const remoteSnap = await readFirestoreSnapshot(targetId);
          if (loadedUserIdRef.current === targetId) {
            const comparison = compareSnapshots(localSnap, remoteSnap);
            const hasRealBooks = comparison.differences.some((d) => {
              const b = d.localBook || d.firestoreBook;
              return b && !b.isSample;
            });
            if (comparison.hasData && hasRealBooks) {
              setReconciliationComparison(comparison);
              setIsReconciliationModalOpen(true);
            }
          }
        }
      }
    } catch (err) {
      console.warn("[Auth] Book backend check notice:", err);
    }

    // Fetch authoritative classes from PostgreSQL backend
    try {
      const [backendTeaching, backendJoined] = await Promise.all([
        classApiService.getTeachingClasses(),
        classApiService.getJoinedClasses(),
      ]);
      if (loadedUserIdRef.current === targetId) {
        if (Array.isArray(backendTeaching)) {
          setTeachingClasses((prev) => {
            const map = new Map<string, ClassGroup>();
            backendTeaching.forEach((c) => map.set(c.id, c));
            prev.forEach((c) => {
              if (!map.has(c.id) && !map.has(c.code)) map.set(c.id, c);
            });
            return Array.from(map.values());
          });
        }
        if (Array.isArray(backendJoined)) {
          setMyClasses((prev) => {
            const map = new Map<string, ClassGroup>();
            backendJoined.forEach((c) => map.set(c.id, c));
            prev.forEach((c) => {
              if (!map.has(c.id) && !map.has(c.code)) map.set(c.id, c);
            });
            return Array.from(map.values());
          });
        }
      }
    } catch (classErr) {
      console.warn("[Auth] Failed to load backend classes:", classErr);
    }

    // Immediately sync local books/chapters/items to Firestore if user has them
    if (accountData.books.length > 0) {
      syncToFirestore(targetId, "books", accountData.books);
      if (accountData.chapters.length > 0)
        syncToFirestore(targetId, "chapters", accountData.chapters);
      if (accountData.items.length > 0)
        syncToFirestore(targetId, "items", accountData.items);
    }

    // Clean up previous listeners if any
    if ((window as any).__unsubFirestoreListeners) {
      (window as any).__unsubFirestoreListeners();
    }

    // Real-time listen to Cloud data if available
    if (targetId !== "guest") {
      const unsub1 = listenToFirestore(targetId, "quran_pages", (data) => {
        if (!Array.isArray(data) || data.length === 0) return;
        isRemoteSyncRef.current = true;
        const fullPages = ensureComplete604Pages(data);
        setQuranPages((prev) => {
          // Smart merge: Never overwrite locally active page with stale remote inactive page!
          const merged = fullPages.map((remoteP) => {
            const pNum = Number(remoteP.pageNumber);
            const localP = prev.find((p) => Number(p.pageNumber) === pNum);
            if (!localP) return { ...remoteP, pageNumber: pNum };

            // If locally active on this device, do NOT allow stale remote snapshot to deactivate it!
            if (localP.isActive && !remoteP.isActive) {
              return { ...localP, pageNumber: pNum };
            }
            // If local has newer review reps or review history, protect it
            if ((localP.fsrsData?.reps || 0) > (remoteP.fsrsData?.reps || 0)) {
              return { ...localP, pageNumber: pNum };
            }
            return { ...remoteP, pageNumber: pNum };
          });

          if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
          try {
            localStorage.setItem(
              getUserKey(targetId, "quran_pages"),
              JSON.stringify(merged),
            );
          } catch (e) {}
          return merged;
        });
        setTimeout(() => {
          isRemoteSyncRef.current = false;
        }, 400);
      });
      const unsub2 = listenToFirestore(targetId, "books", (cloudData) => {
        if (!Array.isArray(cloudData)) return;
        isRemoteSyncRef.current = true;
        setBooks((prev) => {
          if (cloudData.length === 0 && prev.length > 0) return prev;
          if (cloudData.length > 0 && prev.length === 0) {
            try {
              localStorage.setItem(
                getUserKey(targetId, "books"),
                JSON.stringify(cloudData),
              );
            } catch (e) {}
            return cloudData;
          }
          const cloudMap = new Map(cloudData.map((b) => [b.id, b]));
          const merged = cloudData.map((cloudB) => {
            const localB = prev.find((b) => b.id === cloudB.id);
            if (!localB) return cloudB;

            // Timestamp check: if local was updated more recently, keep local properties
            const localTime = localB.updatedAt
              ? new Date(localB.updatedAt).getTime()
              : 0;
            const cloudTime = cloudB.updatedAt
              ? new Date(cloudB.updatedAt).getTime()
              : 0;
            if (localTime > cloudTime) {
              return localB;
            }

            // If local has a coverUrl and cloud is empty or stripped, preserve local coverUrl
            if (
              localB.coverUrl &&
              (!cloudB.coverUrl || cloudB.coverUrl.trim() === "")
            ) {
              return { ...cloudB, coverUrl: localB.coverUrl };
            }
            return cloudB;
          });
          const localNew = prev.filter((b) => !cloudMap.has(b.id));
          const finalMerged = [...merged, ...localNew];
          try {
            localStorage.setItem(
              getUserKey(targetId, "books"),
              JSON.stringify(finalMerged),
            );
          } catch (e) {}
          if (JSON.stringify(prev) === JSON.stringify(finalMerged)) return prev;
          return finalMerged;
        });
        setTimeout(() => {
          isRemoteSyncRef.current = false;
        }, 400);
      });
      const unsub3 = listenToFirestore(targetId, "chapters", (cloudData) => {
        if (!Array.isArray(cloudData)) return;
        isRemoteSyncRef.current = true;
        setChapters((prev) => {
          if (cloudData.length === 0 && prev.length > 0) return prev;
          if (cloudData.length > 0 && prev.length === 0) {
            try {
              localStorage.setItem(
                getUserKey(targetId, "chapters"),
                JSON.stringify(cloudData),
              );
            } catch (e) {}
            return cloudData;
          }
          const cloudMap = new Map(cloudData.map((c) => [c.id, c]));
          const localNew = prev.filter((c) => !cloudMap.has(c.id));
          const merged = [...cloudData, ...localNew];
          try {
            localStorage.setItem(
              getUserKey(targetId, "chapters"),
              JSON.stringify(merged),
            );
          } catch (e) {}
          if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
          return merged;
        });
        setTimeout(() => {
          isRemoteSyncRef.current = false;
        }, 400);
      });
      const unsub4 = listenToFirestore(targetId, "items", (cloudData) => {
        if (!Array.isArray(cloudData)) return;
        isRemoteSyncRef.current = true;
        setItems((prev) => {
          if (cloudData.length === 0 && prev.length > 0) return prev;
          if (cloudData.length > 0 && prev.length === 0) {
            try {
              localStorage.setItem(
                getUserKey(targetId, "items"),
                JSON.stringify(cloudData),
              );
            } catch (e) {}
            return cloudData;
          }
          const cloudMap = new Map(cloudData.map((i) => [i.id, i]));
          const localNew = prev.filter((i) => !cloudMap.has(i.id));
          const merged = [...cloudData, ...localNew];
          try {
            localStorage.setItem(
              getUserKey(targetId, "items"),
              JSON.stringify(merged),
            );
          } catch (e) {}
          if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
          return merged;
        });
        setTimeout(() => {
          isRemoteSyncRef.current = false;
        }, 400);
      });
      const unsubPages = listenToFirestore(targetId, "pages", (data) => {
        if (!Array.isArray(data)) return;
        isRemoteSyncRef.current = true;
        setPages((prev) => {
          const cloudMap = new Map(data.map((p: any) => [p.id, p]));
          const localNew = prev.filter((p) => !cloudMap.has(p.id));
          const merged = [...data, ...localNew];
          try {
            localStorage.setItem(
              getUserKey(targetId, "pages"),
              JSON.stringify(merged),
            );
          } catch (e) {}
          if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
          return merged;
        });
        setTimeout(() => {
          isRemoteSyncRef.current = false;
        }, 400);
      });
      const unsub5 = listenToFirestore(targetId, "my_classes", (data) => {
        if (!Array.isArray(data)) return;
        isRemoteSyncRef.current = true;
        setMyClasses((prev) =>
          JSON.stringify(prev) !== JSON.stringify(data) ? data : prev,
        );
        setTimeout(() => {
          isRemoteSyncRef.current = false;
        }, 400);
      });
      const unsub6 = listenToFirestore(
        targetId,
        "teacher_feedbacks",
        (data) => {
          if (!Array.isArray(data)) return;
          isRemoteSyncRef.current = true;
          setTeacherFeedbacks((prev) =>
            JSON.stringify(prev) !== JSON.stringify(data) ? data : prev,
          );
          setTimeout(() => {
            isRemoteSyncRef.current = false;
          }, 400);
        },
      );
      const unsub7 = listenToFirestore(
        targetId,
        "attendance_exceptions",
        (data) => {
          if (!data || typeof data !== "object") return;
          isRemoteSyncRef.current = true;
          setAttendanceExceptions((prev) =>
            JSON.stringify(prev) !== JSON.stringify(data) ? data : prev,
          );
          setTimeout(() => {
            isRemoteSyncRef.current = false;
          }, 400);
        },
      );

      // We will store dynamic class student listeners here
      (window as any).__classStudentListeners =
        (window as any).__classStudentListeners || {};

      const unsub8 = listenToFirestore(targetId, "teaching_classes", (data) => {
        if (!Array.isArray(data)) return;
        isRemoteSyncRef.current = true;
        setTeachingClasses((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(data)) return prev;

          data.forEach((cls: ClassGroup) => {
            if (
              cls &&
              cls.id &&
              !(window as any).__classStudentListeners[cls.id]
            ) {
              (window as any).__classStudentListeners[cls.id] =
                listenToClassStudentsGlobal(cls.id, (globalStudents) => {
                  if (!Array.isArray(globalStudents)) return;
                  setTeachingClasses((currentClasses) => {
                    return currentClasses.map((c) => {
                      if (c.id !== cls.id) return c;
                      let newStudents = [...c.students];
                      let modified = false;
                      for (const gStd of globalStudents) {
                        const index = newStudents.findIndex(
                          (s) => s.id === gStd.id,
                        );
                        if (index === -1) {
                          newStudents.push(gStd);
                          modified = true;
                        } else {
                          if (
                            JSON.stringify(newStudents[index]) !==
                            JSON.stringify(gStd)
                          ) {
                            newStudents[index] = gStd;
                            modified = true;
                          }
                        }
                      }
                      return modified ? { ...c, students: newStudents } : c;
                    });
                  });
                });
            }
          });

          return data;
        });
        setTimeout(() => {
          isRemoteSyncRef.current = false;
        }, 400);
      });

      // Store unsubs to cleanup on unmount/re-login
      (window as any).__unsubFirestoreListeners = () => {
        unsub1?.();
        unsub2?.();
        unsub3?.();
        unsub4?.();
        unsubPages?.();
        unsub5?.();
        unsub6?.();
        unsub7?.();
        unsub8?.();
        if ((window as any).__classStudentListeners) {
          Object.values((window as any).__classStudentListeners).forEach(
            (unsub: any) => unsub && unsub(),
          );
          (window as any).__classStudentListeners = {};
        }
      };
    }
  };

  // Restore authenticated JWT session on mount
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setBackendAuthStatus("unauthenticated");
      return;
    }

    const controller = new AbortController();
    activeMeAbortControllerRef.current = controller;
    setBackendAuthStatus("loading");
    setBackendAuthError(null);

    api
      .getMe(controller.signal)
      .then(async (backendUser) => {
        if (controller.signal.aborted) return;
        await initiateUserSession(backendUser);
      })
      .catch((err: any) => {
        if (controller.signal.aborted || err?.isAborted) return;
        console.warn(
          "[Auth] Stored JWT session invalid or expired:",
          err?.message || err,
        );
        clearAuthToken();
        setBackendAuthStatus("unauthenticated");
        setCurrentUser(null);
        const guestId = "guest";
        loadedUserIdRef.current = guestId;
        setUserProfile({
          id: guestId,
          backendId: undefined,
          quranSpaceCode: "UNL-QRN-GUEST",
          fullName: "Tamu / Murid",
          email: "",
          avatarUrl: DEFAULT_ISLAMIC_AVATAR,
          role: "user",
          plan: "free",
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
      if ((window as any).__unsubFirestoreListeners) {
        (window as any).__unsubFirestoreListeners();
      }
    };
  }, []);

  const [library, setLibrary] = useState<LibraryEntry[]>(() => {
    const saved = localStorage.getItem("ai_quran_library");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return CURATED_LIBRARY;
  });

  useEffect(() => {
    localStorage.setItem("ai_quran_library", JSON.stringify(library));
  }, [library]);

  // Load public library from Firestore on mount
  useEffect(() => {
    let isMounted = true;
    const loadPublicLibrary = async () => {
      try {
        const fetched = await fetchPublicLibrary();
        if (isMounted && fetched && fetched.length > 0) {
          // Merge with CURATED_LIBRARY (or local ones) prioritizing firestore
          setLibrary((prev) => {
            const merged = [...fetched];
            const fetchedIds = new Set(fetched.map((f) => f.id));
            prev.forEach((p) => {
              if (!fetchedIds.has(p.id)) {
                merged.push(p);
              }
            });
            return merged;
          });
        }
      } catch (e) {
        console.warn("Failed to load public library from Firestore", e);
      }
    };
    loadPublicLibrary();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to localStorage scoped by user
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SPACE, activeSpace);
  }, [activeSpace]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  }, [language]);

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(
        getUserKey(userProfile.id, "quran_pages"),
        JSON.stringify(quranPages),
      );

      syncToFirestore(userProfile.id, "quran_pages", quranPages);

      // Sync quran progress to all enrolled quran classes
      if (myClasses.length > 0 && userProfile.id !== "guest") {
        const activePages = quranPages.filter((p) => p.isActive);
        const duePages = quranPages.filter((p) =>
          isDue(p.fsrsData.nextReview, p.isActive, p.fsrsData.lastReview),
        );
        const avgStability =
          activePages.length > 0
            ? Number(
                (
                  activePages.reduce(
                    (acc, p) => acc + p.fsrsData.stability,
                    0,
                  ) / activePages.length
                ).toFixed(1),
              )
            : 0;

        myClasses
          .filter((c) => c.type === "quran")
          .forEach((cls) => {
            const studentUpdate = {
              id: `std-user-${userProfile.id}`,
              quranSpaceCode: quranSpaceCode,
              name: userProfile.fullName || "Santri",
              email: userProfile.email,
              avatarUrl: userProfile.avatarUrl,
              activeItemsCount: activePages.length,
              dueTodayCount: duePages.length,
              averageStability: avgStability,
              retentionRate: 95,
              lastActive: new Date().toISOString(),
              frequentStruggles: [],
              quranData: quranPages,
            };
            enrollStudentInGlobalClass(cls.id, studentUpdate.id, studentUpdate);
          });
      }
    } catch (e) {
      /* ignore */
    }
  }, [quranPages, userProfile.id, myClasses, quranSpaceCode]);

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(
        getUserKey(userProfile.id, "books"),
        JSON.stringify(books),
      );

      syncToFirestore(userProfile.id, "books", books);
    } catch (e) {
      /* ignore */
    }
  }, [books, userProfile.id]);

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(
        getUserKey(userProfile.id, "chapters"),
        JSON.stringify(chapters),
      );

      syncToFirestore(userProfile.id, "chapters", chapters);
    } catch (e) {
      /* ignore */
    }
  }, [chapters, userProfile.id]);

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(
        getUserKey(userProfile.id, "items"),
        JSON.stringify(items),
      );

      syncToFirestore(userProfile.id, "items", items);

      // Sync items progress to all enrolled non-quran classes
      if (myClasses.length > 0 && userProfile.id !== "guest") {
        myClasses
          .filter((c) => c.type === "non-quran")
          .forEach((cls) => {
            // Robust match: matches direct class book ID, or assigned book ID with or without prefix
            const classItems = items.filter(
              (i) =>
                i.bookId?.startsWith(`class-book-${cls.id}-`) ||
                (cls.assignedBookIds || []).some(
                  (bId) =>
                    i.bookId === bId ||
                    i.bookId === `class-book-${cls.id}-${bId}`,
                ),
            );
            const activeItems = classItems.filter((i) => i.isActive);
            const dueItems = classItems.filter((i) =>
              isDue(i.fsrsData.nextReview, i.isActive, i.fsrsData.lastReview),
            );
            const avgStability =
              activeItems.length > 0
                ? Number(
                    (
                      activeItems.reduce(
                        (acc, p) => acc + (p.fsrsData.stability || 0),
                        0,
                      ) / activeItems.length
                    ).toFixed(1),
                  )
                : 0;

            const studentUpdate = {
              id: `std-user-${userProfile.id}`,
              quranSpaceCode: quranSpaceCode,
              name: userProfile.fullName || "Santri",
              email: userProfile.email,
              avatarUrl: userProfile.avatarUrl,
              activeItemsCount: activeItems.length,
              dueTodayCount: dueItems.length,
              averageStability: avgStability,
              retentionRate: 95,
              lastActive: new Date().toISOString(),
              frequentStruggles: [],
              bookItemsData: classItems,
            };
            enrollStudentInGlobalClass(cls.id, studentUpdate.id, studentUpdate);
          });
      }
    } catch (e) {
      /* ignore */
    }
  }, [items, userProfile.id, myClasses, quranSpaceCode]);

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(
        getUserKey(userProfile.id, "pages"),
        JSON.stringify(pages),
      );
      syncToFirestore(userProfile.id, "pages", pages);
    } catch (e) {
      /* ignore */
    }
  }, [pages, userProfile.id]);

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(
        getUserKey(userProfile.id, "my_classes"),
        JSON.stringify(myClasses),
      );

      syncToFirestore(userProfile.id, "my_classes", myClasses);
    } catch (e) {
      /* ignore */
    }
  }, [myClasses, userProfile.id]);

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(
        getUserKey(userProfile.id, "teaching_classes"),
        JSON.stringify(teachingClasses),
      );

      syncToFirestore(userProfile.id, "teaching_classes", teachingClasses);
    } catch (e) {
      /* ignore */
    }
  }, [teachingClasses, userProfile.id]);

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(
        getUserKey(userProfile.id, "teacher_feedbacks"),
        JSON.stringify(teacherFeedbacks),
      );

      syncToFirestore(userProfile.id, "teacher_feedbacks", teacherFeedbacks);
    } catch (e) {
      /* ignore */
    }
  }, [teacherFeedbacks, userProfile.id]);

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(
        getUserKey(userProfile.id, "attendance_exceptions"),
        JSON.stringify(attendanceExceptions),
      );

      syncToFirestore(
        userProfile.id,
        "attendance_exceptions",
        attendanceExceptions,
      );
    } catch (e) {
      /* ignore */
    }
  }, [attendanceExceptions, userProfile.id]);

  // Real-time listener for enrolled students: sync teacher feedbacks & activations to student's room
  useEffect(() => {
    if (!userProfile.id || userProfile.id === "guest" || myClasses.length === 0)
      return;
    (window as any).__studentEnrolledClassListeners =
      (window as any).__studentEnrolledClassListeners || {};

    myClasses.forEach((cls) => {
      const listenerKey = `${cls.id}_std-user-${userProfile.id}`;
      if (!(window as any).__studentEnrolledClassListeners[listenerKey]) {
        const unsub = listenToStudentInClassGlobal(
          cls.id,
          `std-user-${userProfile.id}`,
          (studentData) => {
            if (!studentData) return;

            // 1. Sync any teacher feedbacks
            if (
              Array.isArray(studentData.teacherFeedbacks) &&
              studentData.teacherFeedbacks.length > 0
            ) {
              setTeacherFeedbacks((prev) => {
                const existingIds = new Set(prev.map((f) => f.id));
                const newFeedbacks = studentData.teacherFeedbacks.filter(
                  (f: any) => !existingIds.has(f.id),
                );
                if (newFeedbacks.length === 0) return prev;
                return [...newFeedbacks, ...prev];
              });
            }

            // 2. If it's a Quran class, sync teacher page activations
            if (
              cls.type === "quran" &&
              Array.isArray(studentData.quranData) &&
              studentData.quranData.length > 0
            ) {
              setQuranPages((prevPages) => {
                let changed = false;
                const remotePages = studentData.quranData as QuranPageItem[];
                const updated = prevPages.map((localP) => {
                  const remoteP = remotePages.find(
                    (rp) => rp.pageNumber === localP.pageNumber,
                  );
                  if (remoteP && remoteP.isActive && !localP.isActive) {
                    changed = true;
                    return remoteP;
                  }
                  return localP;
                });
                return changed ? updated : prevPages;
              });
            }

            // 3. If it's a non-Quran class, sync teacher book item activations
            if (
              cls.type === "non-quran" &&
              Array.isArray(studentData.bookItemsData) &&
              studentData.bookItemsData.length > 0
            ) {
              setItems((prevItems) => {
                let changed = false;
                const remoteItems = studentData.bookItemsData as BookItem[];
                const updated = prevItems.map((localItem) => {
                  const remoteItem = remoteItems.find(
                    (ri) =>
                      ri.id === localItem.id ||
                      ri.masterItemId === localItem.id,
                  );
                  if (
                    remoteItem &&
                    remoteItem.isActive &&
                    !localItem.isActive
                  ) {
                    changed = true;
                    return {
                      ...localItem,
                      isActive: true,
                      status: remoteItem.status,
                      fsrsData: remoteItem.fsrsData,
                    };
                  }
                  return localItem;
                });
                return changed ? updated : prevItems;
              });
            }
          },
        );
        (window as any).__studentEnrolledClassListeners[listenerKey] = unsub;
      }
    });
  }, [myClasses, userProfile.id]);

  // Real-time auto-sync: When teacher updates books, chapters, or items, keep teaching classes' assignedBooksData updated
  useEffect(() => {
    if (
      !userProfile.id ||
      userProfile.id === "guest" ||
      teachingClasses.length === 0
    )
      return;
    const nonQuranClasses = teachingClasses.filter(
      (c) => c.type === "non-quran" && c.teacherId === userProfile.id,
    );
    if (nonQuranClasses.length === 0) return;

    nonQuranClasses.forEach((cls) => {
      const bIds = cls.assignedBookIds || [];
      const updatedPackages: AssignedBookData[] = bIds
        .map((bId) => {
          const foundBook =
            books.find((b) => b.id === bId) ||
            INITIAL_BOOKS.find((b) => b.id === bId);
          if (!foundBook) return null;
          const bChaps = chapters.filter((c) => c.bookId === bId);
          const bItems = items.filter((i) => i.bookId === bId);
          return {
            book: foundBook,
            chapters:
              bChaps.length > 0
                ? bChaps
                : INITIAL_CHAPTERS.filter((c) => c.bookId === bId),
            items:
              bItems.length > 0
                ? bItems
                : INITIAL_ITEMS.filter((i) => i.bookId === bId),
          };
        })
        .filter(Boolean) as AssignedBookData[];

      const currentSerialized = JSON.stringify(cls.assignedBooksData || []);
      const newSerialized = JSON.stringify(updatedPackages);
      if (currentSerialized !== newSerialized) {
        const updatedCls = { ...cls, assignedBooksData: updatedPackages };
        syncClassToGlobal(updatedCls);
        setTeachingClasses((prev) =>
          prev.map((c) => (c.id === cls.id ? updatedCls : c)),
        );
      }
    });
  }, [items, chapters, books, userProfile.id, teachingClasses.length]);

  const markAttendanceException = (
    date: string,
    status: "izin" | "sakit" | null,
  ) => {
    setAttendanceExceptions((prev) => {
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
      const saved = localStorage.getItem("unlupa_system_transactions_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      /* ignore */
    }
    return [
      {
        id: "INV-20260228-8921",
        userId: "usr-student-demo-01",
        userName: "Ahmad Fadhil Hidayat",
        userEmail: "fadhil.hidayat@example.com",
        type: "book_purchase",
        bookId: "lib-book-7",
        libraryEntryId: "lib-7",
        bookTitle: "Shahih Riyadhus Shalihin (Edisi Eksklusif Adab & Niat)",
        authorName: "Imam Abu Zakariyya An-Nawawi (Tahqiq & Syarah)",
        amount: 35000,
        platformFee: 5250,
        authorRoyalty: 29750,
        paymentMethod: "qris",
        status: "success",
        paidAt: "2026-02-28T10:15:30.000Z",
        createdAt: "2026-02-28T10:14:00.000Z",
      },
      {
        id: "INV-20260301-4192",
        userId: "usr-student-demo-02",
        userName: "Siti Maryam Az-Zahra",
        userEmail: "maryam.azzahra@example.com",
        type: "book_purchase",
        bookId: "lib-book-8",
        libraryEntryId: "lib-8",
        bookTitle: "Alfiyyah Ibnu Malik - Jilid 1 (1000 Bait Kaidah Nahwu)",
        authorName: "Al-Allamah Jamaluddin Muhammad bin Malik",
        amount: 65000,
        platformFee: 9750,
        authorRoyalty: 55250,
        paymentMethod: "bca_va",
        status: "success",
        paidAt: "2026-03-01T14:22:10.000Z",
        createdAt: "2026-03-01T14:20:00.000Z",
      },
      {
        id: "INV-20260302-7734",
        userId: "usr-student-demo-03",
        userName: "Muhammad Zaki Ar-Rasyid",
        userEmail: "zaki.rasyid@example.com",
        type: "book_purchase",
        bookId: "lib-book-9",
        libraryEntryId: "lib-9",
        bookTitle: "Mandhumah Al-Jazariyyah (Tajwid Tingkat Lanjutan)",
        authorName: "Al-Imam Syamsuddin Muhammad Ibnul Jazari",
        amount: 25000,
        platformFee: 3750,
        authorRoyalty: 21250,
        paymentMethod: "gopay",
        status: "success",
        paidAt: "2026-03-02T09:45:00.000Z",
        createdAt: "2026-03-02T09:43:00.000Z",
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "unlupa_system_transactions_v1",
        JSON.stringify(transactions),
      );
    } catch (e) {
      /* ignore */
    }
  }, [transactions]);

  const [purchasedBookIds, setPurchasedBookIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(
        getUserKey(userProfile.id, "purchased_books"),
      );
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      /* ignore */
    }
    return [];
  });

  useEffect(() => {
    if (loadedUserIdRef.current !== userProfile.id) return;
    try {
      localStorage.setItem(
        getUserKey(userProfile.id, "purchased_books"),
        JSON.stringify(purchasedBookIds),
      );

      syncToFirestore(userProfile.id, "purchased_books", purchasedBookIds);
    } catch (e) {
      /* ignore */
    }
  }, [purchasedBookIds, userProfile.id]);

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] =
    useState<boolean>(false);
  const [selectedCheckoutEntry, setSelectedCheckoutEntry] =
    useState<LibraryEntry | null>(null);

  const openCheckoutModal = (entry: LibraryEntry) => {
    setSelectedCheckoutEntry(entry);
    setIsCheckoutModalOpen(true);
  };

  const closeCheckoutModal = () => {
    setIsCheckoutModalOpen(false);
    setSelectedCheckoutEntry(null);
  };

  const isBookPurchased = (libraryEntryId: string, book?: Book): boolean => {
    if (userProfile.plan === "institutional") return true;
    const price =
      book?.price ??
      library.find(
        (l) => l.id === libraryEntryId || l.book.id === libraryEntryId,
      )?.book.price ??
      0;
    if (price <= 0) return true;
    if (
      purchasedBookIds.includes(libraryEntryId) ||
      (book?.id && purchasedBookIds.includes(book.id))
    )
      return true;
    return books.some(
      (b) =>
        b.id === (book?.id || libraryEntryId) ||
        b.id === `lib-book-${libraryEntryId.replace("lib-", "")}`,
    );
  };

  const purchaseBook = async (
    entry: LibraryEntry,
    paymentMethod: PaymentMethod,
  ): Promise<{ success: boolean; transaction: BookTransaction }> => {
    const amount = entry.book.price || 0;
    const platformFee = Math.round(amount * 0.15);
    const authorRoyalty = amount - platformFee;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const txId = `INV-${dateStr}-${randSuffix}`;

    const newTx: BookTransaction = {
      id: txId,
      userId: userProfile.id,
      userName: userProfile.fullName || "Pengguna Unlupa",
      userEmail: userProfile.email || "user@unlupa.id",
      type: "book_purchase",
      bookId: entry.book.id,
      libraryEntryId: entry.id,
      bookTitle: entry.book.title,
      bookCoverUrl: entry.book.coverUrl,
      authorName: entry.book.authorName || entry.curator || "Penulis Kitab",
      amount,
      platformFee,
      authorRoyalty,
      paymentMethod,
      status: "success",
      paidAt: now.toISOString(),
      createdAt: now.toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);
    setPurchasedBookIds((prev) =>
      Array.from(new Set([...prev, entry.id, entry.book.id])),
    );

    // Auto import to user's personal space
    importFromLibrary(entry.id);

    return { success: true, transaction: newTx };
  };

  const subscribeToPro = async (
    cycle: "monthly" | "yearly",
    paymentMethod: PaymentMethod,
  ): Promise<{ success: boolean; transaction: BookTransaction }> => {
    const amount =
      cycle === "yearly"
        ? tierConfig?.pricing?.yearlyIDR || 399000
        : tierConfig?.pricing?.monthlyIDR || 49000;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const txId = `INV-SUBS-${dateStr}-${randSuffix}`;

    const newTx: BookTransaction = {
      id: txId,
      userId: userProfile.id,
      userName: userProfile.fullName || "Pengguna Unlupa",
      userEmail: userProfile.email || "user@unlupa.id",
      type:
        cycle === "yearly"
          ? "subscription_pro_yearly"
          : "subscription_pro_monthly",
      bookTitle:
        cycle === "yearly"
          ? "Langganan Unlupa Pro (1 Tahun Penuh)"
          : "Langganan Unlupa Pro (1 Bulan)",
      authorName: "Unlupa Official Platform",
      amount,
      platformFee: amount,
      authorRoyalty: 0,
      paymentMethod,
      status: "success",
      paidAt: now.toISOString(),
      createdAt: now.toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);
    updateUserProfile({ plan: "premium" });

    return { success: true, transaction: newTx };
  };

  // Handle Onboarding dismissal
  const handleCloseOnboarding = (open: boolean) => {
    setIsOnboardingOpen(open);
    if (!open) {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, "true");
    }
  };

  // Quran Actions
  const activateQuranPage = (pageNumber: number) => {
    const targetNum = Number(pageNumber);
    triggerXpReward(
      50,
      language === "en"
        ? "New Page Ziyadah! (+50 XP)"
        : "Ziyadah Halaman Baru! (+50 XP)",
    );
    const currentUid = loadedUserIdRef.current;

    setQuranPages((prev) => {
      const updated = prev.map((p) => {
        if (Number(p.pageNumber) !== targetNum) return p;
        const today = new Date();
        const isMapan =
          p.status === "mastered_for_now" ||
          p.fsrsData.stability >= 74.5 ||
          Math.round((p.fsrsData.stability || 0) * 0.4025587) > 30;

        // CRITICAL: Preserve existing nextReview date if card already has prior FSRS schedule data!
        const hasHistory =
          (p.fsrsData.reps || 0) > 0 ||
          Boolean(p.fsrsData.lastReview) ||
          Boolean(p.fsrsData.nextReview);
        const nextReviewDate =
          hasHistory && p.fsrsData.nextReview
            ? p.fsrsData.nextReview
            : today.toISOString();

        const newState: "new" | "learning" | "review" | "mastered" =
          (p.fsrsData.reps || 0) > 0
            ? isMapan
              ? "mastered"
              : "review"
            : "new";

        return {
          ...p,
          pageNumber: targetNum,
          isActive: true,
          activatedAt: p.activatedAt || today.toISOString(),
          status: isMapan
            ? "mastered_for_now"
            : p.status === "inactive"
              ? "active"
              : p.status,
          fsrsData: {
            ...p.fsrsData,
            nextReview: nextReviewDate,
            state: newState,
          },
        };
      });
      try {
        localStorage.setItem(
          getUserKey(currentUid, "quran_pages"),
          JSON.stringify(updated),
        );
      } catch (e) {}
      return updated;
    });

    // Persist to PostgreSQL backend if authenticated
    if (currentUid && currentUid !== "guest") {
      api.activateQuranPage(targetNum).catch((err) => {
        console.error("[Quran] Backend activation failed:", err);
      });
    }
  };

  const deactivateQuranPage = (pageNumber: number) => {
    const targetNum = Number(pageNumber);
    const currentUid = loadedUserIdRef.current;

    setQuranPages((prev) => {
      const updated = prev.map((p) => {
        if (Number(p.pageNumber) !== targetNum) return p;
        return {
          ...p,
          pageNumber: targetNum,
          isActive: false,
          // Preserve p.status and full fsrsData history (reps, stability, lapses, etc.)
        };
      });
      try {
        localStorage.setItem(
          getUserKey(currentUid, "quran_pages"),
          JSON.stringify(updated),
        );
      } catch (e) {}
      return updated;
    });

    // Persist to PostgreSQL backend if authenticated
    if (currentUid && currentUid !== "guest") {
      api.deactivateQuranPage(targetNum).catch((err) => {
        console.error("[Quran] Backend deactivation failed:", err);
      });
    }
  };

  const reviewQuranPage = (
    pageNumber: number,
    rating: 1 | 2 | 3,
    feedback?: {
      notes?: string;
      issueTypes?: ("kelancaran" | "tajwid" | "makharijul" | "konsentrasi")[];
      problemAyahs?: string;
    },
  ): {
    newState: FSRSState;
    nextIntervalDays: number;
    isMasteredForNow: boolean;
    justBecameMastered: boolean;
  } | null => {
    let result: {
      newState: FSRSState;
      nextIntervalDays: number;
      isMasteredForNow: boolean;
      justBecameMastered: boolean;
    } | null = null;
    const currentUid = loadedUserIdRef.current;

    setQuranPages((prev) => {
      const updated = prev.map((p) => {
        if (p.pageNumber !== pageNumber) return p;

        // Periksa apakah halaman ini sebelumnya memang sudah berstatus Mapan atau sudah pernah dirayakan
        const wasAlreadyMastered =
          p.status === "mastered_for_now" ||
          !!p.mapanCelebrated ||
          p.fsrsData.stability >= 74.5 ||
          Math.round((p.fsrsData.stability || 0) * 0.4025587) > 30;

        const previousInterval = Math.round(
          (p.fsrsData.stability || 0) * 0.4025587,
        );
        const res = updateQuranFSRS(
          p.fsrsData,
          rating,
          new Date(),
          p.mapanSchedule,
        );

        // Halaman HANYA dianggap "baru saja Mapan" jika sebelumnya belum pernah mapan, dan hasil review ini mencapai batas Mapan (>30 hari)
        const justBecameMastered = !wasAlreadyMastered && res.isMasteredForNow;

        result = { ...res, justBecameMastered };

        const wasDue = isDue(
          p.fsrsData.nextReview,
          p.isActive,
          p.fsrsData.lastReview,
        );
        const reviewLog: PageReviewLog = {
          id: Math.random().toString(36).substring(7),
          date: new Date().toISOString(),
          rating,
          previousInterval,
          newInterval: res.nextIntervalDays,
          wasDue,
          notes: feedback?.notes,
          issueTypes: feedback?.issueTypes,
          problemAyahs: feedback?.problemAyahs,
        };

        return {
          ...p,
          status: (res.isMasteredForNow ? "mastered_for_now" : "active") as
            | "active"
            | "inactive"
            | "mastered_for_now",
          mapanCelebrated:
            p.mapanCelebrated || justBecameMastered || res.isMasteredForNow,
          fsrsData: res.newState,
          reviewLogs: [...(p.reviewLogs || []), reviewLog].slice(-100),
        };
      });

      try {
        localStorage.setItem(
          getUserKey(currentUid, "quran_pages"),
          JSON.stringify(updated),
        );
      } catch (e) {}

      return updated;
    });

    // Persist to PostgreSQL backend if authenticated
    if (currentUid && currentUid !== "guest") {
      api
        .reviewQuranPage(pageNumber, {
          rating,
          notes: feedback?.notes,
          issueTypes: feedback?.issueTypes,
          problemAyahs: feedback?.problemAyahs,
        })
        .then((serverRes) => {
          if (serverRes?.reviewLog?.id) {
            setQuranPages((prev) =>
              prev.map((p) => {
                if (p.pageNumber !== pageNumber) return p;
                const logs = [...(p.reviewLogs || [])];
                if (
                  logs.length > 0 &&
                  logs[logs.length - 1].rating === rating
                ) {
                  logs[logs.length - 1] = {
                    ...logs[logs.length - 1],
                    id: serverRes.reviewLog.id,
                  };
                }
                return { ...p, reviewLogs: logs };
              }),
            );
          }
        })
        .catch((err) => {
          console.error("[Quran] Backend review persistence failed:", err);
        });
    }

    return result;
  };

  const bypassQuranPageToMapan = (
    pageNumber: number,
    config?: MapanScheduleConfig,
  ) => {
    setQuranPages((prev) =>
      prev.map((p) => {
        if (p.pageNumber !== pageNumber) return p;
        const scheduled = calculateNextMapanDate(
          config || p.mapanSchedule,
          35,
          new Date(),
        );
        return {
          ...p,
          isActive: true,
          status: "mastered_for_now",
          mapanCelebrated: true,
          mapanSchedule: config || p.mapanSchedule,
          fsrsData: {
            stability: 87.0,
            difficulty: 5.0,
            reps: Math.max(p.fsrsData.reps, 25),
            lapses: p.fsrsData.lapses,
            lastReview: new Date().toISOString(),
            nextReview: scheduled.nextDate.toISOString(),
            state: "mastered",
          },
        };
      }),
    );
  };

  const addQuranPageIssue = (
    pageNumber: number,
    issue: Omit<
      import("../types").PageIssue,
      "id" | "createdAt" | "isResolved"
    >,
  ) => {
    setQuranPages((prev) =>
      prev.map((p) => {
        if (p.pageNumber !== pageNumber) return p;
        const newIssue = {
          ...issue,
          id: Math.random().toString(36).substring(7),
          createdAt: new Date().toISOString(),
          isResolved: false,
        };
        return {
          ...p,
          issues: [...(p.issues || []), newIssue],
        };
      }),
    );
  };

  const resolveQuranPageIssue = (pageNumber: number, issueId: string) => {
    setQuranPages((prev) =>
      prev.map((p) => {
        if (p.pageNumber !== pageNumber) return p;
        return {
          ...p,
          issues: (p.issues || []).map((issue) =>
            issue.id === issueId
              ? {
                  ...issue,
                  isResolved: true,
                  resolvedAt: new Date().toISOString(),
                }
              : issue,
          ),
        };
      }),
    );
  };

  const addQuranPageFeedback = (
    pageNumber: number,
    feedback: {
      notes?: string;
      issueTypes?: ("kelancaran" | "tajwid" | "makharijul" | "konsentrasi")[];
      problemAyahs?: string;
    },
  ) => {
    setQuranPages((prev) =>
      prev.map((p) => {
        if (p.pageNumber !== pageNumber) return p;

        const newLog = {
          id: Math.random().toString(36).substring(7),
          date: new Date().toISOString(),
          rating: 2 as 1 | 2 | 3, // Default mapping if just a note without formal review
          previousInterval: Math.round((p.fsrsData.stability || 0) * 0.4025587),
          newInterval: Math.round((p.fsrsData.stability || 0) * 0.4025587),
          notes: feedback.notes,
          issueTypes: feedback.issueTypes,
          problemAyahs: feedback.problemAyahs,
        };

        return {
          ...p,
          reviewLogs: [...(p.reviewLogs || []), newLog],
        };
      }),
    );
  };

  const updateQuranMapanSchedule = (
    pageNumber: number,
    config: MapanScheduleConfig,
  ) => {
    setQuranPages((prev) =>
      prev.map((p) => {
        if (p.pageNumber !== pageNumber) return p;
        let nextReview = p.fsrsData.nextReview;
        const rawInterval = Math.round(
          (p.fsrsData.stability || 78) * 0.4025587,
        );
        if (p.status === "mastered_for_now" || rawInterval > 30) {
          const scheduled = calculateNextMapanDate(
            config,
            rawInterval,
            new Date(p.fsrsData.lastReview || new Date()),
          );
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
      }),
    );
  };

  const setGlobalMapanSchedule = (config: MapanScheduleConfig) => {
    setQuranPages((prev) =>
      prev.map((p) => {
        const rawInterval = Math.round(p.fsrsData.stability * 0.4025587);
        if (p.status === "mastered_for_now" || rawInterval > 30) {
          const scheduled = calculateNextMapanDate(
            config,
            rawInterval,
            new Date(),
          );
          return {
            ...p,
            mapanSchedule: config,
            mapanCelebrated: true,
            fsrsData: {
              ...p.fsrsData,
              nextReview: scheduled.nextDate.toISOString(),
            },
          };
        }
        return {
          ...p,
          mapanSchedule: config,
        };
      }),
    );
  };

  const resetQuranPageMapan = (pageNumber: number) => {
    setQuranPages((prev) =>
      prev.map((p) => {
        if (p.pageNumber !== pageNumber) return p;
        return {
          ...p,
          isActive: true,
          status: "active",
          mapanCelebrated: false,
          fsrsData: {
            stability: 1.3,
            difficulty: 5.0,
            reps: 0,
            lapses: 0,
            lastReview: null,
            nextReview: new Date().toISOString(),
            state: "new",
          },
        };
      }),
    );
  };

  // Non-Quran Item Actions
  const activateItem = (itemId: string) => {
    triggerXpReward(
      5,
      language === "en"
        ? "New Card Activated (+5 XP)"
        : "Kartu Baru Aktif (+5 XP)",
    );
    let previousSnapshot: BookItem[] = [];
    setItems((prev) => {
      previousSnapshot = prev;
      return prev.map((item) => {
        if (item.id !== itemId) return item;
        const today = new Date();
        const hasHistory =
          (item.fsrsData.reps || 0) > 0 ||
          Boolean(item.fsrsData.lastReview) ||
          Boolean(item.fsrsData.nextReview);
        const nextReviewDate =
          hasHistory && item.fsrsData.nextReview
            ? item.fsrsData.nextReview
            : today.toISOString();

        return {
          ...item,
          isActive: true,
          status: item.status === "inactive" ? "active" : item.status,
          fsrsData: {
            ...item.fsrsData,
            nextReview: nextReviewDate,
            state: (item.fsrsData.reps || 0) > 0 ? "review" : "new",
          },
        };
      });
    });

    if (
      userProfile.id !== "guest" &&
      userProfile.backendId &&
      isValidUUID(itemId)
    ) {
      const currentUid = userProfile.id;
      bookApiService
        .activateItem(itemId)
        .then((progress) => {
          if (loadedUserIdRef.current !== currentUid) return;
          setItems((prev) =>
            prev.map((item) => {
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
                  lastReview: progress.lastReview
                    ? new Date(progress.lastReview).toISOString()
                    : null,
                  nextReview: progress.nextReview
                    ? new Date(progress.nextReview).toISOString()
                    : null,
                  state: (progress.state
                    ? progress.state.toLowerCase()
                    : "new") as any,
                },
              };
            }),
          );
        })
        .catch((err) => {
          if (loadedUserIdRef.current !== currentUid) return;
          console.error("[BookAPI] activateItem error, rolling back:", err);
          setItems(previousSnapshot);
          alert(
            language === "en"
              ? `Failed to activate card on server: ${err.message}`
              : `Gagal mengaktifkan kartu di server: ${err.message}`,
          );
        });
    }
  };

  const deactivateItem = (itemId: string) => {
    let previousSnapshot: BookItem[] = [];
    setItems((prev) => {
      previousSnapshot = prev;
      return prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          isActive: false,
        };
      });
    });

    if (
      userProfile.id !== "guest" &&
      userProfile.backendId &&
      isValidUUID(itemId)
    ) {
      const currentUid = userProfile.id;
      bookApiService
        .deactivateItem(itemId)
        .then((res) => {
          if (loadedUserIdRef.current !== currentUid) return;
          setItems((prev) =>
            prev.map((item) => {
              if (item.id !== itemId) return item;
              return {
                ...item,
                isActive: res ? res.isActive : false,
              };
            }),
          );
        })
        .catch((err) => {
          if (loadedUserIdRef.current !== currentUid) return;
          console.error("[BookAPI] deactivateItem error, rolling back:", err);
          setItems(previousSnapshot);
          alert(
            language === "en"
              ? `Failed to deactivate card on server: ${err.message}`
              : `Gagal menonaktifkan kartu di server: ${err.message}`,
          );
        });
    }
  };

  const reviewItem = (itemId: string, rating: 1 | 2 | 3 | 4) => {
    let previousSnapshot: BookItem[] = [];
    setItems((prev) => {
      previousSnapshot = prev;
      return prev.map((item) => {
        if (item.id !== itemId) return item;
        const isDueBeforeReview = isDue(
          item.fsrsData?.nextReview,
          item.isActive,
          item.fsrsData?.lastReview,
        );
        const { newState, nextIntervalDays } = updateNonQuranFSRS(
          item.fsrsData,
          rating,
        );
        const newLog = {
          id: Math.random().toString(36).substring(7),
          date: new Date().toISOString(),
          rating,
          wasDue: isDueBeforeReview,
        };
        return {
          ...item,
          status:
            nextIntervalDays >= 375
              ? "mastered"
              : item.isActive
                ? "active"
                : "inactive",
          fsrsData: newState,
          reviewLogs: [...(item.reviewLogs || []), newLog].slice(-100),
        };
      });
    });

    if (
      userProfile.id !== "guest" &&
      userProfile.backendId &&
      isValidUUID(itemId)
    ) {
      const currentUid = userProfile.id;
      bookApiService
        .reviewItem(itemId, rating)
        .then((res) => {
          if (loadedUserIdRef.current !== currentUid) return;
          const p = res.progress;
          const log = res.reviewLog;
          setItems((prev) =>
            prev.map((item) => {
              if (item.id !== itemId) return item;
              const backendFSRS: FSRSState = {
                stability: p.stability,
                difficulty: p.difficulty,
                reps: p.reps,
                lapses: p.lapses,
                lastReview: p.lastReview
                  ? new Date(p.lastReview).toISOString()
                  : null,
                nextReview: p.nextReview
                  ? new Date(p.nextReview).toISOString()
                  : null,
                state: (p.state ? p.state.toLowerCase() : "review") as any,
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
                reviewLogs: [
                  ...(item.reviewLogs || []).filter(
                    (l) => l.id !== mappedLog.id,
                  ),
                  mappedLog,
                ].slice(-100),
              };
            }),
          );
        })
        .catch((err) => {
          if (loadedUserIdRef.current !== currentUid) return;
          console.error("[BookAPI] reviewItem error, rolling back:", err);
          setItems(previousSnapshot);
          alert(
            language === "en"
              ? `Failed to record review on server: ${err.message}`
              : `Gagal mencatat review ke server: ${err.message}`,
          );
        });
    }
  };

  // Book & Chapter Operations
  const createBook = (data: {
    id?: string;
    title: string;
    description: string;
    coverUrl?: string;
    isPublic?: boolean;
    category?: string;
    authorName?: string;
    price?: number;
    isReadonly?: boolean;
  }): Book => {
    const tempId =
      data.id && isValidUUID(data.id) ? data.id : crypto.randomUUID();
    const newBook: Book = {
      id: tempId,
      userId: userProfile.id,
      title: data.title,
      description: data.description,
      coverUrl:
        data.coverUrl ||
        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
      isPublic: data.isPublic ?? false,
      category: data.category || "",
      isReadonly: false,
      authorName: data.authorName || userProfile.fullName,
      price: data.price || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setBooks((prev) => {
      const next = [newBook, ...prev];
      try {
        localStorage.setItem(
          getUserKey(userProfile.id, "books"),
          JSON.stringify(next),
        );
        localStorage.setItem(
          getUserKey("guest", "books"),
          JSON.stringify(next),
        );
        localStorage.setItem(
          "unlupa_active_book_backup",
          JSON.stringify({ book: newBook, timestamp: Date.now() }),
        );
      } catch (e) {}
      return next;
    });

    if (userProfile.id !== "guest" && userProfile.backendId) {
      const currentUid = userProfile.id;
      bookApiService
        .createBook({
          title: newBook.title,
          description: newBook.description,
          coverUrl: newBook.coverUrl,
          category: newBook.category,
          isPublic: newBook.isPublic,
        })
        .then((res) => {
          if (loadedUserIdRef.current !== currentUid) return;
          const backendBook = mapBackendBookToBook(res);
          setBooks((prev) =>
            prev.map((b) => (b.id === tempId ? backendBook : b)),
          );
          setChapters((prev) =>
            prev.map((c) =>
              c.bookId === tempId ? { ...c, bookId: backendBook.id } : c,
            ),
          );
          setItems((prev) =>
            prev.map((i) =>
              i.bookId === tempId ? { ...i, bookId: backendBook.id } : i,
            ),
          );
          setSelectedPersonalBookId((prev) =>
            prev === tempId ? backendBook.id : prev,
          );
        })
        .catch((err) => {
          if (loadedUserIdRef.current !== currentUid) return;
          console.error("[BookAPI] createBook error, rolling back:", err);
          setBooks((prev) => prev.filter((b) => b.id !== tempId));
          alert(
            language === "en"
              ? `Failed to save book to server: ${err.message}`
              : `Gagal menyimpan buku ke server: ${err.message}`,
          );
        });
    } else if (userProfile.id !== "guest") {
      syncToFirestore(userProfile.id, "books", [newBook, ...books]);
    }

    return newBook;
  };

  const updateBook = (id: string, data: Partial<Book>) => {
    let previousSnapshot: Book[] = [];
    setBooks((prev) => {
      previousSnapshot = prev;
      const updated = prev.map((b) => {
        if (b.id === id) {
          return {
            ...b,
            ...data,
            coverUrl: data.coverUrl !== undefined ? data.coverUrl : b.coverUrl,
            updatedAt: new Date().toISOString(),
          };
        }
        if (b.masterBookId === id) {
          return {
            ...b,
            title: data.title !== undefined ? data.title : b.title,
            description:
              data.description !== undefined ? data.description : b.description,
            coverUrl: data.coverUrl !== undefined ? data.coverUrl : b.coverUrl,
            updatedAt: new Date().toISOString(),
          };
        }
        return b;
      });
      try {
        localStorage.setItem(
          getUserKey(userProfile.id, "books"),
          JSON.stringify(updated),
        );
      } catch (e) {}
      if (userProfile.id !== "guest") {
        syncToFirestore(userProfile.id, "books", updated);
      }
      return updated;
    });

    if (
      userProfile.id !== "guest" &&
      userProfile.backendId &&
      isValidUUID(id)
    ) {
      const currentUid = userProfile.id;
      bookApiService
        .updateBook(id, {
          title: data.title,
          description: data.description,
          coverUrl: data.coverUrl,
          category: data.category,
          isPublic: data.isPublic,
        })
        .catch((err) => {
          if (loadedUserIdRef.current !== currentUid) return;
          console.error("[BookAPI] updateBook error, rolling back:", err);
          setBooks(previousSnapshot);
          alert(
            language === "en"
              ? `Failed to update book on server: ${err.message}`
              : `Gagal memperbarui buku di server: ${err.message}`,
          );
        });
    }
  };

  const deleteBook = (id: string) => {
    const previousBooks = books;
    const previousChapters = chapters;
    const previousItems = items;
    const previousPages = pages;

    const classBookIds = books
      .filter((b) => b.masterBookId === id)
      .map((b) => b.id);
    const allBookIdsToDelete = [id, ...classBookIds];

    setBooks((prev) => prev.filter((b) => !allBookIdsToDelete.includes(b.id)));
    setChapters((prev) =>
      prev.filter((c) => !allBookIdsToDelete.includes(c.bookId)),
    );
    setItems((prev) =>
      prev.filter((i) => !allBookIdsToDelete.includes(i.bookId)),
    );
    setPages((prev) =>
      prev.filter((p) => !allBookIdsToDelete.includes(p.bookId)),
    );

    if (
      userProfile.id !== "guest" &&
      userProfile.backendId &&
      isValidUUID(id)
    ) {
      const currentUid = userProfile.id;
      bookApiService.deleteBook(id).catch((err) => {
        if (loadedUserIdRef.current !== currentUid) return;
        console.error("[BookAPI] deleteBook error, rolling back:", err);
        setBooks(previousBooks);
        setChapters(previousChapters);
        setItems(previousItems);
        setPages(previousPages);
        alert(
          language === "en"
            ? `Failed to delete book on server: ${err.message}`
            : `Gagal menghapus buku di server: ${err.message}`,
        );
      });
    }
  };

  const duplicateBookAsEditable = (bookId: string): Book | null => {
    const targetBook = books.find((b) => b.id === bookId);
    if (!targetBook) return null;

    const newBookId = `book-copy-${Date.now()}`;
    const newBook: Book = {
      ...targetBook,
      id: newBookId,
      userId: userProfile.id,
      title: `${targetBook.title} (${language === "en" ? "Editable Copy" : "Salinan Edit"})`,
      isReadonly: false,
      isPublic: false,
      authorName: userProfile.fullName,
      category: "personal",
      classId: null,
      masterBookId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Map old chapter IDs to new chapter IDs
    const chapterIdMap = new Map<string, string>();
    const oldChapters = chapters.filter((c) => c.bookId === bookId);
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
    newChapters.forEach((nc) => {
      const oldCh = oldChapters.find((oc) => chapterIdMap.get(oc.id) === nc.id);
      if (oldCh && oldCh.parentId) {
        nc.parentId = chapterIdMap.get(oldCh.parentId) || null;
      }
    });

    // Map items
    const oldItems = items.filter((i) => i.bookId === bookId);
    const newItems: BookItem[] = oldItems.map((item, idx) => ({
      ...item,
      id: `item-copy-${Date.now()}-${idx}`,
      bookId: newBookId,
      masterItemId: null,
      chapterId: item.chapterId
        ? chapterIdMap.get(item.chapterId) || null
        : null,
      isActive: false,
      status: "inactive" as const,
      fsrsData: {
        stability: 0,
        difficulty: 5.0,
        reps: 0,
        lapses: 0,
        lastReview: null,
        nextReview: null,
        state: "new" as const,
      },
      reviewLogs: [],
      createdAt: new Date().toISOString(),
    }));

    setBooks((prev) => [newBook, ...prev]);
    setChapters((prev) => [...prev, ...newChapters]);
    setItems((prev) => [...prev, ...newItems]);

    // Backend duplicate call if authenticated with valid UUID
    if (
      userProfile.id !== "guest" &&
      userProfile.backendId &&
      isValidUUID(bookId)
    ) {
      const currentUid = userProfile.id;
      bookApiService
        .duplicateBook(bookId)
        .then(async () => {
          if (loadedUserIdRef.current !== currentUid) return;
          await refreshBooksFromBackend();
        })
        .catch((err) => {
          if (loadedUserIdRef.current !== currentUid) return;
          console.warn("[BookAPI] duplicateBook backend sync notice:", err);
        });
    }

    return newBook;
  };

  const createChapter = (data: {
    id?: string;
    bookId: string;
    title: string;
    description?: string;
    material?: string;
    parentId?: string | null;
    order?: number;
  }): Chapter => {
    const tempId =
      data.id && isValidUUID(data.id) ? data.id : crypto.randomUUID();
    const newChapter: Chapter = {
      id: tempId,
      bookId: data.bookId,
      masterChapterId: null,
      title: data.title,
      description: data.description,
      material: data.material,
      parentId: data.parentId || null,
      order:
        data.order !== undefined
          ? data.order
          : chapters.filter((c) => c.bookId === data.bookId).length + 1,
    };

    // Also mirror to class books derived from this master book
    const derivedClassBooks = books.filter(
      (b) => b.masterBookId === data.bookId,
    );
    const derivedClassChapters: Chapter[] = derivedClassBooks.map((cb) => ({
      id: `class-chap-${cb.classId}-${newChapter.id}`,
      bookId: cb.id,
      masterChapterId: newChapter.id,
      title: newChapter.title,
      description: newChapter.description,
      parentId: newChapter.parentId
        ? `class-chap-${cb.classId}-${newChapter.parentId}`
        : null,
      order: newChapter.order,
    }));

    setChapters((prev) => {
      const nextChapters = [...prev, newChapter, ...derivedClassChapters];
      try {
        localStorage.setItem(
          getUserKey(userProfile.id, "chapters"),
          JSON.stringify(nextChapters),
        );
        localStorage.setItem(
          getUserKey("guest", "chapters"),
          JSON.stringify(nextChapters),
        );
      } catch (e) {}
      if (userProfile.id !== "guest") {
        syncToFirestore(userProfile.id, "chapters", nextChapters);
      }
      return nextChapters;
    });

    if (
      userProfile.id !== "guest" &&
      userProfile.backendId &&
      isValidUUID(data.bookId)
    ) {
      const currentUid = userProfile.id;
      bookApiService
        .createChapter(data.bookId, {
          title: newChapter.title,
          description: newChapter.description,
          material: newChapter.material,
          parentId: isValidUUID(newChapter.parentId)
            ? newChapter.parentId
            : null,
          order: newChapter.order,
        })
        .then((res) => {
          if (loadedUserIdRef.current !== currentUid) return;
          const backendChapter = mapBackendChapterToChapter(res);
          setChapters((prev) =>
            prev.map((c) => (c.id === tempId ? backendChapter : c)),
          );
          setItems((prev) =>
            prev.map((i) =>
              i.chapterId === tempId
                ? { ...i, chapterId: backendChapter.id }
                : i,
            ),
          );
        })
        .catch((err) => {
          if (loadedUserIdRef.current !== currentUid) return;
          console.error("[BookAPI] createChapter error, rolling back:", err);
          setChapters((prev) => prev.filter((c) => c.id !== tempId));
          alert(
            language === "en"
              ? `Failed to create chapter on server: ${err.message}`
              : `Gagal membuat bab di server: ${err.message}`,
          );
        });
    }

    return newChapter;
  };

  const updateChapter = (id: string, data: Partial<Chapter>) => {
    let previousSnapshot: Chapter[] = [];
    setChapters((prev) => {
      previousSnapshot = prev;
      return prev.map((c) => {
        if (c.id === id) {
          return { ...c, ...data };
        }
        if (c.masterChapterId === id) {
          return {
            ...c,
            title: data.title !== undefined ? data.title : c.title,
            description:
              data.description !== undefined ? data.description : c.description,
            order: data.order !== undefined ? data.order : c.order,
          };
        }
        return c;
      });
    });

    if (
      userProfile.id !== "guest" &&
      userProfile.backendId &&
      isValidUUID(id)
    ) {
      const currentUid = userProfile.id;
      bookApiService
        .updateChapter(id, {
          title: data.title,
          description: data.description,
          material: data.material,
          parentId: isValidUUID(data.parentId)
            ? data.parentId
            : data.parentId === null
              ? null
              : undefined,
          order: data.order,
        })
        .catch((err) => {
          if (loadedUserIdRef.current !== currentUid) return;
          console.error("[BookAPI] updateChapter error, rolling back:", err);
          setChapters(previousSnapshot);
          alert(
            language === "en"
              ? `Failed to update chapter on server: ${err.message}`
              : `Gagal memperbarui bab di server: ${err.message}`,
          );
        });
    }
  };

  const deleteChapter = (chapterId: string) => {
    const previousChapters = chapters;
    const previousItems = items;
    const previousPages = pages;

    const getDescendants = (id: string, all: Chapter[]): string[] => {
      const children = all.filter((c) => c.parentId === id);
      let ids = children.map((c) => c.id);
      children.forEach((c) => {
        ids = [...ids, ...getDescendants(c.id, all)];
      });
      return ids;
    };
    const masterIdsToDelete = [
      chapterId,
      ...getDescendants(chapterId, chapters),
    ];
    const classChapterIdsToDelete = chapters
      .filter(
        (c) =>
          c.masterChapterId && masterIdsToDelete.includes(c.masterChapterId),
      )
      .map((c) => c.id);
    const allIdsToDelete = [...masterIdsToDelete, ...classChapterIdsToDelete];

    setChapters((prev) => prev.filter((c) => !allIdsToDelete.includes(c.id)));
    setItems((prevItems) =>
      prevItems.filter((i) =>
        i.chapterId ? !allIdsToDelete.includes(i.chapterId) : true,
      ),
    );
    setPages((prevPages) =>
      prevPages.filter((p) =>
        p.chapterId ? !allIdsToDelete.includes(p.chapterId) : true,
      ),
    );

    if (
      userProfile.id !== "guest" &&
      userProfile.backendId &&
      isValidUUID(chapterId)
    ) {
      const currentUid = userProfile.id;
      bookApiService.deleteChapter(chapterId).catch((err) => {
        if (loadedUserIdRef.current !== currentUid) return;
        console.error("[BookAPI] deleteChapter error, rolling back:", err);
        setChapters(previousChapters);
        setItems(previousItems);
        setPages(previousPages);
        alert(
          language === "en"
            ? `Failed to delete chapter on server: ${err.message}`
            : `Gagal menghapus bab di server: ${err.message}`,
        );
      });
    }
  };

  const createPage = (data: {
    bookId: string;
    chapterId?: string;
    title: string;
    blocks: any[];
  }): PageDocument => {
    const newPage: PageDocument = {
      id: crypto.randomUUID(),
      bookId: data.bookId,
      chapterId: data.chapterId || null,
      title: data.title,
      blocks: data.blocks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPages((prev) => [...prev, newPage]);
    return newPage;
  };

  const updatePage = (id: string, data: Partial<PageDocument>) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...data, updatedAt: new Date().toISOString() }
          : p,
      ),
    );
  };

  const deletePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
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
    const tempId =
      data.id && isValidUUID(data.id) ? data.id : crypto.randomUUID();
    const newItem: BookItem = {
      id: tempId,
      bookId: data.bookId,
      masterItemId: null,
      chapterId: data.chapterId,
      question: data.question
        ? normalizeBilingualText(data.question)
        : data.question,
      answer: data.answer ? normalizeBilingualText(data.answer) : data.answer,
      explanation: data.explanation
        ? normalizeBilingualText(data.explanation)
        : data.explanation || undefined,
      imageQ: data.imageQ,
      imageA: data.imageA,
      tags: data.tags || [],
      isActive: false, // Default is Inactive as per Master Plan
      status: "inactive",
      fsrsData: {
        stability: 0,
        difficulty: 5.0,
        reps: 0,
        lapses: 0,
        lastReview: null,
        nextReview: null,
        state: "new",
      },
      createdAt: new Date().toISOString(),
    };

    // Also mirror to class books derived from this master book (with fresh learning state)
    const derivedClassBooks = books.filter(
      (b) => b.masterBookId === data.bookId,
    );
    const derivedClassItems: BookItem[] = derivedClassBooks.map((cb) => ({
      id: `class-item-${cb.classId}-${newItem.id}`,
      bookId: cb.id,
      masterItemId: newItem.id,
      chapterId: newItem.chapterId
        ? `class-chap-${cb.classId}-${newItem.chapterId}`
        : null,
      question: newItem.question,
      answer: newItem.answer,
      explanation: newItem.explanation,
      imageQ: newItem.imageQ,
      imageA: newItem.imageA,
      tags: newItem.tags || [],
      isActive: false,
      status: "inactive",
      fsrsData: createInitialFSRSState(),
      reviewLogs: [],
      createdAt: new Date().toISOString(),
    }));

    setItems((prev) => {
      const nextItems = [...prev, newItem, ...derivedClassItems];
      try {
        localStorage.setItem(
          getUserKey(userProfile.id, "items"),
          JSON.stringify(nextItems),
        );
        localStorage.setItem(
          getUserKey("guest", "items"),
          JSON.stringify(nextItems),
        );
      } catch (e) {}
      if (userProfile.id !== "guest") {
        syncToFirestore(userProfile.id, "items", nextItems);
      }
      return nextItems;
    });

    if (
      userProfile.id !== "guest" &&
      userProfile.backendId &&
      isValidUUID(data.bookId)
    ) {
      const currentUid = userProfile.id;
      bookApiService
        .createItem(data.bookId, {
          question: newItem.question,
          answer: newItem.answer,
          explanation: newItem.explanation,
          chapterId: isValidUUID(newItem.chapterId) ? newItem.chapterId : null,
          tags: newItem.tags,
          imageQ: newItem.imageQ,
          imageA: newItem.imageA,
          order: data.order,
        })
        .then((res) => {
          if (loadedUserIdRef.current !== currentUid) return;
          const backendItem = mapBackendItemToBookItem(res);
          setItems((prev) =>
            prev.map((i) => (i.id === tempId ? backendItem : i)),
          );
        })
        .catch((err) => {
          if (loadedUserIdRef.current !== currentUid) return;
          console.error("[BookAPI] createItem error, rolling back:", err);
          setItems((prev) => prev.filter((i) => i.id !== tempId));
          alert(
            language === "en"
              ? `Failed to create card on server: ${err.message}`
              : `Gagal membuat kartu di server: ${err.message}`,
          );
        });
    }

    return newItem;
  };

  const reorderItems = (newItems: BookItem[]) => {
    setItems(newItems);
  };

  const updateItem = (id: string, data: Partial<BookItem>) => {
    let previousSnapshot: BookItem[] = [];
    setItems((prev) => {
      previousSnapshot = prev;
      return prev.map((i) => {
        if (i.id === id) {
          return {
            ...i,
            ...data,
            question:
              data.question !== undefined
                ? normalizeBilingualText(data.question)
                : i.question,
            answer:
              data.answer !== undefined
                ? normalizeBilingualText(data.answer)
                : i.answer,
            explanation:
              data.explanation !== undefined
                ? data.explanation
                  ? normalizeBilingualText(data.explanation)
                  : ""
                : i.explanation,
          };
        }
        // If this is a class item mirroring the master item being updated:
        // Update content & layout, but PRESERVE student's activation, FSRS state, and review logs!
        if (i.masterItemId === id) {
          return {
            ...i,
            question:
              data.question !== undefined
                ? normalizeBilingualText(data.question)
                : i.question,
            answer:
              data.answer !== undefined
                ? normalizeBilingualText(data.answer)
                : i.answer,
            explanation:
              data.explanation !== undefined
                ? data.explanation
                  ? normalizeBilingualText(data.explanation)
                  : ""
                : i.explanation,
            imageQ: data.imageQ !== undefined ? data.imageQ : i.imageQ,
            imageA: data.imageA !== undefined ? data.imageA : i.imageA,
            tags: data.tags !== undefined ? data.tags : i.tags,
          };
        }
        return i;
      });
    });

    if (
      userProfile.id !== "guest" &&
      userProfile.backendId &&
      isValidUUID(id)
    ) {
      const currentUid = userProfile.id;
      bookApiService
        .updateItem(id, {
          question: data.question,
          answer: data.answer,
          explanation: data.explanation,
          chapterId: isValidUUID(data.chapterId)
            ? data.chapterId
            : data.chapterId === null
              ? null
              : undefined,
          tags: data.tags,
          imageQ: data.imageQ,
          imageA: data.imageA,
          order: data.order,
        })
        .catch((err) => {
          if (loadedUserIdRef.current !== currentUid) return;
          console.error("[BookAPI] updateItem error, rolling back:", err);
          setItems(previousSnapshot);
          alert(
            language === "en"
              ? `Failed to update card on server: ${err.message}`
              : `Gagal memperbarui kartu di server: ${err.message}`,
          );
        });
    }
  };

  const deleteItem = (itemId: string) => {
    const previousItems = items;
    setItems((prev) =>
      prev.filter((i) => i.id !== itemId && i.masterItemId !== itemId),
    );

    if (
      userProfile.id !== "guest" &&
      userProfile.backendId &&
      isValidUUID(itemId)
    ) {
      const currentUid = userProfile.id;
      bookApiService.deleteItem(itemId).catch((err) => {
        if (loadedUserIdRef.current !== currentUid) return;
        console.error("[BookAPI] deleteItem error, rolling back:", err);
        setItems(previousItems);
        alert(
          language === "en"
            ? `Failed to delete card on server: ${err.message}`
            : `Gagal menghapus kartu di server: ${err.message}`,
        );
      });
    }
  };

  // Library & Import/Export
  const importFromLibrary = (libId: string) => {
    const entry = library.find((l) => l.id === libId);
    if (!entry) return;

    // Check if already imported
    const alreadyImported = books.some((b) => b.id === entry.book.id);
    if (alreadyImported) {
      alert("This book is already in your Personal Space!");
      return;
    }

    // Reset-on-clone: initialize card activation and FSRS data to 'new' (unactivated state)
    const resetItems = entry.items.map((i) => ({
      ...i,
      isActive: false,
      status: "inactive" as const,
      fsrsData: createInitialFSRSState(),
      reviewLogs: [],
    }));

    const importedBook: Book = {
      ...entry.book,
      isPublic: true,
      isReadonly: true,
      isImported: true,
      libraryEntryId: libId,
    };

    setBooks((prev) => [importedBook, ...prev]);
    setChapters((prev) => [...prev, ...entry.chapters]);
    setItems((prev) => [...prev, ...resetItems]);
  };

  const importFromJSON = (
    jsonStr: string,
  ): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.book || !parsed.book.title) {
        return {
          success: false,
          message: "Invalid format: missing book title.",
        };
      }
      const newBook: Book = {
        ...parsed.book,
        id: `book-imp-${Date.now()}`,
        isReadonly: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newChapters: Chapter[] = (parsed.chapters || []).map(
        (ch: any, idx: number) => ({
          id: `chap-imp-${Date.now()}-${idx}`,
          bookId: newBook.id,
          title: ch.title || "Materi",
          description: ch.description,
          order: idx + 1,
        }),
      );

      const newItems: BookItem[] = (parsed.items || []).map(
        (item: any, idx: number) => ({
          id: `item-imp-${Date.now()}-${idx}`,
          bookId: newBook.id,
          chapterId: newChapters[0]?.id || null,
          question: normalizeBilingualText(
            item.question || "Untitled question",
          ),
          answer: normalizeBilingualText(item.answer || "Untitled answer"),
          explanation: item.explanation
            ? normalizeBilingualText(item.explanation)
            : item.explanation || undefined,
          tags: item.tags || [],
          isActive: false, // inactive initially
          status: "inactive",
          fsrsData: createInitialFSRSState(),
          reviewLogs: [],
          createdAt: new Date().toISOString(),
        }),
      );

      setBooks((prev) => [newBook, ...prev]);
      setChapters((prev) => [...prev, ...newChapters]);
      setItems((prev) => [...prev, ...newItems]);
      return {
        success: true,
        message: `Successfully imported "${newBook.title}" with ${newItems.length} items!`,
      };
    } catch (e: any) {
      return { success: false, message: e.message || "JSON parsing failed." };
    }
  };

  const publishBookToLibrary = async (
    bookId: string,
    allowEdit = false,
    pricing?: { isPaid: boolean; price?: number },
  ) => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return { success: false, message: "Book not found" };

    // Check if already in library
    if (library.some((l) => l.book.id === bookId)) {
      return {
        success: false,
        message:
          language === "en"
            ? "Book is already in the library"
            : "Kitab ini sudah ada di Pustaka",
      };
    }

    const bookChapters = chapters.filter((c) => c.bookId === bookId);
    const bookItems = items
      .filter((i) => i.bookId === bookId)
      .map((i) => ({
        ...i,
        isActive: false,
        status: "inactive" as const,
        fsrsData: {
          stability: 0,
          difficulty: 0,
          reps: 0,
          lapses: 0,
          state: "new",
          lastReview: null,
          nextReview: null,
        } as FSRSState,
      }));

    const isPaid = Boolean(pricing?.isPaid && (pricing.price || 0) > 0);
    const priceAmount = isPaid ? pricing?.price || 0 : 0;

    const newEntry = {
      id: `lib-${Date.now()}`,
      title: book.title,
      description: book.description || "Community published book",
      category: book.category || "Community",
      curator: book.authorName || "Penulis Pribadi",
      downloads: 0,
      rating: 5.0,
      verified: true,
      book: {
        ...book,
        isReadonly: !allowEdit,
        price: priceAmount,
        isPublic: true,
      },
      chapters: bookChapters,
      items: bookItems,
      tags: ["community"],
    };

    // 1. Persist isPublic: true to PostgreSQL backend if authenticated
    if (
      userProfile.id !== "guest" &&
      userProfile.backendId &&
      isValidUUID(bookId)
    ) {
      try {
        await bookApiService.updateBook(bookId, { isPublic: true });
      } catch (err: any) {
        console.error(
          "[BookAPI] publishBookToLibrary error updating isPublic in DB:",
          err,
        );
      }
    }

    // 2. Update local books state so this book is marked isPublic: true
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId ? { ...b, isPublic: true, isReadonly: !allowEdit } : b,
      ),
    );

    // 3. Sync to public library in Firestore if available
    if (userProfile.id !== "guest") {
      publishToPublicLibrary(userProfile.id, newEntry).catch(console.error);
    }

    setLibrary((prev) => [newEntry, ...prev]);
    return {
      success: true,
      message:
        language === "en"
          ? "Alhamdulillah, book successfully published to Library!"
          : "Alhamdulillah, kitab berhasil dipublikasikan ke Pustaka!",
    };
  };

  const exportBookJSON = (bookId: string): string => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return "{}";
    const bookChapters = chapters.filter((c) => c.bookId === bookId);
    const bookItems = items.filter((i) => i.bookId === bookId);
    return JSON.stringify(
      {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        book,
        chapters: bookChapters,
        items: bookItems,
      },
      null,
      2,
    );
  };

  // Classes Operations

  const joinClassByCode = async (
    code: string,
  ): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return {
        success: false,
        message:
          language === "en"
            ? "Class code cannot be empty."
            : "Kode kelas tidak boleh kosong.",
      };
    }

    // 1. Try finding and joining via PostgreSQL backend first!
    let targetClass: ClassGroup | null = null;
    if (userProfile.id !== "guest" && userProfile.backendId) {
      try {
        const backendJoined = await classApiService.joinClassByCode(cleanCode);
        if (backendJoined) {
          targetClass = backendJoined;
        }
      } catch (apiErr: any) {
        if (
          apiErr?.status === 400 &&
          (apiErr?.code === "ALREADY_JOINED" ||
            apiErr?.message?.includes("sudah bergabung"))
        ) {
          return {
            success: false,
            message:
              language === "en"
                ? "You have already joined this class."
                : "Anda sudah bergabung di kelas ini.",
          };
        }
        if (
          apiErr?.status === 400 &&
          (apiErr?.code === "CLASS_CLOSED" ||
            apiErr?.message?.includes("ditutup"))
        ) {
          return {
            success: false,
            message:
              language === "en"
                ? "This class has been closed by the teacher."
                : "Kelas ini telah ditutup oleh pengajar.",
          };
        }
        if (apiErr?.status === 404) {
          // If not found in PostgreSQL, allow checking local or Firestore below
        } else {
          console.warn("[Classes] Backend join error:", apiErr);
        }
      }
    }

    // Fallback: local teachingClasses or Firestore
    if (!targetClass) {
      targetClass =
        teachingClasses.find((c) => c.code.toUpperCase() === cleanCode) || null;
      if (!targetClass) {
        targetClass = await findClassByCodeGlobal(cleanCode);
      }
    }

    if (!targetClass) {
      return {
        success: false,
        message:
          language === "en" ? "Class not found." : "Kelas tidak ditemukan.",
      };
    }

    // 2. Check if user is already in that class
    const alreadyEnrolled =
      myClasses.some((c) => c.id === targetClass!.id) ||
      (targetClass.students || []).some(
        (s) =>
          s.quranSpaceCode === quranSpaceCode ||
          s.id === `std-user-${userProfile.id}`,
      );
    if (alreadyEnrolled) {
      return {
        success: false,
        message:
          language === "en"
            ? "You have already joined this class."
            : "Anda sudah bergabung di kelas ini.",
      };
    }

    // 3. Create student representation of the current user
    let userStudent: ClassStudent;

    let studentClassRecord = { ...targetClass };

    if (targetClass.type === "non-quran") {
      const assignedIds =
        targetClass.assignedBookIds && targetClass.assignedBookIds.length > 0
          ? targetClass.assignedBookIds
          : ["book-1"];

      const studentClassBookIds: string[] = [];
      const newClassBooks: Book[] = [];
      const newClassChapters: Chapter[] = [];
      const newClassItems: BookItem[] = [];

      for (const masterBookId of assignedIds) {
        // 1. Look in class's embedded assignedBooksData (best for cross-user custom books)
        let bookPkg = targetClass.assignedBooksData?.find(
          (p: any) => p.book?.id === masterBookId,
        );
        let masterBook =
          bookPkg?.book ||
          books.find((b) => b.id === masterBookId) ||
          INITIAL_BOOKS.find((b) => b.id === masterBookId);
        let sourceChapters =
          bookPkg?.chapters ||
          chapters.filter((c) => c.bookId === masterBookId);
        if (sourceChapters.length === 0) {
          sourceChapters = INITIAL_CHAPTERS.filter(
            (c) => c.bookId === masterBookId,
          );
        }
        let sourceItems =
          bookPkg?.items || items.filter((i) => i.bookId === masterBookId);
        if (sourceItems.length === 0) {
          sourceItems = INITIAL_ITEMS.filter((i) => i.bookId === masterBookId);
        }

        // 2. Fallback: if not found, fetch live from teacher's Firestore user_data app state
        if (!masterBook && targetClass.teacherId) {
          const remoteData = await fetchTeacherBookDataGlobal(
            targetClass.teacherId,
            masterBookId,
          );
          if (remoteData?.book) {
            masterBook = remoteData.book;
            sourceChapters = remoteData.chapters || [];
            sourceItems = remoteData.items || [];
          }
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
          category: "class",
          isReadonly: true,
          isPublic: false,
          authorName: `${targetClass.name} • ${targetClass.teacherName || "Pengajar"}`,
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
          parentId: mc.parentId
            ? `class-chap-${targetClass.id}-${mc.parentId}`
            : null,
        }));
        newClassChapters.push(...classChaptersList);

        const classItemsList: BookItem[] = sourceItems.map((mi: any) => ({
          id: `class-item-${targetClass.id}-${mi.id}`,
          masterItemId: mi.id,
          bookId: classBookId,
          chapterId: mi.chapterId
            ? `class-chap-${targetClass.id}-${mi.chapterId}`
            : null,
          question: mi.question,
          answer: mi.answer,
          imageQ: mi.imageQ,
          imageA: mi.imageA,
          tags: mi.tags || [],
          isActive: false, // Clean fresh learning state starting from 0!
          status: "inactive" as const, // Clean fresh learning state!
          fsrsData: createInitialFSRSState(), // Clean fresh learning state!
          reviewLogs: [], // Clean fresh learning state!
          createdAt: new Date().toISOString(),
        }));
        newClassItems.push(...classItemsList);
      }

      // Inject the class books, chapters, and items into student workspace without modifying personal books
      setBooks((prev) => {
        const withoutOldClassBooks = prev.filter(
          (b) => !studentClassBookIds.includes(b.id),
        );
        return [...newClassBooks, ...withoutOldClassBooks];
      });
      setChapters((prev) => {
        const withoutOldClassChapters = prev.filter(
          (c) => !studentClassBookIds.includes(c.bookId),
        );
        return [...withoutOldClassChapters, ...newClassChapters];
      });
      setItems((prev) => {
        const withoutOldClassItems = prev.filter(
          (i) => !studentClassBookIds.includes(i.bookId),
        );
        return [...withoutOldClassItems, ...newClassItems];
      });

      studentClassRecord.assignedBookIds = studentClassBookIds;

      userStudent = {
        id: `std-user-${userProfile.id}`,
        quranSpaceCode: quranSpaceCode,
        name: userProfile.fullName || "Santri",
        email: userProfile.email,
        avatarUrl: userProfile.avatarUrl,
        activeItemsCount: 0,
        dueTodayCount: 0,
        averageStability: 0,
        retentionRate: 92,
        lastActive: "Baru saja bergabung",
        frequentStruggles: [],
        bookItemsData: newClassItems,
        teacherFeedbacks: [],
      };
    } else {
      const activePages = quranPages.filter((p) => p.isActive);
      const duePages = quranPages.filter((p) =>
        isDue(p.fsrsData.nextReview, p.isActive, p.fsrsData.lastReview),
      );
      const avgStability =
        activePages.length > 0
          ? Number(
              (
                activePages.reduce((acc, p) => acc + p.fsrsData.stability, 0) /
                activePages.length
              ).toFixed(1),
            )
          : 0;

      userStudent = {
        id: `std-user-${userProfile.id}`,
        quranSpaceCode: quranSpaceCode,
        name: userProfile.fullName || "Santri",
        email: userProfile.email,
        avatarUrl: userProfile.avatarUrl,
        activeItemsCount: activePages.length,
        dueTodayCount: duePages.length,
        averageStability: avgStability,
        retentionRate: 95,
        lastActive: "Baru saja aktif",
        frequentStruggles: [],
        quranData: quranPages,
        teacherFeedbacks: [],
      };
    }

    // 4. Add student to target class in teachingClasses if teacher is current user
    if (targetClass.teacherId === userProfile.id) {
      setTeachingClasses((prev) =>
        prev.map((cls) => {
          if (cls.id !== targetClass.id) return cls;
          return {
            ...cls,
            students: [userStudent, ...cls.students],
          };
        }),
      );
    } else {
      // Teacher will see the student via real-time listenToClassStudentsGlobal()
    }

    // 5. Enroll in Global Class IMMEDIATELY (no debounce delay for initial join!)
    await enrollStudentInGlobalClass(
      targetClass.id,
      userStudent.id,
      userStudent,
      true,
    );

    // 6. CRITICAL: Add class to student's myClasses so it appears in "Kelas Saya"
    setMyClasses((prev) => {
      if (prev.some((c) => c.id === studentClassRecord.id)) return prev;
      return [studentClassRecord, ...prev];
    });

    return {
      success: true,
      message:
        language === "en"
          ? `Successfully joined class "${targetClass.name}"!`
          : `Berhasil bergabung dengan kelas "${targetClass.name}"!`,
    };
  };

  const createTeachingClass = async (data: {
    name: string;
    type: "quran" | "non-quran";
    description?: string;
    coverUrl?: string;
    code?: string;
    requiredJuzList?: number[];
    assignedBookIds?: string[];
  }): Promise<ClassGroup> => {
    const isPro =
      userProfile.plan === "premium" ||
      userProfile.plan === "institutional" ||
      userProfile.role === "admin" ||
      userProfile.role === "superadmin";
    if (!isPro) {
      const limits = tierConfig.freeTier;
      if (data.type === "quran") {
        const quranCount = teachingClasses.filter(
          (c) => c.type === "quran",
        ).length;
        const maxQuran = limits.maxQuranClasses ?? 1;
        if (quranCount >= maxQuran) {
          throw new Error(
            language === "en"
              ? `Free accounts are limited to ${maxQuran} Al-Qur'an class.`
              : `Batas akun Free adalah maksimal ${maxQuran} kelas Al-Qur'an. Upgrade ke Pro untuk membuat lebih banyak kelas.`,
          );
        }
      } else {
        const nonQuranCount = teachingClasses.filter(
          (c) => c.type !== "quran",
        ).length;
        const maxNonQuran = limits.maxNonQuranClasses ?? 1;
        if (nonQuranCount >= maxNonQuran) {
          throw new Error(
            language === "en"
              ? `Free accounts are limited to ${maxNonQuran} Kitab/Materi class.`
              : `Batas akun Free adalah maksimal ${maxNonQuran} kelas Non-Qur'an (Kitab). Upgrade ke Pro untuk membuat lebih banyak kelas.`,
          );
        }
      }
    }

    const rawCode = data.code?.trim().toUpperCase();
    const finalCode =
      rawCode ||
      `${data.type === "quran" ? "QRN" : "CLS"}-${Math.floor(1000 + Math.random() * 9000)}`;

    // For non-quran (Kitab) classes: bundle the complete book package!
    let assignedBooksData: AssignedBookData[] | undefined = undefined;
    if (data.type === "non-quran") {
      const bIds =
        data.assignedBookIds && data.assignedBookIds.length > 0
          ? data.assignedBookIds
          : [books[0]?.id].filter(Boolean);

      assignedBooksData = bIds
        .map((bId) => {
          const foundBook =
            books.find((b) => b.id === bId) ||
            INITIAL_BOOKS.find((b) => b.id === bId);
          if (!foundBook) return null;
          const bChaps = chapters.filter((c) => c.bookId === bId);
          const bItems = items.filter((i) => i.bookId === bId);
          return {
            book: foundBook,
            chapters:
              bChaps.length > 0
                ? bChaps
                : INITIAL_CHAPTERS.filter((c) => c.bookId === bId),
            items:
              bItems.length > 0
                ? bItems
                : INITIAL_ITEMS.filter((i) => i.bookId === bId),
          };
        })
        .filter(Boolean) as AssignedBookData[];
    }

    let newClass: ClassGroup;
    if (userProfile.id !== "guest" && userProfile.backendId) {
      try {
        const backendCreated = await classApiService.createClass({
          name: data.name.trim(),
          type: data.type,
          code: finalCode,
          description: data.description?.trim() || "",
          coverUrl: data.coverUrl,
          requiredJuzList:
            data.type === "quran"
              ? data.requiredJuzList || [1, 2, 3, 4, 5]
              : undefined,
          assignedBookIds:
            data.type === "non-quran"
              ? data.assignedBookIds || [books[0]?.id].filter(Boolean)
              : undefined,
          assignedBooksData: assignedBooksData,
        });

        newClass = {
          ...backendCreated,
          assignedBooksData:
            assignedBooksData || backendCreated.assignedBooksData,
        };
      } catch (backendErr: any) {
        if (
          backendErr?.status === 403 ||
          backendErr?.code === "QUOTA_EXCEEDED"
        ) {
          throw new Error(backendErr.message || "Batas kelas akun tercapai.");
        }
        console.warn(
          "[Classes] Failed to create class on PostgreSQL backend, fallback to local:",
          backendErr,
        );
        newClass = {
          id: `cls-${Date.now()}`,
          teacherId: userProfile.id,
          teacherName: userProfile.fullName,
          name: data.name,
          code: finalCode,
          type: data.type,
          description: data.description || "",
          coverUrl: data.coverUrl,
          requiredJuzList:
            data.type === "quran"
              ? data.requiredJuzList || [1, 2, 3, 4, 5]
              : undefined,
          assignedBookIds:
            data.type === "non-quran"
              ? data.assignedBookIds || [books[0]?.id].filter(Boolean)
              : undefined,
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
        description: data.description || "",
        coverUrl: data.coverUrl,
        requiredJuzList:
          data.type === "quran"
            ? data.requiredJuzList || [1, 2, 3, 4, 5]
            : undefined,
        assignedBookIds:
          data.type === "non-quran"
            ? data.assignedBookIds || [books[0]?.id].filter(Boolean)
            : undefined,
        assignedBooksData: assignedBooksData,
        students: [],
        createdAt: new Date().toISOString(),
      };
    }

    // Sync class globally so other users can discover it by code
    syncClassToGlobal(newClass);

    // Set up real-time student listener immediately for this newly created class!
    if (!(window as any).__classStudentListeners) {
      (window as any).__classStudentListeners = {};
    }
    if (!(window as any).__classStudentListeners[newClass.id]) {
      (window as any).__classStudentListeners[newClass.id] =
        listenToClassStudentsGlobal(newClass.id, (globalStudents) => {
          if (!Array.isArray(globalStudents)) return;
          setTeachingClasses((currentClasses) => {
            return currentClasses.map((c) => {
              if (c.id !== newClass.id) return c;
              let newStudents = [...c.students];
              let modified = false;
              for (const gStd of globalStudents) {
                const index = newStudents.findIndex((s) => s.id === gStd.id);
                if (index === -1) {
                  newStudents.push(gStd);
                  modified = true;
                } else {
                  if (
                    JSON.stringify(newStudents[index]) !== JSON.stringify(gStd)
                  ) {
                    newStudents[index] = gStd;
                    modified = true;
                  }
                }
              }
              return modified ? { ...c, students: newStudents } : c;
            });
          });
        });
    }

    setTeachingClasses((prev) => [newClass, ...prev]);
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
    classApiService
      .deleteClass(classId)
      .catch((err) => console.warn("[Classes] Backend delete notice:", err));
    triggerClassCleanup(classId, { action: "delete" });
  };

  const closeTeachingClass = (classId: string) => {
    classApiService
      .updateClass(classId, { status: "closed" })
      .catch((err) => console.warn("[Classes] Backend close notice:", err));
    triggerClassCleanup(classId, { action: "close" });
  };

  const reopenTeachingClass = (classId: string) => {
    classApiService
      .updateClass(classId, { status: "active" })
      .catch((err) => console.warn("[Classes] Backend reopen notice:", err));
    setTeachingClasses((prev) =>
      prev.map((c) =>
        c.id === classId ? { ...c, status: "active", closedAt: undefined } : c,
      ),
    );
  };

  const updateTeachingClass = (id: string, data: Partial<ClassGroup>) => {
    classApiService
      .updateClass(id, data as any)
      .catch((err) => console.warn("[Classes] Backend update notice:", err));
    setTeachingClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c)),
    );
  };

  const leaveClass = (classId: string) => {
    classApiService
      .leaveClass(classId)
      .catch((err) => console.warn("[Classes] Backend leave notice:", err));
    removeStudentFromGlobalClass(classId, `std-user-${userProfile.id}`);
    setMyClasses((prev) => prev.filter((c) => c.id !== classId));
    setBooks((prev) =>
      prev.filter(
        (b) =>
          b.classId !== classId && !b.id.startsWith(`class-book-${classId}-`),
      ),
    );
    setChapters((prev) =>
      prev.filter((c) => !c.bookId.startsWith(`class-book-${classId}-`)),
    );
    setItems((prev) =>
      prev.filter((i) => !i.bookId.startsWith(`class-book-${classId}-`)),
    );

    // Find the class to leave to get the teacherId
    const clsToLeave = myClasses.find((c) => c.id === classId);

    if (clsToLeave && clsToLeave.teacherId !== userProfile.id) {
      // The global removal via removeStudentFromGlobalClass is sufficient.
    }

    setTeachingClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          students: cls.students.filter(
            (s) =>
              s.quranSpaceCode !== quranSpaceCode &&
              s.id !== `std-user-${userProfile.id}`,
          ),
        };
      }),
    );
  };

  const removeStudentFromClass = (classId: string, studentId: string) => {
    classApiService
      .removeStudent(classId, studentId)
      .catch((err) =>
        console.warn("[Classes] Backend remove student notice:", err),
      );
    removeStudentFromGlobalClass(classId, studentId);
    setTeachingClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          students: cls.students.filter((s) => s.id !== studentId),
        };
      }),
    );

    // If the student being removed is the current user, remove from myClasses and clean up class books
    if (studentId === `std-user-${userProfile.id}`) {
      setMyClasses((prev) => prev.filter((c) => c.id !== classId));
      setBooks((prev) =>
        prev.filter(
          (b) =>
            b.classId !== classId && !b.id.startsWith(`class-book-${classId}-`),
        ),
      );
      setChapters((prev) =>
        prev.filter((c) => !c.bookId.startsWith(`class-book-${classId}-`)),
      );
      setItems((prev) =>
        prev.filter((i) => !i.bookId.startsWith(`class-book-${classId}-`)),
      );
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
      const activeNums = std.quranData
        .filter((p) => p.isActive)
        .map((p) => p.pageNumber);
      const dueNums = std.quranData
        .filter((p) =>
          isDue(p.fsrsData.nextReview, p.isActive, p.fsrsData.lastReview),
        )
        .map((p) => p.pageNumber);
      return createSampleStudentQuranPages(activeNums, dueNums);
    }
    return generateCleanQuranPages();
  };

  const activateStudentQuranPage = (
    classId: string,
    studentId: string,
    pageNumber: number,
  ) => {
    if (studentId === `std-user-${userProfile.id}`) {
      activateQuranPage(pageNumber);
    }
    if (studentId && !studentId.startsWith("sample-")) {
      classApiService
        .activateStudentQuranPage(classId, studentId, pageNumber)
        .catch((err) => {
          console.warn("[Sync] Backend student activate page error:", err);
        });
    }
    setTeachingClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          students: cls.students.map((std) => {
            if (std.id !== studentId) return std;
            const pages = ensureStudentQuranData(std);
            const newPages = pages.map((p) => {
              if (p.pageNumber !== pageNumber) return p;
              return {
                ...p,
                isActive: true,
                status: "active" as const,
                fsrsData: {
                  stability: 0,
                  difficulty: 10,
                  reps: 0,
                  lapses: 0,
                  lastReview: null,
                  nextReview: new Date().toISOString(),
                  state: "new" as const,
                },
              };
            });
            const activeCount = newPages.filter((p) => p.isActive).length;
            const updatedStd = {
              ...std,
              quranData: newPages,
              activeItemsCount: activeCount,
            };
            updateStudentInClassGlobal(classId, studentId, updatedStd);
            return updatedStd;
          }),
        };
      }),
    );
  };

  const deactivateStudentQuranPage = (
    classId: string,
    studentId: string,
    pageNumber: number,
  ) => {
    if (studentId === `std-user-${userProfile.id}`) {
      deactivateQuranPage(pageNumber);
    }
    if (studentId && !studentId.startsWith("sample-")) {
      classApiService
        .deactivateStudentQuranPage(classId, studentId, pageNumber)
        .catch((err) => {
          console.warn("[Sync] Backend student deactivate page error:", err);
        });
    }
    setTeachingClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          students: cls.students.map((std) => {
            if (std.id !== studentId) return std;
            const pages = ensureStudentQuranData(std);
            const newPages = pages.map((p) => {
              if (p.pageNumber !== pageNumber) return p;
              return {
                ...p,
                isActive: false,
                status: "inactive" as const,
              };
            });
            const activeCount = newPages.filter((p) => p.isActive).length;
            const updatedStd = {
              ...std,
              quranData: newPages,
              activeItemsCount: activeCount,
            };
            updateStudentInClassGlobal(classId, studentId, updatedStd);
            return updatedStd;
          }),
        };
      }),
    );
  };

  const bypassStudentQuranPageMapan = (
    classId: string,
    studentId: string,
    pageNumber: number,
  ) => {
    if (studentId === `std-user-${userProfile.id}`) {
      bypassQuranPageToMapan(pageNumber);
    }
    setTeachingClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          students: cls.students.map((std) => {
            if (std.id !== studentId) return std;
            const pages = ensureStudentQuranData(std);
            const newPages = pages.map((p) => {
              if (p.pageNumber !== pageNumber) return p;
              const now = new Date();
              const future = new Date(now.getTime() + 300 * 86400000);
              return {
                ...p,
                isActive: true,
                status: "mastered_for_now" as const,
                mapanCelebrated: true,
                fsrsData: {
                  ...p.fsrsData,
                  stability: 745.0,
                  difficulty: 1.0,
                  reps: Math.max(p.fsrsData.reps, 15),
                  lastReview: now.toISOString(),
                  nextReview: future.toISOString(),
                  state: "mastered" as const,
                },
              };
            });
            const updatedStd = { ...std, quranData: newPages };
            updateStudentInClassGlobal(classId, studentId, updatedStd);
            return updatedStd;
          }),
        };
      }),
    );
  };

  const resetStudentQuranPageMapan = (
    classId: string,
    studentId: string,
    pageNumber: number,
  ) => {
    if (studentId === `std-user-${userProfile.id}`) {
      resetQuranPageMapan(pageNumber);
    }
    setTeachingClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          students: cls.students.map((std) => {
            if (std.id !== studentId) return std;
            const pages = ensureStudentQuranData(std);
            const newPages = pages.map((p) => {
              if (p.pageNumber !== pageNumber) return p;
              return {
                ...p,
                status: "active" as const,
                mapanCelebrated: false,
                fsrsData: {
                  ...p.fsrsData,
                  stability: 1.0,
                  difficulty: 10.0,
                  nextReview: new Date().toISOString(),
                  state: "review" as const,
                },
              };
            });
            const updatedStd = { ...std, quranData: newPages };
            updateStudentInClassGlobal(classId, studentId, updatedStd);
            return updatedStd;
          }),
        };
      }),
    );
  };

  const reviewStudentQuranPage = (
    classId: string,
    studentId: string,
    pageNumber: number,
    rating: 1 | 2 | 3,
    note?: string,
  ) => {
    // If it's the current user, we can actually review the page!
    if (studentId === `std-user-${userProfile.id}`) {
      reviewQuranPage(pageNumber, rating);
    }

    // Create feedback
    const defaultNote =
      rating === 3
        ? "Lancar Mutqin"
        : rating === 2
          ? "Lancar"
          : "Belum / Perlu Ulang";
    if (studentId && !studentId.startsWith("sample-")) {
      classApiService
        .reviewStudentQuranPage(classId, studentId, pageNumber, {
          rating,
          notes: note || defaultNote,
        })
        .catch((err) => {
          console.warn("[Sync] Backend student review page error:", err);
        });
    }
    const feedback: import("../types").QuranFeedbackItem = {
      id: `fb-${Date.now()}`,
      date: new Date().toISOString(),
      pageNumber,
      rating,
      note: note || defaultNote,
      teacherName: userProfile.fullName,
    };

    setTeacherFeedbacks((prev) => [feedback, ...prev]);

    setTeachingClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          students: cls.students.map((std) => {
            if (std.id !== studentId) return std;

            const pages = ensureStudentQuranData(std);
            // Apply FSRS rating directly to the student's quranData
            const newQuranData = pages.map((p) => {
              if (p.pageNumber !== pageNumber) return p;
              const res = updateQuranFSRS(
                p.fsrsData,
                rating,
                new Date(),
                p.mapanSchedule,
              );
              return {
                ...p,
                status: (res.isMasteredForNow
                  ? "mastered_for_now"
                  : "active") as "mastered_for_now" | "active",
                fsrsData: res.newState,
              };
            });

            // Recalculate derived stats
            const activePages = newQuranData.filter((p) => p.isActive);
            const activeItemsCount = activePages.length;
            const dueTodayCount = activePages.filter((p) =>
              isDue(p.fsrsData?.nextReview, p.isActive, p.fsrsData?.lastReview),
            ).length;
            const avgStability =
              activePages.length > 0
                ? Math.round(
                    activePages.reduce(
                      (acc, p) => acc + (p.fsrsData.stability || 0),
                      0,
                    ) / activePages.length,
                  )
                : 0;

            const updatedStd = {
              ...std,
              quranData: newQuranData,
              activeItemsCount,
              dueTodayCount,
              averageStability: avgStability,
              teacherFeedbacks: [feedback, ...(std.teacherFeedbacks || [])],
            };
            updateStudentInClassGlobal(classId, studentId, updatedStd);
            return updatedStd;
          }),
        };
      }),
    );
  };

  const addStudentDailyFeedback = (
    classId: string,
    studentId: string,
    note: string,
  ) => {
    const feedback: import("../types").QuranFeedbackItem = {
      id: `fb-${Date.now()}`,
      date: new Date().toISOString(),
      note,
      teacherName: userProfile.fullName,
    };

    setTeacherFeedbacks((prev) => [feedback, ...prev]);

    setTeachingClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          students: cls.students.map((std) => {
            if (std.id !== studentId) return std;
            const updatedStd = {
              ...std,
              teacherFeedbacks: [feedback, ...(std.teacherFeedbacks || [])],
            };
            updateStudentInClassGlobal(classId, studentId, updatedStd);
            return updatedStd;
          }),
        };
      }),
    );
  };

  const ensureStudentBookData = (
    std: ClassStudent,
    bookId: string,
  ): BookItem[] => {
    const masterItems = items.filter((i) => i.bookId === bookId);
    const sourcePool =
      masterItems.length > 0
        ? masterItems
        : INITIAL_ITEMS.filter((i) => i.bookId === bookId);

    if (std.bookItemsData && std.bookItemsData.length > 0) {
      const stdMap = new Map<string, BookItem>(
        std.bookItemsData.map((i) => [i.id, i]),
      );
      return sourcePool.map((masterItem) => {
        const stdItem = stdMap.get(masterItem.id);
        if (stdItem) {
          return {
            ...masterItem,
            isActive: stdItem.isActive,
            status: stdItem.status,
            fsrsData: stdItem.fsrsData,
            reviewLogs: stdItem.reviewLogs || [],
          };
        }
        return {
          ...masterItem,
          isActive: false,
          status: "inactive" as const,
          fsrsData: createInitialFSRSState(),
          reviewLogs: [],
        };
      });
    }
    return createSampleStudentBookItems(
      sourcePool.length > 0 ? sourcePool : INITIAL_ITEMS,
      std.activeItemsCount || 15,
      std.dueTodayCount || 0,
    );
  };

  const activateStudentBookItem = (
    classId: string,
    studentId: string,
    itemId: string,
  ) => {
    if (studentId === `std-user-${userProfile.id}`) {
      activateItem(itemId);
    }
    setTeachingClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        const assignedBookId =
          cls.assignedBookIds?.[0] || books[0]?.id || "book-1";
        return {
          ...cls,
          students: cls.students.map((std) => {
            if (std.id !== studentId) return std;
            const bookItems = ensureStudentBookData(std, assignedBookId);
            const updatedItems = bookItems.map((i) => {
              if (i.id !== itemId) return i;
              return {
                ...i,
                isActive: true,
                status:
                  i.status === "inactive" ? ("active" as const) : i.status,
                fsrsData: {
                  ...i.fsrsData,
                  nextReview: new Date().toISOString(),
                  state:
                    i.fsrsData.reps > 0
                      ? ("review" as const)
                      : ("new" as const),
                },
              };
            });
            const activeCount = updatedItems.filter((i) => i.isActive).length;
            const dueCount = updatedItems.filter((i) =>
              isDue(i.fsrsData?.nextReview, i.isActive, i.fsrsData?.lastReview),
            ).length;
            const updatedStd = {
              ...std,
              bookItemsData: updatedItems,
              activeItemsCount: activeCount,
              dueTodayCount: dueCount,
            };
            updateStudentInClassGlobal(classId, studentId, updatedStd);
            return updatedStd;
          }),
        };
      }),
    );
  };

  const deactivateStudentBookItem = (
    classId: string,
    studentId: string,
    itemId: string,
  ) => {
    if (studentId === `std-user-${userProfile.id}`) {
      deactivateItem(itemId);
    }
    setTeachingClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        const assignedBookId =
          cls.assignedBookIds?.[0] || books[0]?.id || "book-1";
        return {
          ...cls,
          students: cls.students.map((std) => {
            if (std.id !== studentId) return std;
            const bookItems = ensureStudentBookData(std, assignedBookId);
            const updatedItems = bookItems.map((i) => {
              if (i.id !== itemId) return i;
              return {
                ...i,
                isActive: false,
                status: "inactive" as const,
              };
            });
            const activeCount = updatedItems.filter((i) => i.isActive).length;
            const dueCount = updatedItems.filter((i) =>
              isDue(i.fsrsData?.nextReview, i.isActive, i.fsrsData?.lastReview),
            ).length;
            const updatedStd = {
              ...std,
              bookItemsData: updatedItems,
              activeItemsCount: activeCount,
              dueTodayCount: dueCount,
            };
            updateStudentInClassGlobal(classId, studentId, updatedStd);
            return updatedStd;
          }),
        };
      }),
    );
  };

  const bypassStudentBookItemMapan = (
    classId: string,
    studentId: string,
    itemId: string,
  ) => {
    setTeachingClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        const assignedBookId =
          cls.assignedBookIds?.[0] || books[0]?.id || "book-1";
        return {
          ...cls,
          students: cls.students.map((std) => {
            if (std.id !== studentId) return std;
            const bookItems = ensureStudentBookData(std, assignedBookId);
            const now = new Date();
            const future = new Date(now.getTime() + 320 * 86400000);
            const updatedItems = bookItems.map((i) => {
              if (i.id !== itemId) return i;
              return {
                ...i,
                isActive: true,
                status: "mastered" as const,
                fsrsData: {
                  ...i.fsrsData,
                  stability: 365.0,
                  difficulty: 3.0,
                  reps: Math.max(i.fsrsData.reps, 10),
                  lastReview: now.toISOString(),
                  nextReview: future.toISOString(),
                  state: "mastered" as const,
                },
              };
            });
            const updatedStd = {
              ...std,
              bookItemsData: updatedItems,
            };
            updateStudentInClassGlobal(classId, studentId, updatedStd);
            return updatedStd;
          }),
        };
      }),
    );
  };

  const resetStudentBookItemMapan = (
    classId: string,
    studentId: string,
    itemId: string,
  ) => {
    setTeachingClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        const assignedBookId =
          cls.assignedBookIds?.[0] || books[0]?.id || "book-1";
        return {
          ...cls,
          students: cls.students.map((std) => {
            if (std.id !== studentId) return std;
            const bookItems = ensureStudentBookData(std, assignedBookId);
            const updatedItems = bookItems.map((i) => {
              if (i.id !== itemId) return i;
              return {
                ...i,
                status: "active" as const,
                fsrsData: {
                  ...i.fsrsData,
                  stability: 1.0,
                  difficulty: 5.0,
                  nextReview: new Date().toISOString(),
                  state: "review" as const,
                },
              };
            });
            const updatedStd = {
              ...std,
              bookItemsData: updatedItems,
            };
            updateStudentInClassGlobal(classId, studentId, updatedStd);
            return updatedStd;
          }),
        };
      }),
    );
  };

  const reviewStudentBookItem = (
    classId: string,
    studentId: string,
    itemId: string,
    rating: 1 | 2 | 3 | 4,
    note?: string,
  ) => {
    if (studentId === `std-user-${userProfile.id}`) {
      reviewItem(itemId, rating);
    }

    const ratingLabels: Record<number, string> = {
      1: "Perlu Belajar Ulang (Again)",
      2: "Masih Sulit (Hard)",
      3: "Sudah Paham (Good)",
      4: "Sangat Menguasai (Easy)",
    };
    const feedback: QuranFeedbackItem = {
      id: `fb-book-${Date.now()}`,
      date: new Date().toISOString(),
      rating: rating >= 3 ? 2 : 1,
      note: note || `Review Guru: ${ratingLabels[rating]}`,
      teacherName: userProfile.fullName,
    };

    setTeacherFeedbacks((prev) => [feedback, ...prev]);

    setTeachingClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        const assignedBookId =
          cls.assignedBookIds?.[0] || books[0]?.id || "book-1";
        return {
          ...cls,
          students: cls.students.map((std) => {
            if (std.id !== studentId) return std;
            const bookItems = ensureStudentBookData(std, assignedBookId);
            const updatedItems = bookItems.map((i) => {
              if (i.id !== itemId) return i;
              const { newState } = updateNonQuranFSRS(i.fsrsData, rating);
              const isMastered = newState.stability >= 300;
              return {
                ...i,
                status: isMastered
                  ? ("mastered" as const)
                  : ("active" as const),
                fsrsData: newState,
              };
            });

            const activeCount = updatedItems.filter((i) => i.isActive).length;
            const dueCount = updatedItems.filter((i) =>
              isDue(i.fsrsData?.nextReview, i.isActive, i.fsrsData?.lastReview),
            ).length;
            const avgStability =
              activeCount > 0
                ? Math.round(
                    updatedItems
                      .filter((i) => i.isActive)
                      .reduce(
                        (acc, i) => acc + (i.fsrsData.stability || 0),
                        0,
                      ) / activeCount,
                  )
                : 0;

            const updatedStd = {
              ...std,
              bookItemsData: updatedItems,
              activeItemsCount: activeCount,
              dueTodayCount: dueCount,
              averageStability: avgStability,
              teacherFeedbacks: [feedback, ...(std.teacherFeedbacks || [])],
            };
            updateStudentInClassGlobal(classId, studentId, updatedStd);
            return updatedStd;
          }),
        };
      }),
    );
  };

  const resetToDefaults = () => {
    if (
      confirm(
        language === "en"
          ? "Are you sure you want to reset all data?"
          : "Yakin ingin mereset semua data?",
      )
    ) {
      const keys = [
        "quran_pages",
        "books",
        "chapters",
        "items",
        "pages",
        "my_classes",
        "teaching_classes",
        "teacher_feedbacks",
        "attendance_exceptions",
      ];
      keys.forEach((k) =>
        localStorage.removeItem(getUserKey(userProfile.id, k)),
      );
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
    const active = pages.filter((p) => p && p.isActive);
    // Count mastered across ALL pages (even inactive ones retain their mastery)
    const mastered = pages.filter(
      (p) =>
        p &&
        (p.status === "mastered_for_now" ||
          p.mapanCelebrated ||
          (p.fsrsData?.stability ?? 0) >= 74.5 ||
          Math.round((p.fsrsData?.stability || 0) * 0.4025587) > 30),
    );
    const dueList = active.filter(
      (p) =>
        p && isDue(p.fsrsData?.nextReview, p.isActive, p.fsrsData?.lastReview),
    );

    // Calculate interval breakdowns safely
    const intervalOver30 = active.filter(
      (p) =>
        p &&
        (p.status === "mastered_for_now" ||
          Math.round((p.fsrsData?.stability || 0) * 0.4025587) > 30),
    ).length;
    const intervalLessThan30 =
      active.filter(
        (p) =>
          p &&
          Math.round((p.fsrsData?.stability || 0) * 0.4025587) <= 30 &&
          Math.round((p.fsrsData?.stability || 0) * 0.4025587) > 19,
      ).length + intervalOver30;
    const intervalLessThan20 =
      active.filter(
        (p) =>
          p &&
          Math.round((p.fsrsData?.stability || 0) * 0.4025587) <= 19 &&
          Math.round((p.fsrsData?.stability || 0) * 0.4025587) > 9,
      ).length + intervalLessThan30;
    const intervalLessThan10 =
      active.filter(
        (p) =>
          p &&
          Math.round((p.fsrsData?.stability || 0) * 0.4025587) <= 9 &&
          Math.round((p.fsrsData?.stability || 0) * 0.4025587) > 4,
      ).length + intervalLessThan20;
    const intervalLessThan5 = active.filter(
      (p) => p && Math.round((p.fsrsData?.stability || 0) * 0.4025587) <= 4,
    ).length;

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
      intervalLessThan5,
    };
  }, [quranPages]);

  const bookStats = useMemo(() => {
    const safeBooks = Array.isArray(books) ? books : [];
    const safeItems = Array.isArray(items) ? items : [];
    const active = safeItems.filter((i) => i && i.isActive);
    const dueList = active.filter(
      (i) =>
        i && isDue(i.fsrsData?.nextReview, i.isActive, i.fsrsData?.lastReview),
    );
    const totalStability = active.reduce(
      (sum, item) => sum + (item.fsrsData?.stability || 0),
      0,
    );
    const avgStability =
      active.length > 0 ? Math.round(totalStability / active.length) : 0;

    return {
      totalBooks: safeBooks.length,
      totalItems: safeItems.length,
      activeItems: active.length,
      dueToday: dueList.length,
      avgStability,
      dueList,
    };
  }, [books, items]);

  const myClassesStats = useMemo(() => {
    let dueToday = 0;
    const safeClasses = Array.isArray(myClasses) ? myClasses : [];
    const safeItems = Array.isArray(items) ? items : [];
    const myBookClasses = safeClasses.filter(
      (c) => c && c.type === "non-quran",
    );
    myBookClasses.forEach((cls) => {
      if (!cls) return;
      const assignedBookIds = Array.isArray(cls.assignedBookIds)
        ? cls.assignedBookIds
        : [];
      const classItems = safeItems.filter(
        (i) => i && assignedBookIds.includes(i.bookId),
      );
      const activeItems = classItems.filter((i) => i && i.isActive);
      const dueItems = activeItems.filter(
        (i) =>
          i &&
          isDue(i.fsrsData?.nextReview, i.isActive, i.fsrsData?.lastReview),
      );
      dueToday += dueItems.length;
    });
    return { dueToday };
  }, [myClasses, items]);

  const nonQuranActiveCount = useMemo(
    () =>
      (Array.isArray(items) ? items : []).filter((i) => i && i.isActive).length,
    [items],
  );
  const nonQuranMasteredCount = useMemo(
    () =>
      (Array.isArray(items) ? items : []).filter(
        (i) => i && i.isActive && (i.fsrsData?.stability || 0) >= 300,
      ).length,
    [items],
  );

  const totalActiveMaterials = (quranStats?.active || 0) + nonQuranActiveCount;
  const totalMasteredMaterials =
    (quranStats?.mastered || 0) + nonQuranMasteredCount;

  const currentStreak = useMemo(() => {
    try {
      const safeQuran = Array.isArray(quranPages) ? quranPages : [];
      const safeItems = Array.isArray(items) ? items : [];

      const activeQuran = safeQuran.filter((p) => p?.isActive);
      const activeItems = safeItems.filter((i) => i?.isActive);
      const totalActive = activeQuran.length + activeItems.length;

      if (totalActive === 0) return 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check overdue items today
      const overdueQuran = activeQuran.filter((p) => {
        if (!p.fsrsData?.nextReview) return false;
        const nDate = new Date(p.fsrsData.nextReview);
        nDate.setHours(0, 0, 0, 0);
        return nDate < today;
      }).length;

      const overdueItems = activeItems.filter((i) => {
        if (!i.fsrsData?.nextReview) return false;
        const nDate = new Date(i.fsrsData.nextReview);
        nDate.setHours(0, 0, 0, 0);
        return nDate < today;
      }).length;

      const totalOverdueToday = overdueQuran + overdueItems;
      const todayDisciplineRate = Math.round(
        ((totalActive - totalOverdueToday) / totalActive) * 100,
      );

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
          if (
            p.reviewLogs?.some(
              (l) => l?.date && new Date(l.date).toDateString() === dateStr,
            )
          ) {
            hadActivity = true;
            break;
          }
        }
        if (!hadActivity) {
          for (const item of safeItems) {
            if (!item) continue;
            if (
              item.reviewLogs?.some(
                (l) => l?.date && new Date(l.date).toDateString() === dateStr,
              )
            ) {
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
      console.warn("Error calculating discipline streak", e);
      return 0;
    }
  }, [quranPages, items]);

  return (
    <AppContext.Provider
      value={{
        activeSpace,
        setActiveSpace,
        selectedTeachingClassId,
        setSelectedTeachingClassId,
        editingClassBookId,
        setEditingClassBookId,
        selectedPersonalBookId,
        setSelectedPersonalBookId,
        spaceResetCounter,
        resetSpaceToRoot,
        language,
        setLanguage,
        theme,
        setTheme,
        toggleTheme,
        isLandingPageOpen,
        setIsLandingPageOpen,
        isOnboardingOpen,
        setIsOnboardingOpen,
        isOnboardingEnabled,
        setIsOnboardingEnabled,
        isWalkthroughOpen,
        setIsWalkthroughOpen,
        activeWalkthroughPage,
        openPageWalkthrough,
        closePageWalkthrough,
        togglePageOnboarding,
        setAllPageOnboarding,
        resetOnboardingStatus,
        isOnboardingSettingsOpen,
        setIsOnboardingSettingsOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openLoginModal,
        openRegisterModal,
        currentUser,
        userProfile,
        setUserProfile,
        updateUserProfile,
        logout,
        initiateUserSession,
        backendAuthStatus,
        backendAuthError,
        attendanceExceptions,
        markAttendanceException,
        quranSpaceCode,
        teacherFeedbacks,
        isTeacherMode: activeSpace === "teaching",

        tierConfig,
        updateTierConfig,
        dailyAIUsage,
        recordAIUsage,
        isFeatureAllowed,
        isUpgradeModalOpen,
        setIsUpgradeModalOpen,
        upgradeModalContext,
        openUpgradeModal,

        quranPages,
        quranStats,
        activateQuranPage,
        deactivateQuranPage,
        reviewQuranPage,
        bypassQuranPageToMapan,
        resetQuranPageMapan,
        updateQuranMapanSchedule,
        setGlobalMapanSchedule,
        addQuranPageFeedback,
        addQuranPageIssue,
        resolveQuranPageIssue,

        books,
        chapters,
        items,
        pages,
        createPage,
        updatePage,
        deletePage,
        personalStats: bookStats,
        myClassesStats,
        currentStreak,
        totalActiveMaterials,
        totalMasteredMaterials,
        activateItem,
        deactivateItem,
        reviewItem,
        createBook,
        updateBook,
        deleteBook,
        duplicateBookAsEditable,
        createChapter,
        updateChapter,
        deleteChapter,
        createItem,
        updateItem,
        deleteItem,
        reorderItems,
        importFromLibrary,
        importFromJSON,
        exportBookJSON,
        publishBookToLibrary,
        library,

        // Backend Sync & Data Reconciliation
        isBooksLoading,
        booksError,
        reconciliationComparison,
        isReconciliationModalOpen,
        setIsReconciliationModalOpen,
        openReconciliationModal,
        refreshBooksFromBackend,
        refreshClassesFromBackend,

        transactions,
        purchasedBookIds,
        isBookPurchased,
        purchaseBook,
        subscribeToPro,
        isCheckoutModalOpen,
        selectedCheckoutEntry,
        openCheckoutModal,
        closeCheckoutModal,

        myClasses,
        teachingClasses,
        joinClassByCode,
        leaveClass,
        createTeachingClass,
        deleteTeachingClass,
        closeTeachingClass,
        reopenTeachingClass,
        updateTeachingClass,
        removeStudentFromClass,
        reviewStudentQuranPage,
        addStudentDailyFeedback,
        activateStudentQuranPage,
        deactivateStudentQuranPage,
        bypassStudentQuranPageMapan,
        resetStudentQuranPageMapan,
        reviewStudentBookItem,
        activateStudentBookItem,
        deactivateStudentBookItem,
        bypassStudentBookItemMapan,
        resetStudentBookItemMapan,
        getLiveStudentQuranData,
        getLiveStudentBookItems,
        resetToDefaults,
      }}
    >
      {children}

      {/* Legacy Data Reconciliation Modal */}
      <LegacyDataReconciliationModal
        isOpen={isReconciliationModalOpen}
        onClose={() => setIsReconciliationModalOpen(false)}
        comparison={reconciliationComparison}
        onImportSuccess={async () => {
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
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
