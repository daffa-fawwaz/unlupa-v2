// Subtle, soothing audio micro-interactions using Web Audio API
// No external assets required, purely synthesized soft acoustic feedback

class SoundEffects {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playRatingFeedback(rating: 1 | 2 | 3 | 4) {
    if (!this.isEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      gain.connect(ctx.destination);
      osc.connect(gain);

      // Warm, subtle harmonic frequencies for each rating level
      if (rating === 1) {
        // Subtle, neutral reset chord
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (rating === 2) {
        // Soft focus chime
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.12);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (rating === 3) {
        // Gentle positive step
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.14);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else {
        // Crisp rewarding harmonic chime (Easy / Mumtaz)
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.16);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      }
    } catch {
      // Audio playback silently ignored if context restricted
    }
  }

  public playReviewSuccess() {
    this.playRatingFeedback(3);
  }

  public playReviewAgain() {
    this.playRatingFeedback(1);
  }

  public playMasteredCelebration() {
    if (!this.isEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.05, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch {
      // Ignored
    }
  }

  public playSoftClick() {
    if (!this.isEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignored
    }
  }

  public playCardFlip(direction: "forward" | "backward" = "forward") {
    if (!this.isEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // 1. Aerodynamic Paper Flutter / Swish (Bandpassed noise burst)
      const bufferSize = Math.floor(ctx.sampleRate * 0.09); // ~90ms
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // High-density soft white noise
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      const startFreq = direction === "forward" ? 2400 : 1800;
      const endFreq = direction === "forward" ? 1200 : 2600;
      filter.frequency.setValueAtTime(startFreq, now);
      filter.frequency.exponentialRampToValueAtTime(endFreq, now + 0.075);
      filter.Q.setValueAtTime(2.2, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.06, now + 0.015);
      noiseGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.08);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.085);

      // 2. Tactile Cardstock Snap / Flick Transient (Authentic physical card release)
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = "triangle";

      const snapPitch = direction === "forward" ? 820 : 720;
      clickOsc.frequency.setValueAtTime(snapPitch, now + 0.012);
      clickOsc.frequency.exponentialRampToValueAtTime(240, now + 0.045);

      clickGain.gain.setValueAtTime(0.0001, now);
      clickGain.gain.setValueAtTime(0.045, now + 0.012);
      clickGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.05);

      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);

      clickOsc.start(now + 0.012);
      clickOsc.stop(now + 0.052);
    } catch {
      // Audio playback silently ignored if context restricted
    }
  }

  public playSuccessChime() {
    this.playMasteredCelebration();
  }

  public playStreakMilestone() {
    this.playMasteredCelebration();
  }

  /**
   * Tactile Gamified Audio Feedback for XP Gain
   * - Soft crystal double-ping for item reviews (+2, +3, +4, +5 XP)
   * - Sparkling triumphant arpeggio for session completion & milestones (+25, +50 XP)
   */
  public playXpGain(amount: number = 2) {
    if (!this.isEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (amount >= 20) {
        // Grand Triumph / Session Reward (Glittering ascending glockenspiel)
        // C5 (523Hz), E5 (659Hz), G5 (784Hz), B5 (988Hz), C6 (1046Hz)
        const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.055);
          gain.gain.setValueAtTime(0.045, now + idx * 0.055);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + idx * 0.055 + 0.28,
          );
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.055);
          osc.stop(now + idx * 0.055 + 0.3);
        });
      } else {
        // Quick sparkling crystal chime for item review (+2, +3, +4, +5 XP)
        // Two harmonic bell tones: F#5 (740Hz) -> B5 (988Hz)
        const notes = [739.99, 987.77];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.04, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(
            0.0008,
            now + idx * 0.05 + 0.18,
          );
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.2);
        });
      }
    } catch {
      // Audio playback silently ignored if context restricted
    }
  }
}

export const soundEffects = new SoundEffects();
