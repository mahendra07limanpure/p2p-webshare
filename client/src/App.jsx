import { useState, useEffect, useCallback } from 'react';
import Home from './components/Home.jsx';
import Sender from './components/Sender.jsx';
import Receiver from './components/Receiver.jsx';

function getInitialView() {
  const params = new URLSearchParams(window.location.search);
  const room = params.get('room');
  return room ? { view: 'receive', roomId: room } : { view: 'home', roomId: '' };
}

export default function App() {
  const [{ view, roomId }, setRoute] = useState(getInitialView);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
    localStorage.setItem('beam-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const navigate = useCallback((view) => {
    // Drop the ?room= param once we leave the receive flow
    if (view !== 'receive') {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());
    }
    setRoute({ view, roomId: view === 'receive' ? roomId : '' });
  }, [roomId]);

  const toggleTheme = () => setIsDark((d) => !d);

  if (view === 'send') return <Sender onBack={() => navigate('home')} />;
  if (view === 'receive') return <Receiver onBack={() => navigate('home')} initialRoomId={roomId} />;
  return <Home onNavigate={navigate} isDark={isDark} onToggleTheme={toggleTheme} />;
}
