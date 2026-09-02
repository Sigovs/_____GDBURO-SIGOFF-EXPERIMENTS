// The shot list, driven by scroll — INDEX1 · KR 700 PA
//
// DNA53: scroll sets a TARGET, damping moves the camera. Nothing here writes
// camera.position, which is what makes a stopped scroll settle onto a composed
// frame instead of freezing mid-jitter.
//
// The rule this file is organised around: EVERY SHOT MUST CHANGE THE FRAME. Not
// the camera's coordinates — the frame. The previous cut interpolated between
// five similar three-quarter views and the result was one composition shown five
// times. So the shots are built as opposites and the contrast is scheduled:
//
//   01 IMPACT        1.9 m out, 44°   cropped, the machine overflows the frame
//   02 SCALE        16.0 m out, 28°   the whole machine, small, in a large field
//   03 ARTICULATION  7.6 m, lateral   the pose changes; the camera crosses
//   04 MACRO         1.2 m out, 26°   one joint. Nothing else in frame.
//   05 RELEASE       9.8 m out, 34°   full extension, across the full width
//
// close -> wide -> travelling -> closer than close -> wide again, with the
// machine folded, still, moving, still, extended. No two adjacent shots share a
// distance, a focal length, a pose state or a light.

import { gsap, ScrollTrigger } from '../motion/context.js';
import { poseAt } from './rig.js';

const V = (x, y, z) => ({ x, y, z });
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
/** Maps a sub-range of a shot's progress to 0..1, for offsetting choreography. */
const span = (p, a, b) => clamp01((p - a) / (b - a));

/*
  Each shot declares camera, pose and light as three separate tracks over its own
  progress, with their own start and end points. They deliberately do not line
  up: a camera that begins and ends with the arm reads as a single mechanism, and
  a machine is more interesting when the camera is already moving before it does.
*/
const SHOTS = {
  impact: {
    trigger: '#impact',
    cam: {
      from: { pos: V(1.05, 1.32, 2.35), target: V(0.36, 1.18, 0), fov: 44 },
      to:   { pos: V(1.32, 1.62, 2.75), target: V(0.44, 1.30, 0), fov: 44 },
    },
    // Mobile is authored, not derived (DM10, MJ8): a portrait frame has about
    // half the horizontal field of the desktop one, so each shot needs its own
    // distance and focal length or the crop simply eats the machine.
    mob: { from: { pos: V(1.60, 1.55, 4.10), target: V(0.48, 1.30, 0), fov: 50 },
           to:   { pos: V(1.75, 1.80, 4.50), target: V(0.55, 1.42, 0), fov: 50 } },
    pose: { from: 0.00, to: 0.03, at: [0.0, 1.0] },   // essentially held
    light: 'sculpt',
    level: 'off',
  },

  scale: {
    trigger: '#scale',
    cam: {
      from: { pos: V(1.32, 1.62, 2.75), target: V(0.44, 1.30, 0), fov: 44 },
      to:   { pos: V(-0.55, 3.05, 16.0), target: V(-0.30, 2.30, 0), fov: 28 },
    },
    // The release is fast and then settles — the frame opens in the first third
    // and the rest of the shot is a held wide, which is where the negative space
    // becomes the composition rather than a transition.
    camEase: (t) => 1 - (1 - t) ** 3,
    mob: { from: { pos: V(1.75, 1.80, 4.50), target: V(0.55, 1.42, 0), fov: 50 },
           to:   { pos: V(0.10, 2.70, 15.0), target: V(0.35, 1.70, 0), fov: 34 } },
    pose: { from: 0.03, to: 0.03, at: [0.0, 1.0] },
    light: 'clean',
    level: 'off',
  },

  articulation: {
    trigger: '#articulation',
    cam: {
      from: { pos: V(-0.55, 3.05, 16.0), target: V(-0.30, 2.30, 0), fov: 28 },
      to:   { pos: V(2.95, 1.86, 5.85), target: V(1.02, 1.72, 0), fov: 34 },
    },
    // The pose starts AFTER the camera has begun and finishes BEFORE it stops.
    // Overlapping, not synchronised.
    mob: { from: { pos: V(0.10, 2.70, 15.0), target: V(0.35, 1.70, 0), fov: 34 },
           to:   { pos: V(2.40, 1.90, 8.60), target: V(1.00, 1.62, 0), fov: 42 } },
    pose: { from: 0.03, to: 0.66, at: [0.14, 0.88] },
    light: 'side',
    level: 'proving',
  },

  macro: {
    trigger: '#macro',
    cam: {
      from: { pos: V(2.95, 1.86, 5.85), target: V(1.02, 1.72, 0), fov: 34 },
      to:   { pos: V(2.28, 2.42, 1.18), target: V(1.78, 2.16, 0), fov: 26 },
    },
    mob: { from: { pos: V(2.40, 1.90, 8.60), target: V(1.00, 1.62, 0), fov: 42 },
           to:   { pos: V(2.30, 2.36, 2.10), target: V(1.76, 2.12, 0), fov: 34 } },
    pose: { from: 0.66, to: 0.66, at: [0.0, 1.0] },
    light: 'specular',
    level: 'off',
  },

  release: {
    trigger: '#release',
    cam: {
      from: { pos: V(2.28, 2.42, 1.18), target: V(1.78, 2.16, 0), fov: 26 },
      to:   { pos: V(1.28, 1.30, 7.40), target: V(1.12, 1.28, 0), fov: 38 },
    },
    // The arm reaches full extension well before the camera finishes retreating,
    // so the last third of the shot is the machine already still and the frame
    // still opening — which is the release.
    mob: { from: { pos: V(2.30, 2.36, 2.10), target: V(1.76, 2.12, 0), fov: 34 },
           to:   { pos: V(1.20, 1.45, 11.2), target: V(1.05, 1.32, 0), fov: 42 } },
    pose: { from: 0.66, to: 1.00, at: [0.05, 0.70] },
    light: 'hero',
    level: 'proving',
  },
};

const ORDER = ['impact', 'scale', 'articulation', 'macro', 'release'];

function blend(from, to, t) {
  return {
    position: { x: lerp(from.pos.x, to.pos.x, t), y: lerp(from.pos.y, to.pos.y, t), z: lerp(from.pos.z, to.pos.z, t) },
    target: { x: lerp(from.target.x, to.target.x, t), y: lerp(from.target.y, to.target.y, t), z: lerp(from.target.z, to.target.z, t) },
    fov: lerp(from.fov, to.fov, t),
  };
}

export function createStory(scope, world) {
  const { rigCam, rig, levelEl } = world;

  const put = (shot) => { rigCam.set(shot); world.touch(); };
  const setLevel = (state) => {
    if (!levelEl) return;
    levelEl.hidden = state === 'off';
    levelEl.dataset.state = state === 'off' ? 'introduced' : state;
  };

  // Frame one is a composed frame, and it is composed here. ScrollTrigger does
  // not fire onUpdate at creation when progress is already zero, so without this
  // the opening shot is whatever the stage constructed the camera at.
  const first = SHOTS.impact;
  const firstCam = (world.mobile && first.mob ? first.mob : first.cam).from;
  rig.setPose(first.pose.from);
  rigCam.cut({ position: firstCam.pos, target: firstCam.target, fov: firstCam.fov });
  world.setLight('sculpt', 1);
  setLevel('off');
  world.touch();

  const ctx = gsap.context(() => {
    ORDER.forEach((name, i) => {
      const shot = SHOTS[name];
      const prev = i > 0 ? SHOTS[ORDER[i - 1]] : null;

      // Only the ACTIVE shot's copy is present.
      //
      // A shot is one viewport of composition inside a section a little taller
      // than one viewport, so the next section's type necessarily enters the
      // frame before the current shot's scrub has finished. Sticky cannot fix
      // that — the copy is genuinely on screen. Binding presence to the shot's
      // own progress is what keeps one frame showing one composition, which is
      // the whole claim being made about stopping anywhere (MJ4).
      const copy = gsap.utils.toArray(`${shot.trigger} .type, ${shot.trigger} .frame`);
      const band = 0.14;
      const presence = (p) =>
        i === 0
          ? clamp01((1 - p) / band)                       // shot one is already here
          : clamp01(Math.min(p / band, (1 - p) / band));
      const showCopy = (v) => { for (const el of copy) el.style.opacity = String(v); };
      showCopy(i === 0 ? 1 : 0);

      ScrollTrigger.create({
        trigger: shot.trigger,
        // top-top -> bottom-top gives each shot exactly its declared height as
        // scrub range, and consecutive shots meet without overlapping. The first
        // cut used 'bottom bottom', which ended shot one after 180px while its
        // own type was still on screen for another 900 — camera and composition
        // describing different moments.
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;

          const camT = (shot.camEase ?? ease)(p);
          const track = world.mobile && shot.mob ? shot.mob : shot.cam;
          put(blend(track.from, track.to, camT));

          // The pose runs on its own window inside the shot.
          const poseT = span(p, shot.pose.at[0], shot.pose.at[1]);
          rig.setPose(lerp(shot.pose.from, shot.pose.to, ease(poseT)));

          // Light crossfades across the first 45% of the shot, so it has
          // resolved by the time the frame settles rather than still arriving.
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
        world.setExposure(lerp(1.15, 0.34, self.progress));
        if (levelEl) levelEl.style.opacity = String(1 - clamp01(self.progress * 2));
      },
      onLeaveBack: () => {
        world.setExposure(1.15);
        if (levelEl) levelEl.style.opacity = '';
      },
    });
  }, scope);

  return () => ctx.revert();
}

/**
 * The authored reduced-motion state (DNA43, MJ9, DM4).
 *
 * Not the sequence stopped — the frame shot 05 was built around: the machine at
 * full extension, the hero light resolved, the level line already proving. What
 * the visitor loses is the travel. What they must not lose is what the travel
 * demonstrated, so the line arrives having done its job rather than waiting to.
 */
export function createStill(world) {
  const { rigCam, rig, levelEl } = world;
  const hero = (world.mobile && SHOTS.release.mob ? SHOTS.release.mob : SHOTS.release.cam).to;

  rig.setPose(1);
  rigCam.cut({ position: hero.pos, target: hero.target, fov: hero.fov });
  world.setLight('hero', 1);

  if (levelEl) {
    levelEl.hidden = false;
    levelEl.dataset.state = 'proving';
  }
  world.touch();
  return () => {};
}

export { SHOTS, ORDER };
