// Serverless chat proxy. Both providers below speak the OpenAI chat-completions
// shape, so the frontend parses { choices[0].message.content } either way.
//
// Strategy: try Gemini 2.5 Flash first (best free quality); if it's rate-limited
// or errors after retries, fall back to OpenRouter's free gemma. Using two free
// tiers keeps real AI flowing instead of dropping to canned replies (which was
// the cause of the "generic + repeating" behaviour).

export const config = { maxDuration: 30 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildProviders() {
  const list = [];
  if (process.env.GEMINI_API_KEY) {
    list.push({
      name: 'gemini',
      url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      key: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      // Gemini's OpenAI endpoint supports temperature/top_p (not the penalties).
      params: { temperature: 0.9, top_p: 0.95 },
    });
  }
  if (process.env.OPENROUTER_API_KEY) {
    list.push({
      name: 'openrouter',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free',
      params: { temperature: 0.9, top_p: 0.9, frequency_penalty: 0.6, presence_penalty: 0.6 },
    });
  }
  return list;
}

function isRateLimited(status, data) {
  return (
    status === 429 ||
    data?.error?.code === 429 ||
    /rate.?limit|quota|temporarily/i.test(data?.error?.message || '')
  );
}

function hasReply(data) {
  return !!data?.choices?.[0]?.message?.content;
}

async function callProvider(p, msgs) {
  let data = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(p.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${p.key}`,
        'X-Title': 'Spill',
      },
      body: JSON.stringify({ model: p.model, max_tokens: 1000, ...p.params, messages: msgs }),
    });
    data = await response.json();
    if (hasReply(data)) return data;          // success
    if (!isRateLimited(response.status, data)) break; // hard error — let caller try next provider
    if (attempt === 2) break;
    const retryAfter = parseFloat(response.headers.get('retry-after')) || 2;
    await sleep(Math.min(retryAfter, 4) * 1000);
  }
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { system, messages } = req.body;
  const baseMsgs = messages && messages.length > 0 ? messages : [{ role: 'user', content: 'Hello' }];
  const msgs = system ? [{ role: 'system', content: system }, ...baseMsgs] : baseMsgs;

  const providers = buildProviders();
  if (providers.length === 0) {
    return res.status(500).json({ error: 'No AI provider key configured' });
  }

  try {
    let last = null;
    for (const p of providers) {
      const data = await callProvider(p, msgs);
      if (hasReply(data)) return res.status(200).json(data);
      last = data; // remember the failure, try the next provider
    }
    res.status(200).json(last); // all providers failed — frontend falls back gracefully
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
