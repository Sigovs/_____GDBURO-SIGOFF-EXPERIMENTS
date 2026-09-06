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
const SAFE = { top: 116, right: 44, bottom: 44, left: 44 };

// the label block, measured from its landing line
const ABOVE = 56;   // marker top
const BELOW = 44;   // value baseline + descender
const MARKER = 40;
const GAP = 14;

const STEP = 58;          // rung of the vertical search ladder
const RUNGS = 6;
const FLIP_COST = 520;    // what it costs to abandon the authored side
const FLIP_MARGIN = 240;  // how much better the other side must be to take it

const rect = (x0, y0, x1, y1) => ({ x0, y0, x1, y1 });
const overlap = (a, b) => {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return w > 0 && h > 0 ? w * h : 0;
};

export function createCallouts({ camera, rig, layer = 'sheet' }) {
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
    return { x: (P.x + 1) / 2 * W, y: (1 - (P.y + 1) / 2) * H };
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
    guardNodes = [
      ...document.querySelectorAll('.masthead, .readout, .beat .type [data-r], .record__head'),
    ];
  };
  collectGuardNodes();

  const guards = [];
  const readGuards = () => {
    guards.length = 0;
    for (const node of guardNodes) {
      const cs = getComputedStyle(node);
      if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.12) continue;
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
    const g = el('g', { class: 'co__g' });
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
    g.append(path, dot, rule, marker, num, lab, val);
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
        co.w = Math.max(
          MARKER + GAP + t(lab, (co.spec.label ?? '').length),
          t(val, (co.spec.value ?? '').length) + MARKER,
          170,
        );
      },

      box(side, y) {
        const x1 = side === 'r' ? W - SAFE.right : SAFE.left + co.w;
        return rect(x1 - co.w, y - ABOVE, x1, y + BELOW);
      },

      draw(side, y, p) {
        const right = side === 'r';
        const ex = right ? W - SAFE.right : SAFE.left;        // outer edge
        const inner = right ? ex - co.w : ex + co.w;          // where the leader lands

        /*
          THE LEADER LENGTH ADAPTS. A fixed knee offset produced a dogleg when
          the anchor was close to the margin and a near-horizontal crawl when it
          was far. The knee is placed at a fraction of the actual gap instead,
          and collapses to a straight run when the anchor has already passed it.
        */
        const gap = Math.abs(inner - p.x);
        const kneeLen = Math.max(34, Math.min(spec.knee ?? 150, gap * 0.52));
        let knee = right ? inner - kneeLen : inner + kneeLen;
        if (right ? p.x > knee : p.x < knee) knee = inner;
        path.setAttribute('d', `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} L ${knee.toFixed(1)} ${y.toFixed(1)} L ${inner.toFixed(1)} ${y.toFixed(1)}`);
        dot.setAttribute('cx', p.x.toFixed(1)); dot.setAttribute('cy', p.y.toFixed(1));

        const mx = right ? ex - MARKER : ex;
        marker.setAttribute('x', mx); marker.setAttribute('y', y - ABOVE);
        num.setAttribute('x', mx + MARKER / 2); num.setAttribute('y', y - 28);
        num.setAttribute('text-anchor', 'middle');

        lab.setAttribute('x', right ? ex - MARKER - GAP : ex + MARKER + GAP);
        lab.setAttribute('y', y - 28);
        lab.setAttribute('text-anchor', right ? 'end' : 'start');

        val.setAttribute('x', ex);
        val.setAttribute('y', y + 32);
        val.setAttribute('text-anchor', right ? 'end' : 'start');

        // the rule spans the block, so it can never reach past a safe edge
        rule.setAttribute('x1', right ? ex - co.w : ex);
        rule.setAttribute('x2', right ? ex : ex + co.w);
        rule.setAttribute('y1', y + 8); rule.setAttribute('y2', y + 8);
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
      return c;
    });
  }

  /** @param p shot progress, so each callout can arrive on its own cue */
  function cue(p) {
    for (const c of live) c.g.style.opacity = p >= (c.spec.at ?? 0.2) ? '1' : '0';
  }

  /* ── the solver ─────────────────────────────────────────────────────────── */
  const minY = SAFE.top + ABOVE;

  function solve(co, p, taken) {
    const maxY = H - SAFE.bottom - BELOW;
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
      for (const t of taken) if (overlap(r, t) > 0) s += 5000;
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
    // Read the whole page ONCE, then write. Interleaving getBoundingClientRect
    // with SVG attribute writes forces a layout flush per callout per frame.
    readGuards();
    readSilhouette();

    const taken = [];
    const plan = [];
    for (const co of live) {
      if (co.g.style.opacity === '0') continue;
      anchorOf(co.spec.anchor, A);
      const p = project(A);
      const { side, y } = solve(co, p, taken);
      taken.push(co.box(side, y));
      plan.push([co, side, y, p]);
    }
    for (const [co, side, y, p] of plan) co.draw(side, y, p);
  }

  addEventListener('resize', size);
  size();

  return {
    setShot, cue, update,
    /** The intro draws its first callout on: 0 = nothing, 1 = fully struck. */
    setDraw(v) {
      svg.style.setProperty('--draw', String(v));
      svg.classList.toggle('co--drawing', v < 1);
    },
    setFade(v) { svg.style.opacity = String(v); },
    dispose() { removeEventListener('resize', size); svg.remove(); },
  };
}
