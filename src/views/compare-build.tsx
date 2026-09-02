import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { getComparisons, getProducts, type Comparison, type Product } from '@/lib/data'
import { homeHref, pairKey, priceShort, subLabel } from '@/lib/nav'
import type { MarketId } from '@/lib/markets'
import { pageAlternates, openGraphLocale } from '@/lib/hreflang'
import { SITE_NAME, absUrl } from '@/lib/site'
import { CompareBuilder, type BuilderProduct } from '@/components/CompareBuilder'
import { CompareBuildResult } from '@/views/compare-build-result'

export async function buildMetadata(market: MarketId): Promise<Metadata> {
  const title = 'Compare any two products'
  const description = `Pick any two ${SITE_NAME} products of the same type and get a spec-by-spec verdict instantly.`
  return {
    title,
    description,
    // Tool shell only: every real result lives behind ?a=&b=.
    robots: { index: false, follow: true },
    alternates: pageAlternates('/compare/build/', market, true),
    openGraph: {
      title,
      description,
      url: absUrl(market === 'us' ? '/compare/build/' : '/uk/compare/build/'),
      type: 'website',
      siteName: SITE_NAME,
      locale: openGraphLocale(market),
    },
  }
}

export function builderData(
  products: Product[],
  comparisons: Comparison[],
  market: MarketId
): { builderProducts: BuilderProduct[]; published: Record<string, string> } {
  const builderProducts: BuilderProduct[] = products
    .slice()
    .sort((x, y) => x.name.localeCompare(y.name))
    .map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      subcategory: p.subcategory,
      subLabel: subLabel(p.subcategory),
      priceText: priceShort(p, market),
    }))

  const published: Record<string, string> = {}
  for (const c of comparisons) {
    published[pairKey(c.productA, c.productB)] = `${c.productA}-vs-${c.productB}`
  }
  return { builderProducts, published }
}

export async function CompareBuildPage({ market }: { market: MarketId }) {
  const [products, comparisons] = await Promise.all([getProducts(market), getComparisons(market)])
  const { builderProducts, published } = builderData(products, comparisons, market)

  return (
    <div className="shell">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-6 text-meta text-ink-3">
        <Link href={homeHref(market)} className="hover:text-accent">
          Home
        </Link>
        <span aria-hidden>/</span>
        <span className="text-ink-2">Custom comparison</span>
      </nav>

      <header className="mt-5 max-w-2xl border-b border-line pb-8">
        <p className="eyebrow">Custom comparison</p>
        <h1 className="display mt-2 text-h1">Compare any two</h1>
        <p className="mt-3 text-body leading-relaxed text-ink-2">
          Pick two products of the same type. Published pairs open their full breakdown;
          every other pair is scored instantly from the same published specs.
        </p>
        <CompareBuilder products={builderProducts} published={published} market={market} />
      </header>

      <Suspense>
        <CompareBuildResult
          products={builderProducts}
          published={published}
          market={market}
        />
      </Suspense>
    </div>
  )
}
