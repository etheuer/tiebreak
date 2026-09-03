/**
 * Unified verification runner.
 *
 * Routes each product to its brand-specific Playwright extractor (if one exists),
 * fetches the official source page, extracts specs, and compares with stored values.
 *
 * Usage:
 *   node scripts/verify-sources.mjs                         # all products
 *   node scripts/verify-sources.mjs --brand apple           # one brand
 *   node scripts/verify-sources.mjs --id iphone-16-pro      # one product
 *   node scripts/verify-sources.mjs --fresh                 # only stale (asOf > 90d)
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('..', import.meta.url))
const data = JSON.parse(readFileSync(path.join(root, 'src/data/products.json'), 'utf8'))
const products = data.products

// Load brand extractors
const extractorsDir = path.join(root, 'scripts/verify-brand')
const extractorFiles = existsSync(extractorsDir)
  ? readdirSync(extractorsDir).filter(f => f.endsWith('.mjs'))
  : []

const extractors = {}
for (const file of extractorFiles) {
  const mod = await import(path.join(extractorsDir, file))
  extractors[mod.hostname] = mod.verify
}

// Determine hostname from URL
function getHostname(url) {
  try { return new URL(url).hostname } catch { return null }
}

// Simple word overlap comparison
function compareValues(stored, extracted) {
  if (!stored || !extracted) return { match: false, reason: 'missing' }

  const s = stored.toLowerCase().replace(/[^a-z0-9]/g, ' ')
  const e = extracted.toLowerCase().replace(/[^a-z0-9]/g, ' ')

  if (s === e) return { match: true }

  const sWords = s.split(/\s+/).filter(Boolean)
  const eWords = e.split(/\s+/).filter(Boolean)

  // If stored is "~1,500–2,000 nits HDR" and extracted is "1500", that's a partial match
  const overlap = sWords.filter(w => eWords.includes(w)).length
  const ratio = Math.max(sWords.length, eWords.length) > 0
    ? overlap / Math.max(sWords.length, eWords.length)
    : 0

  return { match: ratio > 0.5, overlap: ratio, reason: ratio > 0.5 ? 'partial' : 'mismatch' }
}

async function verifyProduct(product) {
  const source = product.officialSource
  if (!source || !source.url) {
    return { id: product.id, status: 'no-source', reason: 'Missing officialSource URL' }
  }

  // Mark planned products
  if (product.verification?.status === 'planned') {
    return { id: product.id, status: 'planned', reason: 'Pre-release / planned product' }
  }

  const hostname = getHostname(source.url)
  if (!hostname) {
    return { id: product.id, status: 'invalid-url', reason: `Cannot parse URL: ${source.url}` }
  }

  const extractor = extractors[hostname]
  if (!extractor) {
    return { id: product.id, status: 'no-extractor', reason: `No extractor for ${hostname}` }
  }

  // Load existing verification state
  const stored = product.specifications || {}

  try {
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    const page = await context.newPage()

    const extracted = await extractor(page, source.url)
    await browser.close()

    if (Object.keys(extracted).length === 0) {
      return { id: product.id, status: 'no-specs', reason: 'Extractor returned no specs' }
    }

    // Compare each extracted spec with stored value
    const comparisons = []
    let matchedCount = 0

    for (const [key, extractedVal] of Object.entries(extracted)) {
      if (stored[key]) {
        const result = compareValues(stored[key], extractedVal)
        comparisons.push({
          field: key,
          stored: stored[key],
          extracted: extractedVal,
          match: result.match,
          overlap: result.overlap
        })
        if (result.match) matchedCount++
      }
    }

    const totalComparable = comparisons.length
    const confidence = totalComparable > 0 ? matchedCount / totalComparable : 0

    return {
      id: product.id,
      name: product.name,
      status: confidence >= 0.8 ? 'verified' : 'mismatch',
      sourceUrl: source.url,
      totalSpecs: Object.keys(extracted).length,
      comparableSpecs: totalComparable,
      matchedSpecs: matchedCount,
      confidence: Math.round(confidence * 100),
      comparisons: comparisons.slice(0, 20), // limit output
      extracted
    }
  } catch (e) {
    return { id: product.id, status: 'fetch-failed', reason: e.message.slice(0, 120) }
  }
}

// CLI args
const args = process.argv.slice(2)
const brandFilter = args.includes('--brand') ? args[args.indexOf('--brand') + 1] : null
const idFilter = args.includes('--id') ? args[args.indexOf('--id') + 1] : null
const freshOnly = args.includes('--fresh')

let targetProducts = products

if (brandFilter) {
  targetProducts = products.filter(p => p.brand?.toLowerCase() === brandFilter.toLowerCase())
  console.log(`Filtering to brand: ${brandFilter} (${targetProducts.length} products)`)
}

if (idFilter) {
  targetProducts = products.filter(p => p.id === idFilter)
  console.log(`Filtering to product: ${idFilter} (${targetProducts.length} products)`)
}

if (freshOnly) {
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000
  targetProducts = products.filter(p => {
    const asOf = p.officialSource?.asOf
    return !asOf || new Date(asOf).getTime() < cutoff
  })
  console.log(`Filtering to stale products (asOf > 90 days): ${targetProducts.length} products`)
}

// Main
console.log(`\n🔍 Verifying ${targetProducts.length} products against manufacturer sources...\n`)

const results = []
const start = Date.now()

for (let i = 0; i < targetProducts.length; i++) {
  const product = targetProducts[i]
  console.log(`[${i + 1}/${targetProducts.length}] ${product.id}...`)
  const result = await verifyProduct(product)
  results.push(result)
  console.log(`  → ${result.status}${result.confidence !== undefined ? ` (${result.confidence}% confidence)` : ''}`)

  if (result.comparisons) {
    for (const c of result.comparisons.slice(0, 5)) {
      const icon = c.match ? '✓' : '✗'
      console.log(`    ${icon} ${c.field}: "${c.extracted}" vs "${c.stored}"`)
    }
    if (result.comparisons.length > 5) {
      console.log(`    ... and ${result.comparisons.length - 5} more`)
    }
  }

  // Rate limit
  await new Promise(r => setTimeout(r, 1000))
}

const elapsed = ((Date.now() - start) / 1000).toFixed(1)

// Summary
const byStatus = {}
for (const r of results) {
  byStatus[r.status] = (byStatus[r.status] || 0) + 1
}

console.log('\n═══════════════════════════════════════')
console.log('  VERIFICATION RESULTS')
console.log(`  ${targetProducts.length} products in ${elapsed}s`)
console.log('═══════════════════════════════════════')

for (const [status, count] of Object.entries(byStatus)) {
  const icon = status === 'verified' ? '✅' : status === 'no-extractor' ? '⏭️' : '⚠️'
  console.log(`  ${icon} ${status}: ${count}`)
}

const verified = results.filter(r => r.status === 'verified')
const mismatches = results.filter(r => r.status === 'mismatch')

if (verified.length > 0) {
  console.log(`\n✅ Verified (${verified.length}):`)
  for (const r of verified) {
    console.log(`  ${r.id} — ${r.confidence}% (${r.matchedSpecs}/${r.comparableSpecs} specs)`)
  }
}

if (mismatches.length > 0) {
  console.log(`\n⚠️ Mismatches (${mismatches.length}):`)
  for (const r of mismatches) {
    console.log(`  ${r.id} — ${r.confidence}% (${r.matchedSpecs}/${r.comparableSpecs} specs matched)`)
    for (const c of r.comparisons.filter(c => !c.match).slice(0, 5)) {
      console.log(`    ✗ ${c.field}: "${c.extracted}" vs "${c.stored}"`)
    }
  }
}

// Save full results
writeFileSync('VERIFICATION-SOURCED.json', JSON.stringify(results, null, 2))
console.log(`\n📄 Full results saved to VERIFICATION-SOURCED.json`)

process.exit(mismatches.length > 0 ? 1 : 0)