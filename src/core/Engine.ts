/**
 * Core Three.js Render Engine for Unlupa.id
 *
 * Responsibilities:
 * - WebGLRenderer setup with ACESFilmicToneMapping
 * - PerspectiveCamera with FOV 35 (intro begins at z 12, moves to z 9)
 * - Render Loop with document.hidden awareness
 * - Adaptive Quality monitor (tracks average FPS over 60 frames, auto-downgrades if < 45 FPS)
 * - Dynamic Cursor/Pointer Light for organic specular glints on ice facets
 * - Viewport Resize handling with aspect-ratio awareness
 */

import * as THREE from 'three';
import { QualityConfig, QUALITY_TIERS, QualityTier, TOKENS } from '../config';
import { PostFX } from './PostFX';

export interface EngineContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  postFX: PostFX;
  cursorLight: THREE.PointLight;
  quality: QualityConfig;
}

export class Engine {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public postFX: PostFX;
  public cursorLight: THREE.PointLight;
  public quality: QualityConfig;

  private canvasContainer: HTMLElement;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private lastTime: number = 0;
  private clock: THREE.Clock;

  // Adaptive Quality Tracker
  private frameCount: number = 0;
  private fpsBuffer: number[] = [];
  private lastFpsTime: number = 0;

  // Cursor Light Coordinates
  private mouseTarget: THREE.Vector2 = new THREE.Vector2(0, 0);
  private mouseCurrent: THREE.Vector2 = new THREE.Vector2(0, 0);

  // Per-frame user tick callback
  private onTickCallback?: (dt: number, time: number) => void;

  constructor(container: HTMLElement, initialTier: QualityTier = 'HIGH') {
    this.canvasContainer = container;
    this.quality = { ...QUALITY_TIERS[initialTier] };
    this.clock = new THREE.Clock();

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(TOKENS.colors.bg0);

    // 2. Camera: FOV 35, start at z 12 during intro, settles at z 9
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 12);

    // 3. WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.quality.maxDPR));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = false; // Physically transmitted materials rely on environment reflections

    this.canvasContainer.appendChild(this.renderer.domElement);

    // 4. Cursor / Pointer Specular Light (drifts with mouse / pointer movement)
    this.cursorLight = new THREE.PointLight(new THREE.Color(TOKENS.colors.iceGlow), 2.2, 8.0);
    this.cursorLight.position.set(0, 0, 3.5);
    this.scene.add(this.cursorLight);

    // 5. PostFX Pipeline
    this.postFX = new PostFX(this.renderer, this.scene, this.camera, this.quality);

    // 6. Bind Event Listeners
    this.bindEvents();
  }

  private bindEvents() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Device orientation support for mobile gyroscope glints
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.handleOrientation, false);
    }
  }

  private handleResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.quality.maxDPR));
    this.postFX.setSize(width, height);
  };

  private handleMouseMove = (e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.mouseTarget.set(x * 2.8, y * 2.0);
  };

  private handleOrientation = (e: DeviceOrientationEvent) => {
    if (e.gamma !== null && e.beta !== null) {
      const x = (e.gamma / 45); // -1 to 1
      const y = ((e.beta - 45) / 45);
      this.mouseTarget.set(x * 2.0, y * 1.5);
    }
  };

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.isPaused = true;
    } else {
      this.isPaused = false;
      this.lastTime = performance.now();
      this.clock.start();
    }
  };

  public setQualityTier(tier: QualityTier) {
    this.quality = { ...QUALITY_TIERS[tier] };
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.quality.maxDPR));
    this.postFX.bloomPass.enabled = this.quality.bloom;
    console.info(`[Unlupa Engine] Adaptive Quality shifted to: ${tier}`);
  }

  public setOnTick(callback: (dt: number, time: number) => void) {
    this.onTickCallback = callback;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.lastFpsTime = performance.now();
    this.clock.start();

    const loop = (now: number) => {
      if (!this.isRunning) return;

      if (!this.isPaused) {
        const dt = Math.min(0.1, this.clock.getDelta());
        const elapsed = this.clock.getElapsedTime();

        // 1. Smoothly lerp cursor light to mouse position
        this.mouseCurrent.lerp(this.mouseTarget, 0.08);
        this.cursorLight.position.set(this.mouseCurrent.x, this.mouseCurrent.y, 3.2);

        // 2. Adaptive Quality Monitor
        this.monitorPerformance(now);

        // 3. User update hook
        if (this.onTickCallback) {
          this.onTickCallback(dt, elapsed);
        }

        // 4. Render through PostFX
        this.postFX.render();
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  private monitorPerformance(now: number) {
    this.frameCount++;
    if (now - this.lastFpsTime >= 1000) {
      const fps = (this.frameCount * 1000) / (now - this.lastFpsTime);
      this.fpsBuffer.push(fps);
      if (this.fpsBuffer.length > 4) {
        this.fpsBuffer.shift();
      }

      const avgFps = this.fpsBuffer.reduce((a, b) => a + b, 0) / this.fpsBuffer.length;

      // Auto-downgrade quality tier if sustained FPS < 45
      if (avgFps < 45 && this.quality.tier === 'HIGH') {
        this.setQualityTier('MEDIUM');
      } else if (avgFps < 38 && this.quality.tier === 'MEDIUM') {
        this.setQualityTier('LOW');
      }

      this.frameCount = 0;
      this.lastFpsTime = now;
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public dispose() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    if (window.DeviceOrientationEvent) {
      window.removeEventListener('deviceorientation', this.handleOrientation, false);
    }

    this.postFX.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
