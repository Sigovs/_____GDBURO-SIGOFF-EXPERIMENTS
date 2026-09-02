// Loading. One loader set, shared, with the decoders served from our own origin
// (public/decoders/, populated by `npm run decoders`) rather than a CDN.
//
// The shipping format is .glb — Draco or meshopt geometry, KTX2 textures. FBX
// and OBJ load here too, but only for the lab: they are source formats, they
// carry no compression, and a page that ships one has skipped the pipeline
// (see tools/convert.mjs).

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

let cached = null;

export function createLoaders(renderer) {
  if (cached) return cached;

  const draco = new DRACOLoader().setDecoderPath('/decoders/draco/');
  const ktx2 = new KTX2Loader().setTranscoderPath('/decoders/basis/').detectSupport(renderer);

  const gltf = new GLTFLoader();
  gltf.setDRACOLoader(draco);
  gltf.setKTX2Loader(ktx2);
  gltf.setMeshoptDecoder(MeshoptDecoder);

  cached = {
    gltf,
    draco,
    ktx2,
    dispose() {
      draco.dispose();
      ktx2.dispose();
      cached = null;
    },
  };
  return cached;
}

/** Loads a .glb / .gltf and returns the parsed result. */
export async function loadModel(renderer, url, { onProgress } = {}) {
  const { gltf } = createLoaders(renderer);
  return gltf.loadAsync(url, onProgress);
}

/** Source formats — lab only. Dynamically imported so they never enter the site bundle. */
export async function loadSource(url) {
  const ext = url.split('.').pop().toLowerCase();
  if (ext === 'fbx') {
    const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
    return new FBXLoader().loadAsync(url);
  }
  if (ext === 'obj') {
    const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
    return new OBJLoader().loadAsync(url);
  }
  throw new Error(`loadSource: ${ext} is not a source format this bench reads — convert it first (npm run convert)`);
}

/**
 * Frames an object: returns its bounds, and normalises it so the scene works in
 * metres regardless of what unit the DCC exported in. FBX from most libraries
 * arrives at 100x.
 */
export function measure(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  return { box, size, center, radius: size.length() / 2 };
}

/** Scales an object so its longest axis is `target` units, and sits it on y = 0. */
export function normalise(object, target = 4) {
  const { size, center } = measure(object);
  const longest = Math.max(size.x, size.y, size.z) || 1;
  const scale = target / longest;
  object.scale.setScalar(scale);
  object.position.sub(center.multiplyScalar(scale));
  const { box } = measure(object);
  object.position.y -= box.min.y;
  return scale;
}

/** Counts what the budget cares about, before the model is in a scene (DNA72). */
export function countGeometry(root) {
  let triangles = 0;
  let meshes = 0;
  const materials = new Set();
  const textures = new Set();
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    meshes++;
    const g = obj.geometry;
    triangles += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
    const list = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of list) {
      if (!m) continue;
      materials.add(m.uuid);
      for (const key of Object.keys(m)) if (m[key]?.isTexture) textures.add(m[key].uuid);
    }
  });
  return { triangles: Math.round(triangles), meshes, materials: materials.size, textures: textures.size };
}
