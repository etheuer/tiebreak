import { promises as fs } from 'fs'
import path from 'path'
import type { MarketId } from '@/lib/markets'
import { inMarket, resolveProduct, type MarketAttestation, type PricePoint, type Product, type ProductVariant } from '@/lib/pricing'

export type { MarketAttestation, PricePoint, Product, ProductVariant } from '@/lib/pricing'
export { inMarket, marketsOf, priceOf, resolveProduct } from '@/lib/pricing'


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

export async function getAllProducts(): Promise<Product[]> {
  if (productsCache) return productsCache
  const data = await fs.readFile(path.join(process.cwd(), 'src/data/products.json'), 'utf-8')
  const json = JSON.parse(data) as { products: Product[] }
  productsCache = json.products
  return productsCache
}

export async function getProducts(market: MarketId = 'us'): Promise<Product[]> {
  const products = await getAllProducts()
  return products
    .filter((product) => inMarket(product, market))
    .map((product) => resolveProduct(product, market))
}

export async function getAllCategories(): Promise<Category[]> {
  if (categoriesCache) return categoriesCache
  const data = await fs.readFile(path.join(process.cwd(), 'src/data/products.json'), 'utf-8')
  const json = JSON.parse(data) as { products: Product[]; categories: Category[] }
  categoriesCache = json.categories
  return categoriesCache
}

export async function getCategories(market: MarketId = 'us'): Promise<Category[]> {
  const [categories, products] = await Promise.all([getAllCategories(), getProducts(market)])
  const present = new Set(products.map((product) => product.category))
  return categories.filter((category) => present.has(category.id))
}

export async function getAllComparisons(): Promise<Comparison[]> {
  if (comparisonsCache) return comparisonsCache
  const dir = path.join(process.cwd(), 'src/data/comparisons')
  const files = await fs.readdir(dir)
  const comparisons: Comparison[] = []
  for (const file of files) {
    if (file.endsWith('.json')) {
      const data = await fs.readFile(path.join(dir, file), 'utf-8')
      comparisons.push(JSON.parse(data))
    }
  }
  comparisonsCache = comparisons
  return comparisons
}

import { buildVerdict } from '@/lib/verdict'
import { formatMoney } from '@/lib/format'
import { sentenceCase, shortName } from '@/lib/decision'

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
  const [comparisons, products] = await Promise.all([getAllComparisons(), getProducts(market)])
  const byId = new Map(products.map((product) => [product.id, product]))
  return comparisons
    .filter((comparison) => byId.has(comparison.productA) && byId.has(comparison.productB))
    .map((comparison) => ({
      ...comparison,
      description: buildComparisonDescription(byId.get(comparison.productA)!, byId.get(comparison.productB)!, market)
    }))
}

export async function getComparisonBySlug(slug: string, market: MarketId = 'us'): Promise<Comparison | null> {
  const comparisons = await getAllComparisons()
  const comparison = comparisons.find((c) => `${c.productA}-vs-${c.productB}` === slug) || null
  if (!comparison) return null
  const productA = await getProductById(comparison.productA, market)
  const productB = await getProductById(comparison.productB, market)
  if (!productA || !productB) return comparison
  return {
    ...comparison,
    description: buildComparisonDescription(productA, productB, market)
  }
}

export async function getProductById(id: string, market: MarketId = 'us'): Promise<Product | null> {
  const products = await getAllProducts()
  const found = products.find((p) => p.id === id)
  if (!found) return null
  return resolveProduct(found, market)
}

export async function getProductsByCategory(category: string, market: MarketId = 'us'): Promise<Product[]> {
  const products = await getProducts(market)
  return products.filter((p) => p.category === category)
}
