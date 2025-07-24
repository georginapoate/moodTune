import './App.css';
import React, { useState, useEffect } from 'react';


function App() {
  const [access_token, setAccessToken] = useState(null);

  useEffect(() => {
  // First, check the URL for a new token
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get('access_token');

  if (tokenFromUrl) {
    // If we find a new token in the URL, use it and save it
    setAccessToken(tokenFromUrl);
    localStorage.setItem('spotify_access_token', tokenFromUrl);
    // Clean the URL so the token doesn't sit there forever
    window.history.pushState({}, document.title, "/");
  } else {
    // If no token in URL, check if we have one saved in localStorage
    const tokenFromStorage = localStorage.getItem('spotify_access_token');
    if (tokenFromStorage) {
      setAccessToken(tokenFromStorage);
    }
  }
}, []);

  const handleLogin = () => {
    window.location.href = 'http://localhost:5001/api/auth/login';
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Moodtunes</h1>
          {
            /* conditional render. It shows one thing if we're logged in,
            and another if we are not. */
          }
        {!access_token ? (
          <button onClick={handleLogin} style={{ padding: '10px 20px', fontSize: '16px' }}>
            Login with Spotify
          </button>
        ) : (
          // If there IS an access token, show a success message
          <h2>You are successfully logged in!</h2>
        )}
      </header>
    </div>
  );
}

export default App;
