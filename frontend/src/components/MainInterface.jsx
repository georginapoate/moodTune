// src/components/MainInterface.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './MainInterface.css';
import SongPreviewList from './SongPreviewList';
import useUnifiedPlayer from '../hooks/useUnifiedPlayer';
import AudioPlayerBar from './AudioPlayerBar';

const API_BASE_URL = 'http://127.0.0.1:5001';

function MainInterface({user, currentPlayingUrl, onPlayPause }) {
  const [prompt, setPrompt] = useState('');
  const [songs, setSongs] = useState([]);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [error, setError] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // check premium status & popup
  const isPremium = useMemo(() => user?.product === 'premium', [user]);
  const [showPremiumPopup, setShowPremiumPopup] = useState(!isPremium);

  // fresh token supplier for SDK
const getAccessToken = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/player-token`, {
        withCredentials: true, // This sends our secure session cookie!
      });
      return response.data.accessToken;
    } catch (err) {
      console.error("Could not fetch player token", err);
      return null;
    }
  }, []);

  const player = useUnifiedPlayer({ isPremium, getAccessToken });


const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    setSongs([]);
    setOriginalPrompt(prompt);
    setPlaylistUrl('');
    setError('');
    try {
      const resp = await axios.post(`${API_BASE_URL}/api/playlist/generate`,
        { prompt },
        { withCredentials: true }
      );
      setSongs(resp.data.songs);
    } catch (err) {
      setError(err.response?.data?.error || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToSpotify = async () => {
    if (!songs.length) return setError('Cannot save an empty playlist.');
    setIsLoading(true);
    setError('');
    try {
      const resp = await axios.post(`${API_BASE_URL}/api/playlist/create`,
        { songs, prompt: originalPrompt },
        { withCredentials: true }
      );
      setPlaylistUrl(resp.data.playlistUrl);
      setSongs([]);
      setPrompt('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save playlist.');
    } finally {
      setIsLoading(false);
    }
  };


  const handlePlayPause = (uriOrUrl, meta) => {
    player.toggleTrack(uriOrUrl, meta);
  };

  const currentTrackId = player.state.trackUri;

  return (
    <div className="main-interface-container">
      {showPremiumPopup && (
        <div className="premium-popup">
          <div className="pp-card">
            <div className="pp-title">Limited Playback</div>
            <div className="pp-body">
              You’re not on Spotify Premium. In‑app playback will use 30‑sec previews only.
            </div>
            <button className="pp-close" onClick={() => setShowPremiumPopup(false)}>Got it</button>
          </div>
        </div>
      )}

      <div className="main-content">
        <form className="prompt-form" onSubmit={handleSubmit}>
          <textarea className="prompt-textarea"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
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
            <a href={playlistUrl} target="_blank" rel="noopener noreferrer">Open on Spotify</a>
          </div>
        )}

        {songs.length > 0 && !playlistUrl && (
          <SongPreviewList
            songs={songs}
            prompt={originalPrompt}
            onSave={handleSaveToSpotify}
            onRemove={trackId => setSongs(songs.filter(s => s.spotifyTrackId !== trackId))}
            currentPlayingUrl={currentTrackId}
            onPlayPause={handlePlayPause}
            isPremium={isPremium}
          />
        )}
      </div>

      {player.state.trackUri && (
        <AudioPlayerBar
          title={player.state.title}
          artist={player.state.artist}
          image={player.state.image}
          isPlaying={player.state.isPlaying}
          progress={player.state.progress}
          duration={player.state.duration}
          onTogglePlay={() => player.togglePause()}
          onSeek={ms => player.seek(ms)}
        />
      )}
    </div>
  );
}

export default MainInterface;
