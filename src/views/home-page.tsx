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

  const { builderProducts, publishedPairs } = builderData(products, comparisons, market)

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
      {/* Modern Tech Editorial Hero */}
      <section className="relative overflow-hidden border-b border-line/80 bg-surface/40">
        <div className="tech-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="shell relative py-16 sm:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3.5 py-1 text-meta font-semibold text-accent shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Zero Sponsored Content • 100% Verified Specs • 3-Year TCO
          </div>

          <h1 className="display mt-6 max-w-4xl text-hero font-extrabold tracking-[-0.04em]">
            Two products enter.
            <br />
            <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-400 bg-clip-text text-transparent">
              One straight answer.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lead leading-relaxed text-ink-2">
            You already narrowed it down. Tiebreak puts flagships side by side, calculates 3-year ownership costs, checks living-room physical fit, and declares the winner on published specs.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2.5">
            {subcategories.map((entry) =>
              entry.href ? (
                <CompareLink key={entry.sub} href={entry.href} className="chip">
                  <span className="font-semibold text-ink">{entry.label}</span>
                  <span className="num text-micro text-ink-3">({entry.attributes} specs)</span>
                </CompareLink>
              ) : null
            )}
            <span className="ml-2 hidden text-meta text-ink-3 sm:inline">
              or press <kbd className="num rounded-md border border-line bg-surface px-1.5 py-0.5 text-label font-medium shadow-2xs">⌘K</kbd> to search
            </span>
          </div>
        </div>
      </section>

      {lensEntries.length > 0 && (
        <section aria-label="Start from what you are buying for" className="border-b border-line/80 bg-surface/80 backdrop-blur-md">
          <div className="shell flex flex-wrap items-center gap-2 py-3.5">
            <span className="eyebrow mr-1 text-ink-3">Buying for</span>
            {lensEntries.map((entry) => (
              <CompareLink key={entry.sub} href={entry.href} useCaseId={entry.useCaseId} className="chip">
                {entry.label}
              </CompareLink>
            ))}
          </div>
        </section>
      )}

      <div className="shell">
        {/* Strategic Differentiator Feature Matrix */}
        <section aria-label="Why Tiebreak" className="py-12 border-b border-line/80">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card p-4.5 sm:p-5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent text-title">
                  💰
                </span>
                <h3 className="text-body font-bold text-ink">3-Year True Cost</h3>
              </div>
              <p className="mt-2 text-meta leading-relaxed text-ink-2">
                List price is just step 1. We audit recurring filters, fee structures, and missing in-box accessories over 36 months.
              </p>
            </div>

            <div className="card p-4.5 sm:p-5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600 text-title">
                  🔄
                </span>
                <h3 className="text-body font-bold text-ink">Generational Leap</h3>
              </div>
              <p className="mt-2 text-meta leading-relaxed text-ink-2">
                Skip annual upgrade FOMO. We benchmark whether upgrading from your existing model is a genuine leap or a sidegrade.
              </p>
            </div>

            <div className="card p-4.5 sm:p-5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/10 text-blue-600 text-title">
                  📐
                </span>
                <h3 className="text-body font-bold text-ink">Reality Check</h3>
              </div>
              <p className="mt-2 text-meta leading-relaxed text-ink-2">
                TV console width, soundbar height clearance, laptop lap thermals, and sofa vacuum clearance before it arrives.
              </p>
            </div>

            <div className="card p-4.5 sm:p-5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/10 text-rose-600 text-title">
                  ⚠️
                </span>
                <h3 className="text-body font-bold text-ink">90-Day Regret Index</h3>
              </div>
              <p className="mt-2 text-meta leading-relaxed text-ink-2">
                Curated long-term owner frictions, hardware quirks, and maintenance headaches verified from long-term owners.
              </p>
            </div>
          </div>
        </section>

        {/* Popular Head-to-Head Matchups */}
        <section id="comparisons" className="scroll-mt-24 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-badge font-bold uppercase tracking-wider text-accent">
                <span>⚡</span> Contested Showdowns
              </div>
              <h2 className="display mt-1 text-h2">Popular matchups</h2>
              <p className="mt-1 text-body text-ink-2">
                Scored strictly from verified manufacturer specifications and objective benchmarks.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="num rounded-lg border border-line bg-surface px-2.5 py-1 text-meta font-semibold text-ink-3">
                {pairs.length} matchups indexed
              </span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[repeat(2,minmax(0,1fr))] md:gap-5">
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

        {/* Compare Any Two Product Builder */}
        <section aria-label="Compare any two products" className="border-t border-line/80 py-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-badge font-bold uppercase tracking-wider text-accent">
              <span>⚔️</span> Custom Arena
            </div>
            <h2 className="display mt-1 text-h2">Compare any two flagships</h2>
            <p className="mt-2 text-body leading-relaxed text-ink-2">
              Your exact shortlisted pair isn&apos;t featured above? Select any two products in the same category to generate an instant head-to-head score and complete breakdown.
            </p>
          </div>
          <CompareBuilder products={builderProducts} publishedPairs={publishedPairs} market={market} />
        </section>

        {/* Category Hub */}
        <section id="categories" className="scroll-mt-24 border-t border-line/80 py-14">
          <h2 className="display text-h2">Browse by category</h2>
          <p className="mt-1 text-body text-ink-2">Explore full spec sheets, verified pricing, and rankings.</p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const categoryProducts = products.filter((product) => product.category === category.id)
              if (categoryProducts.length === 0) return null
              const activeSubs = [...new Set(categoryProducts.map((product) => product.subcategory))]
              if (activeSubs.length === 0) return null
              return (
                <div key={category.id} className="card card-hover flex flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-title font-bold text-ink">{category.name}</h3>
                      <span className="num text-label font-semibold text-ink-3">
                        {categoryProducts.length} items
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {activeSubs.map((sub) => (
                        <Link
                          key={sub}
                          href={`${categoryHref(category.id, market)}#list-${sub}`}
                          className="chip text-meta"
                        >
                          {subLabel(sub)}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="mt-5 border-t border-line/60 pt-3">
                    <Link
                      href={categoryHref(category.id, market)}
                      className="inline-flex items-center gap-1 text-meta font-semibold text-accent hover:text-accent-2"
                    >
                      Explore all {category.name.toLowerCase()} →
                    </Link>
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
