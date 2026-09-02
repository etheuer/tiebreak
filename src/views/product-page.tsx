import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCategories, getComparisons, getProductById, getProducts, inMarket, officialSourceUrl, priceOf } from '@/lib/data'
import type { MarketId } from '@/lib/markets'
import { pageAlternates, openGraphLocale } from '@/lib/hreflang'
import { catalogFor } from '@/data/spec-catalog'
import { highlightFields, specValue } from '@/lib/specs'
import { buildVerdict } from '@/lib/verdict'
import {
  categoryHref,
  compareHref,
  findComparison,
  homeHref,
  isFeeBased,
  priceCaption,
  priceShort,
  productHref,
  subLabel,
} from '@/lib/nav'
import { absUrl, clip, CATALOG_AS_OF, SITE_NAME } from '@/lib/site'
import { formatCatalogDate, formatMoney } from '@/lib/format'
import { buildProductFaq } from '@/lib/faq'
import { ProductMark } from '@/components/ProductMark'
import { ProductSpecs } from '@/components/ProductSpecs'
import { VsCard } from '@/components/VsCard'
import { FinanceDisclaimer, PriceNote } from '@/components/CatalogNotes'

export async function generateStaticParamsForMarket(market: MarketId) {
  const products = await getProducts(market)
  return products.map((product) => ({
    slug: [product.category, product.id],
  }))
}

export async function generateMetadataForMarket(
  { params }: { params: Promise<{ slug: string[] }> },
  market: MarketId
): Promise<Metadata> {
  const { slug } = await params
  const product = slug?.length >= 2 ? await getProductById(slug[1], market) : null
  if (!product || !inMarket(product, market)) return { title: 'Product not found' }
  const title = `${product.name} specs and price`
  const description = clip(`${product.name} at ${priceShort(product, market)}: ${product.description}`, 158)
  const includeUk = inMarket(product, 'uk')
  return {
    title,
    description,
    alternates: pageAlternates(productHref(product), market, includeUk),
    openGraph: {
      title,
      description,
      url: productHref(product, market),
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

export async function ProductDetail({
  params,
  market,
}: {
  params: Promise<{ slug: string[] }>
  market: MarketId
}) {
  const { slug } = await params
  if (!slug || slug.length < 2) {
    notFound()
  }

  const product = await getProductById(slug[1], market)
  if (!product || !inMarket(product, market)) {
    notFound()
  }

  const [products, comparisons, categories] = await Promise.all([
    getProducts(market),
    getComparisons(market),
    getCategories(market),
  ])

  const byId = new Map(products.map((item) => [item.id, item]))
  const category = categories.find((item) => item.id === product.category)

  const allMatchups = comparisons.filter(
    (comparison) => comparison.productA === product.id || comparison.productB === product.id
  )
  const matchups = allMatchups.slice(0, 4)

  // Closest in price reads as the real cross-shopping set.
  const alternatives = products
    .filter((item) => item.subcategory === product.subcategory && item.id !== product.id)
    .sort(
      (x, y) => Math.abs(x.price - product.price) - Math.abs(y.price - product.price)
    )
    .slice(0, 6)

  const keyNumbers = highlightFields(catalogFor(product.subcategory)).map((field) => ({
    key: field.key,
    label: field.label,
    value: specValue(product, field.key),
  }))

  const attributeCount = catalogFor(product.subcategory).reduce(
    (sum, group) => sum + group.fields.length,
    0
  )

  const faq = buildProductFaq(product, comparisons, market)

  return (
    <div className="shell">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 pt-6 text-meta text-ink-3">
        <Link href={homeHref(market)} className="hover:text-accent">
          Home
        </Link>
        <span aria-hidden>/</span>
        {category && (
          <>
            <Link href={categoryHref(category.id, market)} className="hover:text-accent">
              {category.name}
            </Link>
            <span aria-hidden>/</span>
          </>
        )}
        <span className="text-ink-2">{product.name}</span>
      </nav>

      <header className="mt-5 flex flex-col gap-6 border-b border-line pb-9 sm:flex-row sm:items-start sm:gap-7">
        <ProductMark product={product} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="eyebrow">
            {product.brand} · {subLabel(product.subcategory)}
          </p>
          <h1 className="display mt-2 text-h1">{product.name}</h1>
          <p className="mt-3 max-w-2xl text-body leading-relaxed text-ink-2">
            {product.description}
          </p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="eyebrow">{priceCaption(product.subcategory)}</p>
          <p className="num mt-1 text-stat font-semibold tracking-[-0.03em]">
            {priceShort(product, market)}
          </p>
          <p className="num mt-1 text-label text-ink-3">{attributeCount} attributes tracked</p>
          <p className="num mt-1 text-label text-ink-3">Catalog as of {formatCatalogDate(CATALOG_AS_OF)}</p>
          <PriceNote subcategory={product.subcategory} />
        </div>
      </header>

      {keyNumbers.length > 0 && (
        <section className="py-9" aria-label="Key numbers">
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            {keyNumbers.map((item) => (
              <div key={item.key} className="border-t-2 border-line pt-3">
                <p className="eyebrow">{item.label}</p>
                <p className="mt-1.5 text-body font-medium leading-snug">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-3 border-t border-line py-10 md:grid-cols-2 md:gap-5">
        <div className="card p-5">
          <h2 className="text-body font-semibold">What it does well</h2>
          <ul className="mt-3 grid gap-2">
            {product.pros.map((pro) => (
              <li key={pro} className="flex gap-2 text-cell leading-snug text-ink-2">
                <span aria-hidden style={{ color: 'var(--accent)' }}>
                  +
                </span>
                {pro}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="text-body font-semibold">Where it gives ground</h2>
          <ul className="mt-3 grid gap-2">
            {product.cons.map((con) => (
              <li key={con} className="flex gap-2 text-cell leading-snug text-ink-3">
                <span aria-hidden>−</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {matchups.length > 0 && (
        <section className="border-t border-line py-10" aria-labelledby="matchups">
          <h2 id="matchups" className="display text-h4">
            Compare it head to head
          </h2>
          <p className="mt-2 text-cell text-ink-2">
            The fastest way to decide is against the product you are actually cross shopping.
            {allMatchups.length > matchups.length &&
              ` Showing ${matchups.length} of ${allMatchups.length} published matchups.`}
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 md:gap-4">
            {matchups.map((comparison) => {
              const productA = byId.get(comparison.productA)
              const productB = byId.get(comparison.productB)
              if (!productA || !productB) return null
              return (
                <VsCard
                  market={market}
                  key={comparison.productA + comparison.productB}
                  comparison={comparison}
                  productA={productA}
                  productB={productB}
                  verdict={buildVerdict(productA, productB, market)}
                />
              )
            })}
          </div>
        </section>
      )}

      <div className="border-t border-line py-10">
        <ProductSpecs product={product} />
        {isFeeBased(product.subcategory) ? <FinanceDisclaimer products={[product]} /> : null}
      </div>

      {alternatives.length > 0 && (
        <section className="border-t border-line py-10" aria-labelledby="alternatives">
          <h2 id="alternatives" className="display text-h4">
            Other {subLabel(product.subcategory).toLowerCase()} we track
          </h2>
          <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {alternatives.map((alternative) => {
              const matchup = findComparison(comparisons, product.id, alternative.id)
              return (
                <div key={alternative.id} className="card flex flex-col p-4">
                  <div className="flex items-start gap-3">
                    <ProductMark product={alternative} size="sm" />
                    <div className="min-w-0">
                      <p className="eyebrow">{alternative.brand}</p>
                      <p className="mt-0.5 truncate text-body font-semibold">{alternative.name}</p>
                    </div>
                    <p className="num ml-auto shrink-0 text-meta text-ink-3">
                      {priceShort(alternative, market)}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {matchup && (
                      <Link href={compareHref(matchup, market)} className="chip">
                        Compare
                      </Link>
                    )}
                    <Link href={productHref(alternative, market)} className="chip">
                      Specs
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {faq.length > 0 && (
        <section className="border-t border-line py-10" aria-labelledby="product-faq">
          <h2 id="product-faq" className="display text-h4">
            Frequently asked
          </h2>
          <div className="mt-5 grid gap-4">
            {faq.map(({ q, a }) => (
              <div key={q} className="card p-5">
                <h3 className="text-body font-semibold text-ink">{q}</h3>
                <p className="mt-2 text-cell leading-relaxed text-ink-2">{a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify((() => {
            const point = priceOf(product, market)
            const sameAs = officialSourceUrl(product)
            if (isFeeBased(product.subcategory)) {
              return {
                '@context': 'https://schema.org',
                '@type': 'CreditCard',
                name: product.name,
                description: product.description,
                url: absUrl(productHref(product, market)),
                ...(sameAs ? { sameAs } : {}),
                provider: {
                  '@type': 'Organization',
                  name: product.brand,
                },
                feesAndCommissionsSpecification: point
                  ? `Annual fee ${formatMoney(point.amount, market)}`
                  : 'Annual fee not listed',
              }
            }
            return {
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: product.name,
              brand: {
                '@type': 'Brand',
                name: product.brand,
              },
              description: product.description,
              category: subLabel(product.subcategory),
              url: absUrl(productHref(product, market)),
              ...(sameAs ? { sameAs } : {}),
              ...(point
                ? {
                    offers: {
                      '@type': 'Offer',
                      price: point.amount,
                      priceCurrency: point.currency,
                      url: absUrl(productHref(product, market)),
                    },
                  }
                : {}),
            }
          })()),
        }}
      />

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
              ...(category
                ? [
                    {
                      '@type': 'ListItem',
                      position: 2,
                      name: category.name,
                      item: absUrl(categoryHref(category.id, market)),
                    },
                    {
                      '@type': 'ListItem',
                      position: 3,
                      name: product.name,
                    },
                  ]
                : [
                    {
                      '@type': 'ListItem',
                      position: 2,
                      name: product.name,
                    },
                  ]),
            ],
          }),
        }}
      />

      {faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faq.map(({ q, a }) => ({
                '@type': 'Question',
                name: q,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: a,
                },
              })),
            }),
          }}
        />
      )}
    </div>
  )
}
