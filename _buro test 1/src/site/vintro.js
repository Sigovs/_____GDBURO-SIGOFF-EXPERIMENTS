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

/*
  THE DESIGNATION IS SPLIT AT RUNTIME, NOT IN THE MARKUP.

  The h1 ships as one real word so it is still the document's heading, still the
  LCP element, and still correct with scripts off. Only when the intro is actually
  going to play does it become letters — each glyph in its own clipping wrapper so
  it can wipe in from its own left edge instead of flying across its neighbours.

  The clip is `inset(-30% 0 -30% 0)`: horizontal only. `overflow: hidden` would
  have cut the cap heights, because the monument is set at 0.84 line-height and
  the caps stand taller than their own line box.

  Accessibility: the element keeps the whole word as its label and every letter is
  hidden from the tree, so a screen reader still reads "KR700PA" and not seven
  separate characters.
*/
const splitChars = (el) => {
  const text = el.textContent.trim();
  if (!text) return [];
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const chars = [];
  for (const ch of text) {
    const wrap = document.createElement('span');
    wrap.className = 'mon__w';
    wrap.setAttribute('aria-hidden', 'true');
    const glyph = document.createElement('span');
    glyph.className = 'mon__c';
    glyph.textContent = ch;
    wrap.append(glyph);
    el.append(wrap);
    chars.push(glyph);
  }
  return chars;
};

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

  /*
    THE DESIGNATION GETS ITS OWN GESTURE, SO IT LEAVES THE BLOCK LIST.

    Everything else in the opening beat uses the section's authored entrance as
    one move. The word does not: it is the first thing on the page and the only
    element big enough for a per-letter reveal to read as an event rather than as
    a fidget. It is held at rest while its own letters carry the motion.
  */
  const mon = section?.querySelector('[data-split="chars"]');
  const chars = mon ? splitChars(mon) : [];
  const blocks = chars.length ? type.filter((n) => n !== mon) : type;

  const enterFrom = ENTER_FROM[section?.dataset.enter ?? 'rise'] ?? ENTER_FROM.rise;
  if (blocks.length) gsap.set(blocks, { ...enterFrom });
  if (chars.length) {
    gsap.set(mon, { x: 0, y: 0, xPercent: 0, scale: 1, opacity: 1, filter: 'none' });
    gsap.set(chars, { xPercent: -108, opacity: 0 });
  }

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
    /*
      THE LOCK MUST ALWAYS COME OFF.

      The intro holds the page at the top, so anything that stops the timeline
      finishing — a throw inside drive(), a tab suspended across the whole 2.5 s —
      would leave a site nobody can scroll. The deadline is the guarantee: the
      handoff runs on whichever comes first.
    */
    let done = false;
    let tl;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(deadline);
      /*
        KILL THE TIMELINE, not just the lock.

        The deadline is wall-clock and the timeline is ticker-time, and under the
        first heavy WebGL frames those two diverge. When the deadline won the race
        it handed over correctly and then the still-running timeline kept driving
        the camera back toward the intro station — the page sat inside the machine
        until the first scroll event snapped it out. Whichever path finishes has
        to end the other one.
      */
      tl?.kill();
      // Land EXACTLY on the first scroll state. The film's own first update
      // will write these same values, so the seam is a no-op.
      k.cam = 1; k.light = 1;
      try { drive(); callouts.setDraw(1); } catch (e) { console.error('[intro]', e); }
      if (type.length) gsap.set(type, { x: 0, y: 0, xPercent: 0, scale: 1, opacity: 1, filter: 'none' });
      // the deadline can win mid-word; the letters have to land too
      if (chars.length) gsap.set(chars, { xPercent: 0, opacity: 1 });
      delete document.documentElement.dataset.intro;
      scrollTo(0, 0);
      resolve();
    };
    const deadline = setTimeout(finish, ((I.duration ?? 2.45) + 3.0) * 1000);

    tl = gsap.timeline({
      onUpdate: drive,
      onComplete: finish,
    });

    tl.to(k, { light: 1, duration: 0.95, ease: 'power2.out' }, 0)
      .to(k, { cam: 1, duration: 1.70, ease: 'power2.inOut' }, 0.30);

    if (blocks.length) {
      tl.to(blocks, {
        x: 0, y: 0, xPercent: 0, scale: 1, opacity: 1, filter: 'blur(0px)',
        duration: 1.05, ease: 'power3.out', stagger: 0.12,
      }, 0.85);
    }

    /*
      LETTER BY LETTER, AND EARLY.

      It starts at 0.72 — ahead of the rest of the type — because seven letters at
      0.06 apart take four tenths to lay down, and the word has to be finished
      before the callout strikes at 1.35 or the frame has two things being drawn
      at once. Each glyph wipes in from its own left edge inside its own clip, so
      no letter ever crosses the one beside it.
    */
    if (chars.length) {
      tl.to(chars, {
        xPercent: 0, opacity: 1,
        duration: 0.86, ease: 'power3.out', stagger: 0.06,
      }, 0.72);
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
    if (AT != null) { clearTimeout(deadline); tl.pause(parseFloat(AT), false); drive(); callouts.setDraw(k.draw); }
  });
}
