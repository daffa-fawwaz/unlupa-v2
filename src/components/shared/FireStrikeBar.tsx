import React, { useEffect, useRef } from 'react';

export interface FireStrikeBarProps {
  percentage?: number;      // 0 to 100 discipline rate
  streakCount?: number;     // Alternative if passed as streak count
  size?: 'normal' | 'large';
  className?: string;
  allowSimulation?: boolean;
}

// DENSE BLAZING FLAME PLASMA PARTICLE
class DenseFlameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  wobble: number;
  wobbleSpeed: number;

  constructor(width: number, height: number) {
    this.x = Math.random() * width;
    this.y = height + Math.random() * 4;
    this.vx = (Math.random() - 0.5) * 1.6;
    this.vy = -1.8 - Math.random() * 3.2; // Roaring upward draft
    this.life = 1.0;
    this.decay = 0.025 + Math.random() * 0.035;
    this.size = 14 + Math.random() * 24; // Dense overlapping flame tongues
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.09 + Math.random() * 0.09;
  }
}

export const FireStrikeBar: React.FC<FireStrikeBarProps> = ({
  percentage,
  streakCount,
  size = 'normal',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fireFillRef = useRef<HTMLDivElement | null>(null);

  // Determine effective percentage (0 - 100)
  const rate = typeof percentage === 'number'
    ? Math.max(0, Math.min(100, percentage))
    : typeof streakCount === 'number'
    ? (streakCount > 0 ? Math.min(100, streakCount * 14.28) : 0)
    : 0;

  // 3-COLOR DISCIPLINE TIERS
  // 1. 100%: BLAZING PURPLE
  // 2. 80-99%: CRIMSON RED
  // 3. < 80%: CHARCOAL BLACK
  const is100Percent = rate >= 100;
  const is80To99Percent = rate >= 80 && rate < 100;

  useEffect(() => {
    const canvas = canvasRef.current;
    const fireFill = fireFillRef.current;
    if (!canvas || !fireFill) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: DenseFlameParticle[] = [];

    const handleResize = () => {
      const rect = fireFill.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(fireFill);
    handleResize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;

      if (width === 0 || height === 0) {
        animId = requestAnimationFrame(draw);
        return;
      }

      // Spawn dense flame particles
      const densityPerFrame = Math.max(3, Math.floor(width / 15));
      for (let i = 0; i < densityPerFrame; i++) {
        particles.push(new DenseFlameParticle(width, height));
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 0.8;
        p.y += p.vy;
        p.vy *= 0.97;
        p.life -= p.decay;
        p.size *= 0.96;

        if (p.life <= 0 || p.size < 0.8) {
          particles.splice(i, 1);
          continue;
        }

        const t = 1 - p.life;
        let r: number, g: number, b: number, a: number;

        if (is100Percent) {
          // TIER 1 (100%): BLAZING PURPLE FLAME
          if (t < 0.2) {
            r = 255; g = 255; b = 255; a = p.life * 0.95; // White Core
          } else if (t < 0.5) {
            const k = (t - 0.2) / 0.3;
            r = 245 - 20 * k; g = 190 - 110 * k; b = 255; a = p.life * 0.85; // Fuchsia
          } else {
            const k = (t - 0.5) / 0.5;
            r = 190 - 95 * k; g = 80 - 65 * k; b = 255 - 40 * k; a = p.life * 0.75 * (1 - k); // Royal Purple
          }
        } else if (is80To99Percent) {
          // TIER 2 (80-99%): CRIMSON RED FLAME (WARNING / WARNING BEFORE CHARCOAL)
          if (t < 0.2) {
            r = 255; g = 255; b = 230; a = p.life * 0.95; // Warm White Core
          } else if (t < 0.5) {
            const k = (t - 0.2) / 0.3;
            r = 248 - 10 * k; g = 113 - 45 * k; b = 113 - 45 * k; a = p.life * 0.85; // Vibrant Red
          } else {
            const k = (t - 0.5) / 0.5;
            r = 239 - 85 * k; g = 68 - 40 * k; b = 68 - 40 * k; a = p.life * 0.75 * (1 - k); // Deep Crimson
          }
        } else {
          // TIER 3 (< 80%): BLAZING CHARCOAL BLACK FLAME
          if (t < 0.2) {
            r = 228; g = 228; b = 231; a = p.life * 0.9; // Light Gray Core
          } else if (t < 0.5) {
            const k = (t - 0.2) / 0.3;
            r = 113 - 30 * k; g = 113 - 30 * k; b = 122 - 30 * k; a = p.life * 0.8; // Zinc Gray
          } else {
            const k = (t - 0.5) / 0.5;
            r = 63 - 39 * k; g = 63 - 39 * k; b = 70 - 43 * k; a = p.life * 0.7 * (1 - k); // Carbon Black
          }
        }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`);
        grad.addColorStop(0.4, `rgba(${Math.round(r)}, ${Math.round(g * 0.8)}, ${Math.round(b)}, ${a * 0.8})`);
        grad.addColorStop(1, `rgba(${Math.round(r * 0.6)}, ${Math.round(g * 0.3)}, ${Math.round(b)}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [rate, is100Percent, is80To99Percent]);

  // Height preset classes
  const isLarge = size === 'large';
  const trackHeightClass = isLarge ? 'h-5 sm:h-6' : 'h-3.5 sm:h-4';

  const fillBackground = is100Percent
    ? 'linear-gradient(90deg, #e879f9 0%, #c084fc 35%, #a855f7 70%, #9333ea 100%)'
    : is80To99Percent
    ? 'linear-gradient(90deg, #f87171 0%, #ef4444 35%, #dc2626 70%, #991b1b 100%)'
    : 'linear-gradient(90deg, #52525b 0%, #3f3f46 50%, #27272a 100%)';

  const fillBoxShadow = is100Percent
    ? '0 0 20px rgba(168, 85, 247, 0.7), inset 0 1px 2px rgba(255, 255, 255, 0.6)'
    : is80To99Percent
    ? '0 0 18px rgba(239, 68, 68, 0.7), inset 0 1px 2px rgba(255, 255, 255, 0.6)'
    : '0 0 12px rgba(39, 39, 42, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.2)';

  return (
    <div className={`w-full ${className}`}>
      {/* SEAMLESS DISCIPLINE FIRE BAR TRACK */}
      <div
        className={`relative w-full ${trackHeightClass} rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 clay-inset overflow-hidden shadow-inner ring-1 ring-black/5 dark:ring-white/5 select-none transition-all duration-300`}
      >
        {/* ACTIVE PROGRESS FILL: PURPLE IF 100%, CRIMSON RED IF 80-99%, CHARCOAL BLACK IF < 80% */}
        <div
          ref={fireFillRef}
          className="relative h-full rounded-full overflow-hidden transition-all duration-700 ease-out"
          style={{
            width: `${Math.max(4, rate)}%`,
            background: fillBackground,
            boxShadow: fillBoxShadow,
          }}
        >
          {/* WAVE GLIMMER OVERLAY FOR ALL TIERS */}
          <div className="absolute inset-0 opacity-40 pointer-events-none mix-blend-overlay bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-300 to-transparent animate-pulse" />

          {/* DENSE REAL CANVAS FIRE */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-[2]"
          />
        </div>
      </div>
    </div>
  );
};

export default FireStrikeBar;
