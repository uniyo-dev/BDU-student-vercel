// UI Helper Module
const UI = {
  showLoading() {
    const el = document.getElementById('loading-overlay');
    if (el) el.classList.remove('hidden');
  },

  hideLoading() {
    const el = document.getElementById('loading-overlay');
    if (el) el.classList.add('hidden');
  },

  formatGPA(value) {
    return value ? parseFloat(value).toFixed(2) : '—';
  },

  redirectIfNotLoggedIn() {
    if (sessionStorage.getItem('bdu_logged_in') !== 'true') {
      window.location.href = '/';
    }
  },

  gradeClass(grade) {
    if (!grade || grade === '—') return 'grade-F';
    if (grade.startsWith('A')) return 'grade-A';
    if (grade.startsWith('B')) return 'grade-B';
    if (grade.startsWith('C')) return 'grade-C';
    if (grade.startsWith('D')) return 'grade-D';
    if (grade === 'P') return 'grade-P';
    return 'grade-F';
  }
};

// Legacy compatibility functions
function getStudentData() { return Store.getStudentData(); }
function isLoggedIn() { return Store.isLoggedIn(); }
function logout() { Auth.logout(); }
