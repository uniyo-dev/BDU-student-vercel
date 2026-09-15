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

  // Captured at module load — survives history.replaceState from tab switching
  var _DEV_STANDING_DEMO = (function () {
    try { return /(?:\?|&)standing=demo(?:&|$)/.test(location.search); }
    catch (e) { return false; }
  })();

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

  // ===== M5 5.3a: checklist + snapshot =====

  var CHECKLIST_KEY = 'bd_priority_checklist';

  var CHECKLIST_ITEMS = [
    { id: 'criteria',  text: 'I have reviewed the placement criteria (CGPA 50%, Program Exam 30%, ESSLCE 20%)' },
    { id: 'scores',    text: 'I know my current CGPA and program exam score' },
    { id: 'research',  text: 'I have researched the departments I am interested in' },
    { id: 'order',     text: 'I have written my top choices in order, most preferred first' },
    { id: 'binding',   text: 'I understand placement is binding once submitted on the official portal' },
    { id: 'deadline',  text: 'I know the submission deadline' },
    { id: 'ready',     text: 'I have my student ID and password ready for the official portal' },
    { id: 'official',  text: 'I will submit through the official portal at studentportal.bdu.edu.et, not a third-party tool' }
  ];

  function loadChecklistState() {
    try {
      var raw = localStorage.getItem(CHECKLIST_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveChecklistState(state) {
    try { localStorage.setItem(CHECKLIST_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function renderPreSubmitChecklist() {
    var state = loadChecklistState();
    var checked = CHECKLIST_ITEMS.filter(function (item) { return state[item.id]; }).length;
    var total = CHECKLIST_ITEMS.length;

    var html = '<div class="priorities-section priorities-checklist-section">';
    html += '<div class="priorities-section-head">' +
              '<span class="priorities-head-icon">' + ICONS.info + '</span>' +
              esc(t('checklist_head', 'Before You Submit')) +
            '</div>';
    html += '<div class="priorities-checklist-progress">' +
              '<span class="priorities-checklist-count" data-checklist-count>' +
                checked + ' / ' + total +
              '</span>' +
              ' ' + esc(t('checklist_done', 'done')) +
            '</div>';
    html += '<div class="priorities-checklist">';
    CHECKLIST_ITEMS.forEach(function (item) {
      var isChecked = !!state[item.id];
      html += '<label class="priorities-checklist-item' + (isChecked ? ' is-checked' : '') + '" data-checklist-item="' + item.id + '">';
      html += '<input type="checkbox" class="priorities-checklist-box" data-checklist-input="' + item.id + '"' + (isChecked ? ' checked' : '') + '>';
      html += '<span class="priorities-checklist-text">' + esc(item.text) + '</span>';
      html += '</label>';
    });
    html += '</div>';
    html += '<button type="button" class="priorities-checklist-reset" data-checklist-reset>' +
              esc(t('checklist_reset', 'Reset checklist')) +
            '</button>';
    html += '</div>';
    return html;
  }

  function renderSnapshotPanel(placement) {
    var results = (placement && placement.results) || [];
    if (!results.length) return '';

    var html = '<div class="priorities-section priorities-snapshot-section">';
    html += '<div class="priorities-section-head">' +
              '<span class="priorities-head-icon">' + ICONS.copy + '</span>' +
              esc(t('snapshot_head', 'Snapshot for Your Records')) +
            '</div>';
    html += '<div class="priorities-snapshot-note">' +
              esc(t('snapshot_note', 'Save a copy of your placement view for your own records. Not an official BDU document.')) +
            '</div>';
    html += '<div class="priorities-snapshot-actions">';
    html += '<button type="button" class="priorities-snapshot-btn priorities-snapshot-btn--primary" data-snapshot-download>' +
              esc(t('snapshot_download', 'Download .txt')) +
            '</button>';
    html += '<button type="button" class="priorities-snapshot-btn" data-snapshot-copy>' +
              esc(t('snapshot_copy', 'Copy to clipboard')) +
            '</button>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  function redactStudentId(id) {
    var s = String(id || '');
    if (s.length <= 4) return s || '—';
    return s.slice(0, 3) + 'XXXX' + s.slice(-4);
  }

  function formatSnapshotText(data) {
    var bio = (data && data.biography) || {};
    var summary = (data && data.summary) || {};
    var placement = (data && data.placement) || {};
    var results = placement.results || [];
    var criteria = placement.criteria || [];

    var now = new Date();
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    var stamp = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
                ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());

    var lines = [];
    lines.push('BDU Placement - Record Snapshot');
    lines.push('Generated: ' + stamp + ' (device time)');
    lines.push('Student: ' + redactStudentId(bio.studentId));
    lines.push('CGPA: ' + (summary.cumulativeGPA || '—'));
    if (results[0] && results[0].totalScore) {
      lines.push('Placement score (first row): ' + results[0].totalScore);
    }
    lines.push('');
    lines.push('ACTUAL SUBMITTED CHOICES:');
    var sorted = results.slice().sort(function (a, b) {
      return (parseInt(a.priority, 10) || 999) - (parseInt(b.priority, 10) || 999);
    });
    sorted.forEach(function (r) {
      lines.push('  ' + (r.priority || '?') + '. ' + (r.department || '—') + ' - ' + (r.status || '—'));
    });
    lines.push('');
    lines.push('CRITERIA (from BDU):');
    var bd = computeBreakdown(criteria);
    bd.rows.forEach(function (row) {
      var scoredTxt = row.scored !== null ? row.scored : '—';
      var maxTxt = row.maximum !== null ? ' / ' + row.maximum : '';
      var pctTxt = row.percent !== null ? row.percent + '%' : '—';
      lines.push('  - ' + row.name + ' (' + pctTxt + '): ' + scoredTxt + maxTxt +
                 '  ->  ' + row.contribution.toFixed(2));
    });
    lines.push('  Total (computed): ' + bd.total.toFixed(2));
    var planText = getPlanTextForSnapshot();
    if (planText) lines.push(planText);
    lines.push('');
    lines.push('IMPORTANT:');
    lines.push('This is a snapshot of your BD Buddy view, not an official BDU record.');
    lines.push('Verify at: https://studentportal.bdu.edu.et');

    return lines.join('\n');
  }

  function wireChecklist(container) {
    var items = container.querySelectorAll('[data-checklist-item]');
    var countEl = container.querySelector('[data-checklist-count]');
    var resetBtn = container.querySelector('[data-checklist-reset]');

    function refreshCount() {
      var total = CHECKLIST_ITEMS.length;
      var checked = 0;
      items.forEach(function (el) {
        var input = el.querySelector('input[type="checkbox"]');
        if (input && input.checked) checked++;
      });
      if (countEl) countEl.textContent = checked + ' / ' + total;
    }

    items.forEach(function (el) {
      var input = el.querySelector('input[type="checkbox"]');
      if (!input) return;
      input.addEventListener('change', function () {
        var state = loadChecklistState();
        state[input.getAttribute('data-checklist-input')] = input.checked;
        saveChecklistState(state);
        el.classList.toggle('is-checked', input.checked);
        refreshCount();
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        try { localStorage.removeItem(CHECKLIST_KEY); } catch (e) {}
        items.forEach(function (el) {
          var input = el.querySelector('input[type="checkbox"]');
          if (input) input.checked = false;
          el.classList.remove('is-checked');
        });
        refreshCount();
      });
    }
  }

  function wireSnapshot(container, data) {
    var downloadBtn = container.querySelector('[data-snapshot-download]');
    var copyBtn = container.querySelector('[data-snapshot-copy]');

    function getText() {
      return formatSnapshotText(data);
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', function () {
        try {
          var text = getText();
          var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          var d = new Date();
          var pad = function (n) { return n < 10 ? '0' + n : String(n); };
          var fname = 'bdu-choices-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '.txt';
          a.href = url;
          a.download = fname;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
        } catch (e) {
          window.alert('Could not download. Try "Copy to clipboard" instead.');
        }
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = getText();
        var done = function () {
          var orig = copyBtn.textContent;
          copyBtn.textContent = t('snapshot_copied', 'Copied!');
          setTimeout(function () { copyBtn.textContent = orig; }, 1500);
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
  }

  // ===== M5 E-B: Where You Stand =====

  // Compute your rank + percentile from allStudents[].totalScore
  // Returns null if insufficient data.
  function computeStanding(placement, yourScore) {
    var all = (placement && placement.allStudents) || [];
    if (all.length < 5) return null;

    var scores = [];
    all.forEach(function (s) {
      var v = parseFloat(s && s.totalScore);
      if (!isNaN(v)) scores.push(v);
    });
    if (scores.length < 5) return null;

    scores.sort(function (a, b) { return b - a; });  // desc

    var myScore = parseFloat(yourScore) || 0;
    var rank = scores.length + 1;
    for (var i = 0; i < scores.length; i++) {
      if (myScore >= scores[i]) { rank = i + 1; break; }
    }

    function pct(arr, p) {
      var idx = Math.floor((p / 100) * (arr.length - 1));
      return arr[Math.max(0, Math.min(arr.length - 1, idx))];
    }

    return {
      total: scores.length,
      rank: rank,
      percentile: Math.round(((scores.length - rank + 1) / scores.length) * 100),
      yourScore: myScore,
      highest: scores[0],
      lowest: scores[scores.length - 1],
      q1: pct(scores, 25),
      median: pct(scores, 50),
      q3: pct(scores, 75)
    };
  }

  function renderStanding(placement, criteria) {
    // DEV PREVIEW: append ?standing=demo to the URL to see the
    // panel with generated sample data. Never fires in production.
    if (_DEV_STANDING_DEMO && (placement.allStudents || []).length === 0) {
      placement = { allStudents: [] };
      var _base = yourScore || 67.76;
      for (var _i = 0; _i < 200; _i++) {
        placement.allStudents.push({ totalScore: (_base - 20 + Math.random() * 35).toFixed(2) });
      }
    }

    // Sum criteria contributions (same as dashboard)
    var yourScore = 0;
    (criteria || []).forEach(function (c) {
      var scored = parseFloat(c.scored);
      var max = parseFloat(c.maximum);
      var pct = parseFloat(c.percent);
      if (!isNaN(scored) && !isNaN(max) && max > 0 && !isNaN(pct) && scored <= max) {
        yourScore += (scored / max) * pct;
      }
    });

    var st = computeStanding(placement, yourScore);

    // When there's no data yet, still show the panel with a clear
    // "waiting for BDU" message. Builds trust that the feature exists.
    if (!st) {
      var waitingHtml = '<div class="priorities-section priorities-standing-section">';
      waitingHtml += '<div class="priorities-section-head">' +
                '<span class="priorities-head-icon">' + ICONS.chart + '</span>' +
                esc(t('standing_head', 'Where You Stand')) +
              '</div>';
      waitingHtml += '<div class="priorities-standing-waiting">' +
                esc(t('standing_waiting', 'Rankings will appear once BDU publishes applicant data. Check back after placement results are released.')) +
              '</div>';
      waitingHtml += '</div>';
      return waitingHtml;
    }

    var html = '<div class="priorities-section priorities-standing-section">';
    html += '<div class="priorities-section-head">' +
              '<span class="priorities-head-icon">' + ICONS.chart + '</span>' +
              esc(t('standing_head', 'Where You Stand')) +
            '</div>';

    html += '<div class="priorities-standing-hero">';
    html += '<div class="priorities-standing-rank">#' + st.rank + '</div>';
    html += '<div class="priorities-standing-sub">of ' + st.total + ' applicants</div>';
    html += '<div class="priorities-standing-pct">' + st.percentile + 'th percentile</div>';
    html += '</div>';

    html += '<div class="priorities-standing-row">';
    html += '<div class="priorities-standing-cell"><div class="priorities-standing-cell-value">' + st.yourScore.toFixed(2) + '</div><div class="priorities-standing-cell-label">Your score</div></div>';
    html += '<div class="priorities-standing-cell"><div class="priorities-standing-cell-value">' + st.highest.toFixed(2) + '</div><div class="priorities-standing-cell-label">Highest</div></div>';
    html += '<div class="priorities-standing-cell"><div class="priorities-standing-cell-value">' + st.median.toFixed(2) + '</div><div class="priorities-standing-cell-label">Median</div></div>';
    html += '</div>';

    // Distribution bar with your marker
    html += '<div class="priorities-standing-bar-wrap">';
    html += '<div class="priorities-standing-bar">';
    html += '<div class="priorities-standing-q q1" title="Top 25%">Q1</div>';
    html += '<div class="priorities-standing-q q2" title="25-50%">Q2</div>';
    html += '<div class="priorities-standing-q q3" title="50-75%">Q3</div>';
    html += '<div class="priorities-standing-q q4" title="Bottom 25%">Q4</div>';
    html += '<div class="priorities-standing-marker" style="left:' + (100 - st.percentile) + '%;"></div>';
    html += '</div>';
    html += '<div class="priorities-standing-scale"><span>Top</span><span>Middle</span><span>Bottom</span></div>';
    html += '</div>';

    html += '<div class="priorities-standing-note">' +
              esc(t('standing_note', 'Rank computed from the placement data BDU has published so far. Will update as more results are released.')) +
            '</div>';

    html += '</div>';
    return html;
  }

  // ===== M5 5.3b: choice planner =====

  var PLAN_KEY = 'bd_priority_plan';
  var PLAN_SLOTS = 10;

  // Real department list.
  // Primary source: unique departments from placement.allStudents[] (BDU's own data).
  // Fallback: the 30 departments from the official BDU portal screenshot.
  function getAllDepartments(placement) {
    // 1. Real departments from BDU's GetPlacementSelectionOption
    var selectionOptions = (placement && placement.selectionOptions) || [];
    var fromBDU = [];
    selectionOptions.forEach(function (o) {
      var d = o && o.department;
      if (d) {
        d = String(d).trim();
        if (d && fromBDU.indexOf(d) === -1) fromBDU.push(d);
      }
    });
    fromBDU.sort();
    if (fromBDU.length > 0) return fromBDU;

    // 2. Fallback: derive from allStudents[]
    var allStudents = (placement && placement.allStudents) || [];
    var fromData = [];
    allStudents.forEach(function (s) {
      var d = s && s.department;
      if (d) {
        d = String(d).trim();
        if (d && fromData.indexOf(d) === -1) fromData.push(d);
      }
    });
    fromData.sort();

    if (fromData.length > 0) return fromData;

    // 2. Fallback: real list captured from official portal (Sep 2026)
    return [
      'Accounting and Finance',
      'Afan Oromo, Literature and Communication',
      'Amharic',
      'Amharic Education',
      'Cinema and Theatre Arts',
      'Civics and Ethical Studies',
      'Civics and Ethical Studies Education',
      'Economics',
      'Educational Planning and Management',
      'English',
      'English Education',
      'Gender and Development Studies',
      'Geography',
      'Geography Education',
      'Ge\'ez Language and Literature',
      'History',
      'History Education',
      'Journalism & Communications',
      'Logistics and Supply Chain Management',
      'Management',
      'Marketing Management',
      'Music Arts',
      'Political Science and International Studies',
      'Psychology',
      'Public Administration and Development Management',
      'Social Anthropology',
      'Social Work',
      'Sociology',
      'Special Needs and Inclusive Education',
      'Tourism and Hotel Management'
    ];
  }

  function loadPlan() {
    try {
      var raw = localStorage.getItem(PLAN_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed)) return null;
      // Clamp to PLAN_SLOTS, keep only strings
      return parsed.slice(0, PLAN_SLOTS).map(function (x) { return String(x || ''); });
    } catch (e) {
      return null;
    }
  }

  function savePlan(plan) {
    try { localStorage.setItem(PLAN_KEY, JSON.stringify(plan)); } catch (e) {}
  }

  function buildDefaultPlan(results) {
    var plan = [];
    var sorted = (results || []).slice().sort(function (a, b) {
      return (parseInt(a.priority, 10) || 999) - (parseInt(b.priority, 10) || 999);
    });
    sorted.forEach(function (r) {
      if (plan.length < PLAN_SLOTS) plan.push(r.department || '');
    });
    while (plan.length < PLAN_SLOTS) plan.push('');
    return plan;
  }

  // ===== M5 5.3c: department fill status =====

  // Compute per-department statistics from allStudents[]
  // Returns array of { department, applied, selected, pending, avgScore, topScore }
  function computeDepartmentStats(placement) {
    var allStudents = (placement && placement.allStudents) || [];
    if (!allStudents.length) return [];

    var byDept = {};
    allStudents.forEach(function (s) {
      var d = s && s.department;
      if (!d) return;
      d = String(d).trim();
      if (!d) return;
      if (!byDept[d]) {
        byDept[d] = { department: d, applied: 0, selected: 0, pending: 0, scores: [] };
      }
      byDept[d].applied++;
      var cat = statusCategory(s.status);
      if (cat === 'selected') byDept[d].selected++;
      else if (cat === 'pending') byDept[d].pending++;
      var sc = numOrNull(s.totalScore);
      if (sc !== null) byDept[d].scores.push(sc);
    });

    var out = [];
    Object.keys(byDept).forEach(function (key) {
      var rec = byDept[key];
      var scores = rec.scores.slice().sort(function (a, b) { return b - a; });
      out.push({
        department: rec.department,
        applied: rec.applied,
        selected: rec.selected,
        pending: rec.pending,
        topScore: scores.length ? scores[0] : null,
        minScore: scores.length ? scores[scores.length - 1] : null
      });
    });

    // Sort by applied count (highest first)
    out.sort(function (a, b) { return b.applied - a.applied; });

    return out;
  }

  function renderDepartmentStatus(placement) {
    var stats = computeDepartmentStats(placement);
    if (!stats.length) return '';

    var totalApplied = stats.reduce(function (sum, d) { return sum + d.applied; }, 0);
    var totalSelected = stats.reduce(function (sum, d) { return sum + d.selected; }, 0);

    var html = '<div class="priorities-section priorities-dept-status-section">';
    html += '<div class="priorities-section-head">' +
              '<span class="priorities-head-icon">' + ICONS.chart + '</span>' +
              esc(t('dept_status_head', 'Department Status')) +
            '</div>';
    html += '<div class="priorities-dept-status-note">' +
              esc(t('dept_status_note', 'Live summary of applications per department, based on the data currently available from BDU. Results may change until placement is final.')) +
            '</div>';

    html += '<div class="priorities-dept-status-summary">';
    html += '<div class="priorities-dept-status-stat">';
    html += '<div class="priorities-dept-status-stat-value">' + totalApplied + '</div>';
    html += '<div class="priorities-dept-status-stat-label">' + esc(t('dept_status_applied_total', 'Applications')) + '</div>';
    html += '</div>';
    if (totalSelected > 0) {
      html += '<div class="priorities-dept-status-stat">';
      html += '<div class="priorities-dept-status-stat-value">' + totalSelected + '</div>';
      html += '<div class="priorities-dept-status-stat-label">' + esc(t('dept_status_selected_total', 'Selected')) + '</div>';
      html += '</div>';
    }
    html += '<div class="priorities-dept-status-stat">';
    html += '<div class="priorities-dept-status-stat-value">' + stats.length + '</div>';
    html += '<div class="priorities-dept-status-stat-label">' + esc(t('dept_status_dept_total', 'Departments')) + '</div>';
    html += '</div>';
    html += '</div>';

    // Table
    html += '<div class="priorities-dept-status-table">';
    html += '<div class="priorities-dept-status-row priorities-dept-status-row--head">';
    html += '<div class="priorities-dept-status-cell priorities-dept-status-cell--name">' + esc(t('dept_status_col_name', 'Department')) + '</div>';
    html += '<div class="priorities-dept-status-cell priorities-dept-status-cell--num">' + esc(t('dept_status_col_applied', 'Applied')) + '</div>';
    if (totalSelected > 0) {
      html += '<div class="priorities-dept-status-cell priorities-dept-status-cell--num">' + esc(t('dept_status_col_selected', 'Selected')) + '</div>';
    }
    html += '<div class="priorities-dept-status-cell priorities-dept-status-cell--num">' + esc(t('dept_status_col_top', 'Top score')) + '</div>';
    html += '</div>';

    stats.forEach(function (d) {
      html += '<div class="priorities-dept-status-row">';
      html += '<div class="priorities-dept-status-cell priorities-dept-status-cell--name">' + esc(d.department) + '</div>';
      html += '<div class="priorities-dept-status-cell priorities-dept-status-cell--num">' + d.applied + '</div>';
      if (totalSelected > 0) {
        html += '<div class="priorities-dept-status-cell priorities-dept-status-cell--num">' + d.selected + '</div>';
      }
      html += '<div class="priorities-dept-status-cell priorities-dept-status-cell--num">' + (d.topScore !== null ? d.topScore.toFixed(2) : '—') + '</div>';
      html += '</div>';
    });
    html += '</div>';

    html += '<div class="priorities-dept-status-disclaimer">' +
              '<span class="priorities-sim-disclaimer-icon">' + ICONS.info + '</span>' +
              esc(t('dept_status_disclaimer', 'Statistics computed from BDU data at the time of your login. Confirm final status on the official portal.')) +
            '</div>';

    html += '</div>';
    return html;
  }

  function renderChoicePlanner(results, placement) {
    var plan = loadPlan();
    var isDefault = false;
    if (!plan) {
      plan = buildDefaultPlan(results);
      isDefault = true;
    }
    while (plan.length < PLAN_SLOTS) plan.push('');

    var depts = getAllDepartments(placement);

    var html = '<div class="priorities-section priorities-planner-section">';
    html += '<div class="priorities-section-head">' +
              '<span class="priorities-head-icon">' + ICONS.target + '</span>' +
              esc(t('planner_head', 'Plan Your Choices')) +
            '</div>';
    html += '<div class="priorities-planner-note">' +
              esc(t('planner_note', 'Arrange the departments you would submit, most preferred first. This is your workspace - it is not sent anywhere.')) +
            '</div>';

    html += '<div class="priorities-planner-list">';
    for (var i = 0; i < PLAN_SLOTS; i++) {
      var current = plan[i] || '';
      html += '<div class="priorities-planner-row" data-plan-row="' + i + '">';
      html += '<div class="priorities-planner-num">' + (i + 1) + '</div>';
      html += '<select class="priorities-planner-select" data-plan-select="' + i + '" data-dropdown>';
      html += '<option value="">' + esc(t('planner_empty', '— Choose a department —')) + '</option>';
      var used = plan.indexOf(current);
      depts.forEach(function (d) {
        var selected = (d === current) ? ' selected' : '';
        var usedElsewhere = (plan.indexOf(d) !== -1 && plan.indexOf(d) !== i) ? ' data-used-elsewhere="1"' : '';
        html += '<option value="' + esc(d) + '"' + selected + usedElsewhere + '>' + esc(d) + '</option>';
      });
      html += '</select>';
      html += '<div class="priorities-planner-buttons">';
      html += '<button type="button" class="priorities-planner-btn" data-plan-up="' + i + '" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>▲</button>';
      html += '<button type="button" class="priorities-planner-btn" data-plan-down="' + i + '" aria-label="Move down"' + (i === PLAN_SLOTS - 1 ? ' disabled' : '') + '>▼</button>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';

    html += '<div class="priorities-planner-actions">';
    html += '<button type="button" class="priorities-planner-copy" data-plan-copy>' +
              '<span class="priorities-planner-copy-icon">' + ICONS.copy + '</span>' +
              esc(t('planner_copy', 'Copy my list for the portal')) +
            '</button>';
    html += '<button type="button" class="priorities-planner-reset" data-plan-reset>' +
              esc(t('planner_reset', 'Reset to my submitted order')) +
            '</button>';
    html += '</div>';

    html += '</div>';

    // If we built a default plan, persist it so it survives reload
    if (isDefault) savePlan(plan);

    return html;
  }

  function wireChoicePlanner(container, results) {
    var section = container.querySelector('.priorities-planner-section');
    if (!section) return;

    function getPlanFromDOM() {
      var selects = section.querySelectorAll('[data-plan-select]');
      var plan = [];
      selects.forEach(function (sel) { plan.push(sel.value || ''); });
      return plan;
    }

    function refreshButtons(plan) {
      // Update up/down disabled states
      var rows = section.querySelectorAll('[data-plan-row]');
      rows.forEach(function (row, i) {
        var upBtn = row.querySelector('[data-plan-up]');
        var downBtn = row.querySelector('[data-plan-down]');
        if (upBtn) upBtn.disabled = (i === 0);
        if (downBtn) downBtn.disabled = (i === PLAN_SLOTS - 1);
      });
      // Mark duplicate-used options (visual hint only)
      var selects = section.querySelectorAll('[data-plan-select]');
      selects.forEach(function (sel, i) {
        var opts = sel.querySelectorAll('option');
        opts.forEach(function (opt) {
          if (!opt.value) return;
          var usedElsewhere = false;
          for (var j = 0; j < selects.length; j++) {
            if (j !== i && selects[j].value === opt.value) { usedElsewhere = true; break; }
          }
          opt.style.color = usedElsewhere ? 'var(--warning)' : '';
        });
      });
    }

    function onSelectChange() {
      var plan = getPlanFromDOM();
      savePlan(plan);
      refreshButtons(plan);
    }

    function moveRow(from, to) {
      if (to < 0 || to >= PLAN_SLOTS) return;
      var plan = getPlanFromDOM();
      var tmp = plan[from];
      plan[from] = plan[to];
      plan[to] = tmp;
      // Update selects
      var selects = section.querySelectorAll('[data-plan-select]');
      selects.forEach(function (sel, i) { sel.value = plan[i] || ''; });
      savePlan(plan);
      refreshButtons(plan);
    }

    // Wire selects
    section.querySelectorAll('[data-plan-select]').forEach(function (sel) {
      sel.addEventListener('change', onSelectChange);
    });

    // Wire up/down buttons
    section.querySelectorAll('[data-plan-up]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-plan-up'), 10);
        moveRow(i, i - 1);
      });
    });
    section.querySelectorAll('[data-plan-down]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-plan-down'), 10);
        moveRow(i, i + 1);
      });
    });

    // Wire reset
    var resetBtn = section.querySelector('[data-plan-reset]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var defaults = buildDefaultPlan(results);
        savePlan(defaults);
        var selects = section.querySelectorAll('[data-plan-select]');
        selects.forEach(function (sel, i) { sel.value = defaults[i] || ''; });
        refreshButtons(defaults);
      });
    }

    // Wire copy-list button
    var copyBtn = section.querySelector('[data-plan-copy]');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var plan = getPlanFromDOM().filter(function (x) { return x; });
        var text;
        if (plan.length === 0) {
          text = 'My BD Buddy priority list is empty.';
        } else {
          text =
            'My BDU department priority order:\n\n' +
            plan.map(function (dept, i) { return (i + 1) + '. ' + dept; }).join('\n') +
            '\n\nSubmit on the official portal:\n' +
            'https://studentportal.bdu.edu.et/DepartmentPlacment/DepartmentSelection';
        }
        var done = function () {
          var orig = copyBtn.innerHTML;
          copyBtn.innerHTML = esc(t('planner_copied', 'Copied!'));
          setTimeout(function () { copyBtn.innerHTML = orig; }, 1500);
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

    // Initial state
    refreshButtons(getPlanFromDOM());

    // Init styled dropdowns on the planner selects
    if (window.BDDropdown && typeof window.BDDropdown.init === 'function') {
      window.BDDropdown.init(section);
    }
  }

  // Include planned order in snapshot text
  function getPlanTextForSnapshot() {
    var plan = loadPlan();
    if (!plan) return '';
    var filled = plan.filter(function (x) { return x; });
    if (!filled.length) return '';
    var lines = [];
    lines.push('');
    lines.push('MY PLANNED ORDER (in BD Buddy, not yet submitted):');
    filled.forEach(function (dept, i) {
      lines.push('  ' + (i + 1) + '. ' + dept);
    });
    return lines.join('\n');
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
      html += renderStanding(placement, criteria);
      html += renderPriorityList(results);
      html += renderSimulator(criteria);
      html += renderActionGuide();
      html += renderPreSubmitChecklist();
      html += renderChoicePlanner(results, placement);
      html += renderSnapshotPanel(placement);

      container.innerHTML = html;

      wireSimulator(container);
      wireCopyButton(container, results);
      wireChecklist(container);
      wireSnapshot(container, data);
      wireChoicePlanner(container, results);

      this.rendered = true;
    }
  };
})();
