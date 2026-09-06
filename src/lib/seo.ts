/**
 * GSC SEO helpers: verdict-led titles/meta, Product.image URLs, OG images,
 * generated compare editorial intros, and hub ranking helpers.
 * Pure generators used by page metadata, views, and JSON-LD sitewide.
 */
import type { Comparison, Product } from '@/lib/data'
import { sentenceCase, shortName } from '@/lib/decision'
import { isFeeBased, subLabel } from '@/lib/nav'
import { isRealImageUrl } from '@/lib/product-image'
import { absUrl, clip, SITE_NAME } from '@/lib/site'
import { displaySpec, formatMoney, listJoin } from '@/lib/format'
import type { MarketId } from '@/lib/markets'
import { buildVerdict, type ScoredRow, type Verdict } from '@/lib/verdict'
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


const FLAGSHIP_NAME = /(?:iPhone|Galaxy|MacBook|OLED|Bravia|A95|Dyson|Amex|WH-1000|Bose|Sapphire|Platinum)/i

/** Stable 0..n-1 picker so matchups keep a consistent voice without hand-written copy. */
function variantIndex(seed: string, n: number): number {
  let h = 0
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return n === 0 ? 0 : h % n
}

function priceEdgePhrase(product: Product, gap: number, market: MarketId): string {
  const amount = formatMoney(gap, market)
  return isFeeBased(product.subcategory)
    ? `charges ${amount}/yr less`
    : `costs ${amount} less`
}

/**
 * Key differing attributes with concrete values — prefer highlighted scored rows.
 */
function keyDiffSnippets(
  productA: Product,
  productB: Product,
  verdict: Verdict,
  market: MarketId,
  limit = 3
): string[] {
  const nameA = shortName(productA)
  const nameB = shortName(productB)
  const pool: ScoredRow[] = []
  const seen = new Set<string>()
  const push = (row: ScoredRow) => {
    if (seen.has(row.key) || !row.differs) return
    seen.add(row.key)
    pool.push(row)
  }
  for (const row of verdict.highlights) push(row)
  for (const group of verdict.groups) {
    for (const row of group.rows) {
      if (row.winner) push(row)
    }
  }
  for (const group of verdict.groups) {
    for (const row of group.rows) push(row)
  }

  const snippets: string[] = []
  for (const row of pool) {
    if (snippets.length >= limit) break
    const valA = displaySpec(row.a, row.key, market)
    const valB = displaySpec(row.b, row.key, market)
    if (!valA || !valB || valA === '—' || valB === '—') continue
    const label = sentenceCase(row.label)
    if (row.winner === 'a') {
      snippets.push(`${label} (${valA} on ${nameA} vs ${valB} on ${nameB})`)
    } else if (row.winner === 'b') {
      snippets.push(`${label} (${valB} on ${nameB} vs ${valA} on ${nameA})`)
    } else {
      // Skip unranked string-only diffs (often "4 vs 4 (...)" noise).
      continue
    }
  }
  return snippets
}

/**
 * Unique 2–3 sentence editorial intro for a compare page.
 * Generated from verdict / differing specs / price delta — not hand-written.
 * Phrasing rotates by pair so near-duplicate templates are less likely across ~1k pages.
 */
export function compareEditorialIntro(
  productA: Product,
  productB: Product,
  verdict: Verdict,
  market: MarketId = 'us'
): string {
  const a = shortName(productA)
  const b = shortName(productB)
  const sub = subLabel(productA.subcategory).toLowerCase()
  const seed = `${productA.id}\0${productB.id}`
  const v = variantIndex(seed, 3)
  const snippets = keyDiffSnippets(productA, productB, verdict, market, 3)
  const diffSentence = snippets.length
    ? [
        `The clearest gaps are ${listJoin(snippets, market)}.`,
        `Where they diverge most: ${listJoin(snippets, market)}.`,
        `Notable differences include ${listJoin(snippets, market)}.`,
      ][v]
    : [
        `Most tracked attributes here are descriptive rather than numeric, so the sheet is thin on rankable gaps.`,
        `Published figures leave few numeric edges, so features and fit matter more than a scoreboard.`,
        `There is little to separate them on scored numbers alone — the rest is configuration and preference.`,
      ][v]

  const cheaper =
    verdict.priceLeader === 'a' ? productA : verdict.priceLeader === 'b' ? productB : null
  const cheaperName = cheaper ? shortName(cheaper) : ''
  const edge = cheaper ? priceEdgePhrase(cheaper, verdict.priceGap, market) : ''

  let open: string
  if (verdict.scored === 0 || !verdict.leader) {
    if (verdict.scored === 0) {
      open = [
        `This ${sub} matchup between ${a} and ${b} has no rankable numeric edges on the catalog sheet.`,
        `${a} vs ${b} cannot be decided on scored specs alone in this ${sub} pairing.`,
        `On published ${sub} figures, ${a} and ${b} do not produce a clean numeric leader.`,
      ][v]
    } else {
      open = [
        `${a} and ${b} split the ${verdict.scored} rankable ${sub} specs evenly.`,
        `Neither side pulls ahead: ${a} and ${b} trade the ${verdict.scored} scored attributes.`,
        `This ${sub} pair lands in a dead heat on the ${verdict.scored} rankable specs.`,
      ][v]
    }
  } else {
    const winner = verdict.leader === 'a' ? a : b
    const loser = verdict.leader === 'a' ? b : a
    const wins = verdict.leader === 'a' ? verdict.aWins : verdict.bWins
    const loses = verdict.leader === 'a' ? verdict.bWins : verdict.aWins
    open = [
      `${winner} leads ${loser} ${wins}–${loses} on the ${verdict.scored} rankable specs in this ${sub} matchup.`,
      `On published figures, ${winner} takes ${wins} of ${verdict.scored} scored attributes against ${loser}.`,
      `${winner} is ahead on ${wins} scored specs here (${loser} wins ${loses}) in a head-to-head ${sub} comparison.`,
    ][v]
  }

  let close: string
  if (cheaper && verdict.priceGap > 0) {
    const winnerId = verdict.leader === 'a' ? productA.id : verdict.leader === 'b' ? productB.id : null
    if (winnerId && cheaper.id === winnerId) {
      close = [
        `${cheaperName} also ${edge}, so the sheet and the sticker point the same way.`,
        `It ${edge} as well, which keeps the value case aligned with the spec lead.`,
        `Add list price and ${cheaperName} ${edge} on top of that lead.`,
      ][v]
    } else if (verdict.leader) {
      close = [
        `${cheaperName} ${edge}, so the call depends on whether those leads are worth the premium.`,
        `Budget shoppers still have a path: ${cheaperName} ${edge}.`,
        `Price cuts against the scoreboard — ${cheaperName} ${edge}.`,
      ][v]
    } else {
      close = [
        `With specs tied, cost decides it: ${cheaperName} ${edge}.`,
        `The even sheet leaves price as the tie-breaker — ${cheaperName} ${edge}.`,
        `${cheaperName} ${edge}, which is the cleanest separator when the scoreboard is deadlocked.`,
      ][v]
    }
  } else if (
    productA.price > 0 &&
    productB.price > 0 &&
    (verdict.priceGap === 0 || !verdict.priceLeader)
  ) {
    close = [
      `List prices match, so the decision rests on the attributes above.`,
      `They land at the same list price, which puts the weight back on features and fit.`,
      `Same sticker price means the differing specs — not cost — should decide it.`,
    ][v]
  } else {
    close = [
      `Confirm live pricing before you buy; this page ranks published specifications only.`,
      `Treat the scoreboard as the guide and re-check street price when you are ready to order.`,
      `We score the sheet, not the deal — verify current pricing at checkout.`,
    ][v]
  }

  return `${open} ${diffSentence} ${close}`
}

/**
 * Rank published matchups for category/subcategory hubs: prefer flagships,
 * tradeoff pages (spec leader ≠ price leader), and denser differing sheets.
 */
export function rankComparisonsForHub(
  comparisons: Comparison[],
  byId: Map<string, Product>,
  market: MarketId,
  limit: number
): Comparison[] {
  const ranked = comparisons
    .map((comparison) => {
      const productA = byId.get(comparison.productA)
      const productB = byId.get(comparison.productB)
      if (!productA || !productB) return { comparison, score: -1 }
      const verdict = buildVerdict(productA, productB, market)
      let score = verdict.differing * 2 + verdict.scored
      if (
        verdict.leader &&
        verdict.priceLeader &&
        verdict.leader !== verdict.priceLeader &&
        verdict.priceGap > 0
      ) {
        score += 4
      }
      if (FLAGSHIP_NAME.test(comparison.productName)) score += 6
      const margin = Math.abs(verdict.aWins - verdict.bWins)
      if (margin === 0 && verdict.scored > 0) score += 2
      return { comparison, score }
    })
    .sort(
      (x, y) =>
        y.score - x.score || x.comparison.productName.localeCompare(y.comparison.productName)
    )

  return ranked.slice(0, Math.max(0, limit)).map((row) => row.comparison)
}

/**
 * Spread featured matchups across subcategories, then fill with hub-ranked rows.
 */
export function featuredComparisonsForCategory(
  categoryComparisons: Comparison[],
  byId: Map<string, Product>,
  market: MarketId,
  limit = 12
): Comparison[] {
  const buckets = new Map<string, Comparison[]>()
  for (const comparison of categoryComparisons) {
    const sub = byId.get(comparison.productA)?.subcategory ?? 'other'
    const ranked = buckets.get(sub) ?? []
    ranked.push(comparison)
    buckets.set(sub, ranked)
  }
  for (const [sub, list] of buckets) {
    buckets.set(sub, rankComparisonsForHub(list, byId, market, list.length))
  }

  const picked: Comparison[] = []
  const seen = new Set<string>()
  const keyOf = (c: Comparison) => `${c.productA}\0${c.productB}`

  for (let round = 0; picked.length < limit; round += 1) {
    let added = false
    for (const bucket of buckets.values()) {
      if (picked.length >= limit) break
      const comparison = bucket[round]
      if (!comparison) continue
      const key = keyOf(comparison)
      if (seen.has(key)) continue
      seen.add(key)
      picked.push(comparison)
      added = true
    }
    if (!added) break
  }

  if (picked.length < limit) {
    for (const comparison of rankComparisonsForHub(categoryComparisons, byId, market, limit * 2)) {
      if (picked.length >= limit) break
      const key = keyOf(comparison)
      if (seen.has(key)) continue
      seen.add(key)
      picked.push(comparison)
    }
  }

  return picked
}
