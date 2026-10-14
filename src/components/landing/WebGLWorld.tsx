import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TOKENS } from './tokens';

interface WebGLWorldProps {
  scrollProgress: number; // 0.0 to 1.0
}

export const WebGLWorld: React.FC<WebGLWorldProps> = ({ scrollProgress }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const crystalGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const ebbinghausCurveRef = useRef<THREE.Line | null>(null);
  const crackMeshRef = useRef<THREE.Mesh | null>(null);
  const crystalCoreRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL support
    let isWebGLAvailable = true;
    try {
      const testCanvas = document.createElement('canvas');
      isWebGLAvailable = !!(window.WebGLRenderingContext && 
        (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')));
    } catch {
      isWebGLAvailable = false;
    }

    if (!isWebGLAvailable) {
      return;
    }

    // --- 1. SETUP SCENE, CAMERA & RENDERER ---
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(TOKENS.colors.bg);
    scene.fog = new THREE.FogExp2(TOKENS.colors.bg, 0.045);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false,
      powerPreference: 'high-performance' 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- 2. LIGHTING (Sacred Amber Gold & Midnight Glow) ---
    const ambientLight = new THREE.AmbientLight(0x0a1122, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfde68a, 2.2);
    keyLight.position.set(5, 6, 6);
    scene.add(keyLight);

    const goldFillLight = new THREE.PointLight(0xf59e0b, 2.4, 18);
    goldFillLight.position.set(-4, -2, 3);
    scene.add(goldFillLight);

    const cyanRimLight = new THREE.PointLight(0x38bdf8, 1.8, 14);
    cyanRimLight.position.set(0, -4, -2);
    scene.add(cyanRimLight);

    // --- 3. PROCEDURAL ICE CRYSTAL CLUSTER ---
    const crystalGroup = new THREE.Group();
    crystalGroupRef.current = crystalGroup;
    scene.add(crystalGroup);

    // Main central crystal faceted geometry (double hexagonal-like bipyramid / elongated octahedron)
    const mainCrystalGeo = new THREE.OctahedronGeometry(1.8, 0);
    // Stretch along Y axis for elegant natural crystal growth
    mainCrystalGeo.scale(0.85, 1.6, 0.85);

    // Crystal outer refraction material
    const crystalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x8fd4f7,
      emissive: 0x071526,
      roughness: 0.12,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.31, // Water/Ice index of refraction
      thickness: 1.4,
      transparent: true,
      opacity: 0.95,
      flatShading: true,
    });

    const mainCrystal = new THREE.Mesh(mainCrystalGeo, crystalMaterial);
    crystalGroup.add(mainCrystal);

    // Glowing golden memory seed in the core (representing permanent retained knowledge)
    const coreGeo = new THREE.IcosahedronGeometry(0.55, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.9,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    crystalGroup.add(coreMesh);
    crystalCoreRef.current = coreMesh;

    // Outer crystalline wireframe / crack fissure mesh (reveals in Scene 2)
    const crackMat = new THREE.MeshBasicMaterial({
      color: 0xe63946,
      wireframe: true,
      transparent: true,
      opacity: 0.0,
    });
    const crackMesh = new THREE.Mesh(mainCrystalGeo.clone(), crackMat);
    crackMesh.scale.set(1.02, 1.02, 1.02);
    crystalGroup.add(crackMesh);
    crackMeshRef.current = crackMesh;

    // Surrounding smaller satellite crystal shards
    const shardGeo = new THREE.OctahedronGeometry(0.45, 0);
    shardGeo.scale(0.7, 1.5, 0.7);
    const shardMat = new THREE.MeshPhysicalMaterial({
      color: 0xb6bac5,
      transmission: 0.75,
      roughness: 0.2,
      ior: 1.31,
      flatShading: true,
    });

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const radius = 2.2 + (i % 2) * 0.4;
      const shard = new THREE.Mesh(shardGeo, shardMat);
      shard.position.set(
        Math.cos(angle) * radius,
        (i % 3 - 1) * 0.6,
        Math.sin(angle) * radius
      );
      shard.rotation.set(Math.random(), angle, Math.random() * 0.5);
      shard.scale.setScalar(0.7 + Math.random() * 0.4);
      crystalGroup.add(shard);
    }

    // --- 4. FLOATING FROST MIST & PARTICLES ---
    const particleCount = 450;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleOriginals = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const r = 2.0 + Math.random() * 6.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const px = r * Math.sin(phi) * Math.cos(theta);
      const py = r * Math.sin(phi) * Math.sin(theta);
      const pz = r * Math.cos(phi);

      particlePositions[i] = px;
      particlePositions[i + 1] = py;
      particlePositions[i + 2] = pz;

      particleOriginals[i] = px;
      particleOriginals[i + 1] = py;
      particleOriginals[i + 2] = pz;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    // Particle sprite
    const particleMat = new THREE.PointsMaterial({
      color: 0x8fd4f7,
      size: 0.06,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // --- 5. EBBINGHAUS 3D DECAY CURVE (For Scene 2) ---
    const curvePoints: THREE.Vector3[] = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = -3.5 + t * 7.0; // horizontal span
      const y = 1.8 * Math.exp(-2.6 * t) - 0.8; // Ebbinghaus exponential decay formula
      const z = (1 - t) * 0.5;
      curvePoints.push(new THREE.Vector3(x, y, z));
    }

    const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const curveMat = new THREE.LineBasicMaterial({
      color: 0xe63946,
      linewidth: 2,
      transparent: true,
      opacity: 0.0,
    });
    const ebbinghausCurve = new THREE.Line(curveGeo, curveMat);
    scene.add(ebbinghausCurve);
    ebbinghausCurveRef.current = ebbinghausCurve;

    // --- 6. RESIZE HANDLER ---
    const handleResize = () => {
      if (!renderer || !camera) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- 7. ANIMATION LOOP ---
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Idle crystal breathing rotation
      if (crystalGroup) {
        crystalGroup.rotation.y += 0.005;
        crystalGroup.rotation.x = Math.sin(elapsed * 0.5) * 0.08;
      }

      // Core pulsing
      if (coreMesh) {
        const pulse = 1.0 + Math.sin(elapsed * 2.0) * 0.08;
        coreMesh.scale.set(pulse, pulse, pulse);
      }

      // Particle subtle orbital swirling
      if (particles) {
        particles.rotation.y = elapsed * 0.02;
        particles.rotation.x = Math.sin(elapsed * 0.015) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // --- REACT TO SCROLL PROGRESS SCRUBBING ---
  useEffect(() => {
    const camera = cameraRef.current;
    const crystalGroup = crystalGroupRef.current;
    const crackMesh = crackMeshRef.current;
    const ebbinghausCurve = ebbinghausCurveRef.current;
    const particles = particlesRef.current;

    if (!camera || !crystalGroup) return;

    // Progress 0.0 to 0.18 = Scene 1 (Hero)
    // Progress 0.18 to 0.35 = Scene 2 (Masalah / Ebbinghaus)
    // Progress 0.35 to 1.00 = Subsequent scenes

    const p = Math.max(0, Math.min(1, scrollProgress));

    if (p <= 0.18) {
      // --- SCENE 1 (HERO) ---
      const s1Progress = p / 0.18;
      
      // Camera zooms gently toward crystal
      camera.position.z = 8 - s1Progress * 2.5;
      camera.position.y = s1Progress * 0.3;
      camera.position.x = 0;
      camera.lookAt(0, 0, 0);

      // Crystal rotates with scroll scrubbing
      crystalGroup.rotation.y = s1Progress * Math.PI * 0.8;
      crystalGroup.position.set(0, 0, 0);
      crystalGroup.scale.setScalar(1 + s1Progress * 0.15);

      // Cracks hidden in scene 1
      if (crackMesh) {
        (crackMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      }

      // Curve hidden
      if (ebbinghausCurve) {
        (ebbinghausCurve.material as THREE.LineBasicMaterial).opacity = 0;
      }

      // Normal particles
      if (particles) {
        (particles.material as THREE.PointsMaterial).color.setHex(0x8fd4f7);
      }
    } else if (p <= 0.35) {
      // --- SCENE 2 (MASALAH / EBBINGHAUS DECAY) ---
      const s2Progress = (p - 0.18) / (0.35 - 0.18);

      // Camera sweeps sideways to reveal the decaying Ebbinghaus trajectory
      camera.position.z = 5.5 - s2Progress * 0.5;
      camera.position.x = THREE.MathUtils.lerp(0, 1.8, s2Progress);
      camera.position.y = THREE.MathUtils.lerp(0.3, -0.2, s2Progress);
      camera.lookAt(0, -0.2, 0);

      // Crystal shifts slightly left as content occupies right
      crystalGroup.position.x = THREE.MathUtils.lerp(0, -1.8, s2Progress);
      crystalGroup.rotation.y = Math.PI * 0.8 + s2Progress * 1.2;

      // Cracks / fissures emerge on the crystal
      if (crackMesh) {
        (crackMesh.material as THREE.MeshBasicMaterial).opacity = s2Progress * 0.85;
      }

      // Ebbinghaus curve manifests and glows in 3D
      if (ebbinghausCurve) {
        (ebbinghausCurve.material as THREE.LineBasicMaterial).opacity = s2Progress * 0.95;
      }

      // Particles shift color to cold decaying amber/fissure tint
      if (particles) {
        (particles.material as THREE.PointsMaterial).color.setHex(
          s2Progress > 0.5 ? 0xe67e22 : 0x8fd4f7
        );
      }
    } else {
      // Transitioning toward scenes 3, 4, 5, 6
      const sLater = (p - 0.35) / 0.65;
      camera.position.z = 5.0 - sLater * 1.5;
      camera.position.x = Math.sin(sLater * Math.PI) * 1.5;
      crystalGroup.position.x = -1.8 + sLater * 1.8;
      
      // Healing of cracks as adaptive review takes over
      if (crackMesh) {
        (crackMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 - sLater * 2);
      }
      if (ebbinghausCurve) {
        (ebbinghausCurve.material as THREE.LineBasicMaterial).opacity = Math.max(0, 0.95 - sLater * 2);
      }
    }
  }, [scrollProgress]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
