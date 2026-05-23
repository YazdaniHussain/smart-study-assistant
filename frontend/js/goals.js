// ── Auth Guard ────────────────────────────────────────
const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || '{}');
if (!token) window.location.href = './index.html';

document.getElementById('navUsername').textContent = user.username || 'Student';
document.getElementById('navAvatar').textContent   = (user.username || 'S')[0].toUpperCase();

const API     = 'http://localhost:5000/api/goals';
const headers = {
  'Content-Type' : 'application/json',
  'Authorization': `Bearer ${token}`
};

let goals       = [];
let activeFilter = 'all';

// ── Fetch Goals ───────────────────────────────────────
async function fetchGoals() {
  try {
    const res = await fetch(API, { headers });
    goals     = await res.json();
    renderGoals();
    updateStats();
  } catch {
    console.error('Failed to fetch goals');
  }
}

// ── Render Goals ──────────────────────────────────────
function renderGoals() {
  const list = document.getElementById('goalsList');

  let filtered = goals.filter(g => {
    if (activeFilter === 'completed') return g.completed;
    if (activeFilter === 'all')       return true;
    return g.type === activeFilter && !g.completed;
  });

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎯</div>
        <p>No goals here yet!</p>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(goal => {
    const pct = Math.min(Math.round((goal.progress / goal.target) * 100), 100);
    return `
      <div class="goal-card ${goal.completed ? 'completed' : ''}">
        <div class="goal-header">
          <div>
            <div class="goal-title">${goal.title}</div>
          </div>
          <span class="goal-type-badge type-${goal.type}">${goal.type}</span>
        </div>

        <div class="goal-progress-wrap">
          <div class="goal-progress-info">
            <span class="goal-progress-text">${goal.progress} / ${goal.target}</span>
            <span class="goal-percent">${pct}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width:${pct}%"></div>
          </div>
        </div>

        <div class="goal-controls">
          ${goal.completed
            ? `<span class="completed-badge">🏆 Goal Achieved!</span>`
            : `
              <input type="number" class="progress-input"
                value="${goal.progress}" min="0" max="${goal.target}"
                id="progress-${goal.id}" />
              <button class="update-btn" onclick="updateProgress(${goal.id})">
                Update
              </button>
            `
          }
          <button class="delete-goal-btn" onclick="deleteGoal(${goal.id})">🗑</button>
        </div>
      </div>`;
  }).join('');
}

// ── Update Stats ──────────────────────────────────────
function updateStats() {
  const completed  = goals.filter(g => g.completed).length;
  const inProgress = goals.filter(g => !g.completed).length;
  document.getElementById('statTotal').textContent     = goals.length;
  document.getElementById('statCompleted').textContent = completed;
  document.getElementById('statInProgress').textContent = inProgress;
}

// ── Add Goal ──────────────────────────────────────────
document.getElementById('addGoalBtn').addEventListener('click', async () => {
  const title  = document.getElementById('goalTitle').value.trim();
  const type   = document.getElementById('goalType').value;
  const target = parseInt(document.getElementById('goalTarget').value);

  if (!title)       return alert('Please enter a goal title!');
  if (!target || target < 1) return alert('Please enter a valid target!');

  try {
    const res  = await fetch(API, {
      method : 'POST',
      headers,
      body   : JSON.stringify({ title, type, target })
    });
    const goal = await res.json();
    goals.unshift(goal);
    renderGoals();
    updateStats();

    document.getElementById('goalTitle').value  = '';
    document.getElementById('goalTarget').value = '';
  } catch {
    alert('Error adding goal');
  }
});

// ── Update Progress ───────────────────────────────────
async function updateProgress(id) {
  const input    = document.getElementById(`progress-${id}`);
  const progress = parseInt(input.value);

  try {
    const res  = await fetch(`${API}/${id}`, {
      method : 'PATCH',
      headers,
      body   : JSON.stringify({ progress })
    });
    const data = await res.json();

    const goal      = goals.find(g => g.id === id);
    goal.progress   = progress;
    goal.completed  = data.completed;
    renderGoals();
    updateStats();
  } catch {
    alert('Error updating progress');
  }
}

// ── Delete Goal ───────────────────────────────────────
async function deleteGoal(id) {
  if (!confirm('Delete this goal?')) return;
  try {
    await fetch(`${API}/${id}`, { method: 'DELETE', headers });
    goals = goals.filter(g => g.id !== id);
    renderGoals();
    updateStats();
  } catch {
    alert('Error deleting goal');
  }
}

// ── Type Filter ───────────────────────────────────────
document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.type;
    renderGoals();
  });
});

// ── Init ──────────────────────────────────────────────
fetchGoals(); 
