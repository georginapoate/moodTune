// frontend/src/components/LandingPage.js
import React from 'react';

function LandingPage({ onLoginClick }) {
  return (
    <div className="landing-container">
      <h1>MoodTunes</h1>
      <p>create your perfect playlist for whatever mood you're feeling today</p>
      <button className="login-prompt-button" onClick={onLoginClick}>
        Log in <span className="arrow">→</span>
      </button>
    </div>
  );
}

export default LandingPage;