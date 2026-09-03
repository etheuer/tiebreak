import Link from 'next/link'
import type { Category, Comparison, Product } from '@/lib/data'
import { categoryHref, compareHref, hubHref, LEGAL_LINKS, SUBCATEGORY_LABEL } from '@/lib/nav'
import { MARKETS, type MarketId } from '@/lib/markets'
import { SITE_NAME } from '@/lib/site'

export function SiteFooter({
  categories,
  comparisons,
  products = [],
  market = 'us',
}: {
  categories: Category[]
  comparisons: Comparison[]
  products?: Product[]
  market?: MarketId
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
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid place-items-center rounded-lg shadow-sm"
              style={{ width: 24, height: 24, background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)' }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
                <path d="M3 12.6 8.6 3.4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <path d="M7.4 12.6 13 3.4" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              </svg>
            </span>
            <span className="font-extrabold tracking-[-0.04em] text-title text-ink">{SITE_NAME}</span>
          </div>
          <p className="mt-3 max-w-sm text-cell leading-relaxed text-ink-2">
            Head to head spec comparisons for people who have already narrowed it down to two.
            Figures are published specs and other published numbers we mark on the page, not lab
            tests we ran.
          </p>
        </div>

        <nav aria-label="Categories">
          <p className="eyebrow mb-3">Categories</p>
          <ul className="grid gap-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={categoryHref(category.id, market)}
                  className="text-cell text-ink-2 transition-colors hover:text-accent"
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
                  href={compareHref(comparison, market)}
                  className="text-cell text-ink-2 transition-colors hover:text-accent"
                >
                  {comparison.productName}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={hubHref(market)}
                className="text-cell font-semibold text-ink transition-colors hover:text-accent"
              >
                All matchups &rarr;
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="rule-top">
        <div className="shell flex flex-col gap-2 py-5 text-meta text-ink-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {SITE_NAME}</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-accent">
                {link.label}
              </Link>
            ))}
          </nav>
          <p>
            US list prices in {MARKETS[market].currency}. Figures change; confirm before you buy.
          </p>
        </div>
      </div>
    </footer>
  )
}
