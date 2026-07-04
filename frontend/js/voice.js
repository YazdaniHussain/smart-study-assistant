// ── Voice Control System ──────────────────────────────
class VoiceController {
  constructor() {
    this.recognition  = null;
    this.isListening  = false;
    this.isSupported  = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    this.panelOpen    = false;

    if (!this.isSupported) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    this.init();
    this.createUI();
    this.bindCommands();
  }

  // ── Initialize Speech Recognition ──────────────────
  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition        = new SpeechRecognition();

    this.recognition.continuous   = false;
    this.recognition.interimResults= false;
    this.recognition.lang         = 'en-US';

    this.recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript.toLowerCase().trim();
      this.processCommand(transcript);
    };

    this.recognition.onend = () => {
      this.setListening(false);
    };

    this.recognition.onerror = (e) => {
      this.setListening(false);
      if (e.error !== 'no-speech') {
        this.showToast('error', '❌', `Error: ${e.error}`);
      }
    };
  }

  // ── Create UI Elements ────────────────────────────
  createUI() {
    // Toast notification
    const toast = document.createElement('div');
    toast.id    = 'voiceToast';
    toast.className = 'voice-toast';
    toast.innerHTML = `
      <span class="voice-toast-icon" id="voiceToastIcon">🎤</span>
      <span id="voiceToastText">Listening...</span>`;
    document.body.appendChild(toast);

    // Commands panel
    const panel = document.createElement('div');
    panel.id    = 'voicePanel';
    panel.className = 'voice-panel';
    panel.innerHTML = `
      <h4>🎤 Voice Commands</h4>
      <div class="voice-cmd-list">
        ${this.getCommandsList().map(c => `
          <div class="voice-cmd-item">
            <span class="voice-cmd-text">"${c.cmd}"</span>
            <span class="voice-cmd-arrow">→</span>
            <span class="voice-cmd-action">${c.action}</span>
          </div>`).join('')}
      </div>`;
    document.body.appendChild(panel);

    // Floating button
    const btn   = document.createElement('button');
    btn.id      = 'voiceFloatBtn';
    btn.className = 'voice-float-btn';
    btn.title   = 'Voice Control (click to listen)';
    btn.innerHTML = '🎤';
    btn.addEventListener('click', () => this.toggle());
    document.body.appendChild(btn);

    // Long press to show commands
    let pressTimer;
    btn.addEventListener('mousedown', () => {
      pressTimer = setTimeout(() => {
        this.togglePanel();
      }, 600);
    });
    btn.addEventListener('mouseup',   () => clearTimeout(pressTimer));
    btn.addEventListener('mouseleave', () => clearTimeout(pressTimer));
  }

  // ── Commands List ─────────────────────────────────
  getCommandsList() {
    return [
      { cmd: 'start timer',    action: 'Start timer' },
      { cmd: 'stop timer',     action: 'Stop timer' },
      { cmd: 'pause timer',    action: 'Pause timer' },
      { cmd: 'open dashboard', action: 'Go to dashboard' },
      { cmd: 'open notes',     action: 'Go to notes' },
      { cmd: 'open tasks',     action: 'Go to tasks' },
      { cmd: 'open calendar',  action: 'Go to calendar' },
      { cmd: 'open goals',     action: 'Go to goals' },
      { cmd: 'open timer',     action: 'Go to timer' },
      { cmd: 'dark mode',      action: 'Enable dark mode' },
      { cmd: 'light mode',     action: 'Enable light mode' },
    ];
  }

  // ── Process Voice Command ─────────────────────────
  processCommand(transcript) {
    this.showToast('info', '🎤', `"${transcript}"`);

    // Navigation commands
    // ── Get base URL ──────────────────────────────────────
const BASE_URL = `${window.location.protocol}//${window.location.host}`;

const navMap = {
  'open dashboard'  : `${BASE_URL}/pages/dashboard.html`,
  'go to dashboard' : `${BASE_URL}/pages/dashboard.html`,
  'open notes'      : `${BASE_URL}/pages/notes.html`,
  'go to notes'     : `${BASE_URL}/pages/notes.html`,
  'open tasks'      : `${BASE_URL}/pages/tasks.html`,
  'go to tasks'     : `${BASE_URL}/pages/tasks.html`,
  'open calendar'   : `${BASE_URL}/pages/calendar.html`,
  'go to calendar'  : `${BASE_URL}/pages/calendar.html`,
  'open goals'      : `${BASE_URL}/pages/goals.html`,
  'go to goals'     : `${BASE_URL}/pages/goals.html`,
  'open timer'      : `${BASE_URL}/pages/timer.html`,
  'go to timer'     : `${BASE_URL}/pages/timer.html`,
  'open flashcards' : `${BASE_URL}/pages/flashcards.html`,
  'open analytics'  : `${BASE_URL}/pages/analytics.html`,
};

    for (const [cmd, url] of Object.entries(navMap)) {
      if (transcript.includes(cmd)) {
        this.showToast('success', '✅', `Opening ${cmd.replace('open ', '')}...`);
        setTimeout(() => window.location.href = url, 800);
        return;
      }
    }

    // Timer commands
    if (transcript.includes('start timer') || transcript.includes('start study')) {
      const btn = document.getElementById('startBtn');
      if (btn) { btn.click(); this.showToast('success', '▶', 'Timer started!'); }
      else this.showToast('error', '❌', 'Open the timer page first!');
      return;
    }

    if (transcript.includes('stop timer') || transcript.includes('reset timer')) {
      const btn = document.getElementById('resetBtn');
      if (btn) { btn.click(); this.showToast('success', '⏹', 'Timer stopped!'); }
      else this.showToast('error', '❌', 'Open the timer page first!');
      return;
    }

    if (transcript.includes('pause timer') || transcript.includes('pause')) {
      const btn = document.getElementById('startBtn');
      if (btn) { btn.click(); this.showToast('success', '⏸', 'Timer paused!'); }
      else this.showToast('error', '❌', 'Open the timer page first!');
      return;
    }

    // Theme commands
    if (transcript.includes('dark mode')) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      const toggle = document.getElementById('themeToggle');
      if (toggle) toggle.textContent = '☀️';
      this.showToast('success', '🌙', 'Dark mode enabled!');
      return;
    }

    if (transcript.includes('light mode')) {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      const toggle = document.getElementById('themeToggle');
      if (toggle) toggle.textContent = '🌙';
      this.showToast('success', '☀️', 'Light mode enabled!');
      return;
    }

    // Add task
    if (transcript.includes('add task') || transcript.includes('new task')) {
      const input = document.getElementById('taskTitle');
      if (input) { input.focus(); this.showToast('success', '✅', 'Ready to add task!'); }
      else {
        this.showToast('info', '↗', 'Going to tasks...');
        setTimeout(() => window.location.href = './tasks.html', 800);
      }
      return;
    }

    // New note
    if (transcript.includes('new note') || transcript.includes('add note')) {
      const btn = document.getElementById('newNoteBtn');
      if (btn) { btn.click(); this.showToast('success', '📝', 'New note created!'); }
      else {
        this.showToast('info', '↗', 'Going to notes...');
        setTimeout(() => window.location.href = './notes.html', 800);
      }
      return;
    }

    // Help
    if (transcript.includes('help') || transcript.includes('commands')) {
      this.togglePanel();
      this.showToast('info', '💡', 'Showing available commands!');
      return;
    }

    // Unrecognized
    this.showToast('error', '❓', `Command not found: "${transcript}"`);
  }

  // ── Toggle Listening ──────────────────────────────
  toggle() {
    if (this.isListening) {
      this.recognition.stop();
      this.setListening(false);
    } else {
      try {
        this.recognition.start();
        this.setListening(true);
        this.showToast('info', '🎤', 'Listening... speak now!');
      } catch (err) {
        this.showToast('error', '❌', 'Could not start microphone');
      }
    }
  }

  // ── Toggle Panel ──────────────────────────────────
  togglePanel() {
    const panel = document.getElementById('voicePanel');
    this.panelOpen = !this.panelOpen;
    panel.classList.toggle('open', this.panelOpen);
  }

  // ── Set Listening State ───────────────────────────
  setListening(state) {
    this.isListening = state;
    const btn        = document.getElementById('voiceFloatBtn');
    if (btn) {
      btn.classList.toggle('listening', state);
      btn.innerHTML = state ? '🔴' : '🎤';
    }
    if (!state) {
      setTimeout(() => {
        const toast = document.getElementById('voiceToast');
        if (toast) toast.classList.remove('show');
      }, 2000);
    }
  }

  // ── Show Toast ────────────────────────────────────
  showToast(type, icon, message) {
    const toast = document.getElementById('voiceToast');
    if (!toast) return;

    toast.className = `voice-toast ${type} show`;
    document.getElementById('voiceToastIcon').textContent = icon;
    document.getElementById('voiceToastText').textContent = message;

    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // ── Bind keyboard shortcut (Space bar) ───────────
  bindCommands() {
    document.addEventListener('keydown', (e) => {
      // Alt + V to toggle voice
      if (e.altKey && e.key === 'v') {
        e.preventDefault();
        this.toggle();
      }
    });
  }
}

// ── Initialize Voice Control ──────────────────────────
const voice = new VoiceController(); 
