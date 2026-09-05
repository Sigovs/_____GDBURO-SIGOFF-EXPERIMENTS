/* ==================================================================================
   MOTION — one temporal idea, and it is THE THRESHOLD.

   You are being admitted, one enclosure at a time. Every seam between two acts is a
   physical opening crossing the frame; the outgoing act is behind it, the incoming act
   is in front of it, and the aperture is the event. That is the page's primary
   movement and its only structural transition.

   FIRST MOTION PROTOTYPE, 2026-09-05. Acts 00 - 03 and the signature are choreographed
   here. Acts 04 - 07 are deliberately motion-static beyond their apertures and their
   arrival opacity: the grammar is established before it is propagated.

   The rules this file is written against, in the order they bind:

     P2   the aperture's TYPE varies by act; its TIMING never does. Always --dur-door
          on --ease-door. Variation is in what opens, never in how long it takes.
     P4   the cut is scroll-driven, not autoplayed. The visitor opens every door.
     P6   one primary temporal idea per viewport. While an aperture is crossing,
          nothing else on screen animates.
     SC1  the reader keeps the transport. No hijack, no snap, no section that cannot
          be left by continuing to scroll.
     SC5  motion binds to ROLES, not to instances. Sections declare what they are and
          the system reads that. Only act 00's arrival is bound by name, because it is
          the page's arrival. After load the system asserts it took hold — a silent
          no-op is indistinguishable from a page where motion was never designed.
     PN1  two pins, and never two at once.
     G1   everything inside gsap.context() / gsap.matchMedia() with reversible teardown.
     E4   no bounce, no elastic, no overshoot, anywhere. A building does not overshoot.
     C6-TEMP  act 03's four states are four cameras. Motion may not pretend otherwise.
   ================================================================================== */

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, CustomEase, SplitText)

/* --ease-door carries the page's character: mass. A heavy thing that resists starting
   and takes time to stop. It is used on apertures and on nothing else — one weighted
   transition asserting mass is the Anchor's signature, and a second one dilutes it. */
CustomEase.create('door', 'M0,0 C0.12,0 0.20,0.28 0.36,0.62 0.52,0.90 0.70,1 1,1')

const DUR = { instant: 0.09, quick: 0.18, base: 0.32, door: 0.64, settle: 1.2 }
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function initMotion({ compound, selectSuite, setLevel, state } = {}) {
  const root = document.documentElement

  /* ------------------------------------------------------------------------------
     SCROLL AUTHORITY — native, and there is only one.

     Lenis was installed and is REJECTED for this build. Three reasons, in order:

     1. The declared character is heavy, mechanical and PRECISE, and the weight is
        authored in --ease-door rather than borrowed from a smoothing layer. Lenis's
        eased momentum reads as floaty, which is on the NEVER list by name.
     2. The rail is an instrument. `SC3` binds it to `scrub: true` — exact, because a
        position report that lags its input is a position report nobody believes.
        Lenis puts a second, eased position between the wheel and the marker.
     3. It is not load-bearing. The reduced-motion path already runs without it, so
        the page must work on native scroll regardless; adding it means maintaining
        two scroll positions to gain nothing this page's motion asks for.

     `scroll-site` prefers Lenis by default and that preference is set aside here for
     the reason above — recorded, not silent. `motion-dna.md SC2` is updated to match.
     ------------------------------------------------------------------------------ */

  root.classList.add('js-motion')

  const ctx = gsap.context(() => {
    /* ----------------------------------------------------------------------------
       THE RAIL — orientation, band 2, persistent.

       It moves linearly with scroll progress. No easing, no lag: it is an instrument
       and it must be believed. It is the only element on the page that moves
       continuously, and it still moves under reduced motion because removing it would
       remove information rather than decoration.
       ---------------------------------------------------------------------------- */
    const marker = document.querySelector('[data-rail-marker]')
    const progress = document.querySelector('[data-rail-progress]')

    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,                                  /* exact — it is an instrument */
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (marker) gsap.set(marker, { attr: { y: 900 * self.progress } })
        if (progress) gsap.set(progress, { scaleX: self.progress })
      },
    })

    /* ----------------------------------------------------------------------------
       ACT 00 — THE ARRIVAL. Four beats, and they do not share one.

       The page's arrival is the one thing bound by NAME rather than by role (`SC5`),
       because it is this page's arrival and no other page has it. It runs on load, not
       on scroll: there is nothing to scroll to yet.

       Beat 1  the architectural field — a dimmer coming up, never a fade-up. No
               translate, no scale: the frame does not move, the light in it changes.
               That is the `reveal` shot, which is the one shot where the camera holds
               and the subject is discovered.
       Beat 2  the display lines, by LINE behind a hard mask edge. Not by character:
               121 closed doors is a sentence, not a effect.
       Beat 3  the location line, opacity only. Functional text does not perform.
       Beat 4  the rail's first trace draws itself — unlabelled, unexplained, reading
               as a kerb rather than as interface. It is the last thing to arrive
               because the visitor is not meant to notice it yet.
       ---------------------------------------------------------------------------- */
    const h00 = document.querySelector('#h-00')
    const act00 = document.querySelector('[data-act="00"]')
    const field00 = act00?.querySelector('.field__img')
    const label00 = act00?.querySelector('.t-label[data-arrive]')
    const spine = document.querySelector('[data-rail-spine]')

    if (!reduced()) {
      const intro = gsap.timeline({ defaults: { ease: 'none' } })

      if (field00) {
        gsap.set(field00, { opacity: 0.34 })
        intro.to(field00, { opacity: 1, duration: DUR.settle * 1.15 }, 0)
      }

      if (h00) {
        const split = new SplitText(h00, { type: 'lines', linesClass: 'line' })
        split.lines.forEach((l) => {
          const w = document.createElement('span')
          w.style.cssText = 'display:block; overflow:hidden;'
          l.parentNode.insertBefore(w, l)
          w.appendChild(l)
          l.style.display = 'block'
        })
        gsap.set(h00, { opacity: 1 })
        h00.classList.add('is-in')
        intro.from(split.lines, {
          yPercent: 108,
          duration: DUR.door,
          ease: 'door',
          stagger: 0.06,                 /* 60ms between lines (`ST2`) */
        }, 0.42)
      }

      if (label00) {
        gsap.set(label00, { opacity: 0 })
        intro.to(label00, { opacity: 1, duration: DUR.quick }, '>-0.06')
        intro.add(() => label00.classList.add('is-in'))
      }

      if (spine) {
        const len = spine.getTotalLength()
        gsap.set(spine, { strokeDasharray: len, strokeDashoffset: len })
        intro.to(spine, { strokeDashoffset: 0, duration: DUR.settle * 1.4 }, '<0.10')
      }
    } else {
      h00?.classList.add('is-in')
      label00?.classList.add('is-in')
    }

    /* The rail draws its PLAN fragment over act 01 — which is how it teaches itself,
       before it is ever asked to be touched. By the end of the act it is legibly a
       fragment of a drawing, and still unlabelled. */
    const draw = document.querySelector('[data-rail-draw]')
    if (draw && !reduced()) {
      const len = draw.getTotalLength()
      gsap.set(draw, { strokeDasharray: len, strokeDashoffset: len })
      gsap.to(draw, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '[data-act="01"]',
          start: 'top 80%',
          end: 'bottom center',
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
    } else if (draw) {
      gsap.set(draw, { strokeDashoffset: 0 })
    }

    /* ----------------------------------------------------------------------------
       THE APERTURE CUT — the page's primary movement.

       Bound by ROLE: every section carrying data-aperture gets one, and the type named
       there decides which edge moves. Timing is identical everywhere (P2).

       Reversing the scroll reverses the aperture: doors close the way they opened.
       Under reduced motion an aperture becomes an instant cut, not a fade — the seam
       is preserved as a change of frame, because the seam is the meaning.
       ---------------------------------------------------------------------------- */
    for (const section of gsap.utils.toArray('[data-aperture]')) {
      const type = section.dataset.aperture

      /* The aperture is a real thing in the world it opens onto — a door the building
         has. Never an abstract wipe, never a circle. The type decides the edge. */
      const from = {
        gate: { xPercent: -100 },        /* a gate leaf sliding laterally */
        sectional: { yPercent: -100 },   /* a sectional door lifting */
        shutter: { yPercent: 100 },      /* a shutter dropping to a slot */
        glazed: { xPercent: 100 },       /* a glazed door swinging through */
        grade: null,                     /* an interruption: no leaf, a grade change */
      }[type]

      if (!from || reduced()) continue

      /* THE SEAM NAMES THE ACT IT OPENS ONTO, EXPLICITLY.

         This used to read `section.nextElementSibling`, which is a dependency on DOM
         SHAPE rather than on the page's structure. ScrollTrigger wraps a pinned act in
         a pin-spacer, so a pinned act's next sibling is null and its door is silently
         never built — no error, no warning, and a page whose aperture was never created
         is indistinguishable from one where it was never designed (`MJ11`). It worked
         only because this loop happened to run before the pins were created, 120 lines
         further down; reordering those two blocks would have deleted the 03 -> 04 seam
         and nothing would have reported it.

         The target is read from the markup, so no execution order can change it. */
      const host = document.getElementById(section.dataset.apertureInto || '')
      if (!host) {
        /* Absence needs a check, because it raises no alarm (`MJ11`). */
        console.warn(
          `[aperture] "${type}" on act ${section.dataset.act} names no reachable act ` +
          `in data-aperture-into — no door was built for this seam.`)
        continue
      }

      /* CONTAINMENT — structural, and not inherited from anything.

         The leaf is sized to the act and travels one full self-height or self-width out
         of it, so without a clip it keeps painting after it has left: `--void` black
         across whatever act is next. `.act` itself cannot take `overflow: hidden` — that
         would make a scroll container of every act and break the sticky field inside act
         01 — so the clip goes on a shell that holds nothing but the leaf. The shell IS
         the act's box; the leaf travels inside it and is cut off exactly at the act's
         own edge, which is where a door in that wall would disappear anyway. Act content
         is not inside the shell and is never cropped.

         Body `overflow-x: hidden` is not containment. It caught the two horizontal doors
         by accident and nothing at all vertically, which is why 03 -> 04 and 06 -> 07
         painted over acts 05 and 06. */
      const shell = document.createElement('div')
      shell.setAttribute('aria-hidden', 'true')
      shell.dataset.apertureShell = type
      shell.style.cssText =
        'position:absolute; inset:0; z-index:3; overflow:hidden; pointer-events:none;'

      const leaf = document.createElement('div')
      leaf.dataset.apertureLeaf = type
      leaf.style.cssText = 'position:absolute; inset:0; background:var(--void);'
      shell.appendChild(leaf)

      host.style.position = host.style.position || 'relative'
      host.appendChild(shell)

      /* The leaf STARTS closed, covering the incoming act, and travels AWAY to reveal
         it — that is what a door does. Setting it off-frame and tweening it to 0 does
         the opposite: it slides a black panel over the act and leaves it there, which
         blacks out every act that has an aperture. The direction is the whole device. */
      gsap.set(leaf, { xPercent: 0, yPercent: 0 })

      gsap.to(leaf, {
        ...from,
        ease: 'door',
        scrollTrigger: {
          trigger: host,
          start: 'top bottom',
          end: `top ${100 - 34}%`,
          scrub: 0.6,                    /* lag with weight, without lagging behind */
          invalidateOnRefresh: true,
        },
      })
    }

    /* ----------------------------------------------------------------------------
       TEXT — display lines enter by line, never by character. Act 00's headline is
       excluded: it belongs to the arrival timeline above and would otherwise be
       choreographed twice.
       ---------------------------------------------------------------------------- */
    for (const node of gsap.utils.toArray('[data-split]')) {
      if (node.id === 'h-00') continue
      if (reduced()) { node.classList.add('is-in'); continue }
      const split = new SplitText(node, { type: 'lines', linesClass: 'line' })
      split.lines.forEach((l) => {
        const w = document.createElement('span')
        w.style.cssText = 'display:block; overflow:hidden;'
        l.parentNode.insertBefore(w, l)
        w.appendChild(l)
        l.style.display = 'block'
      })
      gsap.set(node, { opacity: 1 })
      node.classList.add('is-in')
      gsap.from(split.lines, {
        yPercent: 108,
        duration: DUR.door,
        ease: 'door',
        stagger: 0.06,
        scrollTrigger: { trigger: node, start: 'top 88%', once: true },
      })
    }

    /* Functional text arrives by opacity and a 12px settle. Once, and never again on
       scroll-back: re-triggering an entrance is the most common way a cinematic page
       starts feeling cheap (`T5`). */
    for (const node of gsap.utils.toArray('[data-arrive]')) {
      if (node.hasAttribute('data-split') || node === label00) { continue }
      if (reduced()) { node.classList.add('is-in'); continue }
      gsap.to(node, {
        opacity: 1,
        y: 0,
        duration: DUR.quick,
        ease: 'power1.out',
        scrollTrigger: { trigger: node, start: 'top 92%', once: true },
        onStart: () => node.classList.add('is-in'),
      })
      gsap.set(node, { y: 12 })
    }

    /* ----------------------------------------------------------------------------
       ACT 01 — the dolly, and the beats do not land together.

       The plate is 122% of the frame, so it travels ACROSS the frame rather than
       being nudged inside it. Linear, because a dolly runs at the rate the visitor
       scrolls and not at the rate an ease would prefer. This is a lateral pass over a
       flat plate — it is not a camera, and nothing here pretends a flat photograph has
       parallax in it.

       The caption is held back until the pass is a third of the way through, so
       architecture and text do not arrive on the same beat.
       ---------------------------------------------------------------------------- */
    const dollyAct = document.querySelector('[data-dolly]')
    const dolly = dollyAct?.querySelector('.field__img')
    if (dolly && !reduced()) {
      gsap.fromTo(dolly, { xPercent: 0 }, {
        xPercent: -9, ease: 'none',
        scrollTrigger: {
          trigger: dollyAct, start: 'top bottom', end: 'bottom top',
          scrub: true, invalidateOnRefresh: true,
        },
      })
      const cap = dollyAct.querySelector('.field__caption')
      if (cap) {
        gsap.set(cap, { opacity: 0 })
        gsap.to(cap, {
          opacity: 1, duration: DUR.base, ease: 'power1.out',
          scrollTrigger: { trigger: dollyAct, start: 'top 34%', once: true },
        })
      }
    }
  })

  /* ================================================================================
     THE RESPONSIVE LAYER.

     gsap.matchMedia() rather than the deprecated ScrollTrigger.matchMedia(): it reverts
     everything created inside a matching handler when the query stops matching, which
     is what makes a pin safe to declare desktop-only. No gsap.context() is nested
     inside it — matchMedia creates one internally.

     No pins on mobile (`M2`, `PN4`): both pinned acts become sequences of full-screen
     frames there, in the same order, delivering the same truths. A pin is the most
     fragile thing on a real phone.
     ================================================================================ */
  const mm = gsap.matchMedia()

  mm.add('(min-width: 1025px) and (prefers-reduced-motion: no-preference)', () => {
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

    /* ------------------------------------------------------------------------------
       PLAN → SELECT → ENTER — the signature, and the only place the drawing becomes
       the photograph.

       The mechanism is ONE piece of geometry doing three jobs in sequence. The bay the
       visitor selected is read out of the live SVG in screen coordinates, and that same
       quadrilateral is then the clip region a photograph is seen through. The drawing
       is not replaced by the room; it becomes the opening the room is seen through, and
       it is the last thing to leave.

       Flip is deliberately NOT used here. Flip interpolates a BOX between two layout
       states; what has to interpolate is a four-point clip region on a different layer,
       and a box would move the drawing to the photograph's position rather than making
       the drawing be the aperture. `NEVER 31` also binds: the polygon that grows and
       the clip that opens are the same numbers, not two approximations of one shape.
       ------------------------------------------------------------------------------ */
    const enter = (() => {
      let layer = null, plate = null, outlinePoly = null
      let quad = null, shown = false

      /* The subject. If the visitor has chosen, that is the subject; if they scrolled
         straight through, a representative unsold Type B bay near the middle of the
         compound stands in, so the signature always has something to be about. */
      const subject = () => {
        if (state?.suite?.node) return state.suite.node
        const open = (compound?.suites || []).filter((s) => !s.sold)
        return open.length ? open[Math.floor(open.length * 0.5)].node : null
      }

      /* Screen-space corners of a polygon, ordered TL, TR, BR, BL by angle about their
         own centroid — index order cannot be trusted through a sheared axonometric. */
      const cornersOf = (node) => {
        const m = node.getScreenCTM()
        if (!m) return null
        const pts = []
        for (let i = 0; i < node.points.numberOfItems; i++) {
          const p = node.points.getItem(i).matrixTransform(m)
          pts.push([p.x, p.y])
        }
        const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length
        const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length
        const byQuad = { tl: null, tr: null, br: null, bl: null }
        for (const p of pts) {
          const left = p[0] < cx, top = p[1] < cy
          const key = top ? (left ? 'tl' : 'tr') : (left ? 'bl' : 'br')
          if (!byQuad[key]) byQuad[key] = p
        }
        return byQuad.tl && byQuad.tr && byQuad.br && byQuad.bl
          ? [byQuad.tl, byQuad.tr, byQuad.br, byQuad.bl]
          : null
      }

      const build = () => {
        if (layer) return
        layer = document.createElement('div')
        layer.className = 'enter'
        layer.setAttribute('aria-hidden', 'true')

        plate = document.createElement('div')
        plate.className = 'enter__plate'
        const src = document.querySelector('.suite__state[data-state="delivered"] img')
        if (src) plate.style.backgroundImage = `url("${src.currentSrc || src.src}")`

        const svgNS = 'http://www.w3.org/2000/svg'
        const o = document.createElementNS(svgNS, 'svg')
        o.setAttribute('class', 'enter__line')
        o.setAttribute('preserveAspectRatio', 'none')
        outlinePoly = document.createElementNS(svgNS, 'polygon')
        outlinePoly.setAttribute('class', 'enter__outline')
        o.appendChild(outlinePoly)

        layer.appendChild(plate)
        layer.appendChild(o)
        document.body.appendChild(layer)
      }

      const hide = () => {
        /* The drawing's opacity is restored here and not only in the forward path.
           Leaving it out meant scrolling back up out of the ENTER left the compound at
           0.06 for the rest of the session — a defect only a REVERSE scroll finds,
           which is why `SC6` lists reverse as one of the four required tests. */
        if (svg) svg.style.opacity = ''
        if (!layer) return
        shown = false
        quad = null
        layer.style.display = 'none'
      }

      const update = (p) => {
        /* The ENTER owns the last quarter of the pin and nothing before it. */
        if (p < 0.72) { if (shown) hide(); return }
        build()

        const t = clamp01((p - 0.72) / 0.28)

        /* The quad is captured once, on the way in, from the live drawing. The camera
           has been still since 0.36, so it is stable — and capturing it once means the
           geometry the visitor watched is the geometry that grows. */
        if (!shown) {
          const node = subject()
          quad = node ? cornersOf(node) : null
          if (!quad) return
          shown = true
          layer.style.display = 'block'
        }
        if (!quad) return

        const vw = window.innerWidth, vh = window.innerHeight
        /* A small overshoot past the viewport so no seam shows at full open. */
        const dest = [[-2, -2], [vw + 2, -2], [vw + 2, vh + 2], [-2, vh + 2]]

        /* Beat 1 · the surroundings leave FIRST, so the eye is already on the footprint
           before the footprint moves. */
        const leave = clamp01((t - 0.04) / 0.34)
        if (svg) svg.style.opacity = String(gsap.utils.interpolate(1, 0.06, leave))

        /* Beat 2 · the outline takes the footprint's place while it is still at rest. */
        const line = clamp01((t - 0.02) / 0.18)
        /* Beat 4 · and it is the LAST thing to go. */
        const fade = 1 - clamp01((t - 0.87) / 0.13)

        /* Beat 3 · the footprint enlarges — as a drawing, holding its own shape until
           its inner edge reaches the frame. */
        const grow = clamp01((t - 0.20) / 0.66)
        const now = quad.map((q, i) => [
          gsap.utils.interpolate(q[0], dest[i][0], grow),
          gsap.utils.interpolate(q[1], dest[i][1], grow),
        ])

        const poly = now.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(', ')
        plate.style.clipPath = `polygon(${poly})`
        plate.style.opacity = String(clamp01((t - 0.18) / 0.12))

        outlinePoly.setAttribute('points', now.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '))
        outlinePoly.style.opacity = String(Math.min(line, fade))

        if (t > 0.995) hide()
      }

      return { update, hide }
    })()


    /* ------------------------------------------------------------------------------
       ACT 02 — THE COMPOUND. Five beats, and nothing shares one.

         0.00–0.06  the page's own language yields. The act's label and heading recede
                    to make room for a drawing; they do not leave, they stop competing.
         0.06–0.36  the compound resolves. The viewBox opens FROM the entry road — the
                    same threshold act 00's gate was, now seen in plan — while the
                    masses draw in on a 24ms stagger. The camera and the content are
                    on different curves so the picture assembles rather than appears.
         0.36–0.50  the record column arrives. Late, and by opacity only: it is
                    reading matter and reading matter does not perform.
         0.50–0.62  LEVEL 02. One building takes light; its neighbours lose it.
         0.62–0.74  LEVEL 03. One bay is the subject.
         0.74–1.00  ENTER. See below.

       The recognition the act exists for — *the line that has been following me is
       this place* — lands in the second beat, and it is deliberately unannounced.
       ------------------------------------------------------------------------------ */
    const act02 = document.querySelector('[data-pin="compound"]')
    const svg = compound?.svg
    const compoundEl = document.querySelector('[data-compound]')

    if (act02 && svg && compoundEl) {
      const vb = svg.viewBox.baseVal
      const full = { x: vb.x, y: vb.y, w: vb.width, h: vb.height }
      const head = act02.querySelector('.span-stage > .t-label')
      const h2 = act02.querySelector('#h-02')
      const record = act02.querySelector('[data-record]')

      /* The masses resolve on their own timeline so the stagger is real rather than a
         function of scroll distance. Driven by progress, not played. */
      const bldgs = gsap.utils.toArray('.bldg', svg)
      const civic = gsap.utils.toArray('.compound__civic > *', svg)
      const road = svg.querySelector('.compound__road')

      /* THE MASSES ARE NEVER FADED.

         A first pass resolved them from opacity 0.35 and the opening frames came out
         empty: --mass sits 1.10:1 on --deck and the drawing is carried by its hairlines,
         so a third of opacity puts the whole picture under the threshold and the visitor
         stops on a blank stage. Every frame in a pinned act is a frame someone can stop
         on (`MJ4`).

         So the CAMERA is the resolve. The act opens tight on a fragment of the drawing
         at full strength — which is the honest hand-off from the rail, itself a fragment
         — and the frame opens out until the whole compound is in it. Abstract trace to
         recognisable drawing to full compound, done by framing rather than by fading,
         and legible at every stop.

         The stagger moves to the index, where an order actually exists to express
         (`ST1`: stagger only where the order means something). */
      const rows = gsap.utils.toArray('[data-bay-list] > *').slice(0, 8)
      const indexIn = gsap.timeline({ paused: true })
      if (rows.length) {
        indexIn.from(rows, {
          opacity: 0, duration: 0.5, ease: 'power1.out',
          stagger: { each: 0.024, from: 'start' },   /* ≤400ms span, capped at 8 (`ST3`) */
        })
      }

      let lastLevel = null

      ScrollTrigger.create({
        trigger: act02,
        start: 'top top',
        end: '+=160%',                  /* 1.6 + the act's own 1.0 = the 2.6vh budget */
        pin: true,
        pinSpacing: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        id: 'act02',
        onUpdate: (self) => {
          const p = self.progress

          /* ONE owner per property (`G6`). The act's own language is driven here and
             nowhere else: it yields early to make room for the drawing, and it clears
             completely during the ENTER so the room is not read through a column of
             live text. */
          const yieldK = clamp01(p / 0.12)
          const clearK = clamp01((p - 0.72) / 0.10)
          if (head) head.style.opacity = String(gsap.utils.interpolate(1, 0.40, yieldK) * (1 - clearK))
          if (h2) h2.style.opacity = String(gsap.utils.interpolate(1, 0.55, yieldK) * (1 - clearK))
          if (record) record.style.opacity = String(clamp01((p - 0.24) / 0.12) * (1 - clearK))

          indexIn.progress(clamp01((p - 0.28) / 0.14))

          /* The camera. A drawing being unrolled on a table: even, unhurried, and it
             stops opening well before the levels begin so the two never move together. */
          const k = clamp01(p / 0.30)
          const w = gsap.utils.interpolate(full.w * 0.34, full.w, k)
          const h = gsap.utils.interpolate(full.h * 0.34, full.h, k)
          const ax = 0.16, ay = 0.74      /* opens from the entry road */
          svg.setAttribute('viewBox',
            `${full.x + (full.w - w) * ax} ${full.y + (full.h - h) * ay} ${w} ${h}`)

          /* 0.38–0.52 is a HOLD. The recognition needs a beat where nothing moves, or
             it is just another thing that happened on the way past. */

          /* Levels advance with the pin; SELECTION never does. Binding a choice to
             scroll takes the choice away from the visitor (`SC1`, `DM7`). */
          const level = p < 0.52 ? 'compound' : p < 0.62 ? 'building' : 'suite'
          if (level !== lastLevel && !state?.suite) {
            lastLevel = level
            setLevel ? setLevel(level) : compoundEl.setAttribute('data-level', level)
          }

          enter.update(p)
        },
        onLeaveBack: () => { enter.hide() },
      })
    }

    /* ------------------------------------------------------------------------------
       ACT 03 — the peak, and the instruction here is DO LESS.

       The visitor has arrived. The choreography that got them here was the compound;
       inside the room, stillness is the contrast that makes it read as an arrival
       rather than as one more effect.

       `C6-TEMP` binds, and it is the reason this block is as short as it is. The four
       state assets are one stand-in and three developer renders from three different
       viewpoints. They are NOT one camera, so motion may not assert that they are:
       no morph, no scale-matching, no position-matching, no parallax beneath the
       change, and no camera-settling gesture at the seam. What is left — and what is
       permitted — is a cut with a restrained crossfade, which is what a change of
       editorial plate looks like and is honest about the discontinuity.

       Nothing here transforms a state. Opacity only, by CSS, at --dur-base.
       ------------------------------------------------------------------------------ */
    const act03 = document.querySelector('[data-pin="suite"]')
    if (act03) {
      const order = ['delivered', 'garage', 'lounge', 'personalized']
      const TRUTH = {
        delivered: ['What you are actually given.', 'Suite as delivered · stand-in, not the property'],
        garage: ['What it holds, at true proportion.', 'Suite interior, occupied · developer render'],
        lounge: ['What the second level becomes.', 'Mezzanine, finished · developer render'],
        personalized: ['What someone made of theirs.', 'Owner fit-out · developer render'],
      }
      let lastState = null

      ScrollTrigger.create({
        trigger: act03,
        start: 'top top',
        end: '+=240%',                  /* 2.4 + the act's own 1.0 = the 3.4vh budget */
        pin: true,
        pinSpacing: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        id: 'act03',
        onUpdate: (self) => {
          /* Each state HOLDS for its quarter and changes on a boundary. A hold is the
             default character of this act, not an absence of one. */
          const i = Math.min(order.length - 1, Math.floor(self.progress * order.length))
          const name = order[i]
          if (name === lastState) return
          lastState = name

          act03.querySelectorAll('.suite__state').forEach((n) => {
            n.setAttribute('data-active', n.dataset.state === name ? 'true' : 'false')
          })
          document.querySelectorAll('[data-state-btn]').forEach((b) => {
            b.setAttribute('aria-current', b.dataset.stateBtn === name ? 'true' : 'false')
          })
          const t = document.querySelector('[data-state-truth]')
          if (t) t.textContent = TRUTH[name][0]
          const c = document.querySelector('[data-state-caption]')
          if (c) c.textContent = TRUTH[name][1]
        },
      })
    }

    return () => { enter.hide() }
  })

  /* --------------------------------------------------------------------------------
     Assert the system took hold. SC5: a motion layer that silently no-ops looks exactly
     like a page where motion was never designed, so it says so rather than failing
     quietly.
     -------------------------------------------------------------------------------- */
  requestAnimationFrame(() => {
    const n = ScrollTrigger.getAll().length
    if (n === 0 && !reduced()) {
      console.warn('[luxe-corsa] motion loaded but bound 0 triggers — check data-act roles.')
    } else {
      console.info(`[luxe-corsa] motion took hold: ${n} triggers, ${reduced() ? 'reduced-motion path' : 'full path'}.`)
    }
  })

  ScrollTrigger.refresh()

  return () => { mm.revert(); ctx.revert() }
}
