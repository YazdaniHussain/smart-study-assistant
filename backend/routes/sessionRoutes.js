const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const { getSessions, createSession } = require('../controllers/sessionController');

router.get ('/', auth, getSessions);
router.post('/', auth, createSession);

module.exports = router; 
