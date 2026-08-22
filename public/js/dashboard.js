function updateDashboard() {
  const data = getStudentData();
  if (!data) return;
  
  const bio = data.biography || {};
  const summary = data.summary || {};
  
  document.getElementById('dash-name').textContent = bio.fullName || 'Student';
  document.getElementById('dash-id').textContent = bio.studentId ? `ID: ${bio.studentId}` : '';
  document.getElementById('dash-gpa').textContent = summary.cumulativeGPA || '—';
  document.getElementById('dash-credits').textContent = summary.totalCredits || '0';
  document.getElementById('dash-semesters').textContent = summary.totalSemesters || '0';
  document.getElementById('dash-program').textContent = data.program || '—';
}

function logout() {
  sessionStorage.clear();
  window.location.href = '/';
}

if (sessionStorage.getItem('bdu_logged_in') === 'true') {
  updateDashboard();
} else {
  window.location.href = '/';
}
