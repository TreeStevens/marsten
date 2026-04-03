import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const { signUp }  = useAuth()
  const navigate    = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const { error } = await signUp(email, password)
    if (error) { setError(error.message); setLoading(false) }
    else        { setDone(true) }
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center">
        <div className="text-4xl mb-4">&#128140;</div>
        <h2 className="text-2xl font-gothic text-candle-400 mb-2">Check your email</h2>
        <p className="text-bone-400 mb-4">
          A confirmation link has been sent to <strong className="text-bone-200">{email}</strong>.
          Click it to activate your account, then{' '}
          <Link to="/login" className="text-candle-400 underline">sign in</Link>.
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-gothic text-candle-400 animate-flicker mb-2">&#127770;</h1>
          <h1 className="text-4xl font-gothic text-bone-100 mb-1">Marsten Horror</h1>
          <p className="text-bone-400 text-sm">Join the brave adventurers</p>
        </div>
        <div className="card">
          <h2 className="text-xl font-gothic text-candle-400 mb-6">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email}
                onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password}
                onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input className="input" type="password" value={confirm}
                onChange={e => setConfirm(e.target.value)} required placeholder="••••••••" />
            </div>
            {error && <p className="text-blood-400 text-sm">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Preparing your fate...' : 'Join the Adventure'}
            </button>
          </form>
          <p className="mt-4 text-center text-bone-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-candle-400 hover:text-candle-300 underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
