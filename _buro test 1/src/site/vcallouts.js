// Callouts — the technical annotation language, at poster scale.
//
// EVERY ANCHOR IS A REAL MECHANICAL FEATURE, resolved from the rig every frame:
// closed loops, linkage members, pivots, the tool plate, the datum, the span.
// Nothing here is placed at a coordinate somebody typed — move the camera and a
// fake would sit still while these track.
//
// ── PLACEMENT ────────────────────────────────────────────────────────────────
//
// The previous cut gave each callout a fixed side and clamped the landing height
// into range. Clamping is not placement: a long label on the right edge of a
// narrow window ran off the screen, and two shots put a label straight over the
// hero type. Labels were being cut off, which is simply a broken drawing.
//
// So placement is SOLVED, not clamped. Every frame, each callout is scored
// against a set of candidate positions — its preferred side and the flipped one,
// at its own height and at a ladder of offsets from it — and the cheapest legal
// position wins. The cost function encodes the rules:
//
//   SAFE AREA     the label block's real measured box must sit inside the safe
//                 rectangle. Not the anchor, not the leader — the BOX. Candidates
//                 are generated inside it, so an out-of-bounds result is not
//                 representable rather than merely penalised.
//   GUARDS        the masthead, the readout and every visible piece of shot type
//                 are read from the DOM and treated as occupied. Overlapping them
//                 is expensive; overlapping another callout is prohibitive.
//   FLIP          the preferred side costs nothing, the opposite side costs a
//                 flat penalty. A callout therefore keeps its authored side right
//                 up to the point where that side genuinely does not work.
//   VERTICAL      if both sides are blocked at the feature's own height, the
//                 ladder moves it up or down until something is free.
//   SILHOUETTE    a leader that would have to traverse the machine to reach its
//                 label is penalised, so a callout naturally lands on the side
//                 its feature is already nearest.
//   HYSTERESIS    the solution is damped and a side only flips when the
//                 alternative is clearly better. Otherwise the label would
//                 chatter between two near-equal slots while you scroll, which is
//                 worse than either one — these have to be readable IN MOTION,
//                 not only in a stopped frame.
//
// The leader is then derived from the result: its length adapts, and the
// horizontal landing spans the label block exactly, so the rule can never run off
// an edge the way a fixed 300px rule did.

const NS = 'http://www.w3.org/2000/svg';
const el = (n, a) => {
  const e = document.createElementNS(NS, n);
  for (const k in a) e.setAttribute(k, a[k]);
  return e;
};

/*
  THE SAFE AREA.

  32-48px from the edges, except at the top, where the masthead and the camera
  readout are already living — the label block reaches 56px above its landing
  line, so the top budget has to cover the furniture as well as the margin.
*/
const SAFE = { top: 116, right: 64, bottom: 44, left: 64 };

// the label block, measured from its landing line
const ABOVE = 56;   // marker top
const BELOW = 44;   // value baseline + descender
const MARKER = 40;
const GAP = 14;

const STEP = 58;          // rung of the vertical search ladder
const RUNGS = 6;
const FLIP_COST = 420;    // what it costs to abandon the authored side
const FLIP_MARGIN = 240;  // how much better the other side must be to take it

/*
  TWO COSTS THAT DECIDE WHICH SIDE, RATHER THAN A PREFERENCE THAT SURVIVES BOTH.

  LEAD_COST   a leader is a line drawn across the picture, so its length is a
              real price and not a detail. Charging per pixel of horizontal run
              is what makes a callout land on the side its feature is ALREADY
              nearest: a label that had to crawl the full width of the frame to
              reach its anchor now costs more than the flip that avoids it. The
              old crude "wrong side of centre" flat penalty was smaller than
              FLIP_COST, so it never actually won and two annotations would stack
              on the right with both leaders sweeping across the machine.
  SPREAD_COST what a second callout pays for joining the first one's side. It is
              deliberately larger than the flip, so annotations in the same shot
              open to OPPOSITE margins unless the other side is genuinely
              unusable. Two plates on one edge read as a stacked list; one either
              side reads as a drawing of the object between them.
*/
const LEAD_COST = 0.8;
const SPREAD_COST = 1400;

/*
  THE LEADER HAS TO EXIST.

  Costing length alone drove the other failure: the solver found the CHEAPEST
  leader, which is the one with no length at all, and parked the tool-plate label
  so its landing edge sat on top of its own anchor mark. What shipped was a plate
  pressed into the margin with a crosshair touching its edge and no line between
  them — the annotation had lost the one thing that makes it an annotation.

  So the run is a BAND, not a minimum-seeking value. Below MIN_RUN horizontally
  or MIN_DROP vertically the cost climbs steeply, because a leader with no
  horizontal travel is invisible and one with no vertical travel is a flat spike
  into the plate's edge rather than a drawn path. Above the band, LEAD_COST takes
  over and keeps it from crawling the frame. Between the two the callout is free
  to sit wherever the guards allow.
*/
const MIN_RUN = 150;
const MIN_DROP = 62;
const SHORT_COST = 12;    // per pixel short of MIN_RUN
const FLAT_COST = 6;      // per pixel short of MIN_DROP

const rect = (x0, y0, x1, y1) => ({ x0, y0, x1, y1 });
const overlap = (a, b) => {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return w > 0 && h > 0 ? w * h : 0;
};

/*
  TWO BLOCK LAYOUTS, AND A DIRECTION PICKS ONE.

  PLATE (the default, and what A / B / C / final ship): a two-storey block — a
  filled marker carrying the number and the label on the upper line, the measured
  value on a second line below a rule.

  LINE: one storey. Index, label and value read left to right on a single
  baseline with a hairline under them. The plate version was rendering as SIGNAGE
  rather than as annotation: a saturated filled chip outranked the label it was
  numbering, and two facts sat at opposite corners of a 280x124 box that was
  mostly empty, which is a frame around almost nothing. At one storey the same
  two facts are one sentence — the number ordering it, the value closing it — and
  the block is 44px tall instead of 124.

  The metrics live on the direction so this is a choice a direction makes, not a
  change to the shared module's defaults.
*/
const PLATE = { above: ABOVE, below: BELOW, marker: MARKER, gap: GAP, inline: false, min: 170 };

export function createCallouts({ camera, rig, layer = 'sheet', metrics = null }) {
  const M = { ...PLATE, ...(metrics ?? {}) };
  const svg = el('svg', { class: `co co--${layer}`, 'aria-hidden': 'true' });
  document.body.append(svg);

  const V = rig.point('column');
  const A = new V.constructor();
  const C = new V.constructor();
  const P = new V.constructor();
  const box = rig.bounds();

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
      case 'reach': { rig.bounds(box); return out.set(box.max.x, 0.02, box.getCenter(C).z); }
      case 'base': return out.set(0, 0.02, 0);
      default: return rig.point(name, out);
    }
  };

  /* ── what the page is already using ─────────────────────────────────────── */
  // Read once — the node set does not change after boot; only their boxes do.
  let guardNodes = [];
  const collectGuardNodes = () => {
    /*
      THE LEVEL LINE IS A GUARD.

      Without it the solver put `03 CLOSED LOOPS` at the same screen height as the
      datum and in the same accent — two orange horizontal rules within a few
      pixels, reading as one broken element. The callout has a whole viewport of
      legal slots; the measurement is pinned to a real point and cannot move. So
      the one that can move is the one that gives way.
    */
    guardNodes = [
      ...document.querySelectorAll('.masthead, .readout, .beat .type [data-r], .record__head'),
      ...document.querySelectorAll('.lvl__valbox, .lvl__plate'),
      /*
        THE CHAPTER MARK IS A GUARD TOO. It is set vertically against the left
        margin, which is exactly where a left-side callout wants to be, and a
        plate laid over it does not hide it — the rail simply reads through the
        edge of the block as a smear. The mark is pinned furniture; the callout
        has a ladder of legal slots. The one that can move gives way.
      */
      ...document.querySelectorAll('.chapter'),
    ];
  };
  collectGuardNodes();

  const guards = [];
  const readGuards = () => {
    guards.length = 0;
    for (const node of guardNodes) {
      const cs = getComputedStyle(node);
      if (cs.visibility === 'hidden') continue;
      /*
        EFFECTIVE opacity, not the node's own. The level line's parts are children
        of an <svg> that is faded as a whole, so each child reports 1 while the
        layer is invisible — and a guard nobody can see is a region the callout
        solver refuses for no reason.
      */
      let op = 1;
      for (let a = node; a && a !== document.documentElement; a = a.parentElement) {
        op *= parseFloat(getComputedStyle(a).opacity || '1');
        if (op < 0.12) break;
      }
      if (op < 0.12) continue;
      const r = node.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) continue;
      guards.push(rect(r.left - 16, r.top - 20, r.right + 16, r.bottom + 20));
    }
  };

  /* ── the machine's own projected box ────────────────────────────────────── */
  const sil = rect(0, 0, 0, 0);
  const readSilhouette = () => {
    rig.bounds(box);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < 8; i++) {
      C.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
      const q = project(C);
      if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x;
      if (q.y < y0) y0 = q.y; if (q.y > y1) y1 = q.y;
    }
    sil.x0 = x0; sil.y0 = y0; sil.x1 = x1; sil.y1 = y1;
  };

  /* ── one callout ────────────────────────────────────────────────────────── */
  function make(spec) {
    const g = el('g', { class: 'co__g', 'data-co': spec.id ?? '' });
    /*
      THE BACKING.

      Placement solves most of it — the solver already pays to keep a label off
      the silhouette — but "most" is not a contrast guarantee. The camera travels
      through 500 degrees and the machine is a lit orange casting for a good part
      of it, so on any frame where the cheapest legal slot still overlaps the
      subject, white type at 2:1 is what a visitor gets (`color I6`, `DM5`).

      This rect is `fill: none` unless a direction fills it, so A, B and C render
      exactly as they did. Where it IS filled it is a sibling of the text and
      sized from the measured block, never a child of it (`DNA21`).
    */
    const plate = el('rect', { class: 'co__plate' });
    /*
      THE PLATE, AS A DRAWN OBJECT RATHER THAN A BOX.

      `co__plate` is a rect and a rect has four right angles, which is the one
      shape that reads as "a div was placed on the picture". These three add the
      vocabulary a direction needs to make the annotation look MACHINED instead:

        co__cut    the plate outline as a path, with the corner facing the
                   machine chamfered off — the same cut a fabricated label plate
                   carries, and the reason the shape reads as industrial rather
                   than as UI.
        co__edge   a short heavy rule down the leading edge, where the leader
                   arrives. It gives the plate a front and a back, so the block
                   has a direction instead of floating.
        co__tick   a crosshair at the ANCHOR. A dot says "something is here"; a
                   crosshair says "this exact point", which is what a callout on
                   real geometry is claiming.

      All three are painted only by a direction that asks for them.
    */
    const cut = el('path', { class: 'co__cut' });
    const edge = el('line', { class: 'co__edge' });
    const tick = el('path', { class: 'co__tick' });
    const path = el('path', { class: 'co__lead' });
    const dot = el('circle', { class: 'co__dot', r: 4 });
    const rule = el('line', { class: 'co__rule' });
    const num = el('text', { class: 'co__num' });
    const marker = el('rect', { class: 'co__box', width: MARKER, height: MARKER });
    const lab = el('text', { class: 'co__label' });
    const val = el('text', { class: 'co__value' });
    num.textContent = spec.n ?? '';
    lab.textContent = spec.label ?? '';
    val.textContent = spec.value ?? '';
    // cut first: it is the ground the rest of the block sits on.
    g.append(cut, plate, path, tick, dot, edge, rule, marker, num, lab, val);
    svg.append(g);

    const co = {
      g, spec, w: 240, cur: null,

      /*
        The block's width is the LABEL'S OWN WIDTH, measured from the rendered
        text. A guessed width is what let a long label hang off the right edge:
        the geometry was drawn from the margin inward by a constant while the
        glyphs ran outward by however many they happened to be.
      */
      measure() {
        const t = (n, fallbackChars) => {
          let w = 0;
          try { w = n.getComputedTextLength(); } catch { w = 0; }
          return w > 1 ? w : fallbackChars * 13;
        };
        const lw = t(lab, (co.spec.label ?? '').length);
        const vw = t(val, (co.spec.value ?? '').length);
        co.w = M.inline
          // one line: index, label, a breathing gap, value. The gap is what stops
          // the value looking welded to the last letter of the label.
          ? Math.max(M.marker + M.gap + lw + 44 + vw, M.min)
          : Math.max(M.marker + M.gap + lw, vw + M.marker, M.min);
      },

      box(side, y) {
        const x1 = side === 'r' ? W - SAFE.right : SAFE.left + co.w;
        return rect(x1 - co.w, y - M.above, x1, y + M.below);
      },

      draw(side, y, p, d = 1) {
        const right = side === 'r';
        const ex = right ? W - SAFE.right : SAFE.left;        // outer edge
        const inner = right ? ex - co.w : ex + co.w;          // where the leader lands

        /*
          THE LEADER LENGTH ADAPTS. A fixed knee offset produced a dogleg when
          the anchor was close to the margin and a near-horizontal crawl when it
          was far. The knee is placed at a fraction of the actual gap instead,
          and collapses to a straight run when the anchor has already passed it.
        */
        /*
          THE STARTING POINT IS AN OBJECT, NOT THE END OF A LINE.

          A 7px crosshair under a hairline read as a stray pixel: you could see
          where the leader ENDED but not where it BEGAN, so the annotation looked
          like a line that had drifted onto the picture. The mark is now a survey
          target — a ring around the point, a filled centre, and four ticks
          standing off it in the cardinal directions — and the leader departs
          from the RING'S EDGE rather than from the centre, with a clear break.
          Two separated objects read as "this line comes from that point"; one
          continuous stroke reads as one line.
        */
        const R = 8.5;      // ring radius
        const TI = 12.5;    // tick inner
        const TO = 18;      // tick outer
        const px = p.x, py = p.y;
        tick.setAttribute('d',
          `M ${(px + R).toFixed(1)} ${py.toFixed(1)}` +
          ` A ${R} ${R} 0 1 1 ${(px - R).toFixed(1)} ${py.toFixed(1)}` +
          ` A ${R} ${R} 0 1 1 ${(px + R).toFixed(1)} ${py.toFixed(1)}` +
          ` M ${(px - TO).toFixed(1)} ${py.toFixed(1)} H ${(px - TI).toFixed(1)}` +
          ` M ${(px + TI).toFixed(1)} ${py.toFixed(1)} H ${(px + TO).toFixed(1)}` +
          ` M ${px.toFixed(1)} ${(py - TO).toFixed(1)} V ${(py - TI).toFixed(1)}` +
          ` M ${px.toFixed(1)} ${(py + TI).toFixed(1)} V ${(py + TO).toFixed(1)}`);
        dot.setAttribute('cx', px.toFixed(1)); dot.setAttribute('cy', py.toFixed(1));

        const gap = Math.abs(inner - p.x);
        const kneeLen = Math.max(34, Math.min(spec.knee ?? 150, gap * 0.52));
        let knee = right ? inner - kneeLen : inner + kneeLen;
        if (right ? p.x > knee : p.x < knee) knee = inner;
        // the leader leaves the mark, it does not grow out of its middle
        const OFF = TO + 5;
        const dx = knee - px, dy = y - py;
        const len = Math.hypot(dx, dy) || 1;
        const sx = px + dx / len * Math.min(OFF, len * 0.5);
        const sy = py + dy / len * Math.min(OFF, len * 0.5);
        path.setAttribute('d', `M ${sx.toFixed(1)} ${sy.toFixed(1)} L ${knee.toFixed(1)} ${y.toFixed(1)} L ${inner.toFixed(1)} ${y.toFixed(1)}`);

        /*
          ONE STOREY, AND IT READS THE SAME WAY ON BOTH SIDES.

          The plate layout mirrors itself — on the right the label runs back from
          the outer edge, on the left it runs forward from it — so a left block
          and a right block are two different drawings. The line layout does not
          mirror: index at the block's left edge, value at its right edge, label
          between them, whichever margin the block landed on. Same sentence, same
          reading direction, every frame.
        */
        const bx0 = right ? ex - co.w : ex;         // block's left edge
        const bx1 = right ? ex : ex + co.w;         // block's right edge

        if (M.inline) {
          marker.setAttribute('width', 0); marker.setAttribute('height', 0);
          const base = y - 12;
          num.setAttribute('x', bx0); num.setAttribute('y', base);
          num.setAttribute('text-anchor', 'start');
          lab.setAttribute('x', bx0 + M.marker + M.gap); lab.setAttribute('y', base);
          lab.setAttribute('text-anchor', 'start');
          val.setAttribute('x', bx1); val.setAttribute('y', base);
          val.setAttribute('text-anchor', 'end');
        } else {
          const mx = right ? ex - M.marker : ex;
          marker.setAttribute('width', M.marker); marker.setAttribute('height', M.marker);
          marker.setAttribute('x', mx); marker.setAttribute('y', y - M.above);
          num.setAttribute('x', mx + M.marker / 2); num.setAttribute('y', y - 28);
          num.setAttribute('text-anchor', 'middle');

          lab.setAttribute('x', right ? ex - M.marker - M.gap : ex + M.marker + M.gap);
          lab.setAttribute('y', y - 28);
          lab.setAttribute('text-anchor', right ? 'end' : 'start');

          val.setAttribute('x', ex);
          val.setAttribute('y', y + 32);
          val.setAttribute('text-anchor', right ? 'end' : 'start');
        }

        /*
          THE RULE GROWS OUT OF THE LEADER'S LANDING.

          It starts where the leader arrives and runs to the block's outer edge,
          which is the same direction the eye has just travelled — so the bar
          reads as the leader continuing under the label rather than as a second
          line that appeared. It still spans the block exactly at full length, so
          it can never reach past a safe edge.
        */
        const rIn = right ? ex - co.w : ex + co.w;
        const rOut = ex;
        const grow = Math.max(0, Math.min(1, (d - 0.55) / 0.45));
        rule.setAttribute('x1', rIn.toFixed(1));
        rule.setAttribute('x2', (rIn + (rOut - rIn) * grow).toFixed(1));
        const ry = M.inline ? y + 4 : y + 8;
        rule.setAttribute('y1', ry); rule.setAttribute('y2', ry);

        // the backing covers exactly the measured block, with a small bleed
        const PAD = M.inline ? 13 : 16;
        const bx = bx0 - PAD;
        const by = y - M.above - PAD + 8;
        const bw = co.w + PAD * 2;
        const bh = M.above + M.below + PAD * 2 - 8;
        plate.setAttribute('x', bx);
        plate.setAttribute('y', by);
        plate.setAttribute('width', bw);
        plate.setAttribute('height', bh);

        /*
          THE CHAMFER GOES ON THE CORNER THE MACHINE IS ON.

          The leader arrives at the plate's inner edge, so the inner top corner is
          the one the eye travels through on its way from the anchor to the label.
          Cutting that corner opens the path instead of putting a right angle
          across it, and it is the reason the two elements read as one drawing.
        */
        const CH = M.inline ? 12 : 20;
        const x0 = bx, x1 = bx + bw, y0 = by, y1 = by + bh;
        cut.setAttribute('d', right
          ? `M ${x0 + CH} ${y0} H ${x1} V ${y1} H ${x0} V ${y0 + CH} Z`
          : `M ${x0} ${y0} H ${x1 - CH} L ${x1} ${y0 + CH} V ${y1} H ${x0} Z`);

        /* the accent mark at the edge the leader arrives on — the full height of
           the plate on the two-storey block, a short standing tick on the line */
        const ex0 = right ? x0 : x1;
        edge.setAttribute('x1', ex0); edge.setAttribute('x2', ex0);
        if (M.inline) {
          edge.setAttribute('y1', (y - 26).toFixed(1)); edge.setAttribute('y2', (y + 4).toFixed(1));
        } else {
          edge.setAttribute('y1', y0 + (right ? CH : 0) + 6); edge.setAttribute('y2', y1 - 6);
        }
      },
    };
    co.measure();
    return co;
  }

  const built = new Map();
  let live = [];
  let shotKey = '';

  function setShot(specs = [], key = '') {
    for (const [, c] of built) c.g.style.opacity = '0';
    shotKey = key || specs.map((s) => s.id).join('|');
    live = specs.map((s) => {
      if (!built.has(s.id)) built.set(s.id, make(s));
      const c = built.get(s.id);
      c.spec = { ...c.spec, ...s };
      c.measure();
      // A new shot draws its annotations again from nothing. Carrying a finished
      // one across a cut would put a completed drawing on a frame that has not
      // been established yet.
      c.d = 0; c.on = false;
      c.g.style.setProperty('--d', '0');
      return c;
    });
  }

  /**
   * The cue states INTENT only — whether this callout should be on at this point
   * in the shot. How it gets there is the draw below, stepped from the frame
   * loop, so a scrub that stops halfway still lands on a coherent frame.
   * @param p shot progress
   */
  function cue(p) {
    for (const c of live) c.on = p >= (c.spec.at ?? 0.2);
  }

  // ~0.8s from nothing to a finished annotation: long enough to read as an act
  // of drawing, short enough that a fast scroll is not left waiting for it.
  const DRAW_MS = 780;
  let introMode = false;
  let lastT = 0;

  /* ── the solver ─────────────────────────────────────────────────────────── */
  const minY = SAFE.top + M.above;

  function solve(co, p, taken) {
    const maxY = H - SAFE.bottom - M.below;
    const wantSide = (co.spec.side ?? 'r') === 'r' ? 'r' : 'l';
    const wantY = Math.max(minY, Math.min(maxY,
      co.spec.band != null ? co.spec.band * H : p.y - (co.spec.lift ?? 0)));

    // A leader that has to traverse the machine to reach its label is a leader
    // drawn across the subject. Cheap test: which side of the silhouette the
    // feature is already on.
    const cx = (sil.x0 + sil.x1) / 2;
    const half = Math.max(60, (sil.x1 - sil.x0) * 0.18);

    const cost = (side, y) => {
      const r = co.box(side, y);
      let s = Math.abs(y - wantY) * 0.55;
      if (side !== wantSide) s += FLIP_COST;
      for (const gd of guards) s += overlap(r, gd) / 70;
      s += overlap(r, sil) / 300;
      for (const t of taken) {
        if (overlap(r, t.r) > 0) s += 5000;
        if (t.side === side) s += SPREAD_COST;
      }
      // the leader's own geometry: too short is invisible, too long crawls
      const run = Math.abs((side === 'r' ? W - SAFE.right - co.w : SAFE.left + co.w) - p.x);
      const drop = Math.abs(y - p.y);
      s += Math.max(0, MIN_RUN - run) * SHORT_COST;
      s += Math.max(0, MIN_DROP - drop) * FLAT_COST;
      s += Math.max(0, run - MIN_RUN) * LEAD_COST;
      if (side === 'r' ? p.x < cx - half : p.x > cx + half) s += 300;
      return s;
    };

    const best = { r: { y: wantY, s: Infinity }, l: { y: wantY, s: Infinity } };
    for (const side of ['r', 'l']) {
      for (let k = -RUNGS; k <= RUNGS; k++) {
        const y = Math.max(minY, Math.min(maxY, wantY + k * STEP));
        const s = cost(side, y);
        if (s < best[side].s) { best[side].s = s; best[side].y = y; }
      }
    }

    // HYSTERESIS. Keep the side we are already on unless the other one is
    // decisively better, and ease into the new height rather than snapping —
    // otherwise the label flickers between two near-equal slots as you scroll.
    let side = best.r.s <= best.l.s ? 'r' : 'l';
    if (co.cur && co.cur.shot === shotKey) {
      const other = side === co.cur.side ? null : co.cur.side;
      if (other && best[side].s > best[other].s - FLIP_MARGIN) side = other;
    }
    let y = best[side].y;

    if (!co.cur || co.cur.shot !== shotKey) co.cur = { shot: shotKey, side, y };
    else {
      co.cur.side = side;
      const d = y - co.cur.y;
      co.cur.y += Math.abs(d) > 240 ? d : d * 0.22;
      y = co.cur.y;
    }
    return { side, y };
  }

  function update() {
    if (!W || !live.length) return;

    // The draw is stepped against real elapsed time rather than per frame, so it
    // takes the same 0.8s on a 144Hz display as on a 60Hz one. The clamp keeps a
    // backgrounded tab from finishing the whole thing on its first frame back.
    const now = performance.now();
    const dt = lastT ? Math.min(64, now - lastT) : 16;
    lastT = now;
    const step = dt / DRAW_MS;

    /*
      THE ANCHOR HAS TO BE ON SCREEN, OR THERE IS NO CALLOUT.

      A callout is a claim about one exact point. When the camera travels past it
      the point leaves the frame, and what was left behind was a leader running
      off the bottom edge to nothing — a line whose starting point the viewer
      cannot see, which is worse than no annotation at all. So visibility of the
      ANCHOR, not of the label, gates the draw: the annotation retracts back into
      its own mark and leaves, using the same 0.8s it arrived with.
    */
    for (const co of live) {
      anchorOf(co.spec.anchor, A);
      co.p = project(A);
      const m = 26;
      co.vis = co.p.z < 1
        && co.p.x > m && co.p.x < W - m
        && co.p.y > SAFE.top - 72 && co.p.y < H - m;
    }

    for (const co of live) {
      if (co.d === undefined) { co.d = 0; co.on = false; }
      if (!introMode) {
        const want = co.on && co.vis ? 1 : 0;
        co.d = want > co.d ? Math.min(1, co.d + step) : Math.max(0, co.d - step);
      }
      co.g.style.setProperty('--d', co.d.toFixed(3));
      co.g.style.opacity = co.d > 0.002 ? '1' : '0';
    }

    // Read the whole page ONCE, then write. Interleaving getBoundingClientRect
    // with SVG attribute writes forces a layout flush per callout per frame.
    readGuards();
    readSilhouette();

    const taken = [];
    const plan = [];
    for (const co of live) {
      if (co.d <= 0.002) continue;
      const p = co.p;
      const { side, y } = solve(co, p, taken);
      taken.push({ r: co.box(side, y), side });
      plan.push([co, side, y, p]);
    }
    for (const [co, side, y, p] of plan) co.draw(side, y, p, co.d);
  }

  addEventListener('resize', size);
  size();

  return {
    setShot, cue, update,
    /**
     * The intro draws its first callout on: 0 = nothing, 1 = fully struck. While
     * it is playing it OWNS the progress — otherwise the shot's own cue would be
     * stepping the same value from the other end and the two would race.
     */
    setDraw(v) {
      svg.style.setProperty('--draw', String(v));
      svg.classList.toggle('co--drawing', v < 1);
      introMode = v < 1;
      for (const c of live) { c.d = v; c.on = v >= 1; c.g.style.setProperty('--d', String(v)); }
    },
    setFade(v) { svg.style.opacity = String(v); },
    dispose() { removeEventListener('resize', size); svg.remove(); },
  };
}
