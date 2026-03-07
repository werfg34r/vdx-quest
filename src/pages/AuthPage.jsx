import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const { error: err } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password)

    setLoading(false)

    if (err) {
      setError(err.message)
    } else if (isSignUp) {
      setSuccess('Compte cree ! Verifie ton email pour confirmer.')
    }
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-gold font-bold text-3xl tracking-wider">VDX QUEST</h1>
          <p className="text-gray-500 text-sm mt-2">Vendeur d'Exception - Niveau 0</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-4">
          <h2 className="text-white font-bold text-lg">
            {isSignUp ? 'Creer un compte' : 'Se connecter'}
          </h2>

          {error && <p className="text-red-400 text-sm bg-red-400/10 p-2 rounded">{error}</p>}
          {success && <p className="text-green-400 text-sm bg-green-400/10 p-2 rounded">{success}</p>}

          <div>
            <label className="text-gray-400 text-sm block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:border-gold/50 focus:outline-none"
              placeholder="ton@email.com"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:border-gold/50 focus:outline-none"
              placeholder="6 caracteres minimum"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-dark font-bold py-2.5 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {loading ? '...' : isSignUp ? 'Creer mon compte' : 'Entrer'}
          </button>

          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess('') }}
            className="w-full text-gold/60 text-sm hover:text-gold transition-colors"
          >
            {isSignUp ? 'Deja un compte ? Se connecter' : 'Pas de compte ? En creer un'}
          </button>
        </form>
      </div>
    </div>
  )
}
