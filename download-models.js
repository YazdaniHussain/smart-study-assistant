const https = require('https');
const fs    = require('fs');
const path  = require('path');

const MODELS_DIR = './frontend/assets/models';
const BASE_URL   = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const FILES = [
  'tiny_face_detector_model-shard1',
  'tiny_face_detector_model-weights_manifest.json',
  'face_expression_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_landmark_68_tiny_model-shard1',
  'face_landmark_68_tiny_model-weights_manifest.json',
];

if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR, { recursive: true });

function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const url      = `${BASE_URL}/${filename}`;
    const filePath = path.join(MODELS_DIR, filename);
    const file     = fs.createWriteStream(filePath);

    console.log(`⏳ Downloading: ${filename}`);

    https.get(url, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      console.error(`❌ Failed: ${filename} — ${err.message}`);
      reject(err);
    });
  });
}

async function downloadAll() {
  console.log('🚀 Downloading face-api.js models...\n');
  for (const file of FILES) {
    try { await downloadFile(file); }
    catch { console.log(`Skipping ${file}`); }
  }
  console.log('\n🎉 All models downloaded! You can now use emotion detection.');
}

downloadAll(); 
