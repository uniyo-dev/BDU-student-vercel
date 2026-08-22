const API_BASE = '/api';

async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: options.body,
  });
  
  const data = await response.json();
  
  if (data.success && data.data) {
    sessionStorage.setItem('bdu_logged_in', 'true');
    sessionStorage.setItem('bdu_username', sessionStorage.getItem('bdu_username') || '');
    sessionStorage.setItem('bdu_student_data', JSON.stringify(data.data));
  }
  
  return data;
}

async function loginAndGetData(username, password) {
  sessionStorage.setItem('bdu_username', username);
  return await apiCall('login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

function getStudentData() {
  const saved = sessionStorage.getItem('bdu_student_data');
  if (saved) {
    try { return JSON.parse(saved); } catch(e) { return null; }
  }
  return null;
}
