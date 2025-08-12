// frontend/src/components/SongItem.js
import React from 'react';

    function SongItem({ song }) {
        // We will add play/favorite logic here later
        return (
            <div className="song-item">
                <img src={song.albumImage} alt={song.album} className="album-art" />
                <div className="song-details">
                    <div className="song-title">{song.title}</div>
                    <div className="song-artist">{song.artist}</div>
                </div>
                {/* Placeholder for future buttons */}
                <div className="song-actions">
                    {song.previewUrl && <button className="play-button">▶</button>}
                    <button className="favorite-button">♥</button>
                </div>
            </div>
        );
    }
    export default SongItem;