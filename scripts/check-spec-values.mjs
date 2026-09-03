import { readFileSync } from 'node:fs'

const data = JSON.parse(readFileSync('src/data/products.json', 'utf8'))
const products = data.products

function findNum(v) {
  if (typeof v === 'number') return v
  if (typeof v !== 'string') return null
  const m = v.match(/[-+]?\d*\.?\d+/)
  return m ? parseFloat(m[0]) : null
}

let issues = []
for (const p of products) {
  const s = p.specifications || {}
  
  // Screen size
  if (s.screen_size || s.display_size) {
    const v = s.screen_size || s.display_size
    const n = findNum(v)
    if (n && (n < 1 || n > 150)) issues.push(`${p.id}: screen_size=${v}`)
  }
  
  // Refresh rate
  if (s.refresh_rate) {
    const n = findNum(s.refresh_rate)
    if (n && (n < 1 || n > 480)) issues.push(`${p.id}: refresh_rate=${s.refresh_rate}`)
  }
  
  // Brightness
  if (s.peak_brightness || s.brightness) {
    const v = s.peak_brightness || s.brightness
    const n = findNum(v)
    if (n && n > 20000) issues.push(`${p.id}: brightness=${v}`)
  }
  
  // Placeholder values
  for (const [k, v] of Object.entries(s)) {
    if (['', 'TBD', 'TBA', 'N/A', '...', 'varies'].includes(v.trim())) {
      issues.push(`${p.id}: "${k}" is placeholder "${v}"`)
    }
  }
}

if (issues.length === 0) { console.log(`\nAll ${products.length} products have valid spec values`); process.exit(0) }
console.error(`${issues.length} value issues:`)
issues.slice(0,20).forEach(e => console.error(`  ${e}`))
process.exit(1)