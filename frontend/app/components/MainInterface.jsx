// main interface component
"use client"

import { useState, useCallback, useMemo } from "react"
import SongPreviewList from "./SongPreviewList"
import AudioPlayerBar from "./AudioPlayerBar"
import useUnifiedPlayer from "../hooks/useUnifiedPlayer"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export default function MainInterface({ user }) {
  const [prompt, setPrompt] = useState("")
  const [songs, setSongs] = useState([])
  const [playlistUrl, setPlaylistUrl] = useState("")
  const [error, setError] = useState("")
  const [originalPrompt, setOriginalPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const isPremium = useMemo(() => user?.product === "premium", [user])
  const [showPremiumPopup, setShowPremiumPopup] = useState(!isPremium)

  const getAccessToken = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/player-token`, {
        credentials: "include",
      })
      const data = await response.json()
      return data.accessToken
    } catch (err) {
      console.error("Could not fetch player token", err)
      return null
    }
  }, [])

  const player = useUnifiedPlayer({ isPremium, getAccessToken })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setSongs([])
    setOriginalPrompt(prompt)
    setPlaylistUrl("")
    setError("")

    try {
      const response = await fetch(`${API_BASE_URL}/api/playlist/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()
      setSongs(data.songs)
    } catch (err) {
      setError(err.response?.data?.error || "An unknown error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveToSpotify = async () => {
    if (!songs.length) return setError("Cannot save an empty playlist.")
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`${API_BASE_URL}/api/playlist/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ songs, prompt: originalPrompt }),
      })

      const data = await response.json()
      setPlaylistUrl(data.playlistUrl)
      setSongs([])
      setPrompt("")
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save playlist.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayPause = (uriOrUrl, meta) => {
    player.toggleTrack(uriOrUrl, meta)
  }

  const currentTrackId = player.state.trackUri

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      {showPremiumPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-3">Limited Playback</h3>
            <p className="text-white/80 mb-6">
              You're not on Spotify Premium. In‑app playback will use 30‑sec previews only.
            </p>
            <button
              onClick={() => setShowPremiumPopup(false)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-all cursor-pointer hover-lift"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Prompt form */}
        <form onSubmit={handleSubmit} className="glass-card p-8 rounded-4xl space-y-6">
          <div>
            <label className="block text-white font-medium mb-3 text-lg">What's your vibe today?</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., an abandoned space station drifting towards a black hole"
              rows="4"
              required
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-semibold py-4 px-6 rounded-xl transition-all hover-lift flex items-center justify-center gap-3 cursor-pointer"
          >
            {isLoading && !playlistUrl ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                Vibing...✨
              </>
            ) : (
              "Create My Playlist"
            )}
          </button>
        </form>

        {/* Error message */}
        {error && (
          <div className="glass-card p-6 rounded-2xl border-destructive/50">
            <p className="text-destructive-foreground font-medium">Error: {error}</p>
          </div>
        )}

        {/* Success message */}
        {playlistUrl && (
          <div className="glass-card p-8 rounded-2xl text-center space-y-4">
            <h3 className="text-2xl font-bold text-white">Your vibey playlist was successfully saved! 🎉</h3>
            <a
              href={playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-primary font-semibold py-3 px-8 rounded-xl hover:bg-white/90 transition-all hover-lift"
            >
              Open on Spotify
            </a>
          </div>
        )}

        {/* Song preview list */}
        {songs.length > 0 && !playlistUrl && (
          <SongPreviewList
            songs={songs}
            prompt={originalPrompt}
            onSave={handleSaveToSpotify}
            onRemove={(trackId) => setSongs(songs.filter((s) => s.spotifyTrackId !== trackId))}
            currentPlayingUrl={currentTrackId}
            onPlayPause={handlePlayPause}
            isPremium={isPremium}
          />
        )}
      </div>

      {/* Audio player bar */}
      {player.state.trackUri && (
        <AudioPlayerBar
          title={player.state.title}
          artist={player.state.artist}
          image={player.state.image}
          isPlaying={player.state.isPlaying}
          progress={player.state.progress}
          duration={player.state.duration}
          onTogglePlay={() => player.togglePause()}
          onSeek={(ms) => player.seek(ms)}
        />
      )}
    </div>
  )
}
