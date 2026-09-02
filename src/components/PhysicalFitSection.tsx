import type { Product } from '@/lib/data'
import { getPhysicalFitComparison } from '@/data/physical-fit'
import { columnLabels } from '@/lib/decision'

export function PhysicalFitSection({
  productA,
  productB,
}: {
  productA: Product
  productB: Product
}) {
  const profile = getPhysicalFitComparison(productA, productB)
  if (!profile || profile.items.length === 0) return null

  const cols = columnLabels(productA, productB)

  return (
    <section
      className="card mt-10 overflow-hidden border border-line bg-surface p-4 sm:p-5"
      aria-labelledby="fit-heading"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
        <div>
          <h2 id="fit-heading" className="display text-h4">
            {profile.title}
          </h2>
          <p className="mt-1 text-cell text-ink-2">
            {profile.description}
          </p>
        </div>
        <span className="text-label font-semibold uppercase tracking-[0.06em] text-ink-3">
          Ergonomic & Spatial Check
        </span>
      </div>

      <div className="mt-4 divide-y divide-line">
        {profile.items.map((item) => (
          <div key={item.label} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-cell font-semibold text-ink">{item.label}</p>
            </div>
            {item.note && (
              <p className="mt-0.5 text-meta text-ink-3">{item.note}</p>
            )}
            <div className="mt-2.5 grid grid-cols-2 gap-3 sm:gap-4">
              <div className="col-a rounded-md border border-line/60 p-2.5 sm:p-3">
                <span
                  className="text-label font-semibold uppercase tracking-[0.06em]"
                  style={{ color: 'var(--accent-2)' }}
                >
                  {cols.a}
                </span>
                <p className="mt-1 text-cell leading-snug text-ink-2 font-medium">
                  {item.aValue}
                </p>
              </div>

              <div className="col-b rounded-md border border-line/60 p-2.5 sm:p-3">
                <span
                  className="text-label font-semibold uppercase tracking-[0.06em]"
                  style={{ color: 'var(--rival-2)' }}
                >
                  {cols.b}
                </span>
                <p className="mt-1 text-cell leading-snug text-ink-2 font-medium">
                  {item.bValue}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
