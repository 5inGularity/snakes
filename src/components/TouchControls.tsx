import { useEffect, useRef, useState } from 'react'

interface TouchControlsProps {
  onDirectionChange: (direction: { x: number; y: number }) => void
  onBoost?: (active: boolean) => void
  onPause?: () => void
  showBoost?: boolean
  showPause?: boolean
}

export function TouchControls({
  onDirectionChange,
  onBoost,
  onPause,
  showBoost = false,
  showPause = true,
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
      const touch = e.touches[0]
      swipeStartRef.current = { x: touch.clientX, y: touch.clientY }
    }

    const handleTouchEnd = (e: TouchEvent) => {
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

    canvas.addEventListener('touchstart', handleTouchStart)
    canvas.addEventListener('touchend', handleTouchEnd)

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isTouchDevice, onDirectionChange])

  // D-Pad button handlers
  const handleDPadPress = (direction: { x: number; y: number }) => {
    onDirectionChange(direction)
  }

  // Boost button handlers
  const handleBoostStart = () => {
    onBoost?.(true)
  }

  const handleBoostEnd = () => {
    onBoost?.(false)
  }

  if (!isTouchDevice) return null

  return (
    <>
      {/* D-Pad */}
      <div className="touch-controls">
        <div className="dpad-container">
          {/* Center */}
          <div className="dpad-center"></div>

          {/* Up */}
          <button
            className="dpad-button dpad-up"
            onTouchStart={() => handleDPadPress({ x: 0, y: -1 })}
            aria-label="Up"
          >
            ▲
          </button>

          {/* Down */}
          <button
            className="dpad-button dpad-down"
            onTouchStart={() => handleDPadPress({ x: 0, y: 1 })}
            aria-label="Down"
          >
            ▼
          </button>

          {/* Left */}
          <button
            className="dpad-button dpad-left"
            onTouchStart={() => handleDPadPress({ x: -1, y: 0 })}
            aria-label="Left"
          >
            ◀
          </button>

          {/* Right */}
          <button
            className="dpad-button dpad-right"
            onTouchStart={() => handleDPadPress({ x: 1, y: 0 })}
            aria-label="Right"
          >
            ▶
          </button>
        </div>
      </div>

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
    </>
  )
}
