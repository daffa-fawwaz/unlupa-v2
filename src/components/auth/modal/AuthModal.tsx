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
  switch (error?.code) {
    case 'EMAIL_ALREADY_EXISTS':
      return 'Email ini sudah terdaftar. Silakan masuk ke akun Anda.';
    case 'INVALID_CREDENTIALS':
      return 'Email atau password belum sesuai.';
    case 'TOO_MANY_REQUESTS':
      return 'Terlalu banyak percobaan. Silakan tunggu beberapa saat.';
    case 'WEAK_PASSWORD':
      return 'Password terlalu lemah. Gunakan minimal 6 karakter.';
    case 'INVALID_EMAIL':
      return 'Format email belum valid.';
    case 'NETWORK_ERROR':
      return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
    case 'TIMEOUT':
      return 'Server membutuhkan waktu terlalu lama. Silakan coba kembali.';
    default:
      return error?.message || 'Terjadi kendala saat memproses autentikasi.';
  }
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

  const closeModal = () => {
    if (!isLoading) setIsAuthModalOpen(false);
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setAuthModalMode(nextMode);
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    if (!isAuthModalOpen) return;
    setMode(authModalMode);
    setError(null);
    setSuccess(null);
    const focusTimer = window.setTimeout(() => emailRef.current?.focus(), 120);

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) setIsAuthModalOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [authModalMode, isAuthModalOpen, isLoading, setIsAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = fullName.trim();

    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError('Masukkan alamat email yang valid.');
      return;
    }
    if (cleanPassword.length < 6) {
      setError('Password minimal terdiri dari 6 karakter.');
      return;
    }
    if (mode === 'register' && !cleanName) {
      setError('Masukkan nama lengkap Anda.');
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

      await initiateUserSession(result.user);
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
      setError(friendlyError(authError));
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
                <span className="auth-field__control">
                  <Mail aria-hidden="true" />
                  <input ref={emailRef} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="nama@email.com" />
                </span>
              </label>

              <label className="auth-field">
                <span>Password</span>
                <span className="auth-field__control">
                  <LockKeyhole aria-hidden="true" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder="Minimal 6 karakter" />
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
