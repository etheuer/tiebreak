import { readdirSync, readFileSync } from 'node:fs'

const files = readdirSync('src/data/comparisons').filter(f => f.endsWith('.json'))

let errors = []
let warnings = []

for (const file of files) {
  try {
    const d = JSON.parse(readFileSync(`src/data/comparisons/${file}`, 'utf8'))
    const required = ['productA', 'productB', 'productName', 'description', 'keywords']
    for (const f of required) {
      if (!d[f] || (typeof d[f] === 'string' && d[f].trim() === '')) {
        errors.push(`${file}: missing "${f}"`)
      }
    }
    if (d.keywords && Array.isArray(d.keywords)) {
      if (d.keywords.length < 3) warnings.push(`${file}: only ${d.keywords.length} keyword(s)`)
      const uniq = new Set(d.keywords.map(k => k.toLowerCase()))
      if (uniq.size !== d.keywords.length) warnings.push(`${file}: ${d.keywords.length - uniq.size} duplicate keyword(s)`)
    }
  } catch (e) {
    errors.push(`${file}: parse error`)
  }
}

if (errors.length === 0 && warnings.length === 0) { console.log(`\nAll ${files.length} comparison files valid`); process.exit(0) }
errors.forEach(e => console.error(`  ERR ${e}`))
warnings.slice(0,10).forEach(w => console.log(`  WARN ${w}`))
if (warnings.length > 10) console.log(`  ... and ${warnings.length - 10} more warnings`)
process.exit(errors.length > 0 ? 1 : 0)