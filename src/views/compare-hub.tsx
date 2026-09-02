import type { Metadata } from 'next'
import Link from 'next/link'
import { getComparisons, getProducts } from '@/lib/data'
import { buildVerdict, verdictLine } from '@/lib/verdict'
import { compareHref, homeHref, hubHref, SUBCATEGORY_LABEL, subLabel } from '@/lib/nav'
import type { MarketId } from '@/lib/markets'
import { pageAlternates, openGraphLocale } from '@/lib/hreflang'
import { absUrl, SITE_NAME } from '@/lib/site'
import { CompareBuilder } from '@/components/CompareBuilder'
import { builderData } from '@/views/compare-build'

export async function generateHubMetadata(market: MarketId): Promise<Metadata> {
  const [comparisons, ukComparisons] = await Promise.all([
    getComparisons(market),
    getComparisons('uk'),
  ])
  const includeUk = ukComparisons.length > 0
  const description = `Every head-to-head published on ${SITE_NAME}: ${comparisons.length} matchups across TVs, laptops, phones, headphones, cordless vacuums, air purifiers and credit cards, each with a spec-by-spec verdict.`
  const title = 'All product matchups'
  const path = hubHref(market)
  return {
    title,
    description,
    alternates: pageAlternates('/compare/', market, includeUk),
    openGraph: {
      title,
      description,
      url: path,
      type: 'website',
      siteName: SITE_NAME,
      locale: openGraphLocale(market),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export async function CompareHubPage({ market }: { market: MarketId }) {
  const [products, comparisons] = await Promise.all([
    getProducts(market),
    getComparisons(market),
  ])

  const { builderProducts, published } = builderData(products, comparisons, market)
  const byId = new Map(products.map((p) => [p.id, p]))

  // Group by subcategory
  const subcategories = Object.keys(SUBCATEGORY_LABEL)
  const grouped = subcategories
    .map((sub) => {
      const comps = comparisons.filter((c) => {
        const a = byId.get(c.productA)
        return a?.subcategory === sub
      })
      return {
        sub,
        label: subLabel(sub),
        comparisons: comps,
      }
    })
    .filter((g) => g.comparisons.length > 0)

  return (
    <div className="shell">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-6 text-meta text-ink-3">
        <Link href={homeHref(market)} className="hover:text-accent">
          Home
        </Link>
        <span aria-hidden>/</span>
        <span className="text-ink-2">All matchups</span>
      </nav>

      <header className="mt-5 border-b border-line pb-8">
        <p className="eyebrow">Directory</p>
        <h1 className="display mt-2 text-h1">All matchups</h1>
        <p className="mt-3 max-w-xl text-body leading-relaxed text-ink-2">
          Browse every head-to-head comparison published on {SITE_NAME}. Each matchup is scored from published
          specifications with a verdict for every pair.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {grouped.map((group) => (
            <a
              key={group.sub}
              href={`#${group.sub}`}
              className="chip"
            >
              {group.label}
            </a>
          ))}
        </div>
      </header>

      <section aria-label="Compare any two products" className="border-b border-line py-8">
        <h2 className="display text-h3">Compare any two</h2>
        <p className="mt-2 max-w-xl text-body text-ink-2">
          Missing pair? Score it instantly from published specs.
        </p>
        <CompareBuilder products={builderProducts} published={published} market={market} />
      </section>

      <div className="py-8 grid gap-10">
        {grouped.map((group) => (
          <section key={group.sub} id={group.sub} className="scroll-mt-20">
            <h2 className="display text-h3 border-b-2 border-line pb-2">
              {group.label}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {group.comparisons.map((c) => {
                const productA = byId.get(c.productA)
                const productB = byId.get(c.productB)
                const claim =
                  productA && productB
                    ? verdictLine(productA, productB, buildVerdict(productA, productB, market), market)
                    : c.description
                return (
                  <li key={c.productA + c.productB} className="card p-4">
                    <Link
                      href={compareHref(c, market)}
                      className="text-body font-semibold text-ink hover:text-accent"
                    >
                      {c.productName}
                    </Link>
                    <p className="mt-1.5 text-meta leading-relaxed text-ink-3">{claim}</p>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

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
                name: 'All matchups',
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
            '@type': 'ItemList',
            name: 'All product matchups',
            itemListElement: comparisons.map((c, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: c.productName,
              url: absUrl(compareHref(c, market)),
            })),
          }),
        }}
      />
    </div>
  )
}
