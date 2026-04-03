import { useState } from 'react'

export default function DiceRoller({ onRoll, disabled, label = 'Roll d20' }) {
  const [rolling, setRolling] = useState(false)
  const [lastRoll, setLastRoll] = useState(null)
  const [anim, setAnim] = useState(false)

  async function roll() {
    if (rolling || disabled) return
    setRolling(true)
    setAnim(true)

    // Simulate dice roll animation
    let ticks = 0
    const interval = setInterval(() => {
      setLastRoll(Math.ceil(Math.random() * 20))
      ticks++
      if (ticks >= 10) {
        clearInterval(interval)
        const finalRoll = Math.ceil(Math.random() * 20)
        setLastRoll(finalRoll)
        setRolling(false)
        setAnim(false)
        onRoll?.(finalRoll)
      }
    }, 80)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={roll}
        disabled={disabled || rolling}
        className={`w-20 h-20 rounded-lg border-2 font-gothic text-3xl font-bold transition-all
          ${disabled
            ? 'border-manor-600 text-manor-500 cursor-not-allowed bg-manor-800'
            : 'border-candle-600 hover:border-candle-400 text-candle-400 bg-manor-800 hover:bg-manor-700 active:scale-95'
          } ${anim ? 'animate-pulse' : ''}`}
      >
        {lastRoll !== null ? lastRoll : '&#9674;'}
      </button>
      <span className="text-bone-400 text-xs">{label}</span>
    </div>
  )
}
