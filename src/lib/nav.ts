import type { Category, Comparison, Product } from '@/lib/data'
import { priceOf } from '@/lib/pricing'
import { formatMoney } from '@/lib/format'
import { marketPath, type MarketId } from '@/lib/markets'

export const SUBCATEGORY_LABEL: Record<string, string> = {
  tvs: 'TVs',
  laptops: 'Laptops',
  smartphones: 'Phones',
  'cordless-vacuums': 'Cordless vacuums',
  headphones: 'Headphones',
  'air-purifiers': 'Air purifiers',
  'credit-cards': 'Credit cards',
}

export function subLabel(subcategory: string): string {
  return SUBCATEGORY_LABEL[subcategory] ?? subcategory.replace(/-/g, ' ')
}

/**
 * Credit cards carry an annual fee in the `price` field, so money wording has
 * to change with the product type or the page states something untrue.
 */
export function isFeeBased(subcategory: string): boolean {
  return subcategory === 'credit-cards'
}

export function priceCaption(subcategory: string): string {
  return isFeeBased(subcategory) ? 'Annual fee' : 'List price'
}

export function priceShort(product: Product, market: MarketId = 'us'): string {
  const point = priceOf(product, market)
  if (!point) return 'Price not listed'
  const amount = formatMoney(point.amount, market)
  return isFeeBased(product.subcategory) ? `${amount}/yr` : amount
}

export function productHref(product: Product, market: MarketId = 'us'): string {
  return marketPath(market, `/product/${product.category}/${product.id}/`)
}

export function compareHref(comparison: Comparison, market: MarketId = 'us'): string {
  return marketPath(market, `/compare/${comparison.productA}-vs-${comparison.productB}/`)
}

export function categoryHref(categoryId: string, market: MarketId = 'us'): string {
  return marketPath(market, `/category/${categoryId}/`)
}

export function homeHref(market: MarketId = 'us'): string {
  return marketPath(market, '/')
}

export function hubHref(market: MarketId = 'us'): string {
  return marketPath(market, '/compare/')
}

export const LEGAL_LINKS = [
  { label: 'About', href: '/about/' },
  { label: 'Privacy', href: '/privacy/' },
  { label: 'Terms', href: '/terms/' },
  { label: 'Contact', href: '/contact/' },
] as const

/**
 * Compare pages only exist for pairs that ship a comparison file, so every
 * "compare these two" affordance resolves through here and links nowhere else.
 */
export function findComparison(
  comparisons: Comparison[],
  idA: string,
  idB: string
): Comparison | null {
  return (
    comparisons.find(
      (c) =>
        (c.productA === idA && c.productB === idB) || (c.productA === idB && c.productB === idA)
    ) ?? null
  )
}

export type JumpEntry = {
  kind: 'compare' | 'product' | 'category'
  label: string
  meta: string
  href: string
  terms: string
}

export function buildJumpIndex(
  products: Product[],
  comparisons: Comparison[],
  categories: Category[],
  market: MarketId = 'us'
): JumpEntry[] {
  const byId = new Map(products.map((p) => [p.id, p]))

  const compareEntries: JumpEntry[] = comparisons.map((c) => {
    const a = byId.get(c.productA)
    const b = byId.get(c.productB)
    return {
      kind: 'compare',
      label: c.productName,
      meta: a ? subLabel(a.subcategory) : 'Comparison',
      href: compareHref(c, market),
      terms: [c.productName, a?.name, b?.name, a?.brand, b?.brand, ...c.keywords]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
    }
  })

  const productEntries: JumpEntry[] = products.map((p) => ({
    kind: 'product',
    label: p.name,
    meta: `${subLabel(p.subcategory)} · ${priceShort(p, market)}`,
    href: productHref(p, market),
    terms: `${p.name} ${p.brand} ${subLabel(p.subcategory)}`.toLowerCase(),
  }))

  const categoryEntries: JumpEntry[] = categories.map((c) => ({
    kind: 'category',
    label: c.name,
    meta: `${products.filter((p) => p.category === c.id).length} products`,
    href: categoryHref(c.id, market),
    terms: `${c.name} ${c.subcategories.join(' ')}`.toLowerCase(),
  }))

  return [...compareEntries, ...productEntries, ...categoryEntries]
}
