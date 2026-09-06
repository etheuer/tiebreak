// Prebuild helper: write 80/160/320 webp thumbs under public/images/products/derived.
import { mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIR = join(process.cwd(), 'public', 'images', 'products')
const DERIVED_DIR = join(DIR, 'derived')
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
const WIDTHS = [80, 160, 320]

mkdirSync(DERIVED_DIR, { recursive: true })

let imageTool
try {
  imageTool = (await import('sharp')).default
} catch {
  console.warn('product-images: sharp unavailable; skipping derived thumbs')
  process.exit(0)
}

const sourceFiles = []
for (const file of readdirSync(DIR).sort()) {
  const dot = file.lastIndexOf('.')
  if (dot <= 0) continue
  const ext = file.slice(dot).toLowerCase()
  if (!EXTENSIONS.has(ext)) continue
  sourceFiles.push({ id: file.slice(0, dot).toLowerCase(), path: join(DIR, file) })
}

let derivedCount = 0
for (const entry of sourceFiles) {
  for (const width of WIDTHS) {
    const outPath = join(DERIVED_DIR, entry.id + '-w' + width + '.webp')
    await imageTool(entry.path)
      .resize({ width, height: width, fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 72, effort: 4 })
      .toFile(outPath)
    derivedCount += 1
  }
}
console.log('product-images: ' + derivedCount + ' derived thumb(s)')
