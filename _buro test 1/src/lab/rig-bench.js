// Rig bench — the instrument that decides whether the articulation is sound.
//
// It runs the SAME rig module the page runs (src/site/rig.js). A debug view with
// its own copy of the maths validates the copy, not the page.
//
// The claim it exists to test is not "does it look connected" — it is "is the far
// pivot of every rod within a millimetre of where the rod can reach, at every
// pose in the range". That is a number, and a number is the only version of this
// claim that survives being wrong.

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createStage } from '../engine/stage.js';
import { loadModel } from '../engine/loaders.js';
import { neutralEnvironment } from '../engine/environment.js';
import { createRig, POSES, POSE_ORDER, poseAt } from '../site/rig.js';
import MODEL from '../../assets/models/kr700pa-rig2.glb?url';

const canvas = document.getElementById('scene');
const stage = createStage(canvas, { fov: 40, near: 0.05, far: 120, exposure: 1.1, background: 0x0a0c0d });
const { scene, renderer, camera } = stage;

neutralEnvironment(renderer, scene, { intensity: 0.9 });
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(-5, 8, 4);
scene.add(key, new THREE.DirectionalLight(0x88aacc, 0.7).translateX(6));

scene.add(new THREE.GridHelper(12, 24, 0x2a3034, 0x16191b));

const controls = new OrbitControls(camera, canvas);
camera.position.set(5.4, 2.6, 6.2);
controls.target.set(0.9, 1.5, 0);
controls.enableDamping = true;
controls.update();

const gltf = await loadModel(renderer, MODEL);
// The rig builds its own hierarchy and adopts the loaded meshes — add ITS root.
const rig = createRig(gltf.scene);
const model = rig.root;
scene.add(model);

/* ── joint pins and rod lines ────────────────────────────────────────────── */
//
// Drawn from the SAME extras the rig solves against, so a pin in the wrong place
// means the export is wrong — it cannot mean the overlay is wrong.

const overlay = new THREE.Group();
overlay.name = 'rig-overlay';
scene.add(overlay);

const AXIS_COLOUR = { yaw: 0x6ec28a, pitch: 0xf2903f, passive: 0x7aa7ff, aim: 0xff6b5e, fixed: 0x7d868a };

const pins = [];
for (const node of Object.values(rig.link)) {
  const role = node.userData.role ?? 'fixed';
  const colour = AXIS_COLOUR[role] ?? AXIS_COLOUR.fixed;

  const pin = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 12, 8),
    new THREE.MeshBasicMaterial({ color: colour, depthTest: false, transparent: true, opacity: 0.95 }),
  );
  pin.renderOrder = 10;
  overlay.add(pin);

  // The axis itself, so a pitch axis pointing the wrong way is visible rather
  // than inferred from the way the arm moves.
  let axisLine = null;
  if (node.userData.joint) {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -0.55), new THREE.Vector3(0, 0, 0.55)]);
    axisLine = new THREE.Line(g, new THREE.LineBasicMaterial({ color: colour, depthTest: false, transparent: true, opacity: 0.8 }));
    axisLine.renderOrder = 10;
    overlay.add(axisLine);
  }

  pins.push({ node, pin, axisLine, axis: node.userData.joint });
}

// One line per aim rod, drawn between the two live pivots.
const rodLines = [];
for (const node of Object.values(rig.link)) {
  if (!node.userData.aim) continue;
  const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xff6b5e, depthTest: false }));
  line.renderOrder = 11;
  overlay.add(line);

  const end = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xff6b5e, depthTest: false, wireframe: true }),
  );
  end.renderOrder = 11;
  overlay.add(end);

  rodLines.push({ node, line, end });
}

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();

function pointOn(node, p) {
  const pv = node.userData.pivot ?? [0, 0, 0];
  const v = new THREE.Vector3(p[0] - pv[0], p[1] - pv[1], p[2] - pv[2]);
  node.updateWorldMatrix(true, false);
  return node.localToWorld(v);
}

function updateOverlay() {
  for (const { node, pin, axisLine, axis } of pins) {
    node.updateWorldMatrix(true, false);
    _v.setFromMatrixPosition(node.matrixWorld);
    pin.position.copy(_v);
    if (axisLine) {
      axisLine.position.copy(_v);
      node.matrixWorld.decompose(new THREE.Vector3(), _q, new THREE.Vector3());
      // The stored axis is in the link's local frame; show it where it really points.
      const dir = new THREE.Vector3(axis[0], axis[1], axis[2]).applyQuaternion(_q).normalize();
      axisLine.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    }
  }
  for (const { node, line, end } of rodLines) {
    const spec = node.userData.aim;
    node.updateWorldMatrix(true, false);
    const a = new THREE.Vector3().setFromMatrixPosition(node.matrixWorld);
    const b = pointOn(rig.link[spec.target.link], spec.target.point);
    line.geometry.setFromPoints([a, b]);
    end.position.copy(b);
  }
}

/* ── panel ───────────────────────────────────────────────────────────────── */

const $ = (id) => document.getElementById(id);
const sliders = ['a1', 'a2', 'a3', 'a4'].map((k) => ({ k, el: $(k), out: $(k + '-v') }));

function readSliders() {
  const s = {};
  for (const { k, el } of sliders) s[k] = Number(el.value);
  return s;
}
function writeSliders(pose) {
  for (const { k, el, out } of sliders) {
    el.value = pose[k];
    out.textContent = Number(pose[k]).toFixed(2);
  }
}

function refresh() {
  updateOverlay();

  const rows = rig.residuals();
  $('residuals').innerHTML = rows.map((r) => {
    const bad = Math.abs(r.gap) > 1.0;
    return `<tr><td>${r.rod}</td><td>${r.restLen}</td><td>${r.now.toFixed(1)}</td>
      <td class="${bad ? 'bad' : 'ok'}">${r.gap > 0 ? '+' : ''}${r.gap.toFixed(2)}</td></tr>`;
  }).join('');

  // The flange's world attitude, which is the property the whole machine exists
  // to hold. Read off the matrix rather than assumed from the numbers we fed in.
  const f = rig.link.flange;
  let tilt = 0;
  if (f) {
    f.updateWorldMatrix(true, false);
    f.matrixWorld.decompose(new THREE.Vector3(), _q, new THREE.Vector3());
    const up = new THREE.Vector3(0, 0, 1).applyQuaternion(_q);
    // In the model's Y-up scene frame the plate's own +Z should stay world +Y.
    tilt = THREE.MathUtils.radToDeg(Math.acos(Math.min(1, Math.abs(up.y))));
  }
  const p = rig.flangePoint(new THREE.Vector3());
  $('attitude').innerHTML =
    `<tr><td>plate tilt</td><td class="${tilt > 0.5 ? 'bad' : 'ok'}">${tilt.toFixed(3)}&deg;</td></tr>` +
    `<tr><td>flange x / y</td><td>${(p.x * 1000).toFixed(0)} / ${(p.y * 1000).toFixed(0)} mm</td></tr>`;
}

for (const { el } of sliders) {
  el.addEventListener('input', () => {
    rig.set(readSliders());
    for (const { k, el: e, out } of sliders) out.textContent = Number(e.value).toFixed(2);
    refresh();
  });
}

const poseRow = $('poses');
for (const name of POSE_ORDER) {
  const b = document.createElement('button');
  b.textContent = 'Pose ' + name;
  b.addEventListener('click', () => {
    rig.set(POSES[name]);
    writeSliders(POSES[name]);
    const t = POSE_ORDER.indexOf(name) / (POSE_ORDER.length - 1);
    $('blend').value = t;
    $('blend-v').textContent = t.toFixed(2);
    refresh();
  });
  poseRow.appendChild(b);
}

$('blend').addEventListener('input', (e) => {
  const t = Number(e.target.value);
  $('blend-v').textContent = t.toFixed(2);
  const pose = poseAt(t);
  rig.set(pose);
  writeSliders(pose);
  refresh();
});

let playing = false;
$('play').addEventListener('click', () => {
  playing = !playing;
  $('play').setAttribute('aria-pressed', String(playing));
});

/* ── the full-range test ─────────────────────────────────────────────────── */
//
// Sweeps every axis across its declared limits, independently and together, and
// reports the worst residual and the worst plate tilt anywhere in the range. This
// is the gate: the rig is sound when this says it is, not when a screenshot at
// one pose looks fine.
$('sweep').addEventListener('click', () => {
  const before = { ...rig.state };
  let worstGap = 0;
  let worstGapAt = null;
  let worstTilt = 0;
  const N = 11;

  const test = (pose) => {
    rig.set(pose);
    for (const r of rig.residuals()) {
      if (Math.abs(r.gap) > Math.abs(worstGap)) { worstGap = r.gap; worstGapAt = { rod: r.rod, pose: { ...pose } }; }
    }
    const f = rig.link.flange;
    if (f) {
      f.updateWorldMatrix(true, false);
      f.matrixWorld.decompose(new THREE.Vector3(), _q, new THREE.Vector3());
      const up = new THREE.Vector3(0, 0, 1).applyQuaternion(_q);
      worstTilt = Math.max(worstTilt, THREE.MathUtils.radToDeg(Math.acos(Math.min(1, Math.abs(up.y)))));
    }
  };

  const lim = (id) => [Number($(id).min), Number($(id).max)];
  const [a1lo, a1hi] = lim('a1');
  const [a2lo, a2hi] = lim('a2');
  const [a3lo, a3hi] = lim('a3');
  const [a4lo, a4hi] = lim('a4');

  // The full cross-product of the two pitch axes, which is where a linkage
  // error actually lives, plus a sweep of the two yaws over it.
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const a2 = a2lo + (a2hi - a2lo) * (i / (N - 1));
      const a3 = a3lo + (a3hi - a3lo) * (j / (N - 1));
      test({ a1: 0, a2, a3, a4: 0 });
      test({ a1: a1lo, a2, a3, a4: a4lo });
      test({ a1: a1hi, a2, a3, a4: a4hi });
    }
  }
  // And the authored pose path itself, densely.
  for (let i = 0; i <= 200; i++) test(poseAt(i / 200));

  rig.set(before);
  refresh();

  const pass = Math.abs(worstGap) < 1.0 && worstTilt < 0.5;
  const v = $('verdict');
  v.dataset.pass = String(pass);
  v.innerHTML = pass
    ? `PASS &mdash; worst rod gap ${worstGap.toFixed(3)} mm, worst plate tilt ${worstTilt.toFixed(4)}&deg;, over ${N * N * 3 + 201} poses.`
    : `FAIL &mdash; worst rod gap ${worstGap.toFixed(2)} mm on ${worstGapAt?.rod} (a2 ${worstGapAt?.pose.a2.toFixed(2)}, a3 ${worstGapAt?.pose.a3.toFixed(2)}), worst plate tilt ${worstTilt.toFixed(3)}&deg;.`;

  console.log('[rig bench] worst gap', worstGap, 'worst tilt', worstTilt, worstGapAt);
  window.__rigTest = { pass, worstGap, worstTilt, worstGapAt };
});

/* ── view toggles ────────────────────────────────────────────────────────── */
$('axes').addEventListener('click', () => {
  overlay.visible = !overlay.visible;
  $('axes').setAttribute('aria-pressed', String(overlay.visible));
});
$('wire').addEventListener('click', () => {
  const on = $('wire').getAttribute('aria-pressed') !== 'true';
  $('wire').setAttribute('aria-pressed', String(on));
  model.traverse((o) => { if (o.isMesh) o.material.wireframe = on; });
});

/* ── loop ────────────────────────────────────────────────────────────────── */
let t = 0;
stage.onFrame((dt) => {
  controls.update();
  if (playing) {
    // Slow, and a ping-pong rather than a loop: the return leg is where a
    // linkage error that only shows in one direction becomes obvious.
    t = (t + dt * 0.09) % 2;
    const p = t > 1 ? 2 - t : t;
    $('blend').value = p;
    $('blend-v').textContent = p.toFixed(2);
    const pose = poseAt(p);
    rig.set(pose);
    writeSliders(pose);
    refresh();
  }
});

rig.set(POSES.A);
writeSliders(POSES.A);
refresh();

window.__rig = rig;
window.__poseAt = poseAt;
console.log('[rig bench] ready');
