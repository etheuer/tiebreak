import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getCategories,
  getComparisons,
  getProducts,
  type Product,
} from '@/lib/data'
import type { MarketId } from '@/lib/markets'
import { pageAlternates, openGraphLocale } from '@/lib/hreflang'
import { catalogFor } from '@/data/spec-catalog'
import { buildVerdict, verdictLine } from '@/lib/verdict'
import {
  categoryHref,
  compareHref,
  homeHref,
  isFeeBased,
  priceCaption,
  priceShort,
  productHref,
  subLabel,
} from '@/lib/nav'
import { absUrl, CATALOG_AS_OF, SITE_NAME } from '@/lib/site'
import { formatCatalogDate } from '@/lib/format'
import { casesFor } from '@/data/use-cases'
import { buildAnswer, checkDealBreakers, flattenRows, lensRows, shortName } from '@/lib/decision'
import { ProductMark } from '@/components/ProductMark'
import { FinanceDisclaimer } from '@/components/CatalogNotes'

const FLAGSHIP_PATTERN = /(?:iPhone|Galaxy|MacBook|OLED|Bravia|A95|Dyson|Amex|WH-1000|Bose)/i

export async function generateStaticParamsForMarket(market: MarketId) {
  const products = await getProducts(market)
  const seen = new Set<string>()
  const params: { slug: string; sub: string }[] = []
  for (const product of products) {
    const key = `${product.category}/${product.subcategory}`
    if (!seen.has(key)) {
      seen.add(key)
      params.push({ slug: product.category, sub: product.subcategory })
    }
  }
  return params
}

export async function generateMetadataForMarket(
  { params }: { params: Promise<{ slug: string; sub: string }> },
  market: MarketId
): Promise<Metadata> {
  const { slug, sub } = await params
  const [categories, products, comparisons] = await Promise.all([
    getCategories(market),
    getProducts(market),
    getComparisons(market),
  ])

  const category = categories.find((c) => c.id === slug)
  const subProducts = products.filter((p) => p.category === slug && p.subcategory === sub)
  if (!category || subProducts.length === 0) return { title: 'Not found' }

  const subIds = new Set(subProducts.map((p) => p.id))
  const subComparisons = comparisons.filter(
    (c) => subIds.has(c.productA) && subIds.has(c.productB)
  )

  const title = `${subLabel(sub)} comparisons`
  const description = `Compare ${subProducts.length} ${subLabel(sub).toLowerCase()} head to head across published specifications. ${subComparisons.length} matchups with spec-by-spec verdicts.`
  const canonical = `/category/${slug}/${sub}/`

  return {
    title,
    description,
    alternates: pageAlternates(canonical, market, false),
    openGraph: {
      title,
      description,
      url: absUrl(canonical),
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

export async function SubcategoryListing({
  params,
  market,
}: {
  params: Promise<{ slug: string; sub: string }>
  market: MarketId
}) {
  const { slug, sub } = await params
  const [categories, products, comparisons] = await Promise.all([
    getCategories(market),
    getProducts(market),
    getComparisons(market),
  ])

  const category = categories.find((c) => c.id === slug)
  const subProducts = products
    .filter((p) => p.category === slug && p.subcategory === sub)
    .sort((a, b) => a.price - b.price)

  if (!category || subProducts.length === 0) {
    notFound()
  }

  const byId = new Map(products.map((p) => [p.id, p]))
  const subIds = new Set(subProducts.map((p) => p.id))
  const subComparisons = comparisons.filter(
    (c) => subIds.has(c.productA) && subIds.has(c.productB)
  )

  const attributesCount = catalogFor(sub).reduce(
    (sum, group) => sum + group.fields.length,
    0
  )

  const flagshipComp =
    subComparisons.find((c) => FLAGSHIP_PATTERN.test(c.productName)) ??
    subComparisons[0]

  const useCases = casesFor(sub)
  const lensTableData = subComparisons.map((c) => {
    const a = byId.get(c.productA)!
    const b = byId.get(c.productB)!
    const verdict = buildVerdict(a, b, market)
    const rows = flattenRows(verdict)
    const checks = checkDealBreakers(a, b)
    const winners = useCases.map((uc) => {
      const ans = buildAnswer({
        productA: a,
        productB: b,
        useCase: uc,
        rows: lensRows(rows, uc),
        checks,
        matters: new Set(),
        market,
      })
      if (ans.pick === 'a') return shortName(a)
      if (ans.pick === 'b') return shortName(b)
      return 'Tie'
    })
    return {
      productName: c.productName,
      href: compareHref(c, market),
      winners,
    }
  })

  function firstMatchup(product: Product) {
    const comparison = subComparisons.find(
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
        className="flex flex-wrap items-center gap-1.5 pt-6 text-[12.5px] text-ink-3"
      >
        <Link href={homeHref(market)} className="hover:text-accent">
          Home
        </Link>
        <span aria-hidden>/</span>
        <Link href={categoryHref(category.id, market)} className="hover:text-accent">
          {category.name}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-ink-2">{subLabel(sub)}</span>
      </nav>

      <header className="mt-5 border-b border-line pb-8">
        <p className="eyebrow">{category.name} comparisons</p>
        <h1 className="display mt-2 text-[32px] sm:text-[44px]">
          {subLabel(sub)} comparisons
        </h1>
        <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-ink-2">
          Compare {subProducts.length} {subLabel(sub).toLowerCase()} head to head across{' '}
          {attributesCount} tracked specifications. Every matchup is scored strictly from
          published maker spec sheets with no lab test estimates.
          {flagshipComp && (
            <>
              {' '}For a flagship matchup, explore the{' '}
              <Link
                href={compareHref(flagshipComp, market)}
                className="text-accent font-medium hover:underline"
              >
                {flagshipComp.productName}
              </Link>{' '}
              breakdown.
            </>
          )}
        </p>
        <p className="mt-2 text-[12px] text-ink-3">
          Catalog as of {formatCatalogDate(CATALOG_AS_OF)} · {subComparisons.length} published matchups
        </p>
        {isFeeBased(sub) ? <FinanceDisclaimer /> : null}
      </header>

      {useCases.length > 0 && subComparisons.length > 0 && (
        <section className="py-10 border-b border-line" aria-labelledby="use-case-winners">
          <div className="flex flex-wrap items-baseline justify-between gap-3 pb-2.5">
            <h2 id="use-case-winners" className="display text-[21px] sm:text-[25px]">
              Best for each use
            </h2>
            <p className="num text-[12px] text-ink-3">
              Use-case leaders scored across {useCases.length} buying priorities
            </p>
          </div>
          <div className="mt-4 overflow-x-auto card p-4">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-ink">
                  <th className="pb-3 pr-4 font-semibold">Matchup</th>
                  {useCases.map((uc) => (
                    <th key={uc.id} className="pb-3 px-3 font-semibold">
                      {uc.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-ink-2">
                {lensTableData.map((row) => (
                  <tr key={row.productName} className="hover:bg-surface-2">
                    <td className="py-2.5 pr-4 font-medium text-ink">
                      <Link href={row.href} className="hover:text-accent hover:underline">
                        {row.productName}
                      </Link>
                    </td>
                    {row.winners.map((winner, idx) => (
                      <td key={idx} className="py-2.5 px-3">
                        <span className={winner !== 'Tie' ? 'font-medium text-ink' : 'text-ink-3'}>
                          {winner}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="py-10 border-b border-line" aria-labelledby="all-matchups">
        <div className="flex flex-wrap items-baseline justify-between gap-3 pb-2.5">
          <h2 id="all-matchups" className="display text-[21px] sm:text-[25px]">
            {subLabel(sub)} matchups
          </h2>
          <p className="num text-[12px] text-ink-3">
            {subComparisons.length} published comparisons
          </p>
        </div>
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-[repeat(2,minmax(0,1fr))] md:gap-4">
          {subComparisons.map((comparison) => {
            const productA = byId.get(comparison.productA)
            const productB = byId.get(comparison.productB)
            if (!productA || !productB) return null
            const verdict = buildVerdict(productA, productB, market)
            const answer = verdictLine(productA, productB, verdict, market)
            return (
              <Link
                key={comparison.productA + comparison.productB}
                href={compareHref(comparison, market)}
                className="card group min-w-0 flex flex-col p-4 transition-all hover:border-line-2 sm:p-5"
                style={{ boxShadow: 'var(--shadow-1)' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="eyebrow">{subLabel(productA.subcategory)}</span>
                  <span className="num text-[11.5px] text-ink-3">{verdict.differing} differences</span>
                </div>
                <h3 className="mt-2 text-[16px] font-semibold text-ink group-hover:text-accent">
                  {comparison.productName}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
                  {answer}
                </p>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-line text-[12.5px]">
                  <span className="num text-ink-3">
                    {shortName(productA)} ({priceShort(productA, market)}) vs {shortName(productB)} ({priceShort(productB, market)})
                  </span>
                  <span className="font-semibold text-accent inline-flex items-center gap-1">
                    Compare →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="py-10" aria-labelledby="sub-products">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-line pb-2.5">
          <h2 id="sub-products" className="display text-[21px] sm:text-[25px]">
            All {subLabel(sub).toLowerCase()} in the catalog
          </h2>
          <p className="num text-[12px] text-ink-3">
            {subProducts.length} products · sorted by {priceCaption(sub).toLowerCase()}
          </p>
        </div>

        <ul className="mt-4 grid gap-2.5">
          {subProducts.map((product, index) => {
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
                  {product.pros[0] && (
                    <p className="mt-1.5 text-[12.5px] text-ink-3">
                      <span aria-hidden style={{ color: 'var(--accent)' }}>
                        +{' '}
                      </span>
                      {product.pros[0]}
                    </p>
                  )}
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
                item: absUrl(homeHref(market)),
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: category.name,
                item: absUrl(categoryHref(category.id, market)),
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: `${subLabel(sub)} comparisons`,
                item: absUrl(`/category/${slug}/${sub}/`),
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
            name: `${subLabel(sub)} comparisons`,
            url: absUrl(`/category/${slug}/${sub}/`),
            hasPart: subComparisons.map((c) => ({
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
