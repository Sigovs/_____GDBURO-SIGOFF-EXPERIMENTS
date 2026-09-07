// The scroll film — generic over a direction's shot list.
//
// Same contract as index1's story.js and for the same reason: scroll sets a
// TARGET, damping moves the camera, so a stopped scroll settles on a composed
// frame. Reverse scroll is symmetric because every cue is derived from progress
// rather than from an event that only fires once.

import { gsap, ScrollTrigger } from '../motion/context.js';

const RAD = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;
const span = (p, a, b) => clamp01((p - a) / (b - a));

export const EASES = { ease, easeOut, hold: (t) => easeOut(clamp01(t / 0.55)) };

export function place(s) {
  const a = s.az * RAD;
  return {
    position: { x: s.t[0] + Math.sin(a) * s.r, y: s.h, z: s.t[2] + Math.cos(a) * s.r },
    target: { x: s.t[0], y: s.t[1], z: s.t[2] },
    fov: s.fov,
  };
}
const blend = (f, t, k) => place({
  az: lerp(f.az, t.az, k), r: lerp(f.r, t.r, k), h: lerp(f.h, t.h, k), fov: lerp(f.fov, t.fov, k),
  t: [lerp(f.t[0], t.t[0], k), lerp(f.t[1], t.t[1], k), lerp(f.t[2], t.t[2], k)],
});

/*
  THE LEVEL LINE'S SHOT SPEC.

  `shot.level` is `{ mode, at }`, where `at` is the progress the device reaches
  full strength by. It ramps rather than switching, because a full-viewport rule
  appearing between two frames reads as a glitch — and because a device that
  arrives WITH the articulation it is measuring is a measurement being taken,
  while one that is already there is a graphic that was lying on the picture.

  A shot with no `level` key turns it off. Stating the absence per shot rather
  than letting the last one persist is what keeps `DM6` — one depth idea per view
  — checkable in the direction file instead of by scrolling.
*/
const levelAt = (shot, p) => {
  const L = shot.level;
  if (!L) return { mode: 'off', at: 0 };
  const [a, b] = L.in ?? [0, 0.18];
  return { mode: L.mode ?? 'quiet', at: clamp01(ease(span(p, a, b))) * (L.max ?? 1) };
};

export function createFilm(world, callouts, direction, level = null) {
  const D = direction;
  const put = (st) => { world.rigCam.set(st); world.touch(); };
  let active = null;

  const ctx = gsap.context(() => {
    D.shots.forEach((shot, i) => {
      const prev = i > 0 ? D.shots[i - 1] : null;
      ScrollTrigger.create({
        trigger: '#' + shot.id,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          put(blend(shot.from, shot.to, (EASES[shot.camEase] ?? ease)(p)));
          world.rig.setPose(lerp(shot.pose[0], shot.pose[1], ease(span(p, shot.poseAt[0], shot.poseAt[1]))));
          const [la, lb] = shot.lightAt ?? [0, 0.45];
          world.setLight(shot.light, ease(span(p, la, lb)), prev?.light ?? shot.light);
          if (shot.pool) world.setPool(shot.pool);
          /*
            THE SHOT IS SET HERE, NOT IN onEnter.

            onEnter fires AFTER the first onUpdate of a jump, so a scroll that
            lands mid-shot cued the previous shot's callouts and then swapped the
            list — and with the scroll now stopped, no further update ever came to
            cue the new one. Every callout measured at opacity 0 on every frame.
            Deriving the active shot inside the update makes the two impossible to
            get out of order, forward or in reverse.
          */
          if (active !== shot.id) { active = shot.id; callouts.setShot(shot.callouts ?? []); }
          callouts.cue(p);
          level?.set(levelAt(shot, p));
        },
      });
    });

    /* ── the last screen ────────────────────────────────────────────────── */
    const last = D.shots[D.shots.length - 1];
    let spinDrag = 0, recordP = 0, dragging = false, lastX = 0;
    const SPIN_HOME = D.record.spinHome ?? 180;

    const putRecord = () => {
      put(blend(last.to, D.record.station ?? last.to, ease(recordP)));
      world.setSpin(SPIN_HOME * ease(span(recordP, 0.5, 1)) + spinDrag);
    };

    const surface = document.querySelector('[data-orbit]');
    if (surface) {
      surface.addEventListener('pointerdown', (e) => {
        dragging = true; lastX = e.clientX;
        surface.setPointerCapture?.(e.pointerId);
        surface.dataset.grabbing = '';
      });
      surface.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        spinDrag += (e.clientX - lastX) * 0.32; lastX = e.clientX; putRecord();
      });
      const up = (e) => {
        dragging = false;
        surface.releasePointerCapture?.(e.pointerId);
        delete surface.dataset.grabbing;
      };
      surface.addEventListener('pointerup', up);
      surface.addEventListener('pointercancel', up);
    }

    ScrollTrigger.create({
      trigger: '#record .record',
      start: 'top center',
      end: 'top 15%',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        recordP = self.progress;
        putRecord();
        world.setExposure(lerp(D.record.from ?? 1.18, D.record.floor ?? 0.6, self.progress));
        /*
          THE EXIT IS FAST, ON PURPOSE.

          At 1.4 the callouts spent most of the record's approach sitting between
          0.4 and 0.7 opacity — measured on the render at 1.79:1 against the hall,
          which is a label that is present, unreadable, and still occupying its
          slot. A callout is either legible or gone (`DNA62`); the band in between
          is the only wrong answer, so the fade crosses it quickly.
        */
        callouts.setFade(1 - clamp01(self.progress * 3.2));
        // The level line leaves the same way, and by strength rather than by a
        // mode switch — so scrolling back up restores it continuously instead of
        // snapping a full-viewport rule on between two frames.
        level?.set({ ...(last.level ?? { mode: 'quiet' }), at: 1 - clamp01(self.progress * 3.2) });
      },
      onLeaveBack: () => {
        spinDrag = 0; recordP = 0;
        world.setSpin(0);
        put(place(last.to));
        world.setExposure(D.record.from ?? 1.18);
        callouts.setFade(1);
        level?.set(levelAt(last, 1));
      },
    });
  }, document.documentElement);

  return () => ctx.revert();
}

/** The authored still for prefers-reduced-motion: the film's strongest frame. */
export function createStill(world, callouts, direction, level = null) {
  const s = direction.still ?? direction.shots[direction.shots.length - 1].to;
  world.rig.setPose(direction.stillPose ?? 1);
  world.rigCam.cut(place(s));
  world.setLight(direction.stillLight ?? direction.shots[direction.shots.length - 1].light, 1);
  callouts.setShot(direction.stillCallouts ?? []);
  callouts.cue(1);
  /*
    The still keeps the PROOF, not a souvenir of it. A reduced-motion visitor
    cannot watch the plate hold through the range, so the one frame they get is
    the frame where the measurement is on screen and readable (`DM4`, `MJ9`):
    the claim survives the loss of the choreography that demonstrated it.
  */
  level?.set(direction.stillLevel ?? { mode: 'proof', at: 1 });
  world.touch();
}
