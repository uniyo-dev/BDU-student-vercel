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

  showToast(message, type = 'info') {
    let toast = document.getElementById('toast-message');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-message';
      toast.className = 'toast-message';
      document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.className = `toast-message show toast-${type}`;
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  },

  formatGPA(value) {
    return value ? parseFloat(value).toFixed(2) : '—';
  },

  gradeClass(grade) {
    if (!grade || grade === '—') return 'grade-F';
    if (grade.startsWith('A')) return 'grade-A';
    if (grade.startsWith('B')) return 'grade-B';
    if (grade.startsWith('C')) return 'grade-C';
    if (grade.startsWith('D')) return 'grade-D';
    if (grade === 'P') return 'grade-P';
    return 'grade-F';
  },

  redirectIfNotLoggedIn() {
    if (!Auth.isLoggedIn()) {
      window.location.href = '/';
    }
  }
};
