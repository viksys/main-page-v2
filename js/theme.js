/* ============================================================
   THEME — Dark / Light with system auto-detect
   Priority: localStorage → system preference → dark fallback
   ============================================================ */
(function () {
  var KEY = 'vikasana-theme';
  var root = document.documentElement;

  function getPreferred() {
    var stored = localStorage.getItem(KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    /* Auto-detect from system */
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
    /* Update all toggle buttons */
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('data-active', theme);
      var dark = btn.querySelector('[data-theme-opt="dark"]');
      var light = btn.querySelector('[data-theme-opt="light"]');
      var auto  = btn.querySelector('[data-theme-opt="auto"]');
      if (dark)  dark.classList.toggle('theme-opt--active',  theme === 'dark');
      if (light) light.classList.toggle('theme-opt--active', theme === 'light');
      if (auto)  auto.classList.toggle('theme-opt--active',  theme === 'auto');
    });
    /* Update logo visibility */
    updateLogos(theme);
  }

  function updateLogos(theme) {
    var effective = theme === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : theme;
    document.querySelectorAll('.nav__logo--dark, .footer__logo--dark').forEach(function(el) {
      el.style.display = effective === 'dark' ? 'block' : 'none';
    });
    document.querySelectorAll('.nav__logo--light, .footer__logo--light').forEach(function(el) {
      el.style.display = effective === 'light' ? 'block' : 'none';
    });
  }

  /* Set theme before paint to avoid flash */
  var initial = getPreferred();
  root.setAttribute('data-theme', initial === 'auto' ? 
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : initial);

  /* Wire up toggles after DOM ready */
  function wireToggles() {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var opt = e.target.closest('[data-theme-opt]');
        if (!opt) return;
        var chosen = opt.getAttribute('data-theme-opt');
        if (chosen === 'auto') {
          localStorage.removeItem(KEY);
          var sys = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
          root.setAttribute('data-theme', sys);
          document.querySelectorAll('[data-theme-toggle]').forEach(function(b){
            b.setAttribute('data-active','auto');
            b.querySelectorAll('[data-theme-opt]').forEach(function(o){
              o.classList.toggle('theme-opt--active', o.getAttribute('data-theme-opt')==='auto');
            });
          });
          updateLogos('auto');
        } else {
          applyTheme(chosen);
        }
      });
    });
    /* Set initial active state */
    var cur = localStorage.getItem(KEY) || 'auto';
    document.querySelectorAll('[data-theme-toggle]').forEach(function(btn){
      btn.setAttribute('data-active', cur);
      btn.querySelectorAll('[data-theme-opt]').forEach(function(o){
        o.classList.toggle('theme-opt--active', o.getAttribute('data-theme-opt')===cur);
      });
    });
    updateLogos(cur === 'auto' ?
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : cur);
  }

  /* Listen for system theme changes */
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
      if (!localStorage.getItem(KEY)) {
        root.setAttribute('data-theme', e.matches ? 'light' : 'dark');
        updateLogos('auto');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireToggles);
  } else {
    wireToggles();
  }
})();