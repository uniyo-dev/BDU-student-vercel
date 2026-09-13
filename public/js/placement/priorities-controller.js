// Priorities Tab Controller
// Renders placement result, score breakdown, priority list, and simulator.

(function () {
  'use strict';

  function getStudentData() {
    const saved = sessionStorage.getItem('bdu_student_data');
    if (!saved) return null;
    try { return JSON.parse(saved); } catch (e) { return null; }
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  window.PrioritiesController = {
    rendered: false,

    render: function () {
      const data = getStudentData();
      if (!data) return;

      const placement = data.placement || {};
      const results = placement.results || [];
      const criteria = placement.criteria || [];

      const container = document.getElementById('priorities-content');
      if (!container) return;

      let html = '';
      html += renderResultCard(results);
      html += renderScoreBreakdown(criteria);
      html += renderPriorityList(results);
      html += renderSimulator(results);
      html += renderActionGuide();

      container.innerHTML = html;
      this.rendered = true;
    }
  };

  function renderResultCard(results) {
    if (!results.length) {
      return '<div class="priorities-empty">No placement data available yet.</div>';
    }

    const selected = results.find(function (r) {
      return String(r.status || '').toLowerCase().indexOf('selected') !== -1 &&
             String(r.status || '').toLowerCase().indexOf('not') === -1;
    });

    let html = '<div class="priorities-result">';
    html += '<div class="priorities-result-head">🎯 Your Placement Result</div>';

    if (selected) {
      html += '<div class="priorities-result-selected">';
      html += '<div class="priorities-badge-selected">✅ SELECTED</div>';
      html += '<div class="priorities-dept-name">' + esc(selected.department) + '</div>';
      html += '<div class="priorities-meta">Priority: ' + esc(selected.priority) + ' · Score: ' + esc(selected.totalScore) + '</div>';
      html += '</div>';
    } else {
      html += '<div class="priorities-result-pending">';
      html += '<div class="priorities-badge-pending">⏳ Pending</div>';
      html += '<div class="priorities-meta">Your placement will be shown here when released.</div>';
      html += '</div>';
    }

    // Show other choices
    const others = results.filter(function (r) { return r !== selected; });
    if (others.length) {
      html += '<div class="priorities-others">';
      others.forEach(function (r) {
        html += '<div class="priorities-other-row">';
        html += '<span class="priorities-other-dept">' + esc(r.department) + '</span>';
        html += '<span class="priorities-other-status">' + esc(r.status || 'Pending') + '</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function renderScoreBreakdown(criteria) {
    if (!criteria.length) return '';

    let html = '<div class="priorities-section">';
    html += '<div class="priorities-section-head">📊 Score Breakdown</div>';
    html += '<div class="priorities-criteria-list">';

    let total = 0;
    criteria.forEach(function (c) {
      const scored = parseFloat(c.scored) || 0;
      total += scored;
      html += '<div class="priorities-criteria-row">';
      html += '<div class="priorities-criteria-name">' + esc(c.name) + '</div>';
      html += '<div class="priorities-criteria-weight">' + esc(c.percent) + '%</div>';
      html += '<div class="priorities-criteria-score">' + esc(c.scored) + '</div>';
      html += '</div>';
    });

    html += '<div class="priorities-criteria-total">';
    html += '<div class="priorities-criteria-name"><strong>TOTAL</strong></div>';
    html += '<div class="priorities-criteria-weight"></div>';
    html += '<div class="priorities-criteria-score"><strong>' + total.toFixed(2) + '</strong></div>';
    html += '</div>';

    html += '</div></div>';
    return html;
  }

  function renderPriorityList(results) {
    if (results.length < 2) return '';

    let html = '<div class="priorities-section">';
    html += '<div class="priorities-section-head">🎯 Your Priority Choices</div>';
    html += '<div class="priorities-list">';

    results.forEach(function (r) {
      const isSelected = String(r.status || '').toLowerCase().indexOf('selected') !== -1 &&
                         String(r.status || '').toLowerCase().indexOf('not') === -1;
      html += '<div class="priorities-card ' + (isSelected ? 'is-selected' : '') + '">';
      html += '<div class="priorities-num">' + esc(r.priority || '—') + '</div>';
      html += '<div class="priorities-card-body">';
      html += '<div class="priorities-dept">' + esc(r.department) + '</div>';
      html += '<div class="priorities-score">Score: ' + esc(r.totalScore) + '</div>';
      html += '</div>';
      html += '<div class="priorities-status ' + (isSelected ? 'selected' : 'rejected') + '">' + esc(r.status || '—') + '</div>';
      html += '</div>';
    });

    html += '</div></div>';
    return html;
  }

  function renderSimulator(results) {
    if (results.length < 2) return '';

    let html = '<div class="priorities-section">';
    html += '<div class="priorities-section-head">🔄 What If...</div>';
    html += '<div class="priorities-sim">';

    // Original order
    html += '<div class="priorities-sim-block">';
    html += '<div class="priorities-sim-label">Your actual order:</div>';
    results.forEach(function (r) {
      html += '<div class="priorities-sim-row">';
      html += '<span>' + esc(r.priority) + '. ' + esc(r.department) + '</span>';
      html += '<span class="priorities-sim-status">' + esc(r.status || '—') + '</span>';
      html += '</div>';
    });
    html += '</div>';

    // Reversed order
    html += '<div class="priorities-sim-block">';
    html += '<div class="priorities-sim-label">If you had swapped priorities:</div>';
    results.slice().reverse().forEach(function (r, i) {
      html += '<div class="priorities-sim-row">';
      html += '<span>' + (i + 1) + '. ' + esc(r.department) + '</span>';
      html += '<span class="priorities-sim-status">Unknown</span>';
      html += '</div>';
    });
    html += '</div>';

    html += '<div class="priorities-sim-note">⚠️ Simulation only. Confirm on the official portal.</div>';
    html += '</div></div>';
    return html;
  }

  function renderActionGuide() {
    let html = '<div class="priorities-section priorities-action">';
    html += '<div class="priorities-section-head">📋 When Results Release</div>';
    html += '<ol class="priorities-action-list">';
    html += '<li>Open the official portal: <a href="https://studentportal.bdu.edu.et" target="_blank" rel="noopener">studentportal.bdu.edu.et</a></li>';
    html += '<li>Confirm your assigned department</li>';
    html += '<li>If selected, complete registration</li>';
    html += '<li>If not selected, contact the registrar</li>';
    html += '</ol>';
    html += '<a href="/pages/placement-guide.html" class="priorities-guide-btn">📘 Read the Placement Guide</a>';
    html += '</div>';
    return html;
  }

})();
