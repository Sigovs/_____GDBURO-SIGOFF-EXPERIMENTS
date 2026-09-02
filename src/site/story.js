// The shot list — INDEX1 · KR 700 PA
//
// DNA53: scroll sets a TARGET, damping moves the camera. Nothing here writes
// camera.position, which is what makes a stopped scroll settle onto a composed
// frame instead of freezing mid-jitter.
//
// CAMERA COVERAGE IS THE ORGANISING IDEA, and it is written in polar terms
// rather than as xyz triples so it can actually be audited. Azimuth is measured
// from +Z and rotates toward +X, so for a machine whose arm extends along +X:
//
//     0deg   side profile, arm to the right
//    90deg   head on, looking back down the arm from the tool
//   180deg   the opposite side profile, arm to the left
//   270deg   from behind the column, the balance linkage nearest
//
// The journey runs 66 -> 40 -> 18 -> 196 -> 268 -> 328 -> 372 -> 545 degrees, so
// the visitor sees the machine from a front three-quarter, the near side, the far
// side, the rear, from above, from a joint's distance, and finally from a hero
// angle ~150deg round from where they started. About 530deg of travel.
//
// It is NOT an orbit. Every leg has its own radius, height, focal length, target
// and speed, and two of the six barely rotate at all. A constant-rate circle
// around a subject is a turntable with extra steps (DNA49).

import { gsap, ScrollTrigger } from '../motion/context.js';

const V = (x, y, z) => ({ x, y, z });
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;
const easeIn = (t) => t * t * t;
/** Maps a sub-range of a shot's progress to 0..1, for offsetting choreography. */
const span = (p, a, b) => clamp01((p - a) / (b - a));

const RAD = Math.PI / 180;

/** A camera station: where it stands, what it looks at, and how tight the lens is. */
const at = (azimuth, radius, height, target, fov) => ({ azimuth, radius, height, target, fov });

/** Polar station -> the world position the rig damps toward. */
export function place(station) {
  const a = station.azimuth * RAD;
  return {
    position: {
      x: station.target.x + Math.sin(a) * station.radius,
      y: station.height,
      z: station.target.z + Math.cos(a) * station.radius,
    },
    target: station.target,
    fov: station.fov,
  };
}

export function blendStations(from, to, t) {
  return place({
    azimuth: lerp(from.azimuth, to.azimuth, t),
    radius: lerp(from.radius, to.radius, t),
    height: lerp(from.height, to.height, t),
    fov: lerp(from.fov, to.fov, t),
    target: {
      x: lerp(from.target.x, to.target.x, t),
      y: lerp(from.target.y, to.target.y, t),
      z: lerp(from.target.z, to.target.z, t),
    },
  });
}

/* ── the stations ────────────────────────────────────────────────────────── */

// Where the intro begins: front three-quarter, high and far, almost unlit.
export const OPEN = at(66, 7.10, 2.35, V(0.78, 1.42, 0), 34);

const SHOTS = {
  // 01 — low, close, cropped. The camera is BELOW the shoulder looking up, which
  // is the angle that makes a 2.7m machine read as something you stand under.
  impact: {
    trigger: '#impact',
    from: at(40, 3.30, 0.95, V(0.30, 1.45, 0), 46),
    to:   at(18, 2.70, 0.72, V(0.42, 1.55, 0), 48),
    pose: { from: 0.00, to: 0.06, at: [0.10, 1.0] },
    light: 'sculpt',
    level: 'off',
  },

  // 02 — all the way round to the far side, and wide. The biggest single change
  // of frame on the page: 178deg of travel and 2.7m -> 15m in one shot.
  scale: {
    trigger: '#scale',
    from: at(18, 2.70, 0.72, V(0.42, 1.55, 0), 48),
    to:   at(196, 15.0, 3.30, V(0.35, 1.30, 0), 28),
    // Opens fast then holds: the negative space is the composition, and it only
    // becomes one once the travel has stopped.
    camEase: easeOut,
    pose: { from: 0.06, to: 0.26, at: [0.22, 0.94] },
    light: 'clean',
    level: 'off',
  },

  // 03 — rear three-quarter. The balance linkage and the rear rod are nearest
  // the camera here, which is the only angle where the mechanism reads as a
  // mechanism rather than as a silhouette.
  rear: {
    trigger: '#rear',
    from: at(196, 15.0, 3.30, V(0.35, 1.30, 0), 28),
    to:   at(268, 5.60, 2.05, V(0.30, 1.85, 0), 36),
    pose: { from: 0.26, to: 0.56, at: [0.08, 0.82] },
    light: 'side',
    level: 'proving',
  },

  // 04 — high. Looking down the top of the boom while the tool comes round.
  above: {
    trigger: '#above',
    from: at(268, 5.60, 2.05, V(0.30, 1.85, 0), 36),
    to:   at(328, 6.20, 5.05, V(0.95, 1.60, 0), 40),
    pose: { from: 0.56, to: 0.79, at: [0.12, 0.86] },
    light: 'top',
    level: 'off',
  },

  // 05 — macro. Close enough that the machine leaves the frame entirely and what
  // is left is one joint. The radius does the work; the azimuth barely moves,
  // because a macro that also travels is a blur.
  macro: {
    trigger: '#macro',
    from: at(328, 6.20, 5.05, V(0.95, 1.60, 0), 40),
    to:   at(372, 1.45, 2.30, V(1.78, 2.05, 0), 30),
    // Arrives in the first half and then HOLDS. easeIn was tried and spends most
    // of the section still travelling, so most stoppable frames in the macro shot
    // were not macro frames — which fails MJ4 for the shot that most depends on it.
    camEase: (t) => easeOut(clamp01(t / 0.52)),
    pose: { from: 0.79, to: 0.86, at: [0.0, 0.55] },
    light: 'specular',
    level: 'off',
  },

  // 06 — the hero. The azimuth here is CALCULATED, not chosen: at pose E the
  // column sits at a1 = 0.42rad, which puts the arm along scene-azimuth 114deg,
  // so the broadside views are 24deg and 204deg. Standing at 185deg (545 mod 360)
  // is 19deg off broadside — the arm reads across the frame at close to its full
  // length. The first cut stood at 148deg, 34deg from the arm's OWN heading, and
  // the machine foreshortened into a compact blob at the exact moment it was
  // supposed to be at its most extended.
  //
  // It is also ~150deg round from where shot 01 stood, which is the other thing
  // this shot owes: a hero angle from a substantially different side.
  hero: {
    trigger: '#hero',
    from: at(372, 1.45, 2.30, V(1.78, 2.05, 0), 30),
    to:   at(545, 7.80, 1.32, V(1.05, 1.28, 0), 40),
    camEase: easeOut,
    pose: { from: 0.86, to: 1.00, at: [0.06, 0.62] },
    light: 'hero',
    level: 'proving',
  },
};

/* ── mobile ──────────────────────────────────────────────────────────────── */
//
// Authored, not derived (DM10, MJ8). A portrait frame has roughly half the
// horizontal field, so every station stands further out and wider. The AZIMUTHS
// are kept — the journey is the point and it survives the aspect change. What
// does not survive is the framing, so that is what changes.
const MOBILE = {
  impact: [at(40, 4.60, 1.05, V(0.35, 1.50, 0), 52), at(18, 4.10, 0.85, V(0.45, 1.60, 0), 54)],
  scale:  [at(18, 4.10, 0.85, V(0.45, 1.60, 0), 54), at(196, 16.5, 3.40, V(0.35, 1.45, 0), 34)],
  rear:   [at(196, 16.5, 3.40, V(0.35, 1.45, 0), 34), at(268, 7.60, 2.20, V(0.35, 1.80, 0), 42)],
  above:  [at(268, 7.60, 2.20, V(0.35, 1.80, 0), 42), at(328, 8.20, 5.30, V(0.95, 1.60, 0), 46)],
  macro:  [at(328, 8.20, 5.30, V(0.95, 1.60, 0), 46), at(372, 2.05, 2.28, V(1.76, 2.05, 0), 36)],
  hero:   [at(372, 2.05, 2.28, V(1.76, 2.05, 0), 36), at(545, 10.4, 1.50, V(1.05, 1.28, 0), 46)],
};

const ORDER = ['impact', 'scale', 'rear', 'above', 'macro', 'hero'];

/** The station shot 01 opens on. The intro has to land exactly here. */
export function openingStation(mobile) {
  return mobile && MOBILE.impact ? MOBILE.impact[0] : SHOTS.impact.from;
}

/* ── the story ───────────────────────────────────────────────────────────── */

export function createStory(scope, world) {
  const { rigCam, rig, levelEl } = world;
  const mob = world.mobile;

  const track = (name) =>
    (mob && MOBILE[name] ? { from: MOBILE[name][0], to: MOBILE[name][1] } : { from: SHOTS[name].from, to: SHOTS[name].to });

  const put = (station) => { rigCam.set(station); world.touch(); };
  const setLevel = (state) => {
    if (!levelEl) return;
    levelEl.hidden = state === 'off';
    levelEl.dataset.state = state === 'off' ? 'introduced' : state;
  };

  const ctx = gsap.context(() => {
    ORDER.forEach((name, i) => {
      const shot = SHOTS[name];
      const prev = i > 0 ? SHOTS[ORDER[i - 1]] : null;
      const t = track(name);

      // Only the ACTIVE shot's copy is present. A shot is one viewport of
      // composition inside a section a little taller than one viewport, so the
      // next section's type necessarily enters the frame before the current
      // shot's scrub finishes. In fast, out slow, so a boundary reads as a beat
      // — the machine alone — rather than as a hole.
      const copy = gsap.utils.toArray(`${shot.trigger} .type, ${shot.trigger} .frame`);
      const IN = 0.07;
      // The hero's best frame is its LAST — full extension arrives late — and a
      // sticky block gets pushed out of the top of its own section as that
      // section ends. So the closing statement is given a longer exit than the
      // others: it is gone by the time the crop would reach it, rather than
      // being cropped while still at full opacity.
      const OUT = name === 'hero' ? 0.30 : 0.16;
      const presence = (p) =>
        i === 0 ? clamp01((1 - p) / OUT) : clamp01(Math.min(p / IN, (1 - p) / OUT));
      const showCopy = (v) => { for (const el of copy) el.style.opacity = String(v); };
      showCopy(i === 0 ? 1 : 0);

      ScrollTrigger.create({
        trigger: shot.trigger,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;

          put(blendStations(t.from, t.to, (shot.camEase ?? ease)(p)));

          // The arm runs on its own window inside the shot, so the camera and
          // the machine never start or stop together. That is the difference
          // between choreography and two things happening at once.
          rig.setPose(lerp(shot.pose.from, shot.pose.to, ease(span(p, shot.pose.at[0], shot.pose.at[1]))));

          world.setLight(shot.light, clamp01(p / 0.45), prev?.light ?? shot.light);
          showCopy(presence(p));
          setLevel(shot.level);
        },
        onEnterBack: () => setLevel(shot.level),
        onLeave: () => showCopy(0),
        onLeaveBack: () => showCopy(i === 0 ? 1 : 0),
      });
    });

    // The record: the scene falls away rather than being covered. An opaque
    // surface travelling across live content cuts a hard edge through it (U13).
    ScrollTrigger.create({
      trigger: '#record .record',
      start: 'top bottom',
      end: 'top center',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        world.setExposure(lerp(1.18, 0.34, self.progress));
        if (levelEl) levelEl.style.opacity = String(1 - clamp01(self.progress * 2));
      },
      onLeaveBack: () => {
        world.setExposure(1.18);
        if (levelEl) levelEl.style.opacity = '';
      },
    });
  }, scope);

  return () => ctx.revert();
}

/**
 * The authored reduced-motion state (DNA43, MJ9, DM4).
 *
 * Not the sequence stopped — the frame the hero shot was built around: the
 * machine at full extension, the hero light resolved, the level line already
 * proving. What the visitor loses is the travel; what they must not lose is
 * what the travel demonstrated.
 */
export function createStill(world) {
  const { rigCam, rig, levelEl } = world;
  const station = world.mobile && MOBILE.hero ? MOBILE.hero[1] : SHOTS.hero.to;
  const s = place(station);

  rig.setPose(1);
  rigCam.cut({ position: s.position, target: s.target, fov: s.fov });
  world.setLight('hero', 1);

  if (levelEl) {
    levelEl.hidden = false;
    levelEl.dataset.state = 'proving';
  }
  world.touch();
  return () => {};
}

export { SHOTS, ORDER };
