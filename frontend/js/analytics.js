// ── Auth Guard ────────────────────────────────────────
const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || '{}');
if (!token) window.location.href = './index.html';

document.getElementById('navUsername').textContent = user.username || 'Student';
document.getElementById('navAvatar').textContent   = (user.username || 'S')[0].toUpperCase();

const headers = {
  'Content-Type' : 'application/json',
  'Authorization': `Bearer ${token}`
};

// ── Load All Data ─────────────────────────────────────
async function loadAnalytics() {
  try {
    const [tasksRes, goalsRes, sessionsRes] = await Promise.all([
      fetch('http://localhost:5000/api/tasks',    { headers }),
      fetch('http://localhost:5000/api/goals',    { headers }),
      fetch('http://localhost:5000/api/sessions', { headers })
    ]);

    const tasks    = await tasksRes.json();
    const goals    = await goalsRes.json();
    const sessions = sessionsRes.ok ? await sessionsRes.json() : [];

    updateOverview(tasks, goals, sessions);
    renderStudyChart(sessions);
    renderPriorityChart(tasks);
    renderHeatmap(sessions);
  } catch (e) {
    console.error('Analytics error:', e);
    renderStudyChart([]);
    renderPriorityChart([]);
    renderHeatmap([]);
  }
}

// ── Overview Stats ────────────────────────────────────
function updateOverview(tasks, goals, sessions) {
  const totalMins  = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalHours = (totalMins / 60).toFixed(1);
  const avgFocus   = sessions.length
    ? Math.round(sessions.reduce((sum, s) => sum + (s.focus_score || 0), 0) / sessions.length)
    : 0;
  const completed  = tasks.filter(t => t.completed).length;
  const achieved   = goals.filter(g => g.completed).length;

  document.getElementById('totalHours').textContent    = `${totalHours}h`;
  document.getElementById('avgFocus').textContent      = `${avgFocus}%`;
  document.getElementById('tasksCompleted').textContent = completed;
  document.getElementById('goalsAchieved').textContent  = achieved;

  // Streak (days with at least one session)
  const streak = calcStreak(sessions);
  document.getElementById('streakCount').textContent = streak;
}

// ── Calculate Streak ──────────────────────────────────
function calcStreak(sessions) {
  if (!sessions.length) return 0;
  const days = new Set(sessions.map(s =>
    s.started_at ? s.started_at.split('T')[0] : ''
  ));
  let streak = 0;
  let date   = new Date();
  while (true) {
    const str = date.toISOString().split('T')[0];
    if (days.has(str)) { streak++; date.setDate(date.getDate() - 1); }
    else break;
  }
  return streak;
}

// ── Study Hours Chart ─────────────────────────────────
function renderStudyChart(sessions) {
  const days   = [];
  const labels = [];
  const data   = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const str = d.toISOString().split('T')[0];
    days.push(str);
    labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
  }

  days.forEach(day => {
    const mins = sessions
      .filter(s => s.started_at && s.started_at.startsWith(day))
      .reduce((sum, s) => sum + (s.duration || 0), 0);
    data.push(mins);
  });

  const ctx = document.getElementById('studyChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label     : 'Minutes Studied',
        data,
        backgroundColor: [
          'rgba(126,200,227,0.7)',
          'rgba(126,216,192,0.7)',
          'rgba(124,111,205,0.7)',
          'rgba(244,167,185,0.7)',
          'rgba(255,209,102,0.7)',
          'rgba(168,197,160,0.7)',
          'rgba(255,140,140,0.7)',
        ],
        borderRadius: 8,
        borderWidth : 0,
      }]
    },
    options: {
      responsive: true,
      plugins   : { legend: { display: false } },
      scales    : {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { family: 'IBM Plex Mono', size: 11 } }
        },
        x: {
          grid : { display: false },
          ticks: { font: { family: 'DM Sans', size: 12 } }
        }
      }
    }
  });
}

// ── Priority Donut Chart ──────────────────────────────
function renderPriorityChart(tasks) {
  const high   = tasks.filter(t => t.priority === 'high').length;
  const medium = tasks.filter(t => t.priority === 'medium').length;
  const low    = tasks.filter(t => t.priority === 'low').length;

  const ctx = document.getElementById('priorityChart').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels  : ['High', 'Medium', 'Low'],
      datasets: [{
        data           : [high || 1, medium || 1, low || 1],
        backgroundColor: [
          'rgba(232,128,128,0.8)',
          'rgba(255,209,102,0.8)',
          'rgba(109,191,142,0.8)',
        ],
        borderWidth    : 0,
        hoverOffset    : 6,
      }]
    },
    options: {
      responsive: true,
      cutout    : '70%',
      plugins   : {
        legend: {
          position: 'bottom',
          labels  : { font: { family: 'DM Sans', size: 12 }, padding: 16 }
        }
      }
    }
  });
}

// ── Activity Heatmap ──────────────────────────────────
function renderHeatmap(sessions) {
  const grid = document.getElementById('heatmapGrid');
  grid.innerHTML = '';

  const sessionDays = {};
  sessions.forEach(s => {
    if (s.started_at) {
      const day = s.started_at.split('T')[0];
      sessionDays[day] = (sessionDays[day] || 0) + 1;
    }
  });

  for (let i = 27; i >= 0; i--) {
    const d   = new Date();
    d.setDate(d.getDate() - i);
    const str = d.toISOString().split('T')[0];
    const cnt = sessionDays[str] || 0;

    const cell = document.createElement('div');
    cell.className = `heatmap-cell${cnt === 0 ? '' : cnt === 1 ? ' level-1' : cnt === 2 ? ' level-2' : cnt <= 4 ? ' level-3' : ' level-4'}`;
    cell.title = `${str}: ${cnt} session${cnt !== 1 ? 's' : ''}`;
    grid.appendChild(cell);
  }
}

// ── Init ──────────────────────────────────────────────
loadAnalytics(); 
