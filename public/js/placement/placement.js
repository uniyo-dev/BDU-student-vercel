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

  function renderCatalog(catalog) {
    var list = catalog.list;
    var totalSeats = list.reduce(function (s, d) { return s + (d.capacity || 0); }, 0);
    var maxCap = Math.max.apply(null, list.map(function (d) { return d.capacity || 1; }));

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

      html += '<div class="dept-catalog-row" data-dept-name="' + esc(d.dept.toLowerCase()) + '">';
      html += '<div class="dept-catalog-info">';
      html += '<div class="dept-catalog-name">' + esc(d.dept) + '</div>';
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
    html += renderCatalog(catalog);

    container.innerHTML = html;

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
