import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const data = JSON.parse(readFileSync(path.join(root, 'src/data/products.json'), 'utf8'))
const products = data.products
const categories = data.categories
const comparisonsDir = path.join(root, 'src/data/comparisons')
const comparisonFiles = readdirSync(comparisonsDir).filter((name) => name.endsWith('.json'))
const comparisons = comparisonFiles.map((file) => {
  const body = JSON.parse(readFileSync(path.join(comparisonsDir, file), 'utf8'))
  return { ...body, _file: file }
})

const SUB_LABEL = {
  tvs: 'TVs',
  laptops: 'Laptops',
  smartphones: 'Smartphones',
  headphones: 'Headphones',
  'cordless-vacuums': 'Vacuums',
  'air-purifiers': 'Air Purifiers',
  'credit-cards': 'Credit Cards',
}

const ids = products.map((product) => product.id)
const idSet = new Set(ids)
const presentSubs = new Set(products.map((product) => product.subcategory))
const presentCats = new Set(products.map((product) => product.category))

function pairKey(a, b) {
  return [a, b].sort().join('\0')
}

const pairs = new Map()
const dupFiles = []
for (const comparison of comparisons) {
  const key = pairKey(comparison.productA, comparison.productB)
  if (pairs.has(key)) dupFiles.push(comparison._file)
  else pairs.set(key, comparison)
}

const degree = new Map(ids.map((id) => [id, 0]))
for (const comparison of comparisons) {
  if (degree.has(comparison.productA)) degree.set(comparison.productA, degree.get(comparison.productA) + 1)
  if (degree.has(comparison.productB)) degree.set(comparison.productB, degree.get(comparison.productB) + 1)
}

const orphan = comparisons.filter((c) => !idSet.has(c.productA) || !idSet.has(c.productB))
const zeroMatchups = ids.filter((id) => (degree.get(id) ?? 0) === 0)
const selfPairs = comparisons.filter((c) => c.productA === c.productB)
const nameMismatch = comparisons.filter((c) => c._file !== `${c.productA}-vs-${c.productB}.json`)
const emptySpecs = products.filter((p) => !p.specifications || Object.keys(p.specifications).length === 0)
const missingFields = products.filter((p) => !p.id || !p.name || !p.brand || !p.category || !p.subcategory || typeof p.price !== 'number')
const emptyCategoryPromises = []
for (const category of categories) {
  if (!presentCats.has(category.id)) continue
  const presentLabels = new Set(
    products.filter((p) => p.category === category.id).map((p) => SUB_LABEL[p.subcategory] ?? p.subcategory)
  )
  for (const label of category.subcategories ?? []) {
    if (!presentLabels.has(label)) emptyCategoryPromises.push(`${category.id}:${label}`)
  }
}

const forbiddenSearch = /espresso|savings account|investment app|coffee maker|loan/i
const badSearches = categories.flatMap((category) =>
  (category.popular_searches ?? []).filter((term) => forbiddenSearch.test(term)).map((term) => `${category.id}:${term}`)
)

const checkExport = process.argv.includes('--export')
const staticRoot = path.join(root, '.next-static')
const checks = [
  ['no duplicate product ids', new Set(ids).size === ids.length, true],
  ['no orphan comparisons', orphan.length, 0],
  ['no duplicate comparison pairs', dupFiles.length, 0],
  ['no self comparisons', selfPairs.length, 0],
  ['every product has at least one matchup', zeroMatchups.length, 0],
  ['comparison filenames match productA-vs-productB', nameMismatch.length, 0],
  ['every product has specs', emptySpecs.length, 0],
  ['required product fields present', missingFields.length, 0],
  ['category lists do not promise empty types', emptyCategoryPromises.length, 0],
  ['popular searches match the catalog', badSearches.length, 0],
  ['all subcategories are known', [...presentSubs].every((sub) => sub in SUB_LABEL), true],
]

if (checkExport) {
  const legal = ['about', 'privacy', 'terms', 'contact']
  checks.push(
    ['static export has no /uk/', !existsSync(path.join(staticRoot, 'uk')), true],
    ['privacy page exported', existsSync(path.join(staticRoot, 'privacy', 'index.html')), true],
    ['terms page exported', existsSync(path.join(staticRoot, 'terms', 'index.html')), true],
    ['about page exported', existsSync(path.join(staticRoot, 'about', 'index.html')), true],
    ['contact page exported', existsSync(path.join(staticRoot, 'contact', 'index.html')), true],
    ['legal pages are in the sitemap', legal.every((name) => {
      if (!existsSync(path.join(staticRoot, 'sitemap.xml'))) return false
      return readFileSync(path.join(staticRoot, 'sitemap.xml'), 'utf8').includes(`/${name}/`)
    }), true],
  )
}

let failed = 0
for (const [name, got, want] of checks) {
  const ok = got === want
  if (!ok) {
    failed += 1
    if (name.includes('orphan')) console.error(orphan.slice(0, 5))
    if (name.includes('duplicate comparison')) console.error(dupFiles)
    if (name.includes('filenames')) console.error(nameMismatch.map((c) => c._file).slice(0, 10))
    if (name.includes('empty types')) console.error(emptyCategoryPromises)
    if (name.includes('popular searches')) console.error(badSearches)
    if (name.includes('zero') || name.includes('at least one')) console.error(zeroMatchups)
  }
  console.log(`${ok ? 'ok' : 'FAIL'}  ${name}  got=${got} want=${want}`)
}

if (failed) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log(`\nall catalog checks passed (${products.length} products, ${comparisons.length} comparison files)`)
