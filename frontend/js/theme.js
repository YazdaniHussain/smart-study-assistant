// // ── Theme System ──────────────────────────────────────
// const themeToggle = document.getElementById('themeToggle');
// const html        = document.documentElement;

// // Load saved theme
// const savedTheme = localStorage.getItem('theme') || 'light';
// html.setAttribute('data-theme', savedTheme);
// themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

// // Toggle theme on click
// themeToggle.addEventListener('click', () => {
//   const current = html.getAttribute('data-theme');
//   const next    = current === 'dark' ? 'light' : 'dark';
//   html.setAttribute('data-theme', next);
//   localStorage.setItem('theme', next);
//   themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
// }); 

// ── Theme Toggle (Dark/Light) ─────────────────────────
const themeToggle = document.getElementById('themeToggle');
const html        = document.documentElement;

const savedTheme = localStorage.getItem('theme') || 'light';
const savedBg    = localStorage.getItem('bgTheme') || 'lavender';

html.setAttribute('data-theme', savedTheme);
html.setAttribute('data-bg', savedBg);
if (themeToggle) themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
  });
}

// ── Background Color Picker ───────────────────────────
function initColorPicker() {
  const btn   = document.getElementById('themePickerBtn');
  const panel = document.getElementById('themePickerPanel');
  if (!btn || !panel) return;

  // Open / Close panel
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('open');
  });

  document.addEventListener('click', () => panel.classList.remove('open'));
  panel.addEventListener('click', e => e.stopPropagation());

  // Swatch clicks
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    // Mark active
    if (swatch.dataset.bg === savedBg) swatch.classList.add('active');

    swatch.addEventListener('click', () => {
      const bg = swatch.dataset.bg;
      html.setAttribute('data-bg', bg);
      localStorage.setItem('bgTheme', bg);

      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      panel.classList.remove('open');
    });
  });
}

initColorPicker();