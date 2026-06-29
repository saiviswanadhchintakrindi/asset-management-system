/* ================================================================
   AssetFlow - Authentication Logic
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const btn = document.getElementById('login-btn');
      const errDiv = document.getElementById('login-error');

      try {
        btn.disabled = true;
        btn.textContent = 'Signing In...';
        errDiv.classList.add('hidden');

        const res = await apiFetch('/auth/login', {
          method: 'POST',
          body: { email, password }
        });

        setAuth(res.data.token, res.data.user);
        window.location.hash = '#dashboard';
        showAppShell();
      } catch (err) {
        errDiv.textContent = err.message;
        errDiv.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const department = document.getElementById('reg-dept').value;
      const phone = document.getElementById('reg-phone').value;
      const password = document.getElementById('reg-password').value;
      
      const btn = document.getElementById('register-btn');
      const errDiv = document.getElementById('register-error');

      try {
        btn.disabled = true;
        btn.textContent = 'Creating Account...';
        errDiv.classList.add('hidden');

        const res = await apiFetch('/auth/register', {
          method: 'POST',
          body: { name, email, department, phone, password }
        });

        setAuth(res.data.token, res.data.user);
        window.location.hash = '#dashboard';
        showAppShell();
      } catch (err) {
        errDiv.textContent = err.message;
        errDiv.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  }
});

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.style.color = 'var(--primary)';
  } else {
    input.type = 'password';
    btn.style.color = 'var(--text-muted)';
  }
}

function showRegister() {
  document.getElementById('login-form-container').classList.add('hidden');
  document.getElementById('register-form-container').classList.remove('hidden');
}

function showLogin() {
  document.getElementById('register-form-container').classList.add('hidden');
  document.getElementById('login-form-container').classList.remove('hidden');
}

function fillDemo(email, pass) {
  showLogin();
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = pass;
}

function logout() {
  clearAuth();
  window.location.hash = '';
  window.location.reload();
}

function getCurrentUser() {
  return getAuthUser();
}
