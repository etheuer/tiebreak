import { promises as fs } from 'fs'
import path from 'path'

export interface Product {
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
}

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

export async function getProducts(): Promise<Product[]> {
  if (productsCache) return productsCache
  const data = await fs.readFile(path.join(process.cwd(), 'src/data/products.json'), 'utf-8')
  const json = JSON.parse(data) as { products: Product[] }
  productsCache = json.products
  return productsCache
}

export async function getCategories(): Promise<Category[]> {
  if (categoriesCache) return categoriesCache
  const data = await fs.readFile(path.join(process.cwd(), 'src/data/products.json'), 'utf-8')
  const json = JSON.parse(data) as { products: Product[]; categories: Category[] }
  categoriesCache = json.categories
  return categoriesCache
}

export async function getComparisons(): Promise<Comparison[]> {
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

export async function getComparisonBySlug(slug: string): Promise<Comparison | null> {
  const comparisons = await getComparisons()
  return comparisons.find(c => `${c.productA}-vs-${c.productB}` === slug) || null
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts()
  return products.find(p => p.id === id) || null
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const products = await getProducts()
  return products.filter(p => p.category === category)
}
