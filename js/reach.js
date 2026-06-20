/* Reach Us — tab switching */
(function () {
  var tabs = document.querySelectorAll('.reach-tab');
  var panels = document.querySelectorAll('.reach-panel');

  if (!tabs.length) return;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('data-tab');

      tabs.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });

      panels.forEach(function (p) {
        p.classList.remove('is-active');
      });

      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      var panel = document.getElementById('panel-' + target);
      if (panel) panel.classList.add('is-active');
    });
  });

  /* Check URL hash for direct tab link */
  var hash = window.location.hash.replace('#', '');
  if (hash) {
    var matchTab = document.querySelector('[data-tab="' + hash + '"]');
    if (matchTab) matchTab.click();
  }

  /* Form submission placeholder */
  document.querySelectorAll('form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      if (!btn) return;
      var orig = btn.textContent;
      btn.textContent = 'TRANSMITTED';
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = orig;
        btn.disabled = false;
        form.reset();
      }, 3000);
    });
  });
})();