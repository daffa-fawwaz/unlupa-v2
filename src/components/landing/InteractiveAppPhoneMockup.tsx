import React, { useState } from 'react';
import { 
  BookOpen, 
  Layers, 
  Users, 
  Play, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  Share2, 
  Check, 
  ShieldCheck, 
  Clock, 
  RefreshCw,
  Send,
  Zap,
  RotateCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

type MockupTab = 'quran' | 'books' | 'class' | 'review';

export const InteractiveAppPhoneMockup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MockupTab>('quran');
  
  // State for Quran space demo
  const [isQuranPageActive, setIsQuranPageActive] = useState<boolean>(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  
  // State for Books space demo
  const [isBookActive, setIsBookActive] = useState<boolean>(true);
  const [isBookFlipped, setIsBookFlipped] = useState<boolean>(false);
  
  // State for Teaching space demo
  const [selectedGrade, setSelectedGrade] = useState<'A' | 'B' | 'C'>('A');
  const [showWhatsappModal, setShowWhatsappModal] = useState<boolean>(false);
  
  // State for Review Simulator
  const [reviewRating, setReviewRating] = useState<number>(4);
  const [reviewCount, setReviewCount] = useState<number>(14);
  const [retentionRate, setRetentionRate] = useState<number>(99.2);
  const [reviewMessage, setReviewMessage] = useState<string>(
    'Hafalan tertanam kokoh di memori jangka panjang. Algoritma otomatis menjadwalkan muraja\'ah tepat di ambang lupa 14 hari ke depan.'
  );

  const handleSimulateReview = (rating: number) => {
    setReviewRating(rating);
    if (rating === 4) {
      setRetentionRate(99.4);
      setReviewCount(14);
      setReviewMessage('Status MUTQIN! Interval melompat 14 hari. Anda menghemat waktu dan tidak perlu mengulang setiap hari.');
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe fallback if confetti blocked
      }
    } else if (rating === 3) {
      setRetentionRate(94.8);
      setReviewCount(4);
      setReviewMessage('Stabilitas Baik. Memori diprediksi aman hingga 4 hari ke depan sebelum batas peluruhan ingatan.');
    } else if (rating === 2) {
      setRetentionRate(81.2);
      setReviewCount(1);
      setReviewMessage('Tingkat Kesulitan Dinaikkan. Jadwal muraja\'ah otomatis dimajukan ke esok hari untuk penguatan.');
    } else {
      setRetentionRate(52.0);
      setReviewCount(0);
      setReviewMessage('Alarm Segera Aktif! Materi diselamatkan hari ini juga sebelum lenyap dari memori Anda.');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 sm:py-12">
      
      {/* Top Interactive Feature Switcher Bar */}
      <div className="flex flex-col items-center text-center space-y-3 mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full clay-inset text-xs font-bold text-[#FF6F3D]">
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Pengalaman Interaktif Langsung</span>
        </div>
        
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-[#1B254B] dark:text-white tracking-tight">
          Coba Aplikasi Unlupa Langsung di Sini
        </h3>
        
        <p className="text-xs sm:text-sm text-[#707E94] dark:text-slate-300 max-w-xl">
          Klik tab di bawah untuk melihat bagaimana item ditampilkan, diaktivasi, dan dikunci secara otomatis persis seperti di ponsel Anda.
        </p>

        {/* 4 Main Interactive Tabs */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 p-1.5 bg-white/70 dark:bg-slate-900/70 rounded-2xl sm:rounded-full clay-inset shadow-inner overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('quran')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'quran'
                ? 'clay-btn-primary text-white shadow-md'
                : 'text-[#707E94] dark:text-slate-300 hover:text-[#1B254B] dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Ruang Al-Qur'an</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('books')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'books'
                ? 'bg-[#4E89FF] text-white shadow-md'
                : 'text-[#707E94] dark:text-slate-300 hover:text-[#1B254B] dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Ruang Kitab & Matan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('class')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'class'
                ? 'bg-[#10B981] text-white shadow-md'
                : 'text-[#707E94] dark:text-slate-300 hover:text-[#1B254B] dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Ruang Kelas & Rapor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'review'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-[#707E94] dark:text-slate-300 hover:text-[#1B254B] dark:hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Simulasi Evaluasi</span>
          </button>
        </div>
      </div>

      {/* Main Showcase Layout: Phone Mockup Centered with Contextual Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Feature Column (Desktop) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-4 text-left">
          <div className="clay-card p-5 space-y-2 border-l-4 border-l-[#FF6F3D]">
            <span className="text-[10px] font-extrabold uppercase text-[#FF6F3D] tracking-wider">Fitur #1</span>
            <h4 className="font-bold text-sm text-[#1B254B] dark:text-white">Aktivasi Lembar 1-Klik</h4>
            <p className="text-xs text-[#707E94] dark:text-slate-400 leading-relaxed">
              Cukup nyalakan toggle pada halaman yang baru dihafal. Algoritma otomatis menghitung jadwal pengulangan optimal.
            </p>
          </div>

          <div className="clay-card p-5 space-y-2 border-l-4 border-l-[#4E89FF]">
            <span className="text-[10px] font-extrabold uppercase text-[#4E89FF] tracking-wider">Fitur #2</span>
            <h4 className="font-bold text-sm text-[#1B254B] dark:text-white">Uji Ingatan Aktif (Active Recall)</h4>
            <p className="text-xs text-[#707E94] dark:text-slate-400 leading-relaxed">
              Kartu kitab dan ayat dapat dibalik dalam mode tes mandiri sebelum Anda melihat teks aslinya.
            </p>
          </div>

          <div className="clay-card p-5 space-y-2 border-l-4 border-l-[#10B981]">
            <span className="text-[10px] font-extrabold uppercase text-[#10B981] tracking-wider">Fitur #3</span>
            <h4 className="font-bold text-sm text-[#1B254B] dark:text-white">Retensi Terjamin 95%+</h4>
            <p className="text-xs text-[#707E94] dark:text-slate-400 leading-relaxed">
              Hanya muraja'ah apa yang perlu hari ini. Menghilangkan rasa lelah akibat mengulang semua halaman secara buta.
            </p>
          </div>
        </div>

        {/* Center Smartphone Mockup Chassis */}
        <div className="lg:col-span-6 flex justify-center relative">
          
          {/* Radiant Ambient Glow Behind Phone */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[380px] h-[640px] rounded-[60px] blur-3xl opacity-40 transition-colors pointer-events-none -z-10 ${
            activeTab === 'quran' ? 'bg-[#FF6F3D]' :
            activeTab === 'books' ? 'bg-[#4E89FF]' :
            activeTab === 'class' ? 'bg-[#10B981]' : 'bg-amber-500'
          }`} />

          {/* Smartphone Physical Shell */}
          <motion.div 
            initial={{ y: 0 }}
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[320px] sm:w-[360px] bg-slate-900 dark:bg-black rounded-[48px] sm:rounded-[54px] p-3 sm:p-3.5 shadow-[0_25px_60px_-15px_rgba(27,37,75,0.4)] border-4 border-slate-700/60 dark:border-slate-800 relative select-none"
          >
            {/* Phone Bezel Buttons */}
            <div className="absolute -left-1.5 top-24 w-1 h-8 bg-slate-600 rounded-l-md" />
            <div className="absolute -left-1.5 top-36 w-1 h-12 bg-slate-600 rounded-l-md" />
            <div className="absolute -left-1.5 top-52 w-1 h-12 bg-slate-600 rounded-l-md" />
            <div className="absolute -right-1.5 top-32 w-1 h-14 bg-slate-600 rounded-r-md" />

            {/* Inner Screen Display */}
            <div className="w-full bg-[#EEF2F7] dark:bg-[#0B1120] text-[#1B254B] dark:text-[#F8FAFC] rounded-[40px] sm:rounded-[44px] overflow-hidden flex flex-col h-[580px] sm:h-[630px] border border-black/10 dark:border-white/10 shadow-inner relative">
              
              {/* Dynamic Island & Hardware Sensor Area */}
              <div className="pt-2 px-5 flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0 z-20">
                <span>09:41</span>
                
                {/* Dynamic Island Pill */}
                <div className="w-24 h-5 bg-black rounded-full flex items-center justify-end px-2.5 gap-1.5 shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span>5G</span>
                  <div className="w-4 h-2.5 border border-slate-700 dark:border-slate-300 rounded-[2px] p-[1px] flex items-center">
                    <div className="w-full h-full bg-slate-700 dark:bg-slate-300 rounded-[1px]" />
                  </div>
                </div>
              </div>

              {/* App Internal Header (Persis Aplikasi Unlupa) */}
              <div className="px-4 py-2 flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.04] bg-[#EEF2F7]/80 dark:bg-[#0B1120]/80 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl clay-icon-pod-orange text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-serif font-black text-sm text-[#1B254B] dark:text-white">
                      unlupa<span className="text-[#FF6F3D] font-sans">.id</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full clay-badge-orange text-white">
                    MUTQIN
                  </span>
                  <div className="w-7 h-7 rounded-full clay-pill flex items-center justify-center font-bold text-[11px] text-[#FF6F3D]">
                    H
                  </div>
                </div>
              </div>

              {/* Active Tab Sub-navigation inside Phone */}
              <div className="px-3 pt-2 pb-1.5 bg-[#E3E9F2]/70 dark:bg-slate-900/60 flex items-center justify-around gap-1 shrink-0 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('quran')}
                  className={`py-1 px-2 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    activeTab === 'quran' ? 'bg-white dark:bg-slate-800 text-[#FF6F3D] shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Al-Qur'an</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('books')}
                  className={`py-1 px-2 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    activeTab === 'books' ? 'bg-white dark:bg-slate-800 text-[#4E89FF] shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Kitab</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('class')}
                  className={`py-1 px-2 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    activeTab === 'class' ? 'bg-white dark:bg-slate-800 text-[#10B981] shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>Kelas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('review')}
                  className={`py-1 px-2 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    activeTab === 'review' ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>Review</span>
                </button>
              </div>

              {/* Scrollable Screen Content */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 relative">
                
                <AnimatePresence mode="wait">
                  
                  {/* ===================================================
                      1. RUANG AL-QUR'AN (PERSIS APLIKASI KITA)
                      =================================================== */}
                  {activeTab === 'quran' && (
                    <motion.div
                      key="quran"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      {/* Quran Room Title & Filter Bar */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-extrabold text-xs text-[#1B254B] dark:text-white">Ruang Al-Qur'an</h4>
                          <p className="text-[10px] text-slate-500">604 Halaman Mushaf Madinah</p>
                        </div>
                        <div className="px-2 py-0.5 rounded-full clay-badge-emerald text-white text-[9px] font-bold">
                          Juz 29
                        </div>
                      </div>

                      {/* Real Quran Page Card (Hal. 595 - Al-Mulk) */}
                      <div className="clay-card p-3.5 space-y-3 relative overflow-hidden border border-white/60 dark:border-white/10">
                        
                        {/* Page Top Header with Real Metadata */}
                        <div className="flex items-center justify-between pb-2 border-b border-black/[0.04] dark:border-white/[0.06]">
                          <div className="flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-lg clay-icon-pod-orange text-white font-mono font-bold text-[10px] flex items-center justify-center">
                              595
                            </span>
                            <div>
                              <div className="font-bold text-xs text-[#1B254B] dark:text-white">Surah Al-Mulk</div>
                              <span className="text-[9px] text-slate-400">Ayat 1 - 30 &bull; Makkiyyah</span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isQuranPageActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {isQuranPageActive ? '✓ Aktif Muraja\'ah' : 'Belum Dihafal'}
                          </span>
                        </div>

                        {/* Arabic Calligraphy & Ayah Box */}
                        <div className="bg-[#FAFBFD] dark:bg-slate-900/60 p-3 rounded-2xl border border-black/[0.02] dark:border-white/[0.04] text-center space-y-1.5">
                          <p className="text-[11px] font-arabic text-amber-700 dark:text-amber-400 font-bold">
                            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                          </p>
                          <p className="text-base sm:text-lg font-arabic text-[#1B254B] dark:text-white leading-relaxed dir-rtl py-1 font-semibold">
                            تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ ﴿١﴾
                          </p>
                          <p className="text-[9px] text-slate-500 italic line-clamp-2">
                            "Maha Suci Allah Yang di tangan-Nya-lah segala kerajaan, dan Dia Maha Kuasa atas segala sesuatu."
                          </p>
                        </div>

                        {/* Interactive Activation Toggle (Permintaan User: "Bagaimana item diaktivasi") */}
                        <div className="p-2.5 rounded-xl clay-inset flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-[#FF6F3D]" />
                            <div>
                              <span className="text-[10px] font-bold block text-[#1B254B] dark:text-white">
                                {isQuranPageActive ? 'Jadwal Otomatis: 14 Hari' : 'Halaman Tidak Aktif'}
                              </span>
                              <span className="text-[8px] text-slate-500">
                                {isQuranPageActive ? 'Kekuatan: 99.4% (Mapan/Mutqin)' : 'Klik toggle untuk aktivasi'}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsQuranPageActive(!isQuranPageActive)}
                            className={`w-10 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                              isQuranPageActive ? 'bg-[#10B981]' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          >
                            <motion.div 
                              animate={{ x: isQuranPageActive ? 18 : 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              className="w-4.5 h-4.5 rounded-full bg-white shadow-xs" 
                            />
                          </button>
                        </div>

                        {/* Audio Tasmi' Player Bar */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl clay-card-subtle text-[10px]">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                              className="w-6 h-6 rounded-lg clay-btn-primary text-white flex items-center justify-center cursor-pointer"
                            >
                              {isPlayingAudio ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                            </button>
                            <span className="font-bold text-[9px] text-[#1B254B] dark:text-white">
                              {isPlayingAudio ? 'Memutar Tasmi\' Misyari...' : 'Audio Murottal Syaikh'}
                            </span>
                          </div>

                          {/* Sound wave animation */}
                          {isPlayingAudio ? (
                            <div className="flex items-end gap-0.5 h-3.5">
                              <span className="w-1 bg-[#FF6F3D] h-3.5 rounded-full animate-bounce" />
                              <span className="w-1 bg-[#FF6F3D] h-2 rounded-full animate-bounce [animation-delay:0.15s]" />
                              <span className="w-1 bg-[#FF6F3D] h-3 rounded-full animate-bounce [animation-delay:0.3s]" />
                            </div>
                          ) : (
                            <span className="text-[9px] font-mono text-slate-400">02:45</span>
                          )}
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {/* ===================================================
                      2. RUANG KITAB & MATAN
                      =================================================== */}
                  {activeTab === 'books' && (
                    <motion.div
                      key="books"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-extrabold text-xs text-[#1B254B] dark:text-white">Ruang Kitab & Matan</h4>
                          <p className="text-[10px] text-slate-500">Pustaka Ilmu Syar'i Mandiri</p>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full clay-badge-pacific text-white">
                          Matan Nahwu
                        </span>
                      </div>

                      {/* Book Item Card */}
                      <div className="clay-card p-3.5 space-y-3 border border-white/60 dark:border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg clay-icon-pod-pacific text-white text-[10px] font-bold flex items-center justify-center">
                              01
                            </div>
                            <div>
                              <div className="font-bold text-xs text-[#1B254B] dark:text-white">Al-Jurumiyyah : Bab Kalam</div>
                              <span className="text-[9px] text-slate-400">Kaidah 1 dari 60 Kaidah</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsBookActive(!isBookActive)}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold cursor-pointer transition-all ${
                              isBookActive ? 'clay-badge-emerald text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isBookActive ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </div>

                        {/* Interactive Flip Flashcard for Testing Memory */}
                        <div 
                          onClick={() => setIsBookFlipped(!isBookFlipped)}
                          className="bg-gradient-to-br from-blue-50/60 to-indigo-50/60 dark:from-slate-900 dark:to-slate-800 p-3.5 rounded-2xl border border-blue-200/50 dark:border-blue-900/40 text-center space-y-2 cursor-pointer relative group hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center justify-between text-[8px] text-slate-400 font-bold uppercase">
                            <span>{isBookFlipped ? 'Kunci Jawaban Matan' : 'Tantangan Ingatan'}</span>
                            <span className="flex items-center gap-1 text-[#4E89FF]">
                              <RotateCw className="w-2.5 h-2.5" />
                              <span>Klik untuk Balik</span>
                            </span>
                          </div>

                          {!isBookFlipped ? (
                            <div className="py-2 space-y-1">
                              <p className="text-xs font-bold text-[#1B254B] dark:text-white">
                                "Sebutkan matan awal tentang definisi Al-Kalam menurut kaidah Nahwu!"
                              </p>
                              <span className="text-[9px] text-[#4E89FF] font-medium block">
                                Uji daya ingat Anda sebelum membalik kartu ini...
                              </span>
                            </div>
                          ) : (
                            <div className="py-1 space-y-1.5 animate-fadeIn">
                              <p className="text-sm font-arabic font-bold text-[#1B254B] dark:text-white leading-loose dir-rtl">
                                الْكَلَامُ هُوَ اللَّفْظُ الْمُرَكَّبُ الْمُفِيدُ بِالْوَضْعِ
                              </p>
                              <p className="text-[9px] text-slate-600 dark:text-slate-300 italic">
                                "Al-Kalam adalah lafazh yang tersusun yang memberi faedah menurut ketentuan bahasa Arab."
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Book Retention Stats */}
                        <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 pt-1">
                          <span>Target: Mutqin &gt; 336 Hari</span>
                          <span className="text-[#4E89FF]">Interval Aktif: 28 Hari</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ===================================================
                      3. RUANG KELAS & RAPOR WHATSAPP
                      =================================================== */}
                  {activeTab === 'class' && (
                    <motion.div
                      key="class"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-extrabold text-xs text-[#1B254B] dark:text-white">Ruang Guru & Kelas</h4>
                          <p className="text-[10px] text-slate-500">Halaqah Tahfizh Santri</p>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full clay-badge-emerald text-white">
                          12 Santri
                        </span>
                      </div>

                      {/* Santri Assessment Card */}
                      <div className="clay-card p-3.5 space-y-3 border border-white/60 dark:border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full clay-badge-emerald text-white font-bold text-xs flex items-center justify-center">
                              A
                            </div>
                            <div>
                              <div className="font-bold text-xs text-[#1B254B] dark:text-white">Abdullah Al-Manshur</div>
                              <span className="text-[9px] text-slate-400">Setoran: Hal 595 (Al-Mulk)</span>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            Nilai: {selectedGrade}
                          </span>
                        </div>

                        {/* Grading buttons */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Input Evaluasi Musyrif:</span>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedGrade('A')}
                              className={`py-1 rounded-lg text-[9px] font-bold cursor-pointer transition-all ${
                                selectedGrade === 'A' ? 'clay-badge-emerald text-white' : 'clay-inset text-slate-600'
                              }`}
                            >
                              Mumtaz (A)
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedGrade('B')}
                              className={`py-1 rounded-lg text-[9px] font-bold cursor-pointer transition-all ${
                                selectedGrade === 'B' ? 'bg-blue-500 text-white' : 'clay-inset text-slate-600'
                              }`}
                            >
                              Jayyid (B)
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedGrade('C')}
                              className={`py-1 rounded-lg text-[9px] font-bold cursor-pointer transition-all ${
                                selectedGrade === 'C' ? 'bg-amber-500 text-white' : 'clay-inset text-slate-600'
                              }`}
                            >
                              Dha'if (C)
                            </button>
                          </div>
                        </div>

                        {/* 1-Click WhatsApp Report Button */}
                        <button
                          type="button"
                          onClick={() => setShowWhatsappModal(!showWhatsappModal)}
                          className="w-full py-2 rounded-xl bg-[#25D366] text-white font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:bg-[#20BD5A] transition-all"
                        >
                          <Send className="w-3 h-3" />
                          <span>{showWhatsappModal ? 'Tutup Pratinjau' : 'Pratinjau Rapor WhatsApp'}</span>
                        </button>

                        {/* WhatsApp Message Preview Bubble */}
                        {showWhatsappModal && (
                          <div className="p-2.5 rounded-xl bg-[#DCF8C6] dark:bg-emerald-950 text-[#075E54] dark:text-emerald-200 text-[9px] space-y-1 border border-emerald-300/50 animate-fadeIn">
                            <p className="font-bold">📱 Format Pesan Siap Kirim:</p>
                            <p className="font-mono text-[8.5px] leading-relaxed">
                              "Assalamu'alaikum Wr. Wb. Wali Santri Abdullah, Alhamdulillah setoran Hal 595 Surah Al-Mulk predikat MUMTAZ (A). Jadwal muraja'ah otomatis dikunci hingga 14 hari ke depan."
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* ===================================================
                      4. SIMULASI EVALUASI 4 TINGKAT (THE SECRET ENGINE)
                      =================================================== */}
                  {activeTab === 'review' && (
                    <motion.div
                      key="review"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-extrabold text-xs text-[#1B254B] dark:text-white">Simulasi Evaluasi Cerdas</h4>
                          <p className="text-[10px] text-slate-500">Kalkulasi Otomatis Ambang Lupa</p>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                          Coba Klik Nilai
                        </span>
                      </div>

                      {/* Retention Gauge Box */}
                      <div className="clay-card p-3.5 space-y-2.5 border border-white/60 dark:border-white/10 text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          Prediksi Daya Tahan Ingatan:
                        </span>
                        
                        <div className="flex items-center justify-center gap-3">
                          <div className="text-2xl font-black font-mono text-[#FF6F3D]">
                            {retentionRate}%
                          </div>
                          <div className="text-left text-[9px] text-slate-500">
                            <span className="font-bold text-[#1B254B] dark:text-white block">
                              Jadwal Berikutnya:
                            </span>
                            <span>{reviewCount === 0 ? 'Hari Ini (<10 Menit)' : `${reviewCount} Hari ke Depan`}</span>
                          </div>
                        </div>

                        {/* Interactive Explanation */}
                        <p className="text-[9px] text-slate-600 dark:text-slate-300 p-2 rounded-xl clay-inset leading-relaxed">
                          {reviewMessage}
                        </p>

                        {/* The 4 Actual App Rating Buttons */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSimulateReview(1)}
                            className={`py-1.5 px-2 rounded-xl text-[9px] font-bold transition-all cursor-pointer ${
                              reviewRating === 1 ? 'bg-red-500 text-white shadow-xs' : 'clay-inset text-red-600'
                            }`}
                          >
                            1 &bull; Ulang Segera
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSimulateReview(2)}
                            className={`py-1.5 px-2 rounded-xl text-[9px] font-bold transition-all cursor-pointer ${
                              reviewRating === 2 ? 'bg-amber-500 text-white shadow-xs' : 'clay-inset text-amber-600'
                            }`}
                          >
                            2 &bull; Sulit (1 Hari)
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSimulateReview(3)}
                            className={`py-1.5 px-2 rounded-xl text-[9px] font-bold transition-all cursor-pointer ${
                              reviewRating === 3 ? 'bg-[#4E89FF] text-white shadow-xs' : 'clay-inset text-[#4E89FF]'
                            }`}
                          >
                            3 &bull; Baik (4 Hari)
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSimulateReview(4)}
                            className={`py-1.5 px-2 rounded-xl text-[9px] font-bold transition-all cursor-pointer ${
                              reviewRating === 4 ? 'bg-[#10B981] text-white shadow-xs' : 'clay-inset text-[#10B981]'
                            }`}
                          >
                            4 &bull; Mutqin (14 Hari)
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>

              </div>

              {/* Bottom Home Indicator Bar */}
              <div className="py-2 flex justify-center shrink-0">
                <div className="w-24 h-1 bg-slate-400 dark:bg-slate-600 rounded-full" />
              </div>

            </div>

          </motion.div>

        </div>

        {/* Right Feature Column (Desktop) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-4 text-left">
          <div className="clay-card p-5 space-y-2 border-r-4 border-r-[#FF6F3D]">
            <span className="text-[10px] font-extrabold uppercase text-[#FF6F3D] tracking-wider">Keunggulan #1</span>
            <h4 className="font-bold text-sm text-[#1B254B] dark:text-white">Bebas Kelelahan Mental</h4>
            <p className="text-xs text-[#707E94] dark:text-slate-400 leading-relaxed">
              Anda tidak perlu lagi pusing memikirkan "hari ini harus muraja'ah juz berapa". Buka aplikasi, antrean hari ini langsung siap.
            </p>
          </div>

          <div className="clay-card p-5 space-y-2 border-r-4 border-r-[#4E89FF]">
            <span className="text-[10px] font-extrabold uppercase text-[#4E89FF] tracking-wider">Keunggulan #2</span>
            <h4 className="font-bold text-sm text-[#1B254B] dark:text-white">Audio Qari & Tasmi' Suara</h4>
            <p className="text-xs text-[#707E94] dark:text-slate-400 leading-relaxed">
              Dengarkan lantunan ayat per lembar atau rekam suara tasmi' Anda sendiri langsung ke cloud untuk dinilai musyrif.
            </p>
          </div>

          <div className="clay-card p-5 space-y-2 border-r-4 border-r-[#10B981]">
            <span className="text-[10px] font-extrabold uppercase text-[#10B981] tracking-wider">Keunggulan #3</span>
            <h4 className="font-bold text-sm text-[#1B254B] dark:text-white">Ekosistem Pengajar & Santri</h4>
            <p className="text-xs text-[#707E94] dark:text-slate-400 leading-relaxed">
              Ustadz dan pengurus pondok dapat memantau puluhan santri sekaligus, mencatat kehadiran, dan membuat sertifikat resmi.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
