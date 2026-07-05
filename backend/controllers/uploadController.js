const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { PDFParse } = require('pdf-parse');
const mammoth  = require('mammoth');

// ── Storage Config ────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'backend/uploads/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

// ── File Filter ───────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx', '.txt'];
  const ext     = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, Word, and TXT files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// ── Extract Text Controller ───────────────────────────
const extractText = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const ext      = path.extname(req.file.originalname).toLowerCase();
  let extractedText = '';

  try {
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const parser      = new PDFParse({ data: dataBuffer });
      const result       = await parser.getText();
      extractedText      = result.text;
      await parser.destroy();

    } else if (ext === '.docx' || ext === '.doc') {
      const result  = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;

    } else if (ext === '.txt') {
      extractedText = fs.readFileSync(filePath, 'utf8');
    }

    // Clean up uploaded file after extraction
    fs.unlinkSync(filePath);

    // Clean up text
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    res.json({
      success : true,
      filename: req.file.originalname,
      text    : extractedText,
      length  : extractedText.length
    });

  } catch (error) {
    console.error('❌ File extraction error:', error.message);
    // Clean up on error
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ message: 'Error extracting text: ' + error.message });
  }
};

module.exports = { upload, extractText }; 
