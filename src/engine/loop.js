// One loop. Everything that needs a frame subscribes here — never its own rAF.
// DNA54 (one canvas, one renderer, one loop) and DNA75 (the loop stops when
// nothing is watching).

const MAX_DT = 1 / 20; // a tab that was backgrounded must not deliver a 4s delta

/**
 * @param {Element|null} element  the canvas; watched so an offscreen scene idles
 * @param {{add:Function, remove:Function, time?:number}|null} ticker
 *        Pass `gsap.ticker` when GSAP is on the page, so the render loop and the
 *        tween engine are one clock instead of two interleaving on each frame.
 *        It must call fn(timeInSeconds). Omit it and the loop drives its own rAF.
 */
export function createLoop({ element = null, ticker = null } = {}) {
  const subscribers = new Set();
  let raf = 0;
  let last = 0;
  let elapsed = 0;
  let visible = !document.hidden;
  let onScreen = true;
  let running = false;

  const tick = (nowMs) => {
    const dt = Math.min((nowMs - last) / 1000, MAX_DT);
    last = nowMs;
    elapsed += dt;
    for (const fn of subscribers) fn(dt, elapsed);
  };

  const rafFrame = (now) => {
    raf = requestAnimationFrame(rafFrame);
    tick(now);
  };

  const tickerFrame = (timeSeconds) => tick(timeSeconds * 1000);

  const start = () => {
    if (running) return;
    running = true;
    last = ticker ? (ticker.time ?? 0) * 1000 : performance.now();
    if (ticker) ticker.add(tickerFrame);
    else raf = requestAnimationFrame(rafFrame);
  };

  const stop = () => {
    if (!running) return;
    running = false;
    if (ticker) ticker.remove(tickerFrame);
    else cancelAnimationFrame(raf);
  };

  const sync = () => (visible && onScreen ? start() : stop());

  const onVisibility = () => {
    visible = !document.hidden;
    sync();
  };
  document.addEventListener('visibilitychange', onVisibility);

  // Offscreen canvas is the second half of DNA75 — a hidden tab is not the only
  // way for a scene to stop being watched.
  let observer = null;
  if (element && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { rootMargin: '10%' },
    );
    observer.observe(element);
  }

  sync();

  return {
    add(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
    start,
    stop,
    get running() {
      return running;
    },
    get elapsed() {
      return elapsed;
    },
    dispose() {
      stop();
      subscribers.clear();
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
