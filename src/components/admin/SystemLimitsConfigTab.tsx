import React, { useState } from "react";
import {
  ShieldCheck,
  Sliders,
  Cpu,
  BookOpen,
  GraduationCap,
  Crown,
  Check,
  RotateCcw,
  Save,
  Zap,
  Mic,
  FileText,
  Coins,
  CheckCircle2,
  Users,
  AlertCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  SystemTierConfig,
  TierLimitConfig,
  createDefaultTierConfig,
} from "../../types";

export const SystemLimitsConfigTab: React.FC = () => {
  const {
    tierConfig,
    updateTierConfig,
    userProfile,
    updateUserProfile,
    language,
  } = useApp();
  const [tempConfig, setTempConfig] = useState<SystemTierConfig>(tierConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFreeChange = (key: keyof TierLimitConfig, value: any) => {
    setTempConfig((prev) => ({
      ...prev,
      freeTier: {
        ...prev.freeTier,
        [key]: value,
      },
    }));
  };

  const handlePremiumChange = (key: keyof TierLimitConfig, value: any) => {
    setTempConfig((prev) => ({
      ...prev,
      premiumTier: {
        ...prev.premiumTier,
        [key]: value,
      },
    }));
  };

  const handlePricingChange = (
    key: "monthlyIDR" | "yearlyIDR",
    value: number,
  ) => {
    setTempConfig((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    updateTierConfig(tempConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    const defaults = createDefaultTierConfig();
    setTempConfig(defaults);
    updateTierConfig(defaults);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const applyPreset = (preset: "default" | "strict" | "generous") => {
    let updated = createDefaultTierConfig();
    if (preset === "strict") {
      updated.freeTier = {
        ...updated.freeTier,
        maxBooks: 1,
        maxCardsPerBook: 20,
        maxDailyAIGenerations: 1,
        maxActiveQuranJuz: 1,
        maxAudioRecordings: 3,
        allowCreateClass: false,
        allowAISmartExtractor: false,
        allowExportReport: false,
      };
    } else if (preset === "generous") {
      updated.freeTier = {
        ...updated.freeTier,
        maxBooks: 10,
        maxCardsPerBook: 150,
        maxDailyAIGenerations: 10,
        maxActiveQuranJuz: 5,
        maxAudioRecordings: 50,
        allowCreateClass: true,
        allowAISmartExtractor: true,
        allowExportReport: true,
      };
    }
    setTempConfig(updated);
    updateTierConfig(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Quick Action Presets */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>
              {language === "en"
                ? "Live Tier Limits & Monetization Control"
                : "Kontrol Batas Fitur & Monetisasi"}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {language === "en"
              ? "Dynamic Free vs. Premium Paywall Settings"
              : "Pengaturan Batasan Akun Free vs. Akun Pro"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            {language === "en"
              ? "Changes here take effect immediately across all users without touching backend code or redeploying."
              : "Perubahan di sini langsung berlaku seketika untuk seluruh pengguna tanpa perlu membuka backend atau memodifikasi kode."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>
              {language === "en" ? "Reset Defaults" : "Reset Standar"}
            </span>
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 active:scale-95"
          >
            {saveSuccess ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {saveSuccess
                ? language === "en"
                  ? "Saved Successfully!"
                  : "Tersimpan!"
                : language === "en"
                  ? "Save Changes"
                  : "Simpan Perubahan"}
            </span>
          </button>
        </div>
      </div>

      {/* Preset Strategy Buttons */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 text-xs">
        <span className="font-bold text-slate-400 uppercase tracking-wider">
          {language === "en" ? "Quick Presets:" : "Preset Cepat:"}
        </span>
        <button
          onClick={() => applyPreset("default")}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
        >
          {language === "en" ? "Standard Freemium" : "Standar Freemium"}
        </button>
        <button
          onClick={() => applyPreset("strict")}
          className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200/50 transition-colors"
        >
          {language === "en"
            ? "Strict Limits (High Conversion)"
            : "Batas Ketat (Konversi Tinggi)"}
        </button>
        <button
          onClick={() => applyPreset("generous")}
          className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/50 transition-colors"
        >
          {language === "en"
            ? "Generous Promo (Ramadhan/Events)"
            : "Promo Spesial (Longgar)"}
        </button>
      </div>

      {/* Current Session Simulator */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-5 rounded-3xl border border-indigo-200/60 dark:border-indigo-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === "en"
                ? "Simulate User Plan in Current Session"
                : "Uji Coba Tampilan Akun Anda Sekarang"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === "en"
                ? `Currently viewing as: ${userProfile.plan.toUpperCase()} (${userProfile.role || "user"})`
                : `Sedang aktif sebagai: Akun ${userProfile.plan.toUpperCase()} (${userProfile.role || "user"})`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => updateUserProfile({ plan: "free" })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              userProfile.plan === "free"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            }`}
          >
            Simulate FREE
          </button>
          <button
            onClick={() => updateUserProfile({ plan: "premium" })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              userProfile.plan === "premium"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            }`}
          >
            Simulate PRO
          </button>
        </div>
      </div>

      {/* Comparison Grid: Free vs Premium */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FREE TIER CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {language === "en"
                    ? "FREE TIER LIMITS"
                    : "BATASAN AKUN GRATIS"}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === "en"
                    ? "Applied to regular guest and free registered users"
                    : "Berlaku untuk pengunjung tamu dan akun gratis"}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              FREE
            </span>
          </div>

          <div className="p-6 space-y-5 flex-1">
            {/* Max Books */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  {language === "en"
                    ? "Max Personal Books"
                    : "Maksimal Buku Pribadi"}
                </span>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-slate-900 dark:text-white">
                  {tempConfig.freeTier.maxBooks}{" "}
                  {language === "en" ? "Books" : "Buku"}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={tempConfig.freeTier.maxBooks}
                onChange={(e) =>
                  handleFreeChange("maxBooks", Number(e.target.value))
                }
                className="w-full accent-blue-600"
              />
            </div>

            {/* Max Cards Per Book */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  {language === "en"
                    ? "Max Cards Per Book"
                    : "Maksimal Kartu / Materi Per Buku"}
                </span>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-slate-900 dark:text-white">
                  {tempConfig.freeTier.maxCardsPerBook}{" "}
                  {language === "en" ? "Cards" : "Kartu"}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="300"
                step="5"
                value={tempConfig.freeTier.maxCardsPerBook}
                onChange={(e) =>
                  handleFreeChange("maxCardsPerBook", Number(e.target.value))
                }
                className="w-full accent-amber-500"
              />
            </div>

            {/* Max Daily AI Generations */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-purple-500" />
                  {language === "en"
                    ? "Daily AI Builder Generations"
                    : "Batas AI Builder Harian"}
                </span>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-slate-900 dark:text-white">
                  {tempConfig.freeTier.maxDailyAIGenerations}x /{" "}
                  {language === "en" ? "day" : "hari"}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={tempConfig.freeTier.maxDailyAIGenerations}
                onChange={(e) =>
                  handleFreeChange(
                    "maxDailyAIGenerations",
                    Number(e.target.value),
                  )
                }
                className="w-full accent-purple-600"
              />
            </div>

            {/* Max Active Quran Juz */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  {language === "en"
                    ? "Active Quran Juz Limit"
                    : "Batas Juz Al-Qur'an Aktif"}
                </span>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-slate-900 dark:text-white">
                  {tempConfig.freeTier.maxActiveQuranJuz}{" "}
                  {language === "en" ? "Juz" : "Juz"}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={tempConfig.freeTier.maxActiveQuranJuz}
                onChange={(e) =>
                  handleFreeChange("maxActiveQuranJuz", Number(e.target.value))
                }
                className="w-full accent-emerald-600"
              />
            </div>

            {/* Max Audio Recordings */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-rose-500" />
                  {language === "en"
                    ? "Max Audio Recordings"
                    : "Batas Rekaman Suara Audio"}
                </span>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-slate-900 dark:text-white">
                  {tempConfig.freeTier.maxAudioRecordings}{" "}
                  {language === "en" ? "Recs" : "Rekaman"}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={tempConfig.freeTier.maxAudioRecordings}
                onChange={(e) =>
                  handleFreeChange("maxAudioRecordings", Number(e.target.value))
                }
                className="w-full accent-rose-500"
              />
            </div>

            {/* Max Quran Classes */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {language === "en"
                    ? "Max Al-Qur'an Classes"
                    : "Batas Pembuatan Kelas Al-Qur'an"}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {tempConfig.freeTier.maxQuranClasses ?? 1} Kelas
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={tempConfig.freeTier.maxQuranClasses ?? 1}
                onChange={(e) =>
                  handleFreeChange("maxQuranClasses", Number(e.target.value))
                }
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Max Non-Quran Classes */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {language === "en"
                    ? "Max Kitab / Non-Qur'an Classes"
                    : "Batas Pembuatan Kelas Non-Qur'an (Kitab)"}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {tempConfig.freeTier.maxNonQuranClasses ?? 1} Kelas
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={tempConfig.freeTier.maxNonQuranClasses ?? 1}
                onChange={(e) =>
                  handleFreeChange("maxNonQuranClasses", Number(e.target.value))
                }
                className="w-full accent-amber-500"
              />
            </div>

            {/* Boolean Feature Toggles */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {language === "en"
                    ? "Allow Creating Classes (Teaching Mode)"
                    : "Izinkan Buka Kelas (Mode Pengajar)"}
                </span>
                <input
                  type="checkbox"
                  checked={tempConfig.freeTier.allowCreateClass}
                  onChange={(e) =>
                    handleFreeChange("allowCreateClass", e.target.checked)
                  }
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {language === "en"
                    ? "Allow AI Smart Extractor"
                    : "Izinkan Smart AI Extractor"}
                </span>
                <input
                  type="checkbox"
                  checked={tempConfig.freeTier.allowAISmartExtractor}
                  onChange={(e) =>
                    handleFreeChange("allowAISmartExtractor", e.target.checked)
                  }
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {language === "en"
                    ? "Allow Exporting Reports / PDF"
                    : "Izinkan Ekspor Rapor & CSV"}
                </span>
                <input
                  type="checkbox"
                  checked={tempConfig.freeTier.allowExportReport}
                  onChange={(e) =>
                    handleFreeChange("allowExportReport", e.target.checked)
                  }
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* PRO TIER CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200 dark:border-amber-800/60 shadow-lg shadow-amber-500/5 overflow-hidden flex flex-col">
          <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                <Crown className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {language === "en"
                    ? "UNLUPA PRO LIMITS"
                    : "FITUR & BATASAN UNLUPA PRO"}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === "en"
                    ? "Applied to subscribed users and institutions"
                    : "Berlaku untuk pelanggan Pro berbayar"}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60">
              PRO
            </span>
          </div>

          <div className="p-6 space-y-5 flex-1">
            {/* Max Books */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  {language === "en"
                    ? "Max Personal Books"
                    : "Maksimal Buku Pribadi"}
                </span>
                <span className="font-mono bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-lg">
                  {tempConfig.premiumTier.maxBooks >= 999
                    ? language === "en"
                      ? "Unlimited (999)"
                      : "Tanpa Batas (999)"
                    : `${tempConfig.premiumTier.maxBooks} Buku`}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="999"
                step="50"
                value={tempConfig.premiumTier.maxBooks}
                onChange={(e) =>
                  handlePremiumChange("maxBooks", Number(e.target.value))
                }
                className="w-full accent-amber-500"
              />
            </div>

            {/* Max Cards Per Book */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  {language === "en"
                    ? "Max Cards Per Book"
                    : "Maksimal Kartu / Materi Per Buku"}
                </span>
                <span className="font-mono bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-lg">
                  {tempConfig.premiumTier.maxCardsPerBook >= 5000
                    ? language === "en"
                      ? "Unlimited (5000)"
                      : "Tanpa Batas (5000)"
                    : `${tempConfig.premiumTier.maxCardsPerBook} Kartu`}
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="500"
                value={tempConfig.premiumTier.maxCardsPerBook}
                onChange={(e) =>
                  handlePremiumChange("maxCardsPerBook", Number(e.target.value))
                }
                className="w-full accent-amber-500"
              />
            </div>

            {/* Max Daily AI Generations */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-amber-500" />
                  {language === "en"
                    ? "Daily AI Builder Generations"
                    : "Batas AI Builder Harian"}
                </span>
                <span className="font-mono bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-lg">
                  {tempConfig.premiumTier.maxDailyAIGenerations}x /{" "}
                  {language === "en" ? "day" : "hari"}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={tempConfig.premiumTier.maxDailyAIGenerations}
                onChange={(e) =>
                  handlePremiumChange(
                    "maxDailyAIGenerations",
                    Number(e.target.value),
                  )
                }
                className="w-full accent-amber-500"
              />
            </div>

            {/* Max Active Quran Juz */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  {language === "en"
                    ? "Active Quran Juz Limit"
                    : "Batas Juz Al-Qur'an Aktif"}
                </span>
                <span className="font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-lg">
                  {tempConfig.premiumTier.maxActiveQuranJuz} Juz (
                  {language === "en"
                    ? "Full Mushaf 604 Pages"
                    : "Lengkap 30 Juz 604 Halaman"}
                  )
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="30"
                value={tempConfig.premiumTier.maxActiveQuranJuz}
                disabled
                className="w-full accent-emerald-600 opacity-60 cursor-not-allowed"
              />
            </div>

            {/* Boolean Features */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Check className="w-4 h-4 text-emerald-500" />
                  {language === "en"
                    ? "Teaching Mode & Classes"
                    : "Mode Pengajar & Manajemen Kelas"}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  UNLIMITED
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Check className="w-4 h-4 text-emerald-500" />
                  {language === "en"
                    ? "Smart AI Extractor"
                    : "Smart AI Kitab Extractor"}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ENABLED
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Check className="w-4 h-4 text-emerald-500" />
                  {language === "en"
                    ? "Export Reports & Rapor"
                    : "Ekspor Laporan & Cetak Rapor"}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ENABLED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Configuration Module */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Coins className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {language === "en"
                ? "Subscription Pricing (IDR)"
                : "Konfigurasi Harga Berlangganan (Rupiah)"}
            </h3>
            <p className="text-xs text-slate-500">
              {language === "en"
                ? "Configure the prices shown in the upgrade checkout modal"
                : "Atur besaran nominal harga paket pada modal checkout upgrade"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === "en" ? "Monthly Plan (IDR)" : "Paket Bulanan (IDR)"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                step="5000"
                value={tempConfig.pricing.monthlyIDR}
                onChange={(e) =>
                  handlePricingChange("monthlyIDR", Number(e.target.value))
                }
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === "en" ? "Yearly Plan (IDR)" : "Paket Tahunan (IDR)"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                step="10000"
                value={tempConfig.pricing.yearlyIDR}
                onChange={(e) =>
                  handlePricingChange("yearlyIDR", Number(e.target.value))
                }
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
