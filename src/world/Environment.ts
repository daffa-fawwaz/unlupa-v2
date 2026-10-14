/**
 * Procedural Studio Environment & Atmosphere
 * Generates an HDRI-grade lighting probe without external files using PMREMGenerator.
 * Features background vertical gradient, subtle abyss fog, and an animated procedural fBm frost mist quad.
 */

import * as THREE from 'three';
import { TOKENS } from '../config';

export class Environment {
  public envMap: THREE.WebGLRenderTarget | null = null;
  public mistQuad: THREE.Mesh;
  public bgMesh: THREE.Mesh;
  private mistMaterial: THREE.ShaderMaterial;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    // 1. Procedural Environment Map via PMREMGenerator from an emissive light-stage
    this.envMap = this.generateProceduralEnvMap(renderer);
    scene.environment = this.envMap.texture;

    // 2. Subtle Abyss Fog
    scene.fog = new THREE.FogExp2(new THREE.Color(TOKENS.colors.bg0), 0.038);

    // 3. Background Vertical Gradient Plane (bg-1 at top down to bg-0 at bottom)
    const bgGeo = new THREE.PlaneGeometry(35, 25);
    const bgMat = new THREE.ShaderMaterial({
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uColorTop: { value: new THREE.Color(TOKENS.colors.bg1) },
        uColorBottom: { value: new THREE.Color(TOKENS.colors.bg0) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorTop;
        uniform vec3 uColorBottom;
        varying vec2 vUv;
        void main() {
          // Vertical non-linear atmospheric gradient
          float t = smoothstep(0.0, 1.0, vUv.y);
          vec3 col = mix(uColorBottom, uColorTop, t);
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    this.bgMesh = new THREE.Mesh(bgGeo, bgMat);
    this.bgMesh.position.set(0, 0, -6);
    this.bgMesh.renderOrder = -100;
    scene.add(this.bgMesh);

    // 4. Subtle fBm Frost Mist Quad (opacity ~0.06 with slow drift)
    const mistGeo = new THREE.PlaneGeometry(24, 18);
    this.mistMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(TOKENS.colors.iceGlow) },
        uOpacity: { value: 0.06 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;

        // Simplex/fBm procedural noise
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m;
          m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amp = 0.5;
          for (int i = 0; i < 3; i++) {
            value += amp * snoise(p);
            p *= 2.1;
            amp *= 0.5;
          }
          return value;
        }

        void main() {
          vec2 uv = vUv * 2.5;
          float drift = uTime * 0.035;
          float n = fbm(uv + vec2(drift, drift * 0.6));
          
          // Vignette edge mask so mist stays centered
          float dist = distance(vUv, vec2(0.5));
          float mask = smoothstep(0.65, 0.2, dist);

          float alpha = smoothstep(-0.2, 0.7, n) * uOpacity * mask;
          gl_FragColor = vec4(uColor, alpha);
        }
      `
    });

    this.mistQuad = new THREE.Mesh(mistGeo, this.mistMaterial);
    this.mistQuad.position.set(0, 0, -3.5);
    this.mistQuad.renderOrder = -50;
    scene.add(this.mistQuad);
  }

  /**
   * Generates a realistic high-dynamic-range reflection probe using 3 emissive panels:
   * 1. Cold pure white panel
   * 2. Arctic ice-blue panel
   * 3. Small warm sacred gold panel
   */
  private generateProceduralEnvMap(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(TOKENS.colors.bg0);

    // Panel 1: Cold White Key Panel (top right)
    const panelGeo1 = new THREE.PlaneGeometry(12, 12);
    const panelMat1 = new THREE.MeshBasicMaterial({ color: 0xe8ecf5 });
    const p1 = new THREE.Mesh(panelGeo1, panelMat1);
    p1.position.set(10, 10, 8);
    p1.lookAt(0, 0, 0);
    envScene.add(p1);

    // Panel 2: Ice Blue Fill Panel (left)
    const panelGeo2 = new THREE.PlaneGeometry(14, 14);
    const panelMat2 = new THREE.MeshBasicMaterial({ color: 0x9fc4ff });
    const p2 = new THREE.Mesh(panelGeo2, panelMat2);
    p2.position.set(-12, 2, 4);
    p2.lookAt(0, 0, 0);
    envScene.add(p2);

    // Panel 3: Small Warm Sacred Gold Accent Panel (back lower left)
    const panelGeo3 = new THREE.PlaneGeometry(4, 4);
    const panelMat3 = new THREE.MeshBasicMaterial({ color: 0xd4b06a });
    const p3 = new THREE.Mesh(panelGeo3, panelMat3);
    p3.position.set(-6, -6, -8);
    p3.lookAt(0, 0, 0);
    envScene.add(p3);

    const renderTarget = pmremGenerator.fromScene(envScene, 0.04);
    pmremGenerator.dispose();
    return renderTarget;
  }

  public update(dt: number) {
    this.mistMaterial.uniforms.uTime.value += dt;
  }

  public dispose() {
    if (this.envMap) {
      this.envMap.dispose();
      this.envMap = null;
    }
  }
}
