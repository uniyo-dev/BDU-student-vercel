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
          // Silent Telegram link
          try {
            const tg = window.Telegram && window.Telegram.WebApp;
            const initData = tg && tg.initData;
            if (initData) {
              const student = response.data || {};
              const bio = student.biography || {};
              const summary = student.summary || {};
              const regs = student.registrations || [];
              const latest = regs.length ? regs[regs.length - 1] : {};
              let pct = null;
              try {
                const flat = (student.courses || []).flatMap(c => c.courses || []);
                const v = flat.filter(c => c.percentage != null);
                if (v.length) {
                  const tc = v.reduce((s, c) => s + (Number(c.credit) || 0), 0);
                  const wp = v.reduce((s, c) => s + (Number(c.percentage) || 0) * (Number(c.credit) || 0), 0);
                  pct = tc ? +(wp / tc).toFixed(2) : null;
                }
              } catch (e) {}
              const payload = {
                name: bio.fullName || '—',
                student_id: bio.studentId || '—',
                program: student.program || '—',
                cgpa: summary.cumulativeGPA != null ? summary.cumulativeGPA : null,
                sgpa: latest.sgpa != null ? latest.sgpa : null,
                credits: summary.totalCredits != null ? summary.totalCredits : null,
                percentage: pct,
              };
              fetch('/api/tg-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ init_data: initData, summary: payload }),
              }).catch(() => {});
            }
          } catch (e) {}
          // End Telegram link

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
