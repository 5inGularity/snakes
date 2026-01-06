import { useEffect, useRef, useState } from 'react'

interface JoystickProps {
  onDirectionChange: (direction: { x: number; y: number }) => void
  theme?: 'cyan' | 'magenta'
  size?: number
}

type Direction = 'up' | 'down' | 'left' | 'right' | null

export function Joystick({ onDirectionChange, theme = 'cyan', size = 120 }: JoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [thumbPosition, setThumbPosition] = useState({ x: 0, y: 0 })
  const [activeDirection, setActiveDirection] = useState<Direction>(null)
  const lastEmittedDirectionRef = useRef<Direction>(null)
  const touchIdRef = useRef<number | null>(null)

  const DEAD_ZONE = 0.3 // 30% of radius
  const HYSTERESIS = 0.1 // Extra 10% to cross when changing directions

  // Theme colors
  const themeColors = {
    cyan: {
      border: 'rgba(6, 182, 212, 0.5)',
      active: 'rgba(6, 182, 212, 0.3)',
      activeBorder: 'rgb(6, 182, 212)',
      thumb: 'rgb(6, 182, 212)',
      quadrant: 'rgba(6, 182, 212, 0.2)',
    },
    magenta: {
      border: 'rgba(236, 72, 153, 0.5)',
      active: 'rgba(236, 72, 153, 0.3)',
      activeBorder: 'rgb(236, 72, 153)',
      thumb: 'rgb(236, 72, 153)',
      quadrant: 'rgba(236, 72, 153, 0.2)',
    },
  }

  const colors = themeColors[theme]
  const radius = size / 2
  const thumbSize = size * 0.35

  const calculateDirection = (x: number, y: number): Direction => {
    const distance = Math.sqrt(x * x + y * y)
    const normalizedDistance = distance / radius

    // Dead zone check
    const threshold = lastEmittedDirectionRef.current !== null
      ? DEAD_ZONE - HYSTERESIS // Easier to return to center
      : DEAD_ZONE + HYSTERESIS // Harder to activate initially

    if (normalizedDistance < threshold) {
      return null
    }

    // Calculate angle in degrees (0° = right, 90° = down, 180° = left, 270° = up)
    const angle = Math.atan2(y, x) * (180 / Math.PI)

    // Convert to 0-360 range
    const normalizedAngle = angle < 0 ? angle + 360 : angle

    // Map to cardinal directions with 45° sectors centered on diagonals
    // This makes it harder to accidentally change direction
    if (normalizedAngle >= 315 || normalizedAngle < 45) {
      return 'right'
    } else if (normalizedAngle >= 45 && normalizedAngle < 135) {
      return 'down'
    } else if (normalizedAngle >= 135 && normalizedAngle < 225) {
      return 'left'
    } else {
      return 'up'
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    if (touchIdRef.current !== null) return // Only handle one touch

    const touch = e.touches[0]
    touchIdRef.current = touch.identifier
    setIsActive(true)

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const x = touch.clientX - centerX
    const y = touch.clientY - centerY

    updateThumbPosition(x, y)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (touchIdRef.current === null) return

    const touch = Array.from(e.touches).find(t => t.identifier === touchIdRef.current)
    if (!touch) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const x = touch.clientX - centerX
    const y = touch.clientY - centerY

    updateThumbPosition(x, y)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()

    // Check if our tracked touch ended
    const endedTouch = Array.from(e.changedTouches).find(
      t => t.identifier === touchIdRef.current
    )

    if (endedTouch) {
      touchIdRef.current = null
      setIsActive(false)
      setThumbPosition({ x: 0, y: 0 })
      setActiveDirection(null)
      lastEmittedDirectionRef.current = null
    }
  }

  const updateThumbPosition = (x: number, y: number) => {
    // Constrain thumb to circle
    const distance = Math.sqrt(x * x + y * y)
    const maxDistance = radius - thumbSize / 2

    let constrainedX = x
    let constrainedY = y

    if (distance > maxDistance) {
      const ratio = maxDistance / distance
      constrainedX = x * ratio
      constrainedY = y * ratio
    }

    setThumbPosition({ x: constrainedX, y: constrainedY })

    // Calculate and emit direction
    const direction = calculateDirection(constrainedX, constrainedY)
    setActiveDirection(direction)

    // Only emit if direction changed
    if (direction !== lastEmittedDirectionRef.current) {
      lastEmittedDirectionRef.current = direction

      if (direction === 'up') onDirectionChange({ x: 0, y: -1 })
      else if (direction === 'down') onDirectionChange({ x: 0, y: 1 })
      else if (direction === 'left') onDirectionChange({ x: -1, y: 0 })
      else if (direction === 'right') onDirectionChange({ x: 1, y: 0 })
    }
  }

  // Prevent default touch behavior on the component
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const preventDefault = (e: TouchEvent) => {
      e.preventDefault()
    }

    container.addEventListener('touchstart', preventDefault, { passive: false })
    container.addEventListener('touchmove', preventDefault, { passive: false })
    container.addEventListener('touchend', preventDefault, { passive: false })

    return () => {
      container.removeEventListener('touchstart', preventDefault)
      container.removeEventListener('touchmove', preventDefault)
      container.removeEventListener('touchend', preventDefault)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative touch-none select-none"
      style={{
        width: size,
        height: size,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Base circle */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `2px solid ${isActive ? colors.activeBorder : colors.border}`,
          background: isActive ? colors.active : 'transparent',
        }}
      />

      {/* Quadrant indicators */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Up quadrant */}
        <div
          className="absolute"
          style={{
            top: '15%',
            width: '30%',
            height: '30%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activeDirection === 'up' ? colors.quadrant : 'transparent',
            borderRadius: '50%',
            transition: 'background 100ms ease-out',
          }}
        >
          <span
            style={{
              fontSize: size * 0.2,
              opacity: activeDirection === 'up' ? 1 : 0.3,
              color: colors.thumb,
              transition: 'opacity 100ms ease-out',
            }}
          >
            ▲
          </span>
        </div>

        {/* Down quadrant */}
        <div
          className="absolute"
          style={{
            bottom: '15%',
            width: '30%',
            height: '30%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activeDirection === 'down' ? colors.quadrant : 'transparent',
            borderRadius: '50%',
            transition: 'background 100ms ease-out',
          }}
        >
          <span
            style={{
              fontSize: size * 0.2,
              opacity: activeDirection === 'down' ? 1 : 0.3,
              color: colors.thumb,
              transition: 'opacity 100ms ease-out',
            }}
          >
            ▼
          </span>
        </div>

        {/* Left quadrant */}
        <div
          className="absolute"
          style={{
            left: '15%',
            width: '30%',
            height: '30%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activeDirection === 'left' ? colors.quadrant : 'transparent',
            borderRadius: '50%',
            transition: 'background 100ms ease-out',
          }}
        >
          <span
            style={{
              fontSize: size * 0.2,
              opacity: activeDirection === 'left' ? 1 : 0.3,
              color: colors.thumb,
              transition: 'opacity 100ms ease-out',
            }}
          >
            ◀
          </span>
        </div>

        {/* Right quadrant */}
        <div
          className="absolute"
          style={{
            right: '15%',
            width: '30%',
            height: '30%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activeDirection === 'right' ? colors.quadrant : 'transparent',
            borderRadius: '50%',
            transition: 'background 100ms ease-out',
          }}
        >
          <span
            style={{
              fontSize: size * 0.2,
              opacity: activeDirection === 'right' ? 1 : 0.3,
              color: colors.thumb,
              transition: 'opacity 100ms ease-out',
            }}
          >
            ▶
          </span>
        </div>
      </div>

      {/* Thumb/stick */}
      <div
        className="absolute rounded-full transition-all duration-100 ease-out"
        style={{
          width: thumbSize,
          height: thumbSize,
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${thumbPosition.x}px), calc(-50% + ${thumbPosition.y}px))`,
          background: isActive ? colors.thumb : colors.border,
          boxShadow: isActive
            ? `0 0 20px ${colors.thumb}, 0 0 10px ${colors.thumb}`
            : `0 0 10px ${colors.border}`,
          border: `2px solid ${isActive ? colors.activeBorder : colors.border}`,
        }}
      />

      {/* Center dot (dead zone indicator) */}
      <div
        className="absolute rounded-full"
        style={{
          width: radius * DEAD_ZONE * 2,
          height: radius * DEAD_ZONE * 2,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          border: `1px dashed ${colors.border}`,
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
