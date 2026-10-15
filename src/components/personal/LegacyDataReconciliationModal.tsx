import React, { useState } from "react";
import {
  ReconciliationComparison,
  importSnapshot,
  ReconciliationImportResult,
  LegacySnapshot,
} from "../../services/legacyReconciliationService";
import {
  Database,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  X,
  Shield,
  ArrowRight,
} from "lucide-react";

interface LegacyDataReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparison: ReconciliationComparison | null;
  onImportSuccess: () => Promise<void>;
}

export const LegacyDataReconciliationModal: React.FC<
  LegacyDataReconciliationModalProps
> = ({ isOpen, onClose, comparison, onImportSuccess }) => {
  const [selectedSource, setSelectedSource] = useState<"local" | "firestore">(
    "local",
  );
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] =
    useState<ReconciliationImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !comparison) return null;

  const handleStartImport = async () => {
    setIsImporting(true);
    setErrorMsg(null);
    try {
      const targetSnapshot: LegacySnapshot =
        comparison.isIdentical || selectedSource === "local"
          ? comparison.localSnapshot
          : comparison.firestoreSnapshot;

      const result = await importSnapshot(targetSnapshot);
      setImportResult(result);

      if (result.successful > 0 || result.alreadyExisted > 0) {
        await onImportSuccess();
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          "Terjadi kesalahan saat mengimpor data legacy ke backend.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Migrasi & Rekonsiliasi Data Buku
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pindahkan data prototype lama ke PostgreSQL secara aman tanpa
                kehilangan progres
              </p>
            </div>
          </div>
          {!isImporting && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
          {importResult ? (
            /* Results View */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Migrasi Selesai!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                    {importResult.successful} buku baru berhasil diimpor,{" "}
                    {importResult.alreadyExisted} buku sudah tercatat identik,{" "}
                    {importResult.failed} gagal.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {importResult.results.map((r, i) => (
                  <div
                    key={i}
                    className="p-3 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {r.title}
                    </span>
                    <span
                      className={r.error ? "text-rose-500" : "text-emerald-500"}
                    >
                      {r.error
                        ? r.error
                        : r.isExisting
                          ? "Sudah tersimpan (Identik)"
                          : "Berhasil diimpor"}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-500">
                Data legacy Anda di perangkat lokal tetap aman dan tidak
                dihapus. Backend PostgreSQL sekarang menjadi sumber kebenaran
                utama.
              </p>
            </div>
          ) : (
            /* Comparison & Choice View */
            <>
              {comparison.isIdentical ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-emerald-900 dark:text-emerald-200">
                      Data Lokal dan Cloud Identik
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                      Ditemukan{" "}
                      {
                        comparison.localSnapshot.books.filter(
                          (b) => !b.isSample,
                        ).length
                      }{" "}
                      buku pribadi ({comparison.localSnapshot.totalCards}{" "}
                      flashcard, {comparison.localSnapshot.totalReviews} log
                      review). Siap dimigrasikan ke PostgreSQL.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 dark:text-amber-200">
                      Perbedaan Ditemukan Antara Perangkat & Cloud
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Data di perangkat lokal Anda berbeda dengan data di Cloud
                      Firestore. Pilih salah satu sumber yang ingin Anda jadikan
                      data utama.
                    </p>
                  </div>
                </div>
              )}

              {/* Differences List */}
              <div className="space-y-3">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-400">
                  Ringkasan Buku & Progres yang Ditemukan
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden text-xs">
                  {comparison.differences.map((diff, idx) => (
                    <div
                      key={idx}
                      className="p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {diff.bookTitle}
                        </p>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {diff.details}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          diff.differenceType === "identical"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {diff.differenceType === "identical"
                          ? "Sesuai"
                          : "Berbeda"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Choice Radio if Conflict */}
              {!comparison.isIdentical && (
                <div className="space-y-3 pt-2">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-400">
                    Pilih Sumber yang Ingin Diimpor
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      onClick={() => setSelectedSource("local")}
                      className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        selectedSource === "local"
                          ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Perangkat Lokal
                          </span>
                          <input
                            type="radio"
                            name="source"
                            checked={selectedSource === "local"}
                            onChange={() => setSelectedSource("local")}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                        </div>
                        <p className="text-xs text-slate-500">
                          {
                            comparison.localSnapshot.books.filter(
                              (b) => !b.isSample,
                            ).length
                          }{" "}
                          buku pribadi, {comparison.localSnapshot.totalCards}{" "}
                          kartu, {comparison.localSnapshot.totalReviews} review
                        </p>
                      </div>
                    </label>

                    <label
                      onClick={() => setSelectedSource("firestore")}
                      className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        selectedSource === "firestore"
                          ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Cloud Firestore
                          </span>
                          <input
                            type="radio"
                            name="source"
                            checked={selectedSource === "firestore"}
                            onChange={() => setSelectedSource("firestore")}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                        </div>
                        <p className="text-xs text-slate-500">
                          {
                            comparison.firestoreSnapshot.books.filter(
                              (b) => !b.isSample,
                            ).length
                          }{" "}
                          buku pribadi,{" "}
                          {comparison.firestoreSnapshot.totalCards} kartu,{" "}
                          {comparison.firestoreSnapshot.totalReviews} review
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Security info */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-500 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  Seluruh FSRS stability, difficulty, jadwal review, dan histori
                  verbatim dipreservasi dalam transaksi atomik PostgreSQL.
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                  {errorMsg}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
          {importResult ? (
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition text-sm flex items-center gap-2"
            >
              Selesai & Buka Koleksi Buku
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-medium transition"
              >
                Nanti Saja
              </button>
              <button
                onClick={handleStartImport}
                disabled={isImporting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition text-sm flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-600/20"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengimpor ke PostgreSQL...</span>
                  </>
                ) : (
                  <>
                    <span>Mulai Impor ke Backend</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
