import { useEffect, useRef } from 'react'

const LOG_COLORS = {
  narration: 'text-bone-200',
  combat:    'text-blood-400',
  seduce:    'text-pink-400',
  system:    'text-candle-400',
  gm:        'text-purple-300',
  loot:      'text-yellow-300',
  heal:      'text-green-400',
}

const LOG_ICONS = {
  narration: '&#128218;',
  combat:    '&#9876;',
  seduce:    '&#128148;',
  system:    '&#127963;',
  gm:        '&#127931;',
  loot:      '&#128176;',
  heal:      '&#10084;',
}

export default function GameLog({ logs }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-bone-400 text-xs font-bold uppercase tracking-wider mb-2">Game Log</h3>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {logs.length === 0 && (
          <p className="text-bone-500 text-sm italic text-center py-4">The mansion is silent...</p>
        )}
        {logs.map(log => (
          <div key={log.id} className="animate-slide-up">
            <span className="mr-1.5 text-xs" dangerouslySetInnerHTML={{ __html: LOG_ICONS[log.log_type] || '&#128218;' }} />
            <span className={`text-sm ${LOG_COLORS[log.log_type] || 'text-bone-300'}`}>
              {log.content}
            </span>
            <span className="text-manor-500 text-xs ml-1">
              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
