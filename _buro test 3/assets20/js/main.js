/* index20 — hero choreography, GSAP 3.15 vendored locally (no external requests).

   ONE primary temporal idea: the route draws. It is the only movement here
   that carries meaning — the line runs from the summit, which is the audience,
   down to what the reader gets. The copy leaving is transport and is ranked
   below it; the plate does not move at all, so there is exactly one spatial
   claim in the view (DM6).

   Everything has an authored still: with reduced motion the route is simply
   drawn, the copy is simply present, and nothing is pinned. */
(function () {
  'use strict';
  if (!window.gsap) return;                     /* the static page stands alone */

  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
  var hasSplit = typeof SplitText !== 'undefined';

  /* ---- the sky answers the pointer ------------------------------------
     A small amount, and on the furthest plane only: distance is the whole
     point, so if the sky moved as much as the near ground the depth would
     invert. Mouse only — there is no pointer to parallax against on touch. */
  /* ---- the bar folds once the reader has left the top -----------------
     Nothing is removed: the menu moves behind a trigger on the right and
     the number and the action stay where they were. */
  (function compactBar() {
    var mh = document.querySelector('.mh');
    var nav = document.querySelector('.mh__nav');
    var burger = document.querySelector('.burger');
    if (!mh || !nav || !burger) return;

    function close() { nav.dataset.open = 'false'; burger.setAttribute('aria-expanded', 'false'); }

    burger.addEventListener('click', function () {
      var open = nav.dataset.open === 'true';
      nav.dataset.open = String(!open);
      burger.setAttribute('aria-expanded', String(!open));
    });
    document.addEventListener('click', function (e) {
      if (!mh.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    var wasCompact = false;
    function onScroll() {
      var compact = window.scrollY > 80;
      if (compact === wasCompact) return;
      wasCompact = compact;
      if (compact) mh.setAttribute('data-compact', ''); else { mh.removeAttribute('data-compact'); close(); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  (function cameraDepth() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    /* One environment, three depths. Each plane moves AGAINST the cursor, and
       the nearer it is the further it travels — that ratio is the whole
       effect. No rotation: this is a camera with depth, not a tilting card. */
    var planes = [
      { el: '.pl--sky',   x: 5,  y: 3,  scale: 1.04 },
      { el: '.pl--mtn',   x: 12, y: 7,  scale: 1.06 },
      { el: '.marks-in',  x: 12, y: 7,  scale: 1    },  /* rides with the mountain */
      /* the readout no longer needs its own entry: it sits inside .marks-in now,
         so it already carries the mountain's offset. Listing it here too would
         double the parallax and drift it off its leader. */
      /* the near ground keeps only a whisper: it is a frame, not the subject */
      { el: '.fg-in',     x: 12, y: 3,  scale: 1.02 },
    ];

    var setters = [];
    planes.forEach(function (p) {
      var el = document.querySelector(p.el);
      if (!el) return;
      if (p.scale !== 1) gsap.set(el, { scale: p.scale, transformOrigin: '50% 50%' });
      setters.push({
        x: gsap.quickTo(el, 'x', { duration: 1.0, ease: 'power3.out' }),
        y: gsap.quickTo(el, 'y', { duration: 1.0, ease: 'power3.out' }),
        ax: p.x, ay: p.y,
      });
    });
    if (!setters.length) return;

    /* While the reader is scrolling the effect steps back to 35%: two inputs
       competing at full strength read as noise rather than as one space. */
    var strength = 1, nx = 0, ny = 0, idle;
    function apply() {
      for (var i = 0; i < setters.length; i++) {
        var s = setters[i];
        s.x(-nx * s.ax * strength);
        s.y(-ny * s.ay * strength);
      }
    }
    window.addEventListener('scroll', function () {
      strength = 0.35;
      clearTimeout(idle);
      idle = setTimeout(function () {
        gsap.to({ v: 0.35 }, { v: 1, duration: .5, ease: 'power2.out',
          onUpdate: function () { strength = this.targets()[0].v; apply(); } });
      }, 140);
      apply();
    }, { passive: true });

    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = hero.getBoundingClientRect();
      nx = ((e.clientX - r.left) / r.width  - .5) * 2;   /* -1 .. 1 */
      ny = ((e.clientY - r.top)  / r.height - .5) * 2;
      apply();
    }, { passive: true });

    hero.addEventListener('pointerleave', function () {
      nx = 0; ny = 0; apply();                            /* eases back to centre */
    });
  })();

  gsap.matchMedia().add({
    motion: '(prefers-reduced-motion: no-preference)',
    still:  '(prefers-reduced-motion: reduce)',
    wide:   '(min-width: 62rem)',
  }, function (ctx) {
    var m = ctx.conditions;

    /* the two halves of every reading: the cyan title with its mark, and the
       lines under it. Both unfold; the title leads, the rest follows it. */
    var PLANE = '.callout__in, .summit-note';
    var DESC  = '.callout__s, .summit-note span';
    /* edge-on but still PRESENT: at 75deg the perspective already does the
       foreshortening, so scaleX only reinforces it. Collapsing scaleX as well
       is what made the plane vanish instead of reading as a turning surface. */
    var EDGE  = { rotationY: 75, scaleX: .8, z: -55, x: -5, autoAlpha: 0,
                  filter: 'blur(1.5px)', transformPerspective: 1000,
                  transformOrigin: 'left center', '--srf': 1, '--sheen': '-60%' };
    /* the settled state IS the accepted composition — nothing of the cue left */
    var FLAT  = { rotationY: 0, scaleX: 1, z: 0, x: 0, autoAlpha: 1,
                  filter: 'blur(0px)', '--srf': 0, '--sheen': '160%' };
    /* the window each reading gets, as fractions of the timeline: the edge holds,
       then the long turn, then the surface burns off while the text stays */
    function unfold(tl, plane, desc, t) {
      tl.to(plane, { autoAlpha: .45, duration: .022, ease: 'none' }, t)
        .to(plane, { rotationY: 0, scaleX: 1, z: 0, x: 0, autoAlpha: 1,
                     filter: 'blur(0px)', duration: .095, ease: 'power3.out' }, t + .026)
        .to(desc,  { autoAlpha: 1, duration: .05, ease: 'power2.out' }, t + .062)
        .to(plane, { '--srf': 0, '--sheen': '160%', duration: .06, ease: 'power2.in' }, t + .055);
    }

    /* ---- the authored still ------------------------------------------ */
    if (m.still) {
      gsap.set(['.route__p', '.lead__l'], { drawSVG: '100%' });
      gsap.set(['.lead__a', '.callout__in', '.summit-note'], { autoAlpha: 1, scale: 1, x: 0, filter: 'none' });
      gsap.set([PLANE, DESC], FLAT);
      return;
    }

    /* ---- the route: drawn by the reader ------------------------------- */
    gsap.set('.route__p', { drawSVG: '0%' });

    var draw = gsap.timeline({
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: '+=150%',        /* A+B as before, plus a cover phase at the end */
        pin: true,                /* an explicit range — sticky's is the parent's */
        pinSpacing: true,
        scrub: 0.6,
        anticipatePin: 1,
      },
    });

    /* The marker arrives at the summit, then the route leaves it — segment by
       segment, in the order the walk would happen. Each one draws while the
       previous is finishing, so the pause where the terrain hides the path is
       felt as a pause rather than read as a stall. */
    /* The mountain recedes as the reader descends. It is held slightly forward
       to begin with and pulls back to its natural size, so the move reads
       without a single frame where the plate's edge could show.

       The route recedes WITH it, at the same rate about the same origin: the
       line is drawn on that mountain, so if it stayed pinned to the screen the
       view would make two contradicting claims about where things are (DM6).
       One camera, one space. */
    /* The camera holds still: the mountain does not move and neither does the
       route drawn on it. What moves is the near ground, and it moves because
       the reader is descending — close things climb the frame, distant things
       barely stir. That is one spatial claim, not two, and it is why the line
       disappearing behind the ridge is depth rather than decoration. */
    /* Three planes, one camera. The reader is descending into the valley, so
       the near ridge climbs the frame quickly while the distant mountain pulls
       back — different rates, one consistent movement, which is what makes it
       depth rather than two effects running at once (DM6).

       The route recedes WITH the mountain: it is drawn on it. The plate is
       held forward to begin with and returns to its natural size, so it never
       shrinks past its own edge. */
    /* Scroll writes to the WRAPPERS only. The inner elements are the pointer's,
       and neither ever touches the other's transform. */
    /* A slow push INTO the mountain, not the near ground being hauled up the
       screen. The mountain grows rather than shrinks — it was running
       1.16 → 1.0, which is a pull-out, and is why the summit kept getting
       smaller. Foreground travel is cut to a quarter of what it was
       (yPercent 14 → −26 became 5 → −8) so the rocks frame the peak instead
       of swallowing it. */
    /* REMOVED — these were what turned the near ground into a wall:
         gsap.set('.hero__fg',  { yPercent: 5, ... })
         draw.to('.hero__fg',   { yPercent: -8, scale: 1.16, ... }, 0)
       The foreground now has no scroll Y at all. Its base position is set
       once, in CSS, and the only thing GSAP touches on it is a scale of
       1 → 1.025 about its own foot, which cannot lift the upper rocks. */
    /* The mountain RECEDES: 1.00 → 0.82 about 50%/35%, so the summit stays
       where it is while the mass withdraws. The route group takes the same
       transform, not a copy of it in spirit — identical values, so the line
       and its anchors cannot come off the slope.

       Neither the sky nor the near ground grows to compensate: the foreground
       is approved and frozen, and enlarging the sky would read as the camera
       moving two ways at once. */
    /* ===================================================================
       TWO PHASES, one scrubbed timeline.

       A · 0 → .55   the route climbs a stationary mountain, and each marker
                     lights only as the stroke reaches it. Nothing else moves.
       B · .55 → 1   only then does the landscape move: the near rocks rise
                     past the camera while the mountain withdraws.
       =================================================================== */
    var C = 0.733;          /* A and B now occupy the first 73.3% of a longer pin */
    var A = 0.55 * C;       /* the route story still ends at 55% of A+B */

    /* The copy says "the deeper you go", so the line descends. The path is
       authored summit-downward already (M196 10 … 26 598), so it is drawn
       forwards — the reverse-drawing that made it climb has been removed. */
    gsap.set('.route__p', { drawSVG: '0%' });
    gsap.set('.fg-scroll', { y: 0 });
    gsap.set(['.pw--mtn', '.hero__marks'], { scale: 1, x: 0, y: 0, yPercent: 0, transformOrigin: '50% 46%' });
    gsap.set('.pw--sky', { clearProps: 'y,yPercent' });   /* the sky is locked for the whole pin */

    /* --- phase A: the descent --- */
    draw.to('.route__p', { drawSVG: '100%', duration: A, ease: 'none' }, 0);

    /* Drawing runs forwards now, so an anchor at fraction f along the path is
       reached at progress f — summit first, then the two events in the order
       the descent meets them. */
    function at(f) { return A * f; }

    /* SIGNAL 001 now reads in the same order as the other two events: the marker
       lands on the route, the elbow draws outward from it, then the label it
       points at. Same durations and easings as the lower two leaders. */
    draw.to('.lead--0 .lead__a', { autoAlpha: 1, scale: 1, duration: .05, ease: 'power2.out' }, .01)
        .to('.lead--0 .lead__l', { drawSVG: '100%', duration: .07, ease: 'none' }, .03)
        ;
    unfold(draw, '.summit-note', '.summit-note span', .085);

    [{ n: '1', f: .30 }, { n: '2', f: .62 }].forEach(function (c) {
      var t = at(c.f);
      draw.to('.lead--' + c.n + ' .lead__a',
              { autoAlpha: 1, scale: 1, duration: .04, ease: 'power2.out' }, t)
          .to('.lead--' + c.n + ' .lead__l',
              { drawSVG: '100%', duration: .07, ease: 'none' }, t + .02)
              ;
      unfold(draw, '.callout--' + c.n + ' .callout__in',
                   '.callout--' + c.n + ' .callout__s', t + .085);
    });

    /* --- phase B: only the near ground moves ---------------------------
       The sky is locked: no y, no yPercent, no scale for the whole pin.
       The mountain shrinks about a fixed origin and is given no translation
       to compensate, so it withdraws in place instead of drifting up. The
       route group carries the identical transform, and the callouts are NOT
       compensated any more — their slight reduction is the depth. */
    draw.to('.fg-scroll', { y: -220, duration: C - A, ease: 'none' }, A)
        .to(['.pw--mtn', '.hero__marks'],
            { scale: .82, duration: C - A, ease: 'none' }, A);

    /* --- phase C: the cover ------------------------------------------
       Nothing in the scene moves. The real next section is lifted over the
       still-pinned hero instead, so the reader sees it arrive rather than
       seeing the hero scroll away, and the pin only releases once it is
       covered. No overlay and no pseudo-element — this is .after itself. */
    gsap.set('.after', { zIndex: 3, y: 0 });
    draw.to(['.fg-scroll', '.after'],
      { y: '-=1500', duration: 1 - C, ease: 'none' }, C);

    /* nothing on the route exists until the climb reaches it */
    gsap.set('.lead__l', { drawSVG: '0%' });
    gsap.set('.lead__a', { autoAlpha: 0, scale: 0, transformOrigin: '50% 50%' });
    /* The containers only carry the perspective now — the reveal belongs to the
       lines inside them, each hinged on the edge its leader reaches. Edge-on and
       pushed back, so it opens toward the camera rather than sliding into place. */
    gsap.set(PLANE, EDGE);
    gsap.set(DESC, { autoAlpha: 0 });   /* rides the plane; only resolves later */

    /* ---- the callouts -------------------------------------------------
       Order is the whole point: the route passes the anchor, the anchor
       lights, the leader draws out, and only then does the reading arrive.
       The right one first, the left one further down. */
    /* The group now SHRINKS 1 → 0.82, so the type's compensation runs the
       other way: it grows to 1/0.82 exactly as fast, and the reading stays
       the same size on screen while its anchor recedes with the slope. */

    /* The pit stop is not there at the start: it arrives when the route
       reaches it. Only then does hover open the three lines. */
    var offer = document.querySelector('.offer');
    if (offer) {
      var items = offer.querySelectorAll('li');
      /* the marker that used to sit here was decoration and has gone; warm
         orange belongs to the second waypoint, not to a floating symbol */
      gsap.set(items, { autoAlpha: 0 });
      var open = gsap.timeline({ paused: true })
        .fromTo(items, { autoAlpha: 0, x: 26 },
          { autoAlpha: 1, x: 0, duration: .7, ease: 'power3.out', stagger: .12 }, 0);

      var show = function (yes) {
        offer.setAttribute('aria-expanded', String(yes));
        yes ? open.play() : open.reverse();
      };
      offer.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'mouse') show(true);
      });
      offer.addEventListener('pointerleave', function (e) {
        if (e.pointerType === 'mouse') show(false);
      });
      offer.addEventListener('focusin', function () { show(true); });
      offer.addEventListener('focusout', function () {
        if (!offer.contains(document.activeElement)) show(false);
      });
    }

    /* ---- the copy leaves, ranked below the route ---------------------- */
    var lines = null;
    if (hasSplit) {
      try { lines = new SplitText('.h-display', { type: 'lines', linesClass: 'ln' }).lines; }
      catch (e) { lines = null; }
    }
    var head = lines && lines.length ? lines : ['.h-display'];

    /* The copy stays completely sharp until the route has finished its story
       at 55%, then leaves between .55 and .68 — before the rising rocks reach
       where it stood. No blur: it was starting at .34, which put the headline
       in soft focus while the climb was still being read. */
    /* The copy drifts OUT TO THE RIGHT as it blurs, the way the cloud banks
       cross the sky — not upward. GSAP cannot interpolate from ilter: none,
       so an explicit blur(0px) start is set first or the blur never runs. */
    gsap.set(head, { filter: 'blur(0px)' });
    gsap.set(['.body', '.rule-o'], { filter: 'blur(0px)' });

    draw.to(head, {
      x: 120, autoAlpha: 0, filter: 'blur(26px)',
      duration: .24, ease: 'power1.in', stagger: .05,
    }, A)
    /* the paragraph leaves without blur: blur on a body measure is the most
       expensive frame on the page and buys nothing at that size */
        .to(['.body', '.rule-o'], { x: 96, autoAlpha: 0, filter: 'blur(20px)', duration: .24, ease: 'power1.in', stagger: .05 }, A + .05);

    return function () { if (lines) SplitText.revert && SplitText.revert('.h-display'); };
  });
})();
