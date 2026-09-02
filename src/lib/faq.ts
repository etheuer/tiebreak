import type { Product } from '@/lib/data'
import type { UseCase } from '@/data/use-cases'
import { buildAnswer, lensRows, sentenceCase, shortName, type DealBreakerCheck, type LensRow } from '@/lib/decision'
import { priceLabel, type Verdict } from '@/lib/verdict'
import { isFeeBased } from '@/lib/nav'
import type { MarketId } from '@/lib/markets'

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
