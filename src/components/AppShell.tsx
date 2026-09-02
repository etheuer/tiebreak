import { getCategories, getComparisons, getProducts } from '@/lib/data'
import { buildJumpIndex, categoryHref, homeHref, hubHref } from '@/lib/nav'
import { isMarketPublished, type MarketId } from '@/lib/markets'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { MarketBanner } from '@/components/MarketBanner'
import { Analytics } from '@/components/Analytics'

export async function AppShell({
  market,
  children,
}: {
  market: MarketId
  children: React.ReactNode
}) {
  const publishUk = isMarketPublished('uk')
  const [products, comparisons, categories, ukProducts, ukComparisons, ukCategories] = await Promise.all([
    getProducts(market),
    getComparisons(market),
    getCategories(market),
    publishUk ? getProducts('uk') : Promise.resolve([]),
    publishUk ? getComparisons('uk') : Promise.resolve([]),
    publishUk ? getCategories('uk') : Promise.resolve([]),
  ])

  const index = buildJumpIndex(products, comparisons, categories, market)
  const nav = [
    ...categories.map((category) => ({
      label: category.name,
      href: categoryHref(category.id, market),
    })),
    { label: 'Matchups', href: hubHref(market) },
  ]

  const orgWebsiteSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#org`,
        name: SITE_NAME,
        url: SITE_URL,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        publisher: { '@id': `${SITE_URL}/#org` },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgWebsiteSchema) }}
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      {publishUk ? (
        <MarketBanner
          market={market}
          ukProductIds={ukProducts.map((product) => product.id)}
          ukCompareSlugs={ukComparisons.map((comparison) => `${comparison.productA}-vs-${comparison.productB}`)}
          ukCategoryIds={ukCategories.map((category) => category.id)}
        />
      ) : null}
      <SiteHeader index={index} nav={nav} homeHref={homeHref(market)} />
      <main id="main">{children}</main>
      {market === 'uk' ? (
        <p className="shell pb-2 text-meta leading-relaxed text-ink-3">
          UK buyers also have rights under the Consumer Rights Act 2015; this sheet is manufacturer
          warranty, not legal advice.
        </p>
      ) : null}
      <SiteFooter
        categories={categories}
        comparisons={comparisons}
        products={products}
        market={market}
      />
      <Analytics />
    </>
  )
}
