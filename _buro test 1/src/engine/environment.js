// Environment and light. DNA55 (lighting designed before it is coded), DNA58
// (what is reflected is a design decision).
//
// An environment map is what makes metal and clearcoat read as metal and
// clearcoat. Ambient-only lighting is why most web 3D looks like clay (DNA83),
// so there is no ambient-only path in here at all.

import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Loads an .hdr into a PMREM environment map.
 * @param {string} url  a file under assets/env/ — the choice of which is art
 *                      direction, not a default. Say which one and why.
 */
export async function loadEnvironment(renderer, scene, url, { asBackground = false, intensity = 1 } = {}) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const hdr = await new RGBELoader().loadAsync(url);
  const env = pmrem.fromEquirectangular(hdr).texture;

  hdr.dispose();
  pmrem.dispose();

  scene.environment = env;
  scene.environmentIntensity = intensity;
  if (asBackground) scene.background = env;

  return env;
}

/**
 * A neutral room, for the bench and for the first minutes of a scene before its
 * real HDRI is chosen. It is a placeholder and it is marked as one: a default
 * studio under a nocturne art direction is a mismatch and it is visible (DNA58).
 */
export function neutralEnvironment(renderer, scene, { intensity = 1 } = {}) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environment = env;
  scene.environmentIntensity = intensity;
  scene.userData.environmentIsPlaceholder = true;
  return env;
}

/**
 * A three-point rig as an explicit decision: key direction, fill ratio, rim
 * separation — the three things DNA55 asks to be decided before they are coded.
 * Ratios, not absolute values, so a scene is re-lit by changing one number.
 */
export function threePoint(scene, {
  key = { intensity: 3, position: [4, 6, 3], color: 0xffffff, castShadow: true },
  fillRatio = 0.25,
  rimRatio = 0.6,
  fillPosition = [-5, 2, 2],
  rimPosition = [-2, 3, -6],
  shadowRadius = 6,
  shadowMapSize = 2048,
} = {}) {
  const group = new THREE.Group();
  group.name = 'lighting';

  const keyLight = new THREE.DirectionalLight(key.color, key.intensity);
  keyLight.position.set(...key.position);
  keyLight.name = 'key';
  if (key.castShadow) {
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    const c = keyLight.shadow.camera;
    c.near = 0.5;
    c.far = 40;
    c.left = c.bottom = -shadowRadius;
    c.right = c.top = shadowRadius;
    c.updateProjectionMatrix();
  }

  const fill = new THREE.DirectionalLight(0xffffff, key.intensity * fillRatio);
  fill.position.set(...fillPosition);
  fill.name = 'fill';

  const rim = new THREE.DirectionalLight(0xffffff, key.intensity * rimRatio);
  rim.position.set(...rimPosition);
  rim.name = 'rim';

  group.add(keyLight, fill, rim);
  scene.add(group);

  return { group, key: keyLight, fill, rim };
}
