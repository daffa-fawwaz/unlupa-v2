import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Eye,
  EyeOff,
  Layers,
  HelpCircle,
  X,
  Sparkles,
  Download,
  Star,
  Tag,
  Calendar,
  User,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  adminBookApiService,
  AdminBookItem,
  AdminBookDetails,
} from "../../services/adminBookApiService";

export const AdminBooksTab: React.FC = () => {
  const { language } = useApp();

  const [books, setBooks] = useState<AdminBookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [priceFilter, setPriceFilter] = useState<"ALL" | "FREE" | "PAID">("ALL");

  // Detail Modal State
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [bookDetails, setBookDetails] = useState<AdminBookDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Action Loading & Toast Feedback
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  // Confirm Delete Dialog
  const [confirmDeleteBook, setConfirmDeleteBook] = useState<AdminBookItem | null>(null);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await adminBookApiService.getPublishedBooks();
      setBooks(data);
    } catch (err: any) {
      console.error("Failed to load admin books:", err);
      setFeedback({
        text: err?.message || "Gagal memuat daftar buku pustaka publik.",
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (bookId: string) => {
    try {
      setSelectedBookId(bookId);
      setDetailsLoading(true);
      const data = await adminBookApiService.getBookDetails(bookId);
      setBookDetails(data);
    } catch (err: any) {
      setFeedback({
        text: err?.message || "Gagal memuat detail buku.",
        isError: true,
      });
      setSelectedBookId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUnpublish = async (book: AdminBookItem) => {
    if (
      !window.confirm(
        `Tarik buku "${book.title}" dari pustaka publik?\n\nBuku ini tidak akan tampil lagi di Pustaka Unlupa, tetapi salinan milik pembuat tetap tersimpan.`,
      )
    ) {
      return;
    }

    try {
      setActionLoadingId(book.id);
      const res = await adminBookApiService.unpublishBook(book.id);
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
      if (bookDetails?.id === book.id) {
        setBookDetails(null);
        setSelectedBookId(null);
      }
      setFeedback({
        text: res.message || `Buku "${book.title}" berhasil ditarik dari publikasi.`,
        isError: false,
      });
    } catch (err: any) {
      setFeedback({
        text: err?.message || "Gagal menarik buku dari publikasi.",
        isError: true,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteBook = async (book: AdminBookItem) => {
    try {
      setActionLoadingId(book.id);
      const res = await adminBookApiService.deleteBook(book.id);
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
      if (bookDetails?.id === book.id) {
        setBookDetails(null);
        setSelectedBookId(null);
      }
      setConfirmDeleteBook(null);
      setFeedback({
        text: res.message || `Buku "${book.title}" berhasil dihapus permanen.`,
        isError: false,
      });
    } catch (err: any) {
      setFeedback({
        text: err?.message || "Gagal menghapus buku dari database.",
        isError: true,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Categories extraction
  const categories = Array.from(
    new Set(books.map((b) => b.category).filter(Boolean)),
  );

  // Filter books
  const filteredBooks = books.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      b.title.toLowerCase().includes(q) ||
      (b.authorName || "").toLowerCase().includes(q) ||
      (b.description || "").toLowerCase().includes(q) ||
      (b.category || "").toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (categoryFilter !== "ALL" && b.category !== categoryFilter) return false;
    if (priceFilter === "FREE" && b.price > 0) return false;
    if (priceFilter === "PAID" && b.price === 0) return false;

    return true;
  });

  const totalPublished = books.length;
  const totalCards = books.reduce((acc, curr) => acc + (curr.stats?.totalItems || 0), 0);
  const totalClones = books.reduce((acc, curr) => acc + (curr.downloads || curr.stats?.totalClones || 0), 0);
  const paidBooksCount = books.filter((b) => b.price > 0).length;

  const formatPrice = (val: number) => {
    if (!val || val === 0) return "Gratis";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold transition-all ${
            feedback.isError
              ? "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400"
              : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.isError ? (
              <AlertCircle className="w-5 h-5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-75 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="clay-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl clay-icon-pod-orange text-white flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#687086] dark:text-[#94A3B8]">
              Buku Dipublikasi
            </p>
            <p className="text-lg font-black text-[#18234A] dark:text-[#F8FAFC]">
              {totalPublished}
            </p>
          </div>
        </div>

        <div className="clay-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#687086] dark:text-[#94A3B8]">
              Total Kartu / Soal
            </p>
            <p className="text-lg font-black text-[#18234A] dark:text-[#F8FAFC]">
              {totalCards}
            </p>
          </div>
        </div>

        <div className="clay-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#687086] dark:text-[#94A3B8]">
              Total Diimpor Murid
            </p>
            <p className="text-lg font-black text-[#18234A] dark:text-[#F8FAFC]">
              {totalClones}
            </p>
          </div>
        </div>

        <div className="clay-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#687086] dark:text-[#94A3B8]">
              Buku Berbayar
            </p>
            <p className="text-lg font-black text-[#18234A] dark:text-[#F8FAFC]">
              {paidBooksCount} / {totalPublished}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul buku, penulis, deskripsi, atau kategori..."
            className="w-full pl-10 pr-4 py-2.5 clay-inset rounded-2xl text-xs sm:text-sm text-[#18234A] dark:text-[#F8FAFC] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 clay-pill rounded-xl text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Price Filter */}
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value as any)}
            className="px-3 py-2 clay-pill rounded-xl text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Tipe Harga</option>
            <option value="FREE">Hanya Gratis</option>
            <option value="PAID">Hanya Berbayar</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={loadBooks}
            disabled={loading}
            className="px-3 py-2 clay-pill rounded-xl text-xs font-bold text-[#F27A3D] hover:bg-orange-500/10 cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
            title="Segarkan daftar buku publik"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>
        </div>
      </div>

      {/* Books Table / Grid */}
      {loading ? (
        <div className="py-20 text-center text-[#687086] dark:text-[#94A3B8] flex flex-col items-center gap-2.5">
          <RefreshCw className="w-7 h-7 animate-spin text-[#F27A3D]" />
          <p className="text-xs font-semibold">Memuat buku pustaka publik...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="clay-card p-12 rounded-3xl text-center space-y-2">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-[#18234A] dark:text-[#F8FAFC]">
            Tidak ada buku publik yang ditemukan
          </p>
          <p className="text-xs text-[#687086] dark:text-[#94A3B8]">
            {searchQuery || categoryFilter !== "ALL" || priceFilter !== "ALL"
              ? "Coba ubah kata kunci pencarian atau filter yang Anda pilih."
              : "Belum ada buku yang dipublikasi ke pustaka unlupa."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => {
            const isBusy = actionLoadingId === book.id;
            return (
              <div
                key={book.id}
                className="clay-card p-4 sm:p-5 rounded-3xl flex flex-col justify-between gap-4 hover:shadow-lg transition-all border border-black/5 dark:border-white/5 relative group"
              >
                {/* Top: Cover & Basic Info */}
                <div className="space-y-3">
                  <div className="flex gap-3.5 items-start">
                    {/* Cover Thumbnail */}
                    <div className="w-16 h-22 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 shadow-sm border border-black/10 dark:border-white/10 relative">
                      <img
                        src={
                          book.coverUrl ||
                          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"
                        }
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-[#F27A3D]">
                          {book.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            book.price > 0
                              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                              : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                          }`}
                        >
                          {formatPrice(book.price)}
                        </span>
                      </div>

                      <h3
                        className="text-sm font-bold text-[#18234A] dark:text-[#F8FAFC] line-clamp-2 leading-tight"
                        title={book.title}
                      >
                        {book.title}
                      </h3>

                      <p className="text-xs text-[#687086] dark:text-[#94A3B8] mt-1 flex items-center gap-1 truncate">
                        <User className="w-3 h-3 shrink-0" />
                        <span className="truncate">{book.authorName}</span>
                      </p>
                    </div>
                  </div>

                  {/* Description Preview */}
                  {book.description && (
                    <p className="text-[11px] text-[#687086] dark:text-[#94A3B8] line-clamp-2">
                      {book.description}
                    </p>
                  )}

                  {/* Quantitative Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/5 dark:border-white/5 text-[11px]">
                    <div className="text-center p-1.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02]">
                      <span className="text-[#687086] dark:text-[#94A3B8] block text-[9px] font-medium">
                        Bab
                      </span>
                      <span className="font-bold text-[#18234A] dark:text-[#F8FAFC]">
                        {book.stats?.totalChapters || 0}
                      </span>
                    </div>
                    <div className="text-center p-1.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02]">
                      <span className="text-[#687086] dark:text-[#94A3B8] block text-[9px] font-medium">
                        Kartu
                      </span>
                      <span className="font-bold text-[#18234A] dark:text-[#F8FAFC]">
                        {book.stats?.totalItems || 0}
                      </span>
                    </div>
                    <div className="text-center p-1.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02]">
                      <span className="text-[#687086] dark:text-[#94A3B8] block text-[9px] font-medium">
                        Diimpor
                      </span>
                      <span className="font-bold text-[#18234A] dark:text-[#F8FAFC]">
                        {book.downloads || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <button
                    onClick={() => handleOpenDetails(book.id)}
                    className="flex-1 py-2 px-3 rounded-xl clay-pill text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] hover:text-[#F27A3D] cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                    title="Lihat seluruh bab dan kartu buku ini"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Detail</span>
                  </button>

                  <button
                    onClick={() => handleUnpublish(book)}
                    disabled={isBusy}
                    className="py-2 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                    title="Tarik dari pustaka publik (unpublish)"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tarik</span>
                  </button>

                  <button
                    onClick={() => setConfirmDeleteBook(book)}
                    disabled={isBusy}
                    className="py-2 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                    title="Hapus permanen dari database"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Detail Modal */}
      {selectedBookId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedBookId(null)}
        >
          <div
            className="clay-card rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl clay-icon-pod-orange text-white flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18234A] dark:text-[#F8FAFC]">
                    Detail Buku Pustaka
                  </h3>
                  <p className="text-xs text-[#687086] dark:text-[#94A3B8]">
                    Informasi lengkap bab, kartu hafalan, dan hak cipta.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookId(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              {detailsLoading || !bookDetails ? (
                <div className="py-20 text-center flex flex-col items-center gap-2 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#F27A3D]" />
                  <p className="text-xs">Memuat detail buku...</p>
                </div>
              ) : (
                <>
                  {/* Hero Overview */}
                  <div className="flex flex-col sm:flex-row gap-5 items-start">
                    <img
                      src={
                        bookDetails.coverUrl ||
                        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"
                      }
                      alt={bookDetails.title}
                      className="w-28 h-36 rounded-2xl object-cover shrink-0 border border-black/10 dark:border-white/10 shadow-sm"
                    />

                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-[#F27A3D]">
                          {bookDetails.category}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            bookDetails.price > 0
                              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                              : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                          }`}
                        >
                          {formatPrice(bookDetails.price)}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          ID: {bookDetails.id.substring(0, 8)}...
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-[#18234A] dark:text-[#F8FAFC]">
                        {bookDetails.title}
                      </h2>

                      <p className="text-xs text-[#687086] dark:text-[#94A3B8]">
                        {bookDetails.description || "Tidak ada deskripsi."}
                      </p>

                      <div className="pt-2 text-xs text-[#687086] dark:text-[#94A3B8] flex items-center gap-4 flex-wrap">
                        <span>
                          ✍️ Penulis:{" "}
                          <strong className="text-[#18234A] dark:text-[#F8FAFC]">
                            {bookDetails.authorName}
                          </strong>
                        </span>
                        {bookDetails.author?.email && (
                          <span>
                            ✉️ {bookDetails.author.email}
                          </span>
                        )}
                        <span>
                          📥 {bookDetails.downloads || 0} Unduhan
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Chapters & Cards Breakdown */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#18234A] dark:text-[#F8FAFC] flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#F27A3D]" />
                        <span>
                          Daftar Bab & Materi ({bookDetails.chapters.length} Bab,{" "}
                          {bookDetails.items.length} Kartu)
                        </span>
                      </h4>
                    </div>

                    {bookDetails.chapters.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Buku ini belum memiliki struktur bab.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {bookDetails.chapters.map((ch, idx) => {
                          const chapterItems = bookDetails.items.filter(
                            (it) => it.chapterId === ch.id,
                          );

                          return (
                            <div
                              key={ch.id}
                              className="clay-card p-4 rounded-2xl space-y-2 border border-black/5 dark:border-white/5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC]">
                                  {idx + 1}. {ch.title}
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                  {chapterItems.length} Kartu
                                </span>
                              </div>

                              {ch.description && (
                                <p className="text-[11px] text-[#687086] dark:text-[#94A3B8]">
                                  {ch.description}
                                </p>
                              )}

                              {/* Sample Cards List */}
                              {chapterItems.length > 0 && (
                                <div className="space-y-1.5 pt-1.5">
                                  {chapterItems.slice(0, 3).map((it, itemIdx) => (
                                    <div
                                      key={it.id}
                                      className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] text-xs space-y-1"
                                    >
                                      <p className="font-semibold text-[#18234A] dark:text-[#F8FAFC]">
                                        ❓ {it.question}
                                      </p>
                                      <p className="text-[#687086] dark:text-[#94A3B8]">
                                        💡 {it.answer}
                                      </p>
                                      {it.explanation && (
                                        <p className="text-[10px] text-slate-400 italic">
                                          ℹ️ {it.explanation}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                  {chapterItems.length > 3 && (
                                    <p className="text-[10px] text-slate-400 italic text-right">
                                      + {chapterItems.length - 3} kartu lainnya di bab ini...
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer Actions */}
            {bookDetails && (
              <div className="p-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUnpublish(bookDetails)}
                    className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Tarik dari Publikasi</span>
                  </button>

                  <button
                    onClick={() => {
                      setConfirmDeleteBook(bookDetails);
                      setSelectedBookId(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Permanen</span>
                  </button>
                </div>

                <button
                  onClick={() => setSelectedBookId(null)}
                  className="px-4 py-2 rounded-xl clay-pill text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setConfirmDeleteBook(null)}
        >
          <div
            className="clay-card rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-[#18234A] dark:text-[#F8FAFC]">
                Hapus Buku dari Library?
              </h3>
              <p className="text-xs text-[#687086] dark:text-[#94A3B8] leading-relaxed">
                Anda akan menghapus buku{" "}
                <strong className="text-rose-600 dark:text-rose-400">
                  "{confirmDeleteBook.title}"
                </strong>{" "}
                beserta seluruh bab ({confirmDeleteBook.stats?.totalChapters || 0} bab)
                dan kartu ({confirmDeleteBook.stats?.totalItems || 0} kartu) secara permanen dari database.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setConfirmDeleteBook(null)}
                className="flex-1 py-2.5 px-4 rounded-xl clay-pill text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteBook(confirmDeleteBook)}
                disabled={actionLoadingId === confirmDeleteBook.id}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs font-bold cursor-pointer hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {actionLoadingId === confirmDeleteBook.id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
