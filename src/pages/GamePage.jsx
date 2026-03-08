import RPGCanvas from '../components/RPGCanvas'
import { useAuth } from '../hooks/useAuth'

export default function GamePage() {
  const { signOut } = useAuth()

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <RPGCanvas />
      <button
        onClick={signOut}
        className="absolute top-3 right-3 z-20 text-gray-500 text-xs hover:text-[#c7b777] bg-black/50 px-2 py-1 rounded"
      >
        Menu
      </button>
    </div>
  )
}
