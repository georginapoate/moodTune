// frontend/src/App.js
import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import MainInterface from './components/MainInterface';

function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentPlayingUrl, setCurrentPlayingUrl] = useState(null);

  const audioRef = useRef(null);


  useEffect(() => {
    audioRef.current = new Audio();

    const audio = audioRef.current; // for cleanup

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
      if (audio.src !== currentPlayingUrl) {
        audio.src = currentPlayingUrl;
      }
      audio.play().catch(e => console.error("Audio playback failed:", e));
    } else {
      audio.pause();
    }
  }, [currentPlayingUrl]);

  const handlePlayPause = (previewUrl) => {
    setCurrentPlayingUrl(prevUrl => (prevUrl === previewUrl ? null : previewUrl));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('access_token');
    if (tokenFromUrl) {
      setAccessToken(tokenFromUrl);
      localStorage.setItem('spotify_access_token', tokenFromUrl);
      window.history.pushState({}, '', '/');
    } else {
      const tokenFromStorage = localStorage.getItem('spotify_access_token');
      if (tokenFromStorage) {
        setAccessToken(tokenFromStorage);
      }
    }
  }, []);


  const handleLogin = () => {
    window.location.href = 'http://127.0.0.1:5001/api/auth/login';
  };

  return (
    <div className="App">
      <div className="background-gradient"></div>

      <div className={`main-content-container ${showLoginModal ? 'blurred' : ''}`}>
        <header className="App-header">
          <div className="logo-corner">G</div>

          {accessToken ? (
            <MainInterface
              accessToken={accessToken}
              currentPlayingUrl={currentPlayingUrl}
              onPlayPause={handlePlayPause}
            />
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