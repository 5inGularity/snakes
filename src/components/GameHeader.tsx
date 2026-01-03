import { Link } from '@tanstack/react-router'

type GameHeaderProps = {
  title: string
  score: number
  highScore: number
  theme: 'cyan' | 'blue'
}

export function GameHeader({ title, score, highScore, theme }: GameHeaderProps) {
  const colors = {
    cyan: {
      primary: 'text-cyan-400',
      border: 'border-cyan-500',
      bg: 'bg-cyan-500',
      shadow: '0 0 5px #00FFFF',
      shadowStrong: '0 0 10px #00FFFF, 0 0 20px #00FFFF',
      text: 'text-cyan-500/70',
      scoreText: 'text-cyan-300'
    },
    blue: {
      primary: 'text-blue-400',
      border: 'border-blue-500',
      bg: 'bg-blue-500',
      shadow: '0 0 5px #0066FF',
      shadowStrong: '0 0 10px #0066FF, 0 0 20px #0066FF',
      text: 'text-blue-500/70',
      scoreText: 'text-blue-300'
    }
  }

  const color = colors[theme]

  return (
    <div className="flex items-center justify-between mb-4 md:mb-8 gap-2">
      <Link
        to="/"
        className={`relative px-3 py-1.5 md:px-6 md:py-2 font-bold ${color.primary} border-2 ${color.border} overflow-hidden group transition-all duration-300 uppercase tracking-wider text-xs md:text-sm`}
        style={{
          fontFamily: "'Orbitron', sans-serif",
          clipPath:
            'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
          textShadow: color.shadow
        }}
      >
        <span className="relative z-10 flex items-center gap-1 md:gap-2">
          <span>&lt;</span>
          <span className="hidden sm:inline">BACK</span>
        </span>
        <div className={`absolute inset-0 ${color.bg} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
      </Link>
      <h1
        className={`text-xl md:text-2xl lg:text-3xl font-bold ${color.primary} uppercase tracking-wider`}
        style={{
          fontFamily: "'Orbitron', sans-serif",
          textShadow: color.shadowStrong
        }}
      >
        {title}
      </h1>
      <div className="text-right">
        <div
          className={`text-lg md:text-xl lg:text-2xl font-bold ${color.scoreText}`}
          style={{ textShadow: color.shadow }}
        >
          {score}
        </div>
        <div
          className={`text-xs md:text-sm ${color.text} uppercase tracking-wide`}
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          High: {highScore}
        </div>
      </div>
    </div>
  )
}
