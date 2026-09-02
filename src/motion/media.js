// Branching, not shrinking. Desktop choreography is replaced or removed on
// mobile, never scaled down (DNA44, DNA70, G5) — and reduced motion is an
// authored state, not an absence (DNA43, DNA79).

import { gsap } from './context.js';

export const QUERIES = {
  desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
  mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
};

/**
 * @param {Element} scope
 * @param {{desktop?: Function, mobile?: Function, reduced?: Function}} branches
 *
 * The `reduced` branch is not optional in review: if it is missing, the page has
 * no authored still for a scrubbed sequence, and a blank frame is what the
 * visitor gets. Write it as the composed frame the act was built around.
 */
export function branch(scope, branches) {
  if (!branches.reduced) {
    console.warn('[media] no reduced-motion branch — DNA43 wants the composed still, not the absence of motion');
  }
  const mm = gsap.matchMedia(scope);
  for (const [key, query] of Object.entries(QUERIES)) {
    if (branches[key]) mm.add(query, branches[key], scope);
  }
  return () => mm.revert();
}

export const prefersReduced = () => window.matchMedia(QUERIES.reduced).matches;
export const isMobile = () => window.matchMedia('(max-width: 767px)').matches;
