/**
 * Helper utilities for encoding, decoding, and generating shareable student report links.
 */

export interface StudentReportJuzBreakdown {
  juzNumber: number;
  activeCount: number;
  masteredCount: number;
  dueCount: number;
  avgStability?: number;
}

export interface StudentReportChapterBreakdown {
  chapterId: string;
  title: string;
  activeCount: number;
  masteredCount: number;
  dueCount: number;
  avgStability?: number;
  progressPercent?: number;
}

export interface StudentReportPayload {
  reportId: string;
  studentName: string;
  studentId: string;
  className: string;
  classType: 'quran' | 'books';
  teacherName: string;
  institutionName?: string;
  date: string;
  // Core metrics
  totalActive: number;
  totalMastered: number;
  totalDueToday: number;
  retentionRate: number;
  totalReviews: number;
  avgStability: number;
  // Qualitative
  readinessTitle?: string;
  readinessDesc?: string;
  teacherNote?: string;
  // Quran breakdown
  juzBreakdown?: StudentReportJuzBreakdown[];
  // Book breakdown
  bookTitle?: string;
  chaptersBreakdown?: StudentReportChapterBreakdown[];
  // Achievement Card / Award
  awardTitle?: string;
  awardLevel?: 'Gold' | 'Emerald' | 'Ruby' | 'Diamond';
  awardDescription?: string;
}

/**
 * Encodes payload into URL-safe base64 string handling UTF-8 properly.
 */
export function encodeReportPayload(payload: StudentReportPayload): string {
  try {
    const json = JSON.stringify(payload);
    // UTF-8 safe base64
    const utf8Bytes = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    );
    return btoa(utf8Bytes);
  } catch (e) {
    console.error('Failed to encode report payload', e);
    return '';
  }
}

/**
 * Decodes URL parameter into StudentReportPayload.
 */
export function decodeReportPayload(encoded: string): StudentReportPayload | null {
  try {
    // URLSearchParams or WhatsApp link decoding might replace '+' with ' '
    const normalized = encoded.replace(/ /g, '+');
    const binary = atob(normalized);
    const json = decodeURIComponent(
      Array.prototype.map.call(binary, (ch: string) =>
        '%' + ('00' + ch.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
    return JSON.parse(json);
  } catch (e) {
    // Fallback for legacy format
    try {
      const normalized = encoded.replace(/ /g, '+');
      return JSON.parse(decodeURIComponent(atob(normalized)));
    } catch {
      console.error('Failed to decode report payload', e);
      return null;
    }
  }
}

/**
 * Generates the full shareable URL.
 */
export function buildReportUrl(payload: StudentReportPayload): string {
  const encoded = encodeReportPayload(payload);
  const base = window.location.origin + window.location.pathname;
  return `${base}?report=${encodeURIComponent(encoded)}`;
}

/**
 * Generates pre-formatted WhatsApp share message for parents.
 */
export function buildWhatsAppShareText(payload: StudentReportPayload, shareUrl: string): string {
  return `*Assalamu'alaikum Warahmatullahi Wabarakatuh*,

Yth. Bapak/Ibu Wali dari ananda *${payload.studentName}*,

Berikut kami sampaikan tautan (link) resmi *Rapor Perkembangan & Kartu Prestasi Hafalan* ananda pada kelas *${payload.className}*:

🔗 *Link Rapor Online:*
${shareUrl}

*Ringkasan Capaian:*
• Hafalan Aktif: *${payload.totalActive} ${payload.classType === 'quran' ? 'Halaman' : 'Materi'}*
• Hafalan Mutqin (Kuat): *${payload.totalMastered}* (${Math.round((payload.totalMastered / Math.max(1, payload.totalActive)) * 100)}%)
• Tingkat Retensi & Disiplin: *${payload.retentionRate}%*
• Predikat Penghargaan: *${payload.awardTitle || 'Hafidz Berprestasi'}*

Bapak/Ibu dapat langsung membuka tautan di atas melalui browser HP untuk:
1. 📄 *Unduh Rapor dalam format PDF*
2. 🖼️ *Unduh Kartu Prestasi Santri dalam format Gambar (PNG)*
3. 📝 Melihat rincian evaluasi dan pesan khusus dari Pengajar

Jazakumullah khairan katsiran atas doa dan bimbingan Bapak/Ibu di rumah.

Wassalamu'alaikum Warahmatullahi Wabarakatuh,
*Ust. ${payload.teacherName}*
_unlupa.id — Sistem Retensi & Murajaah Terjadwal_`;
}
