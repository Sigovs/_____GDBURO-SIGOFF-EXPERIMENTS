/* ==================================================================================
   V6 INSIDE THE REAL PAGE.

   Same three jobs the V5.3 boot had — pin the act, hand over to act 03, keep the site's
   own instruments honest — plus the one this pass adds: the chosen suite is written into
   act 03, so the site stops naming a different product one act after the visitor picked.
   ================================================================================== */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { mountV6 } from '/exploration/study/v6/v6.js'
import { linkAct03 } from '/exploration/study/v6/act03-link.js'

gsap.registerPlugin(ScrollTrigger)

const host = document.querySelector('[data-v6-host]')
if (host) {
  const section = host.closest('.act')
  const rail = document.querySelector('[data-rail-svg]') || document.querySelector('[data-rail]')
  const setRailLevel = (level) => {
    if (!rail) return
    for (const t of rail.querySelectorAll('[data-rail-tick]')) {
      t.toggleAttribute('data-at', t.dataset.railTick === level)
    }
  }
  const writeAct03 = linkAct03(document)

  const api = mountV6(host, {
    /* the site header is fixed across the top of every act, including this one */
    topSafe: 96,
    onLevel: (level) => setRailLevel(level),
    onSuite: (s) => writeAct03(s),
    onEnter: () => { /* the camera move is the feedback; the page does not jump yet */ },
    onContinue: () => document.getElementById('act-03')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    onSpecs: () => document.getElementById('act-03')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
  })

  window.__v6 = api
  window.__v5 = api          /* the review harness addresses whichever act 02 is mounted */
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
      id: 'v6-act02',
    })
    /* the model is laid out against its stage, and pinning changes that stage's box */
    ScrollTrigger.addEventListener('refresh', () => api.gl?.resize?.())
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }
}
