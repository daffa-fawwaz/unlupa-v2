import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, Folder, CheckCircle2, AlertCircle, FileText, ChevronDown, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageDocument, ContentBlock } from '../../types';
import { BlockEditor } from './blocks/BlockEditor';

interface PageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  chapterId?: string | null;
  initialData?: PageDocument | null;
}

export const PageEditorModal: React.FC<PageEditorModalProps> = ({
  isOpen, onClose, bookId, chapterId, initialData
}) => {
  const { createPage, updatePage, deletePage, books, chapters, language } = useApp();
  const [title, setTitle] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(chapterId || null);
  const [isChapterMenuOpen, setIsChapterMenuOpen] = useState(false);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const currentBook = books.find(b => b.id === bookId);
  const bookChapters = chapters.filter(c => c.bookId === bookId);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setBlocks(initialData.blocks || []);
        setSelectedChapterId(initialData.chapterId || null);
      } else {
        setTitle('');
        setBlocks([]);
        setSelectedChapterId(chapterId || null);
      }
      setErrorMessage(null);
      setIsSavedRecently(false);
      setShowDeleteConfirm(false);
      setIsChapterMenuOpen(false);
      
      setTimeout(() => {
        if (!initialData?.title) {
          titleInputRef.current?.focus();
        }
      }, 100);
    }
  }, [initialData, isOpen, chapterId]);

  // Keyboard shortcut Ctrl+S or Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, title, blocks, selectedChapterId, initialData]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage(language === 'en' ? 'Please enter a title for the material.' : 'Mohon masukkan judul untuk materi ini.');
      titleInputRef.current?.focus();
      return;
    }

    setErrorMessage(null);

    if (initialData) {
      updatePage(initialData.id, {
        title: trimmedTitle,
        blocks,
        chapterId: selectedChapterId || null,
      });
    } else {
      createPage({
        bookId,
        chapterId: selectedChapterId || undefined,
        title: trimmedTitle,
        blocks,
      });
    }

    setIsSavedRecently(true);
    setTimeout(() => {
      onClose();
    }, 250);
  };

  const confirmDelete = () => {
    if (!initialData) return;
    deletePage(initialData.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const rootChapters = bookChapters.filter(c => !c.parentId);
  const getSubchapters = (parentId: string) => bookChapters.filter(c => c.parentId === parentId);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="clay-modal w-full max-w-5xl h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="h-16 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl clay-icon-pod-emerald flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#18234A] dark:text-[#F8FAFC] truncate">
                {initialData ? (language === 'en' ? 'Edit Material' : 'Edit Materi Pembelajaran') : (language === 'en' ? 'New Material' : 'Materi Pembelajaran Baru')}
              </h2>
              <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8] truncate mt-0.5 font-medium">
                {currentBook?.title ? `Buku: ${currentBook.title}` : 'Materi Pembelajaran'} • {blocks.length} Blok
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {initialData && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-9 h-9 rounded-2xl clay-card-subtle text-rose-500 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                title={language === 'en' ? 'Delete Material' : 'Hapus Materi'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button 
              type="button"
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95 ${
                isSavedRecently 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'clay-btn-primary text-white'
              }`}
            >
              {isSavedRecently ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Save className="w-4 h-4 text-white" />}
              <span>{isSavedRecently ? (language === 'en' ? 'Saved!' : 'Tersimpan!') : (language === 'en' ? 'Save Material' : 'Simpan Materi')}</span>
            </button>

            <button 
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-2xl clay-icon-pod-neutral flex items-center justify-center text-[#5E6D88] hover:text-[#18234A] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Validation Error Banner */}
        {errorMessage && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900/50 px-6 py-2.5 flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300 animate-in slide-in-from-top-2 duration-150">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-7 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6 pb-28">
            
            {/* Metadata Card: Title & Chapter Picker */}
            <div className="p-5 sm:p-6 rounded-3xl clay-card space-y-4">
              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-[#5E6D88] dark:text-[#94A3B8] uppercase tracking-wider mb-2">
                  Judul Materi Pembelajaran *
                </label>
                <input 
                  ref={titleInputRef}
                  type="text"
                  placeholder={language === 'en' ? 'e.g. Kaidah Pembagian Fi\'il, Rukun Wudhu, etc...' : 'Misal: Kaidah Pembagian Fi\'il, Rukun Wudhu, Pengantar Tajwid...'}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full text-base sm:text-lg font-bold clay-inset px-4 py-3 rounded-2xl text-[#18234A] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#FF6F3D]/30 placeholder:text-[#8493AB] transition-all shadow-inner"
                />
              </div>

              {/* Chapter Custom Dropdown Popover */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#5E6D88] dark:text-[#94A3B8] shrink-0">
                  <Folder className="w-4 h-4 text-[#FF6F3D]" />
                  <span>Ditempatkan di Bab / Subbab:</span>
                </div>

                <div className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => setIsChapterMenuOpen(!isChapterMenuOpen)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl clay-card-subtle text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] transition-all cursor-pointer shadow-xs"
                  >
                    <span className="truncate">
                      {selectedChapterId
                        ? (bookChapters.find(c => c.id === selectedChapterId)?.title || 'Bab Terpilih')
                        : 'Tanpa Bab (Materi Umum Buku)'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#5E6D88] transition-transform ${isChapterMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isChapterMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsChapterMenuOpen(false)} />
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-64 overflow-y-auto rounded-2xl clay-card p-2 shadow-2xl border border-black/[0.06] dark:border-white/[0.1] space-y-1 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedChapterId(null);
                            setIsChapterMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            selectedChapterId === null
                              ? 'clay-btn-primary text-white shadow-2xs'
                              : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#18234A] dark:text-[#F8FAFC]'
                          }`}
                        >
                          <span>Tanpa Bab (Materi Umum Buku)</span>
                          {selectedChapterId === null && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                        </button>

                        {rootChapters.map((chap) => {
                          const subs = getSubchapters(chap.id);
                          const isSelectedChap = selectedChapterId === chap.id;

                          return (
                            <React.Fragment key={chap.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedChapterId(chap.id);
                                  setIsChapterMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                  isSelectedChap
                                    ? 'clay-btn-primary text-white shadow-2xs'
                                    : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#18234A] dark:text-[#F8FAFC]'
                                }`}
                              >
                                <span>📁 {chap.title}</span>
                                {isSelectedChap && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                              </button>

                              {subs.map((sub) => {
                                const isSelectedSub = selectedChapterId === sub.id;
                                return (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedChapterId(sub.id);
                                      setIsChapterMenuOpen(false);
                                    }}
                                    className={`w-full text-left pl-6 pr-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                                      isSelectedSub
                                        ? 'clay-btn-primary text-white shadow-2xs'
                                        : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#5E6D88] dark:text-[#94A3B8]'
                                    }`}
                                  >
                                    <span>↳ 📄 {sub.title}</span>
                                    {isSelectedSub && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                                  </button>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Block Editor Area */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#18234A] dark:text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
                  <span>Isi Blok Konten ({blocks.length})</span>
                </h3>
                <span className="text-xs font-medium text-[#5E6D88] dark:text-[#94A3B8]">
                  Tekan <kbd className="px-1.5 py-0.5 rounded-lg clay-inset font-mono text-[10px] font-bold">Ctrl+S</kbd> untuk menyimpan
                </span>
              </div>

              <BlockEditor blocks={blocks} onChange={setBlocks} />
            </div>

          </div>
        </div>

      </div>

      {/* In-app Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="clay-modal w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 mx-auto flex items-center justify-center shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#18234A] dark:text-[#F8FAFC] mb-1">
                {language === 'en' ? 'Delete Material?' : 'Hapus Materi Pembelajaran?'}
              </h3>
              <p className="text-xs font-medium text-[#5E6D88] dark:text-[#94A3B8] leading-relaxed">
                {language === 'en' 
                  ? `Are you sure you want to delete "${initialData?.title}"? This action cannot be undone.` 
                  : `Yakin ingin menghapus "${initialData?.title}"? Seluruh blok di dalamnya akan dihapus.`}
              </p>
            </div>
            <div className="flex gap-2.5 justify-center pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-2xl clay-card-subtle font-bold text-xs text-[#5E6D88] hover:text-[#18234A] transition-all cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
              >
                {language === 'en' ? 'Yes, Delete' : 'Ya, Hapus Materi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
