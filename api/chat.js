// Serverless proxy to OpenRouter (OpenAI-compatible chat completions).
// Uses a free model so no paid credits are required. The frontend sends
// { system, messages } (Anthropic-style); we fold `system` into the messages
// array as a system-role message, which is what the OpenAI/OpenRouter API expects.
const MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free';

// Generation params tuned to fight the small-model "generic + repetitive" failure mode.
const GEN = { temperature: 0.9, top_p: 0.9, frequency_penalty: 0.6, presence_penalty: 0.6 };

// Allow extra serverless time so the 429 retry loop below can run.
export const config = { maxDuration: 30 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isRateLimited(status, data) {
  return (
    status === 429 ||
    data?.error?.code === 429 ||
    /rate.?limit|temporarily/i.test(data?.error?.message || '')
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { system, messages } = req.body;
  const baseMsgs = messages && messages.length > 0 ? messages : [{ role: 'user', content: 'Hello' }];
  const msgs = system ? [{ role: 'system', content: system }, ...baseMsgs] : baseMsgs;

  try {
    let data = null;
    // Free models throttle hard; retry a few times so real AI lands instead of
    // the frontend falling back to canned lines (the source of the repetition).
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'X-Title': 'Spill'
        },
        body: JSON.stringify({ model: MODEL, max_tokens: 1000, ...GEN, messages: msgs })
      });
      data = await response.json();

      if (!isRateLimited(response.status, data)) break; // success (or non-rate error)
      if (attempt === 2) break; // out of retries

      const retryAfter = parseFloat(response.headers.get('retry-after')) || 2;
      await sleep(Math.min(retryAfter, 4) * 1000);
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
