// frontend/src/components/SongPreviewList.js

import React from 'react';
    import SongItem from './SongItem'; // We will create this next

    function SongPreviewList({ songs, onSave, prompt }) {
        return (
            <div className="song-preview-container">
                <h2>Your AI-Generated Vibe:</h2>
                <div className="song-list">
                    {songs.map((song, index) => (
                        <SongItem key={song.spotifyTrackId || index} song={song} />
                    ))}
                </div>
                <button className="save-to-spotify-button" onClick={() => onSave(songs, prompt)}>
                    Save to Spotify
                </button>
            </div>
        );
    }
    export default SongPreviewList;