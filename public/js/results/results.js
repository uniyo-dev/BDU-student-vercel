// Results Logic
document.addEventListener('DOMContentLoaded', function() {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/';
    return;
  }
  
  const data = Auth.getStudentData();
  
  if (!data) {
    window.location.href = '/';
    return;
  }
  
  const regs = data.registrations || [];
  const courses = data.courses || [];
  const container = document.getElementById('results-content');
  
  if (!container) return;
  
  let html = '';
  
  regs.forEach(function(reg, index) {
    const semCourses = courses.find(function(c) { return c.semester === reg.semester; });
    
    html += '<div class="semester-block">';
    html += '<div class="semester-label">Semester ' + reg.semester + ' (' + reg.acYear + ') ';
    html += '<span class="badge-passed">' + (reg.status || 'Pass') + '</span></div>';
    
    html += '<div class="gpa-grid">';
    html += '<div class="gpa-card-primary">';
    html += '<div class="gpa-label">Semester GPA</div>';
    html += '<div class="gpa-value">' + UI.formatGPA(reg.sgpa) + '</div>';
    html += '<div class="gpa-status">' + (reg.status || 'Pass') + '</div>';
    html += '</div>';
    html += '<div class="gpa-card-secondary">';
    html += '<div class="gpa-label">CGPA</div>';
    html += '<div class="gpa-value">' + UI.formatGPA(reg.cgpa) + '</div>';
    html += '</div>';
    html += '</div>';
    
    html += '<div class="courses-title">Course Results</div>';
    
    if (semCourses && semCourses.courses) {
      semCourses.courses.forEach(function(c) {
        html += '<div class="course-card">';
        html += '<div class="course-info">';
        html += '<div class="course-meta"><span class="course-code">' + c.code + '</span>';
        html += '<span class="course-credits">' + c.credit + ' Cr</span></div>';
        html += '<div class="course-name">' + c.title + '</div>';
        html += '</div>';
        html += '<span class="grade-badge ' + UI.gradeClass(c.grade) + '">' + c.grade + '</span>';
        html += '</div>';
      });
    }
    
    html += '</div>';
  });
  
  container.innerHTML = html;
});
