// BD Buddy — The Bond of Brothers
// Chapter rotation for the cinematic brand page.
// Phases in plain English so students understand the collaboration.

(function () {
  'use strict';

  var chapters = [
    {
      quote: '"BDU builds the foundation of knowledge. BD Buddy carries the torch straight to the student\'s hand."',
      phase: 'They meet',
      action: 'Connection open',
      progress: '25%'
    },
    {
      quote: '"Like two comrades defending the same goal: Official authenticity protected by modern speed."',
      phase: 'They trust',
      action: 'Secure channel',
      progress: '50%'
    },
    {
      quote: '"No competition, only devotion. One delivers the truth; the other makes it shine with dignity."',
      phase: 'They build',
      action: 'Working together',
      progress: '75%'
    },
    {
      quote: '"From Lake Tana to the palm of your hand: together, we champion Bahir Dar students!"',
      phase: 'Ready',
      action: 'Ready for you',
      progress: '100%'
    }
  ];

  var current = 0;
  var loopTimer = null;

  var quoteEl = document.getElementById('brandQuoteText');
  var fillEl = document.getElementById('brandSyncFill');
  var phaseEl = document.getElementById('brandStepPhase');
  var actionEl = document.getElementById('brandStepAction');

  if (!quoteEl || !fillEl || !phaseEl || !actionEl) return;

  function showChapter(idx) {
    var ch = chapters[idx];
    quoteEl.style.opacity = '0';
    setTimeout(function () {
      quoteEl.textContent = ch.quote;
      quoteEl.style.opacity = '1';
    }, 200);

    fillEl.style.width = ch.progress;
    phaseEl.textContent = ch.phase;
    actionEl.textContent = ch.action;
  }

  function startCycle() {
    current = 0;
    showChapter(current);
    loopTimer = setInterval(function () {
      current++;
      if (current < chapters.length) {
        showChapter(current);
      } else {
        clearInterval(loopTimer);
      }
    }, 2500);
  }

  startCycle();
})();
