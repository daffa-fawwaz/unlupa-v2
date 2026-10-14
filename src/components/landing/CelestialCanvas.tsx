import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  speed: number;
  color: string;
}

export const CelestialCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    let stars: Star[] = [];
    const colors = [
      'rgba(245, 242, 235, ', // Warm ivory
      'rgba(212, 175, 55, ',  // Antique gold
      'rgba(196, 164, 124, ', // Warm parchment amber
      'rgba(155, 179, 201, '  // Celestial dusk blue
    ];

    const initStars = () => {
      stars = [];
      const count = Math.min(Math.floor((width * height) / 14000), 80);
      for (let i = 0; i < count; i++) {
        const baseAlpha = Math.random() * 0.4 + 0.15;
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.8 + 0.6,
          alpha: baseAlpha,
          targetAlpha: baseAlpha,
          speed: Math.random() * 0.2 + 0.05,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    };

    initStars();

    const render = () => {
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Ambient warm vignette around cursor
      if (mouse.x > -500) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 420);
        grad.addColorStop(0, 'rgba(196, 164, 124, 0.04)');
        grad.addColorStop(0.6, 'rgba(212, 175, 55, 0.015)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.y -= s.speed;
        if (s.y < 0) {
          s.y = height;
          s.x = Math.random() * width;
        }

        // Mouse proximity glow
        const dx = mouse.x - s.x;
        const dy = mouse.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          s.targetAlpha = 0.85;
        } else {
          s.targetAlpha = s.alpha;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `${s.color}${s.targetAlpha})`;
        ctx.fill();

        // Delicate sacred constellation lines
        for (let j = i + 1; j < stars.length; j++) {
          const s2 = stars[j];
          const ldx = s.x - s2.x;
          const ldy = s.y - s2.y;
          const ldist = Math.sqrt(ldx * ldx + ldy * ldy);
          if (ldist < 95) {
            const lineAlpha = (1 - ldist / 95) * 0.12 * Math.min(s.targetAlpha, s2.targetAlpha);
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.strokeStyle = `rgba(212, 175, 55, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-70"
      style={{ width: '100%', height: '100%' }}
    />
  );
};
