import React from 'react';
import { Language } from '../../types';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  language: Language;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
  language
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="clay-modal w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center shadow-xs">
          <AlertCircle className="w-6 h-6" />
        </div>
        
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#18234A] dark:text-[#F8FAFC]">
            {language === 'en' ? 'Confirmation' : 'Konfirmasi Tindakan'}
          </h3>
          <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8] mt-1.5 whitespace-pre-line leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-2xl clay-card-subtle text-xs font-bold text-[#5E6D88] hover:text-[#18234A] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Cancel' : 'Batal'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            {language === 'en' ? 'Yes, Delete' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
};
