import React, { useState } from "react";
import {
  X,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  ExternalLink,
  Shield,
  Crown,
  ArrowRight,
  ShieldCheck,
  Copy,
  Receipt,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { BookTransaction } from "../../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const BillingHistoryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { userProfile, transactions, openUpgradeModal, language } = useApp();
  const [selectedTx, setSelectedTx] = useState<BookTransaction | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const isPro =
    userProfile.plan === "premium" || userProfile.plan === "institutional";
  const myTransactions = transactions.filter(
    (t) => t.userId === userProfile.id || t.userEmail === userProfile.email,
  );

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === "en"
                  ? "Billing & Transactions"
                  : "Langganan & Riwayat Transaksi"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === "en"
                  ? "Manage your plan, invoices, and purchase records"
                  : "Kelola paket akun, invoice resmi, dan bukti pembayaran"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Subscription Status Banner */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isPro
                ? "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 border-amber-200/80 dark:border-amber-800/60"
                : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 ${
                      isPro
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {isPro ? (
                      <Crown className="w-3 h-3" />
                    ) : (
                      <Shield className="w-3 h-3 text-slate-400" />
                    )}
                    <span>{userProfile.plan.toUpperCase()} PLAN</span>
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aktif</span>
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white pt-1">
                  {isPro
                    ? "Unlupa Pro (Akses Penuh Tanpa Batas)"
                    : "Paket Free (Standar Santri)"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                  {isPro
                    ? "Anda menikmati kuota tak terbatas untuk Mushaf 30 Juz, AI Builder, pembuatan kelas tak terbatas, dan fitur pengajar."
                    : "Batas maksimal 2 buku aktif, 50 kartu per buku, dan Juz 30 Qur'an."}
                </p>
              </div>

              <div>
                {!isPro ? (
                  <button
                    onClick={() => {
                      onClose();
                      openUpgradeModal(
                        "Billing Center",
                        "Tingkatkan akun Anda ke Unlupa Pro untuk membuka seluruh potensi pembelajaran.",
                      );
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Upgrade ke Pro</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onClose();
                      openUpgradeModal(
                        "Kelola Langganan",
                        "Ubah siklus tagihan atau beralih paket.",
                      );
                    }}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                  >
                    <span>Ubah Siklus Langganan</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {language === "en"
                  ? "Invoice History"
                  : "Daftar Invoice & Transaksi"}
              </h4>
              <span className="text-[11px] text-slate-500">
                Total {myTransactions.length} Transaksi
              </span>
            </div>

            {myTransactions.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Belum ada transaksi pembelian buku atau langganan berbayar.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          tx.type.startsWith("subscription")
                            ? "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                            : "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                        }`}
                      >
                        {tx.type.startsWith("subscription") ? (
                          <Crown className="w-4 h-4" />
                        ) : (
                          <CreditCard className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                            {tx.id}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 uppercase">
                            {tx.status}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate mt-0.5">
                          {tx.bookTitle}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          • Metode:{" "}
                          {tx.paymentMethod.toUpperCase().replace("_", " ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {formatIDR(tx.amount)}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `Invoice: ${tx.id}\nItem: ${tx.bookTitle}\nTotal: ${formatIDR(tx.amount)}\nStatus: Lunas\nTanggal: ${tx.createdAt}`,
                            tx.id,
                          )
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                        title="Salin Rincian Invoice"
                      >
                        <Copy className="w-3 h-3" />
                        <span>
                          {copiedId === tx.id ? "Tersalin" : "Rincian"}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Semua transaksi dilindungi sistem keamanan Unlupa.id</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
