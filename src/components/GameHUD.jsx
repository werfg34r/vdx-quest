import { useGameState } from '../hooks/useGameState'

const statIcons = {
  clarte: '\u2728',
  courage: '\u2694',
  terrain: '\u{1F30D}',
  structure: '\u{1F3D7}',
}

export default function GameHUD() {
  const { totalXp, avatarStage, stats, currentWeek } = useGameState()

  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
      <div className="flex items-start justify-between p-3 gap-3">
        {/* Left: Player info */}
        <div className="bg-black/70 border border-gold/40 rounded-lg px-3 py-2 pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="text-gold font-bold text-sm">VDX N0</div>
            <div className="text-gold/60 text-xs">Niv. {avatarStage}</div>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="w-24 bg-[#1e1e2a] rounded-full h-2">
              <div className="bg-gold h-full rounded-full transition-all" style={{ width: `${Math.min((totalXp / 5500) * 100, 100)}%` }} />
            </div>
            <span className="text-gold text-xs font-bold">{totalXp} XP</span>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="bg-black/70 border border-gold/40 rounded-lg px-3 py-2 pointer-events-auto">
          <div className="flex gap-3">
            {Object.entries(stats).map(([key, val]) => (
              <div key={key} className="text-center">
                <div className="text-xs">{statIcons[key]}</div>
                <div className="text-gold text-xs font-bold">{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
