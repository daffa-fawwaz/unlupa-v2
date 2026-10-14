import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Hero3DCanvasProps {
  className?: string;
}

export const Hero3DCanvas: React.FC<Hero3DCanvasProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. WebGL Support Detection
    function checkWebGL(): boolean {
      try {
        const testCanvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    }

    if (!checkWebGL()) {
      setWebglSupported(false);
      return;
    }

    // 2. Scene, Camera, and Renderer Setup
    const scene = new THREE.Scene();
    let width = container.clientWidth || 480;
    let height = container.clientHeight || 480;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    const canvasElement = renderer.domElement;
    canvasElement.style.width = '100%';
    canvasElement.style.height = '100%';
    canvasElement.style.display = 'block';
    container.appendChild(canvasElement);

    // 3. Cinematic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    // Warm Key Directional Light (crisp golden highlights on card edges)
    const keyLight = new THREE.DirectionalLight(0xfff3db, 1.4);
    keyLight.position.set(4.5, 5.5, 6);
    scene.add(keyLight);

    // Cool Sky Fill Light
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.65);
    fillLight.position.set(-5, -2, 4);
    scene.add(fillLight);

    // Soft Center Point Glow
    const pointLight = new THREE.PointLight(0xfef3c7, 0.8, 14);
    pointLight.position.set(0, 1.2, 3.8);
    scene.add(pointLight);

    // 4. Dynamic Texture Generator for Crisp Card Faces
    function createCardTexture(config: {
      tag?: string;
      badge?: string;
      arabicTitle?: string;
      arabicText?: string;
      translation?: string;
      chips?: boolean;
      statusText?: string;
      accentColor?: string;
      bgColor1?: string;
      bgColor2?: string;
      tagBg?: string;
      tagColor?: string;
    }) {
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
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(50, 48, 280, 44, 22);
        } else {
          ctx.rect(50, 48, 280, 44);
        }
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
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(690, 48, 280, 44, 22);
        } else {
          ctx.rect(690, 48, 280, 44);
        }
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

      // Bottom Interactive Rating Chips
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
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(cx, 470, chipWidth, 68, 14);
          } else {
            ctx.rect(cx, 470, chipWidth, 68);
          }
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

    function createBookCoverTexture(title: string, sub: string, colorHex: string) {
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

      // Geometric Corner Ornaments
      const drawCorner = (x: number, y: number) => {
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

      // Top & Bottom Gold Foiled Insignia
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillStyle = '#FDE68A';
      ctx.fillText('UNLUPA CLASSICAL LIBRARY', 360, 160);
      ctx.fillText('✦ UNLUPA MUTQIN EDITION ✦', 360, 880);

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

      // Fine golden paper edge lines
      ctx.fillStyle = '#E5E0D5';
      for (let y = 0; y < 512; y += 4) {
        ctx.fillRect(0, y, 256, 1.5);
      }

      return new THREE.CanvasTexture(texCanvas);
    }

    // 5. Build 3D Objects Collection (Cards + Closed Books)
    const objectsGroup = new THREE.Group();
    scene.add(objectsGroup);

    const isMobile = window.innerWidth < 768;
    interface AnimItem {
      mesh: THREE.Mesh;
      basePos: THREE.Vector3;
      baseRot: THREE.Vector3;
      speedY: number;
      ampY: number;
      phase: number;
    }
    const items3D: AnimItem[] = [];

    // --- Object 1: Primary Qur'an Flashcard (Surah Al-Mulk) ---
    const geomCard1 = new THREE.BoxGeometry(3.1, 2.05, 0.04);
    const texCard1 = createCardTexture({
      tag: "AL-QUR'AN // JUZ 29",
      badge: "Halaman 562",
      arabicTitle: "سُورَةُ المُلْكِ : ١",
      arabicText: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
      translation: '"Maha Suci Allah yang di tangan-Nya lah segala kerajaan..."',
      chips: true,
      statusText: "Jadwal Muraja'ah: 4 Hari Lagi",
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

    const meshCard1 = new THREE.Mesh(geomCard1, [
      matCard1Edge, matCard1Edge,
      matCard1Edge, matCard1Edge,
      matCard1Front, matCard1Front
    ]);
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

    const meshBook1 = new THREE.Mesh(geomBook1, [
      matBook1Pages, matBook1Cover,
      matBook1Pages, matBook1Pages,
      matBook1Cover, matBook1Cover
    ]);
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

    // --- Additional Objects for Desktop / Tablet ---
    if (!isMobile) {
      // --- Object 3: Nahwu Card (Matn Al-Ajurrumiyyah) ---
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
        statusText: "Status: Mutqin 99.1% · Grade Utama",
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

    const onMouseMove = (e: MouseEvent) => {
      const parentRect = container.parentElement ? container.parentElement.getBoundingClientRect() : container.getBoundingClientRect();
      const cx = parentRect.left + parentRect.width / 2;
      const cy = parentRect.top + parentRect.height / 2;
      targetMouseX = Math.max(-1, Math.min(1, (e.clientX - cx) / (parentRect.width / 2)));
      targetMouseY = Math.max(-1, Math.min(1, (e.clientY - cy) / (parentRect.height / 2)));
    };

    const onMouseLeave = () => {
      targetMouseX = 0;
      targetMouseY = 0;
    };

    if (isFinePointer && !isMobile) {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('mouseleave', onMouseLeave);
    }

    // 7. Dynamic Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = entry.contentRect.width || 480;
        height = entry.contentRect.height || 480;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });
    resizeObserver.observe(container);

    // 8. Render Loop & Animation Orchestration
    let animationFrameId: number | null = null;
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

      // Animate floating and gentle axial rotations
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

    // 9. Intersection Observer (Pause loop when off-screen)
    const intersectionObserver = new IntersectionObserver((entries) => {
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
    intersectionObserver.observe(container);

    animationFrameId = requestAnimationFrame(renderLoop);

    // Cleanup on unmount
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (isFinePointer && !isMobile) {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseleave', onMouseLeave);
      }
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      renderer.dispose();
      if (container.contains(canvasElement)) {
        container.removeChild(canvasElement);
      }
    };
  }, []);

  if (!webglSupported) {
    return (
      <div className={`relative flex items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/10 to-amber-500/10 border border-white/20 backdrop-blur-md p-8 ${className}`}>
        <div className="text-center space-y-2">
          <div className="text-3xl">📖</div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">Unlupa 3D Flashcards</p>
          <p className="text-xs text-slate-500">Ekosistem pengunci ingatan adaptif</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[380px] sm:min-h-[480px] pointer-events-auto select-none ${className}`}
      style={{ touchAction: 'pan-y' }}
    />
  );
};
