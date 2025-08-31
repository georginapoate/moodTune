// frontend/src/components/HistoryPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HistoryPage.css'; // We will create this CSS file next

const API_BASE_URL = 'http://127.0.0.1:5001';

function HistoryPage({ onBackClick }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null); // To track which playlist is being saved
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users/history`, {
          withCredentials: true,
        });
        setHistory(response.data);
      } catch (err) {
        setError('Failed to load your playlist history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleSaveToSpotify = async (historyItem) => {
    setSavingId(historyItem._id);
    setError('');
    setSuccessMessage('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/playlist/create`, 
        {
          songs: historyItem.songs,
          prompt: historyItem.promptText
        },
        { withCredentials: true }
      );
      setSuccessMessage(`Playlist "${historyItem.promptText}" saved successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000); // Clear message after 5 seconds
    } catch (err) {
      setError('Failed to save this playlist to Spotify.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (promptIdToDelete) => {
    setHistory(currentHistory => currentHistory.filter(item => item._id !== promptIdToDelete));
    
    try {
      await axios.delete(`${API_BASE_URL}/api/playlist/${promptIdToDelete}`, {
        withCredentials: true,
      });
    } catch (err) {
      setError('Could not delete playlist. Please refresh and try again.');
    }
  };

  if (loading) return <div className="loading-spinner">Loading History...</div>;
  if (error) return <p className="result-error" style={{textAlign: 'center'}}>{error}</p>;

  return (
    <div className="history-page">
      <button onClick={onBackClick} className="back-button">← Back to Generator</button>
      <h1>Your Past Playlists</h1>
      
      {successMessage && <p className="result-success" style={{textAlign: 'center'}}>{successMessage}</p>}
      
      <div className="history-list">
        {history.length === 0 ? (
          <p className="no-history-message">You haven't generated any playlists yet. Go create one!</p>
        ) : (
          history.map(item => (
            <div key={item._id} className="history-item">
              <div className="history-item-header">
                <h3>"{item.promptText}"</h3>
                <button 
                  className="save-button"
                  onClick={() => handleSaveToSpotify(item)}
                  disabled={savingId === item._id}
                >
                  {savingId === item._id ? 'Saving...' : 'Save to Spotify'}
                </button>
                <button 
                    className="delete-button"
                    onClick={() => handleDelete(item._id)}
                >
                    Delete
                </button>
              </div>
              <p className="history-date">{new Date(item.createdAt).toLocaleString()}</p>
              <ul className="song-list">
                {item.songs.map(song => (
                  <li key={song._id}><strong>{song.title}</strong> - {song.artist}</li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default HistoryPage;