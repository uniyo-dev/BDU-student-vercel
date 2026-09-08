// Dashboard Logic
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
  
  document.getElementById('dash-name').textContent = bio.fullName || 'Student';
  document.getElementById('dash-student-id').textContent = bio.studentId || '';
  document.getElementById('dash-program-desc').textContent = data.program || '';
  document.getElementById('dash-gpa').textContent = UI.formatGPA(summary.cumulativeGPA);
  document.getElementById('dash-credits').textContent = summary.totalCredits || '0';
});
