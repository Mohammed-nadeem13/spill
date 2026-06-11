// Lightning bolt glyph — the brand mark, rendered in electric green.
function Bolt({ size = 18 }) {
  return (
    <span className="bolt" aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2 4.5 13.2c-.4.5 0 1.3.7 1.3H11l-1.2 7.2c-.1.8.9 1.3 1.4.6L20 11.1c.4-.5 0-1.3-.7-1.3H13.5L14.4 2.6c.1-.8-.9-1.3-1.4-.6Z" />
      </svg>
    </span>
  );
}

const FEATURES = [
  { icon: '🔒', title: 'Private by design', body: 'No signup, no clinical forms, no data shared. Just a space that opens the moment you need it.' },
  { icon: '💬', title: 'Talks like a friend', body: 'Short, human replies that ask the next real question — never canned advice, never a lecture.' },
  { icon: '🎚️', title: 'Three vibes', body: 'Gentle, Direct, or Witty. Pick how your companion speaks, and rename them whatever feels right.' },
  { icon: '🌿', title: 'Built for the spiral', body: 'Made for Indian college students processing what they cannot say out loud to anyone else.' },
  { icon: '🧭', title: 'Crisis-aware', body: 'If things get heavy, it gently surfaces the iCall helpline — without ever feeling clinical.' },
  { icon: '✦', title: 'A thought to keep', body: 'Every session ends with the emotions you carried and one affirming line to take with you.' },
];

export default function Landing({ onEnter }) {
  return (
    <div>
      {/* Nav */}
      <nav className="nav-bar">
        <div className="brand"><Bolt /> spill</div>
        <div className="nav-links">
          <a className="nav-link" href="#features">Features</a>
          <a className="nav-link" href="#pricing">Pricing</a>
          <a className="nav-link" href="#how">How it works</a>
        </div>
        <button className="btn-primary" onClick={onEnter}>Start talking</button>
      </nav>

      <div className="landing-wrap">
        {/* Hero */}
        <header className="hero-band" id="how">
          <div className="hero-eyebrow eyebrow-mono">Your private space</div>
          <h1 className="hero-headline display-xl">Let it out. No signup, no judgment, no one watching.</h1>
          <p className="hero-sub body-lg">
            Spill is an AI companion for the things you can't tell anyone. Open it, type what's heavy, and
            talk it through — privately, in your own words.
          </p>
          <div className="hero-cta-row">
            <button className="btn-primary" onClick={onEnter}>Start talking →</button>
            <a className="btn-outline" href="#features">See how it works</a>
          </div>
          <div className="hero-chip-row">
            <span className="code-chip">$ spill --vibe witty --private</span>
          </div>

          {/* Terminal-style conversation mockup */}
          <div style={{ marginTop: 48 }}>
            <div className="code-mockup">
              <div className="code-mockup-bar">
                <span className="code-dot" /><span className="code-dot" /><span className="code-dot" />
                <span className="code-mockup-title">session · mitra</span>
              </div>
              <div className="code-mockup-body">
                <div className="code-line-mute"># you</div>
                <div>i think i'm burning out and i can't tell anyone</div>
                <div style={{ height: 10 }} />
                <div className="code-line-green"># mitra</div>
                <div>that's a heavy thing to hold alone. what's the part</div>
                <div>you most wish someone understood right now?</div>
              </div>
            </div>
          </div>
        </header>
      </div>

      <div className="green-divider-band" />

      {/* Features */}
      <div className="landing-wrap">
        <section className="content-band" id="features">
          <div className="band-head">
            <div className="eyebrow-mono">Everything you need</div>
            <h2 className="display-lg">A companion, not a chatbot.</h2>
            <p className="body-md">Engineered to feel human — and to stay out of your way.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="card hoverable feature-card">
                <span className="feat-icon">{f.icon}</span>
                <h3 className="display-sm">{f.title}</h3>
                <p className="body-sm">{f.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <hr className="divider-dashed" />

      {/* Pricing */}
      <div className="landing-wrap">
        <section className="content-band" id="pricing">
          <div className="band-head">
            <div className="eyebrow-mono">Pricing</div>
            <h2 className="display-lg">Start free. Stay if it helps.</h2>
          </div>
          <div className="pricing-grid">
            <article className="card">
              <div className="eyebrow-mono" style={{ color: 'var(--mute)', marginBottom: 12 }}>Free</div>
              <div className="price-amt" style={{ fontSize: 40, lineHeight: 1 }}>₹0</div>
              <ul className="price-feats">
                <li><span className="price-check">✓</span><span className="body-sm">5 full conversations</span></li>
                <li><span className="price-check">✓</span><span className="body-sm">All three vibes</span></li>
                <li><span className="price-check">✓</span><span className="body-sm">End-of-session reflections</span></li>
              </ul>
              <button className="btn-outline btn-full" onClick={onEnter}>Start talking</button>
            </article>

            <article className="card card-featured">
              <div className="eyebrow-mono" style={{ marginBottom: 12 }}>Spill Plus</div>
              <div className="price-amt" style={{ fontSize: 40, lineHeight: 1 }}>
                ₹149<span style={{ fontSize: 15, color: 'var(--mute)', fontWeight: 400 }}> /mo</span>
              </div>
              <ul className="price-feats">
                <li><span className="price-check">✓</span><span className="body-sm">Unlimited conversations</span></li>
                <li><span className="price-check">✓</span><span className="body-sm">Saved journal of your thoughts</span></li>
                <li><span className="price-check">✓</span><span className="body-sm">Daily check-in nudges</span></li>
              </ul>
              <button className="btn-primary btn-full" onClick={onEnter}>Try Spill Plus</button>
            </article>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="brand"><Bolt size={16} /> spill</div>
        <div className="caption">Your private space to just… let it out. · iCall helpline 9152987821</div>
      </footer>
    </div>
  );
}
