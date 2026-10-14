import React from 'react';
import { 
  X, 
  Check, 
  Home, 
  BookOpen, 
  Library, 
  GraduationCap, 
  Users, 
  Sliders, 
  RotateCcw, 
  Play, 
  Info,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { OnboardingPageKey } from '../../types';
import { useApp } from '../../context/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLaunchWalkthrough: (pageKey: OnboardingPageKey) => void;
}

export const OnboardingSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onLaunchWalkthrough
}) => {
  const { 
    language, 
    userProfile, 
    isOnboardingEnabled,
    setIsOnboardingEnabled,
    togglePageOnboarding, 
    setAllPageOnboarding, 
    resetOnboardingStatus 
  } = useApp();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const prefs = userProfile.onboardingPreferences || {
    home: true,
    quran: true,
    personal: true,
    classes: true,
    teaching: true,
  };

  const pagesConfig: {
    key: OnboardingPageKey;
    nameEn: string;
    nameId: string;
    descEn: string;
    descId: string;
    icon: React.ReactNode;
    color: string;
    itemHighlightsEn: string[];
    itemHighlightsId: string[];
  }[] = [
    {
      key: 'home',
      nameEn: 'Dashboard & Home',
      nameId: 'Beranda (Dashboard)',
      descEn: 'Covers due queues, daily streaks, report sharing, and retention calendar.',
      descId: 'Meliputi antrean jatuh tempo, streak api, bagi rapor, dan kalender retensi.',
      icon: <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      color: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
      itemHighlightsEn: ['Due Counter', 'Flame Streak', 'Share Report', 'Calendar'],
      itemHighlightsId: ['Antrean Jatuh Tempo', 'Streak Api', 'Bagi Rapor', 'Kalender'],
    },
    {
      key: 'quran',
      nameEn: 'Quran Space (604 Pages)',
      nameId: 'Ruang Al-Qur\'an (604 Halaman)',
      descEn: 'Covers 30 Juz navigation, status filters, 2-button review, and Madinah Mushaf.',
      descId: 'Meliputi navigasi 30 juz, tab filter, 2 tombol evaluasi hafalan, dan mushaf HD.',
      icon: <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      color: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
      itemHighlightsEn: ['Juz Color Codes', 'Activation', 'Need Review/Fluent', 'Mushaf Viewer'],
      itemHighlightsId: ['Kode Warna Juz', 'Aktivasi Halaman', 'Perlu Murajaah / Lancar', 'Lihat Mushaf'],
    },
    {
      key: 'personal',
      nameEn: 'Personal Flashcards & Books',
      nameId: 'Materi Pribadi & Kitab',
      descEn: 'Covers Book → Chapter → Card hierarchy, 1-click activation, and 4-tier ratings.',
      descId: 'Meliputi hierarki Buku → Bab → Kartu, sakelar aktivasi, dan 4 tombol rating.',
      icon: <Library className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      color: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
      itemHighlightsEn: ['Book Structure', '1-Click Toggle', '4 Ratings', 'JSON Import'],
      itemHighlightsId: ['Struktur Buku', 'Aktivasi 1-Klik', '4 Rating Retensi', 'Impor JSON'],
    },
    
    {
      key: 'teaching',
      nameEn: 'Teaching Studio (Mentor/Ustadz)',
      nameId: 'Ruang Mengajar (Ustadz & Musyrif)',
      descEn: 'Covers cohort creation, student retention telemetry, and live tasmi\' scoring.',
      descId: 'Meliputi pembuatan kelas, telemetri retensi santri, dan tasmi\' langsung.',
      icon: <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
      color: 'bg-violet-50 dark:bg-violet-950/60 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300',
      itemHighlightsEn: ['Create Class', 'Retention Dashboard', 'Live Tasmi\' Review'],
      itemHighlightsId: ['Buat Kelas', 'Dasbor Retensi', 'Penilaian Tasmi\''],
    },
  ];

  const handleLaunch = (key: OnboardingPageKey) => {
    onClose();
    onLaunchWalkthrough(key);
  };

  const handleResetHistory = () => {
    resetOnboardingStatus();
    alert(
      language === 'en'
        ? 'Walkthrough history reset! Enabled guides will show automatically on next visit.'
        : 'Riwayat panduan berhasil direset! Panduan aktif akan otomatis muncul kembali saat halaman dibuka.'
    );
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in select-none"
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-settings-title"
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden text-slate-900 dark:text-slate-100"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/70">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="onboarding-settings-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {language === 'en' ? 'Page Walkthrough & Onboarding Controls' : 'Pengaturan Panduan & Onboarding Per Halaman'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' 
                  ? 'Enable or disable interactive guides for each page individually.'
                  : 'Aktifkan atau nonaktifkan panduan interaktif untuk masing-masing halaman.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Onboarding Switch Bar */}
        <div className={`px-5 sm:px-6 py-3 border-b flex items-center justify-between transition-colors ${
          isOnboardingEnabled 
            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50' 
            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              isOnboardingEnabled 
                ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' 
                : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'en' ? 'Master Onboarding System' : 'Status Utama Onboarding'}
                </p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isOnboardingEnabled 
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                }`}>
                  {isOnboardingEnabled ? (language === 'en' ? 'ACTIVE' : 'AKTIF') : (language === 'en' ? 'DISABLED' : 'NONAKTIF')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isOnboardingEnabled 
                  ? (language === 'en' ? 'Guides can appear automatically or on request.' : 'Panduan fitur dapat muncul secara otomatis atau sesuai permintaan.')
                  : (language === 'en' ? 'All walkthrough popups are silenced across the entire app.' : 'Semua panduan pop-up dinonaktifkan di seluruh aplikasi.')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOnboardingEnabled(!isOnboardingEnabled)}
            className={`cursor-pointer w-12 h-6.5 rounded-full p-0.5 flex items-center transition-colors duration-200 shrink-0 ${
              isOnboardingEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
            title={isOnboardingEnabled ? 'Nonaktifkan Onboarding' : 'Aktifkan Onboarding'}
          >
            <div className={`w-5.5 h-5.5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
              isOnboardingEnabled ? 'translate-x-5.5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Global Quick Action Bar */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAllPageOnboarding(true)}
              className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200/70 dark:border-blue-800/70 cursor-pointer transition-colors"
            >
              {language === 'en' ? 'Enable All' : 'Aktifkan Semua'}
            </button>
            <button
              onClick={() => setAllPageOnboarding(false)}
              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
            >
              {language === 'en' ? 'Disable All' : 'Nonaktifkan Semua'}
            </button>
          </div>

          <button
            onClick={handleResetHistory}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800/70 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{language === 'en' ? 'Reset Seen History' : 'Reset Riwayat Tampil'}</span>
          </button>
        </div>

        {/* List of Pages */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3">
          {pagesConfig.map((page) => {
            const isEnabled = prefs[page.key];
            const highlights = language === 'en' ? page.itemHighlightsEn : page.itemHighlightsId;

            return (
              <div 
                key={page.key}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${page.color}`}>
                    {page.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {language === 'en' ? page.nameEn : page.nameId}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isEnabled
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {isEnabled ? (language === 'en' ? 'Active' : 'Aktif') : (language === 'en' ? 'Off' : 'Mati')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'en' ? page.descEn : page.descId}
                    </p>

                    {/* Chips */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {highlights.map((h, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-medium">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Controls: Launch Button & Toggle Switch */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleLaunch(page.key)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 border border-blue-200/80 dark:border-blue-800/80 cursor-pointer active:scale-95 transition-all shadow-2xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
                    <span>{language === 'en' ? 'Start Tour' : 'Mulai Panduan'}</span>
                  </button>

                  <button
                    onClick={() => togglePageOnboarding(page.key, !isEnabled)}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors flex items-center cursor-pointer ${
                      isEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                    }`}
                    title={isEnabled ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                  >
                    <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform"></div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              {language === 'en'
                ? 'Guides explain actual buttons, colors, and workflows without marketing fluff.'
                : 'Panduan menjelaskan fungsi nyata tombol, warna, dan alur tanpa kalimat promosi.'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-xs cursor-pointer active:scale-95"
          >
            {language === 'en' ? 'Done' : 'Selesai'}
          </button>
        </div>
      </div>
    </div>
  );
};
