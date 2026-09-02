'use client'

import Link from 'next/link'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="shell flex min-h-[52vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">Error</p>
      <h1 className="display mt-3 text-h1">Something went wrong</h1>
      <p className="mt-3 max-w-md text-body leading-relaxed text-ink-2">
        The page failed to load. Try again, or start from the home page.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <button type="button" className="btn btn-primary" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/" className="btn btn-ghost">
          Back to matchups
        </Link>
      </div>
    </div>
  )
}
