// Serverless proxy to OpenRouter (OpenAI-compatible chat completions).
// Uses a free model so no paid credits are required. The frontend still sends
// { system, messages } (Anthropic-style); we fold `system` into the messages
// array as a system-role message, which is what the OpenAI/OpenRouter API expects.
const MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { system, messages } = req.body;
  const baseMsgs = messages && messages.length > 0 ? messages : [{ role: 'user', content: 'Hello' }];
  const msgs = system ? [{ role: 'system', content: system }, ...baseMsgs] : baseMsgs;
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'X-Title': 'Spill'
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 1000, messages: msgs })
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
