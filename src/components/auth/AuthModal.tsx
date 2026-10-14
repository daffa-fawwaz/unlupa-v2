import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useApp } from '../../context/AppContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'register' | 'login';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialMode = 'login' 
}) => {
  const { initiateUserSession, language } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync mode whenever initialMode or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'login');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const getFriendlyErrorMessage = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'EMAIL_ALREADY_EXISTS':
        return language === 'en' 
          ? 'This email is already registered. Please sign in instead.' 
          : 'Email ini sudah terdaftar. Silakan masuk (login).';
      case 'INVALID_CREDENTIALS':
        return language === 'en' 
          ? 'Incorrect email or password. Please try again.' 
          : 'Email atau password salah. Silakan coba lagi.';
      case 'TOO_MANY_REQUESTS':
        return language === 'en' 
          ? 'Too many failed login attempts. Please wait 15 minutes before trying again.' 
          : 'Terlalu banyak percobaan login yang gagal. Akun sementara dibatasi. Silakan tunggu 15 menit.';
      case 'WEAK_PASSWORD':
        return language === 'en' 
          ? 'Password is too weak (minimum 6 characters).' 
          : 'Password terlalu lemah (minimal 6 karakter).';
      case 'INVALID_EMAIL':
        return language === 'en' 
          ? 'Invalid email format.' 
          : 'Format email tidak valid.';
      case 'NETWORK_ERROR':
        return language === 'en' 
          ? 'Network error. Please check your internet connection.' 
          : 'Koneksi bermasalah. Periksa jaringan internet Anda.';
      case 'TIMEOUT':
        return language === 'en'
          ? 'Request timed out. Please try again.'
          : 'Waktu tunggu server habis. Silakan coba kembali.';
      default:
        return err?.message || (language === 'en' ? 'An error occurred during authentication.' : 'Terjadi kendala saat autentikasi.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setErrorMsg(language === 'en' ? 'Please enter your email.' : 'Silakan masukkan alamat email Anda.');
      return;
    }

    if (!cleanPassword) {
      setErrorMsg(language === 'en' ? 'Please enter your password.' : 'Silakan masukkan password Anda.');
      return;
    }

    if (mode === 'register') {
      const cleanName = fullName.trim();
      if (!cleanName) {
        setErrorMsg(language === 'en' ? 'Please enter your full name.' : 'Silakan masukkan nama lengkap Anda.');
        return;
      }
      if (cleanPassword.length < 6) {
        setErrorMsg(language === 'en' ? 'Password must be at least 6 characters.' : 'Password minimal terdiri dari 6 karakter.');
        return;
      }
      if (cleanPassword !== confirmPassword.trim()) {
        setErrorMsg(language === 'en' ? 'Passwords do not match.' : 'Konfirmasi password tidak cocok.');
        return;
      }

      setIsLoading(true);
      try {
        const responseData = await api.register({
          name: cleanName,
          email: cleanEmail,
          password: cleanPassword,
        });

        await initiateUserSession(responseData.user);

        setSuccessMsg(language === 'en' ? 'Account created successfully! Welcome.' : 'Pendaftaran berhasil! Selamat datang di Unlupa.');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 600);
      } catch (err: any) {
        console.error('Registration Error:', err);
        setErrorMsg(getFriendlyErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    } else {
      // Login mode
      setIsLoading(true);
      try {
        const responseData = await api.login({
          email: cleanEmail,
          password: cleanPassword,
        });

        await initiateUserSession(responseData.user);

        setSuccessMsg(language === 'en' ? 'Signed in successfully!' : 'Berhasil masuk ke akun Anda!');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 600);
      } catch (err: any) {
        console.error('Login Error:', err);
        setErrorMsg(getFriendlyErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md my-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
        
        {/* Header Banner */}
        <div className="relative h-24 bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-800 flex flex-col justify-end p-5 overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20 text-white pointer-events-none">
            <BookOpen className="w-24 h-24 -translate-y-6 translate-x-6" />
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30 transition-colors z-20 cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
          
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white relative z-10">
            {mode === 'register' 
              ? (language === 'en' ? 'Create an Account' : 'Daftar Akun Baru') 
              : (language === 'en' ? 'Welcome Back' : 'Masuk ke Unlupa')}
          </h2>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 sm:px-8 space-y-4">
          
          {/* Tab Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {language === 'en' ? 'Sign In' : 'Masuk'}
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {language === 'en' ? 'Register' : 'Daftar'}
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {mode === 'register'
              ? (language === 'en' 
                  ? 'Sign up to keep your learning progress and spaced repetition sync intact.' 
                  : 'Daftarkan akun Anda agar progres hafalan dan materi tersimpan aman di server.')
              : (language === 'en' 
                  ? 'Sign in with your email and password to sync your memory retention progress.' 
                  : 'Masuk dengan email dan password Anda agar seluruh progres hafalan tersinkronisasi.')}
          </p>

          {/* Feedback Notifications */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleEmailAuth} className="space-y-3 pt-1">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Full Name' : 'Nama Lengkap'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. Ahmad Fawwaz' : 'Contoh: Ahmad Fawwaz'}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? (language === 'en' ? 'Min. 6 characters' : 'Minimal 6 karakter') : '••••••••'}
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Confirm Password' : 'Konfirmasi Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'register' 
                      ? (language === 'en' ? 'Create Account' : 'Daftar Sekarang') 
                      : (language === 'en' ? 'Sign In' : 'Masuk ke Akun')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Bottom Prompt */}
          <div className="pt-2 text-center">
            {mode === 'login' ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' ? "Don't have an account yet?" : 'Belum punya akun?'}{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {language === 'en' ? 'Register now' : 'Daftar sekarang'}
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'Already have an account?' : 'Sudah punya akun?'}{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {language === 'en' ? 'Sign in here' : 'Masuk di sini'}
                </button>
              </p>
            )}
          </div>

          {/* Terms Footer */}
          <div className="pt-1 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              {language === 'en'
                ? 'By continuing, you agree to our Terms of Service and Privacy Policy.'
                : 'Dengan mendaftar atau masuk, Anda menyetujui Syarat dan Ketentuan layanan kami.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
