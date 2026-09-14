// ═══════════════════════════════════════════════════════════
// BD Buddy — Shared modal controller
// Opens/closes elements with class .bd-modal.
// Trigger: element with [data-modal-open="modal-id"]
// Close:   element with [data-modal-close] inside a modal
//          ESC key, or click on the backdrop.
// ═══════════════════════════════════════════════════════════

(function () {
  'use strict';

  function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Focus the first focusable element inside for accessibility
    var focusable = modal.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) setTimeout(function () { focusable.focus(); }, 50);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    // Restore scroll only if no other modal is open
    if (!document.querySelector('.bd-modal:not(.hidden)')) {
      document.body.style.overflow = '';
    }
  }

  function closeAll() {
    document.querySelectorAll('.bd-modal:not(.hidden)').forEach(closeModal);
  }

  // ─── Wiring (event delegation — works with dynamically added modals) ──
  document.addEventListener('click', function (e) {
    // Open
    var opener = e.target.closest('[data-modal-open]');
    if (opener) {
      e.preventDefault();
      var id = opener.getAttribute('data-modal-open');
      openModal(document.getElementById(id));
      return;
    }

    // Close (backdrop or explicit close button)
    var closer = e.target.closest('[data-modal-close]');
    if (closer) {
      var modal = closer.closest('.bd-modal');
      closeModal(modal);
      return;
    }
  });

  // ─── ESC closes topmost modal ──────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll();
  });

  // ─── Public API ────────────────────────────────────────────
  window.BDModal = {
    open:  function (id) { openModal(document.getElementById(id)); },
    close: function (id) { closeModal(document.getElementById(id)); },
    closeAll: closeAll
  };
})();
