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
          <i class="fas fa-circle-check"></i> Semester ${reg.semester}
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
          <i class="fas fa-calendar-alt"></i>
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
          <i class="fas fa-book"></i> Course Results
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
              <span class="cred"><i class="far fa-clock"></i> ${c.credit} Cr</span>
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
