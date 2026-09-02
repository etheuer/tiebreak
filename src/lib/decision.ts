import type { Product } from '@/lib/data'
import { priceOf } from '@/lib/pricing'
import { catalogFor } from '@/data/spec-catalog'
import { dealBreakersFor } from '@/data/deal-breakers'
import type { UseCase } from '@/data/use-cases'
import { isFeeBased } from '@/lib/nav'
import { specValue } from '@/lib/specs'
import type { ScoredRow, Side, Verdict } from '@/lib/verdict'
import { formatMoney, listJoin } from '@/lib/format'
import type { MarketId } from '@/lib/markets'

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
  thin?: { scored: number; total: number }
}

export function lensCoverage(rows: LensRow[], useCase: UseCase | null): { scored: number; total: number } {
  const filtered = lensRows(rows, useCase)
  return { scored: scoreLens(filtered).scored, total: filtered.length }
}

export function shortName(product: Product): string {
  return product.name
    .replace(/\s*\((\d{4})\)/, '')
    .replace(/ (OLED evo TV|QLED TV|OLED TV|TV)$/, '')
}

/**
 * Compact labels that let a reader tell the two columns apart.
 * Cross-brand matchups use the brand ("Samsung" vs "Apple"). Same-brand
 * matchups strip the shared brand mention so the model name carries the
 * distinction ("Blue Cash Preferred" vs "Blue Cash Everyday", never
 * "American Express" twice). Falls back to the full short name if
 * stripping would make the two labels identical.
 */
export function columnLabels(productA: Product, productB: Product): { a: string; b: string } {
  if (productA.brand !== productB.brand) {
    return { a: productA.brand, b: productB.brand }
  }

  const stripBrand = (product: Product) => {
    const full = shortName(product)
    const brand = product.brand.toLowerCase()
    let name = full
    if (name.toLowerCase().startsWith(`${brand} `)) name = name.slice(product.brand.length + 1)
    const tail = ` from ${brand}`
    if (name.toLowerCase().endsWith(tail)) name = name.slice(0, -tail.length)
    name = name.replace(/\s+(Credit Card|Card)$/i, '')
    name = name.trim()
    // A bare number ("OnePlus 12" -> "12") reads worse than the full name.
    if (!name || /^\d+$/.test(name)) return full
    return name
  }

  const a = stripBrand(productA)
  const b = stripBrand(productB)
  return a === b ? { a: shortName(productA), b: shortName(productB) } : { a, b }
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
    const a = status(rule.trips(aValue, rule.key))
    const b = status(rule.trips(bValue, rule.key))
    if (a === 'clear' && b === 'clear') continue
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
  if (head.length <= max) return head
  const sliced = head.slice(0, max - 1)
  const lastSpace = sliced.lastIndexOf(' ')
  return lastSpace > 0 ? `${sliced.slice(0, lastSpace)}…` : `${sliced}…`
}

function money(amount: number, market: MarketId): string {
  return formatMoney(amount, market)
}

export function sentenceCase(label: string): string {
  if (!label) return label
  return /^[A-Z][a-z]/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label
}

function listLabels(labels: string[], market: MarketId = 'us'): string {
  const lower = labels.map((label) => sentenceCase(label))
  return listJoin(lower, market)
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

const RISK_NOUNS: Record<string, string> = {
  weight: 'weight',
  refresh_rate: 'refresh rate',
  os: 'operating system',
  hdr_formats: 'HDR formats',
  hdmi_2_1_ports: 'HDMI 2.1 ports',
  burn_in_risk: 'burn-in risk',
  screen_finish: 'screen finish',
  touchscreen: 'touchscreen',
  ram_upgradable: 'RAM upgradability',
  hdmi: 'HDMI port',
  stylus: 'stylus',
  headphone_jack: 'headphone jack',
  charger_in_box: 'charger in the box',
  os_updates: 'OS updates',
  ip_rating: 'IP rating',
  expandable_storage: 'expandable storage',
  max_runtime: 'battery runtime',
  docking_station: 'docking station',
  warranty: 'warranty',
  foldable: 'foldability',
  codec: 'codecs',
  battery: 'battery life',
  ip: 'IP rating',
  smart: 'smart features',
  noise: 'noise level',
  coverage: 'coverage area',
  annual_fee: 'annual fee',
  foreign_tx: 'foreign transaction fee',
  lounge: 'airport lounge access',
  credit_needed: 'credit requirement',
  intro_offer: 'intro offer'
}

function formatRisk(productName: string, check: DealBreakerCheck, status: DealBreakerStatus): string {
  const lowerLabel = sentenceCase(check.label)
  if (status === 'unknown') {
    if (check.key === 'foldable') return `we could not confirm whether the ${productName} folds`
    const noun = RISK_NOUNS[check.key]
    if (noun) return `we could not confirm the ${productName}'s ${noun}`

    let fallback = lowerLabel
    if (fallback.startsWith('no ')) fallback = sentenceCase(fallback.slice(3))
    return `we could not confirm the ${productName}'s ${fallback}`
  }

  if (check.key === 'foldable') return `the ${productName} does not fold`
  if (check.key === 'weight') return `the ${productName} weighs ${lowerLabel}`
  if (check.key === 'refresh_rate' || check.key === 'screen_finish') return `the ${productName} has a ${lowerLabel}`
  if (check.key === 'ram_upgradable') return `the ${productName}'s RAM cannot be upgraded`
  if (check.key === 'credit_needed') return `the ${productName} ${lowerLabel}`
  if (check.label === 'Not IP68') return `the ${productName} is not IP68`

  return `the ${productName} has ${lowerLabel}`
}

export function buildAnswer({
  productA,
  productB,
  useCase,
  rows,
  checks,
  matters,
  market = 'us',
}: {
  productA: Product
  productB: Product
  useCase: UseCase | null
  rows: LensRow[]
  checks: DealBreakerCheck[]
  matters: ReadonlySet<string>
  market?: MarketId
}): Answer {
  const name = { a: shortName(productA), b: shortName(productB) }
  const pointA = priceOf(productA, market)
  const pointB = priceOf(productB, market)
  const priced = pointA && pointB && pointA.currency === pointB.currency
  const lens = useCase ? useCase.label.toLowerCase() : 'overall'
  const fee = isFeeBased(productA.subcategory)
  const gap = priced ? Math.abs(pointA.amount - pointB.amount) : 0
  const cheaper: Side | null = !priced
    ? null
    : pointA.amount === pointB.amount
      ? null
      : pointA.amount < pointB.amount
        ? 'a'
        : 'b'

  const active = checks.filter((check) => matters.has(check.id))
  const outA = active.filter((check) => check.a === 'trips' && check.b !== 'trips')
  const outB = active.filter((check) => check.b === 'trips' && check.a !== 'trips')
  const bothMiss = active.filter((check) => check.a === 'trips' && check.b === 'trips')

  const bothNote =
    bothMiss.length > 0 ? `Both miss on ${listLabels(bothMiss.map((check) => check.label), market)}.` : null

  if (outA.length > 0 && outB.length > 0) {
    return {
      pick: null,
      headline: 'Neither survives your deal-breakers.',
      reasons: [
        `${name.a}: ${listLabels(outA.map((check) => check.label), market)}`,
        `${name.b}: ${listLabels(outB.map((check) => check.label), market)}`,
      ],
      caveat: 'Untick one to see the fallback pick, or swap in a different model above.',
    }
  }

  const score = scoreLens(rows)
  const thin = { scored: score.scored, total: rows.length }

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
          ? `It also leads ${wins} of ${score.scored} rankable ${lens} spec${score.scored === 1 ? '' : 's'}.`
          : `${name[loser]} would have led ${loses} of ${score.scored} ${lens} spec${score.scored === 1 ? '' : 's'}, so you are trading some spec win${loses === 1 ? '' : 's'} for the must-have.`
      )
    }
    for (const row of evidence(rows, pick, 1)) reasons.push(citation(row, pick))
    if (cheaper === pick) reasons.push(fee ? `It also charges ${money(gap, market)} less a year.` : `It is also ${money(gap, market)} cheaper.`)
    else if (cheaper === loser) {
      reasons.push(
        fee
          ? `Its annual fee is ${money(gap, market)} higher than the card you ruled out.`
          : `It costs ${money(gap, market)} more than the one you ruled out.`
      )
    }
    return {
      pick,
      headline: `Buy the ${name[pick]}. ${name[loser]} is out: ${listLabels(failed.map((check) => check.label), market)}.`,
      reasons,
      caveat: bothNote,
      thin,
    }
  }

  if (useCase && score.scored < 2) {
    const singleScored = rows.find(r => r.winner)
    const onLens = useCase ? `on ${lens}` : 'overall'
    const headline = `Too close to call ${onLens} from the spec sheets.` + (singleScored ? ` Only ${singleScored.label.toLowerCase()} is rankable here.` : '')
    const differing = rows.filter((row) => row.differs && !row.winner).slice(0, 2)
    const reasons = differing.map(row => `${row.label}: ${clip(row.a)} vs ${clip(row.b)}`)
    return {
      pick: null,
      headline,
      reasons,
      caveat: bothNote,
      thin,
    }
  }

  const unmarkedFor = (side: Side) =>
    checks.filter(
      (check) =>
        !matters.has(check.id) &&
        (side === 'a' ? check.a : check.b) !== 'clear' &&
        (side === 'a' ? check.b : check.a) !== 'trips'
    )

  if (score.leader) {
    const pick = score.leader
    const loser: Side = pick === 'a' ? 'b' : 'a'
    const wins = pick === 'a' ? score.aWins : score.bWins
    const loses = pick === 'a' ? score.bWins : score.aWins
    const cited = evidence(rows, pick, 2)
    const reasons: string[] = [
      `Leads ${wins} of ${score.scored} rankable ${lens} spec${score.scored === 1 ? '' : 's'}${loses > 0 ? `; ${name[loser]} takes ${loses}` : ''}.`,
      ...cited.map((row) => citation(row, pick)),
    ]
    if (cheaper === pick) reasons.push(fee ? `It also charges ${money(gap, market)} less a year.` : `It is also ${money(gap, market)} cheaper.`)
    else if (cheaper === loser) {
      const hinge = cited[0]?.label.toLowerCase() ?? `the ${lens} lead`
      reasons.push(
        fee
          ? `${name[loser]} charges ${money(gap, market)} less a year. Pay the higher fee only if ${hinge} matters to you.`
          : `${name[loser]} is ${money(gap, market)} cheaper. Pay the difference only if ${hinge} matters to you.`
      )
    } else if (!priced) {
      reasons.push('Local price not listed, so the spec lead is the whole story.')
    } else reasons.push(`Same ${fee ? 'annual fee' : 'list price'}, so the spec lead is the whole story.`)

    const risks = unmarkedFor(pick)
    const caveat =
      risks.length > 0
        ? `Check first: ${risks.map((check) => formatRisk(name[pick], check, pick === 'a' ? check.a : check.b)).join('. ')}. Tick them under deal-breakers if that rules it out.`
        : null
    return {
      pick,
      headline: useCase ? `For ${lens}, buy the ${name[pick]}.` : `Buy the ${name[pick]}.`,
      reasons,
      caveat: [caveat, bothNote].filter(Boolean).join(' ') || null,
      thin,
    }
  }

  if (cheaper) {
    const risks = unmarkedFor(cheaper)
    const onLens = useCase ? `on ${lens}` : 'overall'
    return {
      pick: cheaper,
      headline: fee
        ? `Tied ${onLens}. ${name[cheaper]} charges less a year.`
        : `Tied ${onLens}. ${name[cheaper]} is cheaper.`,
      reasons: [
        score.scored > 0
          ? `The ${score.scored} rankable ${lens} spec${score.scored === 1 ? '' : 's'} split ${score.aWins} to ${score.bWins}.`
          : `Nothing in the ${lens} set can be ranked honestly; the sheets differ in kind, not degree.`,
        fee ? `Saves ${money(gap, market)} a year in fees.` : `Saves ${money(gap, market)} at list price.`,
      ],
      caveat:
        [
          risks.length > 0
            ? `Check first: ${risks.map((check) => formatRisk(name[cheaper], check, cheaper === 'a' ? check.a : check.b)).join('. ')}.`
            : null,
          bothNote,
        ]
          .filter(Boolean)
          .join(' ') || null,
      thin,
    }
  }

  const differing = rows.filter((row) => row.differs && !row.winner).slice(0, 2)
  const onLens = useCase ? `on ${lens}` : 'overall'
  return {
    pick: null,
    headline: `A genuine coin flip ${onLens}.`,
    reasons: [
      priced
        ? `Same ${fee ? 'annual fee' : 'price'} and an even split on everything we can rank.`
        : 'Local price not listed, and an even split on everything we can rank.',
      ...differing.map((row) => `${row.label}: ${clip(row.a)} vs ${clip(row.b)}`),
    ],
    caveat:
      [
        differing[0] ? `Decide on ${differing[0].label.toLowerCase()}, or tick a deal-breaker below.` : null,
        bothNote,
      ]
        .filter(Boolean)
        .join(' ') || null,
    thin,
  }
}
