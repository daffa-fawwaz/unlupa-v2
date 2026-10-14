import React, { useState } from 'react';
import { X, KeyRound, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const JoinClassModal: React.FC<Props> = ({ isOpen, onClose, language }) => {
  const { joinClassByCode } = useApp();
  const [codeInputValue, setCodeInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinMessage, setJoinMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = codeInputValue.trim().toUpperCase();
    if (!cleanCode) return;

    setIsSubmitting(true);
    setJoinMessage(null);

    const res = await joinClassByCode(cleanCode);
    setIsSubmitting(false);

    if (res.success) {
      setJoinMessage({ text: res.message || (language === 'en' ? 'Successfully joined class!' : 'Berhasil bergabung ke kelas!'), isError: false });
      setTimeout(() => {
        setCodeInputValue('');
        setJoinMessage(null);
        onClose();
      }, 1500);
    } else {
      setJoinMessage({ text: res.message || (language === 'en' ? 'Invalid class code' : 'Kode kelas tidak valid'), isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-left relative animate-in zoom-in-95">
        <button
          onClick={() => {
            onClose();
            setCodeInputValue('');
            setJoinMessage(null);
          }}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {language === 'en' ? 'Join Class with Code' : 'Gabung Kelas dengan Kode'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Enter the class invitation code provided by your teacher.' : 'Masukkan kode undangan kelas dari pengajar Anda.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'en' ? 'Class Code' : 'Kode Kelas'}
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                autoFocus
                placeholder={language === 'en' ? 'e.g. QRN-89AB' : 'contoh: QRN-89AB'}
                value={codeInputValue}
                onChange={(e) => setCodeInputValue(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-2.5 clay-inset rounded-2xl text-sm font-mono font-bold tracking-wider text-slate-900 dark:text-white focus:outline-none uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:tracking-normal"
              />
            </div>
            {joinMessage && (
              <p className={`text-xs mt-2 ml-1 font-semibold flex items-center gap-1.5 ${
                joinMessage.isError ? 'text-rose-500' : 'text-emerald-500'
              }`}>
                {!joinMessage.isError && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                <span>{joinMessage.text}</span>
              </p>
            )}
          </div>

          <div className="flex gap-2.5 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                setCodeInputValue('');
                setJoinMessage(null);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : 'Batal'}
            </button>
            <button
              type="submit"
              disabled={!codeInputValue.trim() || isSubmitting}
              className="px-5 py-2 rounded-xl clay-btn-primary font-bold text-xs sm:text-sm text-white disabled:opacity-40 transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              {isSubmitting 
                ? (language === 'en' ? 'Joining...' : 'Bergabung...') 
                : (language === 'en' ? 'Join Class' : 'Gabung Kelas')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
