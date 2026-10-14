/**
 * Unlupa.id - 3D Neural Brain of Knowledge & Sacred Memory
 * (Otak Kristal Kognitif & Jaringan Sinapsis Penjaga Ilmu)
 * 
 * Merepresentasikan hakikat "OTAK & INGATAN" (The Seat of Adaptive Memory):
 * 1. Korteks Serebral Dua Hemisfer (Left & Right Cerebral Hemispheres):
 *    - Lipatan girus dan sulkus korteks yang anggun dan jelas terbagi oleh celah longitudinal.
 *    - Dibalut material kristal kognitif transparan dengan pembiasan optik fisik (transmission, IOR, iridescence)
 *      yang membiaskan teks latar belakang "UNLUPA" secara nyata.
 * 2. Jaringan Sinapsis & Akson Kortikal (Cortical Synapses & Axons):
 *    - 68 titik sinapsis pendar ingatan (titik hafalan ayat / konsep ilmu).
 *    - Jalur saraf bercahaya yang menghubungkan kedua belahan otak.
 * 3. Impuls Transmisi Kognitif (Action Potential Sparks):
 *    - Percikan pulsa cahaya memori yang meluncur aktif di sepanjang lipatan korteks.
 * 4. Inti Kesadaran & Nurani (Corpus Callosum Memory Soul Core):
 *    - Pendar batin di pusat otak yang berdenyut lembut (heartbeat pulse).
 * 5. Cincin Orbital Retensi Adaptif (Adaptive Retention Gyroscopic Rings):
 *    - Cincin giroskopik konsolidasi interval ingatan (harian, mingguan, bulanan) mengelilingi otak.
 * 6. Shaders Interaktif & Dynamic Degradation (Scene 2 Masalah):
 *    - uGrow: Tumbuh dari benih pikiran awal menjadi struktur otak utuh yang megah.
 *    - uIntegrity: 1.0 = ingatan kokoh & sinapsis terang; < 1.0 = sinapsis redup & retakan lupa.
 *    - uDissolve: Pelarutan partikular menjadi kabut lupa.
 *    - uGold: Transformasi emas mutqin saat muraja'ah berhasil dikonsolidasikan.
 *    - Shard dispersion & micro-crack vibration untuk degradasi kurva lupa.
 */

import * as THREE from 'three';
import { TOKENS, QualityConfig } from '../config';
import { createBrainGeometry } from './BrainGeometry';

export class Crystal {
  public group: THREE.Group;
  public mainMesh: THREE.Mesh;
  public secondaryMeshes: THREE.Mesh[] = [];
  public instancedShards: THREE.InstancedMesh;
  public coreLight: THREE.PointLight;
  public coreMesh: THREE.Mesh;

  // Neural Brain Components
  public brainGroup: THREE.Group;
  public neuralLines: THREE.LineSegments;
  public neuralNodes: THREE.Points;
  public impulsePoints: THREE.Points;
  public memoryRingsGroup: THREE.Group;

  public material: THREE.MeshPhysicalMaterial;
  private neuralLinesMaterial: THREE.LineBasicMaterial;
  private neuralNodesMaterial: THREE.PointsMaterial;
  private impulseMaterial: THREE.PointsMaterial;
  private ringMaterials: THREE.LineBasicMaterial[] = [];

  private uniforms: {
    uGrow: { value: number };
    uIntegrity: { value: number };
    uDissolve: { value: number };
    uGold: { value: number };
    uTime: { value: number };
    uMicroCrack: { value: number };
  };

  private secondaryTargetScales: number[] = [];
  private secondaryDelays: number[] = [];
  private secondaryBasePositions: THREE.Vector3[] = [];
  private secondaryBaseRotations: THREE.Euler[] = [];

  // Synaptic impulse trajectory data across the brain
  private impulseTracks: {
    from: THREE.Vector3;
    to: THREE.Vector3;
    progress: number;
    speed: number;
  }[] = [];

  // Memory rings reference for gyroscopic rotation
  private memoryRings: THREE.LineLoop[] = [];

  // Core pulse frequency (1.0 Hz down to 0.25 Hz in Scene 2)
  private corePulseRate: number = 1.0;
  private baseCoreIntensity: number = 2.5;

  constructor(scene: THREE.Scene, quality: QualityConfig) {
    this.group = new THREE.Group();
    // Positioned so the cerebral center aligns perfectly with the camera eye line
    this.group.position.set(0, -0.05, 0);

    this.uniforms = {
      uGrow: { value: 0.0 },
      uIntegrity: { value: 1.0 },
      uDissolve: { value: 0.0 },
      uGold: { value: 0.0 },
      uTime: { value: 0.0 },
      uMicroCrack: { value: 0.0 },
    };

    // =========================================================================
    // 1. PHYSICAL LUMINESCENT BRAIN GLASS (Optical Refraction & Iridescence)
    // =========================================================================
    this.material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xf0f7ff),
      transmission: quality.transmission ? 0.98 : 0.0,
      opacity: quality.transmission ? 1.0 : 0.88,
      transparent: true,
      thickness: 1.45,
      ior: 1.34, // Refraction index of cognitive crystalline glass
      roughness: 0.07,
      metalness: 0.04,
      iridescence: 0.7,
      iridescenceIOR: 1.38,
      attenuationColor: new THREE.Color(TOKENS.colors.iceGlow),
      attenuationDistance: 2.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.8,
      side: THREE.DoubleSide,
    });

    this.enhanceMemoryShader(this.material);

    // =========================================================================
    // 2. PROCEDURAL CEREBRAL CORTEX (Struktur Otak Dua Hemisfer)
    // =========================================================================
    this.brainGroup = new THREE.Group();
    this.brainGroup.position.set(0, 0.1, 0);

    const brainData = createBrainGeometry(1.35);

    this.mainMesh = new THREE.Mesh(brainData.cortexGeometry, this.material);
    this.mainMesh.castShadow = true;
    this.mainMesh.receiveShadow = true;
    this.mainMesh.renderOrder = 10;
    this.mainMesh.scale.set(0, 0, 0);
    // Orient brain slightly tilted for majestic editorial viewing angle
    this.mainMesh.rotation.set(0.12, -0.25, 0.05);
    this.brainGroup.add(this.mainMesh);

    // =========================================================================
    // 3. INNER SOUL / COGNITIVE SEED (Pusat Pendar Pikiran di Corpus Callosum)
    // =========================================================================
    this.coreLight = new THREE.PointLight(new THREE.Color(TOKENS.colors.iceGlow), 0.0, 6.0);
    this.coreLight.position.set(0, 0, 0);
    this.brainGroup.add(this.coreLight);

    const coreGeo = new THREE.SphereGeometry(0.25, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(TOKENS.colors.iceGlow),
      transparent: true,
      opacity: 0.0,
    });
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.coreMesh.position.set(0, 0, 0);
    this.brainGroup.add(this.coreMesh);

    // =========================================================================
    // 4. NEURAL CORTICAL SYNAPSES & AXONS (Jaringan Saraf di Permukaan Otak)
    // =========================================================================
    const linesGeo = new THREE.BufferGeometry();
    linesGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(brainData.synapseConnections, 3)
    );

    this.neuralLinesMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(0x6ed6ff),
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      linewidth: 1,
    });
    this.neuralLines = new THREE.LineSegments(linesGeo, this.neuralLinesMaterial);
    this.brainGroup.add(this.neuralLines);

    // Synaptic nodes (glowing points of memory & hafalan)
    const nodesGeo = new THREE.BufferGeometry();
    const nodeCoords: number[] = [];
    for (const pt of brainData.synapsePositions) {
      nodeCoords.push(pt.x, pt.y, pt.z);
    }
    nodesGeo.setAttribute('position', new THREE.Float32BufferAttribute(nodeCoords, 3));

    this.neuralNodesMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(0xe5f6ff),
      size: 0.08,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      map: this.createGlowDotTexture(),
      depthWrite: false,
    });
    this.neuralNodes = new THREE.Points(nodesGeo, this.neuralNodesMaterial);
    this.brainGroup.add(this.neuralNodes);

    // Action potential impulse sparks traveling across brain synapses
    for (let i = 0; i < brainData.synapseConnections.length; i += 6) {
      if (this.impulseTracks.length < 36) {
        this.impulseTracks.push({
          from: new THREE.Vector3(
            brainData.synapseConnections[i],
            brainData.synapseConnections[i + 1],
            brainData.synapseConnections[i + 2]
          ),
          to: new THREE.Vector3(
            brainData.synapseConnections[i + 3],
            brainData.synapseConnections[i + 4],
            brainData.synapseConnections[i + 5]
          ),
          progress: Math.random(),
          speed: 0.35 + Math.random() * 0.45,
        });
      }
    }

    const impulseGeo = new THREE.BufferGeometry();
    const impulsePositions = new Float32Array(this.impulseTracks.length * 3);
    for (let i = 0; i < this.impulseTracks.length; i++) {
      impulsePositions[i * 3] = this.impulseTracks[i].from.x;
      impulsePositions[i * 3 + 1] = this.impulseTracks[i].from.y;
      impulsePositions[i * 3 + 2] = this.impulseTracks[i].from.z;
    }
    impulseGeo.setAttribute('position', new THREE.BufferAttribute(impulsePositions, 3));

    this.impulseMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(0xffffff),
      size: 0.14,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      map: this.createGlowDotTexture(),
      depthWrite: false,
    });
    this.impulsePoints = new THREE.Points(impulseGeo, this.impulseMaterial);
    this.brainGroup.add(this.impulsePoints);

    this.group.add(this.brainGroup);

    // =========================================================================
    // 5. FSRS MEMORY RETENTION RINGS (Cincin Pelindung Konsolidasi FSRS)
    // =========================================================================
    this.memoryRingsGroup = new THREE.Group();
    this.memoryRingsGroup.position.set(0, 0.1, 0);

    const ringRadii = [
      { r: 2.1, rotX: 1.15, rotZ: 0.3, speed: 0.14, color: 0x6ac4f8 },
      { r: 2.55, rotX: -0.75, rotZ: -0.5, speed: -0.11, color: 0x90dbff },
      { r: 3.0, rotX: 0.35, rotZ: 0.95, speed: 0.08, color: 0xd4b06a },
    ];

    ringRadii.forEach((ringDef, idx) => {
      const ringGeo = this.createDashedRingGeometry(ringDef.r, 72);
      const ringMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(ringDef.color),
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
      });
      this.ringMaterials.push(ringMat);

      const ringLoop = new THREE.LineLoop(ringGeo, ringMat);
      ringLoop.rotation.set(ringDef.rotX, idx * 0.6, ringDef.rotZ);
      ringLoop.userData = { speed: ringDef.speed, baseRot: ringDef.rotX };
      this.memoryRings.push(ringLoop);
      this.memoryRingsGroup.add(ringLoop);
    });

    this.group.add(this.memoryRingsGroup);

    // =========================================================================
    // 6. SATELLITE KNOWLEDGE TABLETS (Kepingan Memori Terkristalisasi)
    // =========================================================================
    const shardConfigs = [
      { dist: 2.2, theta: 0.4, phi: 0.35, h: 0.85, w: 0.32, delay: 0.15 },
      { dist: 2.4, theta: 1.3, phi: -0.4, h: 0.95, w: 0.35, delay: 0.22 },
      { dist: 2.3, theta: 2.2, phi: 0.5, h: 0.80, w: 0.30, delay: 0.18 },
      { dist: 2.6, theta: 3.1, phi: -0.3, h: 1.0, w: 0.36, delay: 0.30 },
      { dist: 2.3, theta: 4.0, phi: 0.45, h: 0.90, w: 0.34, delay: 0.25 },
      { dist: 2.5, theta: 4.9, phi: -0.5, h: 1.05, w: 0.38, delay: 0.35 },
      { dist: 2.2, theta: 5.6, phi: 0.3, h: 0.75, w: 0.28, delay: 0.20 },
    ];

    shardConfigs.forEach((cfg) => {
      const geo = this.createMemoryTabletGeometry(cfg.h, cfg.w);
      const mesh = new THREE.Mesh(geo, this.material);

      const x = Math.cos(cfg.theta) * Math.cos(cfg.phi) * cfg.dist;
      const y = 0.1 + Math.sin(cfg.phi) * cfg.dist * 0.7;
      const z = Math.sin(cfg.theta) * Math.cos(cfg.phi) * cfg.dist;

      mesh.position.set(x, y, z);
      mesh.lookAt(0, 0.1, 0);
      mesh.rotateY(Math.PI * 0.25);
      mesh.scale.set(0, 0, 0);

      this.secondaryBasePositions.push(new THREE.Vector3(x, y, z));
      this.secondaryBaseRotations.push(mesh.rotation.clone());

      this.secondaryMeshes.push(mesh);
      this.secondaryTargetScales.push(1.0);
      this.secondaryDelays.push(cfg.delay);
      this.group.add(mesh);
    });

    // =========================================================================
    // 7. INSTANCED MICRO-CRYSTAL PEDESTAL (Alas Kristal di Dasar)
    // =========================================================================
    const instCount = quality.instancedShardCount;
    const instGeo = new THREE.ConeGeometry(0.08, 0.38, 5);
    const instMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(TOKENS.colors.ice1),
      roughness: 0.2,
      metalness: 0.1,
      emissive: new THREE.Color(TOKENS.colors.iceGlow),
      emissiveIntensity: 0.2,
      envMapIntensity: 1.2,
    });

    this.instancedShards = new THREE.InstancedMesh(instGeo, instMat, instCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < instCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.6 + Math.random() * 1.5;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = -1.2 + Math.random() * 0.2;

      const scaleH = 0.25 + Math.random() * 0.7;
      const scaleW = 0.3 + Math.random() * 0.6;

      dummy.position.set(x, y, z);
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.6,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.6
      );
      dummy.scale.set(scaleW, scaleH, scaleW);
      dummy.updateMatrix();
      this.instancedShards.setMatrixAt(i, dummy.matrix);
    }
    this.instancedShards.instanceMatrix.needsUpdate = true;
    this.instancedShards.scale.set(0, 0, 0);
    this.group.add(this.instancedShards);

    scene.add(this.group);
  }

  // ===========================================================================
  // GEOMETRY GENERATORS & TEXTURES
  // ===========================================================================

  private createDashedRingGeometry(radius: number, segments: number): THREE.BufferGeometry {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }

  private createMemoryTabletGeometry(height: number, width: number): THREE.BufferGeometry {
    return new THREE.BoxGeometry(width, height, width * 0.22);
  }

  private createGlowDotTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.25, 'rgba(165, 228, 255, 0.9)');
      grad.addColorStop(0.65, 'rgba(80, 180, 255, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // ===========================================================================
  // SHADER INJECTIONS
  // ===========================================================================
  private enhanceMemoryShader(material: THREE.MeshPhysicalMaterial) {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uGrow = this.uniforms.uGrow;
      shader.uniforms.uIntegrity = this.uniforms.uIntegrity;
      shader.uniforms.uDissolve = this.uniforms.uDissolve;
      shader.uniforms.uGold = this.uniforms.uGold;
      shader.uniforms.uTime = this.uniforms.uTime;
      shader.uniforms.uMicroCrack = this.uniforms.uMicroCrack;

      shader.vertexShader = `
        uniform float uGrow;
        uniform float uIntegrity;
        uniform float uDissolve;
        uniform float uTime;
        uniform float uMicroCrack;
        varying vec3 vCustomWorldPosition;
        varying vec3 vCustomObjectPosition;
        varying vec3 vCustomViewNormal;
        ${shader.vertexShader}
      `;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vCustomObjectPosition = position;
        vCustomViewNormal = normalMatrix * normal;

        // When integrity drops (< 1), shatter cortical vertices along face normals (lupa)
        if (uIntegrity < 0.999) {
          float crackFactor = 1.0 - uIntegrity;
          float crack = sin(position.x * 12.0 + position.y * 10.0 + uTime * 3.5);
          transformed += normal * crack * crackFactor * 0.14;
        }

        // Deterministic micro-crack pulse vibration on milestone hit
        if (uMicroCrack > 0.001) {
          float vib = sin(position.y * 30.0 + position.z * 25.0) * uMicroCrack * 0.08;
          transformed += normal * vib;
        }

        vCustomWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
        `
      );

      shader.fragmentShader = `
        uniform float uGrow;
        uniform float uIntegrity;
        uniform float uDissolve;
        uniform float uGold;
        uniform float uTime;
        uniform float uMicroCrack;
        varying vec3 vCustomWorldPosition;
        varying vec3 vCustomObjectPosition;
        varying vec3 vCustomViewNormal;

        // 3D noise for natural memory fractures and dissolution
        float hash(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
        }

        float noise3D(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
            f.z
          );
        }
        ${shader.fragmentShader}
      `;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>

        // 1. Dissolve effect when uDissolve > 0
        if (uDissolve > 0.001) {
          float dNoise = noise3D(vCustomWorldPosition * 3.2);
          if (dNoise < uDissolve) {
            discard;
          }
          // Pale blue glowing edge on dissolving boundary
          gl_FragColor.rgb += vec3(0.55, 0.88, 1.0) * smoothstep(uDissolve, uDissolve + 0.06, dNoise) * 0.75;
        }

        // 2. Optical frost fresnel on grazing angle of cerebral folds
        vec3 normalDir = normalize(vCustomViewNormal);
        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        float fresnel = pow(1.0 - max(dot(normalDir, viewDir), 0.0), 2.8);
        gl_FragColor.rgb += vec3(0.86, 0.93, 1.0) * fresnel * 0.42;

        // 3. Crack lines visible when uIntegrity < 1 (Lupa / Degradasi Ingatan)
        if (uIntegrity < 0.98) {
          float crackNoise = noise3D(vCustomWorldPosition * 7.5);
          float crackLine = smoothstep(0.48, 0.52, crackNoise) * (1.0 - uIntegrity);
          gl_FragColor.rgb += vec3(0.8, 0.92, 1.0) * crackLine * 0.95;
        }

        // 4. Sacred Gold illumination when uGold > 0 (Hafalan Mutqin / FSRS Consolidation)
        if (uGold > 0.001) {
          vec3 goldColor = vec3(0.84, 0.70, 0.42);
          float coreDist = length(vCustomObjectPosition);
          float innerGlow = smoothstep(1.7, 0.1, coreDist);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, goldColor * 1.9, innerGlow * uGold * 0.85);
        }
        `
      );
    };
  }

  // ===========================================================================
  // UNIFORM & ATTRIBUTE ACCESSORS
  // ===========================================================================

  public setPosition(x: number, y: number, z: number) {
    this.group.position.set(x, y, z);
  }

  public setScale(s: number) {
    this.group.scale.set(s, s, s);
  }

  public setRotationY(rad: number) {
    this.group.rotation.y = rad;
  }

  public setGrow(v: number) {
    const clamped = Math.max(0, Math.min(1, v));
    this.uniforms.uGrow.value = clamped;

    // 1. Scale cerebral cortex mesh
    this.mainMesh.scale.set(clamped, clamped, clamped);

    // 2. Scale neural network & fade in connections
    this.neuralLinesMaterial.opacity = clamped * 0.75;
    this.neuralNodesMaterial.opacity = clamped * 0.95;
    this.impulseMaterial.opacity = clamped * 1.0;

    // 3. Scale memory retention rings
    this.memoryRingsGroup.scale.set(clamped, clamped, clamped);
    this.ringMaterials.forEach((mat) => {
      mat.opacity = clamped * 0.55;
    });

    // 4. Stagger secondary memory tablet shards
    this.secondaryMeshes.forEach((mesh, idx) => {
      const delay = this.secondaryDelays[idx];
      const localProgress = Math.max(0, Math.min(1, (clamped - delay) / (1.0 - delay)));
      const eased = localProgress === 1 ? 1 : 1 - Math.pow(2, -10 * localProgress);
      mesh.scale.set(eased, eased, eased);
    });

    // 5. Scale base cluster
    const clusterP = Math.max(0, Math.min(1, (clamped - 0.45) / 0.55));
    const clusterEased = clusterP === 1 ? 1 : 1 - Math.pow(2, -10 * clusterP);
    this.instancedShards.scale.set(clusterEased, clusterEased, clusterEased);
  }

  public setIntegrity(v: number) {
    const val = Math.max(0, Math.min(1, v));
    this.uniforms.uIntegrity.value = val;

    if (this.neuralLinesMaterial) {
      this.neuralLinesMaterial.opacity = this.uniforms.uGrow.value * (0.15 + val * 0.6);
    }
  }

  public setDissolve(v: number) {
    this.uniforms.uDissolve.value = Math.max(0, Math.min(1, v));
  }

  public setGold(v: number) {
    const val = Math.max(0, Math.min(1, v));
    this.uniforms.uGold.value = val;

    if (val > 0.01) {
      const goldColor = new THREE.Color(0xd4b06a);
      this.neuralLinesMaterial.color.lerp(goldColor, val * 0.8);
      this.neuralNodesMaterial.color.lerp(goldColor, val * 0.9);
      this.coreLight.color.lerp(goldColor, val);
    } else {
      this.neuralLinesMaterial.color.setHex(0x6ed6ff);
      this.neuralNodesMaterial.color.setHex(0xe5f6ff);
      this.coreLight.color.set(TOKENS.colors.iceGlow);
    }
  }

  public setCoreLight(intensity: number) {
    this.baseCoreIntensity = intensity;
    this.coreLight.intensity = intensity;
    (this.coreMesh.material as THREE.MeshBasicMaterial).opacity = Math.min(1.0, intensity * 0.45);
  }

  public setCorePulseRate(freq: number) {
    this.corePulseRate = freq;
  }

  public setEnvMapIntensity(val: number) {
    this.material.envMapIntensity = val;
  }

  public setMicroCrackVibration(amplitude: number) {
    this.uniforms.uMicroCrack.value = amplitude;
  }

  /**
   * Shard separation when integrity drops (< 0.5 in Scene 2)
   */
  public setShardSeparation(separation: number) {
    const sep = Math.max(0, Math.min(1, separation));
    this.secondaryMeshes.forEach((mesh, idx) => {
      const basePos = this.secondaryBasePositions[idx];
      if (basePos) {
        const dir = basePos.clone().normalize();
        mesh.position.copy(basePos).addScaledVector(dir, sep * 0.65);
        mesh.rotation.y = this.secondaryBaseRotations[idx].y + sep * (0.4 + idx * 0.1);
      }
    });
  }

  /**
   * Main Per-Frame Tick Loop
   */
  public update(dt: number, time: number) {
    this.uniforms.uTime.value = time;

    // 1. Biological heartbeat pulse of the cognitive mind (frequency controlled by corePulseRate)
    if (this.coreLight.intensity > 0.02) {
      const pulse = 1.0 + Math.sin(time * 2.4 * this.corePulseRate) * 0.16;
      this.coreMesh.scale.set(pulse, pulse, pulse);
    }

    // 2. Slow subtle cerebral hover & gentle rotation for dimensional depth
    this.mainMesh.rotation.y = -0.25 + Math.sin(time * 0.25) * 0.18;
    this.mainMesh.rotation.x = 0.12 + Math.cos(time * 0.3) * 0.04;
    this.brainGroup.position.y = 0.1 + Math.sin(time * 0.8) * 0.04;

    // 3. Rotate FSRS Memory Retention Rings gyroscopically
    this.memoryRings.forEach((ring) => {
      const speed = ring.userData.speed || 0.1;
      ring.rotation.y += speed * dt;
      ring.rotation.z += (speed * 0.5) * dt;
    });

    // 4. Update Synaptic Action Potential Impulses (firing pulses across the cortex)
    if (this.impulsePoints && this.impulseTracks.length > 0 && this.uniforms.uGrow.value > 0.1) {
      const posAttr = this.impulsePoints.geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;

      for (let i = 0; i < this.impulseTracks.length; i++) {
        const track = this.impulseTracks[i];
        track.progress += track.speed * dt * this.uniforms.uIntegrity.value;
        if (track.progress > 1.0) {
          track.progress = 0.0;
        }

        const curX = THREE.MathUtils.lerp(track.from.x, track.to.x, track.progress);
        const curY = THREE.MathUtils.lerp(track.from.y, track.to.y, track.progress);
        const curZ = THREE.MathUtils.lerp(track.from.z, track.to.z, track.progress);

        positions[i * 3] = curX;
        positions[i * 3 + 1] = curY;
        positions[i * 3 + 2] = curZ;
      }
      posAttr.needsUpdate = true;
    }

    // 5. Floating satellite memory tablets oscillation
    this.secondaryMeshes.forEach((mesh, idx) => {
      mesh.position.y += Math.sin(time * 1.4 + idx) * 0.001;
    });
  }

  public dispose() {
    this.mainMesh.geometry.dispose();
    this.secondaryMeshes.forEach((m) => m.geometry.dispose());
    this.instancedShards.geometry.dispose();
    (this.instancedShards.material as THREE.Material).dispose();
    this.material.dispose();
    this.coreMesh.geometry.dispose();
    (this.coreMesh.material as THREE.Material).dispose();

    this.neuralLines.geometry.dispose();
    this.neuralLinesMaterial.dispose();
    this.neuralNodes.geometry.dispose();
    this.neuralNodesMaterial.dispose();
    this.impulsePoints.geometry.dispose();
    this.impulseMaterial.dispose();

    this.memoryRings.forEach((r) => r.geometry.dispose());
    this.ringMaterials.forEach((m) => m.dispose());
  }
}
