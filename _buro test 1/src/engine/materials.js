// Material presets are a floor, not a look (DNA57).
//
// Every function here returns a material a scene is expected to *tune*. Shipping
// one of these unchanged as a hero material is the same mistake as shipping the
// placeholder environment: it will read as competent and generic. Tune, then say
// in the report what you changed and why the subject's material demanded it.

import * as THREE from 'three';

/** Automotive paint — clearcoat over a metallic flake base. */
export function carPaint({
  color = 0x101418,
  metalness = 0.8,
  roughness = 0.35,
  clearcoat = 1.0,
  clearcoatRoughness = 0.05,
  envMapIntensity = 1.4,
} = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness,
    roughness,
    clearcoat,
    clearcoatRoughness,
    envMapIntensity,
  });
}

/** Glass — transmission with real thickness, never a transparent opacity fake. */
export function glass({
  color = 0xffffff,
  roughness = 0.05,
  thickness = 0.6,
  ior = 1.5,
  transmission = 1,
  tint = 0.15,
} = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0,
    roughness,
    transmission,
    thickness,
    ior,
    attenuationDistance: 1 / Math.max(tint, 0.001),
    attenuationColor: new THREE.Color(0x8899aa),
    transparent: true,
  });
}

/** Brushed or machined metal — anisotropy left for the scene to set if it has a map. */
export function metal({ color = 0xb8bcc0, roughness = 0.25, metalness = 1, envMapIntensity = 1.2 } = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity });
}

/** Rubber, matte plastic, tyre — the material that stops a scene reading as all-chrome. */
export function matte({ color = 0x121212, roughness = 0.9, metalness = 0 } = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

/**
 * Walks a loaded model and reports every material that cannot carry a hero:
 * Basic and Lambert are unlit or half-lit and are the tell DNA83 names.
 * Called by the lab on every import so the problem is found at intake.
 */
export function auditMaterials(root) {
  const findings = [];
  const seen = new Set();
  root.traverse((obj) => {
    const list = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    for (const m of list) {
      if (seen.has(m.uuid)) continue;
      seen.add(m.uuid);
      const entry = { name: m.name || '(unnamed)', type: m.type, issues: [] };
      if (m.isMeshBasicMaterial) entry.issues.push('unlit — MeshBasicMaterial cannot carry a lit subject');
      if (m.isMeshLambertMaterial || m.isMeshPhongMaterial) entry.issues.push('legacy shading — no env response worth the name');
      if (m.map && m.map.colorSpace !== THREE.SRGBColorSpace) entry.issues.push('colour map not tagged sRGB (DNA56)');
      for (const key of ['normalMap', 'roughnessMap', 'metalnessMap', 'aoMap']) {
        if (m[key] && m[key].colorSpace === THREE.SRGBColorSpace) entry.issues.push(`${key} tagged sRGB — data maps are linear (DNA56)`);
      }
      if (entry.issues.length) findings.push(entry);
    }
  });
  return findings;
}
