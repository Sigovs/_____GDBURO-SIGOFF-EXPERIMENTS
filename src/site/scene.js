// The scene — INDEX1 · The Level Line
//
// Lighting, environment and materials were decided in BRIEF.md before they were
// coded (DNA55). What is here is that decision, executed:
//
//   THE PLACE      A machine hall at night. Not "dark because cinematic" — a
//                  palletiser is read by its highlights, and a highlight needs
//                  somewhere to be bright against (DNA22).
//   THE KEY        One hard source, high and to the left, raking along the arm
//                  so the machined edges separate from the castings.
//   THE FILL       Cool, from the floor, at a quarter of key. It is the room
//                  bouncing, and it is what stops the shadow side reading as a
//                  hole cut in the picture.
//   THE RIM        Warm, low and behind, at 0.55 — it lifts the arm's silhouette
//                  off the ground plane, which is the whole job during the sweep.
//   THE REFLECTION Authored in code, not downloaded (DNA58). A default studio
//                  HDRI under this art direction is a mismatch and it is visible:
//                  the machine would sit in a bright white room reflecting a
//                  softbox it is nowhere near.

import * as THREE from 'three';
import { createStage } from '../engine/stage.js';
import { createCameraRig } from '../engine/camera-rig.js';
import { loadModel } from '../engine/loaders.js';
import { createContactShadow, createShadowCatcher } from '../engine/ground.js';
import { auditMaterials } from '../engine/materials.js';
import { createRig } from './rig.js';
import MODEL from '../../assets/models/kr700pa-rig2.glb?url';


/* ── the environment, authored ───────────────────────────────────────────── */
//
// A PMREM built from a scene of emissive planes rather than from an .hdr. It
// costs nothing over the wire, it has no provenance question, and — the actual
// reason — every value in it is a decision someone can read and argue with.
function workshopEnvironment(renderer, scene) {
  const room = new THREE.Scene();
  const plane = new THREE.PlaneGeometry(1, 1);

  const panel = (colour, intensity, [w, h], position, rotation) => {
    const mesh = new THREE.Mesh(
      plane,
      new THREE.MeshBasicMaterial({ color: new THREE.Color(colour).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    mesh.scale.set(w, h, 1);
    mesh.position.set(...position);
    if (rotation) mesh.rotation.set(...rotation);
    room.add(mesh);
    return mesh;
  };

  // The hall: cool and very dark, so the machine is the brightest thing in it.
  room.background = new THREE.Color(0x05070a);
  panel(0x0a0f14, 1.0, [40, 40], [0, -6, 0], [-Math.PI / 2, 0, 0]);   // floor
  panel(0x070a0d, 1.0, [40, 20], [0, 6, -14], [0, 0, 0]);             // far wall

  // The overhead strip the key belongs to. Long and narrow: a machine hall is
  // lit by lines, not by a softbox, and the reflection has to say that.
  panel(0xfff2e0, 5.2, [3, 22], [-5, 11, 1], [Math.PI / 2, 0, 0]);
  panel(0xfff2e0, 1.6, [2, 18], [7, 11, -2], [Math.PI / 2, 0, 0]);

  // A cold bounce off the floor on the shadow side — the fill, in reflection form.
  panel(0x2a3d52, 1.1, [16, 8], [9, 1, 6], [0, -Math.PI / 2.4, 0]);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(room, 0.02).texture;
  pmrem.dispose();
  plane.dispose();
  room.traverse((o) => o.material?.dispose());

  scene.environment = env;
  scene.environmentIntensity = 1.0;
  return env;
}

/* ── the scene ───────────────────────────────────────────────────────────── */

export async function createScene(canvas, { ticker, reduced = false } = {}) {
  const stage = createStage(canvas, {
    fov: 34,            // DNA51 — 28-40 compresses and reads heroic; a machine deserves the long lens
    near: 0.2,
    far: 60,
    exposure: 1.15,     // tuned against the render, not left at 1 (DNA56)
    background: 0x0a0c0d,
    ticker,
  });

  const { scene, renderer, camera, mobile } = stage;

  workshopEnvironment(renderer, scene);

  // Fog is the one atmospheric device, and it is doing a compositional job: it
  // sinks the far end of the hall so the machine's silhouette has somewhere to
  // separate against. One depth idea per view (DM6) — there is no parallax layer
  // and no second spatial system anywhere on this page.
  scene.fog = new THREE.Fog(0x0a0c0d, 9, 30);

  const key = new THREE.DirectionalLight(0xfff0dc, 3.4);
  key.position.set(-5.5, 8.5, 3.2);
  key.castShadow = !mobile;
  if (key.castShadow) {
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
    const c = key.shadow.camera;
    c.near = 1; c.far = 26;
    c.left = c.bottom = -6; c.right = c.top = 6;
    c.updateProjectionMatrix();
  }

  const fill = new THREE.DirectionalLight(0x8fb4d6, 0.85);   // cool, from the floor
  fill.position.set(6, -2, 5);

  const rim = new THREE.DirectionalLight(0xffd2a0, 1.9);     // warm, low, behind
  rim.position.set(3.5, 1.2, -7);

  scene.add(key, fill, rim);

  const gltf = await loadModel(renderer, MODEL);
  const model = gltf.scene;

  const findings = auditMaterials(model);
  if (findings.length) console.warn('[scene] material audit', findings);

  model.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = !mobile;
    o.receiveShadow = !mobile;
    // The export's factors are the floor, not the look (DNA57). Tuned here,
    // against this environment, which is the only place the answer exists.
    const m = o.material;
    if (!m) return;
    m.envMapIntensity = 1.25;
    if (m.name === 'paint') { m.roughness = 0.46; m.metalness = 0.05; }
    if (m.name === 'steel') { m.roughness = 0.31; m.metalness = 0.95; }
    if (m.name === 'graphite') { m.roughness = 0.62; m.metalness = 0.25; }
  });

  const rig = createRig(model);
  scene.add(rig.root);

  // Contact shadow, always (DNA59). Sized to the machine's actual footprint
  // rather than to a round number — a shadow plane wider than the subject is a
  // grey square you can see the edge of.
  const contact = mobile ? null : createContactShadow(scene, {
    size: 7,
    height: 0.9,
    resolution: 512,
    blur: 3.2,
    darkness: 1.8,
    opacity: 0.8,
  });
  if (!mobile) createShadowCatcher(scene, { size: 60, opacity: 0.42 });

  const rigCam = createCameraRig(camera, { lambda: 3.2, fovLambda: 2.4 });

  /* ── lighting, directed per shot ───────────────────────────────────────
     One world, five setups. The room, the ground, the environment and the
     material response never change — only where the light comes from and how
     hard it is, which is what a gaffer changes between setups on one stand.

     Keeping the environment fixed is what stops this becoming five scenes
     (U11 arriving through the lighting): the reflections stay continuous, so
     the machine is recognisably in the same hall the whole way down. */
  const LIGHT = {
    // 01 — sculptural rim. Almost no fill: at this crop the form is read from
    // one bright edge running down the casting, and the rest can go.
    sculpt:   { key: [-4.2, 6.0, 2.2, 2.1], fill: [5, -1.5, 4, 0.30], rim: [2.6, 1.4, -6.2, 3.4], exposure: 1.12 },
    // 02 — clean and even. The machine is small here and has to read whole.
    clean:    { key: [-5.5, 8.5, 4.5, 3.2], fill: [6, -1.0, 5, 0.95], rim: [3.0, 1.6, -6.5, 1.5], exposure: 1.18 },
    // 03 — harder side light. The pose is the event, so the light rakes across
    // the linkage and lets the rods throw their own shadows on the castings.
    side:     { key: [-7.5, 3.4, 1.2, 3.9], fill: [5, -1.0, 4, 0.45], rim: [4.0, 1.2, -5.5, 2.2], exposure: 1.10 },
    // 04 — specular. Close enough that the subject IS the highlight, so the key
    // is tight and hot and the fill barely exists.
    specular: { key: [-2.0, 3.2, 3.4, 4.6], fill: [4, 0.4, 3, 0.22], rim: [2.2, 1.0, -3.4, 3.0], exposure: 0.98 },
    // 05 — resolved. Broad key, real fill, rim back to separating the arm from
    // the hall. The frame is wide again and everything has to hold together.
    hero:     { key: [-6.0, 7.0, 3.0, 3.0], fill: [6.5, -1.2, 5, 0.80], rim: [3.4, 1.4, -7.0, 2.6], exposure: 1.20 },
  };

  const _c = { key: [...LIGHT.sculpt.key], fill: [...LIGHT.sculpt.fill], rim: [...LIGHT.sculpt.rim] };

  const applyLight = (name, t, fromName) => {
    const to = LIGHT[name] ?? LIGHT.hero;
    const from = LIGHT[fromName] ?? to;
    const k = Math.max(0, Math.min(1, t));
    for (const which of ['key', 'fill', 'rim']) {
      for (let i = 0; i < 4; i++) _c[which][i] = from[which][i] + (to[which][i] - from[which][i]) * k;
    }
    key.position.set(_c.key[0], _c.key[1], _c.key[2]);
    key.intensity = _c.key[3];
    fill.position.set(_c.fill[0], _c.fill[1], _c.fill[2]);
    fill.intensity = _c.fill[3];
    rim.position.set(_c.rim[0], _c.rim[1], _c.rim[2]);
    rim.intensity = _c.rim[3];
    stage.setExposure(from.exposure + (to.exposure - from.exposure) * k);
  };

  // The subject box, published so the composition audit measures what the page
  // actually claims rather than guessing at it (PROCESS.md §5).
  const publishSubject = () => {
    // Measured on the rig root: the loaded scene is empty once its meshes have
    // been re-parented, and an empty Box3 publishes nulls that read as "no subject".
    const box = new THREE.Box3().setFromObject(rig.root);
    const min = box.min.clone().project(camera);
    const max = box.max.clone().project(camera);
    window.__subject = {
      x: (Math.min(min.x, max.x) + 1) / 2,
      y: 1 - (Math.max(min.y, max.y) + 1) / 2,
      w: Math.abs(max.x - min.x) / 2,
      h: Math.abs(max.y - min.y) / 2,
    };
  };

  // ── the level line ─────────────────────────────────────────────────────
  // The signature move's whole content is its own stillness, so what it reads
  // has to be the real thing: the projected screen height of the tool plate,
  // every frame, with no smoothing that could hide a wobble.
  const levelEl = document.querySelector('[data-level]');
  const flange = new THREE.Vector3();
  let lastTop = -1;

  const updateLevel = () => {
    if (!levelEl) return;
    rig.flangePoint(flange).project(camera);
    const top = (1 - (flange.y + 1) / 2) * 100;
    if (Math.abs(top - lastTop) < 0.001) return;
    lastTop = top;
    levelEl.style.top = top.toFixed(3) + '%';
  };

  let moving = true;
  stage.onFrame((dt) => {
    const settled = rigCam.update(dt);
    updateLevel();
    // The contact shadow is a full extra scene pass, so it runs while anything
    // is actually moving and stops when nothing is (DNA75). A still frame does
    // not need its shadow re-rendered sixty times a second.
    if (contact && (!settled || moving)) {
      contact.update(renderer);
      moving = false;
    }
    publishSubject();
  });

  return {
    stage,
    scene,
    camera,
    model,
    rig,
    rigCam,
    levelEl,
    mobile,
    /** Marks the scene dirty so the contact shadow re-renders this frame. */
    touch() { moving = true; },
    /** Crossfade the lighting setup. See LIGHT above — one world, five setups. */
    setLight: applyLight,
    setExposure: (v) => stage.setExposure(v),
    dispose() {
      contact?.dispose();
      stage.dispose();
      delete window.__subject;
    },
  };
}
