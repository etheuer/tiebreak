import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getCategories,
  getComparisonBySlug,
  getComparisons,
  getProductById,
  getProducts,
  type Product,
} from '@/lib/data'
import { buildVerdict, leadAreas, priceLabel, verdictLine, type Side, type Verdict } from '@/lib/verdict'
import {
  compareHref,
  findComparison,
  isFeeBased,
  priceCaption,
  priceShort,
  productHref,
  subLabel,
} from '@/lib/nav'
import { buildAnswer, checkDealBreakers, flattenRows } from '@/lib/decision'
import { buildCompareFaq, buildLensAnswers } from '@/lib/faq'
import { absUrl, clip, SITE_NAME } from '@/lib/site'
import { useCasesFor } from '@/data/use-cases'
import { SpecTables } from '@/components/SpecTables'
import { ProductMark } from '@/components/ProductMark'
import { DecisionPanel } from '@/components/DecisionPanel'

export async function generateStaticParams() {
  const comparisons = await getComparisons()
  return comparisons.map((comp) => ({
    slug: `${comp.productA}-vs-${comp.productB}`,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const comparison = await getComparisonBySlug(slug)
  if (!comparison) return { title: 'Comparison not found' }

  const [productA, productB] = await Promise.all([
    getProductById(comparison.productA),
    getProductById(comparison.productB),
  ])
  if (!productA || !productB) return { title: comparison.productName }

  const verdict = buildVerdict(productA, productB)
  const answer = verdictLine(productA, productB, verdict)
  const rawDesc = answer.length >= 120 ? answer : `${answer} ${comparison.description}`
  const description = clip(rawDesc, 158)
  const title =
    comparison.productName.length <= 48
      ? comparison.productName
      : { absolute: comparison.productName }

  return {
    title,
    description,
    alternates: { canonical: compareHref(comparison) },
    openGraph: {
      title: comparison.productName,
      description,
      url: compareHref(comparison),
      type: 'website',
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary',
      title: comparison.productName,
      description,
    },
    keywords: comparison.keywords,
  }
}

type SwapOption = { id: string; name: string; priceText: string; href: string | null }

async function swapOptions(target: Product, keep: Product): Promise<SwapOption[]> {
  const [products, comparisons] = await Promise.all([getProducts(), getComparisons()])
  return products
    .filter((p) => p.subcategory === target.subcategory && p.id !== target.id && p.id !== keep.id)
    .sort((x, y) => x.price - y.price)
    .map((p) => {
      const match = findComparison(comparisons, p.id, keep.id)
      return {
        id: p.id,
        name: p.name,
        priceText: priceShort(p),
        href: match ? compareHref(match) : null,
      }
    })
}

function WinBar({ verdict }: { verdict: Verdict }) {
  const { aWins, bWins, scored } = verdict
  const ties = Math.max(0, scored - aWins - bWins)
  const total = Math.max(1, aWins + bWins + ties)
  return (
    <div className="flex h-2 overflow-hidden rounded-full bg-surface-2" role="img"
      aria-label={`${aWins} specs to ${bWins}`}>
      <span style={{ width: `${(aWins / total) * 100}%`, background: 'var(--accent)' }} />
      <span style={{ width: `${(bWins / total) * 100}%`, background: 'var(--rival)' }} />
    </div>
  )
}

function ProductPanel({
  product,
  side,
  wins,
  swaps,
  isLeader,
}: {
  product: Product
  side: Side
  wins: number
  swaps: SwapOption[]
  isLeader: boolean
}) {
  const tint = side === 'a' ? 'var(--accent)' : 'var(--rival)'
  const tintSoft = side === 'a' ? 'var(--accent-soft)' : 'var(--rival-soft)'
  const tintInk = side === 'a' ? 'var(--accent-2)' : 'var(--rival-2)'

  return (
    <div className="card relative flex flex-col p-5" style={{ borderTop: `3px solid ${tint}` }}>
      {isLeader && (
        <span
          className="absolute right-4 top-4 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em]"
          style={{ background: tintSoft, color: tintInk }}
        >
          Spec leader
        </span>
      )}

      <div className="flex items-start gap-3.5">
        <ProductMark product={product} size="md" tone={side} />
        <div className="min-w-0 pt-0.5">
          <p className="eyebrow">{product.brand}</p>
          <h2 className="display mt-1 text-[19px] sm:text-[21px]">{product.name}</h2>
        </div>
      </div>

      <div className="mt-4">
        <p className="eyebrow">{priceCaption(product.subcategory)}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="num text-[26px] font-semibold tracking-[-0.03em]">
            {priceShort(product)}
          </span>
          <span className="num text-[13px] font-semibold" style={{ color: tintInk }}>
            {wins} spec wins
          </span>
        </div>
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">{product.description}</p>

      <ul className="mt-4 grid gap-1.5">
        {product.pros.slice(0, 3).map((pro) => (
          <li key={pro} className="flex gap-2 text-[13px] leading-snug text-ink">
            <span aria-hidden style={{ color: tint }}>
              +
            </span>
            {pro}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
        <Link href={productHref(product)} className="chip">
          Full spec sheet
        </Link>

        {swaps.length > 0 ? (
          <details className="relative">
            <summary className="chip cursor-pointer list-none">
              Swap
              <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
                <path d="M1 3.2 5 7l4-3.8" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              </svg>
            </summary>
            <div
              className="absolute left-0 z-20 mt-1.5 max-h-72 w-60 overflow-y-auto overflow-x-hidden rounded-lg border border-line bg-surface p-1"
              style={{ boxShadow: 'var(--shadow-2)' }}
            >
              <p className="px-2.5 py-1.5 text-[11px] text-ink-3">
                Compare a different {subLabel(product.subcategory).toLowerCase().replace(/s$/, '')}
              </p>
              {swaps.map((option) =>
                option.href ? (
                  <Link
                    key={option.id}
                    href={option.href}
                    className="flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-[13px] hover:bg-surface-2"
                  >
                    <span className="truncate">{option.name}</span>
                    <span className="num shrink-0 text-[12px] text-ink-3">
                      {option.priceText}
                    </span>
                  </Link>
                ) : (
                  <span
                    key={option.id}
                    className="flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-[13px] text-ink-3"
                    title="No matchup published for that pair yet"
                  >
                    <span className="truncate">{option.name}</span>
                    <span className="text-[11px]">soon</span>
                  </span>
                )
              )}
            </div>
          </details>
        ) : (
          <span className="text-[12px] text-ink-3">
            Only two {subLabel(product.subcategory).toLowerCase()} in the catalog so far
          </span>
        )}
      </div>
    </div>
  )
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const comparison = await getComparisonBySlug(slug)

  if (!comparison) {
    notFound()
  }

  const [productA, productB] = await Promise.all([
    getProductById(comparison.productA),
    getProductById(comparison.productB),
  ])

  if (!productA || !productB) {
    notFound()
  }

  const [allComparisons, categories, swapsA, swapsB] = await Promise.all([
    getComparisons(),
    getCategories(),
    swapOptions(productA, productB),
    swapOptions(productB, productA),
  ])

  const verdict = buildVerdict(productA, productB)
  const areas = leadAreas(verdict)
  const answer = verdictLine(productA, productB, verdict)
  const category = categories.find((c) => c.id === productA.category)
  const rows = flattenRows(verdict)
  const checks = checkDealBreakers(productA, productB)
  const useCases = useCasesFor(productA.subcategory)

  const overall = buildAnswer({ productA, productB, useCase: null, rows, checks, matters: new Set() })
  const lenses = buildLensAnswers(productA, productB, rows, checks, useCases)
  const faq = buildCompareFaq(productA, productB, verdict, overall.headline, overall.reasons, lenses, checks)

  // Prefer matchups in the same product type, since 100+ files load alphabetically.
  const sameType = new Set(
    (await getProducts())
      .filter((p) => p.subcategory === productA.subcategory)
      .map((p) => p.id)
  )
  const otherComparisons = allComparisons
    .filter((c) => !(c.productA === productA.id && c.productB === productB.id))
    .sort((x, y) => {
      const xScore = Number(sameType.has(x.productA) && sameType.has(x.productB))
      const yScore = Number(sameType.has(y.productA) && sameType.has(y.productB))
      return yScore - xScore
    })
    .slice(0, 3)

  const cheaper = verdict.priceLeader === 'a' ? productA : verdict.priceLeader === 'b' ? productB : null

  return (
    <>
      <div className="shell shell-wide pt-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-ink-3">
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
          <span className="text-ink-2">{subLabel(productA.subcategory)}</span>
        </nav>

        <header className="mt-5 max-w-3xl">
          <p className="eyebrow">Head to head</p>
          <h1 className="display mt-2 text-[30px] sm:text-[40px]">{comparison.productName}</h1>
          <p className="mt-4 text-[16px] leading-relaxed text-ink sm:text-[17.5px]">{answer}</p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{comparison.description}</p>
        </header>

        {/* Two column VS hero */}
        <div className="relative mt-8 grid gap-3 md:grid-cols-2 md:gap-5">
          <ProductPanel
            product={productA}
            side="a"
            wins={verdict.aWins}
            swaps={swapsA}
            isLeader={verdict.leader === 'a'}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface text-[12px] font-bold tracking-[-0.02em] text-ink-3 md:grid"
            style={{ width: 38, height: 38 }}
          >
            VS
          </span>
          <ProductPanel
            product={productB}
            side="b"
            wins={verdict.bWins}
            swaps={swapsB}
            isLeader={verdict.leader === 'b'}
          />
        </div>

        {/* Decision aids: buying-for lens, straight answer, deal-breakers.
            The overall win summary renders inside, between the card and the lens grid. */}
        <DecisionPanel productA={productA} productB={productB} rows={rows} useCases={useCases} checks={checks}>
        {/* Win summary */}
        <section className="card mt-5 p-5" aria-label="Win summary">
          <div className="grid gap-6 md:grid-cols-[1.15fr_1fr]">
            <div>
              <div className="flex items-baseline justify-between gap-4">
                <p className="eyebrow">Measurable specs</p>
                <p className="num text-[12.5px] text-ink-3">
                  {verdict.scored} of {verdict.total} rankable
                </p>
              </div>
              <div className="mt-3">
                <WinBar verdict={verdict} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 text-[13px]">
                <span className="num font-semibold" style={{ color: 'var(--accent-2)' }}>
                  {verdict.aWins} {productA.brand}
                </span>
                <span className="num font-semibold" style={{ color: 'var(--rival-2)' }}>
                  {productB.brand} {verdict.bWins}
                </span>
              </div>
            </div>

            <dl className="grid gap-3 text-[13px] sm:grid-cols-2 md:border-l md:border-line md:pl-6">
              <div>
                <dt className="eyebrow mb-1.5">
                  {productA.brand} leads
                </dt>
                <dd className="text-ink-2">{areas.a.length ? areas.a.join(', ') : 'No section outright'}</dd>
              </div>
              <div>
                <dt className="eyebrow mb-1.5">{productB.brand} leads</dt>
                <dd className="text-ink-2">{areas.b.length ? areas.b.join(', ') : 'No section outright'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="eyebrow mb-1.5">{priceCaption(productA.subcategory)}</dt>
                <dd className="text-ink-2">
                  {cheaper ? (
                    <>
                      <span className="font-semibold text-ink">{cheaper.name}</span> saves{' '}
                      <span className="num font-semibold text-ink">
                        {priceLabel(verdict.priceGap)}
                      </span>{' '}
                      {isFeeBased(cheaper.subcategory) ? 'a year' : 'at list price'}
                    </>
                  ) : isFeeBased(productA.subcategory) ? (
                    'Both charge the same annual fee'
                  ) : (
                    'Both list at the same price'
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        </DecisionPanel>
      </div>

      <div className="mt-12">
        <SpecTables
          productA={productA}
          productB={productB}
          groups={verdict.groups}
          aWins={verdict.aWins}
          bWins={verdict.bWins}
        />
      </div>

      {/* Who should buy which */}
      <div className="shell shell-wide">
        <section className="mt-6" aria-labelledby="verdict">
          <h2 id="verdict" className="display text-[20px] sm:text-[23px]">
            Which one should you buy
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 md:gap-5">
            {[
              { product: productA, side: 'a' as const },
              { product: productB, side: 'b' as const },
            ].map(({ product, side }) => (
              <div
                key={product.id}
                className="card p-5"
                style={{ borderLeft: `3px solid ${side === 'a' ? 'var(--accent)' : 'var(--rival)'}` }}
              >
                <p className="eyebrow">Pick this one if</p>
                <h3 className="mt-1.5 text-[16px] font-semibold">{product.name}</h3>
                <ul className="mt-3 grid gap-2">
                  {product.pros.map((pro) => (
                    <li key={pro} className="flex gap-2 text-[13.5px] leading-snug text-ink-2">
                      <span aria-hidden style={{ color: side === 'a' ? 'var(--accent)' : 'var(--rival)' }}>
                        +
                      </span>
                      {pro}
                    </li>
                  ))}
                </ul>
                <p className="eyebrow mt-5 mb-2">What you give up</p>
                <ul className="grid gap-2">
                  {product.cons.map((con) => (
                    <li key={con} className="flex gap-2 text-[13.5px] leading-snug text-ink-3">
                      <span aria-hidden>−</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {lenses.length > 0 && (
          <section className="mt-14" aria-labelledby="best-for">
            <h2 id="best-for" className="display text-[20px] sm:text-[23px]">
              Best for each use
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lenses.map((lens) => (
                <div key={lens.id} className="card flex flex-col p-5">
                  <h3 className="text-[16px] font-semibold text-ink">{lens.label}</h3>
                  <p className="mt-1 text-[12.5px] text-ink-3">{lens.job}</p>
                  <p className="mt-3 text-[14px] font-semibold text-ink">{lens.headline}</p>
                  <ul className="mt-2 grid gap-1.5 text-[13px] text-ink-2">
                    {lens.reasons.map((reason) => (
                      <li key={reason} className="leading-snug">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-ink-3">
              Every answer above is computed from manufacturer-published specifications; a lens scores only the specs that matter for that use. Switch lenses interactively in the panel above.
            </p>
          </section>
        )}

        <section className="mt-14" aria-labelledby="faq">
          <h2 id="faq" className="display text-[20px] sm:text-[23px]">
            Frequently asked
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {faq.map(({ q, a }) => (
              <div key={q} className="card p-5">
                <h3 className="text-[15px] font-semibold text-ink">{q}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {otherComparisons.length > 0 && (
          <section className="mt-14" aria-labelledby="others">
            <h2 id="others" className="display text-[20px] sm:text-[23px]">
              Other matchups
            </h2>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {otherComparisons.map((comp) => (
                <Link
                  key={comp.productA + comp.productB}
                  href={compareHref(comp)}
                  className="card p-4 transition-colors hover:border-line-2"
                >
                  <p className="text-[14px] font-semibold leading-snug">{comp.productName}</p>
                  <p className="mt-1.5 line-clamp-2 text-[12.5px] text-ink-3">{comp.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: comparison.productName,
            url: absUrl(compareHref(comparison)),
            itemListElement: [productA, productB].map((product, index) => {
              const fee = isFeeBased(product.subcategory)
              return {
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'Product',
                  name: product.name,
                  brand: {
                    '@type': 'Brand',
                    name: product.brand,
                  },
                  description: product.description,
                  url: absUrl(productHref(product)),
                  ...(fee
                    ? {
                        additionalProperty: [
                          {
                            '@type': 'PropertyValue',
                            name: 'Annual fee',
                            value: product.price,
                            unitText: 'USD/year',
                          },
                        ],
                      }
                    : {
                        offers: {
                          '@type': 'Offer',
                          price: product.price,
                          priceCurrency: 'USD',
                          url: absUrl(productHref(product)),
                        },
                      }),
                },
              }
            }),
          }),
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
                      name: subLabel(productA.subcategory),
                    },
                  ]
                : [
                    {
                      '@type': 'ListItem',
                      position: 2,
                      name: subLabel(productA.subcategory),
                    },
                  ]),
            ],
          }),
        }}
      />

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
    </>
  )
}
