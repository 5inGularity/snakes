import confetti from 'canvas-confetti'

interface CelebrationOptions {
  colors?: string[]
  particleCount?: number
  spread?: number
  origin?: { x?: number; y?: number }
}

const DEFAULT_COLORS = ['#10b981', '#22c55e', '#fbbf24', '#f59e0b']

export function triggerHighScoreCelebration(options?: CelebrationOptions) {
  confetti({
    particleCount: options?.particleCount ?? 50,
    spread: options?.spread ?? 60,
    origin: options?.origin ?? { x: 0.8, y: 0.2 },
    colors: options?.colors ?? DEFAULT_COLORS,
  })
}

export function triggerGameOverCelebration(options?: CelebrationOptions) {
  confetti({
    particleCount: options?.particleCount ?? 100,
    spread: options?.spread ?? 70,
    origin: options?.origin ?? { y: 0.6 },
    colors: options?.colors ?? DEFAULT_COLORS,
  })
}
