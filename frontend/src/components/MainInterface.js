// frontend/src/components/MainInterface.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MainInterface.css';
import SongPreviewList from './SongPreviewList';

function MainInterface({ accessToken, currentPlayingUrl, onPlayPause }) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [songs, setSongs] = useState([]);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [error, setError] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');

  useEffect(() => {
        console.log('STEP 2: The "songs" state has been updated. New value:', songs);
    }, [songs]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    setIsLoading(true);
    setSongs([]);
    setOriginalPrompt(prompt);
    setPlaylistUrl('');
    setError('');
    setSongs([]);

    try {
      const response = await axios.post(
        'http://127.0.0.1:5001/api/playlist/generate',
        {
          prompt: prompt,
          accessToken: accessToken,
        }
      );
      setSongs(response.data.songs);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToSpotify = async () => {
    
    if (songs.length === 0) {
      setError("Cannot save an empty playlist.");
      return;
    }

    setIsLoading(true);
    setError('');
    try {
        const response = await axios.post(
            'http://127.0.0.1:5001/api/playlist/create',
            { songs: songs, prompt: originalPrompt, accessToken }
        );
        setPlaylistUrl(response.data.playlistUrl);
        setSongs([]);
        setPrompt('');
    } catch (err) {
        setError(err.response?.data?.error || 'Failed to save playlist.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleRemoveSong = (trackId) => {
    setSongs(songs.filter(song => song.spotifyTrackId !== trackId));
  };

  return (
    <div className="main-interface-container">
        <div className="main-content">
            <form onSubmit={handleSubmit}>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., an abandoned space station drifting towards a black hole"
                    rows="4"
                    required
                />
                <button type="submit" disabled={isLoading}>
                    {isLoading && !playlistUrl ? 'Vibing...' : 'Create My Playlist'}
                </button>
            </form>

            {error && <p className="result-error">Error: {error}</p>}
            
            {playlistUrl && (
                <div className="result-success">
                    <h3>Playlist successfully created!</h3>
                    <a href={playlistUrl} target="_blank" rel="noopener noreferrer">
                        Open on Spotify
                    </a>
                </div>
            )}
            
            {songs.length > 0 && !playlistUrl && (
                <SongPreviewList
                    songs={songs}
                    prompt={originalPrompt}
                    onSave={handleSaveToSpotify}
                    onRemove={handleRemoveSong}
                    currentPlayingUrl={currentPlayingUrl}
                    onPlayPause={onPlayPause}
                />
            )}
        </div>
    </div>
  );
}

export default MainInterface;