// Priorities Tab Controller
// Renders placement result, score breakdown, priority list, and what-if simulator.
//
// Data source: sessionStorage 'bdu_student_data' (populated by auth flow).
//
// Shapes consumed from server.js /api/login response:
//   placement.results[]  = { department, priority, totalScore, status, breakdown{} }
//   placement.criteria[] = { name, percent, scored, maximum }
//
// Truth & Safety:
//   - The simulator recomputes YOUR score under hypothetical inputs only.
//   - It does NOT claim department eligibility; actual placement depends on
//     other students' scores and their priority lists (see placement-guide.html).

(function () {
  'use strict';

  function t(key, fallback) {
    if (window.BD_I18N && typeof window.BD_I18N[key] === 'string') {
      return window.BD_I18N[key];
    }
    return fallback;
  }

  var ICONS = {
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    lightbulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>',
    scroll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  function getStudentData() {
    var saved = sessionStorage.getItem('bdu_student_data');
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

  function numOrNull(v) {
    if (v === null || v === undefined || v === '') return null;
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }

  function statusCategory(raw) {
    var s = String(raw || '').toLowerCase().trim();
    if (!s) return 'unknown';
    if (s.indexOf('not') !== -1 && s.indexOf('select') !== -1) return 'not_selected';
    if (s.indexOf('select') !== -1) return 'selected';
    if (s.indexOf('wait') !== -1 || s.indexOf('pend') !== -1) return 'pending';
    if (s.indexOf('reject') !== -1 || s.indexOf('fail') !== -1) return 'rejected';
    return 'unknown';
  }

  function computeBreakdown(criteria) {
    var rows = [];
    var total = 0;

    criteria.forEach(function (c, idx) {
      var name = c.name || (t('criterion', 'Criterion') + ' ' + (idx + 1));
      var percent = numOrNull(c.percent);
      var scored = numOrNull(c.scored);
      var maximum = numOrNull(c.maximum);

      var scale = 'unknown';
      var contribution = 0;

      if (scored !== null && maximum !== null && maximum > 0 && scored <= maximum && percent !== null) {
        scale = 'raw';
        contribution = (scored / maximum) * percent;
      } else if (scored !== null && percent !== null && scored <= percent) {
        scale = 'weighted';
        contribution = scored;
      } else if (scored !== null) {
        contribution = scored;
      }

      total += contribution;

      rows.push({
        name: name,
        percent: percent,
        scored: scored,
        maximum: maximum,
        contribution: contribution,
        scale: scale
      });
    });

    return { rows: rows, total: total };
  }

  function renderResultCard(results) {
    if (!results.length) {
      return '<div class="priorities-empty">' +
        '<div class="priorities-empty-icon">' + ICONS.lock + '</div>' +
        '<div class="priorities-empty-title">' + esc(t('no_placement_title', 'Placement not yet released')) + '</div>' +
        '<div class="priorities-empty-desc">' + esc(t('no_placement_desc', 'Your placement data will appear here once BDU publishes it.')) + '</div>' +
      '</div>';
    }

    var selected = null;
    var others = [];
    results.forEach(function (r) {
      if (!selected && statusCategory(r.status) === 'selected') selected = r;
      else others.push(r);
    });

    var html = '<div class="priorities-result">';
    html += '<div class="priorities-result-head">' +
              '<span class="priorities-head-icon">' + ICONS.trophy + '</span>' +
              esc(t('result_head', 'Your Placement Result')) +
            '</div>';

    if (selected) {
      html += '<div class="priorities-result-selected">';
      html += '<div class="priorities-badge priorities-badge--selected">' +
                '<span class="priorities-badge-icon">' + ICONS.trophy + '</span>' +
                esc(t('selected', 'SELECTED')) + '</div>';
      html += '<div class="priorities-dept-name">' + esc(selected.department) + '</div>';
      html += '<div class="priorities-meta">' +
                esc(t('priority_label', 'Priority')) + ': ' + esc(selected.priority || '—') +
                ' · ' +
                esc(t('score_label', 'Score')) + ': ' + esc(selected.totalScore || '—') +
              '</div>';
      html += '<button class="priorities-copy-btn" data-copy-summary type="button">' +
                '<span class="priorities-copy-icon">' + ICONS.copy + '</span>' +
                esc(t('copy_summary', 'Copy result summary')) +
              '</button>';
      html += '</div>';
    } else {
      html += '<div class="priorities-result-pending">';
      html += '<div class="priorities-badge priorities-badge--pending">' +
                '<span class="priorities-badge-icon">' + ICONS.lock + '</span>' +
                esc(t('pending', 'PENDING')) + '</div>';
      html += '<div class="priorities-meta">' + esc(t('pending_desc', 'Your placement will be shown here when released.')) + '</div>';
      html += '</div>';
    }

    if (others.length) {
      html += '<div class="priorities-others">';
      html += '<div class="priorities-others-head">' + esc(t('other_choices', 'Other choices')) + '</div>';
      others.forEach(function (r) {
        var cat = statusCategory(r.status);
        html += '<div class="priorities-other-row priorities-other-row--' + cat + '">';
        html += '<span class="priorities-other-dept">' + esc(r.department || '—') + '</span>';
        html += '<span class="priorities-other-status">' + esc(r.status || '—') + '</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function renderScoreBreakdown(criteria) {
    if (!criteria.length) return '';

    var bd = computeBreakdown(criteria);

    var html = '<div class="priorities-section">';
    html += '<div class="priorities-section-head">' +
              '<span class="priorities-head-icon">' + ICONS.chart + '</span>' +
              esc(t('breakdown_head', 'Score Breakdown')) +
            '</div>';

    html += '<div class="priorities-criteria-list">';
    bd.rows.forEach(function (row) {
      html += '<div class="priorities-criteria-row">';
      html += '<div class="priorities-criteria-name">' + esc(row.name) + '</div>';
      html += '<div class="priorities-criteria-weight">' + (row.percent !== null ? esc(row.percent) + '%' : '—') + '</div>';
      html += '<div class="priorities-criteria-score">' +
                (row.scored !== null ? esc(row.scored) : '—') +
                (row.maximum !== null ? ' / ' + esc(row.maximum) : '') +
              '</div>';
      html += '<div class="priorities-criteria-contrib">' + row.contribution.toFixed(2) + '</div>';
      html += '</div>';
    });

    html += '<div class="priorities-criteria-row priorities-criteria-total">';
    html += '<div class="priorities-criteria-name"><strong>' + esc(t('total', 'TOTAL')) + '</strong></div>';
    html += '<div class="priorities-criteria-weight"></div>';
    html += '<div class="priorities-criteria-score"></div>';
    html += '<div class="priorities-criteria-contrib"><strong>' + bd.total.toFixed(2) + '</strong></div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="priorities-breakdown-note">' +
              esc(t('breakdown_note', "Contribution = (score / maximum) x weight. Weights are from BDU's published criteria.")) +
            '</div>';

    html += '</div>';
    return html;
  }

  function renderPriorityList(results) {
    if (results.length < 1) return '';

    var sorted = results.slice().sort(function (a, b) {
      return (parseInt(a.priority, 10) || 999) - (parseInt(b.priority, 10) || 999);
    });

    var html = '<div class="priorities-section">';
    html += '<div class="priorities-section-head">' +
              '<span class="priorities-head-icon">' + ICONS.target + '</span>' +
              esc(t('priority_head', 'Your Priority Choices')) +
            '</div>';

    html += '<div class="priorities-list">';
    sorted.forEach(function (r) {
      var cat = statusCategory(r.status);

      html += '<div class="priorities-card priorities-card--' + cat + '">';
      html += '<div class="priorities-num">' + esc(r.priority || '—') + '</div>';
      html += '<div class="priorities-card-body">';
      html += '<div class="priorities-dept">' + esc(r.department || '—') + '</div>';
      html += '<div class="priorities-score">' + esc(t('score_label', 'Score')) + ': ' + esc(r.totalScore || '—') + '</div>';
      html += '</div>';
      html += '<div class="priorities-status priorities-status--' + cat + '">' + esc(r.status || '—') + '</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
    return html;
  }

  function renderSimulator(criteria) {
    var scorable = criteria.filter(function (c) {
      return numOrNull(c.scored) !== null && numOrNull(c.maximum) !== null && numOrNull(c.percent) !== null;
    });
    if (!scorable.length) return '';

    var sliders = scorable.map(function (c, idx) {
      var max = numOrNull(c.maximum);
      var val = numOrNull(c.scored);
      if (max === null || val === null) return '';

      var step = max <= 4 ? 0.01 : (max <= 100 ? 1 : 0.1);
      var label = c.name || ('Criterion ' + (idx + 1));

      return '<div class="priorities-sim-control" data-sim-criterion>' +
        '<label class="priorities-sim-control-label">' +
          esc(label) +
          ' <span class="priorities-sim-value" data-sim-value>' + val + '</span>' +
        '</label>' +
        '<input type="range" class="priorities-sim-range" ' +
               'min="0" max="' + max + '" step="' + step + '" ' +
               'value="' + val + '" ' +
               'data-sim-max="' + max + '" data-sim-percent="' + c.percent + '">' +
        '<div class="priorities-sim-scale"><span>0</span><span>' + max + '</span></div>' +
      '</div>';
    }).join('');

    var html = '<div class="priorities-section">';
    html += '<div class="priorities-section-head">' +
              '<span class="priorities-head-icon">' + ICONS.lightbulb + '</span>' +
              esc(t('sim_head', 'What If...')) +
            '</div>';
    html += '<div class="priorities-sim">';
    html += '<div class="priorities-sim-note-top">' +
              esc(t('sim_desc', "Adjust your scores to see how the total changes. Illustrative only - actual placement depends on other students' scores and their priority lists.")) +
            '</div>';
    html += sliders;
    html += '<div class="priorities-sim-total">' +
              '<span class="priorities-sim-total-label">' + esc(t('sim_total', 'Estimated total')) + '</span>' +
              '<span class="priorities-sim-total-value" data-sim-total>—</span>' +
            '</div>';
    html += '<div class="priorities-sim-disclaimer">' +
              '<span class="priorities-sim-disclaimer-icon">' + ICONS.info + '</span>' +
              esc(t('sim_disclaimer', 'This is a math exercise, not a prediction. To know your actual placement, check the official BDU portal.')) +
            '</div>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  function renderActionGuide() {
    var html = '<div class="priorities-section priorities-action">';
    html += '<div class="priorities-section-head">' +
              '<span class="priorities-head-icon">' + ICONS.scroll + '</span>' +
              esc(t('action_head', 'When Results Release')) +
            '</div>';
    html += '<ol class="priorities-action-list">';
    html += '<li>' + esc(t('action_1', 'Open the official portal:')) + ' <a href="https://studentportal.bdu.edu.et" target="_blank" rel="noopener noreferrer">studentportal.bdu.edu.et</a></li>';
    html += '<li>' + esc(t('action_2', 'Confirm your assigned department')) + '</li>';
    html += '<li>' + esc(t('action_3', 'If selected, complete registration promptly')) + '</li>';
    html += '<li>' + esc(t('action_4', 'If not selected, contact the registrar or your department head')) + '</li>';
    html += '</ol>';
    html += '<a href="/pages/placement-guide.html" class="priorities-guide-btn">' +
              esc(t('read_guide', 'Read the Placement Guide')) +
            '</a>';
    html += '</div>';
    return html;
  }

  function wireSimulator(container) {
    var controls = container.querySelectorAll('[data-sim-criterion]');
    var totalEl = container.querySelector('[data-sim-total]');
    if (!totalEl) return;

    function recompute() {
      var total = 0;
      controls.forEach(function (ctrl) {
        var input = ctrl.querySelector('input[type="range"]');
        var valueEl = ctrl.querySelector('[data-sim-value]');
        if (!input) return;

        var val = parseFloat(input.value);
        var max = parseFloat(input.getAttribute('data-sim-max'));
        var percent = parseFloat(input.getAttribute('data-sim-percent'));

        if (valueEl) valueEl.textContent = input.value;

        if (!isNaN(val) && !isNaN(max) && max > 0 && !isNaN(percent)) {
          total += (val / max) * percent;
        }
      });
      totalEl.textContent = total.toFixed(2);
    }

    container.querySelectorAll('input[type="range"]').forEach(function (input) {
      input.addEventListener('input', recompute);
    });

    recompute();
  }

  function wireCopyButton(container, results) {
    var btn = container.querySelector('[data-copy-summary]');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var selected = null;
      results.forEach(function (r) {
        if (!selected && statusCategory(r.status) === 'selected') selected = r;
      });

      var text;
      if (selected) {
        text =
          'BDU Placement Result\n' +
          'Department: ' + (selected.department || '—') + '\n' +
          'Priority: ' + (selected.priority || '—') + '\n' +
          'Score: ' + (selected.totalScore || '—') + '\n' +
          'Status: ' + (selected.status || '—') + '\n' +
          '\nConfirmed via official portal: https://studentportal.bdu.edu.et';
      } else {
        text = 'BDU Placement Result: not yet released.';
      }

      var done = function () {
        var original = btn.innerHTML;
        btn.innerHTML = esc(t('copied', 'Copied!'));
        setTimeout(function () { btn.innerHTML = original; }, 1500);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {
          window.prompt('Copy manually:', text);
        });
      } else {
        window.prompt('Copy manually:', text);
      }
    });
  }

  window.PrioritiesController = {
    rendered: false,

    render: function () {
      var data = getStudentData();
      if (!data) return;

      var placement = data.placement || {};
      var results = placement.results || [];
      var criteria = placement.criteria || [];

      var container = document.getElementById('priorities-content');
      if (!container) return;

      var html = '';
      html += renderResultCard(results);
      html += renderScoreBreakdown(criteria);
      html += renderPriorityList(results);
      html += renderSimulator(criteria);
      html += renderActionGuide();

      container.innerHTML = html;

      wireSimulator(container);
      wireCopyButton(container, results);

      this.rendered = true;
    }
  };
})();
