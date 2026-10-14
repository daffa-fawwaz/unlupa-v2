import React, { useState, useMemo } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  FileText,
  Bot,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { Language } from '../../types';
import { 
  parseBookFromText, 
  EXTERNAL_AI_BOOK_PROMPT_TEMPLATE, 
  EXTERNAL_AI_BOOK_REFORMAT_PROMPT 
} from '../../lib/quick-card-parser';

interface AIBookBuilderModalProps {
  onClose: () => void;
  onImport: (bookData: any) => void;
  language: Language;
}

export function AIBookBuilderModal({ onClose, onImport, language }: AIBookBuilderModalProps) {
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Prompt State
  const [promptType, setPromptType] = useState<'scratch' | 'reformat'>('scratch');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [showCardsPreview, setShowCardsPreview] = useState(false);

  // Client-side parsing (0 ms, 100% offline, bebas kuota)
  const parsedBook = useMemo(() => {
    if (!text.trim()) return null;
    const defaultTitle = topic.trim() || (language === 'en' ? 'New Book' : 'Buku Baru');
    return parseBookFromText(text, defaultTitle);
  }, [text, topic, language]);

  const totalDetectedCards = useMemo(() => {
    if (!parsedBook) return 0;
    return parsedBook.chapters.reduce((acc, ch) => acc + ch.cards.length, 0);
  }, [parsedBook]);

  const totalDetectedChapters = useMemo(() => {
    if (!parsedBook) return 0;
    return parsedBook.chapters.length;
  }, [parsedBook]);

  const activePromptText = useMemo(() => {
    if (promptType === 'scratch') {
      return EXTERNAL_AI_BOOK_PROMPT_TEMPLATE(topic.trim(), undefined, language);
    }
    return EXTERNAL_AI_BOOK_REFORMAT_PROMPT(language);
  }, [promptType, topic, language]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(activePromptText).then(() => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    });
  };

  const handleCreateBook = () => {
    if (!parsedBook || totalDetectedCards === 0) {
      setError(
        language === 'en' 
          ? 'Paste text with "T:" and "J:" format first.' 
          : 'Tempelkan teks berformat "T:" dan "J:" terlebih dahulu.'
      );
      return;
    }

    onImport({
      title: topic.trim() || parsedBook.title || (language === 'en' ? 'New Book' : 'Buku Baru'),
      description: parsedBook.description || '',
      chapters: parsedBook.chapters
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="clay-card rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-black/[0.04] dark:border-white/[0.06]">
        {/* Header Bar - Ringkas & Bersih */}
        <div className="px-5 py-3.5 border-b border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between shrink-0 bg-[#FAFBFC]/80 dark:bg-[#141C2B]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl clay-icon-pod-orange flex items-center justify-center shrink-0 shadow-xs">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-black text-[#18234A] dark:text-[#F8FAFC]">
                  {language === 'en' ? 'Quick Book Builder' : 'Buat Kitab Cepat'}
                </h2>
                <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  {language === 'en' ? 'Format Mode' : 'Format Baku'}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                {language === 'en' ? 'Paste Q&A text or copy prompt for external AI.' : 'Tempel format tanya-jawab atau salin prompt untuk AI luar.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-xl clay-pill flex items-center justify-center text-[#18234A] dark:text-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Form Content - Minimalis & Tidak Bertele-tele */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          {error && (
            <div className="p-2.5 rounded-xl clay-badge-rose text-white text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Prompt Assistant Bar: Ramping & 1 Baris */}
          <div className="p-2.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-900/40 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
              {/* 2 Segmented Tabs */}
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-orange-200/50">
                <button
                  type="button"
                  onClick={() => setPromptType('scratch')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    promptType === 'scratch'
                      ? 'bg-[#FF6F3D] text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {language === 'en' ? '1. New Cards' : '1. Buat Baru'}
                </button>
                <button
                  type="button"
                  onClick={() => setPromptType('reformat')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    promptType === 'reformat'
                      ? 'bg-[#FF6F3D] text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {language === 'en' ? '2. Reformat' : '2. Ubah Format'}
                </button>
              </div>

              {/* Action Buttons: Tinjau & Salin */}
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowPromptPreview(!showPromptPreview)}
                  className="px-2 py-1 rounded-lg clay-pill text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                  title="Tinjau teks prompt"
                >
                  <FileText className="w-3 h-3" />
                  <span>{showPromptPreview ? (language === 'en' ? 'Hide' : 'Tutup') : (language === 'en' ? 'View' : 'Tinjau')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="px-2.5 py-1 rounded-lg bg-[#FF6F3D] hover:bg-[#E65320] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 transition-all"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>{language === 'en' ? 'Copied' : 'Tersalin'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{language === 'en' ? 'Copy Prompt' : 'Salin Prompt'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Expandable Masterpiece Prompt Preview */}
            {showPromptPreview && (
              <div className="pt-2 border-t border-orange-200/50 dark:border-orange-900/40 text-[10px] space-y-2">
                <div className="p-2 rounded-xl bg-orange-100/60 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/50 space-y-1 text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1.5 font-bold text-orange-900 dark:text-orange-300 text-[10.5px]">
                    <span>🧠</span>
                    <span>{language === 'en' ? 'Cognitive Science Formulation Principles:' : 'Prinsip Emas Neurosains Memori:'}</span>
                  </div>
                  <ul className="text-[9.5px] leading-relaxed space-y-0.5 list-disc list-inside text-slate-600 dark:text-slate-300">
                    <li>
                      <span className="font-semibold text-orange-800 dark:text-orange-200">{language === 'en' ? 'Pure Retrieval Trigger: ' : 'Pemantik Retrieval Murni: '}</span>
                      {language === 'en' ? 'Questions must be concise and sharp—never dump explanations into the question.' : 'Pertanyaan wajib singkat, padat, dan murni memantik ingatan—bukan tempat menumpahkan penjelasan.'}
                    </li>
                    <li>
                      <span className="font-semibold text-orange-800 dark:text-orange-200">{language === 'en' ? 'Non-Deductible High-Yield: ' : 'Filter Anti-Nalar: '}</span>
                      {language === 'en' ? 'Only memorize verbatim facts (verses, hadith, precise definitions, rulings) that cannot be deduced by mere logic.' : 'Hanya hafalkan fakta identik (ayat, hadits, definisi eksak, rukun/syarat) yang tidak bisa ditebak dengan akal sehat.'}
                    </li>
                    <li>
                      <span className="font-semibold text-orange-800 dark:text-orange-200">{language === 'en' ? 'Atomic (MIP): ' : 'Prinsip Atomik (1 Kartu = 1 Butir): '}</span>
                      {language === 'en' ? 'One card tests one discrete memory node, avoiding unwieldy lists.' : '1 kartu menguji 1 inti informasi agar tidak ada kartu majemuk yang mudah gagal.'}
                    </li>
                  </ul>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 font-mono text-[9.5px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap select-all max-h-56 overflow-y-auto border border-slate-200/70 dark:border-slate-800 shadow-inner">
                  {activePromptText}
                </div>
              </div>
            )}
          </div>

          {/* Form Fields: Judul & Textarea */}
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-bold text-[#18234A] dark:text-[#F8FAFC] mb-1">
                {language === 'en' ? 'Book Title (Optional)' : 'Judul Kitab (Opsional)'}
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={language === 'en' ? 'e.g., Ushul Fiqih, Nahwu Shorof' : 'Cth: Ushul Fiqih Dasar, Nahwu Shorof'}
                className="w-full px-3 py-2 rounded-xl clay-inset text-xs font-semibold text-[#18234A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-[#18234A] dark:text-[#F8FAFC]">
                  {language === 'en' ? 'Formatted Text (Chapters & Q&A)' : 'Teks Berformat (Bab & Tanya-Jawab)'}
                </label>
                {text.trim() && (
                  <button
                    type="button"
                    onClick={() => setText('')}
                    className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                  >
                    {language === 'en' ? 'Clear' : 'Kosongkan'}
                  </button>
                )}
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={'# Bab 1: Pengantar\nT: Apa itu Ushul Fiqih?\nJ: Ilmu tentang dalil-dalil fiqih global.\n\n# Bab 2: Pembagian\nT: Sebutkan hukum taklifi!\nJ: Wajib, Mandub, Mubah, Makruh, Haram.'}
                className="w-full px-3 py-2.5 rounded-xl clay-inset text-xs font-mono text-[#18234A] dark:text-[#F8FAFC] placeholder:text-slate-400 focus:outline-none resize-none h-36"
              />
            </div>
          </div>

          {/* Live Recognition Pill */}
          {totalDetectedCards > 0 ? (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300/80 dark:border-emerald-800/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {language === 'en'
                    ? `Detected: ${totalDetectedChapters} Chapters • ${totalDetectedCards} Cards`
                    : `Terbaca: ${totalDetectedChapters} Bab • ${totalDetectedCards} Kartu`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCardsPreview(!showCardsPreview)}
                className="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold border border-emerald-200 cursor-pointer shadow-2xs"
              >
                {showCardsPreview ? (language === 'en' ? 'Hide' : 'Tutup') : (language === 'en' ? 'Preview' : 'Pratinjau')}
              </button>
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
              {language === 'en'
                ? 'Format: Start questions with "T:" and answers with "J:". Separate chapters with "# Bab [Name]".'
                : 'Format: Pertanyaan diawali "T:" dan jawaban "J:". Bab dipisahkan dengan "# Bab [Nama]".'}
            </p>
          )}

          {/* Cards Preview Drawer */}
          {showCardsPreview && parsedBook && (
            <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-[10.5px]">
              {parsedBook.chapters.map((ch, chIdx) => (
                <div key={chIdx} className="space-y-0.5">
                  <span className="font-bold text-[#FF6F3D] block text-[10px]">{ch.title} ({ch.cards.length} kartu)</span>
                  {ch.cards.slice(0, 2).map((c, i) => (
                    <div key={i} className="truncate text-slate-600 dark:text-slate-400 pl-2 border-l border-emerald-400">
                      <span className="font-semibold">T: </span>{c.question.split('\n')[0]}
                    </div>
                  ))}
                  {ch.cards.length > 2 && (
                    <span className="text-[9px] text-slate-400 pl-2">+{ch.cards.length - 2} kartu lainnya...</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3 border-t border-black/[0.04] dark:border-white/[0.05] bg-[#FAFBFC]/80 dark:bg-[#141C2B]/80 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl clay-pill text-[#18234A] dark:text-[#F8FAFC] text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            {language === 'en' ? 'Cancel' : 'Batal'}
          </button>

          <button
            type="button"
            onClick={handleCreateBook}
            disabled={totalDetectedCards === 0}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
              totalDetectedCards > 0
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white hover:scale-105 active:scale-95'
                : 'clay-btn-primary text-white opacity-40 cursor-not-allowed'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>
              {totalDetectedCards > 0
                ? (language === 'en' 
                    ? `Create Book (${totalDetectedCards} Cards)` 
                    : `Buat Kitab (${totalDetectedCards} Kartu)`)
                : (language === 'en' ? 'Paste Text' : 'Tempelkan Teks')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
