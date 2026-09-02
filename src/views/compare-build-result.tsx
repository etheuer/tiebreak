'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { buildVerdict, verdictLine } from '@/lib/verdict'
import { buildAnswer, checkDealBreakers, flattenRows, shortName } from '@/lib/decision'
import { casesFor } from '@/data/use-cases'
import { inMarket, resolveProduct, type Product } from '@/lib/pricing'
import { priceShort, productHref, subLabel } from '@/lib/nav'
import { marketPath, type MarketId } from '@/lib/markets'
import { DecisionPanel } from '@/components/DecisionPanel'
import { SpecTables } from '@/components/SpecTables'
import { ProductImage } from '@/components/ProductImage'
import type { BuilderProduct } from '@/components/CompareBuilder'
import productsData from '@/data/products.json'

const ALL_PRODUCTS = (productsData as { products: object[] }).products as unknown as Product[]

function marketProducts(market: MarketId): Product[] {
  return ALL_PRODUCTS.filter((p) => inMarket(p, market)).map((p) => resolveProduct(p, market))
}

/**
 * Live verdict for an arbitrary ?a=&b= pair. Same scoring, lenses and
 * deal-breakers as published matchups; published-only extras (cost of
 * ownership, fit checks, FAQ) stay on the breakdown pages.
 */
export function CompareBuildResult({
  products,
  published,
  market,
}: {
  products: BuilderProduct[]
  published: Record<string, string>
  market: MarketId
}) {
  const params = useSearchParams()
  const idA = params.get('a') ?? ''
  const idB = params.get('b') ?? ''

  const pair = useMemo(() => {
    if (!idA || !idB) return null
    const all = marketProducts(market)
    const byId = new Map(all.map((p) => [p.id, p]))
    const productA = byId.get(idA) ?? null
    const productB = byId.get(idB) ?? null
    if (!productA || !productB || productA.id === productB.id) return { productA, productB }
    return { productA, productB }
  }, [idA, idB, market])

  if (!idA || !idB) {
    return (
      <p className="py-10 text-body text-ink-3">
        Choose two products above to see their verdict here. The address bar URL is shareable.
      </p>
    )
  }

  if (!pair?.productA || !pair?.productB) {
    const known = new Map(products.map((p) => [p.id, p]))
    return (
      <div className="py-10">
        <h2 className="display text-h2">We couldn&apos;t find that pair</h2>
        <p className="mt-2 max-w-xl text-body text-ink-2">
          {!known.get(idA) ? (
            <>“{idA}” isn&apos;t in the {market === 'uk' ? 'UK' : 'US'} catalog.</>
          ) : (
            <>“{idB}” isn&apos;t in the {market === 'uk' ? 'UK' : 'US'} catalog.</>
          )}{' '}
          Pick two products above instead.
        </p>
      </div>
    )
  }

  const { productA, productB } = pair
  if (productA.id === productB.id) {
    return (
      <div className="py-10">
        <h2 className="display text-h2">Pick two different products</h2>
        <p className="mt-2 text-body text-ink-2">A product ties with itself on every spec.</p>
      </div>
    )
  }

  const slug = published[[productA.id, productB.id].sort().join('\0')]
  const verdict = buildVerdict(productA, productB, market)
  const answer = verdictLine(productA, productB, verdict, market)
  const rows = flattenRows(verdict)
  const checks = checkDealBreakers(productA, productB)
  const useCases = productA.subcategory === productB.subcategory ? casesFor(productA.subcategory) : []
  const overall = buildAnswer({ productA, productB, useCase: null, rows, checks, matters: new Set(), market })

  return (
    <section aria-label="Custom comparison result" className="py-10">
      <p className="eyebrow">Custom comparison · {subLabel(productA.subcategory)}</p>
      <h2 className="display mt-2 text-h2">
        {shortName(productA)} vs {shortName(productB)}
      </h2>
      <p className="mt-3 max-w-3xl text-lead leading-relaxed text-ink">{answer}</p>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-[repeat(2,minmax(0,1fr))] md:gap-5">
        {[productA, productB].map((product, i) => (
          <div key={product.id} className="card flex items-center gap-3 p-3 sm:p-4">
            <ProductImage product={product} size="sm" tone={i === 0 ? 'a' : 'b'} />
            <div className="min-w-0">
              <Link
                href={productHref(product, market)}
                className="truncate text-cell font-semibold leading-tight hover:underline"
              >
                {product.name}
              </Link>
              <p className="num mt-0.5 text-meta text-ink-3">{priceShort(product, market)}</p>
            </div>
          </div>
        ))}
      </div>

      {slug && (
        <p className="mt-4 text-body text-ink-2">
          This pair has a{' '}
          <Link
            href={marketPath(market, `/compare/${slug}/`)}
            className="font-semibold text-accent hover:underline"
          >
            published breakdown
          </Link>{' '}
          with cost-of-ownership, fit checks and source notes.
        </p>
      )}

      <div className="mt-6">
        <DecisionPanel productA={productA} productB={productB} rows={rows} useCases={useCases} checks={checks} market={market}>
          <p className="num mt-3 text-meta text-ink-3">
            {overall.headline} · {verdict.aWins}–{verdict.bWins} on {verdict.scored} rankable specs
          </p>
        </DecisionPanel>
      </div>

      <div className="mt-8">
        <SpecTables
          productA={productA}
          productB={productB}
          groups={verdict.groups}
          aWins={verdict.aWins}
          bWins={verdict.bWins}
          market={market}
        />
      </div>

      <p className="mt-6 text-meta text-ink-3">
        Custom comparison, scored from the same published specs as our matchups. Copy the address
        bar link to share it.
      </p>
    </section>
  )
}
