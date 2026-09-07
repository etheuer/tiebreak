import type { EnergyStarMatch } from '@/lib/energy-star'
import { formatAnnualKwh } from '@/lib/energy-star'

/**
 * Text-only ENERGY STAR® callout (no logo mark).
 * Brand guidelines: marks generally require an active Partnership Agreement.
 * Until partnership is approved we use the word mark in prose + a link only.
 */
export function EnergyStarBadge({
  match,
  compact = false,
}: {
  match: EnergyStarMatch
  compact?: boolean
}) {
  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2 py-0.5 text-micro font-medium text-ink-2"
        title={`Matched to ENERGY STAR® model ${match.energyStarModelNumber}`}
      >
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
        ENERGY STAR®
        <span className="num text-ink-3">{formatAnnualKwh(match.annualEnergyUseKwh)}</span>
      </span>
    )
  }

  return (
    <div className="mt-3 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-meta text-ink-2">
      <span className="font-semibold text-ink">ENERGY STAR® certified</span>
      <span className="num text-ink-3">
        {formatAnnualKwh(match.annualEnergyUseKwh)}
        {match.meetsMostEfficient ? ' · Most Efficient' : ''}
      </span>
      <a
        href={match.productFinderUrl}
        className="font-medium text-accent hover:underline"
        rel="noopener noreferrer"
        target="_blank"
      >
        Product Finder
      </a>
    </div>
  )
}
