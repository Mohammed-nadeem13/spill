import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const FREE_LIMIT = 5;

// ---- Vibe system prompts (the {companionName} is interpolated) ----
function systemPrompt(vibe, name) {
  const prompts = {
    gentle: `You are ${name}, a warm gentle AI companion inside Spill — a private app for Indian college students to process emotions they cannot share with anyone. You are like a trusted caring friend. Always reply in 1-3 short sentences. Ask ONE empathetic follow-up question per response digging into their emotion not the facts. Never give unsolicited advice or solutions. Never use clinical language. If genuine crisis signals appear, gently mention iCall helpline 9152987821. Your first message: greet them warmly and ask how they are really feeling right now.`,
    direct: `You are ${name}, a direct honest AI companion inside Spill. Like a straight-talking best friend who actually listens. Reply in 1-3 short sentences. Ask ONE sharp follow-up question cutting to what matters. No advice unless asked. No clinical language. First message: direct warm greeting, ask what is going on right now.`,
    witty: `You are ${name}, a warm witty AI companion inside Spill. Light, fun, genuinely caring. Reply in 1-3 short sentences. One playful follow-up question per response. No advice unless asked. No clinical language. Touch of humour, never at user's expense. First message: warm fun greeting, ask how they are doing honestly.`,
  };
  return prompts[vibe] || prompts.gentle;
}

// Friendly canned openers used when the backend is unreachable (e.g. plain
// `vite` dev with no `vercel dev`/API key). Keeps the UI fully demoable.
function fallbackOpener(vibe, name) {
  const openers = {
    gentle: `Hey, I'm ${name}. I'm really glad you're here. How are you actually feeling right now?`,
    direct: `Hey, ${name} here. No filters needed with me — what's going on for you right now?`,
    witty: `Well hello there, I'm ${name} — your slightly-too-online emotional support human. So, honestly, how are you doing?`,
  };
  return openers[vibe] || openers.gentle;
}

// Used only if the model is unreachable after retries. Shuffled and stepped
// through so repeated outages still feel varied rather than looping.
const FALLBACK_REPLIES = [
  "That sounds like a lot to carry. What part of it weighs on you the most?",
  "I hear you. When did you first start feeling this way?",
  "Thank you for trusting me with that. What do you wish someone understood right now?",
  "That makes sense. What's underneath that feeling for you?",
  "I'm still here with you. What's the thought that keeps circling back?",
  "That's real, and it matters. What would feel like a small relief right now?",
  "It sounds heavier than you let people see. Who do you wish you could say this to?",
  "Take your time. What's the part you haven't said out loud yet?",
  "I'm listening. When it's loudest, what does that feeling tell you?",
  "You don't have to hold all of it alone. What's sitting closest to the surface tonight?",
];

// Fisher-Yates shuffle so the fallback order differs each session.
function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SAFE_SUMMARY = {
  tags: ['brave', 'honest', 'open'],
  insight: 'You showed up and let yourself be honest about what you were carrying.',
  thought: 'Showing up for yourself, even quietly, is its own kind of strength.',
};

// Pull the assistant text out of the API response. Handles OpenRouter/OpenAI
// shape ({choices:[{message:{content}}]}) and Anthropic shape ({content:[{text}]}).
function extractText(data) {
  if (!data) return '';
  if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
  if (Array.isArray(data.content) && data.content[0]?.text) return data.content[0].text;
  return '';
}

function timeNow() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chat({ companionName, vibe, sessionCount, onEnd }) {
  const [messages, setMessages] = useState([]); // { role:'assistant'|'user', text, time }
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [ending, setEnding] = useState(false);
  const fallbackDeck = useRef(shuffled(FALLBACK_REPLIES));
  const fallbackPos = useRef(0);
  const scrollRef = useRef(null);

  const isPaywalled = sessionCount > FREE_LIMIT;

  // ---- Low-level API call to our serverless proxy ----
  async function callAI(history) {
    const system = systemPrompt(vibe, companionName);
    const payload = {
      system,
      messages: history.map((m) => ({ role: m.role, content: m.text })),
    };
    const res = await axios.post('/api/chat', payload, { timeout: 30000 });
    const text = extractText(res.data);
    if (text) return text.trim();
    throw new Error('Unexpected API response');
  }

  // ---- First companion message on mount ----
  useEffect(() => {
    let cancelled = false;
    setTyping(true);
    callAI([{ role: 'user', text: 'Hello' }])
      .then((text) => {
        if (cancelled) return;
        setMessages([{ role: 'assistant', text, time: timeNow() }]);
      })
      .catch(() => {
        if (cancelled) return;
        setMessages([
          { role: 'assistant', text: fallbackOpener(vibe, companionName), time: timeNow() },
        ]);
      })
      .finally(() => !cancelled && setTyping(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Autoscroll to newest message ----
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  async function handleSend() {
    const text = input.trim();
    if (!text || typing || isPaywalled) return;

    const userMsg = { role: 'user', text, time: timeNow() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setTyping(true);

    try {
      const reply = await callAI(history);
      setMessages((m) => [...m, { role: 'assistant', text: reply, time: timeNow() }]);
    } catch {
      const deck = fallbackDeck.current;
      const fb = deck[fallbackPos.current % deck.length];
      fallbackPos.current += 1;
      setMessages((m) => [...m, { role: 'assistant', text: fb, time: timeNow() }]);
    } finally {
      setTyping(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ---- End session: ask the model for an emotional JSON summary ----
  async function handleEnd() {
    if (ending) return;
    setEnding(true);

    const convo = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Companion'}: ${m.text}`)
      .join('\n');

    const summaryPrompt = `Summarize this conversation emotionally in JSON only. No markdown, no explanation. Format exactly: {"tags":["tag1","tag2","tag3"],"insight":"one warm non-clinical sentence in second person observing what the user was carrying","thought":"a short affirming reflective sentence for them to take away"}. Conversation: ${convo || 'The user opened the app but did not share much.'}`;

    try {
      const res = await axios.post(
        '/api/chat',
        {
          system: 'You output only valid JSON. Never include markdown or commentary.',
          messages: [{ role: 'user', content: summaryPrompt }],
        },
        { timeout: 30000 }
      );
      const raw = extractText(res.data) || '';
      const summary = parseSummary(raw);
      onEnd(summary);
    } catch {
      onEnd(SAFE_SUMMARY);
    }
  }

  function parseSummary(raw) {
    try {
      // tolerate stray text/markdown around the JSON
      const match = raw.match(/\{[\s\S]*\}/);
      const obj = JSON.parse(match ? match[0] : raw);
      return {
        tags: Array.isArray(obj.tags) && obj.tags.length ? obj.tags.slice(0, 4) : SAFE_SUMMARY.tags,
        insight: typeof obj.insight === 'string' && obj.insight ? obj.insight : SAFE_SUMMARY.insight,
        thought: typeof obj.thought === 'string' && obj.thought ? obj.thought : SAFE_SUMMARY.thought,
      };
    } catch {
      return SAFE_SUMMARY;
    }
  }

  const sessionLabel = isPaywalled
    ? 'Upgrade for unlimited'
    : `Session ${sessionCount} of ${FREE_LIMIT} free · Spill freely`;

  return (
    <div className="chat">
      {/* Header */}
      <div className="chat-header">
        <div className="avatar">🌿</div>
        <div className="chat-header-info">
          <div className="companion-name">{companionName}</div>
          <div className="companion-status">Here for you · Always</div>
        </div>
        <button className="btn-ghost-green" onClick={handleEnd} disabled={ending}>
          End ✕
        </button>
      </div>

      {/* Session bar */}
      <div className="session-bar">
        <span className="dot-live" />
        {sessionLabel}
      </div>

      {/* Messages */}
      <div className="messages" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`msg-row ${m.role === 'user' ? 'user' : 'ai'}`}>
            <div className={`bubble ${m.role === 'user' ? 'user' : 'ai'}`}>{m.text}</div>
            <div className="timestamp">{m.time}</div>
          </div>
        ))}
        {typing && (
          <div className="msg-row ai">
            <div className="typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="input-area">
        <textarea
          className="textarea chat-textarea"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isPaywalled ? 'Upgrade to keep talking…' : 'Type what you need to let out…'}
          disabled={isPaywalled}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={typing || isPaywalled || !input.trim()}
          aria-label="Send"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="6 11 12 5 18 11" />
          </svg>
        </button>
      </div>

      {/* Freemium paywall after the free limit */}
      {isPaywalled && (
        <div className="paywall">
          <div className="paywall-card card card-emph">
            <div className="display-md">You've had 5 conversations 🌱</div>
            <div className="body-sm">
              You keep showing up for yourself — that matters. Keep the space open whenever you need it.
            </div>
            <button className="btn-primary btn-full">Upgrade to keep talking — Spill Plus ₹149/mo</button>
            <button className="btn-ghost-green" style={{ marginTop: 14 }} onClick={handleEnd}>
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
