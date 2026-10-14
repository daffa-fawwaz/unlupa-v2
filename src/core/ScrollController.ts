/**
 * Unlupa.id - Precision Scroll Controller
 * Bridges Lenis smooth virtual scroll with GSAP ticker.
 * Calculates global progress (0–1), smoothed velocity, and scroll direction.
 * Respects 'prefers-reduced-motion' and provides lock/unlock capabilities during intro.
 */

import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export type ProgressCallback = (progress: number, velocity: number, direction: number) => void;

export class ScrollController {
  public lenis: Lenis | null = null;
  public globalProgress: number = 0;
  public velocity: number = 0;
  public direction: number = 1;
  public isLocked: boolean = false;
  public isReducedMotion: boolean = false;

  private progressCallbacks: ProgressCallback[] = [];
  private scrollContainer: HTMLElement | null = null;
  private tickerFunction: (time: number) => void;

  constructor(scrollContainer: HTMLElement) {
    this.scrollContainer = scrollContainer;

    // Check system prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.isReducedMotion = mediaQuery.matches;

    // Initialize Lenis smooth scroll
    this.lenis = new Lenis({
      duration: this.isReducedMotion ? 0.0 : 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: !this.isReducedMotion,
      touchMultiplier: 1.5,
    });

    // Sync Lenis with GSAP Ticker
    this.tickerFunction = (time: number) => {
      if (this.lenis && !this.isLocked) {
        this.lenis.raf(time * 1000);
      }
    };
    gsap.ticker.add(this.tickerFunction);

    // Bind scroll updates
    this.lenis.on('scroll', (e: any) => {
      if (this.isLocked) return;

      const maxScroll = (this.scrollContainer?.offsetHeight || window.innerHeight * 6) - window.innerHeight;
      const currentScroll = Math.max(0, e.scroll || 0);

      this.globalProgress = maxScroll > 0 ? Math.min(1.0, currentScroll / maxScroll) : 0;
      this.velocity = e.velocity || 0;
      this.direction = e.direction || 1;

      // Notify all registered progress listeners
      this.progressCallbacks.forEach((cb) => {
        cb(this.globalProgress, this.velocity, this.direction);
      });
    });
  }

  public onProgress(cb: ProgressCallback) {
    this.progressCallbacks.push(cb);
  }

  public lock() {
    this.isLocked = true;
    if (this.lenis) {
      this.lenis.stop();
    }
    document.body.style.overflow = 'hidden';
  }

  public unlock() {
    this.isLocked = false;
    if (this.lenis) {
      this.lenis.start();
    }
    document.body.style.overflow = '';
  }

  public scrollTo(progress: number, duration: number = 1.2) {
    if (!this.lenis || !this.scrollContainer) return;
    const maxScroll = this.scrollContainer.offsetHeight - window.innerHeight;
    const targetScroll = progress * maxScroll;
    this.lenis.scrollTo(targetScroll, {
      duration: this.isReducedMotion ? 0.1 : duration,
    });
  }

  public dispose() {
    gsap.ticker.remove(this.tickerFunction);
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
    this.progressCallbacks = [];
    document.body.style.overflow = '';
  }
}
