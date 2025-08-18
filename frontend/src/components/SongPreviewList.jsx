// src/components/SongPreviewList.js
import React from 'react';
import SongItem from './SongItem';

export default function SongPreviewList({
    songs, prompt, onSave, onRemove, currentPlayingUrl, onPlayPause, isPremium
}) {
    return (
        <div className="song-preview-container">
            <h2>Your AI-Generated Vibe:</h2>
            <div className="song-list">
                {songs.map((song, i) => (
                    <SongItem
                        key={song.spotifyTrackId || i}
                        song={song}
                        onRemove={onRemove}
                        isPlaying={currentPlayingUrl === (isPremium ? song.spotifyUri : song.previewUrl)}
                        onPlayPause={onPlayPause}
                        isPremium={isPremium}
                    />
                ))}
            </div>
            <button className="save-to-spotify-button" onClick={() => onSave(songs, prompt)}>Save to Spotify</button>
        </div>
    );
}
