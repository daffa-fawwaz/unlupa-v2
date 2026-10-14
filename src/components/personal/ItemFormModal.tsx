import React, { useState, useEffect, useRef } from 'react';
import { BookItem, Chapter, Language } from '../../types';
import { Image as ImageIcon, X, UploadCloud, BookOpen, ChevronDown, ChevronUp, FileText, Sparkles, Layers, Plus, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { uploadOrCompressImage } from '../../lib/imageUtils';
import { parseCardsFromText } from '../../lib/quick-card-parser';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { question: string; answer: string; explanation?: string; imageQ?: string; imageA?: string; chapterId?: string }, keepOpen?: boolean) => void;
  chapters: Chapter[];
  initialData?: Partial<BookItem>;
  initialChapterId?: string;
  language: Language;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen, onClose, onSubmit, chapters, initialData, initialChapterId, language
}) => {
  const [form, setForm] = useState({
    question: '',
    answer: '',
    explanation: '',
    imageQ: '',
    imageA: '',
    chapterId: ''
  });
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [uploadingField, setUploadingField] = useState<'imageQ' | 'imageA' | null>(null);

  const fileInputQ = useRef<HTMLInputElement>(null);
  const fileInputA = useRef<HTMLInputElement>(null);
  const explanationRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      const hasInitialExpl = Boolean(initialData?.explanation);
      setIsExplanationOpen(hasInitialExpl);
      setForm({
        question: initialData?.question || '',
        answer: initialData?.answer || '',
        explanation: initialData?.explanation || '',
        imageQ: initialData?.imageQ || '',
        imageA: initialData?.imageA || '',
        chapterId: initialData?.chapterId || initialChapterId || ''
      });
    }
  }, [isOpen, initialData, initialChapterId]);

  if (!isOpen) return null;

  const submitForm = (keepOpen: boolean) => {
    if (!form.question.trim() && !form.imageQ) return;
    if (!form.answer.trim() && !form.imageA) return;
    
    onSubmit({
      question: form.question,
      answer: form.answer,
      explanation: form.explanation.trim() || undefined,
      imageQ: form.imageQ || undefined,
      imageA: form.imageA || undefined,
      chapterId: form.chapterId || undefined
    }, keepOpen);

    if (keepOpen) {
      setForm(prev => ({
        ...prev,
        question: '',
        answer: '',
        explanation: '',
        imageQ: '',
        imageA: ''
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'imageQ' | 'imageA') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert(language === 'en' ? 'Maximum image file size is 3MB.' : 'Ukuran file gambar melebihi batas maksimal 3MB.');
      e.target.value = '';
      return;
    }

    try {
      setUploadingField(field);
      const url = await uploadOrCompressImage(file, 'cards');
      setForm(prev => ({ ...prev, [field]: url }));
    } catch (err: any) {
      alert(err?.message || (language === 'en' ? 'Failed to upload image.' : 'Gagal mengunggah gambar.'));
      console.error('Image upload failed', err);
    } finally {
      setUploadingField(null);
    }
  };

  // Helper to render chapter options hierarchically
  const renderChapterOptions = (parentId: string | null | undefined, depth = 0) => {
    const children = chapters.filter(c => (c.parentId || null) === (parentId || null));
    let nodes: React.ReactNode[] = [];
    children.forEach(ch => {
      const prefix = '\u00A0\u00A0'.repeat(depth) + (depth > 0 ? '└ ' : '');
      nodes.push(
        <option key={ch.id} value={ch.id}>{prefix}{ch.title}</option>
      );
      nodes = nodes.concat(renderChapterOptions(ch.id, depth + 1));
    });
    return nodes;
  };

  const sourceMaterial = chapters.find(c => c.id === form.chapterId)?.material;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className={`clay-modal w-full ${sourceMaterial ? 'max-w-5xl' : 'max-w-lg'} flex flex-col max-h-[92vh] my-auto overflow-hidden`}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-black/[0.04] dark:border-white/[0.04] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl clay-icon-pod-orange flex items-center justify-center shrink-0 shadow-xs">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#18234A] dark:text-[#F8FAFC]">
                {initialData ? (language === 'en' ? 'Edit Flashcard' : 'Edit Kartu Hafalan') : (language === 'en' ? 'Add Knowledge Card' : 'Tambah Kartu Hafalan Baru')}
              </h3>
              <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8]">
                {language === 'en' ? 'Question & Answer Spaced Repetition Card' : 'Kartu Pertanyaan & Jawaban Berulang Terencana'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-xl clay-icon-pod-neutral flex items-center justify-center text-[#5E6D88] hover:text-[#18234A] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          {sourceMaterial && (
            <div className="flex-1 border-r border-black/[0.04] dark:border-white/[0.04] bg-[#F4F7FB]/60 dark:bg-[#0E1522]/60 overflow-y-auto p-5 hidden lg:block">
              <div className="flex items-center gap-2 mb-3 text-[#18234A] dark:text-[#F8FAFC]">
                <BookOpen className="w-4 h-4 text-[#FF6F3D]" />
                <h4 className="text-xs font-bold uppercase tracking-wider">{language === 'en' ? 'Source Material' : 'Materi Sumber Bab'}</h4>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-[#5E6D88] dark:text-[#94A3B8] leading-relaxed text-xs">
                <Markdown>{sourceMaterial}</Markdown>
              </div>
            </div>
          )}

          <div className="p-4 sm:p-6 overflow-y-auto w-full lg:w-[480px] flex-1 min-h-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {chapters.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] mb-1.5">
                    {language === 'en' ? 'Assign to Chapter' : 'Pilih Bab / Materi'}
                  </label>
                  <select
                    value={form.chapterId}
                    onChange={e => setForm({ ...form, chapterId: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-2xl clay-inset text-xs sm:text-sm font-semibold text-[#18234A] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#FF6F3D]/30 transition-all cursor-pointer"
                  >
                    <option value="">-- {language === 'en' ? 'No Chapter (Direct to Book)' : 'Tanpa Bab (Langsung ke Buku)'} --</option>
                    {renderChapterOptions(null)}
                  </select>
                </div>
              )}

              {/* Question */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#18234A] dark:text-[#F8FAFC]">
                  {language === 'en' ? 'Question / Prompt (Front of Card) *' : 'Pertanyaan / Teks Sisi Depan *'}
                </label>
                <textarea
                  rows={2}
                  placeholder={language === 'en' ? 'Enter question or keyword...' : 'Tulis pertanyaan atau kata kunci hafalan...'}
                  value={form.question}
                  onChange={e => {
                    const val = e.target.value;
                    if ((val.includes('J:') || val.includes('A:') || val.includes('Jawab:')) && !form.answer) {
                      const parsed = parseCardsFromText(val);
                      if (parsed.length > 0) {
                        setForm(prev => ({
                          ...prev,
                          question: parsed[0].question,
                          answer: parsed[0].answer
                        }));
                        return;
                      }
                    }
                    setForm({ ...form, question: val });
                  }}
                  className="w-full p-3 rounded-2xl clay-inset text-xs sm:text-sm font-semibold text-[#18234A] dark:text-[#F8FAFC] placeholder:text-[#8493AB] focus:outline-none focus:ring-2 focus:ring-[#FF6F3D]/30 transition-all"
                />
                
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={uploadingField === 'imageQ'}
                    onClick={() => fileInputQ.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl clay-card-subtle text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] transition-all cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    {uploadingField === 'imageQ' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-[#FF6F3D] animate-spin" />
                        <span>{language === 'en' ? 'Uploading...' : 'Mengunggah...'}</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5 text-[#FF6F3D]" />
                        <span>{language === 'en' ? 'Attach Image' : 'Lampirkan Gambar'}</span>
                      </>
                    )}
                  </button>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputQ} onChange={e => handleImageUpload(e, 'imageQ')} />
                  
                  {form.imageQ && (
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-xs border border-white/60 dark:border-white/10 group">
                      <img src={form.imageQ} alt="Preview Q" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setForm({...form, imageQ: ''})} 
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Answer */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-[#18234A] dark:text-[#F8FAFC]">
                  {language === 'en' ? 'Answer (Back of Card) *' : 'Jawaban / Teks Sisi Belakang *'}
                </label>
                <textarea
                  rows={3}
                  placeholder={language === 'en' ? 'Enter answer text...' : 'Tulis jawaban atau lafaz hafalan lengkap...'}
                  value={form.answer}
                  onChange={e => setForm({ ...form, answer: e.target.value })}
                  className="w-full p-3 rounded-2xl clay-inset text-xs sm:text-sm font-semibold text-[#18234A] dark:text-[#F8FAFC] placeholder:text-[#8493AB] focus:outline-none focus:ring-2 focus:ring-[#FF6F3D]/30 transition-all"
                />
                
                {/* Action Toolbar under Answer: Image & Explanation insertion */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    disabled={uploadingField === 'imageA'}
                    onClick={() => fileInputA.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl clay-card-subtle text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] transition-all cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    {uploadingField === 'imageA' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-[#FF6F3D] animate-spin" />
                        <span>{language === 'en' ? 'Uploading...' : 'Mengunggah...'}</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5 text-[#FF6F3D]" />
                        <span>{language === 'en' ? 'Attach Image' : 'Lampirkan Gambar'}</span>
                      </>
                    )}
                  </button>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputA} onChange={e => handleImageUpload(e, 'imageA')} />

                  <button
                    type="button"
                    onClick={() => {
                      setIsExplanationOpen(prev => {
                        const next = !prev;
                        if (next) {
                          setTimeout(() => explanationRef.current?.focus(), 150);
                        }
                        return next;
                      });
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                      isExplanationOpen || form.explanation
                        ? 'clay-btn-primary text-white'
                        : 'clay-card-subtle text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D]'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>
                      {isExplanationOpen
                        ? (language === 'en' ? 'Hide Explanation' : 'Tutup Penjelasan')
                        : (form.explanation
                            ? (language === 'en' ? 'Edit Explanation ✓' : 'Ubah Penjelasan ✓')
                            : (language === 'en' ? '+ Add Explanation' : '+ Sisipkan Penjelasan'))}
                    </span>
                    {isExplanationOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  
                  {form.imageA && (
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-xs border border-white/60 dark:border-white/10 group">
                      <img src={form.imageA} alt="Preview A" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setForm({...form, imageA: ''})} 
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Extra Explanation field */}
              {(isExplanationOpen || form.explanation) && (
                <div className="space-y-2 p-3.5 rounded-2xl clay-inset animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-[#FF6F3D]">
                      <BookOpen className="w-3.5 h-3.5 text-[#FF6F3D]" />
                      <span>{language === 'en' ? 'Explanation / Notes' : 'Penjelasan / Rincian Materi'}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsExplanationOpen(false)}
                      className="text-[#8493AB] hover:text-[#18234A] dark:hover:text-[#F8FAFC] p-0.5 cursor-pointer"
                      title={language === 'en' ? 'Close' : 'Tutup'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    ref={explanationRef}
                    rows={3}
                    placeholder={language === 'en' 
                      ? 'Detailed explanation, notes, or references...' 
                      : 'Teks penjelasan / rincian materi...'}
                    value={form.explanation}
                    onChange={e => setForm({ ...form, explanation: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-[#121927] border border-black/[0.06] dark:border-white/[0.06] text-xs font-semibold text-[#18234A] dark:text-[#F8FAFC] placeholder:text-[#8493AB] focus:outline-none focus:ring-2 focus:ring-[#FF6F3D]/30 transition-all"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-end gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2.5 rounded-2xl clay-card-subtle text-xs font-bold text-[#5E6D88] hover:text-[#18234A] dark:hover:text-[#F8FAFC] cursor-pointer transition-all"
                >
                  {language === 'en' ? 'Cancel' : 'Batal'}
                </button>
                {!initialData && (
                  <button
                    type="button"
                    onClick={() => submitForm(true)}
                    disabled={(!form.question.trim() && !form.imageQ) || (!form.answer.trim() && !form.imageA)}
                    className="px-4 py-2.5 rounded-2xl clay-card text-[#10B981] hover:scale-105 active:scale-95 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer transition-all"
                  >
                    {language === 'en' ? 'Save & Add Another' : 'Simpan & Tambah Lagi'}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={(!form.question.trim() && !form.imageQ) || (!form.answer.trim() && !form.imageA)}
                  className="px-5 py-2.5 rounded-2xl clay-btn-primary text-xs font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  {language === 'en' ? 'Save Card' : (initialData ? 'Simpan Perubahan' : 'Simpan & Tutup')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
