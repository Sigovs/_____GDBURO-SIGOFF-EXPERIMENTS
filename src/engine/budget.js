// The performance budget, made visible while building rather than measured
// afterwards. DNA72 (declared up front) and DNA73 (the targets).
//
// Press `b` to toggle. It reads renderer.info, so the numbers are the real draw
// calls and the real triangle count, not an estimate.

export const BUDGET = {
  desktop: { fps: 60, drawCalls: 100, dpr: 2 },
  mobile: { fps: 30, drawCalls: 50, dpr: 1, maxTexture: 1024 },
};

export function createBudgetHUD(renderer, { mobile = false, visible = false } = {}) {
  const target = mobile ? BUDGET.mobile : BUDGET.desktop;

  const el = document.createElement('div');
  el.className = 'budget-hud';
  el.setAttribute('aria-hidden', 'true');
  el.hidden = !visible;
  el.innerHTML = `
    <table>
      <tr><th>fps</th><td data-fps>—</td><td class="lim">${target.fps}</td></tr>
      <tr><th>calls</th><td data-calls>—</td><td class="lim">${target.drawCalls}</td></tr>
      <tr><th>tris</th><td data-tris>—</td><td class="lim"></td></tr>
      <tr><th>progs</th><td data-progs>—</td><td class="lim"></td></tr>
      <tr><th>geom</th><td data-geom>—</td><td class="lim"></td></tr>
      <tr><th>tex</th><td data-tex>—</td><td class="lim"></td></tr>
    </table>`;
  document.body.appendChild(el);

  const out = {
    fps: el.querySelector('[data-fps]'),
    calls: el.querySelector('[data-calls]'),
    tris: el.querySelector('[data-tris]'),
    progs: el.querySelector('[data-progs]'),
    geom: el.querySelector('[data-geom]'),
    tex: el.querySelector('[data-tex]'),
  };

  let frames = 0;
  let acc = 0;

  const onKey = (e) => {
    if (e.key === 'b' && !e.metaKey && !e.ctrlKey) el.hidden = !el.hidden;
  };
  window.addEventListener('keydown', onKey);

  const update = (dt) => {
    frames++;
    acc += dt;
    if (acc < 0.5 || el.hidden) return;

    const fps = Math.round(frames / acc);
    const { render, memory, programs } = renderer.info;

    out.fps.textContent = fps;
    out.fps.dataset.over = fps < target.fps * 0.9 ? '1' : '';
    out.calls.textContent = render.calls;
    out.calls.dataset.over = render.calls > target.drawCalls ? '1' : '';
    out.tris.textContent = render.triangles.toLocaleString();
    out.progs.textContent = programs?.length ?? '—';
    out.geom.textContent = memory.geometries;
    out.tex.textContent = memory.textures;

    frames = 0;
    acc = 0;
  };

  return {
    update,
    get element() {
      return el;
    },
    dispose() {
      window.removeEventListener('keydown', onKey);
      el.remove();
    },
  };
}
