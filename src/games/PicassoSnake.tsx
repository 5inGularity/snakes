import { useCallback, useEffect, useRef, useState } from 'react'
import { useHighScore } from '../hooks/useHighScore'
import { triggerHighScoreCelebration, triggerGameOverCelebration } from '../utils/celebration'
import { TouchControls } from '../components/TouchControls'
import { GameContainer } from '../components/GameContainer'
import { GameHeader } from '../components/GameHeader'
import { GameOverlay } from '../components/GameOverlay'
import { trackGameStart, trackGameEnd } from '../lib/analytics'
import { initAudio, playEatSound, playDeathSound, playHighScoreSound } from '../utils/sound'

const GRID_SIZE = 20
const CELL_SIZE = 30
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 9, y: 10 }]
const INITIAL_DIRECTION = { x: 1, y: 0 }
const INITIAL_SPEED = 150
const GROWTH_INTERVAL = 30000 // 30 seconds
const SPEED_INCREASE = 0.1 // 10% increase
const MAX_SPEED_MULTIPLIER = 4 // 400% of original

type Position = { x: number; y: number }
type Direction = { x: number; y: number }
type Pattern = boolean[][] // true = cell should have egg

// Define 5 simple shape patterns
const PATTERNS: Pattern[] = [
  // Pattern 1: Cross/Plus
  Array(GRID_SIZE).fill(null).map((_, y) =>
    Array(GRID_SIZE).fill(null).map((_, x) =>
      x === Math.floor(GRID_SIZE / 2) || y === Math.floor(GRID_SIZE / 2)
    )
  ),

  // Pattern 2: Square outline
  Array(GRID_SIZE).fill(null).map((_, y) =>
    Array(GRID_SIZE).fill(null).map((_, x) => {
      const margin = 5
      return (
        (x === margin || x === GRID_SIZE - margin - 1) && (y >= margin && y <= GRID_SIZE - margin - 1) ||
        (y === margin || y === GRID_SIZE - margin - 1) && (x >= margin && x <= GRID_SIZE - margin - 1)
      )
    })
  ),

  // Pattern 3: Diagonal line (top-left to bottom-right)
  Array(GRID_SIZE).fill(null).map((_, y) =>
    Array(GRID_SIZE).fill(null).map((_, x) => x === y)
  ),

  // Pattern 4: Diamond
  Array(GRID_SIZE).fill(null).map((_, y) =>
    Array(GRID_SIZE).fill(null).map((_, x) => {
      const centerX = Math.floor(GRID_SIZE / 2)
      const centerY = Math.floor(GRID_SIZE / 2)
      const size = 7
      return Math.abs(x - centerX) + Math.abs(y - centerY) === size
    })
  ),

  // Pattern 5: T-shape
  Array(GRID_SIZE).fill(null).map((_, y) =>
    Array(GRID_SIZE).fill(null).map((_, x) => {
      const topY = 5
      const stemX = Math.floor(GRID_SIZE / 2)
      const topStartX = 5
      const topEndX = GRID_SIZE - 6
      return (
        (y === topY && x >= topStartX && x <= topEndX) ||
        (x === stemX && y >= topY && y <= GRID_SIZE - 6)
      )
    })
  ),

  // Pattern 6: Spiral (challenging - requires careful navigation)
  Array(GRID_SIZE).fill(null).map((_, y) =>
    Array(GRID_SIZE).fill(null).map((_, x) => {
      // Outer ring
      if ((y === 2 || y === 17) && x >= 2 && x <= 17) return true
      if ((x === 2 || x === 17) && y >= 2 && y <= 17) return true
      // Second ring
      if (y === 5 && x >= 5 && x <= 14 && x !== 14) return true
      if (x === 14 && y >= 5 && y <= 14) return true
      if (y === 14 && x >= 5 && x <= 14) return true
      if (x === 5 && y >= 8 && y <= 14) return true
      // Inner spiral
      if (y === 8 && x >= 8 && x <= 11) return true
      if (x === 11 && y >= 8 && y <= 11) return true
      if (y === 11 && x >= 8 && x <= 11) return true
      if (x === 8 && y === 8) return true
      return false
    })
  ),

  // Pattern 7: Checkerboard (hard - non-contiguous)
  Array(GRID_SIZE).fill(null).map((_, y) =>
    Array(GRID_SIZE).fill(null).map((_, x) => {
      // Only in the center area, and checkerboard pattern
      return y >= 4 && y <= 15 && x >= 4 && x <= 15 && (x + y) % 2 === 0
    })
  ),

  // Pattern 8: Concentric Squares (many cells to cover)
  Array(GRID_SIZE).fill(null).map((_, y) =>
    Array(GRID_SIZE).fill(null).map((_, x) => {
      // Outer square
      if ((y === 3 || y === 16) && x >= 3 && x <= 16) return true
      if ((x === 3 || x === 16) && y >= 3 && y <= 16) return true
      // Middle square
      if ((y === 6 || y === 13) && x >= 6 && x <= 13) return true
      if ((x === 6 || x === 13) && y >= 6 && y <= 13) return true
      // Inner square
      if ((y === 9 || y === 10) && x >= 9 && x <= 10) return true
      if ((x === 9 || x === 10) && y >= 9 && y <= 10) return true
      return false
    })
  ),

  // Pattern 9: Zigzag/Stairs (complex path planning)
  Array(GRID_SIZE).fill(null).map((_, y) =>
    Array(GRID_SIZE).fill(null).map((_, x) => {
      // Create a zigzag pattern
      if (y >= 3 && y <= 16) {
        const segment = Math.floor((y - 3) / 2)
        if (segment % 2 === 0) {
          // Right direction
          return x === 3 + segment
        } else {
          // Left direction
          return x === 16 - segment
        }
      }
      return false
    })
  ),

  // Pattern 10: Smiley Face (asymmetric, multiple disconnected parts)
  Array(GRID_SIZE).fill(null).map((_, y) =>
    Array(GRID_SIZE).fill(null).map((_, x) => {
      const centerX = 10
      const centerY = 10
      // Face outline
      const dx = x - centerX
      const dy = y - centerY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (Math.abs(dist - 7) < 0.8) return true

      // Left eye
      if (Math.abs(x - 7) <= 1 && Math.abs(y - 7) <= 1) return true

      // Right eye
      if (Math.abs(x - 13) <= 1 && Math.abs(y - 7) <= 1) return true

      // Smile (arc at bottom)
      if (y >= 12 && y <= 14) {
        const smileDist = Math.abs(x - centerX)
        const expectedY = 12 + smileDist * 0.4
        if (Math.abs(y - expectedY) < 0.8) return true
      }

      return false
    })
  ),
]

export default function PicassoSnake() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE)
  const [laidEggs, setLaidEggs] = useState<Set<string>>(new Set())
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speedMultiplier, setSpeedMultiplier] = useState(1)
  const [timeUntilGrowth, setTimeUntilGrowth] = useState(GROWTH_INTERVAL / 1000) // in seconds
  const [showCompletion, setShowCompletion] = useState(false)

  const directionRef = useRef<Direction>(INITIAL_DIRECTION)
  const confettiShownRef = useRef(false)
  const directionQueueRef = useRef<Direction[]>([])
  const growthTimerRef = useRef<number>(0)

  const currentPattern = PATTERNS[currentPatternIndex]

  // Calculate score: 100 * completed patterns + percentage of current pattern
  const calculateScore = useCallback(() => {
    const completedPatterns = currentPatternIndex
    let matchingCells = 0
    let totalPatternCells = 0

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (currentPattern[y][x]) {
          totalPatternCells++
          const key = `${x},${y}`
          if (laidEggs.has(key)) {
            matchingCells++
          }
        }
      }
    }

    const currentPatternPercentage = totalPatternCells > 0
      ? Math.round((matchingCells / totalPatternCells) * 100)
      : 0

    return completedPatterns * 100 + currentPatternPercentage
  }, [currentPatternIndex, currentPattern, laidEggs])

  const {
    highScore,
    showNewHighScore,
    setScore,
    resetScore,
    triggerNewHighScoreMessage,
    isNewHighScore,
  } = useHighScore('picassonake')

  // Update score whenever laidEggs changes
  useEffect(() => {
    const newScore = calculateScore()
    setScore(newScore)
  }, [laidEggs, currentPatternIndex, calculateScore, setScore])

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE)
    directionRef.current = INITIAL_DIRECTION
    setLaidEggs(new Set())
    setCurrentPatternIndex(0)
    setGameOver(false)
    setIsPaused(false)
    setSpeedMultiplier(1)
    setTimeUntilGrowth(GROWTH_INTERVAL / 1000)
    setShowCompletion(false)
    resetScore()
    confettiShownRef.current = false
    directionQueueRef.current = []
    growthTimerRef.current = 0
    trackGameStart('Picassonake')
  }, [resetScore])

  const handleLayEgg = useCallback(() => {
    if (gameOver || isPaused) return

    const tail = snake[snake.length - 1]
    const key = `${tail.x},${tail.y}`

    setLaidEggs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        // Pick up egg
        newSet.delete(key)
      } else {
        // Lay egg
        newSet.add(key)
        playEatSound()
      }
      return newSet
    })
  }, [gameOver, isPaused, snake])

  // Touch control handlers
  const handleTouchDirection = useCallback((direction: Direction) => {
    initAudio()
    if (gameOver) return

    const queue = directionQueueRef.current
    const lastDir = queue.length > 0 ? queue[queue.length - 1] : directionRef.current

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

  // Keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      initAudio()

      // Handle spacebar
      if (e.key === ' ') {
        e.preventDefault()
        if (showCompletion) {
          // Advance to next pattern
          if (currentPatternIndex < PATTERNS.length - 1) {
            setCurrentPatternIndex(prev => prev + 1)
            setLaidEggs(new Set())
            setSnake(INITIAL_SNAKE)
            directionRef.current = INITIAL_DIRECTION
            setSpeedMultiplier(1)
            setTimeUntilGrowth(GROWTH_INTERVAL / 1000)
            growthTimerRef.current = 0
            setShowCompletion(false)
          } else {
            // Completed all patterns
            resetGame()
          }
        } else if (gameOver) {
          resetGame()
        } else {
          setIsPaused(prev => !prev)
        }
        return
      }

      // Handle Shift for laying eggs
      if (e.key === 'Shift') {
        e.preventDefault()
        handleLayEgg()
        return
      }

      if (gameOver || showCompletion) return

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

      if (newDirection && queue.length < 2) {
        queue.push(newDirection)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameOver, showCompletion, currentPatternIndex, resetGame, handleLayEgg])

  // Countdown timer for growth
  useEffect(() => {
    if (gameOver || isPaused || showCompletion) return

    const timerInterval = setInterval(() => {
      setTimeUntilGrowth(prev => {
        if (prev <= 1) {
          return GROWTH_INTERVAL / 1000
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerInterval)
  }, [gameOver, isPaused, showCompletion])

  // Game loop
  useEffect(() => {
    if (gameOver || isPaused || showCompletion) return

    const currentSpeed = INITIAL_SPEED / speedMultiplier

    const gameLoop = setInterval(() => {
      // Update growth timer
      growthTimerRef.current += currentSpeed

      // Check if it's time to grow and speed up
      if (growthTimerRef.current >= GROWTH_INTERVAL) {
        growthTimerRef.current = 0

        // Grow snake by 1
        setSnake(currentSnake => {
          const tail = currentSnake[currentSnake.length - 1]
          return [...currentSnake, tail]
        })

        // Increase speed (cap at 400%)
        setSpeedMultiplier(prev => Math.min(prev * (1 + SPEED_INCREASE), MAX_SPEED_MULTIPLIER))
      }

      // Process next direction from queue
      if (directionQueueRef.current.length > 0) {
        const nextDir = directionQueueRef.current.shift()!
        directionRef.current = nextDir
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
          playDeathSound()
          return currentSnake
        }

        const newSnake = [newHead, ...currentSnake]
        newSnake.pop() // Always remove tail (no food to eat)
        return newSnake
      })
    }, currentSpeed)

    return () => clearInterval(gameLoop)
  }, [gameOver, isPaused, speedMultiplier, showCompletion])

  // Check for pattern completion
  useEffect(() => {
    if (gameOver || showCompletion) return

    // Check if all pattern cells have eggs
    let matchingCells = 0
    let totalPatternCells = 0

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (currentPattern[y][x]) {
          totalPatternCells++
          const key = `${x},${y}`
          if (laidEggs.has(key)) {
            matchingCells++
          }
        }
      }
    }

    const isComplete = totalPatternCells > 0 && matchingCells === totalPatternCells

    if (isComplete) {
      setShowCompletion(true)
      if (currentPatternIndex === PATTERNS.length - 1) {
        // Completed all patterns!
        playHighScoreSound()
        triggerHighScoreCelebration()
      } else {
        playHighScoreSound()
      }
    }
  }, [laidEggs, gameOver, showCompletion, currentPatternIndex, currentPattern])

  // Show confetti during gameplay when first beating high score
  useEffect(() => {
    const currentScore = calculateScore()
    if (currentScore > highScore && highScore > 0 && !confettiShownRef.current && !gameOver) {
      confettiShownRef.current = true
      triggerHighScoreCelebration()
      playHighScoreSound()
    }
  }, [laidEggs, highScore, gameOver, calculateScore])

  // Show confetti when game ends if high score was beaten
  useEffect(() => {
    if (gameOver && isNewHighScore) {
      triggerGameOverCelebration()
      triggerNewHighScoreMessage()
    }
  }, [gameOver, isNewHighScore, triggerNewHighScoreMessage])

  // Track initial game start
  useEffect(() => {
    trackGameStart('Picassonake')
  }, [])

  // Track game end
  useEffect(() => {
    if (gameOver) {
      trackGameEnd('Picassonake', calculateScore())
    }
  }, [gameOver, calculateScore])

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1f2937'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw pattern overlay (faint boundaries)
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)' // Faint purple
    ctx.lineWidth = 1
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (currentPattern[y][x]) {
          ctx.strokeRect(
            x * CELL_SIZE + 1,
            y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
          )
        }
      }
    }

    // Draw laid eggs
    laidEggs.forEach(key => {
      const [xStr, yStr] = key.split(',')
      const x = parseInt(xStr)
      const y = parseInt(yStr)

      const centerX = x * CELL_SIZE + CELL_SIZE / 2
      const centerY = y * CELL_SIZE + CELL_SIZE / 2
      const eggWidth = CELL_SIZE * 0.7
      const eggHeight = CELL_SIZE * 0.85

      // Draw egg shadow
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

      // Add highlight
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

    // Draw snake
    snake.forEach((segment, index) => {
      const isHead = index === 0
      const isTail = index === snake.length - 1

      if (isHead) {
        // Head - bright green
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
          // X marks for dead eyes
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 2
          const crossSize = 3

          if (directionRef.current.x !== 0) {
            // Horizontal - eyes top/bottom
            ctx.beginPath()
            ctx.moveTo(centerX - crossSize, centerY - eyeOffset - crossSize)
            ctx.lineTo(centerX + crossSize, centerY - eyeOffset + crossSize)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(centerX + crossSize, centerY - eyeOffset - crossSize)
            ctx.lineTo(centerX - crossSize, centerY - eyeOffset + crossSize)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(centerX - crossSize, centerY + eyeOffset - crossSize)
            ctx.lineTo(centerX + crossSize, centerY + eyeOffset + crossSize)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(centerX + crossSize, centerY + eyeOffset - crossSize)
            ctx.lineTo(centerX - crossSize, centerY + eyeOffset + crossSize)
            ctx.stroke()
          } else {
            // Vertical - eyes left/right
            ctx.beginPath()
            ctx.moveTo(centerX - eyeOffset - crossSize, centerY - crossSize)
            ctx.lineTo(centerX - eyeOffset + crossSize, centerY + crossSize)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(centerX - eyeOffset + crossSize, centerY - crossSize)
            ctx.lineTo(centerX - eyeOffset - crossSize, centerY + crossSize)
            ctx.stroke()
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
          // Normal dot eyes
          ctx.fillStyle = '#000000'

          if (directionRef.current.x !== 0) {
            ctx.beginPath()
            ctx.arc(centerX, centerY - eyeOffset, 2, 0, Math.PI * 2)
            ctx.fill()
            ctx.beginPath()
            ctx.arc(centerX, centerY + eyeOffset, 2, 0, Math.PI * 2)
            ctx.fill()
          } else {
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
        // Tail - pointy tip (semi-transparent so user can see where egg will be laid)
        ctx.globalAlpha = 0.5
        ctx.fillStyle = '#166534'

        const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2
        const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2

        if (index > 0) {
          const nextSegment = snake[index - 1]
          const dx = Math.abs(segment.x - nextSegment.x)
          const dy = Math.abs(segment.y - nextSegment.y)

          // Check if tail is wrapping around
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
              const tipX = centerX + tailDirX * (CELL_SIZE / 2)
              ctx.moveTo(tipX, centerY)
              ctx.lineTo(centerX - tailDirX * (CELL_SIZE / 2 - 2), centerY - (CELL_SIZE / 2 - 2))
              ctx.lineTo(centerX - tailDirX * (CELL_SIZE / 2 - 2), centerY + (CELL_SIZE / 2 - 2))
            } else {
              const tipY = centerY + tailDirY * (CELL_SIZE / 2)
              ctx.moveTo(centerX, tipY)
              ctx.lineTo(centerX - (CELL_SIZE / 2 - 2), centerY - tailDirY * (CELL_SIZE / 2 - 2))
              ctx.lineTo(centerX + (CELL_SIZE / 2 - 2), centerY - tailDirY * (CELL_SIZE / 2 - 2))
            }
            ctx.closePath()
            ctx.fill()
          }
        }
        ctx.globalAlpha = 1.0 // Reset opacity
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
  }, [snake, laidEggs, currentPattern, gameOver])

  // Timer color based on remaining time
  let timerColorClass = 'text-purple-400'
  let timerShadow = '0 0 10px #a855f7'
  let shouldPulse = false

  if (timeUntilGrowth <= 5) {
    timerColorClass = 'text-red-400'
    timerShadow = '0 0 10px #ff0000, 0 0 20px #ff0000'
    shouldPulse = true
  } else if (timeUntilGrowth <= 10) {
    timerColorClass = 'text-orange-400'
    timerShadow = '0 0 10px #ff9500'
  } else if (timeUntilGrowth <= 15) {
    timerColorClass = 'text-yellow-400'
    timerShadow = '0 0 10px #ffff00'
  }

  const currentScore = calculateScore()
  const currentPatternPercentage = currentScore % 100

  // Check if device has touch support
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  // Handle completion screen continue
  const handleContinue = useCallback(() => {
    if (currentPatternIndex < PATTERNS.length - 1) {
      setCurrentPatternIndex(prev => prev + 1)
      setLaidEggs(new Set())
      setSnake(INITIAL_SNAKE)
      directionRef.current = INITIAL_DIRECTION
      setSpeedMultiplier(1)
      setTimeUntilGrowth(GROWTH_INTERVAL / 1000)
      growthTimerRef.current = 0
      setShowCompletion(false)
    } else {
      // Completed all patterns
      resetGame()
    }
  }, [currentPatternIndex, resetGame])

  return (
    <>
      {/* Completion Screen */}
      {showCompletion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
          onClick={handleContinue}
        >
          <div className="relative max-w-md mx-4">
            <div className="absolute -inset-1 bg-purple-400 opacity-30 blur-lg"></div>
            <div
              className="relative bg-black border-2 border-purple-500 p-8"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)',
                boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)',
              }}
            >
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-purple-400"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-purple-400"></div>

              <div className="relative">
                <h2
                  className="text-2xl font-bold text-purple-400 uppercase tracking-wider mb-4 text-center"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    textShadow: '0 0 10px #a855f7, 0 0 20px #a855f7',
                  }}
                >
                  {currentPatternIndex === PATTERNS.length - 1 ? 'All Patterns Complete!' : 'Pattern Complete!'}
                </h2>

                <div
                  className="text-purple-300 text-center mb-6"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  <p className="mb-3 text-3xl font-bold">100%</p>
                  <p className="text-sm text-purple-500/70">
                    {currentPatternIndex === PATTERNS.length - 1
                      ? 'You are a true Picasso! All 10 patterns mastered!'
                      : `Pattern ${currentPatternIndex + 1} of ${PATTERNS.length}`}
                  </p>
                </div>

                <div className="text-center">
                  <div
                    className="inline-block px-6 py-2 border border-purple-500/50 text-purple-500/70 text-sm uppercase tracking-wider"
                    style={{ fontFamily: "'Orbitron', sans-serif" }}
                  >
                    {currentPatternIndex === PATTERNS.length - 1
                      ? isTouchDevice ? '[ Tap to Start Over ]' : '[ Press Space to Start Over ]'
                      : isTouchDevice ? '[ Tap to Continue ]' : '[ Press Space to Continue ]'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <GameContainer theme="magenta">
        <GameHeader
          title="Picassonake"
          score={currentScore}
          highScore={highScore}
          theme="magenta"
        />

        {/* Pattern info and timer */}
        <div className="text-center mb-3 md:mb-4">
          <div className="text-sm md:text-base text-purple-300 mb-2">
            Pattern {currentPatternIndex + 1}/{PATTERNS.length} • {currentPatternPercentage}%
          </div>
          <div
            className={`text-2xl md:text-3xl font-bold uppercase tracking-wider ${timerColorClass} ${shouldPulse ? 'animate-pulse' : ''}`}
            style={{
              fontFamily: "'Orbitron', sans-serif",
              textShadow: timerShadow,
            }}
          >
            Growth: {timeUntilGrowth}s
          </div>
          <div className="text-xs md:text-sm text-purple-400/70 mt-1">
            Speed: {Math.round(speedMultiplier * 100)}%
          </div>
        </div>

        {/* Canvas */}
        <div className="flex justify-center">
          <div className="w-full max-w-[600px] relative">
            <canvas
              ref={canvasRef}
              width={GRID_SIZE * CELL_SIZE}
              height={GRID_SIZE * CELL_SIZE}
              className="border-2 border-purple-500/50 w-full h-auto"
              style={{
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)',
                maxWidth: '100%',
                aspectRatio: '1 / 1'
              }}
            />

            <GameOverlay
              gameOver={gameOver}
              isPaused={isPaused}
              showNewHighScore={showNewHighScore}
              onRestart={resetGame}
              theme="magenta"
            />
          </div>
        </div>

        {/* Touch Controls */}
        <TouchControls
          onDirectionChange={handleTouchDirection}
          onPause={handlePause}
          onLayEgg={handleLayEgg}
          showBoost={false}
          showPause={false}
          showLayEgg={true}
          theme="magenta"
        />

        {/* Instructions - only show on desktop */}
        <div className="hidden md:block text-center mt-4 text-purple-300/70 text-xs md:text-sm">
          <p>Press <span className="text-purple-400 font-bold">SHIFT</span> to lay/pick eggs at tail</p>
        </div>
      </GameContainer>
    </>
  )
}
