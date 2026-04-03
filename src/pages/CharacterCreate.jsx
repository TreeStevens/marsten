import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const AVATARS = [
  { id: 'skull',   emoji: '&#128128;', label: 'The Undead' },
  { id: 'knight',  emoji: '&#9876;',  label: 'The Knight' },
  { id: 'witch',   emoji: '&#129497;', label: 'The Witch' },
  { id: 'ghost',   emoji: '&#128123;', label: 'The Ghost' },
  { id: 'wolf',    emoji: '&#128058;', label: 'The Wolf' },
  { id: 'vampire', emoji: '&#129415;', label: 'The Vampire' },
]

export default function CharacterCreate() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [name, setName]       = useState('')
  const [avatar, setAvatar]   = useState('skull')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Your adventurer needs a name.'); return }
    setError('')
    setLoading(true)
    const { error: err } = await supabase.from('characters').insert({
      user_id: user.id,
      name: name.trim(),
      avatar,
      max_hp: 3,
      max_wp: 3,
      total_games_played: 0,
    })
    if (err) { setError(err.message); setLoading(false) }
    else     { navigate('/dashboard') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-gothic text-candle-400">Create Your Adventurer</h1>
          <p className="text-bone-400 text-sm mt-1">This character will follow you across all games</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Adventurer Name</label>
              <input className="input" placeholder="Enter a name..." value={name}
                onChange={e => setName(e.target.value)} maxLength={30} required />
            </div>

            <div>
              <label className="label">Choose Your Look</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {AVATARS.map(a => (
                  <button key={a.id} type="button"
                    onClick={() => setAvatar(a.id)}
                    className={`p-3 rounded border-2 text-center transition-all ${
                      avatar === a.id
                        ? 'border-candle-500 bg-manor-700'
                        : 'border-manor-600 hover:border-manor-500 bg-manor-800'
                    }`}>
                    <div className="text-3xl mb-1" dangerouslySetInnerHTML={{ __html: a.emoji }} />
                    <div className="text-xs text-bone-400">{a.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-manor-800 rounded p-3 text-sm text-bone-400">
              <p className="font-bold text-bone-300 mb-1">Starting Stats</p>
              <div className="flex gap-4">
                <span className="text-blood-400">&#10084; 3 Hit Points</span>
                <span className="text-blue-400">&#9679; 3 Will Points</span>
              </div>
              <p className="mt-1 text-xs">Stats can grow as you play more games.</p>
            </div>

            {error && <p className="text-blood-400 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-ghost flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={loading}>
                {loading ? 'Summoning...' : 'Create Adventurer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
