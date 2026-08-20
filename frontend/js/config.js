// ── Smart Config — Local + Render compatible ────────────

const hostname = window.location.hostname;
const protocol = window.location.protocol;

// Local development:
//   http://localhost:5500 → backend http://localhost:5000
//   http://127.0.0.1:5500 → backend http://127.0.0.1:5000
//
// Production / Render:
//   https://smart-study-assistant-0n49.onrender.com
//   → API uses the same origin

const isLocal =
  hostname === 'localhost' ||
  hostname === '127.0.0.1';

const API_BASE = isLocal
  ? `${protocol}//${hostname}:5000`
  : '';

// ── Automatically fix old localhost API URLs ────────────

const originalFetch = window.fetch;

window.fetch = function (url, options) {

  if (typeof url === 'string') {

    // Convert old localhost URLs when running locally
    if (isLocal && url.includes('http://localhost:5000')) {
      url = url.replace(
        'http://localhost:5000',
        API_BASE
      );
    }

    // Convert old localhost URLs on Render
    if (!isLocal && url.includes('http://localhost:5000')) {
      url = url.replace(
        'http://localhost:5000',
        ''
      );
    }

    // Convert file:// URLs during local development
    if (url.startsWith('file://')) {
      url = url.replace(
        'file://',
        `${protocol}//`
      );
    }
  }

  return originalFetch.call(this, url, options);
};

console.log(
  '✅ StudyMind API:',
  API_BASE || 'same-origin'
);
