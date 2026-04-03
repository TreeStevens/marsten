import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [characters, setCharacters] = useState([])
  const [sessions, setSessions] = useState([])
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [selectedChar, setSelectedChar] = useState('')
  const [gmChar, setGmChar] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { fetchData() }, [user])

  async function fetchData() {
    setLoading(true)
    const [{ data: chars }, { data: sess }] = await Promise.all([
      supabase.from('characters').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('sessions')
        .select('*, games(name), session_players(character_id, characters(name, user_id))')
        .in('status', ['lobby', 'active'])
        .order('created_at', { ascending: false })
        .limit(10),
    ])
    setCharacters(chars || [])
    setSessions(sess || [])
    setLoading(false)
  }

  async function createSession() {
    if (!sessionName.trim() || !gmChar) { setError('Pick a session name and character.'); return }
    setError('')
    setCreating(true)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data: game } = await supabase.from('games').select('id').eq('slug', 'marsten-horror').single()
    const { data: sess, error: err } = await supabase.from('sessions').insert({
      game_id: game.id, gm_user_id: user.id, name: sessionName.trim(), session_code: code, status: 'lobby'
    }).select().single()
    if (err) { setError(err.message); setCreating(false); return }
    await supabase.from('session_players').insert({
      session_id: sess.id, character_id: gmChar, user_id: user.id, current_hp: 3, current_wp: 3
    })
    navigate('/lobby/' + sess.id)
  }

  async function joinSession() {
    if (!joinCode.trim() || !selectedChar) { setError('Enter a session code and pick your character.'); return }
    setError('')
    const { data: sess } = await supabase.from('sessions').select('*').eq('session_code', joinCode.toUpperCase()).single()
    if (!sess) { setError('Session not found. Check the code.'); return }
    if (sess.status === 'completed') { setError('That session has already ended.'); return }
    const { data: existing } = await supabase.from('session_players')
      .select('id').eq('session_id', sess.id).eq('user_id', user.id).single()
    if (!existing) {
      await supabase.from('session_players').insert({
        session_id: sess.id, character_id: selectedChar, user_id: user.id, current_hp: 3, current_wp: 3
      })
    }
    navigate('/lobby/' + sess.id)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-candle-400 animate-flicker">Loading your grimoire...</p>
    </div>
  )

  return (
    <div className="min-h-screen p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8 border-b border-manor-700 pb-4">
        <h1 className="text-3xl font-gothic text-candle-400">&#127770; Marsten Horror</h1>
        <div className="flex items-center gap-3">
          <span className="text-bone-400 text-sm hidden sm:block">{user.email}</span>
          <button onClick={signOut} className="btn-ghost text-sm py-1 px-3">Leave</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-gothic text-bone-100">Your Characters</h2>
            <Link to="/characters/new" className="btn-primary text-sm py-1 px-3">+ New</Link>
          </div>
          {characters.length === 0 ? (
            <p className="text-bone-400 text-sm text-center py-4">No adventurers yet. Create one!</p>
          ) : (
            <div className="space-y-2">
              {characters.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-manor-800 rounded p-3">
                  <div>
                    <span className="font-bold text-bone-100">{c.name}</span>
                    <span className="text-bone-400 text-xs ml-2">HP {c.max_hp} | WP {c.max_wp} | {c.total_games_played} games</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-gothic text-bone-100 mb-4">Active Sessions</h2>
          {sessions.length === 0 ? (
            <p className="text-bone-400 text-sm text-center py-4">No active sessions found.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <button key={s.id}
                  onClick={() => navigate(s.status === 'lobby' ? '/lobby/' + s.id : '/game/' + s.id)}
                  className="w-full text-left bg-manor-800 hover:bg-manor-700 rounded p-3 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-bone-100">{s.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${s.status === 'active' ? 'bg-blood-700 text-white' : 'bg-manor-600 text-bone-300'}`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-bone-400 text-xs mt-0.5">Code: {s.session_code}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-gothic text-bone-100 mb-4">Create Session (GM)</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Session Name</label>
              <input className="input" placeholder="e.g. Friday Night Horror" value={sessionName}
                onChange={e => setSessionName(e.target.value)} />
            </div>
            <div>
              <label className="label">Your Character</label>
              <select className="input" value={gmChar} onChange={e => setGmChar(e.target.value)}>
                <option value="">-- pick character --</option>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {error && <p className="text-blood-400 text-sm">{error}</p>}
            <button onClick={createSession} className="btn-primary w-full" disabled={creating || characters.length === 0}>
              {creating ? 'Opening the mansion...' : 'Create Session'}
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-gothic text-bone-100 mb-4">Join Session</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Session Code</label>
              <input className="input" placeholder="e.g. A1B2C3" value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} />
            </div>
            <div>
              <label className="label">Your Character</label>
              <select className="input" value={selectedChar} onChange={e => setSelectedChar(e.target.value)}>
                <option value="">-- pick character --</option>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button onClick={joinSession} className="btn-ghost w-full" disabled={characters.length === 0}>
              Enter the Mansion
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
