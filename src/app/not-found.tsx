import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="shell flex min-h-[52vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display mt-3 text-[30px] sm:text-[40px]">No matchup at this address</h1>
      <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-ink-2">
        The page you asked for is not in the catalog. Search with the slash key, or start from a
        published matchup.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn btn-primary">
          Back to matchups
        </Link>
        <Link href="/category/electronics/" className="btn btn-ghost">
          Browse electronics
        </Link>
      </div>
    </div>
  )
}
