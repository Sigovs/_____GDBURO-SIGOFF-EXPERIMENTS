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

// The reduced-motion path is a DELIVERABLE with its own composition (DNA43,
// MJ9), and DNA88 asks for it to be opened rather than described. Browsers give
// no way to toggle prefers-reduced-motion from script, so ?reduced=1 forces the
// same branch the media query would take. It changes nothing for a visitor who
// does not type it, and it is the only way this path gets looked at.
const FORCE_REDUCED = new URLSearchParams(location.search).has('reduced');

const canvas = document.getElementById('scene');

async function boot() {
  if (!canvas) return;

  // WebGL can be absent, blocked, or fail on a driver blocklist. The page is
  // already whole without it, so the correct response is to leave it whole and
  // say nothing — not to show an apology where a machine should be.
  let world;
  try {
    world = await createScene(canvas, { ticker: gsap.ticker, reduced: prefersReduced() || FORCE_REDUCED });
  } catch (error) {
    console.warn('[index1] scene unavailable — the page stands without it', error);
    document.querySelector('.stage')?.setAttribute('data-unavailable', '');
    return;
  }

  // Branch, never shrink (G5, MJ8, DNA70). The mobile scene is a different
  // composition rather than the desktop one at a smaller size, and reduced
  // motion is its own authored state rather than the absence of the others.
  const teardown = FORCE_REDUCED
    ? (createStill(world), () => {})
    : branch(document.documentElement, {
        desktop: () => createStory(document.documentElement, world),
        mobile: () => createStory(document.documentElement, world),
        reduced: () => createStill(world),
      });

  if (FORCE_REDUCED) document.documentElement.dataset.reduced = 'forced';

  // Refresh is tied to real geometry change, never fired reflexively (G8, DNA47).
  const stopRefresh = refreshOnResize();

  // The type is the LCP and it is already painted; this only lets ScrollTrigger
  // re-measure once the display face has settled, so the act boundaries are not
  // computed against a fallback's metrics.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  window.addEventListener('pagehide', () => {
    teardown?.();
    stopRefresh();
    world.dispose();
  }, { once: true });
}

boot();
