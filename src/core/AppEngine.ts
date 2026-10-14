/**
 * Unlupa.id - App Engine Orchestrator
 * Integrates Engine, ScrollController, Environment, Crystal, Dust,
 * BackdropText, Loader, Overlay, Scene01Hero, and SceneManager into a unified lifecycle.
 */

import { Engine } from './Engine';
import { ScrollController } from './ScrollController';
import { SceneManager } from './SceneManager';
import { Environment } from '../world/Environment';
import { Crystal } from '../world/Crystal';
import { Dust } from '../world/Dust';
import { BackdropText } from '../world/BackdropText';
import { Overlay } from '../ui/Overlay';
import { Loader } from '../ui/Loader';
import { Scene01Hero, SceneContext } from '../scenes/Scene01Hero';
import { Scene02Masalah } from '../scenes/Scene02Masalah';

export interface AppEngineOptions {
  canvasContainer: HTMLElement;
  scrollTrack: HTMLElement;
  overlayContainer: HTMLElement;
  onLaunchApp?: () => void;
}

export class AppEngine {
  public engine: Engine | null = null;
  public scrollController: ScrollController | null = null;
  public sceneManager: SceneManager | null = null;
  public overlay: Overlay | null = null;
  public loader: Loader | null = null;
  public crystal: Crystal | null = null;
  public dust: Dust | null = null;
  public backdropText: BackdropText | null = null;
  public environment: Environment | null = null;

  private isDisposed: boolean = false;

  constructor(private options: AppEngineOptions) {}

  public async start() {
    const { canvasContainer, scrollTrack, overlayContainer, onLaunchApp } = this.options;

    // 1. Mount minimal editorial loader (0.0-0.8s)
    this.loader = new Loader(overlayContainer);
    this.loader.setProgress(15);

    // 2. Initialize Overlay UI
    this.overlay = new Overlay(overlayContainer, {
      onLaunchApp: () => {
        if (onLaunchApp) onLaunchApp();
      },
      onScrollToTop: () => {
        if (this.scrollController) {
          this.scrollController.scrollTo(0, 1.0);
        }
      }
    });

    // 3. Detect WebGL support
    if (!this.checkWebGLSupport()) {
      if (this.loader) await this.loader.fadeOut();
      this.overlay.showWebGLFallback();
      return;
    }

    this.loader.setProgress(35);

    // 4. Initialize Core Engine & ScrollController
    this.engine = new Engine(canvasContainer, 'HIGH');
    this.scrollController = new ScrollController(scrollTrack);

    this.loader.setProgress(55);

    // 5. Initialize 3D World Entities
    this.environment = new Environment(this.engine.scene, this.engine.renderer);
    this.crystal = new Crystal(this.engine.scene, this.engine.quality);
    this.dust = new Dust(this.engine.scene, this.engine.quality.dustCount);
    this.backdropText = new BackdropText(this.engine.scene);

    this.loader.setProgress(80);

    // 6. Build Scene Context
    const sceneCtx: SceneContext = {
      engine: this.engine,
      crystal: this.crystal,
      dust: this.dust,
      backdropText: this.backdropText,
      environment: this.environment,
      overlay: this.overlay,
      scrollController: this.scrollController,
    };

    // 7. Register & Initialize Scenes
    this.sceneManager = new SceneManager(sceneCtx);
    const heroScene = new Scene01Hero();
    const masalahScene = new Scene02Masalah();
    this.sceneManager.registerScene(heroScene);
    this.sceneManager.registerScene(masalahScene);

    // 8. Connect Engine Loop
    this.engine.setOnTick((dt, time) => {
      if (this.isDisposed) return;

      const velocity = this.scrollController ? this.scrollController.velocity : 0;
      const progress = this.scrollController ? this.scrollController.globalProgress : 0;

      // Update 3D entities
      if (this.environment) this.environment.update(dt);
      if (this.crystal) this.crystal.update(dt, time);
      if (this.dust) this.dust.update(dt, velocity);
      if (this.backdropText && this.engine) {
        this.backdropText.update(this.engine.camera.aspect);
      }

      // Update PostFX dynamic parameters
      if (this.engine) {
        this.engine.postFX.update(dt, time, velocity);
      }

      // Update active scene
      if (this.sceneManager) {
        this.sceneManager.update(progress, dt, time);
      }
    });

    // Finalize loading progress
    this.loader.setProgress(100);

    // Fade out loader and start engine
    await this.loader.fadeOut();
    if (this.loader) {
      this.loader.destroy();
      this.loader = null;
    }

    if (this.isDisposed) return;

    this.engine.start();
    await this.sceneManager.init();
  }

  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  }

  public dispose() {
    this.isDisposed = true;

    if (this.loader) {
      this.loader.destroy();
      this.loader = null;
    }

    if (this.sceneManager) {
      this.sceneManager.dispose();
      this.sceneManager = null;
    }

    if (this.crystal) {
      this.crystal.dispose();
      this.crystal = null;
    }

    if (this.dust) {
      this.dust.dispose();
      this.dust = null;
    }

    if (this.backdropText) {
      this.backdropText.dispose();
      this.backdropText = null;
    }

    if (this.environment) {
      this.environment.dispose();
      this.environment = null;
    }

    if (this.scrollController) {
      this.scrollController.dispose();
      this.scrollController = null;
    }

    if (this.engine) {
      this.engine.dispose();
      this.engine = null;
    }

    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }
  }
}
