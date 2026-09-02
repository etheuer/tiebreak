import { promises as fs } from 'fs'
import path from 'path'
import type { MarketId } from '@/lib/markets'
import { inMarket, resolveProduct, type Product } from '@/lib/pricing'
import { buildVerdict } from '@/lib/verdict'
import { formatMoney } from '@/lib/format'
import { sentenceCase, shortName } from '@/lib/decision'

export type { MarketAttestation, OfficialSource, PricePoint, Product, ProductVariant } from '@/lib/pricing'
export { inMarket, marketsOf, officialSourceUrl, priceOf, resolveProduct } from '@/lib/pricing'


export interface Category {
  id: string
  name: string
  subcategories: string[]
  popular_searches: string[]
}

export interface Comparison {
  productA: string
  productB: string
  productName: string
  description: string
  keywords: string[]
}

let productsCache: Product[] | null = null
let categoriesCache: Category[] | null = null
let comparisonsCache: Comparison[] | null = null
const marketProductsCache = new Map<MarketId, Product[]>()
const marketCategoriesCache = new Map<MarketId, Category[]>()
const marketComparisonsCache = new Map<MarketId, Comparison[]>()

export async function getAllProducts(): Promise<Product[]> {
  if (productsCache) return productsCache
  const data = await fs.readFile(path.join(process.cwd(), 'src/data/products.json'), 'utf-8')
  const json = JSON.parse(data) as { products: Product[] }
  productsCache = json.products
  return productsCache
}

export async function getProducts(market: MarketId = 'us'): Promise<Product[]> {
  const cached = marketProductsCache.get(market)
  if (cached) return cached
  const products = await getAllProducts()
  const result = products
    .filter((product) => inMarket(product, market))
    .map((product) => resolveProduct(product, market))
  marketProductsCache.set(market, result)
  return result
}

export async function getAllCategories(): Promise<Category[]> {
  if (categoriesCache) return categoriesCache
  const data = await fs.readFile(path.join(process.cwd(), 'src/data/products.json'), 'utf-8')
  const json = JSON.parse(data) as { products: Product[]; categories: Category[] }
  categoriesCache = json.categories
  return categoriesCache
}

export async function getCategories(market: MarketId = 'us'): Promise<Category[]> {
  const cached = marketCategoriesCache.get(market)
  if (cached) return cached
  const [categories, products] = await Promise.all([getAllCategories(), getProducts(market)])
  const present = new Set(products.map((product) => product.category))
  const result = categories.filter((category) => present.has(category.id))
  marketCategoriesCache.set(market, result)
  return result
}

export async function getAllComparisons(): Promise<Comparison[]> {
  if (comparisonsCache) return comparisonsCache
  const dir = path.join(process.cwd(), 'src/data/comparisons')
  const files = await fs.readdir(dir)
  const jsonFiles = files.filter((f) => f.endsWith('.json'))
  const comparisons: Comparison[] = []
  const BATCH_SIZE = 32
  for (let i = 0; i < jsonFiles.length; i += BATCH_SIZE) {
    const batch = jsonFiles.slice(i, i + BATCH_SIZE)
    const items = await Promise.all(
      batch.map(async (file) => {
        const data = await fs.readFile(path.join(dir, file), 'utf-8')
        return JSON.parse(data) as Comparison
      })
    )
    comparisons.push(...items)
  }
  comparisonsCache = comparisons
  return comparisons
}

function pairKey(productA: string, productB: string): string {
  return [productA, productB].sort().join('\0')
}

function buildComparisonDescription(a: Product, b: Product, market: MarketId): string {
  const verdict = buildVerdict(a, b, market)
  const na = shortName(a)
  const nb = shortName(b)
  const priceGapStr = verdict.priceGap === 0 ? 'same price' : `${formatMoney(verdict.priceGap, market)} apart`
  const diffs = verdict.highlights.filter(r => r.differs).slice(0, 3).map(r => sentenceCase(r.label))
  let diffStr = ''
  if (diffs.length === 1) diffStr = `, differing on ${diffs[0]}`
  else if (diffs.length === 2) diffStr = `, differing on ${diffs[0]} and ${diffs[1]}`
  else if (diffs.length === 3) diffStr = `, differing on ${diffs[0]}, ${diffs[1]} and ${diffs[2]}`

  return `Compare ${na} vs ${nb}: ${verdict.scored} rankable specs, ${priceGapStr}${diffStr}.`
}

export async function getComparisons(market: MarketId = 'us'): Promise<Comparison[]> {
  const cached = marketComparisonsCache.get(market)
  if (cached) return cached
  const [comparisons, products] = await Promise.all([getAllComparisons(), getProducts(market)])
  const byId = new Map(products.map((product) => [product.id, product]))
  const seen = new Set<string>()
  const result = comparisons
    .filter((comparison) => {
      if (!byId.has(comparison.productA) || !byId.has(comparison.productB)) return false
      const key = pairKey(comparison.productA, comparison.productB)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((comparison) => ({
      ...comparison,
      description: buildComparisonDescription(byId.get(comparison.productA)!, byId.get(comparison.productB)!, market)
    }))
  marketComparisonsCache.set(market, result)
  return result
}

export async function getComparisonBySlug(slug: string, market: MarketId = 'us'): Promise<Comparison | null> {
  const comparisons = await getComparisons(market)
  return comparisons.find((c) => `${c.productA}-vs-${c.productB}` === slug) || null
}

export async function getProductById(id: string, market: MarketId = 'us'): Promise<Product | null> {
  const products = await getProducts(market)
  return products.find((p) => p.id === id) ?? null
}

export async function getProductsByCategory(category: string, market: MarketId = 'us'): Promise<Product[]> {
  const products = await getProducts(market)
  return products.filter((p) => p.category === category)
}
