(function() {
  'use strict';

  // ============================================================
  // TAB SWITCHER (Departments / Rankings)
  // ============================================================
  function getTabFromHash() {
    const h = window.location.hash.replace('#', '');
    return (h === 'rankings') ? 'rankings' : 'departments';
  }

  function switchTab(tab) {
    // Update buttons
    document.querySelectorAll('.tab-switch-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    // Show/hide content
    const deptSection = document.getElementById('tab-departments');
    const rankSection = document.getElementById('tab-rankings');
    if (!deptSection || !rankSection) return;
    deptSection.style.display = (tab === 'departments') ? '' : 'none';
    rankSection.style.display = (tab === 'rankings') ? '' : 'none';

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

      // Leaderboard
      const leaderboardSection = document.getElementById('leaderboard-section');
      if (leaderboardSection) {
        if (allStudents.length > 0) {
          const myId = bio.studentId;
          const sorted = allStudents.slice().sort(function(a, b) {
            const aS = parseFloat(String(a.totalScore).replace('%', '')) || 0;
            const bS = parseFloat(String(b.totalScore).replace('%', '')) || 0;
            return bS - aS;
          });
          let html = '<div class="leaderboard-list">';
          sorted.slice(0, 10).forEach(function(s, i) {
            const isMe = String(s.studentId).toUpperCase() === String(myId).toUpperCase();
            html +=
              '<div class="leaderboard-row' + (isMe ? ' is-me' : '') + '">' +
                '<div class="leaderboard-rank">#' + (i + 1) + '</div>' +
                '<div class="leaderboard-name">' + esc(s.fullName || 'Student') + (isMe ? ' (You)' : '') + '</div>' +
                '<div class="leaderboard-score">' + esc(s.totalScore || '—') + '</div>' +
              '</div>';
          });
          html += '</div>';
          leaderboardSection.innerHTML =
            '<div class="rankings-section">' +
              '<div class="rankings-section-head">' +
                '<svg viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>' +
                '<span>Department Leaderboard</span>' +
              '</div>' + html +
            '</div>';
        } else {
          leaderboardSection.innerHTML =
            '<div class="rankings-section">' +
              '<div class="rankings-section-head">' +
                '<svg viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>' +
                '<span>Department Leaderboard</span>' +
              '</div>' +
              '<div class="rankings-empty">' +
                '<div class="rankings-empty-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>' +
                '<div class="rankings-empty-title">Not yet released</div>' +
                '<div class="rankings-empty-text">Full department rankings will appear once placement is released.</div>' +
              '</div>' +
            '</div>';
        }
      }

      // Placement priorities
      const prioritySection = document.getElementById('priority-section');
      if (prioritySection) {
        if (results.length > 0) {
          let html = '<div class="priority-list">';
          results.forEach(function(r) {
            const isSel = String(r.status).toLowerCase().indexOf('selected') !== -1;
            html +=
              '<div class="priority-card' + (isSel ? ' is-selected' : '') + '">' +
                '<div class="priority-num">' + esc(r.priority || '—') + '</div>' +
                '<div>' +
                  '<div class="priority-dept">' + esc(r.department || '—') + '</div>' +
                  '<div class="priority-score">Score: ' + esc(r.totalScore || '—') + '</div>' +
                '</div>' +
                '<div class="priority-status ' + (isSel ? 'selected' : 'rejected') + '">' + esc(r.status || '—') + '</div>' +
              '</div>';
          });
          html += '</div>';
          prioritySection.innerHTML =
            '<div class="rankings-section">' +
              '<div class="rankings-section-head">' +
                '<svg viewBox="0 0 24 24"><path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 2L2 7h20L12 2z"/></svg>' +
                '<span>Placement Priorities</span>' +
              '</div>' + html +
            '</div>';
        } else {
          prioritySection.innerHTML = '';
        }
      }

      // Criteria
      const criteriaSection = document.getElementById('criteria-section');
      if (criteriaSection) {
        if (criteria.length > 0) {
          let html = '<div class="criteria-list">';
          criteria.forEach(function(c) {
            html +=
              '<div class="criteria-row">' +
                '<div class="criteria-name">' + esc(c.name || '—') + '</div>' +
                '<div class="criteria-value">' + (c.scored && c.scored !== '---' ? esc(c.scored) : '—') + ' / ' + esc(c.maximum || '—') + '</div>' +
              '</div>';
          });
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

    refresh: function(btn) {
      const bio = this.data.biography || {};
      const username = sessionStorage.getItem('bdu_username') || bio.studentId;
      if (!username) {
        alert('Session expired. Please log in again.');
        window.location.replace('/');
        return;
      }
      // Open the modal instead of native prompt
      window.RankingModal.open(btn);
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
  // RANKING MODAL CONTROLLER
  // ============================================================
  window.RankingModal = {
    _btn: null,

    open: function(btn) {
      this._btn = btn;
      const modal = document.getElementById('ranking-modal');
      if (!modal) return;
      document.getElementById('rank-modal-title').textContent = 'Refresh Rankings';
      document.getElementById('rank-modal-sub').textContent = 'Re-enter your BDU password to load the latest data.';
      document.getElementById('rank-modal-input-wrap').style.display = '';
      document.getElementById('rank-modal-actions').style.display = '';
      document.getElementById('rank-modal-spinner').style.display = 'none';
      document.getElementById('rank-modal-error').classList.remove('show');
      document.getElementById('rank-modal-success').classList.remove('show');
      const pwd = document.getElementById('rank-modal-password');
      pwd.value = '';
      pwd.type = 'password';
      document.getElementById('rank-modal-eye-show').style.display = '';
      document.getElementById('rank-modal-eye-hide').style.display = 'none';
      modal.classList.add('show');
      setTimeout(function() { pwd.focus(); }, 150);
    },

    cancel: function() {
      const modal = document.getElementById('ranking-modal');
      if (modal) modal.classList.remove('show');
      this._btn = null;
    },

    togglePassword: function() {
      const pwd = document.getElementById('rank-modal-password');
      const show = document.getElementById('rank-modal-eye-show');
      const hide = document.getElementById('rank-modal-eye-hide');
      if (pwd.type === 'password') {
        pwd.type = 'text';
        show.style.display = 'none';
        hide.style.display = '';
      } else {
        pwd.type = 'password';
        show.style.display = '';
        hide.style.display = 'none';
      }
    },

    showError: function(msg) {
      const err = document.getElementById('rank-modal-error');
      err.textContent = msg;
      err.classList.add('show');
    },

    showSuccess: function(msg) {
      const ok = document.getElementById('rank-modal-success');
      ok.textContent = msg;
      ok.classList.add('show');
    },

    submit: async function() {
      const pwd = document.getElementById('rank-modal-password');
      const password = pwd.value;
      const errorBox = document.getElementById('rank-modal-error');
      errorBox.classList.remove('show');

      if (!password) {
        this.showError('Please enter your password.');
        pwd.focus();
        return;
      }

      const username = sessionStorage.getItem('bdu_username') ||
                       (window.RankingsController.data && window.RankingsController.data.biography && window.RankingsController.data.biography.studentId);

      if (!username) {
        this.showError('Session expired. Please log in again.');
        return;
      }

      document.getElementById('rank-modal-input-wrap').style.display = 'none';
      document.getElementById('rank-modal-actions').style.display = 'none';
      document.getElementById('rank-modal-spinner').style.display = '';
      document.getElementById('rank-modal-sub').textContent = 'Verifying your password and loading fresh data…';

      try {
        const res = await fetch('/api/rankings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username, password: password })
        });
        const data = await res.json();

        if (!data.success) {
          document.getElementById('rank-modal-input-wrap').style.display = '';
          document.getElementById('rank-modal-actions').style.display = '';
          document.getElementById('rank-modal-spinner').style.display = 'none';
          document.getElementById('rank-modal-sub').textContent = 'Re-enter your BDU password to load the latest data.';
          this.showError(data.error || 'Refresh failed. Please try again.');
          pwd.value = '';
          pwd.focus();
          return;
        }

        window.RankingsController.data.placement = {
          results: data.data.results,
          criteria: data.data.criteria,
          allStudents: data.data.allStudents
        };
        sessionStorage.setItem('bdu_student_data', JSON.stringify(window.RankingsController.data));
        window.RankingsController.rendered = false;
        window.RankingsController.render();

        document.getElementById('rank-modal-spinner').style.display = 'none';
        document.getElementById('rank-modal-title').textContent = 'Updated!';
        document.getElementById('rank-modal-sub').textContent = '';
        this.showSuccess('Rankings refreshed successfully.');

        setTimeout(function() { window.RankingModal.cancel(); }, 1200);

      } catch (err) {
        document.getElementById('rank-modal-input-wrap').style.display = '';
        document.getElementById('rank-modal-actions').style.display = '';
        document.getElementById('rank-modal-spinner').style.display = 'none';
        document.getElementById('rank-modal-sub').textContent = 'Re-enter your BDU password to load the latest data.';
        this.showError(err.message || 'Network error. Please try again.');
      }
    }
  };

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

  // Wire Enter key on password input
  document.addEventListener('DOMContentLoaded', function() {
    const pwd = document.getElementById('rank-modal-password');
    if (pwd) {
      pwd.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.RankingModal.submit();
        }
      });
    }
  });

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
