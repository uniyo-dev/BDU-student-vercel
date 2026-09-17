// Dark Angels — Placement Simulation Controller (v3.0 - Stable)
// Reads:  sessionStorage.bdu_student_data (current student)
//         POST /api/placement/all-applicants  (fresh allStudents on button click)
// Depends on: window.DarkAngelsSimulator (simulator.js)

(function () {
  'use strict';

  // ─── Configuration ──────────────────────────────────────────
  var STOP_ISO = '2026-09-18T23:59:59+03:00'; // Ethiopian local time
  var SESSION_KEY_STUDENT = 'bdu_student_data';
  var SESSION_KEY_SID = 'bd_session_id';
  var ALL_KEY = 'bdu_all_applicants';
  var CACHE_TTL_MS = 15 * 60 * 1000;

  // ─── State ──────────────────────────────────────────────────
  var _reorderedChoices = null;
  var _submittedChoices = null;

  // ─── DOM References ─────────────────────────────────────────
  var els = {};

  function q(id) { return document.getElementById(id); }

  function resolveEls() {
    els.countdown   = q('da-countdown');
    els.cdDays      = q('da-cd-days');
    els.cdHours     = q('da-cd-hours');
    els.cdMins      = q('da-cd-mins');
    els.cdSecs      = q('da-cd-secs');
    els.btnRun      = q('da-btn-run');
    els.btnReset    = q('da-btn-reset');
    els.status      = q('da-status');
    els.result      = q('da-result');
    els.method      = q('da-method');
    els.quotaToggle = q('da-quota');
  }

  function readStudent() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY_STUDENT);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function readSessionId() {
    return sessionStorage.getItem(SESSION_KEY_SID) || null;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getStopMs() {
    return new Date(STOP_ISO).getTime();
  }

  function isFrozen() {
    return Date.now() >= getStopMs();
  }

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function renderCountdown() {
    if (!els.cdDays) return;
    var now = Date.now();
    var stop = getStopMs();
    var diff = stop - now;

    if (diff <= 0) {
      els.cdDays.textContent = '00';
      els.cdHours.textContent = '00';
      els.cdMins.textContent = '00';
      els.cdSecs.textContent = '00';
      if (els.countdown) els.countdown.classList.add('da-countdown--frozen');
      return;
    }

    var totalSecs = Math.floor(diff / 1000);
    var days  = Math.floor(totalSecs / 86400);
    var hours = Math.floor((totalSecs % 86400) / 3600);
    var mins  = Math.floor((totalSecs % 3600) / 60);
    var secs  = totalSecs % 60;

    els.cdDays.textContent  = pad2(days);
    els.cdHours.textContent = pad2(hours);
    els.cdMins.textContent  = pad2(mins);
    els.cdSecs.textContent  = pad2(secs);
  }

  function startCountdown() {
    renderCountdown();
    setInterval(renderCountdown, 1000);
  }

  function setStatus(msg, kind) {
    if (!els.status) return;
    els.status.textContent = msg || '';
    els.status.className = 'da-status' + (kind ? ' da-status--' + kind : '');
  }

  function renderHero(sim) {
    if (!els.result) return;

    var my = sim.myAssignment || null;
    var rankTxt = (sim.myRank != null)
      ? ('#' + sim.myRank + ' of ' + sim.totalApplicants)
      : ('— of ' + (sim.totalApplicants || '—'));

    var scoreTxt = (my && my.score != null) ? Number(my.score).toFixed(2) : '—';
    var prioTxt = (my && my.priority != null) ? ('choice #' + my.priority) : '—';
    var deptTxt = (my && my.department) ? my.department : 'Not assigned';
    var deptClass = (my && my.department) ? 'da-destiny--assigned' : 'da-destiny--none';

    var html = '';
    html += '<div class="da-destiny ' + deptClass + '">';
    html += '  <div class="da-destiny-eyebrow">Your Destiny</div>';
    html += '  <div class="da-destiny-dept">' + esc(deptTxt) + '</div>';
    html += '  <div class="da-destiny-sub">if placement stopped right now</div>';
    html += '  <div class="da-destiny-meta">';
    html += '    <div class="da-destiny-meta-item"><span class="da-destiny-meta-value">' + esc(rankTxt) + '</span><span class="da-destiny-meta-label">Rank</span></div>';
    html += '    <div class="da-destiny-meta-item"><span class="da-destiny-meta-value">' + esc(scoreTxt) + '</span><span class="da-destiny-meta-label">Score</span></div>';
    html += '    <div class="da-destiny-meta-item"><span class="da-destiny-meta-value">' + esc(prioTxt) + '</span><span class="da-destiny-meta-label">Priority</span></div>';
    html += '  </div>';
    html += '  <div class="da-destiny-scope">Simulated against ' + esc(sim.totalApplicants) + ' applicants in your cohort</div>';
    html += '</div>';

    els.result.innerHTML = html;
  }

  function renderDepartments(sim) {
    var depts = sim.departments || [];
    if (!depts.length) return '';

    var myDept = sim.myAssignment ? sim.myAssignment.department : null;

    var sorted = depts.slice().sort(function (a, b) {
      if (a.department === myDept) return -1;
      if (b.department === myDept) return 1;
      if (b.fillPct !== a.fillPct) return b.fillPct - a.fillPct;
      return a.department.localeCompare(b.department);
    });

    var html = '<div class="da-section">';
    html += '<div class="da-section-head">Department Fill Status</div>';
    sorted.forEach(function (d) {
      var isMine = d.department === myDept;
      var fullClass = d.fillPct >= 100 ? ' da-dept-bar-fill--full' : '';
      html += '<div class="da-dept-row">';
      html +=   '<div class="da-dept-name">' + esc(d.department) +
                  (isMine ? '<span class="da-dept-mine">You</span>' : '') +
                '</div>';
      html +=   '<div class="da-dept-num">' + d.filled + ' / ' + d.capacity +
                  (d.cutoff != null ? ' · cutoff ' + d.cutoff.toFixed(2) : '') +
                '</div>';
      html +=   '<div class="da-dept-bar"><div class="da-dept-bar-fill' + fullClass +
                  '" style="width:' + Math.min(100, d.fillPct) + '%"></div></div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderAlternatives(sim) {
    var alts = sim.alternatives || [];
    if (!alts.length) return '';

    var html = '<div class="da-section">';
    html += '<div class="da-section-head">What If You Reordered Your Choices?</div>';
    alts.forEach(function (a) {
      var chip;
      if (a.reason === 'assigned') {
        chip = '<span class="da-alt-chip da-alt-chip--here">Your slot</span>';
      } else if (a.wouldAssign) {
        chip = '<span class="da-alt-chip da-alt-chip--yes">' + esc(a.reason) + '</span>';
      } else {
        chip = '<span class="da-alt-chip da-alt-chip--no">' + esc(a.reason) + '</span>';
      }
      html += '<div class="da-alt-row">';
      html +=   '<div>' +
                  '<div class="da-alt-dept">#' + esc(a.originalPriority) + ' ' + esc(a.department) + '</div>' +
                  '<div class="da-alt-reason">' + esc(a.reason) +
                    (a.cutoff != null ? ' · cutoff ' + a.cutoff.toFixed(2) : '') +
                  '</div>' +
                '</div>';
      html +=   chip;
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderMethod(sim) {
    if (!els.method) return;
    var m = sim.method || {};
    els.method.innerHTML =
      '<strong>Method:</strong> Real-time Strict Score-Merit engine. Deduplication safeguards active.<br>' +
      '<strong>Score source:</strong> ' + esc(m.scoreSource || 'BDU totalScore') + '<br>' +
      '<strong>Tie-break rule:</strong> ' + esc(m.tieBreak || 'Deterministic index') + '<br>' +
      '<strong>Cutoff window:</strong> ' + STOP_ISO;
  }

  function renderAll(sim) {
    if (!els.result) return;
    renderHero(sim);
    var extra = renderDepartments(sim) + renderAlternatives(sim);
    if (extra) els.result.insertAdjacentHTML('beforeend', extra);
    renderMethod(sim);
  }

  function renderEmpty(msg) {
    if (!els.result) return;
    els.result.innerHTML =
      '<div class="da-empty">' +
        '<div class="da-empty-title">' + esc(msg || 'Ready to simulate') + '</div>' +
        '<div>Tap Simulate Now to project your official placement destiny.</div>' +
      '</div>';
  }

  // ─── Cache Operations ───────────────────────────────────────
  function readApplicantCache() {
    try {
      var raw = sessionStorage.getItem(ALL_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || !obj.at || !Array.isArray(obj.rows)) return null;
      if (Date.now() - obj.at > CACHE_TTL_MS) return null;
      return obj.rows;
    } catch (e) {
      return null;
    }
  }

  function writeApplicantCache(rows) {
    try {
      sessionStorage.setItem(ALL_KEY, JSON.stringify({ at: Date.now(), rows: rows }));
    } catch (e) {}
  }

  function clearApplicantCache() {
    try { sessionStorage.removeItem(ALL_KEY); } catch (e) {}
  }

  function fetchAllApplicants(sid) {
    return fetch('/api/placement/all-applicants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || !data.success) {
          throw new Error((data && data.error) || 'Server returned an error.');
        }
        var rows = (data.data && data.data.allStudents) || [];
        if (!rows.length) {
          throw new Error('BDU returned no applicant rows.');
        }
        writeApplicantCache(rows);
        return rows;
      });
  }

  function autoFetchOnLoad() {
    var cached = readApplicantCache();
    if (cached && cached.length) {
      setStatus('Ready — ' + cached.length + ' applicants loaded.');
      renderEmpty('Ready to simulate');
      return;
    }

    var sid = readSessionId();
    if (!sid) {
      setStatus('Please log in to use Dark Angels.', 'error');
      renderEmpty('Not logged in');
      return;
    }

    setStatus('Fetching live applicant data from BDU…');
    fetchAllApplicants(sid)
      .then(function (rows) {
        setStatus('Ready — ' + rows.length + ' applicants fetched from BDU.');
        renderEmpty('Ready to simulate');
      })
      .catch(function (err) {
        setStatus('Fetch failed: ' + (err.message || 'unknown') + ' — tap Simulate Now to retry.', 'error');
        renderEmpty('Could not load applicants');
      });
  }

  // ─── Simulation Run ─────────────────────────────────────────
  function runSimulation(forceRefresh) {
    var student = readStudent();
    if (!student || !student.placement) {
      setStatus('No student data in session. Please log in again.', 'error');
      renderEmpty('Not logged in');
      return;
    }

    var placement = student.placement || {};
    var bio = student.biography || {};
    var results = placement.results || [];
    var selectionOptions = placement.selectionOptions || [];

    if (!results.length) {
      setStatus('You have not submitted any placement choices yet.', 'error');
      renderEmpty('No choices submitted');
      return;
    }

    if (isFrozen()) {
      setStatus('Placement window closed. Results frozen.', 'frozen');
      if (els.btnRun) els.btnRun.disabled = true;
      var cachedRows = readApplicantCache();
      if (cachedRows && cachedRows.length) {
        runSimWith(cachedRows, results, selectionOptions, bio, true);
      } else {
        renderEmpty('Frozen — window closed');
      }
      return;
    }

    var cached = forceRefresh ? null : readApplicantCache();
    if (cached && cached.length) {
      setStatus('Using cached applicants from ' + new Date().toLocaleTimeString() + '…');
      runSimWith(cached, results, selectionOptions, bio, false);
      return;
    }

    var sid = readSessionId();
    if (!sid) {
      setStatus('Session expired. Please log out and log back in.', 'error');
      renderEmpty('Session expired');
      return;
    }

    setStatus('Fetching all applicants from BDU…');
    if (els.btnRun) els.btnRun.disabled = true;

    fetchAllApplicants(sid)
      .then(function (rows) {
        runSimWith(rows, results, selectionOptions, bio, false);
      })
      .catch(function (err) {
        setStatus('Error: ' + (err.message || 'Unknown'), 'error');
      })
      .finally(function () {
        if (els.btnRun) els.btnRun.disabled = isFrozen();
      });
  }

  function runSimWith(allStudents, results, selectionOptions, bio, frozen) {
    try {
      var sim = window.DarkAngelsSimulator.simulate({
        allStudents: allStudents,
        selectionOptions: selectionOptions,
        myStudentId: bio.studentId,
        myResults: results,
        applyFemaleQuota: !!(els.quotaToggle && els.quotaToggle.checked)
      });
      renderAll(sim);
      if (!_submittedChoices) {
        _submittedChoices = getResultsChoices();
        _reorderedChoices = _submittedChoices.slice();
      }
      renderReorderPanel();
      var suffix = frozen ? ' (frozen)' : '';
      setStatus('Simulated ' + allStudents.length + ' applicant rows · ' + new Date().toLocaleTimeString() + suffix, '');
    } catch (e) {
      setStatus('Simulation error: ' + (e.message || 'unknown'), 'error');
    }
  }

  function resetView() {
    clearApplicantCache();
    if (els.result) els.result.innerHTML = '';
    if (els.method) els.method.innerHTML = '';
    setStatus('');
    renderEmpty('Ready to simulate');
  }

  // ─── Reorder Panel ──────────────────────────────────────────
  function getResultsChoices() {
    var student = readStudent();
    if (!student || !student.placement) return [];
    var results = student.placement.results || [];
    return results.slice().sort(function (a, b) {
      return (parseInt(a.priority, 10) || 999) - (parseInt(b.priority, 10) || 999);
    }).map(function (r) {
      return {
        department: String(r.department || '').trim(),
        priority: parseInt(r.priority, 10) || 0,
        totalScore: r.totalScore || ''
      };
    }).filter(function (c) { return c.department; });
  }

  function renderReorderPanel() {
    var list = document.getElementById('da-reorder-list');
    var section = document.getElementById('da-reorder-section');
    if (!list || !section) return;

    if (!_submittedChoices) {
      _submittedChoices = getResultsChoices();
      _reorderedChoices = _submittedChoices.slice();
    }

    if (!_reorderedChoices.length) {
      section.hidden = true;
      return;
    }

    var html = '';
    _reorderedChoices.forEach(function (c, i) {
      var upDisabled = (i === 0) ? ' disabled' : '';
      var downDisabled = (i === _reorderedChoices.length - 1) ? ' disabled' : '';
      html += '<div class="da-reorder-row" data-idx="' + i + '">';
      html += '  <div class="da-reorder-rank">' + (i + 1) + '</div>';
      html += '  <div class="da-reorder-dept">' + esc(c.department) + '</div>';
      html += '  <div class="da-reorder-arrows">';
      html += '    <button type="button" class="da-reorder-btn" data-move="up" data-idx="' + i + '"' + upDisabled + '>↑</button>';
      html += '    <button type="button" class="da-reorder-btn" data-move="down" data-idx="' + i + '"' + downDisabled + '>↓</button>';
      html += '  </div>';
      html += '</div>';
    });
    list.innerHTML = html;
    section.hidden = false;

    list.querySelectorAll('[data-move]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        var dir = btn.getAttribute('data-move');
        if (isNaN(idx)) return;
        var target = (dir === 'up') ? idx - 1 : idx + 1;
        if (target < 0 || target >= _reorderedChoices.length) return;
        var tmp = _reorderedChoices[idx];
        _reorderedChoices[idx] = _reorderedChoices[target];
        _reorderedChoices[target] = tmp;
        renderReorderPanel();
      });
    });
  }

  function getReorderedResults() {
    if (!_reorderedChoices) return [];
    return _reorderedChoices.map(function (c, i) {
      return {
        department: c.department,
        priority: i + 1,
        totalScore: c.totalScore,
        status: ''
      };
    });
  }

  function testReorderedOrder() {
    var student = readStudent();
    if (!student || !student.placement) {
      setStatus('No student data in session.', 'error');
      return;
    }

    var rows = readApplicantCache();
    if (!rows || !rows.length) {
      setStatus('Applicants not loaded yet. Tap Simulate Now first.', 'error');
      return;
    }

    var bio = student.biography || {};
    var placement = student.placement || {};
    var selectionOptions = placement.selectionOptions || [];

    try {
      var simNew = window.DarkAngelsSimulator.simulate({
        allStudents: rows,
        selectionOptions: selectionOptions,
        myStudentId: bio.studentId,
        myResults: getReorderedResults(),
        applyFemaleQuota: !!(els.quotaToggle && els.quotaToggle.checked)
      });

      var simCurrent = window.DarkAngelsSimulator.simulate({
        allStudents: rows,
        selectionOptions: selectionOptions,
        myStudentId: bio.studentId,
        myResults: placement.results || [],
        applyFemaleQuota: !!(els.quotaToggle && els.quotaToggle.checked)
      });

      renderComparison(simCurrent, simNew);
    } catch (e) {
      setStatus('Reorder test error: ' + (e.message || 'unknown'), 'error');
    }
  }

  function renderComparison(simCurrent, simNew) {
    var section = document.getElementById('da-compare-section');
    if (!section) return;

    var curDept = simCurrent.myAssignment ? simCurrent.myAssignment.department : null;
    var newDept = simNew.myAssignment ? simNew.myAssignment.department : null;

    var html = '<div class="da-compare-head">Comparison</div>';
    html += '<div class="da-compare-grid">';
    html += '  <div class="da-compare-cell' + (curDept ? '' : ' da-compare-cell--none') + '">';
    html += '    <div class="da-compare-label">Current Order</div>';
    html += '    <div class="da-compare-dept">' + esc(curDept || 'Not assigned') + '</div>';
    html += '  </div>';
    html += '  <div class="da-compare-cell' + (newDept ? '' : ' da-compare-cell--none') + '">';
    html += '    <div class="da-compare-label">This Order</div>';
    html += '    <div class="da-compare-dept">' + esc(newDept || 'Not assigned') + '</div>';
    html += '  </div>';
    html += '</div>';

    var deltaTxt, deltaClass;
    if (curDept === newDept) {
      deltaTxt = 'No change — same department either way.';
      deltaClass = ' da-compare-delta--same';
    } else if (!newDept) {
      deltaTxt = 'This order would leave you <strong>unassigned</strong>.';
      deltaClass = ' da-compare-delta--bad';
    } else if (!curDept) {
      deltaTxt = 'This order would <strong>assign you</strong> where you currently have nothing.';
      deltaClass = '';
    } else {
      var curIdx = _submittedChoices.findIndex(function (c) { return c.department === curDept; });
      var newIdx = _reorderedChoices.findIndex(function (c) { return c.department === newDept; });
      if (curIdx >= 0 && newIdx >= 0 && newIdx < curIdx) {
        deltaTxt = 'This order gets you a <strong>higher preference</strong> department.';
        deltaClass = '';
      } else if (curIdx >= 0 && newIdx >= 0 && newIdx > curIdx) {
        deltaTxt = 'This order lands you in a <strong>lower preference</strong> department.';
        deltaClass = ' da-compare-delta--bad';
      } else {
        deltaTxt = 'Assignment would change from <strong>' + esc(curDept) + '</strong> to <strong>' + esc(newDept) + '</strong>.';
        deltaClass = '';
      }
    }
    html += '<div class="da-compare-delta' + deltaClass + '">' + deltaTxt + '</div>';

    section.innerHTML = html;
    section.hidden = false;
  }

  function wireReorderPanel() {
    var testBtn = document.getElementById('da-reorder-test');
    var resetBtn = document.getElementById('da-reorder-reset');
    if (testBtn) {
      testBtn.addEventListener('click', testReorderedOrder);
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        _reorderedChoices = (_submittedChoices || []).slice();
        renderReorderPanel();
        var compareSection = document.getElementById('da-compare-section');
        if (compareSection) compareSection.hidden = true;
      });
    }
  }

  // ─── DOM Init ───────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    resolveEls();
    startCountdown();

    if (els.btnRun) {
      els.btnRun.addEventListener('click', function () { runSimulation(false); });
    }
    if (els.btnReset) {
      els.btnReset.addEventListener('click', resetView);
    }
    if (els.quotaToggle) {
      els.quotaToggle.addEventListener('change', function () {
        if (els.result && els.result.innerHTML) {
          runSimulation(false);
        }
      });
    }

    wireReorderPanel();

    if (isFrozen()) {
      if (els.btnRun) els.btnRun.disabled = true;
      setStatus('Placement window closed. Results frozen.', 'frozen');
      renderEmpty('Frozen — window closed');
    } else {
      renderEmpty('Preparing…');
      autoFetchOnLoad();
    }
  });

  window.DarkAngels = {
    run: runSimulation,
    reset: resetView,
    isFrozen: isFrozen
  };
})();
