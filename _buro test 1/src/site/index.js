// INDEX1 — the entry point.
//
// Order matters and it is the build order, not a convenience: the page is
// already complete and readable in HTML before this file runs at all. Nothing
// here creates content, and nothing here reveals content that was hidden waiting
// for it (G7). If this module never loads, what is lost is the machine moving.

import { gsap, ScrollTrigger } from '../motion/context.js';
import { refreshOnResize } from '../motion/context.js';
import { branch, prefersReduced } from '../motion/media.js';
import { createScene } from './scene.js';
import { createStory, createStill } from './story.js';
import { playIntro, armIntro } from './intro.js';
import { createPreloader } from './preload.js';
import { createReveals } from './reveal.js';

// The reduced-motion path is a DELIVERABLE with its own composition (DNA43,
// MJ9), and DNA88 asks for it to be opened rather than described. Browsers give
// no way to toggle prefers-reduced-motion from script, so ?reduced=1 forces the
// same branch the media query would take. It changes nothing for a visitor who
// does not type it, and it is the only way this path gets looked at.
const FORCE_REDUCED = new URLSearchParams(location.search).has('reduced');

// A page whose first two seconds are an authored shot has to actually start at
// the top. Browsers restore the previous scroll offset on reload by default,
// which lands the visitor mid-story with the opening already skipped — and it
// looks like the intro is broken rather than like the browser being helpful.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

const canvas = document.getElementById('scene');

async function boot() {
  if (!canvas) return;

  // WebGL can be absent, blocked, or fail on a driver blocklist. The page is
  // already whole without it, so the correct response is to leave it whole and
  // say nothing — not to show an apology where a machine should be.
  const reduced = prefersReduced() || FORCE_REDUCED;

  /*
    THE BACKDROP IS GONE, AND THE HALL IS WHY.

    It was a generated mesh shader standing in as the page's ground while the
    scene had no ground of its own. Once the floor existed it stopped being a
    backdrop and became a defect: measured at the horizon, the fogged floor
    resolves to rgb(10,12,13) — exactly --ground — while the shader rendered
    rgb(0,0,0) above it. That two-value step drew a hard horizontal seam across
    every frame on the page.

    With it removed the horizon is a true dissolve: the floor fades into the
    document's own colour and the join is not findable. The page keeps a draw
    call and a full-screen fragment pass, and loses nothing that was doing work.
  */

  // The dial is armed before the request, not after: its 200ms threshold has to
  // be measured from when the wait actually began. It usually expires without
  // painting anything.
  const preload = createPreloader({ reduced });

  let world;
  try {
    world = await createScene(canvas, {
      ticker: gsap.ticker,
      reduced,
      onProgress: (event) => preload.report(event),
    });
  } catch (error) {
    console.warn('[index1] scene unavailable — the page stands without it', error);
    // The overlay goes on this branch too. A dial left closing over a page whose
    // scene will never arrive is worse than the missing scene: the page is whole
    // without the machine, and it is not whole under a permanent loader.
    preload.destroy();
    document.querySelector('.stage')?.setAttribute('data-unavailable', '');
    return;   // the page is still whole: --ground is the ground, and it needs no canvas
  }

  // The scene is ready, and the loader may still be holding. Compose the frame
  // underneath it BEFORE letting it clear, or the visitor watches a lit machine
  // at a default camera for the length of the hold.
  const opening = !FORCE_REDUCED && !prefersReduced();
  if (opening) armIntro(world);

  // Read BEFORE close() clears it — this decides whether the opening still owes
  // the visitor a reveal of type they have not seen yet.
  const loaderWasSeen = preload.visible;
  await preload.close();

  // Branch, never shrink (G5, MJ8, DNA70). The mobile scene is a different
  // composition rather than the desktop one at a smaller size, and reduced
  // motion is its own authored state rather than the absence of the others.
  // The opening runs BEFORE the scroll story is wired, and lands on exactly the
  // station shot 01 opens from, so there is nothing to reconcile at handover.
  // Under reduced motion it does not run at all.
  let stopIntro = () => {};
  if (opening) {
    stopIntro = playIntro(world, { revealType: !loaderWasSeen });
  } else {
    document.querySelector('[data-intro]')?.setAttribute('data-intro', 'done');
  }

  const teardown = FORCE_REDUCED
    ? (createStill(world), () => {})
    : branch(document.documentElement, {
        desktop: () => createStory(document.documentElement, world),
        mobile: () => createStory(document.documentElement, world),
        reduced: () => createStill(world),
      });

  if (FORCE_REDUCED) document.documentElement.dataset.reduced = 'forced';

  // Type arrives rather than being scrolled past, figures count up to what they
  // were measured at, and the field answers the scroll. Created after the story
  // so its triggers are registered against the same, already-measured layout.
  const stopReveals = createReveals(document.documentElement, { reduced });

  // Refresh is tied to real geometry change, never fired reflexively (G8, DNA47).
  const stopRefresh = refreshOnResize();

  // The type is the LCP and it is already painted; this only lets ScrollTrigger
  // re-measure once the display face has settled, so the act boundaries are not
  // computed against a fallback's metrics.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  window.addEventListener('pagehide', () => {
    teardown?.();
    stopIntro();
    preload.destroy();
    stopReveals();
    stopRefresh();
    world.dispose();
  }, { once: true });
}

boot();
