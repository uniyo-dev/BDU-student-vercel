let currentSemesterIndex = 0;

function renderSemesterToggle() {
  const data = getStudentData();
  if (!data?.registrations?.length) return;
  
  const toggle = document.getElementById('semester-toggle');
  let html = '';
  
  data.registrations.forEach((reg, i) => {
    html += `
      <span class="sem ${i === currentSemesterIndex ? 'active' : ''}" onclick="switchSemester(${i})">
        <i class="fas ${i === currentSemesterIndex ? 'fa-circle-check' : 'fa-circle'}"></i> Semester ${reg.semester}
        ${reg.status !== 'Pass' ? '<span class="live-badge">Live</span>' : ''}
      </span>
    `;
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
  const reg = data?.registrations?.[currentSemesterIndex];
  
  if (!reg) {
    document.getElementById('semesterGpa').textContent = '—';
    document.getElementById('cgpaDisplay').textContent = '—';
    document.getElementById('statusBadge').textContent = '—';
    document.getElementById('courseList').innerHTML = '<div style="text-align:center;color:#4a637f;padding:20px;">Please login first</div>';
    return;
  }
  
  document.getElementById('semesterGpa').textContent = reg.sgpa;
  document.getElementById('cgpaDisplay').textContent = reg.cgpa;
  document.getElementById('statusBadge').textContent = reg.status?.toUpperCase() || 'PASS';
  document.getElementById('sub-year').textContent = reg.acYear || '';
  
  const semCourses = data.courses?.find(c => c.semester === reg.semester);
  const courseList = document.getElementById('courseList');
  
  if (semCourses?.courses?.length) {
    let html = '';
    
    semCourses.courses.forEach(c => {
      const isIncomplete = !c.grade || c.grade === '—';
      
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
              <span class="letter ${isIncomplete ? 'incomplete' : ''}">${c.grade}</span>
            </div>
            <div class="pts">${c.points ? c.points + ' pts' : ''}</div>
          </div>
        </div>
      `;
    });
    
    courseList.innerHTML = html;
  } else {
    courseList.innerHTML = '<div style="text-align:center;color:#4a637f;padding:20px;">No courses found</div>';
  }
}

function renderResults() {
  renderSemesterToggle();
  renderSemesterDetails();
}

// Check if logged in, if not redirect to login
if (sessionStorage.getItem('bdu_logged_in') !== 'true') {
  window.location.href = '/';
} else {
  renderResults();
}
