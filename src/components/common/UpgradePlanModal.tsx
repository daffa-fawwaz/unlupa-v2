import React, { useState } from "react";
import {
  X,
  Check,
  Brain,
  Crown,
  Zap,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  QrCode,
  Building,
  Wallet,
  CreditCard,
  Clock,
  Copy,
  DownloadCloud,
  AlertCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { PaymentMethod, BookTransaction } from "../../types";

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggeredFeature?: string;
  triggerMessage?: string;
}

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  triggeredFeature,
  triggerMessage,
}) => {
  const {
    userProfile,
    updateUserProfile,
    tierConfig,
    language,
    subscribeToPro,
  } = useApp();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly",
  );
  const [step, setStep] = useState<"overview" | "checkout" | "success">(
    "overview",
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("qris");
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedTx, setCompletedTx] = useState<BookTransaction | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const isCurrentPro =
    userProfile.plan === "premium" || userProfile.plan === "institutional";

  const monthlyPriceNum = tierConfig?.pricing?.monthlyIDR || 49000;
  const yearlyPriceNum = tierConfig?.pricing?.yearlyIDR || 399000;
  const totalAmount =
    billingCycle === "yearly" ? yearlyPriceNum : monthlyPriceNum;

  const monthlyPrice = monthlyPriceNum.toLocaleString("id-ID");
  const yearlyPrice = yearlyPriceNum.toLocaleString("id-ID");
  const monthlyEquivalent = Math.round(yearlyPriceNum / 12).toLocaleString(
    "id-ID",
  );

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleInstantToggle = (targetPlan: "free" | "premium") => {
    setIsProcessing(true);
    setTimeout(() => {
      updateUserProfile({ plan: targetPlan });
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  const handleCompleteSubscription = async () => {
    setIsProcessing(true);
    try {
      // Simulate real gateway latency
      await new Promise((r) => setTimeout(r, 1200));
      const res = await subscribeToPro(billingCycle, paymentMethod);
      if (res.success) {
        setCompletedTx(res.transaction);
        setStep("success");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const proFeatures = [
    {
      icon: <Brain className="w-5 h-5 text-amber-500" />,
      titleEn: "Unlimited AI Book & Cards Builder",
      titleId: "AI Builder & Smart Extractor Tanpa Batas",
      descEn:
        "Generate entire structured books and extracted cards up to 30x/day.",
      descId:
        "Buat modul kitab, materi, dan kartu hafalan otomatis hingga 30x/hari.",
    },
    {
      icon: <BookOpen className="w-5 h-5 text-emerald-500" />,
      titleEn: "Full 30 Juz Mushaf (604 Pages)",
      titleId: "Seluruh 30 Juz Al-Qur'an (604 Halaman)",
      descEn:
        "Full adaptive memory scheduling across all 30 Juz and unlimited audio recordings.",
      descId:
        "Jadwal murajaah adaptif untuk seluruh 30 juz dan rekaman suara cloud.",
    },
    {
      icon: <GraduationCap className="w-5 h-5 text-blue-500" />,
      titleEn: "Teaching Mode & Student Monitoring",
      titleId: "Mode Pengajar & Manajemen Halaqah",
      descEn:
        "Create multiple classes, invite students, and track real-time retention reports.",
      descId:
        "Buat kelas tanpa batas, undang santri, dan unduh rapor evaluasi berkala.",
    },
    {
      icon: <Zap className="w-5 h-5 text-purple-500" />,
      titleEn: "Unlimited Books & Nested Hierarchy",
      titleId: "Buku, Bab & Subbab Tanpa Batas",
      descEn:
        "Store and organize all your study materials with zero memory caps.",
      descId:
        "Simpan semua catatan materi, kitab, dan vocabulary tanpa batas kuota.",
    },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header with decorative gradient banner */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-amber-500/10 via-indigo-500/5 to-purple-500/10 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <span className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
              <Crown className="w-6 h-6" />
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>UNLUPA PRO</span>
            </div>
            {step === "checkout" && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Langkah 2: Checkout
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {step === "success"
              ? language === "en"
                ? "Welcome to Unlupa Pro!"
                : "Selamat Datang di Unlupa Pro!"
              : step === "checkout"
                ? language === "en"
                  ? "Complete Pro Subscription"
                  : "Selesaikan Pembayaran Pro"
                : language === "en"
                  ? "Unlock Unlimited Mastery"
                  : "Buka Potensi Penuh Penjagaan Ilmu"}
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 max-w-lg">
            {step === "success"
              ? "Akun Anda kini telah aktif sebagai Unlupa Pro. Semua batasan kuota telah dicabut."
              : triggerMessage ||
                (language === "en"
                  ? "Elevate your retention with unlimited AI builders, full 30-Juz Qur'an room, and Teaching capabilities."
                  : "Tingkatkan retensi hafalan dengan AI builder tanpa batas, 30 Juz Qur'an penuh, dan akses mode Pengajar/Halaqah.")}
          </p>

          {triggeredFeature && step === "overview" && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider">
                {language === "en" ? "Limit Reached:" : "Batas Kuota:"}
              </span>
              <span>{triggeredFeature}</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          {/* STEP 1: Overview & Cycle Selector */}
          {step === "overview" && (
            <>
              {/* Billing Cycle Selector */}
              <div className="flex justify-center">
                <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      billingCycle === "monthly"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {language === "en" ? "Monthly" : "Bulanan"}
                  </button>
                  <button
                    onClick={() => setBillingCycle("yearly")}
                    className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      billingCycle === "yearly"
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>{language === "en" ? "Yearly" : "Tahunan"}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold uppercase">
                      {language === "en" ? "Save 32%" : "Hemat 32%"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Pricing Highlight */}
              <div className="text-center">
                {billingCycle === "yearly" ? (
                  <div>
                    <div className="flex items-baseline justify-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-400">
                        Rp
                      </span>
                      <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                        {monthlyEquivalent}
                      </span>
                      <span className="text-sm font-medium text-slate-500">
                        / {language === "en" ? "month" : "bulan"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {language === "en"
                        ? `Billed annually at Rp ${yearlyPrice}/year`
                        : `Ditagih tahunan sebesar Rp ${yearlyPrice}/tahun`}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline justify-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-400">
                        Rp
                      </span>
                      <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                        {monthlyPrice}
                      </span>
                      <span className="text-sm font-medium text-slate-500">
                        / {language === "en" ? "month" : "bulan"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {language === "en"
                        ? "Billed monthly, cancel anytime"
                        : "Ditagih bulanan, dapat dibatalkan kapan saja"}
                    </p>
                  </div>
                )}
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {proFeatures.map((feat, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3"
                  >
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm shrink-0 mt-0.5">
                      {feat.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {language === "en" ? feat.titleEn : feat.titleId}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {language === "en" ? feat.descEn : feat.descId}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* STEP 2: Checkout & Payment Method */}
          {step === "checkout" && (
            <div className="space-y-6">
              {/* Order Summary Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span>
                      Unlupa Pro (
                      {billingCycle === "yearly"
                        ? "Langganan 1 Tahun"
                        : "Langganan 1 Bulan"}
                      )
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Akses tak terbatas ke seluruh modul & AI builder
                  </p>
                </div>
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {formatIDR(totalAmount)}
                </span>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  Pilih Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: "qris",
                      name: "QRIS",
                      sub: "Semua E-Wallet / Mobile Banking",
                      icon: <QrCode className="w-4 h-4 text-rose-500" />,
                    },
                    {
                      id: "bca_va",
                      name: "BCA Virtual Account",
                      sub: "Otomatis 24 Jam",
                      icon: <Building className="w-4 h-4 text-blue-500" />,
                    },
                    {
                      id: "mandiri_va",
                      name: "Mandiri Livin",
                      sub: "Virtual Account",
                      icon: <Building className="w-4 h-4 text-amber-500" />,
                    },
                    {
                      id: "bri_va",
                      name: "BRI BRIVA",
                      sub: "Virtual Account",
                      icon: <Building className="w-4 h-4 text-emerald-500" />,
                    },
                    {
                      id: "gopay",
                      name: "GoPay / QRIS",
                      sub: "Instan 1-Klik",
                      icon: <Wallet className="w-4 h-4 text-cyan-500" />,
                    },
                    {
                      id: "card",
                      name: "Kartu Kredit / Debit",
                      sub: "Visa & Mastercard",
                      icon: <CreditCard className="w-4 h-4 text-purple-500" />,
                    },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        paymentMethod === m.id
                          ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 shadow-xs ring-2 ring-amber-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        {m.icon}
                        {paymentMethod === m.id && (
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {m.name}
                      </p>
                      <p className="text-[10px] text-slate-500 line-clamp-1">
                        {m.sub}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Details Simulator Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      Sisa Waktu Pembayaran:{" "}
                      <strong className="text-slate-800 dark:text-slate-200">
                        14:59
                      </strong>
                    </span>
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Verifikasi Otomatis
                  </span>
                </div>

                {paymentMethod === "qris" ? (
                  <div className="flex flex-col items-center py-2">
                    <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 text-center">
                      <QrCode className="w-32 h-32 text-slate-900 mx-auto" />
                      <span className="text-[10px] font-mono text-slate-500 block mt-1">
                        NMID: ID1020269988123
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      Buka aplikasi BCA Mobile, GoPay, OVO, ShopeePay, atau
                      Livin Mandiri lalu scan QR code di atas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                          Nomor Virtual Account
                        </span>
                        <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                          88019 0812 3456 7890
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard("88019081234567890", "va")
                        }
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>
                          {copiedText === "va" ? "Tersalin!" : "Salin"}
                        </span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Transfer tepat sebesar{" "}
                      <strong>{formatIDR(totalAmount)}</strong> untuk aktivasi
                      instan tanpa konfirmasi manual.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === "success" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <Check className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Pembayaran Berhasil & Akun Pro Aktif!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Terima kasih telah bergabung dengan Unlupa Pro. Invoice resmi
                  telah diterbitkan ke sistem ledger akun Anda.
                </p>
              </div>

              {completedTx && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-left text-xs space-y-2">
                  <div className="flex justify-between text-slate-500">
                    <span>No. Invoice:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {completedTx.id}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Paket:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {completedTx.bookTitle}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Total Tagihan:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatIDR(completedTx.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Status:</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                      Lunas (Active)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              {language === "en"
                ? "SSL 256-Bit Encrypted • Instant Real-Time Sync"
                : "Enkripsi SSL 256-Bit • Sinkronisasi Real-Time"}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {step === "overview" && (
              <>
                {isCurrentPro ? (
                  <button
                    onClick={() => handleInstantToggle("free")}
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`}
                    />
                    <span>Kembalikan ke Akun Free (Uji Coba)</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleInstantToggle("premium")}
                      disabled={isProcessing}
                      className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                      title="Langsung aktifkan tanpa pembayaran simulasi"
                    >
                      <span>1-Klik Test Mode</span>
                    </button>
                    <button
                      onClick={() => setStep("checkout")}
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Crown className="w-4 h-4" />
                      <span>Upgrade Pro ({formatIDR(totalAmount)})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </>
            )}

            {step === "checkout" && (
              <>
                <button
                  onClick={() => setStep("overview")}
                  disabled={isProcessing}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  onClick={handleCompleteSubscription}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Memproses Pembayaran...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simulasikan Pembayaran Selesai</span>
                    </>
                  )}
                </button>
              </>
            )}

            {step === "success" && (
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-sm shadow-lg transition-all cursor-pointer"
              >
                Mulai Belajar dengan Pro
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
