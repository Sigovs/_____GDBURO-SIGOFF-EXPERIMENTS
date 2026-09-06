// The intro — 2.5 seconds, authored, and made of the same world as the rest.
//
// NOT A SPLASH SCREEN. There is no overlay, no logo, no loader and no separate
// picture: the intro is the machine, its light, its own opening type and its
// first callout, played once before the scroll takes over. The distinction that
// matters is the ending — the last frame of the intro IS the first frame of the
// first scroll state, camera, pose, light and callout, so the handoff has nothing
// to jump between. The film simply starts being driven by the scrollbar.
//
// The event, in order:
//
//   0.00  NEAR DARK. The camera is already inside the machine — one joint at
//         arm's length, lit by almost nothing. You cannot yet tell how big it is.
//   0.00  A CONTROLLED REVEAL. The key comes up on its authored arc from the
//         direction's own `dark` setup into the first shot's. The joint resolves
//         out of the dark rather than fading up from black.
//   0.30  THE PULL. The camera withdraws from the detail to the opening station
//         and the machine assembles around what you were already looking at.
//         Scale arrives as a change of relationship, not as a caption.
//   0.30  The rig moves. A few degrees, no more — the thing is under power.
//   0.85  THE TYPE, cropped in with the direction's own entrance gesture. This is
//         the opening beat's real type, not a copy of it, so there is no second
//         reveal when the scroll starts.
//   1.35  THE FIRST CALLOUT STRIKES. The leader draws out from a real pivot, the
//         marker snaps on, the label and its measured value land. The annotation
//         language is established before the first scroll, on real geometry.
//   2.50  Scroll unlocks. Nothing moves at the seam.
//
// prefers-reduced-motion never gets here — that path goes straight to the
// authored still. `?nointro` skips it too, which is what the capture harness uses
// to photograph the scroll states.

import { gsap } from '../motion/context.js';
import { place } from './vfilm.js';
import { ENTER_FROM } from './vreveal.js';

const lerp = (a, b, t) => a + (b - a) * t;
const blend = (f, t, k) => place({
  az: lerp(f.az, t.az, k), r: lerp(f.r, t.r, k), h: lerp(f.h, t.h, k), fov: lerp(f.fov, t.fov, k),
  t: [lerp(f.t[0], t.t[0], k), lerp(f.t[1], t.t[1], k), lerp(f.t[2], t.t[2], k)],
});

export function playIntro(world, callouts, D) {
  const I = D.intro;
  const shot = D.shots[0];
  const section = document.getElementById(shot.id);
  const type = section ? [...section.querySelectorAll('[data-r]')] : [];
  const first = (shot.callouts ?? [])[0];

  // Hold the page at the top for the duration. There is no Lenis yet — vboot
  // starts it after this resolves — so the native overflow lock is the whole lock.
  scrollTo(0, 0);
  document.documentElement.dataset.intro = 'running';

  // opening state: inside the machine, in the dark, at rest
  world.rig.setPose(I.pose ?? 0.02);
  world.rigCam.cut(place(I.from));
  world.setLight(I.light, 1);
  world.touch();

  const enterFrom = ENTER_FROM[section?.dataset.enter ?? 'rise'] ?? ENTER_FROM.rise;
  if (type.length) gsap.set(type, { ...enterFrom });

  if (first) {
    callouts.setShot([first], shot.id);
    callouts.cue(1);
    callouts.setDraw(0);
  }

  const k = { cam: 0, light: 0, draw: 0 };
  const drive = () => {
    world.rigCam.cut(blend(I.from, shot.from, k.cam));
    world.rig.setPose(lerp(I.pose ?? 0.02, shot.pose[0], k.cam));
    world.setLight(shot.light, k.light, I.light);
    if (shot.pool) world.setPool(shot.pool);
    world.touch();
  };

  /*
    ?introat=<seconds> freezes the intro at one moment and never hands over, so
    the capture harness can photograph the sequence at exact times instead of
    racing a wall clock that headless software rendering does not keep.
  */
  const AT = new URLSearchParams(location.search).get('introat');

  return new Promise((resolve) => {
    const tl = gsap.timeline({
      onUpdate: drive,
      onComplete: () => {
        // Land EXACTLY on the first scroll state. The film's own first update
        // will write these same values, so the seam is a no-op.
        k.cam = 1; k.light = 1; drive();
        callouts.setDraw(1);
        delete document.documentElement.dataset.intro;
        scrollTo(0, 0);
        resolve();
      },
    });

    tl.to(k, { light: 1, duration: 0.95, ease: 'power2.out' }, 0)
      .to(k, { cam: 1, duration: 1.70, ease: 'power2.inOut' }, 0.30);

    if (type.length) {
      tl.to(type, {
        x: 0, y: 0, xPercent: 0, scale: 1, opacity: 1, filter: 'blur(0px)',
        duration: 1.05, ease: 'power3.out', stagger: 0.12,
      }, 0.85);
    }

    if (first) {
      tl.to(k, {
        draw: 1, duration: 1.10, ease: 'power2.out',
        onUpdate: () => callouts.setDraw(k.draw),
      }, 1.35);
    }

    tl.to({}, { duration: 0.1 }, I.duration ?? 2.45);

    // suppressEvents FALSE: gsap's seek defaults to suppressing callbacks, so the
    // tween values land on `k` but drive() never runs and the frozen frame shows
    // the intro's opening state at every requested time.
    if (AT != null) { tl.pause(parseFloat(AT), false); drive(); callouts.setDraw(k.draw); }
  });
}
