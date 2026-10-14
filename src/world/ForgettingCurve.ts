/**
 * Unlupa.id - Forgetting Curve (Kurva Lupa Ebbinghaus)
 * 
 * Render:
 * - TubeGeometry along procedural exponential decay path:
 *   y(s) = y0 - (y0 - y1) * (1 - exp(-k*s)) / (1 - exp(-k)), k = 4.2
 * - Additive custom ShaderMaterial with progressive uDraw cutoff,
 *   gradient from luminous iceGlow to dim ice2, and luminous head point.
 * - Soft secondary halo tube in high quality tier.
 * - Expanding ring pulse on head crossing milestones.
 * - Exports standalone getValueAt(s) function for retrievability synchronization.
 */

import * as THREE from 'three';
import { TOKENS, QualityConfig } from '../config';

/**
 * Standalone retrievability calculation function:
 * Evaluates memory retention R in [1.0 -> ~0.18] along curve progress s in [0, 1].
 * Formula: R(s) = 1.0 - (1.0 - 0.18) * (1 - exp(-k*s)) / (1 - exp(-k)), default k = 4.2.
 */
export function getValueAt(s: number, k: number = 4.2): number {
  const clampedS = Math.max(0, Math.min(1, s));
  const denom = 1.0 - Math.exp(-k);
  const decayFactor = (1.0 - Math.exp(-k * clampedS)) / denom;
  return 1.0 - (1.0 - 0.18) * decayFactor;
}

export class ForgettingCurve {
  public group: THREE.Group;
  public mainTubeMesh: THREE.Mesh;
  public haloTubeMesh: THREE.Mesh | null = null;
  public headMesh: THREE.Mesh;
  public pulseRing: THREE.LineLoop;

  private mainMaterial: THREE.ShaderMaterial;
  private haloMaterial: THREE.ShaderMaterial | null = null;
  private headMaterial: THREE.MeshBasicMaterial;
  private pulseMaterial: THREE.LineBasicMaterial;

  private curvePath: THREE.CatmullRomCurve3;
  private points: THREE.Vector3[] = [];
  private k: number = 4.2;

  // Coordinate boundaries
  // Desktop: curve spans prominently across center-left
  private pStart: THREE.Vector3 = new THREE.Vector3(-4.4, 1.85, 0.0);
  private pEnd: THREE.Vector3 = new THREE.Vector3(1.7, -1.55, 0.0);

  constructor(scene: THREE.Scene, quality: QualityConfig) {
    this.group = new THREE.Group();

    // 1. Build curve coordinates
    const segments = 400;
    this.points = [];
    for (let i = 0; i <= segments; i++) {
      const s = i / segments;
      const pt = this.computePointAt(s);
      this.points.push(pt);
    }
    this.curvePath = new THREE.CatmullRomCurve3(this.points);

    // 2. Main Tube Geometry & Custom Additive Shader
    const tubeGeo = new THREE.TubeGeometry(this.curvePath, 400, 0.022, 6, false);

    this.mainMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uDraw: { value: 0.0 },
        uOpacity: { value: 1.0 },
        uColorStart: { value: new THREE.Color(TOKENS.colors.iceGlow) },
        uColorEnd: { value: new THREE.Color(TOKENS.colors.ice2) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uDraw;
        uniform float uOpacity;
        uniform vec3 uColorStart;
        uniform vec3 uColorEnd;
        varying vec2 vUv;

        void main() {
          float s = vUv.x;
          // Cut off ahead of uDraw
          if (s > uDraw) {
            discard;
          }

          // Gradient from luminous iceGlow (start) to dim ice2 (end)
          vec3 baseColor = mix(uColorStart, uColorEnd, pow(s, 0.85));

          // Head glow highlight at the current leading tip
          float distToHead = abs(s - uDraw);
          float headGlow = smoothstep(0.05, 0.0, distToHead) * 3.2;

          vec3 finalColor = baseColor + vec3(0.9, 0.95, 1.0) * headGlow;
          float alpha = uOpacity * (0.88 + headGlow * 0.45);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `
    });

    this.mainTubeMesh = new THREE.Mesh(tubeGeo, this.mainMaterial);
    this.group.add(this.mainTubeMesh);

    // 3. Soft Halo Tube in High Quality Tier
    if (quality.tier === 'HIGH') {
      const haloGeo = new THREE.TubeGeometry(this.curvePath, 300, 0.054, 6, false);
      this.haloMaterial = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uDraw: { value: 0.0 },
          uOpacity: { value: 0.32 },
          uColorStart: { value: new THREE.Color(TOKENS.colors.iceGlow) },
          uColorEnd: { value: new THREE.Color(0x1a263d) },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uDraw;
          uniform float uOpacity;
          uniform vec3 uColorStart;
          uniform vec3 uColorEnd;
          varying vec2 vUv;

          void main() {
            float s = vUv.x;
            if (s > uDraw) discard;
            vec3 col = mix(uColorStart, uColorEnd, s);
            gl_FragColor = vec4(col, uOpacity * (1.0 - s * 0.5));
          }
        `
      });
      this.haloTubeMesh = new THREE.Mesh(haloGeo, this.haloMaterial);
      this.group.add(this.haloTubeMesh);
    }

    // 4. Head Glow Point at Curve Tip
    const headGeo = new THREE.SphereGeometry(0.055, 16, 16);
    this.headMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xffffff),
      transparent: true,
      opacity: 0.0,
    });
    this.headMesh = new THREE.Mesh(headGeo, this.headMaterial);
    this.group.add(this.headMesh);

    // 5. Head Expanding Pulse Ring (triggered at milestones)
    const ringPts: THREE.Vector3[] = [];
    const ringSegs = 36;
    for (let i = 0; i <= ringSegs; i++) {
      const th = (i / ringSegs) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(th) * 0.12, Math.sin(th) * 0.12, 0));
    }
    const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
    this.pulseMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(TOKENS.colors.gold),
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    this.pulseRing = new THREE.LineLoop(ringGeo, this.pulseMaterial);
    this.group.add(this.pulseRing);

    scene.add(this.group);
  }

  /**
   * Exponential decay function:
   * y(s) = y0 - (y0 - y1) * (1 - exp(-k*s)) / (1 - exp(-k))
   */
  public computePointAt(s: number): THREE.Vector3 {
    const clampedS = Math.max(0, Math.min(1, s));
    const denom = 1.0 - Math.exp(-this.k);
    const decayFactor = (1.0 - Math.exp(-this.k * clampedS)) / denom;

    const x = this.pStart.x + (this.pEnd.x - this.pStart.x) * clampedS;
    const y = this.pStart.y - (this.pStart.y - this.pEnd.y) * decayFactor;
    const z = 0.0;

    return new THREE.Vector3(x, y, z);
  }

  /**
   * Returns Retrievability R in range [1.0 -> ~0.18]
   */
  public getValueAt(s: number): number {
    return getValueAt(s, this.k);
  }

  /**
   * Animates the curve drawing along with localProgress in [0, 1]
   * and returns current retrievability value.
   */
  public animateWithLocalProgress(localProgress: number): number {
    this.setDraw(localProgress);
    return this.getValueAt(localProgress);
  }

  /**
   * Updates line drawing progress uDraw in [0, 1]
   */
  public setDraw(progress: number) {
    const p = Math.max(0, Math.min(1, progress));
    this.mainMaterial.uniforms.uDraw.value = p;
    if (this.haloMaterial) {
      this.haloMaterial.uniforms.uDraw.value = p;
    }

    // Position head point and pulse ring at current tip of curve
    const headPos = this.computePointAt(p);
    this.headMesh.position.copy(headPos);
    this.pulseRing.position.copy(headPos);

    // Head is visible when curve has started drawing
    this.headMaterial.opacity = p > 0.005 ? 1.0 : 0.0;
  }

  public setOpacity(opacity: number) {
    const alpha = Math.max(0, Math.min(1, opacity));
    this.mainMaterial.uniforms.uOpacity.value = alpha;
    if (this.haloMaterial) {
      this.haloMaterial.uniforms.uOpacity.value = alpha * 0.32;
    }
    this.headMaterial.opacity = Math.min(this.headMaterial.opacity, alpha);
  }

  public setPulseRing(scale: number, alpha: number) {
    this.pulseRing.scale.set(scale, scale, scale);
    this.pulseMaterial.opacity = Math.max(0, Math.min(1, alpha));
  }

  public getHeadPosition(): THREE.Vector3 {
    return this.headMesh.position;
  }

  public updateLayout(aspect: number) {
    // For mobile portrait (< 1.0), adjust curve endpoints to span neatly across center
    if (aspect < 1.0) {
      this.pStart.set(-2.2, 0.7, 0);
      this.pEnd.set(2.0, -1.3, 0);
    } else {
      this.pStart.set(-4.4, 1.85, 0);
      this.pEnd.set(1.7, -1.55, 0);
    }
  }

  public dispose() {
    this.mainTubeMesh.geometry.dispose();
    this.mainMaterial.dispose();
    if (this.haloTubeMesh && this.haloMaterial) {
      this.haloTubeMesh.geometry.dispose();
      this.haloMaterial.dispose();
    }
    this.headMesh.geometry.dispose();
    this.headMaterial.dispose();
    this.pulseRing.geometry.dispose();
    this.pulseMaterial.dispose();
  }
}
