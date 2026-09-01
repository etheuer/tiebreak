import type { Product } from '@/lib/data'
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
                  <dt className="text-[12.5px] leading-snug text-ink-3">{row.label}</dt>
                  <dd className="text-[13px] leading-snug">{row.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  )
}
