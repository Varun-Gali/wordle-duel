const https = require('https');
const { WORDS } = require('./words');

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

// Pre-generated word cache — filled in background
const wordCache = [];
const CACHE_SIZE = 20;
let cacheRefilling = false;

function getStaticWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function callNvidiaAPI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 50,
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

async function generateAIWord() {
  try {
    const prompt = `Generate exactly ONE common 5-letter English word suitable for a Wordle game. 
The word must:
- Be exactly 5 letters
- Be a real, common English word
- NOT be a proper noun
- NOT contain numbers or special characters
- Be different from these recent words: ${wordCache.slice(-5).join(', ')}

Reply with ONLY the single word in lowercase, nothing else.`;

    const raw = await callNvidiaAPI(prompt);
    // Extract first 5-letter alphabetic word from response
    const match = raw.match(/\b([a-z]{5})\b/i);
    if (match) {
      const word = match[1].toLowerCase();
      console.log(`[AI] Generated word: ${word}`);
      return word;
    }
    throw new Error('No valid word in response');
  } catch (err) {
    console.warn(`[AI] Word generation failed: ${err.message} — using static`);
    return getStaticWord();
  }
}

async function refillCache() {
  if (cacheRefilling) return;
  cacheRefilling = true;
  console.log('[AI] Refilling word cache…');
  while (wordCache.length < CACHE_SIZE) {
    const word = await generateAIWord();
    wordCache.push(word);
    // small delay between API calls
    await new Promise(r => setTimeout(r, 300));
  }
  cacheRefilling = false;
  console.log(`[AI] Cache ready (${wordCache.length} words)`);
}

async function getNextWord() {
  if (wordCache.length > 0) {
    const word = wordCache.shift();
    // Refill in background if running low
    if (wordCache.length < 5) refillCache().catch(console.warn);
    return word;
  }
  // Cache empty — generate on demand (slower path)
  return await generateAIWord();
}

// Seed the cache on startup
refillCache().catch(console.warn);

module.exports = { getNextWord, refillCache };
