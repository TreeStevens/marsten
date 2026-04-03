import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-manor-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-gothic text-candle-400 animate-flicker mb-2">&#127770;</h1>
          <h1 className="text-4xl font-gothic text-bone-100 mb-1">Marsten Horror</h1>
          <p className="text-bone-400 text-sm">Enter if you dare</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-gothic text-candle-400 mb-6">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email}
                onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password}
                onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            {error && <p className="text-blood-400 text-sm">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Opening the gates...' : 'Enter the Mansion'}
            </button>
          </form>
          <p className="mt-4 text-center text-bone-400 text-sm">
            No account?{' '}
            <Link to="/register" className="text-candle-400 hover:text-candle-300 underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
