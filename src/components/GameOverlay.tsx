type GameOverlayProps = {
  gameOver: boolean
  isPaused: boolean
  showNewHighScore: boolean
  onRestart: () => void
  theme: 'cyan' | 'blue' | 'magenta'
}

export function GameOverlay({
  gameOver,
  isPaused,
  showNewHighScore,
  onRestart,
  theme
}: GameOverlayProps) {
  const colors = {
    cyan: {
      primary: 'text-cyan-400',
      border: 'border-cyan-500',
      bg: 'bg-cyan-500',
      shadow: '0 0 5px #00FFFF',
      shadowStrong: '0 0 10px #00FFFF, 0 0 20px #00FFFF',
      text: 'text-cyan-500/70'
    },
    blue: {
      primary: 'text-blue-400',
      border: 'border-blue-500',
      bg: 'bg-blue-500',
      shadow: '0 0 5px #0066FF',
      shadowStrong: '0 0 10px #0066FF, 0 0 20px #0066FF',
      text: 'text-blue-500/70'
    },
    magenta: {
      primary: 'text-pink-400',
      border: 'border-pink-500',
      bg: 'bg-pink-500',
      shadow: '0 0 5px #ec4899',
      shadowStrong: '0 0 10px #ec4899, 0 0 20px #ec4899',
      text: 'text-pink-500/70'
    }
  }

  const color = colors[theme]

  if (gameOver) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="text-center px-4">
          <p
            className="text-xl md:text-2xl font-bold text-red-400 mb-3 md:mb-4 uppercase tracking-wider"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              textShadow: '0 0 10px #ff0000'
            }}
          >
            System Failure
          </p>
          {showNewHighScore && (
            <p
              className={`text-2xl md:text-3xl font-bold ${color.primary} mb-3 md:mb-4 animate-fade-out uppercase tracking-wider`}
              style={{
                fontFamily: "'Orbitron', sans-serif",
                textShadow: color.shadowStrong
              }}
            >
              New High Score
            </p>
          )}
          <p
            className={`${color.text} mb-3 md:mb-4 uppercase tracking-wide text-xs md:text-sm`}
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            [ Press Space to restart ]
          </p>
          <button
            onClick={onRestart}
            className={`relative px-6 md:px-8 py-2 md:py-3 font-bold ${color.primary} border-2 ${color.border} overflow-hidden group transition-all duration-300 uppercase tracking-widest text-xs md:text-sm`}
            style={{
              fontFamily: "'Orbitron', sans-serif",
              clipPath:
                'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
              textShadow: color.shadow
            }}
          >
            <span className="relative z-10 flex items-center gap-2 justify-center">
              <span>&gt;</span>
              <span>RESTART</span>
              <span className="transform group-hover:translate-x-1 transition-transform duration-300">
                ▶
              </span>
            </span>
            <div className={`absolute inset-0 ${color.bg} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
          </button>
        </div>
      </div>
    )
  }

  if (isPaused) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <p
          className="text-xl md:text-2xl font-bold text-yellow-400 uppercase tracking-wider"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            textShadow: '0 0 10px #ffff00'
          }}
        >
          [ Paused ]
        </p>
      </div>
    )
  }

  return null
}
