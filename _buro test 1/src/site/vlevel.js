// THE LEVEL LINE — the page's signature move (`DNA37`), restored.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT IT IS, AND WHY IT IS NOT A CALLOUT
//
// A callout NAMES a feature and prints a number beside it. This does not print a
// number; it makes a claim visible and then keeps it under measurement while the
// machine moves. The claim is the whole page: four axes drive through their range
// and the tool plate does not tilt.
//
// The mechanism is a comparison, and both of its terms come out of the rig:
//
//   THE DATUM   a horizontal rule across the full viewport, at the projected
//               screen height of the real tool-plate pivot. It travels with the
//               plate — the plate rises and falls a long way through the range,
//               and hiding that would be a lie of a different kind.
//   THE PLATE   a short heavy segment drawn along the plate's OWN axis, from two
//               world points read out of the live hierarchy.
//
// Level means those two are parallel. If the plate ever tilted, the segment would
// pitch away from the rule and you would see it happen without being told. It
// never does, and that is the thing the page exists to show.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE NUMBER IS MEASURED HERE, NOT TYPED
//
// `0.000°` is not a string in this file. Every frame the plate's two in-plane
// axes are read from the rig, and the tilt is the larger of their two elevations
// above horizontal — which is the same quantity `lab/rig.html` reports as "worst
// plate tilt, full range" and the same one the record's table carries. If the rig
// were ever changed so the plate did tilt, this readout would say so on screen at
// the moment it happened, rather than continuing to assert a figure that had
// stopped being true (`CP1`, `DNA63`).
//
// ─────────────────────────────────────────────────────────────────────────────
// TWO DEPTHS, THE SAME REASON AS THE DRAWING LAYER
//
// The datum is a property of the ROOM — a height in the hall — so it lives behind
// the transparent canvas and the machine occludes it. The plate segment and the
// value are an annotation ON the picture, so they sit on the glass in front. A
// visitor never has to be told which is which; the occlusion says it.

const NS = 'http://www.w3.org/2000/svg';
const el = (n, a) => {
  const e = document.createElementNS(NS, n);
  for (const k in a) e.setAttribute(k, a[k]);
  return e;
};

const DEG = 180 / Math.PI;
/* Survey millimetres, so the probe points are far enough from the pivot that
   floating point in the world matrix cannot dominate the direction. */
const REACH = 900;

export function createLevel({ camera, rig }) {
  const room = el('svg', { class: 'lvl lvl--room', 'aria-hidden': 'true' });
  const sheet = el('svg', { class: 'lvl lvl--sheet', 'aria-hidden': 'true' });
  document.body.append(room, sheet);

  const rule = el('line', { class: 'lvl__rule' });
  const tri = el('path', { class: 'lvl__tri' });
  room.append(rule, tri);

  /*
    THE MEASUREMENT'S GROUND FADES, IT DOES NOT END.

    A solid rectangle behind the value drew a hard dark bar across a lit machine
    at every frame of the peak — the failure `U17` names, arriving from the side
    that is supposed to be the fix. The panel is a gradient instead: full strength
    under the glyphs, gone before its own edge, so it holds the contrast without
    cutting the picture. The direction of the fade is flipped with the value.
  */
  const defs = el('defs', {});
  const grad = el('linearGradient', { id: 'lvl-ground', x1: '0', y1: '0', x2: '1', y2: '0' });
  const gs = [
    el('stop', { offset: '0', 'stop-color': '#0a0c0d', 'stop-opacity': '0' }),
    el('stop', { offset: '0.14', 'stop-color': '#0a0c0d', 'stop-opacity': '0.88' }),
    el('stop', { offset: '0.86', 'stop-color': '#0a0c0d', 'stop-opacity': '0.88' }),
    el('stop', { offset: '1', 'stop-color': '#0a0c0d', 'stop-opacity': '0' }),
  ];
  for (const s of gs) grad.append(s);
  defs.append(grad);
  sheet.append(defs);

  const plate = el('line', { class: 'lvl__plate' });
  const flagBox = el('rect', { class: 'lvl__flagbox', width: 30, height: 26 });
  const flagTx = el('text', { class: 'lvl__flag' });
  const valBox = el('rect', { class: 'lvl__valbox', rx: 0 });
  const val = el('text', { class: 'lvl__value' });
  const cap = el('text', { class: 'lvl__cap' });
  flagTx.textContent = 'A';
  cap.textContent = 'TOOL PLATE · MEASURED EVERY FRAME';
  sheet.append(plate, valBox, val, cap, flagBox, flagTx);

  // Scratch. Nothing is allocated inside the frame loop (`DNA54`).
  const O = rig.point('column');                 // a Vector3 of the right class
  const V = O.constructor;
  // p0 is the ANCHOR and pb is the axes' own base. They are separate vectors
  // because they were once the same one: axes() wrote its base into p0 after the
  // anchor had been read, so the plate segment was drawn from a point about two
  // metres away and came out at 44 degrees on screen while the readout said
  // 0.000. Measured, not noticed — the two numbers are printed side by side by
  // the verification harness for exactly this reason.
  const p0 = new V(), pb = new V(), px = new V(), py = new V(), q = new V();

  let W = 0, H = 0;
  const size = () => {
    W = innerWidth; H = innerHeight;
    for (const s of [room, sheet]) s.setAttribute('viewBox', `0 0 ${W} ${H}`);
  };
  size();
  addEventListener('resize', size);

  const project = (v) => {
    q.copy(v).project(camera);
    return { x: (q.x + 1) / 2 * W, y: (1 - (q.y + 1) / 2) * H };
  };

  /*
    TWO DIFFERENT READS, AND CONFUSING THEM WAS THE FIRST BUG.

    `rig.point('tool')` is the plate's PIVOT — a world position, and the only
    correct anchor for the datum. `rig.pointOn('tool', p)` maps a survey-frame
    point through the tool's frame, which is right for a DIRECTION (the offset
    cancels in the subtraction) and wrong for a position: `pointOn('tool',[0,0,0])`
    is where the survey origin lands under the tool's transform, which is metres
    away from the plate and was putting the datum under the floor.
  */
  const axes = () => {
    rig.pointOn('tool', [0, 0, 0], pb);
    rig.pointOn('tool', [REACH, 0, 0], px).sub(pb);
    rig.pointOn('tool', [0, REACH, 0], py).sub(pb);
  };

  /** The plate's elevation above horizontal, in degrees — the worst of its two axes. */
  const tiltOf = () => {
    axes();
    const ex = Math.asin(Math.max(-1, Math.min(1, px.y / (px.length() || 1)))) * DEG;
    const ey = Math.asin(Math.max(-1, Math.min(1, py.y / (py.length() || 1)))) * DEG;
    return { deg: Math.abs(ex) > Math.abs(ey) ? ex : ey, ex, ey };
  };

  let mode = 'off';
  let value = false;
  let strength = 1;

  /* The readout is throttled on its own printed precision: rewriting the same
     three decimals sixty times a second is sixty layout invalidations for a
     string that did not change. */
  let lastPrinted = '';

  const state = { tiltDeg: 0, screenDeg: 0 };

  function update() {
    if (mode === 'off' || !W) return;

    rig.point('tool', p0);            // the plate's pivot, in the world
    const c = project(p0);

    /*
      Pick the in-plane axis most ACROSS the view, so the drawn segment is never a
      foreshortened dot. The two axes are 90 degrees apart, so one of them is
      always within 45 degrees of perpendicular whatever the column has done.
    */
    axes();                            // px, py are directions from the pivot
    px.add(p0); py.add(p0);            // put them back on the plate to project
    const a = project(px), b = project(py);
    const la = Math.hypot(a.x - c.x, a.y - c.y);
    const lb = Math.hypot(b.x - c.x, b.y - c.y);
    const e = la >= lb ? a : b;

    // Draw the segment symmetrically about the pivot: a plate has two sides.
    const dx = e.x - c.x, dy = e.y - c.y;
    const len = Math.hypot(dx, dy) || 1;
    const half = Math.max(52, Math.min(190, len));
    const ux = dx / len, uy = dy / len;

    rule.setAttribute('x1', 0); rule.setAttribute('x2', W);
    rule.setAttribute('y1', c.y.toFixed(1)); rule.setAttribute('y2', c.y.toFixed(1));
    tri.setAttribute('d', `M ${c.x.toFixed(1)} ${c.y.toFixed(1)} l -8 -13 l 16 0 Z`);

    plate.setAttribute('x1', (c.x - ux * half).toFixed(1));
    plate.setAttribute('y1', (c.y - uy * half).toFixed(1));
    plate.setAttribute('x2', (c.x + ux * half).toFixed(1));
    plate.setAttribute('y2', (c.y + uy * half).toFixed(1));

    const t = tiltOf();
    state.tiltDeg = t.deg;
    state.screenDeg = Math.atan2(uy, ux) * DEG;

    /*
      THE VALUE IS PLACED, NOT PARKED.

      It sits on the side of the plate the arm is NOT on, half a line above the
      datum, and is clamped inside the frame — a measurement that runs off the
      edge or lands on the casting it is measuring is the failure this page spent
      a direction discovering (`DNA62`, `color I6`).
    */
    const toLeft = c.x > W * 0.52;
    const vx = Math.max(150, Math.min(W - 150, c.x + (toLeft ? -half - 34 : half + 34)));
    const vy = Math.max(190, Math.min(H - 96, c.y - 30));
    const anchor = toLeft ? 'end' : 'start';

    const printed = t.deg.toFixed(3).replace('-0.000', '0.000') + '°';
    if (printed !== lastPrinted) { val.textContent = printed; lastPrinted = printed; }
    val.setAttribute('x', vx); val.setAttribute('y', vy); val.setAttribute('text-anchor', anchor);
    cap.setAttribute('x', vx); cap.setAttribute('y', vy + 26); cap.setAttribute('text-anchor', anchor);

    /*
      THE GROUND IS TAKEN FROM THE RENDERED GLYPHS, IN BOTH DIMENSIONS.

      It used to be a measured width and a hardcoded 82px height. Setting the
      value from 40px to 58px then pushed the digits out of the top of their own
      panel, and the render measured 1.02:1 where the overhang crossed a lit
      casting — a backing that fits the type it was drawn at and no other. getBBox
      is the union of what is actually painted, so the panel cannot be outgrown.
    */
    let bx = null;
    try {
      const a2 = val.getBBox(), b2 = cap.getBBox();
      bx = {
        x0: Math.min(a2.x, b2.x), y0: Math.min(a2.y, b2.y),
        x1: Math.max(a2.x + a2.width, b2.x + b2.width),
        y1: Math.max(a2.y + a2.height, b2.y + b2.height),
      };
    } catch { /* pre-layout: leave the panel where it was */ }
    if (bx) {
      /* The horizontal pad is wide because the fade lives inside it: the gradient
         is full strength from 14% to 86% of the box, so the pad has to be at
         least that fraction or the outer glyphs sit in the ramp. */
      const PADX = 52, PADY = 16;
      valBox.setAttribute('x', (bx.x0 - PADX).toFixed(1));
      valBox.setAttribute('y', (bx.y0 - PADY).toFixed(1));
      valBox.setAttribute('width', (bx.x1 - bx.x0 + PADX * 2).toFixed(1));
      valBox.setAttribute('height', (bx.y1 - bx.y0 + PADY * 2).toFixed(1));
    }

    const fx = toLeft ? 74 : W - 74;
    flagBox.setAttribute('x', fx - 15); flagBox.setAttribute('y', c.y - 32);
    flagTx.setAttribute('x', fx); flagTx.setAttribute('y', c.y - 14);
    flagTx.setAttribute('text-anchor', 'middle');
  }

  /*
    THE RULE AND THE READING ARRIVE ON DIFFERENT CURVES, AND THAT IS THE POINT.

    A hairline at 30% is a quiet rule. A three-decimal measurement at 30% is text
    nobody can read still occupying its slot — the exact band that made the old
    callouts measure 1.79:1 on the way into the record. So the room layer eases in
    across the whole ramp, and the sheet — the segment, the flag and the value —
    crosses from nothing to full inside the last quarter of it. On this shot that
    is about five percent of the beat: fast enough that no stopped frame lands in
    the unreadable middle, slow enough that it is not a cut.
  */
  const apply = () => {
    room.dataset.mode = mode;
    sheet.dataset.mode = mode;
    const s = mode === 'off' ? 0 : strength;
    const text = Math.max(0, Math.min(1, (s - 0.72) / 0.28));
    room.style.opacity = String(s);
    sheet.style.opacity = String(text);
    sheet.dataset.value = value ? 'on' : 'off';
  };
  apply();

  return {
    update,
    /**
     * @param spec.mode  'off' · 'quiet' (the rule alone, introduced) ·
     *                   'proof' (rule, plate, flag and the measured value)
     * @param spec.at    strength 0..1, so the device can arrive with the shot
     */
    set(spec = {}) {
      mode = spec.mode ?? 'off';
      value = mode === 'proof';
      strength = spec.at ?? 1;
      apply();
      if (mode !== 'off') update();
    },
    /** What the device is currently measuring — read by the verification harness. */
    state,
    dispose() { removeEventListener('resize', size); room.remove(); sheet.remove(); },
  };
}
