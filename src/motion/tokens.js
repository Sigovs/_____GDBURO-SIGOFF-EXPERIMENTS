// Durations and easing come from tokens, never from a number typed at the call
// site (DNA42, motion I3, G4). One family across the page, so entrances all feel
// like the same hand.
//
// These are the engineering defaults. A project overrides them once, here, after
// its motion register is decided — not per-tween.

export const DURATION = {
  instant: 0.12,
  quick: 0.24,
  base: 0.45,
  slow: 0.8,
  long: 1.4,
};

export const EASE = {
  // entrances ease out, exits ease in — the family stays coherent (DNA42)
  enter: 'power3.out',
  exit: 'power2.in',
  move: 'power2.inOut',
  // scrubbed motion is linear unless the concept explicitly wants weight
  scrub: 'none',
};

/** `scrub` is a decision, not a decoration (DNA48). */
export const SCRUB = {
  exact: true,   // no lag; the frame is the scroll position
  weighted: 0.8, // lag with weight — the page feels heavy
  loose: 1.5,
};
