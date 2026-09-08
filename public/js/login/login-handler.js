// Login Handler
const LoginHandler = {
  init() {
    const form = document.getElementById('login-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    // Hide splash screen
    setTimeout(() => {
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 500);
      }
    }, 2000);
  },

  async handleSubmit(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    errorDiv.classList.remove('show');
    
    const btn = document.getElementById('login-btn');
    const btnText = document.getElementById('login-btn-text');
    const btnSpinner = document.getElementById('login-btn-spinner');
    
    btn.disabled = true;
    btnText.textContent = 'Logging in...';
    btnSpinner.classList.remove('hidden');
    
    try {
      const response = await Auth.login(username, password);
      
      if (response.success) {
        window.location.href = '/pages/dashboard.html';
      } else {
        errorDiv.textContent = response.error || 'Invalid credentials';
        errorDiv.classList.add('show');
      }
    } catch (error) {
      errorDiv.textContent = error.message || 'Login failed';
      errorDiv.classList.add('show');
    } finally {
      btn.disabled = false;
      btnText.textContent = 'Login to Portal';
      btnSpinner.classList.add('hidden');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => LoginHandler.init());
