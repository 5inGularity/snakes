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

- [ ] Classic Snake
- [ ] More variants to be added...
