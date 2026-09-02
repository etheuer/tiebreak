// Scans public/images/products/ and writes the id -> URL manifest consumed by
// ProductImage. Run: `npm run images:manifest` (also runs before `next build`
// via `prebuild`). Idempotent: an empty folder writes `{}` and every product
// keeps its monogram tile until a real photo lands.
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = join(process.cwd(), 'public', 'images', 'products')
const OUT = join(process.cwd(), 'src', 'data', 'generated', 'product-images.json')
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'])

mkdirSync(DIR, { recursive: true })

const manifest = {}
for (const file of readdirSync(DIR)) {
  const dot = file.lastIndexOf('.')
  if (dot <= 0) continue
  const ext = file.slice(dot).toLowerCase()
  if (!EXTENSIONS.has(ext)) continue
  const id = file.slice(0, dot).toLowerCase()
  manifest[id] = `/images/products/${file}`
}

const entries = Object.keys(manifest).length
writeFileSync(OUT, entries === 0 ? '{}\n' : `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`product-images: ${entries} photo(s) registered`)
