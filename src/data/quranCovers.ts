export interface JuzCoverTheme {
  juzNumber: number;
  titleEn: string;
  surahArabic: string;
  bgGradient: string;
  spineColor: string;
  borderFoil: string;
  accentGold: string;
  medallionType: 'shamsa8' | 'shamsa12' | 'star16' | 'mandala' | 'arabesque' | 'rosette' | 'arch' | 'octagram';
  patternStyle: string;
  cornerFoil: string;
  textColor: string;
  subtitle: string;
}

export const JUZ_COVER_THEMES: Record<number, JuzCoverTheme> = {
  1: {
    juzNumber: 1,
    titleEn: "Al-Fatihah — Al-Baqarah",
    surahArabic: "الفاتحة",
    bgGradient: "from-[#F59E0B] via-[#D97706] to-[#92400E]", // Gilded Amber Gold
    spineColor: "#78350F",
    borderFoil: "border-amber-200/80",
    accentGold: "#FDE68A",
    medallionType: "shamsa12",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(254, 243, 199, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-amber-300",
    textColor: "#FFFFFF",
    subtitle: "Alif Lam Meem"
  },
  2: {
    juzNumber: 2,
    titleEn: "Al-Baqarah",
    surahArabic: "البقرة",
    bgGradient: "from-[#EA580C] via-[#C2410C] to-[#7C2D12]", // Warm Terracotta Orange
    spineColor: "#701A75",
    borderFoil: "border-orange-200/80",
    accentGold: "#FFEDD5",
    medallionType: "octagram",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(255, 237, 213, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-orange-300",
    textColor: "#FFFFFF",
    subtitle: "Sayaqool"
  },
  3: {
    juzNumber: 3,
    titleEn: "Al-Baqarah — Ali 'Imran",
    surahArabic: "آل عمران",
    bgGradient: "from-[#0284C7] via-[#0369A1] to-[#075985]", // Royal Lapis Lazuli
    spineColor: "#0C4A6E",
    borderFoil: "border-sky-200/80",
    accentGold: "#E0F2FE",
    medallionType: "shamsa8",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(224, 242, 254, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-sky-300",
    textColor: "#FFFFFF",
    subtitle: "Tilkar Rusul"
  },
  4: {
    juzNumber: 4,
    titleEn: "Ali 'Imran — An-Nisa",
    surahArabic: "النساء",
    bgGradient: "from-[#F97316] via-[#EA580C] to-[#9A3412]", // Rich Morocco Golden Orange
    spineColor: "#7C2D12",
    borderFoil: "border-amber-200/90",
    accentGold: "#FEF3C7",
    medallionType: "star16",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(254, 243, 199, 0.3) 0%, transparent 70%)",
    cornerFoil: "border-amber-300",
    textColor: "#FFFFFF",
    subtitle: "Lan Tanaaloo"
  },
  5: {
    juzNumber: 5,
    titleEn: "An-Nisa",
    surahArabic: "النساء",
    bgGradient: "from-[#059669] via-[#047857] to-[#064E3B]", // Emerald Damascus
    spineColor: "#022C22",
    borderFoil: "border-emerald-200/80",
    accentGold: "#D1FAE5",
    medallionType: "arabesque",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(209, 250, 229, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-emerald-300",
    textColor: "#FFFFFF",
    subtitle: "Wal Muhsanat"
  },
  6: {
    juzNumber: 6,
    titleEn: "An-Nisa — Al-Ma'idah",
    surahArabic: "المائدة",
    bgGradient: "from-[#D97706] via-[#B45309] to-[#78350F]", // Antique Byzantine Gold
    spineColor: "#451A03",
    borderFoil: "border-amber-100/90",
    accentGold: "#FEF3C7",
    medallionType: "rosette",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(254, 243, 199, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-amber-300",
    textColor: "#FFFFFF",
    subtitle: "La Yuhibbullah"
  },
  7: {
    juzNumber: 7,
    titleEn: "Al-Ma'idah — Al-An'am",
    surahArabic: "الأنعام",
    bgGradient: "from-[#2563EB] via-[#1D4ED8] to-[#1E40AF]", // Mediterranean Cobalt
    spineColor: "#172554",
    borderFoil: "border-blue-200/80",
    accentGold: "#DBEAFE",
    medallionType: "shamsa12",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(219, 234, 254, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-blue-300",
    textColor: "#FFFFFF",
    subtitle: "Wa Iza Sami'oo"
  },
  8: {
    juzNumber: 8,
    titleEn: "Al-An'am — Al-A'raf",
    surahArabic: "الأعراف",
    bgGradient: "from-[#E11D48] via-[#BE123C] to-[#881337]", // Imperial Ruby Silk
    spineColor: "#4C0519",
    borderFoil: "border-rose-200/80",
    accentGold: "#FFE4E6",
    medallionType: "mandala",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(255, 228, 230, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-rose-300",
    textColor: "#FFFFFF",
    subtitle: "Wa Lau Annana"
  },
  9: {
    juzNumber: 9,
    titleEn: "Al-A'raf — Al-Anfal",
    surahArabic: "الأنفال",
    bgGradient: "from-[#F59E0B] via-[#EA580C] to-[#7C2D12]", // Copper Sunrise
    spineColor: "#78350F",
    borderFoil: "border-amber-200/80",
    accentGold: "#FEF3C7",
    medallionType: "arch",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(254, 243, 199, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-amber-300",
    textColor: "#FFFFFF",
    subtitle: "Qalal Malao"
  },
  10: {
    juzNumber: 10,
    titleEn: "Al-Anfal — At-Tawbah",
    surahArabic: "التوبة",
    bgGradient: "from-[#0D9488] via-[#0F766E] to-[#115E59]", // Persian Turquoise
    spineColor: "#134E4A",
    borderFoil: "border-teal-200/80",
    accentGold: "#CCFBF1",
    medallionType: "octagram",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(204, 251, 241, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-teal-300",
    textColor: "#FFFFFF",
    subtitle: "Wa'alamu"
  },
  11: {
    juzNumber: 11,
    titleEn: "At-Tawbah — Hud",
    surahArabic: "هود",
    bgGradient: "from-[#7C3AED] via-[#6D28D9] to-[#4C1D95]", // Royal Amethyst
    spineColor: "#2E1065",
    borderFoil: "border-purple-200/80",
    accentGold: "#EDE9FE",
    medallionType: "star16",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(237, 233, 254, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-purple-300",
    textColor: "#FFFFFF",
    subtitle: "Ya'taziroon"
  },
  12: {
    juzNumber: 12,
    titleEn: "Hud — Yusuf",
    surahArabic: "يوسف",
    bgGradient: "from-[#FBBF24] via-[#D97706] to-[#92400E]", // Golden Wheat of Egypt
    spineColor: "#78350F",
    borderFoil: "border-amber-200/90",
    accentGold: "#FFFBEB",
    medallionType: "shamsa12",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(254, 243, 199, 0.3) 0%, transparent 70%)",
    cornerFoil: "border-amber-300",
    textColor: "#FFFFFF",
    subtitle: "Wa Mamin Da'abbah"
  },
  13: {
    juzNumber: 13,
    titleEn: "Yusuf — Ibrahim",
    surahArabic: "إبراهيم",
    bgGradient: "from-[#10B981] via-[#059669] to-[#065F46]", // Olive Garden of Cordoba
    spineColor: "#064E3B",
    borderFoil: "border-emerald-200/80",
    accentGold: "#D1FAE5",
    medallionType: "arabesque",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(209, 250, 229, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-emerald-300",
    textColor: "#FFFFFF",
    subtitle: "Wa Ma Obarri'o"
  },
  14: {
    juzNumber: 14,
    titleEn: "Al-Hijr — An-Nahl",
    surahArabic: "النحل",
    bgGradient: "from-[#FB923C] via-[#EA580C] to-[#9A3412]", // Warm Honey Gold
    spineColor: "#7C2D12",
    borderFoil: "border-orange-200/80",
    accentGold: "#FFEDD5",
    medallionType: "rosette",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(255, 237, 213, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-orange-300",
    textColor: "#FFFFFF",
    subtitle: "Rubama"
  },
  15: {
    juzNumber: 15,
    titleEn: "Al-Isra — Al-Kahf",
    surahArabic: "الكهف",
    bgGradient: "from-[#0284C7] via-[#0F766E] to-[#134E4A]", // Oceanic Deep Cave
    spineColor: "#083344",
    borderFoil: "border-sky-200/80",
    accentGold: "#CCFBF1",
    medallionType: "shamsa8",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(204, 251, 241, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-sky-300",
    textColor: "#FFFFFF",
    subtitle: "Subhanallazi"
  },
  16: {
    juzNumber: 16,
    titleEn: "Al-Kahf — Ta-Ha",
    surahArabic: "طه",
    bgGradient: "from-[#6366F1] via-[#4F46E5] to-[#3730A3]", // Twilight Sinai Indigo
    spineColor: "#1E1B4B",
    borderFoil: "border-indigo-200/80",
    accentGold: "#E0E7FF",
    medallionType: "mandala",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(224, 231, 255, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-indigo-300",
    textColor: "#FFFFFF",
    subtitle: "Qala Alam"
  },
  17: {
    juzNumber: 17,
    titleEn: "Al-Anbiya — Al-Hajj",
    surahArabic: "الحج",
    bgGradient: "from-[#CA8A04] via-[#A16207] to-[#713F12]", // Sacred Kaaba Gold
    spineColor: "#422006",
    borderFoil: "border-yellow-200/80",
    accentGold: "#FEF9C3",
    medallionType: "arch",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(254, 249, 195, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-yellow-300",
    textColor: "#FFFFFF",
    subtitle: "Iqtaraba Li'nnas"
  },
  18: {
    juzNumber: 18,
    titleEn: "Al-Mu'minun — Al-Furqan",
    surahArabic: "المؤمنون",
    bgGradient: "from-[#059669] via-[#047857] to-[#022C22]", // Firdaus Green
    spineColor: "#064E3B",
    borderFoil: "border-emerald-200/80",
    accentGold: "#D1FAE5",
    medallionType: "octagram",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(209, 250, 229, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-emerald-300",
    textColor: "#FFFFFF",
    subtitle: "Qadd Aflaha"
  },
  19: {
    juzNumber: 19,
    titleEn: "Al-Furqan — An-Naml",
    surahArabic: "النمل",
    bgGradient: "from-[#F97316] via-[#D97706] to-[#78350F]", // Kingdom of Sulaiman Gold
    spineColor: "#7C2D12",
    borderFoil: "border-amber-200/80",
    accentGold: "#FEF3C7",
    medallionType: "star16",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(254, 243, 199, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-amber-300",
    textColor: "#FFFFFF",
    subtitle: "Wa Qal'allazina"
  },
  20: {
    juzNumber: 20,
    titleEn: "An-Naml — Al-Ankabut",
    surahArabic: "القصص",
    bgGradient: "from-[#0284C7] via-[#2563EB] to-[#1E3A8A]", // Azure Horizon
    spineColor: "#172554",
    borderFoil: "border-sky-200/80",
    accentGold: "#E0F2FE",
    medallionType: "shamsa12",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(224, 242, 254, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-sky-300",
    textColor: "#FFFFFF",
    subtitle: "Amman Khalaqa"
  },
  21: {
    juzNumber: 21,
    titleEn: "Al-Ankabut — Al-Ahzab",
    surahArabic: "لقمان",
    bgGradient: "from-[#D97706] via-[#B45309] to-[#451A03]", // Cedar & Sandalwood
    spineColor: "#78350F",
    borderFoil: "border-amber-200/80",
    accentGold: "#FEF3C7",
    medallionType: "rosette",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(254, 243, 199, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-amber-300",
    textColor: "#FFFFFF",
    subtitle: "Utlu Ma Oohiya"
  },
  22: {
    juzNumber: 22,
    titleEn: "Al-Ahzab — Ya-Sin",
    surahArabic: "يس",
    bgGradient: "from-[#9333EA] via-[#7E22CE] to-[#581C87]", // Royal Violet of Medina
    spineColor: "#3B0764",
    borderFoil: "border-purple-200/80",
    accentGold: "#F3E8FF",
    medallionType: "mandala",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(243, 232, 255, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-purple-300",
    textColor: "#FFFFFF",
    subtitle: "Wa Manyaqnut"
  },
  23: {
    juzNumber: 23,
    titleEn: "Ya-Sin — Az-Zumar",
    surahArabic: "الصافات",
    bgGradient: "from-[#E11D48] via-[#9F1239] to-[#4C0519]", // Velvet Garnet
    spineColor: "#881337",
    borderFoil: "border-rose-200/80",
    accentGold: "#FFE4E6",
    medallionType: "shamsa8",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(255, 228, 230, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-rose-300",
    textColor: "#FFFFFF",
    subtitle: "Wa Maliya"
  },
  24: {
    juzNumber: 24,
    titleEn: "Az-Zumar — Fussilat",
    surahArabic: "غافر",
    bgGradient: "from-[#059669] via-[#047857] to-[#064E3B]", // Emerald Ray of Hope
    spineColor: "#022C22",
    borderFoil: "border-emerald-200/80",
    accentGold: "#D1FAE5",
    medallionType: "arch",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(209, 250, 229, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-emerald-300",
    textColor: "#FFFFFF",
    subtitle: "Faman Azlamu"
  },
  25: {
    juzNumber: 25,
    titleEn: "Fussilat — Al-Jathiyah",
    surahArabic: "الشورى",
    bgGradient: "from-[#0284C7] via-[#0369A1] to-[#075985]", // Deep Aegean Lapis
    spineColor: "#0C4A6E",
    borderFoil: "border-sky-200/80",
    accentGold: "#E0F2FE",
    medallionType: "octagram",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(224, 242, 254, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-sky-300",
    textColor: "#FFFFFF",
    subtitle: "Ilayhi Yuraddu"
  },
  26: {
    juzNumber: 26,
    titleEn: "Al-Ahqaf — Adh-Dhariyat",
    surahArabic: "محمد",
    bgGradient: "from-[#F59E0B] via-[#D97706] to-[#78350F]", // Desert Sands of Ahqaf
    spineColor: "#78350F",
    borderFoil: "border-amber-200/80",
    accentGold: "#FEF3C7",
    medallionType: "star16",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(254, 243, 199, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-amber-300",
    textColor: "#FFFFFF",
    subtitle: "Ha'a Meem"
  },
  27: {
    juzNumber: 27,
    titleEn: "Adh-Dhariyat — Al-Hadid",
    surahArabic: "الرحمن",
    bgGradient: "from-[#EA580C] via-[#C2410C] to-[#9A3412]", // Ar-Rahman Pearl Flame
    spineColor: "#7C2D12",
    borderFoil: "border-orange-200/80",
    accentGold: "#FFEDD5",
    medallionType: "shamsa12",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(255, 237, 213, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-orange-300",
    textColor: "#FFFFFF",
    subtitle: "Qala Fama Khatbukum"
  },
  28: {
    juzNumber: 28,
    titleEn: "Al-Mujadilah — At-Tahrim",
    surahArabic: "الحشر",
    bgGradient: "from-[#0F766E] via-[#115E59] to-[#042F2E]", // Malachite of Samarkand
    spineColor: "#134E4A",
    borderFoil: "border-teal-200/80",
    accentGold: "#CCFBF1",
    medallionType: "arabesque",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(204, 251, 241, 0.25) 0%, transparent 70%)",
    cornerFoil: "border-teal-300",
    textColor: "#FFFFFF",
    subtitle: "Qadd Sami'allah"
  },
  29: {
    juzNumber: 29,
    titleEn: "Al-Mulk — Al-Mursalat",
    surahArabic: "الملك",
    bgGradient: "from-[#F59E0B] via-[#B45309] to-[#78350F]", // Crown of Tabarak Gold
    spineColor: "#451A03",
    borderFoil: "border-amber-200/90",
    accentGold: "#FEF3C7",
    medallionType: "shamsa8",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(254, 243, 199, 0.3) 0%, transparent 70%)",
    cornerFoil: "border-amber-300",
    textColor: "#FFFFFF",
    subtitle: "Tabarakallazi"
  },
  30: {
    juzNumber: 30,
    titleEn: "An-Naba — An-Nas",
    surahArabic: "النبأ",
    bgGradient: "from-[#FF7E40] via-[#EA580C] to-[#9A3412]", // Magnificent Golden Flame (Juz 'Amma)
    spineColor: "#7C2D12",
    borderFoil: "border-amber-200/95",
    accentGold: "#FEF3C7",
    medallionType: "star16",
    patternStyle: "radial-gradient(circle at 50% 50%, rgba(254, 243, 199, 0.35) 0%, transparent 70%)",
    cornerFoil: "border-amber-300",
    textColor: "#FFFFFF",
    subtitle: "Amma Yatasa'aloon"
  }
};

export function getJuzCoverTheme(juzNumber: number): JuzCoverTheme {
  return JUZ_COVER_THEMES[juzNumber] || JUZ_COVER_THEMES[1];
}
