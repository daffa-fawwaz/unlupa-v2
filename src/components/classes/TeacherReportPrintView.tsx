import React from 'react';
import { ClassGroup, ClassStudent, UserProfile } from '../../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface TeacherReportPrintViewProps {
  classGroup: ClassGroup;
  student: ClassStudent;
  teacher: UserProfile;
}

export const TeacherReportPrintView: React.FC<TeacherReportPrintViewProps> = ({ classGroup, student, teacher }) => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const chartData = [
    { name: 'Mapan & Mutqin', count: 18, color: '#047857' },
    { name: 'Kokoh & Bertumbuh', count: 12, color: '#1d4ed8' },
    { name: 'Konsolidasi', count: 8, color: '#b45309' },
    { name: 'Kritis / Awal', count: 4, color: '#be123c' },
  ];

  const cleanTeacher = (name?: string) => {
    if (!name) return 'Ustadz Pengampu';
    const trimmed = name.trim();
    const deduped = trimmed.replace(/^(ustad?z?\.?|kyai\.?|guru\.?|syaikh\.?)\s+(ustad?z?\.?|kyai\.?|guru\.?|syaikh\.?)\s+/i, '$1 ');
    if (/^(ustad?z?\.?|kyai\.?|guru\.?|syaikh\.?)\s+/i.test(deduped)) return deduped;
    return `Ust. ${deduped}`;
  };

  return (
    <div className="hidden print:block fixed inset-0 bg-white z-[9999] font-serif text-black p-0 m-0 overflow-y-auto">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
            min-height: 297mm;
            max-height: 297mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
            padding: 15mm 20mm;
          }
          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}} />

      {/* Page 1 */}
      <div className="page-break p-10 max-w-4xl mx-auto bg-white">
        <div>
          {/* Header Section */}
          <div className="flex items-center justify-between border-b-2 border-black pb-6 mb-8">
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-1 uppercase text-black">Laporan Evaluasi & Rapor Santri</h1>
              <h2 className="text-lg font-bold text-slate-800">unlupa.id — Sistem Manajemen Halaqah & Hafalan</h2>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-700 mb-1">Tanggal Cetak</div>
              <div className="text-base font-black text-black">{currentDate}</div>
            </div>
          </div>

          {/* Student & Class Info Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8 avoid-break">
            <div className="bg-white p-5 rounded-lg border-2 border-slate-800">
              <div className="text-xs font-black uppercase tracking-widest text-slate-700 mb-2">Informasi Santri</div>
              <div className="text-2xl font-black mb-1 text-black">{student.name}</div>
              <div className="text-sm font-mono font-bold text-slate-800">ID: {student.quranSpaceCode || student.id}</div>
            </div>
            <div className="bg-white p-5 rounded-lg border-2 border-slate-800">
              <div className="text-xs font-black uppercase tracking-widest text-slate-700 mb-2">Informasi Kelas</div>
              <div className="text-2xl font-black mb-1 text-black">{classGroup.name}</div>
              <div className="text-sm font-bold text-slate-800">Pengampu: {cleanTeacher(teacher.fullName)}</div>
            </div>
          </div>

          {/* Evaluation Summary Section */}
          <div className="mb-8 avoid-break">
            <h3 className="text-base font-black border-b-2 border-black pb-2 mb-4 uppercase tracking-wider text-black">Ringkasan Capaian Retensi & Kedisiplinan</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="border-2 border-slate-800 p-4 rounded-lg text-center bg-white">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">Retensi</div>
                <div className="text-xl font-black text-emerald-800">{student.retentionRate || 95}%</div>
              </div>
              <div className="border-2 border-slate-800 p-4 rounded-lg text-center bg-white">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">Ketahanan</div>
                <div className="text-xl font-black text-blue-800">{student.averageStability || 45} Hari</div>
              </div>
              <div className="border-2 border-slate-800 p-4 rounded-lg text-center bg-white">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">Materi Aktif</div>
                <div className="text-xl font-black text-indigo-800">{student.activeItemsCount || 30} Item</div>
              </div>
              <div className="border-2 border-slate-800 p-4 rounded-lg text-center bg-white">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">Status</div>
                <div className="text-xl font-black text-black">Mumtaz</div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="mb-6 p-5 rounded-xl border-2 border-slate-800 bg-white avoid-break">
            <h3 className="text-sm font-black text-black mb-3 uppercase tracking-wider text-center">Distribusi Stabilitas Memori (Piramida Level)</h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#000', fontWeight: 'bold' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#000', fontWeight: 'bold' }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="text-center text-xs font-bold text-black border-t-2 border-slate-300 pt-3">
          Halaman 1 dari 2 — unlupa.id Learning Center Report
        </div>
      </div>

      {/* Page 2 */}
      <div className="page-break p-10 max-w-4xl mx-auto bg-white pt-10">
        <div>
          <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-8">
            <div className="text-xs font-black uppercase tracking-widest text-black">
              Laporan Evaluasi & Catatan Pengajar
            </div>
            <div className="text-sm font-black text-black">{student.name} ({classGroup.name})</div>
          </div>

          {/* Detailed Notes Section */}
          <div className="mb-8 avoid-break">
            <h3 className="text-base font-black border-b-2 border-black pb-2 mb-4 uppercase tracking-wider text-black">Catatan Evaluasi Pengajar</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-black pl-4 py-2 bg-slate-50 rounded-r-lg">
                <p className="text-sm font-bold leading-relaxed mb-2 text-black">
                  "Ananda menunjukkan perkembangan kedisiplinan dan ketahanan memori yang sangat baik. Seluruh materi hafalan terjaga dengan interval yang stabil dan konsisten."
                </p>
                <div className="text-xs font-black text-slate-700">— Evaluasi Pekanan Pengajar</div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="p-5 rounded-xl border-2 border-slate-800 bg-white mb-8 avoid-break">
            <h4 className="font-black text-black mb-2 uppercase text-sm">Rekomendasi Pembelajaran Selanjutnya:</h4>
            <p className="text-sm font-bold text-black leading-relaxed">
              Pertahankan ritme murajaah harian. Santri sangat siap untuk melanjutkan penambahan materi baru (Ziyadah) dengan tetap menjaga kualitas hafalan mutqin.
            </p>
          </div>
        </div>

        {/* Signatures */}
        <div className="avoid-break">
          <div className="flex justify-between items-end pt-8 border-t-2 border-black">
            <div className="text-center w-52">
              <div className="h-24 border-b-2 border-black mb-2"></div>
              <div className="text-xs font-black uppercase text-black">Tanda Tangan Wali Santri</div>
            </div>
            <div className="text-center w-52">
              <div className="h-24 border-b-2 border-black mb-2"></div>
              <div className="text-xs font-black uppercase text-black">Ust. {teacher.fullName}</div>
              <div className="text-[11px] font-bold text-slate-700 mt-1">Pengampu Kelas</div>
            </div>
          </div>
          <div className="text-center text-xs font-bold text-black border-t-2 border-slate-300 pt-3 mt-6">
            Halaman 2 dari 2 — unlupa.id Learning Center Report
          </div>
        </div>
      </div>
    </div>
  );
};
