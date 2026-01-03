import { useCallback, useEffect, useRef, useState } from "react";
import { useHighScore } from "../hooks/useHighScore";
import {
  triggerHighScoreCelebration,
  triggerGameOverCelebration,
} from "../utils/celebration";
import { TouchControls } from "../components/TouchControls";
import { GameContainer } from "../components/GameContainer";
import { GameHeader } from "../components/GameHeader";
import { GameOverlay } from "../components/GameOverlay";
import { trackGameStart, trackGameEnd } from "../lib/analytics";

const GRID_SIZE = 20;
const CELL_SIZE = 30;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const NORMAL_SPEED = 100;
const BOOST_SPEED = 33;
const INITIAL_TIME = 30;
const REGULAR_EGG_SPAWN_INTERVAL = 2000;
const TIME_EGG_MIN_INTERVAL = 8000;
const TIME_EGG_MAX_INTERVAL = 18000;
const EGG_LIFETIME = 5000;
const TIME_EXTENSION_AMOUNT = 5;
const REGULAR_EGG_POINTS = 10;

type Position = { x: number; y: number };
type Direction = { x: number; y: number };
type EggType = "regular" | "time-extension";
type Egg = {
  id: string;
  position: Position;
  type: EggType;
  spawnTime: number;
};

function generateValidPosition(
  currentSnake: Position[],
  existingEggs: Egg[]
): Position {
  let newPos: Position;
  do {
    newPos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (
    currentSnake.some(
      (segment) => segment.x === newPos.x && segment.y === newPos.y
    ) ||
    existingEggs.some(
      (egg) => egg.position.x === newPos.x && egg.position.y === newPos.y
    )
  );
  return newPos;
}

export default function TimeTrialSnake() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [eggs, setEggs] = useState<Egg[]>(() => [
    {
      id: `regular-initial`,
      position: generateValidPosition(INITIAL_SNAKE, []),
      type: "regular",
      spawnTime: Date.now(),
    },
  ]);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(INITIAL_TIME);
  const [isBoosting, setIsBoosting] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const directionRef = useRef<Direction>(INITIAL_DIRECTION);
  const confettiShownRef = useRef(false);
  const directionQueueRef = useRef<Direction[]>([]);
  const regularEggTimerRef = useRef<number>(0);
  const timeExtensionTimerRef = useRef<number>(0);
  const nextTimeExtensionIntervalRef = useRef<number>(TIME_EGG_MIN_INTERVAL);
  const shiftKeyDownRef = useRef(false);

  const {
    score,
    highScore,
    showNewHighScore,
    incrementScore,
    resetScore,
    triggerNewHighScoreMessage,
    isNewHighScore,
  } = useHighScore("time-trial");

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    directionRef.current = INITIAL_DIRECTION;

    // Spawn initial egg
    const initialEgg: Egg = {
      id: `regular-${Date.now()}`,
      position: generateValidPosition(INITIAL_SNAKE, []),
      type: "regular",
      spawnTime: Date.now(),
    };
    setEggs([initialEgg]);

    setGameOver(false);
    setIsPaused(false);
    setTimeRemaining(INITIAL_TIME);
    setIsBoosting(false);
    resetScore();
    confettiShownRef.current = false;
    directionQueueRef.current = [];
    regularEggTimerRef.current = 0;
    timeExtensionTimerRef.current = 0;
    nextTimeExtensionIntervalRef.current = TIME_EGG_MIN_INTERVAL;
    shiftKeyDownRef.current = false;
    trackGameStart('Time Trial');
  }, [resetScore]);

  // Touch control handlers
  const handleTouchDirection = useCallback(
    (direction: Direction) => {
      if (gameOver) return;

      const queue = directionQueueRef.current;
      const lastDir =
        queue.length > 0 ? queue[queue.length - 1] : directionRef.current;

      // Prevent 180° turns (same logic as keyboard)
      if (
        (direction.x !== 0 && lastDir.x === 0 && lastDir.y !== 0) ||
        (direction.y !== 0 && lastDir.y === 0 && lastDir.x !== 0)
      ) {
        if (queue.length < 2) {
          queue.push(direction);
        }
      }
    },
    [gameOver]
  );

  const handleBoost = useCallback(
    (active: boolean) => {
      if (!gameOver && !isPaused) {
        setIsBoosting(active);
      }
    },
    [gameOver, isPaused]
  );

  const handlePause = useCallback(() => {
    if (gameOver) {
      resetGame();
    } else {
      setIsPaused((prev) => !prev);
    }
  }, [gameOver, resetGame]);

  // Hint dismissal
  useEffect(() => {
    if (!showHint) return;

    // Auto-dismiss on mobile (where hint isn't shown)
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setShowHint(false);
      return;
    }

    const handleHintDismiss = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setShowHint(false);
      }
    };

    window.addEventListener("keydown", handleHintDismiss);
    return () => window.removeEventListener("keydown", handleHintDismiss);
  }, [showHint]);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle spacebar for pause/restart
      if (e.key === " ") {
        e.preventDefault();
        if (gameOver) {
          resetGame();
        } else {
          setIsPaused((prev) => !prev);
        }
        return;
      }

      // Handle Shift for boost
      if (e.key === "Shift") {
        e.preventDefault();
        shiftKeyDownRef.current = true;
        if (!gameOver && !isPaused) {
          setIsBoosting(true);
        }
        return;
      }

      if (gameOver) return;

      // Get the last direction in queue or current direction
      const queue = directionQueueRef.current;
      const lastDir =
        queue.length > 0 ? queue[queue.length - 1] : directionRef.current;

      let newDirection: Direction | null = null;

      switch (e.key) {
        case "ArrowUp":
          if (lastDir.y === 0) {
            newDirection = { x: 0, y: -1 };
          }
          break;
        case "ArrowDown":
          if (lastDir.y === 0) {
            newDirection = { x: 0, y: 1 };
          }
          break;
        case "ArrowLeft":
          if (lastDir.x === 0) {
            newDirection = { x: -1, y: 0 };
          }
          break;
        case "ArrowRight":
          if (lastDir.x === 0) {
            newDirection = { x: 1, y: 0 };
          }
          break;
      }

      // Add to queue if valid and queue isn't too long (max 2 buffered inputs)
      if (newDirection && queue.length < 2) {
        queue.push(newDirection);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        shiftKeyDownRef.current = false;
        setIsBoosting(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameOver, isPaused, resetGame]);

  // Timer countdown (separate interval, 1 second tick)
  useEffect(() => {
    if (gameOver || isPaused || showHint) return;

    const timerInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [gameOver, isPaused]);

  // Game loop with dynamic speed
  useEffect(() => {
    if (gameOver || isPaused || showHint) return;

    const currentSpeed = isBoosting ? BOOST_SPEED : NORMAL_SPEED;

    const gameLoop = setInterval(() => {
      // Update egg spawn timers
      regularEggTimerRef.current += currentSpeed;
      timeExtensionTimerRef.current += currentSpeed;

      // Spawn regular egg if needed
      if (regularEggTimerRef.current >= REGULAR_EGG_SPAWN_INTERVAL) {
        regularEggTimerRef.current = 0;
        setEggs((prev) => {
          const newEgg: Egg = {
            id: `regular-${Date.now()}`,
            position: generateValidPosition(snake, prev),
            type: "regular",
            spawnTime: Date.now(),
          };
          return [...prev, newEgg];
        });
      }

      // Spawn time-extension egg if needed
      if (
        timeExtensionTimerRef.current >= nextTimeExtensionIntervalRef.current
      ) {
        timeExtensionTimerRef.current = 0;

        // Calculate next interval with semi-random feel
        const base = TIME_EGG_MIN_INTERVAL;
        const range = TIME_EGG_MAX_INTERVAL - TIME_EGG_MIN_INTERVAL;
        const randomFactor = Math.pow(Math.random(), 0.7);
        nextTimeExtensionIntervalRef.current = base + range * randomFactor;

        setEggs((prev) => {
          const newEgg: Egg = {
            id: `time-${Date.now()}`,
            position: generateValidPosition(snake, prev),
            type: "time-extension",
            spawnTime: Date.now(),
          };
          return [...prev, newEgg];
        });
      }

      // Remove expired eggs (5 second lifetime)
      setEggs((prev) => {
        const now = Date.now();
        return prev.filter((egg) => now - egg.spawnTime < EGG_LIFETIME);
      });

      // Process next direction from queue
      if (directionQueueRef.current.length > 0) {
        const nextDir = directionQueueRef.current.shift()!;
        directionRef.current = nextDir;
      }

      // Move snake and check collisions
      setSnake((currentSnake) => {
        const head = currentSnake[0];
        const newHead = {
          x: (head.x + directionRef.current.x + GRID_SIZE) % GRID_SIZE,
          y: (head.y + directionRef.current.y + GRID_SIZE) % GRID_SIZE,
        };

        // Check collision with self
        if (
          currentSnake.some(
            (segment) => segment.x === newHead.x && segment.y === newHead.y
          )
        ) {
          setGameOver(true);
          return currentSnake;
        }

        const newSnake = [newHead, ...currentSnake];

        // Check if egg is eaten
        const eatenEgg = eggs.find(
          (egg) => egg.position.x === newHead.x && egg.position.y === newHead.y
        );

        if (eatenEgg) {
          if (eatenEgg.type === "regular") {
            incrementScore(REGULAR_EGG_POINTS);
          } else {
            // time-extension egg
            setTimeRemaining((prev) =>
              Math.min(prev + TIME_EXTENSION_AMOUNT, 99)
            );
          }

          // Remove eaten egg
          setEggs((prev) => prev.filter((e) => e.id !== eatenEgg.id));

          // Snake grows (don't pop tail)
          return newSnake;
        }

        // No egg eaten - remove tail
        newSnake.pop();
        return newSnake;
      });
    }, currentSpeed);

    return () => clearInterval(gameLoop);
  }, [eggs, gameOver, isPaused, isBoosting, incrementScore, snake]);

  // Show confetti during gameplay when first beating high score
  useEffect(() => {
    if (
      isNewHighScore &&
      highScore > 0 &&
      !confettiShownRef.current &&
      !gameOver
    ) {
      confettiShownRef.current = true;
      triggerHighScoreCelebration();
    }
  }, [isNewHighScore, highScore, gameOver]);

  // Show confetti when game ends if high score was beaten
  useEffect(() => {
    if (gameOver && isNewHighScore) {
      triggerGameOverCelebration();
      triggerNewHighScoreMessage();
    }
  }, [gameOver, isNewHighScore, triggerNewHighScoreMessage]);

  // Track initial game start
  useEffect(() => {
    trackGameStart('Time Trial');
  }, []);

  // Track game end
  useEffect(() => {
    if (gameOver) {
      trackGameEnd('Time Trial', score);
    }
  }, [gameOver, score]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      const isTail = index === snake.length - 1;

      if (isHead) {
        // Head - bright green with rounded corners
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.roundRect(
          segment.x * CELL_SIZE + 2,
          segment.y * CELL_SIZE + 2,
          CELL_SIZE - 4,
          CELL_SIZE - 4,
          4
        );
        ctx.fill();

        const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;

        // Draw eyes
        const eyeOffset = 4;

        if (gameOver) {
          // Draw X marks for dead eyes
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          const crossSize = 3;

          if (directionRef.current.x !== 0) {
            // Moving horizontally - eyes on top and bottom
            // Top eye X
            ctx.beginPath();
            ctx.moveTo(centerX - crossSize, centerY - eyeOffset - crossSize);
            ctx.lineTo(centerX + crossSize, centerY - eyeOffset + crossSize);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(centerX + crossSize, centerY - eyeOffset - crossSize);
            ctx.lineTo(centerX - crossSize, centerY - eyeOffset + crossSize);
            ctx.stroke();
            // Bottom eye X
            ctx.beginPath();
            ctx.moveTo(centerX - crossSize, centerY + eyeOffset - crossSize);
            ctx.lineTo(centerX + crossSize, centerY + eyeOffset + crossSize);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(centerX + crossSize, centerY + eyeOffset - crossSize);
            ctx.lineTo(centerX - crossSize, centerY + eyeOffset + crossSize);
            ctx.stroke();
          } else {
            // Moving vertically - eyes on left and right
            // Left eye X
            ctx.beginPath();
            ctx.moveTo(centerX - eyeOffset - crossSize, centerY - crossSize);
            ctx.lineTo(centerX - eyeOffset + crossSize, centerY + crossSize);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(centerX - eyeOffset + crossSize, centerY - crossSize);
            ctx.lineTo(centerX - eyeOffset - crossSize, centerY + crossSize);
            ctx.stroke();
            // Right eye X
            ctx.beginPath();
            ctx.moveTo(centerX + eyeOffset - crossSize, centerY - crossSize);
            ctx.lineTo(centerX + eyeOffset + crossSize, centerY + crossSize);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(centerX + eyeOffset + crossSize, centerY - crossSize);
            ctx.lineTo(centerX + eyeOffset - crossSize, centerY + crossSize);
            ctx.stroke();
          }
        } else {
          // Draw normal dot eyes
          ctx.fillStyle = "#000000";

          if (directionRef.current.x !== 0) {
            // Moving horizontally - eyes on top and bottom
            ctx.beginPath();
            ctx.arc(centerX, centerY - eyeOffset, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX, centerY + eyeOffset, 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Moving vertically - eyes on left and right
            ctx.beginPath();
            ctx.arc(centerX - eyeOffset, centerY, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + eyeOffset, centerY, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Draw tongue (only when alive)
        if (!gameOver) {
          ctx.fillStyle = "#ef4444";
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2;

          const tongueLength = 6;
          const tongueStartX =
            centerX + directionRef.current.x * (CELL_SIZE / 2 - 2);
          const tongueStartY =
            centerY + directionRef.current.y * (CELL_SIZE / 2 - 2);
          const tongueEndX =
            tongueStartX + directionRef.current.x * tongueLength;
          const tongueEndY =
            tongueStartY + directionRef.current.y * tongueLength;

          ctx.beginPath();
          ctx.moveTo(tongueStartX, tongueStartY);
          ctx.lineTo(tongueEndX, tongueEndY);
          ctx.stroke();

          // Forked tongue tip
          const forkLength = 3;
          if (directionRef.current.x !== 0) {
            ctx.beginPath();
            ctx.moveTo(tongueEndX, tongueEndY);
            ctx.lineTo(tongueEndX, tongueEndY - forkLength);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(tongueEndX, tongueEndY);
            ctx.lineTo(tongueEndX, tongueEndY + forkLength);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(tongueEndX, tongueEndY);
            ctx.lineTo(tongueEndX - forkLength, tongueEndY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(tongueEndX, tongueEndY);
            ctx.lineTo(tongueEndX + forkLength, tongueEndY);
            ctx.stroke();
          }
        }
      } else if (isTail) {
        // Tail - pointy tip
        ctx.fillStyle = "#166534";

        const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;

        // Determine tail direction (opposite of next segment)
        if (index > 0) {
          const nextSegment = snake[index - 1];
          const dx = Math.abs(segment.x - nextSegment.x);
          const dy = Math.abs(segment.y - nextSegment.y);

          // Check if tail is wrapping around - if so, just draw a square
          if (dx > 1 || dy > 1) {
            ctx.fillRect(
              segment.x * CELL_SIZE + 2,
              segment.y * CELL_SIZE + 2,
              CELL_SIZE - 4,
              CELL_SIZE - 4
            );
          } else {
            const tailDirX = segment.x - nextSegment.x;
            const tailDirY = segment.y - nextSegment.y;

            ctx.beginPath();
            if (tailDirX !== 0) {
              // Horizontal tail
              const tipX = centerX + tailDirX * (CELL_SIZE / 2);
              ctx.moveTo(tipX, centerY);
              ctx.lineTo(
                centerX - tailDirX * (CELL_SIZE / 2 - 2),
                centerY - (CELL_SIZE / 2 - 2)
              );
              ctx.lineTo(
                centerX - tailDirX * (CELL_SIZE / 2 - 2),
                centerY + (CELL_SIZE / 2 - 2)
              );
            } else {
              // Vertical tail
              const tipY = centerY + tailDirY * (CELL_SIZE / 2);
              ctx.moveTo(centerX, tipY);
              ctx.lineTo(
                centerX - (CELL_SIZE / 2 - 2),
                centerY - tailDirY * (CELL_SIZE / 2 - 2)
              );
              ctx.lineTo(
                centerX + (CELL_SIZE / 2 - 2),
                centerY - tailDirY * (CELL_SIZE / 2 - 2)
              );
            }
            ctx.closePath();
            ctx.fill();
          }
        }
      } else {
        // Body - medium green
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(
          segment.x * CELL_SIZE + 2,
          segment.y * CELL_SIZE + 2,
          CELL_SIZE - 4,
          CELL_SIZE - 4
        );
      }
    });

    // Draw all eggs
    eggs.forEach((egg) => {
      const centerX = egg.position.x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = egg.position.y * CELL_SIZE + CELL_SIZE / 2;
      const eggWidth = CELL_SIZE * 0.7;
      const eggHeight = CELL_SIZE * 0.85;

      // Draw egg shadow for depth
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.beginPath();
      // Egg-shaped shadow (wider at bottom, narrower at top)
      ctx.ellipse(centerX + 1.5, centerY + 2, eggWidth / 2, eggHeight / 2.2, 0, 0, Math.PI);
      ctx.ellipse(centerX + 1.5, centerY + 2, eggWidth / 2.2, eggHeight / 2, 0, Math.PI, Math.PI * 2);
      ctx.fill();

      // Egg background with gradient based on type
      const eggGradient = ctx.createLinearGradient(centerX, centerY - eggHeight / 2, centerX, centerY + eggHeight / 2);
      if (egg.type === "regular") {
        eggGradient.addColorStop(0, "#f5f5f5");
        eggGradient.addColorStop(0.5, "#ffffff");
        eggGradient.addColorStop(1, "#e8e8e8");
      } else {
        // time-extension egg (golden)
        eggGradient.addColorStop(0, "#fde68a");
        eggGradient.addColorStop(0.5, "#fbbf24");
        eggGradient.addColorStop(1, "#d97706");
      }
      ctx.fillStyle = eggGradient;
      ctx.beginPath();
      // Top half (narrower)
      ctx.ellipse(centerX, centerY, eggWidth / 2, eggHeight / 2.2, 0, 0, Math.PI);
      // Bottom half (wider)
      ctx.ellipse(centerX, centerY, eggWidth / 2.2, eggHeight / 2, 0, Math.PI, Math.PI * 2);
      ctx.fill();

      // Add highlight for 3D effect
      const gradient = ctx.createRadialGradient(
        centerX - eggWidth / 6,
        centerY - eggHeight / 6,
        0,
        centerX,
        centerY,
        eggHeight / 2
      );
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.6)");
      gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.3)");
      gradient.addColorStop(1, "rgba(200, 200, 200, 0.3)");
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw clock icon for time-extension eggs
      if (egg.type === "time-extension") {
        const radius = 8;

        // Clock circle
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Hour hand (pointing up)
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX, centerY - radius * 0.5);
        ctx.stroke();

        // Minute hand (at angle)
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + radius * 0.4, centerY - radius * 0.3);
        ctx.stroke();
      }
    });
  }, [snake, eggs, gameOver]);

  // Timer color based on remaining time
  let timerColor = "text-white";
  if (timeRemaining <= 5) {
    timerColor = "text-red-500 animate-pulse";
  } else if (timeRemaining <= 10) {
    timerColor = "text-yellow-500";
  }

  return (
    <>
      {/* Boost Hint Modal */}
      {showHint && (
        <div className="fixed inset-0 z-50 hidden md:flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-md mx-4">
            {/* Neon glow effect */}
            <div className="absolute -inset-1 bg-cyan-400 opacity-30 blur-lg"></div>

            {/* Modal card */}
            <div
              className="relative bg-black border-2 border-cyan-500 p-8"
              style={{
                clipPath:
                  "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)",
                boxShadow: "0 0 30px rgba(0, 255, 255, 0.3)",
              }}
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-400"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-400"></div>

              <div className="relative">
                <h2
                  className="text-2xl font-bold text-cyan-400 uppercase tracking-wider mb-4 text-center"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    textShadow: "0 0 10px #00FFFF, 0 0 20px #00FFFF",
                  }}
                >
                  Boost Mode
                </h2>

                <div
                  className="text-cyan-300 text-center mb-6"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  <p className="mb-3">
                    Hold{" "}
                    <span className="text-yellow-400 font-bold">SHIFT</span> to
                    boost speed
                  </p>
                  <p className="text-sm text-cyan-500/70">
                    Move 3x faster to collect eggs before they vanish
                  </p>
                </div>

                <div className="text-center">
                  <div
                    className="inline-block px-6 py-2 border border-cyan-500/50 text-cyan-500/70 text-sm uppercase tracking-wider"
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                    }}
                  >
                    [ Press Space to Continue ]
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <GameContainer theme="cyan">
        <GameHeader
          title="Time Trial"
          score={score}
          highScore={highScore}
          theme="cyan"
        />

        {/* Timer */}
        <div className="text-center mb-3 md:mb-4">
          <div
            className={`text-3xl md:text-4xl font-bold uppercase tracking-wider ${
              timerColor === "text-red-500"
                ? "text-red-400"
                : timerColor === "text-yellow-500"
                ? "text-yellow-400"
                : "text-cyan-400"
            }`}
            style={{
              fontFamily: "'Orbitron', sans-serif",
              textShadow:
                timerColor === "text-red-500"
                  ? "0 0 10px #ff0000"
                  : timerColor === "text-yellow-500"
                  ? "0 0 10px #ffff00"
                  : "0 0 10px #00FFFF",
            }}
          >
            {timeRemaining}s
          </div>
        </div>

        {/* Canvas */}
        <div className="flex justify-center">
          <div className="w-full max-w-[600px] relative">
            <canvas
              ref={canvasRef}
              width={GRID_SIZE * CELL_SIZE}
              height={GRID_SIZE * CELL_SIZE}
              className="border-2 border-cyan-500/50 w-full h-auto"
              style={{
                boxShadow: "0 0 20px rgba(0, 255, 255, 0.2)",
                maxWidth: "100%",
                aspectRatio: "1 / 1",
              }}
            />

            <GameOverlay
              gameOver={gameOver}
              isPaused={isPaused}
              showNewHighScore={showNewHighScore}
              onRestart={resetGame}
              theme="cyan"
            />
          </div>
        </div>

        {/* Touch Controls */}
        <TouchControls
          onDirectionChange={handleTouchDirection}
          onBoost={handleBoost}
          onPause={handlePause}
          showBoost={true}
          showPause={false}
        />
      </GameContainer>
    </>
  );
}
