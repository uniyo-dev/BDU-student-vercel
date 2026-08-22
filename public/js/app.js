// ===== BDU PORTAL - CONSOLIDATED JS =====

// Config
const CONFIG = {
  API_BASE: '/api',
  APP_NAME: 'BDU Student Portal',
};

// Storage
const Store = {
  save(key, data) {
    sessionStorage.setItem(key, JSON.stringify(data));
  },
  get(key) {
    try { return JSON.parse(sessionStorage.getItem(key)); } catch(e) { return null; }
  },
  getStudentData() {
    return this.get('bdu_student_data');
  },
  setStudentData(data) {
    this.save('bdu_student_data', data);
  }
};

// Auth
const Auth = {
  isLoggedIn() {
    return sessionStorage.getItem('bdu_logged_in') === 'true';
  },
  login(username, password) {
    return fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(r => r.json()).then(data => {
      if (data.success && data.data) {
        sessionStorage.setItem('bdu_logged_in', 'true');
        sessionStorage.setItem('bdu_username', username);
        Store.setStudentData(data.data);
      }
      return data;
    });
  },
  logout() {
    sessionStorage.clear();
    window.location.href = '/';
  }
};

// Legacy functions for compatibility
function getStudentData() { return Store.getStudentData(); }
function isLoggedIn() { return Auth.isLoggedIn(); }
function logout() { Auth.logout(); }

// UI Helpers
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
    if (!Auth.isLoggedIn()) {
      window.location.href = '/';
    }
  }
};

console.log('BDU Portal JS loaded successfully');
