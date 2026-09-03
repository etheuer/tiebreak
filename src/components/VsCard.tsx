import type { Comparison, Product } from '@/lib/data'
import { compareHref, isFeeBased, priceShort, subLabel } from '@/lib/nav'
import { priceLabel, type Verdict } from '@/lib/verdict'
import { shortName } from '@/lib/decision'
import type { MarketId } from '@/lib/markets'
import { ProductImage } from '@/components/ProductImage'
import { CompareLink } from '@/components/CompareLink'

function Side({
  product,
  side,
  wins,
  isLeader,
  market,
}: {
  product: Product
  side: 'a' | 'b'
  wins: number
  isLeader: boolean
  market: MarketId
}) {
  const accentColor = side === 'a' ? 'var(--accent)' : 'var(--rival)'
  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2.5 transition-colors"
      style={{
        background: isLeader
          ? side === 'a'
            ? 'var(--accent-tint)'
            : 'var(--rival-tint)'
          : 'var(--surface-2)',
        border: `1px solid ${isLeader ? (side === 'a' ? 'color-mix(in oklab, var(--accent) 30%, transparent)' : 'color-mix(in oklab, var(--rival) 30%, transparent)') : 'transparent'}`,
      }}
    >
      <ProductImage product={product} size="sm" tone={side} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-cell font-bold text-ink leading-tight">{product.name}</p>
        <div className="mt-1 flex items-center justify-between gap-1">
          <span className="num text-meta font-medium text-ink-3">{priceShort(product, market)}</span>
          <span
            className="num rounded px-1.5 py-0.2 text-[0.75rem] font-bold"
            style={{
              background: isLeader ? accentColor : 'var(--surface-3)',
              color: isLeader ? '#fff' : 'var(--ink-2)',
            }}
          >
            {wins} wins
          </span>
        </div>
      </div>
    </div>
  )
}

export function VsCard({
  comparison,
  productA,
  productB,
  verdict,
  market = 'us',
}: {
  comparison: Comparison
  productA: Product
  productB: Product
  verdict: Verdict
  market?: MarketId
}) {
  const leader = verdict.leader === 'a' ? productA : verdict.leader === 'b' ? productB : null
  const wins = verdict.leader === 'a' ? verdict.aWins : verdict.bWins
  const cheaper =
    verdict.priceLeader === 'a' ? productA : verdict.priceLeader === 'b' ? productB : null

  const sameBrand = productA.brand === productB.brand
  const totalWins = verdict.aWins + verdict.bWins
  const aPercent = totalWins > 0 ? (verdict.aWins / totalWins) * 100 : 50

  return (
    <CompareLink
      href={compareHref(comparison, market)}
      className="card card-hover group relative min-w-0 flex flex-col justify-between p-5 sm:p-6"
    >
      <div>
        {/* Top meta strip */}
        <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-surface-2 px-2 py-0.5 text-badge font-bold uppercase tracking-wider text-ink-2">
              {subLabel(productA.subcategory)}
            </span>
            <span className="num text-micro text-ink-3">
              {verdict.differing} diff{verdict.differing === 1 ? '' : 's'}
            </span>
          </div>

          {leader ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-badge font-bold uppercase tracking-wide text-accent">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34M12 2a4 4 0 0 0-4 4v3a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z"/>
              </svg>
              {sameBrand ? shortName(leader) : leader.brand} Leads
            </span>
          ) : (
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-badge font-semibold text-ink-3">
              Split Decision
            </span>
          )}
        </div>

        {/* Side by side contenders */}
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
          <Side
            product={productA}
            side="a"
            wins={verdict.aWins}
            isLeader={verdict.leader === 'a'}
            market={market}
          />
          <div className="flex flex-col items-center justify-center px-1">
            <span
              aria-hidden
              className="grid place-items-center rounded-full border border-line bg-surface-2 text-[0.7rem] font-extrabold tracking-tight text-ink-3 shadow-2xs"
              style={{ width: 28, height: 28 }}
            >
              VS
            </span>
          </div>
          <Side
            product={productB}
            side="b"
            wins={verdict.bWins}
            isLeader={verdict.leader === 'b'}
            market={market}
          />
        </div>

        {/* Visual Score Battle Bar */}
        {totalWins > 0 && (
          <div className="mt-3.5 flex h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
            <div
              style={{ width: `${aPercent}%`, background: 'var(--accent)' }}
              className="transition-all duration-300"
              title={`${productA.name}: ${verdict.aWins} wins`}
            />
            <div
              style={{ width: `${100 - aPercent}%`, background: 'var(--rival)' }}
              className="transition-all duration-300"
              title={`${productB.name}: ${verdict.bWins} wins`}
            />
          </div>
        )}

        {/* Verdict sentence */}
        <p className="mt-4 text-meta leading-relaxed text-ink-2">
          {leader ? (
            <>
              <span className="font-semibold text-ink">
                {sameBrand ? shortName(leader) : leader.brand}
              </span>{' '}
              takes <span className="num font-semibold text-ink">{wins}</span> of{' '}
              <span className="num">{verdict.scored}</span> measurable{' '}
              {verdict.scored === 1 ? 'spec' : 'specs'}
              {cheaper && cheaper.id !== leader.id ? (
                <>
                  , but {sameBrand ? shortName(cheaper) : cheaper.brand} saves{' '}
                  <span className="num font-semibold text-emerald-600 dark:text-emerald-400">
                    {priceLabel(verdict.priceGap, market)}
                  </span>
                  {isFeeBased(cheaper.subcategory) ? ' a year' : ''}
                </>
              ) : (
                cheaper && <> and {isFeeBased(cheaper.subcategory) ? 'charges less annually' : 'costs less'}</>
              )}
              .
            </>
          ) : verdict.scored > 0 ? (
            <>Evenly matched on published specs — features and budget tip the balance.</>
          ) : (
            <>Equal spec foundation — design and software features decide it.</>
          )}
        </p>
      </div>

      {/* Bottom CTA */}
      <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-3">
        <span className="inline-flex items-center gap-1 text-meta font-semibold text-accent transition-colors group-hover:text-accent-2">
          View full comparison
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
            <path d="M2 6h7M6.2 3.2 9 6l-2.8 2.8" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="num text-micro text-ink-3">TCO & Deal-Breakers →</span>
      </div>
    </CompareLink>
  )
}
