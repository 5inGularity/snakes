import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST

let initialized = false

export function initAnalytics() {
  if (initialized || !POSTHOG_KEY || !POSTHOG_HOST) {
    return
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Disable advanced features - only basic event tracking
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_compression: false,
    persistence: 'localStorage',
    loaded: () => {
      if (import.meta.env.DEV) {
        console.log('PostHog initialized')
      }
    }
  })

  initialized = true
}

export function trackGameStart(gameName: string) {
  if (!initialized) return

  posthog.capture('game_started', {
    game: gameName
  })
}

export function trackGameEnd(gameName: string, score: number) {
  if (!initialized) return

  posthog.capture('game_ended', {
    game: gameName,
    score: score
  })
}
