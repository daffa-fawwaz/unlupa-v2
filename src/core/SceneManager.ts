/**
 * Scene Manager - Orchestrates the 6-Scene Virtual Scrollytelling Pipeline
 *
 * Responsibilities:
 * - Detects active scene based on global scroll progress (0–1 across 600vh)
 * - Computes normalized localProgress (0–1) for each scene's specific range
 * - Manages enter(), update(), leave() lifecycle calls
 * - Provides seamless blending and transition hooks for subsequent scenes (Scenes 02–06)
 */

import { IScene, SceneContext } from '../scenes/Scene01Hero';
import { TOKENS } from '../config';

export class SceneManager {
  private scenes: Map<string, IScene> = new Map();
  private activeSceneId: string | null = null;
  private ctx: SceneContext;

  constructor(ctx: SceneContext) {
    this.ctx = ctx;
  }

  public registerScene(scene: IScene) {
    this.scenes.set(scene.id, scene);
  }

  public async init() {
    for (const scene of this.scenes.values()) {
      await scene.init(this.ctx);
    }
  }

  public update(globalProgress: number, dt: number, time: number) {
    let currentActiveScene: IScene | null = null;

    // Find which scene's range contains the current global progress
    for (const scene of this.scenes.values()) {
      const [start, end] = scene.range;
      // Allow slight inclusive boundary tolerance
      if (globalProgress >= start - 0.0001 && globalProgress <= end + 0.0001) {
        currentActiveScene = scene;
        break;
      }
    }

    // Default to first scene if before range
    if (!currentActiveScene && this.scenes.size > 0) {
      currentActiveScene = this.scenes.values().next().value || null;
    }

    if (currentActiveScene) {
      // Handle scene enter/leave transitions
      if (this.activeSceneId !== currentActiveScene.id) {
        if (this.activeSceneId) {
          const prev = this.scenes.get(this.activeSceneId);
          if (prev) prev.leave(this.ctx);
        }
        this.activeSceneId = currentActiveScene.id;
        currentActiveScene.enter(this.ctx);
      }

      // Compute normalized local progress within this scene's segment
      const [start, end] = currentActiveScene.range;
      const span = end - start;
      const localProgress = span > 0 ? Math.max(0, Math.min(1, (globalProgress - start) / span)) : 0;

      // Update active scene
      currentActiveScene.update(this.ctx, localProgress, dt, time);
    }
  }

  public getActiveSceneId(): string | null {
    return this.activeSceneId;
  }

  public dispose() {
    for (const scene of this.scenes.values()) {
      scene.dispose(this.ctx);
    }
    this.scenes.clear();
  }
}
