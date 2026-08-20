const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const https   = require('https');

// ── Helper: call Groq using built-in https ────────────
function callGroq(prompt, apiKey, model) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model      : model,
      messages   : [{ role: 'user', content: prompt }],
      max_tokens : 2000,
      temperature: 0.7
    });

    const options = {
      hostname: 'api.groq.com',
      path    : '/openai/v1/chat/completions',
      method  : 'POST',
      headers : {
        'Content-Type'  : 'application/json',
        'Authorization' : `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          const text = parsed?.choices?.[0]?.message?.content;
          if (text) resolve(text);
          else reject(new Error('No text in response'));
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Try multiple models in order (auto-fallback) ──────
const MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b'];

async function callAIWithFallback(prompt, apiKey) {
  let lastError = '';
  for (const model of MODELS) {
    try {
      return await callGroq(prompt, apiKey, model);
    } catch (err) {
      lastError = err.message;
      continue;
    }
  }
  throw new Error(lastError || 'All AI models failed');
}

// ── Generate Text ──────────────────────────────────────
router.post('/generate', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt required' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'GROQ_API_KEY not set in environment' });

    const result = await callAIWithFallback(prompt, apiKey);
    res.json({ text: result });

  } catch (err) {
    console.error('AI error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── Generate Flashcards ────────────────────────────────
router.post('/flashcards', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content required' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'GROQ_API_KEY not set in environment' });

    const prompt = `Create 8 flashcards from this content.
Return ONLY a valid JSON array. No extra text, no markdown backticks, just pure JSON:
[
  {"q": "Question here?", "a": "Answer here."},
  {"q": "Question here?", "a": "Answer here."}
]

Content:
${content.substring(0, 4000)}`;

    const result = await callAIWithFallback(prompt, apiKey);

    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return res.status(500).json({ message: 'Could not parse flashcards' });

    const flashcards = JSON.parse(jsonMatch[0]);
    res.json({ flashcards });

  } catch (err) {
    console.error('Flashcard error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
