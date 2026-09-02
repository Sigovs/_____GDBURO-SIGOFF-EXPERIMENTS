// Every tween and every trigger lives inside a gsap.context with a scope and a
// reversible teardown (G1, G2, DNA46). A document-global selector is a defect
// even when it works, because the second instance of the component is the bug.

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

/**
 * @param {Element} scope    the root the selectors resolve against — required
 * @param {(ctx: gsap.Context) => void} build
 * @returns {() => void} teardown: kills the tweens, the triggers, and reverts
 */
export function motion(scope, build) {
  if (!scope) throw new Error('motion(): a scope element is required — see G2');
  const ctx = gsap.context(build, scope);
  return () => ctx.revert();
}

/**
 * Anything measured gets invalidateOnRefresh, and refresh is tied to real
 * geometry change rather than to every resize event (DNA47, G8).
 */
export function refreshOnResize({ debounce = 200 } = {}) {
  let last = { w: window.innerWidth, h: window.innerHeight };
  let timer = 0;
  const onResize = () => {
    // iOS fires resize on every URL-bar movement; height-only changes are not geometry.
    const w = window.innerWidth;
    const h = window.innerHeight;
    const widthChanged = w !== last.w;
    const heightChangedALot = Math.abs(h - last.h) > last.h * 0.2;
    last = { w, h };
    if (!widthChanged && !heightChangedALot) return;
    clearTimeout(timer);
    timer = setTimeout(() => ScrollTrigger.refresh(), debounce);
  };
  window.addEventListener('resize', onResize, { passive: true });
  return () => {
    clearTimeout(timer);
    window.removeEventListener('resize', onResize);
  };
}
