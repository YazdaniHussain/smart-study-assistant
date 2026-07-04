// ── Theme ─────────────────────────────────────────────
const html     = document.documentElement;
const themeBtn = document.getElementById('themeToggleBtn');
const saved    = localStorage.getItem('landingTheme') || 'dark';

html.setAttribute('data-theme', saved);
updateThemeBtn(saved);

themeBtn?.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('landingTheme', next);
  updateThemeBtn(next);
});

function updateThemeBtn(theme) {
  if (themeBtn) themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ── Cursor Tooltip ────────────────────────────────────
const tooltip = document.createElement('div');
tooltip.className = 'cursor-tooltip';
tooltip.innerHTML = `
  <span class="tooltip-emoji" id="ttEmoji"></span>
  <span class="tooltip-name"  id="ttName"></span>
  <span class="tooltip-sep">—</span>
  <span class="tooltip-desc"  id="ttDesc"></span>`;
document.body.appendChild(tooltip);

let tooltipVisible = false;

function showTooltip(e, item) {
  document.getElementById('ttEmoji').textContent = item.emoji;
  document.getElementById('ttName').textContent  = item.label;
  document.getElementById('ttDesc').textContent  = item.desc;
  tooltip.classList.add('show');
  tooltipVisible = true;
  moveTooltip(e);
}

function hideTooltip() {
  tooltip.classList.remove('show');
  tooltipVisible = false;
}

function moveTooltip(e) {
  const x = e.clientX + 16;
  const y = e.clientY - 44;
  // Keep within viewport
  const maxX = window.innerWidth  - tooltip.offsetWidth  - 16;
  const maxY = window.innerHeight - tooltip.offsetHeight - 8;
  tooltip.style.left = Math.min(x, maxX) + 'px';
  tooltip.style.top  = Math.min(y < 0 ? e.clientY + 16 : y, maxY) + 'px';
}

document.addEventListener('mousemove', e => {
  if (tooltipVisible) moveTooltip(e);
});

// ── Orbital Data ──────────────────────────────────────
const orbitData = {
  1: [
    { emoji:'⏱️', label:'Smart Timer',  desc:'AI-powered Pomodoro study sessions',      color:'#FF6B58', angle:0   },
    { emoji:'📷', label:'Emotion AI',   desc:'Real-time webcam focus & mood tracking',  color:'#14B8A6', angle:120 },
    { emoji:'🎤', label:'Voice Control',desc:'Hands-free voice command navigation',     color:'#FBB924', angle:240 },
  ],
  2: [
    { emoji:'✅', label:'Task Manager', desc:'Priority tasks with smart deadline alerts',color:'#60A5FA', angle:0   },
    { emoji:'🧾', label:'AI Notes',     desc:'Smart notes with AI summaries & keywords',color:'#F472B6', angle:90  },
    { emoji:'🎯', label:'Goal Tracker', desc:'Daily, weekly & monthly milestones',      color:'#34D399', angle:180 },
    { emoji:'🗓️', label:'Calendar',     desc:'Plan & schedule your study sessions',     color:'#FBBF24', angle:270 },
  ],
  3: [
    { emoji:'📊', label:'Analytics',   desc:'Charts, streaks & productivity insights', color:'#FF6B58', angle:0   },
    { emoji:'🃏', label:'Flashcards',  desc:'AI-generated quiz decks from your notes', color:'#14B8A6', angle:90  },
    { emoji:'🌙', label:'Focus Mode',  desc:'Distraction-free deep work environment',  color:'#A78BFA', angle:180 },
    { emoji:'🔔', label:'Alerts',      desc:'Smart break & hydration reminders',       color:'#FBB924', angle:270 },
  ],
};

const radii = { 1: 110, 2: 180, 3: 260 };

const coreEmoji = document.getElementById('coreEmoji');
const coreName  = document.getElementById('coreName');

// ── Build Orbits ──────────────────────────────────────
function buildOrbit(ring, items, radius) {
  const container = document.getElementById(`orbit${ring}`);

  items.forEach(item => {
    const rad = (item.angle * Math.PI) / 180;
    const x   = radius + radius * Math.cos(rad) - 28;
    const y   = radius + radius * Math.sin(rad) - 28;

    const el = document.createElement('div');
    el.className = 'orbital-item';
    el.style.cssText = `
      left:${x}px; top:${y}px;
      background:${item.color}18;
      border:1.5px solid ${item.color}45;
      box-shadow:0 0 14px ${item.color}22;
    `;
    el.innerHTML = `
      <div class="item-icon">${item.emoji}</div>
      <div class="item-label">${item.label.split(' ')[0]}</div>
    `;

    // Mouse events
    el.addEventListener('mouseenter', (e) => {
      showTooltip(e, item);
      coreEmoji.textContent = item.emoji;
      coreName.textContent  = item.label;
      el.style.boxShadow    = `0 0 30px ${item.color}80, 0 0 60px ${item.color}30`;
      el.style.borderColor  = `${item.color}90`;
      el.style.transform    = 'scale(1.35)';
    });

    el.addEventListener('mouseleave', () => {
      hideTooltip();
      coreEmoji.textContent = '🎓';
      coreName.textContent  = 'StudyMind';
      el.style.boxShadow    = `0 0 14px ${item.color}22`;
      el.style.borderColor  = `${item.color}45`;
      el.style.transform    = '';
    });

    container.appendChild(el);
  });
}

buildOrbit(1, orbitData[1], radii[1]);
buildOrbit(2, orbitData[2], radii[2]);
buildOrbit(3, orbitData[3], radii[3]);

// ── Quotes ────────────────────────────────────────────
const quotes = [
  { text:"The secret of getting ahead is getting started.",                     author:"— Mark Twain" },
  { text:"It always seems impossible until it's done.",                         author:"— Nelson Mandela" },
  { text:"Don't watch the clock. Do what it does. Keep going.",                author:"— Sam Levenson" },
  { text:"Success is the sum of small efforts repeated day in and day out.",   author:"— Robert Collier" },
  { text:"The expert in anything was once a beginner.",                         author:"— Helen Hayes" },
  { text:"Dreams don't work unless you do.",                                    author:"— John C. Maxwell" },
  { text:"An investment in knowledge pays the best interest.",                  author:"— Benjamin Franklin" },
  { text:"The beautiful thing about learning is that no one can take it away.", author:"— B.B. King" },
];

let currentQ = 0;
const qText   = document.getElementById('quoteText');
const qAuthor = document.getElementById('quoteAuthor');
const qDots   = document.getElementById('quoteDots');

quotes.forEach((_, i) => {
  const d = document.createElement('div');
  d.className = `quote-dot${i === 0 ? ' active' : ''}`;
  d.addEventListener('click', () => goQ(i));
  qDots.appendChild(d);
});

function goQ(i) {
  qText.style.opacity = qAuthor.style.opacity = '0';
  setTimeout(() => {
    currentQ = i;
    qText.textContent   = `"${quotes[i].text}"`;
    qAuthor.textContent = quotes[i].author;
    qText.style.opacity = qAuthor.style.opacity = '1';
    document.querySelectorAll('.quote-dot').forEach((d,j) => d.classList.toggle('active', j===i));
  }, 400);
}

goQ(0);
setInterval(() => goQ((currentQ + 1) % quotes.length), 5000);

// ── Particles ─────────────────────────────────────────
function particles() {
  const c = document.createElement('canvas');
  c.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;opacity:0.4';
  document.body.prepend(c);
  const ctx = c.getContext('2d');
  const dots = Array.from({length:55}, () => ({
    x:Math.random()*innerWidth, y:Math.random()*innerHeight,
    r:Math.random()*1.4+0.3,
    dx:(Math.random()-.5)*.25, dy:(Math.random()-.5)*.25,
    a:Math.random()*.5+.1,
  }));

  window.addEventListener('resize', () => { c.width=innerWidth; c.height=innerHeight; });
  c.width=innerWidth; c.height=innerHeight;

  (function draw() {
    ctx.clearRect(0,0,c.width,c.height);
    const dark = html.getAttribute('data-theme') !== 'light';
    dots.forEach(d => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI*2);
      ctx.fillStyle = dark
        ? `rgba(255,107,88,${d.a * 0.6})`
        : `rgba(232,82,42,${d.a * 0.2})`;
      ctx.fill();
      d.x+=d.dx; d.y+=d.dy;
      if(d.x<0||d.x>c.width)  d.dx*=-1;
      if(d.y<0||d.y>c.height) d.dy*=-1;
    });
    requestAnimationFrame(draw);
  })();
}
particles();