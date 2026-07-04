// ── Auth Guard ────────────────────────────────────────
const user = JSON.parse(localStorage.getItem('user') || '{}');
if (!localStorage.getItem('token')) window.location.href = '.pages/index.html';

document.getElementById('navUsername').textContent = user.username || 'Student';
document.getElementById('navAvatar').textContent   = (user.username || 'S')[0].toUpperCase();

// ── Timer Config ──────────────────────────────────────
const MODES = {
  pomodoro: { study: 25, break: 5,  label: 'FOCUS SESSION',  color: 'status-focus' },
  short    : { study: 5,  break: 0,  label: 'SHORT BREAK',    color: 'status-break' },
  long     : { study: 15, break: 0,  label: 'LONG BREAK',     color: 'status-long'  },
  custom   : { study: 45, break: 10, label: 'CUSTOM SESSION', color: 'status-focus' },
};

// ── State ─────────────────────────────────────────────
let currentMode     = 'pomodoro';
let isRunning       = false;
let isBreak         = false;
let timeLeft        = 25 * 60;
let totalTime       = 25 * 60;
let interval        = null;
let sessionsCount   = 0;
let breaksCount     = 0;
let totalStudied    = 0;
let sessionStart    = null;

// ── Elements ──────────────────────────────────────────
const timerDisplay  = document.getElementById('timerDisplay');
const timerPhase    = document.getElementById('timerPhase');
const sessionLabel  = document.getElementById('sessionLabel');
const timerProgress = document.getElementById('timerProgress');
const startBtn      = document.getElementById('startBtn');
const resetBtn      = document.getElementById('resetBtn');
const skipBtn       = document.getElementById('skipBtn');

// ── Circumference for SVG circle (r=120) ──────────────
const CIRCUMFERENCE = 2 * Math.PI * 120; // ≈ 754

// ── Format Time ───────────────────────────────────────
function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// ── Update Circle Progress ────────────────────────────
function updateProgress() {
  const ratio  = timeLeft / totalTime;
  const offset = CIRCUMFERENCE * (1 - ratio);
  timerProgress.style.strokeDasharray  = CIRCUMFERENCE;
  timerProgress.style.strokeDashoffset = offset;
}

// ── Update Display ────────────────────────────────────
function updateDisplay() {
  timerDisplay.textContent = formatTime(timeLeft);
  document.title           = `${formatTime(timeLeft)} — StudyMind`;
  updateProgress();
}

// ── Sound Alert ───────────────────────────────────────
function playAlert() {
  const ctx  = new (window.AudioContext || window.webkitAudioContext)();
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  osc.type            = 'sine';
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
  osc.start();
  osc.stop(ctx.currentTime + 1.2);
}

// ── Set Mode ──────────────────────────────────────────
function setMode(mode) {
  clearInterval(interval);
  isRunning   = false;
  isBreak     = false;
  currentMode = mode;
  startBtn.textContent = '▶';

  const cfg   = MODES[mode];
  totalTime   = cfg.study * 60;
  timeLeft    = totalTime;

  // Update label & color
  sessionLabel.textContent = cfg.label;
  timerProgress.className  = `timer-progress ${cfg.color}`;
  timerPhase.textContent   = 'Ready to focus';

  // Custom mode inputs
  document.getElementById('customDuration').classList.toggle(
    'visible', mode === 'custom'
  );

  updateDisplay();
}

// ── Mode Buttons ──────────────────────────────────────
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const mode = btn.dataset.mode;

    if (mode === 'custom') {
      const studyMins = parseInt(document.getElementById('customStudy').value) || 45;
      const breakMins = parseInt(document.getElementById('customBreak').value) || 10;
      MODES.custom.study = studyMins;
      MODES.custom.break = breakMins;
    }

    setMode(mode);
  });
});

// ── Start / Pause ─────────────────────────────────────
startBtn.addEventListener('click', () => {
  if (isRunning) {
    // Pause
    clearInterval(interval);
    isRunning            = false;
    startBtn.textContent = '▶';
    timerPhase.textContent = 'Paused';
  } else {
    // Start
    isRunning            = true;
    startBtn.textContent = '⏸';
    sessionStart         = sessionStart || Date.now();
    timerPhase.textContent = isBreak ? 'Take a break!' : 'Stay focused!';

    interval = setInterval(() => {
      timeLeft--;
      updateDisplay();

      if (timeLeft <= 0) {
        clearInterval(interval);
        isRunning = false;
        playAlert();
        handleSessionEnd();
      }
    }, 1000);
  }
});

// ── Handle Session End ────────────────────────────────
function handleSessionEnd() {
    // Notify user
  if (typeof studyNotifs !== 'undefined') {
    studyNotifs.timerComplete(isBreak ? 'break' : 'focus');
  }
  const cfg = MODES[currentMode];

  if (!isBreak && cfg.break > 0) {
    // Study done → start break
    sessionsCount++;
    totalStudied += cfg.study;
    updateStats();
    saveSession(cfg.study);

    isBreak                  = true;
    totalTime                = cfg.break * 60;
    timeLeft                 = totalTime;
    sessionLabel.textContent = '☕ BREAK TIME';
    timerPhase.textContent   = 'Session complete! Take a break.';
    timerProgress.className  = 'timer-progress status-break';
    startBtn.textContent     = '▶';
    updateDisplay();
  } else {
    // Break done or no break mode
    if (isBreak) breaksCount++;
    if (!isBreak) { sessionsCount++; totalStudied += cfg.study; saveSession(cfg.study); }
    updateStats();
    setMode(currentMode);
    timerPhase.textContent = '✅ Complete! Start another?';
  }
}

// ── Reset ─────────────────────────────────────────────
resetBtn.addEventListener('click', () => {
  clearInterval(interval);
  isRunning    = false;
  isBreak      = false;
  sessionStart = null;
  startBtn.textContent = '▶';
  setMode(currentMode);
});

// ── Skip ──────────────────────────────────────────────
skipBtn.addEventListener('click', () => {
  clearInterval(interval);
  isRunning = false;
  startBtn.textContent = '▶';
  handleSessionEnd();
});

// ── Update Stats Display ──────────────────────────────
function updateStats() {
  document.getElementById('infoSessions').textContent = sessionsCount;
  document.getElementById('infoTime').textContent     = `${totalStudied}m`;
  document.getElementById('infoBreaks').textContent   = breaksCount;
}

// ── Save Session to Backend ───────────────────────────
async function saveSession(duration) {
  try {
    const token = localStorage.getItem('token');
    await fetch('http://localhost:5000/api/sessions', {
      method : 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ duration, focus_score: 80 })
    });
  } catch { /* silent fail — timer still works offline */ }
}

// ── Custom duration live update ───────────────────────
document.getElementById('customStudy')?.addEventListener('change', () => {
  if (currentMode === 'custom') {
    MODES.custom.study = parseInt(document.getElementById('customStudy').value) || 45;
    if (!isRunning) setMode('custom');
  }
});

// ── Init ──────────────────────────────────────────────
setMode('pomodoro'); 
