import { useEffect, useRef, useState } from 'react'

interface TouchControlsProps {
  onDirectionChange: (direction: { x: number; y: number }) => void
  onBoost?: (active: boolean) => void
  onPause?: () => void
  showBoost?: boolean
  showPause?: boolean
  theme?: 'cyan' | 'magenta'
}

export function TouchControls({
  onDirectionChange,
  onBoost,
  onPause,
  showBoost = false,
  showPause = true,
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

  // Theme colors
  const themeColors = {
    cyan: {
      border: 'rgba(6, 182, 212, 0.5)',
      active: 'rgba(6, 182, 212, 0.3)',
      activeBorder: 'rgb(6, 182, 212)',
      activeText: 'rgb(6, 182, 212)',
    },
    magenta: {
      border: 'rgba(236, 72, 153, 0.5)',
      active: 'rgba(236, 72, 153, 0.3)',
      activeBorder: 'rgb(236, 72, 153)',
      activeText: 'rgb(236, 72, 153)',
    },
  }

  const colors = themeColors[theme]

  if (!isTouchDevice) return null

  return (
    <div className="touch-controls">
      <div className="relative flex items-center justify-center gap-8">
        {/* D-Pad */}
        <div className="dpad-container">
          {/* Up */}
          <button
            className="dpad-button dpad-up"
            onTouchStart={() => handleDPadPress({ x: 0, y: -1 })}
            aria-label="Up"
            style={{
              borderColor: colors.border,
            }}
            onTouchStartCapture={(e) => {
              e.currentTarget.style.background = colors.active
              e.currentTarget.style.borderColor = colors.activeBorder
              e.currentTarget.style.color = colors.activeText
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.background = ''
              e.currentTarget.style.borderColor = colors.border
              e.currentTarget.style.color = ''
            }}
          >
            ▲
          </button>

          {/* Down */}
          <button
            className="dpad-button dpad-down"
            onTouchStart={() => handleDPadPress({ x: 0, y: 1 })}
            aria-label="Down"
            style={{
              borderColor: colors.border,
            }}
            onTouchStartCapture={(e) => {
              e.currentTarget.style.background = colors.active
              e.currentTarget.style.borderColor = colors.activeBorder
              e.currentTarget.style.color = colors.activeText
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.background = ''
              e.currentTarget.style.borderColor = colors.border
              e.currentTarget.style.color = ''
            }}
          >
            ▼
          </button>

          {/* Left */}
          <button
            className="dpad-button dpad-left"
            onTouchStart={() => handleDPadPress({ x: -1, y: 0 })}
            aria-label="Left"
            style={{
              borderColor: colors.border,
            }}
            onTouchStartCapture={(e) => {
              e.currentTarget.style.background = colors.active
              e.currentTarget.style.borderColor = colors.activeBorder
              e.currentTarget.style.color = colors.activeText
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.background = ''
              e.currentTarget.style.borderColor = colors.border
              e.currentTarget.style.color = ''
            }}
          >
            ◀
          </button>

          {/* Right */}
          <button
            className="dpad-button dpad-right"
            onTouchStart={() => handleDPadPress({ x: 1, y: 0 })}
            aria-label="Right"
            style={{
              borderColor: colors.border,
            }}
            onTouchStartCapture={(e) => {
              e.currentTarget.style.background = colors.active
              e.currentTarget.style.borderColor = colors.activeBorder
              e.currentTarget.style.color = colors.activeText
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.background = ''
              e.currentTarget.style.borderColor = colors.border
              e.currentTarget.style.color = ''
            }}
          >
            ▶
          </button>
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
