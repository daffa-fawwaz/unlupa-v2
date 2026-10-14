import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Share2, 
  BookOpen, 
  Check, 
  ShieldCheck, 
  Pencil, 
  Globe, 
  Tag, 
  Layers, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBookId?: string | null;
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, preselectedBookId }) => {
  const { books, items, library, publishBookToLibrary, language } = useApp();
  const [selectedBookId, setSelectedBookId] = useState<string>(preselectedBookId || '');
  
  // Authenticity & Edit Permission: Default to FALSE (Hanya Baca / Otentik) for protection
  const [allowEdit, setAllowEdit] = useState(false);
  
  // Pricing Foundation: Free vs Paid
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<number>(25000);
  
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Filter ONLY personal original works (never someone else's imported read-only book)
  const myBooks = books.filter(b => !b.isReadonly);

  useEffect(() => {
    if (isOpen) {
      if (preselectedBookId && myBooks.some(b => b.id === preselectedBookId)) {
        setSelectedBookId(preselectedBookId);
      } else if (myBooks.length > 0 && !selectedBookId) {
        // Find first unpublished book if possible
        const firstUnpublished = myBooks.find(b => !library.some(l => l.book.id === b.id));
        setSelectedBookId(firstUnpublished?.id || myBooks[0].id);
      }
      setStatus(null);
    }
  }, [isOpen, preselectedBookId]);

  if (!isOpen) return null;

  const selectedBook = myBooks.find(b => b.id === selectedBookId);
  const selectedBookItems = selectedBook ? items.filter(i => i.bookId === selectedBook.id) : [];
  const isSelectedAlreadyPublished = selectedBook ? library.some(l => l.book.id === selectedBook.id) : false;

  const handlePublish = async () => {
    if (!selectedBookId || isSelectedAlreadyPublished) return;
    
    const result = await publishBookToLibrary(selectedBookId, allowEdit, {
      isPaid,
      price: isPaid ? price : 0
    });

    setStatus({ type: result.success ? 'success' : 'error', msg: result.message });
    if (result.success) {
      setTimeout(() => {
        onClose();
        setStatus(null);
      }, 1600);
    }
  };

  const presetPrices = [15000, 25000, 50000, 100000];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="clay-card w-full max-w-xl rounded-3xl shadow-2xl border border-black/[0.04] dark:border-white/[0.06] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-black/[0.04] dark:border-white/[0.05] bg-[#FAFBFC]/80 dark:bg-[#141C2B]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl clay-icon-pod-orange flex items-center justify-center shrink-0 shadow-sm">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight">
                {language === 'en' ? 'Publish Kitab to Library' : 'Publikasikan Kitab ke Pustaka'}
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">
                {language === 'en'
                  ? 'Share your curated work with students and the global community'
                  : 'Bagikan karya kurasi Anda kepada santri dan komunitas penuntut ilmu'}
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {status && (
            <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xs ${
              status.type === 'success' 
                ? 'clay-badge-emerald text-white' 
                : 'clay-badge-rose text-white'
            }`}>
              {status.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-white shrink-0" />
              )}
              <span>{status.msg}</span>
            </div>
          )}

          {/* 1. Pemilihan Karya Pribadi */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-extrabold text-[#18234A] dark:text-[#F8FAFC] uppercase tracking-wider">
                {language === 'en' ? 'Select Personal Work' : 'Pilih Karya Pribadi untuk Dipublikasikan'}
              </label>
              <span className="text-[11px] font-extrabold text-[#64748B] dark:text-[#94A3B8]">
                {myBooks.length} {language === 'en' ? 'works available' : 'karya tersedia'}
              </span>
            </div>

            {myBooks.length === 0 ? (
              <div className="p-6 rounded-2xl clay-inset text-center text-[#64748B] dark:text-[#94A3B8] text-xs font-medium">
                {language === 'en' 
                  ? 'No personal works available. Create a book in Personal Space first.' 
                  : 'Belum ada karya pribadi. Buat kitab karya Anda sendiri terlebih dahulu di Ruang Pribadi.'}
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                {myBooks.map(b => {
                  const bItemsCount = items.filter(i => i.bookId === b.id).length;
                  const isAlreadyPub = library.some(l => l.book.id === b.id);
                  const isSelected = selectedBookId === b.id;

                  return (
                    <div
                      key={b.id}
                      onClick={() => !isAlreadyPub && setSelectedBookId(b.id)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all select-none ${
                        isAlreadyPub
                          ? 'clay-card-subtle opacity-60 cursor-not-allowed border-black/[0.02]'
                          : isSelected
                          ? 'clay-card border-[#F27A3D]/40 scale-[1.01] shadow-xs cursor-pointer'
                          : 'clay-card-subtle hover:scale-[1.005] cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {b.coverUrl ? (
                          <img
                            src={b.coverUrl}
                            alt={b.title}
                            className="w-11 h-14 rounded-xl object-cover border border-black/20 shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="w-11 h-14 rounded-xl bg-gradient-to-br from-emerald-950 to-slate-950 border border-emerald-700/60 flex items-center justify-center text-amber-300 shrink-0">
                            <BookOpen className="w-5 h-5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-[#18234A] dark:text-[#F8FAFC] truncate">
                            {b.title}
                          </h4>
                          <p className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] truncate mt-0.5">
                            {b.authorName || (language === 'en' ? 'Personal Work' : 'Karya Pribadi Anda')}
                          </p>

                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full clay-pill text-[10px] font-extrabold text-[#18234A] dark:text-[#F8FAFC]">
                              <Layers className="w-3 h-3 text-[#64748B]" />
                              <span>{bItemsCount} kartu</span>
                            </span>

                            {isAlreadyPub ? (
                              <span className="px-2.5 py-0.5 rounded-full clay-badge-emerald text-white text-[10px] font-extrabold flex items-center gap-1 shadow-2xs">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                                {language === 'en' ? 'Already in Library' : 'Sudah Dipublikasikan'}
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full clay-badge-orange text-white text-[10px] font-extrabold shadow-2xs">
                                {language === 'en' ? 'Ready to Publish' : 'Siap Dipublikasi'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Radio Selector Indicator */}
                      <div className="shrink-0 pr-1">
                        {isAlreadyPub ? (
                          <span className="text-[10px] font-extrabold text-[#64748B] clay-pill px-2 py-1">
                            {language === 'en' ? 'Active' : 'Aktif'}
                          </span>
                        ) : (
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'clay-badge-orange border-transparent text-white shadow-2xs scale-105'
                              : 'clay-pill border-black/10'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-white" />}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedBook && !isSelectedAlreadyPublished && (
              <div className="mt-2.5 p-3 rounded-2xl clay-inset text-[11px] text-[#18234A] dark:text-[#F8FAFC] flex items-center justify-between font-bold">
                <span>
                  <strong>{language === 'en' ? 'Selected:' : 'Terpilih:'}</strong> {selectedBook.title}
                </span>
                <span className="text-[#F27A3D] font-extrabold">
                  {selectedBookItems.length} {language === 'en' ? 'cards ready' : 'kartu hafalan'}
                </span>
              </div>
            )}
          </div>

          {/* 2. Hak Akses & Keotentikan */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-[#18234A] dark:text-[#F8FAFC] uppercase tracking-wider">
              {language === 'en' ? 'Authenticity & Edit Permission' : 'Keotentikan & Izin Pengeditan'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option A: Hanya Baca / Otentik */}
              <div
                onClick={() => setAllowEdit(false)}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all ${
                  !allowEdit
                    ? 'clay-card border-[#F27A3D]/40 scale-[1.01] shadow-xs'
                    : 'clay-card-subtle hover:scale-[1.005]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${!allowEdit ? 'clay-icon-pod-orange' : 'clay-pill'}`}>
                    <ShieldCheck className={`w-4 h-4 ${!allowEdit ? 'text-white' : 'text-[#64748B]'}`} />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-[#18234A] dark:text-[#F8FAFC]">
                      {language === 'en' ? 'Read-Only (Authentic)' : 'Hanya Baca (Otentik)'}
                    </h5>
                    <span className="text-[10px] text-[#F27A3D] font-extrabold">
                      {language === 'en' ? 'Recommended' : 'Sangat Direkomendasikan'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium leading-relaxed mt-1">
                  {language === 'en'
                    ? 'Protects original content. Readers study & review cards without altering your authentic scholarship.'
                    : 'Menjaga keaslian isi. Pembaca hanya dapat mempelajari & me-review materi tanpa mengubah keotentikan karya Anda.'}
                </p>
              </div>

              {/* Option B: Bisa Diedit */}
              <div
                onClick={() => setAllowEdit(true)}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all ${
                  allowEdit
                    ? 'clay-card border-[#10B981]/40 scale-[1.01] shadow-xs'
                    : 'clay-card-subtle hover:scale-[1.005]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${allowEdit ? 'clay-icon-pod-emerald' : 'clay-pill'}`}>
                    <Pencil className={`w-4 h-4 ${allowEdit ? 'text-white' : 'text-[#64748B]'}`} />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-[#18234A] dark:text-[#F8FAFC]">
                      {language === 'en' ? 'Allow Editing' : 'Bisa Diedit (Terbuka)'}
                    </h5>
                    <span className="text-[10px] text-[#10B981] font-extrabold">
                      {language === 'en' ? 'Open License' : 'Lisensi Terbuka'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium leading-relaxed mt-1">
                  {language === 'en'
                    ? 'Allows importers to edit, add chapters, and adjust flashcards for their personal requirements.'
                    : 'Pengimpor diizinkan memodifikasi atau menambah bab dan kartu sesuai kebutuhan belajar mereka.'}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Model Distribusi & Penetapan Harga */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-[#18234A] dark:text-[#F8FAFC] uppercase tracking-wider">
                {language === 'en' ? 'Pricing & Distribution Model' : 'Model Distribusi & Penetapan Harga'}
              </label>
              <span className="text-[10px] font-bold clay-pill px-2.5 py-0.5 text-[#64748B]">
                Asas Komersial & Publik
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option A: Free Public */}
              <div
                onClick={() => setIsPaid(false)}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all ${
                  !isPaid
                    ? 'clay-card border-[#F27A3D]/40 scale-[1.01] shadow-xs'
                    : 'clay-card-subtle hover:scale-[1.005]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${!isPaid ? 'clay-icon-pod-orange' : 'clay-pill'}`}>
                    <Globe className={`w-4 h-4 ${!isPaid ? 'text-white' : 'text-[#64748B]'}`} />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-[#18234A] dark:text-[#F8FAFC]">
                      {language === 'en' ? 'Free (Public Domain)' : 'Gratis (Free Public)'}
                    </h5>
                    <span className="text-[10px] text-[#F27A3D] font-extrabold">
                      Amal Jariah / Ilmu Terbuka
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium leading-relaxed mt-1">
                  {language === 'en'
                    ? 'Anyone can freely download & import this book into their review library.'
                    : 'Dapat diunduh dan dipelajari dengan cuma-cuma oleh seluruh komunitas penuntut ilmu.'}
                </p>
              </div>

              {/* Option B: Paid / Commercial */}
              <div
                onClick={() => setIsPaid(true)}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all ${
                  isPaid
                    ? 'clay-card border-[#B45309]/40 scale-[1.01] shadow-xs'
                    : 'clay-card-subtle hover:scale-[1.005]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isPaid ? 'clay-icon-pod-gold' : 'clay-pill'}`}>
                    <Tag className={`w-4 h-4 ${isPaid ? 'text-white' : 'text-[#64748B]'}`} />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-[#18234A] dark:text-[#F8FAFC]">
                      {language === 'en' ? 'Paid / Premium' : 'Berbayar (Dijual / Premium)'}
                    </h5>
                    <span className="text-[10px] text-[#B45309] dark:text-amber-400 font-extrabold">
                      Monetisasi Karya
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium leading-relaxed mt-1">
                  {language === 'en'
                    ? 'Readers purchase the book license to import it into their private space.'
                    : 'Penikmat karya membeli lisensi materi untuk dapat mengimpor ke akun belajar mereka.'}
                </p>
              </div>
            </div>

            {/* Paid Price Setting Form */}
            {isPaid && (
              <div className="p-4 rounded-2xl clay-inset space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-[#18234A] dark:text-[#F8FAFC]">
                    {language === 'en' ? 'Set Price (IDR)' : 'Tetapkan Harga Jual (Rupiah)'}
                  </label>
                  <span className="text-xs font-black text-[#F27A3D]">
                    Rp {price.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-[#F27A3D]">
                    Rp
                  </span>
                  <input
                    type="number"
                    min={5000}
                    step={5000}
                    value={price}
                    onChange={e => setPrice(Math.max(0, Number(e.target.value)))}
                    placeholder="25000"
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl clay-inset text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#F27A3D]/30"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-[#64748B] font-bold mr-1">
                    Preset:
                  </span>
                  {presetPrices.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPrice(preset)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                        price === preset
                          ? 'clay-badge-orange text-white shadow-2xs scale-105'
                          : 'clay-pill text-[#64748B] hover:text-[#18234A]'
                      }`}
                    >
                      Rp {preset.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-black/[0.04] dark:border-white/[0.05]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl clay-pill text-[#18234A] dark:text-[#F8FAFC] font-extrabold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              {language === 'en' ? 'Cancel' : 'Batal'}
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={!selectedBookId || isSelectedAlreadyPublished}
              className="px-5 py-2 rounded-xl clay-btn-primary text-white font-extrabold text-xs shadow-xs hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <Share2 className="w-4 h-4 text-white" />
              <span>
                {isSelectedAlreadyPublished
                  ? (language === 'en' ? 'Already in Library' : 'Sudah Ada di Pustaka')
                  : isPaid
                  ? (language === 'en' ? `Publish (Rp ${price.toLocaleString('id-ID')})` : `Publikasikan (Rp ${price.toLocaleString('id-ID')})`)
                  : (language === 'en' ? 'Publish for Free' : 'Publikasikan Gratis')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
