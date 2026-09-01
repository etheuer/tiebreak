import type { Product } from '@/lib/data'
import { catalogFor } from '@/data/spec-catalog'
import { dealBreakersFor } from '@/data/deal-breakers'
import type { UseCase } from '@/data/use-cases'
import { isFeeBased } from '@/lib/nav'
import { specValue } from '@/lib/specs'
import type { ScoredRow, Side, Verdict } from '@/lib/verdict'

/*
  Decision layer on top of the verdict: re-scores wins through a "buying for"
  lens, flags deal-breakers from the spec sheet, and writes a specific answer
  that cites the numbers behind it. Pure functions, safe on server and client.
*/

export type LensRow = ScoredRow & { group: string }

export type DealBreakerStatus = 'trips' | 'clear' | 'unknown'

export type DealBreakerCheck = {
  id: string
  key: string
  group: string
  label: string
  why: string
  a: DealBreakerStatus
  b: DealBreakerStatus
  aValue: string
  bValue: string
}

export type LensScore = {
  aWins: number
  bWins: number
  scored: number
  differing: number
  leader: Side | null
}

export type Answer = {
  pick: Side | null
  headline: string
  reasons: string[]
  caveat: string | null
}

export function shortName(product: Product): string {
  return product.name.replace(/\s*\((\d{4})\)/, '').replace(/ (TV|OLED evo TV|QLED TV)$/, '')
}

function groupIndex(subcategory: string): Map<string, string> {
  const index = new Map<string, string>()
  for (const group of catalogFor(subcategory)) {
    for (const field of group.fields) index.set(field.key, group.id)
  }
  return index
}

export function flattenRows(verdict: Verdict): LensRow[] {
  return verdict.groups.flatMap((group) => group.rows.map((row) => ({ ...row, group: group.id })))
}

/** Rows a lens cares about, in the lens's own order. No lens means the highlight rows. */
export function lensRows(rows: LensRow[], useCase: UseCase | null): LensRow[] {
  if (!useCase) return rows.filter((row) => row.highlight)
  const byKey = new Map(rows.map((row) => [row.key, row]))
  return useCase.keys.map((key) => byKey.get(key)).filter((row): row is LensRow => Boolean(row))
}

export function scoreLens(rows: LensRow[]): LensScore {
  let aWins = 0
  let bWins = 0
  let differing = 0
  for (const row of rows) {
    if (row.differs) differing += 1
    if (row.winner === 'a') aWins += 1
    if (row.winner === 'b') bWins += 1
  }
  return {
    aWins,
    bWins,
    scored: aWins + bWins,
    differing,
    leader: aWins === bWins ? null : aWins > bWins ? 'a' : 'b',
  }
}

function status(result: boolean | null): DealBreakerStatus {
  if (result === null) return 'unknown'
  return result ? 'trips' : 'clear'
}

/** Every rule that trips for at least one side. Both-trip rules are kept so the UI can say "both miss". */
export function checkDealBreakers(productA: Product, productB: Product): DealBreakerCheck[] {
  const rules = dealBreakersFor(productA.subcategory)
  const groups = groupIndex(productA.subcategory)
  const checks: DealBreakerCheck[] = []
  for (const rule of rules) {
    const aValue = specValue(productA, rule.key)
    const bValue = specValue(productB, rule.key)
    const a = status(rule.trips(aValue))
    const b = status(rule.trips(bValue))
    if (a !== 'trips' && b !== 'trips') continue
    checks.push({
      id: rule.id,
      key: rule.key,
      group: groups.get(rule.key) ?? 'specs',
      label: rule.label,
      why: rule.why,
      a,
      b,
      aValue,
      bValue,
    })
  }
  return checks
}

function clip(value: string, max = 46): string {
  const head = value.split(' (')[0].trim() || value.trim()
  return head.length > max ? `${head.slice(0, max - 1).trimEnd()}…` : head
}

function money(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`
}

function listLabels(labels: string[]): string {
  const lower = labels.map((label) => label.charAt(0).toLowerCase() + label.slice(1))
  if (lower.length <= 1) return lower.join('')
  if (lower.length === 2) return `${lower[0]} and ${lower[1]}`
  return `${lower.slice(0, -1).join(', ')} and ${lower[lower.length - 1]}`
}

/** Rows the winner takes, best evidence first: highlighted rows, then lens order. */
function evidence(rows: LensRow[], side: Side, limit: number): LensRow[] {
  const won = rows.filter((row) => row.winner === side)
  return [...won.filter((row) => row.highlight), ...won.filter((row) => !row.highlight)].slice(0, limit)
}

function citation(row: LensRow, winner: Side): string {
  const win = winner === 'a' ? row.a : row.b
  const lose = winner === 'a' ? row.b : row.a
  return `${row.label}: ${clip(win)} vs ${clip(lose)}`
}

export function buildAnswer({
  productA,
  productB,
  useCase,
  rows,
  checks,
  matters,
}: {
  productA: Product
  productB: Product
  useCase: UseCase | null
  rows: LensRow[]
  checks: DealBreakerCheck[]
  matters: ReadonlySet<string>
}): Answer {
  const name = { a: shortName(productA), b: shortName(productB) }
  const price = { a: productA.price, b: productB.price }
  const lens = useCase ? useCase.label.toLowerCase() : 'overall'
  const fee = isFeeBased(productA.subcategory)
  const gap = Math.abs(price.a - price.b)
  const cheaper: Side | null = price.a === price.b ? null : price.a < price.b ? 'a' : 'b'

  const active = checks.filter((check) => matters.has(check.id))
  const outA = active.filter((check) => check.a === 'trips' && check.b !== 'trips')
  const outB = active.filter((check) => check.b === 'trips' && check.a !== 'trips')
  const bothMiss = active.filter((check) => check.a === 'trips' && check.b === 'trips')

  const bothNote =
    bothMiss.length > 0 ? `Both miss on ${listLabels(bothMiss.map((check) => check.label))}.` : null

  if (outA.length > 0 && outB.length > 0) {
    return {
      pick: null,
      headline: 'Neither survives your deal-breakers.',
      reasons: [
        `${name.a}: ${listLabels(outA.map((check) => check.label))}`,
        `${name.b}: ${listLabels(outB.map((check) => check.label))}`,
      ],
      caveat: 'Untick one to see the fallback pick, or swap in a different model above.',
    }
  }

  const score = scoreLens(rows)

  if (outA.length > 0 || outB.length > 0) {
    const pick: Side = outA.length > 0 ? 'b' : 'a'
    const loser: Side = pick === 'a' ? 'b' : 'a'
    const failed = pick === 'a' ? outB : outA
    const reasons: string[] = []
    const wins = pick === 'a' ? score.aWins : score.bWins
    const loses = pick === 'a' ? score.bWins : score.aWins
    if (score.scored > 0) {
      reasons.push(
        wins >= loses
          ? `It also leads ${wins} of ${score.scored} rankable ${lens} specs.`
          : `${name[loser]} would have led ${loses} of ${score.scored} ${lens} specs, so you are trading some spec wins for the must-have.`
      )
    }
    for (const row of evidence(rows, pick, 1)) reasons.push(citation(row, pick))
    if (cheaper === pick) reasons.push(fee ? `It also charges ${money(gap)} less a year.` : `It is also ${money(gap)} cheaper.`)
    else if (cheaper === loser) {
      reasons.push(
        fee
          ? `Its annual fee is ${money(gap)} higher than the card you ruled out.`
          : `It costs ${money(gap)} more than the one you ruled out.`
      )
    }
    return {
      pick,
      headline: `Buy the ${name[pick]}. ${name[loser]} is out: ${listLabels(failed.map((check) => check.label))}.`,
      reasons,
      caveat: bothNote,
    }
  }

  const unmarkedFor = (side: Side) =>
    checks.filter(
      (check) =>
        !matters.has(check.id) &&
        (side === 'a' ? check.a : check.b) === 'trips' &&
        (side === 'a' ? check.b : check.a) !== 'trips'
    )

  if (score.leader) {
    const pick = score.leader
    const loser: Side = pick === 'a' ? 'b' : 'a'
    const wins = pick === 'a' ? score.aWins : score.bWins
    const loses = pick === 'a' ? score.bWins : score.aWins
    const cited = evidence(rows, pick, 2)
    const reasons: string[] = [
      `Leads ${wins} of ${score.scored} rankable ${lens} specs${loses > 0 ? `; ${name[loser]} takes ${loses}` : ''}.`,
      ...cited.map((row) => citation(row, pick)),
    ]
    if (cheaper === pick) reasons.push(fee ? `It also charges ${money(gap)} less a year.` : `It is also ${money(gap)} cheaper.`)
    else if (cheaper === loser) {
      const hinge = cited[0]?.label.toLowerCase() ?? `the ${lens} lead`
      reasons.push(
        fee
          ? `${name[loser]} charges ${money(gap)} less a year. Pay the higher fee only if ${hinge} matters to you.`
          : `${name[loser]} is ${money(gap)} cheaper. Pay the difference only if ${hinge} matters to you.`
      )
    } else reasons.push(`Same ${fee ? 'annual fee' : 'list price'}, so the spec lead is the whole story.`)

    const risks = unmarkedFor(pick)
    const caveat =
      risks.length > 0
        ? `Check first: ${name[pick]} has ${listLabels(risks.map((check) => check.label))}. Tick it under deal-breakers if that rules it out.`
        : null
    return {
      pick,
      headline: useCase ? `For ${lens}, buy the ${name[pick]}.` : `Buy the ${name[pick]}.`,
      reasons,
      caveat: [caveat, bothNote].filter(Boolean).join(' ') || null,
    }
  }

  if (cheaper) {
    const risks = unmarkedFor(cheaper)
    return {
      pick: cheaper,
      headline: fee
        ? `Even on ${lens} specs, so take the ${name[cheaper]} for its lower fee.`
        : `Even on ${lens} specs, so take the cheaper ${name[cheaper]}.`,
      reasons: [
        score.scored > 0
          ? `The ${score.scored} rankable ${lens} specs split ${score.aWins} to ${score.bWins}.`
          : `Nothing in the ${lens} set can be ranked honestly; the sheets differ in kind, not degree.`,
        fee ? `Saves ${money(gap)} a year in fees.` : `Saves ${money(gap)} at list price.`,
      ],
      caveat:
        [
          risks.length > 0
            ? `Check first: ${name[cheaper]} has ${listLabels(risks.map((check) => check.label))}.`
            : null,
          bothNote,
        ]
          .filter(Boolean)
          .join(' ') || null,
    }
  }

  const differing = rows.filter((row) => row.differs && !row.winner).slice(0, 2)
  return {
    pick: null,
    headline: `A genuine coin flip on ${lens}.`,
    reasons: [
      `Same ${fee ? 'annual fee' : 'price'} and an even split on everything we can rank.`,
      ...differing.map((row) => `${row.label}: ${clip(row.a)} vs ${clip(row.b)}`),
    ],
    caveat:
      [
        differing[0] ? `Decide on ${differing[0].label.toLowerCase()}, or tick a deal-breaker below.` : null,
        bothNote,
      ]
        .filter(Boolean)
        .join(' ') || null,
  }
}
