// Results Logic with Semester Toggle, Percentages, Print Button
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
  const toggleContainer = document.getElementById('semester-toggle');
  
  if (!container) return;
  
  let currentSemester = 0;
  
  function gradeClass(grade) {
    if (!grade || grade === '—') return 'grade-dash';
    if (grade.startsWith('A')) return 'grade-A';
    if (grade.startsWith('B')) return 'grade-B';
    if (grade.startsWith('C')) return 'grade-C';
    if (grade.startsWith('D')) return 'grade-D';
    if (grade === 'P') return 'grade-P';
    return 'grade-F';
  }
  
  function renderToggle() {
    if (!toggleContainer) return;
    
    let toggleHtml = '';
    regs.forEach(function(reg, index) {
      toggleHtml += '<button class="toggle-btn ' + (index === currentSemester ? 'active' : '') + '" onclick="switchSemester(' + index + ')">' +
        'Semester ' + reg.semester + '</button>';
    });
    toggleContainer.innerHTML = toggleHtml;
  }
  
  function renderSemester(index) {
    const reg = regs[index];
    if (!reg) return;
    
    const semCourses = courses.find(function(c) { return c.semester === reg.semester; });
    
    const gpaHtml = reg.sgpa || '—';
    const cgpaHtml = reg.cgpa || '—';
    const gpaClass = reg.sgpa ? 'has-gpa' : 'no-gpa';
    
    const semCredits = semCourses?.courses?.reduce(function(sum, c) { return sum + c.credit; }, 0) || 0;
    
    let coursesHtml = '';
    if (semCourses && semCourses.courses) {
      semCourses.courses.forEach(function(c) {
        coursesHtml += '<div class="course-card">' +
          '<div class="course-info">' +
          '<div class="course-meta"><span class="course-code">' + c.code + '</span>' +
          '<span class="course-credits">· ' + c.credit + ' cr</span></div>' +
          '<div class="course-name">' + c.title + '</div>' +
          '<div style="font-size:11px;color:#4f6885;margin-top:2px;">' + c.points + ' pts</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
          '<div style="font-weight:800;font-size:14px;color:#0f172a;">' + (c.percentage || '—') + '</div>' +
          '<span class="grade-badge ' + gradeClass(c.grade) + '">' + (c.grade || '—') + '</span>' +
          '</div>' +
          '</div>';
      });
    } else {
      coursesHtml = '<div style="padding:20px;text-align:center;color:#94a3b8;font-size:13px;">No courses registered yet.</div>';
    }
    
    const html = '<div class="semester-block">' +
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
      '<div class="gpa-value">' + cgpaHtml + '</div>' +
      '<div style="font-size:10px;color:#94a3b8;margin-top:4px;">' + semCredits + ' Credit Hours</div>' +
      '</div>' +
      '</div>' +
      '<div class="courses-title">Course Results</div>' +
      coursesHtml +
      '</div>' +
      '<button onclick="location.href=\'/pages/grade-report.html\'" style="width:100%;padding:14px;background:#1a5f9c;color:white;border:none;border-radius:50px;font-weight:700;font-size:14px;cursor:pointer;margin-top:12px;">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;vertical-align:middle;"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> Print Grade Report</button>';
    
    container.innerHTML = html;
  }
  
  window.switchSemester = function(index) {
    currentSemester = index;
    renderToggle();
    renderSemester(index);
  };
  
  renderToggle();
  renderSemester(0);
});
