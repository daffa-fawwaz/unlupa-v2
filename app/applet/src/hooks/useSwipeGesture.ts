import { useEffect, useRef, RefObject } from 'react';

export interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  minRatio?: number;
  disabled?: boolean;
}

/**
 * Custom hook to detect horizontal swipe gestures on mobile and touch-enabled devices.
 * - onSwipeRight: typically used for "back" / previous page / previous space navigation
 * - onSwipeLeft: typically used for "forward" / next page / next space navigation
 * 
 * Features:
 * - Ref-stabilized callbacks: immune to parent component re-renders during gesture tracking
 * - Natural thumb-arc angle tolerance (minRatio = 1.15)
 * - Calibrated threshold (default 40px)
 * - Safe for interactive cards: buttons don't block full-screen swipes
 * - Attaches to window by default for full-viewport coverage
 */
export function useSwipeGesture<T extends HTMLElement = HTMLElement>(
  targetRef: RefObject<T | null> | null,
  config: SwipeConfig
) {
  const { onSwipeLeft, onSwipeRight, threshold = 40, minRatio = 1.15, disabled = false } = config;

  // Keep latest config in ref so listeners don't need to detach/re-attach on every re-render
  const configRef = useRef<SwipeConfig>({
    onSwipeLeft,
    onSwipeRight,
    threshold,
    minRatio,
    disabled
  });

  useEffect(() => {
    configRef.current = {
      onSwipeLeft,
      onSwipeRight,
      threshold,
      minRatio,
      disabled
    };
  }, [onSwipeLeft, onSwipeRight, threshold, minRatio, disabled]);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Attach to provided target element or window for global coverage
    const element: EventTarget = targetRef?.current || window;

    const handleTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent;
      if (configRef.current.disabled) return;
      if (touchEvent.touches.length !== 1) return;

      const target = touchEvent.target as HTMLElement | null;
      if (target) {
        // Do not intercept swipe inside active text entry fields or elements explicitly marked no-swipe
        if (
          target.closest('input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"], [data-no-swipe]')
        ) {
          return;
        }
      }

      const touch = touchEvent.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: Event) => {
      const touchEvent = e as TouchEvent;
      if (configRef.current.disabled) {
        touchStartRef.current = null;
        return;
      }

      if (!touchStartRef.current || touchEvent.changedTouches.length !== 1) return;

      const touch = touchEvent.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const elapsed = Date.now() - touchStartRef.current.time;
      touchStartRef.current = null;

      const activeThreshold = configRef.current.threshold ?? 40;
      const activeMinRatio = configRef.current.minRatio ?? 1.15;

      // Ignore if user held finger stationary for too long (> 1000ms) or small movements
      if (elapsed > 1000) return;
      if (Math.abs(dx) < activeThreshold) return;
      // Ensure horizontal swipe is dominant over vertical scroll
      if (Math.abs(dx) < Math.abs(dy) * activeMinRatio) return;

      const target = touchEvent.target as HTMLElement | null;
      if (target) {
        // If the swipe originated inside a horizontally scrollable container with room to scroll, let it scroll
        const scrollParent = target.closest('.overflow-x-auto, .overflow-x-scroll') as HTMLElement | null;
        if (scrollParent && scrollParent.scrollWidth > scrollParent.clientWidth + 20) {
          return;
        }
      }

      if (dx > 0) {
        configRef.current.onSwipeRight?.();
      } else {
        configRef.current.onSwipeLeft?.();
      }
    };

    const handleTouchCancel = () => {
      touchStartRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
    element.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel as EventListener, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart as EventListener);
      element.removeEventListener('touchend', handleTouchEnd as EventListener);
      element.removeEventListener('touchcancel', handleTouchCancel as EventListener);
    };
  }, [targetRef]);
}
