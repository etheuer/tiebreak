import type { Product } from '@/lib/data'
import type { UseCase } from '@/data/use-cases'
import { buildAnswer, lensRows, shortName, type DealBreakerCheck, type LensRow } from '@/lib/decision'
import { priceLabel, type Verdict } from '@/lib/verdict'
import { isFeeBased } from '@/lib/nav'

export type Qa = { q: string; a: string }
export type LensAnswer = { id: string; label: string; job: string; headline: string; reasons: string[] }

export function buildLensAnswers(a: Product, b: Product, rows: LensRow[], checks: DealBreakerCheck[], useCases: UseCase[]): LensAnswer[] {
  return useCases.map((useCase) => {
    const ans = buildAnswer({ productA: a, productB: b, useCase, rows: lensRows(rows, useCase), checks, matters: new Set() })
    return { id: useCase.id, label: useCase.label, job: useCase.job, headline: ans.headline, reasons: ans.reasons }
  })
}

export function buildCompareFaq(a: Product, b: Product, verdict: Verdict, overallHeadline: string, overallReasons: string[], lenses: LensAnswer[], checks: DealBreakerCheck[]): Qa[] {
  const na = shortName(a), nb = shortName(b)
  const fee = isFeeBased(a.subcategory)
  const cheaper = verdict.priceLeader === 'a' ? a : verdict.priceLeader === 'b' ? b : null
  const faq: Qa[] = []
  faq.push({ q: `Which should I buy, the ${na} or the ${nb}?`, a: [overallHeadline, ...overallReasons].join(' ') })
  faq.push({ q: fee ? `Which card has the lower annual fee, ${na} or ${nb}?` : `Which is cheaper, the ${na} or the ${nb}?`,
    a: cheaper ? `${shortName(cheaper)} ${fee ? 'charges' : 'costs'} ${priceLabel(verdict.priceGap)} ${fee ? 'a year less' : 'less at list price'}.` : fee ? 'Both charge the same annual fee.' : 'Both list at the same price.' })
  for (const lens of lenses) faq.push({ q: `Which is better for ${lens.label.toLowerCase()}, the ${na} or the ${nb}?`, a: [lens.headline, ...lens.reasons.slice(0, 2)].join(' ') })
  const diffs = verdict.highlights.filter((r) => r.differs).slice(0, 4)
  faq.push({ q: `What are the main differences between the ${na} and the ${nb}?`, a: `${verdict.differing} of the ${verdict.total} tracked specs differ.${diffs.length ? ' ' + diffs.map((r) => `${r.label}: ${r.a} vs ${r.b}`).join('; ') + '.' : ''}` })
  const trips = checks.filter((c) => c.a === 'trips' || c.b === 'trips')
  faq.push({ q: `Does either one have a deal-breaker?`, a: trips.length ? trips.map((c) => `${c.label}: ${c.a === 'trips' && c.b === 'trips' ? 'both' : c.a === 'trips' ? na : nb}.`).join(' ') : 'Nothing on either spec sheet trips a common deal-breaker for this product type.' })
  return faq
}
