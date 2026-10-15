import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  BookOpen,
  FolderTree,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  Tag,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Book, BookItem, Chapter } from "../../types";
import { BilingualCardText } from "../common/BilingualCardText";
import { getNonQuranIntervalDays } from "../../lib/fsrs";
import { useSwipeGesture } from "../../hooks/useSwipeGesture";
import { soundEffects } from "../../lib/soundFeedback";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  items: BookItem[];
  chapters: Chapter[];
  language: string;
  onSelectCard: (item: BookItem, book: Book, chapter?: Chapter | null) => void;
}

export const GlobalCardSearchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  books,
  items,
  chapters,
  language,
  onSelectCard,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBookFilter, setSelectedBookFilter] = useState<string>("all");

  useSwipeGesture(null, {
    disabled: !isOpen,
    onSwipeRight: () => {
      soundEffects.playCardFlip("backward");
      onClose();
    },
    onSwipeDown: () => {
      soundEffects.playSoftClick();
      onClose();
    },
    threshold: 40,
    minRatio: 1.15,
  });

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset query on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const bookMap = useMemo(() => {
    const map = new Map<string, Book>();
    books.forEach((b) => map.set(b.id, b));
    return map;
  }, [books]);

  const chapterMap = useMemo(() => {
    const map = new Map<string, Chapter>();
    chapters.forEach((c) => map.set(c.id, c));
    return map;
  }, [chapters]);

  // Filter items based on query and book filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const q = searchQuery.toLowerCase().trim();

    return (items || []).filter((item) => {
      if (selectedBookFilter !== "all" && item.bookId !== selectedBookFilter) {
        return false;
      }

      const matchQ = (item.question || "").toLowerCase().includes(q);
      const matchA = (item.answer || "").toLowerCase().includes(q);
      const matchExpl = (item.explanation || "").toLowerCase().includes(q);
      const matchTags = (item.tags || []).some((t) =>
        t.toLowerCase().includes(q),
      );

      return matchQ || matchA || matchExpl || matchTags;
    });
  }, [items, searchQuery, selectedBookFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="clay-modal rounded-3xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header & Search Input */}
        <div className="p-4 sm:p-5 border-b border-black/[0.04] dark:border-white/[0.04] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl clay-icon-pod-orange flex items-center justify-center shrink-0 shadow-xs">
                <Search className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#18234A] dark:text-[#F8FAFC]">
                  {language === "en"
                    ? "Global Flashcard Search"
                    : "Pencarian Kartu Seluruh Kitab"}
                </h3>
                <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8]">
                  {language === "en"
                    ? `Searching across ${books.length} books and ${items.length} flashcards`
                    : `Mencari di antara ${books.length} buku dan ${items.length} kartu materi`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl clay-icon-pod-neutral flex items-center justify-center text-[#5E6D88] hover:text-[#18234A] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8493AB] pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder={
                language === "en"
                  ? "Search questions, answers, Arabic terms, or tags..."
                  : "Cari pertanyaan, jawaban, istilah Arab, atau tag..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl clay-inset text-xs sm:text-sm font-semibold text-[#18234A] dark:text-[#F8FAFC] placeholder:text-[#8493AB] focus:outline-none focus:ring-2 focus:ring-[#FF6F3D]/30 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8493AB] hover:text-[#18234A] dark:hover:text-[#F8FAFC]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Book filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] font-bold text-[#5E6D88] dark:text-[#94A3B8] shrink-0 mr-1">
              {language === "en" ? "Filter:" : "Buku:"}
            </span>
            <button
              type="button"
              onClick={() => setSelectedBookFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedBookFilter === "all"
                  ? "clay-btn-primary text-white shadow-xs"
                  : "clay-card-subtle text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]"
              }`}
            >
              {language === "en" ? "All Books" : "Semua Kitab"}
            </button>
            {books.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBookFilter(b.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer max-w-[160px] truncate ${
                  selectedBookFilter === b.id
                    ? "clay-btn-primary text-white shadow-xs"
                    : "clay-card-subtle text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]"
                }`}
              >
                {b.title}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 min-h-[220px]">
          {!searchQuery.trim() ? (
            <div className="text-center py-12 px-4 space-y-2">
              <BookOpen className="w-10 h-10 text-[#8493AB] mx-auto opacity-50" />
              <h4 className="text-sm font-bold text-[#18234A] dark:text-[#F8FAFC]">
                {language === "en"
                  ? "Type to search flashcards"
                  : "Ketik kata kunci untuk mencari kartu"}
              </h4>
              <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8] max-w-sm mx-auto">
                {language === "en"
                  ? "Find cards by question text, Arabic phrases, Indonesian meanings, or specific tags."
                  : "Temukan kartu berdasarkan pertanyaan, lafadz Arab, makna terjemahan, atau tag bab."}
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <Search className="w-10 h-10 text-[#8493AB] mx-auto opacity-50" />
              <h4 className="text-sm font-bold text-[#18234A] dark:text-[#F8FAFC]">
                {language === "en"
                  ? "No cards match your query"
                  : "Tidak ada kartu yang cocok"}
              </h4>
              <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8]">
                "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#5E6D88] dark:text-[#94A3B8] px-1">
                <span>
                  {language === "en"
                    ? `Found ${searchResults.length} cards`
                    : `Ditemukan ${searchResults.length} kartu`}
                </span>
                <span className="text-[11px] font-normal text-[#8493AB]">
                  {language === "en"
                    ? "Click card to view details"
                    : "Klik kartu untuk membuka rincian"}
                </span>
              </div>

              {searchResults.map((item) => {
                const book = bookMap.get(item.bookId);
                const chapter = item.chapterId
                  ? chapterMap.get(item.chapterId)
                  : null;
                const intervalDays = getNonQuranIntervalDays(item.fsrsData);
                const isMapan =
                  item.status === "mastered" || intervalDays >= 30;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (book) {
                        onSelectCard(item, book, chapter);
                        onClose();
                      }
                    }}
                    className="p-3.5 rounded-2xl clay-card-subtle hover:scale-[1.01] transition-all cursor-pointer group space-y-2 shadow-2xs"
                  >
                    {/* Top row: Book & Chapter Breadcrumb + Status pill */}
                    <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <BookOpen className="w-3.5 h-3.5 text-[#FF6F3D] shrink-0" />
                        <span className="font-bold text-[#18234A] dark:text-[#F8FAFC] truncate">
                          {book?.title || "Kitab"}
                        </span>
                        {chapter && (
                          <>
                            <span className="text-[#8493AB]">/</span>
                            <span className="text-[#5E6D88] dark:text-[#94A3B8] truncate">
                              {chapter.title}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isMapan ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                            Mapan ({intervalDays}h)
                          </span>
                        ) : item.isActive ? (
                          <span className="px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-[10px]">
                            Aktif ({intervalDays}h)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-[#8493AB] text-[10px]">
                            Belum Aktif
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-[#8493AB] group-hover:text-[#FF6F3D] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>

                    {/* Question (Pristine Bilingual Formatting) */}
                    <div className="text-xs sm:text-sm font-semibold text-[#18234A] dark:text-[#F8FAFC] line-clamp-2">
                      <BilingualCardText
                        text={item.question}
                        className="text-xs sm:text-sm"
                      />
                    </div>

                    {/* Answer Preview */}
                    <div className="text-xs text-[#5E6D88] dark:text-[#94A3B8] line-clamp-2 clay-inset p-2.5 rounded-xl">
                      <BilingualCardText
                        text={item.answer}
                        className="text-xs"
                      />
                    </div>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        {item.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md clay-pill text-[10px] text-[#5E6D88] dark:text-[#94A3B8]"
                          >
                            <Tag className="w-2.5 h-2.5 text-[#8493AB]" />
                            <span>{t}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
