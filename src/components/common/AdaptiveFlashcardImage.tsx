import React from "react";
import { Maximize2 } from "lucide-react";

interface AdaptiveFlashcardImageProps {
  src: string;
  alt: string;
  title?: string;
  onEnlarge: () => void;
  language?: string;
  className?: string;
  maxHeight?: string;
  fit?: "cover" | "contain";
}

export const AdaptiveFlashcardImage: React.FC<AdaptiveFlashcardImageProps> = ({
  src,
  alt,
  title,
  onEnlarge,
  language = "id",
  className = "",
  maxHeight,
  fit = "contain",
}) => {
  if (!src || !src.trim()) return null;

  const isCover = fit === "cover";

  return (
    <div
      className={`w-full h-full relative group/adaptiveimg overflow-hidden rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center select-none transition-all ${className}`}
      title={alt}
    >
      <img
        src={src}
        alt={alt}
        className={`w-full transition-transform duration-300 ${
          isCover
            ? "h-full object-cover object-center group-hover/adaptiveimg:scale-105"
            : `h-auto object-contain object-center ${maxHeight ? maxHeight : "max-h-[280px] sm:max-h-[360px]"}`
        }`}
        loading="lazy"
      />

      {/* Single clean Pop-up Lightbox Trigger */}
      <div className="absolute top-1.5 right-1.5 z-10 flex items-center opacity-90 sm:opacity-0 sm:group-hover/adaptiveimg:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEnlarge();
          }}
          className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-black/90 backdrop-blur-xs flex items-center justify-center cursor-pointer shadow-xs transition-colors"
          title={language === "en" ? "Open image pop-up" : "Buka pop-up gambar"}
          aria-label={
            language === "en" ? "Open image pop-up" : "Buka pop-up gambar"
          }
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
