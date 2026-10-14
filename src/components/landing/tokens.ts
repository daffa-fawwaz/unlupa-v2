/**
 * Design Tokens for Unlupa.id - Warm Earth Tone & Soft Ivory Cream Identity
 * Inspired by soothing classical Islamic manuscript tones & educational clarity.
 * 
 * Rules:
 * 1. Background: Warm Cream / Soft Ivory (#FFF9F2, #FAF3E8) - never glaring white or pure black.
 * 2. Primary Text: Deep Espresso / Dark Sepia Brown (#3C2415) - natural reading contrast.
 * 3. Primary Accent: Soft Terracotta / Muted Tangerine (#EE7D32 / #E58344).
 * 4. Category Accent Chips (Pastel Muted Tones):
 *    - Powder Soft Blue (#D7EAF3, text: #1E506B)
 *    - Muted Sage Green (#D3EAE0, text: #1E5B42)
 *    - Soft Muted Lilac (#EDE2F3, text: #592C70)
 *    - Dusty Rose / Muted Terracotta (#F7DBD7, text: #823026)
 *    - Warm Peach / Apricot (#FDE0CB, text: #854013)
 */

export const TOKENS = {
  colors: {
    // Canvas & Surfaces
    bg: '#FFF9F2',               // Warm Cream / Soft Ivory Canvas
    bgAlt: '#FAF3E8',            // Section Alternating Cream
    bgCard: '#FFFFFF',           // Crisp Warm Card
    bgCardWarm: '#FFFBF6',       // Gentle Surface
    borderLight: '#F0E2D2',      // Soft Warm Border
    borderAccent: '#E8D0BA',     // Subtle Frame Border

    // Primary Brand Accent
    accentPrimary: '#EE7D32',    // Soft Terracotta
    accentPrimaryHover: '#D96C24',
    accentLight: '#FDF1E7',      // Soft Peach Tint
    accentBorder: '#F5CCA8',

    // Text & Reading Hierarchy
    textPrimary: '#3C2415',      // Deep Espresso Brown
    textSecondary: '#6E5849',    // Warm Sepia
    textMuted: '#9E8878',        // Muted Warm Charcoal
    textLight: '#FAF3E8',        // On Terracotta

    // Category Pastel Chips (Directly from Ruquba Poster)
    categories: {
      blue: {
        bg: '#D7EAF3',
        border: '#BFE0ED',
        text: '#1E506B',
        label: "Al-Qur'an 604 Halaman"
      },
      green: {
        bg: '#D3EAE0',
        border: '#BAE2D1',
        text: '#1E5B42',
        label: 'Matn & Kitab Klasik'
      },
      peach: {
        bg: '#FDE0CB',
        border: '#F8CCA9',
        text: '#854013',
        label: 'Halaqah & Kelas Santri'
      },
      lilac: {
        bg: '#EDE2F3',
        border: '#DEC6EA',
        text: '#592C70',
        label: 'Perekam Suara & Tasmi'
      },
      rose: {
        bg: '#F7DBD7',
        border: '#F0C2BC',
        text: '#823026',
        label: 'Laporan Otomatis WhatsApp'
      }
    }
  },
  typography: {
    heroTitle: 'font-serif font-black tracking-tight',
    arabic: "font-serif text-[#EE7D32]",
    body: 'text-base font-normal leading-relaxed text-[#6E5849]',
  }
} as const;
