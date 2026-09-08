// Profile Logic with SVG icons
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
  
  const bio = data.biography || {};
  const container = document.getElementById('profile-content');
  
  if (!container) return;
  
  // Avatar initials
  const initials = (bio.fullName || 'S').split(' ').map(function(n) { return n[0]; }).join('').slice(0, 2).toUpperCase();
  document.getElementById('profile-avatar-initials').textContent = initials;
  document.getElementById('profile-name').textContent = bio.fullName || 'Student';
  document.getElementById('profile-student-id').textContent = bio.studentId || 'ID Unknown';
  
  function profileRow(iconSvg, label, value) {
    return '<div class="profile-row">' +
      '<div class="profile-row-icon">' + iconSvg + '</div>' +
      '<div><div class="profile-row-label">' + label + '</div>' +
      '<div class="profile-row-value">' + (value || 'Not provided') + '</div></div>' +
      '</div>';
  }
  
  const graduationIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>';
  const buildingIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  const calendarIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  const userIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  const phoneIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 9.8 19.79 19.79 0 0 1 1.61 1.18 2 2 0 0 1 3.58 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 7.91a16 16 0 0 0 6.08 6.08l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
  const mailIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>';
  const globeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
  
  let html = '';
  
  html += '<div class="profile-section-title" style="margin-top:20px;">Academic Info</div>';
  html += '<div class="profile-card">';
  html += profileRow(graduationIcon, 'Program', data.program);
  html += profileRow(buildingIcon, 'Department', bio.department || 'Freshman (Common Program)');
  html += profileRow(calendarIcon, 'Enrollment', bio.enrollmentDate);
  html += '</div>';
  
  html += '<div class="profile-section-title">Personal Info</div>';
  html += '<div class="profile-card">';
  html += profileRow(userIcon, 'Gender', bio.gender);
  html += profileRow(phoneIcon, 'Phone Number', bio.phone);
  html += profileRow(mailIcon, 'Email Address', bio.email);
  html += profileRow(globeIcon, 'Nationality', bio.nationality);
  html += profileRow(calendarIcon, 'Birth Date', bio.birthDate);
  html += profileRow(graduationIcon, 'High School Stream', bio.highSchoolStream);
  html += '</div>';
  
  html += '<div style="padding-bottom:24px;"></div>';
  
  container.innerHTML = html;
});
