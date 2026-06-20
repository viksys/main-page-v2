/* ============================================================
   NOTIFICATION TICKER — seamless single-track marquee
   Reads data/notifications.json, filters by date, scrolls L→R
   ============================================================ */
(function () {
  var bar   = document.getElementById('notifBar');
  var track = document.getElementById('notifTrack');
  if (!bar || !track) return;

  var now = new Date();
  var SEP = '\u00A0\u00A0\u00A0\u25B8\u00A0\u00A0\u00A0'; /* ▸ with spaces */

  fetch('data/notifications.json')
    .then(function (r) { return r.json(); })
    .then(function (items) {
      var active = items.filter(function (n) {
        return now >= new Date(n.from) && now <= new Date(n.to);
      });
      if (!active.length) { bar.style.display = 'none'; return; }

      active.sort(function (a, b) {
        var o = { high: 0, normal: 1, low: 2 };
        return (o[a.priority] || 1) - (o[b.priority] || 1);
      });

      /* Build ONE long text string, repeated TWICE for seamless loop */
      var once = active.map(function (n) { return n.message; }).join(SEP) + SEP;

      /* Insert the doubled text as a single inline element */
      track.innerHTML = '';
      var inner = document.createElement('span');
      inner.className = 'notif-inner';
      /* The text is: [once][once] — animation slides exactly -50% (= one copy width) */
      inner.textContent = once + once;
      track.appendChild(inner);

      /* Measure after paint */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          /* Width of one copy = total width / 2 (since we doubled the text) */
          var totalW = inner.scrollWidth;
          var oneW   = totalW / 2;
          /* Speed: 90px/s */
          var dur    = Math.max(20, oneW / 90);

          /* Inject keyframe dynamically so translateX uses exact pixel width */
          var styleEl = document.getElementById('notif-keyframe') || document.createElement('style');
          styleEl.id = 'notif-keyframe';
          styleEl.textContent = [
            '@keyframes notifScroll {',
            '  0%   { transform: translateX(0); }',
            '  100% { transform: translateX(-' + oneW + 'px); }',
            '}'
          ].join('\n');
          document.head.appendChild(styleEl);

          inner.style.animation = 'notifScroll ' + dur + 's linear infinite';
          inner.style.willChange = 'transform';
        });
      });
    })
    .catch(function () { bar.style.display = 'none'; });
})();