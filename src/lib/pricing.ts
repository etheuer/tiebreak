import type { MarketId } from '@/lib/markets'

export type PricePoint = {
  amount: number
  currency: 'USD' | 'GBP'
  asOf: string
  source: string
}
export type MarketAttestation = { asOf: string; source: string }

export type ProductVariant = {
  name?: string
  description?: string
  specifications?: Record<string, string>
  verified: MarketAttestation
}

export type Product = {
  id: string
  name: string
  brand: string
  category: string
  subcategory: string
  price: number
  image_url: string
  description: string
  pros: string[]
  cons: string[]
  specifications: Record<string, string>
  markets?: MarketId[]
  availability?: Partial<Record<MarketId, MarketAttestation>>
  prices?: Partial<Record<MarketId, PricePoint>>
  variants?: Partial<Record<MarketId, ProductVariant>>
  sameAsUs?: string[]
}

export type PricedProduct = {
  price: number
  markets?: MarketId[]
  prices?: Partial<Record<MarketId, PricePoint>>
}

export function marketsOf(product: PricedProduct): MarketId[] {
  return product.markets ?? ['us']
}

export function inMarket(product: PricedProduct, market: MarketId): boolean {
  return marketsOf(product).includes(market)
}

export function priceOf(product: PricedProduct, market: MarketId): PricePoint | null {
  const listed = product.prices?.[market]
  if (listed) return listed
  if (market === 'us') {
    return { amount: product.price, currency: 'USD', asOf: '1970-01-01', source: 'legacy-price' }
  }
  return null
}

export function resolveProduct(product: Product, market: MarketId = 'us'): Product {
  if (market === 'us') return product
  const variant = product.variants?.[market]
  if (!variant) return product
  return {
    ...product,
    ...(variant.name ? { name: variant.name } : {}),
    ...(variant.description ? { description: variant.description } : {}),
    specifications: variant.specifications
      ? { ...product.specifications, ...variant.specifications }
      : product.specifications,
  }
}
