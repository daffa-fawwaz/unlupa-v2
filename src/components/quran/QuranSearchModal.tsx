import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, BookOpen, Layers, ArrowRight, FileText, Hash } from 'lucide-react';
import { SURAH_LIST, JUZ_LIST, getJuzForPage } from '../../data/quranData';
import { QURAN_PAGES_METADATA, PageMetadata } from '../../data/quranPagesMetadata';
import { Language } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSelectJuz: (juzNumber: number) => void;
  onSelectPage?: (pageNumber: number) => void;
}

export const QuranSearchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  language,
  onSelectJuz,
  onSelectPage
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'page' | 'surah' | 'juz'>('page');
  const [visiblePageCount, setVisiblePageCount] = useState<number>(50);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset query on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setFilterType('page');
      setVisiblePageCount(50);
    }
  }, [isOpen]);

  // Selection handlers
  const handleSelectPage = (pageNumber: number) => {
    const juzNum = getJuzForPage(pageNumber);
    onSelectJuz(juzNum);
    if (onSelectPage) {
      onSelectPage(pageNumber);
    }
    onClose();
  };

  const handleSelectJuz = (juzNumber: number) => {
    onSelectJuz(juzNumber);
    onClose();
  };

  // Search logic
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const isNum = /^\d+$/.test(q);
    const parsedNum = isNum ? parseInt(q, 10) : null;

    // Matched Pages (Total 604)
    let matchedPages: PageMetadata[] = [];
    if (!q) {
      matchedPages = QURAN_PAGES_METADATA;
    } else if (parsedNum !== null) {
      // Prioritize exact page match first
      const exact = QURAN_PAGES_METADATA.find(p => p.pageNumber === parsedNum);
      const rest = QURAN_PAGES_METADATA.filter(p => {
        if (p.pageNumber === parsedNum) return false;
        return String(p.pageNumber).startsWith(q) || String(p.pageNumber).includes(q);
      });
      matchedPages = exact ? [exact, ...rest] : rest;
    } else {
      matchedPages = QURAN_PAGES_METADATA.filter(p => {
        const nameEnMatch = p.surahNameEn.toLowerCase().includes(q) || p.surahNameEn.replace(/['-]/g, '').toLowerCase().includes(q);
        const nameArMatch = p.surahNameAr.includes(q);
        const ayahMatch = p.ayahRange.toLowerCase().includes(q);
        return nameEnMatch || nameArMatch || ayahMatch;
      });
    }

    // Matched Surahs (Total 114)
    let matchedSurahs = SURAH_LIST;
    if (q) {
      matchedSurahs = SURAH_LIST.filter(s => {
        const numMatch = String(s.number) === q || String(s.number).startsWith(q);
        const nameEnMatch = s.nameEn.toLowerCase().includes(q) || s.nameEn.replace(/['-]/g, '').toLowerCase().includes(q);
        const nameArMatch = s.nameAr.includes(q);
        const transMatch = s.englishTranslation.toLowerCase().includes(q);
        const pageMatch = `hal ${s.startPage}`.includes(q) || `halaman ${s.startPage}`.includes(q);
        return numMatch || nameEnMatch || nameArMatch || transMatch || pageMatch;
      });
    }

    // Matched Juz (Total 30)
    let matchedJuz = JUZ_LIST;
    if (q) {
      matchedJuz = JUZ_LIST.filter(j => {
        const numMatch = String(j.juzNumber) === q || `juz ${j.juzNumber}`.includes(q) || `j.${j.juzNumber}`.includes(q);
        const nameEnMatch = j.nameEn.toLowerCase().includes(q);
        const nameArMatch = j.nameAr.includes(q);
        const spanMatch = j.surahSpan.toLowerCase().includes(q);
        return numMatch || nameEnMatch || nameArMatch || spanMatch;
      });
    }

    const exactPage = (parsedNum !== null && parsedNum >= 1 && parsedNum <= 604)
      ? QURAN_PAGES_METADATA[parsedNum - 1]
      : null;

    return {
      pages: matchedPages,
      surahs: matchedSurahs,
      juzList: matchedJuz,
      exactPage
    };
  }, [query]);

  if (!isOpen) return null;

  return (
    <div 
      data-no-swipe="true"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        id="quran-search-modal"
        className="neumorph-card w-full max-w-xl max-h-[88vh] rounded-3xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl"
      >
        {/* Header & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-black/[0.04] dark:border-white/[0.04] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(255,111,61,0.35)]">
                <Search className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#18234A] dark:text-[#F8FAFC] leading-tight">
                  {language === 'en' ? 'Quran Navigator' : 'Pencarian Al-Qur\'an'}
                </h3>
                <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-medium">
                  {language === 'en' 
                    ? '3 Groups: 604 Pages, 114 Surahs, or 30 Juz' 
                    : '3 Kelompok: 604 Halaman, 114 Surah, atau 30 Juz'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC] flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#FF6F3D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder={
                filterType === 'page'
                  ? (language === 'en' ? 'Type page number (1 - 604) or surah name...' : 'Ketik nomor halaman (1 - 604) atau nama surah...')
                  : filterType === 'surah'
                  ? (language === 'en' ? 'Type surah name or number (e.g. Al-Kahf, 36, Yasin)...' : 'Ketik nama surah atau nomor (contoh: Al-Kahf, 36, Yasin)...')
                  : (language === 'en' ? 'Type Juz number or name (e.g. 30, Juz 1, Amma)...' : 'Ketik nomor juz atau nama (contoh: 30, Juz 1, Amma)...')
              }
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisiblePageCount(50);
              }}
              className="w-full pl-10 pr-9 py-2.5 neumorph-inset rounded-2xl text-xs sm:text-sm text-[#18234A] dark:text-[#F8FAFC] placeholder:text-[#8493AB] focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8493AB] hover:text-[#18234A] p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 3 Main Groups: Halaman (604), Surah (114), Juz (30) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setFilterType('page');
                setVisiblePageCount(50);
              }}
              className={`py-2 px-1 sm:px-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center select-none ${
                filterType === 'page'
                  ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-[0_3px_8px_rgba(255,111,61,0.35)] scale-102'
                  : 'neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-102'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                {language === 'en' ? 'Pages' : 'Halaman'}
              </span>
              <span className="text-[10px] opacity-85 shrink-0 font-mono">
                ({searchResults.pages.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('surah')}
              className={`py-2 px-1 sm:px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center select-none ${
                filterType === 'surah'
                  ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-[0_3px_8px_rgba(255,111,61,0.35)] scale-102'
                  : 'neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-102'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                {language === 'en' ? 'Surahs' : 'Surah'}
              </span>
              <span className="text-[10px] opacity-85 shrink-0 font-mono">
                ({searchResults.surahs.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('juz')}
              className={`py-2 px-1 sm:px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center select-none ${
                filterType === 'juz'
                  ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-[0_3px_8px_rgba(255,111,61,0.35)] scale-102'
                  : 'neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-102'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                {language === 'en' ? 'Juz' : 'Juz'}
              </span>
              <span className="text-[10px] opacity-85 shrink-0 font-mono">
                ({searchResults.juzList.length})
              </span>
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 sm:p-4 space-y-2.5 flex-1 scrollbar-thin">
          {/* Exact Page Direct Jump Banner */}
          {filterType === 'page' && searchResults.exactPage && (
            <div className="mb-3 p-3 rounded-2xl neumorph-card bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-[#FF6F3D]/30 flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                  {searchResults.exactPage.pageNumber}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-[#18234A] dark:text-[#F8FAFC] truncate">
                      {language === 'en' ? `Jump to Page ${searchResults.exactPage.pageNumber}` : `Lompat ke Halaman ${searchResults.exactPage.pageNumber}`}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FF6F3D] text-white font-bold shrink-0">
                      {language === 'en' ? 'Direct Match' : 'Tepat'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] truncate font-medium">
                    {searchResults.exactPage.surahNameEn} • Juz {searchResults.exactPage.juzNumber} ({searchResults.exactPage.ayahRange})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectPage(searchResults.exactPage!.pageNumber)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white text-xs font-bold flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 shadow-2xs"
              >
                <span>{language === 'en' ? 'Open' : 'Buka'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 1. Kelompok Halaman (604 Halaman) */}
          {filterType === 'page' && (
            <>
              {searchResults.pages.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2 text-[#8493AB]">
                  <FileText className="w-8 h-8 mx-auto opacity-40 text-[#FF6F3D]" />
                  <p className="text-sm font-bold text-[#18234A] dark:text-[#F8FAFC]">
                    {language === 'en' ? 'No page found matching search' : 'Tidak ditemukan halaman yang cocok'}
                  </p>
                  <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8]">
                    {language === 'en' ? 'Type a page number from 1 to 604 or surah name' : 'Ketik nomor halaman antara 1 hingga 604 atau nama surah'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[#5E6D88] dark:text-[#94A3B8] uppercase tracking-wider px-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-[#FF6F3D]" />
                      <span>{language === 'en' ? 'Quran Pages' : 'Daftar Halaman'} ({searchResults.pages.length})</span>
                    </div>
                    {!query && (
                      <span className="text-[10px] text-[#8493AB] lowercase font-normal">
                        {language === 'en' ? `showing ${Math.min(visiblePageCount, searchResults.pages.length)} of 604` : `menampilkan ${Math.min(visiblePageCount, searchResults.pages.length)} dari 604`}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchResults.pages.slice(0, query ? 100 : visiblePageCount).map(p => (
                      <button
                        key={`page-${p.pageNumber}`}
                        type="button"
                        onClick={() => handleSelectPage(p.pageNumber)}
                        className="p-2.5 rounded-2xl neumorph-card text-left flex items-center justify-between hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl neumorph-inset text-[#FF6F3D] font-black text-xs flex items-center justify-center shrink-0">
                            {p.pageNumber}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] group-hover:text-[#FF6F3D] transition-colors truncate">
                                {language === 'en' ? `Page ${p.pageNumber}` : `Hal. ${p.pageNumber}`}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md neumorph-inset text-[#5E6D88] dark:text-[#94A3B8] font-bold shrink-0">
                                Juz {p.juzNumber}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#5E6D88] dark:text-[#94A3B8] truncate font-medium">
                              {p.surahNameEn} ({p.ayahRange})
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#8493AB] group-hover:text-[#FF6F3D] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>

                  {/* Load More Button for Halaman */}
                  {!query && visiblePageCount < searchResults.pages.length && (
                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setVisiblePageCount(prev => Math.min(prev + 50, 604))}
                        className="px-4 py-2 rounded-2xl neumorph-card text-xs font-bold text-[#FF6F3D] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        {language === 'en' ? 'Show Next 50 Pages...' : 'Tampilkan 50 Halaman Berikutnya...'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* 2. Kelompok Surah (114 Surah) */}
          {filterType === 'surah' && (
            <>
              {searchResults.surahs.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2 text-[#8493AB]">
                  <BookOpen className="w-8 h-8 mx-auto opacity-40 text-[#FF6F3D]" />
                  <p className="text-sm font-bold text-[#18234A] dark:text-[#F8FAFC]">
                    {language === 'en' ? 'No Surah matched your search' : 'Tidak ditemukan Surah yang cocok'}
                  </p>
                  <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8]">
                    {language === 'en' ? 'Try searching by number, Arabic or English name' : 'Coba cari dengan nomor atau ejaan nama lain'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-[11px] font-bold text-[#5E6D88] dark:text-[#94A3B8] uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-[#FF6F3D]" />
                    <span>{language === 'en' ? 'Surah List' : 'Daftar Surah'} ({searchResults.surahs.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchResults.surahs.map(s => {
                      const juzOfSurah = getJuzForPage(s.startPage);
                      return (
                        <button
                          key={`surah-${s.number}`}
                          type="button"
                          onClick={() => {
                            handleSelectPage(s.startPage);
                          }}
                          className="p-2.5 rounded-2xl neumorph-card text-left flex items-center justify-between hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl neumorph-inset text-[#FF6F3D] font-bold text-xs flex items-center justify-center shrink-0">
                              {s.number}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] group-hover:text-[#FF6F3D] transition-colors truncate">
                                  {s.nameEn}
                                </span>
                                <span className="text-xs font-arabic text-[#8493AB] shrink-0">
                                  {s.nameAr}
                                </span>
                              </div>
                              <div className="text-[10px] text-[#5E6D88] dark:text-[#94A3B8] truncate font-medium">
                                {s.englishTranslation} • Juz {juzOfSurah} (Hal. {s.startPage})
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            <span className="text-[10px] text-[#8493AB] font-mono">
                              {s.ayahsCount} ay.
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#8493AB] group-hover:text-[#FF6F3D] group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 3. Kelompok Juz (30 Juz) */}
          {filterType === 'juz' && (
            <>
              {searchResults.juzList.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2 text-[#8493AB]">
                  <Layers className="w-8 h-8 mx-auto opacity-40 text-[#FF6F3D]" />
                  <p className="text-sm font-bold text-[#18234A] dark:text-[#F8FAFC]">
                    {language === 'en' ? 'No Juz matched your search' : 'Tidak ditemukan Juz yang cocok'}
                  </p>
                  <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8]">
                    {language === 'en' ? 'Type a Juz number from 1 to 30' : 'Ketik nomor Juz antara 1 sampai 30'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-[11px] font-bold text-[#5E6D88] dark:text-[#94A3B8] uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-[#FF6F3D]" />
                    <span>{language === 'en' ? 'Juz List' : 'Daftar Juz'} ({searchResults.juzList.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchResults.juzList.map(j => (
                      <button
                        key={`juz-${j.juzNumber}`}
                        type="button"
                        onClick={() => handleSelectJuz(j.juzNumber)}
                        className="p-2.5 rounded-2xl neumorph-card text-left flex items-center justify-between hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {j.juzNumber}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] group-hover:text-[#FF6F3D] transition-colors truncate">
                              Juz {j.juzNumber} • {j.nameEn}
                            </div>
                            <div className="text-[10px] text-[#5E6D88] dark:text-[#94A3B8] truncate font-medium">
                              {j.surahSpan} (Hal. {j.startPage}–{j.endPage})
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#8493AB] group-hover:text-[#FF6F3D] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
