import type { Metadata } from 'next'
import Link from 'next/link'
import { getCategories, getComparisons, getProducts } from '@/lib/data'
import { marketPath, type MarketId } from '@/lib/markets'
import { pageAlternates, openGraphLocale } from '@/lib/hreflang'
import { catalogFor } from '@/data/spec-catalog'
import { buildVerdict } from '@/lib/verdict'
import { categoryHref, compareHref, subLabel } from '@/lib/nav'
import { primaryUseCase } from '@/data/use-cases'
import { VsCard } from '@/components/VsCard'
import { CompareBuilder } from '@/components/CompareBuilder'
import { builderData } from '@/lib/builder-data'
import { CompareLink } from '@/components/CompareLink'

export async function homeMetadata(market: MarketId): Promise<Metadata> {
  const ukProducts = await getProducts('uk')
  const includeUk = ukProducts.length > 0
  const path = marketPath(market, '/')
  return {
    alternates: pageAlternates('/', market, includeUk),
    openGraph: { url: path, locale: openGraphLocale(market) },
  }
}

export async function HomePage({ market }: { market: MarketId }) {
  const [products, comparisons, categories] = await Promise.all([
    getProducts(market),
    getComparisons(market),
    getCategories(market),
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
    verdict: buildVerdict(pair.productA, pair.productB, market),
  }))

  const { builderProducts, published } = builderData(products, comparisons, market)

  const subcategories = [...new Set(products.map((product) => product.subcategory))].map((sub) => {
    const entry = pairs.find((pair) => pair.productA.subcategory === sub)
    return {
      sub,
      label: subLabel(sub),
      attributes: catalogFor(sub).reduce((sum, group) => sum + group.fields.length, 0),
      products: products.filter((product) => product.subcategory === sub).length,
      matchups: pairs.filter((pair) => pair.productA.subcategory === sub).length,
      href: entry ? compareHref(entry.comparison, market) : null,
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
        useCaseId: useCase.id,
      },
    ]
  })

  return (
    <>
      {/* Hero: typographic, no feature-card wall */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="hairline-grid pointer-events-none absolute inset-0 opacity-[0.55]" aria-hidden />
        <div className="shell relative py-14 sm:py-20">

          <h1 className="display mt-4 max-w-3xl text-hero">
            Two products.
            <br />
            <span style={{ color: 'var(--accent)' }}>One answer.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lead leading-relaxed text-ink-2">
            You already narrowed it down. Clinchmark puts the pair side by side, marks every
            difference, and says which one wins on the numbers that matter.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            {subcategories.map((entry) =>
              entry.href ? (
                <CompareLink key={entry.sub} href={entry.href} className="chip">
                  {entry.label}
                  <span className="num text-micro text-ink-3">{entry.attributes} specs</span>
                </CompareLink>
              ) : null
            )}
            <span className="ml-1 hidden text-meta text-ink-3 sm:inline">
              or press <kbd className="num rounded border border-line px-1.5 py-0.5 text-label">/</kbd> to
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
              <CompareLink key={entry.sub} href={entry.href} useCaseId={entry.useCaseId} className="chip">
                {entry.label}
              </CompareLink>
            ))}
          </div>
        </section>
      )}

      <div className="shell">
        <section id="comparisons" className="scroll-mt-24 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="display text-h2">Popular matchups</h2>
              <p className="mt-2 text-body text-ink-2">
                Every matchup is scored from published specs, not opinion.
              </p>
            </div>
            <p className="num text-meta text-ink-3">{pairs.length} published</p>
          </div>

          <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-[repeat(2,minmax(0,1fr))] md:gap-4">
            {cards.map((card) => (
              <VsCard
                key={card.comparison.productA + card.comparison.productB}
                comparison={card.comparison}
                productA={card.productA}
                productB={card.productB}
                verdict={card.verdict}
                market={market}
              />
            ))}
          </div>
        </section>

        <section aria-label="Compare any two products" className="border-t border-line py-14">
          <h2 className="display text-h2">Compare any two</h2>
          <p className="mt-2 max-w-xl text-body text-ink-2">
            Your shortlist isn&apos;t on the list? Pick the pair and get the verdict instantly.
          </p>
          <CompareBuilder products={builderProducts} published={published} market={market} />
        </section>

        <section id="categories" className="scroll-mt-24 border-t border-line py-14">
          <h2 className="display text-h2">Browse by category</h2>
          <div className="mt-6 flex flex-col divide-y divide-line border-y border-line">
            {categories.map((category) => {
              const categoryProducts = products.filter((product) => product.category === category.id)
              if (categoryProducts.length === 0) return null
              const activeSubs = [...new Set(categoryProducts.map((product) => product.subcategory))]
              if (activeSubs.length === 0) return null
              return (
                <div key={category.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-6">
                  <h3 className="w-32 shrink-0 text-body font-semibold">{category.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {activeSubs.map((sub) => (
                      <Link
                        key={sub}
                        href={`${categoryHref(category.id, market)}#list-${sub}`}
                        className="chip"
                      >
                        {subLabel(sub)}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </>
  )
}
