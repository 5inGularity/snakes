# Snake Game Variants

A collection of 10+ snake game variants hosted at snakes.lalitmishra.in

## Tech Stack

### Core
- **React 18 + TypeScript**
- **Vite** - Fast dev server, excellent code splitting, perfect for Cloudflare Pages

### Routing & Code Splitting
- **TanStack Router** - Type-safe routing with automatic code splitting
  - Each game variant = separate route (e.g., `/classic`, `/3d-snake`, `/speed-mode`)
  - Lazy loading keeps homepage bundle minimal
  - Type safety across all routes

### Styling
- **Tailwind CSS** - Quick UI development for homepage grid, navigation, shared components

### State Management
- **Zustand** - Lightweight, use only where needed in individual games
  - Each variant can manage state independently

### Game-Specific Libraries
- **Three.js** - For 3D variant
- **Canvas API** - For canvas-based variants
- Each variant loads its dependencies independently

### Future Backend Integration
- **TanStack Query** - For API calls (leaderboards/scores)
- **Cloudflare Workers/D1** - Backend API and database

### Developer Experience
- ESLint + TypeScript ESLint
- Prettier

## Deployment

- **Platform**: Cloudflare Pages
- **Domain**: snakes.lalitmishra.in
- **CI/CD**: GitHub integration (auto-deploy on push)

## Architecture

- Homepage with grid layout displaying all game variants
- Independent game logic per variant (no forced common patterns)
- Code splitting ensures homepage stays lightweight
- Different rendering approaches per variant (DOM, Canvas, Three.js)

## Game Variants

- [x] Classic Snake
- [ ] More variants to be added...

## Development Learnings

### Common Utilities

**What to Extract:**
- ✅ Score management (`useHighScore` hook)
- ✅ Celebration logic (`celebration.ts` utils)

**What NOT to Extract:**
- ❌ Keyboard controls (each game may use different inputs)
- ❌ Canvas/rendering (each game may use different rendering methods)
- ❌ Game loop (each game may have different timing/physics)

**Rationale:** Only extract truly universal concerns. Keep game-specific logic flexible.

### Input Handling Pattern

**Problem:** Direct input processing causes issues:
- Lost inputs when user presses keys faster than game tick rate
- 180-degree turn bug (pressing opposite direction between ticks)

**Solution:** Input Queue Pattern
```typescript
// Buffer inputs in a queue (max 2 ahead)
const directionQueueRef = useRef<Direction[]>([])

// Keyboard handler: Add to queue
const lastDir = queue.length > 0 ? queue[queue.length - 1] : directionRef.current
if (isValidDirection(newDir, lastDir)) {
  queue.push(newDir)
}

// Game loop: Process one input per tick
if (directionQueueRef.current.length > 0) {
  const nextDir = directionQueueRef.current.shift()!
  directionRef.current = nextDir
}
```

**Key Points:**
- Validate against **last queued direction**, not current
- Limit queue size (2-3) to prevent over-buffering
- No lost inputs, no invalid moves

### Refs vs State

**Use Refs for:**
- Values read in event handlers/loops without causing re-renders
- Examples: `directionRef`, `confettiShownRef`, `directionQueueRef`

**Use State for:**
- Values that affect rendering
- Examples: `score`, `gameOver`, `snake`, `food`

### Canvas Drawing Gotchas

**Dependency Array:**
Include all state that affects rendering:
```typescript
useEffect(() => {
  // Draw snake, food, etc.
}, [snake, food, gameOver]) // gameOver affects eyes/tongue!
```

**Wraparound Edge Case:**
When implementing edge wrapping, skip drawing disconnected segments:
```typescript
// Check if segment is disconnected from previous (wrapping)
if (index > 0) {
  const prevSegment = snake[index - 1]
  const dx = Math.abs(segment.x - prevSegment.x)
  const dy = Math.abs(segment.y - prevSegment.y)
  if (dx > 1 || dy > 1) return // Skip drawing
}
```

### Visual Feedback on State Changes

Provide clear feedback for game states:
- **Death:** Change eyes (dots → crosses), remove tongue
- **High Score:** Confetti + message with fade-out animation
- **Pause:** Visual indicator

**Pattern:**
```typescript
if (gameOver) {
  // Draw X marks for eyes
} else {
  // Draw normal dot eyes
}
```

### Game Loop Pattern

**Standard Setup:**
```typescript
useEffect(() => {
  if (gameOver || isPaused) return

  const gameLoop = setInterval(() => {
    // 1. Process queued input
    // 2. Update game state
    // 3. Check collisions
    // 4. Update score
  }, GAME_SPEED)

  return () => clearInterval(gameLoop)
}, [dependencies])
```

**Remember:**
- Always cleanup interval in return function
- Respect pause and game over states
- Process ONE input per tick (from queue)
