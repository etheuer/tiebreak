// Scans public/images/products/ and writes the id -> URL manifest consumed by
// ProductImage. Also emits derived thumbs via generate-derived-thumbs.mjs.
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const DIR = join(process.cwd(), 'public', 'images', 'products')
const OUT = join(process.cwd(), 'src', 'data', 'generated', 'product-images.json')
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])

mkdirSync(DIR, { recursive: true })
mkdirSync(dirname(OUT), { recursive: true })

const manifest = {}
const claimedBy = new Map()
for (const file of readdirSync(DIR).sort()) {
  const dot = file.lastIndexOf('.')
  if (dot <= 0) continue
  const ext = file.slice(dot).toLowerCase()
  if (!EXTENSIONS.has(ext)) continue
  const id = file.slice(0, dot).toLowerCase()
  if (claimedBy.has(id)) throw new Error('duplicate image id: ' + id)
  claimedBy.set(id, file)
  manifest[id] = '/images/products/' + encodeURIComponent(file)
}

const entries = Object.keys(manifest).length
writeFileSync(OUT, entries === 0 ? '{}\n' : JSON.stringify(manifest, null, 2) + '\n')
console.log('product-images: ' + entries + ' photo(s) registered')

await import('./generate-derived-thumbs.mjs')
