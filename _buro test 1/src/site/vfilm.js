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

export function createFilm(world, callouts, direction) {
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
        callouts.setFade(1 - clamp01(self.progress * 1.4));
      },
      onLeaveBack: () => {
        spinDrag = 0; recordP = 0;
        world.setSpin(0);
        put(place(last.to));
        world.setExposure(D.record.from ?? 1.18);
        callouts.setFade(1);
      },
    });
  }, document.documentElement);

  return () => ctx.revert();
}

/** The authored still for prefers-reduced-motion: the film's strongest frame. */
export function createStill(world, callouts, direction) {
  const s = direction.still ?? direction.shots[direction.shots.length - 1].to;
  world.rig.setPose(direction.stillPose ?? 1);
  world.rigCam.cut(place(s));
  world.setLight(direction.stillLight ?? direction.shots[direction.shots.length - 1].light, 1);
  callouts.setShot(direction.stillCallouts ?? []);
  callouts.cue(1);
  world.touch();
}
