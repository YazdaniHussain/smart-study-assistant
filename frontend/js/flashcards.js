// ── Auth Guard ────────────────────────────────────────
const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || '{}');
if (!token) window.location.href = '.pages/index.html';

document.getElementById('navUsername').textContent = user.username || 'Student';
document.getElementById('navAvatar').textContent   = (user.username || 'S')[0].toUpperCase();

const API     = 'http://localhost:5000/api/flashcards';
const headers = {
  'Content-Type' : 'application/json',
  'Authorization': `Bearer ${token}`
};

// ── State ─────────────────────────────────────────────
let currentDeck  = null;
let deckCards    = [];
let currentIndex = 0;
let isFlipped    = false;
let quizIndex    = 0;
let quizScore    = 0;
let quizCards    = [];
let answered     = false;

// ── Fetch & Render Decks ──────────────────────────────
async function fetchDecks() {
  try {
    const res   = await fetch(API, { headers });
    const decks = await res.json();
    renderDecks(decks);
  } catch { console.error('Failed to fetch decks'); }
}

function renderDecks(decks) {
  const grid = document.getElementById('decksGrid');

  if (!decks.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-icon">🃏</div>
        <p>No flashcard decks yet!</p>
        <p style="margin-top:8px;font-size:0.82rem;">
          Go to <a href="./notes.html" style="color:var(--accent-coral);">Smart Notes</a>
          → write or upload content → click 🃏 Generate Flashcards
        </p>
      </div>`;
    return;
  }

  grid.innerHTML = decks.map(deck => `
    <div class="deck-card" onclick="openDeck('${deck.deck_name.replace(/'/g, "\\'")}')">
      <button class="deck-delete-btn"
              onclick="event.stopPropagation(); deleteDeck('${deck.deck_name.replace(/'/g, "\\'")}')">
        🗑
      </button>
      <div class="deck-icon">${deck.source === 'ai' ? '🤖' : '✏️'}</div>
      <div class="deck-title">${deck.deck_name}</div>
      <div class="deck-meta">
        <span>${deck.card_count} card${deck.card_count !== 1 ? 's' : ''}</span>
        <span class="deck-source-badge ${deck.source === 'ai' ? 'badge-ai' : 'badge-manual'}">
          ${deck.source === 'ai' ? 'AI Generated' : 'Manual'}
        </span>
      </div>
    </div>
  `).join('');
}

// ── Open Deck ─────────────────────────────────────────
async function openDeck(deckName) {
  try {
    const res  = await fetch(`${API}/deck/${encodeURIComponent(deckName)}`, { headers });
    deckCards  = await res.json();
    currentDeck = deckName;
    currentIndex = 0;
    isFlipped    = false;

    document.getElementById('decksView').style.display  = 'none';
    document.getElementById('deckView').style.display   = 'block';
    document.getElementById('deckViewTitle').textContent = deckName;
    document.getElementById('deckViewCount').textContent = `${deckCards.length} cards`;

    // Show quick action buttons, hide mode tabs initially
    document.getElementById('deckModeTabs').style.display = 'none';
    document.getElementById('studyMode').style.display    = 'none';
    document.getElementById('manageMode').style.display   = 'none';
    document.getElementById('quizMode').style.display     = 'none';

  } catch { alert('Error loading deck'); }
}

// ── Study / Quiz Quick Buttons ────────────────────────
document.getElementById('studyDeckBtn').addEventListener('click', () => {
  showMode('study');
});

document.getElementById('quizDeckBtn').addEventListener('click', () => {
  showMode('quiz');
  resetQuiz();
});

function showMode(mode) {
  const tabs = document.getElementById('deckModeTabs');
  tabs.style.display = 'flex';

  document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.mode-tab[data-mode="${mode}"]`).classList.add('active');

  document.getElementById('studyMode').style.display  = mode === 'study'  ? 'block' : 'none';
  document.getElementById('manageMode').style.display = mode === 'manage' ? 'block' : 'none';
  document.getElementById('quizMode').style.display   = mode === 'quiz'   ? 'block' : 'none';

  if (mode === 'study')  renderStudy();
  if (mode === 'manage') renderManage();
}

// ── Mode Tab Switching ────────────────────────────────
document.querySelectorAll('.mode-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    showMode(tab.dataset.mode);
  });
});

// ── Back Button ───────────────────────────────────────
document.getElementById('backBtn').addEventListener('click', () => {
  document.getElementById('deckView').style.display  = 'none';
  document.getElementById('decksView').style.display = 'block';
  currentDeck = null;
  fetchDecks();
});

// ── Delete Deck ───────────────────────────────────────
async function deleteDeck(deckName) {
  if (!confirm(`Delete the entire "${deckName}" deck?`)) return;
  try {
    await fetch(`${API}/deck/${encodeURIComponent(deckName)}`, { method: 'DELETE', headers });
    fetchDecks();
  } catch { alert('Error deleting deck'); }
}

// ── New Manual Deck ───────────────────────────────────
document.getElementById('newDeckBtn').addEventListener('click', () => {
  const form = document.getElementById('newDeckForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('createDeckBtn').addEventListener('click', async () => {
  const name = document.getElementById('newDeckName').value.trim();
  if (!name) return alert('Please enter a deck name!');

  // Create deck with one placeholder card
  try {
    await fetch(`${API}/bulk`, {
      method : 'POST',
      headers,
      body   : JSON.stringify({
        flashcards: [{ q: 'Add your first question', a: 'Add your answer here' }],
        source    : 'manual',
        deck_name : name
      })
    });
    document.getElementById('newDeckForm').style.display = 'none';
    document.getElementById('newDeckName').value = '';
    openDeck(name);
    showMode('manage');
  } catch { alert('Error creating deck'); }
});

// ── STUDY MODE ────────────────────────────────────────
function renderStudy() {
  if (!deckCards.length) return;
  if (currentIndex >= deckCards.length) currentIndex = 0;

  const card = deckCards[currentIndex];
  document.getElementById('cardCounter').textContent  =
    `Card ${currentIndex + 1} of ${deckCards.length}`;
  document.getElementById('cardQuestion').textContent = card.question;
  document.getElementById('cardAnswer').textContent   = card.answer;

  const pct = ((currentIndex + 1) / deckCards.length) * 100;
  document.getElementById('deckProgressFill').style.width = `${pct}%`;

  isFlipped = false;
  document.getElementById('flashcardInner').classList.remove('flipped');
  document.getElementById('prevBtn').disabled = currentIndex === 0;
  document.getElementById('nextBtn').disabled = currentIndex === deckCards.length - 1;
}

function flipCard() {
  if (!deckCards.length) return;
  isFlipped = !isFlipped;
  document.getElementById('flashcardInner').classList.toggle('flipped', isFlipped);
}

function prevCard() {
  if (currentIndex > 0) { currentIndex--; renderStudy(); }
}

function nextCard() {
  if (currentIndex < deckCards.length - 1) { currentIndex++; renderStudy(); }
}

// ── MANAGE MODE ───────────────────────────────────────
function renderManage() {
  const list = document.getElementById('cardsList');
  if (!deckCards.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🃏</div><p>No cards yet</p></div>`;
    return;
  }
  list.innerHTML = deckCards.map(card => `
    <div class="card-list-item">
      <div style="flex:1;">
        <div class="card-list-q">${card.question}</div>
        <div class="card-list-a">${card.answer}</div>
      </div>
      <button class="delete-card-btn" onclick="deleteCard(${card.id})">🗑</button>
    </div>
  `).join('');
}

document.getElementById('addCardBtn').addEventListener('click', async () => {
  const q = document.getElementById('cardQ').value.trim();
  const a = document.getElementById('cardA').value.trim();
  if (!q || !a) return alert('Please fill both fields!');

  try {
    const res  = await fetch(API, {
      method : 'POST',
      headers,
      body   : JSON.stringify({ question: q, answer: a, deck_name: currentDeck })
    });
    const card = await res.json();
    deckCards.push(card);
    document.getElementById('deckViewCount').textContent = `${deckCards.length} cards`;
    renderManage();
    document.getElementById('cardQ').value = '';
    document.getElementById('cardA').value = '';
  } catch { alert('Error adding card'); }
});

async function deleteCard(id) {
  if (!confirm('Delete this card?')) return;
  try {
    await fetch(`${API}/${id}`, { method: 'DELETE', headers });
    deckCards = deckCards.filter(c => c.id !== id);
    document.getElementById('deckViewCount').textContent = `${deckCards.length} cards`;
    renderManage();
    renderStudy();
  } catch { alert('Error deleting card'); }
}

// ── QUIZ MODE ─────────────────────────────────────────
function startQuiz() {
  if (deckCards.length < 2) return alert('Need at least 2 cards for a quiz!');

  quizCards = [...deckCards].sort(() => Math.random() - 0.5);
  quizIndex = 0;
  quizScore = 0;
  answered  = false;

  document.getElementById('quizStart').style.display = 'none';
  document.getElementById('quizPlay').style.display  = 'block';
  document.getElementById('quizResult').classList.remove('visible');
  showQuizQuestion();
}

function showQuizQuestion() {
  if (quizIndex >= quizCards.length) { showQuizResult(); return; }

  answered = false;
  const card = quizCards[quizIndex];
  document.getElementById('quizScore').textContent =
    `Question ${quizIndex + 1} of ${quizCards.length}  •  Score: ${quizScore}`;
  document.getElementById('quizQuestion').textContent = card.question;

  const wrong = deckCards
    .filter(c => c.id !== card.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const options = [...wrong.map(c => c.answer), card.answer]
    .sort(() => Math.random() - 0.5);

  document.getElementById('quizOptions').innerHTML = options.map(opt => `
    <button class="quiz-option"
      onclick="checkAnswer(this, \`${opt.replace(/`/g,"'")}\`, \`${card.answer.replace(/`/g,"'")}\`)">
      ${opt}
    </button>
  `).join('');
}

function checkAnswer(btn, selected, correct) {
  if (answered) return;
  answered = true;

  document.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);

  if (selected.trim() === correct.trim()) {
    btn.classList.add('correct');
    quizScore++;
  } else {
    btn.classList.add('wrong');
    document.querySelectorAll('.quiz-option').forEach(b => {
      if (b.textContent.trim() === correct.trim()) b.classList.add('correct');
    });
  }

  setTimeout(() => { quizIndex++; showQuizQuestion(); }, 1200);
}

function showQuizResult() {
  document.getElementById('quizPlay').style.display = 'none';
  document.getElementById('quizResult').classList.add('visible');

  const pct = Math.round((quizScore / quizCards.length) * 100);
  document.getElementById('resultScore').textContent = `${quizScore}/${quizCards.length}`;

  const msgs = {
    100: '🏆 Perfect score! Outstanding!',
    80 : '🎉 Great job! Almost there!',
    60 : '👍 Good effort! Review missed ones!',
    0  : '📚 Keep studying — you\'ll get there!'
  };
  document.getElementById('resultMsg').textContent =
    pct === 100 ? msgs[100] : pct >= 80 ? msgs[80] : pct >= 60 ? msgs[60] : msgs[0];
}

function resetQuiz() {
  document.getElementById('quizStart').style.display = 'block';
  document.getElementById('quizPlay').style.display  = 'none';
  document.getElementById('quizResult').classList.remove('visible');
}

// ── Init ──────────────────────────────────────────────
fetchDecks();