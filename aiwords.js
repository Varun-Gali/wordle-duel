const https = require('https');
const { WORDS } = require('./words');

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

// Separate caches per word length
const wordCaches = { 5: [], 6: [], 7: [] };
const CACHE_SIZE = 15;
let cacheRefilling = { 5: false, 6: false, 7: false };

// Random themes for variety
const THEMES = [
  'nature', 'animals', 'food', 'sports', 'music', 'travel', 'science',
  'colors', 'emotions', 'weather', 'body', 'clothes', 'tools', 'kitchen',
  'garden', 'ocean', 'forest', 'city', 'space', 'history'
];

function getStaticWord(length = 5) {
  const pool = WORDS.filter(w => w.length === length);
  if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function callNvidiaAPI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 1.0,
      max_tokens: 20,
      stream: false,
    });

    const url = new URL(NVIDIA_API_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const text = json.choices?.[0]?.message?.content?.trim() || '';
          resolve(text);
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

async function generateAIWord(length = 5) {
  try {
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const recentWords = wordCaches[length]?.slice(-5).join(', ') || '';
    const prompt = `Give me ONE real English word that is EXACTLY ${length} letters long. Theme hint: ${theme}. The word must be a common dictionary word, no proper nouns. Do NOT use: ${recentWords || 'none'}. Reply with ONLY the single word in lowercase.`;

    const raw = await callNvidiaAPI(prompt);
    const regex = new RegExp(`\\b([a-z]{${length}})\\b`, 'i');
    const match = raw.match(regex);
    if (match) {
      const word = match[1].toLowerCase();
      console.log(`[AI] Generated ${length}-letter word: ${word} (theme: ${theme})`);
      return word;
    }
    throw new Error('No valid word in response');
  } catch (err) {
    console.warn(`[AI] Word generation failed: ${err.message} — using static`);
    return getStaticWord(length);
  }
}

async function refillCache(length = 5) {
  if (cacheRefilling[length]) return;
  cacheRefilling[length] = true;
  console.log(`[AI] Refilling ${length}-letter word cache…`);
  const cache = wordCaches[length] || [];
  while (cache.length < CACHE_SIZE) {
    const word = await generateAIWord(length);
    cache.push(word);
    await new Promise(r => setTimeout(r, 300));
  }
  wordCaches[length] = cache;
  cacheRefilling[length] = false;
  console.log(`[AI] ${length}-letter cache ready (${cache.length} words)`);
}

async function getNextWord(length = 5) {
  const cache = wordCaches[length] || [];
  if (cache.length > 0) {
    const word = cache.shift();
    if (cache.length < 5) refillCache(length).catch(console.warn);
    return word;
  }
  return await generateAIWord(length);
}

// Seed default 5-letter cache on startup
refillCache(5).catch(console.warn);

module.exports = { getNextWord, refillCache };
