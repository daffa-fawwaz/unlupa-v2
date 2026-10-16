import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { LibraryEntry } from '../../data/sampleBooks';
import { BilingualCardText } from '../common/BilingualCardText';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { soundEffects } from '../../lib/soundFeedback';
import { 
  X, 
  Search, 
  Download, 
  Star, 
  CheckCircle2, 
  BookOpen, 
  Layers, 
  ShieldCheck,
  Tag,
  Eye,
  ArrowRight,
  Folder,
  Sparkles,
  HelpCircle,
  FileText,
  SlidersHorizontal,
  Check,
  ExternalLink,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LibraryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { 
    library, 
    books, 
    importFromLibrary, 
    duplicateBookAsEditable, 
    language, 
    setActiveSpace,
    isBookPurchased,
    openCheckoutModal,
    refreshLibraryFromBackend,
  } = useApp();

  useEffect(() => {
    if (isOpen && typeof refreshLibraryFromBackend === 'function') {
      refreshLibraryFromBackend();
    }
  }, [isOpen, refreshLibraryFromBackend]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'cards' | 'newest'>('popular');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState<boolean>(false);
  const [previewEntry, setPreviewEntry] = useState<LibraryEntry | null>(null);
  const [previewSelectedChapterId, setPreviewSelectedChapterId] = useState<string | null>(null);
  const [justImportedId, setJustImportedId] = useState<string | null>(null);

  useSwipeGesture(null, {
    disabled: !isOpen,
    onSwipeRight: () => {
      if (previewEntry) {
        setPreviewEntry(null);
        return;
      }
      soundEffects.playCardFlip('backward');
      onClose();
    },
    onSwipeDown: () => {
      if (previewEntry) {
        setPreviewEntry(null);
        return;
      }
      soundEffects.playSoftClick();
      onClose();
    },
    threshold: 40,
    minRatio: 1.15,
  });

  if (!isOpen) return null;

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const categories = [
    { id: 'All', label: language === 'en' ? 'All Books' : 'Semua Kitab' },
    { id: 'Bahasa Arab', label: language === 'en' ? 'Arabic Language' : 'Bahasa Arab' },
    { id: 'Tajwid & Al-Qur\'an', label: language === 'en' ? 'Tajweed & Quran' : 'Tajwid & Al-Qur\'an' },
    { id: 'Hadits & Sunnah', label: language === 'en' ? 'Hadith Studies' : 'Hadits & Sunnah' },
    { id: 'Dzikir & Doa', label: language === 'en' ? 'Dhikr & Du\'a' : 'Dzikir & Doa' },
    { id: 'Umum & Akademik', label: language === 'en' ? 'General & Academic' : 'Umum & Akademik' },
  ];

  // Filtering & Sorting
  const filteredEntries = library
    .filter(entry => {
      const matchCategory = selectedCategory === 'All' || entry.book.category === selectedCategory;
      const matchSearch = 
        (entry.book?.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (entry.book?.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (entry.curator || '').toLowerCase().includes(search.toLowerCase()) ||
        (entry.book?.authorName || '').toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return (b.downloads || 0) - (a.downloads || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'cards') return (b.items?.length || 0) - (a.items?.length || 0);
      if (sortBy === 'newest') return new Date(b.book.createdAt || 0).getTime() - new Date(a.book.createdAt || 0).getTime();
      return 0;
    });

  const handleImport = (entry: LibraryEntry) => {
    importFromLibrary(entry.id);
    setJustImportedId(entry.id);
    setTimeout(() => {
      setJustImportedId(null);
    }, 2500);
  };

  const selectedPreviewChapterCards = previewEntry
    ? (previewSelectedChapterId
        ? previewEntry.items.filter(i => i.chapterId === previewSelectedChapterId)
        : previewEntry.items)
    : [];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="clay-card w-full max-w-5xl rounded-3xl shadow-2xl border border-black/[0.04] dark:border-white/[0.06] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-4 border-b border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between bg-[#FAFBFC]/80 dark:bg-[#141C2B]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl clay-icon-pod-orange flex items-center justify-center shrink-0 shadow-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-[#18234A] dark:text-[#F8FAFC] tracking-tight">
                  {language === 'en' ? 'Public Knowledge Library' : 'Pustaka Kitab & Kurasi Publik'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold clay-badge-orange text-white shadow-2xs">
                  {library.length} {language === 'en' ? 'Curated Books' : 'Kitab Tersedia'}
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5 font-medium">
                {language === 'en'
                  ? 'Curated knowledge books ready to import.'
                  : 'Koleksi kitab terkurasi siap dipelajari.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-xl clay-pill flex items-center justify-center text-[#18234A] dark:text-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter & Controls Bar: Search Input + Sort Dropdown Side-by-Side strictly in 1 Row */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-black/[0.03] dark:border-white/[0.04] bg-[#FAFBFC]/60 dark:bg-[#141C2B]/60 shrink-0">
          <div className="flex items-center gap-2.5 w-full">
            {/* Search Input in Clay Inset (Left ~3/4 width) */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search kitab title, author, or topic...' : 'Cari judul kitab, pengarang, materi...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-2xl clay-inset text-xs sm:text-sm text-[#18234A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#F27A3D]/30 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#18234A] dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Custom Sort Selector Dropdown (Right ~1/4 width) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                className="flex items-center gap-1.5 clay-pill px-3 py-2 text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] hover:text-[#F27A3D] transition-all cursor-pointer shadow-2xs whitespace-nowrap"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#F27A3D] shrink-0" />
                <span className="truncate">
                  {sortBy === 'popular'
                    ? (language === 'en' ? 'Most Popular' : 'Terpopuler')
                    : sortBy === 'rating'
                    ? (language === 'en' ? 'Highest Rated' : 'Rating')
                    : sortBy === 'cards'
                    ? (language === 'en' ? 'Most Cards' : 'Kartu')
                    : (language === 'en' ? 'Newest' : 'Terbaru')}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] transition-transform shrink-0 ${isSortMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSortMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSortMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-2xl clay-card p-2 shadow-2xl border border-black/[0.06] dark:border-white/[0.1] space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    {[
                      { id: 'popular', labelEn: 'Most Popular', labelId: 'Terpopuler' },
                      { id: 'rating', labelEn: 'Highest Rated', labelId: 'Rating Tertinggi' },
                      { id: 'cards', labelEn: 'Most Cards', labelId: 'Jumlah Kartu' },
                      { id: 'newest', labelEn: 'Recently Added', labelId: 'Terbaru' },
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSortBy(item.id as any);
                          setIsSortMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          sortBy === item.id
                            ? 'clay-pill text-[#F27A3D] font-extrabold shadow-2xs'
                            : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#18234A] dark:text-[#F8FAFC]'
                        }`}
                      >
                        <span>{language === 'en' ? item.labelEn : item.labelId}</span>
                        {sortBy === item.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#F27A3D] shrink-0" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#FAFBFC]/40 dark:bg-[#141C2B]/40 border-b border-black/[0.03] dark:border-white/[0.04] flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'clay-badge-orange text-white shadow-2xs scale-102'
                    : 'clay-pill text-[#64748B] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Main Content: Catalog Grid or Empty */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-16 px-4">
              <BookOpen className="w-12 h-12 text-[#94A3B8] dark:text-slate-700 mx-auto mb-3" />
              <h4 className="font-bold text-[#18234A] dark:text-[#F8FAFC] text-base">
                {language === 'en' ? 'No books found' : 'Tidak ada kitab yang cocok'}
              </h4>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-sm mx-auto font-medium">
                {language === 'en' 
                  ? 'Try searching with different keywords or switch the category filter.' 
                  : 'Coba gunakan kata kunci lain atau pilih kategori kitab yang berbeda.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map(entry => {
                const isAlreadyImported = books.some(b => b.title === entry.book.title);
                const isJustImported = justImportedId === entry.id;
                const isPurchased = isBookPurchased(entry.id, entry.book);
                const isPaid = (entry.book.price || 0) > 0;

                return (
                  <div
                    key={entry.id}
                    className="clay-card-subtle p-4 rounded-2xl transition-all hover:-translate-y-1.5 flex flex-col justify-between group select-none cursor-pointer"
                  >
                    <div>
                      {/* Cover & Header Info */}
                      <div className="flex items-start gap-3">
                        {/* 3D Standing Hardcover Book Cover Frame */}
                        <div className="relative w-20 h-28 rounded-r-[3px] rounded-l-[1px] overflow-hidden shadow-md border-l-[4px] border-l-slate-900/60 shrink-0 bg-slate-900">
                          <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/40 via-white/20 to-transparent pointer-events-none z-20" />
                          {entry.book.coverUrl ? (
                            <img
                              src={entry.book.coverUrl}
                              alt={entry.book.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-amber-200/80 bg-gradient-to-br from-emerald-950 to-slate-950 p-1 text-center">
                              <BookOpen className="w-6 h-6 text-amber-400" />
                            </div>
                          )}
                          <div className="absolute top-1 left-1 z-20">
                            <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold">
                              {entry.chapters?.length || 1} Bab
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full clay-pill text-[#B45309] dark:text-amber-300 text-[10px] font-extrabold">
                              {entry.book.category}
                            </span>
                            
                            {/* Price / Free Badge */}
                            {isPaid ? (
                              <span className="px-2.5 py-0.5 rounded-full clay-badge-orange text-white text-[10px] font-extrabold shadow-2xs">
                                {formatIDR(entry.book.price || 0)}
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full clay-badge-emerald text-white text-[10px] font-extrabold shadow-2xs">
                                Gratis
                              </span>
                            )}

                            {entry.verified && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-extrabold" title="Kurasi Resmi Terverifikasi">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>Kurasi Resmi</span>
                              </span>
                            )}
                          </div>

                          <h4 
                            title={entry.book.title}
                            className="font-extrabold text-sm sm:text-base text-[#18234A] dark:text-[#F8FAFC] leading-snug line-clamp-2 group-hover:text-[#F27A3D] transition-colors"
                          >
                            {entry.book.title}
                          </h4>

                          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium mt-1 truncate">
                            {entry.book.authorName}
                          </p>

                          {/* Stats Badge */}
                          <div className="flex items-center gap-2 mt-2.5 text-xs text-[#64748B] dark:text-[#94A3B8] font-bold">
                            <span className="flex items-center gap-1 text-amber-500 font-black">
                              <Star className="w-3.5 h-3.5 fill-amber-500" />
                              {entry.rating}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1" title="Jumlah unduhan">
                              <Download className="w-3.5 h-3.5 text-[#94A3B8]" />
                              {(entry.downloads || 0).toLocaleString()}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1" title="Jumlah kartu hafalan">
                              <Layers className="w-3.5 h-3.5 text-[#94A3B8]" />
                              {entry.items?.length || 0} kartu
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium mt-3 line-clamp-2 leading-relaxed">
                        {entry.book.description}
                      </p>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-4 pt-3 border-t border-black/[0.03] dark:border-white/[0.04] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewEntry(entry);
                          setPreviewSelectedChapterId(null);
                        }}
                        className="px-3 py-1.5 rounded-xl clay-pill text-[#18234A] dark:text-[#F8FAFC] text-xs font-bold flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#64748B]" />
                        <span>{language === 'en' ? 'Preview' : 'Intip Isi'}</span>
                      </button>

                      {isJustImported ? (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl clay-badge-emerald text-white text-xs font-extrabold animate-in fade-in shadow-2xs">
                          <Check className="w-4 h-4 text-white" />
                          <span>{language === 'en' ? 'Installed!' : 'Berhasil Dipasang!'}</span>
                        </span>
                      ) : isAlreadyImported ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10B981]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                            {language === 'en' ? 'Installed' : 'Sudah Ada'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleImport(entry)}
                            className="px-2.5 py-1 rounded-lg clay-pill text-[#F27A3D] text-[10px] font-extrabold hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            title={language === 'en' ? 'Import again as fresh duplicate' : 'Pasang ulang sebagai salinan baru'}
                          >
                            + Salin
                          </button>
                        </div>
                      ) : !isPurchased && isPaid ? (
                        <button
                          type="button"
                          onClick={() => openCheckoutModal(entry)}
                          className="px-3.5 py-1.5 rounded-xl clay-btn-primary text-white font-extrabold text-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <span>Beli ({formatIDR(entry.book.price || 0)})</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleImport(entry)}
                          className="px-3.5 py-1.5 rounded-xl clay-btn-primary text-white font-extrabold text-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? '1-Click Import' : 'Pasang Kitab'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detailed Book Preview Modal (Deep Inspection & Sample Cards) */}
        {previewEntry && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
            <div className="clay-card w-full max-w-3xl rounded-3xl shadow-2xl border border-black/[0.04] dark:border-white/[0.06] overflow-hidden flex flex-col max-h-[88vh]">
              
              {/* Preview Header */}
              <div className="p-4 sm:p-6 border-b border-black/[0.04] dark:border-white/[0.05] flex items-start justify-between gap-4 bg-[#FAFBFC]/80 dark:bg-[#141C2B]/80">
                <div className="flex items-start gap-4">
                  <img
                    src={previewEntry.book.coverUrl}
                    alt={previewEntry.book.title}
                    className="w-18 h-24 sm:w-20 sm:h-28 rounded-xl object-cover border border-slate-900/30 shadow-md shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2.5 py-0.5 rounded-full clay-badge-orange text-white text-xs font-extrabold">
                        {previewEntry.book.category}
                      </span>
                      {previewEntry.verified && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-extrabold">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Kurasi Resmi Unlupa</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-xl font-black text-[#18234A] dark:text-[#F8FAFC] leading-tight">
                      {previewEntry.book.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] font-medium mt-1">
                      {language === 'en' ? 'Author' : 'Pengarang'}: <strong>{previewEntry.book.authorName}</strong> • {language === 'en' ? 'Curated by' : 'Dikurasi oleh'} {previewEntry.curator}
                    </p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium mt-2 line-clamp-2 leading-relaxed">
                      {previewEntry.book.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewEntry(null)}
                  aria-label="Close Preview"
                  className="w-8 h-8 rounded-xl clay-pill flex items-center justify-center text-[#18234A] dark:text-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview Body: Chapters Filter & Sample Cards List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Chapter Selector Pills */}
                <div>
                  <h5 className="text-xs font-extrabold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-[#F27A3D]" />
                    <span>{language === 'en' ? 'Table of Contents' : 'Daftar Bab & Materi'} ({previewEntry.chapters?.length || 0})</span>
                  </h5>
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                    <button
                      onClick={() => setPreviewSelectedChapterId(null)}
                      className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                        previewSelectedChapterId === null
                          ? 'clay-badge-orange text-white shadow-2xs'
                          : 'clay-pill text-[#64748B] dark:text-[#94A3B8]'
                      }`}
                    >
                      {language === 'en' ? 'All Chapters' : 'Semua Bab'} ({previewEntry.items.length})
                    </button>
                    {(previewEntry.chapters || []).map(ch => {
                      const chCardCount = previewEntry.items.filter(i => i.chapterId === ch.id).length;
                      const isChSelected = previewSelectedChapterId === ch.id;
                      return (
                        <button
                          key={ch.id}
                          onClick={() => setPreviewSelectedChapterId(ch.id)}
                          className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                            isChSelected
                              ? 'clay-badge-orange text-white shadow-2xs'
                              : 'clay-pill text-[#64748B] dark:text-[#94A3B8]'
                          }`}
                        >
                          {ch.title} ({chCardCount})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cards Preview */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-xs font-extrabold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#F27A3D]" />
                    <span>{language === 'en' ? 'Sample Flashcards' : 'Sampel Kartu Q&A'} ({selectedPreviewChapterCards.length})</span>
                  </h5>

                  <div className="space-y-2.5">
                    {selectedPreviewChapterCards.map((card, idx) => (
                      <div
                        key={card.id || idx}
                        className="p-3.5 rounded-2xl clay-card-subtle space-y-2"
                      >
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full clay-badge-orange text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                            Q
                          </span>
                          <div className="text-xs sm:text-sm font-bold text-[#18234A] dark:text-[#F8FAFC] leading-relaxed flex-1">
                            <BilingualCardText text={card.question} type="question" variant="detail-modal" />
                          </div>
                        </div>

                        <div className="flex items-start gap-2 pt-2 border-t border-black/[0.03] dark:border-white/[0.04]">
                          <span className="w-5 h-5 rounded-full clay-badge-emerald text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                            A
                          </span>
                          <div className="text-xs sm:text-sm text-[#18234A] dark:text-[#F8FAFC] leading-relaxed flex-1 font-medium">
                            <BilingualCardText text={card.answer} type="answer" variant="detail-modal" />
                          </div>
                        </div>

                        {card.tags && card.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-1">
                            {card.tags.map((tag, tIdx) => (
                              <span key={tIdx} className="px-2 py-0.5 rounded-lg clay-pill text-[#64748B] dark:text-[#94A3B8] text-[10px] font-bold">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview Footer Action */}
              <div className="p-4 sm:p-6 border-t border-black/[0.04] dark:border-white/[0.05] bg-[#FAFBFC]/80 dark:bg-[#141C2B]/80 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewEntry(null)}
                  className="px-4 py-2 rounded-xl clay-pill text-[#18234A] dark:text-[#F8FAFC] text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  {language === 'en' ? 'Close Preview' : 'Tutup Pratinjau'}
                </button>

                {!isBookPurchased(previewEntry.id, previewEntry.book) && (previewEntry.book.price || 0) > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const entryToBuy = previewEntry;
                      setPreviewEntry(null);
                      openCheckoutModal(entryToBuy);
                    }}
                    className="px-5 py-2 rounded-xl clay-btn-primary text-white font-extrabold text-xs sm:text-sm shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Beli Kitab Ini ({formatIDR(previewEntry.book.price || 0)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleImport(previewEntry);
                      setPreviewEntry(null);
                    }}
                    className="px-5 py-2 rounded-xl clay-btn-primary text-white font-extrabold text-xs sm:text-sm shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{language === 'en' ? 'Import Full Kitab (1-Click)' : 'Pasang Seluruh Kitab (1-Klik)'}</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
