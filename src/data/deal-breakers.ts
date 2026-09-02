import type { Subcategory } from './spec-catalog'
import { isSubcategory } from './spec-catalog'
import { SPEC_UNITS } from './spec-units'
import {
  HEAVY_LAPTOP_G,
  HEAVY_PURIFIER_G,
  HEAVY_VACUUM_G,
  qty,
  SMALL_COVERAGE_M2,
} from '@/lib/units'

/**
 * A deal-breaker is one spec fact that makes a shopper drop a product on the
 * spot, whatever the win count says. Every rule reads a single spec string and
 * answers "does this trip?"; null means the sheet does not say.
 */
export type DealBreakerRule = {
  id: string
  /** Spec key the rule reads, so the UI can link to the row. */
  key: string
  /** Short, in the shopper's words: "No Dolby Vision". */
  label: string
  /** The consequence, one line. */
  why: string
  trips: (value: string, key: string) => boolean | null
}

const NUMBER = /\d[\d,]*(?:\.\d+)?/g

function numbers(value: string): number[] {
  return (value.match(NUMBER) ?? [])
    .map((raw) => Number.parseFloat(raw.replace(/,/g, '')))
    .filter((n) => Number.isFinite(n))
}

type Test = (value: string, key: string) => boolean | null

/** Wraps a test so an empty or missing spec reads as unknown, never as a trip. */
function known(test: (value: string, key: string) => boolean): Test {
  return (value, key) => (!value || value.trim() === '' || value.trim() === '—' ? null : test(value, key))
}

function magnitudes(value: string, key: string): number[] {
  if (SPEC_UNITS[key]) {
    const parsed = qty(value, key)
    return parsed ? [parsed.value] : []
  }
  return numbers(value)
}

const isNo = known((value) => /^\s*no\b/i.test(value))
const has = (pattern: RegExp) => known((value) => pattern.test(value))
const lacks = (pattern: RegExp) => known((value) => !pattern.test(value))
const firstBelow = (limit: number) =>
  known((value, key) => {
    const [first] = magnitudes(value, key)
    return first !== undefined && first < limit
  })
const firstAbove = (limit: number) =>
  known((value, key) => {
    const [first] = magnitudes(value, key)
    return first !== undefined && first > limit
  })
const firstAtLeast = (limit: number) =>
  known((value, key) => {
    const [first] = magnitudes(value, key)
    return first !== undefined && first >= limit
  })
const maxAbove = (limit: number) =>
  known((value, key) => {
    const all = magnitudes(value, key)
    return all.length > 0 && Math.max(...all) > limit
  })
const maxBelow = (limit: number) =>
  known((value, key) => {
    const all = magnitudes(value, key)
    return all.length > 0 && Math.max(...all) < limit
  })

export const DEAL_BREAKERS: Record<Subcategory, DealBreakerRule[]> = {
  tvs: [
    {
      id: 'no-dolby-vision',
      key: 'hdr_formats',
      label: 'No Dolby Vision',
      why: 'Netflix, Disney+ and Apple TV+ HDR fall back to plain HDR10 on this set.',
      trips: lacks(/dolby vision/i),
    },
    {
      id: 'two-hdmi-2-1',
      key: 'hdmi_2_1_ports',
      label: 'Only two HDMI 2.1 ports',
      why: 'A PS5, an Xbox and a 4K120 PC cannot all connect at full bandwidth, and one port doubles as eARC.',
      trips: firstBelow(4),
    },
    {
      id: 'burn-in',
      key: 'burn_in_risk',
      label: 'Burn-in risk',
      why: 'Static news tickers, game HUDs and desktop use can leave permanent marks over the years.',
      trips: has(/^\s*yes\b/i),
    },
    {
      id: 'glossy-screen',
      key: 'screen_finish',
      label: 'Glossy screen, no anti-reflective coating',
      why: 'Lamps and windows reflect in a bright room.',
      trips: known((value) => /glossy/i.test(value) && !/anti-reflect|anti-glare|matte/i.test(value)),
    },
  ],
  laptops: [
    {
      id: 'no-touchscreen',
      key: 'touchscreen',
      label: 'No touchscreen',
      why: 'No pen or touch input for marking up PDFs or sketching.',
      trips: isNo,
    },
    {
      id: 'ram-soldered',
      key: 'ram_upgradable',
      label: 'RAM cannot be upgraded',
      why: 'The memory you buy today is the memory you keep.',
      trips: isNo,
    },
    {
      id: 'no-hdmi',
      key: 'hdmi',
      label: 'No HDMI port',
      why: 'Projectors and meeting-room TVs need a dongle.',
      trips: isNo,
    },
    {
      id: 'macos-only',
      key: 'os',
      label: 'macOS, not Windows',
      why: 'Windows-only software such as some CAD, games and corporate VPN clients needs a workaround.',
      trips: has(/macos/i),
    },
    {
      id: 'windows-on-arm',
      key: 'os',
      label: 'Windows on ARM',
      why: 'Some x86 apps, drivers and anti-cheat games do not run or run emulated.',
      trips: has(/on arm/i),
    },
    {
      id: 'heavy-laptop',
      key: 'weight',
      label: 'Over 4 lb (1.8 kg)',
      why: 'Heavy in a backpack on a daily commute.',
      trips: firstAbove(HEAVY_LAPTOP_G),
    },
    {
      id: 'sixty-hz-laptop',
      key: 'refresh_rate',
      label: '60 Hz display',
      why: 'Scrolling and games look less smooth than on a 120 Hz panel.',
      trips: firstBelow(90),
    },
  ],
  smartphones: [
    {
      id: 'no-stylus',
      key: 'stylus',
      label: 'No stylus',
      why: 'No pen input for handwritten notes or markup.',
      trips: isNo,
    },
    {
      id: 'no-headphone-jack',
      key: 'headphone_jack',
      label: 'No headphone jack',
      why: 'Wired headphones need a USB-C dongle.',
      trips: isNo,
    },
    {
      id: 'no-charger',
      key: 'charger_in_box',
      label: 'No charger in the box',
      why: 'Budget another $20 to $40 for a fast charger.',
      trips: isNo,
    },
    {
      id: 'sixty-hz-phone',
      key: 'refresh_rate',
      label: '60 Hz screen',
      why: 'Scrolling looks noticeably less smooth than a 120 Hz rival.',
      trips: maxBelow(90),
    },
    {
      id: 'short-updates',
      key: 'os_updates',
      label: 'Under 5 years of OS updates',
      why: 'Security patches stop sooner and resale value falls faster.',
      trips: firstBelow(5),
    },
    {
      id: 'not-ip68',
      key: 'ip_rating',
      label: 'Not IP68',
      why: 'Less dust and water protection than an IP68 rival.',
      trips: lacks(/ip68/i),
    },
    {
      id: 'no-microsd',
      key: 'expandable_storage',
      label: 'No microSD slot',
      why: 'Storage is fixed at what you buy.',
      trips: isNo,
    },
  ],
  'cordless-vacuums': [
    {
      id: 'heavy-vacuum',
      key: 'weight',
      label: 'Over 7 lb (3.2 kg)',
      why: 'Tiring on stairs and above shoulder height.',
      trips: firstAbove(HEAVY_VACUUM_G),
    },
    {
      id: 'short-runtime',
      key: 'max_runtime',
      label: 'Under 50 minutes of runtime',
      why: 'A larger home needs a mid-clean recharge.',
      trips: firstBelow(50),
    },
    {
      id: 'no-self-empty',
      key: 'docking_station',
      label: 'No self-emptying dock',
      why: 'You empty the bin by hand after every clean.',
      trips: lacks(/auto|automatic|clean station|tower|empty|disposal/i),
    },
    {
      id: 'short-warranty-vacuum',
      key: 'warranty',
      label: 'Warranty under 3 years',
      why: 'Battery packs often fade around year three.',
      trips: firstBelow(3),
    },
  ],
  headphones: [
    {
      id: 'not-foldable',
      key: 'foldable',
      label: 'Does not fold',
      why: 'Takes a bigger slot in a carry-on.',
      trips: isNo,
    },
    {
      id: 'no-hires-codec',
      key: 'codec',
      label: 'No LDAC or aptX',
      why: 'Android phones stream at standard AAC or SBC quality.',
      trips: lacks(/ldac|aptx/i),
    },
    {
      id: 'heavy-headphones',
      key: 'weight',
      label: 'Over 300 g',
      why: 'Neck fatigue on a long flight.',
      trips: firstAbove(300),
    },
    {
      id: 'short-battery',
      key: 'battery',
      label: 'Under 24 hours of battery',
      why: 'A long-haul day needs a top-up.',
      trips: firstBelow(24),
    },
    {
      id: 'no-ip-rating',
      key: 'ip',
      label: 'No IP rating',
      why: 'No official protection against sweat or rain.',
      trips: has(/no official|^\s*no\b|none/i),
    },
  ],
  'air-purifiers': [
    {
      id: 'no-app',
      key: 'smart',
      label: 'No Wi-Fi app',
      why: 'No schedules or remote control from your phone.',
      trips: has(/no wi-?fi|no app/i),
    },
    {
      id: 'loud-on-high',
      key: 'noise',
      label: 'Over 55 dB on high',
      why: 'Louder than normal conversation at full speed.',
      trips: maxAbove(55),
    },
    {
      id: 'small-coverage',
      key: 'coverage',
      label: 'Under 1,000 sq ft coverage',
      why: 'Undersized for an open-plan living area.',
      trips: maxBelow(SMALL_COVERAGE_M2),
    },
    {
      id: 'heavy-purifier',
      key: 'weight',
      label: 'Over 25 lb (11 kg)',
      why: 'Hard to move between rooms.',
      trips: firstAbove(HEAVY_PURIFIER_G),
    },
  ],
  'credit-cards': [
    {
      id: 'annual-fee',
      key: 'annual_fee',
      label: 'Annual fee',
      why: 'You pay before a single reward is earned.',
      trips: firstAbove(0),
    },
    {
      id: 'foreign-fee',
      key: 'foreign_tx',
      label: 'Foreign transaction fee',
      why: 'Adds about 3% to every purchase abroad.',
      trips: known((value) => /\d/.test(value) && (numbers(value)[0] ?? 0) > 0),
    },
    {
      id: 'no-lounge',
      key: 'lounge',
      label: 'No airport lounge access',
      why: 'No free lounges; only matters if you fly often.',
      trips: isNo,
    },
    {
      id: 'excellent-credit',
      key: 'credit_needed',
      label: 'Needs excellent credit (720+)',
      why: 'Applications under 720 are usually declined.',
      trips: firstAtLeast(720),
    },
    {
      id: 'no-intro-apr',
      key: 'intro_offer',
      label: 'No 0% intro APR',
      why: 'Carrying a balance costs full interest from day one.',
      trips: has(/^\s*none\b|0 months/i),
    },
  ],
}

export function dealBreakersFor(subcategory: string): DealBreakerRule[] {
  return isSubcategory(subcategory) ? DEAL_BREAKERS[subcategory] : []
}
