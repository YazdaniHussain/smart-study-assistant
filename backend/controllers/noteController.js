const db = require('../config/db');

// ── Get All Notes ─────────────────────────────────────
const getNotes = async (req, res) => {
  try {
    const [notes] = await db.query(
      'SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(notes);
  } catch {
    res.status(500).json({ message: 'Error fetching notes' });
  }
};

// ── Create Note ───────────────────────────────────────
const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const [result] = await db.query(
      'INSERT INTO notes (user_id, title, content) VALUES (?,?,?)',
      [req.user.id, title, content || '']
    );

    const [newNote] = await db.query(
      'SELECT * FROM notes WHERE id = ?', [result.insertId]
    );
    res.status(201).json(newNote[0]);
  } catch {
    res.status(500).json({ message: 'Error creating note' });
  }
};

// ── Update Note ───────────────────────────────────────
const updateNote = async (req, res) => {
  try {
    const { title, content, summary, keywords } = req.body;
    await db.query(
      'UPDATE notes SET title=?, content=?, summary=?, keywords=? WHERE id=? AND user_id=?',
      [title, content, summary || '', keywords || '', req.params.id, req.user.id]
    );
    res.json({ message: 'Note updated' });
  } catch {
    res.status(500).json({ message: 'Error updating note' });
  }
};

// ── Delete Note ───────────────────────────────────────
const deleteNote = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM notes WHERE id=? AND user_id=?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Note deleted' });
  } catch {
    res.status(500).json({ message: 'Error deleting note' });
  }
};

module.exports = { getNotes, createNote, updateNote, deleteNote }; 
