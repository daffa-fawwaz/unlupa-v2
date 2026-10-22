import React, { useEffect, useRef, useState } from 'react';
import {
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
import { showToast } from '../../common/toast';
import './auth-modal.css';

type AuthMode = 'login' | 'register';
type AuthField = 'email' | 'password' | 'confirmPassword' | 'name';

interface AuthErrorFeedback {
  /** Condition-specific headline, e.g. "Password salah". */
  title: string;
  /** Short detail shown under the headline. */
  message: string;
  /** Fields that should be highlighted as invalid. */
  fields: AuthField[];
}

/**
 * Maps an auth failure to a condition-specific title plus a short detail.
 * The server returns one code for both "email unknown" and "wrong password"
 * on purpose (account enumeration), so those two stay bundled into one title.
 */
const friendlyError = (error: any): AuthErrorFeedback => {
  switch (error?.code) {
    case 'EMAIL_ALREADY_EXISTS':
      return { title: 'Email sudah terdaftar', message: 'Silakan masuk ke akun Anda.', fields: ['email'] };
    case 'INVALID_CREDENTIALS':
      return { title: 'Email atau password salah', message: 'Periksa kembali email dan password yang Anda masukkan.', fields: ['email', 'password'] };
    case 'TOO_MANY_REQUESTS':
      return { title: 'Terlalu banyak percobaan', message: 'Silakan tunggu beberapa saat lalu coba lagi.', fields: [] };
    case 'WEAK_PASSWORD':
      return { title: 'Password terlalu lemah', message: 'Gunakan minimal 6 karakter.', fields: ['password'] };
    case 'PASSWORD_TOO_LONG':
      return { title: 'Password terlalu panjang', message: 'Gunakan maksimal 128 karakter.', fields: ['password'] };
    case 'INVALID_NAME':
      return { title: 'Nama belum lengkap', message: 'Nama lengkap minimal terdiri dari 2 karakter.', fields: ['name'] };
    case 'NAME_TOO_LONG':
      return { title: 'Nama terlalu panjang', message: 'Gunakan maksimal 100 karakter.', fields: ['name'] };
    case 'INVALID_EMAIL':
      return { title: 'Email belum valid', message: 'Periksa kembali format alamat email Anda.', fields: ['email'] };
    case 'INVALID_INPUT':
      return { title: 'Email dan password wajib diisi', message: 'Lengkapi kedua kolom sebelum melanjutkan.', fields: ['email', 'password'] };
    case 'USER_NOT_FOUND':
      return { title: 'Akun tidak ditemukan', message: 'Pengguna tidak ditemukan atau telah dinonaktifkan.', fields: ['email'] };
    case 'NETWORK_ERROR':
      return { title: 'Tidak dapat terhubung ke server', message: 'Periksa koneksi internet Anda.', fields: [] };
    case 'TIMEOUT':
      return { title: 'Server terlalu lama merespons', message: 'Silakan coba kembali sebentar lagi.', fields: [] };
    default:
      return { title: 'Gagal memproses', message: error?.message || 'Terjadi kendala saat memproses autentikasi.', fields: [] };
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
  const [error, setError] = useState<AuthErrorFeedback | null>(null);
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

  const isFieldInvalid = (field: AuthField) => Boolean(error?.fields.includes(field));

  /** Clears the invalid state of a single field as soon as the user edits it. */
  const clearFieldError = (field: AuthField) => {
    setError((current) => {
      if (!current || !current.fields.includes(field)) return current;
      const remaining = current.fields.filter((item) => item !== field);
      return remaining.length ? { ...current, fields: remaining } : null;
    });
  };

  const reportError = (feedback: AuthErrorFeedback) => {
    setError(feedback);
    showToast(feedback.message, { variant: 'error', title: feedback.title });
    if (feedback.fields.includes('password') && passwordRef.current) {
      window.setTimeout(() => passwordRef.current?.focus(), 0);
    }
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

    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      reportError({ title: 'Email belum valid', message: 'Masukkan alamat email yang valid.', fields: ['email'] });
      return;
    }
    if (cleanPassword.length < 6) {
      reportError({ title: 'Password terlalu pendek', message: 'Gunakan minimal 6 karakter.', fields: ['password'] });
      return;
    }
    if (mode === 'register' && !cleanName) {
      reportError({ title: 'Nama belum diisi', message: 'Masukkan nama lengkap Anda.', fields: ['name'] });
      return;
    }
    if (mode === 'register' && cleanPassword !== confirmPassword.trim()) {
      reportError({ title: 'Konfirmasi password tidak sama', message: 'Ulangi password dengan benar.', fields: ['confirmPassword'] });
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
      reportError(friendlyError(authError));
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
                  <span className={`auth-field__control${isFieldInvalid('name') ? ' auth-field__control--error' : ''}`}>
                    <UserRound aria-hidden="true" />
                    <input
                      value={fullName}
                      onChange={(event) => { setFullName(event.target.value); clearFieldError('name'); }}
                      autoComplete="name"
                      aria-invalid={isFieldInvalid('name')}
                      placeholder="Nama lengkap Anda"
                    />
                  </span>
                </label>
              )}

              <label className="auth-field">
                <span>Email</span>
                <span className={`auth-field__control${isFieldInvalid('email') ? ' auth-field__control--error' : ''}`}>
                  <Mail aria-hidden="true" />
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(event) => { setEmail(event.target.value); clearFieldError('email'); }}
                    autoComplete="email"
                    aria-invalid={isFieldInvalid('email')}
                    placeholder="nama@email.com"
                  />
                </span>
              </label>

              <label className="auth-field">
                <span>Password</span>
                <span className={`auth-field__control${isFieldInvalid('password') ? ' auth-field__control--error' : ''}`}>
                  <LockKeyhole aria-hidden="true" />
                  <input
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); clearFieldError('password'); }}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    aria-invalid={isFieldInvalid('password')}
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
                  <span className={`auth-field__control${isFieldInvalid('confirmPassword') ? ' auth-field__control--error' : ''}`}>
                    <LockKeyhole aria-hidden="true" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(event) => { setConfirmPassword(event.target.value); clearFieldError('confirmPassword'); }}
                      autoComplete="new-password"
                      aria-invalid={isFieldInvalid('confirmPassword')}
                      placeholder="Ulangi password"
                    />
                  </span>
                </label>
              )}

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
