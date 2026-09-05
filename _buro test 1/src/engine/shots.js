// The shot vocabulary, with its 3D definitions (DNA50). Seven shots and no
// eighth: reveal · push-in · dolly · orbit · macro · interruption · release.
//
// This module deliberately has no "rotate the model" and no "auto-orbit". The
// feeling picks the shot and the shot picks the device (DNA27) — so a shot list
// written in BRIEF.md maps onto these names one-to-one, and an act that cannot
// name its shot has not been designed yet.
//
// FOV is art direction (DNA51): 28-40 compresses and reads heroic, 45-60 reads
// spatial and inhabited, above that reads like a phone lens. Never animate FOV
// and position together unless the distortion IS the effect.

import * as THREE from 'three';

const v = (a) => (a instanceof THREE.Vector3 ? a.clone() : new THREE.Vector3(...a));
const lerpV = (a, b, t, out) => out.copy(a).lerp(b, t);
const lerp = (a, b, t) => a + (b - a) * t;

/** position holds, the target changes — the subject is discovered, not approached */
export function reveal({ position, from, to, fov = 35 }) {
  const p = v(position);
  const a = v(from);
  const b = v(to);
  return (t, out) => {
    out.position.copy(p);
    lerpV(a, b, t, out.target);
    out.fov = fov;
  };
}

/** dolly along the view axis toward the subject, target fixed */
export function pushIn({ target, from, to, fov = 35 }) {
  const tg = v(target);
  const a = v(from);
  const b = v(to);
  return (t, out) => {
    lerpV(a, b, t, out.position);
    out.target.copy(tg);
    out.fov = fov;
  };
}

/** lateral travel with the target tracking — parallax across the scene */
export function dolly({ from, to, targetFrom, targetTo, fov = 40 }) {
  const a = v(from);
  const b = v(to);
  const ta = v(targetFrom);
  const tb = v(targetTo ?? targetFrom);
  return (t, out) => {
    lerpV(a, b, t, out.position);
    lerpV(ta, tb, t, out.target);
    out.fov = fov;
  };
}

/** an arc at fixed radius around a fixed target — never a full revolution */
export function orbit({ target, radius, height, from = 0, to = Math.PI / 3, fov = 35 }) {
  const tg = v(target);
  const sweep = to - from;
  if (Math.abs(sweep) >= Math.PI * 2) {
    console.warn('[shots] orbit sweep is a full revolution — that is a turntable, not a shot (DNA49)');
  }
  return (t, out) => {
    const a = from + sweep * t;
    out.position.set(tg.x + Math.sin(a) * radius, tg.y + height, tg.z + Math.cos(a) * radius);
    out.target.copy(tg);
    out.fov = fov;
  };
}

/** short distance, narrow FOV, one detail at a scale the eye cannot get in person */
export function macro({ target, from, to, fov = 24 }) {
  const tg = v(target);
  const a = v(from);
  const b = v(to ?? from);
  return (t, out) => {
    lerpV(a, b, t, out.position);
    out.target.copy(tg);
    out.fov = fov;
  };
}

/**
 * a cut, a blackout, a hard grade change — the seam is the event.
 * Holds frame `before` until `at`, then holds `after`. The page is expected to
 * carry the grade change; the rig only stops pretending the two frames are one move.
 */
export function interruption({ before, after, at = 0.5 }) {
  return (t, out) => {
    const frame = t < at ? before : after;
    out.position.copy(v(frame.position));
    out.target.copy(v(frame.target));
    out.fov = frame.fov ?? 35;
  };
}

/** the camera settles, damping resolves, motion stops on a composed frame */
export function release({ from, to, fovFrom, fovTo }) {
  const a = v(from.position);
  const b = v(to.position);
  const ta = v(from.target);
  const tb = v(to.target);
  const f0 = fovFrom ?? from.fov ?? 35;
  const f1 = fovTo ?? to.fov ?? f0;
  // ease-out: an exit that decelerates is what "settles" means
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  return (t, out) => {
    const e = ease(t);
    lerpV(a, b, e, out.position);
    lerpV(ta, tb, e, out.target);
    out.fov = lerp(f0, f1, e);
  };
}

export const SHOTS = { reveal, pushIn, dolly, orbit, macro, interruption, release };

/**
 * A shot list: acts in order, each with a scroll `span` (a share of the page's
 * scroll, not pixels) and one shot.
 *
 *   const list = createShotList([
 *     { name: 'arrival', span: 1.5, shot: reveal({ ... }) },
 *     { name: 'the peak', span: 2.5, shot: pushIn({ ... }) },
 *   ]);
 *   rig.set(list.sample(scrollProgress));
 *
 * `span` is declared in viewport-heights so the scroll budget in BRIEF.md and the
 * code are the same numbers (DNA38).
 */
export function createShotList(acts) {
  const total = acts.reduce((sum, a) => sum + a.span, 0);
  let acc = 0;
  const ranges = acts.map((act) => {
    const start = acc / total;
    acc += act.span;
    return { ...act, start, end: acc / total };
  });

  const out = { position: new THREE.Vector3(), target: new THREE.Vector3(), fov: 35 };

  return {
    acts: ranges,
    total,
    /** @param {number} progress 0..1 across the whole list */
    sample(progress) {
      const p = Math.min(Math.max(progress, 0), 1);
      const act = ranges.find((a) => p < a.end) ?? ranges[ranges.length - 1];
      const local = (p - act.start) / (act.end - act.start || 1);
      act.shot(Math.min(Math.max(local, 0), 1), out);
      out.act = act.name;
      out.local = local;
      return out;
    },
    /** The composed frame an act resolves to — what reduced motion shows (DNA43, DNA79). */
    still(name, at = 1) {
      const act = ranges.find((a) => a.name === name) ?? ranges[0];
      act.shot(at, out);
      return out;
    },
  };
}
