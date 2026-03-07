import { useGameState } from '../hooks/useGameState'
import HeroSilhouette from './HeroSilhouette'

const TOTAL_XP_MAX = 5500

const statLabels = {
  clarte: 'Clarte',
  courage: 'Courage',
  terrain: 'Terrain',
  structure: 'Structure',
}

export default function HeroPanel() {
  const { totalXp, avatarStage, stats } = useGameState()
  const xpPercent = Math.min((totalXp / TOTAL_XP_MAX) * 100, 100)

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col items-center gap-4">
      <h2 className="text-gold font-bold text-lg tracking-wide">VENDEUR D'EXCEPTION</h2>

      <HeroSilhouette stage={avatarStage} />

      <div className="text-center">
        <p className="text-gold-light text-sm">Niveau {avatarStage}</p>
        <p className="text-white font-bold text-xl">{totalXp} XP</p>
      </div>

      {/* XP Bar */}
      <div className="w-full bg-dark-border rounded-full h-3 overflow-hidden">
        <div
          className="bg-gold h-full rounded-full transition-all duration-500"
          style={{ width: `${xpPercent}%` }}
        />
      </div>

      {/* Stats */}
      <div className="w-full space-y-3 mt-2">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">{statLabels[key]}</span>
              <span className="text-gold">{value}</span>
            </div>
            <div className="w-full bg-dark-border rounded-full h-2 overflow-hidden">
              <div
                className="bg-gold/60 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min((value / 150) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
