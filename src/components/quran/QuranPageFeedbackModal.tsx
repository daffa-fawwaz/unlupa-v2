import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { QuranPageItem, PageIssue } from "../../types";
import {
  X,
  MessageSquare,
  Check,
  Plus,
  History,
  Sliders,
  Target,
  BookOpen,
} from "lucide-react";
import { QURAN_PAGES_METADATA } from "../../data/quranPagesMetadata";
import { SURAH_LIST } from "../../data/quranData";
import { AudioRecorderPlayer } from "../shared/AudioRecorderPlayer";
import { AyahSweepSelector } from "./AyahSweepSelector";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  page: QuranPageItem | null;
}

export interface PageSurahSection {
  surahNumber: number;
  surahNameEn: string;
  surahNameAr: string;
  startAyah: number;
  endAyah: number;
}

import {
  HIJAIYAH_LETTERS,
  MAKHRAJ_MODIFIERS,
  KELANCARAN_PRESETS,
  TAJWID_CATEGORIES,
  QUICK_NOTES,
  HijaiyahDetail,
} from "./quranCorrectionPresets";

export const QuranPageFeedbackModal: React.FC<Props> = ({
  isOpen,
  onClose,
  page,
}) => {
  const { quranPages, addQuranPageIssue, resolveQuranPageIssue, language } =
    useApp();

  // Retrieve reactive, live page from context so newly added or resolved issues reflect immediately without stale state
  const livePage = useMemo(() => {
    if (!page) return null;
    return quranPages.find((p) => p.pageNumber === page.pageNumber) || page;
  }, [quranPages, page]);

  const [activeTab, setActiveTab] = useState<"unresolved" | "add" | "history">(
    "unresolved",
  );

  // Ayah Sweep State
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [ayahFrom, setAyahFrom] = useState(1);
  const [ayahTo, setAyahTo] = useState(1);

  // Issue Type & Details (Zero Typing)
  const [issueType, setIssueType] = useState<PageIssue["type"]>("kelancaran");
  const [selectedDetail, setSelectedDetail] = useState("");
  const [selectedTajwidCat, setSelectedTajwidCat] = useState("mad");

  // Makhraj Specific
  const [selectedLetter, setSelectedLetter] = useState<HijaiyahDetail | null>(
    null,
  );
  const [selectedModifier, setSelectedModifier] = useState("");

  // Optional Note State
  const [issueNote, setIssueNote] = useState("");
  const [showCustomNoteInput, setShowCustomNoteInput] = useState(false);

  // Compute surah sections for this page
  const surahSections: PageSurahSection[] = useMemo(() => {
    if (!livePage) return [];
    const meta = QURAN_PAGES_METADATA[livePage.pageNumber - 1];
    if (!meta) {
      return [
        {
          surahNumber: livePage.surahNumber || 1,
          surahNameEn: livePage.surahNameEn || "Al-Fatihah",
          surahNameAr: livePage.surahNameAr || "الفاتحة",
          startAyah: 1,
          endAyah: 7,
        },
      ];
    }

    const [s1Str, a1Str] = meta.startVerseKey.split(":");
    const [s2Str, a2Str] = meta.endVerseKey.split(":");
    const startSurah = parseInt(s1Str, 10);
    const startAyah = parseInt(a1Str, 10);
    const endSurah = parseInt(s2Str, 10);
    const endAyah = parseInt(a2Str, 10);

    const sections: PageSurahSection[] = [];

    for (let s = startSurah; s <= endSurah; s++) {
      const surahInfo = SURAH_LIST[s - 1];
      const sAyah = s === startSurah ? startAyah : 1;
      const eAyah =
        s === endSurah ? endAyah : surahInfo ? surahInfo.ayahsCount : 50;

      sections.push({
        surahNumber: s,
        surahNameEn: surahInfo ? surahInfo.nameEn : `Surah ${s}`,
        surahNameAr: surahInfo ? surahInfo.nameAr : "",
        startAyah: sAyah,
        endAyah: Math.max(sAyah, eAyah),
      });
    }

    return sections;
  }, [livePage]);

  const currentSection =
    surahSections[selectedSectionIndex] || surahSections[0];

  // Initialize or reset state when modal opens or page changes
  useEffect(() => {
    if (isOpen && currentSection) {
      setSelectedSectionIndex(0);
      setAyahFrom(currentSection.startAyah);
      setAyahTo(currentSection.startAyah);
      setIssueType("kelancaran");
      setSelectedDetail(KELANCARAN_PRESETS[0].label);
      setSelectedTajwidCat("mad");
      setSelectedLetter(null);
      setSelectedModifier("");
      setIssueNote("");
      setShowCustomNoteInput(false);
    }
  }, [isOpen, page]);

  // Sync when currentSection changes
  useEffect(() => {
    if (currentSection) {
      setAyahFrom(currentSection.startAyah);
      setAyahTo(currentSection.startAyah);
    }
  }, [currentSection]);

  const issues = livePage?.issues || [];
  const unresolvedIssues = issues.filter((i) => !i.isResolved);
  const resolvedIssues = issues.filter((i) => i.isResolved);

  // Auto switch tab if no unresolved issues
  useEffect(() => {
    if (isOpen && activeTab === "unresolved" && unresolvedIssues.length === 0) {
      setActiveTab("add");
    }
  }, [isOpen, unresolvedIssues.length, activeTab]);

  // Format Ayah Result String
  const resolvedAyahText = useMemo(() => {
    if (!currentSection) return "1";
    const isSingle = ayahFrom === ayahTo;
    const ayahSpan = isSingle ? `${ayahFrom}` : `${ayahFrom} - ${ayahTo}`;
    if (surahSections.length > 1) {
      return `${currentSection.surahNameEn} ${ayahSpan}`;
    }
    return ayahSpan;
  }, [currentSection, ayahFrom, ayahTo, surahSections]);

  // Format Issue Detail
  const resolvedDetailText = useMemo(() => {
    if (issueType === "kelancaran") {
      return selectedDetail || "Lupa Hafalan";
    }
    if (issueType === "tajwid") {
      return selectedDetail || "Kesalahan Tajwid";
    }
    if (issueType === "makharijul") {
      if (!selectedLetter) return "Makharijul Huruf";
      if (selectedModifier) {
        return `Huruf ${selectedLetter.ar} (${selectedLetter.latin}) • ${selectedModifier}`;
      }
      return `Huruf ${selectedLetter.ar} (${selectedLetter.latin})`;
    }
    return selectedDetail;
  }, [issueType, selectedDetail, selectedLetter, selectedModifier]);

  if (!isOpen || !livePage) return null;

  const handleAddIssue = () => {
    if (!resolvedAyahText) {
      alert(
        language === "en"
          ? "Please select an ayah range."
          : "Silakan pilih ayat terlebih dahulu.",
      );
      return;
    }

    addQuranPageIssue(livePage.pageNumber, {
      ayah: resolvedAyahText,
      type: issueType,
      detail: resolvedDetailText || undefined,
      note: issueNote.trim() || undefined,
    });

    setIssueNote("");
    setShowCustomNoteInput(false);

    // Reset & switch to unresolved list immediately
    setActiveTab("unresolved");
  };

  const getIssueLabel = (type: string) => {
    switch (type) {
      case "kelancaran":
        return language === "en" ? "Fluency" : "Kelancaran";
      case "lupa":
        return language === "en" ? "Forgot" : "Lupa Hafalan";
      case "tajwid":
        return "Tajwid";
      case "makharijul":
        return "Makharijul Huruf";
      default:
        return type;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case "kelancaran":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:border-amber-800 dark:text-amber-300";
      case "lupa":
        return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:border-rose-800 dark:text-rose-300";
      case "tajwid":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300";
      case "makharijul":
        return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div
      data-no-swipe="true"
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
    >
      <div className="neumorph-card w-full max-w-xl shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] flex items-center justify-center shrink-0 shadow-2xs">
              <MessageSquare className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-[#18234A] dark:text-[#F8FAFC] text-sm sm:text-base leading-tight tracking-tight">
                {language === "en"
                  ? "Page Evaluation & Issues"
                  : "Pelacakan Masalah Hafalan"}
              </h3>
              <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] mt-0.5 font-medium">
                {language === "en"
                  ? `Page ${livePage.pageNumber} • ${livePage.surahNameEn} (Ayah ${livePage.ayahRange})`
                  : `Halaman ${livePage.pageNumber} • ${livePage.surahNameEn} (Ayat ${livePage.ayahRange})`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={language === "en" ? "Close" : "Tutup"}
            className="w-8 h-8 flex items-center justify-center rounded-xl neumorph-card text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Audio Recording for Self-Correction */}
        <div className="px-5 pt-3 shrink-0">
          <AudioRecorderPlayer
            itemId={livePage.pageNumber}
            itemType="quran"
            itemLabel={`Hal ${livePage.pageNumber}`}
            language={language}
            compact={false}
          />
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-black/[0.04] dark:border-white/[0.04] shrink-0">
          <div className="grid grid-cols-3 gap-1.5 neumorph-inset p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab("unresolved")}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "unresolved"
                  ? "bg-gradient-to-br from-[#EF4444] to-[#DC2626] text-white shadow-2xs font-black"
                  : "text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]"
              }`}
            >
              <span>{language === "en" ? "Active" : "Masalah Aktif"}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-black min-w-[18px] inline-flex items-center justify-center ${
                  activeTab === "unresolved"
                    ? "bg-white text-[#DC2626]"
                    : "bg-[#EF4444] text-white"
                }`}
              >
                {unresolvedIssues.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("add")}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "add"
                  ? "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-2xs font-black"
                  : "text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === "en" ? "Add Issue" : "Catat Baru"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-2xs font-black"
                  : "text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A]"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{language === "en" ? "History" : "Riwayat"}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-black min-w-[18px] inline-flex items-center justify-center ${
                  activeTab === "history"
                    ? "bg-white text-[#059669]"
                    : "bg-[#10B981] text-white"
                }`}
              >
                {resolvedIssues.length}
              </span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: MASALAH AKTIF */}
          {activeTab === "unresolved" && (
            <div className="space-y-3">
              {unresolvedIssues.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-200 dark:border-emerald-800/60">
                    <Check className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-[#18234A] dark:text-[#F8FAFC]">
                    {language === "en"
                      ? "No active issues recorded!"
                      : "Alhamdulillah, tidak ada masalah aktif!"}
                  </p>
                  <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8] mt-1 max-w-xs mx-auto">
                    {language === "en"
                      ? "Hafalan pada halaman ini terpantau lancar tanpa catatan khusus."
                      : "Hafalan pada halaman ini terpantau lancar dan tertib."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("add")}
                    className="mt-4 px-4 py-2 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {language === "en"
                        ? "Record an Issue"
                        : "Catat Masalah / Kendala"}
                    </span>
                  </button>
                </div>
              ) : (
                unresolvedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3.5 rounded-2xl neumorph-card space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getIssueColor(issue.type)}`}
                        >
                          {getIssueLabel(issue.type)}
                        </span>
                        <span className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC]">
                          {language === "en" ? "Ayah" : "Ayat"} {issue.ayah}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#8493AB] font-medium">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {(issue.detail || issue.note) && (
                      <div className="text-xs sm:text-sm text-[#5E6D88] dark:text-[#94A3B8] neumorph-inset p-2.5 rounded-xl">
                        {issue.detail && (
                          <div className="font-bold text-[#18234A] dark:text-[#F8FAFC]">
                            {issue.detail}
                          </div>
                        )}
                        {issue.note && (
                          <div className="text-xs mt-1 italic font-normal">
                            "{issue.note}"
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        resolveQuranPageIssue(livePage.pageNumber, issue.id)
                      }
                      className="w-full py-2 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {language === "en"
                        ? "Mark as Resolved (Solved)"
                        : "Tandai Sudah Lancar (Selesai)"}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: TAMBAH MASALAH BARU (ZERO-TYPING & SISTEM SAPU AYAT UX) */}
          {activeTab === "add" && currentSection && (
            <div className="space-y-4">
              {/* 1. SELEKTOR AYAT MENGGUNAKAN SISTEM SAPU (COMPACT, CEPAT & INTUITIF) */}
              <div className="p-3.5 sm:p-4 rounded-3xl neumorph-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-[#FF6F3D]" />
                    <span className="text-xs font-black text-[#18234A] dark:text-[#F8FAFC] uppercase tracking-wider">
                      {language === "en"
                        ? "Select Issue Ayah"
                        : "Pilih Ayat Bermasalah"}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#FF6F3D] neumorph-card px-2.5 py-0.5 rounded-full shadow-2xs">
                    {language === "en" ? "Swipe / Tap" : "Sistem Sapu Jari"}
                  </span>
                </div>

                {/* Multi-Surah Switcher on this Page (if >1 surah exists) */}
                {surahSections.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-[10px] font-bold text-[#8493AB] shrink-0">
                      Surat:
                    </span>
                    {surahSections.map((sec, idx) => (
                      <button
                        key={sec.surahNumber}
                        type="button"
                        onClick={() => {
                          setSelectedSectionIndex(idx);
                          setAyahFrom(sec.startAyah);
                          setAyahTo(sec.startAyah);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          selectedSectionIndex === idx
                            ? "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-2xs"
                            : "neumorph-card text-[#5E6D88] dark:text-[#94A3B8]"
                        }`}
                      >
                        {sec.surahNameEn} ({sec.startAyah} - {sec.endAyah})
                      </button>
                    ))}
                  </div>
                )}

                {/* Ayah Sweep Selector */}
                <AyahSweepSelector
                  startAyah={currentSection.startAyah}
                  endAyah={currentSection.endAyah}
                  fromAyah={ayahFrom}
                  toAyah={ayahTo}
                  onChange={(from, to) => {
                    setAyahFrom(from);
                    setAyahTo(to);
                  }}
                  surahName={
                    surahSections.length > 1
                      ? currentSection.surahNameEn
                      : undefined
                  }
                  language={language}
                />
              </div>

              {/* 2. PILIHAN JENIS MASALAH (3 KATEGORI UTAMA RAMPING DALAM 1 BARIS) */}
              <div>
                <label className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] mb-1.5 block">
                  {language === "en"
                    ? "Issue Category"
                    : "Jenis Masalah (1 Baris):"}
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl neumorph-inset">
                  {/* Hukum Tajwid */}
                  <button
                    type="button"
                    onClick={() => {
                      setIssueType("tajwid");
                      setSelectedDetail(TAJWID_CATEGORIES[0].options[0]);
                    }}
                    className={`py-1.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer text-center truncate ${
                      issueType === "tajwid"
                        ? "bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white shadow-xs scale-101 ring-1 ring-blue-400"
                        : "text-[#18234A] dark:text-[#F8FAFC] hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    Hukum Tajwid
                  </button>

                  {/* Makhraj Huruf */}
                  <button
                    type="button"
                    onClick={() => {
                      setIssueType("makharijul");
                      const letter = selectedLetter || HIJAIYAH_LETTERS[14];
                      setSelectedLetter(letter);
                      setSelectedDetail(
                        letter.commonErrors[0] || "Makhraj Kurang Pas",
                      );
                    }}
                    className={`py-1.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer text-center truncate ${
                      issueType === "makharijul"
                        ? "bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-xs scale-101 ring-1 ring-emerald-400"
                        : "text-[#18234A] dark:text-[#F8FAFC] hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    Makhraj Huruf
                  </button>

                  {/* Kelancaran (Lupa dihapus agar muat 1 baris) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIssueType("kelancaran");
                      setSelectedDetail(KELANCARAN_PRESETS[0].label);
                    }}
                    className={`py-1.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer text-center truncate ${
                      issueType === "kelancaran"
                        ? "bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white shadow-xs scale-101 ring-1 ring-amber-400"
                        : "text-[#18234A] dark:text-[#F8FAFC] hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    Kelancaran
                  </button>
                </div>
              </div>

              {/* 3. DETAIL MASALAH TANPA MENGETIK (ZERO-TYPING UX) */}

              {/* CASE A: KELANCARAN (WARM AMBER / CORAL) */}
              {issueType === "kelancaran" && (
                <div className="p-3.5 rounded-3xl neumorph-card space-y-2.5 animate-in fade-in">
                  <span className="text-[11px] font-black text-[#D97706] dark:text-[#FBBF24] uppercase tracking-wider block">
                    Pilih Gejala Kelancaran:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {KELANCARAN_PRESETS.map((preset) => {
                      const isSelected = selectedDetail === preset.label;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setSelectedDetail(preset.label)}
                          className={`p-3 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-center ${
                            isSelected
                              ? "bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white shadow-xs scale-101 font-bold"
                              : "neumorph-inset text-[#18234A] dark:text-[#F8FAFC] hover:scale-102 active:scale-95"
                          }`}
                        >
                          <span className="text-xs font-black leading-tight">
                            {preset.label}
                          </span>
                          <span
                            className={`text-[10px] mt-0.5 leading-tight ${isSelected ? "text-white/90 font-semibold" : "text-[#5E6D88] dark:text-[#94A3B8]"}`}
                          >
                            {preset.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CASE B: TAJWID (OCEAN BLUE / SAPPHIRE) */}
              {issueType === "tajwid" && (
                <div className="p-3.5 rounded-3xl neumorph-card space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-[#2563EB] dark:text-[#60A5FA] uppercase tracking-wider">
                      Pilih Bagian Tajwid:
                    </span>
                    <span className="text-[10px] text-[#5E6D88] dark:text-[#94A3B8] font-bold">
                      Klik salah satu di bawah
                    </span>
                  </div>

                  {/* Sub-Category Pills (Prioritas: Mad -> Ghunnah -> Nun Mati -> Mim Mati -> Qalqalah -> Tebal/Tipis -> Waqaf) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {TAJWID_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedTajwidCat(cat.id);
                          setSelectedDetail(cat.options[0]);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          selectedTajwidCat === cat.id
                            ? "bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white shadow-xs scale-102"
                            : "neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-102 active:scale-95"
                        }`}
                      >
                        {cat.title}
                      </button>
                    ))}
                  </div>

                  {/* Active Tajwid Options Grid */}
                  <div className="space-y-1.5 pt-1">
                    {TAJWID_CATEGORIES.find(
                      (c) => c.id === selectedTajwidCat,
                    )?.options.map((opt) => {
                      const isSelected = selectedDetail === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedDetail(opt)}
                          className={`w-full text-left p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white shadow-xs scale-101"
                              : "neumorph-inset text-[#18234A] dark:text-[#F8FAFC] hover:scale-101 active:scale-95"
                          }`}
                        >
                          <span>{opt}</span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CASE C: MAKHARIJUL HURUF (EMERALD JADE) */}
              {issueType === "makharijul" && (
                <div className="p-3.5 rounded-3xl neumorph-card space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-[#059669] dark:text-[#34D399] uppercase tracking-wider">
                      Klik Huruf Hijaiyah:
                    </span>
                    {selectedLetter && (
                      <span className="text-xs font-black text-white bg-gradient-to-br from-[#10B981] to-[#059669] px-3 py-1 rounded-full shadow-xs">
                        Huruf:{" "}
                        <span className="font-arabic font-bold text-sm">
                          {selectedLetter.ar}
                        </span>{" "}
                        ({selectedLetter.latin})
                      </span>
                    )}
                  </div>

                  {/* 28 Hijaiyah 3D Neumorph Grid */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2 p-2.5 rounded-2xl neumorph-inset justify-items-center">
                    {HIJAIYAH_LETTERS.map((letter) => {
                      const isSelected = selectedLetter?.latin === letter.latin;
                      return (
                        <button
                          key={letter.latin}
                          type="button"
                          onClick={() => {
                            setSelectedLetter(letter);
                            setSelectedDetail(
                              letter.commonErrors[0] || "Makhraj Kurang Pas",
                            );
                          }}
                          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer select-none ${
                            isSelected
                              ? "bg-gradient-to-br from-[#10B981] to-[#059669] text-white scale-110 shadow-[0_3px_10px_rgba(16,185,129,0.4)] ring-2 ring-[#10B981]"
                              : "neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-108 active:scale-95 shadow-xs"
                          }`}
                          title={`Huruf Hijaiyah ${letter.ar} (${letter.latin}) - ${letter.makhraj}`}
                        >
                          <span className="text-xl sm:text-2xl font-bold font-arabic leading-none">
                            {letter.ar}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Letter Card: Real Makhraj + Active Sifat + Tailored Errors */}
                  {selectedLetter && (
                    <div className="p-3 rounded-2xl neumorph-inset space-y-2 border border-emerald-500/20">
                      <div className="flex items-start gap-1.5 text-xs text-[#18234A] dark:text-[#F8FAFC]">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                          📍 Makhraj:
                        </span>
                        <span className="leading-snug">
                          {selectedLetter.makhraj}
                        </span>
                      </div>

                      {/* Sifat-sifat aktif */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase block tracking-wider">
                          Sifat-Sifat Huruf {selectedLetter.latin} (
                          {selectedLetter.ar}):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedLetter.sifat.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/25"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Tailored Common Errors for This Exact Letter */}
                      <div className="pt-1 space-y-1">
                        <span className="text-[10px] font-black text-[#5E6D88] dark:text-[#94A3B8] uppercase block tracking-wider">
                          Koreksi Masalah Khusus Huruf Ini (1-Klik):
                        </span>
                        <div className="space-y-1">
                          {selectedLetter.commonErrors.map((err) => {
                            const isSelected = selectedDetail === err;
                            return (
                              <button
                                key={err}
                                type="button"
                                onClick={() => setSelectedDetail(err)}
                                className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                                  isSelected
                                    ? "bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-xs font-black"
                                    : "neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-[1.01]"
                                }`}
                              >
                                <span className="leading-tight">{err}</span>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1.5" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Confusable letters */}
                      {selectedLetter.confusableWith &&
                        selectedLetter.confusableWith.length > 0 && (
                          <div className="pt-1">
                            <span className="text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] block mb-1">
                              Sering Tertukar Huruf:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedLetter.confusableWith.map((otherAr) => {
                                const confLabel = `Tertukar Huruf ${otherAr}`;
                                const isSelected = selectedDetail === confLabel;
                                return (
                                  <button
                                    key={otherAr}
                                    type="button"
                                    onClick={() => setSelectedDetail(confLabel)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                      isSelected
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "neumorph-card text-[#18234A] dark:text-[#F8FAFC]"
                                    }`}
                                  >
                                    <span>Tertukar</span>
                                    <span className="font-arabic font-bold text-sm">
                                      {otherAr}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}

              {/* 4. CATATAN CEPAT (1-KLIK) & OPSIONAL MANUAL */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#5E6D88] dark:text-[#94A3B8] uppercase tracking-wider">
                    Catatan Tambahan (Klik Cepat):
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCustomNoteInput(!showCustomNoteInput)}
                    className="text-[10px] text-[#FF6F3D] font-bold hover:underline cursor-pointer"
                  >
                    {showCustomNoteInput
                      ? "Sembunyikan Ketik Manual"
                      : "+ Tulis Catatan Khusus"}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {QUICK_NOTES.map((tag) => {
                    const isSelected = issueNote.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setIssueNote((prev) =>
                              prev
                                .replace(tag, "")
                                .replace(/,\s*,/g, ",")
                                .trim(),
                            );
                          } else {
                            setIssueNote((prev) =>
                              prev ? `${prev}, ${tag}` : tag,
                            );
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-xs scale-102"
                            : "neumorph-card text-[#18234A] dark:text-[#F8FAFC] hover:scale-102 active:scale-95"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                {showCustomNoteInput && (
                  <textarea
                    value={issueNote}
                    onChange={(e) => setIssueNote(e.target.value)}
                    placeholder="Opsional: catatan tambahan penguji..."
                    className="w-full h-16 text-xs p-3 rounded-2xl neumorph-inset text-[#18234A] dark:text-[#F8FAFC] focus:outline-none resize-none mt-2"
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RIWAYAT EVALUASI SELESAI */}
          {activeTab === "history" && (
            <div className="space-y-3">
              {resolvedIssues.length === 0 ? (
                <div className="text-center py-12 text-[#8493AB]">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#FF6F3D]" />
                  <p className="text-xs font-semibold">
                    {language === "en"
                      ? "No resolved issues recorded yet."
                      : "Belum ada riwayat masalah yang diselesaikan."}
                  </p>
                </div>
              ) : (
                resolvedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3.5 rounded-2xl neumorph-card space-y-1.5"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] uppercase">
                          {getIssueLabel(issue.type)} • Ayat {issue.ayah}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#10B981]">
                        <Check className="w-3.5 h-3.5" />
                        Selesai
                      </span>
                    </div>
                    {issue.detail && (
                      <div className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC]">
                        {issue.detail}
                      </div>
                    )}
                    {issue.note && (
                      <div className="text-xs text-[#5E6D88] dark:text-[#94A3B8] italic mt-0.5">
                        "{issue.note}"
                      </div>
                    )}
                    <div className="text-[9px] text-[#8493AB] mt-1.5 border-t border-black/[0.04] dark:border-white/[0.04] pt-1">
                      Terselesaikan:{" "}
                      {issue.resolvedAt
                        ? new Date(issue.resolvedAt).toLocaleDateString()
                        : "Tercatat"}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl neumorph-card text-xs font-bold text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {activeTab === "add"
              ? language === "en"
                ? "Cancel"
                : "Batal"
              : language === "en"
                ? "Close"
                : "Tutup"}
          </button>

          {activeTab === "add" && (
            <button
              type="button"
              onClick={handleAddIssue}
              className="px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white active:scale-95 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer shadow-[0_4px_12px_rgba(255,111,61,0.35)]"
            >
              <Check className="w-4 h-4 text-white" />
              <span>{language === "en" ? "Save Issue" : "Simpan Masalah"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
