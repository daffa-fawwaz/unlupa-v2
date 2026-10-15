import { QuranPageItem } from "../types";
import { QURAN_PAGES_METADATA } from "./quranPagesMetadata";

export interface JuzMeta {
  juzNumber: number;
  startPage: number;
  endPage: number;
  totalPages: number;
  nameAr: string;
  nameEn: string;
  surahSpan: string;
  ayahSpan: string;
}

export interface SurahMeta {
  number: number;
  nameEn: string;
  nameAr: string;
  englishTranslation: string;
  startPage: number;
  ayahsCount: number;
}

// 30 Juz Standard Madinah Mushaf Page Ranges (1 to 604)
export const JUZ_LIST: JuzMeta[] = [
  {
    juzNumber: 1,
    startPage: 1,
    endPage: 21,
    totalPages: 21,
    nameAr: "الم",
    nameEn: "Alif Lam Meem",
    surahSpan: "Al-Fatihah — Al-Baqarah",
    ayahSpan: "Al-Fatihah 1:1 — Al-Baqarah 2:141",
  },
  {
    juzNumber: 2,
    startPage: 22,
    endPage: 41,
    totalPages: 20,
    nameAr: "سيقول",
    nameEn: "Sayaqool",
    surahSpan: "Al-Baqarah",
    ayahSpan: "Al-Baqarah 2:142 — Al-Baqarah 2:252",
  },
  {
    juzNumber: 3,
    startPage: 42,
    endPage: 61,
    totalPages: 20,
    nameAr: "تلك الرسل",
    nameEn: "Tilkar Rusul",
    surahSpan: "Al-Baqarah — Ali 'Imran",
    ayahSpan: "Al-Baqarah 2:253 — Ali 'Imran 3:92",
  },
  {
    juzNumber: 4,
    startPage: 62,
    endPage: 81,
    totalPages: 20,
    nameAr: "لن تنالوا",
    nameEn: "Lan Tanaaloo",
    surahSpan: "Ali 'Imran — An-Nisa",
    ayahSpan: "Ali 'Imran 3:93 — An-Nisa 4:23",
  },
  {
    juzNumber: 5,
    startPage: 82,
    endPage: 101,
    totalPages: 20,
    nameAr: "والمحصنات",
    nameEn: "Wal Muhsanat",
    surahSpan: "An-Nisa",
    ayahSpan: "An-Nisa 4:24 — An-Nisa 4:147",
  },
  {
    juzNumber: 6,
    startPage: 102,
    endPage: 121,
    totalPages: 20,
    nameAr: "لا يحب الله",
    nameEn: "La Yuhibbullah",
    surahSpan: "An-Nisa — Al-Ma'idah",
    ayahSpan: "An-Nisa 4:148 — Al-Ma'idah 5:81",
  },
  {
    juzNumber: 7,
    startPage: 122,
    endPage: 141,
    totalPages: 20,
    nameAr: "وإذا سمعوا",
    nameEn: "Wa Iza Sami'oo",
    surahSpan: "Al-Ma'idah — Al-An'am",
    ayahSpan: "Al-Ma'idah 5:82 — Al-An'am 6:110",
  },
  {
    juzNumber: 8,
    startPage: 142,
    endPage: 161,
    totalPages: 20,
    nameAr: "ولو أننا",
    nameEn: "Wa Lau Annana",
    surahSpan: "Al-An'am — Al-A'raf",
    ayahSpan: "Al-An'am 6:111 — Al-A'raf 7:87",
  },
  {
    juzNumber: 9,
    startPage: 162,
    endPage: 181,
    totalPages: 20,
    nameAr: "قال الملأ",
    nameEn: "Qalal Malao",
    surahSpan: "Al-A'raf — Al-Anfal",
    ayahSpan: "Al-A'raf 7:88 — Al-Anfal 8:40",
  },
  {
    juzNumber: 10,
    startPage: 182,
    endPage: 201,
    totalPages: 20,
    nameAr: "واعلموا",
    nameEn: "Wa'alamu",
    surahSpan: "Al-Anfal — At-Tawbah",
    ayahSpan: "Al-Anfal 8:41 — At-Tawbah 9:92",
  },
  {
    juzNumber: 11,
    startPage: 202,
    endPage: 221,
    totalPages: 20,
    nameAr: "يعتذرون",
    nameEn: "Ya'taziroon",
    surahSpan: "At-Tawbah — Hud",
    ayahSpan: "At-Tawbah 9:93 — Hud 11:5",
  },
  {
    juzNumber: 12,
    startPage: 222,
    endPage: 241,
    totalPages: 20,
    nameAr: "وما من دابة",
    nameEn: "Wa Mamin Da'abbah",
    surahSpan: "Hud — Yusuf",
    ayahSpan: "Hud 11:6 — Yusuf 12:52",
  },
  {
    juzNumber: 13,
    startPage: 242,
    endPage: 261,
    totalPages: 20,
    nameAr: "وما أبرئ",
    nameEn: "Wa Ma Obarri'o",
    surahSpan: "Yusuf — Ibrahim",
    ayahSpan: "Yusuf 12:53 — Ibrahim 14:52",
  },
  {
    juzNumber: 14,
    startPage: 262,
    endPage: 281,
    totalPages: 20,
    nameAr: "ربما",
    nameEn: "Rubama",
    surahSpan: "Al-Hijr — An-Nahl",
    ayahSpan: "Al-Hijr 15:1 — An-Nahl 16:128",
  },
  {
    juzNumber: 15,
    startPage: 282,
    endPage: 301,
    totalPages: 20,
    nameAr: "سبحان الذي",
    nameEn: "Subhanallazi",
    surahSpan: "Al-Isra — Al-Kahf",
    ayahSpan: "Al-Isra 17:1 — Al-Kahf 18:74",
  },
  {
    juzNumber: 16,
    startPage: 302,
    endPage: 321,
    totalPages: 20,
    nameAr: "قال ألم",
    nameEn: "Qala Alam",
    surahSpan: "Al-Kahf — Ta-Ha",
    ayahSpan: "Al-Kahf 18:75 — Ta-Ha 20:135",
  },
  {
    juzNumber: 17,
    startPage: 322,
    endPage: 341,
    totalPages: 20,
    nameAr: "اقترب للناس",
    nameEn: "Iqtaraba Li'nnas",
    surahSpan: "Al-Anbiya — Al-Hajj",
    ayahSpan: "Al-Anbiya 21:1 — Al-Hajj 22:78",
  },
  {
    juzNumber: 18,
    startPage: 342,
    endPage: 361,
    totalPages: 20,
    nameAr: "قد أفلح",
    nameEn: "Qadd Aflaha",
    surahSpan: "Al-Mu'minun — Al-Furqan",
    ayahSpan: "Al-Mu'minun 23:1 — Al-Furqan 25:20",
  },
  {
    juzNumber: 19,
    startPage: 362,
    endPage: 381,
    totalPages: 20,
    nameAr: "وقال الذين",
    nameEn: "Wa Qal'allazina",
    surahSpan: "Al-Furqan — An-Naml",
    ayahSpan: "Al-Furqan 25:21 — An-Naml 27:55",
  },
  {
    juzNumber: 20,
    startPage: 382,
    endPage: 401,
    totalPages: 20,
    nameAr: "أمن خلق",
    nameEn: "Amman Khalaqa",
    surahSpan: "An-Naml — Al-Ankabut",
    ayahSpan: "An-Naml 27:56 — Al-Ankabut 29:45",
  },
  {
    juzNumber: 21,
    startPage: 402,
    endPage: 421,
    totalPages: 20,
    nameAr: "اتل ما أوحي",
    nameEn: "Utlu Ma Oohiya",
    surahSpan: "Al-Ankabut — Al-Ahzab",
    ayahSpan: "Al-Ankabut 29:46 — Al-Ahzab 33:30",
  },
  {
    juzNumber: 22,
    startPage: 422,
    endPage: 441,
    totalPages: 20,
    nameAr: "ومن يقنت",
    nameEn: "Wa Manyaqnut",
    surahSpan: "Al-Ahzab — Ya-Sin",
    ayahSpan: "Al-Ahzab 33:31 — Ya-Sin 36:27",
  },
  {
    juzNumber: 23,
    startPage: 442,
    endPage: 461,
    totalPages: 20,
    nameAr: "وما لي",
    nameEn: "Wa Maliya",
    surahSpan: "Ya-Sin — Az-Zumar",
    ayahSpan: "Ya-Sin 36:28 — Az-Zumar 39:31",
  },
  {
    juzNumber: 24,
    startPage: 462,
    endPage: 481,
    totalPages: 20,
    nameAr: "فمن أظلم",
    nameEn: "Faman Azlamu",
    surahSpan: "Az-Zumar — Fussilat",
    ayahSpan: "Az-Zumar 39:32 — Fussilat 41:46",
  },
  {
    juzNumber: 25,
    startPage: 482,
    endPage: 501,
    totalPages: 20,
    nameAr: "إليه يرد",
    nameEn: "Ilayhi Yuraddu",
    surahSpan: "Fussilat — Al-Jathiyah",
    ayahSpan: "Fussilat 41:47 — Al-Jathiyah 45:37",
  },
  {
    juzNumber: 26,
    startPage: 502,
    endPage: 521,
    totalPages: 20,
    nameAr: "حم",
    nameEn: "Ha'a Meem",
    surahSpan: "Al-Ahqaf — Adh-Dhariyat",
    ayahSpan: "Al-Ahqaf 46:1 — Adh-Dhariyat 51:30",
  },
  {
    juzNumber: 27,
    startPage: 522,
    endPage: 541,
    totalPages: 20,
    nameAr: "قال فما خطبكم",
    nameEn: "Qala Fama Khatbukum",
    surahSpan: "Adh-Dhariyat — Al-Hadid",
    ayahSpan: "Adh-Dhariyat 51:31 — Al-Hadid 57:29",
  },
  {
    juzNumber: 28,
    startPage: 542,
    endPage: 561,
    totalPages: 20,
    nameAr: "قد سمع الله",
    nameEn: "Qadd Sami'allah",
    surahSpan: "Al-Mujadilah — At-Tahrim",
    ayahSpan: "Al-Mujadilah 58:1 — At-Tahrim 66:12",
  },
  {
    juzNumber: 29,
    startPage: 562,
    endPage: 581,
    totalPages: 20,
    nameAr: "تبارك الذي",
    nameEn: "Tabarakallazi",
    surahSpan: "Al-Mulk — Al-Mursalat",
    ayahSpan: "Al-Mulk 67:1 — Al-Mursalat 77:50",
  },
  {
    juzNumber: 30,
    startPage: 582,
    endPage: 604,
    totalPages: 23,
    nameAr: "عم يتساءلون",
    nameEn: "Amma Yatasa'aloon",
    surahSpan: "An-Naba — An-Nas",
    ayahSpan: "An-Naba 78:1 — An-Nas 114:6",
  },
];

export const SURAH_LIST: SurahMeta[] = [
  {
    number: 1,
    nameEn: "Al-Fatihah",
    nameAr: "الفاتحة",
    englishTranslation: "The Opener",
    startPage: 1,
    ayahsCount: 7,
  },
  {
    number: 2,
    nameEn: "Al-Baqarah",
    nameAr: "البقرة",
    englishTranslation: "The Cow",
    startPage: 2,
    ayahsCount: 286,
  },
  {
    number: 3,
    nameEn: "Ali 'Imran",
    nameAr: "آل عمران",
    englishTranslation: "Family of Imran",
    startPage: 50,
    ayahsCount: 200,
  },
  {
    number: 4,
    nameEn: "An-Nisa",
    nameAr: "النساء",
    englishTranslation: "The Women",
    startPage: 77,
    ayahsCount: 176,
  },
  {
    number: 5,
    nameEn: "Al-Ma'idah",
    nameAr: "المائدة",
    englishTranslation: "The Table Spread",
    startPage: 106,
    ayahsCount: 120,
  },
  {
    number: 6,
    nameEn: "Al-An'am",
    nameAr: "الأنعام",
    englishTranslation: "The Cattle",
    startPage: 128,
    ayahsCount: 165,
  },
  {
    number: 7,
    nameEn: "Al-A'raf",
    nameAr: "الأعراف",
    englishTranslation: "The Heights",
    startPage: 151,
    ayahsCount: 206,
  },
  {
    number: 8,
    nameEn: "Al-Anfal",
    nameAr: "الأنفال",
    englishTranslation: "The Spoils of War",
    startPage: 177,
    ayahsCount: 75,
  },
  {
    number: 9,
    nameEn: "At-Tawbah",
    nameAr: "التوبة",
    englishTranslation: "The Repentance",
    startPage: 187,
    ayahsCount: 129,
  },
  {
    number: 10,
    nameEn: "Yunus",
    nameAr: "يونس",
    englishTranslation: "Jonah",
    startPage: 208,
    ayahsCount: 109,
  },
  {
    number: 11,
    nameEn: "Hud",
    nameAr: "هود",
    englishTranslation: "Hud",
    startPage: 221,
    ayahsCount: 123,
  },
  {
    number: 12,
    nameEn: "Yusuf",
    nameAr: "يوسف",
    englishTranslation: "Joseph",
    startPage: 235,
    ayahsCount: 111,
  },
  {
    number: 13,
    nameEn: "Ar-Ra'd",
    nameAr: "الرعد",
    englishTranslation: "The Thunder",
    startPage: 249,
    ayahsCount: 43,
  },
  {
    number: 14,
    nameEn: "Ibrahim",
    nameAr: "ابراهيم",
    englishTranslation: "Abraham",
    startPage: 255,
    ayahsCount: 52,
  },
  {
    number: 15,
    nameEn: "Al-Hijr",
    nameAr: "الحجر",
    englishTranslation: "The Rocky Tract",
    startPage: 262,
    ayahsCount: 99,
  },
  {
    number: 16,
    nameEn: "An-Nahl",
    nameAr: "النحل",
    englishTranslation: "The Bee",
    startPage: 267,
    ayahsCount: 128,
  },
  {
    number: 17,
    nameEn: "Al-Isra",
    nameAr: "الإسراء",
    englishTranslation: "The Night Journey",
    startPage: 282,
    ayahsCount: 111,
  },
  {
    number: 18,
    nameEn: "Al-Kahf",
    nameAr: "الكهف",
    englishTranslation: "The Cave",
    startPage: 293,
    ayahsCount: 110,
  },
  {
    number: 19,
    nameEn: "Maryam",
    nameAr: "مريم",
    englishTranslation: "Mary",
    startPage: 305,
    ayahsCount: 98,
  },
  {
    number: 20,
    nameEn: "Taha",
    nameAr: "طه",
    englishTranslation: "Ta-Ha",
    startPage: 312,
    ayahsCount: 135,
  },
  {
    number: 21,
    nameEn: "Al-Anbya",
    nameAr: "الأنبياء",
    englishTranslation: "The Prophets",
    startPage: 322,
    ayahsCount: 112,
  },
  {
    number: 22,
    nameEn: "Al-Hajj",
    nameAr: "الحج",
    englishTranslation: "The Pilgrimage",
    startPage: 332,
    ayahsCount: 78,
  },
  {
    number: 23,
    nameEn: "Al-Mu'minun",
    nameAr: "المؤمنون",
    englishTranslation: "The Believers",
    startPage: 342,
    ayahsCount: 118,
  },
  {
    number: 24,
    nameEn: "An-Nur",
    nameAr: "النور",
    englishTranslation: "The Light",
    startPage: 350,
    ayahsCount: 64,
  },
  {
    number: 25,
    nameEn: "Al-Furqan",
    nameAr: "الفرقان",
    englishTranslation: "The Criterion",
    startPage: 359,
    ayahsCount: 77,
  },
  {
    number: 26,
    nameEn: "Ash-Shu'ara",
    nameAr: "الشعراء",
    englishTranslation: "The Poets",
    startPage: 367,
    ayahsCount: 227,
  },
  {
    number: 27,
    nameEn: "An-Naml",
    nameAr: "النمل",
    englishTranslation: "The Ant",
    startPage: 377,
    ayahsCount: 93,
  },
  {
    number: 28,
    nameEn: "Al-Qasas",
    nameAr: "القصص",
    englishTranslation: "The Stories",
    startPage: 385,
    ayahsCount: 88,
  },
  {
    number: 29,
    nameEn: "Al-'Ankabut",
    nameAr: "العنكبوت",
    englishTranslation: "The Spider",
    startPage: 396,
    ayahsCount: 69,
  },
  {
    number: 30,
    nameEn: "Ar-Rum",
    nameAr: "الروم",
    englishTranslation: "The Romans",
    startPage: 404,
    ayahsCount: 60,
  },
  {
    number: 31,
    nameEn: "Luqman",
    nameAr: "لقمان",
    englishTranslation: "Luqman",
    startPage: 411,
    ayahsCount: 34,
  },
  {
    number: 32,
    nameEn: "As-Sajdah",
    nameAr: "السجدة",
    englishTranslation: "The Prostration",
    startPage: 415,
    ayahsCount: 30,
  },
  {
    number: 33,
    nameEn: "Al-Ahzab",
    nameAr: "الأحزاب",
    englishTranslation: "The Combined Forces",
    startPage: 418,
    ayahsCount: 73,
  },
  {
    number: 34,
    nameEn: "Saba",
    nameAr: "سبإ",
    englishTranslation: "Sheba",
    startPage: 428,
    ayahsCount: 54,
  },
  {
    number: 35,
    nameEn: "Fatir",
    nameAr: "فاطر",
    englishTranslation: "Originator",
    startPage: 434,
    ayahsCount: 45,
  },
  {
    number: 36,
    nameEn: "Ya-Sin",
    nameAr: "يس",
    englishTranslation: "Ya Sin",
    startPage: 440,
    ayahsCount: 83,
  },
  {
    number: 37,
    nameEn: "As-Saffat",
    nameAr: "الصافات",
    englishTranslation: "Those who set the Ranks",
    startPage: 446,
    ayahsCount: 182,
  },
  {
    number: 38,
    nameEn: "Sad",
    nameAr: "ص",
    englishTranslation: 'The Letter "Saad"',
    startPage: 453,
    ayahsCount: 88,
  },
  {
    number: 39,
    nameEn: "Az-Zumar",
    nameAr: "الزمر",
    englishTranslation: "The Troops",
    startPage: 458,
    ayahsCount: 75,
  },
  {
    number: 40,
    nameEn: "Ghafir",
    nameAr: "غافر",
    englishTranslation: "The Forgiver",
    startPage: 467,
    ayahsCount: 85,
  },
  {
    number: 41,
    nameEn: "Fussilat",
    nameAr: "فصلت",
    englishTranslation: "Explained in Detail",
    startPage: 477,
    ayahsCount: 54,
  },
  {
    number: 42,
    nameEn: "Ash-Shuraa",
    nameAr: "الشورى",
    englishTranslation: "The Consultation",
    startPage: 483,
    ayahsCount: 53,
  },
  {
    number: 43,
    nameEn: "Az-Zukhruf",
    nameAr: "الزخرف",
    englishTranslation: "The Ornaments of Gold",
    startPage: 489,
    ayahsCount: 89,
  },
  {
    number: 44,
    nameEn: "Ad-Dukhan",
    nameAr: "الدخان",
    englishTranslation: "The Smoke",
    startPage: 496,
    ayahsCount: 59,
  },
  {
    number: 45,
    nameEn: "Al-Jathiyah",
    nameAr: "الجاثية",
    englishTranslation: "The Crouching",
    startPage: 499,
    ayahsCount: 37,
  },
  {
    number: 46,
    nameEn: "Al-Ahqaf",
    nameAr: "الأحقاف",
    englishTranslation: "The Wind-Curved Sandhills",
    startPage: 502,
    ayahsCount: 35,
  },
  {
    number: 47,
    nameEn: "Muhammad",
    nameAr: "محمد",
    englishTranslation: "Muhammad",
    startPage: 507,
    ayahsCount: 38,
  },
  {
    number: 48,
    nameEn: "Al-Fath",
    nameAr: "الفتح",
    englishTranslation: "The Victory",
    startPage: 511,
    ayahsCount: 29,
  },
  {
    number: 49,
    nameEn: "Al-Hujurat",
    nameAr: "الحجرات",
    englishTranslation: "The Rooms",
    startPage: 515,
    ayahsCount: 18,
  },
  {
    number: 50,
    nameEn: "Qaf",
    nameAr: "ق",
    englishTranslation: 'The Letter "Qaf"',
    startPage: 518,
    ayahsCount: 45,
  },
  {
    number: 51,
    nameEn: "Adh-Dhariyat",
    nameAr: "الذاريات",
    englishTranslation: "The Winnowing Winds",
    startPage: 520,
    ayahsCount: 60,
  },
  {
    number: 52,
    nameEn: "At-Tur",
    nameAr: "الطور",
    englishTranslation: "The Mount",
    startPage: 523,
    ayahsCount: 49,
  },
  {
    number: 53,
    nameEn: "An-Najm",
    nameAr: "النجم",
    englishTranslation: "The Star",
    startPage: 526,
    ayahsCount: 62,
  },
  {
    number: 54,
    nameEn: "Al-Qamar",
    nameAr: "القمر",
    englishTranslation: "The Moon",
    startPage: 528,
    ayahsCount: 55,
  },
  {
    number: 55,
    nameEn: "Ar-Rahman",
    nameAr: "الرحمن",
    englishTranslation: "The Beneficent",
    startPage: 531,
    ayahsCount: 78,
  },
  {
    number: 56,
    nameEn: "Al-Waqi'ah",
    nameAr: "الواقعة",
    englishTranslation: "The Inevitable",
    startPage: 534,
    ayahsCount: 96,
  },
  {
    number: 57,
    nameEn: "Al-Hadid",
    nameAr: "الحديد",
    englishTranslation: "The Iron",
    startPage: 537,
    ayahsCount: 29,
  },
  {
    number: 58,
    nameEn: "Al-Mujadila",
    nameAr: "المجادلة",
    englishTranslation: "The Pleading Woman",
    startPage: 542,
    ayahsCount: 22,
  },
  {
    number: 59,
    nameEn: "Al-Hashr",
    nameAr: "الحشر",
    englishTranslation: "The Exile",
    startPage: 545,
    ayahsCount: 24,
  },
  {
    number: 60,
    nameEn: "Al-Mumtahanah",
    nameAr: "الممتحنة",
    englishTranslation: "She that is to be examined",
    startPage: 549,
    ayahsCount: 13,
  },
  {
    number: 61,
    nameEn: "As-Saf",
    nameAr: "الصف",
    englishTranslation: "The Ranks",
    startPage: 551,
    ayahsCount: 14,
  },
  {
    number: 62,
    nameEn: "Al-Jumu'ah",
    nameAr: "الجمعة",
    englishTranslation: "The Congregation, Friday",
    startPage: 553,
    ayahsCount: 11,
  },
  {
    number: 63,
    nameEn: "Al-Munafiqun",
    nameAr: "المنافقون",
    englishTranslation: "The Hypocrites",
    startPage: 554,
    ayahsCount: 11,
  },
  {
    number: 64,
    nameEn: "At-Taghabun",
    nameAr: "التغابن",
    englishTranslation: "The Mutual Disillusion",
    startPage: 556,
    ayahsCount: 18,
  },
  {
    number: 65,
    nameEn: "At-Talaq",
    nameAr: "الطلاق",
    englishTranslation: "The Divorce",
    startPage: 558,
    ayahsCount: 12,
  },
  {
    number: 66,
    nameEn: "At-Tahrim",
    nameAr: "التحريم",
    englishTranslation: "The Prohibition",
    startPage: 560,
    ayahsCount: 12,
  },
  {
    number: 67,
    nameEn: "Al-Mulk",
    nameAr: "الملك",
    englishTranslation: "The Sovereignty",
    startPage: 562,
    ayahsCount: 30,
  },
  {
    number: 68,
    nameEn: "Al-Qalam",
    nameAr: "القلم",
    englishTranslation: "The Pen",
    startPage: 564,
    ayahsCount: 52,
  },
  {
    number: 69,
    nameEn: "Al-Haqqah",
    nameAr: "الحاقة",
    englishTranslation: "The Reality",
    startPage: 566,
    ayahsCount: 52,
  },
  {
    number: 70,
    nameEn: "Al-Ma'arij",
    nameAr: "المعارج",
    englishTranslation: "The Ascending Stairways",
    startPage: 568,
    ayahsCount: 44,
  },
  {
    number: 71,
    nameEn: "Nuh",
    nameAr: "نوح",
    englishTranslation: "Noah",
    startPage: 570,
    ayahsCount: 28,
  },
  {
    number: 72,
    nameEn: "Al-Jinn",
    nameAr: "الجن",
    englishTranslation: "The Jinn",
    startPage: 572,
    ayahsCount: 28,
  },
  {
    number: 73,
    nameEn: "Al-Muzzammil",
    nameAr: "المزمل",
    englishTranslation: "The Enshrouded One",
    startPage: 574,
    ayahsCount: 20,
  },
  {
    number: 74,
    nameEn: "Al-Muddaththir",
    nameAr: "المدثر",
    englishTranslation: "The Cloaked One",
    startPage: 575,
    ayahsCount: 56,
  },
  {
    number: 75,
    nameEn: "Al-Qiyamah",
    nameAr: "القيامة",
    englishTranslation: "The Resurrection",
    startPage: 577,
    ayahsCount: 40,
  },
  {
    number: 76,
    nameEn: "Al-Insan",
    nameAr: "الانسان",
    englishTranslation: "The Man",
    startPage: 578,
    ayahsCount: 31,
  },
  {
    number: 77,
    nameEn: "Al-Mursalat",
    nameAr: "المرسلات",
    englishTranslation: "The Emissaries",
    startPage: 580,
    ayahsCount: 50,
  },
  {
    number: 78,
    nameEn: "An-Naba",
    nameAr: "النبإ",
    englishTranslation: "The Tidings",
    startPage: 582,
    ayahsCount: 40,
  },
  {
    number: 79,
    nameEn: "An-Nazi'at",
    nameAr: "النازعات",
    englishTranslation: "Those who drag forth",
    startPage: 583,
    ayahsCount: 46,
  },
  {
    number: 80,
    nameEn: "'Abasa",
    nameAr: "عبس",
    englishTranslation: "He Frowned",
    startPage: 585,
    ayahsCount: 42,
  },
  {
    number: 81,
    nameEn: "At-Takwir",
    nameAr: "التكوير",
    englishTranslation: "The Overthrowing",
    startPage: 586,
    ayahsCount: 29,
  },
  {
    number: 82,
    nameEn: "Al-Infitar",
    nameAr: "الإنفطار",
    englishTranslation: "The Cleaving",
    startPage: 587,
    ayahsCount: 19,
  },
  {
    number: 83,
    nameEn: "Al-Mutaffifin",
    nameAr: "المطففين",
    englishTranslation: "The Defrauding",
    startPage: 587,
    ayahsCount: 36,
  },
  {
    number: 84,
    nameEn: "Al-Inshiqaq",
    nameAr: "الإنشقاق",
    englishTranslation: "The Sundering",
    startPage: 589,
    ayahsCount: 25,
  },
  {
    number: 85,
    nameEn: "Al-Buruj",
    nameAr: "البروج",
    englishTranslation: "The Mansions of the Stars",
    startPage: 590,
    ayahsCount: 22,
  },
  {
    number: 86,
    nameEn: "At-Tariq",
    nameAr: "الطارق",
    englishTranslation: "The Nightcommer",
    startPage: 591,
    ayahsCount: 17,
  },
  {
    number: 87,
    nameEn: "Al-A'la",
    nameAr: "الأعلى",
    englishTranslation: "The Most High",
    startPage: 591,
    ayahsCount: 19,
  },
  {
    number: 88,
    nameEn: "Al-Ghashiyah",
    nameAr: "الغاشية",
    englishTranslation: "The Overwhelming",
    startPage: 592,
    ayahsCount: 26,
  },
  {
    number: 89,
    nameEn: "Al-Fajr",
    nameAr: "الفجر",
    englishTranslation: "The Dawn",
    startPage: 593,
    ayahsCount: 30,
  },
  {
    number: 90,
    nameEn: "Al-Balad",
    nameAr: "البلد",
    englishTranslation: "The City",
    startPage: 594,
    ayahsCount: 20,
  },
  {
    number: 91,
    nameEn: "Ash-Shams",
    nameAr: "الشمس",
    englishTranslation: "The Sun",
    startPage: 595,
    ayahsCount: 15,
  },
  {
    number: 92,
    nameEn: "Al-Layl",
    nameAr: "الليل",
    englishTranslation: "The Night",
    startPage: 595,
    ayahsCount: 21,
  },
  {
    number: 93,
    nameEn: "Ad-Duhaa",
    nameAr: "الضحى",
    englishTranslation: "The Morning Hours",
    startPage: 596,
    ayahsCount: 11,
  },
  {
    number: 94,
    nameEn: "Ash-Sharh",
    nameAr: "الشرح",
    englishTranslation: "The Relief",
    startPage: 596,
    ayahsCount: 8,
  },
  {
    number: 95,
    nameEn: "At-Tin",
    nameAr: "التين",
    englishTranslation: "The Fig",
    startPage: 597,
    ayahsCount: 8,
  },
  {
    number: 96,
    nameEn: "Al-'Alaq",
    nameAr: "العلق",
    englishTranslation: "The Clot",
    startPage: 597,
    ayahsCount: 19,
  },
  {
    number: 97,
    nameEn: "Al-Qadr",
    nameAr: "القدر",
    englishTranslation: "The Power",
    startPage: 598,
    ayahsCount: 5,
  },
  {
    number: 98,
    nameEn: "Al-Bayyinah",
    nameAr: "البينة",
    englishTranslation: "The Clear Proof",
    startPage: 598,
    ayahsCount: 8,
  },
  {
    number: 99,
    nameEn: "Az-Zalzalah",
    nameAr: "الزلزلة",
    englishTranslation: "The Earthquake",
    startPage: 599,
    ayahsCount: 8,
  },
  {
    number: 100,
    nameEn: "Al-'Adiyat",
    nameAr: "العاديات",
    englishTranslation: "The Courser",
    startPage: 599,
    ayahsCount: 11,
  },
  {
    number: 101,
    nameEn: "Al-Qari'ah",
    nameAr: "القارعة",
    englishTranslation: "The Calamity",
    startPage: 600,
    ayahsCount: 11,
  },
  {
    number: 102,
    nameEn: "At-Takathur",
    nameAr: "التكاثر",
    englishTranslation: "The Rivalry in world increase",
    startPage: 600,
    ayahsCount: 8,
  },
  {
    number: 103,
    nameEn: "Al-'Asr",
    nameAr: "العصر",
    englishTranslation: "The Declining Day",
    startPage: 601,
    ayahsCount: 3,
  },
  {
    number: 104,
    nameEn: "Al-Humazah",
    nameAr: "الهمزة",
    englishTranslation: "The Traducer",
    startPage: 601,
    ayahsCount: 9,
  },
  {
    number: 105,
    nameEn: "Al-Fil",
    nameAr: "الفيل",
    englishTranslation: "The Elephant",
    startPage: 601,
    ayahsCount: 5,
  },
  {
    number: 106,
    nameEn: "Quraysh",
    nameAr: "قريش",
    englishTranslation: "Quraysh",
    startPage: 602,
    ayahsCount: 4,
  },
  {
    number: 107,
    nameEn: "Al-Ma'un",
    nameAr: "الماعون",
    englishTranslation: "The Small kindnesses",
    startPage: 602,
    ayahsCount: 7,
  },
  {
    number: 108,
    nameEn: "Al-Kawthar",
    nameAr: "الكوثر",
    englishTranslation: "The Abundance",
    startPage: 602,
    ayahsCount: 3,
  },
  {
    number: 109,
    nameEn: "Al-Kafirun",
    nameAr: "الكافرون",
    englishTranslation: "The Disbelievers",
    startPage: 603,
    ayahsCount: 6,
  },
  {
    number: 110,
    nameEn: "An-Nasr",
    nameAr: "النصر",
    englishTranslation: "The Divine Support",
    startPage: 603,
    ayahsCount: 3,
  },
  {
    number: 111,
    nameEn: "Al-Masad",
    nameAr: "المسد",
    englishTranslation: "The Palm Fiber",
    startPage: 603,
    ayahsCount: 5,
  },
  {
    number: 112,
    nameEn: "Al-Ikhlas",
    nameAr: "الإخلاص",
    englishTranslation: "The Sincerity",
    startPage: 604,
    ayahsCount: 4,
  },
  {
    number: 113,
    nameEn: "Al-Falaq",
    nameAr: "الفلق",
    englishTranslation: "The Daybreak",
    startPage: 604,
    ayahsCount: 5,
  },
  {
    number: 114,
    nameEn: "An-Nas",
    nameAr: "الناس",
    englishTranslation: "Mankind",
    startPage: 604,
    ayahsCount: 6,
  },
];

/**
 * Determine Juz number for a given page (1 to 604)
 */
export function getJuzForPage(page: number): number {
  for (const juz of JUZ_LIST) {
    if (page >= juz.startPage && page <= juz.endPage) {
      return juz.juzNumber;
    }
  }
  if (page >= 1 && page <= 604) {
    const meta = QURAN_PAGES_METADATA[page - 1];
    if (meta && meta.juzNumber) return meta.juzNumber;
  }
  return 1;
}

/**
 * Determine authentic Surah information and exact Ayah range for any page (1 to 604)
 */
export function getSurahForPage(page: number): {
  surahNumber: number;
  nameEn: string;
  nameAr: string;
  ayahRange: string;
} {
  if (page >= 1 && page <= 604) {
    const meta = QURAN_PAGES_METADATA[page - 1];
    if (meta) {
      return {
        surahNumber: meta.surahNumber,
        nameEn: meta.surahNameEn,
        nameAr: meta.surahNameAr,
        ayahRange: meta.ayahRange,
      };
    }
  }
  return {
    surahNumber: 1,
    nameEn: "Al-Fatihah",
    nameAr: "الفاتحة",
    ayahRange: "1 - 7",
  };
}

/**
 * Helper to get authentic printed Madinah Mushaf page image URL
 * Standard King Fahd Complex 15-line Madinah Mushaf scanned pages
 */
export function getQuranPageImageUrl(
  pageNumber: number,
  width: 1024 | 1260 = 1260,
): string {
  const padded = String(Math.max(1, Math.min(604, pageNumber))).padStart(
    3,
    "0",
  );
  return `https://files.quran.app/hafs/madani/width_${width}/page${padded}.png`;
}

// Pre-calculated FSRS progression table for Al-Qur'an (Target Retention 95%, Difficulty 10.0, FSRS-6):
// Review 1 to 45 with exact stability curve:
const FSRS_QURAN_SIMULATION_STABILITY = [
  2.7, 3.11, 3.57, 4.09, 4.66, 5.29, 5.99, 6.77, 7.62, 8.56, 9.59, 10.72, 11.95,
  13.29, 14.75, 16.34, 18.06, 19.92, 21.94, 24.12, 26.47, 28.99, 31.71, 34.63,
  37.76, 41.12, 44.71, 48.55, 52.64, 57.01, 61.67, 66.63, 71.9, 77.5, 83.45,
  89.75, 96.43, 103.51, 111.0, 118.91, 127.27, 136.1, 145.4, 155.22, 165.55,
];

/**
 * Generate all 604 Quran pages with clean 0-state (no pre-activated pages, fresh for new accounts)
 */
export function generateCleanQuranPages(): QuranPageItem[] {
  const pages: QuranPageItem[] = [];
  for (let pageNum = 1; pageNum <= 604; pageNum++) {
    const juzNum = getJuzForPage(pageNum);
    const surahInfo = getSurahForPage(pageNum);

    pages.push({
      pageNumber: pageNum,
      juzNumber: juzNum,
      surahNameEn: surahInfo.nameEn,
      surahNameAr: surahInfo.nameAr,
      surahNumber: surahInfo.surahNumber,
      ayahRange: surahInfo.ayahRange,
      isActive: false,
      imageUrl: getQuranPageImageUrl(pageNum, 1260),
      status: "inactive",
      mapanCelebrated: false,
      reviewLogs: [],
      fsrsData: {
        stability: 0,
        difficulty: 10.0,
        reps: 0,
        lapses: 0,
        lastReview: null,
        nextReview: null,
        state: "new",
      },
    });
  }
  return pages;
}

/**
 * Guarantees that an array of Quran pages always contains all 604 pages.
 * If any pages are missing (e.g. from partial remote sync or stale cache),
 * it fills in missing pages from clean defaults.
 */
export function ensureComplete604Pages(
  existingPages: QuranPageItem[],
): QuranPageItem[] {
  const clean = generateCleanQuranPages();
  const map = new Map<number, QuranPageItem>();
  if (Array.isArray(existingPages)) {
    existingPages.forEach((p) => {
      if (p && p.pageNumber != null) {
        const num = Number(p.pageNumber);
        if (!isNaN(num)) {
          map.set(num, { ...p, pageNumber: num });
        }
      }
    });
  }
  return clean.map((defaultPage) => {
    const pNum = Number(defaultPage.pageNumber);
    const found = map.get(pNum);
    return found
      ? {
          ...defaultPage,
          ...found,
          pageNumber: pNum,
          juzNumber: getJuzForPage(pNum),
        }
      : defaultPage;
  });
}

/**
 * Generate all 604 Quran pages with authentic Surah and Ayah metadata
 */
export function generateInitialQuranPages(): QuranPageItem[] {
  const pages: QuranPageItem[] = [];
  const now = Date.now();

  for (let pageNum = 1; pageNum <= 604; pageNum++) {
    const juzNum = getJuzForPage(pageNum);
    const surahInfo = getSurahForPage(pageNum);

    let isActive = false;
    let isMastered = false;
    let isDueToday = false;
    let reps = 0;
    let stability = 0;
    let nextReviewDate: string | null = null;
    let lastReviewDate: string | null = null;

    // Juz 30: 23 halaman aktif semua (582 - 604)
    // Halaman 582: review 1x, Halaman 583: review 2x, ... Halaman 604: review 23x
    if (pageNum >= 582 && pageNum <= 604) {
      isActive = true;
      reps = pageNum - 582 + 1; // 1 s.d. 23
      stability = FSRS_QURAN_SIMULATION_STABILITY[reps - 1];
      const interval = Math.max(1, Math.round(stability * 0.4025587));

      // Khusus halaman 582 dibuat due today agar bisa langsung dicoba/diobservasi murajaah
      if (pageNum === 582) {
        isDueToday = true;
        nextReviewDate = new Date(now - 3600000).toISOString();
        lastReviewDate = new Date(now - 86400000).toISOString();
      } else {
        isDueToday = false;
        nextReviewDate = new Date(now + interval * 86400000).toISOString();
        lastReviewDate = new Date(
          now - Math.max(1, Math.floor(interval / 2)) * 86400000,
        ).toISOString();
      }
    }
    // Juz 29: 20 halaman aktif semua (562 - 581, Surah Al-Mulk s.d. Al-Mursalat)
    // Halaman 562: review 24x, Halaman 563: review 25x, ... Halaman 572: review 34x (mencapai Mapan / 31d), s.d. Halaman 581: review 43x
    else if (pageNum >= 562 && pageNum <= 581) {
      isActive = true;
      reps = 24 + (pageNum - 562); // 24 s.d. 43
      stability =
        FSRS_QURAN_SIMULATION_STABILITY[
          Math.min(reps - 1, FSRS_QURAN_SIMULATION_STABILITY.length - 1)
        ];
      const rawInterval = Math.round(stability * 0.4025587);
      const interval = Math.max(1, rawInterval);

      // Jika interval >= 30 (mulai review #34 / hal 572), status otomatis Mapan
      if (rawInterval >= 30) {
        isMastered = true;
      }

      nextReviewDate = new Date(now + interval * 86400000).toISOString();
      lastReviewDate = new Date(
        now - Math.max(1, Math.floor(interval / 2)) * 86400000,
      ).toISOString();
    }
    // Juz 1: 10/21 activated (pages 1-10) untuk variasi halaman awal
    else if (pageNum >= 1 && pageNum <= 10) {
      isActive = true;
      if (pageNum === 1) {
        isDueToday = true;
        reps = 14;
        stability = 13.29;
      } else if (pageNum === 2) {
        isDueToday = false;
        reps = 11;
        stability = 9.59;
      } else if (pageNum === 3) {
        isMastered = true;
        reps = 34;
        stability = 77.5;
      } else {
        isDueToday = pageNum % 2 === 0;
        reps = 8 + (pageNum % 5);
        stability = FSRS_QURAN_SIMULATION_STABILITY[reps - 1] || 10;
      }
      const rawInt = Math.round(stability * 0.4025587);
      const interval = Math.max(1, rawInt);
      nextReviewDate = isDueToday
        ? new Date(now - 3600000).toISOString()
        : new Date(now + interval * 86400000).toISOString();
      lastReviewDate = new Date(now - 86400000 * 2).toISOString();
    }

    pages.push({
      pageNumber: pageNum,
      juzNumber: juzNum,
      surahNameEn: surahInfo.nameEn,
      surahNameAr: surahInfo.nameAr,
      surahNumber: surahInfo.surahNumber,
      ayahRange: surahInfo.ayahRange,
      isActive,
      imageUrl: getQuranPageImageUrl(pageNum, 1260),
      status: isMastered
        ? "mastered_for_now"
        : isActive
          ? "active"
          : "inactive",
      mapanCelebrated: isMastered,
      fsrsData: {
        stability,
        difficulty: 10.0, // Standar kelancaran Al-Qur'an
        reps,
        lapses: 0,
        lastReview: lastReviewDate,
        nextReview: nextReviewDate,
        state: isMastered ? "mastered" : isActive ? "review" : "new",
      },
    });
  }

  return pages;
}

/**
 * Authentic Arabic sample text snippets for high-fidelity Mushaf page preview
 */
export const MUSHAF_SAMPLE_SNIPPETS: Record<
  number,
  { bismillah?: boolean; header: string; lines: string[] }
> = {
  1: {
    bismillah: false,
    header: "سُورَةُ الفَاتِحَةِ",
    lines: [
      "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ (١)",
      "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ (٢)",
      "الرَّحْمَٰنِ الرَّحِيمِ (٣) مَالِكِ يَوْمِ الدِّينِ (٤)",
      "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ (٥)",
      "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ (٦)",
      "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ",
      "غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ (٧)",
    ],
  },
  2: {
    bismillah: true,
    header: "سُورَةُ البَقَرَةِ",
    lines: [
      "الم (١)",
      "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ (٢)",
      "الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ (٣)",
      "وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنزِلَ إِلَيْكَ وَمَا أُنزِلَ مِن قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ (٤)",
      "أُولَٰئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ (٥)",
    ],
  },
  3: {
    bismillah: false,
    header: "سُورَةُ البَقَرَةِ",
    lines: [
      "إِنَّ الَّذِينَ كَفَرُوا سَوَاءٌ عَلَيْهِمْ أَأَنذَرْتَهُمْ أَمْ لَمْ تُنذِرْهُمْ لَا يُؤْمِنُونَ (٦)",
      "خَتَمَ اللَّهُ عَلَىٰ قُلُوبِهِمْ وَعَلَىٰ سَمْعِهِمْ ۖ وَعَلَىٰ أَبْصَارِهِمْ غِشَاوَةٌ ۖ وَلَهُمْ عَذَابٌ عَظِيمٌ (٧)",
      "وَمِنَ النَّاسِ مَن يَقُولُ آمَنَّا بِاللَّهِ وَبِالْيَوْمِ الْآخِرِ وَمَا هُم بِمُؤْمِنِينَ (٨)",
      "يُخَادِعُونَ اللَّهَ وَالَّذِينَ آمَنُوا وَمَا يَخْدَعُونَ إِلَّا أَنفُسَهُمْ وَمَا يَشْعُرُونَ (٩)",
      "فِي قُلُوبِهِم مَّرَضٌ فَزَادَهُمُ اللَّهُ مَرَضًا ۖ وَلَهُمْ عَذَابٌ أَلِيمٌ بِمَا كَانُوا يَكْذِبُونَ (١٠)",
    ],
  },
  562: {
    bismillah: true,
    header: "سُورَةُ المُلْكِ",
    lines: [
      "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ (١)",
      "الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ الْعَزِيزُ الْغَفُورُ (٢)",
      "الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا ۖ مَّا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ ۖ فَارْجِعِ الْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ (٣)",
      "ثُمَّ ارْجِعِ الْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ الْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ (٤)",
    ],
  },
  582: {
    bismillah: true,
    header: "سُورَةُ النَّبَإِ",
    lines: [
      "عَمَّ يَتَسَاءَلُونَ (١)",
      "عَنِ النَّبَإِ الْعَظِيمِ (٢)",
      "الَّذِي هُمْ فِيهِ مُخْتَلِفُونَ (٣)",
      "كَلَّا سَيَعْلَمُونَ (٤)",
      "ثُمَّ كَلَّا سَيَعْلَمُونَ (٥)",
      "أَلَمْ نَجْعَلِ الْأَرْضَ مِهَادًا (٦)",
      "وَالْجِبَالَ أَوْتَادًا (٧)",
      "وَخَلَقْنَاكُمْ أَزْوَاجًا (٨)",
    ],
  },
  604: {
    bismillah: true,
    header: "سُوَرُ الإِخْلَاصِ وَالفَلَقِ وَالنَّاسِ",
    lines: [
      "قُلْ هُوَ اللَّهُ أَحَدٌ (١) اللَّهُ الصَّمَدُ (٢) لَمْ يَلِدْ وَلَمْ يُولَدْ (٣) وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ (٤)",
      "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ (١) مِن شَرِّ مَا خَلَقَ (٢) وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ (٣) وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ (٤) وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ (٥)",
      "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      "قُلْ أَعُوذُ بِرَبِّ النَّاسِ (١) مَلِكِ النَّاسِ (٢) إِلَٰهِ النَّاسِ (٣) مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ (٤) الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ (٥) مِنَ الْجِنَّةِ وَالنَّاسِ (٦)",
    ],
  },
};

export const getQuranPageAudioUrl = (pageNumber: number): string => {
  const paddedStr = pageNumber.toString().padStart(3, "0");
  return `https://everyayah.com/data/Alafasy_128kbps/PageMp3s/Page${paddedStr}.mp3`;
};
