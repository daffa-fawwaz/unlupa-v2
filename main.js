/**
 * unlupa.id - Main Application Logic & Interactive Experience
 * 
 * Features:
 * 1. HTML5 Canvas Animated Gradient Mesh (Living Aurora/Sky Mesh)
 * 2. Smooth Trailing Custom Cursor with Interactive Hover States
 * 3. Bilingual i18n Translation Engine (Plain JS State)
 * 4. Offset Smooth Scroll for Anchor Navigation (80px clearance)
 * 5. Staggered Scroll Fade-in Animations (Intersection Observer)
 * 6. Dynamic Copyright Year
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. HTML5 CANVAS ANIMATED GRADIENT MESH (HERO SECTION)
     ========================================================================== */
  function initHeroGradientMesh() {
    const canvas = document.getElementById('hero-gradient-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const heroSection = document.getElementById('hero-section');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrameId = null;
    let isVisible = true;

    // Fluid organic blobs with soft sky cyan, deep periwinkle, lavender, and cloud white
    const blobs = [
      {
        baseX: 0.2,
        baseY: 0.25,
        radiusRatio: 0.55,
        r: 126, g: 200, b: 227, // #7EC8E3 Sky Cyan
        alpha: 0.85,
        speedX: 0.0006,
        speedY: 0.0008,
        angleX: 0,
        angleY: 1.2,
        ampX: 0.18,
        ampY: 0.16
      },
      {
        baseX: 0.8,
        baseY: 0.35,
        radiusRatio: 0.65,
        r: 74, g: 111, b: 165, // #4A6FA5 Deep Periwinkle
        alpha: 0.75,
        speedX: 0.0005,
        speedY: 0.0007,
        angleX: 2.1,
        angleY: 0.5,
        ampX: 0.22,
        ampY: 0.18
      },
      {
        baseX: 0.5,
        baseY: 0.75,
        radiusRatio: 0.60,
        r: 237, g: 233, b: 254, // #EDE9FE Soft Lavender
        alpha: 0.80,
        speedX: 0.0007,
        speedY: 0.0005,
        angleX: 1.0,
        angleY: 3.2,
        ampX: 0.20,
        ampY: 0.15
      },
      {
        baseX: 0.3,
        baseY: 0.7,
        radiusRatio: 0.50,
        r: 56, g: 189, b: 248, // #38BDF8 Bright Azure
        alpha: 0.70,
        speedX: 0.0008,
        speedY: 0.0006,
        angleX: 3.5,
        angleY: 2.0,
        ampX: 0.16,
        ampY: 0.18
      },
      {
        baseX: 0.7,
        baseY: 0.65,
        radiusRatio: 0.45,
        r: 255, g: 255, b: 255, // Cloud White Accent
        alpha: 0.75,
        speedX: 0.0004,
        speedY: 0.0009,
        angleX: 0.8,
        angleY: 1.7,
        ampX: 0.15,
        ampY: 0.14
      }
    ];

    function resizeCanvas() {
      if (!heroSection) return;
      const rect = heroSection.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    function render(timestamp) {
      if (!isVisible) return;

      // Base gradient wash from bright cyan sky to gentle periwinkle
      const baseGrad = ctx.createLinearGradient(0, 0, width, height);
      baseGrad.addColorStop(0, '#BAE6FD');
      baseGrad.addColorStop(0.5, '#7EC8E3');
      baseGrad.addColorStop(1, '#93C5FD');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // Render living floating mesh blobs
      blobs.forEach((blob) => {
        if (!prefersReducedMotion) {
          blob.angleX += blob.speedX * 16;
          blob.angleY += blob.speedY * 16;
        }

        const currentX = (blob.baseX + Math.sin(blob.angleX) * blob.ampX) * width;
        const currentY = (blob.baseY + Math.cos(blob.angleY) * blob.ampY) * height;
        const maxDim = Math.max(width, height);
        const currentRadius = blob.radiusRatio * maxDim;

        const radial = ctx.createRadialGradient(
          currentX, currentY, 0,
          currentX, currentY, currentRadius
        );

        radial.addColorStop(0, `rgba(${blob.r}, ${blob.g}, ${blob.b}, ${blob.alpha})`);
        radial.addColorStop(0.4, `rgba(${blob.r}, ${blob.g}, ${blob.b}, ${blob.alpha * 0.65})`);
        radial.addColorStop(0.75, `rgba(${blob.r}, ${blob.g}, ${blob.b}, ${blob.alpha * 0.25})`);
        radial.addColorStop(1, `rgba(${blob.r}, ${blob.g}, ${blob.b}, 0)`);

        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, width, height);
      });

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // Pause animation when hero is out of view to save battery & CPU
    if ('IntersectionObserver' in window && heroSection) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && !prefersReducedMotion && !animationFrameId) {
            animationFrameId = requestAnimationFrame(render);
          } else if (!isVisible && animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
        });
      }, { threshold: 0.05 });
      observer.observe(heroSection);
    }

    animationFrameId = requestAnimationFrame(render);
  }

  /* ==========================================================================
     1B. HERO LUMINOUS FLOATING PARTICLES CANVAS
     ========================================================================== */
  function initHeroParticles() {
    const canvas = document.getElementById('hero-particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const heroSection = document.getElementById('hero-section');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrameId = null;
    let isVisible = true;

    // Particle count: 42 on desktop, 20 on small screens
    const count = window.innerWidth < 768 ? 20 : 42;
    const particles = [];

    function resizeParticlesCanvas() {
      if (!heroSection) return;
      const rect = heroSection.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    function createParticle(initial = false) {
      const isGold = Math.random() < 0.25;
      return {
        x: Math.random() * width,
        y: initial ? Math.random() * height : height + 10 + Math.random() * 20,
        radius: 1 + Math.random() * 2.2,
        speedY: 0.25 + Math.random() * 0.45,
        swaySpeed: 0.001 + Math.random() * 0.002,
        swayAmp: 0.6 + Math.random() * 1.2,
        angle: Math.random() * Math.PI * 2,
        alpha: 0.25 + Math.random() * 0.55,
        color: isGold ? '245, 158, 11' : '255, 255, 255'
      };
    }

    resizeParticlesCanvas();

    for (let i = 0; i < count; i++) {
      particles.push(createParticle(true));
    }

    window.addEventListener('resize', resizeParticlesCanvas, { passive: true });

    function renderParticles() {
      if (!isVisible) return;

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        if (!prefersReducedMotion) {
          p.y -= p.speedY;
          p.angle += p.swaySpeed;
          p.x += Math.sin(p.angle) * p.swayAmp;

          // Recycle particle when it exits top of hero
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
        }

        // Draw soft glowing particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = `rgba(${p.color}, 0.8)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(renderParticles);
      }
    }

    if ('IntersectionObserver' in window && heroSection) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && !prefersReducedMotion && !animationFrameId) {
            animationFrameId = requestAnimationFrame(renderParticles);
          } else if (!isVisible && animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
        });
      }, { threshold: 0.05 });
      observer.observe(heroSection);
    }

    animationFrameId = requestAnimationFrame(renderParticles);
  }

  /* ==========================================================================
     1C. REAL 3D THREE.JS R128 HERO RENDER SCENE (FLASHCARDS & CLOSED BOOKS)
     ========================================================================== */
  function initHeroThreeScene() {
    const heroSection = document.getElementById('hero-section');
    const stage = document.getElementById('hero-3d-stage');
    if (!heroSection || !stage) return;

    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
      console.warn('Three.js is not loaded yet');
      return;
    }

    // 1. WebGL Support Verification & Fallback Handling
    function isWebGLAvailable() {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    }

    if (!isWebGLAvailable()) {
      console.warn('WebGL not supported, falling back to static visual presentation');
      stage.classList.add('webgl-fallback');
      return;
    }

    // Clean up any previous CSS fallback elements if needed
    stage.innerHTML = '';

    // Create Canvas Element for Three.js
    const canvas = document.createElement('canvas');
    canvas.id = 'hero-three-canvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.outline = 'none';
    stage.appendChild(canvas);

    // 2. Three.js Scene, Camera, and Renderer Setup
    const scene = new THREE.Scene();

    const rect = stage.getBoundingClientRect();
    let width = rect.width || 480;
    let height = rect.height || 480;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    // 3. Cinematic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    // Warm Key Directional Light (crisp golden highlight)
    const keyLight = new THREE.DirectionalLight(0xfff3db, 1.4);
    keyLight.position.set(4.5, 5.5, 6);
    scene.add(keyLight);

    // Cool Sky Fill Light (subtle cyan/periwinkle sheen)
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.65);
    fillLight.position.set(-5, -2, 4);
    scene.add(fillLight);

    // Soft Front Glow Point Light
    const pointLight = new THREE.PointLight(0xfef3c7, 0.8, 14);
    pointLight.position.set(0, 1.2, 3.8);
    scene.add(pointLight);

    // 4. Dynamic Texture Generator for Razor-Sharp Card & Book Graphics
    function createCardTexture(config) {
      const texCanvas = document.createElement('canvas');
      texCanvas.width = 1024;
      texCanvas.height = 680;
      const ctx = texCanvas.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(texCanvas);

      // Card Background Glass Gradient
      const grad = ctx.createLinearGradient(0, 0, 1024, 680);
      grad.addColorStop(0, config.bgColor1 || 'rgba(255, 255, 255, 0.96)');
      grad.addColorStop(1, config.bgColor2 || 'rgba(240, 246, 255, 0.92)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 680);

      // Outer Accent Border
      ctx.strokeStyle = config.accentColor || '#F59E0B';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, 1010, 666);

      // Inner Subtle Glass Hairline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 3;
      ctx.strokeRect(18, 18, 988, 644);

      // Top Tag Badge
      if (config.tag) {
        ctx.fillStyle = config.tagBg || 'rgba(37, 99, 235, 0.10)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(50, 48, 280, 44, 22) : ctx.rect(50, 48, 280, 44);
        ctx.fill();
        ctx.strokeStyle = config.accentColor || '#2563EB';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = config.tagColor || '#1D4ED8';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(config.tag, 190, 78);
      }

      // Metric Badge (Top Right)
      if (config.badge) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(690, 48, 280, 44, 22) : ctx.rect(690, 48, 280, 44);
        ctx.fill();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#B45309';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(config.badge, 830, 78);
      }

      // Arabic Main Heading
      if (config.arabicTitle) {
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 44px Amiri, "Traditional Arabic", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(config.arabicTitle, 512, 195);
      }

      // Arabic Primary Verse / Text
      if (config.arabicText) {
        ctx.fillStyle = '#1E293B';
        ctx.font = 'bold 36px Amiri, "Traditional Arabic", serif';
        ctx.textAlign = 'center';
        ctx.fillText(config.arabicText, 512, 280);
      }

      // Latin Translation / Subtext
      if (config.translation) {
        ctx.fillStyle = '#475569';
        ctx.font = 'italic 25px Inter, Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(config.translation, 512, 360);
      }

      // Divider Line
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(70, 420);
      ctx.lineTo(954, 420);
      ctx.stroke();

      // Bottom FSRS Interactive Rating Chips
      if (config.chips) {
        const chipColors = [
          { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B', label: '1 · Lagi (10m)' },
          { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', label: '2 · Sulit (1d)' },
          { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF', label: '3 · Baik (4d)' },
          { bg: '#DCFCE7', border: '#10B981', text: '#065F46', label: '4 · Mudah (12d)' }
        ];

        const startX = 65;
        const chipWidth = 205;
        const gap = 25;

        chipColors.forEach((c, idx) => {
          const cx = startX + idx * (chipWidth + gap);
          ctx.fillStyle = c.bg;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(cx, 470, chipWidth, 68, 14) : ctx.rect(cx, 470, chipWidth, 68);
          ctx.fill();
          ctx.strokeStyle = c.border;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.fillStyle = c.text;
          ctx.font = 'bold 20px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(c.label, cx + chipWidth / 2, 512);
        });
      }

      // Bottom Retention Bar
      if (config.statusText) {
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(config.statusText, 70, 605);

        ctx.fillStyle = '#F59E0B';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('98.4% Mutqin ★', 954, 605);
      }

      const texture = new THREE.CanvasTexture(texCanvas);
      texture.anisotropy = 4;
      return texture;
    }

    function createBookCoverTexture(title, sub, colorHex) {
      const texCanvas = document.createElement('canvas');
      texCanvas.width = 720;
      texCanvas.height = 1024;
      const ctx = texCanvas.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(texCanvas);

      // Rich Leather Cover Background
      ctx.fillStyle = colorHex || '#1E3A8A';
      ctx.fillRect(0, 0, 720, 1024);

      // Gold Embossed Classical Border
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 16;
      ctx.strokeRect(30, 30, 660, 964);

      ctx.strokeStyle = '#FDE68A';
      ctx.lineWidth = 4;
      ctx.strokeRect(52, 52, 616, 920);

      // Geometric Islamic Corner Ornaments
      const drawCorner = (x, y) => {
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fill();
      };
      drawCorner(70, 70);
      drawCorner(650, 70);
      drawCorner(70, 954);
      drawCorner(650, 954);

      // Center Gold Medallion
      ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
      ctx.beginPath();
      ctx.arc(360, 480, 140, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Book Title in Gold Calligraphy
      ctx.fillStyle = '#FEF3C7';
      ctx.font = 'bold 48px Amiri, Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, 360, 460);

      ctx.fillStyle = '#FCD34D';
      ctx.font = '22px Inter, sans-serif';
      ctx.fillText(sub, 360, 520);

      // Top Emblem & Bottom Unlupa.id Gold Logo
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillStyle = '#FDE68A';
      ctx.fillText('UNLUPA CLASSICAL LIBRARY', 360, 160);
      ctx.fillText('✦ FSRS MUTQIN EDITION ✦', 360, 880);

      const texture = new THREE.CanvasTexture(texCanvas);
      texture.anisotropy = 4;
      return texture;
    }

    function createBookPagesTexture() {
      const texCanvas = document.createElement('canvas');
      texCanvas.width = 256;
      texCanvas.height = 512;
      const ctx = texCanvas.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(texCanvas);

      ctx.fillStyle = '#FDFBF7'; // Cream antique paper
      ctx.fillRect(0, 0, 256, 512);

      // Fine golden paper line stripes
      ctx.fillStyle = '#E5E0D5';
      for (let y = 0; y < 512; y += 4) {
        ctx.fillRect(0, y, 256, 1.5);
      }

      return new THREE.CanvasTexture(texCanvas);
    }

    // 5. Build 3D Objects Collection (4-5 Items: Cards & Closed Books)
    const objectsGroup = new THREE.Group();
    scene.add(objectsGroup);

    const isMobile = window.innerWidth < 768;
    const items3D = [];

    // --- Object 1: Primary Qur'an Flashcard (Surah Al-Mulk) ---
    const geomCard1 = new THREE.BoxGeometry(3.1, 2.05, 0.04);
    const texCard1 = createCardTexture({
      tag: "AL-QUR'AN // JUZ 29",
      badge: "Halaman 562",
      arabicTitle: "سُورَةُ المُلْكِ : ١",
      arabicText: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
      translation: '"Maha Suci Allah yang di tangan-Nya lah segala kerajaan..."',
      chips: true,
      statusText: "FSRS v6 · Jadwal: 4 Hari Lagi",
      accentColor: "#F59E0B"
    });

    const matCard1Front = new THREE.MeshStandardMaterial({
      map: texCard1,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: 0.98
    });
    const matCard1Edge = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      roughness: 0.2,
      metalness: 0.7
    });

    const materialsCard1 = [
      matCard1Edge, matCard1Edge,
      matCard1Edge, matCard1Edge,
      matCard1Front, matCard1Front
    ];

    const meshCard1 = new THREE.Mesh(geomCard1, materialsCard1);
    meshCard1.position.set(0.15, 0.1, 0.6);
    meshCard1.rotation.set(0.08, -0.12, -0.03);
    objectsGroup.add(meshCard1);

    items3D.push({
      mesh: meshCard1,
      basePos: new THREE.Vector3(0.15, 0.1, 0.6),
      baseRot: new THREE.Vector3(0.08, -0.12, -0.03),
      speedY: 1.4,
      ampY: 0.12,
      phase: 0.0
    });

    // --- Object 2: Classical Closed Book 1 (Mushaf At-Tibyan) ---
    const geomBook1 = new THREE.BoxGeometry(2.0, 2.75, 0.32);
    const texBook1Cover = createBookCoverTexture("التِّبْيَانُ فِي حَمَلَةِ القُرْآنِ", "Imam An-Nawawi", "#0F2942");
    const texBook1Pages = createBookPagesTexture();

    const matBook1Cover = new THREE.MeshStandardMaterial({
      map: texBook1Cover,
      roughness: 0.35,
      metalness: 0.2
    });
    const matBook1Pages = new THREE.MeshStandardMaterial({
      map: texBook1Pages,
      roughness: 0.6,
      metalness: 0.05
    });

    const materialsBook1 = [
      matBook1Pages, matBook1Cover, // Right (pages), Left (spine cover)
      matBook1Pages, matBook1Pages, // Top (pages), Bottom (pages)
      matBook1Cover, matBook1Cover  // Front cover, Back cover
    ];

    const meshBook1 = new THREE.Mesh(geomBook1, materialsBook1);
    meshBook1.position.set(1.9, 0.85, -0.4);
    meshBook1.rotation.set(0.18, -0.35, 0.12);
    objectsGroup.add(meshBook1);

    items3D.push({
      mesh: meshBook1,
      basePos: new THREE.Vector3(1.9, 0.85, -0.4),
      baseRot: new THREE.Vector3(0.18, -0.35, 0.12),
      speedY: 1.1,
      ampY: 0.15,
      phase: 1.8
    });

    // --- Object 3: Nahwu Card (Matn Al-Ajurrumiyyah) ---
    if (!isMobile) {
      const geomCard2 = new THREE.BoxGeometry(2.6, 1.75, 0.035);
      const texCard2 = createCardTexture({
        tag: "RUANG BUKU // NAHWU",
        badge: "Bab Al-I'rab",
        arabicTitle: "مَتْنُ الأَجُرُّومِيَّةِ",
        arabicText: "الإِعْرَابُ هُوَ تَغْيِيرُ أَوَاخِرِ الكَلِمِ",
        translation: "I'rab adalah perubahan akhir kalimat karena perbedaan amil.",
        chips: false,
        statusText: "Interval: 7 Hari · Stabilitas 9.2",
        accentColor: "#2563EB",
        tagBg: "rgba(37, 99, 235, 0.12)",
        tagColor: "#1D4ED8"
      });

      const matCard2Front = new THREE.MeshStandardMaterial({
        map: texCard2,
        roughness: 0.25,
        metalness: 0.1,
        transparent: true,
        opacity: 0.95
      });
      const matCard2Edge = new THREE.MeshStandardMaterial({
        color: 0x2563EB,
        roughness: 0.25,
        metalness: 0.6
      });

      const meshCard2 = new THREE.Mesh(geomCard2, [
        matCard2Edge, matCard2Edge,
        matCard2Edge, matCard2Edge,
        matCard2Front, matCard2Front
      ]);
      meshCard2.position.set(-1.85, -0.85, 0.3);
      meshCard2.rotation.set(-0.14, 0.22, -0.06);
      objectsGroup.add(meshCard2);

      items3D.push({
        mesh: meshCard2,
        basePos: new THREE.Vector3(-1.85, -0.85, 0.3),
        baseRot: new THREE.Vector3(-0.14, 0.22, -0.06),
        speedY: 1.25,
        ampY: 0.13,
        phase: 3.2
      });

      // --- Object 4: Hadith Card (Arba'in Nawawiyyah : 1) ---
      const geomCard3 = new THREE.BoxGeometry(2.3, 1.55, 0.035);
      const texCard3 = createCardTexture({
        tag: "HADITS ARBA'IN",
        badge: "Hadits Ke-1",
        arabicTitle: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
        arabicText: "وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
        translation: "Sesungguhnya setiap amalan bergantung pada niatnya.",
        chips: false,
        statusText: "Status: Mutqin 99.1% · FSRS Tier",
        accentColor: "#10B981",
        tagBg: "rgba(16, 185, 129, 0.12)",
        tagColor: "#047857"
      });

      const matCard3Front = new THREE.MeshStandardMaterial({
        map: texCard3,
        roughness: 0.25,
        metalness: 0.1,
        transparent: true,
        opacity: 0.94
      });
      const matCard3Edge = new THREE.MeshStandardMaterial({
        color: 0x10B981,
        roughness: 0.25,
        metalness: 0.6
      });

      const meshCard3 = new THREE.Mesh(geomCard3, [
        matCard3Edge, matCard3Edge,
        matCard3Edge, matCard3Edge,
        matCard3Front, matCard3Front
      ]);
      meshCard3.position.set(-1.6, 1.2, -0.6);
      meshCard3.rotation.set(0.2, 0.18, -0.1);
      objectsGroup.add(meshCard3);

      items3D.push({
        mesh: meshCard3,
        basePos: new THREE.Vector3(-1.6, 1.2, -0.6),
        baseRot: new THREE.Vector3(0.2, 0.18, -0.1),
        speedY: 1.5,
        ampY: 0.14,
        phase: 4.6
      });

      // --- Object 5: Closed Book 2 (Tuhfatul Athfal Tajweed) ---
      const geomBook2 = new THREE.BoxGeometry(1.7, 2.3, 0.26);
      const texBook2Cover = createBookCoverTexture("تُحْفَةُ الأَطْفَالِ", "Matn Tajwid", "#4C1D95");
      const matBook2Cover = new THREE.MeshStandardMaterial({
        map: texBook2Cover,
        roughness: 0.35,
        metalness: 0.2
      });

      const meshBook2 = new THREE.Mesh(geomBook2, [
        matBook1Pages, matBook2Cover,
        matBook1Pages, matBook1Pages,
        matBook2Cover, matBook2Cover
      ]);
      meshBook2.position.set(1.4, -1.15, -0.2);
      meshBook2.rotation.set(-0.16, -0.28, 0.08);
      objectsGroup.add(meshBook2);

      items3D.push({
        mesh: meshBook2,
        basePos: new THREE.Vector3(1.4, -1.15, -0.2),
        baseRot: new THREE.Vector3(-0.16, -0.28, 0.08),
        speedY: 1.35,
        ampY: 0.12,
        phase: 2.4
      });
    }

    // 6. Interactive Smooth Mouse Parallax
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;
    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (isFinePointer && !isMobile) {
      heroSection.addEventListener('mousemove', (e) => {
        const heroRect = heroSection.getBoundingClientRect();
        const cx = heroRect.left + heroRect.width / 2;
        const cy = heroRect.top + heroRect.height / 2;
        targetMouseX = Math.max(-1, Math.min(1, (e.clientX - cx) / (heroRect.width / 2)));
        targetMouseY = Math.max(-1, Math.min(1, (e.clientY - cy) / (heroRect.height / 2)));
      }, { passive: true });

      heroSection.addEventListener('mouseleave', () => {
        targetMouseX = 0;
        targetMouseY = 0;
      });
    }

    // 7. Dynamic Resize Handler
    function handleResize() {
      if (!stage) return;
      const newRect = stage.getBoundingClientRect();
      width = newRect.width || 480;
      height = newRect.height || 480;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    }

    window.addEventListener('resize', handleResize, { passive: true });

    // 8. Render Loop & Animation Orchestration
    let animationFrameId = null;
    let isVisible = true;
    const clock = new THREE.Clock();

    function renderLoop() {
      if (!isVisible) return;

      const elapsedTime = clock.getElapsedTime();

      // Smooth lerp mouse parallax
      if (isFinePointer && !isMobile) {
        currentMouseX += (targetMouseX - currentMouseX) * 0.055;
        currentMouseY += (targetMouseY - currentMouseY) * 0.055;

        camera.position.x = currentMouseX * 0.65;
        camera.position.y = -currentMouseY * 0.45;
        camera.lookAt(0, 0, 0);

        objectsGroup.rotation.y = currentMouseX * 0.12;
        objectsGroup.rotation.x = -currentMouseY * 0.08;
      }

      // Animate floating and gentle individual axial rotation per card/book
      items3D.forEach((item) => {
        const t = elapsedTime * item.speedY + item.phase;
        item.mesh.position.y = item.basePos.y + Math.sin(t) * item.ampY;

        item.mesh.rotation.x = item.baseRot.x + Math.sin(elapsedTime * 0.5 + item.phase) * 0.035;
        item.mesh.rotation.y = item.baseRot.y + Math.cos(elapsedTime * 0.4 + item.phase) * 0.045;
        item.mesh.rotation.z = item.baseRot.z + Math.sin(elapsedTime * 0.6 + item.phase) * 0.02;
      });

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(renderLoop);
    }

    // 9. Intersection Observer (Pause loop when hero is off-screen)
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && !animationFrameId) {
            clock.start();
            animationFrameId = requestAnimationFrame(renderLoop);
          } else if (!isVisible && animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
        });
      }, { threshold: 0.05 });
      observer.observe(heroSection);
    }

    animationFrameId = requestAnimationFrame(renderLoop);
  }

  /* ==========================================================================
     2. SMOOTH TRAILING CUSTOM CURSOR WITH HOVER-GROW
     ========================================================================== */
  function initCustomCursor() {
    // Only activate for desktop devices with fine pointer controls
    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isFinePointer) return;

    const dot = document.createElement('div');
    dot.className = 'custom-cursor-dot';

    const ring = document.createElement('div');
    ring.className = 'custom-cursor-ring';

    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let hasMoved = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!hasMoved) {
        ringX = mouseX;
        ringY = mouseY;
        hasMoved = true;
      }
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    });

    window.addEventListener('mouseenter', () => {
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    });

    function renderCursor() {
      // Smooth lerp for outer ring
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;

      dot.style.transform = `translate3d(${mouseX - 3.5}px, ${mouseY - 3.5}px, 0)`;
      ring.style.transform = `translate3d(${ringX - 17}px, ${ringY - 17}px, 0)`;

      requestAnimationFrame(renderCursor);
    }

    requestAnimationFrame(renderCursor);

    // Interactive Hover Elements Selector
    const interactiveSelector = `
      a, button, input, select, textarea, .btn, .btn-cta-gold,
      .value-card, .room-card, .step-card, .testimonial-card,
      .social-icon-link, .lang-select
    `;

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactiveSelector)) {
        document.body.classList.add('cursor-hover');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactiveSelector)) {
        document.body.classList.remove('cursor-hover');
      }
    });
  }

  /* ==========================================================================
     3. BILINGUAL TRANSLATION SYSTEM (In-Memory State)
     ========================================================================== */
  let currentLang = 'en';

  function applyLanguage(lang) {
    if (!window.translations || !window.translations[lang]) {
      return;
    }
    currentLang = lang;

    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const text = window.translations[lang][key];
      if (text) {
        el.style.transition = 'opacity 0.2s ease-in-out';
        el.style.opacity = '0.35';
      }
    });

    setTimeout(() => {
      elements.forEach((el) => {
        const key = el.getAttribute('data-i18n');
        const text = window.translations[lang][key];
        if (text) {
          if (el.dataset.i18nTarget === 'placeholder') {
            el.setAttribute('placeholder', text);
          } else {
            el.textContent = text;
          }
          el.style.opacity = '1';
        }
      });
    }, 200);
  }

  function initLanguageSwitcher() {
    const langSelect = document.querySelector('.lang-select');
    if (!langSelect) return;

    langSelect.value = currentLang;

    langSelect.addEventListener('change', function (e) {
      applyLanguage(e.target.value);
    });
  }

  /* ==========================================================================
     4. SMOOTH SCROLLING WITH 80PX NAVBAR OFFSET
     ========================================================================== */
  function initSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach((link) => {
      link.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const navbarHeight = 80;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          if (history.pushState) {
            history.pushState(null, null, href);
          } else {
            location.hash = href;
          }
        }
      });
    });
  }

  /* ==========================================================================
     5. GSAP SCROLLTRIGGER ANIMATION SYSTEM
     ========================================================================== */
  function initGSAPScrollAnimations() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Graceful fallback if GSAP or ScrollTrigger is blocked / not loaded
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      const allCards = document.querySelectorAll('.room-card, .step-card, .testimonial-card');
      allCards.forEach((c) => {
        c.style.opacity = '1';
        c.style.transform = 'none';
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // If user prefers reduced motion, render in final state immediately
    if (prefersReducedMotion) {
      gsap.set('.room-card, .step-card, .testimonial-card, #hero-gradient-canvas', {
        opacity: 1,
        transform: 'none',
        clearProps: 'all'
      });
      return;
    }

    const mm = gsap.matchMedia();

    // ------------------------------------------------------------------------
    // DESKTOP & TABLET ANIMATIONS (min-width: 768px)
    // ------------------------------------------------------------------------
    mm.add('(min-width: 768px)', () => {
      // 1. Hero Background Parallax Scroll Effect
      gsap.to('#hero-gradient-canvas', {
        yPercent: 35,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

      gsap.to('#hero-3d-stage', {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

      // 2. Four Rooms Section: Pinned Section with Staggered Card Reveals
      const roomsTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: '#four-rooms-section',
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: 1,
          anticipatePin: 1
        }
      });

      roomsTimeline.from('.rooms-grid .room-card', {
        opacity: 0,
        y: 80,
        scale: 0.88,
        stagger: 0.2,
        ease: 'power2.out'
      });

      // 3. How It Works Section: Animated SVG Line Drawing with Scrub
      const desktopPath = document.getElementById('steps-path-desktop');
      if (desktopPath) {
        const pathLength = desktopPath.getTotalLength ? desktopPath.getTotalLength() : 700;
        gsap.set(desktopPath, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength
        });

        const stepsTl = gsap.timeline({
          scrollTrigger: {
            trigger: '#how-it-works-section',
            start: 'top 70%',
            end: 'bottom 75%',
            scrub: 1
          }
        });

        // Draw the SVG connector path progressively while cards elevate
        stepsTl
          .to(desktopPath, {
            strokeDashoffset: 0,
            ease: 'none'
          })
          .from('.steps-container .step-card', {
            opacity: 0,
            y: 45,
            stagger: 0.25,
            ease: 'power2.out'
          }, 0);
      }

      // 4. Testimonials Section: Staggered 3D Tilt, Rotation & Fade-in
      gsap.from('.testimonials-grid .testimonial-card', {
        opacity: 0,
        y: 75,
        rotationX: 18,
        rotationY: (index) => (index === 0 ? -12 : index === 2 ? 12 : 0),
        scale: 0.92,
        stagger: 0.22,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '#testimonials-section',
          start: 'top 75%',
          toggleActions: 'play none none none'
        }
      });
    });

    // ------------------------------------------------------------------------
    // MOBILE ANIMATIONS (max-width: 767px) - Optimized & Unpinned
    // ------------------------------------------------------------------------
    mm.add('(max-width: 767px)', () => {
      // Four Rooms: Staggered entry without viewport pinning for mobile ergonomics
      gsap.from('.rooms-grid .room-card', {
        opacity: 0,
        y: 45,
        scale: 0.96,
        stagger: 0.15,
        duration: 0.85,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#four-rooms-section',
          start: 'top 78%',
          toggleActions: 'play none none none'
        }
      });

      // How It Works: Vertical SVG Line Draw on mobile
      const mobilePath = document.getElementById('steps-path-mobile');
      if (mobilePath) {
        const pathLength = mobilePath.getTotalLength ? mobilePath.getTotalLength() : 660;
        gsap.set(mobilePath, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength
        });

        gsap.to(mobilePath, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: '#how-it-works-section',
            start: 'top 75%',
            end: 'bottom 85%',
            scrub: true
          }
        });
      }

      // Testimonials: Clean mobile slide & fade
      gsap.from('.testimonials-grid .testimonial-card', {
        opacity: 0,
        y: 40,
        stagger: 0.18,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#testimonials-section',
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      });
    });
  }

  /* ==========================================================================
     6. DYNAMIC COPYRIGHT YEAR
     ========================================================================== */
  function initDynamicYear() {
    const yearEl = document.getElementById('copyright-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  /* ==========================================================================
     APPLICATION INITIALIZATION
     ========================================================================== */
  function initApp() {
    initHeroGradientMesh();
    initHeroParticles();
    initHeroThreeScene();
    initCustomCursor();
    initLanguageSwitcher();
    initSmoothScrolling();
    initGSAPScrollAnimations();
    initDynamicYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
