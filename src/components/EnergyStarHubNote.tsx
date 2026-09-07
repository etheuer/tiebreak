import Link from 'next/link'
import {
  ENERGY_STAR_AIR_FINDER,
  ENERGY_STAR_HOME,
  ENERGY_STAR_TV_FINDER,
} from '@/lib/energy-star'

/** Outbound ENERGY STAR links for air-purifier and TV category hubs. */
export function EnergyStarHubNote({ subcategory }: { subcategory: string }) {
  if (subcategory !== 'air-purifiers' && subcategory !== 'tvs') return null

  const finder =
    subcategory === 'air-purifiers' ? ENERGY_STAR_AIR_FINDER : ENERGY_STAR_TV_FINDER
  const finderLabel =
    subcategory === 'air-purifiers'
      ? 'ENERGY STAR® room air cleaners Product Finder'
      : 'ENERGY STAR® televisions Product Finder'

  return (
    <aside
      className="mt-5 rounded-xl border border-line bg-surface-2 p-4 text-meta leading-relaxed text-ink-2"
      aria-label="ENERGY STAR resources"
    >
      <p>
        Looking for certified models? Browse the{' '}
        <a
          href={finder}
          className="font-medium text-accent hover:underline"
          rel="noopener noreferrer"
          target="_blank"
        >
          {finderLabel}
        </a>{' '}
        on{' '}
        <a
          href={ENERGY_STAR_HOME}
          className="font-medium text-accent hover:underline"
          rel="noopener noreferrer"
          target="_blank"
        >
          energystar.gov
        </a>
        , or see how Clinchmark highlights matches on our{' '}
        <Link href="/energy-star/" className="font-medium text-accent hover:underline">
          ENERGY STAR® page
        </Link>
        .
      </p>
    </aside>
  )
}
