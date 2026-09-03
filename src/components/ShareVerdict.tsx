'use client'

import { useState } from 'react'
import { capture } from '@/lib/analytics'

export function ShareVerdict() {
  const [status, setStatus] = useState<'idle' | 'copied' | 'fallback'>('idle')

  function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          capture('verdict_shared', { share_status: 'copied' })
          setStatus('copied')
          setTimeout(() => setStatus('idle'), 2000)
        })
        .catch(() => {
          capture('verdict_shared', { share_status: 'fallback' })
          setStatus('fallback')
          setTimeout(() => setStatus('idle'), 4000)
        })
    } else {
      capture('verdict_shared', { share_status: 'fallback' })
      setStatus('fallback')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="btn rounded-full border border-line bg-surface px-4 py-2 text-meta font-semibold text-ink transition-colors hover:bg-surface-2"
    >
      {status === 'copied' ? (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="text-accent shrink-0">
          <path d="M11 4L5.5 9.5L3 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="text-ink-3 shrink-0">
          <path d="M5 7a2 2 0 100-4 2 2 0 000 4zm4 4a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.5 5.5l1.5 1M6.5 8.5l1.5-1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <span aria-live="polite">
        {status === 'copied'
          ? 'Copied'
          : status === 'fallback'
          ? 'Copy the link from the address bar'
          : 'Share this verdict'}
      </span>
    </button>
  )
}
