export default function PlayerList({ players, currentUserId, gmUserId }) {
  return (
    <div>
      <h3 className="text-bone-400 text-xs font-bold uppercase tracking-wider mb-2">Adventurers</h3>
      <div className="space-y-2">
        {players.map(p => {
          const isMe = p.user_id === currentUserId
          const isGM = p.user_id === gmUserId
          const hpPct = (p.current_hp / p.characters?.max_hp) * 100
          const wpPct = (p.current_wp / p.characters?.max_wp) * 100
          const knocked = p.status === 'knocked_out'
          const seduced = p.status === 'seduced'

          return (
            <div key={p.id}
              className={`rounded p-2 border ${
                isMe ? 'border-candle-700 bg-manor-800' : 'border-manor-700 bg-manor-900'
              } ${knocked || seduced ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-bone-100 text-sm font-bold">{p.characters?.name}</span>
                  {isGM && <span className="text-xs bg-candle-800 text-candle-300 px-1 rounded">GM</span>}
                  {isMe && <span className="text-xs text-bone-500">(you)</span>}
                </div>
                {knocked && <span className="text-xs text-blood-400">&#128128; KO</span>}
                {seduced && <span className="text-xs text-pink-400">&#128149; Seduced</span>}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-blood-400 text-xs w-5">&#10084;</span>
                  <div className="flex-1 bg-manor-700 rounded h-2.5">
                    <div className="stat-bar-hp" style={{ width: hpPct + '%' }} />
                  </div>
                  <span className="text-xs text-bone-400 w-8 text-right">{p.current_hp}/{p.characters?.max_hp}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-400 text-xs w-5">&#9679;</span>
                  <div className="flex-1 bg-manor-700 rounded h-2.5">
                    <div className="stat-bar-wp" style={{ width: wpPct + '%' }} />
                  </div>
                  <span className="text-xs text-bone-400 w-8 text-right">{p.current_wp}/{p.characters?.max_wp}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
