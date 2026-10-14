import React from 'react';
import { 
  Award, 
  Brain, 
  CheckCircle2, 
  Flame, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Zap,
  Target,
  Clock,
  Compass
} from 'lucide-react';
import { FireStrikeBar } from '../shared/FireStrikeBar';

export interface ExecutiveAbstractCardProps {
  studentName: string;
  className?: string;
  classType?: 'quran' | 'books';
  totalActive: number;
  totalMastered: number;
  retentionRate: number; // 0 - 100%
  avgStability: number;  // in days
  totalReviews?: number;
  dueToday?: number;
  awardTitle?: string;
  awardLevel?: 'Gold' | 'Emerald' | 'Ruby' | 'Diamond';
  awardDescription?: string;
  readinessTitle?: string;
  readinessDesc?: string;
  teacherNote?: string;
  teacherName?: string;
  institutionName?: string;
  dateFormatted?: string;
  language?: string;
  streakCount?: number;
  interactiveFire?: boolean;
}

export const ExecutiveAbstractCard: React.FC<ExecutiveAbstractCardProps> = ({
  studentName,
  className = '',
  classType = 'quran',
  totalActive,
  totalMastered,
  retentionRate,
  avgStability,
  totalReviews = 0,
  dueToday = 0,
  awardTitle = 'Hafidz Mutqin Mumtaz',
  awardLevel = 'Diamond',
  awardDescription,
  readinessTitle = 'Rekomendasi Akselerasi Hafalan',
  readinessDesc,
  teacherNote,
  teacherName = 'Musyrif / Pengajar',
  institutionName = 'unlupa.id Learning Center',
  dateFormatted,
  language = 'id',
  streakCount = 7,
  interactiveFire = true,
}) => {
  const masteredPct = totalActive > 0 ? Math.round((totalMastered / totalActive) * 100) : 0;
  const unitLabel = classType === 'quran' ? 'Halaman' : 'Materi';

  // Dynamic Executive Abstract Narrative Generator
  const abstractText = React.useMemo(() => {
    let narrative = '';
    
    if (retentionRate >= 90) {
      narrative = `Berdasarkan evaluasi algoritma Spaced Repetition, ananda ${studentName} menunjukkan tingkat retensi memori yang sangat unggul sebesar ${retentionRate}% dengan rerata stabilitas memori ${avgStability} hari. Sebanyak ${totalMastered} dari ${totalActive} ${unitLabel.toLowerCase()} aktif (${masteredPct}%) telah mencapai kualifikasi Mutqin Mapan dengan interval ketahanan bebas lupa melebihi 30 hari. Kurva daya ingat terpantau stabil tanpa akumulasi beban jatuh tempo berlebih.`;
    } else if (retentionRate >= 75) {
      narrative = `Ananda ${studentName} mencatatkan konsistensi murajaah yang stabil sebesar ${retentionRate}% dengan indeks stabilitas memori rerata ${avgStability} hari. Sebanyak ${totalMastered} ${unitLabel.toLowerCase()} (${masteredPct}%) berada pada kategori Mapan. Ritme murajaah berjalan baik dan direkomendasikan untuk memperkuat pengulangan berkala pada materi yang belum mencapai interval panjang.`;
    } else {
      narrative = `Evaluasi memori ananda ${studentName} menunjukkan kedisiplinan murajaah sebesar ${retentionRate}% dengan rerata interval ${avgStability} hari. Diperlukan konsolidasi dan penataan ulang jadwal murajaah harian untuk menaikkan ${totalMastered} ${unitLabel.toLowerCase()} mapan (${masteredPct}%) agar ketahanan hafalan jangka panjang semakin mantap.`;
    }

    return narrative;
  }, [studentName, retentionRate, avgStability, totalMastered, totalActive, masteredPct, unitLabel]);

  const levelColorMap = {
    Diamond: {
      badgeBg: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600',
      badgeText: 'text-white',
      glowColor: 'shadow-cyan-500/20',
      borderColor: 'border-cyan-400/40',
      accentText: 'text-cyan-400',
    },
    Emerald: {
      badgeBg: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600',
      badgeText: 'text-white',
      glowColor: 'shadow-emerald-500/20',
      borderColor: 'border-emerald-400/40',
      accentText: 'text-emerald-400',
    },
    Gold: {
      badgeBg: 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500',
      badgeText: 'text-slate-950 font-black',
      glowColor: 'shadow-amber-500/20',
      borderColor: 'border-amber-400/40',
      accentText: 'text-amber-400',
    },
    Ruby: {
      badgeBg: 'bg-gradient-to-r from-rose-500 via-pink-500 to-red-600',
      badgeText: 'text-white',
      glowColor: 'shadow-rose-500/20',
      borderColor: 'border-rose-400/40',
      accentText: 'text-rose-400',
    },
  };

  const currentLevelStyle = levelColorMap[awardLevel] || levelColorMap.Gold;

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#2E1065] text-white p-5 sm:p-7 shadow-xl border border-indigo-500/30 ${className}`}
    >
      {/* Ambient Radial Background Glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* HEADER BAR: Official Badge + Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 via-purple-500 to-indigo-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300/90 block">
                ✦ ABSTRAK EKSEKUTIF PERFORMA RETENSI
              </span>
              <h3 className="text-base sm:text-lg font-black font-serif tracking-tight text-white flex items-center gap-2">
                <span>{studentName}</span>
                <span className="text-xs font-sans font-medium text-slate-300">
                  ({dateFormatted || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})
                </span>
              </h3>
            </div>
          </div>

          {/* Level Award Badge */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider ${currentLevelStyle.badgeBg} ${currentLevelStyle.badgeText} shadow-lg ${currentLevelStyle.glowColor}`}
            >
              {awardLevel} • {awardTitle}
            </span>
          </div>
        </div>

        {/* CORE NARRATIVE EXECUTIVE ABSTRACT BOX */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <Brain className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Ringkasan Eksekutif Retensi Memori</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              ID: {institutionName}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
            {abstractText}
          </p>

          {awardDescription && (
            <div className="pt-2 border-t border-white/10 flex items-start gap-2 text-xs text-amber-200/90 italic">
              <Award className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>"{awardDescription}"</span>
            </div>
          )}
        </div>

        {/* 3-COLUMN QUANTITATIVE METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Box 1: Stabilitas Memori */}
          <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Stabilitas Memori
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-mono">{avgStability}</span>
              <span className="text-xs text-slate-300">Hari (Interval)</span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (avgStability / 40) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-emerald-300 font-medium">
              {totalMastered} {unitLabel} Status Mutqin
            </span>
          </div>

          {/* Box 2: Kedisiplinan & Retensi */}
          <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Kedisiplinan Murajaah
              </span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-mono">{retentionRate}%</span>
              <span className="text-xs text-slate-300">Tepat Waktu</span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-purple-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${retentionRate}%` }}
              />
            </div>
            <span className="text-[10px] text-purple-300 font-medium">
              Akumulasi {totalReviews} Kali Setoran
            </span>
          </div>

          {/* Box 3: Kesiapan Tambah Materi */}
          <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Status Kesiapan
              </span>
              <Compass className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-amber-300 block truncate">
                {readinessTitle}
              </span>
              <span className="text-[11px] text-slate-300 block line-clamp-2 leading-tight mt-0.5">
                {readinessDesc || 'Sangat siap untuk akselerasi penambahan materi baru.'}
              </span>
            </div>
            <div className="pt-1 flex items-center gap-1 text-[10px] text-amber-300/90 font-bold">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Rekomendasi Terjadwal AI</span>
            </div>
          </div>
        </div>

        {/* PURPLE FIRE STRIKE BAR INTEGRATION */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5 text-amber-300">
              <Flame className="w-4 h-4 text-purple-400 fill-purple-400" />
              <span>Konsistensi Istiqomah (Fire Strike)</span>
            </span>
            <span className="font-mono text-purple-300 text-xs">
              {dueToday === 0 ? 'Semua Tuntas Hari Ini' : `${dueToday} ${unitLabel} Perlu Disetor`}
            </span>
          </div>
          <FireStrikeBar
            streakCount={streakCount}
            size="normal"
            allowSimulation={interactiveFire}
          />
        </div>

        {/* TEACHER NOTE BOX */}
        {teacherNote && (
          <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 block">
              ✦ CATATAN KHUSUS USTADZ / PENGAJAR
            </span>
            <p className="text-xs sm:text-sm font-serif italic text-slate-200 leading-relaxed">
              "{teacherNote}"
            </p>
            <span className="text-[10px] font-bold text-slate-400 block text-right">
              — Ust. {teacherName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutiveAbstractCard;
