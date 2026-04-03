import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import GameLog from '../components/game/GameLog'
import PlayerList from '../components/game/PlayerList'
import EncounterPanel from '../components/game/EncounterPanel'
import Inventory from '../components/game/Inventory'
import GMControls from '../components/game/GMControls'

export default function Game() {
  const { sessionId } = useParams()
  const { user }      = useAuth()
  const navigate      = useNavigate()

  const [session, setSession]           = useState(null)
  const [players, setPlayers]           = useState([])
  const [logs, setLogs]                 = useState([])
  const [encounter, setEncounter]       = useState(null)
  const [myInventory, setMyInventory]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [tab, setTab]                   = useState('log') // 'log' | 'inventory' | 'gm'

  const isGM    = session?.gm_user_id === user?.id
  const myPlayer = players.find(p => p.user_id === user?.id)

  const fetchAll = useCallback(async () => {
    const [{ data: sess }, { data: pls }, { data: logData }, { data: enc }] = await Promise.all([
      supabase.from('sessions').select('*, games(name)').eq('id', sessionId).single(),
      supabase.from('session_players')
        .select('*, characters(name, avatar, max_hp, max_wp)')
        .eq('session_id', sessionId),
      supabase.from('game_log')
        .select('*').eq('session_id', sessionId)
        .order('created_at').limit(100),
      supabase.from('encounters')
        .select('*').eq('session_id', sessionId).eq('status', 'active')
        .order('started_at', { ascending: false }).limit(1),
    ])
    setSession(sess)
    setPlayers(pls || [])
    setLogs(logData || [])
    setEncounter(enc?.[0] || null)
    setLoading(false)
  }, [sessionId])

  const fetchInventory = useCallback(async () => {
    if (!myPlayer?.character_id) return
    const { data } = await supabase.from('character_inventory')
      .select('*, items(name, description, effect_type, effect_value)')
      .eq('character_id', myPlayer.character_id)
    setMyInventory(data || [])
  }, [myPlayer?.character_id])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  useEffect(() => {
    const channel = supabase.channel('game-' + sessionId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_log', filter: 'session_id=eq.' + sessionId },
        payload => setLogs(prev => [...prev, payload.new]))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_players', filter: 'session_id=eq.' + sessionId },
        fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'encounters', filter: 'session_id=eq.' + sessionId },
        fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'character_inventory' },
        fetchInventory)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [sessionId, fetchAll, fetchInventory])

  async function logMessage(content, logType = 'narration') {
    await supabase.from('game_log').insert({ session_id: sessionId, content, log_type: logType, created_by: user.id })
  }

  async function endSession() {
    if (!window.confirm('End this session for everyone?')) return
    // Give all characters experience / increment games_played
    for (const p of players) {
      await supabase.from('characters')
        .update({ total_games_played: (p.characters?.total_games_played || 0) + 1 })
        .eq('id', p.character_id)
    }
    await supabase.from('sessions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', sessionId)
    await logMessage('The session has ended. Well done, adventurers.', 'system')
    navigate('/dashboard')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-candle-400 animate-flicker">Entering the mansion...</p>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-manor-950">
      {/* Top Bar */}
      <header className="bg-manor-900 border-b border-manor-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-candle-400 font-gothic text-lg">&#127770; {session?.name}</span>
          <span className="text-xs text-manor-500 hidden sm:block">Code: {session?.session_code}</span>
        </div>
        <div className="flex items-center gap-2">
          {encounter && (
            <span className="text-xs bg-blood-800 text-blood-300 px-2 py-0.5 rounded animate-pulse">
              ENCOUNTER
            </span>
          )}
          {isGM && (
            <button onClick={endSession} className="btn-danger text-xs py-1 px-2">End Session</button>
          )}
          <button onClick={() => navigate('/dashboard')} className="btn-ghost text-xs py-1 px-2">
            &#8592; Leave
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 48px)' }}>
        {/* Left: Mobile Tab Bar + Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile tabs */}
          <div className="flex border-b border-manor-700 bg-manor-900 lg:hidden">
            {['log', 'inventory', ...(isGM ? ['gm'] : [])].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  tab === t ? 'text-candle-400 border-b-2 border-candle-500' : 'text-bone-500 hover:text-bone-300'
                }`}>
                {t === 'log' ? 'Game Log' : t === 'inventory' ? 'Inventory' : 'GM'}
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Center: Encounter + (desktop) log below */}
            <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
              {/* Encounter Panel */}
              <div className="card flex-shrink-0">
                <EncounterPanel
                  encounter={encounter}
                  sessionId={sessionId}
                  myPlayer={myPlayer}
                  isGM={isGM}
                  onLogMessage={logMessage}
                />
              </div>

              {/* Game Log — desktop only */}
              <div className="card flex-1 overflow-hidden hidden lg:flex flex-col">
                <GameLog logs={logs} />
              </div>

              {/* Mobile: active tab content */}
              <div className="card flex-1 overflow-hidden lg:hidden flex flex-col">
                {tab === 'log' && <GameLog logs={logs} />}
                {tab === 'inventory' && <Inventory items={myInventory} />}
                {tab === 'gm' && isGM && (
                  <div className="overflow-y-auto">
                    <GMControls
                      sessionId={sessionId}
                      players={players}
                      onLogMessage={logMessage}
                      currentEncounter={encounter}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar — desktop only */}
            <aside className="w-72 flex-shrink-0 border-l border-manor-700 overflow-y-auto p-3 space-y-4 hidden lg:block">
              <PlayerList players={players} currentUserId={user.id} gmUserId={session?.gm_user_id} />
              <div className="border-t border-manor-700 pt-3">
                <Inventory items={myInventory} />
              </div>
              {isGM && (
                <div className="border-t border-manor-700 pt-3">
                  <GMControls
                    sessionId={sessionId}
                    players={players}
                    onLogMessage={logMessage}
                    currentEncounter={encounter}
                  />
                </div>
              )}
            </aside>
          </div>
        </div>

        {/* Mobile: Player List always visible at bottom */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-manor-900 border-t border-manor-700 px-3 py-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {players.map(p => {
              const hpPct = (p.current_hp / (p.characters?.max_hp || 3)) * 100
              const wpPct = (p.current_wp / (p.characters?.max_wp || 3)) * 100
              return (
                <div key={p.id} className="flex-shrink-0 bg-manor-800 rounded p-1.5 w-28">
                  <div className="text-xs font-bold text-bone-200 truncate">{p.characters?.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-blood-400 text-xs">&#10084;</span>
                    <div className="flex-1 bg-manor-700 rounded h-1.5">
                      <div className="stat-bar-hp" style={{ width: hpPct + '%' }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-blue-400 text-xs">&#9679;</span>
                    <div className="flex-1 bg-manor-700 rounded h-1.5">
                      <div className="stat-bar-wp" style={{ width: wpPct + '%' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
