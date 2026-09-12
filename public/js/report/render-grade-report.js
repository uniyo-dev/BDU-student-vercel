/**
 * BD Buddy — Grade Report Page Controller
 * Reads stored student data, renders HTML preview, handles PDF download.
 */

(function () {
  'use strict';

  const GradeReportApp = {
    reportData: null,
    currentSemesterIndex: 0,

    init() {
      // Auth guard
      if (typeof UI !== 'undefined' && typeof UI.redirectIfNotLoggedIn === 'function') {
        UI.redirectIfNotLoggedIn();
      } else if (sessionStorage.getItem('bdu_logged_in') !== 'true') {
        window.location.replace('/');
        return;
      }

      // Load data
      const saved = this.getStoredData();
      if (!saved) {
        window.location.replace('/');
        return;
      }

      this.reportData = saved;

      // Print date
      this.setPrintDate();

      // Render
      this.renderHero();
      this.renderSummary();
      this.renderCourses();
      this.renderVerification();

      // Bind download buttons (main + sticky)
      const btn = document.getElementById('btn-print');
      const btnSticky = document.getElementById('btn-print-sticky');
      if (btn) btn.addEventListener('click', () => this.downloadPDF(btn));
      if (btnSticky) btnSticky.addEventListener('click', () => this.downloadPDF(btnSticky));

      // Show sticky bar after scrolling past hero
      const stickyBar = document.getElementById('sticky-dl');
      const heroCard = document.querySelector('.hero-card');
      if (stickyBar && heroCard && 'IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            stickyBar.classList.toggle('show', !e.isIntersecting);
          });
        }, { threshold: 0, rootMargin: '-100px 0px 0px 0px' });
        obs.observe(heroCard);
      } else if (stickyBar) {
        stickyBar.classList.add('show');
      }
    },

    getStoredData() {
      if (typeof Store !== 'undefined' && typeof Store.getStudentData === 'function') {
        return Store.getStudentData();
      }
      const saved = sessionStorage.getItem('bdu_student_data');
      try { return saved ? JSON.parse(saved) : null; } catch { return null; }
    },

    setPrintDate() {
      const el = document.getElementById('print-date');
      if (!el) return;
      const now = new Date();
      el.textContent = now.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    },

    // ---------- Hero ----------
    renderHero() {
      const bio = this.reportData.biography || {};
      const reg = this.currentRegistration() || {};

      document.getElementById('student-name').textContent =
        bio.fullName || 'Student';
      document.getElementById('student-id').textContent =
        bio.studentId || '—';
      document.getElementById('pill-program').textContent =
        this.reportData.program || reg.program || '—';
      document.getElementById('pill-semester').textContent =
        'Semester ' + (reg.semester || '—');
      document.getElementById('pill-year').textContent =
        reg.acYear || '—';
    },

    currentRegistration() {
      const regs = this.reportData.registrations || [];
      return regs[this.currentSemesterIndex] || regs[0] || {};
    },

    currentCourses() {
      const reg = this.currentRegistration();
      if (!reg || !reg.semester) return [];
      const all = this.reportData.courses || [];
      const found = all.find(c => c.semester === reg.semester);
      return (found && found.courses) ? found.courses : [];
    },

    // ---------- Summary ----------
    renderSummary() {
      const reg = this.currentRegistration();
      const courses = this.currentCourses();
      const summary = this.reportData.summary || {};

      const totalCredits = courses.reduce(
        (s, c) => s + (parseFloat(c.credit) || 0), 0
      );

      document.getElementById('total-courses').textContent = courses.length;
      document.getElementById('total-credits').textContent = totalCredits;
      document.getElementById('academic-status').textContent =
        reg.status || summary.status || 'Pass';

      // SGPA / CGPA
      const sgpa = parseFloat(reg.sgpa) || 0;
      const cgpa = parseFloat(reg.cgpa) || 0;

      document.getElementById('sgpa-val').textContent = sgpa.toFixed(2);
      document.getElementById('cgpa-val').textContent = cgpa.toFixed(2);

      // Bars (0–4 scale → 0–100%)
      setTimeout(() => {
        document.getElementById('sgpa-bar').style.width =
          Math.min(100, (sgpa / 4) * 100) + '%';
        document.getElementById('cgpa-bar').style.width =
          Math.min(100, (cgpa / 4) * 100) + '%';
      }, 100);
    },

    // ---------- Courses ----------
    renderCourses() {
      const container = document.getElementById('course-list');
      const courses = this.currentCourses();

      if (!courses.length) {
        container.innerHTML =
          '<p class="course-empty-msg">No course records found.</p>';
        return;
      }

      const SHOW_INITIAL = 4;
      const hasMore = courses.length > SHOW_INITIAL;

      let html = '<table class="course-table"><thead><tr>' +
        '<th>Code</th>' +
        '<th>Course Title</th>' +
        '<th class="num">Cr</th>' +
        '<th class="num">Grade</th>' +
        '</tr></thead><tbody>';

      courses.forEach((c, idx) => {
        const gradeClass = 'grade-' + String(c.grade || '').replace('+', 'plus').replace('-', 'minus');
        const hidden = hasMore && idx >= SHOW_INITIAL;
        html += '<tr' + (hidden ? ' class="course-row-hidden" style="display:none"' : '') + '>' +
          '<td class="code">' + this.esc(c.code || '—') + '</td>' +
          '<td class="title">' + this.esc(c.title || '—') + '</td>' +
          '<td class="num">' + this.esc(c.credit || '0') + '</td>' +
          '<td class="num"><span class="grade-badge ' + gradeClass + '">' +
            this.esc(c.grade || '—') + '</span></td>' +
          '</tr>';
      });

      html += '</tbody></table>';

      if (hasMore) {
        const remaining = courses.length - SHOW_INITIAL;
        html += '<button type="button" class="course-toggle" id="course-toggle">' +
          '<span data-toggle-text>Show ' + remaining + ' more</span>' +
          '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>' +
          '</button>';
      }

      container.innerHTML = html;

      // Toggle handler
      const toggle = document.getElementById('course-toggle');
      if (toggle) {
        toggle.addEventListener('click', () => {
          const rows = document.querySelectorAll('.course-row-hidden');
          const open = toggle.classList.toggle('expanded');
          rows.forEach(r => r.style.display = open ? 'table-row' : 'none');
          const txt = toggle.querySelector('[data-toggle-text]');
          txt.textContent = open ? 'Show less' : ('Show ' + rows.length + ' more');
        });
      }
    },

    // ---------- Verification (QR + barcode) ----------
    renderVerification() {
      const bio = this.reportData.biography || {};
      const serial = this.getSerial();
      const verifyUrl = this.getVerifyUrl(bio.studentId);

      // Update URL + serial text immediately
      const urlEl = document.getElementById('verify-url');
      if (urlEl) urlEl.textContent = verifyUrl;

      const serialEl = document.getElementById('serial-text');
      if (serialEl) serialEl.textContent = serial;

      // Render QR + barcode (with retry until libraries are available)
      this.renderQRWithRetry(verifyUrl, serial, 0);
    },

    renderQRWithRetry(verifyUrl, serial, attempt) {
      const qrReady = typeof QRCode !== 'undefined';
      const bcReady = typeof JsBarcode !== 'undefined';

      // QR
      if (qrReady) {
        const qrContainer = document.getElementById('qr-code');
        if (qrContainer && !qrContainer.dataset.rendered) {
          qrContainer.innerHTML = '';
          const canvas = document.createElement('canvas');
          qrContainer.appendChild(canvas);
          QRCode.toCanvas(canvas, verifyUrl, {
            width: 200,
            margin: 1,
            color: { dark: '#0B0F19', light: '#FFFFFF' }
          }, (err) => {
            if (err) {
              console.error('QR render error:', err);
            } else {
              qrContainer.dataset.rendered = '1';
            }
          });
        }
      }

      // Barcode
      if (bcReady) {
        const bcSvg = document.getElementById('barcode-svg');
        if (bcSvg && !bcSvg.dataset.rendered) {
          try {
            JsBarcode(bcSvg, serial, {
              format: 'CODE128',
              displayValue: false,
              height: 60,
              width: 2,
              margin: 4,
              background: '#FFFFFF',
              lineColor: '#0B0F19',
            });
            bcSvg.dataset.rendered = '1';
          } catch (e) {
            console.warn('Barcode error:', e);
          }
        }
      }

      // Retry up to 20 times (2 seconds total) if libraries not ready yet
      if ((!qrReady || !bcReady) && attempt < 20) {
        setTimeout(() => this.renderQRWithRetry(verifyUrl, serial, attempt + 1), 100);
      } else if (attempt >= 20 && (!qrReady || !bcReady)) {
        console.error('QR/Barcode libraries failed to load after 2s');
      }
    },

    getSerial() {
      const bio = this.reportData.biography || {};
      const key = 'bdu_report_serial_' + (bio.studentId || 'UNKNOWN');
      let serial = localStorage.getItem(key);
      if (!serial) {
        const digits = (bio.studentId || '000000').replace(/\D/g, '') || '000000';
        const salt = Math.random().toString(36).substring(2, 7).toUpperCase();
        serial = 'BDU-GR-' + digits + '-' + salt;
        localStorage.setItem(key, serial);
      }
      return serial;
    },

    getVerifyUrl(studentId) {
      const base = 'https://bdu-portal.onrender.com/verify';
      const clean = (studentId || 'UNKNOWN').replace(/[^a-zA-Z0-9]/g, '');
      const name = (this.reportData.biography?.fullName || 'STUDENT')
        .replace(/\s+/g, '-').toUpperCase();
      return base + '/BDU-' + clean + '-' + name;
    },

    // ---------- PDF download ----------
    async downloadPDF(btn) {
      const loader = window.BDPdfLoader;
      if (!loader) {
        alert('Loader not loaded. Please refresh.');
        return;
      }

      // Build payload
      const bio = this.reportData.biography || {};
      const reg = this.currentRegistration();
      const courses = this.currentCourses().map(c => ({
        code: c.code, title: c.title, credit: c.credit,
        grade: c.grade, points: c.points, percentage: c.percentage,
        semester: reg.semester,
      }));
      const summary = {
        totalCredits: courses.reduce((s, c) => s + (parseFloat(c.credit) || 0), 0),
        cumulativeGPA: reg.cgpa || '—',
        sgpa: reg.sgpa || '—',
      };
      const registration = {
        program: this.reportData.program || '—',
        acYear: reg.acYear || '—',
        semester: reg.semester || '—',
        status: reg.status || 'Pass',
      };
      const serial = this.getSerial();
      const verifyUrl = this.getVerifyUrl(bio.studentId);
      const printMode = 'Semester ' + (reg.semester || 'I');

      const payload = {
        biography: bio,
        registration, courses, summary,
        serial, verifyUrl, printMode,
      };

      // Show modal (password step)
      loader.show();
      loader.onCancel = () => { /* nothing */ };

      loader.onConfirm = async (password) => {
        try {
          // Verify password
          const vRes = await fetch('/api/verify-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: sessionStorage.getItem('bdu_username') || bio.studentId,
              password,
            }),
          });
          const vData = await vRes.json();
          if (!vData.valid) {
            loader.showPasswordError('Incorrect password.');
            return;
          }

          // Progress step
          loader.goToProgress();
          loader.startStages();

          // Fetch PDF
          const pdfRes = await fetch('/api/generate-grade-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!pdfRes.ok) {
            const errText = await pdfRes.text();
            throw new Error('PDF generation failed: ' + errText);
          }

          const blob = await pdfRes.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'BDU-Grade-Report-' + (bio.studentId || 'Unknown') + '-' + serial + '.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          loader.success();

        } catch (err) {
          console.error(err);
          loader.error(err.message);
        }
      };
    },

    // ---------- Utilities ----------
    esc(str) {
      return String(str ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    GradeReportApp.init();
  });

  window.GradeReportApp = GradeReportApp;
})();
