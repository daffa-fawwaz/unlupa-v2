import React from 'react';
import { useApp } from '../../context/AppContext';
import { getAuthToken } from '../../lib/api';
import { 
  ArrowRight, 
  Compass, 
  BookOpen,
  LayoutDashboard,
  LogIn
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { 
    setIsLandingPageOpen, 
    setActiveSpace, 
    currentUser, 
    userProfile, 
    openLoginModal, 
    openRegisterModal 
  } = useApp();

  const token = getAuthToken();
  const isUserLoggedIn = Boolean(
    currentUser || 
    (userProfile && userProfile.id && userProfile.id !== 'guest' && userProfile.email) ||
    token
  );

  const displayName = userProfile?.fullName || currentUser?.displayName || userProfile?.email || 'Sahabat Unlupa';

  const handleLaunchApp = (targetSpace: 'dashboard' | 'quran' | 'personal' | 'teaching' = 'dashboard') => {
    try {
      sessionStorage.setItem('unlupa_in_app', 'true');
      window.location.hash = 'app';
    } catch (e) { /* ignore */ }
    setIsLandingPageOpen(false);
    setActiveSpace(targetSpace);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#EEF2F7] dark:bg-[#0B1120] text-[#1B254B] dark:text-[#F8FAFC] font-sans selection:bg-[#FF6F3D]/20 selection:text-[#FF6F3D] overflow-x-hidden flex flex-col justify-between">
      
      {/* ============================================================
          MINIMAL STICKY HEADER
          ============================================================ */}
      <header className="sticky top-0 z-50 bg-[#EEF2F7]/90 dark:bg-[#0B1120]/90 backdrop-blur-md border-b border-white/60 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-3">
          
          <div 
            onClick={() => handleLaunchApp('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl clay-icon-pod-orange text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="font-serif font-black text-lg sm:text-xl tracking-tight text-[#1B254B] dark:text-white">
                unlupa<span className="text-[#FF6F3D] font-sans">.id</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {isUserLoggedIn ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 text-xs text-[#1B254B] dark:text-slate-200 font-semibold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="truncate max-w-[140px]">{displayName}</span>
                </div>

                <button
                  onClick={() => handleLaunchApp('dashboard')}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl clay-btn-primary text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Ke Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => openLoginModal()}
                  className="px-3.5 py-2 rounded-xl clay-card-subtle text-xs font-bold text-[#1B254B] dark:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-2xs"
                >
                  Login
                </button>

                <button
                  onClick={() => openRegisterModal()}
                  className="px-4 py-2.5 rounded-xl clay-btn-primary text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Mulai Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================
          SINGLE HERO SECTION (NO EYEBROW, EXACT PHRASING)
          ============================================================ */}
      <main className="flex-1 flex items-center justify-center py-16 sm:py-24 px-4">
        <div className="relative w-full max-w-4xl mx-auto text-center space-y-8">
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[350px] bg-gradient-to-b from-[#FF6F3D]/15 via-[#4E89FF]/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Hero Content with exact user phrasing */}
          <div className="space-y-6 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black tracking-tight text-[#1B254B] dark:text-white leading-[1.15]">
              Dulu tidak tahu, sekarang lupa. <br />
              <span className="text-red-500 italic font-normal">
                Capek menghafal tapi hilang begitu saja.
              </span>
            </h1>

            <p className="text-base sm:text-xl md:text-2xl font-serif font-bold text-[#FF6F3D] tracking-tight leading-relaxed pt-2">
              Hafalan ingat terus, ilmu tidak menjadi kenangan. <br />
              <span className="text-sm sm:text-lg font-sans font-normal text-[#707E94] dark:text-slate-300 block mt-3">
                Rasakan mudahnya menghafal dan menjaga ilmu dengan unlupa.id.
              </span>
            </p>
          </div>

          {/* CTAs: Mulai Sekarang & Login / Ke Dashboard */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto pt-4">
            {isUserLoggedIn ? (
              <>
                <button
                  onClick={() => handleLaunchApp('dashboard')}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl clay-btn-primary text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-[#FF6F3D]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <LayoutDashboard className="w-5 h-5 text-white" />
                  <span>Ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleLaunchApp('quran')}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl clay-card-subtle text-[#1B254B] dark:text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  <BookOpen className="w-4 h-4 text-[#FF6F3D]" />
                  <span>Buka Mushaf Al-Qur'an</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => openRegisterModal()}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl clay-btn-primary text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-[#FF6F3D]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Compass className="w-5 h-5 text-white" />
                  <span>Mulai Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => openLoginModal()}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl clay-card-subtle text-[#1B254B] dark:text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  <LogIn className="w-4 h-4 text-[#FF6F3D]" />
                  <span>Login ke Akun Anda</span>
                </button>
              </>
            )}
          </div>

        </div>
      </main>

      {/* ============================================================
          LUXURY FOOTER
          ============================================================ */}
      <footer className="border-t border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-950/80 py-6 text-xs text-[#707E94] dark:text-slate-400 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg clay-icon-pod-orange text-white flex items-center justify-center text-xs">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="text-[#1B254B] dark:text-white font-serif font-black text-sm">unlupa.id</span>
          </div>

          <div>
            Mushaf Madinah 604 Halaman &bull; Kitab & Matn &bull; Halaqah Santri
          </div>

          {isUserLoggedIn ? (
            <button
              type="button"
              onClick={() => handleLaunchApp('dashboard')}
              className="text-[#FF6F3D] hover:text-[#E65320] font-bold cursor-pointer transition-colors flex items-center gap-1"
            >
              <span>Ke Dashboard &rarr;</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openLoginModal()}
              className="text-[#FF6F3D] hover:text-[#E65320] font-bold cursor-pointer transition-colors flex items-center gap-1"
            >
              <span>Masuk ke Akun &rarr;</span>
            </button>
          )}
        </div>
      </footer>

    </div>
  );
};
