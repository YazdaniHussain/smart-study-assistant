// ── Auth Guard ────────────────────────────────────────
const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || '{}');
if (!token) window.location.href = '.pages/index.html';

document.getElementById('navUsername').textContent = user.username || 'Student';
document.getElementById('navAvatar').textContent   = (user.username || 'S')[0].toUpperCase();

// ── Elements ──────────────────────────────────────────
const video          = document.getElementById('webcamVideo');
const canvas         = document.getElementById('faceCanvas');
const statusDot      = document.getElementById('statusDot');
const statusText     = document.getElementById('statusText');
const emotionEmoji   = document.getElementById('emotionEmoji');
const emotionLabel   = document.getElementById('emotionLabel');
const focusBadge     = document.getElementById('focusScoreBadge');
const ringFill       = document.getElementById('ringFill');
const ringNumber     = document.getElementById('ringNumber');
const ringLabel      = document.getElementById('ringLabel');
const alertBanner    = document.getElementById('alertBanner');
const startBtn       = document.getElementById('startCamBtn');
const stopBtn        = document.getElementById('stopCamBtn');

// ── State ─────────────────────────────────────────────
// const MODELS_URL      = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
// const MODELS_URL      = 'http://localhost:5000/models';
const MODELS_URL      = '/models';
let   stream          = null;
let   detectInterval  = null;
let   sessionStart    = null;
let   sessionTimer    = null;
let   focusedSeconds  = 0;
let   sessionSeconds  = 0;
let   distractions    = 0;
let   lastEmotion     = '';
let   alertTimeout    = null;

// Emotion tracking counts
const emotionCounts = {
  neutral  : 0, happy   : 0, surprised: 0,
  sad      : 0, angry   : 0, fearful  : 0, disgusted: 0
};

// Emotion display map
const emotionMap = {
  neutral  : { emoji: '😐', label: 'Focused',     score: 90, color: '#27AE60' },
  happy    : { emoji: '😊', label: 'Engaged',      score: 95, color: '#2ECC71' },
  surprised: { emoji: '😲', label: 'Distracted',   score: 40, color: '#E67E22' },
  sad      : { emoji: '😢', label: 'Stressed',      score: 30, color: '#E74C3C' },
  angry    : { emoji: '😠', label: 'Frustrated',   score: 25, color: '#C0392B' },
  fearful  : { emoji: '😨', label: 'Anxious',       score: 35, color: '#E74C3C' },
  disgusted: { emoji: '😒', label: 'Bored',         score: 20, color: '#E67E22' },
};

// Circumference for SVG ring (r=54)
const CIRCUMFERENCE = 2 * Math.PI * 54;

// ── Load Models ───────────────────────────────────────
async function loadModels() {
  statusText.textContent = 'Loading AI models...';
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_URL),
    ]);
    statusText.textContent = 'Models loaded — ready!';
    return true;
  } catch (err) {
    statusText.textContent = 'Failed to load models';
    console.error(err);
    return false;
  }
}

// ── Start Camera ──────────────────────────────────────
startBtn.addEventListener('click', async () => {
  startBtn.textContent = '⏳ Loading...';
  startBtn.disabled    = true;

  const loaded = await loadModels();
  if (!loaded) {
    startBtn.textContent = '📷 Start Detection';
    startBtn.disabled    = false;
    alert('Failed to load AI models. Check your internet connection!');
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    video.onloadedmetadata = () => {
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;

      // Update UI
      statusDot.classList.add('active');
      statusText.textContent = 'Detection Active';
      startBtn.style.display = 'none';
      stopBtn.style.display  = 'block';

      // Start session timer
      sessionStart   = Date.now();
      sessionSeconds = 0;
      sessionTimer   = setInterval(() => {
        sessionSeconds++;
        document.getElementById('statSession').textContent = formatTime(sessionSeconds);
      }, 1000);

      // Start detection loop
      detectInterval = setInterval(detectEmotions, 500);

      // Init emotion bars
      renderEmotionBars();
    };

  } catch (err) {
    alert('Camera access denied! Please allow camera access in your browser.');
    startBtn.textContent = '📷 Start Detection';
    startBtn.disabled    = false;
  }
});

// ── Stop Camera ───────────────────────────────────────
stopBtn.addEventListener('click', stopCamera);

function stopCamera() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  clearInterval(detectInterval);
  clearInterval(sessionTimer);

  statusDot.classList.remove('active');
  statusText.textContent = 'Camera Off';
  startBtn.style.display = 'block';
  startBtn.textContent   = '📷 Start Detection';
  startBtn.disabled      = false;
  stopBtn.style.display  = 'none';

  emotionEmoji.textContent  = '😐';
  emotionLabel.textContent  = 'Stopped';
  focusBadge.textContent    = 'Focus: --%';
  hideAlert();

  // Save session data
  if (sessionSeconds > 10) saveSession();
}

// ── Detect Emotions ───────────────────────────────────
async function detectEmotions() {
  if (!video.readyState === 4) return;

  try {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)
      .withFaceExpressions();

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!detections.length) {
      // No face detected
      updateEmotion('noface');
      return;
    }

    // Draw detections
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);
    const resized = faceapi.resizeResults(detections, displaySize);
    faceapi.draw.drawDetections(canvas, resized);
    faceapi.draw.drawFaceExpressions(canvas, resized);

    // Get dominant emotion
    const expressions = detections[0].expressions;
    const dominant    = Object.keys(expressions).reduce((a, b) =>
      expressions[a] > expressions[b] ? a : b
    );

    updateEmotion(dominant, expressions[dominant]);
    updateEmotionCounts(dominant);
    updateFocusRing(dominant);
    checkAlerts(dominant);

  } catch (err) {
    // Silent fail on detection errors
  }
}

// ── Update Emotion Display ────────────────────────────
function updateEmotion(emotion, confidence = 1) {
  if (emotion === 'noface') {
    emotionEmoji.textContent = '🔍';
    emotionLabel.textContent = 'No face detected';
    focusBadge.textContent   = 'Focus: --%';
    return;
  }

  const info = emotionMap[emotion] || emotionMap.neutral;
  emotionEmoji.textContent = info.emoji;
  emotionLabel.textContent = info.label;
  focusBadge.textContent   = `Focus: ${info.score}%`;

  // Count focused time
  if (['neutral', 'happy'].includes(emotion)) {
    focusedSeconds += 0.5; // 500ms interval
    document.getElementById('statFocused').textContent = formatTime(Math.floor(focusedSeconds));
  }

  lastEmotion = emotion;
}

// ── Update Focus Ring ─────────────────────────────────
function updateFocusRing(emotion) {
  const info   = emotionMap[emotion] || emotionMap.neutral;
  const score  = info.score;
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  ringFill.style.strokeDashoffset = offset;
  ringFill.style.stroke           = info.color;
  ringNumber.textContent          = `${score}%`;
  ringLabel.textContent           = info.label;
}

// ── Update Emotion Counts ─────────────────────────────
function updateEmotionCounts(emotion) {
  if (emotionCounts.hasOwnProperty(emotion)) emotionCounts[emotion]++;
  renderEmotionBars();
}

// ── Render Emotion Bars ───────────────────────────────
function renderEmotionBars() {
  const total  = Object.values(emotionCounts).reduce((a, b) => a + b, 0) || 1;
  const colors = {
    neutral  : '#27AE60', happy   : '#2ECC71', surprised: '#E67E22',
    sad      : '#E74C3C', angry   : '#C0392B', fearful  : '#9B59B6', disgusted: '#F39C12'
  };

  document.getElementById('emotionBars').innerHTML = Object.keys(emotionCounts).map(e => {
    const pct   = Math.round((emotionCounts[e] / total) * 100);
    const info  = emotionMap[e];
    return `
      <div class="emotion-bar-row">
        <div class="emotion-bar-label">${info.emoji} ${e}</div>
        <div class="emotion-bar-bg">
          <div class="emotion-bar-fill"
               style="width:${pct}%;background:${colors[e]}"></div>
        </div>
        <div class="emotion-bar-pct">${pct}%</div>
      </div>`;
  }).join('');
}

// ── Alerts ────────────────────────────────────────────
let consecutiveDistracted = 0;

function checkAlerts(emotion) {
  if (['surprised', 'disgusted'].includes(emotion)) {
    consecutiveDistracted++;
    if (consecutiveDistracted >= 6) { // 3 seconds
      distractions++;
      document.getElementById('statDistracted').textContent = distractions;
      showAlert('warning', '⚠️', 'You seem distracted! Refocus on your study material.');
      consecutiveDistracted = 0;
    }
  } else if (['sad', 'angry', 'fearful'].includes(emotion)) {
    showAlert('danger', '😟', 'You look stressed! Take a deep breath and relax.');
  } else {
    consecutiveDistracted = 0;
    if (lastEmotion !== emotion && ['neutral', 'happy'].includes(emotion)) {
      showAlert('success', '✅', 'Great focus! Keep it up!');
    }
  }
}

function showAlert(type, icon, message) {
  clearTimeout(alertTimeout);
  alertBanner.className = `alert-banner visible ${type}`;
  document.getElementById('alertIcon').textContent = icon;
  document.getElementById('alertText').textContent = message;
  alertTimeout = setTimeout(hideAlert, 4000);
}

function hideAlert() {
  alertBanner.classList.remove('visible');
}

// ── Save Session ──────────────────────────────────────
async function saveSession() {
  try {
    const totalEmotions = Object.values(emotionCounts).reduce((a, b) => a + b, 1);
    const focusScore    = Math.round(
      ((emotionCounts.neutral + emotionCounts.happy) / totalEmotions) * 100
    );

    await fetch('http://localhost:5000/api/sessions', {
      method : 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        duration   : Math.round(sessionSeconds / 60),
        focus_score: focusScore,
        emotion    : lastEmotion
      })
    });
  } catch { /* silent */ }
}

// ── Format Time ───────────────────────────────────────
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ── Cleanup on page leave ─────────────────────────────
window.addEventListener('beforeunload', () => {
  if (stream) stream.getTracks().forEach(t => t.stop());
}); 
