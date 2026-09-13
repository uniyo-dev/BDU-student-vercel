// Splash Screen
// Shows a brief loading overlay on first load, then fades it out.

(function () {
  'use strict';

  var SPLASH_DURATION_MS = 800;

  function createSplash() {
    var splash = document.createElement('div');
    splash.id = 'splash-screen';

    var content = document.createElement('div');
    content.className = 'splash-content';

    var logo = document.createElement('img');
    logo.className = 'splash-logo';
    logo.src = '/images/bd-buddy-logo.svg';
    logo.alt = 'BD Buddy';
    logo.onerror = function () {
      // Fallback to PNG if SVG is missing
      this.src = '/images/bd-buddy-192x192.png';
    };

    var title = document.createElement('div');
    title.className = 'splash-title';
    title.textContent = 'BD Buddy';

    var subtitle = document.createElement('div');
    subtitle.className = 'splash-subtitle';
    subtitle.textContent = 'Your BDU Academic Companion';

    var spinner = document.createElement('div');
    spinner.className = 'splash-spinner';

    content.appendChild(logo);
    content.appendChild(title);
    content.appendChild(subtitle);
    content.appendChild(spinner);
    splash.appendChild(content);

    return splash;
  }

  function hideSplash(splash) {
    if (!splash || !splash.parentNode) return;
    splash.classList.add('splash-hidden');
    setTimeout(function () {
      if (splash.parentNode) splash.parentNode.removeChild(splash);
    }, 500);
  }

  function show() {
    if (document.getElementById('splash-screen')) return; // already shown
    if (!document.body) return;

    var splash = createSplash();
    document.body.insertBefore(splash, document.body.firstChild);

    var hidden = false;
    function doHide() {
      if (hidden) return;
      hidden = true;
      hideSplash(splash);
    }

    // Hide after SPLASH_DURATION_MS, or when the page finishes loading
    setTimeout(doHide, SPLASH_DURATION_MS);
    window.addEventListener('load', function () {
      setTimeout(doHide, 300);
    }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', show);
  } else {
    show();
  }
})();
