import { useState } from 'react'
import { useGameState } from '../hooks/useGameState'

export default function QuestPanel() {
  const { weeks, currentWeek, weekProgress, questProgress, reflections, toggleQuest, saveReflection } = useGameState()
  const week = weeks.find(w => w.id === currentWeek)
  const wp = weekProgress[currentWeek]

  if (!week || !wp?.unlocked) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center">
        <p className="text-gray-500">Selectionne une semaine debloquee pour voir les quetes.</p>
      </div>
    )
  }

  const completedCount = week.quests.filter(q => questProgress[q.id]).length

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-gold text-xs font-bold tracking-widest">SEMAINE {week.id}</span>
          {wp.completed && <span className="text-gold text-xs bg-gold/10 px-2 py-0.5 rounded">COMPLETEE</span>}
        </div>
        <h2 className="text-white font-bold text-xl">{week.title}</h2>
        <p className="text-gray-400 text-sm mt-1">{week.description}</p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{completedCount}/{week.quests.length} quetes</span>
          <span>{week.xpTotal} XP</span>
        </div>
        <div className="w-full bg-dark-border rounded-full h-2 overflow-hidden">
          <div
            className="bg-gold h-full rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / week.quests.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Quests */}
      <div className="space-y-3">
        <h3 className="text-gold text-sm font-bold tracking-wider">QUETES</h3>
        {week.quests.map(quest => {
          const done = questProgress[quest.id] || false
          return (
            <button
              key={quest.id}
              onClick={() => toggleQuest(quest.id, week.id)}
              className={`
                w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all
                ${done
                  ? 'border-gold/30 bg-gold/5'
                  : 'border-dark-border hover:border-gold/20'
                }
              `}
            >
              <div className={`
                mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                ${done ? 'border-gold bg-gold' : 'border-gray-600'}
              `}>
                {done && <span className="text-dark text-xs font-bold">&#10003;</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${done ? 'text-gold-light line-through opacity-70' : 'text-white'}`}>
                  {quest.text}
                </p>
                <p className="text-xs text-gold/50 mt-1">+{quest.xp} XP</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Stats reward */}
      {wp.completed && (
        <div className="border border-gold/20 rounded-lg p-4 bg-gold/5">
          <p className="text-gold text-xs font-bold mb-2 tracking-wider">STATS GAGNEES</p>
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(week.statsReward).filter(([, v]) => v > 0).map(([key, val]) => (
              <span key={key} className="text-gold-light">+{val} {key}</span>
            ))}
          </div>
        </div>
      )}

      {/* Reflections */}
      <div className="space-y-4">
        <h3 className="text-gold text-sm font-bold tracking-wider">REFLEXIONS</h3>
        {week.reflections.map(refl => (
          <ReflectionInput
            key={refl.id}
            reflection={refl}
            weekId={week.id}
            saved={reflections[refl.id] || ''}
            onSave={saveReflection}
          />
        ))}
      </div>
    </div>
  )
}

function ReflectionInput({ reflection, weekId, saved, onSave }) {
  const [value, setValue] = useState(saved)
  const [dirty, setDirty] = useState(false)

  const handleChange = (e) => {
    setValue(e.target.value)
    setDirty(true)
  }

  const handleBlur = () => {
    if (dirty && value !== saved) {
      onSave(reflection.id, weekId, value)
      setDirty(false)
    }
  }

  return (
    <div>
      <p className="text-gray-300 text-sm mb-2">{reflection.question}</p>
      <textarea
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        rows={4}
        className="w-full bg-dark border border-dark-border rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:border-gold/50 focus:outline-none resize-y"
        placeholder="Ecris ta reflexion ici..."
      />
    </div>
  )
}
