import { useState, useCallback } from 'react'
import RPGCanvas from '../components/RPGCanvas'
import QuestDialog from '../components/QuestDialog'
import GameHUD from '../components/GameHUD'
import { useAuth } from '../hooks/useAuth'

export default function GamePage() {
  const { signOut } = useAuth()
  const [openWeek, setOpenWeek] = useState(null)

  const handleOpenZone = useCallback((weekId) => {
    setOpenWeek(weekId)
  }, [])

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* RPG Map */}
      <RPGCanvas onOpenZone={handleOpenZone} />

      {/* HUD Overlay */}
      <GameHUD />

      {/* Logout button */}
      <button
        onClick={signOut}
        className="absolute top-3 right-3 z-20 text-gray-500 text-xs hover:text-gold bg-black/50 px-2 py-1 rounded"
      >
        Menu
      </button>

      {/* Quest Dialog */}
      {openWeek && (
        <QuestDialog weekId={openWeek} onClose={() => setOpenWeek(null)} />
      )}
    </div>
  )
}
