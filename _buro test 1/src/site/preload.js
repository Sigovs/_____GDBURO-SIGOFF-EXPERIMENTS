// The wait — INDEX1 · KR 700 PA
//
// A tumbling wireframe cube with a plus on each face, and one status word under
// it. Ported from a React + Tailwind + shadcn component; this project is Vite
// and vanilla JS, so it is the same object rebuilt in the stack that is here.
//
// WHAT THE PORT CHANGED, AND WHY
//
//   THE SPIN IS CSS, NOT A TIMER. The source drove rotation from a 16ms
//   setInterval writing React state — a re-render per frame, on a timer that
//   does not know what a frame is, and one that keeps running in a background
//   tab. The transform is a compositor property; a keyframe animation is the
//   cheaper and steadier way to say the same thing, and it stops on its own when
//   the page is hidden.
//
//   THE STATUS WORD IS BOUND TO THE REAL PHASE. The source cycled six words —
//   Fetching, Fixing, Updating, Placing, Syncing, Processing — on a 600ms timer
//   regardless of what was happening, and four of them named work the component
//   cannot do. On a page whose entire argument is that its figures were measured
//   rather than quoted, a loader narrating invented work would be the single
//   dishonest mark on it (CP1). So there are two words, and both are true: the
//   bytes are arriving, or they have arrived and are being decoded.
//
//   THE PLUS IS DRAWN, NOT IMPORTED. lucide-react is a React icon set and there
//   is no React here. The glyph is two rules at the same 1px the cube's edges
//   are, which is what the type rules ask of an icon anyway — one set, stroke
//   matched to its neighbours rather than to its own library's default.
//
//   IT IS ORANGE. --accent, which is the machine's own paint lifted until it
//   clears 3:1 as a hairline. Not a new colour: the same pigment already carrying
//   the level line.
//
// WHY IT USUALLY WOULD NOT APPEAR, AND WHAT WAS DONE ABOUT IT. A loader is only
// honest about a wait that exists, and on localhost or a warm cache the model is
// there in one frame. But a loader nobody ever sees is also a loader nobody can
// judge. So: a 120ms threshold before it may paint, a 900ms floor once it has —
// no flash-and-gone — and `?preload=1` forces it, the same device this project
// already uses for `?reduced=1`, and for the same reason: a path that cannot be
// opened on purpose is a path that never gets looked at (DNA88).
//
// AND IT NEVER OUTLIVES ITS JOB. One overlay, counted, with a guaranteed removal
// path on the success branch, the failure branch and teardown.

const APPEAR_AFTER = 120;   // under this the wait is not worth a mark on the page
const MIN_ON_SCREEN = 900;  // once it is up it stays long enough to be read

// Forced demonstration. It holds the loader open for a fixed spell so the thing
// can actually be looked at on a machine where the model arrives instantly.
const FORCE = new URLSearchParams(location.search).get('preload');
const FORCED_MS = FORCE === null ? 0 : Math.min(Math.max(Number(FORCE) || 2600, 600), 15000);

export function createPreloader({ reduced = false } = {}) {
  const root = document.querySelector('[data-preload]');
  const status = root?.querySelector('[data-preload-status]');

  const started = performance.now();
  let shownAt = 0;
  let shown = false;
  let settled = false;
  let removal = null;
  let phase = '';

  const say = (word) => {
    if (phase === word || !status) return;
    phase = word;
    status.textContent = word;
  };
  say('Fetching');

  /**
   * Seats the group in the clear band under the opening's type.
   *
   * It is placed rather than centred: dead centre puts an orange 1px cube on top
   * of 187px of near-white letterforms, where a hairline sits at 1.7:1 against
   * the glyphs and simply disappears (color I1). The band below the type is the
   * ground the accent was derived to clear 3:1 against, and it is empty.
   *
   * Measured rather than written, because the type is sized in vw and any
   * vmin/vh expression for the offset drifts away from it as the viewport changes
   * proportion — silently, and only on some windows.
   */
  function fit() {
    const title = document.querySelector('[data-intro] .intro__title');
    const sub = document.querySelector('[data-intro] .intro__sub');
    if (!title || !root) return false;

    const a = title.getBoundingClientRect();
    const b = sub?.getBoundingClientRect() ?? a;
    const bottom = Math.max(a.bottom, b.bottom);
    if (a.width < 1) return false;

    const vh = window.innerHeight;
    const band = vh - bottom;

    // The group is ~132px tall — cube, gap, label. Below about 150px of band
    // there is nowhere to seat it that is not touching the type.
    if (band < 150) {
      // Not enough air under the type: sit it in the band ABOVE instead, which
      // on a short window is the larger of the two. Placed, never shrunk.
      const top = Math.min(a.top, b.top);
      if (top < 150) return false;
      root.style.setProperty('--preload-shift', `${Math.round(top / 2 - vh / 2)}px`);
      return true;
    }

    root.style.setProperty('--preload-shift', `${Math.round(bottom + band / 2 - vh / 2)}px`);
    return true;
  }

  const refit = () => { if (shown && !settled) fit(); };

  const timer = root
    ? setTimeout(() => {
        if (settled || !fit()) return;
        shown = true;
        shownAt = performance.now();
        root.hidden = false;
        window.addEventListener('resize', refit, { passive: true });
        // One frame at the entrance state, so the fade has somewhere to start
        // from. Setting both in the same frame is how a fade becomes a cut.
        requestAnimationFrame(() => root.setAttribute('data-preload', 'on'));
      }, APPEAR_AFTER)
    : null;

  return {
    /** True once the loader has actually painted. The opening reads this. */
    get visible() { return shown; },

    /** three's GLTFLoader onProgress — a ProgressEvent, computable or not. */
    report(event) {
      if (settled) return;
      // The one phase change this module can observe honestly: the transfer has
      // finished and three is still working, which is the decode.
      if (event?.lengthComputable && event.total > 0 && event.loaded >= event.total) {
        say('Decoding');
      }
    },

    /**
     * Releases the frame. Resolves as the loader STARTS to clear rather than
     * after it has gone, so the opening's light comes up underneath it instead of
     * waiting its turn — the handover is a dissolve, not a queue (MJ7).
     */
    async close() {
      if (settled) return;

      // Held open on purpose: a demonstration, or the floor that stops a fast
      // load flashing the cube for 90ms and taking it away again.
      const held = FORCED_MS
        ? Math.max(FORCED_MS - (performance.now() - started), 0)
        : (shown ? Math.max(MIN_ON_SCREEN - (performance.now() - shownAt), 0) : 0);
      if (held > 0) await new Promise((r) => setTimeout(r, held));

      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (!shown) { cleanup(); return; }

      root.setAttribute('data-preload', 'done');

      // The exit is CSS, and the element leaves the document after it. A timer
      // rather than transitionend: transitionend does not fire if the transition
      // is cancelled or was never eligible to run, and an overlay whose removal
      // depends on an event that may not arrive is how a full-viewport layer
      // survives the page it was built for.
      removal = setTimeout(cleanup, 620);
    },

    /** The failure branch. The scene threw; the loader must still go. */
    destroy: cleanup,
  };

  function cleanup() {
    settled = true;
    window.removeEventListener('resize', refit);
    clearTimeout(timer);
    clearTimeout(removal);
    if (!root) return;
    root.hidden = true;
    root.setAttribute('data-preload', '');
  }
}

// The forced path has to survive an instant load, where close() is called before
// the appearance timer has even fired. Nothing to do here — close() waits out
// FORCED_MS from the module's own start, so the timer fires inside that window.
export { FORCED_MS };
