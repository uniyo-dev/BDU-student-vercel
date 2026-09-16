// Departments tab — Placement Score + Department Catalog
// 2026-09-15 rebuild: catalog view instead of applicant list
// Data sources:
//   1. placement.criteria[]       → score breakdown
//   2. placement.results[]        → submitted choice count + status
//   3. placement.selectionOptions → live BDU catalog
//   4. Hardcoded fallback         → 30 real departments from official portal

(function () {
  'use strict';

  var FALLBACK_CATALOG = [
    { dept: 'Accounting and Finance',                        capacity: 200 },
    { dept: 'Afan Oromo, Literature and Communication',      capacity: 30  },
    { dept: 'Amharic',                                       capacity: 40  },
    { dept: 'Amharic Education',                             capacity: 40  },
    { dept: 'Cinema and Theatre Arts',                       capacity: 30  },
    { dept: 'Civics and Ethical Studies',                    capacity: 40  },
    { dept: 'Civics and Ethical Studies Education',          capacity: 40  },
    { dept: 'Economics',                                     capacity: 150 },
    { dept: 'Educational Planning and Management',           capacity: 100 },
    { dept: 'English',                                       capacity: 80  },
    { dept: 'English Education',                             capacity: 40  },
    { dept: 'Gender and Development Studies',                capacity: 40  },
    { dept: 'Geography',                                     capacity: 100 },
    { dept: 'Geography Education',                           capacity: 40  },
    { dept: "Ge'ez Language and Literature",                 capacity: 40  },
    { dept: 'History',                                       capacity: 40  },
    { dept: 'History Education',                             capacity: 40  },
    { dept: 'Journalism & Communications',                   capacity: 80  },
    { dept: 'Logistics and Supply Chain Management',         capacity: 100 },
    { dept: 'Management',                                    capacity: 200 },
    { dept: 'Marketing Management',                          capacity: 150 },
    { dept: 'Music Arts',                                    capacity: 10  },
    { dept: 'Political Science and International Studies',   capacity: 100 },
    { dept: 'Psychology',                                    capacity: 100 },
    { dept: 'Public Administration and Development Management', capacity: 50 },
    { dept: 'Social Anthropology',                           capacity: 40  },
    { dept: 'Social Work',                                   capacity: 100 },
    { dept: 'Sociology',                                     capacity: 100 },
    { dept: 'Special Needs and Inclusive Education',         capacity: 50  },
    { dept: 'Tourism and Hotel Management',                  capacity: 40  }
  ];

  var DEADLINE = 'Sep 18, 2026';
  var CATALOG_VERIFIED = '2026-09-15';

  function esc(s) {
    return String(s == null ? '' : s)
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

  // Compute score from criteria (same logic as everywhere else)
  function computeScore(criteria) {
    var total = 0;
    var parts = { hs: 0, cgpa: 0, exam: 0 };
    (criteria || []).forEach(function (c) {
      var scored = numOrNull(c.scored);
      var max = numOrNull(c.maximum);
      var pct = numOrNull(c.percent);
      if (scored === null || max === null || max <= 0 || pct === null || scored > max) return;
      var contrib = (scored / max) * pct;
      total += contrib;

      var name = String(c.name || '').toLowerCase();
      if (name.indexOf('highschool') !== -1 || name.indexOf('university entrance') !== -1) parts.hs = contrib;
      else if (name.indexOf('cgpa') !== -1 || name.indexOf('current') !== -1) parts.cgpa = contrib;
      else if (name.indexOf('program') !== -1 || name.indexOf('enterance') !== -1 || name.indexOf('entrance') !== -1) parts.exam = contrib;
    });
    return { total: total, parts: parts };
  }

  // Build catalog: live BDU first, fallback otherwise
  function buildCatalog(selectionOptions) {
    if (selectionOptions && selectionOptions.length > 0) {
      var live = [];
      selectionOptions.forEach(function (o) {
        if (o && o.department) {
          live.push({
            dept: String(o.department).trim(),
            capacity: parseInt(o.capacity, 10) || 0,
            applied: (function () {
              var n = parseInt(o.applied, 10);
              return isNaN(n) ? null : n;
            })(),
            live: true
          });
        }
      });
      if (live.length > 0) {
        live.sort(function (a, b) { return a.dept.localeCompare(b.dept); });
        return { list: live, fromLive: true };
      }
    }
    return {
      list: FALLBACK_CATALOG.map(function (d) {
        return { dept: d.dept, capacity: d.capacity, applied: null, live: false };
      }),
      fromLive: false
    };
  }

  function renderScoreCard(score, results) {
    var status = (results[0] && results[0].status) || 'Not Decided';
    var submitted = results.length;

    var html = '<div class="dept-score-card">';

    html += '<div class="dept-score-hero">';
    html += '<div class="dept-score-value">' + score.total.toFixed(2) + '</div>';
    html += '<div class="dept-score-label">Your Placement Score</div>';
    html += '</div>';

    html += '<div class="dept-score-breakdown">';
    html += '<div class="dept-score-part"><span class="dept-score-part-value">' + score.parts.hs.toFixed(2) + '</span><span class="dept-score-part-label">HS Exam</span></div>';
    html += '<div class="dept-score-part"><span class="dept-score-part-value">' + score.parts.cgpa.toFixed(2) + '</span><span class="dept-score-part-label">CGPA</span></div>';
    html += '<div class="dept-score-part"><span class="dept-score-part-value">' + score.parts.exam.toFixed(2) + '</span><span class="dept-score-part-label">Exam</span></div>';
    html += '</div>';

    html += '<div class="dept-score-meta">';
    html += '<div class="dept-score-meta-item">';
    html += '<span class="dept-score-meta-value">' + submitted + '</span>';
    html += '<span class="dept-score-meta-label">choices</span>';
    html += '</div>';
    html += '<div class="dept-score-meta-item">';
    html += '<span class="dept-score-meta-value dept-score-meta-value--status">' + esc(status) + '</span>';
    html += '<span class="dept-score-meta-label">status</span>';
    html += '</div>';
    html += '<div class="dept-score-meta-item">';
    html += '<span class="dept-score-meta-value">' + DEADLINE + '</span>';
    html += '<span class="dept-score-meta-label">apply by</span>';
    html += '</div>';
    html += '</div>';

    html += '</div>';
    return html;
  }

  function renderCatalog(catalog, placement) {
    var list = catalog.list;
    var totalSeats = list.reduce(function (s, d) { return s + (d.capacity || 0); }, 0);
    var maxCap = Math.max.apply(null, list.map(function (d) { return d.capacity || 1; }));

    // Build priority map from the student's submitted results[]
    // Keys: department name (as BDU returns it), Values: priority number
    var priorityMap = {};
    var submittedResults = (placement && placement.results) || [];
    submittedResults.forEach(function (r) {
      if (r && r.department) {
        priorityMap[String(r.department).trim()] = r.priority;
      }
    });

    var html = '<div class="dept-catalog-section">';

    // Summary tiles
    html += '<div class="dept-catalog-summary">';
    html += '<div class="dept-catalog-summary-item"><span class="dept-catalog-summary-value">' + list.length + '</span><span class="dept-catalog-summary-label">departments</span></div>';
    html += '<div class="dept-catalog-summary-item"><span class="dept-catalog-summary-value">' + totalSeats + '</span><span class="dept-catalog-summary-label">total seats</span></div>';
    html += '<div class="dept-catalog-summary-item"><span class="dept-catalog-summary-value">' + DEADLINE + '</span><span class="dept-catalog-summary-label">apply by</span></div>';
    html += '</div>';

    // Search
    html += '<div class="dept-catalog-search">';
    html += '<input type="text" id="dept-catalog-search-input" class="dept-catalog-search-input" placeholder="Search departments..." />';
    html += '</div>';

    // Rows
    html += '<div class="dept-catalog-list" id="dept-catalog-list">';
    list.forEach(function (d) {
      var pct = Math.max(6, Math.round((d.capacity / maxCap) * 100));
      var tier = d.capacity >= 150 ? 'high' : (d.capacity >= 60 ? 'mid' : 'low');
      var appliedTxt = '';
      if (d.applied !== null && d.capacity > 0) {
        appliedTxt = '<span class="dept-catalog-applied">' + d.applied + ' applied</span>';
      }

      // Look up this department's priority from the student's results
      var prioRaw = priorityMap[d.dept] || priorityMap[String(d.dept).trim()];
      var prioNum = parseInt(prioRaw, 10);
      var isTop5 = !isNaN(prioNum) && prioNum >= 1 && prioNum <= 5;

      var rowClass = 'dept-catalog-row';
      if (isTop5) {
        if (prioNum === 1) rowClass += ' dept-catalog-row--top1';
        else if (prioNum === 2) rowClass += ' dept-catalog-row--top2';
        else if (prioNum === 3) rowClass += ' dept-catalog-row--top3';
        else rowClass += ' dept-catalog-row--top4-5';
      }

      var badge = '';
      if (isTop5) {
        var suffix = prioNum === 1 ? 'st' : prioNum === 2 ? 'nd' : prioNum === 3 ? 'rd' : 'th';
        badge = '<span class="dept-catalog-badge dept-catalog-badge--' + prioNum + '">' + prioNum + suffix + ' choice</span>';
      }

      html += '<div class="' + rowClass + '" data-dept-name="' + esc(d.dept.toLowerCase()) + '">';
      html += '<div class="dept-catalog-info">';
      html += '<div class="dept-catalog-name">' + esc(d.dept) + badge + '</div>';
      html += '<div class="dept-catalog-bar"><div class="dept-catalog-bar-fill dept-catalog-bar-fill--' + tier + '" style="width:' + pct + '%"></div></div>';
      html += '</div>';
      html += '<div class="dept-catalog-capacity">';
      html += '<span class="dept-catalog-capacity-value">' + d.capacity + '</span>';
      html += '<span class="dept-catalog-capacity-label">seats</span>';
      html += appliedTxt;
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';

    // Footnote
    var source = catalog.fromLive
      ? 'Live from BDU.'
      : 'Catalog verified ' + CATALOG_VERIFIED + ' from the official BDU portal.';

    html += '<div class="dept-catalog-note">' + esc(source) + ' Department selection opens on the official portal when BDU enables it for your account.</div>';

    html += '</div>';
    return html;
  }

  function wireSearch() {
    var input = document.getElementById('dept-catalog-search-input');
    var list = document.getElementById('dept-catalog-list');
    if (!input || !list) return;

    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      var rows = list.querySelectorAll('.dept-catalog-row');
      rows.forEach(function (row) {
        var name = row.getAttribute('data-dept-name') || '';
        row.classList.toggle('dept-catalog-row--hidden', q && name.indexOf(q) === -1);
      });
    });
  }

  function fetchPopularDepartments(callback) {
    var sid = sessionStorage.getItem('bd_session_id');
    if (!sid) { callback(null); return; }

    fetch('/api/placement/popular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.success) { callback(null); return; }
        callback(data.data || []);
      })
      .catch(function () { callback(null); });
  }

  function renderPopularSection(list) {
    if (!list || list.length < 3) return '';

    var top5 = list.slice(0, 5);
    var maxCount = top5[0].count || 1;

    var html = '<div class="dept-popular-section">';
    html += '<div class="dept-popular-head">';
    html += '<span class="dept-popular-head-icon">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>' +
            '</span>';
    html += '<span class="dept-popular-head-title">Most Popular</span>';
    html += '<span class="dept-popular-head-sub">by 1st choice applicants</span>';
    html += '</div>';

    html += '<div class="dept-popular-list">';
    top5.forEach(function (d, i) {
      var tier = i === 0 ? 'gold' : (i === 1 ? 'silver' : (i === 2 ? 'bronze' : 'standard'));
      var pct = maxCount > 0 ? Math.round((d.count / maxCount) * 100) : 0;

      html += '<div class="dept-popular-card dept-popular-card--' + tier + '">';
      html += '<div class="dept-popular-rank"><span class="dept-popular-rank-num">' + (i + 1) + '</span></div>';
      html += '<div class="dept-popular-body">';
      html += '<div class="dept-popular-name">' + esc(d.department) + '</div>';
      html += '<div class="dept-popular-meta">';
      html += '<span class="dept-popular-count">' + d.count + '</span> ranked 1st';
      if (d.capacity) {
        html += ' · <span class="dept-popular-cap">' + d.capacity + '</span> seats';
      }
      html += '</div>';
      html += '<div class="dept-popular-bar"><div class="dept-popular-bar-fill dept-popular-bar-fill--' + tier + '" style="width:' + pct + '%"></div></div>';
      html += '</div>';
      if (i === 0) {
        html += '<div class="dept-popular-hottest">Hottest</div>';
      }
      html += '</div>';
    });
    html += '</div>';
    html += '<div class="dept-popular-note">Ranked by how many students picked each department as 1st choice. Live from BDU.</div>';
    html += '</div>';
    return html;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!Auth.isLoggedIn()) { window.location.href = '/'; return; }
    var data = Auth.getStudentData();
    if (!data) { window.location.href = '/'; return; }

    var container = document.getElementById('depts-content');
    if (!container) return;

    var placement = data.placement || {};
    var results = placement.results || [];
    var criteria = placement.criteria || [];
    var selectionOptions = placement.selectionOptions || [];

    var score = computeScore(criteria);
    var catalog = buildCatalog(selectionOptions);

    var html = '';
    html += renderScoreCard(score, results);
    container.innerHTML = html;

    // Fetch popular departments asynchronously and prepend the section
    var catalogHtml = renderCatalog(catalog, placement);
    fetchPopularDepartments(function (popular) {
      var popularHtml = popular ? renderPopularSection(popular) : '';
      var finalHtml = renderScoreCard(score, results) + popularHtml + catalogHtml;
      container.innerHTML = finalHtml;
      wireSearch();
      window.BDU_DEPARTMENTS = catalog.list.map(function (d) { return d.dept; });
    });

    // Fallback — render everything except popular section immediately
    var initialHtml = renderScoreCard(score, results) + catalogHtml;
    container.innerHTML = initialHtml;

    wireSearch();

    // Keep stats bar showing a small summary
    var statsBar = document.getElementById('stats-bar');
    if (statsBar) {
      statsBar.innerHTML = catalog.list.length + ' departments · ' + (catalog.fromLive ? 'live data' : 'verified catalog');
    }

    // Clear pagination (not used in catalog view)
    var pagination = document.getElementById('pagination');
    if (pagination) pagination.innerHTML = '';

    // Clear dept-tabs (not used in catalog view)
    var tabsContainer = document.getElementById('dept-tabs');
    if (tabsContainer) tabsContainer.innerHTML = '';

    // Expose catalog for other modules
    window.BDU_DEPARTMENTS = catalog.list.map(function (d) { return d.dept; });
  });
})();
