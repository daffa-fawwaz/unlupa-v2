/**
 * Unlupa.id - Sacred Neural Brain Geometry Generator
 * 
 * Generates an anatomically recognizable, aesthetic 3D Human Brain (Cerebral Cortex):
 * - Left & Right Hemispheres separated by the longitudinal fissure
 * - Organic procedural gyri and sulci (cortical convolutions) using 3D spherical harmonics & simplex noise
 * - Brainstem & Cerebellum subtle under-curves for anatomical poise
 * - Surface vertex normals calculated smoothly for specular glints
 */

import * as THREE from 'three';

// 3D Simplex-like noise helper for cortical folding
function snoise3D(x: number, y: number, z: number): number {
  return (
    Math.sin(x * 2.1 + y * 1.3) * 0.4 +
    Math.cos(y * 2.3 + z * 1.7) * 0.35 +
    Math.sin(z * 2.8 + x * 1.5) * 0.25
  );
}

export function createBrainGeometry(scale: number = 1.35): {
  cortexGeometry: THREE.BufferGeometry;
  synapsePositions: THREE.Vector3[];
  synapseConnections: number[];
} {
  // Base high-resolution sphere (detail level 4 for smooth cortical folds)
  const sphereGeo = new THREE.IcosahedronGeometry(1.0, 5);
  const posAttr = sphereGeo.attributes.position;
  const count = posAttr.count;

  const positions = new Float32Array(count * 3);
  const synapseCandidates: THREE.Vector3[] = [];

  for (let i = 0; i < count; i++) {
    let x = posAttr.getX(i);
    let y = posAttr.getY(i);
    let z = posAttr.getZ(i);

    // Normalize base point on sphere
    const len = Math.hypot(x, y, z) || 1.0;
    x /= len;
    y /= len;
    z /= len;

    // 1. Brain Proportional Aspect (Frontal, Parietal, Occipital, Temporal shaping)
    // - Elongate along Z (anteroposterior length: longer front-to-back)
    // - Widen along X (biparietal width)
    // - Flatten slightly at the bottom (ventral surface)
    let bx = x * 1.22;
    let by = y * 0.98;
    let bz = z * 1.45;

    // Shift frontal lobe forward & slightly higher
    if (bz > 0) {
      bz *= 1.08;
      by += 0.05 * (bz / 1.5);
    }
    // Occipital lobe rounding at back
    if (bz < 0) {
      by -= 0.06 * Math.abs(bz);
    }
    // Ventral / bottom flattening for brainstem seating
    if (by < -0.2) {
      by += 0.12 * (1.0 + by);
    }

    // 2. Longitudinal Cerebral Fissure (Deep separation between Left and Right Hemispheres)
    const hemisphereSide = Math.sign(bx) || 1;
    const absX = Math.abs(bx);
    // Separation groove along center line x = 0, especially at the top and front/back
    const centerFactor = Math.exp(-Math.pow(absX * 3.8, 2));
    const fissureDepth = 0.28 * Math.max(0, by + 0.3) * centerFactor;
    bx -= hemisphereSide * fissureDepth * 0.55;
    by -= fissureDepth * 0.45;

    // Push hemispheres slightly apart for distinct bilateral symmetry
    bx += hemisphereSide * 0.045;

    // 3. Cortical Convolutions (Gyri & Sulci folds)
    // High-frequency procedural folding running across the cerebral cortex
    const foldFrequency = 4.8;
    const foldNoise1 = snoise3D(bx * foldFrequency, by * foldFrequency, bz * foldFrequency);
    const foldNoise2 = snoise3D(bx * foldFrequency * 2.1, by * foldFrequency * 2.1, bz * foldFrequency * 2.1);
    
    // Gyri bulge outward, Sulci groove inward
    const corticalDisplacement = (foldNoise1 * 0.14 + foldNoise2 * 0.06) * Math.min(1.0, absX * 2.5);
    
    const finalLengthMod = 1.0 + corticalDisplacement;
    bx *= finalLengthMod * scale;
    by *= finalLengthMod * scale;
    bz *= finalLengthMod * scale;

    positions[i * 3] = bx;
    positions[i * 3 + 1] = by;
    positions[i * 3 + 2] = bz;

    // Collect evenly spaced candidates for synaptic glow nodes
    if (i % 28 === 0 && absX > 0.15) {
      synapseCandidates.push(new THREE.Vector3(bx * 1.02, by * 1.02, bz * 1.02));
    }
  }

  const cortexGeometry = new THREE.BufferGeometry();
  cortexGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  cortexGeometry.setIndex(sphereGeo.getIndex());
  cortexGeometry.computeVertexNormals();

  // 4. Build Synaptic Connections between nearest nodes across both hemispheres
  const synapseConnections: number[] = [];
  const selectedSynapses = synapseCandidates.slice(0, 68);

  for (let i = 0; i < selectedSynapses.length; i++) {
    const p1 = selectedSynapses[i];
    let connCount = 0;
    for (let j = i + 1; j < selectedSynapses.length; j++) {
      const p2 = selectedSynapses[j];
      const dist = p1.distanceTo(p2);
      // Connect adjacent nodes on the cortical surface
      if (dist > 0.35 && dist < 0.95 && connCount < 3) {
        synapseConnections.push(p1.x, p1.y, p1.z);
        synapseConnections.push(p2.x, p2.y, p2.z);
        connCount++;
      }
    }
  }

  return {
    cortexGeometry,
    synapsePositions: selectedSynapses,
    synapseConnections,
  };
}
