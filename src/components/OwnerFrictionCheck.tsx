import type { Product } from '@/lib/data'
import { getOwnerFrictions, type FrictionTag } from '@/data/owner-frictions'
import { columnLabels } from '@/lib/decision'

const TAG_STYLES: Record<FrictionTag, string> = {
  Ergonomics: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  'Hardware Quirk': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  'Software / Apps': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  Maintenance: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  'Hidden Cost': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
}

export function OwnerFrictionCheck({
  productA,
  productB,
}: {
  productA: Product
  productB: Product
}) {
  const frictionsA = getOwnerFrictions(productA)
  const frictionsB = getOwnerFrictions(productB)

  if (frictionsA.length === 0 && frictionsB.length === 0) return null

  const cols = columnLabels(productA, productB)

  return (
    <section
      className="card mt-10 overflow-hidden border border-line bg-surface p-4 sm:p-5"
      aria-labelledby="frictions-heading"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
        <div>
          <h2 id="frictions-heading" className="display text-h4">
            The 90-Day Owner Regret Check
          </h2>
          <p className="mt-1 text-cell text-ink-2">
            Documented ergonomic quirks, hardware annoyances, and maintenance realities reported by real owners.
          </p>
        </div>
        <span className="text-label font-semibold uppercase tracking-[0.06em] text-ink-3">
          Post-Purchase Truths
        </span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 md:gap-5">
        {/* Product A */}
        <div className="col-a rounded-md border border-line p-3.5 sm:p-4">
          <p
            className="text-label font-semibold uppercase tracking-[0.06em]"
            style={{ color: 'var(--accent-2)' }}
          >
            {cols.a}: What to watch for
          </p>
          <ul className="mt-3 space-y-3">
            {frictionsA.map((f, idx) => (
              <li key={idx} className="border-b border-line/50 pb-2.5 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                      TAG_STYLES[f.tag] ?? 'bg-surface-2 text-ink-3 border-line'
                    }`}
                  >
                    {f.tag}
                  </span>
                  <p className="text-cell font-semibold text-ink leading-snug">{f.complaint}</p>
                </div>
                <p className="mt-1 text-meta leading-relaxed text-ink-2 pl-0.5">{f.context}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Product B */}
        <div className="col-b rounded-md border border-line p-3.5 sm:p-4">
          <p
            className="text-label font-semibold uppercase tracking-[0.06em]"
            style={{ color: 'var(--rival-2)' }}
          >
            {cols.b}: What to watch for
          </p>
          <ul className="mt-3 space-y-3">
            {frictionsB.map((f, idx) => (
              <li key={idx} className="border-b border-line/50 pb-2.5 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                      TAG_STYLES[f.tag] ?? 'bg-surface-2 text-ink-3 border-line'
                    }`}
                  >
                    {f.tag}
                  </span>
                  <p className="text-cell font-semibold text-ink leading-snug">{f.complaint}</p>
                </div>
                <p className="mt-1 text-meta leading-relaxed text-ink-2 pl-0.5">{f.context}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
