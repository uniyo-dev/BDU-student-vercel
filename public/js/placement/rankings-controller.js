(function() {
  'use strict';

  // ============================================================
  // TAB SWITCHER (Departments / Rankings)
  // ============================================================
  function getTabFromHash() {
    const h = window.location.hash.replace('#', '');
    if (h === 'rankings') return 'rankings';
    if (h === 'priorities') return 'priorities';
    return 'departments';
  }

  function switchTab(tab) {
    // Update buttons
    document.querySelectorAll('.tab-switch-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    // Show/hide content (class-based; .hidden is defined in shared CSS)
    const deptSection = document.getElementById('tab-departments');
    const rankSection = document.getElementById('tab-rankings');
    const prioSection = document.getElementById('tab-priorities');
    if (!deptSection || !rankSection) return;
    deptSection.classList.toggle('hidden', tab !== 'departments');
    rankSection.classList.toggle('hidden', tab !== 'rankings');
    if (prioSection) {
      prioSection.classList.toggle('hidden', tab !== 'priorities');
    }

    // Update hash (without jumping)
    if (history.replaceState) {
      history.replaceState(null, '', '#' + tab);
    } else {
      window.location.hash = tab;
    }

    // Lazy render rankings on first show
    if (tab === 'rankings' && !window.RankingsController.rendered) {
      window.RankingsController.render();
    }

    // Lazy render priorities on first show
    if (tab === 'priorities' && window.PrioritiesController && !window.PrioritiesController.rendered) {
      window.PrioritiesController.render();
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    const btns = document.querySelectorAll('.tab-switch-btn');
    btns.forEach(function(b) {
      b.addEventListener('click', function() {
        switchTab(b.dataset.tab);
      });
    });
    // Restore from hash
    switchTab(getTabFromHash());
    // Listen for hash changes
    window.addEventListener('hashchange', function() {
      switchTab(getTabFromHash());
    });
  });

  // ============================================================
  // RANKINGS RENDERER
  // ============================================================
  // ============================================================
  // FILTER STATE + HELPERS
  // ============================================================
  var _pageSize = 250;
  var _currentPage = 1;

  var _filters = {
    department: '',
    priority: '',
    academicYear: '',
    semester: '',
    year: '',
    term: '',
    gender: '',
    applicationStatus: ''
  };

  function uniqueValues(arr, key) {
    var seen = {};
    var out = [];
    arr.forEach(function (item) {
      var v = item && item[key];
      if (v != null && String(v).trim() !== '' && !seen[v]) {
        seen[v] = 1;
        out.push(String(v));
      }
    });
    return out.sort();
  }

  function applyFilters(list) {
    return list.filter(function (s) {
      if (_filters.department && (s.department || '') !== _filters.department) return false;
      if (_filters.priority && String(s.priority || '') !== _filters.priority) return false;
      if (_filters.academicYear && (s.academicYear || '') !== _filters.academicYear) return false;
      if (_filters.semester && String(s.semester || '') !== _filters.semester) return false;
      if (_filters.year && String(s.year || '') !== _filters.year) return false;
      if (_filters.term && (s.term || '') !== _filters.term) return false;
      if (_filters.gender && (s.gender || '') !== _filters.gender) return false;
      if (_filters.applicationStatus && (s.applicationStatus || s.status || '') !== _filters.applicationStatus) return false;
      return true;
    });
  }

  function renderFilterPanel(allStudents, selectionOptions) {
    var section = document.getElementById('filter-section');
    if (!section) return;

    // When there are no students to filter, hide the filter panel.
    // Keep the info banner so students understand what's coming.
    if (!allStudents || allStudents.length === 0) {
      section.innerHTML =
        '<div class="rankings-info-banner">' +
          '<span class="rankings-info-banner-icon" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' +
          '</span>' +
          '<div class="rankings-info-banner-text">' +
            '<strong>How this works:</strong> once BDU publishes applicant data, you can filter by department, priority, academic year, semester, year, and term. Results are sorted by total score — highest first.' +
          '</div>' +
        '</div>' +
        '<div class="rankings-filter-empty">Filters will appear here once BDU publishes placement data. Tap <strong>Refresh Rankings</strong> after results are released.</div>';
      return;
    }

    // Build unique values for each filter
    var depts = [];
    if (selectionOptions && selectionOptions.length > 0) {
      selectionOptions.forEach(function (o) {
        if (o && o.department && depts.indexOf(o.department) === -1) depts.push(o.department);
      });
    }
    depts.sort();

    var priorities = uniqueValues(allStudents, 'priority');
    var acYears = uniqueValues(allStudents, 'academicYear');
    var semesters = uniqueValues(allStudents, 'semester');
    var years = uniqueValues(allStudents, 'year');
    var terms = uniqueValues(allStudents, 'term');
    var statuses = uniqueValues(allStudents, 'applicationStatus');
    if (statuses.length === 0) statuses = uniqueValues(allStudents, 'status');

    var html = '';

    // ─── Info banner (mirrors BDU's placement page text) ───
    html += '<div class="rankings-info-banner">';
    html += '<span class="rankings-info-banner-icon" aria-hidden="true">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' +
            '</span>';
    html += '<div class="rankings-info-banner-text">' +
              '<strong>How this works:</strong> filter by department, priority, academic year, semester, year, and term to see students who selected that combination. Results are sorted by total score — highest first.' +
            '</div>';
    html += '</div>';

    // ─── Filter panel ───
    html += '<div class="rankings-section rankings-filter-section">';
    html += '<div class="rankings-section-head">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>' +
              '<span>Filter Students</span>' +
            '</div>';

    html += '<div class="rankings-filter-grid">';

    // Department
    html += '<div class="rankings-filter-field">';
    html += '<label class="rankings-filter-label" for="filter-dept">Department</label>';
    html += '<select id="filter-dept" class="rankings-filter-select" data-filter="department" data-dropdown>';
    html += '<option value="">All departments</option>';
    depts.forEach(function (d) {
      html += '<option value="' + esc(d) + '"' + (_filters.department === d ? ' selected' : '') + '>' + esc(d) + '</option>';
    });
    html += '</select>';
    html += '</div>';

    // Priority
    html += '<div class="rankings-filter-field">';
    html += '<label class="rankings-filter-label" for="filter-priority">Priority</label>';
    html += '<select id="filter-priority" class="rankings-filter-select" data-filter="priority" data-dropdown>';
    html += '<option value="">Any priority</option>';
    priorities.forEach(function (p) {
      html += '<option value="' + esc(p) + '"' + (_filters.priority === p ? ' selected' : '') + '>' + esc(p) + '</option>';
    });
    html += '</select>';
    html += '</div>';

    // Academic Year
    html += '<div class="rankings-filter-field">';
    html += '<label class="rankings-filter-label" for="filter-acyear">Academic Year</label>';
    html += '<select id="filter-acyear" class="rankings-filter-select" data-filter="academicYear" data-dropdown>';
    html += '<option value="">Any academic year</option>';
    acYears.forEach(function (v) {
      html += '<option value="' + esc(v) + '"' + (_filters.academicYear === v ? ' selected' : '') + '>' + esc(v) + '</option>';
    });
    html += '</select>';
    html += '</div>';

    // Semester
    html += '<div class="rankings-filter-field">';
    html += '<label class="rankings-filter-label" for="filter-semester">Semester</label>';
    html += '<select id="filter-semester" class="rankings-filter-select" data-filter="semester" data-dropdown>';
    html += '<option value="">Any semester</option>';
    semesters.forEach(function (v) {
      html += '<option value="' + esc(v) + '"' + (_filters.semester === v ? ' selected' : '') + '>' + esc(v) + '</option>';
    });
    html += '</select>';
    html += '</div>';

    // Year
    html += '<div class="rankings-filter-field">';
    html += '<label class="rankings-filter-label" for="filter-year">Year</label>';
    html += '<select id="filter-year" class="rankings-filter-select" data-filter="year" data-dropdown>';
    html += '<option value="">Any year</option>';
    years.forEach(function (v) {
      html += '<option value="' + esc(v) + '"' + (_filters.year === v ? ' selected' : '') + '>' + esc(v) + '</option>';
    });
    html += '</select>';
    html += '</div>';

    // Academic Term
    html += '<div class="rankings-filter-field">';
    html += '<label class="rankings-filter-label" for="filter-term">Academic Term</label>';
    html += '<select id="filter-term" class="rankings-filter-select" data-filter="term" data-dropdown>';
    html += '<option value="">Any term</option>';
    terms.forEach(function (v) {
      html += '<option value="' + esc(v) + '"' + (_filters.term === v ? ' selected' : '') + '>' + esc(v) + '</option>';
    });
    html += '</select>';
    html += '</div>';

    // Gender
    html += '<div class="rankings-filter-field">';
    html += '<label class="rankings-filter-label" for="filter-gender">Gender</label>';
    html += '<select id="filter-gender" class="rankings-filter-select" data-filter="gender" data-dropdown>';
    html += '<option value="">Any</option>';
    html += '<option value="M"' + (_filters.gender === 'M' ? ' selected' : '') + '>Male</option>';
    html += '<option value="F"' + (_filters.gender === 'F' ? ' selected' : '') + '>Female</option>';
    html += '</select>';
    html += '</div>';

    // Application Status
    html += '<div class="rankings-filter-field">';
    html += '<label class="rankings-filter-label" for="filter-status">Application Status</label>';
    html += '<select id="filter-status" class="rankings-filter-select" data-filter="applicationStatus" data-dropdown>';
    html += '<option value="">Any status</option>';
    statuses.forEach(function (st) {
      html += '<option value="' + esc(st) + '"' + (_filters.applicationStatus === st ? ' selected' : '') + '>' + esc(st) + '</option>';
    });
    html += '</select>';
    html += '</div>';

    html += '</div>'; // grid

    html += '<div class="rankings-filter-actions">';
    html += '<button type="button" class="rankings-filter-btn rankings-filter-btn--primary" data-filter-apply>Apply Filters</button>';
    html += '<button type="button" class="rankings-filter-btn" data-filter-clear>Clear All</button>';
    html += '</div>';

    html += '</div>';
    section.innerHTML = html;
  }

  function renderLeaderboardTable(allStudents, bio) {
    var section = document.getElementById('leaderboard-section');
    if (!section) return;

    var head = '<div class="rankings-section-head">' +
                '<svg viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>' +
                '<span>Student Leaderboard</span>' +
              '</div>';

    // Empty state if no filter selected
    if (!_filters.department || !_filters.priority) {
      section.innerHTML = '<div class="rankings-section">' + head +
        '<div class="rankings-empty">' +
          '<div class="rankings-empty-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>' +
          '<div class="rankings-empty-title">Choose filters to see students</div>' +
          '<div class="rankings-empty-text">Select a department and priority above, then tap <strong>Apply Filters</strong>.</div>' +
        '</div>' +
      '</div>';
      return;
    }

    section.innerHTML = '<div class="rankings-section">' + head +
      '<div class="rankings-loading"><div class="refresh-spinner"></div> Loading students from BDU…</div>' +
    '</div>';

    fetchRanking();
  }

  function fetchRanking() {
    var section = document.getElementById('leaderboard-section');
    if (!section) return;

    var sid = sessionStorage.getItem('bd_session_id');
    if (!sid) {
      section.innerHTML = '<div class="rankings-section">' +
        '<div class="rankings-empty-inline">Session expired. Please log out and log back in.</div>' +
      '</div>';
      return;
    }

    var payload = {
      sessionId: sid,
      department: _filters.department,
      priority: _filters.priority,
      acYear: _filters.academicYear || '',
      semester: _filters.semester || '',
      year: _filters.year || '',
      term: _filters.term || ''
    };

    fetch('/api/placement/rankings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.success) {
          section.innerHTML = '<div class="rankings-section">' +
            '<div class="rankings-empty-inline">' + (data.error || 'Could not load rankings.') + '</div>' +
          '</div>';
          return;
        }

        // Store the fetched students for display
        _fetchedStudents = data.data.students || [];
        _fetchedTotal = data.data.total || 0;
        renderFetchedRows(data.data, section);
      })
      .catch(function (err) {
        section.innerHTML = '<div class="rankings-section">' +
          '<div class="rankings-empty-inline">Network error: ' + err.message + '</div>' +
        '</div>';
      });
  }

  function renderFetchedRows(data, section) {
    var bio = window.RankingsController.data.biography || {};
    var myId = String(bio.studentId || '').toUpperCase();

    var head = '<div class="rankings-section-head">' +
                '<svg viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>' +
                '<span>Student Leaderboard</span>' +
              '</div>';

    var students = data.students || [];
    if (students.length === 0) {
      section.innerHTML = '<div class="rankings-section">' + head +
        '<div class="rankings-empty-inline">No students found for this combination.</div>' +
      '</div>';
      return;
    }

    // Sort by totalScore descending (already sorted by BDU, but be safe)
    students.sort(function (a, b) {
      return (parseFloat(b.totalScore) || 0) - (parseFloat(a.totalScore) || 0);
    });

    var html = '<div class="rankings-section">' + head;
    html += '<div class="rankings-table-meta">' +
              students.length + ' students · ' +
              (data.resolvedCodes ? data.resolvedCodes.department || '' : '') +
            '</div>';

    html += '<div class="rankings-table-wrap">';
    html += '<table class="rankings-table">';
    html += '<thead><tr>';
    html += '<th class="rankings-th--num">#</th>';
    html += '<th>ID</th>';
    html += '<th class="rankings-th--num">HS Exam</th>';
    html += '<th class="rankings-th--num">Program</th>';
    html += '<th class="rankings-th--num">Total</th>';
    html += '<th>Gender</th>';
    html += '<th class="rankings-th--num">Prio</th>';
    html += '<th>Academic</th>';
    html += '<th>Application</th>';
    html += '<th>Placement</th>';
    html += '</tr></thead><tbody>';

    students.forEach(function (s, i) {
      var isMe = myId && String(s.studentId || '').toUpperCase() === myId;
      var statusClass = '';
      if (s.placementStatus === 'Selected') statusClass = 'rankings-status--selected';
      else if (s.placementStatus === 'Not Selected') statusClass = 'rankings-status--not-selected';
      else if (s.placementStatus === 'Not Decided') statusClass = 'rankings-status--pending';

      html += '<tr' + (isMe ? ' class="rankings-tr--me"' : '') + '>';
      html += '<td class="rankings-td--num">' + (i + 1) + (isMe ? ' <span class="rankings-you-chip">YOU</span>' : '') + '</td>';
      html += '<td class="rankings-td--mono">' + esc(s.studentId || '—') + '</td>';
      html += '<td class="rankings-td--num">' + esc(s.highschoolExam || '—') + '</td>';
      html += '<td class="rankings-td--num">' + esc(s.programExam || '—') + '</td>';
      html += '<td class="rankings-td--num rankings-td--bold">' + esc(s.totalScore || '—') + '</td>';
      html += '<td>' + esc(s.gender || '—') + '</td>';
      html += '<td class="rankings-td--num">' + esc(s.priority || '—') + '</td>';
      html += '<td>' + esc(s.academicStatus || '—') + '</td>';
      html += '<td>' + esc(s.applicationStatus || '—') + '</td>';
      html += '<td class="' + statusClass + '">' + esc(s.placementStatus || '—') + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table>';
    html += '</div>';
    html += '</div>';

    section.innerHTML = html;
  }


  window.RankingsController = {
    rendered: false,
    data: null,

    getData: function() {
      const saved = sessionStorage.getItem('bdu_student_data');
      try { return saved ? JSON.parse(saved) : null; } catch (e) { return null; }
    },

    render: function() {
      this.data = this.getData();
      if (!this.data) return;
      this.rendered = true;

      const bio = this.data.biography || {};
      const summary = this.data.summary || {};
      const placement = this.data.placement || {};
      const results = placement.results || [];
      const criteria = placement.criteria || [];
      const allStudents = placement.allStudents || [];

      // Position
      const positionSection = document.getElementById('position-section');
      if (positionSection) {
        if (allStudents.length > 0) {
          const myId = bio.studentId;
          const sorted = allStudents.slice().sort(function(a, b) {
            const aS = parseFloat(String(a.totalScore).replace('%', '')) || 0;
            const bS = parseFloat(String(b.totalScore).replace('%', '')) || 0;
            return bS - aS;
          });
          let myIdx = -1;
          for (let i = 0; i < sorted.length; i++) {
            if (String(sorted[i].studentId).toUpperCase() === String(myId).toUpperCase()) {
              myIdx = i; break;
            }
          }
          const myRank = myIdx >= 0 ? myIdx + 1 : null;
          const total = sorted.length;
          const pct = myRank ? Math.round((1 - myRank / total) * 100) : null;

          positionSection.innerHTML =
            '<div class="position-card">' +
              '<div class="position-rank">#' + (myRank || '—') + '</div>' +
              '<div class="position-label">Your Rank</div>' +
              '<div class="position-meta">' +
                '<div class="position-meta-item"><div class="position-meta-value">' + total + '</div><div class="position-meta-label">Students</div></div>' +
                '<div class="position-meta-item"><div class="position-meta-value">' + (pct !== null ? 'Top ' + pct + '%' : '—') + '</div><div class="position-meta-label">Percentile</div></div>' +
                '<div class="position-meta-item"><div class="position-meta-value">' + (summary.cumulativeGPA || '—') + '</div><div class="position-meta-label">CGPA</div></div>' +
              '</div>' +
            '</div>';
        } else {
          positionSection.innerHTML =
            '<div class="position-card">' +
              '<div class="position-rank">' + (summary.cumulativeGPA || '—') + '</div>' +
              '<div class="position-label">Your CGPA</div>' +
              '<div class="position-meta">' +
                '<div class="position-meta-item"><div class="position-meta-value">' + (summary.totalCredits || '—') + '</div><div class="position-meta-label">Credits</div></div>' +
                '<div class="position-meta-item"><div class="position-meta-value">' + ((this.data.registrations || []).length) + '</div><div class="position-meta-label">Semesters</div></div>' +
                '<div class="position-meta-item"><div class="position-meta-value">' + (summary.sgpa || '—') + '</div><div class="position-meta-label">Latest SGPA</div></div>' +
              '</div>' +
            '</div>';
        }
      }

      // Filter panel + Leaderboard table
      const selectionOptions = placement.selectionOptions || [];
      renderFilterPanel(allStudents, selectionOptions);
      renderLeaderboardTable(allStudents, bio);

      // Wire filter selects after render
      setTimeout(function () {
        var filterSection = document.getElementById('filter-section');
        if (!filterSection) return;
        filterSection.querySelectorAll('[data-filter]').forEach(function (sel) {
          sel.addEventListener('change', function () {
            var key = sel.getAttribute('data-filter');
            _filters[key] = sel.value || '';
          });
        });
        var applyBtn = filterSection.querySelector('[data-filter-apply]');
        var clearBtn = filterSection.querySelector('[data-filter-clear]');
        if (applyBtn) {
          applyBtn.addEventListener('click', function () {
            _currentPage = 1;
            fetchRanking();
          });
        }
        if (clearBtn) {
          clearBtn.addEventListener('click', function () {
            _filters = { department: '', priority: '', academicYear: '', semester: '', year: '', term: '', gender: '', applicationStatus: '' };
            _currentPage = 1;
            renderFilterPanel(allStudents, selectionOptions);
            renderLeaderboardTable(allStudents, bio);
          });
        }
        if (window.BDDropdown && typeof window.BDDropdown.init === 'function') {
          window.BDDropdown.init(filterSection);
        }
      }, 30);

      // Wire pagination buttons
      setTimeout(function () {
        var lb = document.getElementById('leaderboard-section');
        if (!lb) return;
        lb.querySelectorAll('[data-page-size]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            _pageSize = parseInt(btn.getAttribute('data-page-size'), 10) || 250;
            _currentPage = 1;
            renderLeaderboardTable(allStudents, bio);
          });
        });
        var prevBtn = lb.querySelector('[data-page-prev]');
        var nextBtn = lb.querySelector('[data-page-next]');
        if (prevBtn) {
          prevBtn.addEventListener('click', function () {
            if (_currentPage > 1) { _currentPage--; renderLeaderboardTable(allStudents, bio); }
          });
        }
        if (nextBtn) {
          nextBtn.addEventListener('click', function () {
            _currentPage++;
            renderLeaderboardTable(allStudents, bio);
          });
        }
      }, 30);

      // Criteria — split active (scored) from inactive (blank/"---")
      const criteriaSection = document.getElementById('criteria-section');
      if (criteriaSection) {
        if (criteria.length > 0) {
          var activeRows = [];
          var inactiveRows = [];
          criteria.forEach(function(c) {
            var isActive = c.scored && c.scored !== '---' && c.scored !== '—' && String(c.scored).trim() !== '';
            (isActive ? activeRows : inactiveRows).push(c);
          });

          let html = '<div class="criteria-list">';

          // Active criteria — full rows
          activeRows.forEach(function(c) {
            html +=
              '<div class="criteria-row">' +
                '<div class="criteria-name">' + esc(c.name || '—') + '</div>' +
                '<div class="criteria-value">' + esc(c.scored) + ' / ' + esc(c.maximum || '—') + '</div>' +
              '</div>';
          });

          // Inactive criteria — collapsed
          if (inactiveRows.length > 0) {
            html += '<details class="criteria-inactive">';
            html += '<summary class="criteria-inactive-summary">' +
                      '<span class="criteria-inactive-label">Bonus criteria</span>' +
                      '<span class="criteria-inactive-count">' + inactiveRows.length + ' inactive</span>' +
                    '</summary>';
            inactiveRows.forEach(function(c) {
              html +=
                '<div class="criteria-row criteria-row--muted">' +
                  '<div class="criteria-name">' + esc(c.name || '—') + '</div>' +
                  '<div class="criteria-value">— / ' + esc(c.maximum || '—') + '</div>' +
                '</div>';
            });
            html += '</details>';
          }

          html += '</div>';
          criteriaSection.innerHTML =
            '<div class="rankings-section">' +
              '<div class="rankings-section-head">' +
                '<svg viewBox="0 0 24 24"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>' +
                '<span>Your Criteria Breakdown</span>' +
              '</div>' + html +
            '</div>';
        } else {
          criteriaSection.innerHTML = '';
        }
      }
    },

    refresh: async function(btn) {
      const sid = sessionStorage.getItem('bd_session_id');
      if (!sid) {
        alert('Session expired. Please log out and log back in.');
        return;
      }

      const originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="refresh-spinner"></span> Refreshing...';

      try {
        const res = await fetch('/api/rankings/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid })
        });
        const data = await res.json();

        if (!data.success) {
          if (res.status === 401) {
            alert('Session expired. Please log out and log back in.');
          } else {
            alert(data.error || 'Refresh failed.');
          }
          btn.innerHTML = originalHtml;
          btn.disabled = false;
          return;
        }

        // Update stored data
        const current = this.getData();
        if (current && current.placement) {
          current.placement.results = data.data.results || [];
          current.placement.criteria = data.data.criteria || [];
          current.placement.allStudents = data.data.allStudents || [];
          current.placement.selectionOptions = data.data.selectionOptions || [];
          sessionStorage.setItem('bdu_student_data', JSON.stringify(current));
        }

        // Re-render
        this.data = current;
        this.rendered = false;
        this.render();

        btn.innerHTML = '✓ Refreshed';
        setTimeout(function () {
          btn.innerHTML = originalHtml;
          btn.disabled = false;
        }, 1200);
      } catch (err) {
        alert('Network error: ' + err.message);
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    }
  };

  // Hook refresh button
  document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('btn-refresh');
    if (btn) {
      btn.addEventListener('click', function() {
        window.RankingsController.refresh(btn);
      });
    }
  });

  // ============================================================
  // COPY CHOICES TO CLIPBOARD
  // ============================================================
  window.CopyChoices = {
    run: async function(btn) {
      try {
        const rc = window.RankingsController;
        if (!rc || !rc.data || !rc.data.placement || !rc.data.placement.results) {
          alert('No data loaded yet.');
          return;
        }
        const results = rc.data.placement.results;
        const lines = results.map(function(r, i) {
          const name = r.department || r.name || r.dept || 'Unknown';
          const cutoff = r.cutoff != null ? (' (cutoff ' + r.cutoff + ')') : '';
          return (i + 1) + '. ' + name + cutoff;
        });
        const header = 'My BD Buddy choice order — ' + new Date().toLocaleString() + '\n' +
                       'Reminder: final submission is on the official BDU portal.\n\n';
        const text = header + lines.join('\n');

        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }

        const original = btn.innerHTML;
        btn.innerHTML = '<span>✅ Copied!</span>';
        setTimeout(function() { btn.innerHTML = original; }, 1500);
      } catch (e) {
        alert('Copy failed: ' + e.message);
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('btn-copy-choices');
    if (btn) btn.addEventListener('click', function() { window.CopyChoices.run(btn); });
  });


  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
