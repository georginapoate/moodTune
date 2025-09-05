//  audio preview hook

"use client"

import { useEffect, useRef, useState } from "react"

export default function usePreviewAudio() {
  const audioRef = useRef(null)
  const [state, setState] = useState({
    trackUri: null, // here this is the previewUrl
    isPlaying: false,
    progress: 0,
    duration: 0,
    title: "",
    artist: "",
    image: "",
  })

  useEffect(() => {
    audioRef.current = new Audio()
    const a = audioRef.current

    const onPlay = () => setState((s) => ({ ...s, isPlaying: true }))
    const onPause = () => setState((s) => ({ ...s, isPlaying: false }))
    const onTime = () => setState((s) => ({ ...s, progress: a.currentTime * 1000, duration: (a.duration || 0) * 1000 }))
    const onEnded = () => setState((s) => ({ ...s, isPlaying: false, progress: 0 }))

    a.addEventListener("play", onPlay)
    a.addEventListener("pause", onPause)
    a.addEventListener("timeupdate", onTime)
    a.addEventListener("ended", onEnded)
    a.addEventListener("loadedmetadata", onTime)

    return () => {
      a.pause()
      a.src = ""
      a.removeEventListener("play", onPlay)
      a.removeEventListener("pause", onPause)
      a.removeEventListener("timeupdate", onTime)
      a.removeEventListener("ended", onEnded)
      a.removeEventListener("loadedmetadata", onTime)
    }
  }, [])

  return {
    state,
    async toggleTrack(previewUrl, meta = {}) {
      const a = audioRef.current
      if (!a) return

      // if same track, toggle play/pause
      if (state.trackUri === previewUrl) {
        if (state.isPlaying) a.pause()
        else await a.play().catch(() => {})
        return
      }

      // new track
      a.pause()
      a.src = previewUrl
      setState((s) => ({
        ...s,
        trackUri: previewUrl,
        title: meta.title || "",
        artist: meta.artist || "",
        image: meta.image || "",
      }))
      await a.play().catch(() => {})
    },
    seek(ms) {
      const a = audioRef.current
      if (!a) return
      a.currentTime = ms / 1000
    },
    togglePause() {
      const a = audioRef.current
      if (!a) return
      if (a.paused) a.play().catch(() => {})
      else a.pause()
    },
    setVolume(v) {
      const a = audioRef.current
      if (a) a.volume = Math.max(0, Math.min(1, v))
    },
  }
}
