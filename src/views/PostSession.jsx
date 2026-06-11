import { useState } from 'react';

const SAFE_SUMMARY = {
  tags: ['brave', 'honest', 'open'],
  insight: 'You showed up and let yourself be honest about what you were carrying.',
  thought: 'Showing up for yourself, even quietly, is its own kind of strength.',
};

export default function PostSession({ summary, onTalkAgain, onBackHome }) {
  const data = summary || SAFE_SUMMARY;
  const [saved, setSaved] = useState(false);
  const [checkin, setCheckin] = useState(false);

  return (
    <div className="post">
      <div className="eyebrow-mono">Session complete</div>
      <h1 className="post-headline display-md">You showed up for yourself today.</h1>
      <p className="post-sub body-sm">That takes real courage.</p>

      {/* Mood card */}
      <div className="card">
        <div className="card-mini-label">What you were holding</div>
        <div className="tag-row">
          {data.tags.map((tag, i) => (
            <span key={i} className={`pill-tag${i === 0 ? ' live' : ''}`}>
              {i === 0 && <span className="dot-live" />}
              {tag}
            </span>
          ))}
        </div>
        <div className="insight">{data.insight}</div>
      </div>

      {/* Save thought card */}
      <div className="card">
        <div className="card-mini-label">A thought from today</div>
        <div className="thought-text">"{data.thought}"</div>
        <button
          className="btn-ghost-green"
          style={{ padding: 0 }}
          onClick={() => setSaved(true)}
        >
          {saved ? '✓ Saved' : '+ Save to journal'}
        </button>
      </div>

      {/* Daily check-in */}
      <div className="checkin-row">
        <div className="checkin-icon">🔔</div>
        <div className="checkin-text">
          <div className="checkin-title">Daily check-in</div>
          <div className="checkin-sub">A gentle nudge to spill once a day</div>
        </div>
        <button
          className={`toggle${checkin ? ' on' : ''}`}
          onClick={() => setCheckin((c) => !c)}
          aria-label="Toggle daily check-in"
        >
          <span className="toggle-knob" />
        </button>
      </div>

      <div className="post-spacer" />

      <div className="post-actions">
        <button className="btn-primary btn-full" onClick={onTalkAgain}>
          Talk again
        </button>
        <button className="btn-outline btn-full" onClick={onBackHome}>
          Back to home
        </button>
      </div>
    </div>
  );
}
