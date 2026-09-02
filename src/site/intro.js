// The opening — INDEX1 · KR 700 PA
//
// Two and a half seconds, and it is a SHOT rather than a loader. No progress
// bar, no spinner, no percentage: the machine is already there, and what the
// time buys is the light arriving and the camera settling into shot 01.
//
//   0.00  a near-black frame. One rim, nothing else readable.
//   0.30  the key comes up and the paint starts to exist
//   0.45  the camera leaves its high front three-quarter and starts down
//   0.70  KR 700 PA wipes up from behind its own baseline, per line
//   1.25  ENGINEERED IN MOTION contracts out of wide tracking
//   1.45  the machine makes one small mechanical settle — a real pose change,
//         not a bounce, driven through the same rig the scroll drives
//   2.60  everything has landed EXACTLY on shot 01's opening station
//
// WHY IT LANDS RATHER THAN ENDS. The final camera value is read from
// story.js's own opening station, so there is nothing to keep in sync — if that
// shot is re-framed, the intro follows it. Handing over to a different value is
// what produces the jump this is written to avoid.
//
// AND IT NEVER FIGHTS THE VISITOR. Any scroll, wheel, touch, key or click
// finishes the timeline immediately at its resolved state (MJ6 — the user keeps
// the transport). It also refuses to run at all under reduced motion, and it is
// skipped when the page is not loaded at the top, so a refresh half way down
// does not replay it.

import { gsap } from '../motion/context.js';
import { place, openingStation, OPEN } from './story.js';

const RAD = Math.PI / 180;

export function playIntro(world, { onDone } = {}) {
  const root = document.querySelector('[data-intro]');
  const target = place(openingStation(world.mobile));
  const start = place(OPEN);

  const finish = () => {
    world.rigCam.set(target);
    world.setLight('sculpt', 1);
    world.touch();
    root?.setAttribute('data-intro', 'done');
    onDone?.();
  };

  // Not the top of the page, no intro. A refresh at 60% should not replay an
  // opening the visitor already watched.
  if (!root || window.scrollY > 4) { finish(); return () => {}; }

  root.setAttribute('data-intro', 'running');

  // The camera is cut to the start so frame one is composed rather than a
  // default the rig happens to be holding.
  world.rigCam.cut(start);
  world.setLight('dark', 1);
  world.touch();

  const state = {
    t: 0,          // 0..1 along the camera leg
    pose: 0.10,    // the machine starts slightly off its rest and settles onto it
    light: 0,
  };

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    onUpdate: () => {
      world.rigCam.set(blend(start, target, state.t));
      world.setLight('sculpt', state.light, 'dark');
      world.rig.setPose(state.pose);
      world.touch();
    },
    onComplete: finish,
  });

  // 0.30 — light arrives first. The machine is revealed by being lit, which is
  // the only reveal a machine actually has.
  tl.to(state, { light: 1, duration: 1.5, ease: 'power2.out' }, 0.30);

  // 0.45 — the camera comes down and in. Long and eased so it is still moving
  // under the type rather than waiting for it.
  tl.to(state, { t: 1, duration: 2.0, ease: 'power3.inOut' }, 0.45);

  // 1.45 — one mechanical settle. A real pose change through the real rig, so
  // the linkage moves the way it will move for the rest of the page.
  tl.to(state, { pose: 0.0, duration: 1.0, ease: 'power2.inOut' }, 1.45);

  /* ── typography ────────────────────────────────────────────────────────
     A clip wipe per line, not an opacity fade. The lines are already in the
     document at their final size — this reveals them, it does not create them,
     so with the script gone the type is simply there (G7, DNA74). */
  const lines = gsap.utils.toArray('[data-intro] .intro__line');
  tl.fromTo(lines,
    { clipPath: 'inset(0 0 100% 0)', yPercent: 18 },
    { clipPath: 'inset(0 0 -12% 0)', yPercent: 0, duration: 0.85, stagger: 0.11, ease: 'power3.out' },
    0.70);

  // The secondary line contracts out of wide tracking rather than fading in.
  const sub = document.querySelector('[data-intro] .intro__sub');
  if (sub) {
    tl.fromTo(sub,
      { letterSpacing: '0.85em', opacity: 0 },
      { letterSpacing: '0.22em', opacity: 1, duration: 0.9, ease: 'power3.out' },
      1.25);
  }

  // The whole type block clears as the camera arrives, so shot 01's own copy is
  // not competing with it.
  tl.to('[data-intro] .intro__type', { opacity: 0, duration: 0.5, ease: 'power2.in' }, 2.10);

  /* ── the visitor always wins ───────────────────────────────────────────── */
  window.__intro = tl;

  const bail = (e) => {
    window.__introBail = e?.type ?? 'unknown';
    tl.progress(1);   // resolves to exactly the same landing state
    tl.kill();
    release();
  };
  const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
  const onScroll = () => { if (window.scrollY > 4) bail(); };
  const release = () => {
    for (const e of events) window.removeEventListener(e, bail);
    window.removeEventListener('scroll', onScroll);
  };
  for (const e of events) window.addEventListener(e, bail, { passive: true, once: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  return () => { tl.kill(); release(); };
}

function blend(a, b, t) {
  return {
    position: {
      x: a.position.x + (b.position.x - a.position.x) * t,
      y: a.position.y + (b.position.y - a.position.y) * t,
      z: a.position.z + (b.position.z - a.position.z) * t,
    },
    target: {
      x: a.target.x + (b.target.x - a.target.x) * t,
      y: a.target.y + (b.target.y - a.target.y) * t,
      z: a.target.z + (b.target.z - a.target.z) * t,
    },
    fov: a.fov + (b.fov - a.fov) * t,
  };
}

export { RAD };
