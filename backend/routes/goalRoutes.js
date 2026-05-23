const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const { getGoals, createGoal, updateProgress, deleteGoal } = require('../controllers/goalController');

router.get   ('/',           auth, getGoals);
router.post  ('/',           auth, createGoal);
router.patch ('/:id',        auth, updateProgress);
router.delete('/:id',        auth, deleteGoal);

module.exports = router; 
