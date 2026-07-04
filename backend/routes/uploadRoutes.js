const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/authMiddleware');
const { upload, extractText } = require('../controllers/uploadController');

router.post('/extract', auth, upload.single('file'), extractText);

module.exports = router; 
