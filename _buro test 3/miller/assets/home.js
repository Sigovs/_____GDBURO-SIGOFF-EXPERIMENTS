/* ===========================================================================
   MILLER MOTORCARS — the marque field.

   Choosing a marque rewrites five compositional tokens — crop, focal position,
   pace, tracking and scale — and swaps the vehicle and the one logo. It changes
   how the page is composed, never what colour it is, and it never recolours a
   logo. With JavaScript off the field is already rendered with Pagani selected,
   every name is a real control, and the vehicle and logo are both in place.

   The register must be written on an ancestor of BOTH the list and the plate,
   or the tokens never reach the photograph.
   ======================================================================== */
(function () {
  'use strict';

  var list = document.getElementById('marque-index');
  if (!list) return;

  var field    = list.closest('.field') || list,
      plate    = document.getElementById('plate'),
      plateImg = document.getElementById('plate-img'),
      count    = document.getElementById('mq-count'),
      go       = document.getElementById('mq-go'),
      mobLogo  = document.getElementById('mq-mobile-logo'),
      rows     = [].slice.call(list.querySelectorAll('.mq'));

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function select(row, focus) {
    var d = row.dataset;

    rows.forEach(function (r) { r.setAttribute('aria-selected', 'false'); });
    row.setAttribute('aria-selected', 'true');
    field.setAttribute('data-register', d.register || 'house');

    if (count) {
      count.innerHTML = d.count
        ? '<span class="t-spec">' + d.count + '</span> in the collection'
        : 'Represented by request';
    }
    if (go) {
      go.href = d.href;
      go.innerHTML = 'Explore ' + d.name + ' inventory <i>&rarr;</i>';
    }
    /* the one logo, also mirrored into the mobile slot where the row list is a
       horizontal strip and cannot carry it */
    if (mobLogo && d.logo) {
      mobLogo.firstElementChild.src = d.logo;
      mobLogo.firstElementChild.alt = '';
    }

    if (d.img) {
      if (reduce) {
        plateImg.src = d.img; plateImg.alt = d.alt || ''; plateImg.hidden = false;
      } else {
        plate.classList.add('is-swapping');
        window.setTimeout(function () {
          plateImg.src = d.img; plateImg.alt = d.alt || ''; plateImg.hidden = false;
          plate.classList.remove('is-swapping');
        }, 170);
      }
      plate.classList.remove('is-empty');
    } else {
      plateImg.hidden = true;
      plate.classList.add('is-empty');
    }

    if (focus) row.focus();
  }

  list.addEventListener('click', function (e) {
    var row = e.target.closest('.mq');
    if (row) select(row, false);
  });

  /* rows are buttons and the arrows walk them, so touch and keyboard are never
     stranded by a hover-only mechanism */
  list.addEventListener('keydown', function (e) {
    var i = rows.indexOf(document.activeElement);
    if (i < 0) return;
    var next = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = rows[(i + 1) % rows.length];
    if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  next = rows[(i - 1 + rows.length) % rows.length];
    if (next) { e.preventDefault(); select(next, true); }
  });

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    rows.forEach(function (r) {
      r.addEventListener('mouseenter', function () { select(r, false); });
    });
  }
})();
