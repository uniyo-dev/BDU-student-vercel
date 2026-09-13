// Verify page logic
// Reads serial from URL, fetches /api/verify/<serial>, renders result

document.addEventListener('DOMContentLoaded', function () {
  const serial = window.location.pathname.split('/').filter(Boolean)[1] || '';

  const tokenEl = document.getElementById('token-value');
  if (tokenEl) tokenEl.textContent = serial || '—';

  const scannedEl = document.getElementById('scanned-time');
  if (scannedEl) {
    scannedEl.textContent = new Date().toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  if (!serial) {
    renderNotFound('No serial provided.');
    return;
  }

  fetch('/api/verify/' + encodeURIComponent(serial), { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.valid) {
        renderVerified(data);
      } else {
        renderNotFound(data.error || 'Serial not found.');
      }
    })
    .catch(function (err) {
      renderNotFound('Network error: ' + err.message);
    });
});

function renderVerified(data) {
  const card = document.getElementById('verify-card');
  if (card) card.classList.add('is-verified');

  const title = document.getElementById('verify-title');
  if (title) title.textContent = 'Document Verified';

  const sub = document.getElementById('verify-subtitle');
  if (sub) sub.innerHTML = 'This document was issued by BD Buddy.';

  const icon = document.getElementById('icon-wrap');
  if (icon) {
    icon.style.background = 'var(--success-bg)';
    const svg = icon.querySelector('svg');
    if (svg) svg.style.stroke = 'var(--success)';
  }

  // Add student info rows
  const box = document.getElementById('info-box');
  if (box) {
    const issued = data.generatedAt
      ? new Date(data.generatedAt).toLocaleString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      : '—';

    let extra = '';
    if (data.studentId) {
      extra += '<div class="info-row"><span class="info-label">Student ID</span>' +
               '<span class="info-value">' + esc(data.studentId) + '</span></div>';
    }
    if (data.studentName) {
      extra += '<div class="info-row"><span class="info-label">Name</span>' +
               '<span class="info-value">' + esc(data.studentName) + '</span></div>';
    }
    extra += '<div class="info-row"><span class="info-label">Issued</span>' +
             '<span class="info-value">' + esc(issued) + '</span></div>';

    box.insertAdjacentHTML('beforeend', extra);
  }
}

function renderNotFound(msg) {
  const card = document.getElementById('verify-card');
  if (card) card.classList.add('is-not-found');

  const title = document.getElementById('verify-title');
  if (title) title.textContent = 'Serial Not Recognized';

  const sub = document.getElementById('verify-subtitle');
  if (sub) sub.innerHTML = esc(msg) +
    '<br><br>This can happen if the document is a forgery, has a typo, ' +
    'or was issued before the current server session began.';

  const icon = document.getElementById('icon-wrap');
  if (icon) {
    icon.style.background = 'var(--warning-bg)';
    const svg = icon.querySelector('svg');
    if (svg) svg.style.stroke = 'var(--warning)';
  }
}

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
