// Login Handler
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('login-form');
  
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      const errorDiv = document.getElementById('login-error');
      const errorMsg = document.getElementById('login-error-msg');
      const btn = document.getElementById('login-btn');
      const btnText = document.getElementById('login-btn-text');
      const btnSpinner = document.getElementById('login-btn-spinner');
      
      if (errorDiv) errorDiv.classList.remove('show');
      
      if (btn) btn.disabled = true;
      if (btnText) btnText.textContent = 'Signing in...';
      if (btnSpinner) btnSpinner.classList.remove('hidden');
      
      try {
        const response = await Auth.login(username, password);
        
        if (response.success) {
          window.location.href = '/pages/dashboard.html';
        } else {
          if (errorMsg) errorMsg.textContent = response.error || 'Invalid credentials';
          if (errorDiv) errorDiv.classList.add('show');
        }
      } catch (error) {
        if (errorMsg) errorMsg.textContent = 'Login failed. Please try again.';
        if (errorDiv) errorDiv.classList.add('show');
      } finally {
        if (btn) btn.disabled = false;
        if (btnText) btnText.textContent = 'Sign In';
        if (btnSpinner) btnSpinner.classList.add('hidden');
      }
    });
  }
});

// Toggle password visibility
function togglePassword() {
  const input = document.getElementById('login-password');
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  
  const eyeShow = document.getElementById('eye-show');
  const eyeHide = document.getElementById('eye-hide');
  
  if (eyeShow) eyeShow.classList.toggle('hidden', !isText);
  if (eyeHide) eyeHide.classList.toggle('hidden', isText);
}
