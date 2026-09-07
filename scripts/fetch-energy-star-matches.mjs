/**
 * TODO helper: pull ENERGY STAR open data and print candidate matches
 * against Clinchmark air-purifier + TV catalog ids.
 *
 * Usage: node scripts/fetch-energy-star-matches.mjs
 *
 * Does NOT write energy-star-matches.json automatically — curated high-
 * confidence rows stay hand-reviewed until Steve drops a full match dump.
 *
 * Datasets: gaa3-swy6 (room air cleaners), pd96-rr3d (televisions).
 * Never match cordless vacuums.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const catalog = JSON.parse(readFileSync(path.join(root, 'src/data/products.json'), 'utf8'))

const AIR_URL = 'https://data.energystar.gov/resource/gaa3-swy6.json?$limit=5000'
const TV_URL = 'https://data.energystar.gov/resource/pd96-rr3d.json?$limit=5000'

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'ClinchmarkBot/1.0' } })
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return res.json()
}

const [air, tvs] = await Promise.all([fetchJson(AIR_URL), fetchJson(TV_URL)])
const products = catalog.products.filter((p) => p.subcategory === 'air-purifiers' || p.subcategory === 'tvs')

console.log(`Fetched ${air.length} air cleaners, ${tvs.length} TVs`)
console.log(`Catalog eligible products: ${products.length}`)
console.log('TODO: wire automated matching + write src/data/energy-star-matches.json')
console.log('Current curated file remains the source of truth for badges.')
