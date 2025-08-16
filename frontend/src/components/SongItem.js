// src/components/SongItem.js
import React from 'react';

export default function SongItem({ song, onRemove, isPlaying, onPlayPause, isPremium }) {
    const canPlay = (isPremium && song.spotifyUri) || (!isPremium && song.previewUrl);

    const handlePlay = e => {
        e.stopPropagation();
        const id = isPremium ? song.spotifyUri : song.previewUrl;
        if (!id) return;
        onPlayPause(id, { title: song.title, artist: song.artist, image: song.albumImage });
    };

    return (
        <div className={`song-item ${isPlaying ? 'playing' : ''} ${!canPlay ? 'no-preview' : ''}`}>
            <div className="album-art-container">
                <img src={song.albumImage} alt={song.album} className="album-art" />
                <button className="play-icon-overlay" onClick={handlePlay} disabled={!canPlay}>
                    {canPlay ? (isPlaying ? '❚❚' : '▶') : '🚫'}
                </button>
            </div>

            <div className="song-details">
                <div className="song-title">{song.title}</div>
                <div className="song-artist">{song.artist}</div>
            </div>

            <div className="song-actions">
                <button className="remove-button" onClick={() => onRemove(song.spotifyTrackId)}>&times;</button>
            </div>
        </div>
    );
}
