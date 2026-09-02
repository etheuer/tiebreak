import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function marketPath(market, path) {
  const us = path === '/' ? '/' : path.endsWith('/') ? path : `${path}/`
  if (market === 'us') return us
  return us === '/' ? '/uk/' : `/uk${us}`
}

const LB = 453.59237
const SQFT = 0.09290304

function parseWeightG(spec) {
  const kg = spec.match(/([\d.]+)\s*kg/i)
  if (kg) return Number(kg[1]) * 1000
  const lb = spec.match(/([\d.]+)\s*lb/i)
  if (lb) return Number(lb[1]) * LB
  return null
}

function parseAreaM2(spec) {
  const m = spec.match(/([\d.]+)\s*m²/)
  if (m) return Number(m[1])
  const sq = spec.match(/([\d.]+)\s*sq\s*ft/i)
  if (sq) return Number(sq[1]) * SQFT
  return null
}

const data = JSON.parse(readFileSync(new URL('../src/data/products.json', import.meta.url), 'utf8'))
const products = data.products
const uk = products.filter((p) => (p.markets ?? ['us']).includes('uk'))
const cards = products.filter((p) => p.subcategory === 'credit-cards')

function resolveProduct(product, market = 'us') {
  if (market === 'us') return product
  const variant = product.variants?.[market]
  if (!variant) return product
  return {
    ...product,
    ...(variant.name ? { name: variant.name } : {}),
    ...(variant.description ? { description: variant.description } : {}),
    specifications: variant.specifications
      ? { ...product.specifications, ...variant.specifications }
      : product.specifications,
  }
}

const REGION_KEYS = ['chipset', 'cpu', 'gpu', 'cellular', 'sim', 'charger_in_box', 'warranty', 'smart_os', 'voice_assistants', 'energy']
const DROPPED = ['tcl-qm8', 'shark-cordless-pro', 'lg-cordzero-all-in-one', 'winix-5500-2', 'aleno-breathe-smart-75i', 'coway-airmega-400']
const UNSAFE_SAME_AS_US = /mmWave|\(US\b|US\/CA|Energy Star/i

function validAttestation(attestation) {
  return Boolean(
    attestation
      && /^\d{4}-\d{2}-\d{2}$/.test(attestation.asOf)
      && (attestation.source === 'manufacturer' || /^https?:\/\//.test(attestation.source))
  )
}

function htmlFilesUnder(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return htmlFilesUnder(fullPath)
    return entry.isFile() && entry.name.endsWith('.html') ? [fullPath] : []
  })
}

const s24 = products.find((p) => p.id === 'samsung-galaxy-s24')
const s24Uk = resolveProduct(s24, 'uk')
const s24Us = resolveProduct(s24, 'us')

const checks = [
  ['marketPath us home', marketPath('us', '/'), '/'],
  ['marketPath uk home', marketPath('uk', '/'), '/uk/'],
  ['marketPath uk compare', marketPath('uk', '/compare/a-vs-b/'), '/uk/compare/a-vs-b/'],
  ['uk availability attestations are valid', uk.every((p) => validAttestation(p.availability?.uk)), true],
  ['all market variants have valid verification', products.every((p) =>
    Object.values(p.variants ?? {}).every((variant) => validAttestation(variant?.verified))
  ), true],
  ['uk region-sensitive keys verified or sameAsUs', uk.every((p) => {
    const present = REGION_KEYS.filter((k) => k in (p.specifications ?? {}))
    const overrides = Object.keys(p.variants?.uk?.specifications ?? {})
    const same = p.sameAsUs ?? []
    return present.every((k) => overrides.includes(k) || same.includes(k))
  }), true],
  ['sameAsUs never certifies region-specific wording', uk.every((p) =>
    (p.sameAsUs ?? []).every((key) => {
      const value = p.specifications?.[key]
      return typeof value !== 'string' || !UNSAFE_SAME_AS_US.test(value)
    })
  ), true],
  ['sameAsUs keys exist and do not overlap UK overrides', uk.every((p) => {
    const overrides = new Set(Object.keys(p.variants?.uk?.specifications ?? {}))
    return (p.sameAsUs ?? []).every((key) => key in (p.specifications ?? {}) && !overrides.has(key))
  }), true],
  ['samsung-galaxy-s24 UK resolved chipset contains Exynos and not Snapdragon', s24Uk.specifications.chipset.includes('Exynos') && !s24Uk.specifications.chipset.includes('Snapdragon'), true],
  ['samsung-galaxy-s24 US/base chipset contains Snapdragon and not Exynos', s24Us.specifications.chipset.includes('Snapdragon') && !s24Us.specifications.chipset.includes('Exynos'), true],
  ['none of the six US-only ids include uk', DROPPED.every((id) => {
    const p = products.find((item) => item.id === id)
    return p && !(p.markets ?? ['us']).includes('uk')
  }), true],
  ['uk has no cards', uk.every((p) => p.subcategory !== 'credit-cards'), true],
  ['cards us-only', cards.every((p) => JSON.stringify(p.markets) === JSON.stringify(['us'])), true],
  ['4.9 lb (2.2 kg) trips', parseWeightG('4.9 lb (2.2 kg)') > 1814, true],
  ['3.5 lb (1.6 kg) stays', parseWeightG('3.5 lb (1.6 kg)') <= 1814, true],
  ['2.2 kg trips', parseWeightG('2.2 kg') > 1814, true],
  ['900 sq ft trips', parseAreaM2('900 sq ft') < 92.903, true],
  ['90 m² trips', parseAreaM2('90 m²') < 92.903, true],
]

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const staticRoot = path.join(projectRoot, '.next-static')
const staticUkRoot = path.join(staticRoot, 'uk')

if (process.argv.includes('--export') && existsSync(path.join(staticRoot, 'index.html'))) {
  const ukPublished = existsSync(path.join(staticUkRoot, 'index.html'))
  const ukS24Path = path.join(staticUkRoot, 'product', 'electronics', 'samsung-galaxy-s24', 'index.html')
  const usS24Path = path.join(staticRoot, 'product', 'electronics', 'samsung-galaxy-s24', 'index.html')
  const ukS24Html = existsSync(ukS24Path) ? readFileSync(ukS24Path, 'utf8') : ''
  const usS24Html = existsSync(usS24Path) ? readFileSync(usS24Path, 'utf8') : ''
  const ukHomePath = path.join(staticUkRoot, 'index.html')
  const ukHomeHtml = existsSync(ukHomePath) ? readFileSync(ukHomePath, 'utf8') : ''
  const ukHtml = htmlFilesUnder(staticUkRoot).map((file) => ({
    file,
    html: readFileSync(file, 'utf8'),
  }))
  const ukDescriptionTags = ukHtml.flatMap(({ html }) =>
    (html.match(/<meta\b[^>]*>/gi) ?? []).filter((tag) => /name=["']description["']/i.test(tag))
  )
  const hasSourcedUkPrice = uk.some((product) => Boolean(product.prices?.uk))

  checks.push(
    ['static US S24 contains Snapdragon and not Exynos 2400', usS24Html.includes('Snapdragon') && !usS24Html.includes('Exynos 2400'), true],
  )

  if (ukPublished) {
    checks.push(
      ['static export omits the six US-only UK product pages', DROPPED.every((id) =>
        !existsSync(path.join(staticUkRoot, 'product', 'electronics', id, 'index.html'))
        && !existsSync(path.join(staticUkRoot, 'product', 'appliances', id, 'index.html'))
      ), true],
      ['static UK S24 contains Exynos and not Snapdragon', ukS24Html.includes('Exynos') && !ukS24Html.includes('Snapdragon'), true],
      ['static UK home exists and contains product links', ukHomeHtml.includes('/uk/product/'), true],
      ['static UK export omits finance', !existsSync(path.join(staticUkRoot, 'category', 'finance', 'index.html'))
        && !existsSync(path.join(staticUkRoot, 'product', 'finance')), true],
      ['static UK pages do not show invented GBP amounts', hasSourcedUkPrice || ukHtml.every(({ html }) => !/£\s?\d/.test(html)), true],
      ['static UK meta descriptions do not contain USD amounts', ukDescriptionTags.every((tag) => !/\$\s?\d/.test(tag)), true],
    )
  } else {
    checks.push(['US-only export does not emit /uk/', !existsSync(staticUkRoot), true])
  }
}

let failed = 0
for (const [name, got, want] of checks) {
  const ok = got === want
  if (!ok) failed += 1
  console.log(`${ok ? 'ok' : 'FAIL'}  ${name}  got=${got} want=${want}`)
}
if (failed) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nall i18n checks passed')
