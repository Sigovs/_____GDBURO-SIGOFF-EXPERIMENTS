// Variant bootstrap. One entry for all three directions.

import { gsap, ScrollTrigger, refreshOnResize } from '../motion/context.js';
import { createSmoothScroll } from '../motion/scroll.js';
import { prefersReduced } from '../motion/media.js';
import { createWorld } from './vworld.js';
import { createCallouts } from './vcallouts.js';
import { createFilm, createStill } from './vfilm.js';
import { createReveals } from './vreveal.js';
import { playIntro } from './vintro.js';
import { createLevel } from './vlevel.js';

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

  /*
    THE LEVEL LINE IS OPT-IN PER DIRECTION, AND IT IS BUILT FIRST.

    A direction that declares `level: true` gets the device; A, B and C declare
    nothing and are untouched by this file changing. It is constructed BEFORE the
    callouts because the callout solver reads its guard nodes once at startup —
    built second, the level line would not exist yet and the solver would happily
    put a label straight through the measurement. It also UPDATES first, so the
    solver reads this frame's boxes rather than the previous frame's.
  */
  const level = direction.level ? createLevel({ camera: world.camera, rig: world.rig }) : null;

  /*
    TWO ANNOTATION LANGUAGES, AND THE DIRECTION CHOOSES.

    `card` is the editorial one in site/vcards.js — block placed near the
    feature, one soft diagonal, real text. Everything else keeps the drafting
    callout in site/vcallouts.js, unchanged, because that is what A, B, C and
    `final` are composed in.
  */
  const makeCallouts = direction.callout?.card
    ? (await import('./vcards.js')).createCallouts
    : createCallouts;
  const callouts = makeCallouts({ camera: world.camera, rig: world.rig, metrics: direction.callout });
  world.onFrame(() => { level?.update(); callouts.update(); });
  /*
    THE RIG AND CAMERA ARE PUBLISHED WHETHER OR NOT THERE IS A LEVEL LINE.

    They were inside `if (level)`, which made them look like part of the
    measurement harness. They are not: the record's hotspots wait on `__probe`
    before they will build, so a direction that turns the datum off lost its
    last screen's five markers entirely and did it without an error. The
    measurement's own handle stays gated, because that one really is the level
    line's.
  */
  /* The callout module goes on the same handle. `setDraw` already exists for
     the intro's own hand-off, and being able to HOLD the draw at an exact
     progress is what lets a proof capture caption a frame with the number that
     is actually in it — read, screenshot, read again and the state has moved on
     between the three, which is how a sheet ends up claiming a card is at zero
     underneath a picture of the card. */
  window.__probe = { rig: world.rig, camera: world.camera, callouts };
  if (level) window.__level = level;

  if (reduced) {
    createStill(world, callouts, direction, level);
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
    createFilm(world, callouts, direction, level);
    createReveals(document.documentElement, { entered });
    document.documentElement.dataset.ready = '';
  }

  const stopRefresh = refreshOnResize();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  addEventListener('pagehide', () => {
    stopRefresh();
    level?.dispose();
    callouts.dispose();
    world.dispose();
  }, { once: true });
}
