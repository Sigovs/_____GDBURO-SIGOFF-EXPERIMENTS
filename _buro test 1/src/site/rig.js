// The KR700PA runtime rig.
//
// One implementation, shared by the page and by lab/rig.html. A debug view that
// runs different code from the page validates the debug view.
//
// WHAT WENT WRONG THE FIRST TIME, because it is the whole reason this file exists:
// the linkage rods were given a counter-rotation about their own fixed local
// pivot. That holds a rod's ATTITUDE — it stays vertical, or stays horizontal —
// and does absolutely nothing about where its far end ends up. At rest it looks
// perfect. The moment the shoulder swings, the far end walks off the joint it is
// supposed to be bolted to, and the machine sheds parts.
//
// A rod spans two pivots that both move. Its orientation is therefore SOLVED from
// both of them, every frame, and never inherited.
//
// THE CHAIN
//
//   base                      fixed
//   └ column                  A1, yaw about vertical
//     ├ lowerArm              A2, pitch at shoulder (420, 900)
//     │ ├ boom                A3, pitch at elbow (420, 2185) — driven as a WORLD attitude
//     │ │ └ flange            passive: holds the rocker's attitude  -> stays level
//     │ │   └ tool            A4, yaw about vertical at (2018, 2030)
//     │ └ rocker              passive: holds the column's attitude, SIBLING of boom
//     │   └ tieRod            aim: tieStart on rocker -> tieEnd on flange
//     └ rearRod               aim: rearBot on column  -> rearTop on rocker
//
// The rocker being a SIBLING of the boom on the same elbow pivot is the part that
// makes a palletiser a palletiser. Loop A pins the rocker to the column's
// attitude however the shoulder moves; loop B hangs off the rocker and pins the
// flange to it however the boom moves. The plate therefore stays level under both
// axes at once, mechanically, with nothing correcting it.

import * as THREE from 'three';
// The rig description is read from the SAME file the exporter was driven by, not
// from the glb's node extras.
//
// Why: the extras and node translations did not survive the glb round-trip
// reliably in this toolchain — the server demonstrably returned a file whose
// tieRod carried translation [410,0,297] and extras.pivot [830,0,2482], and
// three's parse of those exact bytes produced position [0,0,0] with the pivot
// key absent. Rather than keep bisecting a loader, the dependency is removed:
// the glb supplies geometry, this file supplies the mechanism, and the mechanism
// is a JSON document that can be diffed, reviewed and unit-tested in node.
//
// It is also the better arrangement on its own terms. There is now exactly one
// statement of where the pivots are, and the exporter and the runtime both read
// it, so they cannot disagree.
import RIG from '../../assets/robo hand/rig.json';

/* ── the four poses ──────────────────────────────────────────────────────── */
//
// Chosen for silhouette, then checked against the joint limits — not the other
// way round. Each one is a shape a real palletiser makes during a cycle, and the
// flange coordinates beside them are where the tool plate actually lands, solved
// from the linkage rather than eyeballed from a screenshot.
export const POSES = {
  // A — compressed. Folded back over its own base, flange low and tucked in.
  A: { a1:  0.00, a2: -0.70, a3:  0.85, a4:  0.00 },   // flange ~ ( 461,  915)
  // B — the shoulder rises and opens. The arm clears the column.
  B: { a1: -0.28, a2: -0.30, a3:  0.35, a4:  0.50 },   // flange ~ (1266, 1696)
  // C — extended hard across space and high. The widest vertical reach.
  C: { a1:  0.15, a2:  0.22, a3: -0.30, a4: -0.40 },   // flange ~ (1850, 2569)
  // D — the tool comes round while the arm holds out level.
  D: { a1:  0.42, a2:  0.34, a3:  0.05, a4:  1.60 },   // flange ~ (2148, 2061)
  // E — full working extension, placing far and low. The widest silhouette.
  E: { a1:  0.42, a2:  0.52, a3:  0.62, a4:  2.40 },   // flange ~ (2125, 1272)
};

export const POSE_ORDER = ['A', 'B', 'C', 'D', 'E'];

const lerp = (a, b, t) => a + (b - a) * t;

/** Blend the pose chain by a single 0..1 parameter. */
export function poseAt(t) {
  const n = POSE_ORDER.length - 1;
  const x = Math.max(0, Math.min(1, t)) * n;
  const i = Math.min(Math.floor(x), n - 1);
  const f = x - i;
  const a = POSES[POSE_ORDER[i]];
  const b = POSES[POSE_ORDER[i + 1]];
  // Smoothstep between poses: a machine accelerates and settles, it does not
  // change joint velocity instantaneously at a keyframe.
  const s = f * f * (3 - 2 * f);
  return { a1: lerp(a.a1, b.a1, s), a2: lerp(a.a2, b.a2, s), a3: lerp(a.a3, b.a3, s), a4: lerp(a.a4, b.a4, s) };
}

/* ── the rig ─────────────────────────────────────────────────────────────── */

/**
 * Build the articulated hierarchy, and take the meshes out of the one the loader
 * produced.
 *
 * The loaded node tree is NOT reused. Its transforms could not be made to agree
 * with the file that produced them — `position` read [-237, 0, 900] while the
 * node's own `matrix`, recomposed on demand, held a translation of
 * [-1864, 0, 2258] — so every world position derived from it was wrong, and a
 * rod solved against a wrong world position is a rod that floats.
 *
 * Rather than keep bisecting that, the hierarchy is constructed here from
 * rig.json and the loaded MESHES are re-parented into it. The meshes are the only
 * thing the glb is needed for; their vertices are already baked around each
 * link's pivot by the exporter, so a mesh dropped into its link's group lands
 * exactly where it was surveyed.
 *
 * Every transform on screen is now one this file wrote.
 */
export function createRig(loaded) {
  const spec = Object.fromEntries(RIG.links.map((l) => [l.name, l]));
  const link = {};

  // Collect the meshes by the name the exporter gives them: `<link>_<material>`.
  const meshes = new Map();
  loaded.traverse((o) => {
    if (!o.isMesh) return;
    const linkName = o.name.replace(/_[^_]+$/, '');
    if (!meshes.has(linkName)) meshes.set(linkName, []);
    meshes.get(linkName).push(o);
  });

  const root = new THREE.Group();
  root.name = 'KR700PA';
  const s = RIG.unitScale ?? 0.001;
  root.scale.setScalar(s);
  root.rotation.x = -Math.PI / 2;   // Z-up survey frame -> Y-up scene

  const missing = [];
  for (const l of RIG.links) {
    const node = new THREE.Group();
    node.name = l.name;

    const here = l.pivot ?? [0, 0, 0];
    const there = l.parent ? (spec[l.parent].pivot ?? [0, 0, 0]) : [0, 0, 0];
    node.position.set(here[0] - there[0], here[1] - there[1], here[2] - there[2]);

    (l.parent ? link[l.parent] : root).add(node);
    link[l.name] = node;

    const own = meshes.get(l.name);
    if (!own) { missing.push(l.name); continue; }
    for (const m of own) {
      m.position.set(0, 0, 0);
      m.rotation.set(0, 0, 0);
      m.scale.setScalar(1);
      node.add(m);
    }
  }
  if (missing.length) console.warn('[rig] links with no geometry in the model:', missing.join(', '));

  root.updateMatrixWorld(true);

  const pivotOf = (node) => spec[node.name]?.pivot ?? [0, 0, 0];

  // Scratch vectors, allocated once. Nothing is allocated inside the frame loop
  // (DNA54) — this runs every frame and the aim solve touches four of them.
  const _a = new THREE.Vector3();
  const _b = new THREE.Vector3();
  const _al = new THREE.Vector3();
  const _bl = new THREE.Vector3();

  const state = { a1: 0, a2: 0, a3: 0, a4: 0 };

  /** World point, in scene space, of a survey-frame point belonging to `node`. */
  function pointOn(node, p, out) {
    const pv = pivotOf(node);
    out.set(p[0] - pv[0], p[1] - pv[1], p[2] - pv[2]);
    node.updateWorldMatrix(true, false);
    return node.localToWorld(out);
  }

  /**
   * Orient a rod so it points from its own pivot at the far pivot.
   *
   * Both ends are read in the ROD'S PARENT's local space, which keeps the
   * problem planar: every pitch axis in this machine is a local Y, and the only
   * yaw above them is the column's, which the parent frame has already applied.
   * Solving in world space instead would make A1 leak into the pitch solve.
   */
  function solveAim(node) {
    const s = spec[node.name].aim;
    const target = link[s.target.link];
    if (!target) return;

    pointOn(target, s.target.point, _b);
    node.updateWorldMatrix(true, false);
    _a.setFromMatrixPosition(node.matrixWorld);

    const parent = node.parent;
    _al.copy(_a);
    _bl.copy(_b);
    parent.worldToLocal(_al);
    parent.worldToLocal(_bl);

    // atan2(x, z): rotation about +Y by `a` adds exactly `a` to this angle.
    const theta = Math.atan2(_bl.x - _al.x, _bl.z - _al.z);
    const rd = s.restDir;
    node.rotation.set(0, theta - Math.atan2(rd[0], rd[2]), 0);
  }

  function apply() {
    // Driven axes.
    if (link.column) link.column.rotation.set(0, 0, state.a1);
    if (link.lowerArm) link.lowerArm.rotation.set(0, state.a2, 0);

    // The boom is driven as a WORLD attitude, so the shoulder's swing is
    // subtracted rather than added. This is the numerical half of what loop A
    // does mechanically for the rocker.
    if (link.boom) link.boom.rotation.set(0, state.a3 - state.a2, 0);

    // Passive, and both are exact rather than approximate: the rocker holds the
    // column's attitude (loop A), the flange holds the rocker's (loop B).
    if (link.rocker) link.rocker.rotation.set(0, -state.a2, 0);
    if (link.flange) link.flange.rotation.set(0, -state.a3, 0);

    if (link.tool) link.tool.rotation.set(0, 0, state.a4);

    // The rods read the world, so the world has to be current before they solve.
    root.updateMatrixWorld(true);
    for (const node of Object.values(link)) {
      if (spec[node.name]?.aim) solveAim(node);
    }
    root.updateMatrixWorld(true);
  }

  apply();

  /**
   * The validation this rig exists to pass: for every aim rod, how far is its far
   * pivot from where the rod can actually reach?
   *
   * The rods are oriented but never scaled, so a non-zero gap here IS a detached
   * rod — it is the same number a viewer would see as a floating part. Reported
   * in millimetres because that is the unit the pivots were measured in.
   */
  function residuals() {
    const out = [];
    for (const node of Object.values(link)) {
      const s = spec[node.name]?.aim;
      if (!s) continue;
      const pv = pivotOf(node);
      const tp = s.target.point;
      const restLen = Math.hypot(tp[0] - pv[0], tp[1] - pv[1], tp[2] - pv[2]);

      pointOn(link[s.target.link], tp, _b);
      node.updateWorldMatrix(true, false);
      _a.setFromMatrixPosition(node.matrixWorld);

      // Back to millimetres: the root carries unitScale, so world distance is metres.
      const now = _a.distanceTo(_b) * 1000;
      out.push({ rod: node.name, restLen: +restLen.toFixed(1), now: +now.toFixed(1), gap: +(now - restLen).toFixed(2) });
    }
    return out;
  }

  return {
    /** The articulated root. Add THIS to the scene, not the loaded gltf.scene. */
    root,
    link,
    state,
    set(next) {
      Object.assign(state, next);
      apply();
    },
    setPose(t) {
      this.set(poseAt(t));
    },
    residuals,
    /*
      NAMED WORLD POINTS, FOR THE DRAWING LAYER.

      Every mark on this page has to terminate on a real point or it is
      decoration. These are the survey's own pivots — the same numbers the
      exporter was driven by — read out of the live hierarchy, so a centreline
      through the elbow is through the elbow at whatever pose the scroll has
      reached rather than at a position someone typed.

      Read-only. Nothing here writes a transform, a pose or a solve.
    */
    /** World position of a named link's pivot: 'column', 'lowerArm', 'boom', 'rocker', 'flange', 'tool'. */
    point(name, out = new THREE.Vector3()) {
      const node = link[name];
      if (!node) return out.set(0, 0, 0);
      node.updateWorldMatrix(true, false);
      return out.setFromMatrixPosition(node.matrixWorld);
    },

    /** World position of an arbitrary survey-frame point belonging to a named link. */
    pointOn(name, p, out = new THREE.Vector3()) {
      const node = link[name];
      if (!node) return out.set(0, 0, 0);
      return pointOn(node, p, out);
    },

    /** The machine's world bounding box, recomputed on demand. */
    bounds(out = new THREE.Box3()) {
      return out.setFromObject(root);
    },

    /** Measured rod lengths in millimetres — the source of "3 x 1 300 mm". */
    rodLengths() {
      return residuals().map((r) => r.restLen);
    },

    /** World position of the tool plate. The level line reads this. */
    flangePoint(out = new THREE.Vector3()) {
      const node = link.tool ?? link.flange;
      if (!node) return out.set(1.72, 2.2, 0);
      node.updateWorldMatrix(true, false);
      return out.setFromMatrixPosition(node.matrixWorld);
    },
  };
}
