// ── Auth Guard ────────────────────────────────────────
const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || '{}');
if (!token) window.location.href = '.pages/index.html';

// ── Timer Config ──────────────────────────────────────
const MODES = {
  pomodoro: { time: 25 * 60, label: 'Pomodoro',    break: 5  },
  short   : { time: 5  * 60, label: 'Short Break', break: 0  },
  long    : { time: 15 * 60, label: 'Long Break',  break: 0  },
};

// ── State ─────────────────────────────────────────────
let currentMode    = 'pomodoro';
let timeLeft       = MODES.pomodoro.time;
let totalTime      = MODES.pomodoro.time;
let isRunning      = false;
let isBreak        = false;
let interval       = null;
let soundCtx       = null;
let sessionCount   = 0;
let focusedMinutes = 0;

const CIRCUMFERENCE = 2 * Math.PI * 113;

// ── Clock ─────────────────────────────────────────────
function updateClock() {
  const now  = new Date();
  const time = now.toLocaleTimeString('en-US', { hour12: false });
  document.getElementById('focusClock').textContent = time;
}
setInterval(updateClock, 1000);
updateClock();

// ── Focus Message ─────────────────────────────────────
const hour = new Date().getHours();
const msg  = hour < 12 ? 'morning focus session' :
             hour < 17 ? 'afternoon deep work'   :
             hour < 21 ? 'evening study session' : 'late night grind';
document.getElementById('focusMessage').textContent = msg;

// ── Quotes ────────────────────────────────────────────
const quotes = [
  '"the secret of getting ahead is getting started."',
  '"it always seems impossible until it\'s done."',
  '"don\'t watch the clock. do what it does. keep going."',
  '"success is the sum of small efforts repeated day in and day out."',
  '"the expert in anything was once a beginner."',
  '"believe you can and you\'re halfway there."',
  '"push yourself, because no one else is going to do it for you."',
];
document.getElementById('focusQuote').textContent =
  quotes[Math.floor(Math.random() * quotes.length)];

// ── Load Current Task ─────────────────────────────────
async function loadCurrentTask() {
  try {
    const res   = await fetch('http://localhost:5000/api/tasks', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const tasks = await res.json();
    const active = tasks.find(t => !t.completed);
    document.getElementById('focusTaskText').textContent =
      active ? active.title : 'No active tasks — enjoy your focus session!';
  } catch {
    document.getElementById('focusTaskText').textContent = 'Could not load tasks';
  }
}
loadCurrentTask();

// ── Timer Display ─────────────────────────────────────
function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function updateDisplay() {
  document.getElementById('focusTimerDisplay').textContent = formatTime(timeLeft);
  document.title = `${formatTime(timeLeft)} — Focus Mode`;

  const offset = CIRCUMFERENCE - (timeLeft / totalTime) * CIRCUMFERENCE;
  document.getElementById('focusRing').style.strokeDashoffset = offset;
}

// ── Update Stats ──────────────────────────────────────
function updateStats() {
  document.getElementById('statSessions').textContent = sessionCount;
  document.getElementById('statMinutes').textContent  = `${focusedMinutes}m`;
}

// ── Start / Pause ─────────────────────────────────────
const startBtn = document.getElementById('focusStartBtn');

startBtn.addEventListener('click', toggleTimer);

function toggleTimer() {
  if (isRunning) {
    clearInterval(interval);
    isRunning = false;
    startBtn.innerHTML = '▶';
  } else {
    isRunning = true;
    startBtn.innerHTML = '⏸';
    interval = setInterval(() => {
      timeLeft--;
      updateDisplay();
      if (timeLeft <= 0) {
        clearInterval(interval);
        isRunning = false;
        startBtn.innerHTML = '▶';
        onTimerEnd();
      }
    }, 1000);
  }
}

// ── Reset ─────────────────────────────────────────────
document.getElementById('focusResetBtn').addEventListener('click', () => {
  clearInterval(interval);
  isRunning = false;
  isBreak   = false;
  timeLeft  = MODES[currentMode].time;
  totalTime = timeLeft;
  startBtn.innerHTML = '▶';
  document.getElementById('focusTimerLabel').textContent = MODES[currentMode].label;
  updateDisplay();
});

// ── Skip ──────────────────────────────────────────────
document.getElementById('focusSkipBtn').addEventListener('click', () => {
  clearInterval(interval);
  isRunning = false;
  startBtn.innerHTML = '▶';
  onTimerEnd();
});

// ── Timer End ─────────────────────────────────────────
function onTimerEnd() {
  playAlert();

  if (!isBreak && MODES[currentMode].break > 0) {
    // Study session done → start break
    sessionCount++;
    focusedMinutes += Math.round(MODES[currentMode].time / 60);
    updateStats();

    isBreak   = true;
    timeLeft  = MODES[currentMode].break * 60;
    totalTime = timeLeft;
    document.getElementById('focusTimerLabel').textContent = 'Break Time ☕';
    document.getElementById('sessionComplete').classList.add('show');

  } else {
    // Break done
    if (isBreak) sessionCount++;
    isBreak   = false;
    timeLeft  = MODES[currentMode].time;
    totalTime = timeLeft;
    document.getElementById('focusTimerLabel').textContent = MODES[currentMode].label;
  }

  updateDisplay();
  updateStats();
}

// ── Start Break ───────────────────────────────────────
function startBreak() {
  document.getElementById('sessionComplete').classList.remove('show');
  toggleTimer();
}

// ── Sound Alert ───────────────────────────────────────
function playAlert() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  } catch { /* silent */ }
}

// ── Ambient Sounds ────────────────────────────────────
function playAmbient(type) {
  if (soundCtx) { soundCtx.close(); soundCtx = null; }
  if (type === 'none') return;

  soundCtx = new (window.AudioContext || window.webkitAudioContext)();

  if (type === 'lofi') {
    const osc  = soundCtx.createOscillator();
    const gain = soundCtx.createGain();
    osc.type            = 'sine';
    osc.frequency.value = 180;
    gain.gain.value     = 0.04;
    osc.connect(gain);
    gain.connect(soundCtx.destination);
    osc.start();
    return;
  }

  // Noise-based sounds (rain, forest, coffee, waves)
  const bufferSize = soundCtx.sampleRate * 2;
  const buffer     = soundCtx.createBuffer(1, bufferSize, soundCtx.sampleRate);
  const data       = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = soundCtx.createBufferSource();
  const filter = soundCtx.createBiquadFilter();
  const gain   = soundCtx.createGain();

  source.buffer = buffer;
  source.loop   = true;

  filter.type = 'lowpass';
  filter.frequency.value =
    type === 'rain'   ? 900  :
    type === 'forest' ? 600  :
    type === 'waves'  ? 400  : 350;

  gain.gain.value = type === 'coffee' ? 0.08 : 0.12;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(soundCtx.destination);
  source.start();
}

document.querySelectorAll('.sound-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    playAmbient(btn.dataset.sound);
  });
});

// ── Mode Buttons ──────────────────────────────────────
document.querySelectorAll('.focus-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.focus-mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
    clearInterval(interval);
    isRunning   = false;
    isBreak     = false;
    timeLeft    = MODES[currentMode].time;
    totalTime   = timeLeft;
    startBtn.innerHTML = '▶';
    document.getElementById('focusTimerLabel').textContent = MODES[currentMode].label;
    updateDisplay();
  });
});

// ── Exit Focus Mode ───────────────────────────────────
function exitFocus() {
  clearInterval(interval);
  if (soundCtx) { soundCtx.close(); soundCtx = null; }
  window.location.href = '.pages/dashboard.html';
}

// ── Escape Key ────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') exitFocus();
});

// ── Save Session to Backend ───────────────────────────
window.addEventListener('beforeunload', async () => {
  if (focusedMinutes > 0) {
    try {
      await fetch('http://localhost:5000/api/sessions', {
        method : 'POST',
        headers: {
          'Content-Type' : 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          duration   : focusedMinutes,
          focus_score: Math.min(100, sessionCount * 20),
          emotion    : 'focused'
        })
      });
    } catch { /* silent */ }
  }
});

// ── Init ──────────────────────────────────────────────
updateDisplay();
updateStats();