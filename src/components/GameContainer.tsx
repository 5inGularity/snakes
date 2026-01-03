import { ReactNode } from 'react'

type GameContainerProps = {
  children: ReactNode
  theme: 'cyan' | 'blue'
}

export function GameContainer({ children, theme }: GameContainerProps) {
  const colors = {
    cyan: {
      border: 'border-cyan-500/50',
      borderAccent: 'border-cyan-400',
      shadow: '0 0 20px rgba(0, 255, 255, 0.1)'
    },
    blue: {
      border: 'border-blue-500/50',
      borderAccent: 'border-blue-400',
      shadow: '0 0 20px rgba(0, 102, 255, 0.1)'
    }
  }

  const color = colors[theme]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Tron-style background */}
      <div className="fixed inset-0 bg-black">
        <div className="absolute inset-0 bg-grid-pattern"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80"></div>
        <div className="absolute inset-0 bg-scanline"></div>
      </div>

      {/* Neon glow effects */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-float"></div>
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float-delayed"></div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center px-2 md:px-4 py-4 md:py-8 min-h-screen">
        <div className="w-full max-w-2xl">
          <div className="relative">
            {/* Neon glow effect */}
            <div className="absolute -inset-1 bg-cyan-400 opacity-0 blur-lg"></div>

            {/* Card */}
            <div
              className={`relative bg-black/90 backdrop-blur-sm border-2 ${color.border} p-4 md:p-8 overflow-hidden`}
              style={{
                clipPath:
                  'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)',
                boxShadow: color.shadow
              }}
            >
              {/* Scanline effect */}
              <div className="absolute inset-0 bg-scanline pointer-events-none"></div>

              {/* Corner accent lines */}
              <div className={`absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 ${color.borderAccent} opacity-50`}></div>
              <div className={`absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 ${color.borderAccent} opacity-50`}></div>

              <div className="relative">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
