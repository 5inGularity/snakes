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
