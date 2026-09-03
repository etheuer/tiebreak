import type { Comparison, Product } from '@/lib/data'
import type { MarketId } from '@/lib/markets'
import { priceShort, subLabel } from '@/lib/nav'

export type BuilderProduct = {
  id: string
  name: string
  brand: string
  subcategory: string
  subLabel: string
  priceText: string
}

/**
 * Which pairs have a published breakdown, as index pairs into `builderProducts`
 * in the slug's stored order: [a0, b0, a1, b1, …].
 *
 * The obvious shape — a `pairKey -> slug` object — is 88 KB of JSON for 1010
 * pairs, and it ships to every home-page visitor whether or not they touch the
 * picker. The same information as indices is 8 KB.
 */
export type PublishedPairs = number[]

/**
 * Picker data for the compare builder. Lives outside the page view so the
 * home page and compare hub can build it without pulling the result view —
 * a client component — into their module graphs.
 */
export function builderData(
  products: Product[],
  comparisons: Comparison[],
  market: MarketId
): { builderProducts: BuilderProduct[]; publishedPairs: PublishedPairs } {
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

  const indexOf = new Map(builderProducts.map((p, i) => [p.id, i]))
  const publishedPairs: PublishedPairs = []
  for (const c of comparisons) {
    const a = indexOf.get(c.productA)
    const b = indexOf.get(c.productB)
    // A comparison can name a product this market does not carry.
    if (a === undefined || b === undefined) continue
    publishedPairs.push(a, b)
  }
  return { builderProducts, publishedPairs }
}

/**
 * Published slug for a pair, or undefined when the pair has no breakdown.
 * Order-independent, and rebuilds the slug in the order the catalog stores it.
 */
export function publishedSlug(
  products: BuilderProduct[],
  publishedPairs: PublishedPairs,
  idA: string,
  idB: string
): string | undefined {
  const a = products.findIndex((p) => p.id === idA)
  const b = products.findIndex((p) => p.id === idB)
  if (a < 0 || b < 0) return undefined
  for (let i = 0; i < publishedPairs.length; i += 2) {
    const x = publishedPairs[i]
    const y = publishedPairs[i + 1]
    if ((x === a && y === b) || (x === b && y === a)) {
      return `${products[x].id}-vs-${products[y].id}`
    }
  }
  return undefined
}
