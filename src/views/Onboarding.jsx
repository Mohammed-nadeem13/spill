import { useState } from 'react';

const VIBES = [
  { id: 'gentle', emoji: '🤗', name: 'Gentle', desc: 'Warm & soft' },
  { id: 'direct', emoji: '💪', name: 'Direct', desc: 'Honest & clear' },
  { id: 'witty', emoji: '😄', name: 'Witty', desc: 'Light & fun' },
];

export default function Onboarding({ onStart }) {
  const [name, setName] = useState('');
  const [vibe, setVibe] = useState('gentle');

  return (
    <div className="onboard">
      <div className="eyebrow-mono">Set up your space</div>
      <h1 className="display-md onboard-title">Who's listening tonight?</h1>

      <label className="field-label" htmlFor="companion-name">
        What should your companion call themselves?
      </label>
      <input
        id="companion-name"
        className="text-input"
        type="text"
        maxLength={20}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Mitra, Yaar, Bestie..."
      />

      <div className="privacy-note">
        <span style={{ color: 'var(--primary)' }}>🔒</span>
        <span className="body-sm">No signup needed. Your conversations are private and never shared.</span>
      </div>

      <label className="field-label">How should they talk to you?</label>
      <div className="vibe-row">
        {VIBES.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`vibe-card${vibe === v.id ? ' selected' : ''}`}
            onClick={() => setVibe(v.id)}
          >
            <span className="vibe-emoji">{v.emoji}</span>
            <span className="vibe-name">{v.name}</span>
            <div className="vibe-desc">{v.desc}</div>
          </button>
        ))}
      </div>

      <div className="onboard-spacer" />

      <div className="onboard-actions">
        <button className="btn-primary btn-full" onClick={() => onStart(name, vibe)}>
          Start talking →
        </button>
        <button className="btn-ghost-green" onClick={() => onStart('Mitra', 'gentle')}>
          Skip personalisation
        </button>
      </div>
    </div>
  );
}
