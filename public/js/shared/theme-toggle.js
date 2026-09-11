/**
 * BD Buddy — Theme Toggle
 * Reads localStorage.bd_theme (default 'dark'), applies to <html data-theme>.
 * Updates any element with id="bd-theme-toggle" with a sun/moon icon.
 */
(function () {
  'use strict';

  const THEME_KEY = 'bd_theme';
  const DEFAULT_THEME = 'dark';

  function getTheme() {
    try { return localStorage.getItem(THEME_KEY) || DEFAULT_THEME; }
    catch (e) { return DEFAULT_THEME; }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  function toggleTheme() {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    updateButtons(next);
  }

  const SUN_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
  const MOON_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  function updateButtons(theme) {
    const btns = document.querySelectorAll('#bd-theme-toggle');
    btns.forEach(function (btn) {
      btn.setAttribute('aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.innerHTML = theme === 'dark' ? SUN_SVG : MOON_SVG;
    });
  }

  // Apply immediately — before paint — so no flash
  applyTheme(getTheme());

  // Wire up after DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    const btns = document.querySelectorAll('#bd-theme-toggle');
    btns.forEach(function (btn) {
      btn.addEventListener('click', toggleTheme);
    });
    updateButtons(getTheme());
  });

  window.BDTheme = {
    toggle: toggleTheme,
    get: getTheme,
    apply: applyTheme,
  };
})();
