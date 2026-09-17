// Dark Angels — Placement Simulation Controller
// Reads:  sessionStorage.bdu_student_data (current student)
//         POST /api/placement/rankings  (fresh allStudents on button click)
// Writes: nothing. Read-only. Does not touch existing session keys.
//
// Depends on: window.DarkAngelsSimulator (simulator.js, must load first)
//
// Behaviour:
//   - Countdown ticks every second to stop time (2026-09-18T23:59:59 +03:00).
//   - "Simulate Now" button fetches fresh data, runs the simulation, renders.
//   - After stop time: button disabled, banner "FINAL", last result frozen.
//   - No auto-refresh. No background polling. One request per click.

(function () {
  'use strict';

  // ─── Config ─────────────────────────────────────────────────
  var STOP_ISO = '2026-09-18T23:59:59+03:00';       // Ethiopian local time
  var SESSION_KEY_STUDENT = 'bdu_student_data';
  var SESSION_KEY_SID = 'bd_session_id';
  var RANKINGS_ENDPOINT = '/api/placement/rankings';

  // ─── DOM refs (resolved on DOMContentLoaded) ────────────────
  var els = {};

  function q(id) { return document.getElementById(id); }

  function resolveEls() {
    els.countdown = q('da-countdown');
    els.cdDays    = q('da-cd-days');
    els.cdHours   = q('da-cd-hours');
    els.cdMins    = q('da-cd-mins');
    els.cdSecs    = q('da-cd-secs');
    els.btnRun    = q('da-btn-run');
    els.btnReset  = q('da-btn-reset');
    els.status    = q('da-status');
    els.result    = q('da-result');
    els.method    = q('da-method');
    els.quotaToggle = q('da-quota');
  }

  // ─── Session helpers ────────────────────────────────────────
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

  // ─── Escaping ───────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─── Time helpers ───────────────────────────────────────────
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

  // ─── Status helper ──────────────────────────────────────────
  function setStatus(msg, kind) {
    if (!els.status) return;
    els.status.textContent = msg || '';
    els.status.className = 'da-status' + (kind ? ' da-status--' + kind : '');
  }

  // ─── Rendering ──────────────────────────────────────────────
  function renderHero(sim) {
    if (!els.result) return;

    var my = sim.myAssignment || null;
    var rankTxt = (sim.myRank != null) ? ('#' + sim.myRank + ' of ' + sim.totalApplicants) : ('— of ' + (sim.totalApplicants || '—'));
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
    html += '</div>';

    els.result.innerHTML = html;
  }

  function renderDepartments(sim) {
    var depts = sim.departments || [];
    if (!depts.length) return '';

    var myDept = sim.myAssignment ? sim.myAssignment.department : null;

    // Sort: my dept first, then by fill% desc, then alphabetical
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
        chip = '<span class="da-alt-chip da-alt-chip--yes">Seats left</span>';
      } else {
        chip = '<span class="da-alt-chip da-alt-chip--no">Full</span>';
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
      '<strong>Method:</strong> ' + esc(m.algorithm) + '<br>' +
      '<strong>Score source:</strong> ' + esc(m.scoreSource) + '<br>' +
      '<strong>Tie-break:</strong> ' + esc(m.tieBreak) + '<br>' +
      '<strong>Stop time:</strong> Sep 18, 2026 23:59 (Ethiopia time)';
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
        '<div class="da-empty-title">' + esc(msg || 'Nothing to show yet') + '</div>' +
        '<div>Tap Simulate Now to run the placement projection.</div>' +
      '</div>';
  }

  // ─── Silent auto-fetch on page load ─────────────────────────
  // Called once when the page opens. Fetches all-applicants in the
  // background without running a simulation — so when the user taps
  // Simulate Now, everything is already cached and instant.
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

    setStatus('Fetching applicants from BDU…');
    var t0 = Date.now();
    fetchAllApplicants(sid)
      .then(function (rows) {
        var secs = ((Date.now() - t0) / 1000).toFixed(1);
        setStatus('Ready — ' + rows.length + ' applicants fetched in ' + secs + 's.');
        renderEmpty('Ready to simulate');
      })
      .catch(function (err) {
        setStatus('Fetch failed: ' + (err.message || 'unknown') + ' — tap Simulate Now to retry.', 'error');
        renderEmpty('Could not load applicants');
      });
  }

  // ─── Simulation runner ──────────────────────────────────────
  // ─── Applicant cache (session-scoped) ───────────────────────
  var ALL_KEY = 'bdu_all_applicants';   // { at: ms, rows: [...] }
  var CACHE_TTL_MS = 15 * 60 * 1000;

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
    } catch (e) {
      // sessionStorage full or disabled — silently skip caching
    }
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

    // Frozen — do not fetch or re-simulate
    if (isFrozen()) {
      setStatus('Placement window closed. Results frozen.', 'frozen');
      if (els.btnRun) els.btnRun.disabled = true;
      var cachedRowsFrozen = readApplicantCache();
      if (cachedRowsFrozen && cachedRowsFrozen.length) {
        runSimWith(cachedRowsFrozen, results, selectionOptions, bio, true);
      } else {
        renderEmpty('Frozen — window closed');
      }
      return;
    }

    // Use cache unless caller forced a refresh
    var cached = forceRefresh ? null : readApplicantCache();
    if (cached && cached.length) {
      setStatus('Using cached applicants from ' + new Date(Date.now()).toLocaleTimeString() + '…');
      runSimWith(cached, results, selectionOptions, bio, false);
      return;
    }

    var sid = readSessionId();
    if (!sid) {
      setStatus('Session expired. Please log out and log back in.', 'error');
      renderEmpty('Session expired');
      return;
    }

    setStatus('Fetching applicants from BDU (first time takes ~6s)…');
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
      var suffix = frozen ? ' (frozen)' : '';
      setStatus('Simulated ' + allStudents.length + ' applicant rows \u00b7 ' +
                new Date().toLocaleTimeString() + suffix, '');
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

  // ─── Boot ───────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    resolveEls();

    // Countdown always ticks, even after freeze (shows 00:00:00).
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

    // Initial state
    if (isFrozen()) {
      if (els.btnRun) els.btnRun.disabled = true;
      setStatus('Placement window closed. Results frozen.', 'frozen');
      renderEmpty('Frozen — window closed');
    } else {
      renderEmpty('Preparing…');
      // autoFetchOnLoad: silently fetch fresh applicants in the background
      autoFetchOnLoad();
    }

    // Footer note: describe the actual data source
    if (els.method && !isFrozen()) {
      var modeNote = (els.quotaToggle && els.quotaToggle.checked)
        ? '<br><em>Mode: <strong>soft female quota (20% reserved, unused seats released)</strong>. Experimental.</em>'
        : '<br><em>Mode: score-order only. Tick the box above to apply BDU\'s 20% female quota model.</em>';
      els.method.innerHTML += '<br><br><em>Data source: BDU live via the BD Buddy server. ' +
        'Results are cached for 15 minutes.</em>' + modeNote;
    }
  });

  // Expose for debugging
  window.DarkAngels = {
    run: runSimulation,
    reset: resetView,
    isFrozen: isFrozen
  };
})();
