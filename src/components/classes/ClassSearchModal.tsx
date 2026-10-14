import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Users, BookOpen, BookMarked, ArrowRight, Copy, Check } from 'lucide-react';
import { ClassGroup, Language } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  classes: ClassGroup[];
  onSelectClass: (classGroup: ClassGroup) => void;
}

export const ClassSearchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  language,
  classes,
  onSelectClass
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'quran' | 'non-quran'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
      setFilterType('all');
      setCopiedCode(null);
    }
  }, [isOpen]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    return classes.filter(c => {
      if (filterType !== 'all' && c.type !== filterType) return false;
      if (!q) return true;

      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const codeMatch = (c.code || '').toLowerCase().includes(q);
      const descMatch = (c.description || '').toLowerCase().includes(q);
      const teacherMatch = (c.teacherName || '').toLowerCase().includes(q);

      return nameMatch || codeMatch || descMatch || teacherMatch;
    });
  }, [classes, query, filterType]);

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl clay-icon-pod-orange text-white flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'en' ? 'Search Teaching Classes' : 'Pencarian Kelas Mengajar'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'Quickly find classes by title, code, or santri' : 'Cari kelas berdasarkan judul, kode, atau materi'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#FF6F3D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder={language === 'en' ? 'Type class name or code (e.g. Tahfidz, QRN-1234)...' : 'Ketik nama kelas atau kode (contoh: Halaqah, QRN-1234)...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 clay-inset rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'clay-btn-primary text-white'
                  : 'clay-pill text-slate-600 dark:text-slate-300'
              }`}
            >
              {language === 'en' ? 'All' : 'Semua'} ({classes.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('quran')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'quran'
                  ? 'clay-btn-primary text-white'
                  : 'clay-pill text-slate-600 dark:text-slate-300'
              }`}
            >
              <BookOpen className="w-3 h-3 inline mr-1" />
              {language === 'en' ? 'Quran' : "Al-Qur'an"} ({classes.filter(c => c.type === 'quran').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('non-quran')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'non-quran'
                  ? 'clay-btn-primary text-white'
                  : 'clay-pill text-slate-600 dark:text-slate-300'
              }`}
            >
              <BookMarked className="w-3 h-3 inline mr-1" />
              {language === 'en' ? 'Books' : 'Kitab'} ({classes.filter(c => c.type === 'non-quran').length})
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 sm:p-4 space-y-2 flex-1 scrollbar-thin">
          {searchResults.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2 text-slate-400">
              <Search className="w-8 h-8 mx-auto opacity-40 text-[#FF6F3D]" />
              <p className="text-sm font-semibold">
                {language === 'en' ? 'No class matches your search' : 'Tidak ada kelas yang cocok'}
              </p>
              <p className="text-xs">
                {language === 'en' ? 'Check the spelling or try searching by class code' : 'Periksa kembali ejaan atau gunakan kode kelas'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map(c => {
                const isQuran = c.type === 'quran';
                const studentCount = c.students?.length || 0;

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectClass(c);
                      onClose();
                    }}
                    className="p-3 rounded-2xl clay-card-subtle text-left flex items-center justify-between hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isQuran 
                          ? 'clay-icon-pod-emerald text-white' 
                          : 'clay-icon-pod-orange text-white'
                      }`}>
                        {isQuran ? <BookOpen className="w-5 h-5" /> : <BookMarked className="w-5 h-5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {c.name}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isQuran 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {isQuran ? "Al-Qur'an" : 'Kitab'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            {studentCount} {language === 'en' ? 'santri' : 'santri'}
                          </span>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(e, c.code)}
                            className="font-mono font-bold text-[#FF6F3D] hover:underline flex items-center gap-1 cursor-pointer"
                            title="Salin Kode Kelas"
                          >
                            <span>{c.code}</span>
                            {copiedCode === c.code ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-60 hover:opacity-100" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#FF6F3D] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
