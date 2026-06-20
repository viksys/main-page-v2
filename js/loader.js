/* ============================================================
   LOADING SCREEN
   Shows until window.onload fires (all resources ready).
   Defence-centric aesthetic: boot sequence lines, progress bar.
   ============================================================ */
(function () {
  var loader = document.getElementById('pageLoader');
  if (!loader) return;

  var bar     = document.getElementById('loaderBar');
  var lines   = document.getElementById('loaderLines');
  var pct     = document.getElementById('loaderPct');

  var bootLines = [
    'VIKASANA CMD v3.1 — INITIALISING...',
    'CHECKING SECURE CHANNEL... OK',
    'AES-256 DATALINK ESTABLISHED',
    'LOADING ASSET MANIFEST...',
    'GCS CORE MODULES LOADED',
    'RENDERING PIPELINE READY',
    'CALIBRATING SENSOR SUITE...',
    'FLEET STATUS: NOMINAL',
    'MISSION SYSTEMS ONLINE',
    'LAUNCHING VIKASANA COMMAND...'
  ];

  var lineIdx  = 0;
  var progress = 0;
  var done     = false;

  /* Print boot lines */
  function printNextLine() {
    if (lineIdx >= bootLines.length) return;
    var el = document.createElement('div');
    el.className = 'loader-line';
    el.textContent = bootLines[lineIdx];
    lines.appendChild(el);
    lineIdx++;
    /* Scroll to bottom */
    lines.scrollTop = lines.scrollHeight;
  }

  var lineTimer = setInterval(function () {
    printNextLine();
    progress = Math.min(95, (lineIdx / bootLines.length) * 95);
    if (bar) bar.style.width = progress + '%';
    if (pct) pct.textContent = Math.round(progress) + '%';
    if (lineIdx >= bootLines.length) clearInterval(lineTimer);
  }, 160);

  function dismiss() {
    if (done) return;
    done = true;
    clearInterval(lineTimer);

    /* Fill bar to 100 */
    progress = 100;
    if (bar) bar.style.width = '100%';
    if (pct) pct.textContent = '100%';
    printNextLine(); /* last line */

    setTimeout(function () {
      loader.classList.add('loader--hidden');
      setTimeout(function () {
        loader.style.display = 'none';
        document.body.classList.remove('body--loading');
      }, 600);
    }, 300);
  }

  /* Dismiss ONLY when window.onload fires — all resources ready */
  window.addEventListener('load', dismiss);

  /* Safety net: dismiss after 12s regardless (very slow connection) */
  setTimeout(dismiss, 12000);
})();