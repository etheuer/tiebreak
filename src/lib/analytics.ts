'use client'

import posthog from 'posthog-js'

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY

export function capture(event: string, properties?: Record<string, unknown>) {
  if (!KEY) return
  if (typeof window === 'undefined') return
  if (!posthog.__loaded) return
  posthog.capture(event, properties)
}
