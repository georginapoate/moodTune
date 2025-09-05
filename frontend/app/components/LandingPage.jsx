// landing page component
"use client"

export default function LandingPage({ onLoginClick }) {
  return (
    <div className="text-center animate-fade-in max-w-2xl mx-auto">
      <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">povTunes</h1>
      <p className="text-xl md:text-2xl text-white/80 mb-12 leading-relaxed">
        create your perfect playlist for whatever mood you're feeling today
      </p>
      <button
        onClick={onLoginClick}
        className="glass-card px-8 py-4 rounded-full text-white font-semibold text-lg hover-lift group transition-all duration-300 cursor-pointer"
      >
        <span className="flex items-center gap-3">
          Log in
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </span>
      </button>
    </div>
  )
}
