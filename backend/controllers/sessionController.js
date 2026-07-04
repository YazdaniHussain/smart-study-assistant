const db = require('../config/db');

const getSessions = async (req, res) => {
  try {
    const [sessions] = await db.query(
      'SELECT * FROM study_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(sessions);
  } catch { res.status(500).json({ message: 'Error fetching sessions' }); }
};

const createSession = async (req, res) => {
  try {
    const { duration, focus_score, emotion } = req.body;
    await db.query(
      'INSERT INTO study_sessions (user_id, duration, focus_score, emotion) VALUES (?,?,?,?)',
      [req.user.id, duration || 0, focus_score || 0, emotion || 'neutral']
    );
    res.status(201).json({ message: 'Session saved' });
  } catch { res.status(500).json({ message: 'Error saving session' }); }
};

module.exports = { getSessions, createSession }; 
