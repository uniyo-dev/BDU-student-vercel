// Results Renderer
const ResultsRenderer = {
  currentSemester: 0,

  init() {
    UI.redirectIfNotLoggedIn();
    this.render();
  },

  render() {
    const data = Store.getStudentData();
    if (!data?.registrations?.length) {
      document.getElementById('results-content').innerHTML = 
        '<div class="text-center" style="padding:40px;color:#4a637f;">No results available</div>';
      return;
    }
    
    this.renderToggle(data.registrations);
    this.renderSemester(data.registrations[this.currentSemester], data);
  },

  renderToggle(registrations) {
    const toggle = document.getElementById('semester-toggle');
    let html = '';
    
    registrations.forEach((reg, i) => {
      html += `
        <span class="sem ${i === this.currentSemester ? 'active' : ''}" onclick="ResultsRenderer.switchSemester(${i})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:-3px;display:inline-block;"><polyline points="20 6 9 17 4 12"/></svg> Semester ${reg.semester}
        </span>
      `;
    });
    
    toggle.innerHTML = html;
  },

  switchSemester(index) {
    this.currentSemester = index;
    this.render();
  },

  renderSemester(reg, data) {
    const container = document.getElementById('results-content');
    const semClass = this.currentSemester === 0 ? 'semester-1' : 'semester-2';
    const semCourses = data.courses?.find(c => c.semester === reg.semester);
    
    let html = `
      <div class="semester-block ${semClass}">
        <div class="semester-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:-3px;display:inline-block;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Semester ${reg.semester} (${reg.acYear})
          <span class="status-badge pass" style="margin-left:auto;">${reg.status}</span>
        </div>
        
        <div class="gpa-grid">
          <div class="gpa-card sgpa">
            <div class="gpa-value">${UI.formatGPA(reg.sgpa)}</div>
            <div class="gpa-label">SGPA</div>
          </div>
          <div class="gpa-card cgpa">
            <div class="gpa-value">${UI.formatGPA(reg.cgpa)}</div>
            <div class="gpa-label">CGPA</div>
          </div>
        </div>
        
        <div style="font-weight:700;font-size:13px;margin-bottom:8px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:-3px;display:inline-block;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Course Results
        </div>
        ${this.renderCourses(semCourses)}
      </div>
    `;
    
    container.innerHTML = html;
  },

  renderCourses(semCourses) {
    if (!semCourses?.courses?.length) {
      return '<div class="text-center" style="padding:20px;color:#4f647c;">No courses found</div>';
    }
    
    let html = '';
    semCourses.courses.forEach(c => {
      html += `
        <div class="course-row">
          <div class="course-info">
            <div class="cname">${c.title}</div>
            <div>
              <span class="ccode">${c.code}</span>
              <span class="cred"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:-3px;display:inline-block;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${c.credit} Cr</span>
            </div>
          </div>
          <div class="course-grade">
            <div>
              <span class="score">${c.percentage || '—'}</span>
              <span class="letter ${UI.gradeClass(c.grade)}">${c.grade}</span>
            </div>
            <div class="pts">${c.points} pts</div>
          </div>
        </div>
      `;
    });
    return html;
  }
};

document.addEventListener('DOMContentLoaded', () => ResultsRenderer.init());
