/* ==========================================================================
   GRADE REPORT RENDERER & SECURITY CONTROLLER
   ========================================================================== */

const GradeReportApp = {
  verifyBaseUrl: 'https://bdu-portal.onrender.com/verify',

  // ============================================================
  // Print Date — Auto-fill for certificate header
  // ============================================================
  async downloadPDF(btn) {
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:-3px;display:inline-block;margin-right:4px;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Generating PDF...';

    try {
      const bio = this.reportData?.biography || {};
      const regs = this.reportData?.registrations || [];
      const reg = regs[this.currentSemesterIndex] || {};
      const allCourses = this.reportData?.courses || [];
      const semCourses = allCourses.find(c => c.semester === reg.semester);
      const courses = (semCourses?.courses || []).map(c => ({
        code: c.code,
        title: c.title,
        credit: c.credit,
        grade: c.grade,
      }));

      const summary = {
        totalCredits: courses.reduce((s, c) => s + (parseFloat(c.credit) || 0), 0),
        cumulativeGPA: reg.cgpa || '—',
        sgpa: reg.sgpa || '—',
      };

      const registration = {
        program: this.reportData?.program || '—',
        acYear: reg.acYear || '—',
        semester: reg.semester || '—',
        status: reg.status || 'Pass',
      };

      const serial = this.getStableSerial ? this.getStableSerial() : 'BDU-GR-UNKNOWN';
      const verifyUrl = this.getVerifyUrl ? this.getVerifyUrl() : '';

      const payload = {
        biography: bio,
        registration: registration,
        courses: courses,
        summary: summary,
        serial: serial,
        verifyUrl: verifyUrl,
      };

      const response = await fetch('/api/generate-grade-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error('PDF generation failed: ' + errText);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BDU-Grade-Report-${bio.studentId || 'Unknown'}-${serial}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:-3px;display:inline-block;margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg> Downloaded!';
      setTimeout(() => { btn.innerHTML = originalHTML; btn.disabled = false; }, 2000);
    } catch (err) {
      console.error(err);
      alert('PDF download failed: ' + err.message);
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  },

  setPrintDate() {
    const el = document.getElementById('print-date');
    if (!el) return;
    const now = new Date();
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    el.textContent = now.toLocaleDateString('en-US', options);
  },

  currentMode: 'single',
  currentSemesterIndex: 0,
  reportData: null,

  init() {
    this.setPrintDate();
    // Session Verification Redirect
    if (typeof UI !== 'undefined' && typeof UI.redirectIfNotLoggedIn === 'function') {
      UI.redirectIfNotLoggedIn();
    } else if (sessionStorage.getItem('bdu_logged_in') !== 'true') {
      window.location.replace('/');
      return;
    }

    const saved = this.getStoredData();
    if (!saved) {
      this.renderError('Session expired. Please log in to view the official grade report.');
      return;
    }

    this.reportData = saved;
    this.bindEvents();
    this.renderSemesterSelector();

    if ((this.reportData.registrations || []).length > 0) {
      this.renderSingleSemester(0);
    } else {
      this.renderError('No academic registrations found.');
    }
  },

  getStoredData() {
    if (typeof Store !== 'undefined' && typeof Store.getStudentData === 'function') {
      return Store.getStudentData();
    }
    const saved = sessionStorage.getItem('bdu_student_data');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      console.error('Data parsing error:', err);
      return null;
    }
  },

  bindEvents() {
    const btnPrint = document.getElementById('btn-print');
    const btnBack = document.getElementById('btn-back');
    const btnSingle = document.getElementById('option-single');
    const btnCumulative = document.getElementById('option-cumulative');

    if (btnPrint) btnPrint.addEventListener('click', () => this.downloadPDF(btnPrint));
    if (btnBack) btnBack.addEventListener('click', () => window.location.href = '/pages/results.html');
    if (btnSingle) btnSingle.addEventListener('click', () => this.switchMode('single'));
    if (btnCumulative) btnCumulative.addEventListener('click', () => this.switchMode('cumulative'));
  },

  escapeHTML(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  getStudentId() {
    return this.reportData?.biography?.studentId || 'UNKNOWN';
  },

  getStudentName() {
    return this.reportData?.biography?.fullName || 'Student';
  },

  getVerificationToken() {
    if (this.reportData?.verification_token) return this.reportData.verification_token;
    const cleanId = this.getStudentId().replace(/[^a-zA-Z0-9]/g, '');
    const cleanName = this.getStudentName().replace(/\s+/g, '-').toUpperCase();
    return `BDU-${cleanId}-${cleanName}`;
  },

  getVerifyUrl() {
    return `${this.verifyBaseUrl}/${encodeURIComponent(this.getVerificationToken())}`;
  },

  getStableSerial() {
    const studentId = this.getStudentId();
    const storedKey = `bdu_report_serial_${studentId}`;
    let serial = localStorage.getItem(storedKey);

    if (!serial) {
      const studentDigits = studentId.replace(/\D/g, '') || '000000';
      const randomSalt = Math.random().toString(36).substring(2, 7).toUpperCase();
      serial = `BDU-GR-${studentDigits}-${randomSalt}`;
      localStorage.setItem(storedKey, serial);
    }

    return serial;
  },

  switchMode(mode) {
    this.currentMode = mode;

    const btnSingle = document.getElementById('option-single');
    const btnCumulative = document.getElementById('option-cumulative');
    if (btnSingle) btnSingle.className = `option-btn ${mode === 'single' ? 'active' : ''}`;
    if (btnCumulative) btnCumulative.className = `option-btn ${mode === 'cumulative' ? 'active' : ''}`;

    const titleContainer = document.getElementById('report-mode-title');
    const selector = document.getElementById('semester-selector');

    if (mode === 'single') {
      if (selector) selector.style.display = 'flex';
      if (titleContainer) titleContainer.innerHTML = '<span>SEMESTER GRADE REPORT</span> <span class="security-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:-3px;display:inline-block;margin-right:4px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> SECURE</span>';
      this.renderSingleSemester(this.currentSemesterIndex);
    } else {
      if (selector) selector.style.display = 'none';
      if (titleContainer) titleContainer.innerHTML = '<span>CUMULATIVE GRADE REPORT</span> <span class="security-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:-3px;display:inline-block;margin-right:4px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> SECURE</span>';
      this.renderCumulative();
    }
  },

  renderSemesterSelector() {
    const regs = this.reportData?.registrations || [];
    const selector = document.getElementById('semester-selector');
    if (!selector) return;

    selector.innerHTML = regs.map((reg, i) => `
      <button class="sem-btn ${i === this.currentSemesterIndex ? 'active' : ''}" data-index="${i}" type="button">
        Semester ${this.escapeHTML(reg.semester)}
      </button>
    `).join('');

    selector.querySelectorAll('.sem-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        this.selectSemester(index);
      });
    });
  },

  selectSemester(index) {
    this.currentSemesterIndex = index;
    document.querySelectorAll('.sem-btn').forEach((btn, i) => {
      btn.className = `sem-btn ${i === index ? 'active' : ''}`;
    });
    this.renderSingleSemester(index);
  },

  renderSingleSemester(index) {
    const bio = this.reportData?.biography || {};
    const regs = this.reportData?.registrations || [];
    const reg = regs[index];

    if (!reg) {
      this.renderError('Semester information unavailable.');
      return;
    }

    const semCoursesObj = (this.reportData?.courses || []).find(c => String(c.semester) === String(reg.semester));
    const coursesList = semCoursesObj?.courses || [];

    document.getElementById('report-name').textContent = bio.fullName || '—';
    document.getElementById('report-id').textContent = bio.studentId || '—';
    document.getElementById('report-program').textContent = this.reportData?.program || 'Undergraduate Degree';
    document.getElementById('report-year').textContent = reg.acYear || '—';
    document.getElementById('report-cgpa').textContent = reg.cgpa || '0.00';
    document.getElementById('report-status').textContent = reg.status || 'Pass';

    let totalSemCredits = 0;
    coursesList.forEach(c => { totalSemCredits += Number(c.credit || 0); });
    document.getElementById('report-total-credits').textContent = totalSemCredits;

    let html = `
      <div class="semester-header">
        Semester ${this.escapeHTML(reg.semester)} — SGPA: ${this.escapeHTML(reg.sgpa || '0.00')} | CGPA: ${this.escapeHTML(reg.cgpa || '0.00')} | Status: ${this.escapeHTML(reg.status || 'Pass')}
      </div>
      <table class="grade-table">
        <thead>
          <tr>
            <th style="width:12%;">Code</th>
            <th style="width:45%;">Course Title</th>
            <th style="width:8%;">Cr</th>
            <th style="width:10%;">Grade</th>
            <th style="width:10%;">Points</th>
            <th style="width:15%;">Score %</th>
          </tr>
        </thead>
        <tbody>
    `;

    if (coursesList.length > 0) {
      coursesList.forEach(c => {
        html += `
          <tr>
            <td>${this.escapeHTML(c.code || 'CODE')}</td>
            <td>${this.escapeHTML(c.title || 'Course Title')}</td>
            <td>${this.escapeHTML(c.credit ?? '0')}</td>
            <td><strong>${this.escapeHTML(c.grade || '—')}</strong></td>
            <td>${this.escapeHTML(c.points ?? '0')}</td>
            <td>${c.percentage ? this.escapeHTML(c.percentage) + '%' : '—'}</td>
          </tr>
        `;
      });
    } else {
      html += `<tr><td colspan="6" style="text-align:center; padding:12px;">No course records registered for this semester.</td></tr>`;
    }

    html += `</tbody></table>`;
    document.getElementById('report-content').innerHTML = html;

    this.renderSecuritySuite();
  },

  renderCumulative() {
    const bio = this.reportData?.biography || {};
    const summary = this.reportData?.summary || {};
    const regs = this.reportData?.registrations || [];

    document.getElementById('report-name').textContent = bio.fullName || '—';
    document.getElementById('report-id').textContent = bio.studentId || '—';
    document.getElementById('report-program').textContent = this.reportData?.program || 'Undergraduate Degree';
    document.getElementById('report-year').textContent = regs.length > 0 ? `${regs[0].acYear} - ${regs[regs.length - 1].acYear}` : '—';
    document.getElementById('report-cgpa').textContent = summary.cumulativeGPA || '0.00';
    document.getElementById('report-status').textContent = `Completed ${summary.totalSemesters || 0} Semesters`;
    document.getElementById('report-total-credits').textContent = summary.totalCredits || '0';

    let html = '';

    regs.forEach(reg => {
      const semCoursesObj = (this.reportData?.courses || []).find(c => String(c.semester) === String(reg.semester));
      const coursesList = semCoursesObj?.courses || [];

      html += `
        <div class="semester-section">
          <div class="semester-header">
            Semester ${this.escapeHTML(reg.semester)} — SGPA: ${this.escapeHTML(reg.sgpa || '0.00')} | CGPA: ${this.escapeHTML(reg.cgpa || '0.00')} | ${this.escapeHTML(reg.status || 'Pass')}
          </div>
          <table class="grade-table">
            <thead>
              <tr>
                <th style="width:12%;">Code</th>
                <th style="width:45%;">Course Title</th>
                <th style="width:8%;">Cr</th>
                <th style="width:10%;">Grade</th>
                <th style="width:10%;">Points</th>
                <th style="width:15%;">Score %</th>
              </tr>
            </thead>
            <tbody>
      `;

      if (coursesList.length > 0) {
        coursesList.forEach(c => {
          html += `
            <tr>
              <td>${this.escapeHTML(c.code || 'CODE')}</td>
              <td>${this.escapeHTML(c.title || 'Course Title')}</td>
              <td>${this.escapeHTML(c.credit ?? '0')}</td>
              <td><strong>${this.escapeHTML(c.grade || '—')}</strong></td>
              <td>${this.escapeHTML(c.points ?? '0')}</td>
              <td>${c.percentage ? this.escapeHTML(c.percentage) + '%' : '—'}</td>
            </tr>
          `;
        });
      } else {
        html += `<tr><td colspan="6" style="text-align:center; padding:10px;">No course records available.</td></tr>`;
      }

      html += `</tbody></table></div>`;
    });

    const cgpaVal = parseFloat(summary.cumulativeGPA || 0);
    const standing = cgpaVal === 4.00 ? "DEAN'S LIST" : (cgpaVal >= 3.75 ? "EXCELLENT STANDING" : "GOOD STANDING");

    html += `
      <div class="summary-page" style="margin-top:14px;">
        <div style="text-align:center; font-size:11px; font-weight:bold; margin-bottom:6px;">CUMULATIVE ACADEMIC SUMMARY</div>
        <table class="grade-table">
          <tbody>
            <tr><td style="font-weight:bold; width:40%;">Total Semesters Completed:</td><td>${this.escapeHTML(summary.totalSemesters || '0')}</td></tr>
            <tr><td style="font-weight:bold;">Total Credits Earned:</td><td>${this.escapeHTML(summary.totalCredits || '0')}</td></tr>
            <tr><td style="font-weight:bold;">Final Cumulative GPA:</td><td><strong>${this.escapeHTML(summary.cumulativeGPA || '0.00')}</strong></td></tr>
            <tr><td style="font-weight:bold;">Academic Standing:</td><td><strong style="color:#065f46;">${standing}</strong></td></tr>
          </tbody>
        </table>
      </div>

      <div style="margin-top:10px; padding:6px; border:1px solid #cbd5e1; border-radius:4px;">
        <div style="font-weight:bold; font-size:8.5px; margin-bottom:2px;">OFFICIAL GRADING SYSTEM KEY:</div>
        <table class="grading-key">
          <tr>
            <td>A+ = 90-100% (4.0)</td>
            <td>A = 85-89% (4.0)</td>
            <td>B+ = 75-79% (3.5)</td>
            <td>B = 70-74% (3.0)</td>
          </tr>
          <tr>
            <td>C+ = 60-64% (2.5)</td>
            <td>C = 50-59% (2.0)</td>
            <td>D = 40-44% (1.0)</td>
            <td>F &lt; 40% (0.0)</td>
          </tr>
        </table>
      </div>
    `;

    document.getElementById('report-content').innerHTML = html;
    this.renderSecuritySuite();
  },

  renderSecuritySuite() {
    const serial = this.getStableSerial();
    const verifyUrl = this.getVerifyUrl();

    document.getElementById('serial-number').textContent = `Serial: ${serial}`;
    document.getElementById('hash-code').textContent = `Verify at: ${verifyUrl} | Document Serial: ${serial}`;
    document.getElementById('verify-subtext').textContent = `Scan to verify: ${verifyUrl}`;

    if (typeof JsBarcode !== 'undefined') {
      try {
        JsBarcode('#barcode-svg', serial, {
          format: 'CODE128',
          width: 1.3,
          height: 36,
          displayValue: true,
          fontSize: 9,
          margin: 0,
          background: 'transparent',
          lineColor: '#0f172a'
        });
      } catch (err) {
        console.error('Barcode generation error:', err);
      }
    }

    const qrContainer = document.getElementById('qr-code');
    if (!qrContainer) return;
    qrContainer.innerHTML = '';
    const canvas = document.createElement('canvas');
    qrContainer.appendChild(canvas);

    if (typeof QRCode !== 'undefined') {
      QRCode.toCanvas(
        canvas,
        verifyUrl,
        {
          width: 60,
          margin: 1,
          errorCorrectionLevel: 'H',
          color: { dark: '#0b1e33', light: '#ffffff' }
        },
        (err) => {
          if (err) console.error('QR error:', err);
        }
      );
    }
  },

  renderError(msg) {
    const content = document.getElementById('report-content');
    if (content) {
      content.innerHTML = `
        <div style="text-align:center; padding:30px; font-size:12px; color:#64748b;">
          ${this.escapeHTML(msg)}
        </div>
      `;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => GradeReportApp.init());