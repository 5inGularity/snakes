import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useHighScore } from '../hooks/useHighScore'
import { triggerHighScoreCelebration, triggerGameOverCelebration } from '../utils/celebration'

const GRID_SIZE = 20
const CELL_SIZE = 30
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 9, y: 10 }]
const INITIAL_DIRECTION = { x: 1, y: 0 }
const GAME_SPEED = 150

type Position = { x: number; y: number }
type Direction = { x: number; y: number }

export default function ClassicSnake() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE)
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION)
  const [food, setFood] = useState<Position>(generateFood(INITIAL_SNAKE))
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const directionRef = useRef<Direction>(INITIAL_DIRECTION)
  const confettiShownRef = useRef(false)
  const directionQueueRef = useRef<Direction[]>([])

  const {
    score,
    highScore,
    showNewHighScore,
    incrementScore,
    resetScore,
    triggerNewHighScoreMessage,
    isNewHighScore,
  } = useHighScore('classic')

  function generateFood(currentSnake: Position[]): Position {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE)
    setDirection(INITIAL_DIRECTION)
    directionRef.current = INITIAL_DIRECTION
    setFood(generateFood(INITIAL_SNAKE))
    setGameOver(false)
    setIsPaused(false)
    resetScore()
    confettiShownRef.current = false
    directionQueueRef.current = []
  }, [resetScore])

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
      // Process next direction from queue
      if (directionQueueRef.current.length > 0) {
        const nextDir = directionQueueRef.current.shift()!
        directionRef.current = nextDir
        setDirection(nextDir)
      }

      setSnake(currentSnake => {
        const head = currentSnake[0]
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

        // Check if food is eaten
        if (newHead.x === food.x && newHead.y === food.y) {
          setFood(generateFood(newSnake))
          incrementScore(10)
          return newSnake
        }

        // Remove tail if no food eaten
        newSnake.pop()
        return newSnake
      })
    }, GAME_SPEED)

    return () => clearInterval(gameLoop)
  }, [food, gameOver, isPaused, incrementScore])

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

    // Draw snake
    snake.forEach((segment, index) => {
      const isHead = index === 0
      const isTail = index === snake.length - 1

      if (isHead) {
        // Head - bright green with rounded corners
        ctx.fillStyle = '#10b981'
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
        // Body - medium green
        ctx.fillStyle = '#22c55e'
        ctx.fillRect(
          segment.x * CELL_SIZE + 2,
          segment.y * CELL_SIZE + 2,
          CELL_SIZE - 4,
          CELL_SIZE - 4
        )
      }
    })

    // Draw food as white egg
    const centerX = food.x * CELL_SIZE + CELL_SIZE / 2
    const centerY = food.y * CELL_SIZE + CELL_SIZE / 2
    const eggWidth = CELL_SIZE * 0.9
    const eggHeight = CELL_SIZE * 1.1

    // Draw egg shadow for depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.beginPath()
    ctx.ellipse(centerX + 1, centerY + 2, eggWidth / 2, eggHeight / 2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Egg background (white)
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.ellipse(centerX, centerY, eggWidth / 2, eggHeight / 2, 0, 0, Math.PI * 2)
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
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)')
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)')
    gradient.addColorStop(1, 'rgba(200, 200, 200, 0.3)')
    ctx.fillStyle = gradient
    ctx.fill()
  }, [snake, food, gameOver])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            ← Back
          </Link>
          <h1 className="text-3xl font-bold">Classic Snake</h1>
          <div className="text-right">
            <div className="text-2xl font-bold">Score: {score}</div>
            <div className="text-sm text-gray-400">High: {highScore}</div>
          </div>
        </div>

        <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
          <div className="flex justify-center mb-6">
            <canvas
              ref={canvasRef}
              width={GRID_SIZE * CELL_SIZE}
              height={GRID_SIZE * CELL_SIZE}
              className="border-2 border-gray-600 rounded"
            />
          </div>

          {gameOver && (
            <div className="text-center mb-4">
              <p className="text-2xl font-bold text-red-500 mb-4">Game Over!</p>
              {showNewHighScore && (
                <p className="text-3xl font-bold text-yellow-400 mb-4 animate-fade-out">
                  🎉 New High Score! 🎉
                </p>
              )}
              <p className="text-gray-400 mb-4">Press Space to restart</p>
              <button
                onClick={resetGame}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded transition-colors"
              >
                Play Again
              </button>
            </div>
          )}

          {isPaused && !gameOver && (
            <div className="text-center mb-4">
              <p className="text-2xl font-bold text-yellow-500">Paused</p>
            </div>
          )}

          {!gameOver && (
            <div className="text-center text-gray-400">
              <p className="mb-2">Use arrow keys to move</p>
              <p>Press Space to pause</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
