/* Dark-only — no theme toggle, no localStorage needed.
   Force dark on html element to prevent any flash. */
(function () {
  document.documentElement.setAttribute('data-theme', 'dark');
})();