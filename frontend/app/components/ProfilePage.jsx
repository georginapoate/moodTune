// profile page component

"use client"

import { useState, useEffect } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export default function ProfilePage({ user, onLogout }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [savingId, setSavingId] = useState(null)
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const axios = (await import("axios")).default
        const response = await axios.get(`${API_BASE_URL}/api/users/history`, {
          withCredentials: true,
        })
        setHistory(response.data)
      } catch (err) {
        setError("Failed to load your playlist history.")
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  const handleSaveToSpotify = async (historyItem) => {
    setSavingId(historyItem._id)
    setError("")
    setSuccessMessage("")
    try {
      const axios = (await import("axios")).default
      const response = await axios.post(
        `${API_BASE_URL}/api/playlist/create`,
        {
          songs: historyItem.songs,
          prompt: historyItem.promptText,
        },
        { withCredentials: true },
      )
      setSuccessMessage(`Playlist "${historyItem.promptText}" saved successfully!`)
      setTimeout(() => setSuccessMessage(""), 5000)
    } catch (err) {
      setError("Failed to save this playlist to Spotify.")
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (promptIdToDelete) => {
    setHistory((currentHistory) => currentHistory.filter((item) => item._id !== promptIdToDelete))

    try {
      const axios = (await import("axios")).default
      await axios.delete(`${API_BASE_URL}/api/playlist/${promptIdToDelete}`, {
        withCredentials: true,
      })
    } catch (err) {
      setError("Could not delete playlist. Please refresh and try again.")
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in space-y-8">
      <div className="glass-card p-8 rounded-2xl text-center">
        <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt={`Profile picture of ${user.display_name}`}
            width={30}
            height={30}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <span>{user.display_name?.[0] || "U"}</span>
        )}
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{user.display_name || user.displayName || "Music Lover"}</h1>
        <p className="text-white/70 mb-6">{user.email}</p>
        <div className="flex items-center justify-center gap-4 text-sm text-white/60">
          <span className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${user.product === "premium" ? "bg-accent" : "bg-muted"}`}></div>
            {user.product === "premium" ? "Premium" : "Free"} Account
          </span>
          <span>•</span>
          <span>{user.followers?.total || 0} followers</span>
        </div>
      </div>

      <div className="glass-card p-8 rounded-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Your Playlist History</h2>

        {successMessage && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-6">
            <p className="text-green-400 text-center">{successMessage}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
            <p className="text-white/70">Loading your vibes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎵</div>
            <p className="text-white/70 text-lg">No playlists created yet</p>
            <p className="text-white/50">Start creating some vibes!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item._id}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-2 text-lg">"{item.promptText}"</h3>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{item.songs?.length || 0} tracks</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleSaveToSpotify(item)}
                      disabled={savingId === item._id}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all hover-lift text-sm"
                    >
                      {savingId === item._id ? "Saving..." : "Save to Spotify"}
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold py-2 px-4 rounded-lg transition-all hover-lift text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {item.songs && item.songs.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-4 mt-4">
                    <h4 className="text-white/80 font-medium mb-3 text-sm">Tracks:</h4>
                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                      {item.songs.map((song) => (
                        <li
                          key={song._id}
                          className="text-white/70 text-sm py-1 border-b border-white/10 last:border-b-0"
                        >
                          <span className="font-medium">{song.title}</span> - {song.artist}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout section */}
      <div className="glass-card p-8 rounded-2xl">
        <h3 className="text-xl font-bold text-white mb-4">Account Actions</h3>
        <button
          onClick={onLogout}
          className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold py-3 px-6 rounded-xl transition-all hover-lift"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
