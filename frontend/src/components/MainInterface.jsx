// src/components/MainInterface.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './MainInterface.css';
import SongPreviewList from './SongPreviewList';
import useUnifiedPlayer from '../hooks/useUnifiedPlayer';
import AudioPlayerBar from './AudioPlayerBar';

function MainInterface({ accessToken: initialAccessToken, refreshToken }) {
  const [accessToken, setAccessToken] = useState(initialAccessToken);
  const [prompt, setPrompt] = useState('');
  const [songs, setSongs] = useState([]);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [error, setError] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);

  // fresh token supplier for SDK
  const getAccessToken = useCallback(async () => {
    // OPTIONAL: call backend to refresh if needed
    try {
      const res = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.status === 401 && refreshToken) {
        const r = await fetch('http://127.0.0.1:5001/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        const data = await r.json();
        if (data.accessToken) setAccessToken(data.accessToken);
        return data.accessToken || accessToken;
      }
    } catch {
      // ignore; fall back to existing token
    }
    return accessToken;
  }, [accessToken, refreshToken]);

  const player = useUnifiedPlayer({ isPremium, getAccessToken });

  useEffect(() => {
    (async () => {
      if (!accessToken) return;
      try {
        const res = await fetch('https://api.spotify.com/v1/me', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await res.json();
        const premium = data?.product === 'premium';
        setIsPremium(premium);
        setShowPremiumPopup(!premium);
      } catch {
        setIsPremium(false);
        setShowPremiumPopup(true);
      }
    })();
  }, [accessToken]);

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    setSongs([]);
    setOriginalPrompt(prompt);
    setPlaylistUrl('');
    setError('');
    try {
      const resp = await axios.post('http://127.0.0.1:5001/api/playlist/generate', {
        prompt, accessToken
      });
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
      const resp = await axios.post('http://127.0.0.1:5001/api/playlist/create', {
        songs, prompt: originalPrompt, accessToken
      });
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
