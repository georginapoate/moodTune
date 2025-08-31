// frontend/src/App.js
import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import MainInterface from './components/MainInterface';
import HistoryPage from './components/HistoryPage'; // <-- 1. IMPORT a missing component

const API_BASE_URL = 'http://127.0.0.1:5001';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [view, setView] = useState('generator'); // <-- 2. ADD the missing state variable

  // --- Your existing audio logic (no changes needed) ---
  const [currentPlayingUrl, setCurrentPlayingUrl] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;
    const handleSongEnd = () => setCurrentPlayingUrl(null);
    audio.addEventListener('ended', handleSongEnd);
    return () => {
      audio.pause();
      audio.removeEventListener('ended', handleSongEnd);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (currentPlayingUrl) {
      if (audio.src !== currentPlayingUrl) audio.src = currentPlayingUrl;
      audio.play().catch(e => console.error("Audio playback failed:", e));
    } else {
      audio.pause();
    }
  }, [currentPlayingUrl]);

  const handlePlayPause = (previewUrl) => {
    setCurrentPlayingUrl(prevUrl => (prevUrl === previewUrl ? null : previewUrl));
  };
  // ---

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUserSession();
  }, []);

  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/login`;
  };

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="App">
      <div className="background-gradient"></div>
      <div className={`main-content-container ${showLoginModal ? 'blurred' : ''}`}>
        <header className="App-header">
          <div className="logo-corner">G</div>

          {user ? (
            // This logic will now work correctly
            <>
              {view === 'generator' && (
                <MainInterface
                  user={user}
                  onShowHistory={() => setView('history')}
                  currentPlayingUrl={currentPlayingUrl}
                  onPlayPause={handlePlayPause} // Pass the correct handler
                />
              )}
              {view === 'history' && (
                <HistoryPage onBackClick={() => setView('generator')} />
              )}
            </>
          ) : (
            <LandingPage onLoginClick={() => setShowLoginModal(true)} />
          )}

        </header>
      </div>
      {showLoginModal && (
        <LoginModal
          onLogin={handleLogin}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}

export default App;