import { readFileSync } from 'node:fs'

const data = JSON.parse(readFileSync('src/data/products.json', 'utf8'))
const products = data.products

const now = new Date()
const STALE_DAYS = 90
const WARN_DAYS = 60

let staleCount = 0
let warnCount = 0
let plannedCount = 0
let missingCount = 0

for (const product of products) {
  const ver = product.verification || {}
  
  if (ver.status === 'planned') {
    plannedCount++
    continue
  }

  const source = product.officialSource
  if (!source || !source.asOf) {
    console.warn(`MISSING source date: ${product.id}`)
    missingCount++
    continue
  }

  const asOf = new Date(source.asOf)
  const daysDiff = Math.floor((now - asOf) / (1000 * 60 * 60 * 24))

  if (daysDiff > STALE_DAYS) {
    staleCount++
    console.log(`STALE ${daysDiff}d: ${product.id} (asOf ${source.asOf})`)
  } else if (daysDiff > WARN_DAYS) {
    warnCount++
    console.log(`WARN  ${daysDiff}d: ${product.id} (asOf ${source.asOf})`)
  }
}

console.log(`\n=== Freshness Summary ===`)
console.log(`  Products: ${products.length}`)
console.log(`  Missing date: ${missingCount}`)
console.log(`  Planned: ${plannedCount}`)
console.log(`  Fresh (< ${WARN_DAYS}d): ${products.length - staleCount - warnCount - plannedCount - missingCount}`)
console.log(`  Warning (${WARN_DAYS}-${STALE_DAYS}d): ${warnCount}`)
console.log(`  Stale (> ${STALE_DAYS}d): ${staleCount}`)

if (missingCount || staleCount) {
  console.log(`\n⚠️ ${missingCount + staleCount} product(s) need attention`)
  process.exit(1)
} else {
  console.log(`\n✅ All products are fresh`)
}
