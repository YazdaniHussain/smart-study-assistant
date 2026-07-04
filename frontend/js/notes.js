// ── Auth Guard ────────────────────────────────────────
const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || '{}');
if (!token) window.location.href = '.pages/index.html';

document.getElementById('navUsername').textContent = user.username || 'Student';
document.getElementById('navAvatar').textContent   = (user.username || 'S')[0].toUpperCase();

const API     = 'http://localhost:5000/api/notes';
const headers = {
  'Content-Type' : 'application/json',
  'Authorization': `Bearer ${token}`
};

let notes       = [];
let activeNote  = null;
let saveTimeout = null;

// ── Fetch Notes ───────────────────────────────────────
async function fetchNotes() {
  try {
    const res = await fetch(API, { headers });
    notes     = await res.json();
    renderSidebar();
  } catch { console.error('Failed to fetch notes'); }
}

// ── Render Sidebar ────────────────────────────────────
function renderSidebar(filter = '') {
  const list     = document.getElementById('notesList');
  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(filter.toLowerCase()) ||
    (n.content || '').toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    list.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:0.85rem;">
      ${filter ? 'No results found' : 'No notes yet'}</div>`;
    return;
  }

  list.innerHTML = filtered.map(note => `
    <div class="note-list-item ${activeNote?.id === note.id ? 'active' : ''}"
         onclick="openNote(${note.id})">
      <div class="note-list-title">${note.title || 'Untitled'}</div>
      <div class="note-list-preview">${(note.content || '').substring(0, 60)}...</div>
      <div class="note-list-date">${new Date(note.created_at).toLocaleDateString()}</div>
    </div>
  `).join('');
}

// ── Open Note ─────────────────────────────────────────
function openNote(id) {
  activeNote = notes.find(n => n.id === id);
  if (!activeNote) return;

  document.getElementById('editorEmpty').style.display   = 'none';
  document.getElementById('editorContent').style.display = 'block';
  document.getElementById('noteTitleInput').value        = activeNote.title || '';
  document.getElementById('noteContentInput').value      = activeNote.content || '';
  document.getElementById('aiPanel').classList.remove('visible');
  document.getElementById('autoSaveStatus').textContent  = '✏️ Editing';
  document.getElementById('analyzeDocBtn').style.display = 'none';

  renderSidebar(document.getElementById('searchNotes').value);
}

// ── New Note ──────────────────────────────────────────
document.getElementById('newNoteBtn').addEventListener('click', async () => {
  try {
    const res  = await fetch(API, {
      method : 'POST',
      headers,
      body   : JSON.stringify({ title: 'New Note', content: '' })
    });
    const note = await res.json();
    notes.unshift(note);
    renderSidebar();
    openNote(note.id);
  } catch { alert('Error creating note'); }
});

// ── Save Note ─────────────────────────────────────────
async function saveNote() {
  if (!activeNote) return;
  const title   = document.getElementById('noteTitleInput').value.trim();
  const content = document.getElementById('noteContentInput').value;

  try {
    await fetch(`${API}/${activeNote.id}`, {
      method : 'PUT',
      headers,
      body   : JSON.stringify({
        title   : title || 'Untitled',
        content,
        summary : activeNote.summary  || '',
        keywords: activeNote.keywords || ''
      })
    });

    const note   = notes.find(n => n.id === activeNote.id);
    note.title   = title || 'Untitled';
    note.content = content;
    activeNote   = note;

    document.getElementById('autoSaveStatus').textContent = '✅ Saved';
    renderSidebar();
  } catch {
    document.getElementById('autoSaveStatus').textContent = '❌ Save failed';
  }
}

document.getElementById('saveNoteBtn').addEventListener('click', saveNote);

// ── Auto Save on typing ───────────────────────────────
['noteTitleInput', 'noteContentInput'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    document.getElementById('autoSaveStatus').textContent = '⏳ Saving...';
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveNote, 1500);
  });
});

// ── Delete Note ───────────────────────────────────────
document.getElementById('deleteNoteBtn').addEventListener('click', async () => {
  if (!activeNote) return;
  if (!confirm('Delete this note?')) return;
  try {
    await fetch(`${API}/${activeNote.id}`, { method: 'DELETE', headers });
    notes      = notes.filter(n => n.id !== activeNote.id);
    activeNote = null;
    document.getElementById('editorEmpty').style.display   = 'block';
    document.getElementById('editorContent').style.display = 'none';
    document.getElementById('analyzeDocBtn').style.display = 'none';
    renderSidebar();
  } catch { alert('Error deleting note'); }
});

// ── Search ────────────────────────────────────────────
document.getElementById('searchNotes').addEventListener('input', e => {
  renderSidebar(e.target.value);
});

// ── File Upload ───────────────────────────────────────
document.getElementById('fileUploadInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const statusBar = document.getElementById('uploadStatus');
  statusBar.style.display = 'flex';
  statusBar.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;">
      <div class="spinner"></div>
      <span>Extracting text from <strong>${file.name}</strong>...</span>
    </div>`;

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res  = await fetch('http://localhost:5000/api/upload/extract', {
      method : 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body   : formData
    });

    const data = await res.json();

    if (res.ok && data.text) {
      const currentContent = document.getElementById('noteContentInput').value;
      const separator      = currentContent
        ? '\n\n--- Extracted from: ' + data.filename + ' ---\n\n'
        : '';
      document.getElementById('noteContentInput').value = currentContent + separator + data.text;

      const currentTitle = document.getElementById('noteTitleInput').value.trim();
      if (!currentTitle || currentTitle === 'New Note') {
        document.getElementById('noteTitleInput').value =
          file.name.replace(/\.[^/.]+$/, '');
      }

      // Show Analyze button
      document.getElementById('analyzeDocBtn').style.display = 'flex';

      statusBar.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <span>✅ Extracted from</span>
          <span class="upload-filename">${data.filename}</span>
          <span class="upload-chars">${data.length.toLocaleString()} characters</span>
        </div>
        <button onclick="document.getElementById('uploadStatus').style.display='none'"
                style="border:none;background:transparent;cursor:pointer;color:var(--text-muted);font-size:1.1rem;">
          ×
        </button>`;

      document.getElementById('autoSaveStatus').textContent = '⏳ Saving...';
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveNote, 1500);

    } else {
      statusBar.innerHTML = `<span>❌ ${data.message || 'Extraction failed'}</span>`;
    }

  } catch (err) {
    statusBar.innerHTML = `<span>❌ Upload failed. Is the server running?</span>`;
  }

  e.target.value = '';
});


// ── AI via Backend (secure) ───────────────────────────
async function callAI(prompt) {
  const res = await fetch('http://localhost:5000/api/ai/generate', {
    method : 'POST',
    headers: {
      'Content-Type' : 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'AI request failed');
  return data.text || '';
}

// ── Show AI Loading ───────────────────────────────────
function showAILoading() {
  const panel = document.getElementById('aiPanel');
  panel.classList.add('visible');
  document.getElementById('aiResults').innerHTML = `
    <div class="ai-loading">
      <div class="spinner"></div>
      AI is analyzing your notes...
    </div>`;
}

// ── Analyze Document (All AI at once) ────────────────
document.getElementById('analyzeDocBtn').addEventListener('click', async () => {
  const content = document.getElementById('noteContentInput').value.trim();
  if (!content) return alert('No content to analyze!');

  const panel = document.getElementById('aiPanel');
  panel.classList.add('visible');
  document.getElementById('aiResults').innerHTML = `
    <div class="ai-loading">
      <div class="spinner"></div>
      Analyzing your document — this may take a few seconds...
    </div>`;

  try {
    const [summary, keywords, flashcardsRaw] = await Promise.all([
      callAI(`Summarize this document in 4-5 clear sentences. Focus on key points:\n\n${content.substring(0, 3000)}`),
      callAI(`Extract 10 important keywords from this document. Return ONLY a comma-separated list:\n\n${content.substring(0, 3000)}`),
      callAI(`Create 5 flashcards from this document. Format each exactly as:\nQ: [question]\nA: [answer]\n\nContent:\n${content.substring(0, 3000)}`),
    ]);

    const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean);
    const cards       = flashcardsRaw.split('\n\n').filter(c => c.includes('Q:') && c.includes('A:'));

    document.getElementById('aiResults').innerHTML = `
      <div class="ai-result-section">
        <h5>📝 Summary</h5>
        <p>${summary}</p>
      </div>
      <div class="ai-result-section">
        <h5>🔑 Keywords</h5>
        <div class="keywords-wrap">
          ${keywordList.map(k => `<span class="keyword-tag">${k}</span>`).join('')}
        </div>
      </div>
      <div class="ai-result-section">
        <h5>🃏 Flashcards</h5>
        ${cards.map(card => {
          const lines = card.split('\n');
          const q = lines.find(l => l.startsWith('Q:'))?.replace('Q:', '').trim() || '';
          const a = lines.find(l => l.startsWith('A:'))?.replace('A:', '').trim() || '';
          return `
            <div style="margin-bottom:10px;padding:10px;background:var(--bg-primary);
                        border-radius:8px;border:1px solid var(--border-color);">
              <div style="font-size:0.82rem;font-weight:600;color:var(--accent-amber);margin-bottom:4px;">Q: ${q}</div>
              <div style="font-size:0.82rem;color:var(--text-primary);">A: ${a}</div>
            </div>`;
        }).join('')}
      </div>`;

    if (activeNote) {
      activeNote.summary  = summary;
      activeNote.keywords = keywords;
      await saveNote();
    }

  } catch (err) {
    document.getElementById('aiResults').innerHTML = `
      <p style="color:var(--accent-danger)">
        ❌ AI Error: ${err.message}<br>
        <small>Check your Gemini API key and try again</small>
      </p>`;
  }
});

// ── AI Summary ────────────────────────────────────────
document.getElementById('aiSummarizeBtn').addEventListener('click', async () => {
  const content = document.getElementById('noteContentInput').value.trim();
  if (!content) return alert('Please write some notes first!');
  showAILoading();

  try {
    const summary = await callAI(
      `Summarize these study notes in 3-4 clear sentences. Be concise and focus on key points:\n\n${content}`
    );
    document.getElementById('aiResults').innerHTML = `
      <div class="ai-result-section">
        <h5>📝 Summary</h5>
        <p>${summary}</p>
      </div>`;

    if (activeNote) {
      activeNote.summary = summary;
      await fetch(`${API}/${activeNote.id}`, {
        method : 'PUT',
        headers,
        body   : JSON.stringify({
          title   : activeNote.title,
          content : activeNote.content,
          summary,
          keywords: activeNote.keywords || ''
        })
      });
    }
  } catch {
    document.getElementById('aiResults').innerHTML =
      '<p style="color:var(--accent-danger)">AI unavailable. Check your API key.</p>';
  }
});

// ── AI Keywords ───────────────────────────────────────
document.getElementById('aiKeywordsBtn').addEventListener('click', async () => {
  const content = document.getElementById('noteContentInput').value.trim();
  if (!content) return alert('Please write some notes first!');
  showAILoading();

  try {
    const result   = await callAI(
      `Extract 8-10 important keywords from these study notes. Return ONLY a comma-separated list of keywords, nothing else:\n\n${content}`
    );
    const keywords = result.split(',').map(k => k.trim()).filter(Boolean);
    document.getElementById('aiResults').innerHTML = `
      <div class="ai-result-section">
        <h5>🔑 Keywords</h5>
        <div class="keywords-wrap">
          ${keywords.map(k => `<span class="keyword-tag">${k}</span>`).join('')}
        </div>
      </div>`;

    if (activeNote) {
      activeNote.keywords = result;
      await fetch(`${API}/${activeNote.id}`, {
        method : 'PUT',
        headers,
        body   : JSON.stringify({
          title   : activeNote.title,
          content : activeNote.content,
          summary : activeNote.summary || '',
          keywords: result
        })
      });
    }
  } catch {
    document.getElementById('aiResults').innerHTML =
      '<p style="color:var(--accent-danger)">AI unavailable. Check your API key.</p>';
  }
});

// ── AI Flashcards ─────────────────────────────────────
document.getElementById('aiFlashcardsBtn').addEventListener('click', async () => {
  const content = document.getElementById('noteContentInput').value.trim();
  if (!content) return alert('Please write some notes first!');
  showAILoading();

  try {
    const result = await callAI(
      `Create 5 flashcards from these study notes. Format each as:
Q: [question]
A: [answer]

Keep questions clear and answers concise. Notes:\n\n${content}`
    );

    const cards = result.split('\n\n').filter(c => c.includes('Q:') && c.includes('A:'));
    document.getElementById('aiResults').innerHTML = `
      <div class="ai-result-section">
        <h5>🃏 Flashcards</h5>
        ${cards.map(card => {
          const lines = card.split('\n');
          const q = lines.find(l => l.startsWith('Q:'))?.replace('Q:', '').trim() || '';
          const a = lines.find(l => l.startsWith('A:'))?.replace('A:', '').trim() || '';
          return `
            <div style="margin-bottom:10px;padding:10px;background:var(--bg-primary);
                        border-radius:8px;border:1px solid var(--border-color);">
              <div style="font-size:0.82rem;font-weight:600;color:var(--accent-amber);margin-bottom:4px;">Q: ${q}</div>
              <div style="font-size:0.82rem;color:var(--text-primary);">A: ${a}</div>
            </div>`;
        }).join('')}
      </div>`;
  } catch {
    document.getElementById('aiResults').innerHTML =
      '<p style="color:var(--accent-danger)">AI unavailable. Check your API key.</p>';
  }
});

// ── Generate Flashcards from Note ────────────────────
document.getElementById('genFlashcardsBtn').addEventListener('click', async () => {
  const content = document.getElementById('noteContentInput').value.trim();
  if (!content) return alert('Please write or upload some content first!');
  if (content.length < 100) return alert('Please add more content for better flashcards!');

  const btn = document.getElementById('genFlashcardsBtn');
  btn.textContent = '⏳ Generating...';
  btn.disabled    = true;

  try {
    // Generate flashcards via backend AI
    const res  = await fetch('http://localhost:5000/api/ai/flashcards', {
      method : 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    // Save flashcards to database
    const saveRes = await fetch('http://localhost:5000/api/flashcards/bulk', {
      method : 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        flashcards: data.flashcards,
        note_id   : activeNote?.id,
        source    : 'ai',
        deck_name : activeNote?.title || 'Untitled Note'
      })
    });

    if (!saveRes.ok) throw new Error('Failed to save flashcards');

    // Show success message
    const count = data.flashcards.length;
    alert(`✅ ${count} flashcards generated and saved!\n\nGo to Flashcards page to study them!`);

  } catch (err) {
    alert('❌ Error: ' + err.message);
  } finally {
    btn.textContent = '🃏 Generate Flashcards';
    btn.disabled    = false;
  }
});

// ── Init ──────────────────────────────────────────────
fetchNotes();