// Callouts — art-directed, one composition per callout.
//
// ─────────────────────────────────────────────────────────────────────────────
// THERE IS NO SOLVER HERE, AND THAT IS THE POINT
//
// The previous cut scored a fan of candidate positions around the anchor and
// took the cheapest. It was collision-safe and it was wrong: given a crowded
// frame the cheapest legal slot is often the far side of the viewport, so the
// answer to "where does this card go" kept coming back as an enormous diagonal
// across the picture. A lower collision score is not a composition.
//
// Every callout now carries an AUTHORED offset — `place: { dx, dy }` — measured
// from its own anchor. That is an art-direction decision made per shot, not a
// runtime one. The module's whole job is to honour it.
//
// The only automatic behaviour left is the two things a fixed offset cannot
// know:
//
//   MIRROR   if the authored side would put the card off-screen, the offset is
//            reflected to the other side of the anchor. That is still the
//            authored composition, seen in a mirror — not a different one.
//   NUDGE    a final clamp into the safe rectangle, bounded. If honouring the
//            offset would need more than NUDGE_MAX pixels of correction the
//            mirror is taken instead, because a card shoved 200px from where it
//            was drawn is no longer where it was drawn.
//
// Distance is therefore whatever the author wrote, and the authored values all
// sit in the 160-280 band. The line is never the variable that absorbs a bad
// position.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE LEADER IS A CURVE, AND IT CARRIES LIGHT
//
// It was two straight segments with a knee, which read as a dimension line off a
// drawing. It is now a single cubic: it leaves the ring committing toward the
// card's height, then flattens into a calm horizontal run at the card's edge —
// the last control point sits at the card's own y, so the arrival is exactly
// level however steep the departure was. The tension in between is a restrained
// per-callout variation, so the same gesture is not drawn three times in one
// chapter.
//
// FOUR PATHS, ONE `d`. A hairline alone reads as ink on a screenshot. The line
// is built the way a lit filament is: a wide, very faint atmospheric bloom, a
// small soft halo, a sharp bright core, and — only while it is growing — a short
// brighter SPARK riding the drawing head. The spark fades out when the line
// settles, so the steady state is a calm luminous line and the card stays the
// loudest object in the frame.
//
// The dash is set from the path's OWN measured length on all four, so the four
// layers grow as one line and the growth is real rather than a constant big
// enough for anything.
//
// ─────────────────────────────────────────────────────────────────────────────
// A SCROLL CALLOUT IS A PURE FUNCTION OF SCROLL. THERE IS NO CLOCK IN HERE.
//
// It used to have one. `at` was a THRESHOLD — cross it and a 1150ms ramp started
// and then ran on its own `performance.now()` delta, whatever the scroll did
// next. Measured on a real GPU, scrolling to 22% of the arrival shot and then
// stopping dead produced 395 consecutive frames in which `--d` kept moving with
// the page completely still, and the same scrollY sampled twice during one slow
// scrub returned two different values 123 times. That is exactly the reported
// fault: the line appears to stick, then catches up on its own, then the card
// lands late.
//
// A callout now owns a WINDOW of its shot's progress — `at` to `at + span` — and
// its whole state is
//
//     d = clamp01((p - at) / span)
//
// evaluated fresh every frame from the progress ScrollTrigger hands us. Stop at
// 47% and it stays at 47%. Scroll back and it retracts immediately, because
// running it backwards is the same arithmetic with a smaller p. Nothing waits,
// nothing accumulates, and there is no state to get out of step.
//
// VISIBILITY IS A SEPARATE FACTOR, and it is deliberately not folded into `d`.
// An anchor drifting off the frame must not make the LINE look half-drawn — it
// must take the whole annotation out. So the module writes two variables: `--d`
// (the scroll's own position in the callout's window) and `--vis` (how far
// inside the frame the anchor is, over a soft band rather than a hard edge, so
// nothing pops as the camera moves).
//
// The one time-based path left is `setDraw`, which the intro uses to hand the
// first callout over. It is not on the scroll path.

const NS = 'http://www.w3.org/2000/svg';
const el = (n, a) => {
  const e = document.createElementNS(NS, n);
  for (const k in a) e.setAttribute(k, a[k]);
  return e;
};

const SAFE = { top: 96, right: 40, bottom: 44, left: 40 };

const RING = 9;           // the anchor's ring radius
const OFF_ANCHOR = 8;     // air between the ring and where the leader starts
const OFF_CARD = 13;      // air between where the leader ends and the card
const KNEE = 52;          // length of the calm run into the card's edge
const SPARK = 26;         // the lit segment that rides the drawing head
const NUDGE_MAX = 74;     // how far the safe area may correct an authored place

/* the authored default, for a callout that does not name its own */
const PLACE = { dx: 210, dy: -110 };

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function createCallouts({ camera, rig, layer = 'sheet' }) {
  const svg = el('svg', { class: `co co--card co--${layer}`, 'aria-hidden': 'true' });
  /*
    THE LEADER FADES OUT AT THE MACHINE END. A hairline of one alpha reads as a
    line drawn ON the render; falling away toward the anchor makes it read as a
    line leaving the object, and stops the eye following it back instead of
    landing on the words.
  */
  const defs = el('defs', {});
  svg.append(defs);
  /*
    ONE GRADIENT PER CALLOUT, NOT ONE SHARED.

    The shared element was `userSpaceOnUse` and every live callout wrote its own
    endpoints into it each frame, so with two on screen the second one's
    coordinates were painting the first one's line. Two callouts share a chapter
    in every shot on this page, which is to say it was wrong the whole time it
    was visible.
  */
  const makeGrad = (id) => {
    const g = el('linearGradient', { id: 'co-lead-' + id, gradientUnits: 'userSpaceOnUse' });
    g.append(
      el('stop', { offset: '0', 'stop-color': 'currentColor', 'stop-opacity': '0.18' }),
      el('stop', { offset: '0.45', 'stop-color': 'currentColor', 'stop-opacity': '0.72' }),
      el('stop', { offset: '1', 'stop-color': 'currentColor', 'stop-opacity': '0.98' }),
    );
    defs.append(g);
    return g;
  };
  document.body.append(svg);

  const cards = document.createElement('div');
  cards.className = 'co-cards';
  cards.setAttribute('aria-hidden', 'true');
  document.body.append(cards);

  const V = rig.point('column');
  const A = new V.constructor();
  const C = new V.constructor();
  const P = new V.constructor();
  const pb = new V.constructor();
  const px = new V.constructor();
  const py = new V.constructor();
  const box = rig.bounds();

  /*
    A CARD MAY CARRY A MEASUREMENT INSTEAD OF A CONSTANT.

    The plate-tilt figure used to belong to the level line, which drew a datum
    across the whole frame with its own value plate hanging off it — a second
    annotation language on a page that is only allowed one. The line is gone; the
    number is not, and it is still READ rather than typed: the flange's two
    survey axes are taken off the live rig every frame and the worst elevation of
    the two is printed. If the rig ever changed so the plate did tilt, this card
    would say so on screen, which is the whole reason the figure is trustworthy.
  */
  const DEG = 180 / Math.PI;
  const REACH = 0.42;
  const LIVE = {
    tilt() {
      rig.pointOn('tool', [0, 0, 0], pb);
      rig.pointOn('tool', [REACH, 0, 0], px).sub(pb);
      rig.pointOn('tool', [0, REACH, 0], py).sub(pb);
      const ex = Math.asin(Math.max(-1, Math.min(1, px.y / (px.length() || 1)))) * DEG;
      const ey = Math.asin(Math.max(-1, Math.min(1, py.y / (py.length() || 1)))) * DEG;
      const deg = Math.abs(ex) > Math.abs(ey) ? ex : ey;
      return deg.toFixed(3).replace('-0.000', '0.000') + '°';
    },
  };

  let W = 0, H = 0;
  const size = () => {
    W = innerWidth; H = innerHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    for (const [, c] of built) c.measure();
  };

  const project = (v) => {
    P.copy(v).project(camera);
    return { x: (P.x + 1) / 2 * W, y: (1 - (P.y + 1) / 2) * H, z: P.z };
  };

  /** Where a named mechanical feature actually is, this frame. */
  const anchorOf = (name, out) => {
    switch (name) {
      case 'plate': return rig.flangePoint(out);
      case 'loops': return rig.point('rocker', out);
      case 'elbow': return rig.point('boom', out);
      case 'shoulder': return rig.point('lowerArm', out);
      case 'column': return rig.point('column', out);
      case 'tool': return rig.point('tool', out);
      case 'top': { rig.bounds(box); return out.set(box.getCenter(C).x, box.max.y, box.getCenter(C).z); }
      case 'base': return out.set(0, 0.02, 0);
      default: return rig.point(name, out);
    }
  };

  /* ── one callout ────────────────────────────────────────────────────────── */
  /* a small deterministic per-callout variation — see the header note */
  const hash = (t) => { let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return Math.abs(h); };

  function make(spec) {
    const id = spec.id ?? '';
    const g = el('g', { class: 'co__g', 'data-co': id });
    // the one warm note in the annotation: a soft response in the machine's own
    // colour where the line touches the machine, and nowhere else
    const halo = el('circle', { class: 'co__halo', r: RING + 7 });
    // the survey target's outer ring — the record's pins carry the same one at
    // the same radius, which is most of what makes the two read as one object
    const ring2 = el('circle', { class: 'co__ring2', r: 15 });
    const ring = el('circle', { class: 'co__ring', r: RING });
    const pip = el('circle', { class: 'co__pip', r: 2.2 });
    const grad = makeGrad(id);
    const far = el('path', { class: 'co__lead co__lead--far' });
    const near = el('path', { class: 'co__lead co__lead--near' });
    const core = el('path', { class: 'co__lead co__lead--core', stroke: 'url(#co-lead-' + id + ')' });
    const spark = el('path', { class: 'co__spark' });
    const leads = [far, near, core];
    g.append(far, near, core, spark, halo, ring2, ring, pip);
    svg.append(g);
    const v = hash(id);
    const REACHX = 0.24 + (v % 3) * 0.07;      // how early the curve commits
    const LIFT = 0.62 + ((v >> 2) % 3) * 0.10; // how much of the drop it takes first

    const card = document.createElement('article');
    card.className = 'co-card';
    card.dataset.co = spec.id ?? '';
    cards.append(card);

    const co = {
      g, card, spec, w: 250, h: 108, d: 0, vis: 0, side: null,

      fill() {
        const s = co.spec;
        card.innerHTML = '';
        const idx = document.createElement('s'); idx.textContent = s.n ?? ''; card.append(idx);
        const hd = document.createElement('header'); hd.className = 'hd';
        const b = document.createElement('b'); b.textContent = s.label ?? ''; hd.append(b);
        if (s.value || s.live) {
          const u = document.createElement('u');
          u.textContent = s.live ? LIVE[s.live]() : s.value;
          hd.append(u);
          co.val = s.live ? u : null;
        } else co.val = null;
        card.append(hd);
        if (s.note) { const i = document.createElement('i'); i.textContent = s.note; card.append(i); }
        card.style.setProperty('--cw', (s.width ?? 250) + 'px');
      },

      // measured once per shot and per resize, never inside the frame loop
      measure() {
        const r = card.getBoundingClientRect();
        co.w = Math.max(150, Math.round(r.width));
        co.h = Math.max(56, Math.round(r.height));
      },

      /*
        THE AUTHORED PLACE, HONOURED.

        `dx` is the gap from the anchor to the card's anchor-side vertical edge;
        its sign is the authored side. `dy` moves the card's vertical centre.
        Nothing here searches: the only decisions are whether to mirror and how
        far the safe area is allowed to correct.
      */
      solve(p) {
        const pl = { ...PLACE, ...(co.spec.place ?? {}) };
        // THE LOCAL SAFE REGION. Not a solver: the page's own live type is read
        // once per frame, and a card that would land on it takes the MIRROR of
        // its authored place rather than a searched alternative.
        const hits = (r) => typeRects.reduce((a, t) => {
          const w = Math.min(r.x + co.w, t.right) - Math.max(r.x, t.left);
          const h = Math.min(r.y + co.h, t.bottom) - Math.max(r.y, t.top);
          return a + (w > 0 && h > 0 ? w * h : 0);
        }, 0);
        const fitX0 = SAFE.left, fitX1 = W - SAFE.right;
        const fitY0 = SAFE.top, fitY1 = H - SAFE.bottom;

        const lay = (dx) => {
          const x0 = dx > 0 ? p.x + dx : p.x + dx - co.w;
          const y0 = p.y + pl.dy - co.h / 2;
          const nx = clamp(x0, fitX0, Math.max(fitX0, fitX1 - co.w));
          const ny = clamp(y0, fitY0, Math.max(fitY0, fitY1 - co.h));
          return { x: nx, y: ny, moved: Math.abs(nx - x0) + Math.abs(ny - y0), dx };
        };

        /*
          THE SIDE IS STICKY, ON PURPOSE.

          The mirror used to be re-decided from scratch every frame against a
          cost that moves with the camera, so a card sitting near the threshold
          could flip sides between two frames and back again — which is not a
          composition changing its mind, it is a jump. The chosen side is kept
          until the alternative is clearly better by a real margin, so crossing
          the boundary once cannot start an oscillation.
        */
        const cost = (r) => r.moved + hits(r) / 40;
        const a = lay(pl.dx), b = lay(-pl.dx);
        const aBad = a.moved > NUDGE_MAX || hits(a) > 900;
        if (co.side == null) co.side = aBad && cost(b) < cost(a) ? -1 : 1;
        else {
          const keep = co.side > 0 ? a : b, other = co.side > 0 ? b : a;
          if (cost(other) + 34 < cost(keep)) co.side = -co.side;
        }
        return co.side > 0 ? a : b;
      },

      draw(pos, p, d) {
        const right = pos.dx > 0;
        const ex = right ? pos.x : pos.x + co.w;      // the card edge facing the anchor
        const ey = pos.y + co.h / 2;

        card.style.transform = `translate3d(${Math.round(pos.x)}px, ${Math.round(pos.y)}px, 0)`;
        card.dataset.side = right ? 'r' : 'l';

        for (const n of [halo, ring2, ring, pip]) {
          n.setAttribute('cx', p.x.toFixed(1)); n.setAttribute('cy', p.y.toFixed(1));
        }

        /*
          ONE CUBIC, LEVEL AT THE CARD.

          `k` is the old knee — held a fixed KNEE back from the card's edge — and
          it is now the SECOND control point instead of a corner. Because it
          shares the endpoint's y, the curve's tangent where it meets the card is
          exactly horizontal whatever angle it left the anchor at: the run into
          the words is calm however steep the departure had to be. The first
          control point is what gives the line its tension, and it is placed per
          callout rather than by one constant, so the gesture is not identical
          three times in a chapter.
        */
        const kx = right ? ex - KNEE : ex + KNEE;
        const sx = p.x + (kx - p.x) / (Math.hypot(kx - p.x, ey - p.y) || 1) * (RING + OFF_ANCHOR);
        const sy = p.y + (ey - p.y) / (Math.hypot(kx - p.x, ey - p.y) || 1) * (RING + OFF_ANCHOR);
        const tx = right ? ex - OFF_CARD : ex + OFF_CARD;
        const c1x = sx + (kx - sx) * REACHX;
        const c1y = sy + (ey - sy) * LIFT;
        const path = 'M ' + sx.toFixed(1) + ' ' + sy.toFixed(1)
          + ' C ' + c1x.toFixed(1) + ' ' + c1y.toFixed(1)
          + ', ' + kx.toFixed(1) + ' ' + ey.toFixed(1)
          + ', ' + tx.toFixed(1) + ' ' + ey.toFixed(1);
        for (const n of leads) n.setAttribute('d', path);
        spark.setAttribute('d', path);
        grad.setAttribute('x1', sx.toFixed(1)); grad.setAttribute('y1', sy.toFixed(1));
        grad.setAttribute('x2', tx.toFixed(1)); grad.setAttribute('y2', ey.toFixed(1));

        /*
          THE LINE GROWS FROM THE MACHINE OUTWARD, from a dash set to the path's
          MEASURED length. A constant big enough for anything makes a short
          leader finish in the first fifth of its phase and then sit still, which
          is the difference between a line that draws and a line that appears.

          That is not hypothetical. A legacy `stroke-dasharray: 1800` in the
          drafting half of this sheet was beating these attributes — a CSS
          declaration outranks a presentation attribute — and the leader really
          was completing at about a third of its phase and then holding. The
          sheet now scopes that rule off the card system.
        */
        const run = core.getTotalLength();
        // the line owns 0.10 -> 0.78 of the callout's progress; the card does not
        // begin until 0.80, by which point the leader is already complete
        const t = clamp((d - 0.10) / 0.68, 0, 1);
        const dash = run.toFixed(1), off = (run * (1 - t)).toFixed(1);
        for (const n of leads) {
          n.setAttribute('stroke-dasharray', dash);
          n.setAttribute('stroke-dashoffset', off);
        }
        /*
          THE SPARK RIDES THE HEAD.

          A dash of SPARK length whose leading edge is pinned to the drawn head:
          the pattern `[SPARK, run + SPARK]` offset by `SPARK - head` puts the
          lit segment on exactly `[head - SPARK, head]`. Before the head has
          travelled SPARK there is not a whole one to carry, so it is the drawn
          stub itself. How bright it is, and that it goes out once the line is
          home, is the sheet's business — off `--t`.
        */
        const head = run * t;
        const lit = Math.min(SPARK, head);
        spark.setAttribute('stroke-dasharray', lit.toFixed(1) + ' ' + (run + SPARK).toFixed(1));
        spark.setAttribute('stroke-dashoffset', (lit - head).toFixed(1));
        g.style.setProperty('--t', t.toFixed(3));
      },
    };
    co.fill();
    return co;
  }

  /*
    THE PAGE'S LIVE TYPE — READ ON A CLOCK, NOT ON EVERY FRAME.

    This walks every visible `[data-r]` in the sticky type plus the masthead,
    takes a rect for each and multiplies its ancestors' opacities. Measured on
    the real page that was 46 `getComputedStyle` calls and 4.8 forced layouts per
    frame, in the middle of a 60fps scrub, and its ONLY consumer is the mirror
    decision — which is a question about a card's side, not something that can
    meaningfully change between two frames.

    So it runs at most every 150ms. Fresh enough that a card cannot settle on top
    of copy, cheap enough that the frame loop stops reading layout.
  */
  const TYPE_MS = 150;
  let typeAt = 0;
  let typeRects = [];
  const readType = () => {
    const now = performance.now();
    if (now - typeAt < TYPE_MS) return;
    typeAt = now;
    typeRects = [];
    for (const n of document.querySelectorAll('.beat .type [data-r], .masthead, .chapter')) {
      let op = 1;
      for (let a = n; a && a !== document.documentElement; a = a.parentElement) {
        op *= parseFloat(getComputedStyle(a).opacity || '1');
        if (op < 0.12) break;
      }
      if (op < 0.12) continue;
      const r = n.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > H) continue;
      typeRects.push({ left: r.left - 16, top: r.top - 14, right: r.right + 16, bottom: r.bottom + 14 });
    }
  };

  const built = new Map();
  let live = [];

  function setShot(specs = []) {
    for (const [, c] of built) {
      c.g.style.setProperty('--vis', '0');
      c.card.style.setProperty('--vis', '0');
      c.card.removeAttribute('data-live');
    }
    live = specs.map((s) => {
      if (!built.has(s.id)) built.set(s.id, make(s));
      const c = built.get(s.id);
      c.spec = { ...c.spec, ...s };
      c.fill();
      c.measure();
      c.d = 0;
      c.side = null;                 // the mirror decision starts undecided
      c.g.style.setProperty('--d', '0');
      c.card.style.setProperty('--d', '0');
      return c;
    });
  }

  /*
    THE WINDOW. `at` is where the callout starts and `span` is how much of the
    shot's progress the whole gesture occupies — anchor, line, card, text. Both
    are art direction and both live in the direction file beside `place`.

    Every authored window closes WELL INSIDE its own chapter's COMPOSED range —
    the fraction of the shot for which the sticky type is actually pinned,
    `(h - 100vh) / h`, measured at 0.334 on arrival, 0.524 on proof and 0.412 on
    engineering. Closing merely inside it is not enough: the first authoring put
    the second arrival callout at 0.19 to 0.30 of a window that ends at 0.334, so
    it was still drawing for ninety per cent of the time its own words were on
    screen and settled for the last tenth. Each one now finishes by roughly two
    thirds of its pinned range, so the state a stopped scroll lands on is the
    settled one and the drawing is what you pass through to reach it.
  */
  const SPAN = 0.12;
  let shotP = 0;
  function cue(p) { shotP = p; }

  /*
    HOW FAR INSIDE THE FRAME THE ANCHOR IS — 1 well inside, 0 outside.

    A boolean here popped the whole annotation on and off between two frames as
    the camera moved. A band fixes that, but a WIDE one buys a different fault:
    the shoulder anchor descends past the bottom edge across chapter 05, and over
    a 46px linear band its card sat at 0.46 opacity for a long stretch of the
    scroll — a callout that is present, half-lit and unreadable, which is the one
    state a callout is not allowed to be in.

    So the band is narrow and smoothstepped: full strength until the anchor is
    nearly out, then a quick, curved exit with no corner at either end. Measured
    on the same descent it now reads 0.92 where it used to read 0.46.
  */
  const BAND = 26;
  const smooth = (t) => t * t * (3 - 2 * t);
  const soft = (v, lo, hi) => smooth(clamp(Math.min(v - lo, hi - v) / BAND, 0, 1));

  let introMode = false;

  function update() {
    if (!W || !live.length) return;
    readType();

    for (const co of live) {
      anchorOf(co.spec.anchor, A);
      co.p = project(A);
      const m = 28;
      // an anchor off the frame has no callout: a leader running to a point
      // nobody can see is worse than no annotation at all
      co.vis = co.p.z < 1
        ? soft(co.p.x, m, W - m) * soft(co.p.y, SAFE.top - 58, H - m)
        : 0;
    }

    for (const co of live) {
      /*
        THE WHOLE STATE, DERIVED. Two multiplications and a clamp — no previous
        value is read, so there is nothing for a fast scroll to fall behind.
      */
      if (!introMode) {
        const at = co.spec.at ?? 0.2;
        co.d = clamp((shotP - at) / (co.spec.span ?? SPAN), 0, 1);
      }
      // BOTH have to be up for the annotation to exist, and the geometry is
      // rewritten for as long as EITHER is, so the dash can never be left
      // holding a length the current scroll position does not agree with.
      const shown = co.d * co.vis;
      co.g.style.setProperty('--d', co.d.toFixed(4));
      co.card.style.setProperty('--d', co.d.toFixed(4));
      co.g.style.setProperty('--vis', co.vis.toFixed(4));
      co.card.style.setProperty('--vis', co.vis.toFixed(4));
      // the module says only WHETHER the card exists; the sheet says when it is
      // visible, so the authored order cannot be short-circuited by an inline style
      co.card.toggleAttribute('data-live', shown > 0.002);
      if (co.d > 0.0005 && co.vis > 0.0005) {
        if (co.val) { const t = LIVE[co.spec.live](); if (t !== co.val.textContent) co.val.textContent = t; }
        co.draw(co.solve(co.p), co.p, co.d);
      }
    }
  }

  addEventListener('resize', size);
  size();

  return {
    setShot, cue, update,
    /* the intro's hand-off, and the only place a value is pushed in from outside
       — it is not on the scroll path */
    setDraw(v) {
      introMode = v < 1;
      for (const c of live) {
        c.d = v;
        c.g.style.setProperty('--d', String(v));
        c.card.style.setProperty('--d', String(v));
      }
    },
    setFade(v) { svg.style.opacity = String(v); cards.style.opacity = String(v); },
    dispose() { removeEventListener('resize', size); svg.remove(); cards.remove(); },
  };
}
