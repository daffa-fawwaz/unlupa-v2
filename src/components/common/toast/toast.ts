export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  /** Short headline that frames the message, e.g. "Gagal masuk". */
  title?: string;
  variant?: ToastVariant;
  /** Milliseconds before the toast auto-dismisses. Use 0 to keep it open. */
  duration?: number;
}

export interface ToastEventDetail {
  id: string;
  message: string;
  title?: string;
  variant: ToastVariant;
  duration: number;
}

export const TOAST_EVENT = 'unlupa-toast';

export const TOAST_DEFAULT_DURATION = 5200;

/**
 * Shows a global toast. Safe to call from anywhere — the message travels
 * through a window event so no provider wiring is required at the call site.
 */
export function showToast(message: string, options: ToastOptions = {}): string {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const detail: ToastEventDetail = {
    id,
    message,
    title: options.title,
    variant: options.variant ?? 'info',
    duration: options.duration ?? TOAST_DEFAULT_DURATION,
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<ToastEventDetail>(TOAST_EVENT, { detail }));
  }

  return id;
}
