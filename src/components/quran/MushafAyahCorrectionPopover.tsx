import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Trash2, 
  Volume2, 
  Sparkles, 
  AlertTriangle, 
  Layers, 
  BookOpen, 
  Plus, 
  ChevronRight,
  Info
} from 'lucide-react';
import { PageIssue, Language } from '../../types';
import { 
  HIJAIYAH_LETTERS, 
  MAKHRAJ_MODIFIERS, 
  KELANCARAN_PRESETS, 
  TAJWID_CATEGORIES, 
  QUICK_NOTES,
  HijaiyahDetail 
} from './quranCorrectionPresets';

export interface PageAyahInfo {
  surahNumber: number;
  surahNameEn: string;
  surahNameAr: string;
  ayahNumber: number;
  verseKey: string; // e.g. "2:6"
  arabicText?: string;
  markerLine?: number; // 1 to 15 (Standard 15-line Madinah Mushaf - line where the ayah number circle appears)
  startLine?: number; // 1 to 15 (Standard 15-line Madinah Mushaf - start line of verse)
  endLine?: number; // 1 to 15 (Standard 15-line Madinah Mushaf - end line of verse)
}

interface MushafAyahCorrectionPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  pageNumber: number;
  activeAyah: PageAyahInfo | null;
  existingIssues: PageIssue[];
  onSaveIssue: (issue: Omit<PageIssue, 'id' | 'createdAt' | 'isResolved'>) => void;
  onResolveIssue: (issueId: string) => void;
  onDeleteIssue?: (issueId: string) => void;
  language: Language;
}

export const MushafAyahCorrectionPopover: React.FC<MushafAyahCorrectionPopoverProps> = ({
  isOpen,
  onClose,
  pageNumber,
  activeAyah,
  existingIssues,
  onSaveIssue,
  onResolveIssue,
  language
}) => {
  if (!isOpen || !activeAyah) return null;

  // Filter issues pertaining to this specific ayah (checking exact ayah string e.g. "6" or range "6-10" containing this ayah)
  const ayahNumberStr = String(activeAyah.ayahNumber);
  const matchedIssues = existingIssues.filter(issue => {
    if (issue.ayah === ayahNumberStr) return true;
    if (issue.ayah.includes('-')) {
      const [from, to] = issue.ayah.split('-').map(n => parseInt(n.trim(), 10));
      return activeAyah.ayahNumber >= from && activeAyah.ayahNumber <= to;
    }
    return false;
  });

  const unresolvedAyahIssues = matchedIssues.filter(i => !i.isResolved);
  const resolvedAyahIssues = matchedIssues.filter(i => i.isResolved);

  // Form State for quick single-click tagging
  const [issueType, setIssueType] = useState<PageIssue['type']>('tajwid');
  const [selectedDetail, setSelectedDetail] = useState<string>(TAJWID_CATEGORIES[0].options[0]);
  const [selectedTajwidCat, setSelectedTajwidCat] = useState<string>('mad');
  const [selectedLetter, setSelectedLetter] = useState<HijaiyahDetail>(HIJAIYAH_LETTERS[14]); // Default Dhad (ض)
  const [selectedModifier, setSelectedModifier] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [showManualNote, setShowManualNote] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'add' | 'list'>(unresolvedAyahIssues.length > 0 ? 'list' : 'add');

  // Handle Quick Tag Save
  const handleSave = () => {
    let resolvedDetail = selectedDetail;
    if (issueType === 'makharijul' && selectedLetter) {
      resolvedDetail = `${selectedLetter.ar} (${selectedLetter.latin}) - ${selectedDetail || selectedModifier || 'Makhraj Kurang Pas'}`;
    }

    onSaveIssue({
      ayah: ayahNumberStr,
      type: issueType,
      detail: resolvedDetail,
      note: note.trim() || undefined
    });

    // Reset & close or view list
    setNote('');
    setShowManualNote(false);
    setActiveTab('list');
  };

  const getCategoryLabel = (type: PageIssue['type']) => {
    switch (type) {
      case 'tajwid': return 'Tajwid';
      case 'makharijul': return 'Makhraj';
      case 'kelancaran': return language === 'en' ? 'Fluency' : 'Kelancaran';
      case 'lupa': return language === 'en' ? 'Forgot' : 'Lupa';
      default: return type;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="neumorph-card bg-[#FCFDFE] dark:bg-[#121A2A] text-slate-900 dark:text-slate-100 w-full max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl border border-white/80 dark:border-white/10 overflow-hidden flex flex-col max-h-[88vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Ribbon: Real Ayah Marker info */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex flex-col items-center justify-center font-black shadow-xs shrink-0">
              <span className="text-[8px] uppercase tracking-tighter opacity-80 leading-none">Ayat</span>
              <span className="text-sm leading-none mt-0.5">{activeAyah.ayahNumber}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-[#18234A] dark:text-[#F8FAFC] truncate">
                  {activeAyah.surahNameEn} • Ayat {activeAyah.ayahNumber}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-[#FF6F3D]">
                  Hal {pageNumber}
                </span>
              </div>
              <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] font-medium truncate">
                {language === 'en' ? 'Marking mistake on Mushaf' : 'Beri tanda kesalahan langsung di mushaf'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl neumorph-card flex items-center justify-center text-[#5E6D88] hover:text-[#18234A] dark:text-[#94A3B8] dark:hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Arabic Ayah Preview Banner if available */}
        {activeAyah.arabicText && (
          <div 
            className="px-5 py-3.5 bg-gradient-to-b from-amber-50/80 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/30 border-b border-amber-200/70 dark:border-amber-900/50 text-right font-arabic text-lg sm:text-xl text-amber-950 dark:text-amber-100 max-h-32 overflow-y-auto leading-[2.4] sm:leading-[2.5] tracking-wide select-text" 
            dir="rtl"
            style={{ fontFamily: "'Amiri Quran', 'Amiri', 'Scheherazade New', 'Traditional Arabic', serif", wordSpacing: '3px' }}
          >
            {activeAyah.arabicText}{' '}
            <span className="inline-flex items-center justify-center font-arabic text-amber-700 dark:text-amber-300 font-bold mx-1 select-none text-base">
              ۝{activeAyah.ayahNumber}
            </span>
          </div>
        )}

        {/* Tab Switcher if active mistakes exist */}
        {matchedIssues.length > 0 && (
          <div className="px-5 pt-3 pb-1 shrink-0">
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl neumorph-inset">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'list'
                    ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-2xs'
                    : 'text-[#5E6D88] dark:text-[#94A3B8]'
                }`}
              >
                <span>{language === 'en' ? 'Active Marks' : 'Tanda Kesalahan'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  activeTab === 'list' ? 'bg-white text-orange-600' : 'bg-orange-500 text-white'
                }`}>
                  {unresolvedAyahIssues.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('add')}
                className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'add'
                    ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-2xs'
                    : 'text-[#5E6D88] dark:text-[#94A3B8]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Add Mark' : 'Tambah Tanda Baru'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 min-h-0">
          {activeTab === 'list' && matchedIssues.length > 0 ? (
            /* LIST EXISTING ISSUES ON THIS AYAH */
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-[#5E6D88] dark:text-[#94A3B8] uppercase tracking-wider block">
                {language === 'en' ? 'Recorded on this Ayah:' : 'Catatan Kesalahan di Ayat Ini:'}
              </span>

              {unresolvedAyahIssues.length === 0 ? (
                <div className="text-center py-6 px-4 neumorph-card rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <p className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC]">
                    {language === 'en' ? 'All mistakes on this ayah resolved!' : 'Semua kesalahan pada ayat ini sudah diatasi / lancar!'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('add')}
                    className="mt-3 px-4 py-1.5 rounded-xl bg-orange-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Add Another Mark' : 'Beri Tanda Baru'}</span>
                  </button>
                </div>
              ) : (
                unresolvedAyahIssues.map(issue => (
                  <div 
                    key={issue.id} 
                    className="p-3.5 rounded-2xl neumorph-card border-l-4 border-rose-500 space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          issue.type === 'tajwid' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' 
                            : issue.type === 'makharijul'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {getCategoryLabel(issue.type)}
                        </span>
                        <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                          {language === 'en' ? 'Active Mistake' : 'Salah Baca'}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#8493AB]">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {issue.detail && (
                      <p className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] pl-1">
                        {issue.detail}
                      </p>
                    )}

                    {issue.note && (
                      <p className="text-[11px] italic text-[#5E6D88] dark:text-[#94A3B8] neumorph-inset p-2 rounded-xl">
                        "{issue.note}"
                      </p>
                    )}

                    <div className="pt-1 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onResolveIssue(issue.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-102 active:scale-95 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Solved / Fluent' : 'Tandai Sudah Benar'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Resolved History on this Ayah */}
              {resolvedAyahIssues.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-[#8493AB] uppercase tracking-wider block mb-1">
                    {language === 'en' ? 'Resolved History:' : 'Riwayat Telah Diperbaiki:'}
                  </span>
                  <div className="space-y-1.5 opacity-75">
                    {resolvedAyahIssues.map(issue => (
                      <div key={issue.id} className="p-2.5 rounded-xl neumorph-inset flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="font-medium text-[#5E6D88] dark:text-[#94A3B8] line-through">
                            {issue.detail || getCategoryLabel(issue.type)}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold">Lancar</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ADD NEW MISTAKE WITH ONE-TAP PRESETS */
            <div className="space-y-3.5">
              {/* Category Selector Tabs: Sleek, strictly in 1 horizontal row */}
              <div>
                <span className="text-[11px] font-black text-[#18234A] dark:text-[#F8FAFC] uppercase tracking-wider block mb-1.5">
                  1. {language === 'en' ? 'Select Issue Type:' : 'Jenis Kesalahan (1 Baris):'}
                </span>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl neumorph-inset">
                  {/* Tajwid */}
                  <button
                    type="button"
                    onClick={() => {
                      setIssueType('tajwid');
                      setSelectedDetail(TAJWID_CATEGORIES[0].options[0]);
                    }}
                    className={`py-1.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer text-center truncate ${
                      issueType === 'tajwid'
                        ? 'bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white shadow-xs scale-101 ring-1 ring-blue-400'
                        : 'text-[#18234A] dark:text-[#F8FAFC] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Hukum Tajwid
                  </button>

                  {/* Makhraj */}
                  <button
                    type="button"
                    onClick={() => {
                      setIssueType('makharijul');
                      const letter = selectedLetter || HIJAIYAH_LETTERS[14];
                      setSelectedLetter(letter);
                      setSelectedDetail(letter.commonErrors[0] || 'Makhraj Kurang Pas');
                    }}
                    className={`py-1.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer text-center truncate ${
                      issueType === 'makharijul'
                        ? 'bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-xs scale-101 ring-1 ring-emerald-400'
                        : 'text-[#18234A] dark:text-[#F8FAFC] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Makhraj Huruf
                  </button>

                  {/* Kelancaran (Lupa dihapus agar muat 1 baris) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIssueType('kelancaran');
                      setSelectedDetail(KELANCARAN_PRESETS[0].label);
                    }}
                    className={`py-1.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer text-center truncate ${
                      issueType === 'kelancaran'
                        ? 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white shadow-xs scale-101 ring-1 ring-amber-400'
                        : 'text-[#18234A] dark:text-[#F8FAFC] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Kelancaran
                  </button>
                </div>
              </div>

              {/* Sub-presets: Tajwid (Diurutkan dari yang paling sering salah: Mad -> Ghunnah -> Nun Mati -> Mim Mati -> Qalqalah -> Tebal/Tipis -> Waqaf) */}
              {issueType === 'tajwid' && (
                <div className="space-y-2 neumorph-inset p-3 rounded-2xl">
                  {/* Category Pills (Sorted: Mad, Ghunnah & Tasydid, Nun Mati, etc.) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {TAJWID_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedTajwidCat(cat.id);
                          setSelectedDetail(cat.options[0]);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black whitespace-nowrap cursor-pointer transition-all ${
                          selectedTajwidCat === cat.id
                            ? 'bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white shadow-xs scale-102'
                            : 'neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]'
                        }`}
                      >
                        {cat.title}
                      </button>
                    ))}
                  </div>

                  {/* Tajwid Specific Options */}
                  <div className="space-y-1.5 pt-1">
                    {TAJWID_CATEGORIES.find(c => c.id === selectedTajwidCat)?.options.map(opt => {
                      const isSelected = selectedDetail === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedDetail(opt)}
                          className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white shadow-xs font-black'
                              : 'neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-[1.01]'
                          }`}
                        >
                          <span className="leading-tight">{opt}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-presets: Makhraj Huruf & Sifat-Sifat Khusus */}
              {issueType === 'makharijul' && (
                <div className="space-y-2.5 neumorph-inset p-3 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                      Pilih Huruf Hijaiyah:
                    </span>
                    {selectedLetter && (
                      <span className="text-xs font-black text-emerald-800 dark:text-emerald-200 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        Huruf: <span className="font-arabic font-bold text-sm">{selectedLetter.ar}</span> ({selectedLetter.latin})
                      </span>
                    )}
                  </div>

                  {/* 28 Hijaiyah Grid */}
                  <div className="grid grid-cols-7 gap-1 p-1.5 rounded-xl neumorph-card justify-items-center">
                    {HIJAIYAH_LETTERS.map(letter => {
                      const isSelected = selectedLetter?.latin === letter.latin;
                      return (
                        <button
                          key={letter.latin}
                          type="button"
                          onClick={() => {
                            setSelectedLetter(letter);
                            setSelectedDetail(letter.commonErrors[0] || 'Makhraj Kurang Pas');
                          }}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer font-arabic text-lg sm:text-xl font-bold leading-none select-none ${
                            isSelected
                              ? 'bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-xs scale-110 ring-2 ring-emerald-400'
                              : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#18234A] dark:text-[#F8FAFC]'
                          }`}
                          title={`${letter.latin} - ${letter.makhraj}`}
                        >
                          {letter.ar}
                        </button>
                      );
                    })}
                  </div>

                  {/* Detailed Card for Selected Letter: Real Makhraj + Active Sifat + Tailored Errors */}
                  {selectedLetter && (
                    <div className="p-3 rounded-xl neumorph-card space-y-2 border border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20">
                      {/* Makhraj Location Info */}
                      <div className="flex items-start gap-1.5 text-[11px] text-[#18234A] dark:text-[#F8FAFC]">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">📍 Makhraj:</span>
                        <span className="leading-snug">{selectedLetter.makhraj}</span>
                      </div>

                      {/* Sifat-Sifat Huruf Asli (Hanya yang dimiliki huruf ini, tanpa sifat yang tidak ada) */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase block tracking-wider">
                          Sifat-Sifat Huruf {selectedLetter.latin} ({selectedLetter.ar}):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedLetter.sifat.map(s => (
                            <span 
                              key={s} 
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/25"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Tailored Common Errors for This Exact Letter */}
                      <div className="pt-1 space-y-1">
                        <span className="text-[10px] font-black text-[#5E6D88] dark:text-[#94A3B8] uppercase block tracking-wider">
                          Koreksi Masalah Khusus Huruf Ini (1-Klik):
                        </span>
                        <div className="space-y-1">
                          {selectedLetter.commonErrors.map(err => {
                            const isSelected = selectedDetail === err;
                            return (
                              <button
                                key={err}
                                type="button"
                                onClick={() => setSelectedDetail(err)}
                                className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-xs font-black'
                                    : 'neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-[1.01]'
                                }`}
                              >
                                <span className="leading-tight">{err}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Confusable Letters quick tags if any */}
                      {selectedLetter.confusableWith && selectedLetter.confusableWith.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] block mb-1">
                            Sering Tertukar Huruf:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedLetter.confusableWith.map(otherAr => {
                              const confLabel = `Tertukar Huruf ${otherAr}`;
                              const isSelected = selectedDetail === confLabel;
                              return (
                                <button
                                  key={otherAr}
                                  type="button"
                                  onClick={() => setSelectedDetail(confLabel)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'neumorph-card text-[#18234A] dark:text-[#F8FAFC]'
                                  }`}
                                >
                                  <span>Tertukar</span>
                                  <span className="font-arabic font-bold text-sm">{otherAr}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-presets: Kelancaran (Hierarki tersendat, mutasyabihat, tardid, dsb - tanpa blank total) */}
              {issueType === 'kelancaran' && (
                <div className="space-y-1.5 neumorph-inset p-3 rounded-2xl">
                  <span className="text-[10px] font-black text-[#D97706] dark:text-[#FBBF24] uppercase tracking-wider block mb-0.5">
                    Pilih Gejala Kelancaran:
                  </span>
                  {KELANCARAN_PRESETS.map(preset => {
                    const isSelected = selectedDetail === preset.label;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setSelectedDetail(preset.label)}
                        className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex flex-col justify-center ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white shadow-xs font-black'
                            : 'neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-[1.01]'
                        }`}
                      >
                        <span className="text-xs font-black leading-tight">{preset.label}</span>
                        <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/90' : 'text-[#5E6D88] dark:text-[#94A3B8]'}`}>
                          {preset.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Quick Notes (1-Click Insertion) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] uppercase">
                    Catatan Kilat (Opsional):
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowManualNote(!showManualNote)}
                    className="text-[10px] font-bold text-[#FF6F3D] hover:underline cursor-pointer"
                  >
                    {showManualNote ? 'Tutup Catatan Teks' : '+ Tulis Manual'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {QUICK_NOTES.map(qNote => {
                    const isSelected = note.includes(qNote);
                    return (
                      <button
                        key={qNote}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNote(prev => prev.replace(qNote, '').replace(/,\s*,/g, ',').trim());
                          } else {
                            setNote(prev => prev ? `${prev}, ${qNote}` : qNote);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-2xs'
                            : 'neumorph-card text-[#5E6D88] dark:text-[#94A3B8]'
                        }`}
                      >
                        {qNote}
                      </button>
                    );
                  })}
                </div>

                {showManualNote && (
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Catatan tambahan untuk santri / diri sendiri..."
                    className="w-full h-14 text-xs p-2.5 rounded-xl neumorph-inset text-[#18234A] dark:text-[#F8FAFC] focus:outline-none resize-none mt-1.5"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-black/[0.06] dark:border-white/[0.06] bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl neumorph-card text-xs font-bold text-[#5E6D88] hover:text-[#18234A] dark:text-[#94A3B8] dark:hover:text-white transition-all cursor-pointer"
          >
            {language === 'en' ? 'Close' : 'Tutup'}
          </button>

          {activeTab === 'add' && (
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_4px_12px_rgba(255,111,61,0.35)] cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4 text-white stroke-[2.5]" />
              <span>{language === 'en' ? 'Save Mark on Ayah' : 'Tempel Tanda di Mushaf'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
