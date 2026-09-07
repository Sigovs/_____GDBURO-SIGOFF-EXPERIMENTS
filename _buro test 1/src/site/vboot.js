// Variant bootstrap. One entry for all three directions.

import { gsap, ScrollTrigger, refreshOnResize } from '../motion/context.js';
import { createSmoothScroll } from '../motion/scroll.js';
import { prefersReduced } from '../motion/media.js';
import { createWorld } from './vworld.js';
import { createCallouts } from './vcallouts.js';
import { createFilm, createStill } from './vfilm.js';
import { createReveals } from './vreveal.js';
import { playIntro } from './vintro.js';

export async function bootVariant(direction) {
  const Q = new URLSearchParams(location.search);
  const FORCED = Q.has('reduced');
  const reduced = prefersReduced() || FORCED;
  if (FORCED) document.documentElement.dataset.reduced = 'forced';

  const canvas = document.getElementById('scene');
  let world;
  try {
    world = await createWorld(canvas, direction, { ticker: gsap.ticker });
  } catch (e) {
    console.error('[variant] scene unavailable', e);
    document.querySelector('.stage')?.setAttribute('data-unavailable', '');
    return;
  }

  const callouts = createCallouts({ camera: world.camera, rig: world.rig });
  world.onFrame(() => callouts.update());

  if (reduced) {
    createStill(world, callouts, direction);
  } else {
    /*
      ORDER MATTERS. The film's ScrollTriggers write the camera on creation, so
      building them before the intro would have the first shot fighting the intro
      for the same rig. The intro runs first, resolves ONTO the first shot's
      station, and only then is the scroll wired up — which is also why the
      handoff has nothing to jump between.
    */
    const entered = new Set();
    if (direction.intro && !Q.has('nointro')) {
      try { await playIntro(world, callouts, direction); } catch (e) { console.error('[intro]', e); }
      delete document.documentElement.dataset.intro;   // never ship a locked page
      entered.add(direction.shots[0].id);
    }
    createSmoothScroll();
    createFilm(world, callouts, direction);
    createReveals(document.documentElement, { entered });
    document.documentElement.dataset.ready = '';
  }

  const stopRefresh = refreshOnResize();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  addEventListener('pagehide', () => {
    stopRefresh();
    callouts.dispose();
    world.dispose();
  }, { once: true });
}
