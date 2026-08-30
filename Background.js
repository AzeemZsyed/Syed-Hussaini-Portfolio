/* ═══════════════════════════════════════════════════════════
   Background.js — shared by every page.
   Five jobs:
     1. paint the out-of-focus code backdrop
     2. mark the current page in the tab strip
     3. run the clock in the tab bars
     4. fill the meter bars from today's date
     5. run the gallery viewer
   Anything that isn't on the current page is simply skipped.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ── 1. Code backdrop ────────────────────────────────────
     Instead of drawing real text, each "line of code" is a row
     of small coloured bars at random widths, indented like
     real code and blurred slightly. It reads as an editor
     sitting out of focus behind the page — cheap to render,
     and unreadable on purpose so it never competes with the
     actual content.

     The block is built once and then duplicated. Scrolling it
     up by exactly 50% lands the copy where the original was,
     so the loop has no visible seam.                          */

  const LINES        = 70;     /* rows in one block            */
  const LINE_HEIGHT  = 24;     /* px per row                   */
  const DRIFT_SECS   = 140;    /* one full loop                */
  const BLANK_CHANCE = 0.12;   /* share of rows left empty     */

  /* Same syntax palette as the stylesheet. */
  const TOKENS = ['#569cd6', '#ce9178', '#4ec9b0', '#6a9955',
                  '#dcdcaa', '#c586c0', '#d4d4d4'];

  /* Indent depths, weighted so shallow lines are more common. */
  const INDENTS = [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 4];

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  /* One row: a gutter number plus a few coloured bars. */
  function buildLine(number) {
    const row = document.createElement('div');
    row.style.cssText = [
      'display: flex',
      'align-items: center',
      'gap: 7px',
      'height: ' + LINE_HEIGHT + 'px',
      'padding-left: ' + (pick(INDENTS) * 26 + 56) + 'px'
    ].join('; ');

    /* Gutter number, pinned to the left edge of the screen. */
    const gutter = document.createElement('span');
    gutter.textContent = number;
    gutter.style.cssText = [
      'position: absolute',
      'left: 0',
      'width: 40px',
      'text-align: right',
      'font-family: inherit',
      'font-size: 11px',
      'line-height: ' + LINE_HEIGHT + 'px',
      'color: #858585'
    ].join('; ');

    row.style.position = 'relative';
    row.appendChild(gutter);

    /* Blank rows break up the rhythm so it doesn't look woven. */
    if (Math.random() < BLANK_CHANCE) return row;

    const barCount = 2 + Math.floor(Math.random() * 4);

    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('span');
      bar.style.cssText = [
        'display: block',
        'height: 7px',
        'border-radius: 2px',
        'width: ' + (18 + Math.floor(Math.random() * 130)) + 'px',
        'background: ' + pick(TOKENS)
      ].join('; ');
      row.appendChild(bar);
    }

    return row;
  }

  function createCodeBackdrop() {
    /* Fixed layer behind everything. The site's windows sit at
       z-index 1, so this stays underneath without any help.   */
    const layer = document.createElement('div');
    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = [
      'position: fixed',
      'inset: 0',
      'z-index: 0',
      'overflow: hidden',
      'pointer-events: none',
      'background: #141414',
      'font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace'
    ].join('; ');

    /* The scrolling strip: one block of lines, then a copy. */
    const strip = document.createElement('div');
    strip.style.cssText = [
      'position: absolute',
      'top: 0',
      'left: 0',
      'right: 0',
      'opacity: 0.10',
      'filter: blur(0.7px)',
      reduceMotion ? '' : 'animation: codeDrift ' + DRIFT_SECS + 's linear infinite'
    ].join('; ');

    for (let i = 0; i < LINES * 2; i++) {
      strip.appendChild(buildLine(i + 1));
    }

    layer.appendChild(strip);

    /* A soft vignette so the middle of the page stays calm and
       the content windows keep their contrast. */
    const vignette = document.createElement('div');
    vignette.style.cssText = [
      'position: absolute',
      'inset: 0',
      'background: radial-gradient(ellipse at center,' +
        ' rgba(20,20,20,0.85) 0%,' +
        ' rgba(20,20,20,0.35) 55%,' +
        ' rgba(20,20,20,0.75) 100%)'
    ].join('; ');

    layer.appendChild(vignette);
    document.body.appendChild(layer);
  }

  const driftKeyframes = document.createElement('style');
  driftKeyframes.textContent =
    '@keyframes codeDrift { from { transform: translateY(0); } to { transform: translateY(-50%); } }';
  document.head.appendChild(driftKeyframes);

  createCodeBackdrop();


  /* ── 2. Active tab ───────────────────────────────────────*/
  function markActiveNavLink() {
    const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

    document.querySelectorAll('.MenuBar a').forEach(function (link) {
      if (link.getAttribute('href').toLowerCase() === page) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }


  /* ── 3. Tab bar clock ────────────────────────────────────*/
  function startClock() {
    const clocks = document.querySelectorAll('[data-clock]');
    if (!clocks.length) return;

    function tick() {
      const now = new Date();
      const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
        .map(function (n) { return String(n).padStart(2, '0'); })
        .join(':');

      clocks.forEach(function (el) { el.textContent = time; });
    }

    tick();
    setInterval(tick, 1000);
  }


  /* ── 4. Meter bars ───────────────────────────────────────
     Real numbers, not decoration: each bar is the share of a
     date range that has already elapsed. Change the dates in
     RANGES and the bars follow.                              */
  const CELLS = 18;

  const RANGES = {
    year:   { from: new Date(new Date().getFullYear(), 0, 1),
              to:   new Date(new Date().getFullYear() + 1, 0, 1) },
    degree: { from: new Date(2024, 8, 1),   /* Sep 2024 — month is 0-indexed */
              to:   new Date(2029, 3, 30) },/* Apr 2029 */
    coop:   { from: new Date(2026, 8, 1),   /* Sep 2026 */
              to:   new Date(2027, 4, 1) }  /* May 2027 */
  };

  function percentElapsed(range) {
    const span = range.to - range.from;
    const done = Date.now() - range.from;
    return Math.min(100, Math.max(0, (done / span) * 100));
  }

  function drawMeters() {
    document.querySelectorAll('[data-meter]').forEach(function (meter) {
      const range = RANGES[meter.dataset.meter];
      if (!range) return;

      const pct = percentElapsed(range);
      const filled = Math.round((pct / 100) * CELLS);

      meter.querySelector('.meter-bar').innerHTML =
        '<span class="on">' + '█'.repeat(filled) + '</span>' +
        '<span class="off">' + '│'.repeat(CELLS - filled) + '</span>';

      meter.querySelector('.meter-val').textContent = pct.toFixed(1) + '%';
    });
  }


  /* ── 5. Gallery ──────────────────────────────────────────
     Clicking a filename swaps the viewer image and caption.
     If the file isn't there yet, we show a placeholder rather
     than a broken-image icon.                                */
  function startGallery() {
    const image   = document.querySelector('[data-gallery-img]');
    const empty   = document.querySelector('[data-gallery-empty]');
    const caption = document.querySelector('[data-gallery-caption]');
    const files   = document.querySelectorAll('.file');

    if (!image || !files.length) return;

    image.addEventListener('error', function () {
      image.hidden = true;
      if (empty) empty.hidden = false;
    });

    image.addEventListener('load', function () {
      image.hidden = false;
      if (empty) empty.hidden = true;
    });

    files.forEach(function (button) {
      button.addEventListener('click', function () {
        files.forEach(function (b) { b.classList.remove('is-active'); });
        button.classList.add('is-active');

        image.src = button.dataset.src;
        image.alt = (button.dataset.caption || 'Photo') + ' — photo taken by Az';
        if (caption) caption.textContent = button.dataset.caption || '';
      });
    });
  }


  /* ── Boot ────────────────────────────────────────────────*/
  document.addEventListener('DOMContentLoaded', function () {
    markActiveNavLink();
    startClock();
    drawMeters();
    startGallery();
  });

})();