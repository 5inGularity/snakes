import { useState, useEffect, useRef } from 'react'

interface UseHighScoreReturn {
  score: number
  highScore: number
  showNewHighScore: boolean
  setScore: (score: number | ((prev: number) => number)) => void
  incrementScore: (amount: number) => void
  resetScore: () => void
  triggerNewHighScoreMessage: () => void
  isNewHighScore: boolean
}

export function useHighScore(gameId: string): UseHighScoreReturn {
  const HIGH_SCORE_KEY = `snakes_highscore_${gameId}`

  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem(HIGH_SCORE_KEY)
    return saved ? parseInt(saved, 10) : 0
  })
  const [showNewHighScore, setShowNewHighScore] = useState(false)

  const gameStartHighScoreRef = useRef(highScore)

  // Update high score in real-time
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem(HIGH_SCORE_KEY, score.toString())
    }
  }, [score, highScore, HIGH_SCORE_KEY])

  const incrementScore = (amount: number) => {
    setScore(prev => prev + amount)
  }

  const resetScore = () => {
    setScore(0)
    setShowNewHighScore(false)
    gameStartHighScoreRef.current = highScore
  }

  const triggerNewHighScoreMessage = () => {
    setShowNewHighScore(true)
    setTimeout(() => setShowNewHighScore(false), 3000)
  }

  const isNewHighScore = highScore > gameStartHighScoreRef.current

  return {
    score,
    highScore,
    showNewHighScore,
    setScore,
    incrementScore,
    resetScore,
    triggerNewHighScoreMessage,
    isNewHighScore,
  }
}
