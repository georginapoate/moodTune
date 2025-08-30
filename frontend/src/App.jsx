// frontend/src/App.js
import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import MainInterface from './components/MainInterface';

const API_BASE_URL = 'http://127.0.0.1:5001';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentPlayingUrl, setCurrentPlayingUrl] = useState(null);

  const audioRef = useRef(null);

// audio logic

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
    const checkUserSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const userData = await response.json();
          // --- LOG #1: See what we got from the server ---
          console.log("SUCCESSFULLY FETCHED USER DATA:", userData);
          setUser(userData);
        } else {
          console.log("User not logged in (response not ok). Status:", response.status);
          setUser(null);
        }
      } catch (error) {
        console.error("Error checking user session:", error);
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
      {/* --- LOG #2: See the user state on EVERY render --- */}
      {(() => {
        console.log("COMPONENT IS RENDERING. Current user state is:", user);
        return null; // This is a trick to log during render without affecting the layout
      })()}

      <div className="background-gradient"></div>
      <div className={`main-content-container ${showLoginModal ? 'blurred' : ''}`}>
        <header className="App-header">
          <div className="logo-corner">G</div>
          {user && Object.keys(user).length > 0 ? ( // <-- Make the check more robust
            <MainInterface
              user={user}
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