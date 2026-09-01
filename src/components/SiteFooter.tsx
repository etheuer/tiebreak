import Link from 'next/link'
import type { Category, Comparison, Product } from '@/lib/data'
import { compareHref, SUBCATEGORY_LABEL } from '@/lib/nav'

export function SiteFooter({
  categories,
  comparisons,
  products = [],
}: {
  categories: Category[]
  comparisons: Comparison[]
  products?: Product[]
}) {
  const byId = new Map(products.map((p) => [p.id, p]))
  const subcategories = Object.keys(SUBCATEGORY_LABEL)
  const popular: Comparison[] = []
  for (const sub of subcategories) {
    const match = comparisons.find((c) => byId.get(c.productA)?.subcategory === sub)
    if (match) {
      popular.push(match)
    }
  }

  return (
    <footer className="rule-top mt-20 bg-surface">
      <div className="shell grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="grid place-items-center rounded-md"
              style={{ width: 22, height: 22, background: 'var(--accent)' }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
                <path d="M3 12.6 8.6 3.4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
                <path d="M7.4 12.6 13 3.4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" opacity="0.55" />
              </svg>
            </span>
            <span className="font-bold tracking-[-0.03em]">Tiebreak</span>
          </div>
          <p className="mt-3 max-w-sm text-[13.5px] leading-relaxed text-ink-2">
            Head to head spec comparisons for people who have already narrowed it down to two.
            Figures come from published manufacturer specifications, not our own lab testing.
          </p>
        </div>

        <nav aria-label="Categories">
          <p className="eyebrow mb-3">Categories</p>
          <ul className="grid gap-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.id}/`}
                  className="text-[13.5px] text-ink-2 transition-colors hover:text-accent"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Popular matchups">
          <p className="eyebrow mb-3">Popular matchups</p>
          <ul className="grid gap-2">
            {popular.map((comparison) => (
              <li key={comparison.productA + comparison.productB}>
                <Link
                  href={compareHref(comparison)}
                  className="text-[13.5px] text-ink-2 transition-colors hover:text-accent"
                >
                  {comparison.productName}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/compare/"
                className="text-[13.5px] font-semibold text-ink transition-colors hover:text-accent"
              >
                All matchups &rarr;
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="rule-top">
        <div className="shell flex flex-col gap-2 py-5 text-[12.5px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Tiebreak</p>
          <p>Prices are manufacturer list prices in USD and change often.</p>
        </div>
      </div>
    </footer>
  )
}
