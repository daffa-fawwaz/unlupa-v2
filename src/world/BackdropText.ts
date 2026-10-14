/**
 * Backdrop 3D Refraction Text Plane
 * Renders high-res typography to a dynamic CanvasTexture positioned behind the crystal.
 * MeshPhysicalMaterial transmission physically distorts and refracts "UNLUPA" through its ice facets.
 */

import * as THREE from 'three';
import { TOKENS } from '../config';

export class BackdropText {
  public mesh: THREE.Mesh;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;
  private material: THREE.MeshBasicMaterial;
  private currentText: string = 'UNLUPA';
  private targetOpacity: number = 1.0;

  constructor(scene: THREE.Scene) {
    // 1. High-resolution canvas for crisp typography
    this.canvas = document.createElement('canvas');
    this.canvas.width = 2048;
    this.canvas.height = 512;
    this.ctx = this.canvas.getContext('2d')!;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = THREE.LinearFilter;

    // Initial render
    this.drawText(this.currentText);

    // 2. Plane Geometry (width: 8.5 units, height: 2.1 units)
    const planeGeo = new THREE.PlaneGeometry(8.5, 2.1);

    // 3. MeshBasicMaterial
    // Must be in transmission pass: renderOrder < crystal's renderOrder
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      opacity: 0.95,
    });

    this.mesh = new THREE.Mesh(planeGeo, this.material);
    // Positioned directly behind the crystal (crystal is at z = 0, text is at z = -1.5)
    this.mesh.position.set(0, 0.1, -1.5);
    this.mesh.renderOrder = -1; // Ensures it renders BEFORE transmissive crystal
    scene.add(this.mesh);
  }

  public setText(text: string) {
    if (this.currentText === text) return;
    this.currentText = text;
    this.drawText(this.currentText);
  }

  public setOpacity(opacity: number) {
    this.targetOpacity = Math.max(0, Math.min(1, opacity));
    this.material.opacity = this.targetOpacity;
    this.mesh.visible = this.targetOpacity > 0.01;
  }

  private drawText(text: string) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.clearRect(0, 0, w, h);

    // Subtle soft back glow behind text
    const grad = this.ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, 450);
    grad.addColorStop(0, 'rgba(159, 196, 255, 0.14)');
    grad.addColorStop(0.5, 'rgba(212, 176, 106, 0.05)');
    grad.addColorStop(1, 'transparent');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);

    // Draw typography
    this.ctx.fillStyle = TOKENS.colors.white;
    this.ctx.font = '200 170px "Hanken Grotesk", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Letter-spacing simulation for 2D canvas
    const spaced = text.split('').join(String.fromCharCode(8202) + String.fromCharCode(8202));
    this.ctx.fillText(spaced, w / 2, h / 2 + 10);

    this.texture.needsUpdate = true;
  }

  public update(aspect: number) {
    // Adapt plane width based on viewport aspect ratio
    const baseWidth = aspect < 1.0 ? 5.8 : 8.5;
    const baseHeight = baseWidth * (512 / 2048);
    this.mesh.scale.set(baseWidth / 8.5, baseHeight / 2.1, 1);
  }

  public dispose() {
    this.texture.dispose();
    this.material.dispose();
    this.mesh.geometry.dispose();
  }
}
