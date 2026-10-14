/**
 * Unlupa.id - Scene 01: Hero Intro (The Forgetting Curve & The Neural Architecture of Memory)
 * 
 * First scan of the landing page:
 * Immediately introduces the user to the Ebbinghaus Forgetting Curve and the 3D Neural Brain of Knowledge.
 * On load, the 100% retrievability origin and coordinate grid are instantly presented.
 * As the user scrolls, the curve traces down across time milestones (20m, 1d, 1w, 1mo),
 * shedding memory motes while the brain's synaptic integrity synchronizes directly with retention.
 */

import * as THREE from 'three';
import gsap from 'gsap';
import { Engine } from '../core/Engine';
import { Crystal } from '../world/Crystal';
import { Dust } from '../world/Dust';
import { BackdropText } from '../world/BackdropText';
import { Environment } from '../world/Environment';
import { Overlay } from '../ui/Overlay';
import { ScrollController } from '../core/ScrollController';
import { ForgettingCurve } from '../world/ForgettingCurve';
import { GridAxes } from '../world/GridAxes';
import { FallingMotes } from '../world/FallingMotes';
import { PREFERS_REDUCED_MOTION, TOKENS } from '../config';

export interface SceneContext {
  engine: Engine;
  crystal: Crystal;
  dust: Dust;
  backdropText: BackdropText;
  environment: Environment;
  overlay: Overlay;
  scrollController: ScrollController;
}

export interface IScene {
  id: string;
  range: [number, number];
  init(ctx: SceneContext): Promise<void>;
  enter(ctx: SceneContext): void;
  update(ctx: SceneContext, localProgress: number, dt: number, time: number): void;
  leave(ctx: SceneContext): void;
  dispose(ctx: SceneContext): void;
}

export class Scene01Hero implements IScene {
  public id = 'scene-01-hero';
  public range: [number, number] = [0.0, 1 / 6];

  private curve: ForgettingCurve | null = null;
  private grid: GridAxes | null = null;
  private motes: FallingMotes | null = null;

  // Milestone triggers along the curve: 20 Menit, 1 Hari, 1 Minggu, 1 Bulan
  private milestones = [0.12, 0.38, 0.66, 0.94];
  private lastTriggeredMilestone = -1;

  // Camera & Crystal position targets
  private targetCamPos = new THREE.Vector3(-0.65, 0.1, 5.2);
  private targetLookAt = new THREE.Vector3(-0.65, 0.1, 0);

  private targetCrystalPos = new THREE.Vector3(2.75, 0.15, 0);
  private isIntroRevealed = false;

  public async init(ctx: SceneContext): Promise<void> {
    const scene = ctx.engine.scene;
    const quality = ctx.engine.quality;

    // 1. Instantiate the First Scan components: Forgetting Curve, Grid Axes, & Memory Motes
    this.curve = new ForgettingCurve(scene, quality);
    this.grid = new GridAxes(scene);
    this.motes = new FallingMotes(scene, quality);

    // Initial setup: visible right away with origin mark
    this.grid.setOpacity(1.0);
    this.curve.setOpacity(1.0);
    this.curve.setDraw(0.08); // Start positioned right at 100% retrievability origin
    this.motes.setOpacity(1.0);

    // 2. Setup the 3D Crystalline Brain in its initial state
    ctx.crystal.setGrow(1.0);
    ctx.crystal.setIntegrity(1.0);
    ctx.crystal.setDissolve(0.0);
    ctx.crystal.setGold(0.0);
    ctx.crystal.setCoreLight(2.2);

    // 3. Configure Camera & Viewport
    const aspect = ctx.engine.camera.aspect;
    const isPortrait = aspect < 1.0;

    if (isPortrait) {
      ctx.engine.camera.position.set(0.0, -0.2, 5.4);
      ctx.engine.camera.lookAt(0.0, -0.2, 0.0);
      ctx.crystal.setPosition(0.0, 1.45, 0.0);
      ctx.crystal.setScale(0.72);
    } else {
      ctx.engine.camera.position.copy(this.targetCamPos);
      ctx.engine.camera.lookAt(this.targetLookAt);
      ctx.crystal.setPosition(this.targetCrystalPos.x, this.targetCrystalPos.y, this.targetCrystalPos.z);
      ctx.crystal.setScale(0.82);
    }

    ctx.engine.postFX.setAberration(0.0012);
    ctx.engine.postFX.setBloomStrength(0.42);

    // 4. Subtle backdrop branding
    ctx.backdropText.setText('UNLUPA');
    ctx.backdropText.setOpacity(0.12);

    // 5. Update layouts for aspect ratio
    this.curve.updateLayout(aspect);
    this.grid.updateLayout(aspect);

    // 6. Smooth rapid reveal: UI elements fade in gracefully without lag
    this.playImmediateEntrance(ctx);
  }

  private playImmediateEntrance(ctx: SceneContext) {
    if (this.isIntroRevealed) return;
    this.isIntroRevealed = true;

    // Reveal top bar and hero block with subtle stagger
    ctx.overlay.revealTopBar();
    ctx.overlay.revealBadge();
    ctx.overlay.revealTagline();
    ctx.overlay.revealArabic();
    ctx.overlay.revealSubtitle();
    ctx.overlay.revealCTA();
    ctx.overlay.revealScrollIndicator();
    ctx.overlay.heroBlock.style.opacity = '1';
    ctx.overlay.heroBlock.style.transform = 'translateY(0)';

    // Ensure scroll is immediately enabled
    ctx.scrollController.unlock();
  }

  public enter(ctx: SceneContext): void {
    if (this.curve) this.curve.group.visible = true;
    if (this.grid) this.grid.group.visible = true;
    if (this.motes) this.motes.points.visible = true;

    const aspect = ctx.engine.camera.aspect;
    if (this.curve) this.curve.updateLayout(aspect);
    if (this.grid) this.grid.updateLayout(aspect);
  }

  /**
   * Deterministic scroll scrubbing across Scene 1 (localProgress in [0, 1])
   */
  public update(ctx: SceneContext, localProgress: number, dt: number, time: number): void {
    const p = Math.max(0, Math.min(1, localProgress));
    const globalProgress = ctx.scrollController.globalProgress;
    const aspect = ctx.engine.camera.aspect;
    const isPortrait = aspect < 1.0;

    // 1. Text & UI Scrubbing (Hero copy stays clear, fades gently towards scene end)
    ctx.overlay.updateScene1Scroll(p, globalProgress);

    // 2. Forgetting Curve Progression along scroll: from origin (0.08) down to 1.0
    const curveProgress = THREE.MathUtils.lerp(0.08, 1.0, p);

    if (this.curve) {
      this.curve.setOpacity(1.0);
      const retrievability = this.curve.animateWithLocalProgress(curveProgress);

      // 3. Synchronize Brain of Knowledge Integrity with Retrievability R(s)
      ctx.crystal.setIntegrity(retrievability);

      // Separate outer satellite shards when retention drops below 50%
      if (retrievability < 0.5) {
        ctx.crystal.setShardSeparation((0.5 - retrievability) / 0.5);
      } else {
        ctx.crystal.setShardSeparation(0.0);
      }

      // Gentle organic breathing rotation
      ctx.crystal.setRotationY(-0.2 + p * 0.5 + Math.sin(time * 0.5) * 0.05);

      // 4. Memory Motes falling from the curve head
      if (this.motes) {
        this.motes.setOpacity(1.0);
        this.motes.setProgress(curveProgress);
      }

      // 5. Milestone Threshold Crossing: Golden Pulse Ring & Micro-crack vibration
      this.checkMilestones(ctx, curveProgress);

      // 6. Screen-projected Axis & Milestone Labels
      if (this.grid) {
        const yLabelWorld = new THREE.Vector3(this.grid.xMin, this.grid.yMax, 0);
        const xLabelWorld = new THREE.Vector3(this.grid.xMax, this.grid.yMin, 0);
        ctx.overlay.projectGridLabels(
          yLabelWorld,
          xLabelWorld,
          this.grid.milestones,
          ctx.engine.camera,
          curveProgress,
          1.0
        );
      }
    }

    // 7. Subtle Camera Drift
    if (!PREFERS_REDUCED_MOTION) {
      if (isPortrait) {
        ctx.engine.camera.position.y = -0.2 - p * 0.15;
      } else {
        ctx.engine.camera.position.z = this.targetCamPos.z - p * 0.4;
      }
    }
  }

  private checkMilestones(ctx: SceneContext, curveProgress: number) {
    for (let i = 0; i < this.milestones.length; i++) {
      const ms = this.milestones[i];
      if (curveProgress >= ms && this.lastTriggeredMilestone < i) {
        this.lastTriggeredMilestone = i;
        if (this.curve) {
          this.curve.setPulseRing(curveProgress, 0.7);
        }
        ctx.crystal.setMicroCrackVibration(0.9);
        break;
      }
    }
    // Allow scrubbing backward
    for (let i = this.milestones.length - 1; i >= 0; i--) {
      if (curveProgress < this.milestones[i] && this.lastTriggeredMilestone >= i) {
        this.lastTriggeredMilestone = i - 1;
      }
    }
  }

  public leave(ctx: SceneContext): void {
    // Retain visuals smoothly as transition into Scene 2 Masalah
  }

  public dispose(ctx: SceneContext): void {
    if (this.curve) {
      this.curve.dispose();
      this.curve = null;
    }
    if (this.grid) {
      this.grid.dispose();
      this.grid = null;
    }
    if (this.motes) {
      this.motes.dispose();
      this.motes = null;
    }
  }
}
