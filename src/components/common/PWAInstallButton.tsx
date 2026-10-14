import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useApp } from '../../context/AppContext';

export interface PWAInstallButtonProps {
  variant?: 'header' | 'profileMenu' | 'mobileMenu';
  isMobileMenu?: boolean;
  onAfterClick?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  variant = 'header',
  isMobileMenu = false,
  onAfterClick 
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { language } = useApp();

  const effectiveVariant = isMobileMenu ? 'mobileMenu' : variant;

  const handleInstallClick = () => {
    if (onAfterClick) {
      onAfterClick();
    }

    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      alert(
        language === 'en' 
          ? 'To install this app, tap the install icon in your browser address bar or menu.' 
          : 'Untuk menginstal aplikasi ini, tekan ikon install di bar alamat browser atau menu pengaturan browser Anda.'
      );
    }
  };

  // Profile Menu Dropdown Display
  if (effectiveVariant === 'profileMenu') {
    if (isInstalled) {
      return (
        <div className="w-full px-3 py-1.5 text-slate-500 dark:text-slate-400 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{language === 'en' ? 'App Installed' : 'Aplikasi Terpasang'}</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">PWA Active</span>
        </div>
      );
    }

    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center justify-between group cursor-pointer transition-colors text-xs"
        >
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-medium">{language === 'en' ? 'Install App (PWA)' : 'Install Aplikasi (PWA)'}</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
            Offline Ready
          </span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'en' ? 'Install on iPhone / iPad' : 'Install di iPhone / iPad'}
                </h3>
                <button onClick={() => setShowIOSGuide(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                    <Share className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-xs">
                    {language === 'en' ? '1. Tap the' : '1. Tekan tombol'} <strong>Share</strong> {language === 'en' ? 'button in the Safari toolbar.' : 'di bar menu Safari.'}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                    <PlusSquare className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  </div>
                  <p className="text-xs">
                    {language === 'en' ? '2. Scroll down and tap' : '2. Gulir ke bawah lalu tekan'} <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {language === 'en' ? 'Close' : 'Tutup'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Mobile Menu Display
  if (effectiveVariant === 'mobileMenu') {
    if (isInstalled) return null;
    return (
      <button 
        type="button"
        onClick={handleInstallClick}
        className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg bg-emerald-50 text-emerald-700 font-bold mb-2 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        <span>{language === 'en' ? 'Install App' : 'Install Aplikasi'}</span>
      </button>
    );
  }

  // Header / Standalone Display
  if (isInstalled) {
    return null;
  }

  const buttonClass = "flex items-center gap-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 text-xs font-bold hover:bg-emerald-500/20 transition cursor-pointer";

  return (
    <>
      <button type="button" onClick={handleInstallClick} className={buttonClass}>
        <Download className="w-4 h-4" />
        <span>{isIOS ? (language === 'en' ? 'Install on iOS' : 'Install di iOS') : (language === 'en' ? 'Install App' : 'Install Aplikasi')}</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'en' ? 'Install on iPhone / iPad' : 'Install di iPhone / iPad'}
              </h3>
              <button onClick={() => setShowIOSGuide(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                  <Share className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-xs">
                  {language === 'en' ? '1. Tap the' : '1. Tekan tombol'} <strong>Share</strong> {language === 'en' ? 'button in the Safari toolbar.' : 'di bar menu Safari.'}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                  <PlusSquare className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                </div>
                <p className="text-xs">
                  {language === 'en' ? '2. Scroll down and tap' : '2. Gulir ke bawah lalu tekan'} <strong>Add to Home Screen</strong>.
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full rounded-xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              {language === 'en' ? 'Close' : 'Tutup'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
