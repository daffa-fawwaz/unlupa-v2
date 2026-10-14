/**
 * High-grade Scramble Text Engine
 * Scrambles characters using mixed Latin & classical Arabic alphabets,
 * locking characters sequentially from left to right with smooth easing.
 */

export const ARABIC_GLYPHS = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'.split('');
export const LATIN_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_//-'.split('');
export const COMBINED_GLYPHS = [...LATIN_GLYPHS, ...ARABIC_GLYPHS];

export interface ScrambleOptions {
  duration?: number;       // In seconds (default: 0.9)
  onUpdate?: (currentText: string, progress: number) => void;
  onComplete?: () => void;
}

export class ScrambleText {
  private targetText: string;
  private currentText: string = '';
  private duration: number;
  private isRunning: boolean = false;
  private startTime: number = 0;
  private animFrameId: number | null = null;
  private onUpdate?: (currentText: string, progress: number) => void;
  private onComplete?: () => void;

  constructor(targetText: string, options: ScrambleOptions = {}) {
    this.targetText = targetText;
    this.duration = options.duration ?? 0.9;
    this.onUpdate = options.onUpdate;
    this.onComplete = options.onComplete;
  }

  public setTarget(text: string) {
    this.targetText = text;
  }

  public getText(): string {
    return this.currentText;
  }

  public start() {
    if (this.isRunning) this.stop();
    this.isRunning = true;
    this.startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - this.startTime) / 1000;
      const progress = Math.min(1.0, elapsed / this.duration);

      // Lock characters left-to-right
      let output = '';
      const len = this.targetText.length;

      for (let i = 0; i < len; i++) {
        const char = this.targetText[i];
        if (char === ' ') {
          output += ' ';
          continue;
        }

        // Each letter locks when progress reaches its segment
        const charThreshold = (i / len) * 0.75;
        if (progress >= charThreshold + (0.25 / len)) {
          output += char;
        } else {
          const randIdx = Math.floor(Math.random() * COMBINED_GLYPHS.length);
          output += COMBINED_GLYPHS[randIdx];
        }
      }

      this.currentText = output;
      if (this.onUpdate) {
        this.onUpdate(this.currentText, progress);
      }

      if (progress < 1.0) {
        this.animFrameId = requestAnimationFrame(loop);
      } else {
        this.currentText = this.targetText;
        if (this.onUpdate) {
          this.onUpdate(this.currentText, 1.0);
        }
        this.isRunning = false;
        if (this.onComplete) {
          this.onComplete();
        }
      }
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.isRunning = false;
  }
}
