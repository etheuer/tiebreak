import type { Product } from '@/lib/data'
import type { MarketId } from '@/lib/markets'
import { compareTco } from '@/data/tco'
import { shortName } from '@/lib/decision'

export function TcoCard({
  productA,
  productB,
  market = 'us',
}: {
  productA: Product
  productB: Product
  market?: MarketId
}) {
  const comparison = compareTco(productA, productB, market)
  const { a, b, hasReversal, reversalSummary } = comparison

  // Only render if at least one product has consumables, fees, or accessories, or if both have prices
  if (!a || !b) return null

  // If both products have zero recurring costs and zero accessories, don't clutter the page
  const hasExtraCosts =
    a.annualRecurring > 0 ||
    b.annualRecurring > 0 ||
    a.accessoriesCost > 0 ||
    b.accessoriesCost > 0

  if (!hasExtraCosts && productA.subcategory !== 'air-purifiers' && productA.subcategory !== 'cordless-vacuums') {
    return null
  }

  const nameA = shortName(productA)
  const nameB = shortName(productB)

  return (
    <section
      className="card mt-6 overflow-hidden border border-line bg-surface p-4 sm:p-5"
      aria-labelledby="tco-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-accent" aria-hidden />
          <h2 id="tco-heading" className="eyebrow text-ink">
            True 3-Year Cost of Ownership (TCO)
          </h2>
        </div>
        <span className="text-meta text-ink-3">
          Upfront price + 3 years of consumables, fees & essential add-ons
        </span>
      </div>

      {hasReversal && reversalSummary && (
        <div className="mt-3 rounded-md border border-rival/25 bg-rival-tint px-3.5 py-2.5 text-cell leading-snug text-rival-2">
          <span className="font-semibold">⚠️ Cost Reversal Alert: </span>
          {reversalSummary}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {/* Product A */}
        <div className="col-a rounded-md border border-line p-3.5">
          <p
            className="text-label font-semibold uppercase tracking-[0.06em]"
            style={{ color: 'var(--accent-2)' }}
          >
            {nameA}
          </p>
          <div className="mt-2.5 space-y-1.5 text-meta">
            <div className="flex justify-between text-ink-2">
              <span>Upfront list price</span>
              <span className="num font-medium text-ink">{a.formattedBase}</span>
            </div>
            {a.annualRecurring > 0 && (
              <div className="flex justify-between text-ink-2">
                <span>
                  3-Yr {a.recurringLabel}{' '}
                  <span className="block text-label text-ink-3">({a.cadence})</span>
                </span>
                <span className="num font-medium text-ink">+{a.formattedRecurring3Yr}</span>
              </div>
            )}
            {a.accessoriesCost > 0 && (
              <div className="flex justify-between text-ink-2">
                <span>
                  Essential add-ons{' '}
                  <span className="block text-label text-ink-3">({a.accessoriesLabel})</span>
                </span>
                <span className="num font-medium text-ink">+{a.formattedAccessories}</span>
              </div>
            )}
          </div>
          <div className="mt-3 border-t border-line pt-2 flex items-baseline justify-between">
            <span className="text-cell font-semibold text-ink">3-Year Estimated Total</span>
            <span
              className="num text-lead font-bold"
              style={{ color: 'var(--accent)' }}
            >
              {a.formattedTotal3Yr}
            </span>
          </div>
          {a.notes && <p className="mt-1.5 text-meta text-ink-3">{a.notes}</p>}
        </div>

        {/* Product B */}
        <div className="col-b rounded-md border border-line p-3.5">
          <p
            className="text-label font-semibold uppercase tracking-[0.06em]"
            style={{ color: 'var(--rival-2)' }}
          >
            {nameB}
          </p>
          <div className="mt-2.5 space-y-1.5 text-meta">
            <div className="flex justify-between text-ink-2">
              <span>Upfront list price</span>
              <span className="num font-medium text-ink">{b.formattedBase}</span>
            </div>
            {b.annualRecurring > 0 && (
              <div className="flex justify-between text-ink-2">
                <span>
                  3-Yr {b.recurringLabel}{' '}
                  <span className="block text-label text-ink-3">({b.cadence})</span>
                </span>
                <span className="num font-medium text-ink">+{b.formattedRecurring3Yr}</span>
              </div>
            )}
            {b.accessoriesCost > 0 && (
              <div className="flex justify-between text-ink-2">
                <span>
                  Essential add-ons{' '}
                  <span className="block text-label text-ink-3">({b.accessoriesLabel})</span>
                </span>
                <span className="num font-medium text-ink">+{b.formattedAccessories}</span>
              </div>
            )}
          </div>
          <div className="mt-3 border-t border-line pt-2 flex items-baseline justify-between">
            <span className="text-cell font-semibold text-ink">3-Year Estimated Total</span>
            <span
              className="num text-lead font-bold"
              style={{ color: 'var(--rival)' }}
            >
              {b.formattedTotal3Yr}
            </span>
          </div>
          {b.notes && <p className="mt-1.5 text-meta text-ink-3">{b.notes}</p>}
        </div>
      </div>
    </section>
  )
}
