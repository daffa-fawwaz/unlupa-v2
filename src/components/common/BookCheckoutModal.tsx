import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { LibraryEntry } from '../../data/sampleBooks';
import { PaymentMethod, BookTransaction } from '../../types';
import { 
  X, 
  ShieldCheck, 
  QrCode, 
  CreditCard, 
  Building2, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  ArrowRight, 
  Download, 
  BookOpen, 
  Layers, 
  Lock,
  ChevronRight,
  ExternalLink,
  ReceiptText,
  AlertCircle
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entry: LibraryEntry | null;
  onPurchaseSuccess?: (entry: LibraryEntry, transaction: BookTransaction) => void;
}

export const BookCheckoutModal: React.FC<Props> = ({ isOpen, onClose, entry, onPurchaseSuccess }) => {
  const { language, userProfile, purchaseBook, importFromLibrary, setActiveSpace } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris');
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment_process' | 'success'>('details');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<BookTransaction | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(900); // 15 minutes timer

  useEffect(() => {
    if (isOpen) {
      setCheckoutStep('details');
      setIsProcessing(false);
      setCompletedTransaction(null);
      setRemainingSeconds(900);
      setPaymentMethod('qris');
    }
  }, [isOpen, entry]);

  // Countdown timer for pending payment
  useEffect(() => {
    if (checkoutStep === 'payment_process' && remainingSeconds > 0) {
      const timer = setInterval(() => {
        setRemainingSeconds(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [checkoutStep, remainingSeconds]);

  if (!isOpen || !entry) return null;

  const book = entry.book;
  const price = book.price || 0;
  const platformFee = 0; // Promo zero platform fee
  const totalAmount = price + platformFee;

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleProceedToPayment = () => {
    setCheckoutStep('payment_process');
  };

  const handleSimulatePaymentSuccess = async () => {
    setIsProcessing(true);
    try {
      const result = await purchaseBook(entry, paymentMethod);
      if (result.success) {
        setCompletedTransaction(result.transaction);
        setCheckoutStep('success');
        if (onPurchaseSuccess) {
          onPurchaseSuccess(entry, result.transaction);
        }
      }
    } catch (e) {
      console.error('Payment processing failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenPurchasedBook = () => {
    onClose();
    setActiveSpace('personal');
  };

  const paymentOptions: { id: PaymentMethod; name: string; category: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'qris',
      name: 'QRIS Real-Time (Semua Bank & E-Wallet)',
      category: 'Instant QR',
      icon: <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      desc: 'BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay'
    },
    {
      id: 'bca_va',
      name: 'BCA Virtual Account',
      category: 'Virtual Account',
      icon: <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      desc: 'Verifikasi instan otomatis 24 jam'
    },
    {
      id: 'mandiri_va',
      name: 'Mandiri Virtual Account',
      category: 'Virtual Account',
      icon: <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      desc: 'Verifikasi instan via Livin\' Mandiri / ATM'
    },
    {
      id: 'bri_va',
      name: 'BRI Virtual Account (BRIVA)',
      category: 'Virtual Account',
      icon: <Building2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      desc: 'Verifikasi instan via BRImo / ATM'
    },
    {
      id: 'gopay',
      name: 'GoPay / GoPay Later',
      category: 'E-Wallet',
      icon: <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      desc: 'Pembayaran instan 1-klik dengan aplikasi Gojek'
    },
    {
      id: 'credit_card',
      name: 'Kartu Kredit / Debit Online',
      category: 'Card',
      icon: <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      desc: 'Visa, MasterCard, JCB, American Express'
    }
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {checkoutStep === 'success' 
                  ? (language === 'en' ? 'Payment Successful' : 'Pembelian Berhasil')
                  : (language === 'en' ? 'Checkout & Purchase Kitab' : 'Pembelian & Akses Kitab')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {checkoutStep === 'success'
                  ? (language === 'en' ? 'Kitab has been added to your library' : 'Kitab siap dipelajari seumur hidup')
                  : (language === 'en' ? 'Official Digital Edition • Lifetime Access' : 'Edisi Resmi Digital • Akses Seumur Hidup')}
              </p>
            </div>
          </div>
          {checkoutStep !== 'payment_process' && (
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* STEP 1: ORDER DETAILS & PAYMENT SELECTION */}
          {checkoutStep === 'details' && (
            <>
              {/* Item Card Banner */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3.5">
                <div className="w-16 h-22 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-300 dark:border-slate-600 shadow-2xs">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <BookOpen className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                      {book.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Terverifikasi</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug line-clamp-2">
                    {book.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {book.authorName || entry.curator}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1 font-medium">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {entry.items?.length || 0} Kartu Hafalan
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <Lock className="w-3 h-3" />
                      Akses Selamanya
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {language === 'en' ? 'Select Payment Method' : 'Pilih Metode Pembayaran'}
                </label>

                <div className="grid grid-cols-1 gap-2">
                  {paymentOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPaymentMethod(opt.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        paymentMethod === opt.id
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                          {opt.icon}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                            {opt.name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                            {opt.desc}
                          </span>
                        </div>
                      </div>

                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        paymentMethod === opt.id
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {paymentMethod === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Harga Kitab</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatIDR(price)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Biaya Layanan & Gateway</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Gratis (Rp 0)</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white">
                  <span>Total Pembayaran</span>
                  <span className="text-base text-indigo-600 dark:text-indigo-400">{formatIDR(totalAmount)}</span>
                </div>
              </div>

              {/* Guarantees */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 px-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Pembayaran aman terenkripsi 256-bit. Kitab langsung aktif otomatis setelah pembayaran.</span>
              </div>
            </>
          )}

          {/* STEP 2: PAYMENT GATEWAY SIMULATION */}
          {checkoutStep === 'payment_process' && (
            <div className="space-y-4 animate-in fade-in text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Menunggu Pembayaran • Sisa Waktu: {formatTimer(remainingSeconds)}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                {paymentMethod === 'qris' ? (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      SCAN QR DENGAN APAPUN (BCA / GOPAY / OVO / DANA / BRIMO)
                    </span>
                    <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-md border border-slate-200 flex flex-col items-center justify-center relative group">
                      {/* Realistic Simulated Dynamic QR */}
                      <div className="w-full h-full bg-slate-900 rounded-xl p-2 flex flex-col items-center justify-between text-white">
                        <div className="w-full flex justify-between items-center text-[8px] font-mono tracking-widest text-slate-400">
                          <span>UNLUPA-QRIS</span>
                          <span>NMID: ID10293847</span>
                        </div>
                        <QrCode className="w-28 h-28 text-white stroke-[1.5]" />
                        <div className="text-[9px] font-bold tracking-wider text-amber-300">
                          {formatIDR(totalAmount)}
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Buka aplikasi perbankan atau e-wallet Anda, lalu arahkan kamera ke kode QR di atas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 text-left">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      NOMOR VIRTUAL ACCOUNT
                    </span>
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      <span>8077708{Math.floor(10000000 + Math.random() * 90000000)}</span>
                      <button
                        onClick={() => handleCopy('8077708123456789')}
                        className="px-2.5 py-1 text-xs font-sans rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedText ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                      <p>1. Salin nomor Virtual Account di atas.</p>
                      <p>2. Lakukan transfer sejumlah <strong>{formatIDR(totalAmount)}</strong> tepat.</p>
                      <p>3. Transaksi akan terverifikasi otomatis dalam hitungan detik.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sandbox Simulation Trigger */}
              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900 text-left flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 dark:text-indigo-200">
                  <strong className="font-semibold block">Simulasi Transaksi Prototype:</strong>
                  Klik tombol konfirmasi di bawah untuk memvalidasi pembayaran secara otomatis dan mengaktifkan kepemilikan kitab.
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS & INVOICE RECEIPT */}
          {checkoutStep === 'success' && completedTransaction && (
            <div className="space-y-4 animate-in zoom-in-95 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Pembayaran Berhasil!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Kitab <strong className="text-slate-800 dark:text-slate-200">{book.title}</strong> telah ditambahkan ke Ruang Buku Anda.
                </p>
              </div>

              {/* Digital Receipt Card */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">Nomor Invoice</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{completedTransaction.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tanggal Transaksi</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {new Date(completedTransaction.paidAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Metode Pembayaran</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 uppercase">{completedTransaction.paymentMethod.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Royalti Penulis (85%)</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatIDR(completedTransaction.authorRoyalty)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800 font-bold text-sm">
                  <span className="text-slate-900 dark:text-white">Total Lunas</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{formatIDR(completedTransaction.amount)}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between gap-3">
          {checkoutStep === 'details' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleProceedToPayment}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Lanjut ke Pembayaran ({formatIDR(totalAmount)})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {checkoutStep === 'payment_process' && (
            <>
              <button
                type="button"
                onClick={() => setCheckoutStep('details')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Ubah Metode
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSimulatePaymentSuccess}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simulasi Pembayaran Berhasil</span>
                  </>
                )}
              </button>
            </>
          )}

          {checkoutStep === 'success' && (
            <div className="w-full flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleOpenPurchasedBook}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Mulai Belajar & Hafalkan di Ruang Buku</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
