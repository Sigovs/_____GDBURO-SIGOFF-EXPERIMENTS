// Variant world — a scene built from a DIRECTION spec.
//
// index1 keeps its own scene.js. This is the exploration runtime: everything that
// used to be hardcoded — light table, hall values, exposure band, fog, camera
// stations — is data, so three radically different art directions can run the
// same rig, the same articulation and the same measured figures.
//
// PROTECTED and untouched by anything in here: the rig hierarchy, the pose solve,
// the survey's pivots, and every number that appears on screen.

import * as THREE from 'three';
import { createStage } from '../engine/stage.js';
import { createCameraRig } from '../engine/camera-rig.js';
import { loadModel } from '../engine/loaders.js';
import { createContactShadow } from '../engine/ground.js';
import { createHall } from './hall.js';
import { createRig } from './rig.js';
import MODEL from '../../assets/models/kr700pa-rig2.glb?url';

/** A PMREM built from emissive planes — no HDRI, every value readable in code. */
function environment(renderer, scene, env) {
  const room = new THREE.Scene();
  const plane = new THREE.PlaneGeometry(1, 1);
  const panel = (colour, intensity, [w, h], position, lookAtOrigin = true) => {
    const m = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({
      color: new THREE.Color(colour).multiplyScalar(intensity), side: THREE.DoubleSide,
    }));
    m.scale.set(w, h, 1);
    m.position.set(...position);
    if (lookAtOrigin) m.lookAt(0, 0, 0);
    room.add(m);
  };
  room.background = new THREE.Color(env.ambient ?? 0x05070a);
  for (const p of env.panels) panel(p.colour, p.intensity, p.size, p.at, p.face !== false);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const map = pmrem.fromScene(room, 0.02).texture;
  pmrem.dispose();
  plane.dispose();
  room.traverse((o) => o.material?.dispose());
  scene.environment = map;
  scene.environmentIntensity = env.intensity ?? 1;
}

export async function createWorld(canvas, direction, { ticker, onProgress } = {}) {
  const D = direction;
  const stage = createStage(canvas, {
    fov: D.camera.fov ?? 34,
    near: 0.2,
    far: 90,
    exposure: D.light.setups[D.light.first].exposure,
    background: null,
    ticker,
  });
  const { scene, renderer, camera, mobile } = stage;

  environment(renderer, scene, D.env);
  scene.fog = new THREE.Fog(D.hall.fogColour ?? 0x0a0c0d, D.hall.fog[0], D.hall.fog[1]);

  const key = new THREE.DirectionalLight(D.light.keyColour ?? 0xfff0dc, 3);
  key.castShadow = !mobile;
  if (key.castShadow) {
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
    const c = key.shadow.camera;
    c.near = 1; c.far = D.light.shadowFar ?? 40;
    const e = D.light.shadowExtent ?? 15;
    c.left = c.bottom = -e; c.right = c.top = e;
    c.updateProjectionMatrix();
  }
  const fill = new THREE.DirectionalLight(D.light.fillColour ?? 0x8fb4d6, 0.8);
  const rim = new THREE.DirectionalLight(D.light.rimColour ?? 0xffd2a0, 1.8);
  scene.add(key, fill, rim);

  const gltf = await loadModel(renderer, MODEL, { onProgress });
  const model = gltf.scene;
  model.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    o.castShadow = !mobile;
    o.receiveShadow = !mobile;
    const m = o.material;
    m.envMapIntensity = D.material.envMapIntensity ?? 1.25;
    const spec = D.material[m.name];
    if (spec) { m.roughness = spec.r; m.metalness = spec.m; }
  });

  const rig = createRig(model);
  const spin = new THREE.Group();
  spin.name = 'spin';
  spin.add(rig.root);
  scene.add(spin);

  const hall = createHall(scene, {
    colour: D.hall.colour,
    roughness: D.hall.roughness ?? 0.985,
    poolRadius: new THREE.Vector2(D.hall.pool[0], D.hall.pool[1]),
    poolFloor: D.hall.poolFloor,
    poolAniso: new THREE.Vector2(D.hall.aniso[0], D.hall.aniso[1]),
    receiveShadow: !mobile,
  });
  hall.material.envMapIntensity = D.hall.env ?? 0.22;
  if (D.hall.visible === false) hall.floor.visible = false;

  const contact = createContactShadow(scene, {
    size: 7, height: 0.9, resolution: mobile ? 256 : 512,
    blur: 3.2, darkness: D.hall.contactDarkness ?? 1.8,
    opacity: D.hall.contactOpacity ?? 0.8, y: 0.004, ignore: [hall.floor],
  });

  const rigCam = createCameraRig(camera, { lambda: D.camera.lambda ?? 3.2, fovLambda: 2.4 });

  const _c = { key: [0, 0, 0, 0], fill: [0, 0, 0, 0], rim: [0, 0, 0, 0] };
  const applyLight = (name, t, fromName) => {
    const to = D.light.setups[name] ?? D.light.setups[D.light.first];
    const from = D.light.setups[fromName] ?? to;
    const k = Math.max(0, Math.min(1, t));
    for (const w of ['key', 'fill', 'rim']) {
      for (let i = 0; i < 4; i++) _c[w][i] = from[w][i] + (to[w][i] - from[w][i]) * k;
    }
    key.position.set(_c.key[0], _c.key[1], _c.key[2]); key.intensity = _c.key[3];
    fill.position.set(_c.fill[0], _c.fill[1], _c.fill[2]); fill.intensity = _c.fill[3];
    rim.position.set(_c.rim[0], _c.rim[1], _c.rim[2]); rim.intensity = _c.rim[3];
    stage.setExposure(from.exposure + (to.exposure - from.exposure) * k);
  };
  applyLight(D.light.first, 1);

  const readoutEl = document.querySelector('[data-readout]');
  let lastAz = -999, lastDist = -999;
  const updateReadout = () => {
    if (!readoutEl) return;
    const az = (Math.atan2(camera.position.x, camera.position.z) * 180 / Math.PI + 360) % 360;
    const dist = Math.hypot(camera.position.x, camera.position.z);
    if (Math.abs(az - lastAz) < 0.5 && Math.abs(dist - lastDist) < 0.05) return;
    lastAz = az; lastDist = dist;
    readoutEl.textContent = `AZ ${az.toFixed(0).padStart(3, '0')}° · ${dist.toFixed(1)} M`;
  };

  const frameHooks = new Set();
  let moving = true;
  stage.onFrame((dt) => {
    const settled = rigCam.update(dt);
    for (const fn of frameHooks) fn();
    updateReadout();
    if (contact && (!settled || moving)) { contact.update(renderer); moving = false; }
  });

  return {
    stage, scene, camera, rig, rigCam, mobile, hall,
    onFrame(fn) { frameHooks.add(fn); return () => frameHooks.delete(fn); },
    touch() { moving = true; },
    setLight: applyLight,
    setPool: (v) => hall.setPool(v),
    setExposure: (v) => stage.setExposure(v),
    setSpin(deg) { spin.rotation.y = deg * Math.PI / 180; moving = true; },
    dispose() { contact?.dispose(); hall.dispose(); stage.dispose(); },
  };
}
