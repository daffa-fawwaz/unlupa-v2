/**
 * Floating Ice Dust & Micro-Particulates
 * ~700 Points drifting in 3D noise field with velocity responsiveness and dispersion capabilities.
 */

import * as THREE from 'three';
import { TOKENS } from '../config';

export class Dust {
  public points: THREE.Points;
  private material: THREE.ShaderMaterial;
  private count: number;

  constructor(scene: THREE.Scene, count: number = 700) {
    this.count = count;

    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const alphas = new Float32Array(count);
    const seeds = new Float32Array(count * 3);

    // Spread dust in a volume around the crystal
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 14;
      positions[i3 + 1] = (Math.random() - 0.5) * 10;
      positions[i3 + 2] = (Math.random() - 0.5) * 12;

      scales[i] = 1.0 + Math.random() * 2.2;
      alphas[i] = 0.15 + Math.random() * 0.35;

      seeds[i3] = Math.random() * 10.0;
      seeds[i3 + 1] = Math.random() * 10.0;
      seeds[i3 + 2] = Math.random() * 10.0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 1.0 },
        uDisperse: { value: 0.0 },
        uColor: { value: new THREE.Color(TOKENS.colors.ice1) },
        uGlowColor: { value: new THREE.Color(TOKENS.colors.iceGlow) },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uSpeed;
        uniform float uDisperse;
        attribute float aScale;
        attribute float aAlpha;
        attribute vec3 aSeed;
        varying float vAlpha;

        void main() {
          vec3 pos = position;
          
          // Slow 3D drift using sine/cosine combinations
          float t = uTime * 0.18 * uSpeed;
          pos.x += sin(t + aSeed.x * 6.28) * 0.35;
          pos.y += cos(t * 0.8 + aSeed.y * 6.28) * 0.45;
          pos.z += sin(t * 0.6 + aSeed.z * 6.28) * 0.35;

          // Radial dispersion when uDisperse > 0 (dissolving memory mist around crystal)
          if (uDisperse > 0.001) {
            vec3 dispDir = normalize(pos + vec3(0.001));
            pos += dispDir * (uDisperse * 3.5);
          }

          // Wrap boundaries
          if (pos.y > 6.0) pos.y = -6.0;
          if (pos.y < -6.0) pos.y = 6.0;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Size attenuation
          float finalScale = aScale * (1.0 + uDisperse * 0.8);
          gl_PointSize = finalScale * (120.0 / -mvPosition.z);
          vAlpha = aAlpha * (1.0 - uDisperse * 0.3);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uGlowColor;
        varying float vAlpha;

        void main() {
          // Soft circular point sprite
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          vec3 finalColor = mix(uColor, uGlowColor, strength * 0.5);

          gl_FragColor = vec4(finalColor, vAlpha * strength);
        }
      `
    });

    this.points = new THREE.Points(geometry, this.material);
    this.points.renderOrder = 1;
    scene.add(this.points);
  }

  public setDisperse(val: number) {
    this.material.uniforms.uDisperse.value = Math.max(0, Math.min(1, val));
  }

  public setSpeed(val: number) {
    this.material.uniforms.uSpeed.value = val;
  }

  public update(dt: number, scrollVelocity: number) {
    this.material.uniforms.uTime.value += dt;
    // Speed increases with scroll velocity
    const targetSpeed = 1.0 + Math.min(4.0, Math.abs(scrollVelocity) * 0.8);
    this.material.uniforms.uSpeed.value = targetSpeed;
  }

  public dispose() {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}
