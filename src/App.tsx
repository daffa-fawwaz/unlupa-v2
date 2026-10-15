/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { Navigation } from './components/Navigation';
import { QuranSpace } from './components/quran/QuranSpace';
import { PersonalSpace } from './components/personal/PersonalSpace';
import { TeachingSpace } from './components/classes/TeachingSpace';
import { LeaderboardSpace } from './components/leaderboard/LeaderboardSpace';
import { AdminSpace } from './components/admin/AdminSpace';
import { HomeSpace } from './components/home/HomeSpace';
import { LandingPage } from './components/landing/LandingPage';
import { ProfessionalWalkthroughModal } from './components/onboarding/ProfessionalWalkthroughModal';
import { OnboardingSettingsModal } from './components/profile/OnboardingSettingsModal';
import { PublicReportViewer } from './components/classes/PublicReportViewer';
import { useDailyReminder } from './hooks/useDailyReminder';
import { FloatingXpOverlay } from './components/common/FloatingXpToast';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { isUserAdmin } from './services/authRbacService';
import { AuthModal } from './components/auth';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  componentDidMount() {
    try {
      // Validate and sanitize localStorage keys to prevent blank screens
      const keysToCheck = [
        'unlupa_user_profile_v1', 
        'unlupa_system_transactions_v1', 
        'unlupa_books_v3',
        'unlupa_active_space_v2'
      ];
      keysToCheck.forEach(key => {
        const val = localStorage.getItem(key);
        if (val && (val.startsWith('{') || val.startsWith('['))) {
          JSON.parse(val);
        }
      });
    } catch (e) {
      console.warn('Corrupted localStorage detected, resetting cache...', e);
      try {
        localStorage.removeItem('unlupa_user_profile_v1');
        localStorage.removeItem('unlupa_system_transactions_v1');
        localStorage.setItem('unlupa_active_space_v2', 'dashboard');
      } catch (err) { /* ignore */ }
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Uncaught Error:', error, errorInfo);
  }

  handleReload = () => {
    try {
      localStorage.setItem('unlupa_active_space_v2', 'dashboard');
    } catch (e) { /* ignore */ }
    this.setState({ hasError: false, error: null });
  };

  handleResetState = () => {
    try {
      localStorage.removeItem('unlupa_active_space_v2');
      localStorage.removeItem('unlupa_books_v3');
      localStorage.removeItem('unlupa_chapters_v3');
      localStorage.removeItem('unlupa_items_v3');
      localStorage.removeItem('unlupa_user_profile_v1');
      localStorage.removeItem('unlupa_user_profile_v2');
      localStorage.setItem('unlupa_active_space_v2', 'dashboard');
    } catch (e) { /* ignore */ }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || '';
      const isQuotaOrRate = errorMsg.toLowerCase().includes('rate') || 
                            errorMsg.toLowerCase().includes('quota') || 
                            errorMsg.toLowerCase().includes('resource_exhausted') || 
                            errorMsg.toLowerCase().includes('429');

      return (
        <div className="min-h-screen bg-[#EEF2F7] dark:bg-[#0F172A] flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl text-center space-y-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
              isQuotaOrRate 
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
            }`}>
              <AlertCircle className="w-7 h-7" />
            </div>
            
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {isQuotaOrRate ? 'Batas Frekuensi Permintaan (Rate Limit)' : 'Memuat Ulang Tampilan'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {isQuotaOrRate 
                  ? 'Layanan menerima banyak permintaan dalam waktu singkat (Rate Exceeded). Data Anda tetap aman tersimpan. Silakan klik tombol di bawah untuk menyegarkan.'
                  : 'Terjadi kendala saat memuat antarmuka. Silakan klik tombol di bawah untuk menyegarkan tampilan tanpa kehilangan data.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Segarkan Aplikasi</span>
              </button>
              <button
                onClick={this.handleResetState}
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-medium transition-colors cursor-pointer"
              >
                Kembali ke Beranda Utama
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainContent: React.FC = () => {
  const { 
    activeSpace,
    setActiveSpace,
    userProfile,
    quranStats,
    personalStats, 
    isLandingPageOpen,
    isWalkthroughOpen,
    closePageWalkthrough,
    activeWalkthroughPage,
    openPageWalkthrough,
    isOnboardingSettingsOpen,
    setIsOnboardingSettingsOpen
  } = useApp();

  // Protect Admin space: only allow superadmin/admin or preconfigured admin@anlupa.id
  useEffect(() => {
    if (activeSpace === 'admin' && !isUserAdmin(userProfile)) {
      setActiveSpace('dashboard');
    }
  }, [activeSpace, userProfile, setActiveSpace]);

  // Route to the Public Report Viewer if the URL has the ?report parameter
  useDailyReminder(quranStats, personalStats);

  const hasReportQuery = new URLSearchParams(window.location.search).has('report');
  if (hasReportQuery) {
    return <PublicReportViewer />;
  }

  if (isLandingPageOpen) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-[#EBEEF5] dark:bg-[#0E1626] text-[#18234A] dark:text-[#F8FAFC] flex flex-col font-sans selection:bg-[#FF6F3D]/20 selection:text-[#18234A] transition-colors duration-200">
      <FloatingXpOverlay />
      <OfflineIndicator />
      {/* Navigation Header & Mobile Nav */}
      <Navigation />

      {/* Main Workspace View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28">
        {activeSpace === 'dashboard' && <HomeSpace />}
        {activeSpace === 'quran' && <QuranSpace />}
        {activeSpace === 'personal' && <PersonalSpace />}
        {activeSpace === 'teaching' && <TeachingSpace />}
        {activeSpace === 'leaderboard' && <LeaderboardSpace />}
        {activeSpace === 'admin' && <AdminSpace />}
        {!['dashboard', 'quran', 'personal', 'teaching', 'leaderboard', 'admin'].includes(activeSpace) && <HomeSpace />}
      </main>

      {/* Professional Per-Page Walkthrough Modal */}
      <ProfessionalWalkthroughModal
        isOpen={isWalkthroughOpen}
        onClose={closePageWalkthrough}
        initialPageKey={activeWalkthroughPage}
      />

      {/* Per-Page Onboarding Settings Modal */}
      <OnboardingSettingsModal
        isOpen={isOnboardingSettingsOpen}
        onClose={() => setIsOnboardingSettingsOpen(false)}
        onLaunchWalkthrough={(pageKey) => {
          openPageWalkthrough(pageKey);
        }}
      />

    </div>
  );
};

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <MainContent />
        <AuthModal />
      </AppProvider>
    </AppErrorBoundary>
  );
}
