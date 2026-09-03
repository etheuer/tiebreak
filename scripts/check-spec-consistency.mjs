import { readFileSync } from 'node:fs'

const data = JSON.parse(readFileSync('src/data/products.json', 'utf8'))
const products = data.products

// Group by subcategory, find numeric outliers
const bySub = {}
for (const p of products) {
  if (!bySub[p.subcategory]) bySub[p.subcategory] = []
  bySub[p.subcategory].push(p)
}

const outlierFields = {
  tvs: ['screen_size', 'peak_brightness'],
  laptops: ['weight', 'display_size'],
  smartphones: ['weight', 'display_size', 'battery_capacity'],
  'cordless-vacuums': ['weight'],
  headphones: ['weight'],
  'air-purifiers': ['weight', 'coverage'],
}

let issues = []
for (const [sub, prods] of Object.entries(bySub)) {
  if (prods.length < 3) continue
  const fields = outlierFields[sub] || []
  for (const field of fields) {
    const vals = prods.map(p => {
      const v = p.specifications?.[field]
      if (!v) return null
      const m = v.match(/[-+]?\d*\.?\d+/)
      return m ? { id: p.id, val: parseFloat(m[0]) } : null
    }).filter(Boolean)
    if (vals.length < 3) continue
    const avg = vals.reduce((s, x) => s + x.val, 0) / vals.length
    const std = Math.sqrt(vals.reduce((s, x) => s + (x.val - avg) ** 2, 0) / vals.length)
    for (const { id, val } of vals) {
      if (std > 0 && Math.abs(val - avg) > 3 * std) {
        issues.push(`${sub}: ${id} "${field}" = ${val} (avg ${avg.toFixed(1)} ± ${std.toFixed(1)})`)
      }
    }
  }
}

if (issues.length === 0) { console.log(`\n✓ No outliers detected among ${products.length} products`); process.exit(0) }
console.log(`⚠️ ${issues.length} outlier(s) (informational — not a failure):`)
issues.slice(0,15).forEach(e => console.log(`  ${e}`))
process.exit(0)