import { useState } from 'react'
import { useGameState } from '../hooks/useGameState'

export default function QuestDialog({ weekId, onClose }) {
  const { weeks, questProgress, reflections, weekProgress, toggleQuest, saveReflection } = useGameState()
  const [tab, setTab] = useState('quests')
  const week = weeks.find(w => w.id === weekId)
  const wp = weekProgress[weekId]

  if (!week || !wp?.unlocked) return null

  const completedCount = week.quests.filter(q => questProgress[q.id]).length
  const allDone = completedCount === week.quests.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative bg-[#12121a] border-2 border-gold rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gold/30">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gold text-xs font-bold tracking-widest">SEMAINE {week.id}</span>
              {allDone && <span className="ml-2 text-xs bg-gold/20 text-gold px-2 py-0.5 rounded">COMPLETE</span>}
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gold text-xl leading-none">&times;</button>
          </div>
          <h2 className="text-white font-bold text-lg mt-1">{week.title}</h2>
          <p className="text-gray-400 text-sm">{week.description}</p>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{completedCount}/{week.quests.length} quetes</span>
              <span>+{week.xpTotal} XP</span>
            </div>
            <div className="w-full bg-[#1e1e2a] rounded-full h-2">
              <div className="bg-gold h-full rounded-full transition-all" style={{ width: `${(completedCount / week.quests.length) * 100}%` }} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-3">
            <button
              onClick={() => setTab('quests')}
              className={`text-sm font-bold pb-1 border-b-2 transition-colors ${tab === 'quests' ? 'text-gold border-gold' : 'text-gray-500 border-transparent'}`}
            >
              Quetes
            </button>
            <button
              onClick={() => setTab('reflections')}
              className={`text-sm font-bold pb-1 border-b-2 transition-colors ${tab === 'reflections' ? 'text-gold border-gold' : 'text-gray-500 border-transparent'}`}
            >
              Reflexions
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === 'quests' && week.quests.map(quest => {
            const done = questProgress[quest.id] || false
            return (
              <button
                key={quest.id}
                onClick={() => toggleQuest(quest.id, week.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${done ? 'border-gold/30 bg-gold/5' : 'border-[#1e1e2a] hover:border-gold/20'}`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${done ? 'border-gold bg-gold' : 'border-gray-600'}`}>
                  {done && <span className="text-[#0a0a0f] text-xs font-bold">&#10003;</span>}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${done ? 'text-gold/60 line-through' : 'text-white'}`}>{quest.text}</p>
                  <p className="text-xs text-gold/40 mt-1">+{quest.xp} XP</p>
                </div>
              </button>
            )
          })}

          {tab === 'reflections' && week.reflections.map(refl => (
            <ReflInput key={refl.id} refl={refl} weekId={weekId} saved={reflections[refl.id] || ''} onSave={saveReflection} />
          ))}
        </div>

        {/* Stats reward */}
        {allDone && (
          <div className="p-4 border-t border-gold/20 bg-gold/5">
            <p className="text-gold text-xs font-bold mb-1">STATS GAGNEES</p>
            <div className="flex gap-3 text-xs">
              {Object.entries(week.statsReward).filter(([, v]) => v > 0).map(([k, v]) => (
                <span key={k} className="text-gold/80">+{v} {k}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ReflInput({ refl, weekId, saved, onSave }) {
  const [val, setVal] = useState(saved)
  const [dirty, setDirty] = useState(false)

  return (
    <div>
      <p className="text-gray-300 text-sm mb-2">{refl.question}</p>
      <textarea
        value={val}
        onChange={e => { setVal(e.target.value); setDirty(true) }}
        onBlur={() => { if (dirty) { onSave(refl.id, weekId, val); setDirty(false) } }}
        rows={3}
        className="w-full bg-[#0a0a0f] border border-[#1e1e2a] rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:border-gold/50 focus:outline-none resize-y"
        placeholder="Ecris ta reflexion..."
      />
    </div>
  )
}
