# Snake Game Variants

## Classic Snake

The traditional snake game with simple mechanics.

**Rules:**
- Eat white eggs to grow your snake by 1 segment
- Each egg gives you 10 points
- Die if you collide with yourself
- Board wraps around edges

**Controls:**
- Arrow keys to move
- Space to pause/restart

---

## Adder Snake

A strategic variant where eggs have different values that affect your snake's length.

**Rules:**
- **Green eggs (+1 to +5)**: Snake jumps forward by the egg's value and grows
- **Red eggs (-1 to -5)**: Snake moves normally but shrinks from the tail by the egg's value
- Your score equals your current length minus starting length (net growth)
- Die if your length drops below 2 or you collide with yourself
- When either egg is eaten, both respawn with new random values
- Board wraps around edges

**Strategy:**
- Prioritize green eggs to maximize growth
- Sometimes you must eat red eggs to survive, but it costs you score
- Balance risk vs reward when navigating between eggs

**Controls:**
- Arrow keys to move
- Space to pause/restart

---

## Picassonake

A creative puzzle variant where you paint patterns with eggs laid by your snake's tail.

**Rules:**
- A faint pattern overlay shows which cells need eggs
- Press **Shift** to lay/pick up an egg at your tail position
- Snake grows automatically every 30 seconds
- Speed increases by 10% every 30 seconds (capped at 400%)
- Complete a pattern by achieving 100% match to unlock the next one
- Score = (100 × completed patterns) + current pattern percentage
- Die if you collide with yourself
- Board wraps around edges
- 10 patterns total:
  - **Easy (1-5):** Cross, Square, Diagonal, Diamond, T-shape
  - **Hard (6-10):** Spiral, Checkerboard, Concentric Squares, Zigzag, Smiley Face

**Strategy:**
- Plan your path to cover all pattern cells efficiently
- Use the automatic growth strategically - more length means more maneuverability
- As speed increases, precise egg placement becomes more challenging
- Pick up incorrectly placed eggs to correct mistakes

**Controls:**
- Arrow keys to move
- **Shift** to lay/pick up egg at tail position
- Space to pause/restart or advance to next pattern
