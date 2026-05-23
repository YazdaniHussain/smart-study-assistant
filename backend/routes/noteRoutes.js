const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const { getNotes, createNote, updateNote, deleteNote } = require('../controllers/noteController');

router.get   ('/',     auth, getNotes);
router.post  ('/',     auth, createNote);
router.put   ('/:id',  auth, updateNote);
router.delete('/:id',  auth, deleteNote);

module.exports = router; 
