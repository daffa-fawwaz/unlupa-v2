import React, { useState, useRef, useEffect } from 'react';
import { 
  ContentBlock, BlockType, ArabicWord, TextBlock, ImageBlock, 
  ArabicBlock, MultipleChoiceBlock, OrderingBlock 
} from '../../../types';
import { 
  Type, Image as ImageIcon, Languages, HelpCircle, ListOrdered, 
  Trash2, ArrowUp, ArrowDown, Plus, Copy, Sparkles, Check, 
  Eye, EyeOff, Link as LinkIcon, Upload, CheckCircle2, ChevronRight, ChevronLeft,
  AlignRight, AlignLeft, BookOpen, Wand2, CornerDownLeft, WrapText, PenLine, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SmartTextViewer } from './BlockViewer';
import { ImageAnnotationModal } from './ImageAnnotationModal';
import { uploadOrCompressImage } from '../../../lib/imageUtils';

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, onChange }) => {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  const updateBlock = (id: string, updatedBlock: Partial<ContentBlock>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updatedBlock } as ContentBlock : b));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
    if (activeBlockId === id) setActiveBlockId(null);
  };

  const duplicateBlock = (id: string) => {
    const target = blocks.find(b => b.id === id);
    if (!target) return;
    const duplicated: ContentBlock = JSON.parse(JSON.stringify(target));
    duplicated.id = crypto.randomUUID();
    const index = blocks.findIndex(b => b.id === id);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, duplicated);
    onChange(newBlocks);
    setActiveBlockId(duplicated.id);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newBlocks = [...blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      onChange(newBlocks);
    } else if (direction === 'down' && index < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[index + 1], newBlocks[index]] = [newBlocks[index], newBlocks[index + 1]];
      onChange(newBlocks);
    }
  };

  const addBlock = (type: BlockType, insertIndex?: number) => {
    const newId = crypto.randomUUID();
    let newBlock: ContentBlock;

    switch (type) {
      case 'text':
        newBlock = { id: newId, type: 'text', content: '' };
        break;
      case 'arabic':
        newBlock = { id: newId, type: 'arabic', content: [] };
        break;
      case 'image':
        newBlock = { id: newId, type: 'image', content: '' };
        break;
      case 'video':
        newBlock = { id: newId, type: 'video', content: '' };
        break;
      case 'multiple-choice': {
        const opt1 = crypto.randomUUID();
        const opt2 = crypto.randomUUID();
        newBlock = { 
          id: newId, 
          type: 'multiple-choice', 
          content: { 
            question: '', 
            options: [
              { id: opt1, text: '' }, 
              { id: opt2, text: '' }
            ], 
            correctOptionId: opt1 
          } 
        };
        break;
      }
      case 'ordering':
        newBlock = { 
          id: newId, 
          type: 'ordering', 
          content: { 
            items: [
              { id: crypto.randomUUID(), text: '' },
              { id: crypto.randomUUID(), text: '' }
            ] 
          } 
        };
        break;
      default:
        newBlock = { id: newId, type: 'text', content: '' };
    }

    if (insertIndex !== undefined && insertIndex >= 0) {
      const newBlocks = [...blocks];
      newBlocks.splice(insertIndex + 1, 0, newBlock);
      onChange(newBlocks);
    } else {
      onChange([...blocks, newBlock]);
    }
    setActiveBlockId(newId);
  };

  const getBlockTypeMeta = (type: BlockType) => {
    switch (type) {
      case 'arabic':
        return { 
          label: 'Arab Interaktif (Per Kata)', 
          icon: Languages, 
          color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60' 
        };
      case 'text':
        return { 
          label: 'Teks & Penjelasan', 
          icon: Type, 
          color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60' 
        };
      case 'image':
        return { 
          label: 'Gambar Ilustrasi', 
          icon: ImageIcon, 
          color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60' 
        };
      case 'video':
        return {
          label: 'Link Video',
          icon: LinkIcon,
          color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60'
        };
      case 'multiple-choice':
        return { 
          label: 'Soal Pilihan Ganda', 
          icon: HelpCircle, 
          color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60' 
        };
      case 'ordering':
        return { 
          label: 'Menyusun Urutan', 
          icon: ListOrdered, 
          color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60' 
        };
    }
  };

  return (
    <div className="space-y-6">
      {blocks.length === 0 ? (
        <div className="text-center p-8 sm:p-12 clay-card rounded-3xl border border-black/[0.04] dark:border-white/[0.06] shadow-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl clay-icon-pod-emerald flex items-center justify-center text-white shadow-sm">
            <Languages className="w-7 h-7 text-white" />
          </div>
          <h4 className="text-base sm:text-lg font-extrabold text-[#18234A] dark:text-[#F8FAFC] mb-1">
            Mulai Buat Materi Pembelajaran
          </h4>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto mb-6 font-medium">
            Pilih jenis blok konten di bawah untuk menambahkan teks penjelasan, kata Arab interaktif per-kata, gambar, atau latihan soal.
          </p>
          <div className="max-w-xl mx-auto">
            <BlockSelectorBar onSelect={(type) => addBlock(type)} />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <AnimatePresence initial={false}>
            {blocks.map((block, index) => {
              const meta = getBlockTypeMeta(block.type);
              const isActive = activeBlockId === block.id;

              return (
                <div key={block.id} className="space-y-3">
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className={`rounded-2xl border transition-all shadow-xs overflow-hidden ${
                      isActive 
                        ? 'border-emerald-500 dark:border-emerald-500/70 bg-white dark:bg-slate-900 ring-2 ring-emerald-500/20 shadow-md' 
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    onClick={() => setActiveBlockId(block.id)}
                  >
                    {/* Block Card Header Bar */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                      {/* Left: Type badge & Index */}
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          #{index + 1}
                        </span>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${meta.color}`}>
                          <meta.icon className="w-3.5 h-3.5" />
                          <span>{meta.label}</span>
                        </div>
                      </div>

                      {/* Right: Block Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); moveBlock(index, 'up'); }}
                          disabled={index === 0}
                          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
                          title="Geser ke Atas"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); moveBlock(index, 'down'); }}
                          disabled={index === blocks.length - 1}
                          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
                          title="Geser ke Bawah"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Duplikasi Blok"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                        <button
                          type="button"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            removeBlock(block.id); 
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Blok"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Block Content Body */}
                    <div className="p-4 sm:p-5">
                      {block.type === 'text' && (
                        <TextBlockEditor 
                          block={block as TextBlock} 
                          onChange={(content) => updateBlock(block.id, { content })} 
                        />
                      )}

                      {block.type === 'arabic' && (
                        <ArabicBlockEditor 
                          block={block as ArabicBlock} 
                          onChange={(content) => updateBlock(block.id, { content })} 
                        />
                      )}

                      {block.type === 'image' && (
                        <ImageBlockEditor 
                          block={block as ImageBlock} 
                          onChange={(content) => updateBlock(block.id, { content })} 
                        />
                      )}

                      {block.type === 'multiple-choice' && (
                        <MultipleChoiceBlockEditor 
                          block={block as MultipleChoiceBlock} 
                          onChange={(content) => updateBlock(block.id, { content })} 
                        />
                      )}

                      {block.type === 'ordering' && (
                        <OrderingBlockEditor 
                          block={block as OrderingBlock} 
                          onChange={(content) => updateBlock(block.id, { content })} 
                        />
                      )}

                      {block.type === 'video' && (
                        <VideoBlockEditor
                          block={block as import('../../../types').VideoBlock}
                          onChange={(content) => updateBlock(block.id, { content })}
                        />
                      )}
                    </div>
                  </motion.div>

                  {/* Clean Explicit Inter-block Inserter Divider */}
                  <div className="flex items-center justify-center my-2">
                    <InlineBlockInserter onInsert={(type) => addBlock(type, index)} />
                  </div>
                </div>
              );
            })}
          </AnimatePresence>

          {/* Bottom Toolbar for Adding More Blocks */}
          <div className="pt-4 pb-8 text-center border-t border-slate-200/80 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              + Tambah Blok Konten Baru
            </p>
            <div className="max-w-xl mx-auto">
              <BlockSelectorBar onSelect={(type) => addBlock(type)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* --- BLOCK SELECTOR BAR (Primary Toolbar) -------------------------------- */
/* ========================================================================= */
interface BlockSelectorBarProps {
  onSelect: (type: BlockType) => void;
  compact?: boolean;
}

const BlockSelectorBar: React.FC<BlockSelectorBarProps> = ({ onSelect, compact = false }) => {
  const options: { type: BlockType; label: string; icon: any; desc: string; color: string }[] = [
    { 
      type: 'arabic', 
      label: 'Arab Interaktif', 
      icon: Languages, 
      desc: 'Kata per kata dengan terjemahan interaktif',
      color: 'hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400' 
    },
    { 
      type: 'text', 
      label: 'Teks / Catatan', 
      icon: Type, 
      desc: 'Penjelasan materi & catatan terstruktur',
      color: 'hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400' 
    },
    { 
      type: 'image', 
      label: 'Gambar', 
      icon: ImageIcon, 
      desc: 'Foto, diagram, atau infografis',
      color: 'hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400' 
    },
    {
      type: 'video',
      label: 'Video',
      icon: LinkIcon,
      desc: 'Sematkan video dari YouTube/URL',
      color: 'hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400'
    },
    { 
      type: 'multiple-choice', 
      label: 'Pilihan Ganda', 
      icon: HelpCircle, 
      desc: 'Kuis interaktif uji pemahaman',
      color: 'hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400' 
    },
    { 
      type: 'ordering', 
      label: 'Urutan', 
      icon: ListOrdered, 
      desc: 'Latihan menyusun kalimat atau rukun',
      color: 'hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400' 
    },
  ];

  if (compact) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl clay-card shadow-md">
        {options.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => onSelect(opt.type)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl clay-pill text-[#18234A] dark:text-[#F8FAFC] hover:text-[#F27A3D] transition-all cursor-pointer shadow-2xs"
          >
            <opt.icon className="w-3.5 h-3.5 text-[#F27A3D]" />
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
      {options.map((opt) => (
        <button
          key={opt.type}
          type="button"
          onClick={() => onSelect(opt.type)}
          className="clay-card-subtle p-3.5 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="w-10 h-10 rounded-2xl clay-icon-pod-orange flex items-center justify-center text-white shadow-xs group-hover:scale-110 transition-transform">
            <opt.icon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-extrabold text-[#18234A] dark:text-[#F8FAFC] leading-tight line-clamp-1">
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
};

/* ========================================================================= */
/* --- INLINE BLOCK INSERTER (Divider between blocks) ----------------------- */
/* ========================================================================= */
const InlineBlockInserter: React.FC<{ onInsert: (type: BlockType) => void }> = ({ onInsert }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative flex items-center justify-center w-full py-1">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-800" />
      </div>

      <div className="relative z-10">
        {!isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1 px-3 py-1 text-[11px] font-semibold text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 rounded-full transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Sisipkan Blok di Sini</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => { onInsert('arabic'); setIsOpen(false); }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-1 cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Arab</span>
            </button>
            <button
              type="button"
              onClick={() => { onInsert('text'); setIsOpen(false); }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-1 cursor-pointer"
            >
              <Type className="w-3.5 h-3.5" />
              <span>Teks</span>
            </button>
            <button
              type="button"
              onClick={() => { onInsert('image'); setIsOpen(false); }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-1 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Gambar</span>
            </button>
            <button
              type="button"
              onClick={() => { onInsert('multiple-choice'); setIsOpen(false); }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Kuis</span>
            </button>
            <button
              type="button"
              onClick={() => { onInsert('ordering'); setIsOpen(false); }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 flex items-center gap-1 cursor-pointer"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Urutan</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2 py-1 text-xs font-semibold rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ========================================================================= */
/* --- 1. ARABIC BLOCK EDITOR (Arab Interaktif Per Kata) -------------------- */
/* ========================================================================= */
interface ArabicBlockEditorProps {
  block: ArabicBlock;
  onChange: (words: ArabicWord[]) => void;
}

const isArabicScript = (text?: string): boolean => {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
};

const ArabicBlockEditor: React.FC<ArabicBlockEditorProps> = ({ block, onChange }) => {
  const [arabicInput, setArabicInput] = useState('');
  const [translationInput, setTranslationInput] = useState('');
  const [exampleInput, setExampleInput] = useState('');
  const [newLineInput, setNewLineInput] = useState(false);
  const [isBulkSplitOpen, setIsBulkSplitOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [previewStudentMode, setPreviewStudentMode] = useState(false);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [editArabic, setEditArabic] = useState('');
  const [editTranslation, setEditTranslation] = useState('');
  const [editExample, setEditExample] = useState('');
  const [editNewLine, setEditNewLine] = useState(false);

  const arabicInputRef = useRef<HTMLInputElement>(null);
  const words: ArabicWord[] = Array.isArray(block.content) ? block.content : [];

  // Group words into lines based on newLine flags
  const lineGroups = React.useMemo(() => {
    const result: ArabicWord[][] = [];
    let currentLine: ArabicWord[] = [];
    words.forEach((word, index) => {
      if (word.newLine && index > 0 && currentLine.length > 0) {
        result.push(currentLine);
        currentLine = [word];
      } else {
        currentLine.push(word);
      }
    });
    if (currentLine.length > 0) result.push(currentLine);
    return result;
  }, [words]);

  // Add single word
  const handleAddWord = () => {
    if (!arabicInput.trim()) return;
    const newWord: ArabicWord = {
      id: crypto.randomUUID(),
      arabic: arabicInput.trim(),
      translation: translationInput.trim(),
      example: exampleInput.trim() || undefined,
      newLine: newLineInput ? true : undefined
    };
    onChange([...words, newWord]);
    setArabicInput('');
    setTranslationInput('');
    setExampleInput('');
    setNewLineInput(false);
    arabicInputRef.current?.focus();
  };

  // Bulk sentence splitter: preserves line breaks per paragraph / line
  const handleBulkSplit = () => {
    if (!bulkText.trim()) return;
    const rawLines = bulkText.split(/\r?\n/);
    const newWords: ArabicWord[] = [];
    let isFirstLine = words.length === 0;

    rawLines.forEach((line) => {
      const tokens = line.trim().split(/\s+/).filter(t => t.trim().length > 0);
      if (tokens.length === 0) return;

      tokens.forEach((token, tokenIndex) => {
        newWords.push({
          id: crypto.randomUUID(),
          arabic: token,
          translation: '',
          newLine: (!isFirstLine && tokenIndex === 0) ? true : undefined
        });
      });
      isFirstLine = false;
    });

    onChange([...words, ...newWords]);
    setBulkText('');
    setIsBulkSplitOpen(false);
  };

  const removeWord = (id: string) => {
    onChange(words.filter(w => w.id !== id));
  };

  const toggleNewLine = (id: string) => {
    onChange(words.map(w => w.id === id ? {
      ...w,
      newLine: !w.newLine ? true : undefined
    } : w));
  };

  const moveWord = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index + 1 : index - 1;
    if (targetIndex < 0 || targetIndex >= words.length) return;
    const nextWords = [...words];
    [nextWords[index], nextWords[targetIndex]] = [nextWords[targetIndex], nextWords[index]];
    onChange(nextWords);
  };

  const startEditWord = (w: ArabicWord) => {
    setEditingWordId(w.id);
    setEditArabic(w.arabic);
    setEditTranslation(w.translation || '');
    setEditExample(w.example || '');
    setEditNewLine(!!w.newLine);
  };

  const saveEditWord = () => {
    if (!editingWordId) return;
    onChange(words.map(w => w.id === editingWordId ? {
      ...w,
      arabic: editArabic.trim() || w.arabic,
      translation: editTranslation.trim(),
      example: editExample.trim() || undefined,
      newLine: editNewLine ? true : undefined
    } : w));
    setEditingWordId(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Instructions + Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Teks Arab Interaktif ({words.length} kata)
          </h5>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Format kata pas membaca di HP (6–10 kata per baris). Arti & contoh otomatis menyesuaikan bahasa (Arab/Indonesia).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBulkSplitOpen(!isBulkSplitOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pecah Kalimat Otomatis</span>
          </button>

          {words.length > 0 && (
            <button
              type="button"
              onClick={() => setPreviewStudentMode(!previewStudentMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                previewStudentMode
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {previewStudentMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{previewStudentMode ? 'Tutup Pratinjau' : 'Pratinjau Siswa'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Split Panel (Expandable) */}
      {isBulkSplitOpen && (
        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Pemisah Kata Arab per Baris
            </span>
            <button
              type="button"
              onClick={() => setIsBulkSplitOpen(false)}
              className="text-xs text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
          <p className="text-[11px] text-amber-800 dark:text-amber-300">
            Tempel kalimat, bait syi'ir, atau paragraf di bawah. Susunan baris akan tetap rapi dan teratur mengikuti baris aslinya.
          </p>
          <textarea
            dir="rtl"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="Tempel teks atau bait Arab di sini...&#10;Baris 1&#10;Baris 2&#10;Baris 3"
            className="w-full p-3 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-white dark:bg-slate-900 font-arabic text-xl text-amber-700 dark:text-amber-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[100px]"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
              {bulkText.trim() ? (
                <span>
                  {bulkText.split(/\r?\n/).filter(l => l.trim().length > 0).length} baris terdeteksi • {bulkText.trim().split(/\s+/).filter(Boolean).length} kata
                </span>
              ) : (
                <span>Tempelkan teks per baris sesuai kebutuhan</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBulkSplitOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBulkSplit}
                disabled={!bulkText.trim()}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Pecah Kata</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode Siswa Preview (Interactive word tooltip tester) */}
      {previewStudentMode ? (
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-emerald-500/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> Pratinjau Tampilan Siswa ({lineGroups.length} Baris)
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              Klik kata untuk melihat arti / contoh
            </span>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3.5">
            {lineGroups.map((lineWords, lineIdx) => (
              <div 
                key={lineIdx}
                className="flex flex-wrap items-center gap-x-2 gap-y-3 leading-loose" 
                dir="rtl"
              >
                {lineWords.map((w) => {
                  const isTooltipOpen = activeTooltipId === w.id;
                  const isTransArabic = isArabicScript(w.translation);
                  const isExampleArabic = isArabicScript(w.example);

                  return (
                    <div key={w.id} className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setActiveTooltipId(isTooltipOpen ? null : w.id)}
                        className={`font-arabic text-xl sm:text-2xl px-2 py-0.5 rounded-lg transition-all cursor-pointer select-none leading-relaxed border ${
                          isTooltipOpen 
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm font-bold scale-105' 
                            : 'text-amber-800 dark:text-amber-300 border-transparent hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/70 dark:hover:bg-amber-950/40'
                        }`}
                      >
                        {w.arabic}
                      </button>

                      <AnimatePresence>
                        {isTooltipOpen && (w.translation || w.example) && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.95 }}
                            className="absolute top-full mt-2 z-20 w-max max-w-[220px] left-1/2 -translate-x-1/2"
                          >
                            <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs px-3 py-2 rounded-xl shadow-xl space-y-1 border border-slate-700 dark:border-slate-300">
                              {w.translation && (
                                <div 
                                  dir={isTransArabic ? 'rtl' : 'ltr'} 
                                  className={`font-semibold ${isTransArabic ? 'font-arabic text-sm text-right text-amber-400 dark:text-amber-700' : 'text-left'}`}
                                >
                                  {w.translation}
                                </div>
                              )}
                              {w.example && (
                                <div 
                                  dir={isExampleArabic ? 'rtl' : 'ltr'} 
                                  className={`text-[11px] pt-1 border-t border-slate-800 dark:border-slate-200 opacity-90 ${isExampleArabic ? 'font-arabic text-right text-amber-300 dark:text-amber-600' : 'text-left text-slate-300 dark:text-slate-600'}`}
                                >
                                  {w.example}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Regular Edit Mode */
        <div className="space-y-4">
          {/* Words Container (Grouped line-by-line, natural RTL display) */}
          {words.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs">
              Belum ada kata Arab ditambahkan. Gunakan kolom input di bawah atau tombol "Pecah Kalimat Otomatis".
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Susunan Teks ({lineGroups.length} Baris, {words.length} Kata):
                </span>
                <span className="text-[10px]">
                  Klik kata untuk edit arti • Ikon ↵ untuk ganti/gabung baris
                </span>
              </div>

              <div className="space-y-3">
                {lineGroups.map((lineWords, lineIdx) => (
                  <div 
                    key={lineIdx} 
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pb-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="flex items-center gap-1.5 font-mono text-amber-600 dark:text-amber-400 font-semibold">
                        <WrapText className="w-3.5 h-3.5" />
                        Baris {lineIdx + 1} ({lineWords.length} kata)
                      </span>
                      {lineIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleNewLine(lineWords[0].id)}
                          className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                          title="Gabungkan baris ini dengan baris di atasnya"
                        >
                          <CornerDownLeft className="w-3 h-3 rotate-180" />
                          <span>Gabung ke baris atas</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-3 leading-loose" dir="rtl">
                      {lineWords.map((w) => {
                        const index = words.findIndex(item => item.id === w.id);
                        const isEditing = editingWordId === w.id;
                        const isTransArabic = isArabicScript(w.translation);

                        if (isEditing) {
                          return (
                            <div 
                              key={w.id} 
                              dir="ltr" 
                              className="p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-emerald-500 shadow-md flex flex-col gap-2 min-w-[240px] z-10 text-left"
                            >
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Kata Arab</label>
                                <input
                                  type="text"
                                  dir="rtl"
                                  value={editArabic}
                                  onChange={(e) => setEditArabic(e.target.value)}
                                  className="w-full font-arabic text-xl text-amber-600 dark:text-amber-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Arti / Makna (Bebas: ID / AR / EN)</label>
                                <input
                                  type="text"
                                  dir="auto"
                                  value={editTranslation}
                                  onChange={(e) => setEditTranslation(e.target.value)}
                                  placeholder="Arti kata..."
                                  className="w-full text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Contoh Kata / Faedah (Opsional)</label>
                                <input
                                  type="text"
                                  dir="auto"
                                  value={editExample}
                                  onChange={(e) => setEditExample(e.target.value)}
                                  placeholder="Contoh kalimat / keterangan..."
                                  className="w-full text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                                  onKeyDown={(e) => e.key === 'Enter' && saveEditWord()}
                                />
                              </div>
                              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer pt-0.5 select-none">
                                <input
                                  type="checkbox"
                                  checked={editNewLine}
                                  onChange={(e) => setEditNewLine(e.target.checked)}
                                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span>Mulai baris baru dari kata ini (Enter)</span>
                              </label>
                              <div className="flex items-center justify-end gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingWordId(null)}
                                  className="px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={saveEditWord}
                                  className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded-md hover:bg-emerald-500 cursor-pointer"
                                >
                                  Simpan
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={w.id}
                            onClick={() => startEditWord(w)}
                            className="group/word relative inline-flex flex-col items-center justify-center px-2 py-1 rounded-xl bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-sm transition-all cursor-pointer min-w-[52px]"
                          >
                            {/* Arabic Word - Standard readable font size */}
                            <span className="font-arabic text-xl sm:text-2xl text-amber-700 dark:text-amber-400 px-0.5 leading-relaxed">
                              {w.arabic}
                            </span>

                            {/* Translation Chip with Auto Direction */}
                            <span 
                              dir={isTransArabic ? 'rtl' : 'ltr'}
                              className={`text-[10px] px-1.5 py-0.5 rounded-md mt-0.5 max-w-[120px] truncate text-center ${
                                w.translation 
                                  ? 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-medium' 
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200 dark:border-rose-900/50 italic'
                              }`}
                            >
                              {w.translation || '+ isi arti'}
                            </span>

                            {/* Hover action toolbar */}
                            <div 
                              dir="ltr"
                              onClick={(e) => e.stopPropagation()}
                              className="absolute -top-2.5 -right-2 opacity-0 group-hover/word:opacity-100 flex items-center gap-0.5 bg-slate-900 text-white rounded-lg p-0.5 shadow-md z-10 transition-opacity"
                            >
                              <button
                                type="button"
                                onClick={() => toggleNewLine(w.id)}
                                className={`p-1 cursor-pointer transition-colors ${w.newLine ? 'text-amber-400 font-bold' : 'hover:text-amber-400'}`}
                                title={w.newLine ? "Batal pisah baris (gabung dengan kata sebelumnya)" : "Pisah dan jadikan awal baris baru (Enter)"}
                              >
                                <CornerDownLeft className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveWord(index, 'right')}
                                disabled={index === 0}
                                className="p-1 hover:text-amber-400 disabled:opacity-20 cursor-pointer"
                                title="Geser Kanan"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveWord(index, 'left')}
                                disabled={index === words.length - 1}
                                className="p-1 hover:text-amber-400 disabled:opacity-20 cursor-pointer"
                                title="Geser Kiri"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeWord(w.id)}
                                className="p-1 hover:text-rose-400 cursor-pointer"
                                title="Hapus Kata"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Add Word Form */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              {/* Arabic Input */}
              <div className="sm:col-span-4 relative">
                <input
                  ref={arabicInputRef}
                  type="text"
                  dir="rtl"
                  placeholder="Kata Arab (misal: الْحَمْدُ)..."
                  value={arabicInput}
                  onChange={(e) => setArabicInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddWord();
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-arabic text-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              {/* Translation Input (Auto RTL/LTR) */}
              <div className="sm:col-span-4 relative">
                <input
                  type="text"
                  dir="auto"
                  placeholder="Arti kata (bebas bahasa)..."
                  value={translationInput}
                  onChange={(e) => setTranslationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddWord();
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Example Input (Auto RTL/LTR) */}
              <div className="sm:col-span-3 relative">
                <input
                  type="text"
                  dir="auto"
                  placeholder="Contoh / faedah (opsional)..."
                  value={exampleInput}
                  onChange={(e) => setExampleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddWord();
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Add Button */}
              <div className="sm:col-span-1 flex items-stretch">
                <button
                  type="button"
                  onClick={handleAddWord}
                  disabled={!arabicInput.trim()}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  title="Tambah Kata"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newLineInput}
                  onChange={(e) => setNewLineInput(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3 text-slate-400" />
                  Mulai di baris baru
                </span>
              </label>

              <p className="text-[11px] text-slate-400">
                Tip: Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px]">Enter</kbd> untuk menambahkan kata dengan cepat.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* --- 2. TEXT BLOCK EDITOR (Catatan & Markdown) ---------------------------- */
/* ========================================================================= */
interface TextBlockEditorProps {
  block: TextBlock;
  onChange: (content: string) => void;
}

const TextBlockEditor: React.FC<TextBlockEditorProps> = ({ block, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [textDir, setTextDir] = useState<'auto' | 'rtl' | 'ltr'>('auto');

  const insertFormat = (prefix: string, suffix: string = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = block.content || '';
    const selected = current.substring(start, end);
    const replacement = `${prefix}${selected || 'teks'}${suffix}`;
    const updated = current.substring(0, start) + replacement + current.substring(end);
    onChange(updated);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 10);
  };

  const insertBilingualSnippet = () => {
    const snippet = `\n\n> **النَّصُّ الْعَرَبِيُّ هُنَا**\n>\n> *Artinya: Terjemahan bahasa Indonesia atau faedah materi di sini...*\n\n`;
    const el = textareaRef.current;
    if (!el) {
      onChange((block.content || '') + snippet);
      return;
    }
    const start = el.selectionStart;
    const current = block.content || '';
    const updated = current.substring(0, start) + snippet + current.substring(start);
    onChange(updated);
  };

  const tidyBilingualContent = () => {
    if (!block.content) return;
    // Tidy up multiple empty lines, normalize spaces, ensure space around Arabic/Indonesian boundaries
    const cleaned = block.content
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    onChange(cleaned);
  };

  return (
    <div className="space-y-3">
      {/* Formatting & Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
        {/* Markdown Shortcuts */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => insertFormat('**', '**')}
            className="px-2 py-1 rounded-md font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            title="Tebal (Bold)"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => insertFormat('*', '*')}
            className="px-2 py-1 rounded-md italic text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            title="Miring (Italic)"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => insertFormat('### ')}
            className="px-2 py-1 rounded-md font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            title="Judul Bagian (H3)"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => insertFormat('- ')}
            className="px-2 py-1 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            title="Daftar Butir"
          >
            • Poin
          </button>
          <button
            type="button"
            onClick={() => insertFormat('> ')}
            className="px-2 py-1 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            title="Kotak Kutipan / Dalil"
          >
            " Kutipan
          </button>

          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Bilingual Helpers */}
          <button
            type="button"
            onClick={insertBilingualSnippet}
            className="px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 font-medium cursor-pointer flex items-center gap-1"
            title="Sisipkan Template Kutipan Arab + Terjemahan Indonesia"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Format Arab & Terjemahan</span>
          </button>

          <button
            type="button"
            onClick={tidyBilingualContent}
            className="px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-1"
            title="Rapikan format baris teks"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Rapikan Paragraf</span>
          </button>
        </div>

        {/* Direction & Preview Toggle */}
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="flex items-center bg-slate-200 dark:bg-slate-700 rounded-lg p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setTextDir('auto')}
              className={`px-2 py-0.5 rounded cursor-pointer ${textDir === 'auto' ? 'bg-white dark:bg-slate-800 font-bold shadow-2xs' : 'text-slate-600 dark:text-slate-400'}`}
              title="Arah teks otomatis per paragraf (Arab RTL, Indonesia LTR)"
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => setTextDir('rtl')}
              className={`px-2 py-0.5 rounded cursor-pointer flex items-center gap-0.5 ${textDir === 'rtl' ? 'bg-white dark:bg-slate-800 font-bold shadow-2xs' : 'text-slate-600 dark:text-slate-400'}`}
              title="Rata Kanan (RTL)"
            >
              <AlignRight className="w-3 h-3" />
              <span>Kanan</span>
            </button>
            <button
              type="button"
              onClick={() => setTextDir('ltr')}
              className={`px-2 py-0.5 rounded cursor-pointer flex items-center gap-0.5 ${textDir === 'ltr' ? 'bg-white dark:bg-slate-800 font-bold shadow-2xs' : 'text-slate-600 dark:text-slate-400'}`}
              title="Rata Kiri (LTR)"
            >
              <AlignLeft className="w-3 h-3" />
              <span>Kiri</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              showPreview 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showPreview ? 'Edit Teks' : 'Pratinjau'}</span>
          </button>
        </div>
      </div>

      {showPreview ? (
        <div className="p-4 sm:p-5 rounded-xl border border-blue-500/40 bg-slate-50/50 dark:bg-slate-900/50 min-h-[160px]">
          <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>Pratinjau Tampilan Materi (Tata Letak Otomatis Arab & Indonesia):</span>
          </div>
          {block.content ? (
            <SmartTextViewer content={block.content} />
          ) : (
            <p className="text-xs italic text-slate-400">Belum ada konten teks untuk ditampilkan.</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          dir={textDir}
          value={block.content || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tulis penjelasan materi, kaidah, hadits, atau catatan di sini. Teks Arab dan Latin yang diketik atau ditempel akan otomatis tertata rapi..."
          className="w-full min-h-[150px] p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y [unicode-bidi:plaintext]"
        />
      )}
    </div>
  );
};

/* ========================================================================= */
/* --- 3. IMAGE BLOCK EDITOR (Upload / URL) --------------------------------- */
/* ========================================================================= */
interface ImageBlockEditorProps {
  block: ImageBlock;
  onChange: (content: string) => void;
}

const ImageBlockEditor: React.FC<ImageBlockEditorProps> = ({ block, onChange }) => {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [isTestAnnotating, setIsTestAnnotating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Suppress space swipe navigation while previewing annotation
  useEffect(() => {
    if (isTestAnnotating) {
      document.body.setAttribute('data-image-modal-open', 'true');
      document.body.classList.add('is-image-modal-open');
    }
    return () => {
      document.body.removeAttribute('data-image-modal-open');
      document.body.classList.remove('is-image-modal-open');
    };
  }, [isTestAnnotating]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran file gambar melebihi batas maksimal 3MB.');
      e.target.value = '';
      return;
    }

    try {
      setIsUploading(true);
      const url = await uploadOrCompressImage(file, 'pages');
      onChange(url);
    } catch (err: any) {
      alert(err?.message || 'Gagal mengunggah gambar ke penyimpanan.');
      console.error('Failed to upload page image to Supabase:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const applyUrl = () => {
    if (!urlValue.trim()) return;
    onChange(urlValue.trim());
    setShowUrlInput(false);
    setUrlValue('');
  };

  return (
    <div className="w-full space-y-3">
      {block.content ? (
        <div className="space-y-2">
          {/* Responsive container adapting to screen width */}
          <div className="relative group/img rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950/90 flex items-center justify-center p-2 min-h-[180px] w-full">
            <img 
              src={block.content} 
              alt="Uploaded material" 
              className="w-full h-auto max-h-[60vh] md:max-h-[520px] object-contain rounded-xl" 
            />
            <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-3 transition-opacity">
              <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-colors">
                Ganti Gambar
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <span>Format responsif menyesuaikan rasio layar.</span>
              <button
                type="button"
                onClick={() => setIsTestAnnotating(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-600/10 hover:bg-amber-600/20 text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-amber-600/20"
                title="Buka pratinjau mode anotasi"
              >
                <PenLine className="w-3 h-3" />
                <span>Pratinjau Anotasi</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-rose-500 hover:underline cursor-pointer"
            >
              Hapus Gambar
            </button>
          </div>

          {/* Test Annotation Modal in Editor */}
          <ImageAnnotationModal
            src={block.content}
            isOpen={isTestAnnotating}
            onClose={() => setIsTestAnnotating(false)}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {/* Upload Dropzone */}
          <div className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tambahkan Gambar atau Ilustrasi Materi
            </p>
            <p className="text-xs text-slate-400 mb-4 text-center max-w-sm">
              Gambar otomatis disesuaikan secara proporsional dengan layar HP, tablet, maupun komputer agar nyaman dibaca.
            </p>

            <div className="flex items-center gap-2">
              <label className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-2xs flex items-center gap-1.5 transition-colors">
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengunggah ke Supabase...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih File Gambar</span>
                  </>
                )}
                <input type="file" accept="image/*" disabled={isUploading} className="hidden" onChange={handleFile} />
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Tautan URL</span>
              </button>
            </div>
          </div>

          {/* URL Input Bar */}
          {showUrlInput && (
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
              <input
                type="url"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://contoh.com/gambar.jpg"
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                onKeyDown={(e) => e.key === 'Enter' && applyUrl()}
              />
              <button
                type="button"
                onClick={applyUrl}
                disabled={!urlValue.trim()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Gunakan
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* --- 4. MULTIPLE CHOICE BLOCK EDITOR -------------------------------------- */
/* ========================================================================= */
interface MultipleChoiceBlockEditorProps {
  block: MultipleChoiceBlock;
  onChange: (content: MultipleChoiceBlock['content']) => void;
}

const MultipleChoiceBlockEditor: React.FC<MultipleChoiceBlockEditorProps> = ({ block, onChange }) => {
  const content = block.content || { question: '', options: [], correctOptionId: '' };

  const updateQuestion = (question: string) => {
    onChange({ ...content, question });
  };

  const updateOptionText = (optionId: string, text: string) => {
    const newOptions = content.options.map(o => o.id === optionId ? { ...o, text } : o);
    onChange({ ...content, options: newOptions });
  };

  const setCorrectOption = (correctOptionId: string) => {
    onChange({ ...content, correctOptionId });
  };

  const addOption = () => {
    const newOpt = { id: crypto.randomUUID(), text: '' };
    onChange({ 
      ...content, 
      options: [...content.options, newOpt],
      correctOptionId: content.correctOptionId || newOpt.id
    });
  };

  const removeOption = (optionId: string) => {
    if (content.options.length <= 2) {
      alert('Kuis pilihan ganda minimal memiliki 2 opsi jawaban.');
      return;
    }
    const newOptions = content.options.filter(o => o.id !== optionId);
    let newCorrect = content.correctOptionId;
    if (newCorrect === optionId && newOptions.length > 0) {
      newCorrect = newOptions[0].id;
    }
    onChange({ ...content, options: newOptions, correctOptionId: newCorrect });
  };

  return (
    <div className="space-y-4">
      {/* Soal Input */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          Pertanyaan / Soal Kuis:
        </label>
        <textarea
          value={content.question}
          onChange={(e) => updateQuestion(e.target.value)}
          placeholder="Tuliskan pertanyaan untuk menguji pemahaman bab ini..."
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[75px]"
        />
      </div>

      {/* Options List */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Pilihan Jawaban (Tandai lingkaran hijau pada jawaban yang benar):
        </label>
        {content.options.map((opt, idx) => {
          const isCorrect = content.correctOptionId === opt.id;
          const letter = String.fromCharCode(65 + idx); // A, B, C, D...

          return (
            <div 
              key={opt.id}
              className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                isCorrect 
                  ? 'border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/30' 
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'
              }`}
            >
              {/* Radio to mark correct */}
              <button
                type="button"
                onClick={() => setCorrectOption(opt.id)}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isCorrect 
                    ? 'bg-emerald-600 text-white' 
                    : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                }`}
                title={isCorrect ? 'Jawaban Benar' : 'Jadikan Jawaban Benar'}
              >
                {isCorrect && <Check className="w-3.5 h-3.5" />}
              </button>

              <span className="text-xs font-bold font-mono text-slate-500 w-4">
                {letter}.
              </span>

              {/* Option Text */}
              <input
                type="text"
                value={opt.text}
                onChange={(e) => updateOptionText(opt.id, e.target.value)}
                placeholder={`Teks pilihan ${letter}...`}
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              />

              {/* Delete Option */}
              <button
                type="button"
                onClick={() => removeOption(opt.id)}
                className="p-1 text-slate-400 hover:text-rose-500 rounded-md cursor-pointer transition-colors"
                title="Hapus Opsi"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addOption}
          className="mt-1 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Opsi Jawaban</span>
        </button>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* --- 5. ORDERING BLOCK EDITOR --------------------------------------------- */
/* ========================================================================= */
interface OrderingBlockEditorProps {
  block: OrderingBlock;
  onChange: (content: OrderingBlock['content']) => void;
}

const OrderingBlockEditor: React.FC<OrderingBlockEditorProps> = ({ block, onChange }) => {
  const content = block.content || { items: [] };

  const addItem = () => {
    const newItem = { id: crypto.randomUUID(), text: '' };
    onChange({ items: [...content.items, newItem] });
  };

  const updateItemText = (id: string, text: string) => {
    const newItems = content.items.map(i => i.id === id ? { ...i, text } : i);
    onChange({ items: newItems });
  };

  const removeItem = (id: string) => {
    onChange({ items: content.items.filter(i => i.id !== id) });
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= content.items.length) return;
    const nextItems = [...content.items];
    [nextItems[index], nextItems[target]] = [nextItems[target], nextItems[index]];
    onChange({ items: nextItems });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Petunjuk Latihan Urutan:
        </label>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
          Masukkan item-item di bawah ini dalam URUTAN YANG BENAR. Siswa akan diminta menyusunnya saat membaca.
        </p>
      </div>

      <div className="space-y-2">
        {content.items.map((item, idx) => (
          <div 
            key={item.id}
            className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <span className="w-6 h-6 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold font-mono flex items-center justify-center shrink-0">
              {idx + 1}
            </span>

            <input
              type="text"
              value={item.text}
              onChange={(e) => updateItemText(item.id, e.target.value)}
              placeholder={`Butir ke-${idx + 1}...`}
              className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />

            <button
              type="button"
              onClick={() => moveItem(idx, 'up')}
              disabled={idx === 0}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
              title="Pindah ke atas"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => moveItem(idx, 'down')}
              disabled={idx === content.items.length - 1}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
              title="Pindah ke bawah"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
              title="Hapus butir"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Butir Urutan</span>
        </button>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* --- 6. VIDEO BLOCK EDITOR ------------------------------------------------ */
/* ========================================================================= */
interface VideoBlockEditorProps {
  block: import('../../../types').VideoBlock;
  onChange: (content: string) => void;
}

const VideoBlockEditor: React.FC<VideoBlockEditorProps> = ({ block, onChange }) => {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-rose-500" />
          Link Video (YouTube, dsb):
        </label>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
          Masukkan URL video. Siswa dapat menonton video ini secara langsung dalam materi.
        </p>
      </div>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="url"
            value={block.content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          />
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
      </div>
      
      {block.content && (
        <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-500">
            <LinkIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Video Terhubung</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-sm">{block.content}</p>
          </div>
        </div>
      )}
    </div>
  );
};
