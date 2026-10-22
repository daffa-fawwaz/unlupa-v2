import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, LucideIcon, X } from 'lucide-react';
import { TOAST_EVENT, ToastEventDetail, ToastVariant } from './toast';

interface VariantStyle {
  Icon: LucideIcon;
  surface: string;
  iconSurface: string;
  title: string;
  message: string;
}

const VARIANT_STYLES: Record<ToastVariant, VariantStyle> = {
  success: {
    Icon: CheckCircle2,
    surface: 'bg-[#ECFDF5] dark:bg-emerald-950/80',
    iconSurface: 'from-emerald-400 to-emerald-600',
    title: 'text-emerald-700 dark:text-emerald-300',
    message: 'text-emerald-800/80 dark:text-emerald-100/70',
  },
  error: {
    Icon: AlertCircle,
    surface: 'bg-[#FFF1F2] dark:bg-rose-950/80',
    iconSurface: 'from-rose-400 to-rose-600',
    title: 'text-rose-700 dark:text-rose-300',
    message: 'text-rose-800/80 dark:text-rose-100/70',
  },
  info: {
    Icon: Info,
    surface: 'bg-[#EFF6FF] dark:bg-blue-950/80',
    iconSurface: 'from-blue-400 to-blue-600',
    title: 'text-blue-700 dark:text-blue-300',
    message: 'text-blue-800/80 dark:text-blue-100/70',
  },
  warning: {
    Icon: AlertTriangle,
    surface: 'bg-[#FFFBEB] dark:bg-amber-950/80',
    iconSurface: 'from-amber-400 to-amber-600',
    title: 'text-amber-700 dark:text-amber-300',
    message: 'text-amber-800/80 dark:text-amber-100/70',
  },
};

const MAX_VISIBLE = 3;

export const ToastOverlay: React.FC = () => {
  const [toasts, setToasts] = useState<ToastEventDetail[]>([]);
  const timers = useRef<number[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastEventDetail>).detail;
      if (!detail?.message) return;

      setToasts((previous) => [...previous.slice(-(MAX_VISIBLE - 1)), detail]);

      if (detail.duration > 0) {
        timers.current.push(window.setTimeout(() => dismiss(detail.id), detail.duration));
      }
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    };
  }, [dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-28 z-[100000] flex w-[min(92vw,430px)] -translate-x-1/2 flex-col gap-2.5"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const style = VARIANT_STYLES[toast.variant];
        const { Icon } = style;

        return (
          <div
            key={toast.id}
            role={toast.variant === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border border-white/80 p-3.5 shadow-[0_12px_30px_rgba(24,35,74,0.16),-5px_-5px_16px_rgba(255,255,255,0.85)] animate-toast-in motion-reduce:animate-none ${style.surface}`}
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-[0_5px_12px_rgba(24,35,74,0.18),inset_0_1px_1px_rgba(255,255,255,0.5)] ${style.iconSurface}`}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              {toast.title && (
                <p className={`text-[13px] font-extrabold leading-snug ${style.title}`}>{toast.title}</p>
              )}
              <p className={`text-[12px] font-medium leading-relaxed ${style.message}`}>{toast.message}</p>
            </div>

            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Tutup notifikasi"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-current opacity-50 transition hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
