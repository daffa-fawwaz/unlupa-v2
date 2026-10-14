/**
 * Unlupa.id - Falling Memory Motes
 * 
 * ~200 Points (60 in LOW quality tier) that shed from the forgetting curve's leading head,
 * drifting downward with subtle turbulence and fading away.
 * 
 * DETERMINISTIC IMPLEMENTATION:
 * Point positions and life states are evaluated purely as functions of curve progress 's' and
 * pseudo-random static seeds, ensuring 100% reversible scroll scrubbing without temporal drifting.
 */

import * as THREE from 'three';
import { TOKENS, QualityConfig } from '../config';

export class FallingMotes {
  public points: THREE.Points;
  private material: THREE.ShaderMaterial;
  private count: number;

  constructor(scene: THREE.Scene, quality: QualityConfig) {
    this.count = quality.tier === 'LOW' ? 60 : 200;

    const positions = new Float32Array(this.count * 3);
    const seeds = new Float32Array(this.count * 4); // [spawnS, lateralOffset, fallSpeed, lifetime]

    for (let i = 0; i < this.count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      // Even distribution across the curve lifecycle s in [0, 1]
      const spawnS = (i + Math.random()) / this.count;
      const lateral = (Math.random() - 0.5) * 0.45;
      const fallSpeed = 0.8 + Math.random() * 1.4;
      const lifetime = 0.12 + Math.random() * 0.18; // active span in progress units

      seeds[i * 4] = spawnS;
      seeds[i * 4 + 1] = lateral;
      seeds[i * 4 + 2] = fallSpeed;
      seeds[i * 4 + 3] = lifetime;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uCurveProgress: { value: 0.0 },
        uOpacity: { value: 0.0 },
        uColor: { value: new THREE.Color(TOKENS.colors.iceGlow) },
      },
      vertexShader: `
        uniform float uCurveProgress;
        uniform float uOpacity;
        attribute vec4 aSeed; // x: spawnS, y: lateral, z: fallSpeed, w: lifetime
        varying float vAlpha;

        void main() {
          float spawnS = aSeed.x;
          float lateral = aSeed.y;
          float speed = aSeed.z;
          float lifetime = aSeed.w;

          // Deterministic age delta relative to current curve scrub progress
          float age = uCurveProgress - spawnS;

          if (age < 0.0 || age > lifetime || uOpacity < 0.001) {
            // Inactive / unspawned
            gl_Position = vec4(999.0, 999.0, 999.0, 1.0);
            vAlpha = 0.0;
            return;
          }

          float normAge = age / lifetime; // 0 (born) to 1 (dead)

          // Exponential curve base position where this mote was born
          float k = 4.2;
          float denom = 1.0 - exp(-k);
          float decay = (1.0 - exp(-k * spawnS)) / denom;

          float birthX = -4.6 + (1.6 - (-4.6)) * spawnS;
          float birthY = 1.9 - (1.9 - (-1.6)) * decay;

          vec3 pos = vec3(birthX, birthY, 0.0);

          // Deterministic downward drift with harmonic turbulence
          pos.y -= normAge * speed * 1.35;
          pos.x += lateral + sin(normAge * 6.28 + spawnS * 20.0) * 0.12;
          pos.z += cos(normAge * 5.0 + spawnS * 15.0) * 0.15;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Fade in quickly, fade out gracefully
          float lifeAlpha = sin(normAge * 3.14159);
          vAlpha = lifeAlpha * uOpacity * 0.85;

          gl_PointSize = (1.0 - normAge * 0.5) * (45.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(uColor, vAlpha * strength);
        }
      `
    });

    this.points = new THREE.Points(geometry, this.material);
    this.points.renderOrder = 15;
    scene.add(this.points);
  }

  public setProgress(curveProgress: number) {
    this.material.uniforms.uCurveProgress.value = Math.max(0, Math.min(1, curveProgress));
  }

  public setOpacity(opacity: number) {
    this.material.uniforms.uOpacity.value = Math.max(0, Math.min(1, opacity));
  }

  public dispose() {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}
