const db = require('../config/db');

// ── Get All Goals ─────────────────────────────────────
const getGoals = async (req, res) => {
  try {
    const [goals] = await db.query(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(goals);
  } catch {
    res.status(500).json({ message: 'Error fetching goals' });
  }
};

// ── Create Goal ───────────────────────────────────────
const createGoal = async (req, res) => {
  try {
    const { title, type, target } = req.body;
    if (!title || !target)
      return res.status(400).json({ message: 'Title and target are required' });

    const [result] = await db.query(
      'INSERT INTO goals (user_id, title, type, target, progress) VALUES (?,?,?,?,?)',
      [req.user.id, title, type || 'daily', target, 0]
    );

    const [newGoal] = await db.query(
      'SELECT * FROM goals WHERE id = ?', [result.insertId]
    );
    res.status(201).json(newGoal[0]);
  } catch {
    res.status(500).json({ message: 'Error creating goal' });
  }
};

// ── Update Progress ───────────────────────────────────
const updateProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const [goal] = await db.query(
      'SELECT * FROM goals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!goal.length)
      return res.status(404).json({ message: 'Goal not found' });

    const completed = progress >= goal[0].target;
    await db.query(
      'UPDATE goals SET progress = ?, completed = ? WHERE id = ? AND user_id = ?',
      [progress, completed, req.params.id, req.user.id]
    );

    res.json({ message: 'Progress updated', completed });
  } catch {
    res.status(500).json({ message: 'Error updating progress' });
  }
};

// ── Delete Goal ───────────────────────────────────────
const deleteGoal = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM goals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Goal deleted' });
  } catch {
    res.status(500).json({ message: 'Error deleting goal' });
  }
};

module.exports = { getGoals, createGoal, updateProgress, deleteGoal }; 
