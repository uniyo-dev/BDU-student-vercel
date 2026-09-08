// Grade Report Renderer
const GradeReportRenderer = {
  init() {
    UI.redirectIfNotLoggedIn();
    this.render();
  },

  render() {
    const data = Store.getStudentData();
    if (!data) return;
    
    const bio = data.biography || {};
    const summary = data.summary || {};
    const registrations = data.registrations || [];
    
    document.getElementById('report-name').textContent = bio.fullName || '';
    document.getElementById('report-id').textContent = bio.studentId || '';
    document.getElementById('report-program').textContent = data.program || '';
    document.getElementById('report-year').textContent = registrations[0]?.acYear || '';
    document.getElementById('report-total-credits').textContent = summary.totalCredits || '0';
    document.getElementById('report-cgpa').textContent = summary.cumulativeGPA || '—';
    document.getElementById('report-status').textContent = registrations[registrations.length - 1]?.status || 'Pass';
    
    let html = '';
    
    registrations.forEach((reg, index) => {
      const semCourses = data.courses?.find(c => c.semester === reg.semester);
      
      html += `
        <div class="semester-header" style="margin-top:${index === 0 ? '0' : '8px'};">
          Semester ${reg.semester} — SGPA: ${reg.sgpa} | CGPA: ${reg.cgpa} | ${reg.status}
        </div>
        <table class="grade-table">
          <thead>
            <tr>
              <th style="width:12%;">Code</th>
              <th style="width:45%;">Course Title</th>
              <th style="width:7%;">Cr</th>
              <th style="width:9%;">Grade</th>
              <th style="width:12%;">Points</th>
              <th style="width:15%;">%</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      if (semCourses?.courses?.length) {
        semCourses.courses.forEach(c => {
          html += `
            <tr>
              <td>${c.code}</td>
              <td style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;">${c.title}</td>
              <td>${c.credit}</td>
              <td><strong>${c.grade}</strong></td>
              <td>${c.points}</td>
              <td>${c.percentage || '—'}</td>
            </tr>
          `;
        });
      }
      
      html += '</tbody></table>';
    });
    
    document.getElementById('report-content').innerHTML = html;
  }
};

document.addEventListener('DOMContentLoaded', () => GradeReportRenderer.init());
