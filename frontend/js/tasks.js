// ── Auth Guard ────────────────────────────────────────
const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || '{}');
if (!token) window.location.href = './index.html';

document.getElementById('navUsername').textContent = user.username || 'Student';
document.getElementById('navAvatar').textContent   = (user.username || 'S')[0].toUpperCase();

const API = 'http://localhost:5000/api/tasks';
const headers = {
  'Content-Type' : 'application/json',
  'Authorization': `Bearer ${token}`
};

let tasks       = [];
let activeFilter = 'all';

// ── Fetch Tasks ───────────────────────────────────────
async function fetchTasks() {
  try {
    const res  = await fetch(API, { headers });
    tasks      = await res.json();
    renderTasks();
  } catch {
    console.error('Failed to fetch tasks');
  }
}

// ── Render Tasks ──────────────────────────────────────
function renderTasks() {
  const list = document.getElementById('taskList');

  // <button class="task-action-btn delete" onclick="deleteTask(${task.id})">🗑</button>
  let filtered = tasks.filter(t => {
    if (activeFilter === 'active')    return !t.completed;
    if (activeFilter === 'completed') return t.completed;
    if (activeFilter === 'high')      return t.priority === 'high';
    if (activeFilter === 'medium')    return t.priority === 'medium';
    if (activeFilter === 'low')       return t.priority === 'low';
    return true;
  });

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <p>No tasks here yet!</p>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(task => {
    // const isOverdue = task.due_date && !task.completed &&
    //                   new Date(task.due_date) < new Date();
    // const dueText   = task.due_date
    //   ? `📅 ${new Date(task.due_date).toLocaleDateString()}`
    //   : '';
    const rawDate  = task.due_date ? task.due_date.split('T')[0] : null;
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = rawDate && !task.completed && rawDate < todayStr;

    const dueText = rawDate ? (() => {
    const [y, m, d]    = rawDate.split('-').map(Number);
    const monthNames   = ['Jan','Feb','Mar','Apr','May','Jun',
                        'Jul','Aug','Sep','Oct','Nov','Dec'];
    return `📅 ${monthNames[m - 1]} ${d}, ${y}`;
    })() : '';

    return `
      <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
        <div class="task-checkbox ${task.completed ? 'checked' : ''}"
             onclick="toggleTask(${task.id})">
          ${task.completed ? '✓' : ''}
        </div>
        <div class="task-content">
          <div class="task-title">${task.title}</div>
          <div class="task-meta">
            <span class="priority-badge priority-${task.priority}">
              ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
            ${dueText ? `<span class="due-date ${isOverdue ? 'overdue' : ''}">${isOverdue ? '⚠️ Overdue · ' : ''}${dueText}</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="task-action-btn"
            onclick="toggleTask(${task.id})"
            title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
            ${task.completed ? '↩' : '✓'}
          </button>
          <button class="task-action-btn delete"
            onclick="deleteTask(${task.id})"
            title="Delete task">
            🗑
          </button>
        </div>
      </div>`;
  }).join('');
}

// ── Add Task ──────────────────────────────────────────
document.getElementById('addTaskBtn').addEventListener('click', async () => {
  const title    = document.getElementById('taskTitle').value.trim();
  const desc     = document.getElementById('taskDesc').value.trim();
  const priority = document.getElementById('taskPriority').value;
  const due_date = document.getElementById('taskDue').value;

  if (!title) return alert('Please enter a task title!');

  try {
    const res  = await fetch(API, {
      method : 'POST',
      headers,
      body   : JSON.stringify({ title, description: desc, priority, due_date })
    });
    const task = await res.json();
    tasks.unshift(task);
    renderTasks();

    // Clear inputs
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDesc').value  = '';
    document.getElementById('taskDue').value   = '';
  } catch {
    alert('Error adding task');
  }
});

// ── Toggle Complete ───────────────────────────────────
async function toggleTask(id) {
  try {
    await fetch(`${API}/${id}/toggle`, { method: 'PATCH', headers });
    const task    = tasks.find(t => t.id === id);
    task.completed = !task.completed;
    renderTasks();
  } catch {
    alert('Error updating task');
  }
}

// ── Delete Task ───────────────────────────────────────
async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    await fetch(`${API}/${id}`, { method: 'DELETE', headers });
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
  } catch {
    alert('Error deleting task');
  }
}

// ── Filter Buttons ────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderTasks();
  });
});

// ── Init ──────────────────────────────────────────────
fetchTasks(); 

// ── Clear All Completed Tasks ─────────────────────────
document.getElementById('clearCompletedBtn').addEventListener('click', async () => {
  const completed = tasks.filter(t => t.completed);
  if (completed.length === 0) return alert('No completed tasks to clear!');
  if (!confirm(`Delete ${completed.length} completed task(s)?`)) return;

  try {
    await Promise.all(
      completed.map(t => fetch(`${API}/${t.id}`, { method: 'DELETE', headers }))
    );
    tasks = tasks.filter(t => !t.completed);
    renderTasks();
  } catch {
    alert('Error clearing tasks');
  }
});