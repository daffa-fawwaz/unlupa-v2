import React from 'react';
import { getJuzCoverTheme } from '../../data/quranCovers';

interface Props {
  juzNumber: number;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  showSurahName?: boolean;
}

export const QuranJuzCoverArt: React.FC<Props> = ({
  juzNumber,
  size = 'hero',
  className = '',
  showSurahName = false,
}) => {
  const theme = getJuzCoverTheme(juzNumber);

  // Dynamic SVG medallion based on theme.medallionType
  const renderMedallion = () => {
    switch (theme.medallionType) {
      case 'shamsa12':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full text-white/90 drop-shadow-md">
            {/* 12-point Sacred Star Polygon with Floral Petals */}
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="50" cy="50" r="38" fill="rgba(0,0,0,0.25)" stroke="currentColor" strokeWidth="0.8" />
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = i * 30;
              return (
                <g key={i} transform={`rotate(${angle} 50 50)`}>
                  <path d="M 50 8 L 54 28 L 50 38 L 46 28 Z" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="0.8" />
                  <circle cx="50" cy="8" r="1.5" fill="currentColor" />
                </g>
              );
            })}
            <circle cx="50" cy="50" r="24" fill="rgba(0,0,0,0.35)" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        );
      case 'star16':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full text-white/90 drop-shadow-md">
            {/* 16-point Andalusian Star */}
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="39" fill="rgba(0,0,0,0.2)" stroke="currentColor" strokeWidth="0.8" />
            {Array.from({ length: 16 }).map((_, i) => {
              const angle = i * 22.5;
              return (
                <g key={i} transform={`rotate(${angle} 50 50)`}>
                  <line x1="50" y1="9" x2="50" y2="28" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="50" cy="9" r="1.4" fill="currentColor" />
                </g>
              );
            })}
            {/* Interlacing 8-point Squares */}
            <rect x="26" y="26" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" transform="rotate(0 50 50)" />
            <rect x="26" y="26" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" transform="rotate(45 50 50)" />
            <circle cx="50" cy="50" r="23" fill="rgba(0,0,0,0.4)" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        );
      case 'octagram':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full text-white/90 drop-shadow-md">
            {/* Rub el Hizb / Islamic Octagram */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="41" fill="rgba(0,0,0,0.25)" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 2" />
            <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="1.8" transform="rotate(0 50 50)" />
            <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="1.8" transform="rotate(45 50 50)" />
            <circle cx="50" cy="50" r="25" fill="rgba(0,0,0,0.4)" stroke="currentColor" strokeWidth="1.2" />
            {Array.from({ length: 8 }).map((_, i) => (
              <circle key={i} cx="50" cy="12" r="2" fill="currentColor" transform={`rotate(${i * 45} 50 50)`} />
            ))}
          </svg>
        );
      case 'arabesque':
      case 'mandala':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full text-white/90 drop-shadow-md">
            {/* Floral Arabesque Rosette */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="40" fill="rgba(0,0,0,0.2)" stroke="currentColor" strokeWidth="0.8" />
            {Array.from({ length: 8 }).map((_, i) => (
              <path
                key={i}
                d="M 50 50 C 35 30 35 15 50 12 C 65 15 65 30 50 50 Z"
                fill="currentColor"
                fillOpacity="0.25"
                stroke="currentColor"
                strokeWidth="1"
                transform={`rotate(${i * 45} 50 50)`}
              />
            ))}
            <circle cx="50" cy="50" r="22" fill="rgba(0,0,0,0.45)" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        );
      case 'arch':
      case 'rosette':
      default:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full text-white/90 drop-shadow-md">
            {/* Traditional Ottoman Mihrab & Shamsa Arch */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="50" cy="50" r="41" fill="rgba(0,0,0,0.25)" stroke="currentColor" strokeWidth="0.8" />
            {Array.from({ length: 10 }).map((_, i) => (
              <g key={i} transform={`rotate(${i * 36} 50 50)`}>
                <polygon points="50,10 55,24 50,30 45,24" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="0.8" />
                <circle cx="50" cy="10" r="1.5" fill="currentColor" />
              </g>
            ))}
            <circle cx="50" cy="50" r="24" fill="rgba(0,0,0,0.4)" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        );
    }
  };

  const sizeClasses = {
    sm: 'w-10 aspect-[1/1.36] rounded-r-[3px] rounded-l-[1px] border-l-[3px]',
    md: 'w-14 aspect-[1/1.36] rounded-r-[4px] rounded-l-[2px] border-l-[4px]',
    lg: 'w-20 aspect-[1/1.36] rounded-r-[5px] rounded-l-[2px] border-l-[4px]',
    hero: 'w-22 sm:w-26 md:w-28 aspect-[1/1.38] rounded-r-[6px] rounded-l-[2px] border-l-[5px]',
  };

  return (
    <div
      className={`relative select-none overflow-hidden shadow-xl shadow-black/40 dark:shadow-black/75 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 bg-gradient-to-br ${theme.bgGradient} ${sizeClasses[size]} ${className}`}
      style={{
        borderLeftColor: theme.spineColor,
      }}
    >
      {/* 3D Spine Lighting and Sheen */}
      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/60 via-white/35 to-transparent pointer-events-none z-20" />
      <div className="absolute inset-y-0 right-0 w-1.5 bg-gradient-to-l from-black/35 to-transparent pointer-events-none z-20" />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/20 pointer-events-none z-20" />
      
      {/* Background radial sacred illumination */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 z-0"
        style={{ background: theme.patternStyle }}
      />

      {/* Outer Fine Gold Foil Border */}
      <div className="w-full h-full p-1 sm:p-1.5 flex flex-col justify-between items-center text-center relative border border-white/65 select-none m-0.5 rounded-r-[4px] z-10">
        
        {/* Inner Secondary Fine Border with Corner Brackets */}
        <div className="absolute inset-1 border border-white/40 pointer-events-none rounded-xs">
          {/* 4 Corner Ornaments */}
          <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t-2 border-l-2 border-white/80" />
          <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 border-t-2 border-r-2 border-white/80" />
          <div className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border-b-2 border-l-2 border-white/80" />
          <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b-2 border-r-2 border-white/80" />
        </div>

        {/* Top: Elegant Decorative Title Ribbon (Al-Qur'anul Karim) */}
        <div className="relative z-10 pt-1">
          <div className="inline-flex items-center justify-center px-2 py-0.5 bg-black/30 backdrop-blur-xs border border-white/45 rounded-full shadow-xs">
            <span className="text-[7.5px] sm:text-[8.5px] font-black tracking-widest text-white uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-sans">
              القرآن الكريم
            </span>
          </div>
        </div>

        {/* Center: Magnificent Sacred Geometry Medallion & Calligraphy */}
        <div className="relative z-10 my-auto px-1 w-full flex flex-col items-center justify-center">
          <div className="w-13 h-13 sm:w-16 sm:h-16 relative flex items-center justify-center">
            {renderMedallion()}
            {/* Center Arabic Calligraphy / Surah Emblem */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs sm:text-sm font-serif font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-normal text-center leading-none">
                {showSurahName && theme.surahArabic ? theme.surahArabic : "مصحف"}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom: Elegant Gilded Juz Indicator */}
        <div className="relative z-10 pb-1">
          <div className="inline-flex items-center justify-center px-2 py-0.5 bg-black/35 backdrop-blur-xs border border-white/50 rounded-full shadow-xs">
            <span className="text-[8px] sm:text-[9px] font-black tracking-widest text-white uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-sans">
              JUZ {juzNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Golden Bookmark Ribbon */}
      <div className="absolute bottom-0 right-2 w-2.5 h-4 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 shadow-md transform translate-y-1 z-20 border-t border-white/70 rounded-b-xs" />
    </div>
  );
};
