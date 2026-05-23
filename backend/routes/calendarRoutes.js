const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/authMiddleware');
const { getEvents, createEvent, deleteEvent } = require('../controllers/calendarController');

router.get   ('/',     auth, getEvents);
router.post  ('/',     auth, createEvent);
router.delete('/:id',  auth, deleteEvent);

module.exports = router; 
