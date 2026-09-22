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

  // PRIORITIES-TRUTHFUL-FIX
  // BDU marks every row with ApplicationStatus="Selected" (eligible), so the
  // old code picked whichever row appeared first and displayed it as the
  // assignment. We now show the user's submitted #1 choice and add a note
  // pointing them to the official portal for the real result.
  function renderResultCard(results) {
    if (!results.length) {
      return '<div class="priorities-empty">' +
        '<div class="priorities-empty-icon">' + ICONS.lock + '</div>' +
        '<div class="priorities-empty-title">' + esc(t('no_placement_title', 'Placement not yet released')) + '</div>' +
        '<div class="priorities-empty-desc">' + esc(t('no_placement_desc', 'Your placement data will appear here once BDU publishes it.')) + '</div>' +
      '</div>';
    }

    // Sort by priority ascending and take the top choice
    var sorted = results.slice().sort(function (a, b) {
      return (parseInt(a.priority, 10) || 999) - (parseInt(b.priority, 10) || 999);
    });
    var topChoice = sorted[0] || null;
    var others = sorted.slice(1);

    var html = '<div class="priorities-result">';
    html += '<div class="priorities-result-head">' +
              '<span class="priorities-head-icon">' + ICONS.trophy + '</span>' +
              esc(t('result_head', 'Your Submitted First Choice')) +
            '</div>';

    if (topChoice) {
      html += '<div class="priorities-result-selected">';
      html += '<div class="priorities-badge priorities-badge--selected">' +
                '<span class="priorities-badge-icon">' + ICONS.trophy + '</span>' +
                esc(t('submitted', 'SUBMITTED')) + '</div>';
      html += '<div class="priorities-dept-name">' + esc(topChoice.department || '—') + '</div>';
      html += '<div class="priorities-meta">' +
                esc(t('priority_label', 'Priority')) + ': 1st' +
                ' · ' +
                esc(t('score_label', 'Score')) + ': ' + esc(topChoice.totalScore || '—') +
              '</div>';
      html += '<button class="priorities-copy-btn" data-copy-summary type="button">' +
                '<span class="priorities-copy-icon">' + ICONS.copy + '</span>' +
                esc(t('copy_summary', 'Copy my choices')) +
              '</button>';
      html += '</div>';

      html += '<div class="priorities-note">' +
                '<span class="priorities-note-icon">' + ICONS.info + '</span>' +
                '<span>' + esc(t('assignment_note',
                  'Your submitted first choice is shown above. BDU does not clearly indicate which department you were assigned to in the data we receive. Check the official portal for your actual placement.')) + '</span>' +
              '</div>';
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
      html += '<div class="priorities-others-head">' + esc(t('other_choices', 'Your other choices')) + '</div>';
      others.forEach(function (r) {
        var cat = statusCategory(r.status);
        html += '<div class="priorities-other-row priorities-other-row--' + cat + '">';
        html += '<span class="priorities-other-dept">#' + esc(r.priority || '—') + ' ' + esc(r.department || '—') + '</span>';
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

    // Split into active (contributed > 0) and inactive (contributed 0)
    var activeRows = [];
    var inactiveRows = [];
    bd.rows.forEach(function (row) {
      if (row.contribution > 0) activeRows.push(row);
      else inactiveRows.push(row);
    });

    var html = '<div class="priorities-section">';
    html += '<div class="priorities-section-head">' +
              '<span class="priorities-head-icon">' + ICONS.chart + '</span>' +
              esc(t('breakdown_head', 'Score Breakdown')) +
            '</div>';

    html += '<div class="priorities-criteria-list">';

    // Active criteria — full rows
    activeRows.forEach(function (row) {
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

    // Inactive criteria — collapsed into one toggle
    if (inactiveRows.length > 0) {
      html += '<details class="priorities-criteria-inactive">';
      html += '<summary class="priorities-criteria-inactive-summary">' +
                '<span class="priorities-criteria-inactive-label">Bonus criteria</span>' +
                '<span class="priorities-criteria-inactive-count">' + inactiveRows.length + ' inactive</span>' +
              '</summary>';
      inactiveRows.forEach(function (row) {
        html += '<div class="priorities-criteria-row priorities-criteria-row--muted">';
        html += '<div class="priorities-criteria-name">' + esc(row.name) + '</div>';
        html += '<div class="priorities-criteria-weight">' + (row.percent !== null ? esc(row.percent) + '%' : '—') + '</div>';
        html += '<div class="priorities-criteria-score">—</div>';
        html += '<div class="priorities-criteria-contrib">0.00</div>';
        html += '</div>';
      });
      html += '</details>';
    }

    // Total
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
    if (!results || results.length < 1) return '';

    // Sort by priority ascending
    var sorted = results.slice().sort(function (a, b) {
      return (parseInt(a.priority, 10) || 999) - (parseInt(b.priority, 10) || 999);
    });

    var html = '<div class="priorities-section">';
    html += '<div class="priorities-section-head">' +
              '<span class="priorities-head-icon">' + ICONS.target + '</span>' +
              esc(t('priority_head', 'Your Priority Choices')) +
            '</div>';

    html += '<div class="priorities-choice-list">';
    sorted.forEach(function (r) {
      var cat = statusCategory(r.status);
      var prioNum = parseInt(r.priority, 10);
      var isTop5 = !isNaN(prioNum) && prioNum >= 1 && prioNum <= 5;

      var rowClass = 'priorities-choice-row priorities-choice-row--' + cat;
      if (isTop5) {
        if (prioNum === 1) rowClass += ' priorities-choice-row--top1';
        else if (prioNum === 2) rowClass += ' priorities-choice-row--top2';
        else if (prioNum === 3) rowClass += ' priorities-choice-row--top3';
        else rowClass += ' priorities-choice-row--top4-5';
      }

      var badge = '';
      if (isTop5) {
        var suffix = prioNum === 1 ? 'st' : prioNum === 2 ? 'nd' : prioNum === 3 ? 'rd' : 'th';
        badge = '<span class="priorities-choice-badge priorities-choice-badge--' + prioNum + '">' + prioNum + suffix + ' choice</span>';
      }

      html += '<div class="' + rowClass + '">';
      html += '<div class="priorities-choice-num">' + esc(r.priority || '—') + '</div>';
      html += '<div class="priorities-choice-body">';
      html += '<div class="priorities-choice-dept">' + esc(r.department || '—') + badge + '</div>';
      html += '<div class="priorities-choice-score">' + esc(t('score_label', 'Score')) + ': ' + esc(r.totalScore || '—') + '</div>';
      html += '</div>';
      html += '<div class="priorities-choice-status priorities-choice-status--' + cat + '">' + esc(r.status || '—') + '</div>';
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
    // DEV PREVIEW: ?standing=demo generates sample data
    if (_DEV_STANDING_DEMO && (placement.allStudents || []).length === 0) {
      placement = { allStudents: [] };
      var _base = 67.76;
      for (var _i = 0; _i < 200; _i++) {
        placement.allStudents.push({ totalScore: (_base - 20 + Math.random() * 35).toFixed(2) });
      }
    }

    // Sum criteria contributions
    var yourScore = 0;
    var scored = 0;
    (criteria || []).forEach(function (c) {
      var sc = parseFloat(c.scored);
      var mx = parseFloat(c.maximum);
      var pc = parseFloat(c.percent);
      if (!isNaN(sc) && !isNaN(mx) && mx > 0 && !isNaN(pc) && sc <= mx) {
        yourScore += (sc / mx) * pc;
        scored++;
      }
    });

    var st = computeStanding(placement, yourScore);
    var results = (placement && placement.results) || [];
    var submitted = results.length;

    var html = '<div class="priorities-section priorities-standing-section">';
    html += '<div class="priorities-section-head">' +
              '<span class="priorities-head-icon">' + ICONS.chart + '</span>' +
              esc(t('standing_head', 'Where You Stand')) +
            '</div>';

    // ─── STATE A: Have BDU data → show rank ───
    if (st) {
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

    // ─── STATE B: No BDU applicant data yet → show what we DO know ───

    // Score hero
    html += '<div class="priorities-standing-hero priorities-standing-hero--waiting">';
    html += '<div class="priorities-standing-rank">' + yourScore.toFixed(2) + '</div>';
    html += '<div class="priorities-standing-sub">YOUR PLACEMENT SCORE</div>';
    html += '</div>';

    // Submission summary
    if (submitted > 0) {
      html += '<div class="priorities-standing-row priorities-standing-row--single">';
      html += '<div class="priorities-standing-cell"><div class="priorities-standing-cell-value">' + submitted + '</div><div class="priorities-standing-cell-label">choices submitted</div></div>';
      var status = (results[0] || {}).status || 'Not Decided';
      html += '<div class="priorities-standing-cell"><div class="priorities-standing-cell-value priorities-standing-cell-value--sm">' + esc(status) + '</div><div class="priorities-standing-cell-label">BDU status</div></div>';
      html += '</div>';
    }

    // What we're waiting for
    html += '<div class="priorities-standing-waiting">';
    html += '<div class="priorities-standing-waiting-title">' +
              '<span class="priorities-standing-waiting-icon">' + ICONS.info + '</span>' +
              esc(t('standing_waiting_title', 'Waiting for BDU to publish')) +
            '</div>';
    html += '<ul class="priorities-standing-waiting-list">';
    html += '<li>' + esc(t('standing_waiting_1', "Other students' scores")) + '</li>';
    html += '<li>' + esc(t('standing_waiting_2', 'Cutoffs per department')) + '</li>';
    html += '<li>' + esc(t('standing_waiting_3', 'Final placement decisions')) + '</li>';
    html += '</ul>';
    html += '<div class="priorities-standing-waiting-note">' +
              esc(t('standing_waiting_note', 'Your rank and percentile will appear here automatically when BDU releases the data.')) +
            '</div>';
    html += '</div>';

    html += '<div class="priorities-standing-note priorities-standing-note--link">' +
              esc(t('standing_check_portal', 'Check the official portal:')) +
              ' <a href="https://studentportal.bdu.edu.et" target="_blank" rel="noopener noreferrer">studentportal.bdu.edu.et</a>' +
            '</div>';

    html += '</div>';
    return html;
  }

  // ===== M5 Patch C: Department Catalog =====
  // Real departments + intake capacity from BDU's official page.
  // Captured Sep 15, 2026. Update when BDU publishes a new catalog.
  // Order: alphabetical by department name.

  var DEPARTMENT_CATALOG_VERIFIED = '2026-09-15';
  var DEPARTMENT_CATALOG_DEADLINE = 'Sep 18, 2026';

  var DEPARTMENT_CATALOG = [
    { dept: 'Accounting and Finance',                        capacity: 200 },
    { dept: 'Afan Oromo, Literature and Communication',      capacity: 30  },
    { dept: 'Amharic',                                        capacity: 40  },
    { dept: 'Amharic Education',                              capacity: 40  },
    { dept: 'Cinema and Theatre Arts',                        capacity: 30  },
    { dept: 'Civics and Ethical Studies',                     capacity: 40  },
    { dept: 'Civics and Ethical Studies Education',           capacity: 40  },
    { dept: 'Economics',                                      capacity: 150 },
    { dept: 'Educational Planning and Management',            capacity: 100 },
    { dept: 'English',                                        capacity: 80  },
    { dept: 'English Education',                              capacity: 40  },
    { dept: 'Gender and Development Studies',                 capacity: 40  },
    { dept: 'Geography',                                      capacity: 100 },
    { dept: 'Geography Education',                            capacity: 40  },
    { dept: "Ge'ez Language and Literature",                  capacity: 40  },
    { dept: 'History',                                        capacity: 40  },
    { dept: 'History Education',                              capacity: 40  },
    { dept: 'Journalism & Communications',                    capacity: 80  },
    { dept: 'Logistics and Supply Chain Management',          capacity: 100 },
    { dept: 'Management',                                     capacity: 200 },
    { dept: 'Marketing Management',                           capacity: 150 },
    { dept: 'Music Arts',                                     capacity: 10  },
    { dept: 'Political Science and International Studies',    capacity: 100 },
    { dept: 'Psychology',                                     capacity: 100 },
    { dept: 'Public Administration and Development Management', capacity: 50 },
    { dept: 'Social Anthropology',                            capacity: 40  },
    { dept: 'Social Work',                                    capacity: 100 },
    { dept: 'Sociology',                                      capacity: 100 },
    { dept: 'Special Needs and Inclusive Education',          capacity: 50  },
    { dept: 'Tourism and Hotel Management',                   capacity: 40  }
  ];

  function renderDepartmentCatalog(placement) {
    var liveOptions = (placement && placement.selectionOptions) || [];
    var catalog = [];

    if (liveOptions.length > 0) {
      liveOptions.forEach(function (o) {
        if (o && o.department) {
          catalog.push({ dept: o.department, capacity: parseInt(o.capacity, 10) || 0 });
        }
      });
      catalog.sort(function (a, b) { return a.dept.localeCompare(b.dept); });
    } else if (typeof DEPARTMENT_CATALOG !== 'undefined' && DEPARTMENT_CATALOG.length) {
      catalog = DEPARTMENT_CATALOG.slice();
    }

    if (!catalog.length) return '';

    // Priority map from student's own submitted results
    var priorityMap = {};
    var submittedResults = (placement && placement.results) || [];
    submittedResults.forEach(function (r) {
      if (r && r.department) {
        priorityMap[String(r.department).trim()] = r.priority;
      }
    });

    var totalSeats = catalog.reduce(function (sum, d) {
      return sum + (d.capacity || 0);
    }, 0);

    var maxCapacity = Math.max.apply(null, catalog.map(function (d) { return d.capacity || 0; }));

    var html = '<div class="priorities-section priorities-catalog-section">';
    html += '<div class="priorities-section-head">' +
              '<span class="priorities-head-icon">' + ICONS.target + '</span>' +
              esc(t('catalog_head', 'Department Catalog')) +
            '</div>';

    html += '<div class="priorities-catalog-meta">' +
              '<div class="priorities-catalog-meta-item">' +
                '<span class="priorities-catalog-meta-value">' + catalog.length + '</span>' +
                '<span class="priorities-catalog-meta-label">departments</span>' +
              '</div>' +
              '<div class="priorities-catalog-meta-item">' +
                '<span class="priorities-catalog-meta-value">' + totalSeats + '</span>' +
                '<span class="priorities-catalog-meta-label">total seats</span>' +
              '</div>' +
              '<div class="priorities-catalog-meta-item">' +
                '<span class="priorities-catalog-meta-value">' + esc((typeof DEPARTMENT_CATALOG_DEADLINE !== 'undefined' && DEPARTMENT_CATALOG_DEADLINE) || 'Sep 18, 2026') + '</span>' +
                '<span class="priorities-catalog-meta-label">apply by</span>' +
              '</div>' +
            '</div>';

    html += '<div class="priorities-catalog-table">';
    catalog.forEach(function (d) {
      var pct = maxCapacity > 0 ? Math.max(6, Math.round((d.capacity / maxCapacity) * 100)) : 6;
      var tier = d.capacity >= 150 ? 'high' : (d.capacity >= 60 ? 'mid' : 'low');

      var prioRaw = priorityMap[d.dept];
      var prioNum = parseInt(prioRaw, 10);
      var isTop5 = !isNaN(prioNum) && prioNum >= 1 && prioNum <= 5;

      var rowClass = 'priorities-catalog-row';
      if (isTop5) {
        if (prioNum === 1) rowClass += ' priorities-catalog-row--top1';
        else if (prioNum === 2) rowClass += ' priorities-catalog-row--top2';
        else if (prioNum === 3) rowClass += ' priorities-catalog-row--top3';
        else rowClass += ' priorities-catalog-row--top4-5';
      }

      var badge = '';
      if (isTop5) {
        var suffix = prioNum === 1 ? 'st' : prioNum === 2 ? 'nd' : prioNum === 3 ? 'rd' : 'th';
        badge = '<span class="priorities-catalog-badge priorities-catalog-badge--' + prioNum + '">' + prioNum + suffix + ' choice</span>';
      }

      html += '<div class="' + rowClass + '">';
      html += '<div class="priorities-catalog-cell priorities-catalog-cell--name">' + esc(d.dept) + badge + '</div>';
      html += '<div class="priorities-catalog-cell priorities-catalog-cell--num">' + d.capacity + '</div>';
      html += '<div class="priorities-catalog-cell priorities-catalog-cell--bar"><div class="priorities-catalog-bar"><div class="priorities-catalog-bar-fill priorities-catalog-bar-fill--' + tier + '" style="width:' + pct + '%"></div></div></div>';
      html += '</div>';
    });
    html += '</div>';

    html += '<div class="priorities-catalog-note">' +
              esc(t('catalog_note', 'Departments you ranked in your top 5 are highlighted. Submit on the official portal at studentportal.bdu.edu.et.')) +
            '</div>';

    html += '</div>';
    return html;
  }

  // Real department list.
  // Primary source: unique departments from placement.allStudents[] (BDU's own data).
  // Fallback: the 30 departments from the official BDU portal screenshot.




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



  // Include planned order in snapshot text

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

      container.innerHTML = html;

      wireCopyButton(container, results);

      this.rendered = true;
    }
  };
})();
