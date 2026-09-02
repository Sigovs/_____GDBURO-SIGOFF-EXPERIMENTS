// The shot bench. A scroll-driven camera with one act per shot, so the camera
// language can be judged before a page exists to put it in.
//
// What it is for, specifically:
//   · feeling the difference between the seven shots (DNA50) rather than reading it
//   · checking that every stoppable position is a composed frame (MJ4, DNA53)
//   · the eight-stop review (DNA87) — press 1-8 to jump, then judge the frame
//   · seeing the reduced-motion still each act resolves to (DNA43, DNA79)
//
// It is a bench, not a concept. The acts here are named after the shots because
// there is no story yet; in a real build an act is named after its feeling and
// the shot is the device it picked (DNA27, DNA29).

import * as THREE from 'three';
import { createStage } from '../engine/stage.js';
import { neutralEnvironment, threePoint } from '../engine/environment.js';
import { createContactShadow, createShadowCatcher } from '../engine/ground.js';
import { createCameraRig } from '../engine/camera-rig.js';
import { createShotList, reveal, pushIn, dolly, orbit, macro, interruption, release } from '../engine/shots.js';
import { loadModel, normalise } from '../engine/loaders.js';
import { carPaint, matte } from '../engine/materials.js';
import { gsap, ScrollTrigger, motion, refreshOnResize } from '../motion/context.js';
import { prefersReduced } from '../motion/media.js';

const canvas = document.querySelector('#stage');
const scroller = document.querySelector('#scroller');
const readout = document.querySelector('[data-readout]');

// One rAF for the page: the render loop rides gsap's ticker (engine/loop.js).
const stage = createStage(canvas, { fov: 35, exposure: 1.05, hud: true, ticker: gsap.ticker });
const { scene, renderer, camera } = stage;

neutralEnvironment(renderer, scene, { intensity: 0.9 });
threePoint(scene, { key: { intensity: 3.2, position: [5, 7, 4], color: 0xffffff, castShadow: true } });
const shadow = createContactShadow(scene, { size: 10, height: 0.8, blur: 4, darkness: 1.5 });
createShadowCatcher(scene, { size: 80, opacity: 0.28 });

// ── the subject ─────────────────────────────────────────────────────────────
// The first built model if there is one; a stand-in block otherwise. The
// stand-in is deliberately a plain mass — a bench that ships a pretty
// placeholder teaches you about the placeholder.
const subject = new THREE.Group();
scene.add(subject);

const built = import.meta.glob('/assets/models/*.glb', { query: '?url', import: 'default', eager: true });
const first = Object.entries(built).find(([p]) => !p.endsWith('.raw.glb'));

if (first) {
  const gltf = await loadModel(renderer, first[1]);
  normalise(gltf.scene, 4.4);
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
  });
  subject.add(gltf.scene);
  document.querySelector('[data-subject]').textContent = first[0].split('/').pop();
} else {
  const body = new THREE.Mesh(new THREE.BoxGeometry(4, 1.1, 1.8), carPaint({ color: 0x14181d }));
  body.position.y = 0.85;
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.3, 1.9), matte());
  skirt.position.y = 0.3;
  for (const mesh of [body, skirt]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    subject.add(mesh);
  }
  document.querySelector('[data-subject]').textContent = 'stand-in mass (no model yet)';
}

// ── the shot list ───────────────────────────────────────────────────────────
// `span` is viewport-heights, so this list IS the scroll budget (DNA38).
const CENTRE = new THREE.Vector3(0, 1, 0);

const shots = createShotList([
  {
    name: 'reveal',
    span: 1.2,
    shot: reveal({ position: [7, 2.2, 7], from: [-6, 3, -4], to: CENTRE, fov: 38 }),
  },
  {
    name: 'push-in',
    span: 1.4,
    shot: pushIn({ target: CENTRE, from: [7, 2.2, 7], to: [3.2, 1.5, 3.2], fov: 34 }),
  },
  {
    name: 'dolly',
    span: 1.4,
    shot: dolly({ from: [3.2, 1.5, 3.2], to: [-3.6, 1.4, 3.4], targetFrom: CENTRE, targetTo: [0.6, 0.9, 0], fov: 40 }),
  },
  {
    name: 'orbit',
    span: 1.6,
    shot: orbit({ target: CENTRE, radius: 5, height: 1.2, from: -Math.PI * 0.28, to: Math.PI * 0.18, fov: 35 }),
  },
  {
    name: 'macro',
    span: 1.2,
    shot: macro({ target: [1.3, 0.95, 0.9], from: [2.6, 1.15, 2.1], to: [2.1, 1.05, 1.7], fov: 24 }),
  },
  {
    name: 'interruption',
    span: 0.8,
    shot: interruption({
      before: { position: [2.1, 1.05, 1.7], target: [1.3, 0.95, 0.9], fov: 24 },
      after: { position: [-5.5, 4.2, -6.5], target: CENTRE, fov: 46 },
      at: 0.5,
    }),
  },
  {
    name: 'release',
    span: 1.6,
    shot: release({
      from: { position: [-5.5, 4.2, -6.5], target: CENTRE, fov: 46 },
      to: { position: [0.4, 1.9, 8.4], target: [0, 1.05, 0], fov: 33 },
    }),
  },
]);

// The scroller's height IS the budget: one act's span is one viewport-height.
scroller.style.setProperty('--acts', String(shots.total));
document.querySelector('[data-budget]').textContent = shots.total.toFixed(1) + ' vh';
document.querySelector('[data-acts]').innerHTML = shots.acts
  .map((a) => '<li><b>' + a.name + '</b> · ' + a.span + ' vh</li>')
  .join('');

// ── drive it ────────────────────────────────────────────────────────────────
const rig = createCameraRig(camera, { lambda: 4.5 });
let progress = 0;

// Scroll sets a target value; damping moves the camera (DNA53). The rig is
// never assigned the scroll position directly.
const teardown = motion(document.body, () => {
  ScrollTrigger.create({
    trigger: scroller,
    start: 'top top',
    end: 'bottom bottom',
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      progress = self.progress;
    },
  });
});
const stopRefresh = refreshOnResize();

stage.onFrame((dt) => {
  const frame = shots.sample(progress);
  rig.set(frame);
  rig.update(dt);
  shadow.update(renderer);

  readout.innerHTML =
    '<tr><th>act</th><td>' + frame.act + '</td></tr>' +
    '<tr><th>within</th><td>' + (frame.local * 100).toFixed(0) + '%</td></tr>' +
    '<tr><th>page</th><td>' + (progress * 100).toFixed(0) + '%</td></tr>' +
    '<tr><th>fov</th><td>' + camera.fov.toFixed(1) + '°</td></tr>' +
    '<tr><th>settled</th><td>' + (rig.settled ? 'yes' : 'no') + '</td></tr>';
});

// Reduced motion is an authored state: the first act's composed still, held.
if (prefersReduced()) {
  progress = 0;
  rig.cut(shots.still('reveal', 1));
  document.body.dataset.reduced = 'true';
}

// ── the eight-stop review (DNA87) ───────────────────────────────────────────
// Press 1-8 to land on eight evenly spaced positions and judge each as a frame.
window.addEventListener('keydown', (e) => {
  const n = Number(e.key);
  if (!n || n < 1 || n > 8) return;
  const target = ((n - 1) / 7) * (scroller.scrollHeight - window.innerHeight);
  window.scrollTo({ top: target, behavior: prefersReduced() ? 'auto' : 'smooth' });
});

window.addEventListener('beforeunload', () => {
  teardown();
  stopRefresh();
  stage.dispose();
});
