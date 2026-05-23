const db = require('../config/db');

// ── Get Events ────────────────────────────────────────
const getEvents = async (req, res) => {
  try {
    const [events] = await db.query(
      'SELECT * FROM calendar_events WHERE user_id = ? ORDER BY event_date ASC',
      [req.user.id]
    );
    res.json(events);
  } catch {
    res.status(500).json({ message: 'Error fetching events' });
  }
};

// ── Create Event ──────────────────────────────────────
const createEvent = async (req, res) => {
  try {
    const { title, description, event_date } = req.body;
    if (!title || !event_date)
      return res.status(400).json({ message: 'Title and date are required' });

    const [result] = await db.query(
      'INSERT INTO calendar_events (user_id, title, description, event_date) VALUES (?,?,?,?)',
      [req.user.id, title, description || '', event_date]
    );

    const [newEvent] = await db.query(
      'SELECT * FROM calendar_events WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(newEvent[0]);
  } catch {
    res.status(500).json({ message: 'Error creating event' });
  }
};

// ── Delete Event ──────────────────────────────────────
const deleteEvent = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM calendar_events WHERE id=? AND user_id=?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Event deleted' });
  } catch {
    res.status(500).json({ message: 'Error deleting event' });
  }
};

module.exports = { getEvents, createEvent, deleteEvent }; 
