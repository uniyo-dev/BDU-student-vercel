// Results Logic with SVG icons
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
  
  function gradeClass(grade) {
    if (!grade || grade === '—') return 'grade-dash';
    if (grade.startsWith('A')) return 'grade-A';
    if (grade.startsWith('B')) return 'grade-B';
    if (grade.startsWith('C')) return 'grade-C';
    if (grade.startsWith('D')) return 'grade-D';
    return 'grade-F';
  }
  
  let html = '';
  
  regs.forEach(function(reg) {
    const semCourses = courses.find(function(c) { return c.semester === reg.semester; });
    
    const gpaHtml = reg.sgpa || '—';
    const cgpaHtml = reg.cgpa || '—';
    const gpaClass = reg.sgpa ? 'has-gpa' : 'no-gpa';
    
    let coursesHtml = '';
    if (semCourses && semCourses.courses) {
      semCourses.courses.forEach(function(c) {
        coursesHtml += '<div class="course-card">' +
          '<div class="course-info">' +
          '<div class="course-meta"><span class="course-code">' + c.code + '</span>' +
          '<span class="course-credits">· ' + c.credit + ' cr</span></div>' +
          '<div class="course-name">' + c.title + '</div>' +
          '</div>' +
          '<span class="grade-badge ' + gradeClass(c.grade) + '">' + (c.grade || '—') + '</span>' +
          '</div>';
      });
    } else {
      coursesHtml = '<div class="card" style="padding:20px;text-align:center;color:#94a3b8;font-size:13px;">No courses registered yet.</div>';
    }
    
    html += '<div class="semester-block">' +
      '<div class="semester-label">Semester ' + reg.semester + ' (' + reg.acYear + ') ' +
      '<span class="badge-passed">' + (reg.status || 'Pass') + '</span></div>' +
      '<div class="gpa-grid">' +
      '<div class="gpa-card-primary ' + gpaClass + '">' +
      '<div class="gpa-label">Semester GPA</div>' +
      '<div class="gpa-value">' + gpaHtml + '</div>' +
      '<div class="gpa-status">' + (reg.status || 'Pass') + '</div>' +
      '</div>' +
      '<div class="gpa-card-secondary">' +
      '<div class="gpa-label">CGPA</div>' +
      '<div class="gpa-row">' +
      '<div class="gpa-value">' + cgpaHtml + '</div>' +
      '<div class="gpa-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>' +
      '</div>' +
      '<div class="gpa-credits">' + semCourses?.courses?.reduce(function(sum, c) { return sum + c.credit; }, 0) + ' Credit Hours</div>' +
      '</div>' +
      '</div>' +
      '<div class="courses-title">Course Results</div>' +
      coursesHtml +
      '</div>';
  });
  
  container.innerHTML = html;
});
