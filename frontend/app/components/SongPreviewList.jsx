// song preview list component
"use client"

import SongItem from "./SongItem"

export default function SongPreviewList({
  songs,
  prompt,
  onSave,
  onRemove,
  currentPlayingUrl,
  onPlayPause,
  isPremium,
}) {
  return (
    <div className="glass-card p-8 rounded-2xl space-y-6">
      <h2 className="text-2xl font-bold text-white text-center">Your AI-Generated Vibe ✨</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="text-center pt-4">
        <button
          onClick={() => onSave(songs, prompt)}
          className="bg-white text-primary font-semibold py-4 px-8 rounded-xl hover:bg-white/90 transition-all hover-lift mb-20 "
        >
          Save to Spotify
        </button>
      </div>
    </div>
  )
}
