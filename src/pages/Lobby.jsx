import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Lobby() {
  const { sessionId } = useParams()
  const { user }      = useAuth()
  const navigate      = useNavigate()
  const [session, setSession]   = useState(null)
  const [players, setPlayers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [starting, setStarting] = useState(false)

  const isGM = session?.gm_user_id === user?.id

  useEffect(() => {
    fetchSession()

    const channel = supabase.channel('lobby-' + sessionId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_players', filter: 'session_id=eq.' + sessionId }, fetchSession)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: 'id=eq.' + sessionId }, payload => {
        if (payload.new.status === 'active') navigate('/game/' + sessionId)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [sessionId])

  async function fetchSession() {
    const [{ data: sess }, { data: pls }] = await Promise.all([
      supabase.from('sessions').select('*, games(name)').eq('id', sessionId).single(),
      supabase.from('session_players')
        .select('*, characters(name, avatar, max_hp, max_wp)')
        .eq('session_id', sessionId),
    ])
    setSession(sess)
    setPlayers(pls || [])
    setLoading(false)
    if (sess?.status === 'active') navigate('/game/' + sessionId)
  }

  async function startGame() {
    setStarting(true)
    await supabase.from('sessions').update({ status: 'active' }).eq('id', sessionId)
    await supabase.from('game_log').insert({
      session_id: sessionId,
      content: 'The doors of the mansion creak open. Your adventure begins...',
      log_type: 'system',
    })
    navigate('/game/' + sessionId)
  }

  async function leaveSession() {
    await supabase.from('session_players').delete().eq('session_id', sessionId).eq('user_id', user.id)
    navigate('/dashboard')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-candle-400 animate-flicker">Gathering adventurers...</p>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-gothic text-candle-400 mb-1">{session?.name}</h1>
          <p className="text-bone-400">{session?.games?.name}</p>
        </div>

        <div className="card mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-bone-300 font-bold text-sm uppercase tracking-wider">Session Code</h2>
          </div>
          <div className="text-3xl font-gothic text-candle-400 tracking-widest text-center py-2">
            {session?.session_code}
          </div>
          <p className="text-bone-400 text-xs text-center">Share this with your friends</p>
        </div>

        <div className="card mb-4">
          <h2 className="text-bone-300 font-bold text-sm uppercase tracking-wider mb-3">
            Players ({players.length})
          </h2>
          <div className="space-y-2">
            {players.map(p => (
              <div key={p.id} className="flex items-center gap-3 bg-manor-800 rounded p-2">
                <div className="text-2xl w-8 text-center">
                  {p.characters?.avatar === 'skull'   ? '&#128128;' :
                   p.characters?.avatar === 'knight'  ? '&#9876;'   :
                   p.characters?.avatar === 'witch'   ? '&#129497;' :
                   p.characters?.avatar === 'ghost'   ? '&#128123;' :
                   p.characters?.avatar === 'wolf'    ? '&#128058;' :
                   p.characters?.avatar === 'vampire' ? '&#129415;' : '&#128100;'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-bone-100 font-bold">{p.characters?.name}</span>
                    {p.user_id === session?.gm_user_id && (
                      <span className="text-xs bg-candle-700 text-candle-100 px-1.5 py-0.5 rounded">GM</span>
                    )}
                  </div>
                  <div className="text-xs text-bone-400">
                    HP {p.characters?.max_hp} | WP {p.characters?.max_wp}
                  </div>
                </div>
                <div className="text-green-400 text-xs">Ready</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={leaveSession} className="btn-ghost flex-1">Leave</button>
          {isGM && (
            <button onClick={startGame} className="btn-primary flex-1" disabled={starting || players.length < 1}>
              {starting ? 'Opening doors...' : 'Start Game'}
            </button>
          )}
          {!isGM && (
            <div className="flex-1 text-center text-bone-400 text-sm py-2">
              Waiting for GM to start...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
