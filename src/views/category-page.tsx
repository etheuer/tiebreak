import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCategories, getComparisons, getProducts, getProductsByCategory, type Product } from '@/lib/data'
import type { MarketId } from '@/lib/markets'
import { pageAlternates, openGraphLocale } from '@/lib/hreflang'
import { catalogFor } from '@/data/spec-catalog'
import { buildVerdict } from '@/lib/verdict'
import { categoryHref, compareHref, homeHref, isFeeBased, priceCaption, priceShort, productHref, subLabel } from '@/lib/nav'
import { absUrl, SITE_NAME } from '@/lib/site'
import { casesFor } from '@/data/use-cases'
import { ProductMark } from '@/components/ProductMark'
import { VsCard } from '@/components/VsCard'
import { FinanceDisclaimer } from '@/components/CatalogNotes'

export async function generateStaticParamsForMarket(market: MarketId) {
  const categories = await getCategories(market)
  return categories.map((cat) => ({ slug: cat.id }))
}

export async function generateMetadataForMarket(
  { params }: { params: Promise<{ slug: string }> },
  market: MarketId
): Promise<Metadata> {
  const { slug } = await params
  const [categories, products, comparisons, ukCategories] = await Promise.all([
    getCategories(market),
    getProductsByCategory(slug, market),
    getComparisons(market),
    getCategories('uk'),
  ])
  const category = categories.find((c) => c.id === slug)
  if (!category) notFound()

  const productIds = new Set(products.map((p) => p.id))
  const categoryComparisons = comparisons.filter(
    (c) => productIds.has(c.productA) && productIds.has(c.productB)
  )
  const subcategoryLabels = [...new Set(products.map((p) => subLabel(p.subcategory)))]
  const description = `Compare ${products.length} ${category.name.toLowerCase()} head to head across ${subcategoryLabels.join(', ')}. ${categoryComparisons.length} published matchups with a spec-by-spec verdict.`
  const title = `${category.name} comparisons`
  const canonical = categoryHref(category.id)
  const includeUk = ukCategories.some((candidate) => candidate.id === slug)

  return {
    title,
    description,
    alternates: pageAlternates(canonical, market, includeUk),
    openGraph: {
      title,
      description,
      url: categoryHref(category.id, market),
      type: 'website',
      siteName: SITE_NAME,
      locale: openGraphLocale(market),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export async function CategoryListing({
  params,
  market,
}: {
  params: Promise<{ slug: string }>
  market: MarketId
}) {
  const { slug } = await params
  const categories = await getCategories(market)
  const currentCategory = categories.find((c) => c.id === slug)

  if (!currentCategory) {
    notFound()
  }

  const [products, comparisons, allProducts] = await Promise.all([
    getProductsByCategory(slug, market),
    getComparisons(market),
    getProducts(market),
  ])

  const byId = new Map(allProducts.map((product) => [product.id, product]))
  const productIds = new Set(products.map((product) => product.id))

  const categoryComparisons = comparisons.filter(
    (comparison) => productIds.has(comparison.productA) && productIds.has(comparison.productB)
  )

  const shortlists = [...new Set(products.map((product) => product.subcategory))].map((sub) => {
    const matchup = categoryComparisons.find((c) => byId.get(c.productA)?.subcategory === sub) ?? null
    return {
      sub,
      label: subLabel(sub),
      attributes: catalogFor(sub).reduce((sum, group) => sum + group.fields.length, 0),
      items: products.filter((product) => product.subcategory === sub).sort((x, y) => x.price - y.price),
      lenses: matchup
        ? casesFor(sub).map((useCase) => ({
            id: useCase.id,
            label: useCase.label,
            job: useCase.job,
            href: `${compareHref(matchup, market)}#for=${useCase.id}`,
          }))
        : [],
    }
  })

  // Electronics alone has ~50 published matchups. Show a spread across product
  // types instead of the first N alphabetically, which would all be one type.
  const featuredComparisons = (() => {
    const buckets = new Map<string, typeof categoryComparisons>()
    for (const comparison of categoryComparisons) {
      const sub = byId.get(comparison.productA)?.subcategory ?? 'other'
      const bucket = buckets.get(sub) ?? []
      bucket.push(comparison)
      buckets.set(sub, bucket)
    }
    const picked: typeof categoryComparisons = []
    for (let round = 0; picked.length < 6; round += 1) {
      let added = false
      for (const bucket of buckets.values()) {
        if (picked.length >= 6) break
        const comparison = bucket[round]
        if (comparison) {
          picked.push(comparison)
          added = true
        }
      }
      if (!added) break
    }
    return picked
  })()

  const otherCategories = categories.filter(
    (category) => category.id !== slug && allProducts.some((product) => product.category === category.id)
  )

  function firstMatchup(product: Product) {
    const comparison = comparisons.find(
      (c) => c.productA === product.id || c.productB === product.id
    )
    if (!comparison) return null
    const rivalId = comparison.productA === product.id ? comparison.productB : comparison.productA
    const rival = byId.get(rivalId)
    return rival ? { href: compareHref(comparison, market), rival } : null
  }

  return (
    <div className="shell">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 pt-6 text-[12.5px] text-ink-3"
      >
        <Link href={homeHref(market)} className="hover:text-accent">
          Home
        </Link>
        <span aria-hidden>/</span>
        <span className="text-ink-2">{currentCategory.name}</span>
      </nav>

      <header className="mt-5 border-b border-line pb-8">
        <p className="eyebrow">Category</p>
        <h1 className="display mt-2 text-[32px] sm:text-[44px]">{currentCategory.name}</h1>
        <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-ink-2">
          {products.length > 0
            ? `${products.length} products in the catalog across ${shortlists.length} product ${
                shortlists.length === 1 ? 'type' : 'types'
              }, with ${categoryComparisons.length} published ${
                categoryComparisons.length === 1 ? 'matchup' : 'matchups'
              }.`
            : `We track ${currentCategory.subcategories.join(', ').toLowerCase()} here, but nothing is in the catalog yet.`}
        </p>
        {products.some((product) => isFeeBased(product.subcategory)) ? <FinanceDisclaimer /> : null}
      </header>

      {products.length === 0 ? (
        <section className="py-14">
          <div className="card mx-auto max-w-xl p-8 text-center">
            <span
              aria-hidden
              className="mx-auto grid place-items-center rounded-full border border-line"
              style={{ width: 44, height: 44 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="text-ink-3">
                <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M7.5 10h9M7.5 14h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            <h2 className="mt-4 text-[19px] font-semibold tracking-[-0.02em]">
              No {currentCategory.name.toLowerCase()} products yet
            </h2>
            <p className="mx-auto mt-2.5 max-w-sm text-[13.5px] leading-relaxed text-ink-2">
              Comparing {currentCategory.subcategories.join(', ').toLowerCase()} needs a spec catalog
              we do not have yet, and we would rather show nothing than a table of guesses. This page
              will fill in when the data lands.
            </p>
            {otherCategories.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {otherCategories.map((category) => (
                  <Link key={category.id} href={categoryHref(category.id, market)} className="btn btn-ghost">
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          {shortlists.map((list) => (
            <section key={list.sub} className="py-10" aria-labelledby={`list-${list.sub}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-line pb-2.5">
                <h2 id={`list-${list.sub}`} className="display text-[21px] sm:text-[25px]">
                  <Link href={`/category/${currentCategory.id}/${list.sub}/`} className="hover:text-accent">
                    {list.label}
                  </Link>
                </h2>
                <div className="flex items-center gap-3 text-[12px] text-ink-3">
                  <span className="num">
                    {list.attributes} attributes tracked · sorted by{' '}
                    {priceCaption(list.sub).toLowerCase()}
                  </span>
                  <Link
                    href={`/category/${currentCategory.id}/${list.sub}/`}
                    className="font-medium text-accent hover:underline hidden sm:inline"
                  >
                    All {list.label.toLowerCase()} comparisons →
                  </Link>
                </div>
              </div>

              {list.lenses.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-[12px] text-ink-3">Buying for</span>
                  {list.lenses.map((lens) => (
                    <Link key={lens.id} href={lens.href} className="chip" title={lens.job}>
                      {lens.label}
                    </Link>
                  ))}
                </div>
              )}

              <ul className="mt-4 grid gap-2.5">
                {list.items.map((product, index) => {
                  const matchup = firstMatchup(product)
                  return (
                    <li
                      key={product.id}
                      className="card flex flex-col gap-4 p-4 transition-colors hover:border-line-2 sm:flex-row sm:items-center sm:gap-5"
                    >
                      <span className="num hidden w-6 shrink-0 text-[15px] font-semibold text-ink-3 sm:block">
                        {index + 1}
                      </span>
                      <ProductMark product={product} size="md" className="hidden sm:grid" />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <ProductMark product={product} size="sm" className="sm:hidden" />
                          <div className="min-w-0">
                            <p className="eyebrow">{product.brand}</p>
                            <h3 className="mt-0.5 text-[16px] font-semibold tracking-[-0.02em]">
                              <Link href={productHref(product, market)} className="hover:text-accent">
                                {product.name}
                              </Link>
                            </h3>
                          </div>
                        </div>
                        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-2">
                          {product.description}
                        </p>
                        <p className="mt-1.5 text-[12.5px] text-ink-3">
                          <span aria-hidden style={{ color: 'var(--accent)' }}>
                            +{' '}
                          </span>
                          {product.pros[0]}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-2.5">
                        <p className="num text-[20px] font-semibold tracking-[-0.03em]">
                          {priceShort(product, market)}
                        </p>
                        {matchup ? (
                          <Link href={matchup.href} className="btn btn-primary whitespace-nowrap text-[13px]">
                            Compare vs {matchup.rival.brand}
                          </Link>
                        ) : (
                          <Link href={productHref(product, market)} className="btn btn-ghost text-[13px]">
                            Spec sheet
                          </Link>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}

          {featuredComparisons.length > 0 && (
            <section className="border-t border-line py-12" aria-labelledby="cat-matchups">
              <h2 id="cat-matchups" className="display text-[21px] sm:text-[25px]">
                Matchups in {currentCategory.name.toLowerCase()}
              </h2>
              <p className="mt-2 text-[13.5px] text-ink-2">
                {featuredComparisons.length < categoryComparisons.length
                  ? `${featuredComparisons.length} of ${categoryComparisons.length} published matchups, one product type at a time.`
                  : 'Every published matchup in this category.'}
              </p>
              <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-[repeat(2,minmax(0,1fr))] md:gap-4">
                {featuredComparisons.map((comparison) => {
                  const productA = byId.get(comparison.productA)
                  const productB = byId.get(comparison.productB)
                  if (!productA || !productB) return null
                  return (
                    <VsCard
                      key={comparison.productA + comparison.productB}
                      comparison={comparison}
                      productA={productA}
                      productB={productB}
                      verdict={buildVerdict(productA, productB, market)}
                      market={market}
                    />
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}

      {currentCategory.popular_searches.length > 0 && (
        <section className="border-t border-line py-12">
          <p className="eyebrow">What shoppers ask for in {currentCategory.name.toLowerCase()}</p>
          <ul className="mt-3 grid gap-1.5 text-[14px] text-ink-2 sm:grid-cols-3">
            {currentCategory.popular_searches.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: absUrl('/'),
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: currentCategory.name,
              },
            ],
          }),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${currentCategory.name} comparisons`,
            url: absUrl(categoryHref(currentCategory.id, market)),
            hasPart: categoryComparisons.map((c) => ({
              '@type': 'WebPage',
              name: c.productName,
              url: absUrl(compareHref(c, market)),
            })),
          }),
        }}
      />
    </div>
  )
}
