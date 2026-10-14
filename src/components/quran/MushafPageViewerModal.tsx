import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Loader2,
  CheckCircle2,
  Download,
  MessageSquare,
  AlertCircle,
  Minimize2,
  Pencil,
  Highlighter,
  Undo2,
  Trash2,
  Mic,
  Square,
  Volume2
} from 'lucide-react';
import { getSurahForPage, getJuzForPage, getQuranPageImageUrl, MUSHAF_SAMPLE_SNIPPETS } from '../../data/quranData';
import { getOfflinePageUrl, cachePageOffline, isPageCachedOffline } from '../../lib/offlineStorage';
import { AudioRecorderPlayer } from '../shared/AudioRecorderPlayer';
import { MurottalPlayer } from '../shared/MurottalPlayer';
import { MushafDrawingCanvas, COLOR_PRESETS } from './MushafDrawingCanvas';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { soundEffects } from '../../lib/soundFeedback';

interface Props {
  pageNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigatePage?: (newPage: number) => void;
  onOpenFeedback?: (pageNumber: number) => void;
  minimal?: boolean;
  hideAudioDock?: boolean;
}

export const MushafPageViewerModal: React.FC<Props> = ({
  pageNumber,
  isOpen,
  onClose,
  onNavigatePage,
  onOpenFeedback,
  minimal = false,
  hideAudioDock = false,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [imageLoading, setImageLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [isCaching, setIsCaching] = useState<boolean>(false);

  // Fitur Coret-coretan / Canvas Markup
  const [isDrawingActive, setIsDrawingActive] = useState<boolean>(false);
  const [drawingColor, setDrawingColor] = useState<string>('#F59E0B');
  const [drawingStrokeType, setDrawingStrokeType] = useState<'pen' | 'highlighter'>('highlighter');

  // Fitur Rekam Suara (Tes Hafalan Mandiri)
  const [isAudioDockOpen, setIsAudioDockOpen] = useState<boolean>(!hideAudioDock && !minimal);
  const [isAudioRecording, setIsAudioRecording] = useState<boolean>(false);
  const [hasAudioRecording, setHasAudioRecording] = useState<boolean>(false);

  // Sync drawing state with CustomEvent from MushafDrawingCanvas
  useEffect(() => {
    const handleDrawingModeChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ pageNumber?: number; isDrawingMode?: boolean }>).detail;
      if (detail && (detail.pageNumber === undefined || detail.pageNumber === pageNumber)) {
        setIsDrawingActive(!!detail.isDrawingMode);
      }
    };
    window.addEventListener('mushaf-drawing-mode-changed', handleDrawingModeChanged);
    return () => window.removeEventListener('mushaf-drawing-mode-changed', handleDrawingModeChanged);
  }, [pageNumber]);

  useEffect(() => {
    let isMounted = true;
    setImageError(false);

    // Check local offline storage first for 0ms instant loading
    (async () => {
      const cachedUrl = await getOfflinePageUrl(pageNumber);
      if (isMounted) {
        if (cachedUrl) {
          setLocalImageUrl(cachedUrl);
          setIsCached(true);
          setImageLoading(false);
        } else {
          setLocalImageUrl(null);
          setIsCached(false);
          setImageLoading(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [pageNumber]);

  const handleManualCache = async () => {
    setIsCaching(true);
    const ok = await cachePageOffline(pageNumber);
    if (ok) {
      setIsCached(true);
      const url = await getOfflinePageUrl(pageNumber);
      if (url) setLocalImageUrl(url);
    }
    setIsCaching(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      // Don't trigger if user is typing
      const target = e.target as HTMLElement;
      if (target && ['input', 'textarea', 'select'].includes(target.tagName.toLowerCase())) {
        return;
      }

      if (e.key === 'Escape') {
        onClose();
      } else if ((e.key === 'ArrowRight' || (e.key === 'ArrowLeft' && e.altKey)) && onNavigatePage && pageNumber < 604) {
        // ArrowRight / Alt+ArrowLeft: Halaman Selanjutnya
        soundEffects.playCardFlip('forward');
        onNavigatePage(pageNumber + 1);
      } else if ((e.key === 'ArrowLeft' || (e.key === 'ArrowRight' && e.altKey)) && onNavigatePage && pageNumber > 1) {
        // ArrowLeft / Alt+ArrowRight: Halaman Sebelumnya
        soundEffects.playCardFlip('backward');
        onNavigatePage(pageNumber - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pageNumber, onNavigatePage, onClose]);

  // Swipe support for closing Mushaf popup or navigating
  // Usap ke kanan (Swipe Right) -> Kembali / Tutup Pop up Mushaf ke halaman Al-Qur'an
  // Usap ke bawah (Swipe Down) -> Tutup Pop up Mushaf
  // Usap ke kiri (Swipe Left) -> Halaman selanjutnya jika ada
  useSwipeGesture(null, {
    disabled: !isOpen || zoomLevel > 1 || isDrawingActive,
    onSwipeRight: () => {
      soundEffects.playCardFlip('backward');
      onClose();
    },
    onSwipeDown: () => {
      soundEffects.playSoftClick();
      onClose();
    },
    onSwipeLeft: () => {
      if (onNavigatePage && pageNumber < 604) {
        soundEffects.playCardFlip('forward');
        onNavigatePage(pageNumber + 1);
      }
    },
    threshold: 40,
  });

  if (!isOpen) return null;

  const isLeftPage = pageNumber % 2 === 0 && pageNumber !== 1;
  const juzNum = getJuzForPage(pageNumber);
  const surahInfo = getSurahForPage(pageNumber);
  const imageUrl = getQuranPageImageUrl(pageNumber, 1260);

  const snippet = MUSHAF_SAMPLE_SNIPPETS[pageNumber] || {
    bismillah: pageNumber > 1 && pageNumber !== 187,
    header: `سُورَةُ ${surahInfo.nameAr}`,
    lines: [
      `بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ`,
      `آيَاتُ الْقُرْآنِ الْكَرِيمِ — الصَّفْحَةُ ${pageNumber}`,
      `تِلَاوَةٌ مُبَارَكَةٌ مِنْ ${surahInfo.nameAr} (الآيات ${surahInfo.ayahRange})`,
      `حِفْظُ وَمُرَاجَعَةُ كِتَابِ اللَّهِ بِإِتْقَانٍ وَثَبَاتٍ`,
      `وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ`,
      `اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا`,
      `إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ`
    ]
  };

  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.75));
  const resetZoom = () => setZoomLevel(1);

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-1 sm:p-3 md:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="neumorph-card bg-[#EEF2F7] dark:bg-[#141C2B] text-slate-900 dark:text-slate-100 w-full max-w-5xl h-[98vh] max-h-[100dvh] rounded-2xl sm:rounded-3xl shadow-2xl border border-white/60 dark:border-white/5 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar: Streamlined, Proportional, Executive Islamic Design (Compact & Minimal) */}
        <div className="bg-white/95 dark:bg-[#182236]/95 px-2.5 sm:px-4 py-1.5 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] shrink-0 gap-1.5 sm:gap-2 shadow-xs min-h-[42px]">
          {/* Left: Page Badge, Surah, Juz (Clean, neatly spaced) */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
            <div className="h-7 px-2 rounded-xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center gap-1 shrink-0 shadow-xs">
              <span className="text-[7.5px] sm:text-[8px] font-black uppercase opacity-90 leading-none">Hal</span>
              <span className="text-xs sm:text-sm font-black leading-none">{pageNumber}</span>
            </div>
            
            <div className="min-w-0 flex items-center gap-1 sm:gap-1.5 truncate">
              <span className="text-xs sm:text-sm font-black text-[#18234A] dark:text-[#F8FAFC] truncate">
                {surahInfo.nameEn.replace(/^Surah\s+/i, '')}
              </span>
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md neumorph-inset font-bold text-[#5E6D88] dark:text-[#94A3B8] shrink-0">
                Juz {juzNum}
              </span>
              <span className="text-[11px] text-[#FF6F3D] font-serif font-bold hidden md:inline truncate" dir="rtl">
                سُورَةُ {surahInfo.nameAr}
              </span>
            </div>
          </div>

          {/* Right Controls: Navigation, Stabilo/Coret, Rekam, Zoom, Minimize */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
            {/* Navigation Controls */}
            {onNavigatePage && (
              <div className="flex items-center neumorph-card rounded-xl p-0.5 shadow-xs shrink-0">
                <button
                  disabled={pageNumber <= 1}
                  onClick={() => {
                    soundEffects.playCardFlip('backward');
                    onNavigatePage(pageNumber - 1);
                  }}
                  className="p-1 rounded-lg hover:bg-[#FF6F3D]/10 text-[#FF6F3D] disabled:opacity-30 transition-colors cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-1 text-[11px] sm:text-xs font-black text-[#18234A] dark:text-[#F8FAFC] whitespace-nowrap">
                  {pageNumber} <span className="text-[#8E9BAE] font-medium hidden sm:inline">/ 604</span>
                </span>
                <button
                  disabled={pageNumber >= 604}
                  onClick={() => {
                    soundEffects.playCardFlip('forward');
                    onNavigatePage(pageNumber + 1);
                  }}
                  className="p-1 rounded-lg hover:bg-[#FF6F3D]/10 text-[#FF6F3D] disabled:opacity-30 transition-colors cursor-pointer"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Fitur 1: Coret-coretan / Stabilo Markup (Muncul bilah di bawah) */}
            <button
              type="button"
              onClick={() => {
                const nextState = !isDrawingActive;
                setIsDrawingActive(nextState);
                window.dispatchEvent(new CustomEvent('toggle-mushaf-drawing', {
                  detail: { pageNumber, enabled: nextState }
                }));
              }}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                isDrawingActive
                  ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs ring-2 ring-orange-300'
                  : 'neumorph-card text-[#5E6D88] hover:text-[#FF6F3D] dark:text-[#94A3B8] dark:hover:text-white hover:scale-105'
              }`}
              title={isDrawingActive ? 'Tutup Toolbar Coret' : 'Mode Coret Stabilo (Buka Toolbar di Bawah)'}
            >
              <Highlighter className="w-3.5 h-3.5" />
            </button>

            {/* Fitur 2: Rekam Suara (Tes Hafalan Mandiri) */}
            <button
              type="button"
              onClick={() => {
                if (isAudioRecording) {
                  window.dispatchEvent(new CustomEvent('trigger-stop-recording', {
                    detail: { itemId: pageNumber }
                  }));
                } else if (!isAudioDockOpen) {
                  setIsAudioDockOpen(true);
                  window.dispatchEvent(new CustomEvent('trigger-start-recording', {
                    detail: { itemId: pageNumber }
                  }));
                } else {
                  setIsAudioDockOpen(prev => !prev);
                }
              }}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                isAudioRecording
                  ? 'bg-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-400'
                  : hasAudioRecording
                  ? isAudioDockOpen
                    ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs'
                    : 'neumorph-card text-[#FF6F3D] dark:text-[#FF7E4A] hover:scale-105'
                  : isAudioDockOpen
                  ? 'bg-[#18234A] text-white shadow-xs'
                  : 'neumorph-card text-[#5E6D88] hover:text-[#FF6F3D] dark:text-[#94A3B8] dark:hover:text-white hover:scale-105'
              }`}
              title={
                isAudioRecording
                  ? 'Stop Rekaman'
                  : hasAudioRecording
                  ? (isAudioDockOpen ? 'Tutup Pemutar Rekaman' : 'Buka & Putar Rekaman Suara')
                  : (isAudioDockOpen ? 'Tutup Bilah Rekaman' : 'Mulai Rekam Suara (Tes Hafalan)')
              }
            >
              {isAudioRecording ? (
                <Square className="w-3 h-3 fill-white" />
              ) : hasAudioRecording ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Zoom Controls (Desktop / Tablet) */}
            <div className="hidden sm:flex items-center neumorph-inset rounded-xl p-0.5 shrink-0">
              <button
                onClick={zoomOut}
                disabled={zoomLevel <= 0.75}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#5E6D88] dark:text-[#94A3B8] disabled:opacity-30 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={resetZoom}
                className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] cursor-pointer"
                title="Reset Zoom (100%)"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={zoomIn}
                disabled={zoomLevel >= 2.5}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#5E6D88] dark:text-[#94A3B8] disabled:opacity-30 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Minimize / Close Button (Perkecil) */}
            <button
              onClick={onClose}
              className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-xl neumorph-card text-[#5E6D88] hover:text-[#FF6F3D] dark:text-[#94A3B8] dark:hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs flex items-center gap-1 shrink-0"
              title="Perkecil Halaman (Kembali)"
            >
              <Minimize2 className="w-3.5 h-3.5 text-[#FF6F3D] shrink-0" />
              <span className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] hidden sm:inline">Perkecil</span>
            </button>
          </div>
        </div>

        {/* Mushaf Page Display Area - Fits 100% cleanly without vertical scrolling */}
        <div className={`flex-1 bg-[#EEF2F7] dark:bg-[#0B111D] ${zoomLevel > 1 ? 'overflow-auto' : 'overflow-hidden'} flex flex-col items-center justify-center ${isDrawingActive ? 'p-0.5 sm:p-1' : 'p-1 sm:p-1.5'} min-h-0 relative`}>
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EEF2F7] dark:bg-[#0B111D] z-10">
              <Loader2 className="w-8 h-8 text-[#FF6F3D] animate-spin mb-3" />
              <p className="text-xs text-[#1B254B] dark:text-[#F8FAFC] font-bold">Memuat Halaman Mushaf {pageNumber}...</p>
            </div>
          )}

          {!imageError ? (
            <div 
              className="transition-transform duration-150 origin-center flex flex-col items-center justify-center w-full h-full max-h-full max-w-full"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <div className={`bg-[#FCFBF7] relative overflow-hidden ${isDrawingActive ? 'p-0.5 sm:p-1' : 'p-1 sm:p-1.5'} rounded-xl sm:rounded-2xl shadow-lg border border-slate-200/90 dark:border-slate-800 flex items-center justify-center h-full max-h-full max-w-full`}>
                <img
                  src={localImageUrl || imageUrl}
                  alt={`Halaman Mushaf Al-Quran ${pageNumber}`}
                  onLoad={() => {
                    setImageLoading(false);
                    if (!isCached) {
                      cachePageOffline(pageNumber).then((ok) => {
                        if (ok) setIsCached(true);
                      });
                    }
                  }}
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                  className="max-h-full max-w-full h-auto w-auto object-contain select-none rounded shadow-xs"
                  loading="eager"
                />

                {/* Freehand Drawing Canvas Overlay (Zero Lag, Persistent per Page) */}
                <MushafDrawingCanvas 
                  pageNumber={pageNumber}
                  isRightPage={!isLeftPage}
                  language="id"
                />

                {/* Prominent 3D Binding Spine Shadow */}
                <div 
                  className={`absolute inset-y-0 pointer-events-none z-10 ${
                    isLeftPage 
                      ? 'right-0 w-7 sm:w-10 bg-gradient-to-l from-black/48 via-black/16 to-transparent border-r border-black/20' 
                      : 'left-0 w-7 sm:w-10 bg-gradient-to-r from-black/48 via-black/16 to-transparent border-l border-black/20'
                  }`} 
                />
              </div>
            </div>
          ) : (
            /* Fallback formatted view if image loading fails */
            <div className="w-full max-w-xl bg-white dark:bg-[#141C2B] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xl my-auto">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 text-xs font-semibold px-2">
                <span className="font-serif text-[#1B254B] dark:text-[#F8FAFC] font-bold">الجُزْءُ {juzNum}</span>
                <span className="px-3 py-0.5 rounded-full clay-badge-gold font-bold">
                  {surahInfo.nameEn} ({surahInfo.ayahRange})
                </span>
                <span className="font-serif text-sm text-[#FF6F3D] dark:text-[#FFA180]">سُورَةُ {surahInfo.nameAr}</span>
              </div>

              <div className="my-3 py-2 px-4 rounded-2xl clay-card-subtle text-center shadow-xs">
                <p className="font-serif text-lg font-bold text-[#1B254B] dark:text-[#F8FAFC]">{snippet.header}</p>
              </div>

              {snippet.bismillah && (
                <div className="my-3 py-1 text-center">
                  <p className="font-serif text-xl sm:text-2xl text-[#1B254B] dark:text-[#F8FAFC] leading-loose">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                </div>
              )}

              <div className="space-y-4 my-4 px-2">
                {snippet.lines.map((line, idx) => (
                  <p key={idx} className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 leading-[2.2] text-center" dir="rtl">
                    {line}
                  </p>
                ))}
              </div>

              <div className="pt-4 mt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center">
                <div className="w-9 h-9 rounded-full clay-pill flex items-center justify-center font-serif text-sm font-bold text-[#1B254B] dark:text-[#F8FAFC]">
                  {pageNumber}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Dock Bar: Coret-Coretan (Markup) Toolbar docked below Mushaf (Ultra-slim, only icons, no text labels, ample space for Selesai) */}
        {isDrawingActive && (
          <div className="bg-white/95 dark:bg-[#182236]/95 px-2 sm:px-3 py-1 border-t border-black/[0.06] dark:border-white/[0.06] shrink-0 shadow-md sticky bottom-0 z-20 animate-in slide-in-from-bottom-2 select-none w-full overflow-hidden">
            <div className="flex items-center justify-between sm:justify-center gap-1.5 sm:gap-3 max-w-md mx-auto w-full">
              {/* Left: Stabilo (Default, Thick) vs Pena (Fine) Toggle - Pure icons without text */}
              <div className="flex items-center p-0.5 rounded-xl neumorph-inset gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setDrawingStrokeType('highlighter');
                    window.dispatchEvent(new CustomEvent('set-mushaf-drawing-type', { detail: { strokeType: 'highlighter' } }));
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                    drawingStrokeType === 'highlighter' ? 'bg-[#FF7E4A] text-white shadow-2xs' : 'text-[#5E6D88] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  title="Stabilo (Tebal & Transparan)"
                  aria-label="Stabilo"
                >
                  <Highlighter className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDrawingStrokeType('pen');
                    window.dispatchEvent(new CustomEvent('set-mushaf-drawing-type', { detail: { strokeType: 'pen' } }));
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                    drawingStrokeType === 'pen' ? 'bg-[#FF7E4A] text-white shadow-2xs' : 'text-[#5E6D88] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  title="Pena (Garis Halus)"
                  aria-label="Pena"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {/* Center: Color Presets */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-1 sm:px-2.5 border-x border-black/[0.08] dark:border-white/[0.08] shrink-0">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setDrawingColor(p.color);
                      window.dispatchEvent(new CustomEvent('set-mushaf-drawing-color', { detail: { color: p.color } }));
                    }}
                    style={{ backgroundColor: p.color }}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer shadow-xs ${
                      drawingColor === p.color
                        ? 'scale-125 ring-2 ring-white dark:ring-slate-900 ring-offset-2 ring-offset-[#FF6F3D]/60'
                        : 'opacity-70 hover:opacity-100 hover:scale-110'
                    }`}
                    title={p.label}
                    aria-label={p.label}
                  />
                ))}
              </div>

              {/* Right: Undo, Clear & Dedicated Selesai Button */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('mushaf-drawing-undo'))}
                  className="p-1.5 rounded-lg neumorph-card text-[#5E6D88] hover:text-[#18234A] dark:hover:text-white transition-colors cursor-pointer"
                  title="Undo Coretan"
                  aria-label="Undo Coretan"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('mushaf-drawing-clear'))}
                  className="p-1.5 rounded-lg neumorph-card text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Hapus Semua Coretan"
                  aria-label="Hapus Semua Coretan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawingActive(false);
                    window.dispatchEvent(new CustomEvent('toggle-mushaf-drawing', {
                      detail: { pageNumber, enabled: false }
                    }));
                  }}
                  className="h-7 px-2.5 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0 ml-0.5 sm:ml-1"
                  title="Selesai Coret"
                  aria-label="Selesai Coret"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                  <span>Selesai</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Audio Dock Bar (Bilah Rekam Suara & Pemutar Audio Ringkas) */}
        {!hideAudioDock && !minimal && isAudioDockOpen && (
          <div className="bg-white/95 dark:bg-[#182236]/95 px-2.5 sm:px-4 py-1 sm:py-1.5 border-t border-black/[0.04] dark:border-white/[0.04] shrink-0 shadow-md sticky bottom-0 z-20 animate-in slide-in-from-bottom-2">
            <AudioRecorderPlayer 
              itemId={pageNumber}
              itemType="quran"
              itemLabel={`Hal ${pageNumber}`}
              language="id" 
              variant="mushaf-dock" 
              compact={true}
              onHasRecordingChange={(has) => setHasAudioRecording(has)}
              onRecordingStateChange={(rec) => setIsAudioRecording(rec)}
              onClose={() => setIsAudioDockOpen(false)}
              onOpenFeedback={onOpenFeedback ? () => onOpenFeedback(pageNumber) : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
};
