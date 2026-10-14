/**
 * Unlupa.id - Grid Axes for Scene 2 (Masalah)
 * 
 * Renders very thin grid guidelines (ice2, alpha ~0.15) for the memory retention plane:
 * - 5 horizontal lines (100%, 75%, 50%, 25%, 0%)
 * - 1 base vertical axis
 * - 4 milestone marker ticks at s = 0.12, 0.38, 0.66, 0.94
 * - World position accessors for HTML overlay projection
 */

import * as THREE from 'three';
import { TOKENS } from '../config';

export interface MilestoneMarker {
  key: string;
  s: number;
  label: string;
  worldPos: THREE.Vector3;
}

export class GridAxes {
  public group: THREE.Group;
  private linesMesh: THREE.LineSegments;
  private material: THREE.LineBasicMaterial;
  private baseAlpha: number = 0.18;

  // Grid bounds in 3D world
  public xMin: number = -4.6;
  public xMax: number = 1.6;
  public yMax: number = 1.9;  // 100%
  public yMin: number = -1.6; // 0%

  public milestones: MilestoneMarker[] = [
    { key: 'm1', s: 0.12, label: '20 MENIT', worldPos: new THREE.Vector3() },
    { key: 'm2', s: 0.38, label: '1 HARI', worldPos: new THREE.Vector3() },
    { key: 'm3', s: 0.66, label: '1 MINGGU', worldPos: new THREE.Vector3() },
    { key: 'm4', s: 0.94, label: '1 BULAN', worldPos: new THREE.Vector3() },
  ];

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();

    this.material = new THREE.LineBasicMaterial({
      color: new THREE.Color(TOKENS.colors.ice2),
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const positions = this.buildGridPositions();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    this.linesMesh = new THREE.LineSegments(geo, this.material);
    this.group.add(this.linesMesh);

    this.updateMilestonePositions();

    scene.add(this.group);
  }

  private buildGridPositions(): number[] {
    const coords: number[] = [];

    // 1. Five horizontal guideline lines (100%, 75%, 50%, 25%, 0%)
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      const y = this.yMin + (this.yMax - this.yMin) * t;
      coords.push(this.xMin, y, 0);
      coords.push(this.xMax, y, 0);
    }

    // 2. Base vertical line at xMin
    coords.push(this.xMin, this.yMin, 0);
    coords.push(this.xMin, this.yMax, 0);

    // 3. Milestone vertical tick dashes
    for (const ms of this.milestones) {
      const x = this.xMin + (this.xMax - this.xMin) * ms.s;
      coords.push(x, this.yMin - 0.12, 0);
      coords.push(x, this.yMin + 0.08, 0);
    }

    return coords;
  }

  private updateMilestonePositions() {
    for (const ms of this.milestones) {
      const x = this.xMin + (this.xMax - this.xMin) * ms.s;
      ms.worldPos.set(x, this.yMin - 0.25, 0);
    }
  }

  public setOpacity(opacity: number) {
    this.material.opacity = Math.max(0, Math.min(1, opacity)) * this.baseAlpha;
  }

  public updateLayout(aspect: number) {
    if (aspect < 1.0) {
      this.xMin = -2.2;
      this.xMax = 2.0;
      this.yMax = 0.7;
      this.yMin = -1.3;
    } else {
      this.xMin = -4.6;
      this.xMax = 1.6;
      this.yMax = 1.9;
      this.yMin = -1.6;
    }

    const pos = this.buildGridPositions();
    this.linesMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.linesMesh.geometry.attributes.position.needsUpdate = true;
    this.updateMilestonePositions();
  }

  public dispose() {
    this.linesMesh.geometry.dispose();
    this.material.dispose();
  }
}
