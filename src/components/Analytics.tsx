'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import posthog from 'posthog-js'

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

function PostHogClient() {
  const pathname = usePathname()

  useEffect(() => {
    if (!KEY) return
    if (!posthog.__loaded) {
      posthog.init(KEY, {
        api_host: HOST,
        defaults: '2026-01-30',
        person_profiles: 'identified_only',
        capture_pageview: false,
        disable_session_recording: true,
      })
    }
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      $pathname: window.location.pathname,
    })
  }, [pathname])

  return null
}

export function Analytics() {
  if (!KEY) return null
  return <PostHogClient />
}
