'use client'

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY

export function capture(event: string, properties?: Record<string, unknown>) {
  if (!KEY) return
  if (typeof window === 'undefined') return
  void import('posthog-js').then((mod) => {
    const posthog = mod.default
    if (!posthog.__loaded) return
    posthog.capture(event, properties)
  })
}
