import { AuthProvider, useAuth } from './hooks/useAuth'
import { GameProvider } from './hooks/useGameState'
import AuthPage from './pages/AuthPage'
import GamePage from './pages/GamePage'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-gold animate-pulse text-lg">Chargement...</p>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <GameProvider userId={user.id}>
      <GamePage />
    </GameProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
