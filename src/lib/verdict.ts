import type { Product } from '@/lib/data'
import { priceOf } from '@/lib/pricing'
import { mergeCatalogs, type SpecField, type SpecOrigin } from '@/data/spec-catalog'
import { buildComparisonGroups, type RenderedGroup } from '@/lib/specs'
import { isFeeBased } from '@/lib/nav'
import { formatMoney } from '@/lib/format'
import { type MarketId } from '@/lib/markets'
import { SPEC_UNITS } from '@/data/spec-units'
import { qty } from '@/lib/units'

export type Side = 'a' | 'b'

export type ScoredRow = {
  key: string
  label: string
  a: string
  b: string
  differs: boolean
  origin: SpecOrigin
  /** null when the two values cannot be ranked honestly */
  winner: Side | null
  /** short human reason, e.g. "higher" / "lower" / "has it" */
  reason: string | null
  highlight: boolean
}

export type ScoredGroup = {
  id: string
  label: string
  rows: ScoredRow[]
  aWins: number
  bWins: number
  diffCount: number
  leader: Side | null
}

export type Verdict = {
  groups: ScoredGroup[]
  aWins: number
  bWins: number
  scored: number
  differing: number
  total: number
  leader: Side | null
  highlights: ScoredRow[]
  priceLeader: Side | null
  priceGap: number
}

type Direction = 'higher' | 'lower'

/**
 * Only keys listed here get a winner. Anything else is shown as a difference
 * without a verdict, because ranking it would be an invented opinion.
 */
const NUMERIC_RULES: Record<string, Direction> = {
  // shared
  peak_brightness: 'higher',
  brightness: 'higher',
  refresh_rate: 'higher',
  resolution: 'higher',
  weight: 'lower',
  thickness: 'lower',
  warranty: 'higher',
  ram: 'higher',
  storage: 'higher',
  // tvs
  screen_size: 'higher',
  native_refresh: 'higher',
  hdmi_2_1_ports: 'higher',
  input_lag: 'lower',
  // laptops
  display_size: 'higher',
  battery_life: 'higher',
  // smartphones
  ppi: 'higher',
  battery_capacity: 'higher',
  wired_charging: 'higher',
  optical_zoom: 'higher',
  main_camera: 'higher',
  ultrawide_camera: 'higher',
  telephoto_camera: 'higher',
  front_camera: 'higher',
  // vacuums
  suction: 'higher',
  max_runtime: 'higher',
  charge_time: 'lower',
  bin_capacity: 'higher',
  noise: 'lower',
  // headphones
  battery: 'higher',
  charge: 'lower',
  // air-purifiers
  cadr: 'higher',
  coverage: 'higher',
  filter_life: 'higher',
  // credit-cards
  annual_fee: 'lower',
  apr: 'lower',
  foreign_tx: 'lower',
  late_fee: 'lower',
  rewards_rate: 'higher',
}

/** Keys where a plain "Yes" beats a plain "No". */
const YES_IS_BETTER = new Set([
  'always_on',
  'expandable_storage',
  'headphone_jack',
  'wireless_charging',
  'reverse_charging',
  'charger_in_box',
  'nfc',
  'stylus',
  'touchscreen',
  'sd_card',
  'magsafe',
  'four_k_120',
  'vrr',
  'allm',
  'earc',
  'dolby_atmos',
  'ram_upgradable',
  'storage_upgradable',
  'auto_suction',
  'sealed_system',
  'bagless',
  'anti_tangle',
  'dust_sensing',
  // headphones
  'anc',
  'transparency',
  'multipoint',
  'foldable',
  // air-purifiers
  'smart',
  // credit-cards
  'lounge',
])

const NUMBER = String.raw`\d[\d,]*(?:\.\d+)?`

function toNumber(raw: string): number {
  return Number.parseFloat(raw.replace(/,/g, ''))
}

/** Unit token that follows a number, normalised so "year" and "years" match. */
function unitAfter(text: string): string {
  const match = text.match(/^\s*([a-zA-Z%°"]+)/)
  if (!match) return ''
  return match[1].toLowerCase().replace(/s$/, '')
}

type Measure = { value: number; unit: string }

/**
 * Reads the leading measurement of a spec string. Ranges collapse toward the
 * end of the range that the direction cares about, so "1,500-2,000 nits" is
 * 2000 when higher wins and 1500 when lower wins.
 */
function measure(value: string, direction: Direction): Measure | null {
  const head = value.split('(')[0]
  const range = head.match(new RegExp(`(${NUMBER})\\s*[–—-]\\s*(${NUMBER})`))
  if (range) {
    const low = toNumber(range[1])
    const high = toNumber(range[2])
    if (!Number.isFinite(low) || !Number.isFinite(high)) return null
    const rest = head.slice((range.index ?? 0) + range[0].length)
    return { value: direction === 'higher' ? Math.max(low, high) : Math.min(low, high), unit: unitAfter(rest) }
  }
  // "None (0%)" keeps its only number inside the parenthetical, so fall back to
  // the whole string when the head carries no figure at all.
  const source = new RegExp(NUMBER).test(head) ? head : value
  const single = source.match(new RegExp(`(${NUMBER})`))
  if (!single) return null
  const num = toNumber(single[1])
  if (!Number.isFinite(num)) return null
  const rest = source.slice((single.index ?? 0) + single[0].length)
  return { value: num, unit: unitAfter(rest) }
}

function yesNo(value: string): boolean | null {
  const head = value.trim().toLowerCase()
  if (/^yes\b/.test(head)) return true
  if (/^no\b/.test(head)) return false
  return null
}

function judge(key: string, a: string, b: string): { winner: Side | null; reason: string | null } {
  if (a === b) return { winner: null, reason: null }

  if (YES_IS_BETTER.has(key)) {
    const yesA = yesNo(a)
    const yesB = yesNo(b)
    if (yesA !== null && yesB !== null && yesA !== yesB) {
      return { winner: yesA ? 'a' : 'b', reason: 'has it' }
    }
  }

  const direction = NUMERIC_RULES[key]
  if (!direction) return { winner: null, reason: null }

  let mA: { value: number; unit: string } | null
  let mB: { value: number; unit: string } | null
  if (SPEC_UNITS[key]) {
    mA = qty(a, key)
    mB = qty(b, key)
  } else {
    mA = measure(a, direction)
    mB = measure(b, direction)
    if (mA && mB && mA.unit !== mB.unit) return { winner: null, reason: null }
  }
  if (!mA || !mB) return { winner: null, reason: null }
  if (mA.value === mB.value) return { winner: null, reason: null }

  const aBetter = direction === 'higher' ? mA.value > mB.value : mA.value < mB.value
  return { winner: aBetter ? 'a' : 'b', reason: direction === 'higher' ? 'higher' : 'lower' }
}

function highlightKeys(productA: Product, productB: Product): Set<string> {
  const fields: SpecField[] = mergeCatalogs(productA.subcategory, productB.subcategory).flatMap(
    (group) => group.fields.filter((field) => field.highlight)
  )
  return new Set(fields.map((field) => field.key))
}

export function buildVerdict(productA: Product, productB: Product, market: MarketId = 'us'): Verdict {
  const base: RenderedGroup[] = buildComparisonGroups(productA, productB)
  const keyHighlights = highlightKeys(productA, productB)

  let aWins = 0
  let bWins = 0
  let scored = 0
  let differing = 0
  let total = 0
  const highlights: ScoredRow[] = []

  const groups: ScoredGroup[] = base.map((group) => {
    let groupA = 0
    let groupB = 0
    let diffCount = 0

    const rows: ScoredRow[] = group.rows.map((row) => {
      const { winner, reason } =
        row.origin === 'editorial' ? { winner: null, reason: null } : judge(row.key, row.a, row.b)
      total += 1
      if (row.differs) {
        differing += 1
        diffCount += 1
      }
      if (winner) {
        scored += 1
        if (winner === 'a') {
          aWins += 1
          groupA += 1
        } else {
          bWins += 1
          groupB += 1
        }
      }
      const scoredRow: ScoredRow = {
        ...row,
        winner,
        reason,
        highlight: keyHighlights.has(row.key),
      }
      if (scoredRow.highlight) highlights.push(scoredRow)
      return scoredRow
    })

    return {
      id: group.id,
      label: group.label,
      rows,
      aWins: groupA,
      bWins: groupB,
      diffCount,
      leader: groupA === groupB ? null : groupA > groupB ? 'a' : 'b',
    }
  })

  const priceA = priceOf(productA, market)
  const priceB = priceOf(productB, market)
  const priced = priceA && priceB && priceA.currency === priceB.currency
  const priceGap = priced ? Math.abs(priceA.amount - priceB.amount) : 0
  const priceLeader: Side | null = !priced
    ? null
    : priceA.amount === priceB.amount
      ? null
      : priceA.amount < priceB.amount
        ? 'a'
        : 'b'

  return {
    groups,
    aWins,
    bWins,
    scored,
    differing,
    total,
    leader: aWins === bWins ? null : aWins > bWins ? 'a' : 'b',
    highlights,
    priceLeader,
    priceGap,
  }
}

/** One-line answer for shoppers who will not scroll. */
export function verdictLine(
  productA: Product,
  productB: Product,
  verdict: Verdict,
  market: MarketId = 'us'
): string {
  const { leader, aWins, bWins, scored, total } = verdict
  const cheaper = verdict.priceLeader === 'a' ? productA : verdict.priceLeader === 'b' ? productB : null
  const amount = cheaper ? formatMoney(verdict.priceGap, market) : ''
  const fee = cheaper ? isFeeBased(cheaper.subcategory) : false
  const edge = fee ? `charges ${amount} a year less` : `costs ${amount} less`

  if (scored === 0) {
    return cheaper
      ? `Nothing here can be ranked on numbers alone, so features and cost decide it: ${cheaper.name} ${edge}.`
      : 'Nothing here can be ranked on numbers alone, so this comes down to features and taste.'
  }

  if (!leader) {
    return cheaper
      ? `They split the ${scored} rankable spec${scored === 1 ? '' : 's'} evenly, so cost decides it: ${cheaper.name} ${edge}.`
      : `They split the ${scored} rankable spec${scored === 1 ? '' : 's'} evenly, with nothing to separate them on cost.`
  }

  const winner = leader === 'a' ? productA : productB
  const wins = leader === 'a' ? aWins : bWins
  const loses = leader === 'a' ? bWins : aWins
  // Most attributes in some catalogs are descriptive, so say so rather than
  // letting a 2-0 headline imply a landslide.
  const thin = scored < 5 ? ` Most of the ${total} attributes tracked here are descriptive rather than numeric.` : ''

  if (cheaper && cheaper.id === winner.id) {
    return `${winner.name} leads ${wins} to ${loses} on the ${scored} rankable spec${scored === 1 ? '' : 's'} and ${edge}, which makes it the straightforward pick.${thin}`
  }
  return `${winner.name} leads ${wins} to ${loses} on the ${scored} rankable spec${scored === 1 ? '' : 's'}${
    cheaper ? `, but ${cheaper.name} ${edge}` : ''
  }.${thin}`
}

/** Areas where each side leads, for the win summary strip. */
export function leadAreas(verdict: Verdict): { a: string[]; b: string[] } {
  const a: string[] = []
  const b: string[] = []
  for (const group of verdict.groups) {
    if (group.leader === 'a') a.push(group.label)
    if (group.leader === 'b') b.push(group.label)
  }
  return { a, b }
}

export function priceLabel(price: number, market: MarketId = 'us'): string {
  return formatMoney(price, market)
}
