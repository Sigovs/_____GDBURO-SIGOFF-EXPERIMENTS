// The intake bench. Every 3D object arriving in this project is judged here
// before it is allowed near a composition: real scale, triangle and primitive
// count against the budget (DNA72/73), and a material audit that catches the
// unlit and legacy materials DNA83 names as the tells.
//
// This is an INSTRUMENT, not the site. OrbitControls is used here on purpose —
// inspecting an asset is exactly the case where a turntable is correct, and this
// is the only file in the project allowed one (DNA49 governs the page).

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createStage } from '../engine/stage.js';
import { neutralEnvironment, threePoint } from '../engine/environment.js';
import { createContactShadow, createShadowCatcher } from '../engine/ground.js';
import { loadModel, loadSource, measure, normalise, countGeometry } from '../engine/loaders.js';
import { auditMaterials } from '../engine/materials.js';

const canvas = document.querySelector('#stage');
const stage = createStage(canvas, { fov: 35, exposure: 1.0, hud: true });
const { scene, camera, renderer } = stage;

neutralEnvironment(renderer, scene, { intensity: 1 });
const lights = threePoint(scene);
const shadow = createContactShadow(scene, { size: 8, height: 0.6, blur: 3.5, darkness: 1.6 });
createShadowCatcher(scene, { size: 60, opacity: 0.3 });

// ── reference: a metre grid and a 1m cube, so scale is read, not guessed ────
const grid = new THREE.GridHelper(20, 20, 0x2a2a30, 0x1a1a1f);
grid.material.transparent = true;
grid.material.opacity = 0.7;
scene.add(grid);

const metre = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x2b2b31, roughness: 0.9, wireframe: true }),
);
metre.position.set(-3, 0.5, 0);
metre.name = 'one-metre-reference';
scene.add(metre);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 1, 0);
camera.position.set(5, 2.6, 6);

// ── model slot ──────────────────────────────────────────────────────────────
let current = null;

function clearCurrent() {
  if (!current) return;
  scene.remove(current);
  current.traverse((o) => {
    o.geometry?.dispose();
    const list = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of list) m.dispose();
  });
  current = null;
}

const out = {
  name: document.querySelector('[data-name]'),
  table: document.querySelector('[data-report]'),
  findings: document.querySelector('[data-findings]'),
};

function report(name, object, { converted = true } = {}) {
  const { size } = measure(object);
  const counts = countGeometry(object);
  const findings = auditMaterials(object);

  const row = (label, value, over) =>
    '<tr><th>' + label + '</th><td data-over="' + (over ? 1 : '') + '">' + value + '</td></tr>';

  out.name.textContent = name;
  out.table.innerHTML =
    row('size', size.x.toFixed(2) + ' × ' + size.y.toFixed(2) + ' × ' + size.z.toFixed(2) + ' m') +
    row('triangles', counts.triangles.toLocaleString(), counts.triangles > 400000) +
    row('meshes', counts.meshes, counts.meshes > 50) +
    row('materials', counts.materials) +
    row('textures', counts.textures) +
    row('format', converted ? 'glb (pipeline)' : 'source — not shippable', !converted);

  out.findings.innerHTML = findings.length
    ? findings
        .map((f) => '<p class="finding"><b>' + f.name + '</b> · ' + f.type + '<br>' + f.issues.join('<br>') + '</p>')
        .join('')
    : '<p class="hint">materials: nothing flagged</p>';
}

async function show(url, name, { source = false } = {}) {
  clearCurrent();
  out.name.textContent = 'loading ' + name;
  try {
    const object = source ? await loadSource(url) : (await loadModel(renderer, url)).scene;
    normalise(object, 4);
    object.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
    });
    scene.add(object);
    current = object;
    report(name, object, { converted: !source });
    const { size } = measure(object);
    controls.target.set(0, size.y / 2, 0);
  } catch (error) {
    out.name.textContent = name;
    out.findings.innerHTML = '<p class="finding">' + error.message + '</p>';
    console.error(error);
  }
}

// ── the built library ───────────────────────────────────────────────────────
const built = import.meta.glob('/assets/models/*.glb', { query: '?url', import: 'default', eager: true });
const list = document.querySelector('[data-models]');
const entries = Object.entries(built).filter(([path]) => !path.endsWith('.raw.glb'));

if (!entries.length) {
  list.innerHTML =
    '<li class="hint">assets/models/ is empty.<br>Drop sources into assets/source/ and run <b>npm run convert</b> — or drag a file onto this page.</li>';
} else {
  list.innerHTML = entries
    .map(([path], i) => '<li><button type="button" data-index="' + i + '">' + path.split('/').pop() + '</button></li>')
    .join('');
  list.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-index]');
    if (!button) return;
    for (const b of list.querySelectorAll('button')) b.setAttribute('aria-current', 'false');
    button.setAttribute('aria-current', 'true');
    const [path, url] = entries[Number(button.dataset.index)];
    show(url, path.split('/').pop());
  });
  list.querySelector('button')?.click();
}

// ── drag and drop, for an object that has not been through the pipeline yet ──
const body = document.body;
for (const type of ['dragenter', 'dragover']) {
  window.addEventListener(type, (e) => {
    e.preventDefault();
    body.classList.add('dragging');
  });
}
for (const type of ['dragleave', 'drop']) {
  window.addEventListener(type, (e) => {
    e.preventDefault();
    if (type === 'dragleave' && e.relatedTarget) return;
    body.classList.remove('dragging');
  });
}
window.addEventListener('drop', (e) => {
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const ext = file.name.split('.').pop().toLowerCase();
  show(url, file.name, { source: !['glb', 'gltf'].includes(ext) });
});

// ── controls ────────────────────────────────────────────────────────────────
function bind(selector, fn) {
  const el = document.querySelector(selector);
  if (!el) return;
  const output = el.parentElement.querySelector('output');
  const apply = () => {
    if (output) output.value = Number(el.value).toFixed(2);
    fn(Number(el.value));
  };
  el.addEventListener('input', apply);
  apply();
}

bind('#exposure', (v) => stage.setExposure(v));
bind('#env', (v) => (scene.environmentIntensity = v));
bind('#key', (v) => {
  lights.key.intensity = v;
  lights.fill.intensity = v * 0.25;
  lights.rim.intensity = v * 0.6;
});
bind('#shadow', (v) => (shadow.opacity = v));

document.querySelector('#grid')?.addEventListener('click', (e) => {
  const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
  e.currentTarget.setAttribute('aria-pressed', String(on));
  grid.visible = on;
  metre.visible = on;
});

// ── frame ───────────────────────────────────────────────────────────────────
stage.onFrame(() => {
  controls.update();
  shadow.update(renderer);
});
