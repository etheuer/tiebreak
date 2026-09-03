// Scans public/images/products/ and writes the id -> URL manifest consumed by
// ProductImage. Run: `npm run images:manifest` (also runs before `next build`
// via `prebuild`). Idempotent: an empty folder writes `{}` and every product
// keeps its monogram tile until a real photo lands.
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const DIR = join(process.cwd(), 'public', 'images', 'products')
const OUT = join(process.cwd(), 'src', 'data', 'generated', 'product-images.json')
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'])

mkdirSync(DIR, { recursive: true })
// The output directory is generated too: without this, prebuild takes the whole
// build down with ENOENT on a checkout that has no src/data/generated yet.
mkdirSync(dirname(OUT), { recursive: true })

const manifest = {}
const claimedBy = new Map()
// readdirSync order is filesystem-dependent; sort so the committed manifest is
// identical on every machine.
for (const file of readdirSync(DIR).sort()) {
  const dot = file.lastIndexOf('.')
  if (dot <= 0) continue
  const ext = file.slice(dot).toLowerCase()
  if (!EXTENSIONS.has(ext)) continue
  const id = file.slice(0, dot).toLowerCase()
  const previous = claimedBy.get(id)
  if (previous) {
    throw new Error(
      `product-images: "${previous}" and "${file}" both map to id "${id}". ` +
        'Product ids are case-sensitive; rename one of the files.'
    )
  }
  claimedBy.set(id, file)
  // Encode per segment: a space or "#" in a filename otherwise breaks the URL.
  manifest[id] = `/images/products/${encodeURIComponent(file)}`
}

const entries = Object.keys(manifest).length
writeFileSync(OUT, entries === 0 ? '{}\n' : `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`product-images: ${entries} photo(s) registered`)
