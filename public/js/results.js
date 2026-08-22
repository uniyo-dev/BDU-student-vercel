let currentSemesterIndex = 0;

function gradeClass(g) {
  if (g === 'P') return 'letter';
  if (g.startsWith('A')) return 'letter';
  if (g.startsWith('B')) return 'letter';
  if (g.startsWith('C')) return 'letter';
  if (g.startsWith('D')) return 'letter';
  return 'letter';
}

function renderSemesterToggle() {
  const data = getStudentData();
  if (!data?.registrations?.length) return;
  
  const toggle = document.getElementById('semester-toggle');
  let html = '';
  
  data.registrations.forEach((reg, i) => {
    html += `<span class="sem ${i === currentSemesterIndex ? 'active' : ''}" onclick="switchSemester(${i})">
      <i class="fas ${i === currentSemesterIndex ? 'fa-circle-check' : 'fa-circle'}"></i> Semester ${reg.semester}
    </span>`;
  });
  
  toggle.innerHTML = html;
}

function switchSemester(index) {
  currentSemesterIndex = index;
  renderSemesterToggle();
  renderSemesterDetails();
}

function renderSemesterDetails() {
  const data = getStudentData();
  const container = document.getElementById('results-content');
  
  if (!data?.registrations?.length) {
    container.innerHTML = '<div style="text-align:center;color:#5a708b;padding:40px;">No results available</div>';
    return;
  }
  
  const reg = data.registrations[currentSemesterIndex];
  const semCourses = data.courses?.find(c => c.semester === reg.semester);
  
  let html = `
    <div class="gpa-box">
      <div class="gpa-item">
        <div class="big">${reg.sgpa}</div>
        <div class="sm">Semester GPA</div>
      </div>
      <div class="gpa-item" style="text-align:center;">
        <span class="badge">${reg.status || 'PASS'}</span>
      </div>
      <div class="gpa-item" style="text-align:right;">
        <div class="big">${reg.cgpa}</div>
        <div class="sm">CGPA</div>
      </div>
    </div>
  `;
  
  if (semCourses?.courses?.length) {
    html += '<div style="padding:0 1.5rem 0.2rem; font-weight:700; color:#0b1e33; font-size:0.9rem;">Course Results</div>';
    html += '<div class="course-list">';
    
    semCourses.courses.forEach(c => {
      html += `
        <div class="course-row">
          <div class="course-info">
            <div class="cname">${c.title}</div>
            <div><span class="ccode">${c.code}</span> <span class="cred"><i class="far fa-clock"></i> ${c.credit} Cr</span></div>
          </div>
          <div class="course-grade">
            <div><span class="score">${c.percentage || '—'}</span> <span class="letter" style="background:${c.grade === 'F' ? '#dc2626' : '#1f8b4c'};">${c.grade}</span></div>
            <div class="pts">${c.points} pts</div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
  } else {
    html += '<div style="text-align:center;color:#5a708b;padding:30px;">No courses found for this semester</div>';
  }
  
  container.innerHTML = html;
}

function renderResults() {
  renderSemesterToggle();
  renderSemesterDetails();
}

if (sessionStorage.getItem('bdu_logged_in') === 'true') {
  renderResults();
} else {
  window.location.href = '/';
}
