import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../lib/api';
import './auth-modal.css';

type AuthMode = 'login' | 'register';

const friendlyError = (error: any): string => {
  // 1. Check 401 Unauthorized / Invalid Credentials
  if (
    error?.status === 401 ||
    error?.code === 'INVALID_CREDENTIALS' ||
    error?.code === 'UNAUTHORIZED' ||
    error?.code === 'HTTP_401' ||
    error?.code === 'INVALID_PASSWORD' ||
    (typeof error?.message === 'string' && (
      error.message.toLowerCase().includes('password') ||
      error.message.toLowerCase().includes('credential') ||
      error.message.toLowerCase().includes('unauthorized') ||
      error.message.toLowerCase().includes('salah')
    ))
  ) {
    return 'Password atau email salah. Silakan periksa kembali akun Anda.';
  }

  // 2. Duplicate email on registration
  if (error?.status === 409 || error?.code === 'EMAIL_ALREADY_EXISTS') {
    return 'Email ini sudah terdaftar. Silakan masuk ke akun Anda.';
  }

  // 3. Rate limiting / Too many attempts
  if (error?.status === 429 || error?.code === 'TOO_MANY_REQUESTS') {
    return error?.message || 'Terlalu banyak percobaan login gagal. Silakan tunggu beberapa saat sebelum mencoba kembali.';
  }

  // 4. User not found
  if (error?.status === 404 || error?.code === 'USER_NOT_FOUND') {
    return 'Akun tidak ditemukan. Silakan periksa kembali email Anda atau daftar akun baru.';
  }

  // 5. Password / validation errors
  if (error?.code === 'WEAK_PASSWORD') {
    return 'Password terlalu lemah. Gunakan minimal 6 karakter.';
  }
  if (error?.code === 'INVALID_EMAIL') {
    return 'Format alamat email tidak valid.';
  }
  if (error?.code === 'INVALID_INPUT') {
    return 'Email dan password wajib diisi.';
  }

  // 6. Network / connection failure
  if (error?.code === 'NETWORK_ERROR' || error?.isNetworkError) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  }
  if (error?.code === 'TIMEOUT' || error?.isTimeout) {
    return 'Server membutuhkan waktu terlalu lama (timeout). Silakan coba kembali.';
  }

  // 7. Clean Indonesian message fallback
  if (
    typeof error?.message === 'string' &&
    error.message.trim() &&
    !error.message.startsWith('HTTP Error') &&
    !error.message.startsWith('ApiError')
  ) {
    return error.message;
  }

  return 'Gagal masuk. Silakan periksa kembali email dan password Anda.';
};

export const AuthModal: React.FC = () => {
  const {
    authModalMode,
    initiateUserSession,
    isAuthModalOpen,
    setAuthModalMode,
    setIsAuthModalOpen,
    setIsLandingPageOpen,
  } = useApp();
  const [mode, setMode] = useState<AuthMode>(authModalMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  const closeModal = () => {
    if (!isLoading) setIsAuthModalOpen(false);
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setAuthModalMode(nextMode);
    setError(null);
    setSuccess(null);
  };

  // Reset form status only when modal is opened or authModalMode changes
  useEffect(() => {
    if (!isAuthModalOpen) return;
    setMode(authModalMode);
    setError(null);
    setSuccess(null);
    const focusTimer = window.setTimeout(() => emailRef.current?.focus(), 120);
    return () => window.clearTimeout(focusTimer);
  }, [authModalMode, isAuthModalOpen]);

  // Window body scroll lock and escape key handler
  useEffect(() => {
    if (!isAuthModalOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoadingRef.current) setIsAuthModalOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isAuthModalOpen, setIsAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = fullName.trim();

    if (!cleanEmail) {
      setError('Masukkan alamat email Anda.');
      emailRef.current?.focus();
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError('Format email tidak valid. Masukkan alamat email yang benar.');
      emailRef.current?.focus();
      return;
    }
    if (!cleanPassword) {
      setError('Masukkan password Anda.');
      passwordRef.current?.focus();
      return;
    }
    if (mode === 'register' && !cleanName) {
      setError('Masukkan nama lengkap Anda.');
      return;
    }
    if (mode === 'register' && cleanPassword.length < 6) {
      setError('Password minimal terdiri dari 6 karakter.');
      return;
    }
    if (mode === 'register' && cleanPassword !== confirmPassword.trim()) {
      setError('Konfirmasi password belum sama.');
      return;
    }

    setIsLoading(true);
    try {
      const result = mode === 'register'
        ? await api.register({ name: cleanName, email: cleanEmail, password: cleanPassword })
        : await api.login({ email: cleanEmail, password: cleanPassword });

      await initiateUserSession(result.user, mode === 'register' ? { isNewRegistration: true } : undefined);
      setSuccess(mode === 'register' ? 'Akun berhasil dibuat.' : 'Berhasil masuk.');

      window.setTimeout(() => {
        try {
          sessionStorage.setItem('unlupa_in_app', 'true');
          window.location.hash = 'app';
        } catch {}
        setIsLandingPageOpen(false);
        setIsAuthModalOpen(false);
      }, 450);
    } catch (authError) {
      console.error('[Auth Error]:', authError);
      const errorMsg = friendlyError(authError);
      setError(errorMsg);
      if (mode === 'login') {
        passwordRef.current?.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <button className="auth-modal__backdrop" type="button" onClick={closeModal} aria-label="Tutup modal" />

      <div className="auth-modal__shell">
        <div className="auth-modal__dialog">
          <button className="auth-modal__close" type="button" onClick={closeModal} aria-label="Tutup">
            <X aria-hidden="true" />
          </button>

          <aside className="auth-modal__aside">
            <div className="auth-modal__brand">
              <span><img src="/unlupa.logo.png" alt="" /></span>
              <strong>unlupa.id</strong>
            </div>
            <div className="auth-modal__aside-copy">
              <span className="auth-modal__eyebrow"><ShieldCheck aria-hidden="true" /> Progres tersimpan aman</span>
              <h2>Ilmu dijaga,<br />perjalanan berlanjut.</h2>
              <p>Masuk untuk melanjutkan antrean murajaah, ruang hafalan, dan progres belajar Anda.</p>
            </div>
            <div className="auth-modal__aside-orb" aria-hidden="true" />
          </aside>

          <div className="auth-modal__content">
            <div className="auth-modal__tabs" aria-label="Pilih autentikasi">
              <button type="button" className={mode === 'login' ? 'is-active' : ''} onClick={() => switchMode('login')}>
                Login
              </button>
              <button type="button" className={mode === 'register' ? 'is-active' : ''} onClick={() => switchMode('register')}>
                Daftar
              </button>
            </div>

            <header className="auth-modal__header">
              <span>{mode === 'register' ? 'Mulai perjalanan' : 'Selamat datang kembali'}</span>
              <h2 id="auth-modal-title">{mode === 'register' ? 'Buat akun Unlupa' : 'Masuk ke akun Anda'}</h2>
              <p>{mode === 'register' ? 'Simpan dan sinkronkan progres hafalan Anda.' : 'Lanjutkan murajaah dari tempat terakhir.'}</p>
            </header>

            <form className="auth-modal__form" onSubmit={handleSubmit} noValidate>
              {mode === 'register' && (
                <label className="auth-field">
                  <span>Nama lengkap</span>
                  <span className="auth-field__control">
                    <UserRound aria-hidden="true" />
                    <input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" placeholder="Nama lengkap Anda" />
                  </span>
                </label>
              )}

              <label className="auth-field">
                <span>Email</span>
                <span className={`auth-field__control ${error && (error.toLowerCase().includes('email') || error.toLowerCase().includes('salah')) ? 'auth-field__control--error' : ''}`}>
                  <Mail aria-hidden="true" />
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="nama@email.com"
                  />
                </span>
              </label>

              <label className="auth-field">
                <span>Password</span>
                <span className={`auth-field__control ${error && (error.toLowerCase().includes('password') || error.toLowerCase().includes('salah')) ? 'auth-field__control--error' : ''}`}>
                  <LockKeyhole aria-hidden="true" />
                  <input
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    placeholder="Minimal 6 karakter"
                  />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
                    {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </button>
                </span>
              </label>

              {mode === 'register' && (
                <label className="auth-field">
                  <span>Konfirmasi password</span>
                  <span className="auth-field__control">
                    <LockKeyhole aria-hidden="true" />
                    <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="Ulangi password" />
                  </span>
                </label>
              )}

              {error && <div className="auth-feedback auth-feedback--error"><AlertCircle aria-hidden="true" /><span>{error}</span></div>}
              {success && <div className="auth-feedback auth-feedback--success"><CheckCircle2 aria-hidden="true" /><span>{success}</span></div>}

              <button className="auth-modal__submit" type="submit" disabled={isLoading}>
                <span>{isLoading ? 'Memproses…' : mode === 'register' ? 'Buat akun sekarang' : 'Masuk ke Unlupa'}</span>
                {!isLoading && <ArrowRight aria-hidden="true" />}
              </button>
            </form>

            <p className="auth-modal__switch">
              {mode === 'register' ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
              <button type="button" onClick={() => switchMode(mode === 'register' ? 'login' : 'register')}>
                {mode === 'register' ? 'Login' : 'Daftar sekarang'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
