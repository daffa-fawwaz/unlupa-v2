import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, Zap, Trophy, Award, Star } from "lucide-react";
import { soundEffects } from "../../lib/soundFeedback";

export interface XpRewardEventDetail {
  amount: number;
  label?: string;
  timestamp?: number;
}

export function triggerXpReward(amount: number, label?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<XpRewardEventDetail>("unlupa-xp-gain", {
        detail: { amount, label, timestamp: Date.now() },
      }),
    );
  }
}

interface XpToastItem {
  id: string;
  amount: number;
  label?: string;
  isMajor: boolean;
  timestamp: number;
}

export const FloatingXpOverlay: React.FC = () => {
  const [toasts, setToasts] = useState<XpToastItem[]>([]);

  const handleXpEvent = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<XpRewardEventDetail>;
    const { amount, label } = customEvent.detail || {};
    if (!amount || amount <= 0) return;

    // Trigger audio sound feedback
    soundEffects.playXpGain(amount);

    const isMajor = amount >= 15;
    const newToast: XpToastItem = {
      id: `xp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      amount,
      label,
      isMajor,
      timestamp: Date.now(),
    };

    setToasts((prev) => [...prev.slice(-3), newToast]);

    // Automatically remove after animation completes (~1900ms)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 1900);
  }, []);

  useEffect(() => {
    window.addEventListener("unlupa-xp-gain", handleXpEvent);
    return () => {
      window.removeEventListener("unlupa-xp-gain", handleXpEvent);
    };
  }, [handleXpEvent]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-12 sm:top-16 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none flex flex-col items-center gap-2 select-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-1.5 sm:gap-2 rounded-full border shadow-lg backdrop-blur-md transition-all duration-300 animate-xp-float ${
            toast.isMajor
              ? "px-4 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white border-white/40 shadow-[0_10px_25px_rgba(16,185,129,0.45)] ring-2 ring-emerald-300/40"
              : "px-3.5 py-1 sm:py-1.5 bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white border-white/30 shadow-[0_8px_20px_rgba(255,111,61,0.4)]"
          }`}
        >
          {/* Animated Icon */}
          <div className="flex items-center justify-center shrink-0">
            {toast.isMajor ? (
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 animate-bounce" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
            )}
          </div>

          {/* XP Point Count */}
          <span className="font-black text-xs sm:text-sm tracking-tight drop-shadow-xs">
            +{toast.amount} XP
          </span>

          {/* Optional Label */}
          {toast.label && (
            <>
              <span className="opacity-40 text-xs">•</span>
              <span className="font-bold text-[11px] sm:text-xs tracking-normal opacity-95 truncate max-w-[160px] sm:max-w-[220px]">
                {toast.label}
              </span>
            </>
          )}

          {/* Floating tiny spark */}
          <Star className="w-2.5 h-2.5 text-amber-200/80 fill-amber-200/80 animate-ping ml-0.5 shrink-0" />
        </div>
      ))}
    </div>
  );
};
