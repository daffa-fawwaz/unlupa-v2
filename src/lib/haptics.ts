/**
 * Pure client-side haptic and vibration feedback utility.
 * Uses native HTML5 Web Vibration API without any external dependencies or external APIs.
 */

export const HapticFeedback = {
  light: () => {
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate(20);
      }
    } catch {
      // Safe fallback when vibration is restricted or unsupported
    }
  },

  medium: () => {
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate(40);
      }
    } catch {}
  },

  success: () => {
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate([30, 40, 60]);
      }
    } catch {}
  },

  recordStart: () => {
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate([50, 40, 60]);
      }
    } catch {}
  },

  recordStop: () => {
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate([40, 50, 70]);
      }
    } catch {}
  },

  playToggle: (isPlaying: boolean) => {
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate(isPlaying ? 35 : 25);
      }
    } catch {}
  },

  pulseBeat: () => {
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    } catch {}
  }
};
