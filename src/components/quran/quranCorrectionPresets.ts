// Shared presets for Quran Corrections / Error Annotation across components

export interface HijaiyahDetail {
  ar: string;
  latin: string;
  makhraj: string;
  sifat: string[];
  commonErrors: string[];
  confusableWith?: string[];
}

export const HIJAIYAH_LETTERS: HijaiyahDetail[] = [
  { 
    ar: 'ا', 
    latin: 'Alif',
    makhraj: 'Rongga mulut dan rongga tenggorokan (Al-Jauf)',
    sifat: ['Mad (Suara Panjang)', 'Jahr (Nafas Ditahan)', 'Khafa (Samar)'],
    commonErrors: [
      'Memantul di akhir suara (Qalqalah palsu)',
      'Suara sengau / masuk hidung',
      'Panjang tidak stabil'
    ]
  },
  { 
    ar: 'ب', 
    latin: 'Ba',
    makhraj: 'Kedua bibir merapat (Asy-Syafatain)',
    sifat: ['Syiddah (Suara Tertahan)', 'Jahr (Nafas Ditahan)', 'Qalqalah (Pantulan)', 'Istifal (Tipis)', 'Infitah'],
    commonErrors: [
      'Qalqalah kurang memantul / tertahan',
      'Keluar nafas desis (Hams)',
      'Tertukar Mim (م)',
      'Suara kurang bersih'
    ],
    confusableWith: ['م', 'ف']
  },
  { 
    ar: 'ت', 
    latin: 'Ta',
    makhraj: 'Ujung lidah ke pangkal gigi seri atas',
    sifat: ['Syiddah (Tertahan)', 'Hams (Desis Nafas Tipis)', 'Istifal (Tipis)', 'Infitah'],
    commonErrors: [
      'Hams berlebihan (seperti "ts" atau "c")',
      'Hams hilang total (terlalu keras)',
      'Tertukar Tha (ط) - hilang sifat tipis',
      'Tertukar Tsa (ث)'
    ],
    confusableWith: ['ط', 'ث']
  },
  { 
    ar: 'ث', 
    latin: 'Tsa',
    makhraj: 'Ujung lidah sedikit keluar di ujung dua gigi seri atas',
    sifat: ['Hams (Nafas Mengalir)', 'Rakhawah (Suara Mengalir)', 'Istifal (Tipis)', 'Infitah'],
    commonErrors: [
      'Tertukar Sin (س) - berdesir tajam',
      'Tertukar Ta (ت)',
      'Lidah tidak dikeluarkan sedikit',
      'Nafas (Hams) kurang mengalir'
    ],
    confusableWith: ['س', 'ت']
  },
  { 
    ar: 'ج', 
    latin: 'Jim',
    makhraj: 'Tengah lidah bertemu langit-langit tengah',
    sifat: ['Syiddah (Suara Tertahan)', 'Jahr (Nafas Ditahan - Tanpa Hams!)', 'Qalqalah', 'Istifal', 'Infitah'],
    commonErrors: [
      'Keluar desis nafas Hams (seperti "ch" atau "sy")',
      'Tertukar Syin (ش)',
      'Qalqalah kurang memantul',
      'Tertukar Zai (ز)'
    ],
    confusableWith: ['ش', 'ز']
  },
  { 
    ar: 'ح', 
    latin: 'Ha Halus',
    makhraj: 'Tengah tenggorokan (Wasathul Halq)',
    sifat: ['Hams (Nafas Mengalir Bersih)', 'Rakhawah (Suara Mengalir)', 'Istifal (Tipis)', 'Infitah'],
    commonErrors: [
      'Tertukar Ha Besar (هـ)',
      'Tertukar Kha (خ)',
      'Nafas (Hams) kurang bersih',
      'Suara tercekat kasar di tenggorokan'
    ],
    confusableWith: ['هـ', 'خ']
  },
  { 
    ar: 'خ', 
    latin: 'Kha',
    makhraj: 'Ujung tenggorokan atas (Adnal Halq)',
    sifat: ['Isti\'la (Tebal - Pangkal Lidah Naik)', 'Hams (Nafas Mengalir)', 'Rakhawah (Suara Mengalir)', 'Infitah'],
    commonErrors: [
      'Kurang tebal (dibaca tipis/tarqiq)',
      'Getaran mengorok terlalu kasar',
      'Tertukar Ha Halus (ح)',
      'Tertukar Ghain (غ)'
    ],
    confusableWith: ['ح', 'غ']
  },
  { 
    ar: 'د', 
    latin: 'Dal',
    makhraj: 'Ujung lidah ke pangkal gigi seri atas',
    sifat: ['Syiddah (Suara Tertahan)', 'Jahr (Nafas Ditahan)', 'Qalqalah', 'Istifal (Tipis)', 'Infitah'],
    commonErrors: [
      'Keluar nafas desis (Hams)',
      'Qalqalah kurang memantul',
      'Tertukar Dhad (ض)',
      'Tertukar Ta (ت)'
    ],
    confusableWith: ['ض', 'ت']
  },
  { 
    ar: 'ذ', 
    latin: 'Dzal',
    makhraj: 'Ujung lidah sedikit keluar di ujung dua gigi seri atas',
    sifat: ['Jahr (Nafas Ditahan - Tanpa Desir!)', 'Rakhawah (Suara Mengalir)', 'Istifal (Tipis)', 'Infitah'],
    commonErrors: [
      'Tertukar Zai (ز) - malah berdesir lebah',
      'Tertukar Dal (د)',
      'Keluar desis nafas Hams',
      'Lidah tidak dikeluarkan sedikit'
    ],
    confusableWith: ['ز', 'د']
  },
  { 
    ar: 'ر', 
    latin: 'Ra',
    makhraj: 'Punggung ujung lidah ke gusi atas',
    sifat: ['Tawassuth (Bainiyyah - Suara Sedang)', 'Jahr (Nafas Ditahan)', 'Inhiraf', 'Takrir (Getaran 1-2 Ketuk)'],
    commonErrors: [
      'Takrir berlebihan (getaran >2 kali)',
      'Takrir hilang total (seperti R cadel/inggris)',
      'Ra Tebal (Tafkhim) dibaca tipis',
      'Ra Tipis (Tarqiq) dibaca tebal'
    ]
  },
  { 
    ar: 'ز', 
    latin: 'Zai',
    makhraj: 'Ujung lidah di atas gigi seri bawah',
    sifat: ['Jahr (Nafas Ditahan)', 'Rakhawah (Suara Mengalir)', 'Shafir (Desir Lebah)', 'Istifal', 'Infitah'],
    commonErrors: [
      'Tertukar Dzal (ذ) - hilang desir shafir',
      'Tertukar Jim (ج)',
      'Desir suara (Shafir) kurang tajam'
    ],
    confusableWith: ['ذ', 'ج']
  },
  { 
    ar: 'س', 
    latin: 'Sin',
    makhraj: 'Ujung lidah di atas gigi seri bawah',
    sifat: ['Hams (Nafas Mengalir)', 'Rakhawah (Suara Mengalir)', 'Shafir (Desir Tajam Burung)', 'Istifal', 'Infitah'],
    commonErrors: [
      'Tertukar Tsa (ث)',
      'Tertukar Syin (ش)',
      'Tertukar Shad (ص) - malah tebal',
      'Desir Shafir kurang tajam'
    ],
    confusableWith: ['ث', 'ش', 'ص']
  },
  { 
    ar: 'ش', 
    latin: 'Syin',
    makhraj: 'Tengah lidah bertemu langit-langit tengah',
    sifat: ['Hams (Nafas Mengalir)', 'Rakhawah (Suara Mengalir)', 'Tafasysyi (Angin Menyebar di Mulut)', 'Istifal', 'Infitah'],
    commonErrors: [
      'Tafasysyi kurang menyebar',
      'Bibir dimonyongkan berlebihan',
      'Tertukar Sin (س)',
      'Tertukar Jim (ج)'
    ],
    confusableWith: ['س', 'ج']
  },
  { 
    ar: 'ص', 
    latin: 'Shad',
    makhraj: 'Ujung lidah di atas gigi seri bawah',
    sifat: ['Isti\'la (Tebal)', 'Ithbaq (Tertutup Langit-langit)', 'Hams (Nafas Mengalir)', 'Rakhawah', 'Shafir (Desir Tajam)'],
    commonErrors: [
      'Tertukar Sin (س) - kurang tebal & ithbaq hilang',
      'Bibir dimonyongkan berlebihan',
      'Shafir kurang tajam'
    ],
    confusableWith: ['س']
  },
  { 
    ar: 'ض', 
    latin: 'Dhad',
    makhraj: 'Sisi lidah (Hafatul Lisan) bertemu geraham atas kiri/kanan',
    sifat: ['Isti\'la (Tebal)', 'Ithbaq (Tertutup Rapat)', 'Rakhawah (Suara Mengalir)', 'Jahr (Nafas Ditahan - Tanpa Hams!)', 'Istitholah (Suara Memanjang di Sisi Lidah)'],
    commonErrors: [
      'Tertukar Zha (ظ)',
      'Tertukar Dal (د)',
      'Istitholah hilang / terpotong (terbaca membal)',
      'Kurang tebal (Isti\'la & Ithbaq lemah)',
      'Suara tertahan kasar (bukan Rakhawah)'
    ],
    confusableWith: ['ظ', 'د', 'ط']
  },
  { 
    ar: 'ط', 
    latin: 'Tha',
    makhraj: 'Ujung lidah ke pangkal gigi seri atas',
    sifat: ['Isti\'la (Paling Tebal)', 'Ithbaq (Tertutup Rapat)', 'Syiddah (Suara Tertahan Kuat)', 'Jahr (Nafas Ditahan)', 'Qalqalah (Pantulan Terkuat)'],
    commonErrors: [
      'Tertukar Ta (ت) - hilang tebal & ithbaq',
      'Qalqalah kurang memantul / berharakat hamzah',
      'Keluar desis nafas (Hams)',
      'Kurang tebal'
    ],
    confusableWith: ['ت']
  },
  { 
    ar: 'ظ', 
    latin: 'Zha',
    makhraj: 'Ujung lidah sedikit keluar di ujung dua gigi seri atas',
    sifat: ['Isti\'la (Tebal)', 'Ithbaq (Tertutup Langit-langit)', 'Jahr (Nafas Ditahan)', 'Rakhawah (Suara Mengalir)'],
    commonErrors: [
      'Tertukar Dzal (ذ) - hilang sifat tebal',
      'Tertukar Dhad (ض)',
      'Keluar desis nafas Hams',
      'Lidah terlalu masuk ke dalam'
    ],
    confusableWith: ['ذ', 'ض']
  },
  { 
    ar: 'ع', 
    latin: "'Ain",
    makhraj: 'Tengah tenggorokan (Wasathul Halq)',
    sifat: ['Tawassuth (Bainiyyah - Suara Sedang)', 'Jahr (Nafas Ditahan)', 'Istifal (Tipis)', 'Infitah'],
    commonErrors: [
      'Tertukar Hamzah (ء)',
      'Suara terlalu sengau masuk hidung',
      'Terlalu tercekat kasar (Syiddah)',
      'Suara lemas / makhraj tidak jelas'
    ],
    confusableWith: ['ء']
  },
  { 
    ar: 'غ', 
    latin: 'Ghain',
    makhraj: 'Ujung tenggorokan atas (Adnal Halq)',
    sifat: ['Isti\'la (Tebal)', 'Jahr (Nafas Ditahan - Tanpa Hams!)', 'Rakhawah (Suara Mengalir)', 'Infitah'],
    commonErrors: [
      'Tertukar Kha (خ) - keluar nafas Hams',
      'Suara mengorok terlalu kasar',
      'Kurang tebal (dibaca tipis)'
    ],
    confusableWith: ['خ']
  },
  { 
    ar: 'ف', 
    latin: 'Fa',
    makhraj: 'Bibir bawah bagian dalam dengan ujung dua gigi seri atas',
    sifat: ['Hams (Nafas Mengalir Jelas)', 'Rakhawah (Suara Mengalir)', 'Istifal (Tipis)', 'Infitah'],
    commonErrors: [
      'Tertukar huruf P (kedua bibir merapat)',
      'Nafas Hams kurang mengalir',
      'Tertukar Ba (ب)'
    ],
    confusableWith: ['ب']
  },
  { 
    ar: 'ق', 
    latin: 'Qaf',
    makhraj: 'Pangkal lidah paling belakang (Aqshal Lisan) ke langit-langit lunak',
    sifat: ['Isti\'la (Tebal)', 'Syiddah (Suara Tertahan)', 'Jahr (Nafas Ditahan)', 'Qalqalah (Pantulan Kuat)', 'Infitah'],
    commonErrors: [
      'Tertukar Kaf (ك) - keluar desis Hams',
      'Tertukar Hamzah (ء)',
      'Qalqalah kurang memantul',
      'Kurang tebal / makhraj terlalu maju'
    ],
    confusableWith: ['ك', 'ء']
  },
  { 
    ar: 'ك', 
    latin: 'Kaf',
    makhraj: 'Pangkal lidah di bawah makhraj Qaf ke langit-langit keras',
    sifat: ['Syiddah (Tertahan)', 'Hams (Desis Nafas Tipis)', 'Istifal (Tipis)', 'Infitah'],
    commonErrors: [
      'Tertukar Qaf (ق)',
      'Hams berlebihan (seperti "kh" atau "ch")',
      'Hams hilang total (terlalu kaku/keras)'
    ],
    confusableWith: ['ق']
  },
  { 
    ar: 'ل', 
    latin: 'Lam',
    makhraj: 'Ujung tepi lidah ke gusi atas',
    sifat: ['Tawassuth (Suara Sedang)', 'Jahr (Nafas Ditahan)', 'Inhiraf', 'Istifal (Tipis, kecuali Lam Jalalah)'],
    commonErrors: [
      'Suara terputus kaku (kurang tawassuth)',
      'Lam Jalalah (Lafazh Allah) tertukar tebal/tipis'
    ],
    confusableWith: ['ر']
  },
  { 
    ar: 'م', 
    latin: 'Mim',
    makhraj: 'Kedua bibir merapat (Asy-Syafatain) + Rongga Hidung (Al-Khaisyum)',
    sifat: ['Tawassuth (Suara Sedang)', 'Jahr (Nafas Ditahan)', 'Ghunnah (Dengung Bawaan)', 'Istifal', 'Infitah'],
    commonErrors: [
      'Bibir kurang rapat',
      'Dengung berlebihan di luar hukum dengung',
      'Suara tertahan kaku'
    ],
    confusableWith: ['ن', 'ب']
  },
  { 
    ar: 'ن', 
    latin: 'Nun',
    makhraj: 'Ujung lidah ke gusi atas + Rongga Hidung (Al-Khaisyum)',
    sifat: ['Tawassuth (Suara Sedang)', 'Jahr (Nafas Ditahan)', 'Ghunnah (Dengung Bawaan)', 'Istifal', 'Infitah'],
    commonErrors: [
      'Ujung lidah kurang menempel gusi',
      'Dengung berlebihan di luar hukum dengung',
      'Suara tertahan kaku'
    ],
    confusableWith: ['م', 'ل']
  },
  { 
    ar: 'و', 
    latin: 'Waw',
    makhraj: 'Kedua bibir membulat (Dhommatus Syafatan)',
    sifat: ['Jahr (Nafas Ditahan)', 'Rakhawah (Suara Mengalir)', 'Lin (Saat Sukun Didahului Fathah)', 'Istifal'],
    commonErrors: [
      'Bibir kurang membulat (terdengar seperti "O")',
      'Suara masuk hidung (Sengau)',
      'Mengayun tidak stabil'
    ]
  },
  { 
    ar: 'هـ', 
    latin: 'Ha Besar',
    makhraj: 'Pangkal tenggorokan paling bawah / dada (Aqshal Halq)',
    sifat: ['Hams (Nafas Mengalir)', 'Rakhawah (Suara Mengalir)', 'Istifal (Tipis)', 'Khafa (Samar)'],
    commonErrors: [
      'Tertukar Ha Halus (ح)',
      'Suara hilang / terlalu samar',
      'Terlalu menekan dada dengan kasar'
    ],
    confusableWith: ['ح', 'ء']
  },
  { 
    ar: 'ي', 
    latin: 'Ya',
    makhraj: 'Tengah lidah bertemu langit-langit tengah',
    sifat: ['Jahr (Nafas Ditahan)', 'Rakhawah (Suara Mengalir)', 'Lin (Saat Sukun Didahului Fathah)', 'Istifal'],
    commonErrors: [
      'Suara masuk ke rongga hidung (Sengau)',
      'Bunyi berubah ke vokal "E"',
      'Kurang mengalir'
    ]
  }
];

// Fallback modifiers for generic makhraj issues
export const MAKHRAJ_MODIFIERS = [
  'Makhraj Kurang Pas',
  'Tertukar Huruf Lain',
  'Kurang Tebal (Isti\'la)',
  'Hams / Nafas Kurang',
  'Qalqalah Tertahan',
  'Suara Sengau / Kurang Bersih'
];

// Fluent hierarchy ordered by real occurrence
export const KELANCARAN_PRESETS = [
  { label: 'Tersendat / Terbata-bata', desc: 'Ragu-ragu saat membaca atau terhenti sesaat' },
  { label: 'Tertukar Ayat (Mutasyabihat)', desc: 'Masuk ke ayat atau surat lain yang mirip' },
  { label: 'Mengulang-ulang (Tardid)', desc: 'Mengulang kata lebih dari 2 kali' },
  { label: 'Salah Baris / Lompat Ayat', desc: 'Melewati satu baris atau ayat' },
  { label: 'Ragu-ragu / Kurang Yakin', desc: 'Sering berhenti mengecek ingatan' },
  { label: 'Tempo Terburu-buru', desc: 'Kecepatan membaca terlalu cepat dan tidak stabil' },
  { label: 'Waqaf Terputus / Nafas Habis', desc: 'Terhenti di tengah kalimat atau sambungan' }
];

// Tajwid categories ordered strictly from most frequent mistakes on the left:
// 1. Mad -> 2. Ghunnah & Tasydid -> 3. Nun Mati & Tanwin -> 4. Mim Mati -> 5. Qalqalah -> 6. Tebal & Tipis -> 7. Waqaf & Harakat
export const TAJWID_CATEGORIES = [
  {
    id: 'mad',
    title: 'Mad (Panjang-Pendek)',
    badge: 'Panjang-Pendek',
    options: [
      'Mad Thobi\'i Kurang Panjang (2 Harakat)',
      'Mad Thobi\'i Terlalu Panjang (>2 Harakat)',
      'Mad Wajib / Jaiz Kurang Panjang (4-5 Harakat)',
      'Mad Lazim Kurang Panjang (6 Harakat)',
      'Mad \'Aridh Lissukun Tidak Konsisten',
      'Mad Shilah / Badal Kurang Tepat'
    ]
  },
  {
    id: 'ghunnah_tasydid',
    title: 'Ghunnah & Tasydid',
    badge: 'Dengung & Tasydid',
    options: [
      'Ghunnah Musyaddadah (Nun/Mim Bertasydid Kurang 2 Harakat)',
      'Tempo Ghunnah Terburu-buru / Kurang Lama',
      'Tasydid Kurang Ditekan (Nabrah Lemah)',
      'Ghunnah Tertahan / Kurang Bersih',
      'Ghunnah Berlebihan di Luar Tempatnya'
    ]
  },
  {
    id: 'nun_tanwin',
    title: 'Nun Mati & Tanwin',
    badge: 'Idgham/Ikhfa/Idzhar',
    options: [
      'Idgham Bighunnah (Kurang Dengung / Terlalu Cepat)',
      'Ikhfa Haqiqi (Kurang Samar / Malah Jelas)',
      'Iqlab (Kurang Rapat Bibir / Dengung Kurang Pas)',
      'Idgham Bilaghunnah (Malah Berdengung)',
      'Idzhar Halqi (Malah Berdengung / Tertahan)'
    ]
  },
  {
    id: 'mim_mati',
    title: 'Mim Mati',
    badge: 'Syafawi',
    options: [
      'Ikhfa Syafawi (Mim Mati bertemu Ba - Kurang Dengung)',
      'Idgham Mimi / Mitslain (Mim bertemu Mim Kurang Dengung)',
      'Idzhar Syafawi (Mim Mati Malah Berdengung)',
      'Bibir Kurang Rapat saat Mim Sukun'
    ]
  },
  {
    id: 'qalqalah',
    title: 'Qalqalah (Pantulan)',
    badge: 'Pantulan Huruf',
    options: [
      'Qalqalah Sughra Kurang Memantul',
      'Qalqalah Kubra Kurang Memantul saat Waqaf',
      'Qalqalah Berlebihan / Kasar / Berharakat Hamzah',
      'Memantulkan Huruf Non-Qalqalah (Tawallud)'
    ]
  },
  {
    id: 'tafkhim',
    title: 'Tebal & Tipis (Tafkhim/Tarqiq)',
    badge: 'Isti\'la & Istifal',
    options: [
      'Huruf Isti\'la Kurang Tebal (Kha, Shad, Dhad, Ghain, Tha, Qaf, Zha)',
      'Huruf Istifal Malah Dibaca Tebal',
      'Ra Tebal Dibaca Tipis',
      'Ra Tipis Dibaca Tebal',
      'Lam Jalalah (Lafazh Allah) Kurang Tebal / Tipis'
    ]
  },
  {
    id: 'waqaf_harakat',
    title: 'Waqaf, Ibtida & Harakat',
    badge: 'Tanda Berhenti & Vokal',
    options: [
      'Waqaf di Tempat Kurang Tepat / Terputus Makna',
      'Salah Memulai Kembali Bacaan (Ibtida)',
      'Nafas Tidak Sampai / Terputus di Tengah Kata',
      'Harakat Tertukar (Fathah/Kasrah/Dhommah)',
      'Sukun Tertukar Tasydid'
    ]
  }
];

export const QUICK_NOTES = [
  'Perlu dilatih lagi',
  'Ulangi 3x',
  'Hati-hati sambungan ayat',
  'Perhatikan tanda waqaf',
  'Perhatikan dengung & mad',
  'Fokus makhraj huruf'
];

