import Link from 'next/link'
import type { Comparison, Product } from '@/lib/data'
import { compareHref, isFeeBased, priceShort, subLabel } from '@/lib/nav'
import { priceLabel, type Verdict } from '@/lib/verdict'
import { ProductMark } from '@/components/ProductMark'

function Side({ product, side }: { product: Product; side: 'a' | 'b' }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      <ProductMark product={product} size="sm" tone={side} />
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-semibold leading-tight">{product.name}</p>
        <p className="num mt-0.5 text-[12.5px] text-ink-3">{priceShort(product)}</p>
      </div>
    </div>
  )
}

export function VsCard({
  comparison,
  productA,
  productB,
  verdict,
}: {
  comparison: Comparison
  productA: Product
  productB: Product
  verdict: Verdict
}) {
  const leader = verdict.leader === 'a' ? productA : verdict.leader === 'b' ? productB : null
  const wins = verdict.leader === 'a' ? verdict.aWins : verdict.bWins
  const cheaper =
    verdict.priceLeader === 'a' ? productA : verdict.priceLeader === 'b' ? productB : null

  return (
    <Link
      href={compareHref(comparison)}
      className="card group flex flex-col p-4 transition-all hover:border-line-2 sm:p-5"
      style={{ boxShadow: 'var(--shadow-1)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">{subLabel(productA.subcategory)}</span>
        <span className="num text-[11.5px] text-ink-3">{verdict.differing} differences</span>
      </div>

      <div className="mt-3.5 flex items-center gap-3">
        <Side product={productA} side="a" />
        <span
          aria-hidden
          className="grid shrink-0 place-items-center rounded-full border border-line text-[10px] font-bold text-ink-3"
          style={{ width: 26, height: 26 }}
        >
          VS
        </span>
        <Side product={productB} side="b" />
      </div>

      <p className="mt-4 text-[13px] leading-snug text-ink-2">
        {leader ? (
          <>
            <span className="font-semibold text-ink">{leader.brand}</span> leads on{' '}
            <span className="num">{wins}</span> of <span className="num">{verdict.scored}</span>{' '}
            rankable {verdict.scored === 1 ? 'spec' : 'specs'}
            {cheaper && cheaper.id !== leader.id ? (
              <>
                , but {cheaper.brand} saves <span className="num">{priceLabel(verdict.priceGap)}</span>
                {isFeeBased(cheaper.subcategory) ? ' a year' : ''}
              </>
            ) : (
              cheaper && <> and {isFeeBased(cheaper.subcategory) ? 'charges less a year' : 'costs less'}</>
            )}
            .
          </>
        ) : verdict.scored > 0 ? (
          <>Evenly split on rankable specs, so price and taste decide it.</>
        ) : (
          <>Nothing here ranks on numbers alone, so features and price decide it.</>
        )}
      </p>

      <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent">
        See the breakdown
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="transition-transform group-hover:translate-x-0.5">
          <path d="M2 6h7M6.2 3.2 9 6l-2.8 2.8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  )
}
