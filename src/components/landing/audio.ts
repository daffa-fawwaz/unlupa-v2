/**
 * Procedural Audio Synthesizer for Unlupa.id
 * Produces soft ambient drone pad + pure crystalline glass chimes on interaction.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private padGain: GainNode | null = null;
  private isMuted: boolean = true;

  private init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    // Create ambient drone pad
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(110, this.ctx.currentTime); // A2 note
    osc2.frequency.setValueAtTime(164.81, this.ctx.currentTime); // E3 fifth

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    this.padGain = this.ctx.createGain();
    this.padGain.gain.setValueAtTime(0, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(this.padGain);
    this.padGain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
  }

  public toggleMute(): boolean {
    this.init();
    if (!this.ctx || !this.padGain) return true;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isMuted = !this.isMuted;
    const targetGain = this.isMuted ? 0 : 0.08;
    this.padGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.4);

    if (!this.isMuted) {
      this.playGlassChime();
    }

    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playGlassChime() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();

      chimeOsc.type = 'sine';
      // Harmonic crystalline frequency (E6 / 1318.5 Hz)
      chimeOsc.frequency.setValueAtTime(1318.5, now);
      chimeOsc.frequency.exponentialRampToValueAtTime(2637, now + 0.6);

      chimeGain.gain.setValueAtTime(0.06, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);

      chimeOsc.start(now);
      chimeOsc.stop(now + 1.2);
    } catch {
      // AudioContext policy catch
    }
  }
}

export const soundEngine = new SoundEngine();
