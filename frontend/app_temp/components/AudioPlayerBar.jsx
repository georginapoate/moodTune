// audio player bar component
"use client"

export default function AudioPlayerBar({ title, artist, image, isPlaying, progress, duration, onTogglePlay, onSeek }) {
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    onSeek(percentage * duration)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-card border-t border-white/20 p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        {/* Track info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {image && <img src={image || "/placeholder.svg"} alt={title} className="w-12 h-12 rounded-lg object-cover" />}
          <div className="min-w-0 flex-1">
            <p className="text-white font-medium text-sm truncate">{title}</p>
            <p className="text-white/70 text-xs truncate">{artist}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onTogglePlay}
            className="w-10 h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center transition-all hover:scale-105"
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-white/70 text-xs">{formatTime(progress)}</span>
          <div className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer" onClick={handleSeek}>
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
            />
          </div>
          <span className="text-white/70 text-xs">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}
