import { promises as fs } from 'fs'
import path from 'path'
import type { Product } from '@/lib/data'

/** Subcategories that may ever show an ENERGY STAR badge. */
export const ENERGY_STAR_ELIGIBLE_SUBCATEGORIES = new Set(['air-purifiers', 'tvs'])

/** Explicitly never badge — not an ENERGY STAR product category. */
export const ENERGY_STAR_EXCLUDED_SUBCATEGORIES = new Set(['cordless-vacuums'])

export const ENERGY_STAR_HOME = 'https://www.energystar.gov'
export const ENERGY_STAR_AIR_FINDER =
  'https://www.energystar.gov/productfinder/product/certified-room-air-cleaners/'
export const ENERGY_STAR_TV_FINDER =
  'https://www.energystar.gov/productfinder/product/certified-televisions/'
export const ENERGY_STAR_BRAND_GUIDELINES =
  'https://www.energystar.gov/partner-resources/brand-guidelines'

export type EnergyStarMatch = {
  productId: string
  subcategory: string
  certified: boolean
  energyStarModelNumber: string
  energyStarModelIdentifier: string | null
  annualEnergyUseKwh: number
  meetsMostEfficient: boolean
  brandName: string
  dataset: 'gaa3-swy6' | 'pd96-rr3d' | string
  screenSizeInches?: number
  productFinderUrl: string
  confidence: 'high' | 'medium' | 'low' | string
  matchNote?: string
}

type EnergyStarFile = {
  meta: {
    asOf: string
    sources: Record<string, { dataset: string; url: string }>
    notes: string[]
    eligibleSubcategories: string[]
    excludedSubcategories: string[]
  }
  matches: EnergyStarMatch[]
}

let cache: EnergyStarFile | null = null
let byProductId: Map<string, EnergyStarMatch> | null = null

async function loadFile(): Promise<EnergyStarFile> {
  if (cache) return cache
  const raw = await fs.readFile(
    path.join(process.cwd(), 'src/data/energy-star-matches.json'),
    'utf-8'
  )
  cache = JSON.parse(raw) as EnergyStarFile
  return cache
}

async function matchIndex(): Promise<Map<string, EnergyStarMatch>> {
  if (byProductId) return byProductId
  const file = await loadFile()
  byProductId = new Map(file.matches.map((m) => [m.productId, m]))
  return byProductId
}

export async function getEnergyStarMeta() {
  const file = await loadFile()
  return file.meta
}

export async function getAllEnergyStarMatches(): Promise<EnergyStarMatch[]> {
  const file = await loadFile()
  return file.matches.filter((m) => m.certified)
}

export async function getEnergyStarMatchesForSubcategory(
  subcategory: string
): Promise<EnergyStarMatch[]> {
  if (ENERGY_STAR_EXCLUDED_SUBCATEGORIES.has(subcategory)) return []
  if (!ENERGY_STAR_ELIGIBLE_SUBCATEGORIES.has(subcategory)) return []
  const all = await getAllEnergyStarMatches()
  return all.filter((m) => m.subcategory === subcategory)
}

/**
 * Resolve ENERGY STAR certification for a catalog product.
 * Returns null unless the product is in an eligible subcategory AND has a
 * curated match. Cordless vacuums always return null.
 */
export async function getEnergyStarMatchForProduct(
  product: Pick<Product, 'id' | 'subcategory'>
): Promise<EnergyStarMatch | null> {
  if (ENERGY_STAR_EXCLUDED_SUBCATEGORIES.has(product.subcategory)) return null
  if (!ENERGY_STAR_ELIGIBLE_SUBCATEGORIES.has(product.subcategory)) return null
  const index = await matchIndex()
  const match = index.get(product.id)
  if (!match || !match.certified) return null
  return match
}

export function formatAnnualKwh(kwh: number): string {
  const rounded = Number.isInteger(kwh) ? String(kwh) : kwh.toFixed(1).replace(/\.0$/, '')
  return `${rounded} kWh/yr`
}

export function isEnergyStarHubSubcategory(subcategory: string): boolean {
  return subcategory === 'air-purifiers' || subcategory === 'tvs'
}
