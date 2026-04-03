import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import DiceRoller from './DiceRoller'

export default function EncounterPanel({ encounter, sessionId, myPlayer, isGM, onLogMessage }) {
  const [phase, setPhase]       = useState('idle') // idle | player_roll | monster_roll | result
  const [playerRoll, setPlayerRoll] = useState(null)
  const [monsterRoll, setMonsterRoll] = useState(null)
  const [roundResult, setRoundResult] = useState(null)

  if (!encounter) return (
    <div className="text-center py-8">
      <div className="text-5xl mb-3">&#127968;</div>
      <p className="text-bone-400 italic">The room is quiet... for now.</p>
    </div>
  )

  const hpPct = (encounter.enemy_current_hp / 3) * 100
  const wpPct = (encounter.enemy_current_wp / 3) * 100
  const isFriendly = encounter.encounter_type === 'friendly'

  async function handlePlayerRoll(roll) {
    setPlayerRoll(roll)
    setPhase('monster_roll')
    onLogMessage(`${myPlayer?.characters?.name} rolls a ${roll}!`, 'combat')
  }

  async function handleMonsterRoll(roll) {
    setMonsterRoll(roll)
    const attackType = encounter.encounter_type
    const playerWins = playerRoll > roll || (playerRoll === roll && attackType === 'fight')
    const seduceWin  = playerRoll === roll && attackType === 'seduce'

    let resultText = ''
    let resultType = 'combat'

    if (seduceWin || playerWins) {
      resultText = playerWins
        ? `${myPlayer?.characters?.name} wins the round! (${playerRoll} vs ${roll})`
        : `Tie goes to the seducer! ${myPlayer?.characters?.name} wins! (${playerRoll} vs ${roll})`

      // Update monster HP or WP
      const field = attackType === 'fight' ? 'enemy_current_hp' : 'enemy_current_wp'
      const newVal = Math.max(0, encounter[field] - 1)
      await supabase.from('encounters').update({ [field]: newVal }).eq('id', encounter.id)

      if (newVal <= 0) {
        await supabase.from('encounters').update({ status: attackType === 'fight' ? 'defeated' : 'seduced' }).eq('id', encounter.id)
        resultText += ` ${encounter.enemy_name} has been ${attackType === 'fight' ? 'defeated' : 'seduced'}!`
        resultType = 'loot'
      }
    } else {
      resultText = `${encounter.enemy_name} wins the round! (${roll} vs ${playerRoll})`
      // Player loses HP or WP
      const field = attackType === 'fight' ? 'current_hp' : 'current_wp'
      const newVal = Math.max(0, myPlayer[field] - 1)
      await supabase.from('session_players').update({ [field]: newVal }).eq('id', myPlayer.id)
      if (newVal <= 0) {
        const statusField = attackType === 'fight' ? 'knocked_out' : 'seduced'
        await supabase.from('session_players').update({ status: statusField }).eq('id', myPlayer.id)
        resultText += ` ${myPlayer?.characters?.name} has been ${statusField.replace('_', ' ')}!`
      }
    }

    await supabase.from('combat_rounds').insert({
      encounter_id: encounter.id,
      session_player_id: myPlayer.id,
      attacker_roll: playerRoll,
      defender_roll: roll,
      round_type: attackType,
      attacker_wins: playerWins || seduceWin,
    })

    onLogMessage(resultText, resultType)
    setRoundResult(playerWins || seduceWin ? 'win' : 'lose')
    setPhase('result')
  }

  function resetRound() {
    setPlayerRoll(null)
    setMonsterRoll(null)
    setRoundResult(null)
    setPhase('idle')
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-gothic text-blood-400 animate-pulse-slow">{encounter.enemy_name}</h2>
        <span className={`text-xs px-2 py-0.5 rounded ${
          encounter.encounter_type === 'fight'   ? 'bg-blood-800 text-blood-300' :
          encounter.encounter_type === 'seduce'  ? 'bg-pink-900 text-pink-300' :
          'bg-green-900 text-green-300'
        }`}>
          {encounter.encounter_type === 'fight' ? '&#9876; Fight' :
           encounter.encounter_type === 'seduce' ? '&#128148; Seduce' : '&#128512; Friendly'}
        </span>
      </div>

      {!isFriendly && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-blood-400 text-xs w-5">&#10084;</span>
            <div className="flex-1 bg-manor-700 rounded h-3">
              <div className="stat-bar-hp" style={{ width: hpPct + '%' }} />
            </div>
            <span className="text-xs text-bone-400">{encounter.enemy_current_hp}/3</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 text-xs w-5">&#9679;</span>
            <div className="flex-1 bg-manor-700 rounded h-3">
              <div className="stat-bar-wp" style={{ width: wpPct + '%' }} />
            </div>
            <span className="text-xs text-bone-400">{encounter.enemy_current_wp}/3</span>
          </div>
        </div>
      )}

      {encounter.status === 'active' && !isFriendly && (
        <div className="border-t border-manor-700 pt-4">
          {phase === 'idle' && (
            <div className="flex flex-col items-center">
              <p className="text-bone-400 text-sm mb-3">Roll to attack!</p>
              <DiceRoller onRoll={handlePlayerRoll} label="Your attack roll" />
            </div>
          )}

          {phase === 'monster_roll' && (
            <div className="flex flex-col items-center">
              <p className="text-bone-300 text-sm mb-1">You rolled: <strong className="text-candle-400">{playerRoll}</strong></p>
              <p className="text-bone-400 text-sm mb-3">Now roll for the monster!</p>
              <DiceRoller onRoll={handleMonsterRoll} label="Monster defense roll" />
            </div>
          )}

          {phase === 'result' && (
            <div className="flex flex-col items-center gap-3">
              <div className={`text-4xl ${roundResult === 'win' ? 'text-green-400' : 'text-blood-400'}`}>
                {roundResult === 'win' ? '&#127942;' : '&#128128;'}
              </div>
              <p className={`font-bold ${roundResult === 'win' ? 'text-green-400' : 'text-blood-400'}`}>
                {roundResult === 'win' ? 'Round Won!' : 'Round Lost!'}
              </p>
              <button onClick={resetRound} className="btn-ghost text-sm py-1 px-4">Next Round</button>
            </div>
          )}
        </div>
      )}

      {encounter.status !== 'active' && (
        <div className="text-center py-2">
          <span className={`text-sm font-bold ${
            encounter.status === 'defeated' ? 'text-green-400' :
            encounter.status === 'seduced'  ? 'text-pink-400' :
            'text-bone-400'
          }`}>
            {encounter.status === 'defeated' ? '&#127942; Defeated!' :
             encounter.status === 'seduced'  ? '&#128149; Seduced!' :
             encounter.status === 'fled'     ? '&#128070; Fled!' : encounter.status}
          </span>
        </div>
      )}
    </div>
  )
}
