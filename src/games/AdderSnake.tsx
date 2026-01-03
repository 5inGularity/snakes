import { useCallback, useEffect, useRef, useState } from 'react'
import { useHighScore } from '../hooks/useHighScore'
import { triggerHighScoreCelebration, triggerGameOverCelebration } from '../utils/celebration'
import { TouchControls } from '../components/TouchControls'
import { GameContainer } from '../components/GameContainer'
import { GameHeader } from '../components/GameHeader'
import { GameOverlay } from '../components/GameOverlay'

const GRID_SIZE = 20
const CELL_SIZE = 30
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 9, y: 10 }]
const INITIAL_DIRECTION = { x: 1, y: 0 }
const GAME_SPEED = 150
const INITIAL_LENGTH = 2

type Position = { x: number; y: number }
type Direction = { x: number; y: number }
type Egg = {
  position: Position
  value: number  // -5 to -1 or +1 to +5
  type: 'positive' | 'negative'
}

export default function AdderSnake() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE)
  const [eggs, setEggs] = useState<[Egg, Egg]>(() => [
    generatePositiveEgg(INITIAL_SNAKE, []),
    generateNegativeEgg(INITIAL_SNAKE, [])
  ])
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [animationTrigger, setAnimationTrigger] = useState(0)
  const directionRef = useRef<Direction>(INITIAL_DIRECTION)
  const confettiShownRef = useRef(false)
  const directionQueueRef = useRef<Direction[]>([])
  const animationRef = useRef<{ type: 'grow' | 'shrink' | null; intensity: number }>({ type: null, intensity: 0 })
  const newSegmentsCountRef = useRef(0)

  const {
    score,
    highScore,
    showNewHighScore,
    setScore,
    resetScore,
    triggerNewHighScoreMessage,
    isNewHighScore,
  } = useHighScore('adder')

  function generateRandomValue(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  function generateValidPosition(snake: Position[], existingEggs: Egg[]): Position {
    let newPos: Position
    do {
      newPos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }
    } while (
      snake.some(segment => segment.x === newPos.x && segment.y === newPos.y) ||
      existingEggs.some(egg => egg.position.x === newPos.x && egg.position.y === newPos.y)
    )
    return newPos
  }

  function generatePositiveEgg(currentSnake: Position[], existingEggs: Egg[]): Egg {
    return {
      position: generateValidPosition(currentSnake, existingEggs),
      value: generateRandomValue(1, 5),
      type: 'positive'
    }
  }

  function generateNegativeEgg(currentSnake: Position[], existingEggs: Egg[]): Egg {
    return {
      position: generateValidPosition(currentSnake, existingEggs),
      value: generateRandomValue(-5, -1),
      type: 'negative'
    }
  }

  // Update score whenever snake length changes
  useEffect(() => {
    const currentScore = snake.length - INITIAL_LENGTH
    setScore(currentScore)
  }, [snake.length, setScore])

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE)
    directionRef.current = INITIAL_DIRECTION
    const positiveEgg = generatePositiveEgg(INITIAL_SNAKE, [])
    setEggs([positiveEgg, generateNegativeEgg(INITIAL_SNAKE, [positiveEgg])])
    setGameOver(false)
    setIsPaused(false)
    resetScore()
    confettiShownRef.current = false
    directionQueueRef.current = []
    animationRef.current = { type: null, intensity: 0 }
    newSegmentsCountRef.current = 0
    setAnimationTrigger(0)
  }, [resetScore])

  // Touch control handlers
  const handleTouchDirection = useCallback((direction: Direction) => {
    if (gameOver) return

    const queue = directionQueueRef.current
    const lastDir = queue.length > 0 ? queue[queue.length - 1] : directionRef.current

    // Prevent 180° turns (same logic as keyboard)
    if (
      (direction.x !== 0 && lastDir.x === 0 && lastDir.y !== 0) ||
      (direction.y !== 0 && lastDir.y === 0 && lastDir.x !== 0)
    ) {
      if (queue.length < 2) {
        queue.push(direction)
      }
    }
  }, [gameOver])

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

      // Get the last direction in queue or current direction
      const queue = directionQueueRef.current
      const lastDir = queue.length > 0 ? queue[queue.length - 1] : directionRef.current

      let newDirection: Direction | null = null

      switch (e.key) {
        case 'ArrowUp':
          if (lastDir.y === 0) {
            newDirection = { x: 0, y: -1 }
          }
          break
        case 'ArrowDown':
          if (lastDir.y === 0) {
            newDirection = { x: 0, y: 1 }
          }
          break
        case 'ArrowLeft':
          if (lastDir.x === 0) {
            newDirection = { x: -1, y: 0 }
          }
          break
        case 'ArrowRight':
          if (lastDir.x === 0) {
            newDirection = { x: 1, y: 0 }
          }
          break
      }

      // Add to queue if valid and queue isn't too long (max 2 buffered inputs)
      if (newDirection && queue.length < 2) {
        queue.push(newDirection)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameOver, resetGame])

  useEffect(() => {
    if (gameOver || isPaused) return

    const gameLoop = setInterval(() => {
      // Fade animation intensity
      if (animationRef.current.intensity > 0) {
        animationRef.current.intensity -= 0.15
        if (animationRef.current.intensity <= 0) {
          animationRef.current = { type: null, intensity: 0 }
          newSegmentsCountRef.current = 0
        }
        // Trigger re-render for animation
        setAnimationTrigger(prev => prev + 1)
      }

      // Process next direction from queue
      if (directionQueueRef.current.length > 0) {
        const nextDir = directionQueueRef.current.shift()!
        directionRef.current = nextDir
      }

      setSnake(currentSnake => {
        const head = currentSnake[0]

        // Check collision with BOTH eggs first (before moving)
        let eggEaten = false
        let eggValue = 0

        eggs.forEach(egg => {
          const nextPos = {
            x: (head.x + directionRef.current.x + GRID_SIZE) % GRID_SIZE,
            y: (head.y + directionRef.current.y + GRID_SIZE) % GRID_SIZE,
          }
          if (nextPos.x === egg.position.x && nextPos.y === egg.position.y) {
            eggEaten = true
            eggValue = egg.value
          }
        })

        if (eggEaten) {
          if (eggValue > 0) {
            // POSITIVE: Head jumps forward, body fills in
            const jumpDistance = eggValue
            const newSegments: Position[] = []

            // Create segments from furthest position back to current head
            // So new head is at the furthest position
            for (let i = jumpDistance; i >= 1; i--) {
              newSegments.push({
                x: (head.x + directionRef.current.x * i + GRID_SIZE) % GRID_SIZE,
                y: (head.y + directionRef.current.y * i + GRID_SIZE) % GRID_SIZE,
              })
            }

            // Check if any new segment collides with current snake
            for (const seg of newSegments) {
              if (currentSnake.some(s => s.x === seg.x && s.y === seg.y)) {
                setGameOver(true)
                return currentSnake
              }
            }

            const finalSnake = [...newSegments, ...currentSnake]

            // Trigger growth animation
            animationRef.current = { type: 'grow', intensity: 1.0 }
            newSegmentsCountRef.current = jumpDistance

            // Regenerate BOTH eggs
            const newPositiveEgg = generatePositiveEgg(finalSnake, [])
            const newNegativeEgg = generateNegativeEgg(finalSnake, [newPositiveEgg])
            setEggs([newPositiveEgg, newNegativeEgg])

            if (finalSnake.length < 2) {
              setGameOver(true)
              return finalSnake
            }

            return finalSnake
          } else {
            // NEGATIVE: Head moves normally, tail shrinks
            const newHead = {
              x: (head.x + directionRef.current.x + GRID_SIZE) % GRID_SIZE,
              y: (head.y + directionRef.current.y + GRID_SIZE) % GRID_SIZE,
            }

            // Check collision with self
            if (currentSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
              setGameOver(true)
              return currentSnake
            }

            const segmentsToRemove = Math.abs(eggValue)
            const newSnake = [newHead, ...currentSnake]
            const finalSnake = newSnake.slice(0, -segmentsToRemove)

            // Check if snake dies from being too short
            if (finalSnake.length < 2) {
              // Trigger shrink animation
              animationRef.current = { type: 'shrink', intensity: 1.0 }
              newSegmentsCountRef.current = segmentsToRemove

              setGameOver(true)
              // Return just the head in dead state
              return [newHead]
            }

            // Trigger shrink animation
            animationRef.current = { type: 'shrink', intensity: 1.0 }
            newSegmentsCountRef.current = segmentsToRemove

            // Regenerate BOTH eggs (only if still alive)
            const newPositiveEgg = generatePositiveEgg(finalSnake, [])
            const newNegativeEgg = generateNegativeEgg(finalSnake, [newPositiveEgg])
            setEggs([newPositiveEgg, newNegativeEgg])

            return finalSnake
          }
        }

        // No egg eaten: normal movement (head moves 1 space)
        const newHead = {
          x: (head.x + directionRef.current.x + GRID_SIZE) % GRID_SIZE,
          y: (head.y + directionRef.current.y + GRID_SIZE) % GRID_SIZE,
        }

        // Check collision with self
        if (currentSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true)
          return currentSnake
        }

        const newSnake = [newHead, ...currentSnake]
        newSnake.pop() // Remove tail
        return newSnake
      })
    }, GAME_SPEED)

    return () => clearInterval(gameLoop)
  }, [eggs, gameOver, isPaused])

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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1f2937'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Apply glow effect if animating
    if (animationRef.current.type && animationRef.current.intensity > 0) {
      const intensity = animationRef.current.intensity
      const color = animationRef.current.type === 'grow' ? '16, 185, 129' : '239, 68, 68' // Green or Red
      ctx.shadowBlur = 15 * intensity
      ctx.shadowColor = `rgba(${color}, ${intensity})`
    }

    // Draw snake
    snake.forEach((segment, index) => {
      const isHead = index === 0
      const isTail = index === snake.length - 1
      const isNewSegment = animationRef.current.type === 'grow' && index < newSegmentsCountRef.current
      const isRemovedArea = animationRef.current.type === 'shrink' && index >= snake.length - Math.min(3, newSegmentsCountRef.current)

      if (isHead) {
        // Head - bright green with rounded corners, with animation glow
        let headColor = '#10b981'
        if (isNewSegment && animationRef.current.intensity > 0) {
          // Brighter green for new head during growth
          const brightness = Math.floor(255 * animationRef.current.intensity)
          headColor = `rgb(${Math.min(16 + brightness, 255)}, ${Math.min(185 + brightness, 255)}, ${Math.min(129 + brightness, 255)})`
        }
        ctx.fillStyle = headColor
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
        ctx.fillStyle = '#166534'

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
        // Body - medium green with animation effects
        let bodyColor = '#22c55e'

        if (isNewSegment && animationRef.current.intensity > 0) {
          // Brighter green for newly added segments during growth
          const brightness = Math.floor(100 * animationRef.current.intensity)
          bodyColor = `rgb(${Math.min(34 + brightness, 255)}, ${Math.min(197 + brightness, 255)}, ${Math.min(94 + brightness, 255)})`
        } else if (isRemovedArea && animationRef.current.intensity > 0) {
          // Red tint for segments about to be removed during shrinkage
          const redIntensity = animationRef.current.intensity
          bodyColor = `rgb(${Math.floor(34 + 205 * redIntensity)}, ${Math.floor(197 - 129 * redIntensity)}, ${Math.floor(94 - 26 * redIntensity)})`
        }

        ctx.fillStyle = bodyColor
        ctx.fillRect(
          segment.x * CELL_SIZE + 2,
          segment.y * CELL_SIZE + 2,
          CELL_SIZE - 4,
          CELL_SIZE - 4
        )
      }
    })

    // Reset shadow for eggs
    ctx.shadowBlur = 0
    ctx.shadowColor = 'transparent'

    // Draw eggs (only if game is not over)
    if (!gameOver) {
      eggs.forEach(egg => {
      const isPositive = egg.type === 'positive'
      const centerX = egg.position.x * CELL_SIZE + CELL_SIZE / 2
      const centerY = egg.position.y * CELL_SIZE + CELL_SIZE / 2

      // Egg shape - reduced height to fit in cell
      const eggWidth = CELL_SIZE * 0.7
      const eggHeight = CELL_SIZE * 0.85

      // Draw egg shadow for depth
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.beginPath()
      // Egg-shaped shadow (wider at bottom, narrower at top)
      ctx.ellipse(centerX + 1.5, centerY + 2, eggWidth / 2, eggHeight / 2.2, 0, 0, Math.PI)
      ctx.ellipse(centerX + 1.5, centerY + 2, eggWidth / 2.2, eggHeight / 2, 0, Math.PI, Math.PI * 2)
      ctx.fill()

      // Egg background with gradient (green or red)
      const eggGradient = ctx.createLinearGradient(centerX, centerY - eggHeight / 2, centerX, centerY + eggHeight / 2)
      if (isPositive) {
        eggGradient.addColorStop(0, '#34d399')
        eggGradient.addColorStop(0.5, '#10b981')
        eggGradient.addColorStop(1, '#059669')
      } else {
        eggGradient.addColorStop(0, '#f87171')
        eggGradient.addColorStop(0.5, '#ef4444')
        eggGradient.addColorStop(1, '#dc2626')
      }
      ctx.fillStyle = eggGradient
      ctx.beginPath()
      // Top half (narrower)
      ctx.ellipse(centerX, centerY, eggWidth / 2, eggHeight / 2.2, 0, 0, Math.PI)
      // Bottom half (wider)
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

      // Number text (white with shadow for better visibility)
      ctx.shadowBlur = 3
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(Math.abs(egg.value).toString(), centerX, centerY)

      // Reset shadow
      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'
    })
    }
  }, [snake, eggs, gameOver, animationTrigger])

  return (
    <GameContainer theme="blue">
      <GameHeader
        title="Adder Snake"
        score={score}
        highScore={highScore}
        theme="blue"
      />

      {/* Canvas */}
      <div className="flex justify-center">
        <div className="w-full max-w-[600px] relative">
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            className="border-2 border-blue-500/50 w-full h-auto"
            style={{
              boxShadow: '0 0 20px rgba(0, 102, 255, 0.2)',
              maxWidth: '100%',
              aspectRatio: '1 / 1'
            }}
          />

          <GameOverlay
            gameOver={gameOver}
            isPaused={isPaused}
            showNewHighScore={showNewHighScore}
            onRestart={resetGame}
            theme="blue"
          />
        </div>
      </div>

      {/* Touch Controls */}
      <TouchControls
        onDirectionChange={handleTouchDirection}
        onPause={handlePause}
        showBoost={false}
        showPause={false}
      />
    </GameContainer>
  )
}
