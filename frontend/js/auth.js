// ── Tab Switching ─────────────────────────────────────
const loginTab   = document.getElementById('loginTab');
const signupTab  = document.getElementById('signupTab');
const loginForm  = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

if (loginTab) {
  loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.style.display  = 'block';
    signupForm.style.display = 'none';
  });
}

if (signupTab) {
  signupTab.addEventListener('click', () => {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.style.display = 'block';
    loginForm.style.display  = 'none';
  });
}

// ── Get Base URL ──────────────────────────────────────
const BASE = `${window.location.protocol}//${window.location.host}`;

// ── Show Message ──────────────────────────────────────
function showMessage(elementId, message, type) {
  const el      = document.getElementById(elementId);
  el.textContent = message;
  el.className  = `auth-message ${type}`;
}

// ── Signup ────────────────────────────────────────────
const signupBtnEl = document.getElementById('signupBtn');
if (signupBtnEl) {
  signupBtnEl.addEventListener('click', async () => {
    const username = document.getElementById('signupUsername').value.trim();
    const email    = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();

    if (!username || !email || !password) {
      return showMessage('signupMessage', 'Please fill in all fields', 'error');
    }

    try {
      const res  = await fetch(`${BASE}/api/auth/signup`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ username, email, password })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showMessage('signupMessage', '✅ Account created! Redirecting...', 'success');
        setTimeout(() => window.location.href = `${BASE}/pages/dashboard.html`, 1500);
      } else {
        showMessage('signupMessage', data.message, 'error');
      }
    } catch {
      showMessage('signupMessage', 'Server error. Is the backend running?', 'error');
    }
  });
}

// ── Login ─────────────────────────────────────────────
const loginBtnEl = document.getElementById('loginBtn');
if (loginBtnEl) {
  loginBtnEl.addEventListener('click', async () => {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!username || !password) {
      return showMessage('loginMessage', 'Please fill in all fields', 'error');
    }

    try {
      const res  = await fetch(`${BASE}/api/auth/login`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showMessage('loginMessage', '✅ Welcome back! Redirecting...', 'success');
        setTimeout(() => window.location.href = `${BASE}/pages/dashboard.html`, 1500);
      } else {
        showMessage('loginMessage', data.message, 'error');
      }
    } catch {
      showMessage('loginMessage', 'Server error. Is the backend running?', 'error');
    }
  });
}