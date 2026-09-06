// Text choreography — INDEX1 · KR 700 PA
//
// Every block of type on this page is STAGED: it arrives as a sequence, it holds,
// and it leaves as a sequence. No two shots use the same entrance, no two use the
// same exit, and nothing here fades in, waits, and fades out.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS WAS REBUILT
//
// The previous version triggered each block on its own section at `top 80%`. A
// shot section is 105–170vh tall and its copy is `position: sticky`, so by the
// time a section's TOP reached 80% of the viewport its copy was already pinned
// and on screen — while the PREVIOUS shot still owned the frame. Verified on
// stopped frames rather than reasoned about: at scroll 2080, still inside shot
// 02, shot 03's "Four axes. One motion." was fully present and shot 02's own
// "2 744" had already gone. Every block on the page was running one shot early,
// and the macro shot was showing "is mechanical." with its first line already
// exited — a statement left hanging in half.
//
// The fix is not a different percentage. It is that TEXT MUST BE CUED FROM THE
// SHOT'S OWN SCROLL WINDOW — the same window the camera runs in — rather than
// from the section box entering the viewport.
//
// ─────────────────────────────────────────────────────────────────────────────
// HOW IT WORKS
//
// Each shot gets one ScrollTrigger spanning exactly the shot's range (`top top`
// → `bottom top`), identical to the camera's. Inside it, authored CUES fire: at
// `in` the entrance timeline plays, at `out` the exit plays. Scrolling back
// reverses them.
//
// The timelines are NOT scrubbed. The scroll says WHEN; the gesture keeps its own
// clock and its own easing. That is the difference between type dragged by a
// wheel and type that arrives.
//
// CAMERA, ROBOT, LIGHT AND TEXT RUN ON DIFFERENT WINDOWS. The camera eases across
// the whole shot, the pose runs on its own sub-window inside it, the light
// crossfades over the first 45%, and the cues below share a boundary with none of
// them. Nothing on this page starts or stops together.

import { gsap, ScrollTrigger } from '../motion/context.js';

/*
  THE CHOREOGRAPHY.

  `in` / `out` are positions along the SHOT's own progress. They are deliberately
  uneven: a shot whose camera arrives early gives its type a later cue, and a shot
  that has to clear the frame for what follows starts leaving sooner.

  The pairing of gestures is the composition's, not a default — the shot whose
  figure is cropped hard left leaves by being cropped further; the shot built on
  two stacked lines unwinds them in reverse; the closing statement clears early so
  the record arrives into air rather than onto the back half of a sentence.
*/
const CHOREO = {
  impact: { in: 0.02, out: 0.60, enter: 'lateralRight', exit: 'pushRight' },
  scale:  { in: 0.14, out: 0.72, enter: 'fromOutside',  exit: 'cropOut' },
  rear:   { in: 0.10, out: 0.76, enter: 'lineTravel',   exit: 'reverseLift' },
  above:  { in: 0.17, out: 0.70, enter: 'maskDown',     exit: 'liftUp' },
  /*
    THE MACRO'S WINDOW WAS RUNNING AGAINST ITS OWN CAMERA.

    It was `in: 0.05, out: 0.56`. This shot's camera is `easeOut(t / 0.52)`, so
    the approach is still travelling for the first half and the composed macro
    frame — one joint, filling the screen — only exists from about 0.52 onward.
    The copy therefore arrived while the camera was still moving and left at the
    moment the frame it belongs to resolved. Measured on settled frames: both
    lines at full opacity from 0.10 to 0.45, and BOTH AT ZERO from 0.62 to 1.00.
    Thirty-eight percent of the shortest shot on the page carried no statement at
    all, and it was the thirty-eight percent worth looking at.

    Moved to sit on the arrival instead of ahead of it. The separation also
    matters on its own: at 0.05/0.56 the entrance (0.85s plus stagger) was still
    resolving when the exit began, so the pair never both reached full opacity in
    the same frame — a two-line statement that is never once fully present.
  */
  macro:  { in: 0.16, out: 0.84, enter: 'lateralLeft',  exit: 'trailLeft' },
  hero:   { in: 0.12, out: 0.80, enter: 'riseBehind',   exit: 'clearEarly' },
};

/*
  Ordered targets per shot — the order IS the sequence. Headings are split into
  their authored lines first, so a two-line statement is two steps rather than one
  block.
*/
const TARGETS = {
  impact: ['.kicker', '.edge'],
  scale:  ['.stat__fig', '.stat__unit', '.stat__cap'],
  // The leader is always LAST in its shot's sequence: it annotates a composition,
  // so it arrives once that composition is there to annotate.
  rear:   ['@lines'],
  above:  ['.edge', '.stat__fig', '.stat__unit', '.stat__cap'],
  macro:  ['@lines'],
  hero:   ['@lines'],
};

const BLUR = 10;

/* ── the vocabulary ─────────────────────────────────────────────────────────
   Six entrances, six exits, and none of them is a fade.

   Overlap is built in: every stagger is shorter than the step it staggers, so a
   step begins while the one before it is still moving. Equal, non-overlapping
   delays are what makes a sequence read as a machine ticking rather than as a
   composition assembling. */

const ENTER = {
  // 01 — corner copy, anchored to the right edge, arriving from it.
  lateralRight: (els) => gsap.timeline({ paused: true }).fromTo(els,
    { x: 74, opacity: 0, filter: `blur(${BLUR}px)` },
    { x: 0, opacity: 1, filter: 'blur(0px)', duration: 0.95, ease: 'power3.out', stagger: 0.14 }),

  // 02 — the figure is enormous and cropped hard left, so it comes from OUTSIDE
  // the frame rather than up from under it. Unit and caption follow on a much
  // shorter travel: they belong to the figure, they do not race it.
  fromOutside: (els) => {
    const [fig, ...rest] = els;
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(fig, { xPercent: -118, opacity: 0 },
      { xPercent: 0, opacity: 1, duration: 1.25, ease: 'power3.out' }, 0);
    if (rest.length) tl.fromTo(rest, { x: -46, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out', stagger: 0.12 }, 0.42);
    return tl;
  },

  // 03 — line by line, travelling up from under their own baseline.
  lineTravel: (els) => gsap.timeline({ paused: true }).fromTo(els,
    { yPercent: 105, opacity: 0, clipPath: 'inset(0 0 100% 0)' },
    { yPercent: 0, opacity: 1, clipPath: 'inset(0 0 -18% 0)', duration: 1.05,
      ease: 'power3.out', stagger: 0.19, clearProps: 'clipPath' }),

  // 04 — the camera is looking DOWN here, so the type is uncovered downward: a
  // mask opening from the top edge, moving the way the camera is moving.
  maskDown: (els) => gsap.timeline({ paused: true }).fromTo(els,
    { clipPath: 'inset(100% 0 0 0)', y: -34, opacity: 0 },
    { clipPath: 'inset(-18% 0 0 0)', y: 0, opacity: 1, duration: 1.0,
      ease: 'power3.out', stagger: 0.16, clearProps: 'clipPath' }),

  // 05 — two words in a corner, almost absent. Short and fast, because the macro
  // is the briefest shot on the page.
  lateralLeft: (els) => gsap.timeline({ paused: true }).fromTo(els,
    { x: -88, opacity: 0, filter: `blur(${BLUR}px)` },
    { x: 0, opacity: 1, filter: 'blur(0px)', duration: 0.85, ease: 'power3.out', stagger: 0.11 }),

  // 06 — the closing statement rises out of a deep blur with a long overlap. It
  // sits BEHIND the machine, so the arm extending through it is part of the
  // reveal rather than something happening in front of it.
  riseBehind: (els) => gsap.timeline({ paused: true }).fromTo(els,
    { y: 104, opacity: 0, filter: 'blur(16px)' },
    { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.35, ease: 'power3.out', stagger: 0.22 }),
};

const EXIT = {
  // 01 — the camera swings off the machine to the right; the copy goes with it.
  pushRight: (els) => gsap.timeline({ paused: true }).to(els,
    { x: 96, opacity: 0, filter: `blur(${BLUR}px)`, duration: 0.85, ease: 'power2.in', stagger: 0.09 }),

  // 02 — the camera pulls back, so the figure does the opposite: it grows past
  // the frame and is cropped out by it. Origin left, the edge it was cropped
  // against on the way in.
  cropOut: (els) => {
    const [fig, ...rest] = els;
    const tl = gsap.timeline({ paused: true });
    if (rest.length) tl.to(rest, { x: -40, opacity: 0, duration: 0.6, ease: 'power2.in', stagger: 0.08 }, 0);
    tl.to(fig, { scale: 1.42, opacity: 0, transformOrigin: '0% 50%', duration: 0.95, ease: 'power2.in' }, 0.14);
    return tl;
  },

  // 03 — REVERSE ORDER. The second line leaves first and the first follows, so
  // the statement unwinds the way it was built instead of collapsing.
  reverseLift: (els) => gsap.timeline({ paused: true }).to(els,
    { yPercent: -78, opacity: 0, duration: 0.9, ease: 'power2.in',
      stagger: { each: 0.14, from: 'end' } }),

  // 04 — uncovered downward, so it leaves upward, off the top edge.
  liftUp: (els) => gsap.timeline({ paused: true }).to(els,
    { y: -74, opacity: 0, filter: `blur(${BLUR}px)`, duration: 0.85, ease: 'power2.in', stagger: 0.1 }),

  // 05 — trails back out the edge it came from, last word first, and tight
  // enough that no single word is ever left standing alone in the corner. That
  // was a real defect: "Precision" had gone and "is mechanical." was still there.
  trailLeft: (els) => gsap.timeline({ paused: true }).to(els,
    { x: -96, opacity: 0, duration: 0.7, ease: 'power2.in',
      stagger: { each: 0.08, from: 'end' } }),

  // 06 — clears early and nearly together. The record needs to arrive into air.
  clearEarly: (els) => gsap.timeline({ paused: true }).to(els,
    { y: -58, opacity: 0, filter: 'blur(14px)', duration: 1.0, ease: 'power2.in', stagger: 0.1 }),
};

/* ── counters ──────────────────────────────────────────────────────────────── */

const FIGURES = ['.stat__fig', '.record .fig'];

/**
 * Parses an authored figure into something countable. Returns null for anything
 * it cannot read back exactly — a cell like "3 × 1 300 mm" carries two numbers
 * and an operator, and a counter that picks one of them is telling a story about
 * the wrong quantity.
 */
function parseFigure(text) {
  const trimmed = text.trim();
  const match = trimmed.match(/^(\d[\d   ]*)(?:([.,])(\d+))?(\s*[^\d]*)$/);
  if (!match) return null;

  const [, intPart, decimalMark, decimals, tail] = match;
  const separator = /[   ]/.test(intPart) ? intPart.match(/[   ]/)[0] : '';
  const digits = intPart.replace(/[   ]/g, '');
  const value = Number(digits + (decimals ? '.' + decimals : ''));
  if (!Number.isFinite(value)) return null;

  return { value, places: decimals ? decimals.length : 0, separator,
           decimalMark: decimalMark ?? '.', tail, original: text };
}

/** Renders an in-flight value using the authored grouping, never the locale's. */
function render(spec, value) {
  const fixed = value.toFixed(spec.places);
  const [whole, fraction] = fixed.split('.');
  const grouped = spec.separator
    ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, spec.separator)
    : whole;
  return grouped + (spec.places ? spec.decimalMark + fraction : '') + spec.tail;
}

/**
 * Wraps each authored line of a heading in its own block span.
 *
 * Lines are the ones the AUTHOR wrote — the <br>s already in the document — not
 * lines measured off the rendered box. A measured split has to be redone on every
 * resize and it re-wraps mid-animation; an authored split is the same lines at
 * every viewport, which is what the compositions were laid out around.
 *
 * Idempotent, and it never changes what the document says.
 */
function splitLines(heading) {
  if (heading.dataset.split !== undefined) return [...heading.querySelectorAll('.line')];
  heading.dataset.split = '';

  if (heading.classList.contains('stat')) {
    const parts = [...heading.children];
    for (const part of parts) part.classList.add('line');
    return parts;
  }

  const groups = [[]];
  for (const node of [...heading.childNodes]) {
    if (node.nodeName === 'BR') groups.push([]);
    else groups[groups.length - 1].push(node);
  }

  const lines = [];
  for (const group of groups) {
    if (!group.length) continue;
    const line = document.createElement('span');
    line.className = 'line';
    for (const node of group) line.appendChild(node);
    lines.push(line);
  }
  heading.replaceChildren(...lines);
  return lines;
}

/** Resolves a shot's ordered target list into real elements, in order. */
function collect(section, spec) {
  const out = [];
  for (const token of spec) {
    if (token === '@lines') {
      for (const heading of section.querySelectorAll('h2')) out.push(...splitLines(heading));
    } else {
      out.push(...section.querySelectorAll(token));
    }
  }
  return out.filter(Boolean);
}

/**
 * @param {Element} scope
 * @param {{ reduced?: boolean }} options
 * @returns {() => void} teardown
 */
export function createReveals(scope, { reduced = false } = {}) {
  if (reduced) return () => {};

  const ctx = gsap.context(() => {
    for (const [id, cue] of Object.entries(CHOREO)) {
      const section = document.getElementById(id);
      if (!section) continue;
      const els = collect(section, TARGETS[id] ?? []);
      if (!els.length) continue;

      const enter = ENTER[cue.enter](els);
      const exit = EXIT[cue.exit](els);

      // The from-state is applied by SCRIPT and not by the stylesheet: with this
      // module gone the page is simply already arrived (G7, DNA74), which is the
      // whole reason the hidden state cannot live in the CSS. Applied below, in
      // the order the note on `settle` explains.

      const state = { in: false, out: false };

      /*
        SETTLING, NOT JUST CUEING.

        onUpdate only fires while a trigger is ACTIVE. Jump the scroll straight
        past a whole section — a flick on a phone, an anchor, a restored position
        — and the trigger goes from before-start to after-end without ever
        reporting an intermediate progress, so the cues never fire and the block
        is left in whatever state it was last in. That is exactly how two shots'
        copy ended up on screen together on mobile, where the sections are shorter
        and a single flick clears one whole.

        So the boundaries force the terminal state directly rather than animating
        to it: past the end everything has entered and exited; before the start
        nothing has. `settle` is idempotent, so a real scroll through still plays
        the gestures and only a skipped section is snapped.
      */
      const settle = (past) => {
        state.in = past;
        state.out = past;
        /*
          THE ORDER IS THE WHOLE FIX.

          Both timelines own the same properties on the same elements. `exit` is
          a `.to()`, so its START values are whatever the element held when it
          first rendered — full opacity. Restoring `exit` to progress 0 therefore
          WRITES opacity 1 back, and doing that after the entrance had been reset
          undid it. On a fresh mobile load ScrollTrigger settles every downstream
          trigger at once, so every shot ahead of the visitor was left visible:
          at the first screen all six shots' copy was on the page at the same
          time, and each one only vanished later when its own exit finally ran.

          So: going forward, enter finishes then exit runs. Going back, exit
          rewinds first and the entrance is re-armed last, which leaves the
          hidden from-state as the one that stuck.
        */
        if (past) { enter.progress(1).pause(); exit.progress(1).pause(); }
        else { exit.progress(0).pause(); enter.progress(0).pause(); }

        /*
          AND THEN SAY IT OUTRIGHT.

          Both branches mean the same thing for what is on screen: before its cue
          the block has not arrived, after its exit it has gone, and in neither
          case is it visible. Restoring that through two timelines that both own
          opacity leaves it depending on which one wrote last — and it did fail:
          shot 01's "Nothing here moves by accident." was measured at full opacity
          in the top-right of SHOT 02, one whole section after it should have
          cleared, because a refresh had re-run the timelines in the other order.

          One line, no inference. The gestures still play on a real scroll; this
          only fixes where a skipped or refreshed section leaves them.
        */
        gsap.set(els, { opacity: 0 });
      };

      // And the same order at build: arm the exit's start values, then hide.
      exit.progress(0).pause();
      enter.progress(0).pause();

      ScrollTrigger.create({
        trigger: section,
        // The SHOT's own window — the same range the camera runs in — so a cue at
        // 0.14 is fourteen percent into THIS shot rather than somewhere in the
        // previous one.
        start: 'top top',
        end: 'bottom top',
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;

          if (p >= cue.in && !state.in) { state.in = true; enter.play(); }
          else if (p < cue.in && state.in) { state.in = false; enter.reverse(); }

          if (p >= cue.out && !state.out) { state.out = true; exit.play(); }
          else if (p < cue.out && state.out) { state.out = false; exit.reverse(); }
        },
        onLeave: () => settle(true),        // scrolled off the end: it has been and gone
        onLeaveBack: () => settle(false),   // scrolled back before it: it has not happened
      });
    }

    /* ── the record ────────────────────────────────────────────────────────
       Not a shot: the page's resolution, arriving on its own block rather than a
       camera window. Heading first, then the rows counting down the column, then
       the prose — a staged sequence like the rest, not a fade. */
    const record = document.querySelector('.record');
    if (record) {
      const head = [...record.querySelectorAll('h2')].flatMap(splitLines);
      const body = gsap.utils.toArray(record.querySelectorAll('.note-wrap, .provenance'));
      const rows = gsap.utils.toArray(record.querySelectorAll('.plate tr'));

      const tl = gsap.timeline({
        // 32%, not 78%. At 78% the record's heading was already on screen while
        // the hero shot was still at 45% of its own scrub — verified on a stopped
        // frame: the orange plate sat under "The hand that never tilts." for a
        // third of a viewport. 32% puts the arrival at hero progress ~0.79, which
        // is one beat before the hero's own exit cue at 0.80: they overlap on
        // purpose, and nothing else on the page fires there.
        scrollTrigger: { trigger: record, start: 'top 32%', once: true, invalidateOnRefresh: true },
      });
      /*
        immediateRender is explicit on every one of these.

        A `from` inside a timeline that is waiting on a ScrollTrigger does not
        reliably render its start values before that trigger fires, and the
        record's heading was the proof: measured on a fresh load, the orange
        "Measured, not quoted" plate sat at opacity 1 from hero progress 0.45,
        under "The hand that never tilts.", for roughly half the closing shot.
        The rows were correctly hidden — they only looked wrong in a long session
        because `once: true` had already spent them on an earlier pass.

        Forcing the start state at build is what the shot timelines above already
        do by calling progress(0) on themselves; this is the same guarantee.
      */
      if (head.length) tl.from(head, { x: -60, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, immediateRender: true }, 0);
      if (body.length) tl.from(body, { y: 24, opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1, immediateRender: true }, 0.22);
      if (rows.length) tl.from(rows, { x: -28, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.045, immediateRender: true }, 0.3);
    }

    /* ── counters ──────────────────────────────────────────────────────────
       2.6s on power1.out — nearly linear with a long settle, so the figure
       arrives rather than lunging at the answer. It starts at the smallest value
       with the SAME digit count, so the width never changes as it counts and the
       unit beside it does not shuffle. Cued off the shot, not the element, so it
       counts while the figure is actually on screen. */
    for (const selector of FIGURES) {
      for (const el of gsap.utils.toArray(selector)) {
        const spec = parseFigure(el.textContent);
        if (!spec) continue;
        const state = { v: spec.value >= 10 ? 10 ** (String(Math.floor(spec.value)).length - 1) : 0 };
        gsap.to(state, {
          v: spec.value,
          duration: 2.6,
          ease: 'power1.out',
          onUpdate: () => { el.textContent = render(spec, state.v); },
          onComplete: () => { el.textContent = spec.original; },
          scrollTrigger: {
            trigger: el.closest('.shot') ?? el,
            start: el.closest('.shot') ? 'top 30%' : 'top 80%',
            once: true,
          },
        });
      }
    }

    /*
      The opening's type does not vanish when the opening ends. It has stepped
      back behind the machine and it STAYS there, at a distance, until the visitor
      leaves the first shot — so what carries it away is the journey rather than a
      timer. Scrubbed on purpose: this one is a departure the visitor is driving.
    */
    const intro = gsap.utils.toArray('[data-intro], [data-intro-sub]');
    if (intro.length) {
      gsap.to(intro, {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '#impact', start: 'top top', end: 'bottom top',
          scrub: true, invalidateOnRefresh: true,
        },
      });
    }

  }, scope);

  return () => ctx.revert();
}
