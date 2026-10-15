import React, { useState, useEffect } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  HelpCircle,
  Layers,
  Lightbulb,
  MousePointerClick,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import { OnboardingPageKey } from "../../types";
import { ONBOARDING_PAGES_DATA } from "../../data/onboardingData";
import { useApp } from "../../context/AppContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialPageKey?: OnboardingPageKey;
}

export const ProfessionalWalkthroughModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialPageKey = "home",
}) => {
  const {
    language,
    userProfile,
    togglePageOnboarding,
    setIsOnboardingEnabled,
    isOnboardingEnabled,
  } = useApp();

  const [activePageKey, setActivePageKey] =
    useState<OnboardingPageKey>(initialPageKey);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Sync active page when modal opens
  useEffect(() => {
    if (isOpen) {
      setActivePageKey(initialPageKey);
      setCurrentStepIndex(0);
    }
  }, [isOpen, initialPageKey]);

  // Mark currently active tab as seen so it doesn't pop up again
  useEffect(() => {
    if (isOpen) {
      try {
        localStorage.setItem(
          `unlupa_walkthrough_seen_${activePageKey}`,
          "true",
        );
      } catch (e) {
        /* ignore */
      }
    }
  }, [isOpen, activePageKey]);

  // Support ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activePageKey]);

  if (!isOpen) return null;

  const currentPageData =
    ONBOARDING_PAGES_DATA[activePageKey] || ONBOARDING_PAGES_DATA.home;
  if (
    !currentPageData ||
    !currentPageData.items ||
    currentPageData.items.length === 0
  )
    return null;

  const items = currentPageData.items;
  const currentItem = items[currentStepIndex] || items[0];
  if (!currentItem) return null;

  const isCurrentPageAutoEnabled =
    userProfile?.onboardingPreferences?.[activePageKey] ?? true;

  const handleToggleAuto = (checked: boolean) => {
    togglePageOnboarding(activePageKey, checked);
  };

  const handleDisableAll = () => {
    try {
      localStorage.setItem(`unlupa_walkthrough_seen_${activePageKey}`, "true");
    } catch (e) {
      /* ignore */
    }
    setIsOnboardingEnabled(false);
    onClose();
  };

  const handleClose = () => {
    try {
      localStorage.setItem(`unlupa_walkthrough_seen_${activePageKey}`, "true");
    } catch (e) {
      /* ignore */
    }
    onClose();
  };

  const handleNext = () => {
    if (currentStepIndex < items.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem(`unlupa_walkthrough_seen_${activePageKey}`, "true");
    } catch (e) {
      /* ignore */
    }
    onClose();
  };

  const pagesNav: {
    key: OnboardingPageKey;
    labelEn: string;
    labelId: string;
  }[] = [
    { key: "home", labelEn: "Home", labelId: "Beranda" },
    { key: "quran", labelEn: "Quran", labelId: "Al-Qur'an" },
    { key: "personal", labelEn: "Personal", labelId: "Pribadi" },
    { key: "teaching", labelEn: "Teaching", labelId: "Mengajar" },
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in select-none"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="walkthrough-title"
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden text-slate-900 dark:text-slate-100"
      >
        {/* Header with Page Selector & Close Button */}
        <div className="px-5 sm:px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800/70">
                {currentPageData.icon}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
                  {language === "en"
                    ? currentPageData.badgeEn
                    : currentPageData.badgeId}
                </span>
                <h2
                  id="walkthrough-title"
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mt-0.5"
                >
                  {language === "en"
                    ? currentPageData.titleEn
                    : currentPageData.titleId}
                </h2>
              </div>
            </div>

            <button
              onClick={handleClose}
              aria-label={
                language === "en" ? "Close walkthrough" : "Tutup panduan"
              }
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Page Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {pagesNav.map((p) => {
              const isActive = activePageKey === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => {
                    setActivePageKey(p.key);
                    setCurrentStepIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200/60 dark:border-slate-700/60"
                  }`}
                >
                  {language === "en" ? p.labelEn : p.labelId}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Body: Item & Function Details */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 text-xs sm:text-sm">
          {/* Step Counter & Category */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {language === "en"
                  ? `Step ${currentStepIndex + 1} of ${items.length}`
                  : `Fitur ${currentStepIndex + 1} dari ${items.length}`}
              </span>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                {language === "en" ? currentItem.badgeEn : currentItem.badgeId}
              </span>
            </div>

            {/* Step Dots indicator */}
            <div className="flex items-center gap-1.5">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? "w-6 bg-blue-600"
                      : "w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300"
                  }`}
                  title={`Ke fitur ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Item Header & Visual Representation */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <div
              className={`p-3 rounded-2xl border shrink-0 ${currentItem.iconBg}`}
            >
              {currentItem.icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                {language === "en" ? currentItem.nameEn : currentItem.nameId}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {language === "en" ? currentItem.descEn : currentItem.descId}
              </p>
            </div>
          </div>

          {/* Interactive Visual Mockup Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>
                {language === "en"
                  ? "Live Element Preview on Screen:"
                  : "Wujud Elemen Asli di Layar:"}
              </span>
            </div>
            <div className="p-3 bg-slate-100/70 dark:bg-slate-950/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-inner">
              {currentItem.mockup}
            </div>
          </div>

          {/* Detailed Function & Action Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">
                <MousePointerClick className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>
                  {language === "en"
                    ? "Function & Action"
                    : "Fungsi & Cara Pakai"}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {language === "en"
                  ? currentItem.functionEn
                  : currentItem.functionId}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>
                  {language === "en" ? "Best Practice Tip" : "Tips Profesional"}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {language === "en" ? currentItem.tipEn : currentItem.tipId}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Controls: Toggle preference & Step Buttons */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Per-Page Auto-Trigger Toggle & Disable All Link */}
          <div className="flex flex-wrap items-center gap-2.5 select-none">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isCurrentPageAutoEnabled}
                onChange={(e) => handleToggleAuto(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-[11px] sm:text-xs">
                {language === "en"
                  ? "Auto-show guide on this page"
                  : "Muncul otomatis di halaman ini"}
              </span>
            </label>

            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">
              •
            </span>

            <button
              type="button"
              onClick={handleDisableAll}
              className="text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline cursor-pointer font-medium"
              title={
                language === "en"
                  ? "Never show onboarding guides again automatically"
                  : "Jangan pernah tampilkan panduan onboarding lagi secara otomatis"
              }
            >
              {language === "en"
                ? "Turn off all guides"
                : "Nonaktifkan semua panduan"}
            </button>
          </div>

          {/* Navigation Prev & Next */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              disabled={currentStepIndex === 0}
              onClick={handlePrev}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{language === "en" ? "Previous" : "Sebelumnya"}</span>
            </button>

            {currentStepIndex < items.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>
                  {language === "en" ? "Next Feature" : "Fitur Berikutnya"}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>
                  {language === "en"
                    ? "Understand & Finish"
                    : "Paham & Selesai"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
