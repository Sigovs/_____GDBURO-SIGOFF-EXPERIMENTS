/* Bentley Washington DC — index16.
   Two behaviours and nothing else: the narrow menu, and an enquiry form that
   validates honestly. There is no endpoint, so the form says so rather than
   pretending to have sent anything. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- narrow menu ------------------------------------------------------ */
  var mh = $('#mh'), burger = $('.burger');
  if (mh && burger) {
    var setOpen = function (open) {
      if (open) { mh.setAttribute('data-open', ''); } else { mh.removeAttribute('data-open'); }
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    burger.addEventListener('click', function () {
      setOpen(!mh.hasAttribute('data-open'));
    });
    $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mh.hasAttribute('data-open')) { setOpen(false); burger.focus(); }
    });
    /* the menu is a narrow-only state: leaving that width must not strand it */
    var mq = window.matchMedia('(min-width:1081px)');
    var onChange = function (e) { if (e.matches) setOpen(false); };
    if (mq.addEventListener) { mq.addEventListener('change', onChange); } else { mq.addListener(onChange); }
  }

  /* ---- enquiry ----------------------------------------------------------
     Validation is immediate and never waits on an animation. Errors are
     announced on the field they belong to, and the status line is a live
     region so a screen reader is told the same thing as everyone else. */
  var form = $('#enq');
  if (form) {
    var status = $('#f-status');
    var errFor = function (id) { return $('.form__err[data-for="' + id + '"]'); };
    var say = function (id, msg) {
      var el = errFor(id); if (el) el.textContent = msg || '';
      var f = document.getElementById(id);
      if (f) { if (msg) { f.setAttribute('aria-invalid', 'true'); } else { f.removeAttribute('aria-invalid'); } }
    };
    var checks = [
      ['f-name', function (v) { return v.trim().length >= 2 ? '' : 'Please give a name.'; }],
      ['f-tel', function (v) { return v.replace(/\D/g, '').length >= 7 ? '' : 'Please give a telephone number.'; }],
      ['f-mail', function (v) { return (!v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) ? '' : 'That email does not look complete.'; }]
    ];
    checks.forEach(function (c) {
      var el = document.getElementById(c[0]);
      if (el) el.addEventListener('blur', function () { say(c[0], c[1](el.value)); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      checks.forEach(function (c) {
        var el = document.getElementById(c[0]); if (!el) return;
        var m = c[1](el.value); say(c[0], m);
        if (m && !bad) bad = el;
      });
      if (bad) { bad.focus(); status.textContent = 'Please correct the fields marked above.'; return; }
      /* honest: nothing is wired up, and saying "sent" would be a lie */
      status.textContent = 'This is a design study — the form is not connected to a mailbox. ' +
        'Everything you entered is valid and would have been sent.';
    });
  }
})();
