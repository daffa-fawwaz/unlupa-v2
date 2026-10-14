/**
 * Unlupa.id - Design Tokens and System Configuration
 * Single Source of Truth for Visual and Runtime Parameters
 */

export const APP_URL = "https://unlupa.id/app";

export const TOKENS = {
  colors: {
    bg0: '#05070f',       // Deepest abyss
    bg1: '#0b1020',       // Cold night sky
    ice1: '#b6bac5',      // Pale frost gray
    ice2: '#383e4e',      // Slate cold blue
    iceGlow: '#9fc4ff',   // Crystalline luminescence
    white: '#e8ecf5',     // High-contrast clean white
    gold: '#d4b06a',      // Sacred retention gold
  },
  typography: {
    fontLatin: "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    fontArabic: "'Amiri', serif",
  },
  easing: {
    intro: 'expo.out',
    camera: 'power3.inOut',
  },
  // 6 Continuous Scenes mapped to 600vh total virtual scroll
  scenes: {
    scene1: { id: 'scene-01-hero', range: [0.0, 1 / 6] as [number, number], name: '01 // HERO' },
    scene2: { id: 'scene-02-masalah', range: [1 / 6, 2 / 6] as [number, number], name: '02 // MASALAH' },
    scene3: { id: 'scene-03-solusi', range: [2 / 6, 3 / 6] as [number, number], name: '03 // SOLUSI' },
    scene4: { id: 'scene-04-ruang', range: [3 / 6, 4 / 6] as [number, number], name: '04 // TIGA RUANG' },
    scene5: { id: 'scene-05-ring', range: [4 / 6, 5 / 6] as [number, number], name: '05 // RETRIEVABILITY RING' },
    scene6: { id: 'scene-06-penutup', range: [5 / 6, 1.0] as [number, number], name: '06 // PENUTUP' },
  }
} as const;

export type QualityTier = 'HIGH' | 'MEDIUM' | 'LOW';

export interface QualityConfig {
  tier: QualityTier;
  maxDPR: number;
  bloom: boolean;
  bloomResolutionScale: number;
  transmission: boolean;
  dustCount: number;
  instancedShardCount: number;
}

export const QUALITY_TIERS: Record<QualityTier, QualityConfig> = {
  HIGH: {
    tier: 'HIGH',
    maxDPR: 2.0,
    bloom: true,
    bloomResolutionScale: 1.0,
    transmission: true,
    dustCount: 700,
    instancedShardCount: 80,
  },
  MEDIUM: {
    tier: 'MEDIUM',
    maxDPR: 1.5,
    bloom: true,
    bloomResolutionScale: 0.75,
    transmission: true,
    dustCount: 450,
    instancedShardCount: 50,
  },
  LOW: {
    tier: 'LOW',
    maxDPR: 1.0,
    bloom: false,
    bloomResolutionScale: 0.5,
    transmission: false,
    dustCount: 200,
    instancedShardCount: 25,
  }
};

export const PREFERS_REDUCED_MOTION =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
