const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/authMiddleware');
const {
  getTasks, createTask, updateTask, deleteTask, toggleTask
} = require('../controllers/taskController');

router.get   ('/',          auth, getTasks);
router.post  ('/',          auth, createTask);
router.put   ('/:id',       auth, updateTask);
router.delete('/:id',       auth, deleteTask);
router.patch ('/:id/toggle',auth, toggleTask);

module.exports = router; 
