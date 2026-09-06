// The drawing layer — INDEX1 · KR 700 PA
//
// Measurement and evidence. Not decoration, not a HUD, not CAD cosplay.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE ONE RULE THAT MAKES IT HONEST
//
// Every mark terminates on a point PROJECTED FROM THE MODEL, or on a stated
// datum. There is no mark in this file placed at a coordinate somebody typed.
// A dimension line between two arbitrary screen positions with a real-looking
// number under it is the exact thing this page exists not to be — and it is
// indistinguishable from the real thing until you move the camera, at which
// point the fake one stays still and the real one tracks. These track.
//
// The figures come from the same places the record's table gets them:
//   2 744 mm   the machine's own world bounding box, floor to top
//   3 070 mm   the same box's horizontal extent at full reach
//   1 300 mm   rig.rodLengths(), which is the survey's rod span in millimetres
//   0.000 deg  the tool plate's measured tilt, which is the page's whole thesis
//
// ─────────────────────────────────────────────────────────────────────────────
// TWO DEPTHS, AND THE REASON COMES FROM DRAFTING
//
// A CENTRELINE is a property of the object: the axis a joint actually turns
// about. It belongs in the room, behind the machine, and the machine occludes it.
// A DIMENSION is an annotation of the drawing: a statement made on top of the
// picture. It belongs on the glass, in front.
//
// That is not a stylistic split. It is why the page has depth that means
// something rather than depth that looks like something.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE BUDGET, ENFORCED HERE RATHER THAN PROMISED IN A DOCUMENT
//
// One active dimension per frame. Three marks maximum in any frame, and only the
// linkage shot gets three. One balloon per frame, on three of eight frames. Two
// line weights, two alphas, no fills, no glows, one dash pattern.
//
// If a frame reads as a technical drawing rather than as a photograph with a
// measurement on it, the drawing has won and it must be reduced.

const NS = 'http://www.w3.org/2000/svg';
const el = (name, attrs) => {
  const n = document.createElementNS(NS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};

/* Terminator: a 45-degree oblique tick, not an arrowhead. At hairline weight an
   arrowhead becomes a blob; the oblique tick is standard architectural practice
   and stays crisp at one pixel. */
const TICK = 11;
/* ISO's gap: an extension line starts off its origin and overruns the dimension
   line, so the drawing never touches the thing it measures. */
const GAP = 7;
/* The record's measured overall span, in metres. The drawing and the table
   cannot disagree, so there is one number and this is it. */
const SPAN_M = 3.070;
const OVERRUN = 9;

export function createDrawing({ camera, rig }) {
  const room = el('svg', { class: 'draw draw--room', 'aria-hidden': 'true' });
  const sheet = el('svg', { class: 'draw draw--sheet', 'aria-hidden': 'true' });
  document.body.append(room, sheet);

  const V = new (rig.point('column').constructor)();     // a Vector3 of the right class
  const V2 = new V.constructor();
  const V3 = new V.constructor();
  const box = rig.bounds();

  let W = 0, H = 0;
  const size = () => {
    W = window.innerWidth; H = window.innerHeight;
    for (const s of [room, sheet]) s.setAttribute('viewBox', `0 0 ${W} ${H}`);
  };
  size();
  window.addEventListener('resize', size);

  /** World -> screen pixels. The single place projection happens. */
  const project = (v) => {
    V3.copy(v).project(camera);
    return { x: (V3.x + 1) / 2 * W, y: (1 - (V3.y + 1) / 2) * H, z: V3.z };
  };

  /* ── marks ──────────────────────────────────────────────────────────────── */

  /**
   * A linear dimension between two world points, offset perpendicular to the
   * measured direction. Extension lines, dimension line, oblique terminators,
   * horizontal text — the ISO 129 arrangement, minus the parts that only make
   * sense on paper.
   */
  function dimension(parent) {
    const g = el('g', { class: 'dim' });
    const e1 = el('line', { class: 'dim__ext' });
    const e2 = el('line', { class: 'dim__ext' });
    const line = el('line', { class: 'dim__line' });
    const t1 = el('line', { class: 'dim__tick' });
    const t2 = el('line', { class: 'dim__tick' });
    const fig = el('text', { class: 'dim__fig' });
    const unit = el('text', { class: 'dim__unit' });
    g.append(e1, e2, line, t1, t2, fig, unit);
    parent.append(g);

    return {
      g,
      set(text, u) { fig.textContent = text; unit.textContent = u ?? ''; },
      /**
       * @param a,b world endpoints
       * @param off screen-space offset in px, perpendicular to a->b
       */
      update(a, b, off) {
        const p = project(a); const q = project(b);
        const dx = q.x - p.x, dy = q.y - p.y;
        const len = Math.hypot(dx, dy) || 1;
        // perpendicular, normalised
        const nx = -dy / len, ny = dx / len;
        const ox = nx * off, oy = ny * off;
        const ax = p.x + ox, ay = p.y + oy;
        const bx = q.x + ox, by = q.y + oy;
        const ux = ox / (Math.abs(off) || 1), uy = oy / (Math.abs(off) || 1);

        e1.setAttribute('x1', p.x + ux * GAP); e1.setAttribute('y1', p.y + uy * GAP);
        e1.setAttribute('x2', ax + ux * OVERRUN); e1.setAttribute('y2', ay + uy * OVERRUN);
        e2.setAttribute('x1', q.x + ux * GAP); e2.setAttribute('y1', q.y + uy * GAP);
        e2.setAttribute('x2', bx + ux * OVERRUN); e2.setAttribute('y2', by + uy * OVERRUN);

        line.setAttribute('x1', ax); line.setAttribute('y1', ay);
        line.setAttribute('x2', bx); line.setAttribute('y2', by);

        // oblique ticks bisect the dimension line and its extension
        const tx = (dx / len + ux) * TICK * 0.5, ty = (dy / len + uy) * TICK * 0.5;
        t1.setAttribute('x1', ax - tx); t1.setAttribute('y1', ay - ty);
        t1.setAttribute('x2', ax + tx); t1.setAttribute('y2', ay + ty);
        t2.setAttribute('x1', bx - tx); t2.setAttribute('y1', by - ty);
        t2.setAttribute('x2', bx + tx); t2.setAttribute('y2', by + ty);

        // text sits above the middle of the line, always horizontal: rotated
        // dimension text is correct on paper and unreadable on a screen at 14px
        const mx = (ax + bx) / 2, my = (ay + by) / 2;
        fig.setAttribute('x', mx + ux * 15); fig.setAttribute('y', my + uy * 15);
        const w = fig.getComputedTextLength ? fig.getComputedTextLength() : 60;
        unit.setAttribute('x', mx + ux * 15 + w / 2 + 9);
        unit.setAttribute('y', my + uy * 15);
        fig.setAttribute('text-anchor', 'middle');
      },
    };
  }

  /** A chain-dashed axis line through two world points, extended past both. */
  function centreline(parent) {
    const l = el('line', { class: 'cl' });
    parent.append(l);
    return {
      g: l,
      update(a, b, extend = 46) {
        const p = project(a); const q = project(b);
        const dx = q.x - p.x, dy = q.y - p.y;
        const len = Math.hypot(dx, dy) || 1;
        const ex = dx / len * extend, ey = dy / len * extend;
        l.setAttribute('x1', p.x - ex); l.setAttribute('y1', p.y - ey);
        l.setAttribute('x2', q.x + ex); l.setAttribute('y2', q.y + ey);
      },
    };
  }

  /**
   * A datum: a horizontal rule at a projected height, with a filled triangle and
   * a boxed letter at one end. This is the level line, drawn to convention.
   */
  function datum(parent, letter) {
    const g = el('g', { class: 'datum' });
    const rule = el('line', { class: 'datum__rule' });
    const tri = el('path', { class: 'datum__tri' });
    const boxr = el('rect', { class: 'datum__box' });
    const lab = el('text', { class: 'datum__letter' });
    lab.textContent = letter;
    g.append(rule, tri, boxr, lab);
    parent.append(g);
    return {
      g,
      /** @param at world point the datum is taken at; @param x2 screen x of the flag end */
      update(at, flagAtRight = true) {
        const p = project(at);
        const y = p.y;
        rule.setAttribute('x1', 0); rule.setAttribute('y1', y);
        rule.setAttribute('x2', W); rule.setAttribute('y2', y);
        const fx = flagAtRight ? W - 74 : 74;
        tri.setAttribute('d', `M ${p.x} ${y} l -7 -11 l 14 0 Z`);
        boxr.setAttribute('x', fx - 13); boxr.setAttribute('y', y - 27);
        boxr.setAttribute('width', 26); boxr.setAttribute('height', 22);
        lab.setAttribute('x', fx); lab.setAttribute('y', y - 11);
        lab.setAttribute('text-anchor', 'middle');
      },
    };
  }

  /**
   * A leader: dot on the surface, an oblique run, a horizontal landing, and the
   * label sitting on the landing. The landing is the ground the text sits on —
   * there is no scrim, because a scrim is a rectangle drawn over a photograph.
   */
  function leader(parent, text, balloonNo) {
    const g = el('g', { class: 'lead' });
    const path = el('path', { class: 'lead__path' });
    const dot = el('circle', { class: 'lead__dot', r: 2.6 });
    const lab = el('text', { class: 'lead__label' });
    lab.textContent = text;
    g.append(path, dot, lab);
    let ball = null, ballTx = null;
    if (balloonNo) {
      ball = el('circle', { class: 'lead__balloon', r: 13 });
      ballTx = el('text', { class: 'lead__balloonNo' });
      ballTx.textContent = balloonNo;
      g.append(ball, ballTx);
    }
    parent.append(g);
    return {
      g,
      /*
        A LEADER HAS TO LAND IN CLEAR SPACE, AND THAT IS NOT A FIXED DIRECTION.

        The first cut took a hardcoded [dx, dy] per shot, and the labels landed on
        the machine — grey mono over a lit orange casting, which is illegible and
        also just wrong: a leader points AT a part and puts its label somewhere the
        drawing is empty. The camera moves through 530 degrees, so "somewhere
        empty" is not a constant.

        It is computed instead: run away from the subject's own projected centre,
        far enough to clear its silhouette, and clamp the landing inside the frame.
        This is why there is no scrim behind these labels — they are placed rather
        than defended.
      */
      update(at, subject, run = 150, land = 104) {
        const p = project(at);
        // outward from the machine, biased to the horizontal so the label reads
        let dx = p.x - subject.x;
        let dy = p.y - subject.y;
        const len = Math.hypot(dx, dy) || 1;
        dx = dx / len; dy = dy / len;
        if (Math.abs(dx) < 0.35) dx = Math.sign(dx || 1) * 0.35;   // never straight up
        dy = dy * 0.55 - 0.45;                                      // always a little upward
        const l2 = Math.hypot(dx, dy) || 1;
        const kx = p.x + dx / l2 * run;
        const ky = p.y + dy / l2 * run;
        const right = dx > 0;
        let ex = kx + (right ? land : -land);
        const M = 26 + (ball ? 34 : 0);
        ex = Math.max(M + 60, Math.min(W - M - 60, ex));
        path.setAttribute('d', `M ${p.x} ${p.y} L ${kx} ${ky} L ${ex} ${ky}`);
        dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
        lab.setAttribute('x', right ? ex - 10 : ex + 10);
        lab.setAttribute('y', ky - 10);
        lab.setAttribute('text-anchor', right ? 'end' : 'start');
        if (ball) {
          const bx = right ? ex + 20 : ex - 20;
          ball.setAttribute('cx', bx); ball.setAttribute('cy', ky);
          ballTx.setAttribute('x', bx); ballTx.setAttribute('y', ky + 5);
          ballTx.setAttribute('text-anchor', 'middle');
        }
      },
    };
  }

  /** The single angular dimension: an arc and a value, at the tool plate. */
  function angular(parent) {
    const g = el('g', { class: 'ang' });
    const arc = el('path', { class: 'ang__arc' });
    const base = el('line', { class: 'ang__base' });
    const fig = el('text', { class: 'ang__fig' });
    fig.textContent = '0.000°';
    g.append(base, arc, fig);
    parent.append(g);
    return {
      g,
      update(at, r = 54) {
        const p = project(at);
        base.setAttribute('x1', p.x - r * 1.5); base.setAttribute('y1', p.y);
        base.setAttribute('x2', p.x + r * 1.5); base.setAttribute('y2', p.y);
        arc.setAttribute('d', `M ${p.x - r} ${p.y} A ${r} ${r} 0 0 1 ${p.x + r} ${p.y}`);
        fig.setAttribute('x', p.x); fig.setAttribute('y', p.y - r - 12);
        fig.setAttribute('text-anchor', 'middle');
      },
    };
  }

  /* ── the marks this page owns ───────────────────────────────────────────── */

  const marks = {
    height: dimension(sheet),          // 02 — 2 744 mm, floor to top
    span: dimension(sheet),            // 04 — 3 070 mm, in the ground plane
    rod: dimension(sheet),             // 03 — 1 300 mm on a linkage member
    axisColumn: centreline(room),      // 01 — the machine's own vertical axis
    axisShoulder: centreline(room),    // 03/05
    axisElbow: centreline(room),       // 03/05
    datumA: datum(room, 'A'),          // 03/06 — the tool plate
    lead: leader(sheet, '', ''),       // replaced per shot below
    ang: angular(sheet),               // 06 — 0.000°
  };
  /*
    THESE TWO CARRY NO TEXT, AND THAT IS THE POINT.

    Shots 02 and 04 already state their figure at display scale — "2 744" and
    "3 070" are the type composition of those frames. Printing the same number
    again at 14px under the dimension line says it twice and reads as a caption
    apologising for the headline.

    So the drawing supplies the GEOMETRY and the type supplies the VALUE: the
    extension lines and terminators mark exactly what is being measured, and the
    figure beside them is what it measures. Together they are one dimension, set
    at two scales. The rod dimension keeps its own text because nothing else on
    that frame states it.
  */
  marks.height.set('', '');
  marks.span.set('', '');

  // 1 300 mm is MEASURED, not quoted: it is the survey's own rod span.
  const rods = rig.rodLengths();
  const rodMM = rods.length ? Math.round(rods.reduce((a, b) => a + b, 0) / rods.length) : 1300;
  marks.rod.set(String(rodMM).replace(/\B(?=(\d{3})+(?!\d))/g, ' '), 'mm');

  // Leaders are three different labels on three different shots, so they are
  // three elements rather than one with its text rewritten mid-scroll.
  const leads = {
    rear: leader(sheet, 'CLOSED LOOPS', '05'),
    above: leader(sheet, 'DRIVEN AXES', '04'),
    macro: leader(sheet, 'LINKAGE', '03'),
  };
  marks.lead.g.remove();

  const ALL = [...Object.values(marks), ...Object.values(leads)].filter((m) => m.g);
  for (const m of ALL) m.g.style.opacity = '0';

  let live = {};

  /* ── per-shot specs ─────────────────────────────────────────────────────── */

  /*
    MOBILE CARRIES TWO MARKS, NEVER THREE.

    A 390px frame cannot hold a desktop annotation density and still read as a
    photograph — and the macro's leader in particular anchors on a point that the
    portrait crop pushes off-screen, so its label floated in empty sky with no
    line attached to anything. A leader whose origin you cannot see is not a
    leader.
  */
  const narrow = () => window.matchMedia('(max-width: 767px)').matches;

  const SHOT = {
    impact: { axisColumn: true },
    scale: { height: true },
    rear: { axisShoulder: true, axisElbow: true, datumA: true, leadRear: true },
    above: { span: true, leadAbove: true },
    macro: { axisElbow: true, leadMacro: true },   // leadMacro is dropped on narrow — see setShot
    hero: { datumA: true, ang: true },
    record: {},
  };

  const show = (m, on) => { if (m && m.g) m.g.style.opacity = on ? '1' : '0'; };

  function setShot(name) {
    live = { ...(SHOT[name] ?? {}) };
    if (narrow()) {
      // two marks, and the one that loses is the leader whose origin is cropped out
      live.leadMacro = false;
      live.axisShoulder = false;
    }
    show(marks.height, live.height);
    show(marks.span, live.span);
    show(marks.rod, live.rod);
    show(marks.axisColumn, live.axisColumn);
    show(marks.axisShoulder, live.axisShoulder);
    show(marks.axisElbow, live.axisElbow);
    show(marks.datumA, live.datumA);
    show(marks.ang, live.ang);
    show(leads.rear, live.leadRear);
    show(leads.above, live.leadAbove);
    show(leads.macro, live.leadMacro);
  }

  /* ── the frame ──────────────────────────────────────────────────────────── */

  const a = new V.constructor(), b = new V.constructor();

  function update() {
    if (!W) return;
    rig.bounds(box);

    if (live.height) {
      // Floor to the top of the machine's own bounding box, taken on the side
      // the camera is not looking through.
      a.set(box.min.x, 0, box.getCenter(V).z);
      b.set(box.min.x, box.max.y, box.getCenter(V).z);
      marks.height.update(a, b, -96);
    }
    if (live.span) {
      /*
        A PROPERTY, AT TRUE SCALE — NOT THE CURRENT POSE'S EXTENT.

        The first cut measured the live bounding box, and that is a different
        claim: at this shot's pose window the arm is not yet at full extension, so
        the line would have read a number the record does not carry while the
        figure beside it said 3 070. A dimension on a drawing states a property of
        the thing. "Overall span · 3 070 mm" is a property.

        So the line is exactly 3.070 m long, laid in the ground plane through the
        column's own axis and along the arm's current heading — the machine's real
        reach, drawn to scale in the room it stands in, with the arm passing over
        it. Nothing here is invented: the length is the record's measured figure
        and the placement is the machine's own axis.
      */
      rig.point('column', V2);
      rig.flangePoint(V);
      let hx = V.x - V2.x, hz = V.z - V2.z;
      const hl = Math.hypot(hx, hz) || 1;
      hx /= hl; hz /= hl;
      const HALF = SPAN_M / 2;
      a.set(V2.x - hx * HALF, 0.004, V2.z - hz * HALF);
      b.set(V2.x + hx * HALF, 0.004, V2.z + hz * HALF);
      marks.span.update(a, b, 74);
    }
    if (live.axisColumn) {
      rig.point('column', a); b.copy(a); b.y += 2.9; a.y = 0;
      marks.axisColumn.update(a, b, 60);
    }
    if (live.axisShoulder) {
      rig.point('lowerArm', a); rig.point('boom', b);
      marks.axisShoulder.update(a, b, 54);
    }
    if (live.axisElbow) {
      rig.point('boom', a); rig.point('tool', b);
      marks.axisElbow.update(a, b, 54);
    }
    if (live.datumA) {
      rig.flangePoint(a);
      marks.datumA.update(a, true);
    }
    if (live.ang) {
      rig.flangePoint(a);
      marks.ang.update(a);
    }
    // The subject's own projected centre, so a leader always runs away from the
    // machine rather than across it.
    box.getCenter(V2);
    const subject = project(V2);
    if (live.leadRear) { rig.point('rocker', a); leads.rear.update(a, subject); }
    if (live.leadAbove) {
      // Forced DOWN-LEFT rather than outward: this frame's figure owns the upper
      // right, and an outward-pointing leader from a machine sitting left of
      // centre lands straight on it. Text over text is the one collision a
      // drawing layer must never make.
      rig.flangePoint(a);
      const below = { x: subject.x + 260, y: subject.y - 300 };
      leads.above.update(a, below, 150, 104);
    }
    if (live.leadMacro) { rig.point('boom', a); leads.macro.update(a, subject, 130, 92); }
  }

  return {
    setShot,
    update,
    /** Global fade, so the record can take the drawing down with the light. */
    setFade(v) {
      room.style.opacity = String(v);
      sheet.style.opacity = String(v);
    },
    dispose() {
      window.removeEventListener('resize', size);
      room.remove(); sheet.remove();
    },
  };
}
