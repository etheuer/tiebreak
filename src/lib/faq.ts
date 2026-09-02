import type { Comparison, Product } from '@/lib/data'
import type { UseCase } from '@/data/use-cases'
import { buildAnswer, lensRows, sentenceCase, shortName, type DealBreakerCheck, type LensRow } from '@/lib/decision'
import { priceLabel, type Verdict } from '@/lib/verdict'
import { isFeeBased, priceShort } from '@/lib/nav'
import type { MarketId } from '@/lib/markets'
import { catalogFor } from '@/data/spec-catalog'
import { highlightFields, specValue } from '@/lib/specs'
import { displaySpec, listJoin } from '@/lib/format'
import { CATALOG_AS_OF } from '@/lib/site'

export type Qa = { q: string; a: string }
export type LensAnswer = { id: string; label: string; job: string; headline: string; reasons: string[] }

export function buildLensAnswers(
  a: Product,
  b: Product,
  rows: LensRow[],
  checks: DealBreakerCheck[],
  useCases: UseCase[],
  market: MarketId = 'us'
): LensAnswer[] {
  return useCases.map((useCase) => {
    const ans = buildAnswer({ productA: a, productB: b, useCase, rows: lensRows(rows, useCase), checks, matters: new Set(), market })
    return { id: useCase.id, label: useCase.label, job: useCase.job, headline: ans.headline, reasons: ans.reasons }
  })
}

export function buildCompareFaq(
  a: Product,
  b: Product,
  verdict: Verdict,
  overallHeadline: string,
  overallReasons: string[],
  lenses: LensAnswer[],
  checks: DealBreakerCheck[],
  market: MarketId = 'us'
): Qa[] {
  const na = shortName(a), nb = shortName(b)
  const fee = isFeeBased(a.subcategory)
  const cheaper = verdict.priceLeader === 'a' ? a : verdict.priceLeader === 'b' ? b : null
  const faq: Qa[] = []

  const cheaperAnswer = cheaper
    ? `${shortName(cheaper)} ${fee ? 'charges' : 'costs'} ${priceLabel(verdict.priceGap, market)} ${fee ? 'a year less' : 'less at list price'}.`
    : verdict.priceLeader === null && market !== 'us'
      ? 'Local price not listed for one or both products.'
      : fee
        ? 'Both charge the same annual fee.'
        : 'Both list at the same price.'
  faq.push({
    q: fee ? `Which card has the lower annual fee, ${na} or ${nb}?` : `Which is cheaper, the ${na} or the ${nb}?`,
    a: cheaperAnswer,
  })

  const trips = checks.filter((c) => c.a === 'trips' || c.b === 'trips')
  if (trips.length > 0) {
    const t = trips[0]
    const who = t.a === 'trips' && t.b === 'trips' ? 'Both' : t.a === 'trips' ? na : nb
    faq.push({
      q: `What is the biggest catch with the ${na} or ${nb}?`,
      a: `${who} has this deal-breaker: ${sentenceCase(t.label)}.${t.why ? ' ' + t.why : ''}`
    })
  } else {
    faq.push({
      q: `What is the biggest catch with the ${na} or ${nb}?`,
      a: 'Neither product triggers any of our common deal-breakers for this category.'
    })
  }

  if (lenses.length > 0) {
    const lens = lenses[0]
    faq.push({
      q: `Which is better for ${lens.label.toLowerCase()}, the ${na} or the ${nb}?`,
      a: [lens.headline, ...lens.reasons.slice(0, 2)].join(' ')
    })
  }

  faq.push({
    q: 'What cannot be compared from spec sheets?',
    a: `Of the ${verdict.total} specs tracked here, ${verdict.total - verdict.scored} are descriptive and cannot be ranked on numbers alone. Spec sheets also cannot measure subjective factors like build quality, real-world performance, or comfort.`
  })

  return faq.slice(0, 4)
}

export function buildProductFaq(
  product: Product,
  comparisons: Comparison[],
  market: MarketId = 'us'
): Qa[] {
  const faq: Qa[] = []
  const fee = isFeeBased(product.subcategory)

  // 1. Price snapshot
  const price = priceShort(product, market)
  faq.push({
    q: `How much does ${product.name} cost?`,
    a: fee
      ? `${product.name} has an annual fee of ${price} (catalog snapshot as of ${CATALOG_AS_OF}). This is based on published issuer terms and is not a live financial offer.`
      : `${product.name} lists at ${price} (manufacturer list price snapshot as of ${CATALOG_AS_OF}). Retail prices vary by merchant and this is not a live quote.`,
  })

  // 2. Key specs (3 highlight fields)
  const highlights = highlightFields(catalogFor(product.subcategory)).slice(0, 3)
  if (highlights.length > 0) {
    const specList = highlights.map(
      (h) => `${h.label.toLowerCase()} (${displaySpec(specValue(product, h.key), h.key, market)})`
    )
    faq.push({
      q: `What are ${product.name}’s key specs?`,
      a: `Key specifications for ${product.name} include ${listJoin(specList, market)}.`,
    })
  }

  // 3. Matchups (up to 6)
  const matching = comparisons
    .filter((c) => c.productA === product.id || c.productB === product.id)
    .slice(0, 6)
  if (matching.length > 0) {
    const matchNames = matching.map((c) => c.productName)
    faq.push({
      q: `What does ${product.name} compare against?`,
      a: `${product.name} is compared head to head against ${listJoin(matchNames, market)}.`,
    })
  }

  return faq
}
