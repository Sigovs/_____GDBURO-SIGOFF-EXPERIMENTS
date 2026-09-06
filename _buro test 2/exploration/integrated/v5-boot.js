/* ==================================================================================
   V5 INSIDE THE REAL PAGE.

   Mounts the same interface module the standalone exploration mounts, and wires its two
   handovers into the site around it:

     ENTER      the camera goes to the door. The visitor is at the suite, still in act 02.
     CONTINUE   the page scrolls into act 03, which is the suite itself. This is the join
                between an interactive pinned act and an editorial one, and it exists so
                the visitor is handed on rather than dropped.

   It also keeps the site's own instruments honest about where the visitor is: the header
   act counter and the plan rail both read act 02's level, and with production's act 02
   stood down nothing else would be telling them.
   ================================================================================== */
import { mountV5 } from '/exploration/study/v5/v5.js'

const host = document.querySelector('[data-v5-host]')
if (host) {
  const rail = document.querySelector('[data-rail]')
  const setRailLevel = (level) => {
    if (!rail) return
    for (const t of rail.querySelectorAll('[data-rail-tick]')) {
      t.toggleAttribute('data-at', t.dataset.railTick === level)
    }
  }

  const scrollToAct = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    /* Act 02 is pinned, so its section box is taller than the viewport and the target is
       the top of the act AFTER it. scrollIntoView on a pinned neighbour lands correctly
       because ScrollTrigger has already resolved the spacer by the time this can run. */
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const api = mountV5(host, {
    onLevel: (level) => setRailLevel(level),
    onEnter: () => { /* the camera move is the feedback; the page does not jump yet */ },
    onContinue: () => scrollToAct('act-03'),
  })

  /* the review harness, and the browser console, talk to this */
  window.__v5 = api
  setRailLevel('compound')
}
