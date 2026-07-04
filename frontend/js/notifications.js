// ── Real-Time Notification System ────────────────────
class StudyNotifications {
  constructor() {
    this.container    = null;
    this.count        = 0;
    this.queue        = [];
    this.studyStart   = null;
    this.breakRemind  = null;
    this.init();
    this.startStudyTracking();
  }

  // ── Create Container ────────────────────────────────
  init() {
    this.container = document.createElement('div');
    this.container.className = 'notif-container';
    document.body.appendChild(this.container);
    this.requestPermission();
  }

  // ── Request Browser Permission ──────────────────────
  requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // ── Show Notification ───────────────────────────────
  show(type, icon, title, body, duration = 5000) {
    const card = document.createElement('div');
    card.className = `notif-card ${type}`;

    card.innerHTML = `
      <div class="notif-icon">${icon}</div>
      <div class="notif-content">
        <div class="notif-title">${title}</div>
        <div class="notif-body">${body}</div>
      </div>
      <button class="notif-close">✕</button>
      <div class="notif-progress" style="width:100%;transition:width ${duration}ms linear;"></div>
    `;

    this.container.appendChild(card);
    this.count++;
    this.updateBadge();

    // Start progress bar
    setTimeout(() => {
      card.querySelector('.notif-progress').style.width = '0%';
    }, 50);

    // Close button
    card.querySelector('.notif-close').addEventListener('click', () => this.remove(card));

    // Auto remove
    setTimeout(() => this.remove(card), duration);

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`StudyMind — ${title}`, { body, icon: '🎓' });
    }

    return card;
  }

  // ── Remove Notification ─────────────────────────────
  remove(card) {
    card.classList.add('removing');
    this.count = Math.max(0, this.count - 1);
    this.updateBadge();
    setTimeout(() => card.remove(), 300);
  }

  // ── Update Bell Badge ───────────────────────────────
  updateBadge() {
    const badge = document.getElementById('notifBadge');
    if (badge) {
      badge.textContent = this.count;
      badge.classList.toggle('show', this.count > 0);
    }
  }

  // ── Preset Notifications ────────────────────────────
  success(title, body)  { return this.show('success', '✅', title, body); }
  warning(title, body)  { return this.show('warning', '⚠️', title, body); }
  info(title, body)     { return this.show('info',    '💡', title, body); }
  danger(title, body)   { return this.show('danger',  '🚨', title, body); }
  achievement(title, body) { return this.show('success', '🏆', title, body, 8000); }

  // ── Study Session Tracking ──────────────────────────
  startStudyTracking() {
    this.studyStart = Date.now();

    // Welcome notification — only show ONCE per browser session
    const alreadyWelcomed = sessionStorage.getItem('welcomeShown');

    if (!alreadyWelcomed) {
      setTimeout(() => {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        this.info(`${greeting}, ${user.username || 'Student'}! 👋`,
          'Ready to have a productive study session?');
        sessionStorage.setItem('welcomeShown', 'true');
      }, 1500);
    }

    // Break reminder every 45 minutes
    this.breakRemind = setInterval(() => {
      const elapsed = Math.round((Date.now() - this.studyStart) / 60000);
      if (elapsed > 0 && elapsed % 45 === 0) {
        this.warning('Break Time! ⏰',
          `You've been studying for ${elapsed} minutes. Take a 5-minute break!`);
      }
    }, 60000);

    // Hydration reminder every 30 minutes
    setInterval(() => {
      this.info('Stay Hydrated! 💧', 'Remember to drink water — it helps your brain focus!');
    }, 30 * 60 * 1000);

    // Motivational boost every 20 minutes
    const boosts = [
      'You\'re doing great — keep going! 💪',
      'Every minute of study counts! 📚',
      'Stay focused — your future self will thank you! 🌟',
      'You\'re building something amazing! 🚀',
    ];

    let boostIndex = 0;
    setInterval(() => {
      this.info('Quick Boost! ✨', boosts[boostIndex % boosts.length]);
      boostIndex++;
    }, 20 * 60 * 1000);
  }

  // ── Task Complete Notification ──────────────────────
  taskComplete(taskName) {
    this.achievement('Task Completed! 🎉', `"${taskName}" is done! Great work!`);
  }

  // ── Goal Achieved Notification ──────────────────────
  goalAchieved(goalName) {
    this.achievement('Goal Achieved! 🏆', `You completed "${goalName}"! Outstanding!`);
  }

  // ── Timer Complete Notification ─────────────────────
  timerComplete(mode) {
    if (mode === 'focus') {
      this.achievement('Focus Session Complete! 🍅',
        'Excellent work! Take a well-deserved break.');
    } else {
      this.success('Break Over! ⚡', 'Ready to get back to studying?');
    }
  }

  // ── Streak Notification ─────────────────────────────
  streakAlert(days) {
    this.achievement(`${days}-Day Streak! 🔥`,
      `You've studied ${days} days in a row — incredible dedication!`);
  }
}

// ── Initialize ────────────────────────────────────────
const studyNotifs = new StudyNotifications();

// ── Socket.IO Real-Time Connection ───────────────────
try {
  const socket = io('http://localhost:5000');

  socket.on('connect', () => {
    console.log('⚡ Real-time connected');
  });

  socket.on('notification', (data) => {
    studyNotifs.show(data.type, data.icon, data.title, data.body);
  });

  socket.on('achievement', (data) => {
    studyNotifs.achievement(data.title, data.body);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
} catch { /* socket.io not available */ } 
