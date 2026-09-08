// Authentication Module
const Auth = {
  login(username, password) {
    sessionStorage.setItem('bdu_username', username);
    return apiCall('login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  logout() {
    sessionStorage.clear();
    window.location.href = '/';
  },

  isLoggedIn() {
    return sessionStorage.getItem('bdu_logged_in') === 'true';
  },

  getUsername() {
    return sessionStorage.getItem('bdu_username') || '';
  },

  getStudentData() {
    const saved = sessionStorage.getItem('bdu_student_data');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) { return null; }
    }
    return null;
  }
};
