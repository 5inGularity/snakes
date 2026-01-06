import { useEffect, useRef, useState } from 'react'
import { Joystick } from './Joystick'

interface TouchControlsProps {
  onDirectionChange: (direction: { x: number; y: number }) => void
  onBoost?: (active: boolean) => void
  onPause?: () => void
  onLayEgg?: () => void
  showBoost?: boolean
  showPause?: boolean
  showLayEgg?: boolean
  theme?: 'cyan' | 'magenta'
}

export function TouchControls({
  onDirectionChange,
  onBoost,
  onPause,
  onLayEgg,
  showBoost = false,
  showPause = true,
  showLayEgg = false,
  theme = 'cyan',
}: TouchControlsProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)
  const canvasRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Detect touch device
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)

    // Get the game canvas for swipe detection
    canvasRef.current = document.querySelector('canvas')
  }, [])

  // Swipe detection
  useEffect(() => {
    if (!isTouchDevice || !canvasRef.current) return

    const canvas = canvasRef.current

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault() // Prevent scrolling
      const touch = e.touches[0]
      swipeStartRef.current = { x: touch.clientX, y: touch.clientY }
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault() // Prevent scrolling while swiping
    }

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault() // Prevent scrolling
      if (!swipeStartRef.current) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - swipeStartRef.current.x
      const deltaY = touch.clientY - swipeStartRef.current.y
      const minSwipeDistance = 30

      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        // Horizontal swipe
        if (deltaX > 0) {
          onDirectionChange({ x: 1, y: 0 }) // Right
        } else {
          onDirectionChange({ x: -1, y: 0 }) // Left
        }
      } else if (Math.abs(deltaY) > minSwipeDistance) {
        // Vertical swipe
        if (deltaY > 0) {
          onDirectionChange({ x: 0, y: 1 }) // Down
        } else {
          onDirectionChange({ x: 0, y: -1 }) // Up
        }
      }

      swipeStartRef.current = null
    }

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isTouchDevice, onDirectionChange])

  // Boost button handlers
  const handleBoostStart = () => {
    onBoost?.(true)
  }

  const handleBoostEnd = () => {
    onBoost?.(false)
  }


  if (!isTouchDevice) return null

  return (
    <div className="touch-controls">
      <div className="relative flex items-center justify-center gap-8">
        {/* Joystick */}
        <Joystick onDirectionChange={onDirectionChange} theme={theme} />

        {/* Boost Button */}
        {showBoost && onBoost && (
          <button
            className="boost-button"
            onTouchStart={handleBoostStart}
            onTouchEnd={handleBoostEnd}
            aria-label="Boost"
          >
            ⚡
          </button>
        )}

        {/* Lay Egg Button */}
        {showLayEgg && onLayEgg && (
          <button
            className="boost-button"
            onClick={onLayEgg}
            aria-label="Lay Egg"
          >
            🥚
          </button>
        )}
      </div>

      {/* Pause Button */}
      {showPause && onPause && (
        <button
          className="pause-button"
          onClick={onPause}
          aria-label="Pause"
        >
          ⏸
        </button>
      )}
    </div>
  )
}
