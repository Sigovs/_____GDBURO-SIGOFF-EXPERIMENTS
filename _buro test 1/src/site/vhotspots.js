// Hotspots — the machine, made explorable on the last screen.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT THESE ARE, AND WHAT THEY ARE NOT
//
// They are NOT navigation. That was the first cut and it was wrong: a marker
// pinned to a pivot that throws you back up the page is a link wearing a
// mechanical costume, and the destination had nothing to do with the part under
// the dot. The footer keeps the text list, which is what navigation should look
// like.
//
// What they are is an ANNOTATION you can ask for. The record screen is the one
// place the machine has stopped and can be turned, so each dot names the part it
// sits on and states one true thing about it. Nothing here is a claim the record
// table does not already carry, and nothing is invented: A1 to A4 are the four
// driven axes, and 0.000° is the figure the film reads off the live rig.
//
// So they are <button>s, not links. They open a panel and close it again; they
// never leave the page, and a screen reader is told exactly that.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT MAKES THEM TRACK
//
// Every dot resolves a REAL rig node every frame and projects it, the same way
// the callouts do — so when the visitor drags the machine through 360°, the dots
// go round with it, pass behind it and come back. A dot whose anchor has gone
// behind the camera is hidden rather than clamped, because a marker that stays
// on screen while the thing it marks is on the far side is a marker that lies.

const CSS_HIDE = 'hot__dot--off';

export function createHotspots({ rig, camera, spots, guard = null }) {
  const layer = document.createElement('div');
  layer.className = 'hot';
  document.body.append(layer);

  const A = rig.point('column');            // borrow a Vector3 of the right class
  const P = A.clone();

  /** Where a named mechanical feature actually is, this frame. */
  const anchorOf = (name, out) => {
    switch (name) {
      case 'plate': return rig.flangePoint(out);
      case 'loops': return rig.point('rocker', out);
      case 'elbow': return rig.point('boom', out);
      case 'shoulder': return rig.point('lowerArm', out);
      case 'column': return rig.point('column', out);
      case 'tool': return rig.point('tool', out);
      case 'base': return out.set(0, 0.12, 0);
      default: return rig.point(name, out);
    }
  };

  const built = spots.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hot__dot';
    /*
      THE SAME OBJECT THE SCROLL CALLOUTS ARE, ASKED FOR RATHER THAN AUTHORED.

      Anchor, leader, card, text — in that order, in that language. The leader is
      an SVG cubic and not a CSS bar, because a CSS pseudo-element cannot curve
      and a straight hairline here against a curved luminous one four chapters
      earlier is two annotation systems again.

      Its geometry is CONSTANT, which is why it can be hard-coded: the panel
      stands off a fixed 150px at the dot's own height, so the run is always the
      same 17 → 137 at the same y. The shape is the scroll leader's construction
      exactly — it leaves the ring with some lift and the last control point
      shares the endpoint's y, so it arrives at the card dead level.

      `pathLength="100"` normalises the dash to percent, so the sheet can draw it
      0 → 100 without measuring anything, and the three glow layers stay in step
      because they share the number rather than a length.
    */
    const L = 'M17 32 C 52 20, 96 32, 137 32';
    b.innerHTML =
      `<svg class="hot__lead" viewBox="0 0 160 64" aria-hidden="true" focusable="false">`
      + `<defs><linearGradient id="hot-lead-${i}" x1="17" y1="32" x2="137" y2="32" gradientUnits="userSpaceOnUse">`
      + '<stop offset="0" stop-color="currentColor" stop-opacity="0.18"/>'
      + '<stop offset="0.45" stop-color="currentColor" stop-opacity="0.72"/>'
      + '<stop offset="1" stop-color="currentColor" stop-opacity="0.98"/>'
      + '</linearGradient></defs>'
      + `<path class="hot__lead-far"  pathLength="100" d="${L}"/>`
      + `<path class="hot__lead-near" pathLength="100" d="${L}"/>`
      + `<path class="hot__lead-core" pathLength="100" d="${L}" stroke="url(#hot-lead-${i})"/>`
      + '</svg>'
      + '<span class="hot__ring" aria-hidden="true"></span>'
      + '<span class="hot__pop">'
      + `<s>${String(i + 1).padStart(2, '0')}</s>`
      + `<span class="hd"><b>${s.part}</b>${s.axis ? `<u>${s.axis}</u>` : ''}</span>`
      + `<i>${s.note}</i>`
      + '</span>';
    b.setAttribute('aria-label', `${s.part}${s.axis ? ', ' + s.axis : ''}. ${s.note}`);
    b.setAttribute('aria-expanded', 'false');
    // Hover is not available on a touch screen and focus is not available to a
    // thumb, so the press toggles the panel as well.
    b.addEventListener('click', (e) => {
      e.preventDefault();
      const open = b.toggleAttribute('data-open');
      b.setAttribute('aria-expanded', String(open));
      for (const other of built) {
        if (other.el !== b) { other.el.removeAttribute('data-open'); other.el.setAttribute('aria-expanded', 'false'); }
      }
    });
    layer.append(b);
    return { spec: s, el: b, hidden: null, flipped: null };
  });

  let active = false;
  let raf = 0;

  function update() {
    const W = innerWidth, H = innerHeight;
    // The record's own column is a reading surface. A dot that lands on it is a
    // circle sitting in the middle of a paragraph, so the column wins.
    const g = guard?.getBoundingClientRect();

    for (const d of built) {
      anchorOf(d.spec.anchor, A);
      P.copy(A).project(camera);
      const x = (P.x + 1) / 2 * W;
      const y = (1 - (P.y + 1) / 2) * H;

      const behind = P.z > 1;
      const offscreen = x < 44 || x > W - 44 || y < 96 || y > H - 44;
      const onColumn = !!g && x > g.left - 36 && x < g.right + 36 && y > g.top - 36 && y < g.bottom + 36;
      const hide = behind || offscreen || onColumn;

      if (hide !== d.hidden) {
        d.hidden = hide;
        d.el.classList.toggle(CSS_HIDE, hide);
        // A hidden dot leaves the tab order too, and takes its open panel with
        // it — otherwise the keyboard finds five controls pointing at nothing.
        if (hide) {
          d.el.setAttribute('tabindex', '-1');
          d.el.removeAttribute('data-open');
          d.el.setAttribute('aria-expanded', 'false');
        } else d.el.removeAttribute('tabindex');
      }
      if (hide) continue;

      d.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;

      /*
        THE PANEL OPENS RIGHT UNTIL IT CANNOT — and it stands well clear of the
        dot, with a hairline running between them. Butted up against the ring it
        read as a tooltip stuck to a cursor; at arm's length with a line drawn to
        it, it reads as an annotation pointing at a part.

        The stand-off is 150px rather than 96: at the shorter distance the panel
        still overlapped the castings it was annotating, so the plate and the
        machine shared pixels and neither read cleanly. The flip threshold moves
        with it — a panel that needs 150px of clearance has to decide it cannot
        have it 74px sooner.
      */
      const flip = x > W - 470;
      if (flip !== d.flipped) {
        d.flipped = flip;
        d.el.toggleAttribute('data-flip', flip);
      }
    }
  }

  const tick = () => {
    if (!active) return;
    update();
    raf = requestAnimationFrame(tick);
  };

  return {
    setActive(on) {
      if (on === active) return;
      active = on;
      layer.toggleAttribute('data-on', on);
      if (on) { update(); raf = requestAnimationFrame(tick); }
      else {
        cancelAnimationFrame(raf);
        for (const d of built) { d.el.removeAttribute('data-open'); d.el.setAttribute('aria-expanded', 'false'); }
      }
    },
    update,
    dispose() { cancelAnimationFrame(raf); layer.remove(); },
  };
}
