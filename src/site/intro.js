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

/**
 * Puts the world on the opening's FIRST FRAME without starting anything.
 *
 * Why this is separate. createScene resolving and playIntro running used to be
 * the same instant, so the gap between them was not a frame anybody could see.
 * The loader opened that gap: it can hold for up to its floor after the scene is
 * ready, and in that window the rig renders wherever it happens to be standing —
 * a lit machine at a default camera, which is a frame nobody composed and one the
 * visitor can sit and look at (MJ4, DNA87). Arming closes the gap: the scene's
 * first painted frame is the frame the opening was built to start from.
 */
export function armIntro(world) {
  world.rigCam.cut(place(OPEN));
  world.setLight('dark', 1);
  world.touch();
}

export function playIntro(world, { onDone, revealType = true } = {}) {
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
  // default the rig happens to be holding. Idempotent: index.js has usually done
  // this already, before the loader was allowed to clear.
  armIntro(world);

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

  /* ── the board ─────────────────────────────────────────────────────────
     The designation is SET, one character at a time, the way an airport board
     sets a destination: each cell runs through the alphabet and stops, left to
     right. It is not a fade and it is not a wipe — a board commits to a letter,
     and the commitment is the gesture.

     Every cell is given a fixed width in `em` from its own measured advance
     before anything moves. Without that the line breathes by tens of pixels
     while it settles, because the face is proportional and the characters it
     passes through are not the characters it lands on — and the one thing this
     line is asked to do is hold the width of the screen.

     The h1 carries aria-label, so the accessible name is the designation
     throughout rather than whatever pile of glyphs is on the board this frame. */
  const board = revealType ? document.querySelector('[data-flap]') : null;
  if (board) {
    const glyphs = split(board, 'flap');
    lockWidths(board, glyphs);
    setBoard(tl, glyphs, 0.62);
  }

  /* ── the secondary line ────────────────────────────────────────────────
     It lives at the foot of the screen — that is its place in the stylesheet,
     not somewhere it is carried to — and it steps in FROM THE SIDE once the
     movement has finished, one character at a time. It runs whether or not the
     board did: the loader may have spent the title's reveal, but nobody has read
     this line yet. */
  const sub = document.querySelector('[data-intro-sub]');
  if (sub) {
    const steps = split(sub, 'step');
    tl.fromTo(steps,
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.62, stagger: 0.028, ease: 'power3.out' },
      2.15);
  }

  /* ── the departure ─────────────────────────────────────────────────────
     The type does not dissolve in front of the machine. It goes BEHIND it, and
     gets quieter for the reason anything gets quieter with distance.

     This is what the transparent canvas bought. At 1.95 the block drops below
     the stage in the stacking order, and from that instant the machine occludes
     it — while the camera is still travelling down and in, so the occlusion
     reads as the machine coming forward rather than as a layer being switched.
     Scale and opacity carry the rest of the distance.

     AND IT LANDS AT A DISTANCE RATHER THAN AT NOTHING. 0.34 is a value that is
     still there: the name of the machine, at depth, behind the machine. What
     takes it away is the SCROLL — reveal.js carries it off across shot 01 — so
     the opening ends by handing the type to the journey instead of deleting it.
     A fade to zero would have said the title was a splash screen. It is not; it
     is the first thing in the room. */
  tl.to('[data-intro] .intro__type', {
    scale: 0.87,
    opacity: 0.34,
    duration: 0.95,
    ease: 'power2.inOut',
    onStart: () => root.setAttribute('data-behind', ''),
  }, 1.95);

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

const FLAP_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Wraps every character of an element in its own cell. Idempotent, and it moves
 * the author's characters rather than composing new text: `data-final` holds what
 * each cell must end on, and every animation below restores it.
 */
function split(el, className) {
  if (el.dataset.cells !== undefined) return [...el.querySelectorAll('.' + className)];
  const cells = [];
  const frag = document.createDocumentFragment();
  for (const ch of el.textContent) {
    const cell = document.createElement('span');
    cell.className = className;
    cell.textContent = ch;
    cell.dataset.final = ch;
    frag.appendChild(cell);
    cells.push(cell);
  }
  el.replaceChildren(frag);
  el.dataset.cells = '';
  return cells;
}

/** Pins each cell to its own advance, in em so it survives a resize. */
function lockWidths(el, cells) {
  const size = parseFloat(getComputedStyle(el).fontSize) || 16;
  for (const cell of cells) {
    const width = cell.getBoundingClientRect().width;
    if (width > 0) cell.style.width = (width / size).toFixed(4) + 'em';
  }
}

/** The split-flap. Deterministic: a page is not a slot machine. */
function setBoard(tl, cells, at) {
  cells.forEach((cell, i) => {
    const final = cell.dataset.final;
    if (final === ' ') return;
    const spins = 9 + (i % 4) * 3;
    const state = { t: 0 };
    tl.to(state, {
      t: 1,
      duration: 0.58,
      ease: 'power2.out',
      onUpdate: () => {
        const step = Math.floor(state.t * spins);
        cell.textContent = step >= spins
          ? final
          : FLAP_ALPHABET[(step * 5 + i * 11) % FLAP_ALPHABET.length];
        cell.style.transform = `translateY(${(1 - state.t) * -16}%)`;
      },
      onComplete: () => { cell.textContent = final; cell.style.transform = ''; },
    }, at + i * 0.055);
  });
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
