// src/components/AudioPlayerBar.js
import React from 'react';
import './AudioPlayerBar.css';

export default function AudioPlayerBar({ title, artist, image, isPlaying, progress, duration, onTogglePlay, onSeek }) {
    const pct = duration ? (progress / duration) * 100 : 0;

    const handleSeek = e => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = Math.min(1, Math.max(0, x / rect.width));
        onSeek(Math.floor(ratio * duration));
    };

    const fmt = ms => {
        if (!ms || !isFinite(ms)) return '0:00';
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${m}:${r.toString().padStart(2, '0')}`;
    };

    return (
        <div className="playerbar">
            <div className="pb-left">
                {image ? <img src={image} alt="" className="pb-art" /> : <div className="pb-art placeholder" />}
                <div>
                    <div className="pb-title">{title || '—'}</div>
                    <div className="pb-artist">{artist || ''}</div>
                </div>
            </div>

            <div className="pb-center">
                <button className="pb-btn" onClick={onTogglePlay}>{isPlaying ? '❚❚' : '▶'}</button>
                <div className="pb-time">{fmt(progress)} / {fmt(duration)}</div>
                <div className="pb-seek" onClick={handleSeek}>
                    <div className="pb-seek-progress" style={{ width: `${pct}%` }} />
                </div>
            </div>

            <div className="pb-right" />
        </div>
    );
}
