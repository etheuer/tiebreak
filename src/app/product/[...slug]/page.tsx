import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCategories, getComparisons, getProductById, getProducts } from '@/lib/data'
import { catalogFor } from '@/data/spec-catalog'
import { highlightFields, specValue } from '@/lib/specs'
import { buildVerdict } from '@/lib/verdict'
import {
  compareHref,
  findComparison,
  isFeeBased,
  priceCaption,
  priceShort,
  productHref,
  subLabel,
} from '@/lib/nav'
import { absUrl, clip, SITE_NAME } from '@/lib/site'
import { ProductMark } from '@/components/ProductMark'
import { ProductSpecs } from '@/components/ProductSpecs'
import { VsCard } from '@/components/VsCard'

export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((product) => ({
    slug: [product.category, product.id],
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = slug?.length >= 2 ? await getProductById(slug[1]) : null
  if (!product) return { title: 'Product not found' }
  const title = `${product.name} specs and price`
  const description = clip(`${product.name} at ${priceShort(product)}: ${product.description}`, 158)
  return {
    title,
    description,
    alternates: { canonical: productHref(product) },
    openGraph: {
      title,
      description,
      url: productHref(product),
      type: 'website',
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  if (!slug || slug.length < 2) {
    notFound()
  }

  const product = await getProductById(slug[1])
  if (!product) {
    notFound()
  }

  const [products, comparisons, categories] = await Promise.all([
    getProducts(),
    getComparisons(),
    getCategories(),
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

  return (
    <div className="shell">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 pt-6 text-[12.5px] text-ink-3">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>
        <span aria-hidden>/</span>
        {category && (
          <>
            <Link href={`/category/${category.id}/`} className="hover:text-accent">
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
          <h1 className="display mt-2 text-[30px] sm:text-[42px]">{product.name}</h1>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-ink-2">
            {product.description}
          </p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="eyebrow">{priceCaption(product.subcategory)}</p>
          <p className="num mt-1 text-[30px] font-semibold tracking-[-0.03em]">
            {priceShort(product)}
          </p>
          <p className="num mt-1 text-[12px] text-ink-3">{attributeCount} attributes tracked</p>
        </div>
      </header>

      {keyNumbers.length > 0 && (
        <section className="py-9" aria-label="Key numbers">
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            {keyNumbers.map((item) => (
              <div key={item.key} className="border-t-2 border-line pt-3">
                <p className="eyebrow">{item.label}</p>
                <p className="mt-1.5 text-[15px] font-medium leading-snug">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-3 border-t border-line py-10 md:grid-cols-2 md:gap-5">
        <div className="card p-5" style={{ borderLeft: '3px solid var(--accent)' }}>
          <h2 className="text-[15px] font-semibold">What it does well</h2>
          <ul className="mt-3 grid gap-2">
            {product.pros.map((pro) => (
              <li key={pro} className="flex gap-2 text-[13.5px] leading-snug text-ink-2">
                <span aria-hidden style={{ color: 'var(--accent)' }}>
                  +
                </span>
                {pro}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5" style={{ borderLeft: '3px solid var(--line-2)' }}>
          <h2 className="text-[15px] font-semibold">Where it gives ground</h2>
          <ul className="mt-3 grid gap-2">
            {product.cons.map((con) => (
              <li key={con} className="flex gap-2 text-[13.5px] leading-snug text-ink-3">
                <span aria-hidden>−</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {matchups.length > 0 && (
        <section className="border-t border-line py-10" aria-labelledby="matchups">
          <h2 id="matchups" className="display text-[20px] sm:text-[24px]">
            Compare it head to head
          </h2>
          <p className="mt-2 text-[13.5px] text-ink-2">
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
                  key={comparison.productA + comparison.productB}
                  comparison={comparison}
                  productA={productA}
                  productB={productB}
                  verdict={buildVerdict(productA, productB)}
                />
              )
            })}
          </div>
        </section>
      )}

      <div className="border-t border-line py-10">
        <ProductSpecs product={product} />
      </div>

      {alternatives.length > 0 && (
        <section className="border-t border-line py-10" aria-labelledby="alternatives">
          <h2 id="alternatives" className="display text-[20px] sm:text-[24px]">
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
                      <p className="mt-0.5 truncate text-[14px] font-semibold">{alternative.name}</p>
                    </div>
                    <p className="num ml-auto shrink-0 text-[13px] text-ink-3">
                      {priceShort(alternative)}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {matchup && (
                      <Link href={compareHref(matchup)} className="chip">
                        Compare
                      </Link>
                    )}
                    <Link href={productHref(alternative)} className="chip">
                      Specs
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            isFeeBased(product.subcategory)
              ? {
                  '@context': 'https://schema.org',
                  '@type': 'CreditCard',
                  name: product.name,
                  description: product.description,
                  url: absUrl(productHref(product)),
                  provider: {
                    '@type': 'Organization',
                    name: product.brand,
                  },
                  feesAndCommissionsSpecification: `Annual fee $${product.price}`,
                }
              : {
                  '@context': 'https://schema.org',
                  '@type': 'Product',
                  name: product.name,
                  brand: {
                    '@type': 'Brand',
                    name: product.brand,
                  },
                  description: product.description,
                  category: subLabel(product.subcategory),
                  url: absUrl(productHref(product)),
                  offers: {
                    '@type': 'Offer',
                    price: product.price,
                    priceCurrency: 'USD',
                    url: absUrl(productHref(product)),
                  },
                }
          ),
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
                item: absUrl('/'),
              },
              ...(category
                ? [
                    {
                      '@type': 'ListItem',
                      position: 2,
                      name: category.name,
                      item: absUrl(`/category/${category.id}/`),
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
    </div>
  )
}
