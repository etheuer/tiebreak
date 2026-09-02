import type { Product } from '@/lib/data'
import { originNote } from '@/data/spec-catalog'
import { buildProductGroups } from '@/lib/specs'

export function ProductSpecs({ product }: { product: Product }) {
  const groups = buildProductGroups(product)
  if (groups.length === 0) return null

  return (
    <section aria-labelledby="specs-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="specs-heading" className="display text-[20px] sm:text-[23px]">
          Full specifications
        </h2>
        <nav className="scroll-x flex gap-1.5" aria-label="Specification sections">
          {groups.map((group) => (
            <a
              key={group.id}
              href={`#spec-${group.id}`}
              className="chip shrink-0"
            >
              {group.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="mt-5 gap-4 md:columns-2">
        {groups.map((group) => (
          <div
            key={group.id}
            id={`spec-${group.id}`}
            className="card mb-4 break-inside-avoid overflow-hidden scroll-mt-24"
          >
            <h3 className="border-b border-line bg-surface-2 px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em]">
              {group.label}
            </h3>
            <dl className="divide-y divide-line">
              {group.rows.map((row) => (
                <div key={row.key} className="grid grid-cols-[38%_1fr] gap-3 px-4 py-2.5">
                  <dt className="text-[12.5px] leading-snug text-ink-3">
                    {row.label}
                    {originNote(row.origin) ? (
                      <span className="mt-0.5 block text-[11px] font-normal text-ink-3">
                        {originNote(row.origin)}
                      </span>
                    ) : null}
                  </dt>
                  <dd className="text-[13px] leading-snug">{row.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {product.officialSource?.url ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-ink-3">
          <span>
            {product.officialSource.kind === 'issuer-terms'
              ? 'Card figures are from issuer materials and go stale. Credit-needed bands are our summary.'
              : 'Most rows are from the official spec sheet. Marked rows are other published figures or our summary, not lab tests we ran.'}
          </span>
          <a
            href={product.officialSource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline inline-flex items-center gap-1 font-medium"
          >
            Official {product.name} {product.officialSource.kind === 'issuer-terms' ? 'terms' : 'spec sheet'}
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M3.5 1.5h7v7M10.5 1.5 1.5 10.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      ) : null}
    </section>
  )
}
