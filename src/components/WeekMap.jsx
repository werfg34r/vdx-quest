import { useGameState } from '../hooks/useGameState'

const monthNames = ['MOIS 1 — SORTIE DU FLOU', 'MOIS 2 — CONFRONTATION AU REEL', 'MOIS 3 — STRUCTURATION']

export default function WeekMap() {
  const { weeks, weekProgress, currentWeek, selectWeek } = useGameState()

  const months = [1, 2, 3]

  return (
    <div className="space-y-6">
      {months.map(month => (
        <div key={month}>
          <h3 className="text-gold font-bold text-sm tracking-widest mb-3 uppercase">
            {monthNames[month - 1]}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {weeks.filter(w => w.month === month).map(week => {
              const wp = weekProgress[week.id]
              const unlocked = wp?.unlocked || false
              const completed = wp?.completed || false
              const isActive = week.id === currentWeek

              return (
                <button
                  key={week.id}
                  onClick={() => unlocked && selectWeek(week.id)}
                  disabled={!unlocked}
                  className={`
                    relative p-4 rounded-lg border text-left transition-all duration-200
                    ${isActive
                      ? 'border-gold bg-gold/10 shadow-lg shadow-gold/10'
                      : completed
                        ? 'border-gold/40 bg-dark-card'
                        : unlocked
                          ? 'border-dark-border bg-dark-card hover:border-gold/30 cursor-pointer'
                          : 'border-dark-border/50 bg-dark-card/50 opacity-40 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">S{week.id}</span>
                    {completed && <span className="text-gold text-xs">&#10003;</span>}
                    {!unlocked && <span className="text-gray-600 text-xs">&#128274;</span>}
                  </div>
                  <p className={`text-xs font-medium leading-tight ${unlocked ? 'text-white' : 'text-gray-600'}`}>
                    {week.title}
                  </p>
                  <p className="text-xs text-gold/60 mt-1">{week.xpTotal} XP</p>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
