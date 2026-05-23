const db = require('../config/db');

// ── Get All Tasks ─────────────────────────────────────
const getTasks = async (req, res) => {
  try {
    const [tasks] = await db.query(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(tasks);
  } catch {
    res.status(500).json({ message: 'Error fetching tasks' });
  }
};


// ── Create Task ───────────────────────────────────────
const createTask = async (req, res) => {
  try {
    const { title, description, priority, due_date } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const [result] = await db.query(
      'INSERT INTO tasks (user_id, title, description, priority, due_date) VALUES (?,?,?,?,?)',
      [req.user.id, title, description || '', priority || 'medium', due_date || null]
    );

    const [newTask] = await db.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json(newTask[0]);
  } catch {
    res.status(500).json({ message: 'Error creating task' });
  }
};

// ── Update Task ───────────────────────────────────────
const updateTask = async (req, res) => {
  try {
    const { title, description, priority, due_date, completed } = req.body;
    await db.query(
      'UPDATE tasks SET title=?, description=?, priority=?, due_date=?, completed=? WHERE id=? AND user_id=?',
      [title, description, priority, due_date || null, completed, req.params.id, req.user.id]
    );
    res.json({ message: 'Task updated' });
  } catch {
    res.status(500).json({ message: 'Error updating task' });
  }
};

// ── Delete Task ───────────────────────────────────────
const deleteTask = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM tasks WHERE id=? AND user_id=?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Task deleted' });
  } catch {
    res.status(500).json({ message: 'Error deleting task' });
  }
};

// ── Toggle Complete ───────────────────────────────────
const toggleTask = async (req, res) => {
  try {
    await db.query(
      'UPDATE tasks SET completed = NOT completed WHERE id=? AND user_id=?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Task toggled' });
  } catch {
    res.status(500).json({ message: 'Error toggling task' });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, toggleTask }; 
