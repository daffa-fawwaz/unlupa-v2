import { useEffect, useRef, RefObject } from 'react';

export interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  onSwipeUp?: () => void;
  threshold?: number;
  minRatio?: number;
  disabled?: boolean;
}

/**
 * Custom hook to detect swipe gestures on mobile and touch-enabled devices.
 * - onSwipeRight: used for "back" / previous layer / previous space navigation
 * - onSwipeLeft: used for "forward" / next page / next space navigation
 * - onSwipeDown: used for closing full-page popups / sheets / modal overlays
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
  const { onSwipeLeft, onSwipeRight, onSwipeDown, onSwipeUp, threshold = 40, minRatio = 1.15, disabled = false } = config;

  // Keep latest config in ref so listeners don't need to detach/re-attach on every re-render
  const configRef = useRef<SwipeConfig>({
    onSwipeLeft,
    onSwipeRight,
    onSwipeDown,
    onSwipeUp,
    threshold,
    minRatio,
    disabled
  });

  useEffect(() => {
    configRef.current = {
      onSwipeLeft,
      onSwipeRight,
      onSwipeDown,
      onSwipeUp,
      threshold,
      minRatio,
      disabled
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeDown, onSwipeUp, threshold, minRatio, disabled]);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  /**
   * Helper to determine whether swipe navigation must be suppressed.
   * Completely disables swipe when:
   * 1. Active canvas drawing is in progress.
   * 2. The touch gesture started on an input, textarea, select, or explicitly marked [data-no-swipe] element.
   */
  const isSwipeSuppressed = (target: HTMLElement | null): boolean => {
    if (typeof document === 'undefined') return false;

    // 1. Check if user is currently annotating / drawing
    if (
      document.body.getAttribute('data-annotation-open') === 'true' ||
      document.body.classList.contains('is-annotating')
    ) {
      return true;
    }

    if (!target) return false;

    // 2. Element check for form inputs, interactive textfields, or canvas
    const blockedElement = target.closest(
      'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), ' +
      'textarea, select, [contenteditable="true"], ' +
      'canvas, [data-no-swipe], [data-carousel], .no-swipe, ' +
      '[data-annotation-active="true"]'
    );
    if (blockedElement) return true;

    return false;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Attach to provided target element or window for global coverage
    const element: EventTarget = targetRef?.current || window;

    const handleTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent;
      if (configRef.current.disabled) return;
      if (touchEvent.touches.length !== 1) return;

      const target = touchEvent.target as HTMLElement | null;
      if (isSwipeSuppressed(target)) {
        touchStartRef.current = null;
        return;
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

      const target = touchEvent.target as HTMLElement | null;
      if (isSwipeSuppressed(target)) {
        touchStartRef.current = null;
        return;
      }

      const touch = touchEvent.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const elapsed = Date.now() - touchStartRef.current.time;
      touchStartRef.current = null;

      const activeThreshold = configRef.current.threshold ?? 40;
      const activeMinRatio = configRef.current.minRatio ?? 1.15;

      // Ignore if user held finger stationary for too long (> 1000ms)
      if (elapsed > 1000) return;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Horizontal gesture dominant
      if (absDx >= activeThreshold && absDx >= absDy * activeMinRatio) {
        if (target) {
          // If the swipe originated inside a horizontally scrollable container with room to scroll in that direction, let it scroll
          const scrollParent = target.closest('.overflow-x-auto, .overflow-x-scroll') as HTMLElement | null;
          if (scrollParent && scrollParent.scrollWidth > scrollParent.clientWidth + 20) {
            const canScrollRight = scrollParent.scrollLeft + scrollParent.clientWidth < scrollParent.scrollWidth - 10;
            const canScrollLeft = scrollParent.scrollLeft > 10;
            // dx < 0 means finger moving left, revealing content to the right
            // Only suppress page swipe for small local drags (< 70px). Deliberate screen swipes (>= 70px) navigate between tabs!
            if (absDx < 70) {
              if (dx < 0 && canScrollRight) {
                return;
              }
              // dx > 0 means finger moving right, revealing content to the left
              if (dx > 0 && canScrollLeft) {
                return;
              }
            }
          }
        }

        if (dx > 0) {
          configRef.current.onSwipeRight?.();
        } else {
          configRef.current.onSwipeLeft?.();
        }
        return;
      }

      // Vertical gesture dominant (e.g. swipe down to dismiss modal)
      if (absDy >= activeThreshold && absDy >= absDx * activeMinRatio) {
        if (dy > 0 && configRef.current.onSwipeDown) {
          // Check if vertically scrollable container is already at top or not scrolling
          if (target) {
            const scrollParent = target.closest('.overflow-y-auto, .overflow-y-scroll') as HTMLElement | null;
            if (scrollParent && scrollParent.scrollTop > 10) {
              return;
            }
          }
          configRef.current.onSwipeDown();
        } else if (dy < 0 && configRef.current.onSwipeUp) {
          configRef.current.onSwipeUp();
        }
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
