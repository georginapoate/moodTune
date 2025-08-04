// frontend/src/components/MainInterface.js
import React, { useState } from 'react';
import axios from 'axios';
import './MainInterface.css'; // Make sure MainInterface.css also exists

function MainInterface({ accessToken }) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    setIsLoading(true);
    setPlaylistUrl('');
    setError('');

    try {
      const response = await axios.post(
        'http://127.0.0.1:5001/api/playlist/generate',
        {
          prompt: prompt,
          accessToken: accessToken,
        }
      );
      setPlaylistUrl(response.data.playlistUrl);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-interface-container">
      <div className="main-content">
        <form onSubmit={handleSubmit}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., driving down a coastal highway at sunset with the windows down..."
            rows="4"
            required
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Vibing...' : 'Create My Playlist'}
          </button>
        </form>

        {playlistUrl && (
          <div className="result-success">
            <h3>Playlist Created!</h3>
            <a href={playlistUrl} target="_blank" rel="noopener noreferrer">
              Open on Spotify
            </a>
          </div>
        )}

        {error && <p className="result-error">Error: {error}</p>}
      </div>
    </div>
  );
}

export default MainInterface;