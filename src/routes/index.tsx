import { createRoute, Link } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useEffect, useState } from 'react'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const games = [
    {
      id: 'classic',
      name: 'Classic Snake',
      description: 'The traditional snake game',
      available: true,
      icon: '🐍',
      accent: 'emerald',
    },
    {
      id: 'adder',
      name: 'Adder Snake',
      description: 'Eat eggs to grow or shrink - manage your length!',
      available: true,
      icon: '⚡',
      accent: 'purple',
    },
    {
      id: 'time-trial',
      name: 'Time Trial',
      description: 'Race against time! Collect eggs before the clock runs out.',
      available: true,
      icon: '⏱️',
      accent: 'cyan',
    },
  ]

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
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-3xl animate-pulse-slow"></div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        {/* Header - Full width for centering */}
        <div className={`text-center mb-20 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold mb-8 tracking-wider" style={{fontFamily: "'Orbitron', sans-serif"}}>
            <span className="text-cyan-400" style={{
              textShadow: '0 0 10px #00FFFF, 0 0 20px #00FFFF, 0 0 30px #00FFFF, 0 0 40px #00AAFF'
            }}>
              SNAKE
            </span>
            <span className="text-white mx-4">//</span>
            <span className="text-blue-400" style={{
              textShadow: '0 0 10px #0066FF, 0 0 20px #0066FF, 0 0 30px #0066FF'
            }}>
              ARCADE
            </span>
          </h1>
          <div className="h-1 w-64 mx-auto mb-8 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" style={{
            boxShadow: '0 0 10px #00FFFF'
          }}></div>
          <p className="text-base sm:text-lg text-cyan-300 max-w-2xl mx-auto tracking-widest uppercase" style={{
            textShadow: '0 0 5px #00FFFF'
          }}>
            [ SELECT GAME MODE ]
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-cyan-500 uppercase tracking-wider">
            <div className="w-2 h-2 bg-cyan-400 animate-pulse" style={{boxShadow: '0 0 5px #00FFFF'}}></div>
            <span>SYSTEMS ONLINE</span>
            <div className="w-2 h-2 bg-cyan-400 animate-pulse" style={{boxShadow: '0 0 5px #00FFFF'}}></div>
          </div>
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 w-full max-w-7xl mx-auto">
          {games.map((game, index) => (
            <div
              key={game.id}
              className={`group transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="relative h-full">
                {/* Neon glow effect */}
                <div className={`absolute -inset-1 ${
                  game.accent === 'emerald' ? 'bg-cyan-400' :
                  game.accent === 'purple' ? 'bg-blue-500' :
                  'bg-cyan-500'
                } opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-500`}></div>

                {/* Card */}
                <div className={`relative bg-black/90 backdrop-blur-sm border-2 ${
                  game.accent === 'emerald' ? 'border-cyan-500/50' :
                  game.accent === 'purple' ? 'border-blue-500/50' :
                  'border-cyan-400/50'
                } p-8 min-h-[360px] flex flex-col justify-between overflow-hidden ${
                  game.accent === 'emerald' ? 'group-hover:border-cyan-400' :
                  game.accent === 'purple' ? 'group-hover:border-blue-400' :
                  'group-hover:border-cyan-300'
                } transition-all duration-300`} style={{
                  clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)',
                  boxShadow: game.accent === 'emerald' ? '0 0 20px rgba(0, 255, 255, 0.1)' :
                             game.accent === 'purple' ? '0 0 20px rgba(0, 102, 255, 0.1)' :
                             '0 0 20px rgba(0, 255, 255, 0.1)'
                }}>
                  {/* Scanline effect */}
                  <div className="absolute inset-0 bg-scanline pointer-events-none"></div>

                  {/* Corner accent lines */}
                  <div className={`absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 ${
                    game.accent === 'emerald' ? 'border-cyan-400' :
                    game.accent === 'purple' ? 'border-blue-400' :
                    'border-cyan-300'
                  } opacity-50`}></div>
                  <div className={`absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 ${
                    game.accent === 'emerald' ? 'border-cyan-400' :
                    game.accent === 'purple' ? 'border-blue-400' :
                    'border-cyan-300'
                  } opacity-50`}></div>

                  <div className="relative">
                    {/* Icon - Centered with glow */}
                    <div className="flex items-center justify-center mb-6">
                      <div className={`text-6xl transform group-hover:scale-110 transition-transform duration-300`} style={{
                        filter: game.accent === 'emerald' ? 'drop-shadow(0 0 10px #00FFFF)' :
                                game.accent === 'purple' ? 'drop-shadow(0 0 10px #0066FF)' :
                                'drop-shadow(0 0 10px #00FFFF)'
                      }}>
                        {game.icon}
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className={`text-xl sm:text-2xl font-bold mb-4 text-center uppercase tracking-widest ${
                      game.accent === 'emerald' ? 'text-cyan-400' :
                      game.accent === 'purple' ? 'text-blue-400' :
                      'text-cyan-300'
                    } transition-all duration-300`} style={{
                      fontFamily: "'Orbitron', sans-serif",
                      textShadow: game.accent === 'emerald' ? '0 0 10px #00FFFF' :
                                  game.accent === 'purple' ? '0 0 10px #0066FF' :
                                  '0 0 10px #00FFFF'
                    }}>
                      {game.name}
                    </h2>

                    {/* Description */}
                    <p className="text-cyan-200/70 text-xs sm:text-sm leading-relaxed mb-6 text-center uppercase tracking-wide">
                      {game.description}
                    </p>
                  </div>

                  {/* Button */}
                  {game.available ? (
                    <Link
                      to={`/${game.id}` as '/classic' | '/adder' | '/time-trial'}
                      className={`relative inline-flex items-center justify-center px-8 py-3 font-bold ${
                        game.accent === 'emerald' ? 'text-cyan-400 border-2 border-cyan-500' :
                        game.accent === 'purple' ? 'text-blue-400 border-2 border-blue-500' :
                        'text-cyan-300 border-2 border-cyan-400'
                      } overflow-hidden group/btn transition-all duration-300 uppercase tracking-widest text-sm`}
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                        textShadow: game.accent === 'emerald' ? '0 0 5px #00FFFF' :
                                    game.accent === 'purple' ? '0 0 5px #0066FF' :
                                    '0 0 5px #00FFFF'
                      }}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <span>&gt;</span>
                        <span>INIT</span>
                        <span className="transform group-hover/btn:translate-x-1 transition-transform duration-300">▶</span>
                      </span>
                      <div className={`absolute inset-0 ${
                        game.accent === 'emerald' ? 'bg-cyan-500' :
                        game.accent === 'purple' ? 'bg-blue-500' :
                        'bg-cyan-400'
                      } opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300`}></div>
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center justify-center px-8 py-3 font-bold text-gray-600 border-2 border-gray-700 uppercase tracking-widest text-sm cursor-not-allowed"
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
                      }}
                    >
                      OFFLINE
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className={`mt-20 text-center text-cyan-500/50 text-xs uppercase tracking-widest transition-all duration-1000 delay-700 max-w-7xl mx-auto ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <p>[ REACT.SYS v19.2 // TOUCH_INTERFACE.ENABLED ]</p>
        </div>
      </div>
    </div>
  )
}
