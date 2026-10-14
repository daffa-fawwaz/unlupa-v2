import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface PurpleStrikeFireBadgeProps {
  streakCount?: number;
  size?: 'sm' | 'md' | 'lg';
  allowClick?: boolean;
  onStrikeChange?: (newStreak: number) => void;
  className?: string;
  showControls?: boolean;
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  wobble: number;
  wobbleSpeed: number;

  constructor(x: number, y: number, isBurst = false, intensity = 1) {
    this.x = x;
    this.y = y;
    if (isBurst) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * (3 + intensity);
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 1;
      this.life = 1;
      this.decay = 0.02 + Math.random() * 0.02;
      this.size = 10 + Math.random() * 25;
    } else {
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = -1.5 - Math.random() * 2;
      this.life = 1;
      this.decay = 0.015 + Math.random() * 0.02;
      this.size = 15 + Math.random() * 25;
    }
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.05 + Math.random() * (isBurst ? 0.1 : 0.05);
  }
}

export const PurpleStrikeFireBadge: React.FC<PurpleStrikeFireBadgeProps> = ({
  streakCount: initialStreak = 1,
  size = 'md',
  allowClick = true,
  onStrikeChange,
  className = '',
  showControls = true,
}) => {
  const [currentStreak, setCurrentStreak] = useState<number>(initialStreak);
  const [animating, setAnimating] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    setCurrentStreak(initialStreak);
  }, [initialStreak]);

  // Burst explosion trigger
  const triggerBurst = useCallback((cx: number, cy: number, intensity: number) => {
    const count = 40 + intensity * 15;
    for (let i = 0; i < count; i++) {
      particlesRef.current.push(new Particle(cx, cy, true, intensity));
    }
  }, []);

  const handleStrike = useCallback(
    (newNum: number) => {
      setAnimating(true);
      setCurrentStreak(newNum);
      if (onStrikeChange) onStrikeChange(newNum);

      const canvas = canvasRef.current;
      if (canvas) {
        triggerBurst(canvas.width / 2, canvas.height / 2, Math.min(newNum, 5));
      }

      setTimeout(() => setAnimating(false), 400);
    },
    [onStrikeChange, triggerBurst]
  );

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles = particlesRef.current;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
    };

    const resizeObserver = new ResizeObserver(() => resize());
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    resize();

    const spawnParticle = () => {
      if (particles.length >= 150) return;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const baseY = H * 0.65;

      particles.push(
        new Particle(
          cx + (Math.random() - 0.5) * W * 0.4,
          baseY + (Math.random() - 0.5) * 20,
          false
        )
      );
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';

      if (currentStreak > 0) {
        for (let i = 0; i < 4; i++) {
          spawnParticle();
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 0.5;
        p.y += p.vy;
        p.vy *= 0.98;
        p.life -= p.decay;
        p.size *= 0.97;

        if (p.life <= 0 || p.size < 1) {
          particles.splice(i, 1);
          continue;
        }

        const t = 1 - p.life;
        let r: number, g: number, b: number, a: number;

        if (t < 0.3) {
          r = 255;
          g = 200 - 100 * (t / 0.3);
          b = 255;
          a = p.life * 0.8;
        } else {
          const k = (t - 0.3) / 0.7;
          r = 180 - 80 * k;
          g = 100 - 80 * k;
          b = 255;
          a = p.life * 0.6 * (1 - k);
        }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`);
        grad.addColorStop(1, `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameIdRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [currentStreak]);

  const sizeDimensions = {
    sm: 'w-[180px] h-[180px]',
    md: 'w-[260px] h-[260px]',
    lg: 'w-[320px] h-[320px]',
  };

  const numberFontSizes = {
    sm: 'text-[90px]',
    md: 'text-[140px]',
    lg: 'text-[170px]',
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* STAGE CONTAINER */}
      <div
        onClick={() => {
          if (allowClick) {
            handleStrike(currentStreak + 1);
          }
        }}
        className={`stage relative ${sizeDimensions[size]} flex items-center justify-center ${
          allowClick ? 'cursor-pointer hover:scale-[1.02] active:scale-95' : ''
        } transition-all duration-300 drop-shadow-[0_10px_15px_rgba(160,32,240,0.25)]`}
      >
        {/* FIRE CANVAS */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
        />

        {/* GLOWING NUMBER WRAP */}
        <div className="number-wrap relative z-[2] flex items-center justify-center select-none">
          <span
            className={`number ${numberFontSizes[size]} font-black leading-none text-white tracking-tight`}
            style={{
              color: '#ffffff',
              textShadow:
                currentStreak > 0
                  ? '0 0 10px #ffffff, 0 0 20px #d18aff, 0 0 40px #a020f0, 0 0 80px #6a0dad'
                  : '0 0 4px rgba(0,0,0,0.2)',
              opacity: currentStreak === 0 ? 0.3 : 1,
              transform: animating ? 'scale(1.35)' : 'scale(1)',
              transition: 'transform 0.4s cubic-bezier(0.2, 1.6, 0.4, 1), opacity 0.4s',
              animation:
                currentStreak > 0
                  ? 'purpleFlame 0.4s ease-in-out infinite alternate, purpleFlicker 2s ease-in-out infinite'
                  : 'none',
            }}
          >
            {currentStreak}
          </span>
        </div>
      </div>

      {/* STRIKE CONTROL BUTTONS */}
      {showControls && (
        <div className="controls flex items-center gap-2 flex-wrap justify-center z-10">
          <button
            type="button"
            onClick={() => handleStrike(1)}
            className="px-4 py-2 text-xs font-black text-white bg-gradient-to-r from-[#8a2be2] to-[#4b0082] rounded-xl shadow-md hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          >
            STRIKE 1
          </button>
          <button
            type="button"
            onClick={() => handleStrike(2)}
            className="px-4 py-2 text-xs font-black text-white bg-gradient-to-r from-[#8a2be2] to-[#4b0082] rounded-xl shadow-md hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          >
            STRIKE 2
          </button>
          <button
            type="button"
            onClick={() => handleStrike(3)}
            className="px-4 py-2 text-xs font-black text-white bg-gradient-to-r from-[#8a2be2] to-[#4b0082] rounded-xl shadow-md hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          >
            STRIKE 3
          </button>
          <button
            type="button"
            onClick={() => handleStrike(0)}
            className="px-4 py-2 text-xs font-black text-white bg-slate-600 rounded-xl shadow-md hover:bg-slate-700 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          >
            RESET
          </button>
        </div>
      )}

      <style>{`
        @keyframes purpleFlame {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-8px) scale(1.05); }
        }
        @keyframes purpleFlicker {
          0%, 100% { opacity: 1; }
          45% { opacity: 0.9; }
          55% { opacity: 0.85; }
          70% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default PurpleStrikeFireBadge;
