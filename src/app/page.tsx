import type { Metadata } from 'next'
import Link from 'next/link'
import { getCategories, getComparisons, getProducts } from '@/lib/data'
import { catalogFor } from '@/data/spec-catalog'
import { buildVerdict } from '@/lib/verdict'
import { compareHref, subLabel } from '@/lib/nav'
import { primaryUseCase } from '@/data/use-cases'
import { VsCard } from '@/components/VsCard'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
}

export default async function Home() {
  const [products, comparisons, categories] = await Promise.all([
    getProducts(),
    getComparisons(),
    getCategories(),
  ])

  const byId = new Map(products.map((product) => [product.id, product]))

  const pairs = comparisons
    .map((comparison) => {
      const productA = byId.get(comparison.productA)
      const productB = byId.get(comparison.productB)
      if (!productA || !productB) return null
      return { comparison, productA, productB }
    })
    .filter((pair): pair is NonNullable<typeof pair> => pair !== null)

  // Comparison files load alphabetically, so take one per product type in turn.
  // Otherwise the front page is eight air purifiers.
  const buckets = new Map<string, typeof pairs>()
  for (const pair of pairs) {
    const bucket = buckets.get(pair.productA.subcategory) ?? []
    bucket.push(pair)
    buckets.set(pair.productA.subcategory, bucket)
  }

  const featured: typeof pairs = []
  for (let round = 0; featured.length < 8; round += 1) {
    let added = false
    for (const bucket of buckets.values()) {
      if (featured.length >= 8) break
      const pair = bucket[round]
      if (pair) {
        featured.push(pair)
        added = true
      }
    }
    if (!added) break
  }

  const cards = featured.map((pair) => ({
    ...pair,
    verdict: buildVerdict(pair.productA, pair.productB),
  }))

  const subcategories = [...new Set(products.map((product) => product.subcategory))].map((sub) => {
    const entry = pairs.find((pair) => pair.productA.subcategory === sub)
    return {
      sub,
      label: subLabel(sub),
      attributes: catalogFor(sub).reduce((sum, group) => sum + group.fields.length, 0),
      products: products.filter((product) => product.subcategory === sub).length,
      matchups: pairs.filter((pair) => pair.productA.subcategory === sub).length,
      href: entry ? compareHref(entry.comparison) : null,
    }
  })

  // One entry point per product type, opening its top matchup through the lens
  // most shoppers start from (#for= is read client-side, so links stay static).
  const lensEntries = subcategories.flatMap((entry) => {
    const useCase = primaryUseCase(entry.sub)
    if (!entry.href || !useCase) return []
    return [
      {
        sub: entry.sub,
        label: `${entry.label} for ${useCase.label.toLowerCase()}`,
        href: `${entry.href}#for=${useCase.id}`,
      },
    ]
  })

  return (
    <>
      {/* Hero: typographic, no feature-card wall */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="hairline-grid pointer-events-none absolute inset-0 opacity-[0.55]" aria-hidden />
        <div className="shell relative py-14 sm:py-20">
          <p className="eyebrow">Head to head spec comparisons</p>
          <h1 className="display mt-4 max-w-3xl text-[38px] sm:text-[58px] lg:text-[68px]">
            Two products.
            <br />
            <span style={{ color: 'var(--accent)' }}>One answer.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-ink-2 sm:text-[18px]">
            You already narrowed it down. Tiebreak puts the pair side by side, marks every
            difference, and says which one wins on the numbers that matter.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            {subcategories.map((entry) =>
              entry.href ? (
                <Link key={entry.sub} href={entry.href} className="chip">
                  {entry.label}
                  <span className="num text-[11px] text-ink-3">{entry.attributes} specs</span>
                </Link>
              ) : null
            )}
            <span className="ml-1 hidden text-[12.5px] text-ink-3 sm:inline">
              or press <kbd className="num rounded border border-line px-1.5 py-0.5 text-[10.5px]">/</kbd> to
              search
            </span>
          </div>
        </div>
      </section>

      {lensEntries.length > 0 && (
        <section aria-label="Start from what you are buying for" className="border-b border-line bg-surface">
          <div className="shell flex flex-wrap items-center gap-2 py-3.5">
            <span className="eyebrow mr-1">Buying for</span>
            {lensEntries.map((entry) => (
              <Link key={entry.sub} href={entry.href} className="chip">
                {entry.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="shell">
        <section id="comparisons" className="scroll-mt-24 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="display text-[24px] sm:text-[30px]">Popular matchups</h2>
              <p className="mt-2 text-[14px] text-ink-2">
                Every matchup is scored from published specs, not opinion.
              </p>
            </div>
            <p className="num text-[12.5px] text-ink-3">{pairs.length} published</p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 md:gap-4">
            {cards.map((card) => (
              <VsCard
                key={card.comparison.productA + card.comparison.productB}
                comparison={card.comparison}
                productA={card.productA}
                productB={card.productB}
                verdict={card.verdict}
              />
            ))}
          </div>
        </section>

        <section id="categories" className="scroll-mt-24 border-t border-line py-14">
          <h2 className="display text-[24px] sm:text-[30px]">Browse by category</h2>
          <p className="mt-2 text-[14px] text-ink-2">
            Pick a category to see what is in the catalog and where the matchups are.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const count = products.filter((product) => product.category === category.id).length
              return (
                <Link
                  key={category.id}
                  href={`/category/${category.id}/`}
                  className="card group flex flex-col p-5 transition-colors hover:border-line-2"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[17px] font-semibold tracking-[-0.02em]">{category.name}</h3>
                    <span className="num text-[12px] text-ink-3">
                      {count > 0 ? `${count} products` : 'empty'}
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
                    {category.subcategories.join(' · ')}
                  </p>
                  <span
                    className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold"
                    style={{ color: count > 0 ? 'var(--accent)' : 'var(--ink-3)' }}
                  >
                    {count > 0 ? 'Open category' : 'Nothing here yet'}
                    {count > 0 && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        aria-hidden
                        className="transition-transform group-hover:translate-x-0.5"
                      >
                        <path
                          d="M2 6h7M6.2 3.2 9 6l-2.8 2.8"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="border-t border-line py-14">
          <h2 className="display text-[20px] sm:text-[24px]">What gets compared</h2>
          <div className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            {subcategories.map((entry) => (
              <div key={entry.sub} className="border-t-2 border-line pt-3">
                <p className="num text-[26px] font-semibold tracking-[-0.03em]">{entry.attributes}</p>
                <p className="mt-0.5 text-[13.5px] font-medium">{entry.label}</p>
                <p className="mt-1 text-[12.5px] text-ink-3">
                  attributes tracked across {entry.products} products and {entry.matchups} matchups
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-[13px] leading-relaxed text-ink-3">
            Spec groups follow the conventions shoppers already know: GSMArena style groupings for
            phones, RTINGS style picture and gaming splits for TVs. Figures are manufacturer
            published, so anything we cannot rank honestly is shown as a difference without a winner.
          </p>
        </section>
      </div>
    </>
  )
}
