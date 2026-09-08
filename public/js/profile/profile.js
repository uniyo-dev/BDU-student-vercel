function renderProfile() {
  const data = getStudentData();
  const bio = data?.biography;
  
  if (!bio) {
    document.getElementById('profile-content').innerHTML = '<div class="text-center" style="padding:40px;color:#4a637f;">No profile data</div>';
    return;
  }
  
  const html = `
    <div class="semester-block semester-1">
      <div class="semester-title">
        <i class="fas fa-user-graduate"></i>
        ${bio.fullName}
      </div>
      <div style="text-align:center;padding:12px;">
        <div class="status-badge pass">${bio.studentId}</div>
      </div>
    </div>
    
    <div class="gpa-grid">
      <div class="gpa-card sgpa">
        <div class="gpa-value">${bio.gender}</div>
        <div class="gpa-label">Gender</div>
      </div>
      <div class="gpa-card cgpa">
        <div class="gpa-value" style="font-size:14px;">${bio.nationality}</div>
        <div class="gpa-label">Nationality</div>
      </div>
    </div>
    
    <div class="semester-block semester-2">
      <div class="semester-title">
        <i class="fas fa-info-circle"></i>
        Details
      </div>
      ${renderDetailRow('Birth Date', bio.birthDate)}
      ${renderDetailRow('Phone', bio.phone)}
      ${renderDetailRow('Email', bio.email || '—')}
      ${renderDetailRow('Enrollment', bio.enrollmentDate)}
      ${renderDetailRow('Stream', bio.highSchoolStream)}
    </div>
  `;
  
  document.getElementById('profile-content').innerHTML = html;
}

function renderDetailRow(label, value) {
  return `
    <div class="course-row">
      <div class="course-info">
        <div class="ccode">${label}</div>
      </div>
      <div class="course-grade">
        <span class="score">${value}</span>
      </div>
    </div>
  `;
}

if (isLoggedIn()) {
  renderProfile();
} else {
  window.location.href = '/';
}
