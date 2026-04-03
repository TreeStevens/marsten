import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const ENCOUNTER_TYPES = ['fight', 'seduce', 'friendly']

export default function GMControls({ sessionId, players, onLogMessage, currentEncounter }) {
  const [narration, setNarration]     = useState('')
  const [enemyName, setEnemyName]     = useState('')
  const [encounterType, setEncounterType] = useState('fight')
  const [healTarget, setHealTarget]   = useState('')
  const [healType, setHealType]       = useState('hp')
  const [rolling, setRolling]         = useState(false)
  const [lootName, setLootName]       = useState('')
  const [lootTarget, setLootTarget]   = useState('')

  async function sendNarration() {
    if (!narration.trim()) return
    await supabase.from('game_log').insert({ session_id: sessionId, content: narration.trim(), log_type: 'gm' })
    setNarration('')
  }

  async function rollEncounter() {
    setRolling(true)
    const roll = Math.ceil(Math.random() * 100)
    const { data: entry } = await supabase.from('encounter_table')
      .select('*')
      .lte('roll_min', roll)
      .gte('roll_max', roll)
      .single()

    if (entry) {
      const isFriendly = entry.is_friendly
      const type = isFriendly ? 'friendly' : encounterType

      if (isFriendly) {
        onLogMessage('You encounter ' + entry.enemy_name + '! They seem friendly...', 'system')
      } else {
        await supabase.from('encounters').insert({
          session_id: sessionId,
          enemy_type: entry.enemy_type,
          enemy_name: entry.enemy_name,
          enemy_current_hp: 3,
          enemy_current_wp: 3,
          encounter_type: type,
          status: 'active',
        })
        onLogMessage('A ' + entry.enemy_name + ' appears! (rolled ' + roll + ')', 'combat')
      }

      if (isFriendly && entry.heal_type) {
        for (const p of players) {
          if (entry.heal_type === 'full') {
            await supabase.from('session_players').update({
              current_hp: p.characters?.max_hp, current_wp: p.characters?.max_wp, status: 'active'
            }).eq('id', p.id)
          } else if (entry.heal_type === 'hp') {
            await supabase.from('session_players').update({
              current_hp: Math.min(p.characters?.max_hp, p.current_hp + 3), status: 'active'
            }).eq('id', p.id)
          } else if (entry.heal_type === 'wp') {
            await supabase.from('session_players').update({
              current_wp: Math.min(p.characters?.max_wp, p.current_wp + 3), status: 'active'
            }).eq('id', p.id)
          }
        }
        onLogMessage(entry.enemy_name + ' heals the party!', 'heal')
      }
    }
    setRolling(false)
  }

  async function triggerManualEncounter() {
    if (!enemyName.trim()) return
    await supabase.from('encounters').insert({
      session_id: sessionId,
      enemy_type: 'custom',
      enemy_name: enemyName.trim(),
      enemy_current_hp: 3,
      enemy_current_wp: 3,
      encounter_type: encounterType,
      status: 'active',
    })
    onLogMessage('A ' + enemyName.trim() + ' appears!', 'combat')
    setEnemyName('')
  }

  async function healPlayer() {
    if (!healTarget) return
    const player = players.find(p => p.id === healTarget)
    if (!player) return
    const update = healType === 'hp'
      ? { current_hp: player.characters?.max_hp, status: 'active' }
      : healType === 'wp'
      ? { current_wp: player.characters?.max_wp, status: 'active' }
      : { current_hp: player.characters?.max_hp, current_wp: player.characters?.max_wp, status: 'active' }

    await supabase.from('session_players').update(update).eq('id', healTarget)
    onLogMessage(player.characters?.name + ' has been healed!', 'heal')
  }

  async function endEncounter() {
    if (!currentEncounter) return
    await supabase.from('encounters').update({ status: 'fled', ended_at: new Date().toISOString() }).eq('id', currentEncounter.id)
    onLogMessage('The encounter has ended.', 'system')
  }

  async function giveLoot() {
    if (!lootTarget || !lootName.trim()) return
    const player = players.find(p => p.id === lootTarget)
    // find or create item
    let { data: item } = await supabase.from('items').select('id,name').eq('name', lootName.trim()).single()
    if (!item) {
      const { data: newItem } = await supabase.from('items').insert({ name: lootName.trim(), description: 'A mysterious item.' }).select().single()
      item = newItem
    }
    await supabase.from('character_inventory').insert({
      character_id: player.character_id,
      item_id: item.id,
      acquired_in_session: sessionId,
    })
    onLogMessage(player?.characters?.name + ' received: ' + item.name + '!', 'loot')
    setLootName('')
  }

  return (
    <div className="space-y-4">
      <div className="border border-candle-800 rounded-lg p-3 bg-manor-900">
        <h3 className="text-candle-400 text-xs font-bold uppercase tracking-wider mb-2">GM Controls</h3>

        {/* Narration */}
        <div className="mb-3">
          <label className="label text-xs">Narrate / Describe</label>
          <div className="flex gap-2">
            <textarea className="input text-sm resize-none" rows={2} value={narration}
              onChange={e => setNarration(e.target.value)}
              placeholder="Describe the room, set the scene..." />
          </div>
          <button onClick={sendNarration} className="btn-ghost w-full mt-1 text-xs py-1">
            Send to Log
          </button>
        </div>

        {/* Random Encounter */}
        <div className="mb-3">
          <label className="label text-xs">Random Encounter (d100)</label>
          <div className="flex gap-2 mb-1">
            <select className="input text-sm" value={encounterType} onChange={e => setEncounterType(e.target.value)}>
              {ENCOUNTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={rollEncounter} className="btn-danger w-full text-xs py-1" disabled={rolling}>
            {rolling ? 'Rolling...' : '&#127922; Roll Random Encounter'}
          </button>
        </div>

        {/* Manual Encounter */}
        <div className="mb-3">
          <label className="label text-xs">Trigger Specific Enemy</label>
          <div className="flex gap-2">
            <input className="input text-sm" placeholder="Enemy name..." value={enemyName}
              onChange={e => setEnemyName(e.target.value)} />
          </div>
          <button onClick={triggerManualEncounter} className="btn-danger w-full mt-1 text-xs py-1">
            &#9876; Start Encounter
          </button>
        </div>

        {/* End Encounter */}
        {currentEncounter && currentEncounter.status === 'active' && (
          <div className="mb-3">
            <button onClick={endEncounter} className="btn-ghost w-full text-xs py-1">
              End Current Encounter
            </button>
          </div>
        )}

        {/* Heal Player */}
        <div className="mb-3">
          <label className="label text-xs">Heal Player</label>
          <select className="input text-sm mb-1" value={healTarget} onChange={e => setHealTarget(e.target.value)}>
            <option value="">-- pick player --</option>
            {players.map(p => <option key={p.id} value={p.id}>{p.characters?.name}</option>)}
          </select>
          <select className="input text-sm mb-1" value={healType} onChange={e => setHealType(e.target.value)}>
            <option value="hp">Heal HP</option>
            <option value="wp">Heal WP</option>
            <option value="full">Full Heal</option>
          </select>
          <button onClick={healPlayer} className="btn-ghost w-full text-xs py-1">&#10084; Heal</button>
        </div>

        {/* Give Loot */}
        <div>
          <label className="label text-xs">Give Loot</label>
          <select className="input text-sm mb-1" value={lootTarget} onChange={e => setLootTarget(e.target.value)}>
            <option value="">-- pick player --</option>
            {players.map(p => <option key={p.id} value={p.id}>{p.characters?.name}</option>)}
          </select>
          <input className="input text-sm mb-1" placeholder="Item name..." value={lootName}
            onChange={e => setLootName(e.target.value)} />
          <button onClick={giveLoot} className="btn-ghost w-full text-xs py-1">&#9670; Give Item</button>
        </div>
      </div>
    </div>
  )
}
