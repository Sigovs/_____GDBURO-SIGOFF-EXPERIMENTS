/* ==================================================================================
   V5 INSIDE THE REAL PAGE.

   Mounts the same interface module the standalone exploration mounts, and does the three
   things the surrounding site needs from it.

   1. IT PINS THE ACT.  motion.js pins act 02 only when production's own drawing is in
      the DOM (`if (act02 && svg && compoundEl)`), and this page deliberately removes
      that markup — so without this the visitor scrolled straight past a full-height
      interactive stage with its own dock half off the bottom of the screen. An act that
      asks to be used has to hold still while it is being used. The hold is the act's own
      height plus one screen, which is long enough to choose a building and a suite and
      short enough that nobody who does not want to is detained.

   2. IT HANDS OVER.  ENTER takes the camera to the door and leaves the visitor in act
      02; CONTINUE releases them into act 03, which is the suite itself. That join is
      the thing this page exists to let someone judge.

   3. IT KEEPS THE SITE'S INSTRUMENTS HONEST.  The header act counter and the plan rail
      report where the visitor is; with production's act 02 stood down, nothing else
      would be telling them which level act 02 is at.
   ================================================================================== */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { mountV5 } from '/exploration/study/v5/v5.js'

gsap.registerPlugin(ScrollTrigger)

const host = document.querySelector('[data-v5-host]')
if (host) {
  const section = host.closest('.act')
  const rail = document.querySelector('[data-rail]')
  const setRailLevel = (level) => {
    if (!rail) return
    for (const t of rail.querySelectorAll('[data-rail-tick]')) {
      t.toggleAttribute('data-at', t.dataset.railTick === level)
    }
  }

  const api = mountV5(host, {
    onLevel: (level) => setRailLevel(level),
    onEnter: () => { /* the camera move is the feedback; the page does not jump yet */ },
    onContinue: () => {
      const next = document.getElementById('act-03')
      if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
  })

  window.__v5 = api
  setRailLevel('compound')

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (section && !reduced) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=100%',
      pin: true,
      pinSpacing: true,
      invalidateOnRefresh: true,
      id: 'v5-act02',
    })
    /* The model is laid out against its stage, and pinning changes that stage's box.
       Re-measure once the pin has settled rather than trusting the pre-pin geometry. */
    ScrollTrigger.addEventListener('refresh', () => api.gl?.resize?.())
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }
}
