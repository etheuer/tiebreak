import type { Comparison, Product } from '@/lib/data'
import type { MarketId } from '@/lib/markets'
import { pairKey, priceShort, subLabel } from '@/lib/nav'
import type { BuilderProduct } from '@/components/CompareBuilder'

/**
 * Picker data for the compare builder. Lives outside the page view so the
 * home page and compare hub can build it without pulling the result view —
 * a client component — into their module graphs.
 */
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
