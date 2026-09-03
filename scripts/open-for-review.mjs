/**
 * Opens product source URLs in the default browser for manual review.
 * 
 * Usage:
 *   node scripts/open-for-review.mjs                  # all unverified products
 *   node scripts/open-for-review.mjs --stale          # only stale products
 *   node scripts/open-for-review.mjs --id iphone-16-pro  # one product
 *   node scripts/open-for-review.mjs --count 5        # limit to N
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const data = JSON.parse(readFileSync('src/data/products.json', 'utf8'))
const products = data.products

const args = process.argv.slice(2)
const staleOnly = args.includes('--stale')
const idFilter = args.includes('--id') ? args[args.indexOf('--id') + 1] : null
const countLimit = args.includes('--count') ? parseInt(args[args.indexOf('--count') + 1]) : null

const now = new Date()
const STALE_DAYS = 90

let filtered = products

if (idFilter) {
  filtered = products.filter(p => p.id === idFilter)
  if (filtered.length === 0) {
    console.error(`Product "${idFilter}" not found`)
    process.exit(1)
  }
}

if (staleOnly) {
  filtered = filtered.filter(p => {
    const asOf = p.officialSource?.asOf
    if (!asOf) return true
    return (now - new Date(asOf)) / (1000 * 60 * 60 * 24) > STALE_DAYS
  })
}

// Exclude planned products
filtered = filtered.filter(p => p.verification?.status !== 'planned')

if (countLimit) {
  filtered = filtered.slice(0, countLimit)
}

if (filtered.length === 0) {
  console.log('No products to review.')
  process.exit(0)
}

console.log(`Opening ${filtered.length} product page(s) for review...\n`)

let report = `# Review Session ${new Date().toISOString()}\n`
report += `\n| # | Product | Specs to check | URL |\n`
report += `|---|---------|---------------|-----|`

filtered.forEach((p, i) => {
  const keySpecs = Object.keys(p.specifications || {}).slice(0, 5).join(', ')
  report += `\n| ${i + 1} | ${p.name} | ${keySpecs} | ${p.officialSource?.url || 'N/A'} |`
})

writeFileSync('REVIEW-SESSION.md', report)

// Open the first URL in browser
const url = filtered[0].officialSource?.url
if (url) {
  console.log(`Opening: ${filtered[0].name}`)
  console.log(`  ${url}\n`)
  execSync(`open "${url}"`)
}

console.log(`Review session saved to REVIEW-SESSION.md`)
console.log(`Products to verify: ${filtered.length}`)
