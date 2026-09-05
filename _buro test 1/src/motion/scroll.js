// Smooth scroll — OFF by default, and that is the position, not an oversight.
//
// The user keeps the transport (MJ6). A smoothing layer takes the scrollbar, the
// keyboard page keys and the trackpad's own physics and hands back an
// approximation; on a page that does not need it, that is a cost with no return.
// Turn it on when the concept wants weight in the travel itself, say so in the
// report, and check the keyboard still moves the page.

import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './context.js';
import { prefersReduced } from './media.js';

export function createSmoothScroll({ lerp = 0.1, wheelMultiplier = 1 } = {}) {
  // Reduced motion keeps the native scroll. Smoothing IS motion.
  if (prefersReduced()) return { lenis: null, dispose() {} };

  const lenis = new Lenis({ lerp, wheelMultiplier, autoRaf: false });

  // ScrollTrigger reads Lenis's position rather than the browser's.
  lenis.on('scroll', ScrollTrigger.update);

  // Driven from gsap.ticker so the page keeps one rAF — see engine/loop.js,
  // which takes the same ticker.
  const tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return {
    lenis,
    dispose() {
      gsap.ticker.remove(tick);
      lenis.destroy();
    },
  };
}
