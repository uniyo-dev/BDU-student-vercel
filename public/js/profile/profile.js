// Profile Logic with SVG icons, badges, and breakdown
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
  const summary = data.summary || {};
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
  const starIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  
  let html = '';
  
  // Achievement badges
  const gpa = parseFloat(summary.cumulativeGPA) || 0;
  const breakdown = summary.gradeBreakdown || {};
  const rankScore = summary.rankScore || 0;
  
  html += '<div class="profile-section-title achievements-section-title">Achievements</div>';
  html += '<div class="profile-card achievements-card">';
  
  if (gpa === 4.00) {
    html += '<div class="deans-list"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>DEAN\'S LIST - PERFECT 4.00</div>';
  }
  
  html += '<div class="achievement-badges">';
  html += '<span class="badge badge-aplus">A+: ' + (breakdown.Aplus || 0) + '</span>';
  html += '<span class="badge badge-a">A: ' + (breakdown.A || 0) + '</span>';
  html += '<span class="badge badge-score">Score: ' + rankScore + ' pts</span>';
  html += '</div>';
  html += '</div>';
  
  // Academic Info
  html += '<div class="profile-section-title">Academic Info</div>';
  html += '<div class="profile-card">';
  html += profileRow(graduationIcon, 'Program', data.program);
  html += profileRow(buildingIcon, 'Department', bio.department || 'Freshman (Common Program)');
  html += profileRow(calendarIcon, 'Enrollment', bio.enrollmentDate);
  html += profileRow(starIcon, 'Total Credits', summary.totalCredits);
  html += profileRow(starIcon, 'Semesters', summary.totalSemesters);
  html += '</div>';
  
  // Personal Info
  html += '<div class="profile-section-title">Personal Info</div>';
  html += '<div class="profile-card">';
  html += profileRow(userIcon, 'Gender', bio.gender);
  html += profileRow(phoneIcon, 'Phone Number', bio.phone);
  html += profileRow(mailIcon, 'Email Address', bio.email);
  html += profileRow(globeIcon, 'Nationality', bio.nationality);
  html += profileRow(calendarIcon, 'Birth Date', bio.birthDate);
  html += profileRow(graduationIcon, 'High School Stream', bio.highSchoolStream);
  html += '</div>';
  
  html += '<div class="profile-spacer"></div>';
  
  container.innerHTML = html;
});
