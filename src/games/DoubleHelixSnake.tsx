import { useCallback, useEffect, useRef, useState } from 'react'
import { useHighScore } from '../hooks/useHighScore'
import { triggerHighScoreCelebration, triggerGameOverCelebration } from '../utils/celebration'
import { TouchControls } from '../components/TouchControls'
import { GameContainer } from '../components/GameContainer'
import { GameHeader } from '../components/GameHeader'
import { GameOverlay } from '../components/GameOverlay'
import { trackGameStart, trackGameEnd } from '../lib/analytics'

const GRID_SIZE = 20
const CELL_SIZE = 30
const GAME_SPEED = 150

type Position = { x: number; y: number }
type Direction = { x: number; y: number }

// Snake 1 (Arrow keys) - Cyan
const INITIAL_SNAKE1 = [{ x: 3, y: 10 }, { x: 2, y: 10 }, { x: 1, y: 10 }]
const INITIAL_DIRECTION1 = { x: 1, y: 0 }

// Snake 2 (WASD) - Magenta
const INITIAL_SNAKE2 = [{ x: 16, y: 10 }, { x: 17, y: 10 }, { x: 18, y: 10 }]
const INITIAL_DIRECTION2 = { x: -1, y: 0 }

interface DoubleHelixSnakeProps {
  hardcore?: boolean
}

export default function DoubleHelixSnake({ hardcore = false }: DoubleHelixSnakeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [snake1, setSnake1] = useState<Position[]>(INITIAL_SNAKE1)
  const [snake2, setSnake2] = useState<Position[]>(INITIAL_SNAKE2)
  const [eggs, setEggs] = useState<Position[]>(() => generateEggs([...INITIAL_SNAKE1, ...INITIAL_SNAKE2]))
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const direction1Ref = useRef<Direction>(INITIAL_DIRECTION1)
  const direction2Ref = useRef<Direction>(INITIAL_DIRECTION2)
  const confettiShownRef = useRef(false)
  const directionQueue1Ref = useRef<Direction[]>([])
  const directionQueue2Ref = useRef<Direction[]>([])
  const eggsRef = useRef<Position[]>(eggs)

  // Keep eggsRef in sync with eggs state
  useEffect(() => {
    eggsRef.current = eggs
  }, [eggs])

  const gameMode = 'double-helix'
  const gameName = 'Double Helix'

  const {
    score,
    highScore,
    showNewHighScore,
    incrementScore,
    resetScore,
    triggerNewHighScoreMessage,
    isNewHighScore,
  } = useHighScore(gameMode)

  function generateEggs(allSnakes: Position[]): Position[] {
    const eggs: Position[] = []
    while (eggs.length < 2) {
      const newEgg: Position = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }
      // Check if egg doesn't collide with snakes or other eggs
      const collision = allSnakes.some(s => s.x === newEgg.x && s.y === newEgg.y) ||
                       eggs.some(e => e.x === newEgg.x && e.y === newEgg.y)
      if (!collision) {
        eggs.push(newEgg)
      }
    }
    return eggs
  }

  function generateSingleEgg(allSnakes: Position[], existingEggs: Position[]): Position {
    let newEgg: Position
    do {
      newEgg = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }
    } while (
      allSnakes.some(s => s.x === newEgg.x && s.y === newEgg.y) ||
      existingEggs.some(e => e.x === newEgg.x && e.y === newEgg.y)
    )
    return newEgg
  }

  const resetGame = useCallback(() => {
    setSnake1(INITIAL_SNAKE1)
    setSnake2(INITIAL_SNAKE2)
    direction1Ref.current = INITIAL_DIRECTION1
    direction2Ref.current = INITIAL_DIRECTION2
    const newEggs = generateEggs([...INITIAL_SNAKE1, ...INITIAL_SNAKE2])
    setEggs(newEggs)
    eggsRef.current = newEggs
    setGameOver(false)
    setIsPaused(false)
    resetScore()
    confettiShownRef.current = false
    directionQueue1Ref.current = []
    directionQueue2Ref.current = []
    trackGameStart(gameName)
  }, [resetScore, gameName])

  const handlePause = useCallback(() => {
    if (gameOver) {
      resetGame()
    } else {
      setIsPaused(prev => !prev)
    }
  }, [gameOver, resetGame])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Handle spacebar
      if (e.key === ' ') {
        e.preventDefault()
        if (gameOver) {
          resetGame()
        } else {
          setIsPaused(prev => !prev)
        }
        return
      }

      if (gameOver) return

      // Snake 1 - Arrow keys
      const queue1 = directionQueue1Ref.current
      const lastDir1 = queue1.length > 0 ? queue1[queue1.length - 1] : direction1Ref.current

      let newDirection1: Direction | null = null

      switch (e.key) {
        case 'ArrowUp':
          if (lastDir1.y === 0) {
            newDirection1 = { x: 0, y: -1 }
          }
          break
        case 'ArrowDown':
          if (lastDir1.y === 0) {
            newDirection1 = { x: 0, y: 1 }
          }
          break
        case 'ArrowLeft':
          if (lastDir1.x === 0) {
            newDirection1 = { x: -1, y: 0 }
          }
          break
        case 'ArrowRight':
          if (lastDir1.x === 0) {
            newDirection1 = { x: 1, y: 0 }
          }
          break
      }

      if (newDirection1 && queue1.length < 2) {
        queue1.push(newDirection1)
      }

      // Snake 2 - WASD
      const queue2 = directionQueue2Ref.current
      const lastDir2 = queue2.length > 0 ? queue2[queue2.length - 1] : direction2Ref.current

      let newDirection2: Direction | null = null

      switch (e.key.toLowerCase()) {
        case 'w':
          if (lastDir2.y === 0) {
            newDirection2 = { x: 0, y: -1 }
          }
          break
        case 's':
          if (lastDir2.y === 0) {
            newDirection2 = { x: 0, y: 1 }
          }
          break
        case 'a':
          if (lastDir2.x === 0) {
            newDirection2 = { x: -1, y: 0 }
          }
          break
        case 'd':
          if (lastDir2.x === 0) {
            newDirection2 = { x: 1, y: 0 }
          }
          break
      }

      if (newDirection2 && queue2.length < 2) {
        queue2.push(newDirection2)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameOver, resetGame])

  useEffect(() => {
    if (gameOver || isPaused) return

    const gameLoop = setInterval(() => {
      // Process next direction from queues
      if (directionQueue1Ref.current.length > 0) {
        const nextDir = directionQueue1Ref.current.shift()!
        direction1Ref.current = nextDir
      }
      if (directionQueue2Ref.current.length > 0) {
        const nextDir = directionQueue2Ref.current.shift()!
        direction2Ref.current = nextDir
      }

      // Update snake 1
      setSnake1(currentSnake1 => {
        const head = currentSnake1[0]
        const newHead = {
          x: (head.x + direction1Ref.current.x + GRID_SIZE) % GRID_SIZE,
          y: (head.y + direction1Ref.current.y + GRID_SIZE) % GRID_SIZE,
        }

        // Check collision with self
        if (currentSnake1.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true)
          return currentSnake1
        }

        const newSnake = [newHead, ...currentSnake1]

        // Check if egg is eaten
        const eatenEgg = eggsRef.current.find(egg => egg.x === newHead.x && egg.y === newHead.y)
        if (eatenEgg) {
          // Replace only the eaten egg by position, not index
          const remainingEggs = eggsRef.current.filter(egg => !(egg.x === eatenEgg.x && egg.y === eatenEgg.y))
          const newEgg = generateSingleEgg([...newSnake, ...snake2], remainingEggs)
          const newEggs = [...remainingEggs, newEgg]
          setEggs(newEggs)
          eggsRef.current = newEggs
          incrementScore(10)
          return newSnake
        }

        // Remove tail if no egg eaten
        newSnake.pop()
        return newSnake
      })

      // Update snake 2
      setSnake2(currentSnake2 => {
        const head = currentSnake2[0]
        const newHead = {
          x: (head.x + direction2Ref.current.x + GRID_SIZE) % GRID_SIZE,
          y: (head.y + direction2Ref.current.y + GRID_SIZE) % GRID_SIZE,
        }

        // Check collision with self
        if (currentSnake2.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true)
          return currentSnake2
        }

        const newSnake = [newHead, ...currentSnake2]

        // Check if egg is eaten
        const eatenEgg = eggsRef.current.find(egg => egg.x === newHead.x && egg.y === newHead.y)
        if (eatenEgg) {
          // Replace only the eaten egg by position, not index
          const remainingEggs = eggsRef.current.filter(egg => !(egg.x === eatenEgg.x && egg.y === eatenEgg.y))
          const newEgg = generateSingleEgg([...snake1, ...newSnake], remainingEggs)
          const newEggs = [...remainingEggs, newEgg]
          setEggs(newEggs)
          eggsRef.current = newEggs
          incrementScore(10)
          return newSnake
        }

        // Remove tail if no egg eaten
        newSnake.pop()
        return newSnake
      })
    }, GAME_SPEED)

    return () => clearInterval(gameLoop)
  }, [gameOver, isPaused, incrementScore])

  // Check collision between snakes in hardcore mode
  useEffect(() => {
    if (!hardcore || gameOver || isPaused) return

    const head1 = snake1[0]
    const head2 = snake2[0]

    if (!head1 || !head2) return

    // Check if snake1 head collides with snake2 body
    const snake1CollidesWith2 = snake2.some(segment => segment.x === head1.x && segment.y === head1.y)
    // Check if snake2 head collides with snake1 body
    const snake2CollidesWith1 = snake1.some(segment => segment.x === head2.x && segment.y === head2.y)

    if (snake1CollidesWith2 || snake2CollidesWith1) {
      setGameOver(true)
    }
  }, [snake1, snake2, hardcore, gameOver, isPaused])

  // Show confetti during gameplay when first beating high score
  useEffect(() => {
    if (isNewHighScore && highScore > 0 && !confettiShownRef.current && !gameOver) {
      confettiShownRef.current = true
      triggerHighScoreCelebration()
    }
  }, [isNewHighScore, highScore, gameOver])

  // Show confetti when game ends if high score was beaten
  useEffect(() => {
    if (gameOver && isNewHighScore) {
      triggerGameOverCelebration()
      triggerNewHighScoreMessage()
    }
  }, [gameOver, isNewHighScore, triggerNewHighScoreMessage])

  // Track initial game start
  useEffect(() => {
    trackGameStart(gameName)
  }, [gameName])

  // Track game end
  useEffect(() => {
    if (gameOver) {
      trackGameEnd(gameName, score)
    }
  }, [gameOver, score, gameName])

  // Drawing effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1f2937'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Helper function to draw a snake
    const drawSnake = (snake: Position[], directionRef: React.MutableRefObject<Direction>, color: string, darkColor: string) => {
      snake.forEach((segment, index) => {
        const isHead = index === 0
        const isTail = index === snake.length - 1

        if (isHead) {
          // Head - bright color with rounded corners
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.roundRect(
            segment.x * CELL_SIZE + 2,
            segment.y * CELL_SIZE + 2,
            CELL_SIZE - 4,
            CELL_SIZE - 4,
            4
          )
          ctx.fill()

          const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2
          const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2

          // Draw eyes
          const eyeOffset = 4

          if (gameOver) {
            // Draw X marks for dead eyes
            ctx.strokeStyle = '#000000'
            ctx.lineWidth = 2
            const crossSize = 3

            if (directionRef.current.x !== 0) {
              // Moving horizontally - eyes on top and bottom
              // Top eye X
              ctx.beginPath()
              ctx.moveTo(centerX - crossSize, centerY - eyeOffset - crossSize)
              ctx.lineTo(centerX + crossSize, centerY - eyeOffset + crossSize)
              ctx.stroke()
              ctx.beginPath()
              ctx.moveTo(centerX + crossSize, centerY - eyeOffset - crossSize)
              ctx.lineTo(centerX - crossSize, centerY - eyeOffset + crossSize)
              ctx.stroke()
              // Bottom eye X
              ctx.beginPath()
              ctx.moveTo(centerX - crossSize, centerY + eyeOffset - crossSize)
              ctx.lineTo(centerX + crossSize, centerY + eyeOffset + crossSize)
              ctx.stroke()
              ctx.beginPath()
              ctx.moveTo(centerX + crossSize, centerY + eyeOffset - crossSize)
              ctx.lineTo(centerX - crossSize, centerY + eyeOffset + crossSize)
              ctx.stroke()
            } else {
              // Moving vertically - eyes on left and right
              // Left eye X
              ctx.beginPath()
              ctx.moveTo(centerX - eyeOffset - crossSize, centerY - crossSize)
              ctx.lineTo(centerX - eyeOffset + crossSize, centerY + crossSize)
              ctx.stroke()
              ctx.beginPath()
              ctx.moveTo(centerX - eyeOffset + crossSize, centerY - crossSize)
              ctx.lineTo(centerX - eyeOffset - crossSize, centerY + crossSize)
              ctx.stroke()
              // Right eye X
              ctx.beginPath()
              ctx.moveTo(centerX + eyeOffset - crossSize, centerY - crossSize)
              ctx.lineTo(centerX + eyeOffset + crossSize, centerY + crossSize)
              ctx.stroke()
              ctx.beginPath()
              ctx.moveTo(centerX + eyeOffset + crossSize, centerY - crossSize)
              ctx.lineTo(centerX + eyeOffset - crossSize, centerY + crossSize)
              ctx.stroke()
            }
          } else {
            // Draw normal dot eyes
            ctx.fillStyle = '#000000'

            if (directionRef.current.x !== 0) {
              // Moving horizontally - eyes on top and bottom
              ctx.beginPath()
              ctx.arc(centerX, centerY - eyeOffset, 2, 0, Math.PI * 2)
              ctx.fill()
              ctx.beginPath()
              ctx.arc(centerX, centerY + eyeOffset, 2, 0, Math.PI * 2)
              ctx.fill()
            } else {
              // Moving vertically - eyes on left and right
              ctx.beginPath()
              ctx.arc(centerX - eyeOffset, centerY, 2, 0, Math.PI * 2)
              ctx.fill()
              ctx.beginPath()
              ctx.arc(centerX + eyeOffset, centerY, 2, 0, Math.PI * 2)
              ctx.fill()
            }
          }

          // Draw tongue (only when alive)
          if (!gameOver) {
            ctx.fillStyle = '#ef4444'
            ctx.strokeStyle = '#ef4444'
            ctx.lineWidth = 2

            const tongueLength = 6
            const tongueStartX = centerX + directionRef.current.x * (CELL_SIZE / 2 - 2)
            const tongueStartY = centerY + directionRef.current.y * (CELL_SIZE / 2 - 2)
            const tongueEndX = tongueStartX + directionRef.current.x * tongueLength
            const tongueEndY = tongueStartY + directionRef.current.y * tongueLength

            ctx.beginPath()
            ctx.moveTo(tongueStartX, tongueStartY)
            ctx.lineTo(tongueEndX, tongueEndY)
            ctx.stroke()

            // Forked tongue tip
            const forkLength = 3
            if (directionRef.current.x !== 0) {
              ctx.beginPath()
              ctx.moveTo(tongueEndX, tongueEndY)
              ctx.lineTo(tongueEndX, tongueEndY - forkLength)
              ctx.stroke()
              ctx.beginPath()
              ctx.moveTo(tongueEndX, tongueEndY)
              ctx.lineTo(tongueEndX, tongueEndY + forkLength)
              ctx.stroke()
            } else {
              ctx.beginPath()
              ctx.moveTo(tongueEndX, tongueEndY)
              ctx.lineTo(tongueEndX - forkLength, tongueEndY)
              ctx.stroke()
              ctx.beginPath()
              ctx.moveTo(tongueEndX, tongueEndY)
              ctx.lineTo(tongueEndX + forkLength, tongueEndY)
              ctx.stroke()
            }
          }
        } else if (isTail) {
          // Tail - pointy tip
          ctx.fillStyle = darkColor

          const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2
          const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2

          // Determine tail direction (opposite of next segment)
          if (index > 0) {
            const nextSegment = snake[index - 1]
            const dx = Math.abs(segment.x - nextSegment.x)
            const dy = Math.abs(segment.y - nextSegment.y)

            // Check if tail is wrapping around - if so, just draw a square
            if (dx > 1 || dy > 1) {
              ctx.fillRect(
                segment.x * CELL_SIZE + 2,
                segment.y * CELL_SIZE + 2,
                CELL_SIZE - 4,
                CELL_SIZE - 4
              )
            } else {
              const tailDirX = segment.x - nextSegment.x
              const tailDirY = segment.y - nextSegment.y

              ctx.beginPath()
              if (tailDirX !== 0) {
                // Horizontal tail
                const tipX = centerX + tailDirX * (CELL_SIZE / 2)
                ctx.moveTo(tipX, centerY)
                ctx.lineTo(centerX - tailDirX * (CELL_SIZE / 2 - 2), centerY - (CELL_SIZE / 2 - 2))
                ctx.lineTo(centerX - tailDirX * (CELL_SIZE / 2 - 2), centerY + (CELL_SIZE / 2 - 2))
              } else {
                // Vertical tail
                const tipY = centerY + tailDirY * (CELL_SIZE / 2)
                ctx.moveTo(centerX, tipY)
                ctx.lineTo(centerX - (CELL_SIZE / 2 - 2), centerY - tailDirY * (CELL_SIZE / 2 - 2))
                ctx.lineTo(centerX + (CELL_SIZE / 2 - 2), centerY - tailDirY * (CELL_SIZE / 2 - 2))
              }
              ctx.closePath()
              ctx.fill()
            }
          }
        } else {
          // Body - medium color
          ctx.fillStyle = color
          ctx.fillRect(
            segment.x * CELL_SIZE + 2,
            segment.y * CELL_SIZE + 2,
            CELL_SIZE - 4,
            CELL_SIZE - 4
          )
        }
      })
    }

    // Draw both snakes
    drawSnake(snake1, direction1Ref, '#06b6d4', '#0e7490') // Cyan
    drawSnake(snake2, direction2Ref, '#ec4899', '#9d174d') // Magenta

    // Draw eggs
    eggs.forEach(egg => {
      const centerX = egg.x * CELL_SIZE + CELL_SIZE / 2
      const centerY = egg.y * CELL_SIZE + CELL_SIZE / 2
      const eggWidth = CELL_SIZE * 0.7
      const eggHeight = CELL_SIZE * 0.85

      // Draw egg shadow for depth
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.beginPath()
      ctx.ellipse(centerX + 1.5, centerY + 2, eggWidth / 2, eggHeight / 2.2, 0, 0, Math.PI)
      ctx.ellipse(centerX + 1.5, centerY + 2, eggWidth / 2.2, eggHeight / 2, 0, Math.PI, Math.PI * 2)
      ctx.fill()

      // Egg background with gradient
      const eggGradient = ctx.createLinearGradient(centerX, centerY - eggHeight / 2, centerX, centerY + eggHeight / 2)
      eggGradient.addColorStop(0, '#f5f5f5')
      eggGradient.addColorStop(0.5, '#ffffff')
      eggGradient.addColorStop(1, '#e8e8e8')
      ctx.fillStyle = eggGradient
      ctx.beginPath()
      ctx.ellipse(centerX, centerY, eggWidth / 2, eggHeight / 2.2, 0, 0, Math.PI)
      ctx.ellipse(centerX, centerY, eggWidth / 2.2, eggHeight / 2, 0, Math.PI, Math.PI * 2)
      ctx.fill()

      // Add highlight for 3D effect
      const gradient = ctx.createRadialGradient(
        centerX - eggWidth / 6,
        centerY - eggHeight / 6,
        0,
        centerX,
        centerY,
        eggHeight / 2
      )
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)')
      gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)')
      gradient.addColorStop(1, 'rgba(200, 200, 200, 0.3)')
      ctx.fillStyle = gradient
      ctx.fill()
    })
  }, [snake1, snake2, eggs, gameOver])

  const theme = 'magenta'

  return (
    <GameContainer theme={theme}>
      <GameHeader
        title={gameName}
        score={score}
        highScore={highScore}
        theme={theme}
      />

      {/* Canvas */}
      <div className="flex justify-center">
        <div className="w-full max-w-[600px] relative">
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            className={`border-2 ${hardcore ? 'border-magenta-500/50' : 'border-cyan-500/50'} w-full h-auto`}
            style={{
              boxShadow: hardcore ? '0 0 20px rgba(236, 72, 153, 0.2)' : '0 0 20px rgba(0, 255, 255, 0.2)',
              maxWidth: '100%',
              aspectRatio: '1 / 1'
            }}
          />

          <GameOverlay
            gameOver={gameOver}
            isPaused={isPaused}
            showNewHighScore={showNewHighScore}
            onRestart={resetGame}
            theme={theme}
          />
        </div>
      </div>

      {/* Touch Controls */}
      <div className="flex justify-around gap-4 mt-4">
        <div className="flex-1 flex justify-center">
          <TouchControls
            onDirectionChange={(dir) => {
              const queue = directionQueue1Ref.current
              const lastDir = queue.length > 0 ? queue[queue.length - 1] : direction1Ref.current
              if (
                (dir.x !== 0 && lastDir.x === 0 && lastDir.y !== 0) ||
                (dir.y !== 0 && lastDir.y === 0 && lastDir.x !== 0)
              ) {
                if (queue.length < 2) {
                  queue.push(dir)
                }
              }
            }}
            theme="cyan"
            showBoost={false}
            showPause={false}
          />
        </div>
        <div className="flex-1 flex justify-center">
          <TouchControls
            onDirectionChange={(dir) => {
              const queue = directionQueue2Ref.current
              const lastDir = queue.length > 0 ? queue[queue.length - 1] : direction2Ref.current
              if (
                (dir.x !== 0 && lastDir.x === 0 && lastDir.y !== 0) ||
                (dir.y !== 0 && lastDir.y === 0 && lastDir.x !== 0)
              ) {
                if (queue.length < 2) {
                  queue.push(dir)
                }
              }
            }}
            theme="magenta"
            showBoost={false}
            showPause={false}
          />
        </div>
      </div>

      {/* Pause Button */}
      <div className="flex justify-center mt-4">
        <button
          onClick={handlePause}
          className="px-6 py-2 font-bold text-pink-400 border-pink-500 border-2 rounded uppercase tracking-wider text-sm"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          {gameOver ? 'RESTART' : isPaused ? 'RESUME' : 'PAUSE'}
        </button>
      </div>
    </GameContainer>
  )
}
