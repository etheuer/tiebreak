import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const imageDir = () => join(process.cwd(), 'public/images/products')
const reviewFile = () => join(process.cwd(), 'src/data/product-image-reviews.json')
const files = () => existsSync(imageDir()) ? readdirSync(imageDir()).filter(f => /\.(jpe?g|png|webp|avif|svg)$/i.test(f)).sort() : []
const reviews = () => existsSync(reviewFile()) ? JSON.parse(readFileSync(reviewFile(), 'utf8')) : {}
const digest = data => createHash('sha256').update(data).digest('hex')

export async function inspectImage(data, file) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/.test(file)) throw new Error(`${file}: use <product-id>.webp`)
  const image = sharp(data, { limitInputPixels: 16_000_000 })
  const meta = await image.metadata()
  if (meta.format !== 'webp' || meta.width !== 640 || meta.height !== 640 || (meta.pages ?? 1) !== 1) {
    throw new Error(`${file}: use a single-frame 640x640 WebP`)
  }
  if (data.length > 120_000) throw new Error(`${file}: exceeds 120 KB`)
  if (!meta.hasAlpha) throw new Error(`${file}: no alpha channel; remove the background`)
  const { data: pixels, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let transparent = 0
  let visible = 0
  for (let i = 3; i < pixels.length; i += info.channels) {
    if (pixels[i] <= 8) transparent++
    if (pixels[i] >= 128) visible++
  }
  const count = info.width * info.height
  if (transparent / count < 0.05 || visible / count < 0.01) {
    throw new Error(`${file}: needs substantial transparent background and a visible product`)
  }
  for (const pixel of [0, 639, 639 * 640, 640 * 640 - 1]) {
    if (pixels[pixel * info.channels + 3] > 8) throw new Error(`${file}: corners must be transparent`)
  }
  // Alpha checks cannot distinguish a white product from an internal white box.
  // The byte hash below requires a fresh visual review whenever an asset changes.
  return digest(data)
}

export async function checkImages() {
  const approved = reviews()
  const errors = []
  for (const file of files()) {
    try {
      const hash = await inspectImage(readFileSync(join(imageDir(), file)), file)
      if (approved[file] !== hash) throw new Error(`${file}: new or changed image needs visual review`)
    } catch (error) { errors.push(error.message) }
  }
  if (errors.length) throw new Error(`${errors.join('\n')}\nRun npm run images:review; follow public/images/products/README.md.`)
  console.log(`product-images: ${files().length} validated and visually reviewed photo(s)`)
}

async function main() {
  const [mode = 'check', file, expectedHash] = process.argv.slice(2)
  if (mode === 'check') return checkImages()
  if (mode === 'approve') {
    if (!files().includes(file) || !/^[a-f0-9]{64}$/.test(expectedHash ?? '')) {
      throw new Error('Usage: npm run images:approve -- <product-id>.webp <sha256-from-review>')
    }
    const hash = await inspectImage(readFileSync(join(imageDir(), file)), file)
    if (hash !== expectedHash) throw new Error(`${file}: changed since review; generate and inspect a new review`)
    const approved = { ...reviews(), [file]: hash }
    mkdirSync(dirname(reviewFile()), { recursive: true })
    writeFileSync(reviewFile(), JSON.stringify(Object.fromEntries(Object.entries(approved).sort()), null, 2) + '\n')
    console.log(`${file}: visual review recorded for ${hash}`)
    return
  }
  if (mode !== 'review') throw new Error(`Unknown mode: ${mode}`)
  const cards = []
  const escape = value => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
  for (const name of files()) {
    const data = readFileSync(join(imageDir(), name))
    const src = `data:image/png;base64,${(await sharp(data).png().toBuffer()).toString('base64')}`
    const backgrounds = ['#ede4f8', '#e2f3ec', '#252525', 'conic-gradient(#ddd 25%,white 0 50%,#ddd 0 75%,white 0) 0/20px 20px']
    cards.push(`<section><h2>${escape(name)}</h2><div class="photos">${backgrounds.map(bg => `<div style="background:${bg}"><img src="${src}" alt="${escape(name)}"></div>`).join('')}</div><pre>npm run images:approve -- ${escape(name)} ${digest(data)}</pre></section>`)
  }
  const out = join(mkdtempSync(join(tmpdir(), 'product-image-review-')), 'review.html')
  writeFileSync(out, `<!doctype html><html lang="en"><meta charset="utf-8"><title>Product image review</title><style>body{font:16px system-ui;margin:32px}section{margin:32px 0}.photos{display:flex;flex-wrap:wrap;gap:12px}.photos div{width:240px;height:240px}.photos img{width:100%;height:100%;object-fit:contain}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><h1>Product image review</h1><p>Inspect every backdrop, headband opening, edge and component. White products must stay white; cases and small parts must be complete. Only run each approval command after visual inspection. These are snapshots of the exact bytes being approved.</p>${cards.join('\n')}</html>`)
  console.log(out)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
