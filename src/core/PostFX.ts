/**
 * Post-Processing Pipeline for Unlupa.id
 *
 * Pipeline:
 * RenderPass
 * -> UnrealBloomPass (strength: 0.35, radius: 0.7, threshold: 0.82)
 * -> Custom Cinema ShaderPass:
 *    - Radial chromatic aberration (idle: 0.0012, intro: 0.014, dynamic velocity response)
 *    - Animated subtle film grain (0.05)
 *    - Cinematic vignette (0.35)
 *    - Frost creeping border (uFrost 0-1 for scene transitions)
 * -> OutputPass (tone mapping and color space)
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { QualityConfig } from '../config';

export class PostFX {
  public composer: EffectComposer;
  public bloomPass: UnrealBloomPass;
  public customPass: ShaderPass;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    quality: QualityConfig
  ) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Set up EffectComposer
    this.composer = new EffectComposer(renderer);

    // 1. RenderPass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // 2. UnrealBloomPass
    const bloomRes = new THREE.Vector2(
      width * quality.bloomResolutionScale,
      height * quality.bloomResolutionScale
    );
    this.bloomPass = new UnrealBloomPass(bloomRes, 0.35, 0.7, 0.82);
    this.bloomPass.enabled = quality.bloom;
    this.composer.addPass(this.bloomPass);

    // 3. Custom Cinema ShaderPass (Aberration, Film Grain, Vignette, Frost Edge)
    const CinemaShader = {
      name: 'CinemaShader',
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uAberration: { value: 0.0012 },
        uGrainAmount: { value: 0.045 },
        uVignetteDarkness: { value: 0.35 },
        uFrost: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform float uAberration;
        uniform float uGrainAmount;
        uniform float uVignetteDarkness;
        uniform float uFrost;
        varying vec2 vUv;

        // Fast high-frequency noise for cinematic film grain
        float rand(vec2 co) {
          return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          vec2 uv = vUv;
          vec2 center = vec2(0.5);
          vec2 dir = uv - center;
          float dist = length(dir);

          // 1. Radial Chromatic Aberration
          vec2 caOffset = dir * dist * uAberration;
          float r = texture2D(tDiffuse, uv + caOffset).r;
          float g = texture2D(tDiffuse, uv).g;
          float b = texture2D(tDiffuse, uv - caOffset).b;
          vec3 color = vec3(r, g, b);

          // 2. Cinematic Vignette
          float vignette = smoothstep(0.85, 0.25, dist);
          color *= mix(1.0 - uVignetteDarkness, 1.0, vignette);

          // 3. Animated Film Grain
          float grain = (rand(uv + fract(uTime * 17.13)) - 0.5) * uGrainAmount;
          color += grain;

          // 4. Procedural Frost Dissolve from Screen Edges (uFrost)
          if (uFrost > 0.001) {
            float edgeDist = max(abs(uv.x - 0.5), abs(uv.y - 0.5)) * 2.0; // 0 at center, 1 at edge
            float frostNoise = rand(uv * 14.0 + fract(uTime * 0.1));
            float frostMask = smoothstep(1.0 - uFrost * 1.2, 1.0, edgeDist + (frostNoise - 0.5) * 0.2);
            vec3 frostColor = vec3(0.75, 0.85, 1.0);
            color = mix(color, frostColor, frostMask * 0.75);
          }

          gl_FragColor = vec4(color, 1.0);
        }
      `
    };

    this.customPass = new ShaderPass(CinemaShader);
    this.composer.addPass(this.customPass);

    // 4. OutputPass (Tone mapping & sRGB output)
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  public setAberration(val: number) {
    this.customPass.uniforms.uAberration.value = val;
  }

  public setFrost(val: number) {
    this.customPass.uniforms.uFrost.value = val;
  }

  public setBloomStrength(val: number) {
    this.bloomPass.strength = val;
  }

  public update(dt: number, time: number, scrollVelocity: number) {
    this.customPass.uniforms.uTime.value = time;

    // Dynamic aberration based on scroll velocity (idle 0.0012, capped at 0.006)
    const dynamicAberration = 0.0012 + Math.min(0.0048, Math.abs(scrollVelocity) * 0.0004);
    // Smooth lerp to dynamic aberration unless overriden by intro
    const current = this.customPass.uniforms.uAberration.value;
    if (current < 0.007) {
      this.customPass.uniforms.uAberration.value = THREE.MathUtils.lerp(current, dynamicAberration, 0.1);
    }
  }

  public setSize(width: number, height: number) {
    this.composer.setSize(width, height);
  }

  public render() {
    this.composer.render();
  }

  public dispose() {
    // Passes don't need complex disposal, composer can be cleaned
  }
}
