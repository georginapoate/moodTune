import React from 'react';
import './LoginModal.css'; // Vom adăuga stilurile imediat

function LoginModal({ onLogin, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <p className="modal-text">
          We gatekeep nothing — but Spotify does.
          <br />
          Log in to vibe ✨
        </p>
        <button className="spotify-connect-button" onClick={onLogin}>
          <span className="spotify-icon"></span> {/* Vom adăuga iconița cu CSS */}
          Connect with Spotify
        </button>
      </div>
    </div>
  );
}

export default LoginModal;