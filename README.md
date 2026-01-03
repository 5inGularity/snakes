# Snake//Arcade

A collection of snake game variants with a retro Tron-inspired aesthetic.

📖 **[Game Rules & Descriptions](GAMES.md)** - Learn how to play each variant

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

For analytics (optional):

```bash
VITE_PUBLIC_POSTHOG_KEY=your_posthog_key
VITE_PUBLIC_POSTHOG_HOST=your_posthog_host
```

Analytics are disabled if environment variables are not provided.

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
- **Tailwind CSS** - Tron-inspired neon aesthetic with responsive design
- **Custom Fonts** - Orbitron for retro-futuristic feel

### Rendering
- **Canvas API** - High-performance 2D rendering for all games
- Custom drawing logic for snake segments, eggs, and visual effects

### Analytics
- **PostHog** - Privacy-focused game analytics
  - Tracks game starts and completions
  - No session recording or invasive tracking
  - Optional (disabled without env vars)

### Developer Experience
- ESLint + TypeScript ESLint
- Prettier

## Project Structure

```
src/
├── components/          # Shared UI components
│   ├── GameContainer.tsx
│   ├── GameHeader.tsx
│   ├── GameOverlay.tsx
│   └── TouchControls.tsx
├── games/              # Game implementations
│   ├── ClassicSnake.tsx
│   ├── AdderSnake.tsx
│   └── TimeTrialSnake.tsx
├── hooks/              # Custom React hooks
│   └── useHighScore.ts
├── lib/                # Utilities
│   └── analytics.ts
├── routes/             # TanStack Router routes
│   ├── __root.tsx
│   ├── index.tsx       # Home page
│   ├── classic.tsx
│   ├── adder.tsx
│   └── time-trial.tsx
└── utils/              # Helper functions
    └── celebration.ts
```

## Features

### UI/UX
- 📱 **Responsive Design**: Works seamlessly on mobile and desktop
- 🎮 **Touch Controls**: On-screen d-pad for mobile gameplay
- ⌨️ **Keyboard Controls**: Arrow keys for movement, Space to pause
- 🎨 **Tron Aesthetic**: Neon glow effects, scanlines, retro-futuristic design
- 📏 **Fluid Typography**: Title scales with viewport on small screens

### Gameplay
- 🎯 **High Scores**: Persistent local storage per game variant
- 🎉 **Visual Feedback**: Confetti celebrations on high scores
- 🥚 **Realistic Eggs**: Gradient-filled, egg-shaped (not flat ellipses)
- 🎮 **Smooth Controls**: Input queue prevents lost commands

### Technical
- 🌐 **Fast Loading**: Code splitting per game route
- 📊 **Privacy-First Analytics**: Optional PostHog tracking (game starts/ends only)
- ⚡ **Performance**: Canvas rendering at 60 FPS
- 🔧 **Type Safety**: Full TypeScript coverage

## Deployment

- **Platform**: Cloudflare Pages
- **CI/CD**: Auto-deploy on push to main
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## Architecture

- Homepage with grid layout displaying all game variants
- Independent game logic per variant (no forced common patterns)
- Code splitting ensures homepage stays lightweight
- Different rendering approaches per variant (DOM, Canvas, Three.js)

## Game Variants

### 🐍 Classic Snake
Traditional snake game where you grow by eating eggs. Simple, timeless gameplay.
- Eat white eggs to grow
- Avoid walls and yourself
- Beat your high score

### ⚡ Adder Snake
Strategic variant with positive and negative eggs that affect your length.
- **Green eggs (+1 to +5)**: Snake jumps forward and grows
- **Red eggs (-1 to -5)**: Snake shrinks from the tail
- Manage your length carefully
- Both eggs respawn when either is eaten

### ⏱️ Time Trial
Race against the clock! Collect eggs before time runs out.
- Start with 30 seconds
- White eggs: +10 points
- Golden eggs: +5 seconds (spawn randomly)
- Hold Shift to boost (3x speed)
- Eggs vanish after 5 seconds

See [GAMES.md](GAMES.md) for detailed rules and strategies.

## Recent Improvements

### Visual Enhancements
- **Egg Redesign**: Eggs now have proper egg shape (narrower at top, wider at bottom) instead of simple ellipses
- **Gradient Effects**: Linear gradients add depth to eggs (white, golden, green, red variants)
- **Size Optimization**: Reduced egg height from 110% to 85% of cell size to prevent clipping at edges
- **Enhanced Shadows**: Deeper, more realistic shadows on all eggs

### Responsive Design
- **Mobile Title Fix**: Home page title uses `clamp()` for fluid scaling on small screens
- **Touch-Friendly**: Large touch targets for mobile controls
- **Viewport Optimization**: Content adapts smoothly from 320px to 4K displays

### Analytics Integration
- **PostHog Setup**: Privacy-focused analytics with minimal tracking
- **Event Tracking**: `game_started` and `game_ended` events with score
- **Zero Overhead**: Analytics disabled when env vars not provided
- **No Session Recording**: Respects user privacy
- **Type Safety**: Custom `vite-env.d.ts` for environment variable types

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
