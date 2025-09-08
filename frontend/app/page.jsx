"use client"

import { useState, useEffect } from "react"
import LandingPage from "./components/LandingPage"
import LoginModal from "./components/LoginModal"
import MainInterface from "./components/MainInterface"
import ProfilePage from "./components/ProfilePage"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export default function Home() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [currentView, setCurrentView] = useState("generator") // 'generator', 'profile'

useEffect(() => {
  const finalizeLogin = async () => {
    const url = new URL(window.location.href)
    const token = url.searchParams.get("token")

    if (token) {
      try {
        // Trimitem token-ul la backend ca să fie pus în cookie
        await fetch(`${API_BASE_URL}/api/auth/set-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          credentials: "include",
        })
      } catch (err) {
        console.error("Failed to set cookie from token", err)
      } finally {
        // Scoatem ?token= din URL
        url.searchParams.delete("token")
        window.history.replaceState({}, document.title, url.toString())
      }
    }

    // Acum verificăm sesiunea normal
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        credentials: "include",
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  finalizeLogin()
}, [])


  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/login`
  }

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
      setUser(null)
      setCurrentView("generator")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (loading) {
    // Afișăm o structură "fantomă" care seamănă cu cea finală
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Header fantomă */}
        <header className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-center">
          <div className="h-8 w-32 bg-white/10 rounded-lg animate-pulse"></div>
          <div className="w-12 h-12 bg-white/20 rounded-full animate-pulse"></div>
        </header>

        {/* MainInterface fantomă */}
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-4xl mx-auto space-y-8">
            <div className="glass-card p-8 rounded-4xl space-y-6 animate-pulse">
              <div className="h-7 w-1/3 bg-white/20 rounded-lg"></div>
              <div className="h-32 w-full bg-white/10 rounded-xl"></div>
              <div className="h-14 w-full bg-white/20 rounded-xl"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className={`relative z-10 transition-all duration-300 ${showLoginModal ? "blur-sm" : ""}`}>
        {/* Header with logo and profile */}
        {user && (
          <header className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-center">
            <button
              onClick={() => setCurrentView("generator")}
              className="text-2xl font-bold text-white hover:scale-105 transition-transform"
            >
              povTunes
            </button>
            <button
              onClick={() => setCurrentView(currentView === "profile" ? "generator" : "profile")}
              className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold hover:bg-white/30 transition-all hover-lift overflow-hidden"
            >
              {currentView === "profile" ? (
                // If we're on the profile page, show the 'close' icon
                "×"
              ) : user.profileImageUrl ? (
                // Otherwise, if a profile image exists, show it
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              ) : (
                // As a final fallback, show the initial
                <span>{user.display_name?.[0] || "U"}</span>
              )}
            </button>
          </header>
        )}

        <main className="min-h-screen flex items-center justify-center p-6">
          {user ? (
            <>
              {currentView === "generator" && <MainInterface user={user} />}
              {currentView === "profile" && <ProfilePage user={user} onLogout={handleLogout} />}
            </>
          ) : (
            <LandingPage onLoginClick={() => setShowLoginModal(true)} />
          )}
        </main>
      </div>

      {showLoginModal && <LoginModal onLogin={handleLogin} onClose={() => setShowLoginModal(false)} />}
    </div>
  )
}
