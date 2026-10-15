import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { AppSpace, OnboardingPageKey } from "../types";
import {
  downloadDatabaseBackup,
  restoreDatabaseBackup,
} from "../lib/offlineStorage";
import {
  Home,
  BookOpen,
  Library,
  GraduationCap,
  Users,
  Compass,
  Shield,
  Crown,
  Receipt,
  Globe,
  Sun,
  Moon,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  Info,
  Wifi,
  WifiOff,
  Download,
  Upload,
  CalendarDays,
  MoreVertical,
  X,
  HardDrive,
  User as UserIcon,
  Settings,
  LogOut,
  Bell,
  Share2,
  Flame,
  Sliders,
  HelpCircle,
} from "lucide-react";
import { requestNotificationPermission } from "../lib/notifications";
import { QuranAttendanceModal } from "./attendance/QuranAttendanceModal";
import { PWAInstallButton } from "./common/PWAInstallButton";
import { AchievementReportModal } from "./common/AchievementReportModal";
import { BillingHistoryModal } from "./profile/BillingHistoryModal";
import { Award, ShieldAlert, Trophy } from "lucide-react";
import { isUserAdmin } from "../services/authRbacService";

export const Navigation: React.FC = () => {
  const {
    activeSpace,
    setActiveSpace,
    resetSpaceToRoot,
    language,
    setLanguage,
    theme,
    toggleTheme,
    quranPages,
    quranStats,
    personalStats,
    myClassesStats,
    books,
    chapters,
    items,
    myClasses,
    teachingClasses,
    currentStreak,
    totalActiveMaterials,
    totalMasteredMaterials,
    isLandingPageOpen,
    setIsLandingPageOpen,
    setIsOnboardingOpen,
    isOnboardingEnabled,
    setIsOnboardingEnabled,
    openPageWalkthrough,
    setIsOnboardingSettingsOpen,
    resetToDefaults,
    userProfile,
    currentUser,
    openLoginModal,
    openUpgradeModal,
    logout,
  } = useApp();

  const handleSelectSpace = (space: AppSpace) => {
    setIsLandingPageOpen(false);
    if (activeSpace === space) {
      resetSpaceToRoot(space);
    } else {
      setActiveSpace(space);
    }
  };

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  // currentStreak removed as it is now in useApp() destructuring above

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRestoreClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const ok = await restoreDatabaseBackup(file);
      if (ok) {
        alert(
          language === "en"
            ? "Data restored successfully! Refreshing app..."
            : "Data berhasil dipulihkan! Memuat ulang aplikasi...",
        );
        window.location.reload();
      } else {
        alert(
          language === "en"
            ? "Failed to restore backup file."
            : "Gagal memulihkan file cadangan.",
        );
      }
    };
    input.click();
  };

  const totalDueAll =
    quranStats.dueToday + personalStats.dueToday + myClassesStats.dueToday;

  const OfflineBanner = () => {
    if (isOnline) return null;
    return (
      <div className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        {language === "en"
          ? "Offline Mode - Syncing paused"
          : "Mode Offline - Sinkronisasi dijeda"}
      </div>
    );
  };

  const isAdmin = isUserAdmin(userProfile);

  const baseNavItems: {
    space: AppSpace;
    labelEn: string;
    labelId: string;
    labelAr: string;
    icon: React.ReactNode;
    badge: number;
  }[] = [
    {
      space: "dashboard",
      labelEn: "Home",
      labelId: "Beranda",
      labelAr: "الرئيسية",
      icon: <Home className="w-5 h-5" />,
      badge: 0,
    },
    {
      space: "quran",
      labelEn: "Al-Quran",
      labelId: "Al-Qur'an",
      labelAr: "القرآن",
      icon: <BookOpen className="w-5 h-5" />,
      badge: quranStats.dueToday,
    },
    {
      space: "personal",
      labelEn: "Books",
      labelId: "Ruang Buku",
      labelAr: "الكتب",
      icon: <Library className="w-5 h-5" />,
      badge: personalStats.dueToday,
    },
    {
      space: "teaching",
      labelEn: "Teaching",
      labelId: "Mengajar",
      labelAr: "تدريس",
      icon: <Users className="w-5 h-5" />,
      badge: 0,
    },
    {
      space: "leaderboard",
      labelEn: "Leaderboard",
      labelId: "Peringkat",
      labelAr: "المتصدرين",
      icon: <Trophy className="w-5 h-5" />,
      badge: 0,
    },
    ...(isAdmin
      ? [
          {
            space: "admin" as AppSpace,
            labelEn: "Admin",
            labelId: "Admin",
            labelAr: "المشرف",
            icon: <ShieldAlert className="w-5 h-5" />,
            badge: 0,
          },
        ]
      : []),
  ];

  const navItems = baseNavItems;

  return (
    <>
      {/* Top Application Bar - ONLY on Dashboard (Beranda) as requested */}
      {activeSpace === "dashboard" && (
        <header className="print:hidden sticky top-0 z-40 bg-[#EBEEF5]/90 dark:bg-[#0E1626]/90 backdrop-blur-md border-b border-white/70 dark:border-white/5 shadow-[0_6px_20px_rgba(166,175,195,0.3)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.55)] transition-colors">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 h-15 flex items-center justify-between gap-2">
            {/* Left: Professional Neumorphic unlupa.id Brandmark */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <button
                onClick={() => handleSelectSpace("dashboard")}
                className="flex items-center gap-2 sm:gap-2.5 text-left group cursor-pointer"
                title={
                  language === "en" ? "Back to Home" : "Kembali ke Beranda"
                }
              >
                {/* Tactile Soft-Clay Brand Icon Pod */}
                <div className="w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center group-hover:scale-105 active:scale-95 transition-transform shrink-0 shadow-[0_4px_12px_rgba(255,111,61,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.7)] relative">
                  <svg
                    className="w-4.5 h-4.5 text-white shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path
                      d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
                      fill="rgba(255,255,255,0.25)"
                    />
                    <path d="M7 6h8" />
                    <path d="M7 10h8" />
                    <path d="M7 14h5" />
                  </svg>
                </div>

                {/* Modern Professional Typography for unlupa.id */}
                <div className="select-none flex items-baseline">
                  <span className="brand-title-navy text-2xl sm:text-[26px] tracking-tight font-extrabold lowercase font-sans inline-block">
                    unlupa
                  </span>
                  <span className="brand-title-orange text-2xl sm:text-[26px] tracking-tight font-black lowercase font-sans inline-block">
                    .id
                  </span>

                  {/* Subtle Professional Subtitle Pill */}
                  <span className="hidden sm:inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-[#5E6D88] dark:text-[#94A3B8] bg-[#DFE6F0] dark:bg-[#162035] shadow-[inset_1px_1px_2px_rgba(166,175,195,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] dark:shadow-[inset_1px_1px_2px_rgba(0,0,0,0.6)]">
                    Mutqin
                  </span>
                </div>
              </button>
            </div>

            {/* Right Action Tools: Pushed to far right corner, Ahlan placed snug & mepet with 3-dots button */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {/* Online / Offline Status Badge - Compact */}
              {!isOnline && (
                <div
                  className="inline-flex items-center gap-1 px-2 h-7.5 clay-badge-orange text-[11px] font-semibold mr-0.5"
                  title="Mode Offline: Akses Al-Quran & Murajaah tetap berfungsi tanpa internet"
                >
                  <WifiOff className="w-3 h-3 text-white shrink-0" />
                  <span className="text-white hidden sm:inline">Offline</span>
                </div>
              )}

              {/* Ahlan Greeting placed in right corner snug / mepet with 3-dots button */}
              <div className="flex items-center px-2.5 sm:px-3.5 py-1.5 rounded-2xl neumorph-card text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] select-none shrink-0 border border-white/60 dark:border-white/10">
                <span className="whitespace-nowrap">
                  Ahlan,{" "}
                  <span className="text-[#FF6F3D] font-black">
                    {userProfile?.fullName || "HSI BS"}
                  </span>
                </span>
                <span className="ml-1 text-xs shrink-0">👋</span>
              </div>

              {/* 3-dots Menu Trigger Button */}
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu((prev) => !prev)}
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all ${
                    showProfileMenu
                      ? "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-md scale-105"
                      : "neumorph-card text-[#18234A] dark:text-[#F8FAFC]"
                  }`}
                  title="Menu Utama, Utilitas & Profil"
                  aria-label="Menu Utama, Utilitas & Profil"
                >
                  <MoreVertical className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* High-End Tactile Neumorphic Profile & Utilities Modal Overlay */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-[120] bg-black/40 dark:bg-black/70 backdrop-blur-xs flex justify-end items-start p-3 sm:p-4 pt-14 sm:pt-16 animate-in fade-in duration-150 cursor-pointer"
          onClick={() => setShowProfileMenu(false)}
        >
          <div
            className="w-[270px] sm:w-[310px] max-w-[78vw] max-h-[calc(100vh-80px)] overflow-y-auto overscroll-contain bg-[#EEF2F7] dark:bg-[#141C2B] p-3.5 sm:p-4 rounded-3xl shadow-[-8px_8px_24px_rgba(0,0,0,0.18),8px_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[-8px_8px_32px_rgba(0,0,0,0.7)] border border-white/80 dark:border-white/10 flex flex-col space-y-3 scrollbar-thin animate-in slide-in-from-top-3 duration-200 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with User Info + Explicit Close Button (X) */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-black/[0.04] dark:border-white/[0.04]">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.fullName}
                  className="w-9 h-9 rounded-2xl object-cover ring-2 ring-[#FF6F3D]/30 shadow-xs shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-black text-[#18234A] dark:text-[#F8FAFC] truncate text-xs sm:text-sm">
                    {userProfile.fullName}
                  </p>
                  <p className="text-[10px] text-[#5E6D88] dark:text-[#94A3B8] font-medium truncate">
                    {userProfile.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowProfileMenu(false)}
                className="w-7 h-7 rounded-xl neumorph-card flex items-center justify-center text-[#5E6D88] hover:text-[#18234A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
                title="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Subscription Plan Pod */}
            <div className="p-3 rounded-2xl neumorph-inset space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-[#5E6D88] dark:text-[#94A3B8] uppercase tracking-wider">
                  Status Akun
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                    userProfile.plan === "premium" ||
                    userProfile.plan === "institutional"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-2xs"
                      : "bg-black/5 dark:bg-white/10 text-[#5E6D88] dark:text-[#94A3B8]"
                  }`}
                >
                  {userProfile.plan === "premium" ||
                  userProfile.plan === "institutional" ? (
                    <Crown className="w-3 h-3 fill-current" />
                  ) : (
                    <Shield className="w-3 h-3 text-[#FF6F3D]" />
                  )}
                  <span>{userProfile.plan.toUpperCase()}</span>
                </span>
              </div>

              {userProfile.plan === "free" ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    openUpgradeModal(
                      "Profile Dropdown",
                      "Buka seluruh modul hafalan, AI Builder, dan kelas tak terbatas.",
                    );
                  }}
                  className="w-full py-1.5 px-2.5 bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white font-black text-[11px] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-[0_2px_8px_rgba(255,111,61,0.35)]"
                >
                  <Crown className="w-3.5 h-3.5 fill-white" />
                  <span>Upgrade ke Unlupa Pro</span>
                </button>
              ) : (
                <div className="flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-bold pt-0.5">
                  <span>Akses Unlimited Aktif</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setIsBillingModalOpen(true);
                    }}
                    className="text-[#FF6F3D] hover:underline cursor-pointer font-black"
                  >
                    Kelola
                  </button>
                </div>
              )}
            </div>

            {/* 1. Preferences & Theme Settings */}
            <div className="space-y-1.5 pt-0.5">
              <div className="px-1 text-[9px] font-black uppercase text-[#5E6D88] dark:text-[#94A3B8] tracking-wider">
                {language === "en" ? "Preferences" : "Pengaturan & Tampilan"}
              </div>

              {/* Dark Mode */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full text-left p-2 rounded-2xl neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-[1.02] active:scale-95 flex items-center justify-between cursor-pointer transition-all shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#FF6F3D] flex items-center justify-center shrink-0">
                    {theme === "dark" ? (
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                  </div>
                  <span className="text-xs font-bold truncate">
                    {language === "en" ? "Dark Mode" : "Mode Gelap"}
                  </span>
                </div>
                <div
                  className={`w-8 h-4 rounded-full p-0.5 flex items-center transition-colors shrink-0 ${theme === "dark" ? "bg-[#FF6F3D]" : "bg-slate-300 dark:bg-slate-700"}`}
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-white shadow-xs transition-transform ${theme === "dark" ? "translate-x-4" : "translate-x-0"}`}
                  />
                </div>
              </button>

              {/* Language */}
              <button
                type="button"
                onClick={() =>
                  setLanguage(
                    language === "en" ? "id" : language === "id" ? "ar" : "en",
                  )
                }
                className="w-full text-left p-2 rounded-2xl neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-[1.02] active:scale-95 flex items-center justify-between cursor-pointer transition-all shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#FF6F3D] flex items-center justify-center shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold truncate">
                    {language === "en"
                      ? "Language: English"
                      : language === "id"
                        ? "Bahasa: Indonesia"
                        : "اللغة: العربية"}
                  </span>
                </div>
              </button>

              {/* Landing page */}
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.removeItem("unlupa_in_app");
                    window.location.hash = "landing";
                  } catch (e) {}
                  setIsLandingPageOpen(true);
                  setShowProfileMenu(false);
                }}
                className="w-full text-left p-2 rounded-2xl neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-[1.02] active:scale-95 flex items-center justify-between cursor-pointer transition-all shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#FF6F3D] flex items-center justify-center shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold truncate">
                    {language === "en" ? "Landing Page" : "Halaman Depan"}
                  </span>
                </div>
              </button>
            </div>

            {/* 2. Features & Utilities */}
            <div className="space-y-1.5 pt-1 border-t border-black/[0.04] dark:border-white/[0.05]">
              <div className="px-1 text-[9px] font-black uppercase text-[#5E6D88] dark:text-[#94A3B8] tracking-wider">
                {language === "en"
                  ? "Features & Utilities"
                  : "Fitur & Utilitas"}
              </div>

              {/* PWA Install */}
              <PWAInstallButton
                variant="profileMenu"
                onAfterClick={() => setShowProfileMenu(false)}
              />

              {/* Billing */}
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  setIsBillingModalOpen(true);
                }}
                className="w-full text-left p-2 rounded-2xl neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-[1.02] active:scale-95 flex items-center justify-between cursor-pointer transition-all shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#FF6F3D] flex items-center justify-center shrink-0">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold truncate">
                    {language === "en"
                      ? "Billing & Invoices"
                      : "Langganan & Invoice"}
                  </span>
                </div>
              </button>

              {/* Attendance */}
              <button
                type="button"
                onClick={() => {
                  setShowAttendanceModal(true);
                  setShowProfileMenu(false);
                }}
                className="w-full text-left p-2 rounded-2xl neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-[1.02] active:scale-95 flex items-center justify-between cursor-pointer transition-all shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#FF6F3D] flex items-center justify-center shrink-0">
                    <CalendarDays className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold truncate">
                    {language === "en"
                      ? "Attendance History"
                      : "Riwayat Kehadiran"}
                  </span>
                </div>
              </button>

              {/* Print Certificate */}
              <button
                type="button"
                onClick={() => {
                  setIsAchievementModalOpen(true);
                  setShowProfileMenu(false);
                }}
                className="w-full text-left p-2 rounded-2xl neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-[1.02] active:scale-95 flex items-center justify-between cursor-pointer transition-all shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#FF6F3D] flex items-center justify-center shrink-0">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold truncate">
                    {language === "en"
                      ? "Print Certificate"
                      : "Cetak Sertifikat"}
                  </span>
                </div>
              </button>

              {/* Backup JSON */}
              <button
                type="button"
                onClick={() => {
                  downloadDatabaseBackup();
                  setShowProfileMenu(false);
                }}
                className="w-full text-left p-2 rounded-2xl neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-[1.02] active:scale-95 flex items-center justify-between cursor-pointer transition-all shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#FF6F3D] flex items-center justify-center shrink-0">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold truncate">
                    {language === "en"
                      ? "Backup Data (JSON)"
                      : "Cadangkan Data (JSON)"}
                  </span>
                </div>
              </button>

              {/* Notifications */}
              <button
                type="button"
                onClick={async () => {
                  const granted = await requestNotificationPermission();
                  if (granted) {
                    alert(
                      language === "en"
                        ? "Notifications enabled!"
                        : "Notifikasi diaktifkan!",
                    );
                  } else {
                    alert(
                      language === "en"
                        ? "Notification permission denied."
                        : "Izin notifikasi ditolak.",
                    );
                  }
                }}
                className="w-full text-left p-2 rounded-2xl neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-[1.02] active:scale-95 flex items-center justify-between cursor-pointer transition-all shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#FF6F3D] flex items-center justify-center shrink-0">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold truncate">
                    {language === "en"
                      ? "Notifications"
                      : "Notifikasi Pengingat"}
                  </span>
                </div>
              </button>
            </div>

            {/* 3. Onboarding */}
            <div className="space-y-1.5 pt-1 border-t border-black/[0.04] dark:border-white/[0.05]">
              <div className="px-1 text-[9px] font-black uppercase text-[#5E6D88] dark:text-[#94A3B8] tracking-wider">
                {language === "en" ? "Onboarding Guides" : "Panduan Onboarding"}
              </div>

              <div className="p-2 rounded-2xl neumorph-card flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#FF6F3D] flex items-center justify-center shrink-0">
                    <Compass className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs text-[#18234A] dark:text-[#F8FAFC] block font-bold leading-tight">
                      {language === "en" ? "Guides" : "Panduan"}
                    </span>
                    <span className="text-[10px] text-[#5E6D88] dark:text-[#94A3B8] block truncate">
                      {isOnboardingEnabled
                        ? language === "en"
                          ? "Active"
                          : "Aktif"
                        : language === "en"
                          ? "Off"
                          : "Nonaktif"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOnboardingEnabled(!isOnboardingEnabled);
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors duration-200 cursor-pointer shrink-0 ${
                    isOnboardingEnabled
                      ? "bg-gradient-to-r from-[#10B981] to-[#059669]"
                      : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                      isOnboardingEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Configure Walkthrough */}
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  setIsOnboardingSettingsOpen(true);
                }}
                className="w-full text-left p-2 rounded-2xl neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-[1.02] active:scale-95 flex items-center justify-between cursor-pointer transition-all shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#FF6F3D] flex items-center justify-center shrink-0">
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold truncate">
                    {language === "en"
                      ? "Configure Page Guides"
                      : "Atur Panduan Halaman"}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-[#5E6D88]" />
              </button>

              {/* Start Tour */}
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  const pageMap: Record<string, OnboardingPageKey> = {
                    dashboard: "home",
                    quran: "quran",
                    personal: "personal",
                    classes: "teaching",
                    teaching: "teaching",
                    admin: "home",
                  };
                  openPageWalkthrough(pageMap[activeSpace] || "home");
                }}
                className="w-full text-left p-2 rounded-2xl neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-[1.02] active:scale-95 flex items-center justify-between cursor-pointer transition-all shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#FF6F3D] flex items-center justify-center shrink-0">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold truncate">
                    {language === "en"
                      ? "Start Tour for This Page"
                      : "Buka Panduan Halaman Ini"}
                  </span>
                </div>
              </button>
            </div>

            {/* 4. Auth Action */}
            <div className="pt-1 border-t border-black/[0.04] dark:border-white/[0.05]">
              {currentUser ? (
                <button
                  type="button"
                  onClick={async () => {
                    setShowProfileMenu(false);
                    await logout();
                  }}
                  className="w-full text-left p-2 rounded-2xl neumorph-card text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer font-bold transition-all shadow-xs"
                >
                  <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                    <LogOut className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs truncate">
                    {language === "en"
                      ? "Sign Out"
                      : language === "id"
                        ? "Keluar"
                        : "تسجيل الخروج"}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    openLoginModal();
                  }}
                  className="w-full text-left p-2 rounded-2xl neumorph-card text-[#FF6F3D] hover:bg-[#FF6F3D]/10 hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer font-bold transition-all shadow-xs"
                >
                  <div className="w-7 h-7 rounded-xl bg-orange-500/10 text-[#FF6F3D] flex items-center justify-center shrink-0">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs truncate">
                    {language === "en"
                      ? "Sign In / Register"
                      : "Masuk / Daftar"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Navigation Bar (Responsive Space Icons - Luxury Soft Neumorphism) */}
      <nav
        id="bottom-app-navigation"
        className="print:hidden fixed bottom-3 left-2.5 right-2.5 sm:left-1/2 sm:-translate-x-1/2 sm:w-[560px] z-[100] floating-bottom-nav p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] select-none transition-all duration-200"
      >
        <div
          className="grid gap-1 sm:gap-1.5 w-full"
          style={{
            gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))`,
          }}
        >
          {navItems.map((item) => {
            const isActive = activeSpace === item.space && !isLandingPageOpen;
            return (
              <button
                key={item.space}
                onClick={() => handleSelectSpace(item.space)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all relative cursor-pointer active:scale-95 group`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center relative transition-all duration-200 shrink-0 ${
                    isActive
                      ? "clay-icon-pod-orange text-white scale-105 shadow-md"
                      : "clay-icon-pod-neutral text-[#64748B] dark:text-[#94A3B8] group-hover:scale-105 group-hover:text-[#1E293B] dark:group-hover:text-[#F8FAFC]"
                  }`}
                >
                  {React.cloneElement(item.icon as React.ReactElement<any>, {
                    className: "w-4 h-4",
                    strokeWidth: 2.2,
                  })}
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-4 px-1 rounded-full clay-badge-rose text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] sm:text-[11px] mt-1 tracking-tight truncate max-w-full font-bold transition-colors ${
                    isActive
                      ? "text-[#FF6E65]"
                      : "text-[#64748B] dark:text-[#94A3B8]"
                  }`}
                >
                  {language === "en"
                    ? item.labelEn
                    : language === "id"
                      ? item.labelId
                      : item.labelAr}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quran Attendance History Modal */}
      <QuranAttendanceModal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        language={language}
      />

      {/* Achievement Report Modal */}
      <AchievementReportModal
        isOpen={isAchievementModalOpen}
        onClose={() => setIsAchievementModalOpen(false)}
      />

      {/* Billing & Transactions Modal */}
      <BillingHistoryModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
      />
    </>
  );
};
