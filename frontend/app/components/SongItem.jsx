// song item component

"use client"

export default function SongItem({ song, onRemove, isPlaying, onPlayPause, isPremium }) {
  const canPlay = (isPremium && song.spotifyUri) || (!isPremium && song.previewUrl)

  const handlePlay = (e) => {
    e.stopPropagation()
    const id = isPremium ? song.spotifyUri : song.previewUrl
    if (!id) return
    onPlayPause(id, { title: song.title, artist: song.artist, image: song.albumImage })
  }

  return (
    <div
      className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 hover:bg-white/10 transition-all hover-lift ${isPlaying ? "ring-2 ring-accent" : ""}`}
    >
      <div className="relative mb-4">
        <img
          src={song.albumImage || "/placeholder.svg"}
          alt={song.album}
          className="w-full aspect-square object-cover rounded-lg"
        />
        <button
          onClick={handlePlay}
          disabled={!canPlay}
          className={`absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            canPlay
              ? "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {canPlay ? (isPlaying ? "⏸" : "▶") : "🚫"}
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-white font-semibold text-sm line-clamp-2 leading-tight">{song.title}</h3>
        <p className="text-white/70 text-xs line-clamp-1">{song.artist}</p>
      </div>

      <button
        onClick={() => onRemove(song.spotifyTrackId)}
        className="mt-3 w-full text-destructive hover:text-destructive/80 text-sm font-medium transition-colors cursor-pointer"
      >
        Remove
      </button>
    </div>
  )
}
