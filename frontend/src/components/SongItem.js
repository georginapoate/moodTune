// frontend/src/components/SongItem.js
import React from 'react';

    function SongItem({ song, onRemove, isPlaying, onPlayPause }) {

        const handlePlayPauseClick = () => {
            if (song.previewUrl) {
                onPlayPause(song.previewUrl);
            }
        };

        const handleRemoveClick = (e) => {
            e.stopPropagation(); // Prevents the song from playing when you click remove
            onRemove(song.spotifyTrackId);
        };

        return (
            <div className={`song-item ${isPlaying ? 'playing' : ''} ${!song.previewUrl ? 'no-preview' : ''}`}
            onClick={handlePlayPauseClick}>
                <div className="album-art-container">
                    <img src={song.albumImage} alt={song.album} className="album-art" />
                    {/* Show a play/pause icon overlay */}
                    <div className="play-icon-overlay">
                        {song.previewUrl ? (isPlaying ? '❚❚' : '▶') : '🚫'}
                    </div>
                </div>

            <div className="song-details">
                <div className="song-title">{song.title}</div>
                <div className="song-artist">{song.artist}</div>
            </div>
            
            <div className="song-actions">
                {/* The "favorite" button is for later, but the remove button is essential now */}
                <button className="remove-button" onClick={handleRemoveClick}>
                    &times; {/* A simple 'X' icon for remove */}
                </button>
            </div>
        </div>
        );
    }
    export default SongItem;