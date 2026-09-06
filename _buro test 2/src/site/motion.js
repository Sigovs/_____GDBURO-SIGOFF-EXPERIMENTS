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

export function initMotion({ compound, selectSuite, setLevel, state, cam } = {}) {
  const root = document.documentElement

  /* The camera is main.js's, because the static page has to be able to reach all three
     levels without this file ever loading. What the motion layer contributes is the
     TRAVEL: handing GSAP over turns an instant reframe into the page's signature move,
     and changes nothing about which frames exist (`MJ5`, `G7`). */
  cam?.useGsap(gsap)

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
        /* THE ENTRANCE EVENT — the gate light comes on.

           A dimmer coming up across the whole plate is a fade with a better name: the
           frame gets uniformly brighter and nothing has happened in it. What act 00's
           photograph actually shows is one lit opening in a long dark wall, so the
           light should ARRIVE THERE and spread out from it.

           A radial mask, centred on the gatehouse at 52%/44% of the frame, opens from
           nothing to the full plate. Because it is a clip and not an opacity, the wall
           does not brighten — it is DISCOVERED, in the order light would actually find
           it, and the composition's own subject is the origin of the reveal. The dimmer
           still runs underneath, half its old depth, so the plate settles rather than
           snapping once the mask has passed.

           Slower than anything else on the page and it happens once, on load. This is
           the moment the visitor is admitted. */
        gsap.set(field00, { opacity: 0.55, clipPath: 'circle(0% at 52% 44%)' })
        intro.to(field00, {
          clipPath: 'circle(125% at 52% 44%)',
          duration: DUR.settle * 1.5,
          ease: 'door',
        }, 0)
        intro.to(field00, { opacity: 1, duration: DUR.settle * 1.4 }, 0.15)
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

    /* ==============================================================================
       THE FRAME REVEAL — one device, every photographic frame on the page.

       Every image on this page used to arrive by opacity, which is the generic fade-up
       the direction bans by name and which makes seven acts feel like one template with
       different pictures in it. This replaces it with the language the system actually
       declares: a HARD MASK and a SCALE.

       A frame opens as a shutter opens — an inset clip travelling off the bottom edge
       on the page's own door ease — while the picture inside it settles from 1.10 to
       1.0 on a longer curve. The two are deliberately not the same length: the mask
       finishes and the image is still arriving, so the frame lands and the picture
       keeps moving fractionally under it, which is what a plate settling in a gate does
       and what a fade can never do.

       Bound to a ROLE (`SC5`) — every `.macro__frame` on the page, in any act, present
       or future — rather than to a list of instances. Once, never on scroll-back: a
       re-triggering entrance is the most reliable way a cinematic page starts feeling
       cheap (`T5`).
       ============================================================================== */
    for (const frame of gsap.utils.toArray('.macro__frame')) {
      const img = frame.querySelector('img')
      if (reduced()) { frame.style.clipPath = 'none'; if (img) img.style.transform = 'none'; continue }
      const tl = gsap.timeline({
        scrollTrigger: { trigger: frame, start: 'top 86%', once: true },
      })
      tl.fromTo(frame,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: DUR.door, ease: 'door' }, 0)
      if (img) {
        tl.fromTo(img,
          { scale: 1.10 },
          { scale: 1, duration: DUR.settle, ease: 'power2.out' }, 0)
      }
    }

    /* THE SLOW DRIFT. Large photographic plates get a scroll-BOUND scale across their
       whole travel through the viewport — 1.0 to 1.045, which is under the threshold at
       which the eye reads it as a zoom and over the threshold at which a still image
       reads as dead. Scrubbed, so it is the visitor moving rather than the page playing
       (`MJ6`), and applied only to the frames big enough for it to be a camera rather
       than a wobble. */
    for (const frame of gsap.utils.toArray('.macro__frame')) {
      const img = frame.querySelector('img')
      if (!img || reduced()) continue
      if (frame.getBoundingClientRect().width < 380) continue
      gsap.fromTo(img, { yPercent: -2.2 }, {
        yPercent: 2.2,
        ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
      })
    }

    /* ==============================================================================
       ACT 06 — THE DRAWING CONSTRUCTS ITSELF.

       The A/B diagram is the page's only true technical drawing and it was arriving as
       a finished picture at full opacity, which wastes the one thing a drawing can do
       that a photograph cannot: be watched being made.

       So it is drawn, in the order a draughtsman would draw it — the locked depth
       dimension first, because that is the axis the whole comparison is anchored on,
       then the unit outline, then the mezzanine line, then the width that is the only
       thing that differs between the two types. Standard stroke-dash construction, no
       plugin. The labels arrive after their lines, never with them.

       This is a TRIGGERED beat, not a scrubbed one (`MJ` role split): the drawing is a
       statement, and a statement lands once at its own pace rather than being smeared
       across whatever scroll distance the visitor happens to use.
       ============================================================================== */
    const abStage = document.querySelector('.ab__stage svg')
    if (abStage && !reduced()) {
      const order = [
        ...abStage.querySelectorAll('.ab__dim-locked'),
        abStage.querySelector('.ab__unit'),
        ...abStage.querySelectorAll('.ab__dim'),
        ...abStage.querySelectorAll('.ab__car'),
      ].filter(Boolean)
      const labels = abStage.querySelectorAll('.ab__t')
      const mezz = abStage.querySelector('.ab__mezz')

      /* ONE trigger. The timeline is built paused and a single ScrollTrigger starts it;
         giving the timeline its own `scrollTrigger` as well would create a second
         trigger on the same element, which is both a duplicate and a race about who
         owns playback. */
      const tl = gsap.timeline({ paused: true })
      for (const [i, node] of order.entries()) {
        const len = node.getTotalLength ? node.getTotalLength() : 0
        if (!len) continue
        gsap.set(node, { strokeDasharray: len, strokeDashoffset: len })
        tl.to(node, { strokeDashoffset: 0, duration: 0.42, ease: 'power2.inOut' }, i * 0.075)
      }
      /* The mezzanine is a FILL, so it cannot be drawn — it wipes, on the same axis the
         real mezzanine sits on. */
      if (mezz) {
        tl.fromTo(mezz, { opacity: 0 }, { opacity: 0.5, duration: DUR.base, ease: 'power1.out' }, 0.34)
      }
      tl.fromTo(labels, { opacity: 0 }, { opacity: 1, duration: DUR.quick, stagger: 0.05, ease: 'none' }, 0.5)
      ScrollTrigger.create({ trigger: abStage, start: 'top 78%', once: true, onEnter: () => tl.play() })
    }

    /* ==============================================================================
       01 → 02 — THE ARRIVAL, and it is one spatial event rather than two sections.

       THE THESIS: act 02's camera starts where act 01's camera ended.

       Act 01 is a photograph taken standing on the drive looking down it. Act 02 is
       that same drive from above. So the boundary between them is not a cut, a fade or
       another aperture — it is the single camera move that joins those two viewpoints,
       and the model can actually perform it because it is a real camera in a real
       space rather than a picture of one.

       Three things are scrubbed together across the boundary, and they are deliberately
       on different curves so the handover is a dissolve of AUTHORITY rather than of
       pixels:

         the MODEL lifts from eye height on the entry road to the composed aerial
         the PHOTOGRAPH gives way — it darkens and compresses toward its own vanishing
           point, so the image recedes down the drive it depicts instead of fading out
         the CAPTION clears early, because reading matter should not be present while
           the ground is moving

       One trigger owns the whole boundary. The pin's own resolve keeps the SVG frame
       for the fallback path and never touches the model, so there is exactly one writer
       of the 3D camera at any moment (`G6`).
       ============================================================================== */
    const act02El = document.querySelector('[data-pin="compound"]')
    const act01El = document.querySelector('[data-dolly]')
    if (act02El && cam && !reduced()) {
      const plate01 = act01El?.querySelector('.field__pic')
      const cap01 = act01El?.querySelector('.field__caption')
      ScrollTrigger.create({
        trigger: act02El,
        start: 'top bottom',
        end: 'top top',
        scrub: 0.5,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress
          cam.arrival?.(p)
          if (plate01) {
            /* The photograph recedes INTO its own perspective: it scales down about a
               point near its vanishing point and loses light as it goes. */
            plate01.style.transformOrigin = '54% 46%'
            plate01.style.transform = `scale(${1 - p * 0.14})`
            plate01.style.filter = `brightness(${1 - p * 0.72})`
          }
          if (cap01) cap01.style.opacity = String(Math.max(0, 1 - p * 2.2))
        },
        onLeaveBack: () => {
          if (plate01) { plate01.style.transform = ''; plate01.style.filter = '' }
          if (cap01) cap01.style.opacity = ''
        },
      })
    }

    /* ==============================================================================
       ACT 05 — THE ROOM BREATHES.

       Every act up to here moves like a machine: masks with hard edges, scrubbed
       cameras, precise staggers, nothing arriving late. That is correct for a compound
       of closed doors and it is exactly wrong for the one act about people.

       So act 05 breaks the cadence, once, and the break IS the content: the lead
       frame — members standing in the club with the compound through the glass behind
       them — is the only image on the page that moves on its own clock. It drifts,
       slowly and continuously, on a long sine rather than on scroll: a very small
       lateral wander with a matching scale breath, twenty-three seconds a cycle, never
       repeating exactly against the page's own rhythm.

       WHY IT WORKS: everything else on this page stops when the visitor stops. This
       does not. A room with people in it is still going on whether or not you are
       looking at it, and that single difference in temporal behaviour does more to make
       act 05 feel human than any amount of warm grading.

       The two subordinate frames stay mechanical, so the drift reads as belonging to
       the people rather than to the section. Transform only. It halts under reduced
       motion, where the still frame is already a designed frame. */
    const clubLead = document.querySelector('.club__lead .macro__frame img')
    if (clubLead && !reduced()) {
      const drift = { t: 0 }
      gsap.to(drift, {
        t: Math.PI * 2,
        duration: 23,
        ease: 'none',
        repeat: -1,
        onUpdate: () => {
          const x = Math.sin(drift.t) * 1.15
          const y = Math.sin(drift.t * 0.63 + 1.1) * 0.7
          gsap.set(clubLead, { xPercent: x, yPercent: y, scale: 1.045 + Math.sin(drift.t * 0.5) * 0.012 })
        },
      })

      /* The warmth arrives BEFORE the people do. A short, once-only lift on the frame's
         own light as it enters, so the act is already warmer by the time the figures in
         it are legible — light first, company second, which is how walking into a lit
         room actually reads. */
      gsap.fromTo(clubLead,
        { filter: 'brightness(0.62) saturate(0.72)' },
        {
          filter: 'brightness(1) saturate(1)',
          duration: DUR.settle * 1.3,
          ease: 'power2.out',
          scrollTrigger: { trigger: clubLead, start: 'top 82%', once: true },
        })
    }

    /* ==============================================================================
       ACT 07 — THE HOLD.

       The page closes on a photograph of an open door with light coming through it, and
       the beat it needs is the opposite of every other beat: something that comes to
       REST. So the plate pushes very slightly — 1.06 over the act's whole travel — and
       then stops, because the visitor has arrived and the invitation should not be
       moving while they read it.

       The push is scrubbed and tiny; what makes it land is that it is the only motion
       left. Everything else in this act is already still. */
    const act07 = document.querySelector('[data-act="07"]')
    const img07 = act07?.querySelector('.field__img')
    if (img07 && !reduced()) {
      gsap.fromTo(img07, { scale: 1.06 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: act07, start: 'top bottom', end: 'top 20%', scrub: 0.9 },
      })
    }

    /* ==============================================================================
       ACT 06 — THE SCHEDULE COMMITS.

       The diagram draws itself; the list under it should not merely appear. Each line
       of what is included in every suite arrives on a precise stagger with its own rule
       drawn from the left — the gesture of a schedule being signed off line by line.
       Transform and opacity only, so it costs nothing.
       ============================================================================== */
    const sched = gsap.utils.toArray('[data-act="06"] .spec-list li, [data-act="06"] .disclose')
    if (sched.length && !reduced()) {
      gsap.from(sched, {
        opacity: 0,
        xPercent: -1.5,
        duration: DUR.base,
        ease: 'power2.out',
        stagger: 0.035,
        scrollTrigger: { trigger: sched[0], start: 'top 88%', once: true },
      })
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
      /* REVISED — ARRIVAL IS A PUSH, NOT A PAN.

         A lateral pass says "you are going past this place". Act 01's whole job is to
         say the compound is AHEAD of you and you are closing on it, so the plate now
         moves toward the viewer: a scrubbed 1.0 -> 1.18 scale with a slight lateral
         drift, on the frontage photograph whose own vanishing point is dead ahead down
         the drive. The scale does the arriving; the residual pan keeps it from reading
         as a mechanical zoom.

         Linear, because a dolly runs at the rate the visitor scrolls rather than at the
         rate an ease would prefer, and the visitor keeps the transport throughout. */
      gsap.fromTo(dolly, { scale: 1, xPercent: 0 }, {
        scale: 1.18, xPercent: -3.5, ease: 'none',
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
    /* ==============================================================================
       02 → 03 — THE THRESHOLD.

       THE THESIS: the warm light at the chosen door becomes the room.

       `C6-TEMP` still binds — act 03's four images are four different cameras and no
       amount of choreography may pretend otherwise. So this does not fly through the
       door, morph geometry into photography or match anything spatially. It uses the
       one thing that CAN be continuous across incompatible cameras: LIGHT.

       Outside, the selected suite's door carries a small warm light. As the act closes,
       four things happen in sequence and none of them shares a beat:

         0.74–0.82  the camera descends toward that door and the compound behind it
                    loses its own light. The model is still the subject.
         0.80–0.90  the warm field grows FROM THE DOOR'S OWN PROJECTED POSITION on
                    screen — not from the centre, from wherever that door actually is —
                    until it is the whole frame.
         0.90–0.96  near-black. A true threshold: for a moment there is nothing, which
                    is what crossing one is.
         0.96–1.00  act 03's interior arrives through the existing aperture, inheriting
                    the warmth the door established.

       The colour is the door's own emissive value, so the light that fills the screen is
       literally the light that was on the model a second earlier. That is the whole
       device, and it is why it reads as physical without asserting a camera match. */
    const threshold = (() => {
      let layer = null
      const build = () => {
        if (layer) return
        layer = document.createElement('div')
        layer.className = 'threshold'
        layer.setAttribute('aria-hidden', 'true')
        document.body.appendChild(layer)
      }
      const update = (p) => {
        const warm = clamp01((p - 0.80) / 0.10)
        const dark = clamp01((p - 0.90) / 0.06)
        /* THE THRESHOLD MUST CLEAR ITSELF AT BOTH ENDS.

           A pinned act's onUpdate stops firing once the scroll leaves its range, so a
           layer left at full opacity at p = 1 stays over every act below it — the
           whole rest of the page rendered as a black field. The act's own comments warn
           about exactly this class of defect for the rail; this is the same one, on a
           fixed element covering the viewport. Cleared above 0.985 as well as below
           0.80, and cleared again by the trigger's own leave handlers. */
        if (warm <= 0 || p > 0.985) { if (layer) layer.style.opacity = '0'; return }
        build()

        /* WHERE the light comes from: the selected suite's door, projected to screen.
           Falls back to the frame's centre only when nothing is selected. */
        let ox = 50
        let oy = 62
        const d = cam?.doorScreen?.()
        if (d) { ox = d.x; oy = d.y }

        layer.style.opacity = '1'
        /* The field grows from a tight warm core to the whole frame, then the whole
           frame goes to the compound's own black. */
        /* The core stays SMALL for most of the beat. Growing straight to 150% put a
           flat wash over the whole frame at the halfway point, which reads as a haze
           rather than as light coming out of an opening. A tight core with a dark
           surround is what a lit door in a dark elevation actually looks like. */
        const r = 3 + warm * warm * 88
        const lum = 1 - dark
        /* ELLIPSE, not circle: a radial-gradient circle's size must be a LENGTH, and
           `circle 94%` is simply invalid — the whole declaration is dropped and the
           layer renders nothing at all while still reporting opacity 1. Percentages are
           legal on the two-value ellipse form, which is what this needs anyway: the
           field should reach the frame's corners on a wide stage and on a tall one. */
        layer.style.background =
          `radial-gradient(ellipse ${r}% ${r * 1.35}% at ${ox}% ${oy}%, ` +
          `rgba(255,201,138,${(0.96 * lum).toFixed(3)}) 0%, ` +
          `rgba(190,132,74,${(0.78 * lum).toFixed(3)}) 30%, ` +
          `rgba(12,10,9,${(0.78 + 0.22 * dark).toFixed(3)}) 62%, ` +
          `rgba(7,8,10,${(0.9 + 0.1 * dark).toFixed(3)}) 100%)`
      }
      const hide = () => { if (layer) layer.style.opacity = '0' }
      return { update, hide }
    })()

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

    /* Assigned inside the act-02 block below, where the resting frame is known, and
       called from this handler's cleanup — which sits outside that block and therefore
       cannot see its locals. */
    let restCamera = null

    if (act02 && svg && compoundEl) {
      /* THE OPENING FRAME. The act has to be ON this crop before the pin engages, so it
         is defined once and used by both the setup and the scrub — a crop defined in two
         places is a crop that will disagree with itself. The anchor that goes with it
         (0.16 / 0.74, the entry road) lives with the camera in main.js now, beside the
         resting frame it is a fraction of. */
      const CROP = 0.34

      restCamera = () => {
        /* Hand the wheel back and return to the composed frame. `release()` first: the
           camera refuses a scroll-driven resolve while the visitor owns it, and this
           cleanup runs precisely when the visitor has left the act. */
        cam?.release()
        cam?.toLevel('compound', false)
        compoundEl.style.removeProperty('--plan-k')
        compoundEl.style.removeProperty('--perim-k')
        compoundEl.style.removeProperty('--trace-k')
        /* The rail belongs to the whole page, not to this act, so a beat left lit here
           would light it for every act on the way out. It is the one piece of act-02
           state that lives outside act 02. */
        railEl?.style.removeProperty('--rail-k')
        if (roadTrace) {
          roadTrace.setAttribute('opacity', '0')
          roadTrace.style.strokeDashoffset = String(traceLen)
        }
      }

      /* THE RESOLVE, and it is no longer this file's viewBox.

         The camera moved to main.js when act 02 got three real framings, because a
         level the visitor chooses has to work with this file absent (`G7`). What is
         left here is the RESOLVE — the opening crop widening to the composed frame —
         and it is handed to the same object every other framing goes through, so there
         is exactly one writer of the viewBox and one writer of --plan-k (`G6`).

         `cam.resolve` refuses the call once the visitor has selected anything, which is
         what keeps the scrub from dragging the frame back off a building the visitor
         chose. Scroll introduces the compound; it does not steer it. */
      const camera = (k) => {
        cam?.resolve(k, CROP)

        /* The perimeter arrives ON the camera, and finishes before the record starts.
           k 0.40 -> 0.80 is pin progress 0.12 -> 0.24, and the record begins at 0.24,
           so the compound's edge and the reading matter never land on one beat. It is
           absent while the frame is inside the compound because a boundary you can
           only see two fragments of describes nothing; it is whole by the time the
           frame can hold what it encloses. */
        compoundEl.style.setProperty('--perim-k', clamp01((k - 0.40) / 0.40).toFixed(3))
      }

      /* THE ACT MUST BE ON ITS OPENING FRAME BEFORE THE PIN ENGAGES.

         ScrollTrigger does not run onUpdate until the scroll is inside the trigger's
         range, so on a FIRST visit the compound sat at its resting viewBox — the whole
         compound, fully revealed — for the entire approach, and then snapped to the 34%
         fragment the instant the pin took hold and opened out to the same picture again.
         The visitor was shown the ending, then shown it being assembled.

         It only ever reproduced on a cold load, because once the trigger has been active
         it holds progress 0 on the way back up, which is why a scroll-back sweep found
         nothing. Applying progress 0 at setup is what makes the approach and the scrub
         the same state.

         Inside the desktop matchMedia by construction, so the phone and the
         reduced-motion path — neither of which has this pin — keep the resting frame and
         the full compound. The cleanup below puts it back if the query stops matching. */
      camera(0)
      const head = act02.querySelector('.span-stage > .t-label')
      const h2 = act02.querySelector('#h-02')
      const record = act02.querySelector('[data-record]')

      /* THE RECOGNITION'S TWO OBJECTS.

         The rail's drawn fragment, which has been at the edge of the page since act 00,
         and the compound's own road centreline, which is the same kind of object at a
         different crop. The beat below draws the second one and lifts the first, once,
         so the visitor sees them as one thing. Both already exist; neither is created
         for the occasion. */
      const railEl = document.querySelector('[data-rail]')
      const roadTrace = compound?.roadTrace || null
      const traceLen = roadTrace ? roadTrace.getTotalLength() : 0
      if (roadTrace) {
        roadTrace.style.strokeDasharray = String(traceLen)
        roadTrace.style.strokeDashoffset = String(traceLen)
      }

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

      /* lastLevel is gone with the scroll-driven levels it tracked. */

      const act02Pin = ScrollTrigger.create({
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
          /* The record used to arrive at 24% of the pin, which left the first quarter
             of the act inviting an interaction whose controls were not on screen yet.
             It now arrives at 8% and is complete by 16% — still after the compound has
             resolved, so the drawing is never read through a live column of text, but
             comfortably before the hint has finished being read. */
          if (record) record.style.opacity = String(clamp01((p - 0.08) / 0.08) * (1 - clearK))

          indexIn.progress(clamp01((p - 0.28) / 0.14))

          /* The camera. A drawing being unrolled on a table: even, unhurried, and it
             stops opening well before the levels begin so the two never move together. */
          camera(clamp01(p / 0.30))

          /* ------------------------------------------------------------------------
             0.42–0.49 · RECOGNISE.   0.49–0.52 · HOLD.

             The act exists to land one sentence — *the line that has been following me
             is this place* — and until now that sentence was carried by absence. A hold
             with nothing authored in it is not a pause, it is a gap, and the visitor
             reads a gap as the page having run out of things to say (`MJ4`).

             So: one event, on two objects that already exist. The compound's road
             centreline draws itself from the entry road outward — the same direction
             act 00's gate faced and the same direction the camera opened from — while
             the rail's own fragment lifts to meet it. They are the same kind of drawing
             at two crops, so showing them together states a fact rather than performing
             a transition. Nothing translates, nothing reframes, the camera has been
             still since 0.30, and the record has been settled since 0.36: the only thing
             that changes is which lines are lit.

             Then it stops. 0.49–0.52 is a true hold with the recognition standing on
             screen — the still beat the sequence needs before the levels take over —
             and the trace recedes to construction weight as level 02 begins, because by
             then it is just the road again.

             The beat starts at 0.42 rather than at 0.38 because the index finishes
             there, and beats do not land together (`P6`, and the act's own five-beat
             ledger above). Everything is a pure function of `p`, so a reverse scroll
             un-draws it in the same order it drew (`SC6`). */
          const rec = clamp01((p - 0.42) / 0.07)
          const settle = 1 - clamp01((p - 0.52) / 0.06)

          if (roadTrace) {
            roadTrace.setAttribute('opacity', rec > 0 ? '1' : '0')
            roadTrace.style.strokeDashoffset = String(traceLen * (1 - rec))
          }
          /* Rank, not presence: the line stays, its weight drops back to construction. */
          compoundEl.style.setProperty('--trace-k', settle.toFixed(3))
          /* The rail answers for exactly as long as the beat lasts, then goes back to
             being the quiet instrument it is for the other seven acts. */
          if (railEl) railEl.style.setProperty('--rail-k', (rec * settle).toFixed(3))

          /* NOTHING ADVANCES A LEVEL HERE ANY MORE.

             The pin used to walk the act through compound -> building -> suite on
             scroll progress, choosing a building for the visitor and then a suite,
             which is the defect `SC1` and `DM7` name: a choice bound to scroll is not a
             choice. It also made the drawing's three states read as a cutscene, so
             arriving at the act and pointing at something felt like interrupting it.

             The levels are the visitor's, entirely, and they are reached by pointing at
             the compound. What scroll still owns is the RESOLVE above — the frame
             opening from the entry road — and the recognition beat. Scroll introduces
             the compound and then gets out of the way. */
          /* The camera goes to the door before the light does. */
          cam?.descend?.(clamp01((p - 0.74) / 0.10))
          enter.update(p)
          threshold.update(p)
        },
        onLeave: () => { threshold.hide() },
        onLeaveBack: () => {
          enter.hide()
          /* onUpdate does not necessarily fire again above the start, and a rail left
             lit outside the act it belongs to is the page's only permanent state — the
             same class of defect `SC6` caught in the ENTER's opacity. */
          threshold.hide()
          if (railEl) railEl.style.setProperty('--rail-k', '0')
          if (roadTrace) {
            roadTrace.setAttribute('opacity', '0')
            roadTrace.style.strokeDashoffset = String(traceLen)
          }
        },
      })

      /* THE PIN'S REAL SCROLL RANGE, published for the ENTER control.

         ENTER has to drive this choreography rather than jump past it, and only the
         trigger knows where its own range actually is — the pin's spacer, the act's
         height and the 160% end are all resolved at refresh time. Exposing the numbers
         means there is still exactly ONE transition implementation: the scrub. The
         button moves the scroll through it; it does not reimplement it. */
      window.__lc_enterRange = () => ({ start: act02Pin.start, end: act02Pin.end })
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

    return () => {
      enter.hide()
      /* matchMedia reverts what GSAP created; the viewBox and the line scale are raw
         attributes on an element GSAP does not own, so they are handed back by hand.
         Without this, crossing to a phone width mid-session would leave the compound
         cropped to a fragment with no pin left to open it. */
      restCamera?.()
    }
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
