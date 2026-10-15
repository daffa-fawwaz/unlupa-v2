import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useSwipeGesture } from "../../hooks/useSwipeGesture";
import { soundEffects } from "../../lib/soundFeedback";

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  imageUrl,
  title,
  onClose,
}) => {
  useSwipeGesture(null, {
    disabled: !isOpen,
    onSwipeRight: () => {
      soundEffects.playCardFlip("backward");
      onClose();
    },
    onSwipeDown: () => {
      soundEffects.playSoftClick();
      onClose();
    },
    threshold: 40,
    minRatio: 1.15,
  });
  // Handle keyboard ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.setAttribute("data-image-modal-open", "true");
    } else {
      document.body.removeAttribute("data-image-modal-open");
    }
    return () => {
      document.body.removeAttribute("data-image-modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-xl select-none animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      {/* Sleek Close Button at Top Right */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-[100000] w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer shadow-2xl border border-white/20 active:scale-95"
        title="Tutup"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Image Container: Tapping anywhere (image or backdrop) closes it instantly */}
      <div
        className="relative max-w-[96vw] max-h-[88vh] flex items-center justify-center cursor-pointer"
        onClick={onClose}
      >
        <img
          src={imageUrl}
          alt={title || "Pratinjau Gambar"}
          className="max-w-[96vw] max-h-[86vh] object-contain rounded-2xl shadow-2xl border border-white/15 bg-black/50"
        />
      </div>
    </div>,
    document.body,
  );
};
