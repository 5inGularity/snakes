// Web Audio API sound effects utility
let audioContext: AudioContext | null = null

// Initialize AudioContext on first user interaction
export function initAudio() {
  if (!audioContext) {
    audioContext = new AudioContext()
  }

  // Resume if suspended (some browsers suspend after pause)
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
}

// Play a simple tone
function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3
) {
  if (!audioContext) {
    initAudio()
  }

  if (!audioContext) return // Still couldn't initialize

  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.value = frequency
  oscillator.type = type

  // Envelope for smooth sound
  const now = audioContext.currentTime
  gainNode.gain.setValueAtTime(volume, now)
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000)

  oscillator.start(now)
  oscillator.stop(now + duration / 1000)
}

// Play multiple tones in sequence
function playSequence(
  notes: Array<{ frequency: number; duration: number; type?: OscillatorType; volume?: number }>,
  gap: number = 0
) {
  if (!audioContext) {
    initAudio()
  }

  if (!audioContext) return

  let offset = 0
  notes.forEach((note) => {
    setTimeout(() => {
      playTone(note.frequency, note.duration, note.type, note.volume)
    }, offset)
    offset += note.duration + gap
  })
}

// Predefined sound effects

export function playEatSound() {
  // Quick high-pitched beep
  playTone(880, 80, 'sine', 0.2)
}

export function playGoldenEggSound() {
  // Two-tone ascending "ding-ding"
  playSequence([
    { frequency: 660, duration: 60, type: 'sine', volume: 0.25 },
    { frequency: 880, duration: 80, type: 'sine', volume: 0.25 },
  ])
}

export function playTimeExtensionSound() {
  // Ascending arpeggio
  playSequence([
    { frequency: 523, duration: 50, type: 'sine', volume: 0.2 }, // C
    { frequency: 659, duration: 50, type: 'sine', volume: 0.2 }, // E
    { frequency: 784, duration: 80, type: 'sine', volume: 0.2 }, // G
  ])
}

export function playGrowSound() {
  // Rising pitch (green egg in AdderSnake)
  playSequence([
    { frequency: 440, duration: 40, type: 'triangle', volume: 0.2 },
    { frequency: 554, duration: 40, type: 'triangle', volume: 0.2 },
  ])
}

export function playShrinkSound() {
  // Falling pitch (red egg in AdderSnake)
  playSequence([
    { frequency: 554, duration: 40, type: 'triangle', volume: 0.2 },
    { frequency: 440, duration: 40, type: 'triangle', volume: 0.2 },
  ])
}

export function playDeathSound() {
  // Descending buzz
  if (!audioContext) {
    initAudio()
  }

  if (!audioContext) return

  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.type = 'sawtooth'

  const now = audioContext.currentTime
  const duration = 0.5

  // Frequency drops from 440Hz to 110Hz
  oscillator.frequency.setValueAtTime(440, now)
  oscillator.frequency.exponentialRampToValueAtTime(110, now + duration)

  // Volume fades out
  gainNode.gain.setValueAtTime(0.3, now)
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration)

  oscillator.start(now)
  oscillator.stop(now + duration)
}

export function playHighScoreSound() {
  // Victory fanfare
  playSequence([
    { frequency: 523, duration: 100, type: 'square', volume: 0.25 }, // C
    { frequency: 659, duration: 100, type: 'square', volume: 0.25 }, // E
    { frequency: 784, duration: 100, type: 'square', volume: 0.25 }, // G
    { frequency: 1047, duration: 200, type: 'square', volume: 0.25 }, // C (octave)
  ], 20)
}
