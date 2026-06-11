import { useState } from 'react';
import Landing from './views/Landing.jsx';
import Onboarding from './views/Onboarding.jsx';
import Chat from './views/Chat.jsx';
import PostSession from './views/PostSession.jsx';

export default function App() {
  // screen: 'landing' | 'onboard' | 'chat' | 'post'
  const [screen, setScreen] = useState('landing');
  const [companionName, setCompanionName] = useState('Mitra');
  const [vibe, setVibe] = useState('gentle');
  const [sessionCount, setSessionCount] = useState(1);

  const [summary, setSummary] = useState(null);
  const [chatKey, setChatKey] = useState(0);

  const handleEnterApp = () => setScreen('onboard');

  const handleStart = (name, selectedVibe) => {
    setCompanionName(name && name.trim() ? name.trim() : 'Mitra');
    setVibe(selectedVibe || 'gentle');
    setChatKey((k) => k + 1);
    setScreen('chat');
  };

  const handleEndSession = (sessionSummary) => {
    setSummary(sessionSummary);
    setScreen('post');
  };

  const handleTalkAgain = () => {
    setSessionCount((c) => c + 1);
    setChatKey((k) => k + 1);
    setScreen('chat');
  };

  const handleBackHome = () => {
    setSessionCount(1);
    setScreen('landing');
  };

  // Landing is a full-width marketing page; the app screens live in a centered frame.
  if (screen === 'landing') {
    return <Landing onEnter={handleEnterApp} />;
  }

  return (
    <div className="app-stage">
      <div className="app-frame">
        {screen === 'onboard' && <Onboarding onStart={handleStart} />}
        {screen === 'chat' && (
          <Chat
            key={chatKey}
            companionName={companionName}
            vibe={vibe}
            sessionCount={sessionCount}
            onEnd={handleEndSession}
          />
        )}
        {screen === 'post' && (
          <PostSession
            summary={summary}
            onTalkAgain={handleTalkAgain}
            onBackHome={handleBackHome}
          />
        )}
      </div>
    </div>
  );
}
