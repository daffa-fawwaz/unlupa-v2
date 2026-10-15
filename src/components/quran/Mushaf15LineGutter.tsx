import React from "react";
import { PageAyahInfo } from "./MushafAyahCorrectionPopover";
import { PageIssue, Language } from "../../types";

interface Mushaf15LineGutterProps {
  ayahs: PageAyahInfo[];
  issues: PageIssue[];
  onSelectAyah: (ayah: PageAyahInfo) => void;
  language: Language;
}

export const Mushaf15LineGutter: React.FC<Mushaf15LineGutterProps> = ({
  ayahs,
  issues,
  onSelectAyah,
  language,
}) => {
  // Map issues by ayah number for fast status lookups
  const issuesByAyah = React.useMemo(() => {
    const map = new Map<
      number,
      { hasUnresolved: boolean; isResolved: boolean; count: number }
    >();

    for (const issue of issues) {
      if (issue.ayah.includes("-")) {
        const [from, to] = issue.ayah
          .split("-")
          .map((n) => parseInt(n.trim(), 10));
        for (let a = from; a <= to; a++) {
          const entry = map.get(a) || {
            hasUnresolved: false,
            isResolved: false,
            count: 0,
          };
          entry.count++;
          if (!issue.isResolved) entry.hasUnresolved = true;
          else entry.isResolved = true;
          map.set(a, entry);
        }
      } else {
        const a = parseInt(issue.ayah.trim(), 10);
        if (!isNaN(a)) {
          const entry = map.get(a) || {
            hasUnresolved: false,
            isResolved: false,
            count: 0,
          };
          entry.count++;
          if (!issue.isResolved) entry.hasUnresolved = true;
          else entry.isResolved = true;
          map.set(a, entry);
        }
      }
    }
    return map;
  }, [issues]);

  // Group ayahs by their exact starting line in the standard Madinah Mushaf (1 to 15)
  const lineToAyahs = React.useMemo(() => {
    const map = new Map<number, PageAyahInfo[]>();
    for (const ayah of ayahs) {
      const line = ayah.startLine || ayah.markerLine || ayah.endLine || 1;
      const list = map.get(line) || [];
      list.push(ayah);
      map.set(line, list);
    }
    return map;
  }, [ayahs]);

  // 15 Lines Array
  const lines = Array.from({ length: 15 }, (_, i) => i + 1);

  return (
    <div className="w-full h-full flex flex-col justify-between py-[3.8%] shrink-0 select-none z-10 overflow-visible">
      {lines.map((lineNum) => {
        const lineAyahs = lineToAyahs.get(lineNum) || [];

        return (
          <div
            key={lineNum}
            className="flex-1 flex items-center justify-center relative min-h-0 px-0.5 overflow-visible"
          >
            {lineAyahs.length > 0 ? (
              <div className="flex items-center justify-center flex-wrap gap-0.5 sm:gap-1 w-full max-w-full">
                {lineAyahs.map((ayah) => {
                  const issueInfo = issuesByAyah.get(ayah.ayahNumber);
                  const hasMistake = !!issueInfo?.hasUnresolved;
                  const isResolved = !hasMistake && !!issueInfo?.isResolved;

                  // Adaptive sizing for lines with multiple verses - slightly larger for readability
                  const sizeClass =
                    lineAyahs.length >= 3
                      ? "w-5 h-5 sm:w-5.5 sm:h-5.5 text-[8.5px] sm:text-[9.5px] rounded-md"
                      : lineAyahs.length === 2
                        ? "w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 text-[9.5px] sm:text-[10.5px] rounded-lg"
                        : "w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 text-[11px] sm:text-[12px] rounded-xl";

                  return (
                    <button
                      key={ayah.verseKey}
                      type="button"
                      onClick={() => onSelectAyah(ayah)}
                      className={`relative font-black transition-all cursor-pointer flex items-center justify-center active:scale-95 shrink-0 ${sizeClass} ${
                        hasMistake
                          ? "bg-gradient-to-br from-rose-600 to-rose-700 text-white border-2 border-rose-300 dark:border-rose-400 ring-2 ring-rose-500 shadow-md shadow-rose-900/40"
                          : isResolved
                            ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-2 border-emerald-300 dark:border-emerald-400 ring-2 ring-emerald-500 shadow-md"
                            : "bg-[#1E293B] dark:bg-[#0F172A] text-white dark:text-[#F8FAFC] border-2 border-[#334155] dark:border-[#475569] shadow-md hover:border-[#FF6F3D] hover:bg-[#FF7E4A] hover:scale-110"
                      }`}
                      title={
                        language === "en"
                          ? `Ayah ${ayah.ayahNumber} (Line ${lineNum}): Click to record/review mistake`
                          : `Ayat ${ayah.ayahNumber} (Baris ${lineNum}): Klik untuk tandai salah baca`
                      }
                    >
                      <span className="font-sans font-black leading-none drop-shadow-2xs">
                        {ayah.ayahNumber}
                      </span>

                      {/* Offline-style mistake indicator (Solid, Crisp, No Blinking) */}
                      {hasMistake && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-600 text-white text-[6.5px] sm:text-[7.5px] font-black flex items-center justify-center shadow-xs ring-1 ring-white">
                          !
                        </span>
                      )}
                      {isResolved && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 text-emerald-950 text-[5.5px] sm:text-[6.5px] font-black flex items-center justify-center shadow-xs">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Empty line placeholder - subtle alignment guide aligned with 15 lines */
              <div
                className="w-3.5 sm:w-4.5 h-1 rounded-full bg-slate-300 dark:bg-slate-600 opacity-60"
                title={`Baris ${lineNum}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
