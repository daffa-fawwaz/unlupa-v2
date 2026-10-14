/**
 * Unlupa.id - Scene 02: Masalah (The Forgetting Curve & The Degradation of Knowledge)
 * 
 * Global Scroll Range: [1/6, 2/6] (~0.1667 to 0.3333)
 * 
 * Narratif:
 * Menampakkan kepedihan hilangnya ilmu: ingatan yang tidak diulang memudar dengan cepat.
 * Kurva Ebbinghaus ditarik secara matematis di sisi kiri sementara kristal otak berpindah ke kanan,
 * mengalami retakan mikro, pelemahan sinapsis, dan dispersi kepingan memori sejalan dengan penurunan retensi.
 * 
 * Deterministic Lifecycle:
 * All transformations are scrubbed strictly against localProgress in [0, 1].
 */

import * as THREE from 'three';
import { IScene, SceneContext } from './Scene01Hero';
import { ForgettingCurve } from '../world/ForgettingCurve';
import { GridAxes } from '../world/GridAxes';
import { FallingMotes } from '../world/FallingMotes';
import { PREFERS_REDUCED_MOTION, TOKENS } from '../config';

export class Scene02Masalah implements IScene {
  public id = 'scene-02-masalah';
  public range: [number, number] = [1 / 6, 2 / 6];

  private curve: ForgettingCurve | null = null;
  private grid: GridAxes | null = null;
  private motes: FallingMotes | null = null;

  // Milestone points in curve progress s
  private milestones = [0.12, 0.38, 0.66, 0.94];

  // Cached vectors for memory efficiency
  private initialCamPos = new THREE.Vector3(-0.65, 0.1, 4.8);
  private targetCamPos = new THREE.Vector3(-0.45, 0.1, 4.3);
  private initialLookAt = new THREE.Vector3(-0.65, 0.1, 0);
  private targetLookAt = new THREE.Vector3(-0.45, 0.1, 0);

  private initialCrystalPos = new THREE.Vector3(2.75, 0.15, 0);
  private targetCrystalPos = new THREE.Vector3(2.35, 0.15, 0);

  public async init(ctx: SceneContext): Promise<void> {
    const scene = ctx.engine.scene;
    const quality = ctx.engine.quality;

    // Instantiate 3D components for Scene 2
    this.curve = new ForgettingCurve(scene, quality);
    this.grid = new GridAxes(scene);
    this.motes = new FallingMotes(scene, quality);

    // Initially hide them until Scene 2 is active
    this.curve.setOpacity(0.0);
    this.curve.setDraw(0.0);
    this.grid.setOpacity(0.0);
    this.motes.setOpacity(0.0);
  }

  public enter(ctx: SceneContext): void {
    if (this.curve) this.curve.group.visible = true;
    if (this.grid) this.grid.group.visible = true;
    if (this.motes) this.motes.points.visible = true;

    // Update aspect ratio layout for responsive bounds
    const aspect = ctx.engine.camera.aspect;
    if (this.curve) this.curve.updateLayout(aspect);
    if (this.grid) this.grid.updateLayout(aspect);
  }

  public update(ctx: SceneContext, localProgress: number, dt: number, time: number): void {
    const p = Math.max(0, Math.min(1, localProgress));
    const aspect = ctx.engine.camera.aspect;
    const isPortrait = aspect < 1.0;

    // -------------------------------------------------------------------------
    // 1. SCENE 2 OVERLAY VISIBILITY & FADE IN/OUT
    // -------------------------------------------------------------------------
    let sceneAlpha = 1.0;
    if (p < 0.12) {
      sceneAlpha = p / 0.12;
    } else if (p > 0.92) {
      sceneAlpha = Math.max(0, 1.0 - (p - 0.92) / 0.08);
    }
    ctx.overlay.setScene2Opacity(sceneAlpha);
    ctx.overlay.updateScene2Text(p);

    // -------------------------------------------------------------------------
    // 2. CAMERA CHOREOGRAPHY & RE-FRAMING (0.00 -> 0.18)
    // -------------------------------------------------------------------------
    const camT = Math.min(1.0, p / 0.18);
    const easedCamT = THREE.MathUtils.smoothstep(camT, 0, 1);

    if (!PREFERS_REDUCED_MOTION) {
      if (isPortrait) {
        // In portrait mode, camera tilts down slightly and frames both brain on top & curve below
        ctx.engine.camera.position.set(
          0.0,
          THREE.MathUtils.lerp(0.0, -0.4, easedCamT),
          THREE.MathUtils.lerp(4.8, 5.4, easedCamT)
        );
        ctx.engine.camera.lookAt(0, -0.4 * easedCamT, 0);
      } else {
        // In desktop mode, camera pans to left (-0.65, 0.1, 5.2) to give spotlight to curve
        const curCamX = THREE.MathUtils.lerp(this.initialCamPos.x, this.targetCamPos.x, easedCamT);
        const curCamY = THREE.MathUtils.lerp(this.initialCamPos.y, this.targetCamPos.y, easedCamT);
        const curCamZ = THREE.MathUtils.lerp(this.initialCamPos.z, this.targetCamPos.z, easedCamT);
        ctx.engine.camera.position.set(curCamX, curCamY, curCamZ);

        const curLookX = THREE.MathUtils.lerp(this.initialLookAt.x, this.targetLookAt.x, easedCamT);
        const curLookY = THREE.MathUtils.lerp(this.initialLookAt.y, this.targetLookAt.y, easedCamT);
        ctx.engine.camera.lookAt(curLookX, curLookY, 0);
      }
    }

    // -------------------------------------------------------------------------
    // 3. CRYSTAL RE-POSITIONING & DYNAMIC DEGRADATION
    // -------------------------------------------------------------------------
    const crystalT = Math.min(1.0, p / 0.20);
    const easedCrystalT = THREE.MathUtils.smoothstep(crystalT, 0, 1);

    // Target positions
    const targetX = isPortrait ? 0.0 : this.targetCrystalPos.x;
    const targetY = isPortrait ? 1.45 : this.targetCrystalPos.y;
    const targetScale = isPortrait ? 0.72 : 0.82;

    const curX = THREE.MathUtils.lerp(this.initialCrystalPos.x, targetX, easedCrystalT);
    const curY = THREE.MathUtils.lerp(this.initialCrystalPos.y, targetY, easedCrystalT);
    const curZ = THREE.MathUtils.lerp(this.initialCrystalPos.z, this.targetCrystalPos.z, easedCrystalT);
    ctx.crystal.setPosition(curX, curY, curZ);

    const curScale = THREE.MathUtils.lerp(1.0, targetScale, easedCrystalT);
    ctx.crystal.setScale(curScale);

    // Continuous rotation drifting
    const baseRotY = THREE.MathUtils.lerp(1.2, 2.0, easedCrystalT) + p * 0.45;
    ctx.crystal.setRotationY(baseRotY);

    // -------------------------------------------------------------------------
    // 4. FORGETTING CURVE PROGRESSION (0.15 -> 0.75)
    // -------------------------------------------------------------------------
    const curveStart = 0.15;
    const curveEnd = 0.75;
    let curveProgress = 0.0;

    if (p >= curveStart) {
      curveProgress = Math.min(1.0, (p - curveStart) / (curveEnd - curveStart));
    }

    if (this.curve) {
      this.curve.setOpacity(sceneAlpha);
      this.curve.setDraw(curveProgress);

      // Evaluate retrievability R(s) from curve
      const retrievability = this.curve.getValueAt(curveProgress);

      // Remap integrity: 1.0 (start) down to 0.12 (end of forgetting curve)
      const targetIntegrity = THREE.MathUtils.lerp(1.0, 0.12, 1.0 - (retrievability - 0.18) / 0.82);
      ctx.crystal.setIntegrity(targetIntegrity);

      // If integrity drops below 0.5, outer satellite memory tablets float apart
      if (targetIntegrity < 0.5) {
        const sepFactor = (0.5 - targetIntegrity) / 0.38;
        ctx.crystal.setShardSeparation(sepFactor);
      } else {
        ctx.crystal.setShardSeparation(0.0);
      }

      // Memory environment grading: envMap intensity 1.4 down to 0.6
      const envIntensity = THREE.MathUtils.lerp(1.4, 0.6, 1.0 - targetIntegrity);
      ctx.crystal.setEnvMapIntensity(envIntensity);

      // Core pulse heartbeat slows from 1.0 Hz to 0.25 Hz; intensity drops to 0.15
      const coreRate = THREE.MathUtils.lerp(1.0, 0.25, 1.0 - targetIntegrity);
      ctx.crystal.setCorePulseRate(coreRate);
      ctx.crystal.setCoreLight(THREE.MathUtils.lerp(2.5, 0.35, 1.0 - targetIntegrity));

      // -----------------------------------------------------------------------
      // 5. DETERMINISTIC MILESTONE PULSES & MICRO-CRACK VIBRATIONS
      // -----------------------------------------------------------------------
      let maxMicroCrack = 0.0;
      let pulseRingScale = 1.0;
      let pulseRingAlpha = 0.0;

      for (const m of this.milestones) {
        const delta = Math.abs(curveProgress - m);
        if (delta < 0.035) {
          const normDist = delta / 0.035;
          const vib = Math.cos(normDist * (Math.PI * 0.5));
          if (vib > maxMicroCrack) {
            maxMicroCrack = vib;
          }
          pulseRingScale = 1.0 + (1.0 - normDist) * 2.8;
          pulseRingAlpha = vib * 0.9;
        }
      }

      ctx.crystal.setMicroCrackVibration(maxMicroCrack);
      this.curve.setPulseRing(pulseRingScale, pulseRingAlpha);
    }

    // -------------------------------------------------------------------------
    // 6. GRID AXES & PROJECTED LABELS
    // -------------------------------------------------------------------------
    if (this.grid) {
      // Grid fades in between 0.10 and 0.20
      const gridT = Math.max(0, Math.min(1, (p - 0.10) / 0.10));
      this.grid.setOpacity(gridT * sceneAlpha);

      // Project axes labels to HTML Overlay
      const yLabelWorld = new THREE.Vector3(this.grid.xMin, this.grid.yMax, 0);
      const xLabelWorld = new THREE.Vector3(this.grid.xMax, this.grid.yMin, 0);

      ctx.overlay.updateScene2ProjectedLabels(
        yLabelWorld,
        xLabelWorld,
        this.grid.milestones,
        ctx.engine.camera,
        curveProgress,
        gridT * sceneAlpha
      );
    }

    // -------------------------------------------------------------------------
    // 7. FALLING MEMORY MOTES & DUST DISPERSION
    // -------------------------------------------------------------------------
    if (this.motes) {
      // Motes appear during active curve drawing (0.15 -> 0.85)
      let motesAlpha = 0.0;
      if (p >= 0.15 && p <= 0.85) {
        if (p < 0.25) {
          motesAlpha = (p - 0.15) / 0.10;
        } else if (p > 0.75) {
          motesAlpha = 1.0 - (p - 0.75) / 0.10;
        } else {
          motesAlpha = 1.0;
        }
      }
      this.motes.setOpacity(motesAlpha * sceneAlpha);
      this.motes.setProgress(curveProgress);
    }

    // Dust disperses radially around crystal to form an ambient forgetting mist
    const disperseProgress = Math.max(0, Math.min(1, (p - 0.2) / 0.6));
    ctx.dust.setDisperse(disperseProgress);

    // -------------------------------------------------------------------------
    // 8. POST-PROCESSING FROST TRANSITION (Cold realization of memory loss)
    // -------------------------------------------------------------------------
    if (p < 0.15) {
      // Subtle peak of chromatic aberration and cool frost during transition
      const frostT = Math.sin((p / 0.15) * Math.PI);
      ctx.engine.postFX.setAberration(0.0015 + frostT * 0.0025);
      ctx.engine.postFX.setFrost(frostT * 0.45);
    } else {
      ctx.engine.postFX.setAberration(0.0015);
      ctx.engine.postFX.setFrost(0.0);
    }

    // Dim backdrop text "UNLUPA" slightly to avoid visual competition with curve
    ctx.backdropText.setOpacity(THREE.MathUtils.lerp(0.18, 0.08, easedCamT));
  }

  public leave(ctx: SceneContext): void {
    ctx.overlay.setScene2Opacity(0.0);
    if (this.curve) {
      this.curve.setOpacity(0.0);
      this.curve.group.visible = false;
    }
    if (this.grid) {
      this.grid.setOpacity(0.0);
      this.grid.group.visible = false;
    }
    if (this.motes) {
      this.motes.setOpacity(0.0);
      this.motes.points.visible = false;
    }

    // Reset crystal and postFX state for safety if scrolling back
    ctx.crystal.setMicroCrackVibration(0.0);
    ctx.dust.setDisperse(0.0);
    ctx.engine.postFX.setFrost(0.0);
    ctx.engine.postFX.setAberration(0.0012);
  }

  public dispose(ctx: SceneContext): void {
    if (this.curve) {
      ctx.engine.scene.remove(this.curve.group);
      this.curve.dispose();
      this.curve = null;
    }
    if (this.grid) {
      ctx.engine.scene.remove(this.grid.group);
      this.grid.dispose();
      this.grid = null;
    }
    if (this.motes) {
      ctx.engine.scene.remove(this.motes.points);
      this.motes.dispose();
      this.motes = null;
    }
  }
}
