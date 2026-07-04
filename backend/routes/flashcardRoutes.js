const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const {
  getDecks, getDeckCards, saveFlashcards,
  addFlashcard, deleteDeck, deleteFlashcard
} = require('../controllers/flashcardController');

router.get   ('/',                     auth, getDecks);
router.get   ('/deck/:deckName',       auth, getDeckCards);
router.post  ('/bulk',                 auth, saveFlashcards);
router.post  ('/',                     auth, addFlashcard);
router.delete('/deck/:deckName',       auth, deleteDeck);
router.delete('/:id',                  auth, deleteFlashcard);

module.exports = router;