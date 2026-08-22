function renderProfile() {
  const data = getStudentData();
  const container = document.getElementById('profile-content');
  
  if (!data?.biography) {
    container.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:40px;">No profile data</div>';
    return;
  }
  
  const b = data.biography;
  let html = '<div class="card">';
  
  const fields = [
    ['Full Name', b.fullName],
    ['Student ID', b.studentId],
    ['Gender', b.gender],
    ['Birth Date', b.birthDate],
    ['Nationality', b.nationality],
    ['Phone', b.phone],
    ['Email', b.email],
    ['Enrollment Date', b.enrollmentDate],
    ['High School Stream', b.highSchoolStream],
  ];
  
  fields.forEach(([label, value]) => {
    if (value && value !== 'null') {
      html += `<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9;">
        <span style="color:#64748b;font-size:13px;">${label}</span>
        <span style="font-weight:600;">${value}</span>
      </div>`;
    }
  });
  
  html += '</div>';
  container.innerHTML = html;
}

if (sessionStorage.getItem('bdu_logged_in') === 'true') {
  renderProfile();
} else {
  window.location.href = '/';
}
