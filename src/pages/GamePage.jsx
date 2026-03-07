import Starfield from '../components/Starfield'
import HeroPanel from '../components/HeroPanel'
import WeekMap from '../components/WeekMap'
import QuestPanel from '../components/QuestPanel'
import { useAuth } from '../hooks/useAuth'

export default function GamePage() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-dark relative">
      <Starfield />

      {/* Header */}
      <header className="relative z-10 border-b border-dark-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-gold font-bold text-lg tracking-wider">VDX QUEST</h1>
        <button
          onClick={signOut}
          className="text-gray-500 text-xs hover:text-gold transition-colors"
        >
          Deconnexion
        </button>
      </header>

      {/* Main layout */}
      <main className="relative z-10 max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Hero */}
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-4">
            <HeroPanel />
          </div>
        </div>

        {/* Center: Quest panel */}
        <div className="lg:col-span-5">
          <QuestPanel />
        </div>

        {/* Right: Week map */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-4">
            <WeekMap />
          </div>
        </div>
      </main>
    </div>
  )
}
