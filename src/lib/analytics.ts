import type posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST

let posthogInstance: typeof posthog | null = null
let initPromise: Promise<void> | null = null

export async function initAnalytics() {
  // If already initialized or initializing, return existing promise
  if (posthogInstance || initPromise) {
    return initPromise
  }

  // Skip if no env vars
  if (!POSTHOG_KEY || !POSTHOG_HOST) {
    return Promise.resolve()
  }

  // Lazy load PostHog only when needed
  initPromise = (async () => {
    const { default: posthog } = await import('posthog-js')

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
          console.log('PostHog lazy-loaded and initialized')
        }
      }
    })

    posthogInstance = posthog
  })()

  return initPromise
}

export async function trackGameStart(gameName: string) {
  // Ensure PostHog is initialized before tracking
  await initAnalytics()

  if (!posthogInstance) return

  posthogInstance.capture('game_started', {
    game: gameName
  })
}

export async function trackGameEnd(gameName: string, score: number) {
  // Ensure PostHog is initialized before tracking
  await initAnalytics()

  if (!posthogInstance) return

  posthogInstance.capture('game_ended', {
    game: gameName,
    score: score
  })
}
