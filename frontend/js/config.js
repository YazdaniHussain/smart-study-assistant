// ── Smart Config — Works on PC, Mobile & Server ───────
const _hostname = window.location.hostname || 'localhost';
const _protocol = window.location.protocol || 'http:';
const _port     = '5000';

// If served from port 5000 (our Express server), API is same origin
// If served from elsewhere, point to port 5000
const API_BASE = window.location.port === '5000'
  ? `${_protocol}//${_hostname}:5000`
  : `${_protocol}//${_hostname}:5000`;

// ── Auto-fix ALL fetch URLs ───────────────────────────
const _originalFetch = window.fetch;
window.fetch = function(url, options) {
  if (typeof url === 'string') {
    // Fix localhost references
    if (url.includes('localhost:5000')) {
      url = url.replace('http://localhost:5000', API_BASE);
    }
    // Fix file:// references
    if (url.startsWith('file://')) {
      url = url.replace('file://', `${_protocol}//`);
    }
  }
  return _originalFetch.call(this, url, options);
};

console.log('✅ StudyMind API:', API_BASE);