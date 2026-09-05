/* ===========================================================================
   360 AUTO CARE — behaviour.
   Four jobs, and nothing else: the narrow-screen menu, the section marker in
   the masthead, carrying a chosen service into the form, and validating the
   request. No library, no scroll hijacking, no reveal animations — the page
   has to survive a screenshot.
   ======================================================================== */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  /* one reduced-motion query for the whole file */
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)');
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- 1. the narrow-screen menu ---------------------------------------- */
  var mh = $('#mh'), burger = $('.burger', mh), nav = $('#nav');
  if (burger && nav) {
    var setOpen = function (on) {
      if (on) { mh.setAttribute('data-open', ''); } else { mh.removeAttribute('data-open'); }
      burger.setAttribute('aria-expanded', on ? 'true' : 'false');
    };
    burger.addEventListener('click', function () {
      setOpen(!mh.hasAttribute('data-open'));
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    /* the menu is a narrow-screen affordance only: if the viewport grows past
       the breakpoint while it is open, the open state has to be dropped or the
       desktop masthead inherits an absolutely positioned nav */
    var mq = window.matchMedia('(min-width:1001px)');
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))
      (function (e) { if (e.matches) setOpen(false); });
  }

  /* ---- 1b. the masthead is only solid once the page has moved ----------- */
  if (mh) {
    var stuck = false;
    var mark = function () {
      var on = window.scrollY > 6;
      if (on === stuck) return;
      stuck = on;
      if (on) mh.setAttribute('data-stuck', ''); else mh.removeAttribute('data-stuck');
    };
    window.addEventListener('scroll', mark, { passive: true });
    mark();                                   /* a restored scroll position */
  }

  /* ---- 2. which section the reader is in -------------------------------- */
  var links = $$('.mh nav a[href^="#"]');
  var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);
  if (targets.length && 'IntersectionObserver' in window) {
    var mark = function (id) {
      links.forEach(function (a) {
        if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    var io = new IntersectionObserver(function (entries) {
      /* the topmost section that is genuinely on screen wins, so the marker
         does not flicker between two intersecting bands */
      var best = null;
      entries.forEach(function (en) { if (en.isIntersecting) { if (!best || en.boundingClientRect.top < best.boundingClientRect.top) best = en; } });
      if (best) mark(best.target.id);
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---- 3. a requested service arrives in the form already chosen -------- */
  var select = $('#f-service');
  $$('a[data-service]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (!select) return;
      var want = a.getAttribute('data-service')
        .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
      var hit = Array.prototype.filter.call(select.options, function (o) {
        return o.text.replace(/\s+/g, ' ').trim() === want;
      })[0];
      if (hit) {
        select.value = hit.value || hit.text;
        select.selectedIndex = hit.index;
        /* announce it, because the reader is being scrolled away from the
           thing they clicked and needs to find their choice already made */
        select.setAttribute('data-preset', '');
        window.setTimeout(function () { select.removeAttribute('data-preset'); }, 2400);
      }
    });
  });

  /* ---- 4. parallax on the two photographic bands -------------------------
     The picture moves against the page, nothing else does. Rules it keeps:
       · one property, transform, written to a custom property so the CSS keeps
         ownership of the scale and the JS only supplies the offset;
       · the travel is a fraction of the band's own height, so it is the same
         gesture on a phone and on a wide screen;
       · the image is over-scaled in CSS by more than the travel, so an edge can
         never appear;
       · it runs only while the band is on screen, one rAF per frame, and it is
         not installed at all under prefers-reduced-motion — the static page is
         the complete page.                                                    */
  var bands = $$('[data-par]');
  if (bands.length && !reduce.matches && 'IntersectionObserver' in window) {
    var live = [], queued = false;

    var draw = function () {
      queued = false;
      var vh = window.innerHeight;
      for (var i = 0; i < live.length; i++) {
        var el = live[i], host = el.parentNode;
        var r = host.getBoundingClientRect();
        /* -1 when the band is just below the fold, +1 when it has just left */
        var t = (vh - r.top) / (vh + r.height) * 2 - 1;
        if (t < -1) t = -1; else if (t > 1) t = 1;
        var travel = r.height * (parseFloat(el.getAttribute('data-par')) || 0.06);
        el.style.setProperty('--par', (-t * travel).toFixed(1) + 'px');
      }
    };
    var tick = function () { if (!queued) { queued = true; requestAnimationFrame(draw); } };

    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var el = en.target;
        var at = live.indexOf(el);
        if (en.isIntersecting && at < 0) live.push(el);
        else if (!en.isIntersecting && at >= 0) live.splice(at, 1);
      });
      if (live.length) tick();
    }, { rootMargin: '10% 0px' });

    bands.forEach(function (el) { pio.observe(el); });
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick, { passive: true });
    tick();

    /* if the reader turns reduced motion on mid-session, put the pictures back */
    var stop = function (e) {
      if (!e.matches) return;
      window.removeEventListener('scroll', tick);
      pio.disconnect(); live.length = 0;
      bands.forEach(function (el) { el.style.removeProperty('--par'); });
    };
    (reduce.addEventListener ? reduce.addEventListener.bind(reduce, 'change')
      : reduce.addListener.bind(reduce))(stop);
  }

  /* ---- 5. the request ---------------------------------------------------- */
  var form = $('#req'), sent = $('#sent');
  if (form) {
    var fieldOf = function (el) { return el.closest('.f'); };
    var fail = function (el, msg) {
      var f = fieldOf(el); if (!f) return;
      f.setAttribute('data-bad', '');
      el.setAttribute('aria-invalid', 'true');
      var e = $('[data-err]', f); if (e) e.textContent = msg;
    };
    var clear = function (el) {
      var f = fieldOf(el); if (!f) return;
      f.removeAttribute('data-bad');
      el.removeAttribute('aria-invalid');
      var e = $('[data-err]', f); if (e) e.textContent = '';
    };

    var check = function (el) {
      var v = (el.value || '').trim();
      if (el.hasAttribute('required') && !v) { fail(el, 'Required'); return false; }
      if (el.type === 'tel' && v && v.replace(/[^0-9]/g, '').length < 10) {
        fail(el, 'Ten digits, please'); return false;
      }
      if (el.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        fail(el, 'Check the address'); return false;
      }
      clear(el); return true;
    };

    $$('input, select, textarea', form).forEach(function (el) {
      el.addEventListener('blur', function () { if (el.type !== 'checkbox') check(el); });
      el.addEventListener('input', function () { if (fieldOf(el) && fieldOf(el).hasAttribute('data-bad')) check(el); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, first = null;
      $$('input, select, textarea', form).forEach(function (el) {
        if (el.type === 'checkbox' || el.type === 'submit') return;
        if (!check(el)) { ok = false; if (!first) first = el; }
      });
      if (!ok) { if (sent) sent.hidden = true; first.focus(); return; }

      /* This is a design study served as static files: there is no endpoint to
         post to, and pretending otherwise would lose somebody's request. Say
         so plainly and hand them the action that does work. */
      if (sent) {
        sent.hidden = false;
        sent.innerHTML = '<b>Nothing was sent — this is a design study.</b>' +
          'The page is static, so there is no server to receive the form. ' +
          'To reach the shop, call <a href="tel:+15168200360">(516)&nbsp;820-0360</a>.';
        sent.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  /* ---- 5b. the two drawings measure themselves ---------------------------
     Each stroke is told its own length so the dash animation constructs the
     figure at a constant RATE rather than in a constant time — otherwise a
     1400px circle and a 90px vane finish together and the thing does not read
     as being drawn. The order is the order a draughtsman would use, because
     the elements were generated in that order: centre lines, then the body,
     then the detail. Each figure restarts its own stagger. */
  (function () {
    if (reduce.matches) return;
    var figures = $$('.hero__dwg, .shop__dwg');
    for (var f = 0; f < figures.length; f++) {
      var strokes = $$('circle, line, path, ellipse', figures[f]);
      for (var i = 0; i < strokes.length; i++) {
        var el = strokes[i], len = 0;
        try { len = el.getTotalLength(); } catch (e) { len = 0; }
        if (!len || !isFinite(len)) continue;
        el.setAttribute('data-len', '');
        el.style.setProperty('--len', Math.ceil(len));
        el.style.setProperty('--t', Math.round(i * 26));
      }
    }
  })();

  /* ---- 6. the motion system ----------------------------------------------
     Three responsibilities and nothing else:

       · declare that motion is on, by putting js-motion on <html>. Every
         hidden state in the stylesheet hangs off that class, so a page with
         no JavaScript, a failed script or a blocked file is simply finished
         rather than blank;
       · run the opening sequence once, on the frame after the fonts settle;
       · mark each composed group as it arrives, with ONE observer for the
         whole page, and stop watching it afterwards.

     The order inside a group is CSS's job, not this file's: every revealed
     element carries data-i, which becomes its step in the group's sequence.
     There is no timeline object, no per-element observer and no scroll
     listener here — the reveals are declarative and the browser owns them. */
  var motion = function () {
    if (reduce.matches) return;                 /* nothing installed at all */

    var root = document.documentElement;
    root.classList.add('js-motion');

    /* resolve each element's step from data-i, once, before anything paints */
    var steps = $$('[data-reveal],[data-load]');
    for (var i = 0; i < steps.length; i++) {
      var v = steps[i].getAttribute('data-i');
      if (v !== null) steps[i].style.setProperty('--i', v);
    }
    /* the masthead is a group of three that enters together, top to bottom */
    var mhKids = $$('.mh__in > *');
    for (var k = 0; k < mhKids.length; k++) mhKids[k].style.setProperty('--d', (k * 55) + 'ms');

    /* ---- the opening ---------------------------------------------------
       Fired on the next frame rather than on a timer, and never later than
       the fonts: a headline that is masked while its webfont swaps would
       reveal one face and settle into another. */
    var open = function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (mh) mh.classList.add('is-load');
          var hero = $('.hero');
          if (hero) hero.classList.add('is-load');
        });
      });
    };
    if (document.fonts && document.fonts.ready) {
      var settled = false;
      var go = function () { if (!settled) { settled = true; open(); } };
      document.fonts.ready.then(go);
      window.setTimeout(go, 700);               /* never wait on a slow face */
    } else { open(); }

    /* ---- composed groups ------------------------------------------------ */
    var groups = $$('[data-seq]');
    if (!groups.length || !('IntersectionObserver' in window)) {
      /* no observer: show everything rather than gamble with hidden content */
      for (var g = 0; g < groups.length; g++) groups[g].classList.add('is-in');
      return;
    }

    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries, obs) {
      for (var e = 0; e < entries.length; e++) {
        var en = entries[e];
        if (!en.isIntersecting || seen.has(en.target)) continue;
        /* a group taller than the screen can never reach the ratio, so it
           commits on position instead once it is genuinely in front of us */
        var r = en.boundingClientRect;
        var tall = r.height > window.innerHeight * 0.8;
        if (en.intersectionRatio < 0.3 && !(tall && r.top < window.innerHeight * 0.45)) continue;
        seen.add(en.target);
        en.target.classList.add('is-in');
        obs.unobserve(en.target);               /* reveals fire once */
      }
    }, {
      /* A group used to commit the moment its TOP edge crossed the fold. For a
         short block that is right; for a tall one it is not — the process rail
         is 330px above its own four stations, so by the time a reader's eye
         reached them the first three had already finished off screen and only
         the fourth was still moving. It now commits on a share of itself being
         visible, so a tall group waits until it is actually being looked at. */
      rootMargin: '0px 0px -6% 0px', threshold: [0, 0.3]
    });
    for (var j = 0; j < groups.length; j++) io.observe(groups[j]);

    /* ---- the sweep -------------------------------------------------------
       An IntersectionObserver only reports a target that actually crosses the
       viewport. Jump straight to the foot of the page — an anchor, a restored
       scroll position, a flung touch scroll — and every group in between is
       skipped without ever intersecting, which measured as 14 of 15 groups
       and 58 elements left hidden. They are not lost, but a reader who
       scrolls back up would watch a finished page animate itself at them.

       So: anything the viewport has already passed is resolved AT ONCE and
       without a transition. It was never seen moving, so it should not move.
       One passive listener, rAF-throttled, over a list that only shrinks —
       it removes itself when the last group is done. */
    var pending = groups.slice(), swept = false;
    var sweep = function () {
      swept = false;
      for (var q = pending.length - 1; q >= 0; q--) {
        var el = pending[q];
        if (seen.has(el)) { pending.splice(q, 1); continue; }
        if (el.getBoundingClientRect().bottom < 0) {   /* already above us */
          seen.add(el);
          el.classList.add('is-instant');
          el.classList.add('is-in');
          io.unobserve(el);
          pending.splice(q, 1);
        }
      }
      if (!pending.length) window.removeEventListener('scroll', onScroll);
    };
    var onScroll = function () {
      if (!swept) { swept = true; requestAnimationFrame(sweep); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    /* and the same for the position the page opens at: a deep link or a
       restored scroll leaves groups both above and on screen */
    window.setTimeout(function () {
      sweep();
      for (var q = 0; q < groups.length; q++) {
        var el = groups[q];
        if (seen.has(el)) continue;
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          seen.add(el); el.classList.add('is-in'); io.unobserve(el);
        }
      }
    }, 400);

    /* if the reader turns reduced motion on mid-session, resolve everything
       where it stands rather than leaving a group mid-reveal */
    var settle = function (e) {
      if (!e.matches) return;
      io.disconnect();
      for (var q = 0; q < groups.length; q++) groups[q].classList.add('is-in');
      if (mh) mh.classList.add('is-load');
      var hero = $('.hero'); if (hero) hero.classList.add('is-load');
    };
    (reduce.addEventListener ? reduce.addEventListener.bind(reduce, 'change')
      : reduce.addListener.bind(reduce))(settle);
  };
  motion();
})();
