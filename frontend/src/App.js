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
    // 3. Create the instance and store it in the ref's .current property
    audioRef.current = new Audio();
    
    const audio = audioRef.current; // for cleanup
    
    const handleSongEnd = () => setCurrentPlayingUrl(null);
    audio.addEventListener('ended', handleSongEnd);

    // Cleanup function to run when the App component unmounts
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
 
  // This useEffect logic is correct and does not need to change.
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
    // The main .App div no longer gets the blur class.
    <div className="App">
      <div className="background-gradient"></div>
      
      {/* --- THIS IS THE NEW CONTAINER FOR BLURRED CONTENT --- */}
      {/* We apply the 'blurred' class to this div instead of the main one. */}
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

      {/* --- THE MODAL IS NOW A SIBLING, NOT A CHILD --- */}
      {/* Because it's outside the blurred container, it will remain sharp. */}
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