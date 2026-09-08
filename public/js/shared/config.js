// BDU Portal Configuration
const CONFIG = {
  API_BASE: '/api',
  APP_NAME: 'BDU Student Portal',
  UNIVERSITY: 'Bahir Dar University',
  ACADEMIC_YEAR: '2025/2026',
};

// Global functions used by all pages
function getStudentData() {
  const saved = sessionStorage.getItem('bdu_student_data');
  if (saved) {
    try { return JSON.parse(saved); } catch(e) { return null; }
  }
  return null;
}

function isLoggedIn() {
  return sessionStorage.getItem('bdu_logged_in') === 'true';
}

function logout() {
  sessionStorage.clear();
  localStorage.removeItem('bdu_report_serial_' + (getStudentData()?.biography?.studentId || ''));
  window.location.href = '/';
}
