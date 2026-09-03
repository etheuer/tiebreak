import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getCategories,
  getComparisonBySlug,
  getComparisons,
  getProductById,
  getProducts,
  inMarket,
  officialSourceUrl,
  priceOf,
  type Product,
} from '@/lib/data'
import { buildVerdict, verdictLine, type Side } from '@/lib/verdict'
import {
  buildHref,
  categoryHref,
  compareHref,
  findComparison,
  homeHref,
  isFeeBased,
  priceShort,
  productHref,
  subLabel,
  subLabelSingular,
} from '@/lib/nav'
import { pageAlternates, openGraphLocale } from '@/lib/hreflang'
import type { MarketId } from '@/lib/markets'
import { buildAnswer, checkDealBreakers, flattenRows, shortName } from '@/lib/decision'
import { buildCompareFaq, buildLensAnswers } from '@/lib/faq'
import { absUrl, clip, CATALOG_AS_OF, SITE_NAME } from '@/lib/site'
import { displaySpec, formatCatalogDate } from '@/lib/format'
import { casesFor } from '@/data/use-cases'
import { SpecTables } from '@/components/SpecTables'
import { ProductImage } from '@/components/ProductImage'
import { DecisionPanel } from '@/components/DecisionPanel'
import { GenerationalUpgradeBanner } from '@/components/GenerationalUpgradeBanner'
import { TcoCard } from '@/components/TcoCard'
import { PhysicalFitSection } from '@/components/PhysicalFitSection'
import { OwnerFrictionCheck } from '@/components/OwnerFrictionCheck'
import { ShareVerdict } from '@/components/ShareVerdict'
import { FinanceDisclaimer, PriceNote } from '@/components/CatalogNotes'
import { CompareLink } from '@/components/CompareLink'
import { OfficialSourceLink } from '@/components/OfficialSourceLink'

export async function generateStaticParamsForMarket(market: MarketId) {
  const comparisons = await getComparisons(market)
  return comparisons.map((comp) => ({
    slug: `${comp.productA}-vs-${comp.productB}`,
  }))
}

export async function generateMetadataForMarket(
  { params }: { params: Promise<{ slug: string }> },
  market: MarketId
): Promise<Metadata> {
  const { slug } = await params
  const comparison = await getComparisonBySlug(slug, market)
  if (!comparison) return { title: 'Comparison not found' }

  const [productA, productB] = await Promise.all([
    getProductById(comparison.productA, market),
    getProductById(comparison.productB, market),
  ])
  if (!productA || !productB) return { title: comparison.productName }

  if (!inMarket(productA, market) || !inMarket(productB, market)) return { title: 'Comparison not found' }
  const includeUk = inMarket(productA, 'uk') && inMarket(productB, 'uk')
  const verdict = buildVerdict(productA, productB, market)
  const answer = verdictLine(productA, productB, verdict, market)
  const rawDesc = answer.length >= 120 ? answer : `${answer} ${comparison.description}`
  const description = clip(rawDesc, 158)
  const title =
    comparison.productName.length <= 48
      ? comparison.productName
      : { absolute: comparison.productName }

  return {
    title,
    description,
    alternates: pageAlternates(`/compare/${slug}/`, market, includeUk),
    openGraph: {
      title: comparison.productName,
      description,
      url: compareHref(comparison, market),
      type: 'website',
      siteName: SITE_NAME,
      locale: openGraphLocale(market),
    },
    twitter: {
      card: 'summary_large_image',
      title: comparison.productName,
      description,
    },
    keywords: comparison.keywords,
  }
}

type SwapOption = { id: string; name: string; priceText: string; href: string | null }

async function swapOptions(target: Product, keep: Product, market: MarketId): Promise<SwapOption[]> {
  const [products, comparisons] = await Promise.all([getProducts(market), getComparisons(market)])
  return products
    .filter((p) => p.subcategory === target.subcategory && p.id !== target.id && p.id !== keep.id)
    .sort((x, y) => (priceOf(x, market)?.amount ?? x.price) - (priceOf(y, market)?.amount ?? y.price))
    .map((p) => {
      const match = findComparison(comparisons, p.id, keep.id)
      return {
        id: p.id,
        name: p.name,
        priceText: priceShort(p, market),
        href: match ? compareHref(match, market) : null,
      }
    })
}

function ProductPanel({
  product,
  side,
  wins,
  swaps,
  keepId,
  isLeader,
  market,
}: {
  product: Product
  side: Side
  wins: number
  swaps: SwapOption[]
  keepId: string
  isLeader: boolean
  market: MarketId
}) {
  const tintInk = side === 'a' ? 'var(--accent-2)' : 'var(--rival-2)'
  const accentColor = side === 'a' ? 'var(--accent)' : 'var(--rival)'

  const customHref = (optionId: string) =>
    side === 'a' ? buildHref(optionId, keepId, market) : buildHref(keepId, optionId, market)

  return (
    <div
      className="card card-hover relative min-w-0 flex flex-col justify-between p-4.5 sm:p-5 rounded-2xl transition-all"
      style={{
        borderTop: `4px solid ${accentColor}`,
        background: isLeader
          ? side === 'a'
            ? 'linear-gradient(180deg, var(--accent-tint) 0%, var(--surface) 100%)'
            : 'linear-gradient(180deg, var(--rival-tint) 0%, var(--surface) 100%)'
          : 'var(--surface)',
      }}
    >
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-line/50">
          <div className="flex items-center gap-2">
            <span
              className="rounded-md px-2 py-0.5 text-badge font-bold uppercase tracking-wider"
              style={{
                background: side === 'a' ? 'var(--accent-soft)' : 'var(--rival-soft)',
                color: tintInk,
              }}
            >
              Contender {side.toUpperCase()}
            </span>
            {isLeader && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-badge font-bold uppercase">
                ★ Winner
              </span>
            )}
          </div>

          {swaps.length > 0 ? (
            <details className="swap-control relative shrink-0">
              <summary className="chip cursor-pointer list-none py-1 px-2.5 text-meta font-medium">
                Swap
                <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
                  <path d="M1 3.2 5 7l4-3.8" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                </svg>
              </summary>
              <div
                className="absolute right-0 z-30 mt-1.5 max-h-72 w-64 overflow-y-auto overflow-x-hidden rounded-xl border border-line bg-surface p-1 shadow-xl"
              >
                <p className="px-2.5 py-1.5 text-label font-medium text-ink-3">
                  Compare a different {subLabelSingular(product.subcategory)}
                </p>
                {swaps.map((option) =>
                  option.href ? (
                    <CompareLink
                      key={option.id}
                      href={option.href}
                      className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-meta hover:bg-surface-2"
                    >
                      <span className="truncate font-medium">{option.name}</span>
                      <span className="num shrink-0 text-label text-ink-3">
                        {option.priceText}
                      </span>
                    </CompareLink>
                  ) : (
                    <Link
                      key={option.id}
                      href={customHref(option.id)}
                      className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-meta hover:bg-surface-2"
                      title="No published matchup yet: score this pair live"
                    >
                      <span className="truncate font-medium">{option.name}</span>
                      <span className="num shrink-0 text-label text-ink-3">
                        {option.priceText} · custom
                      </span>
                    </Link>
                  )
                )}
              </div>
            </details>
          ) : (
            <span className="text-label text-ink-3 hidden sm:inline">
              2 of 2 {subLabel(product.subcategory).toLowerCase()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3.5 mt-3.5">
          <ProductImage product={product} size="md" tone={side} />
          <div className="min-w-0 flex-1">
            <Link
              href={productHref(product, market)}
              className="truncate block text-title font-bold leading-snug text-ink hover:text-accent transition-colors"
              title={`View ${product.name} spec sheet`}
            >
              {product.name}
            </Link>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="num text-body font-bold text-ink">{priceShort(product, market)}</span>
              <span className="text-line-2">•</span>
              <span className="num text-meta font-bold" style={{ color: tintInk }}>
                {wins} {wins === 1 ? 'spec win' : 'spec wins'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        if (!window.__swapInit) {
          window.__swapInit = true;
          document.addEventListener('click', e => {
            document.querySelectorAll('details.swap-control').forEach(d => {
              if (!d.contains(e.target)) d.removeAttribute('open')
            })
          });
          document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
              document.querySelectorAll('details.swap-control').forEach(d => d.removeAttribute('open'))
            }
          });
        }
      `}} />
    </div>
  )
}

export async function CompareMatchup({
  params,
  market,
}: {
  params: Promise<{ slug: string }>
  market: MarketId
}) {
  const { slug } = await params
  const comparison = await getComparisonBySlug(slug, market)

  if (!comparison) {
    notFound()
  }

  const [productA, productB] = await Promise.all([
    getProductById(comparison.productA, market),
    getProductById(comparison.productB, market),
  ])

  if (!productA || !productB || !inMarket(productA, market) || !inMarket(productB, market)) {
    notFound()
  }

  const [allComparisons, categories, swapsA, swapsB] = await Promise.all([
    getComparisons(market),
    getCategories(market),
    swapOptions(productA, productB, market),
    swapOptions(productB, productA, market),
  ])

  const verdict = buildVerdict(productA, productB, market)
  const answer = verdictLine(productA, productB, verdict, market)
  const category = categories.find((c) => c.id === productA.category)
  const rows = flattenRows(verdict)
  const checks = checkDealBreakers(productA, productB)
  const useCases = casesFor(productA.subcategory)

  const overall = buildAnswer({ productA, productB, useCase: null, rows, checks, matters: new Set(), market })
  const lenses = buildLensAnswers(productA, productB, rows, checks, useCases, market)
  const faq = buildCompareFaq(productA, productB, verdict, overall.headline, overall.reasons, lenses, checks, market)

  const highlightDiffs = verdict.highlights.filter((r) => r.differs)
  const otherDiffs = rows.filter((r) => r.differs && !highlightDiffs.some((h) => h.key === r.key))
  const selectedDiffs = [...highlightDiffs, ...otherDiffs].slice(0, 5)

  const nameA = shortName(productA)
  const nameB = shortName(productB)

  const whyInNumbers = selectedDiffs.map((row) => {
    const valA = displaySpec(row.a, row.key, market)
    const valB = displaySpec(row.b, row.key, market)

    const sourceA =
      row.origin === 'sheet' && productA.officialSource?.url
        ? { url: productA.officialSource.url, text: `${productA.brand} sheet, ${productA.officialSource.asOf}`, productId: productA.id }
        : null
    const noteA =
      row.origin === 'other'
        ? 'other published figure, not on maker sheet'
        : row.origin === 'editorial'
          ? 'our summary'
          : null

    const sourceB =
      row.origin === 'sheet' && productB.officialSource?.url
        ? { url: productB.officialSource.url, text: `${productB.brand} sheet, ${productB.officialSource.asOf}`, productId: productB.id }
        : null
    const noteB =
      row.origin === 'other'
        ? 'other published figure, not on maker sheet'
        : row.origin === 'editorial'
          ? 'our summary'
          : null

    return {
      key: row.key,
      label: row.label,
      valA,
      valB,
      nameA,
      nameB,
      sourceA,
      noteA,
      sourceB,
      noteB,
    }
  })

  const sameType = new Set(
    (await getProducts(market))
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

  return (
    <>
      <div className="shell shell-wide pt-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-meta text-ink-3">
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
          <span className="text-ink-2 font-medium">{subLabel(productA.subcategory)}</span>
        </nav>

        <header className="mt-5 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-0.5 text-badge font-bold uppercase tracking-wider text-accent">
            <span>⚡</span> Verified Benchmark Matchup
          </div>
          <h1 className="display mt-3 text-h1">{comparison.productName}</h1>
          <p className="mt-3.5 text-lead font-medium leading-relaxed text-ink">{answer}</p>
          <p className="mt-2 text-label text-ink-3">Verified catalog figures as of {formatCatalogDate(CATALOG_AS_OF)}</p>

          {whyInNumbers.length > 0 && (
            <div className="mt-5 rounded-2xl border border-line/80 bg-surface-2/70 p-4 sm:p-5 shadow-xs">
              <h2 className="text-meta font-bold uppercase tracking-wide text-ink flex items-center gap-1.5">
                <span>🔢</span> Why, in verified numbers:
              </h2>
              <ul className="mt-2.5 grid gap-2 text-meta leading-relaxed text-ink-2">
                {whyInNumbers.map((item) => (
                  <li key={item.key} className="flex flex-wrap items-baseline gap-1">
                    <span className="font-semibold text-ink">{item.label}:</span>{' '}
                    <span>{item.nameA} lists <strong className="text-ink font-semibold">{item.valA}</strong></span>
                    {item.sourceA ? (
                      <span className="text-micro">(<OfficialSourceLink href={item.sourceA.url} productId={item.sourceA.productId} className="text-accent hover:underline">{item.sourceA.text}</OfficialSourceLink>)</span>
                    ) : item.noteA ? (
                      <span className="text-micro">({item.noteA})</span>
                    ) : null}
                    <span className="text-line-2">vs</span>
                    <span>{item.nameB} lists <strong className="text-ink font-semibold">{item.valB}</strong></span>
                    {item.sourceB ? (
                      <span className="text-micro">(<OfficialSourceLink href={item.sourceB.url} productId={item.sourceB.productId} className="text-accent hover:underline">{item.sourceB.text}</OfficialSourceLink>)</span>
                    ) : item.noteB ? (
                      <span className="text-micro">({item.noteB})</span>
                    ) : null}
                    .
                  </li>
                ))}
              </ul>
            </div>
          )}

          <PriceNote subcategory={productA.subcategory} />

          {/* Quick-Jump Section Navigation Strip */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-y border-line/70 py-3 text-meta font-medium">
            <span className="text-badge font-bold uppercase tracking-wider text-ink-3 mr-1">Jump to:</span>
            <a href="#straight-answer" className="chip hover:text-accent">⚡ Straight Answer</a>
            <a href="#tco-card" className="chip hover:text-accent">💰 3-Year TCO</a>
            <a href="#reality-check" className="chip hover:text-accent">📐 Living Space Fit</a>
            <a href="#owner-regrets" className="chip hover:text-accent">⚠️ Owner Regrets</a>
            <a href="#spec-tables" className="chip hover:text-accent">📊 All Specifications</a>
          </div>
        </header>

        {/* Two column VS hero arena */}
        <div className="relative mt-8 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-[repeat(2,minmax(0,1fr))] md:gap-6">
          <ProductPanel
            product={productA}
            side="a"
            wins={verdict.aWins}
            swaps={swapsA}
            keepId={productB.id}
            isLeader={verdict.leader === 'a'}
            market={market}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface text-label font-black tracking-tight text-ink shadow-md md:grid"
            style={{ width: 42, height: 42 }}
          >
            VS
          </span>
          <ProductPanel
            product={productB}
            side="b"
            wins={verdict.bWins}
            swaps={swapsB}
            keepId={productA.id}
            isLeader={verdict.leader === 'b'}
            market={market}
          />
        </div>

        {/* Generational Upgrade Analysis */}
        <GenerationalUpgradeBanner productA={productA} productB={productB} />

        {/* Decision aids: buying-for lens, straight answer, deal-breakers, ecosystem filter */}
        <div id="straight-answer" className="scroll-mt-24">
          <DecisionPanel productA={productA} productB={productB} rows={rows} useCases={useCases} checks={checks} market={market} />
        </div>

        {/* True 3-Year Cost of Ownership (TCO) */}
        <div id="tco-card" className="scroll-mt-24">
          <TcoCard productA={productA} productB={productB} market={market} />
        </div>

        {/* Physical Fit & Living Space Reality Check */}
        <div id="reality-check" className="scroll-mt-24">
          <PhysicalFitSection productA={productA} productB={productB} />
        </div>

        {/* 90-Day Owner Regret & Friction Check */}
        <div id="owner-regrets" className="scroll-mt-24">
          <OwnerFrictionCheck productA={productA} productB={productB} />
        </div>
      </div>

      <div id="spec-tables" className="scroll-mt-24 mt-12">
        <SpecTables
          productA={productA}
          productB={productB}
          groups={verdict.groups}
          aWins={verdict.aWins}
          bWins={verdict.bWins}
          market={market}
        />
        {isFeeBased(productA.subcategory) ? (
          <div className="shell shell-wide">
            <FinanceDisclaimer products={[productA, productB]} />
          </div>
        ) : (
          <div className="shell shell-wide mt-4 flex flex-wrap items-center justify-between gap-2 text-meta text-ink-3">
            <span>
              Most rows are from the official spec sheet. Marked rows are other published figures or
              our summary, not lab tests we ran.
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {productA.officialSource?.url && (
                <OfficialSourceLink
                  href={productA.officialSource.url}
                  productId={productA.id}
                  brand={productA.brand}
                  className="text-accent hover:underline inline-flex items-center gap-1 font-medium"
                >
                  {productA.name} source
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <path d="M3.5 1.5h7v7M10.5 1.5 1.5 10.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="sr-only"> (opens in a new tab)</span>
                </OfficialSourceLink>
              )}
              {productB.officialSource?.url && (
                <OfficialSourceLink
                  href={productB.officialSource.url}
                  productId={productB.id}
                  brand={productB.brand}
                  className="text-accent hover:underline inline-flex items-center gap-1 font-medium"
                >
                  {productB.name} source
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <path d="M3.5 1.5h7v7M10.5 1.5 1.5 10.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="sr-only"> (opens in a new tab)</span>
                </OfficialSourceLink>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Who should buy which */}
      <div className="shell shell-wide">
        <section className="mt-6" aria-labelledby="verdict">
          <h2 id="verdict" className="display text-h4">
            Which one should you buy
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 md:gap-5">
            {[
              { product: productA, side: 'a' as const },
              { product: productB, side: 'b' as const },
            ].map(({ product, side }) => (
              <div
                key={product.id}
                className="card flex flex-col p-5"
              >
                <p className="eyebrow">Pick this one if</p>
                <h3 className="mt-1.5 text-subhead font-semibold">{product.name}</h3>
                <p className="mt-3 text-body leading-relaxed text-ink-2">{product.description}</p>
                <ul className="mt-4 grid gap-2">
                  {product.pros.map((pro) => (
                    <li key={pro} className="flex gap-2 text-cell leading-snug text-ink-2">
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
                    <li key={con} className="flex gap-2 text-cell leading-snug text-ink-3">
                      <span aria-hidden>−</span>
                      {con}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-4 border-t border-line">
                  <Link
                    href={productHref(product, market)}
                    className="chip"
                  >
                    Full {product.name} specs →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {lenses.length > 0 && (
          <section className="mt-14" aria-labelledby="best-for">
            <h2 id="best-for" className="display text-h4">
              Best for each use
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lenses.map((lens) => (
                <div key={lens.id} className="card flex flex-col p-5">
                  <h3 className="text-subhead font-semibold text-ink">{lens.label}</h3>
                  <p className="mt-1 text-meta text-ink-3">{lens.job}</p>
                  <p className="mt-3 text-body font-semibold text-ink">{lens.headline}</p>
                  <ul className="mt-2 grid gap-1.5 text-meta text-ink-2">
                    {lens.reasons.map((reason) => (
                      <li key={reason} className="leading-snug">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-4 max-w-2xl text-meta leading-relaxed text-ink-3">
              Every answer above is scored from published figures. A lens uses only the rows that
              matter for that use, including marked rows that are not on the official sheet. Switch
              lenses interactively in the panel above.
            </p>
          </section>
        )}

        <section className="mt-14 card p-6 text-center" aria-labelledby="done">
          <h2 id="done" className="display text-h4">Done deciding?</h2>
          <p className="mt-1.5 text-cell text-ink-3">
            Open the full standalone spec sheet for either device.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={productHref(productA, market)}
              className="btn rounded-full bg-ink px-5 py-2 text-meta font-semibold text-surface transition-transform motion-safe:hover:scale-[1.02]"
            >
              {productA.name} spec sheet
            </Link>
            <Link
              href={productHref(productB, market)}
              className="btn rounded-full bg-ink px-5 py-2 text-meta font-semibold text-surface transition-transform motion-safe:hover:scale-[1.02]"
            >
              {productB.name} spec sheet
            </Link>
            <ShareVerdict />
          </div>
          {(productA.officialSource?.url || productB.officialSource?.url) && (
            <p className="mt-4 text-label text-ink-3">
              Manufacturer pages:{' '}
              {productA.officialSource?.url && (
                <OfficialSourceLink
                  href={productA.officialSource.url}
                  productId={productA.id}
                  brand={productA.brand}
                  className="text-accent hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  {productA.name} ↗
                </OfficialSourceLink>
              )}
              {productA.officialSource?.url && productB.officialSource?.url && ' · '}
              {productB.officialSource?.url && (
                <OfficialSourceLink
                  href={productB.officialSource.url}
                  productId={productB.id}
                  brand={productB.brand}
                  className="text-accent hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  {productB.name} ↗
                </OfficialSourceLink>
              )}
            </p>
          )}
        </section>

        <section className="mt-14" aria-labelledby="faq">
          <h2 id="faq" className="display text-h4 mb-4">
            Common questions
          </h2>
          <div className="card divide-y divide-line">
            {faq.map(({ q, a }) => (
              <details key={q} className="group p-4">
                <summary className="cursor-pointer list-none font-semibold text-body flex items-center justify-between gap-3 text-ink [&::-webkit-details-marker]:hidden">
                  {q}
                  <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0 text-ink-3 transition-transform group-open:rotate-180" aria-hidden>
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <p className="mt-3 text-cell leading-relaxed text-ink-2">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {otherComparisons.length > 0 && (
          <section className="mt-14" aria-labelledby="others">
            <h2 id="others" className="display text-h4">
              Other matchups
            </h2>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {otherComparisons.map((comp) => (
                <CompareLink
                  key={comp.productA + comp.productB}
                  href={compareHref(comp, market)}
                  className="card p-4 transition-colors hover:border-line-2"
                >
                  <p className="text-body font-semibold leading-snug">{comp.productName}</p>

                </CompareLink>
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
            url: absUrl(compareHref(comparison, market)),
            itemListElement: [productA, productB].map((product, index) => {
              const fee = isFeeBased(product.subcategory)
              const point = priceOf(product, market)
              const sameAs = officialSourceUrl(product)
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
                  url: absUrl(productHref(product, market)),
                  ...(sameAs ? { sameAs } : {}),
                  ...(fee
                    ? {
                        additionalProperty: [
                          {
                            '@type': 'PropertyValue',
                            name: 'Annual fee',
                            value: point?.amount ?? product.price,
                            unitText: `${point?.currency ?? 'USD'}/year`,
                          },
                        ],
                      }
                    : point
                      ? {
                          offers: {
                            '@type': 'Offer',
                            price: point.amount,
                            priceCurrency: point.currency,
                            url: absUrl(productHref(product, market)),
                          },
                        }
                      : {}),
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
            '@type': 'WebPage',
            name: comparison.productName,
            url: absUrl(compareHref(comparison, market)),
            dateModified: CATALOG_AS_OF,
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
