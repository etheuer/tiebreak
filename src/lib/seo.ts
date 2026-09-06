/**
 * GSC P0 SEO helpers: verdict-led titles/meta, Product.image URLs, OG images.
 * Pure generators used by page metadata and JSON-LD sitewide.
 */
import type { Comparison, Product } from '@/lib/data'
import { shortName } from '@/lib/decision'
import { isFeeBased } from '@/lib/nav'
import { isRealImageUrl } from '@/lib/product-image'
import { absUrl, clip, SITE_NAME } from '@/lib/site'
import { formatMoney } from '@/lib/format'
import type { Verdict } from '@/lib/verdict'
import manifest from '@/data/generated/product-images.json'

const LOCAL_IMAGES = manifest as Record<string, string>

/** Static default share card (1200×630) under public/og/. */
export const DEFAULT_OG_PATH = '/og/default.png'

export function defaultOgImages() {
  const url = absUrl(DEFAULT_OG_PATH)
  return [{ url, width: 1200, height: 630, alt: `${SITE_NAME} — head to head product comparisons` }]
}

/** Relative photo path(s) for a product: local studio first, then real remote. */
export function productPhotoPaths(product: Pick<Product, 'id' | 'image_url'>): string[] {
  const paths: string[] = []
  const local = LOCAL_IMAGES[product.id]
  if (local) paths.push(local)
  if (isRealImageUrl(product.image_url)) paths.push(product.image_url)
  return paths
}

/** Absolute https image URL(s) for Product JSON-LD `image`. */
export function productImageAbsUrls(product: Pick<Product, 'id' | 'image_url'>): string[] {
  return productPhotoPaths(product).map((path) =>
    path.startsWith('http://') || path.startsWith('https://') ? path : absUrl(path)
  )
}

/** Open Graph / Twitter images: product photo(s) when present, else site default. */
export function ogImagesForProducts(products: Array<Pick<Product, 'id' | 'image_url' | 'name'>>) {
  const urls: { url: string; width?: number; height?: number; alt: string }[] = []
  for (const product of products) {
    const abs = productImageAbsUrls(product)
    if (abs[0]) urls.push({ url: abs[0], alt: product.name })
  }
  if (urls.length === 0) return defaultOgImages()
  return urls.slice(0, 2)
}

/**
 * Verdict-led compare title, targeting ≤~60 chars when possible.
 * Example: "iPhone 17 leads on 8 specs | iPhone 16 vs iPhone 17"
 */
export function compareSeoTitle(
  productA: Product,
  productB: Product,
  verdict: Verdict,
  fallbackName: string
): string {
  const a = shortName(productA)
  const b = shortName(productB)
  const pair = `${a} vs ${b}`

  if (verdict.scored === 0 || !verdict.leader) {
    if (verdict.priceLeader && verdict.priceGap > 0) {
      const cheaper = verdict.priceLeader === 'a' ? a : b
      const amount = formatMoney(verdict.priceGap, 'us')
      const fee = isFeeBased((verdict.priceLeader === 'a' ? productA : productB).subcategory)
      const priceLead = fee
        ? `${cheaper} is ${amount}/yr less`
        : `${cheaper} is ${amount} less`
      const withPair = `${priceLead} | ${pair}`
      if (withPair.length <= 60) return withPair
      return clip(priceLead, 60)
    }
    const title = pair.length <= 48 ? pair : fallbackName
    return title.length <= 60 ? title : clip(title, 60)
  }

  const winner = verdict.leader === 'a' ? a : b
  const wins = verdict.leader === 'a' ? verdict.aWins : verdict.bWins
  const lead = `${winner} leads on ${wins} spec${wins === 1 ? '' : 's'}`
  const withPair = `${lead} | ${pair}`

  if (withPair.length <= 60) return withPair
  if (lead.length <= 60) return lead
  return clip(withPair, 60)
}

/**
 * Meta description: lead with verdict + price delta in the first ~120 chars.
 */
export function compareSeoDescription(
  productA: Product,
  productB: Product,
  verdict: Verdict,
  answer: string,
  catalogDescription: string
): string {
  const priceBit = priceDeltaSnippet(productA, productB, verdict)
  const needsPrice =
    Boolean(priceBit) &&
    !/\b(less|cheaper|same (list )?price|costs \$|charges \$)/i.test(answer)
  const head = needsPrice ? `${answer} ${priceBit}` : answer
  const raw = head.length >= 100 ? head : `${head} ${catalogDescription}`.trim()
  return clip(raw, 158)
}

function priceDeltaSnippet(productA: Product, productB: Product, verdict: Verdict): string {
  if (!verdict.priceLeader || verdict.priceGap <= 0) {
    const a = productA.price
    const b = productB.price
    if (a > 0 && b > 0 && a === b) return 'Same list price.'
    return ''
  }
  const cheaper = verdict.priceLeader === 'a' ? productA : productB
  const amount = formatMoney(verdict.priceGap, 'us')
  const fee = isFeeBased(cheaper.subcategory)
  return fee
    ? `${shortName(cheaper)} is ${amount}/yr cheaper.`
    : `${shortName(cheaper)} costs ${amount} less.`
}

/**
 * Related matchups for internal links (3–6): prefer shared product + same subcategory.
 */
export function relatedComparisonsForSubcategory(
  all: Comparison[],
  productA: Product,
  productB: Product,
  sameTypeProductIds: Set<string>,
  limit = 6
): Comparison[] {
  const selfA = productA.id
  const selfB = productB.id
  const ranked = all
    .filter((c) => !(c.productA === selfA && c.productB === selfB))
    .map((c) => {
      const inType = sameTypeProductIds.has(c.productA) && sameTypeProductIds.has(c.productB)
      const shares =
        c.productA === selfA || c.productB === selfA || c.productA === selfB || c.productB === selfB
      let score = 0
      if (inType) score += 3
      if (shares) score += 5
      return { c, score }
    })
    .sort((x, y) => y.score - x.score || x.c.productName.localeCompare(y.c.productName))

  const picked: Comparison[] = []
  for (const row of ranked) {
    if (picked.length >= limit) break
    if (row.score <= 0 && picked.length >= 3) continue
    picked.push(row.c)
  }
  return picked.slice(0, Math.min(6, Math.max(picked.length, 0)))
}
