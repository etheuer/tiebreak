import type { Category, Comparison, Product } from '@/lib/data'

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

export function priceShort(product: Product): string {
  const amount = `$${product.price.toLocaleString('en-US')}`
  return isFeeBased(product.subcategory) ? `${amount}/yr` : amount
}

export function productHref(product: Product): string {
  return `/product/${product.category}/${product.id}/`
}

export function compareHref(comparison: Comparison): string {
  return `/compare/${comparison.productA}-vs-${comparison.productB}/`
}

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
  categories: Category[]
): JumpEntry[] {
  const byId = new Map(products.map((p) => [p.id, p]))

  const compareEntries: JumpEntry[] = comparisons.map((c) => {
    const a = byId.get(c.productA)
    const b = byId.get(c.productB)
    return {
      kind: 'compare',
      label: c.productName,
      meta: a ? subLabel(a.subcategory) : 'Comparison',
      href: compareHref(c),
      terms: [c.productName, a?.name, b?.name, a?.brand, b?.brand, ...c.keywords]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
    }
  })

  const productEntries: JumpEntry[] = products.map((p) => ({
    kind: 'product',
    label: p.name,
    meta: `${subLabel(p.subcategory)} · $${p.price.toLocaleString('en-US')}`,
    href: productHref(p),
    terms: `${p.name} ${p.brand} ${subLabel(p.subcategory)}`.toLowerCase(),
  }))

  const categoryEntries: JumpEntry[] = categories.map((c) => ({
    kind: 'category',
    label: c.name,
    meta: `${products.filter((p) => p.category === c.id).length} products`,
    href: `/category/${c.id}/`,
    terms: `${c.name} ${c.subcategories.join(' ')}`.toLowerCase(),
  }))

  return [...compareEntries, ...productEntries, ...categoryEntries]
}
