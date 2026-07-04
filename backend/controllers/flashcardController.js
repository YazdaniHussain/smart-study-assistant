const db = require('../config/db');

// ── Get All Decks (grouped) ───────────────────────────
const getDecks = async (req, res) => {
  try {
    const [decks] = await db.query(
      `SELECT deck_name, source, COUNT(*) as card_count,
       MIN(created_at) as created_at
       FROM flashcards
       WHERE user_id = ?
       GROUP BY deck_name, source
       ORDER BY MIN(created_at) DESC`,
      [req.user.id]
    );
    res.json(decks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get Cards in a Deck ───────────────────────────────
const getDeckCards = async (req, res) => {
  try {
    const deckName = decodeURIComponent(req.params.deckName);
    const [cards]  = await db.query(
      'SELECT * FROM flashcards WHERE user_id = ? AND deck_name = ? ORDER BY id ASC',
      [req.user.id, deckName]
    );
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Save Flashcards (bulk) ────────────────────────────
const saveFlashcards = async (req, res) => {
  try {
    const { flashcards, note_id, source, deck_name } = req.body;
    if (!flashcards?.length) return res.status(400).json({ message: 'No flashcards provided' });

    const values = flashcards.map(c => [
      req.user.id, note_id || null, c.q, c.a,
      source || 'ai', deck_name || 'General'
    ]);

    await db.query(
      'INSERT INTO flashcards (user_id, note_id, question, answer, source, deck_name) VALUES ?',
      [values]
    );

    res.status(201).json({ message: `${flashcards.length} flashcards saved to "${deck_name}"!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Add Single Card to Deck ───────────────────────────
const addFlashcard = async (req, res) => {
  try {
    const { question, answer, deck_name } = req.body;
    if (!question || !answer) return res.status(400).json({ message: 'Question and answer required' });

    const [result] = await db.query(
      'INSERT INTO flashcards (user_id, question, answer, source, deck_name) VALUES (?,?,?,?,?)',
      [req.user.id, question, answer, 'manual', deck_name || 'General']
    );
    const [card] = await db.query('SELECT * FROM flashcards WHERE id = ?', [result.insertId]);
    res.status(201).json(card[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Delete Entire Deck ────────────────────────────────
const deleteDeck = async (req, res) => {
  try {
    const deckName = decodeURIComponent(req.params.deckName);
    await db.query(
      'DELETE FROM flashcards WHERE deck_name = ? AND user_id = ?',
      [deckName, req.user.id]
    );
    res.json({ message: `Deck "${deckName}" deleted` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Delete Single Card ────────────────────────────────
const deleteFlashcard = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM flashcards WHERE id=? AND user_id=?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Card deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDecks, getDeckCards, saveFlashcards, addFlashcard, deleteDeck, deleteFlashcard };