// Type choreography for the variants.
//
// Every block of shot copy is staged from its OWN shot's scroll window, the same
// contract index1 uses — a cue is a position inside the shot, not the section box
// entering the viewport. Reverse scroll reverses the gesture; a skipped section
// is snapped to its terminal state, and both terminal states are "not visible",
// which is stated outright rather than inferred from whichever timeline wrote last.

import { gsap, ScrollTrigger } from '../motion/context.js';

/*
  The entrance gestures, exported because the INTRO plays one of them.

  The opening beat's type is revealed by the intro, using the same gesture this
  module would have used. Sharing the map is the point: a second definition would
  drift, and the seam between the intro and the first scroll state is exactly
  where a drift would show.
*/
export const ENTER_FROM = {
  rise:  { y: 90, opacity: 0, filter: 'blur(14px)' },
  slide: { x: -110, opacity: 0 },
  crop:  { xPercent: -104, opacity: 0 },
  drop:  { y: -70, opacity: 0, filter: 'blur(10px)' },
  wide:  { scale: 1.06, opacity: 0, transformOrigin: '0% 50%' },
};

/**
 * @param entered ids of sections whose entrance has already been played by the
 *   intro. Their enter timeline is seeded complete instead of replayed, so the
 *   opening type does not animate in twice.
 */
export function createReveals(scope, { entered = new Set() } = {}) {
  const ctx = gsap.context(() => {
    for (const section of document.querySelectorAll('.beat')) {
      const els = [...section.querySelectorAll('[data-r]')];
      if (!els.length) continue;

      const mode = section.dataset.enter ?? 'rise';
      const from = ENTER_FROM[mode] ?? ENTER_FROM.rise;

      const enter = gsap.timeline({ paused: true }).fromTo(els, from,
        { y: 0, x: 0, xPercent: 0, scale: 1, opacity: 1, filter: 'blur(0px)',
          duration: 1.15, ease: 'power3.out', stagger: 0.13 });
      const exit = gsap.timeline({ paused: true }).to(els,
        { y: -60, opacity: 0, filter: 'blur(12px)', duration: 0.9, ease: 'power2.in', stagger: 0.08 });

      exit.progress(0).pause();
      enter.progress(0).pause();

      const cueIn = parseFloat(section.dataset.in ?? '0.12');
      const cueOut = parseFloat(section.dataset.out ?? '0.80');
      const state = { in: false, out: false };

      if (entered.has(section.id)) { enter.progress(1).pause(); state.in = true; }

      const settle = (past) => {
        state.in = past; state.out = past;
        if (past) { enter.progress(1).pause(); exit.progress(1).pause(); }
        else { exit.progress(0).pause(); enter.progress(0).pause(); }
        gsap.set(els, { opacity: 0 });
      };

      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          if (p >= cueIn && !state.in) { state.in = true; enter.play(); }
          else if (p < cueIn && state.in) { state.in = false; enter.reverse(); }
          if (p >= cueOut && !state.out) { state.out = true; exit.play(); }
          else if (p < cueOut && state.out) { state.out = false; exit.reverse(); }
        },
        onLeave: () => settle(true),
        onLeaveBack: () => settle(false),
      });
    }

    // counters on the record's measured figures
    for (const el of gsap.utils.toArray('.plate .fig')) {
      const raw = el.textContent.trim();
      const m = raw.match(/^(\d[\d ]*)(\s*[^\d]*)$/);
      if (!m) continue;
      const digits = Number(m[1].replace(/\s/g, ''));
      if (!Number.isFinite(digits)) continue;
      const state = { v: digits >= 10 ? 10 ** (String(digits).length - 1) : 0 };
      gsap.to(state, {
        v: digits, duration: 2.4, ease: 'power1.out',
        onUpdate: () => {
          el.textContent = String(Math.round(state.v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + m[2];
        },
        onComplete: () => { el.textContent = raw; },
        scrollTrigger: { trigger: el.closest('.beat') ?? el, start: 'top 60%', once: true },
      });
    }
  }, scope);
  return () => ctx.revert();
}
