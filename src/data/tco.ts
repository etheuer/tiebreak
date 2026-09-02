import type { Product } from '@/lib/data'
import { priceOf } from '@/lib/pricing'
import type { MarketId } from '@/lib/markets'
import { formatMoney } from '@/lib/format'

export type TcoDetail = {
  annualRecurring: number
  recurringLabel: string
  cadence: string
  accessoriesCost: number
  accessoriesLabel?: string
  notes?: string
}

export type TcoResult = {
  basePrice: number
  annualRecurring: number
  recurringLabel: string
  cadence: string
  totalRecurring3Yr: number
  accessoriesCost: number
  accessoriesLabel?: string
  total3Yr: number
  formattedBase: string
  formattedRecurring3Yr: string
  formattedAccessories: string
  formattedTotal3Yr: string
  notes?: string
}

export type TcoComparison = {
  a: TcoResult | null
  b: TcoResult | null
  savings3Yr: number
  cheaper3Yr: 'a' | 'b' | null
  cheaperUpfront: 'a' | 'b' | null
  hasReversal: boolean
  reversalSummary?: string
}

/**
 * Curated recurring consumables and essential accessories for products.
 * Recurring amounts are annualized in USD (or local equivalent).
 */
const TCO_REGISTRY: Record<string, TcoDetail> = {
  // Air Purifiers (Filters cost $25-$99/yr)
  'levoit-core-300s': {
    annualRecurring: 26,
    recurringLabel: 'Replacement filter',
    cadence: 'Every 6–8 months (~$26/yr)',
    accessoriesCost: 0,
  },
  'levoit-core-400s': {
    annualRecurring: 45,
    recurringLabel: 'H13 True HEPA filter',
    cadence: 'Every 12 months (~$45/yr)',
    accessoriesCost: 0,
  },
  'levoit-core-600s': {
    annualRecurring: 65,
    recurringLabel: 'High-capacity HEPA filter',
    cadence: 'Every 12 months (~$65/yr)',
    accessoriesCost: 0,
  },
  'coway-airmega-ap-1512hh': {
    annualRecurring: 30,
    recurringLabel: 'HEPA + 2x carbon pack',
    cadence: 'Annual filter pack (~$30/yr)',
    accessoriesCost: 0,
  },
  'coway-airmega-250': {
    annualRecurring: 55,
    recurringLabel: 'Max2 Green True HEPA filter',
    cadence: 'Every 12 months (~$55/yr)',
    accessoriesCost: 0,
  },
  'coway-airmega-400': {
    annualRecurring: 90,
    recurringLabel: 'Dual Max2 Filter Set',
    cadence: 'Every 12 months (~$90/yr set)',
    accessoriesCost: 0,
  },
  'blueair-blue-pure-311i-max': {
    annualRecurring: 35,
    recurringLabel: 'SmokeBlock combo filter',
    cadence: 'Every 6–9 months (~$35/yr)',
    accessoriesCost: 0,
  },
  'blueair-blue-pure-211-plus-auto': {
    annualRecurring: 45,
    recurringLabel: 'Foldable Particle+Carbon filter',
    cadence: 'Every 6 months (~$45/yr)',
    accessoriesCost: 0,
  },
  'blueair-protect-7470i': {
    annualRecurring: 80,
    recurringLabel: 'SmartFilter RFID dual-layer',
    cadence: 'Every 12 months (~$80/yr)',
    accessoriesCost: 0,
  },
  'winix-5500-2': {
    annualRecurring: 45,
    recurringLabel: 'Washable AOC + True HEPA',
    cadence: 'Every 12 months (~$45/yr)',
    accessoriesCost: 0,
  },
  'aleno-breathe-smart-75i': {
    annualRecurring: 99,
    recurringLabel: 'B6-Pure heavy HEPA filter',
    cadence: 'Every 12–15 months (~$99/yr)',
    accessoriesCost: 0,
  },
  'honeywell-hpa300': {
    annualRecurring: 65,
    recurringLabel: '3x HRF-R3 HEPA + 4x Pre-filters',
    cadence: 'Annual full filter set (~$65/yr)',
    accessoriesCost: 0,
  },
  'dyson-purifier-hot-cool-hp09': {
    annualRecurring: 80,
    recurringLabel: '360° Combi Glass HEPA + Carbon',
    cadence: 'Every 12 months (~$80/yr)',
    accessoriesCost: 0,
  },

  // Cordless Vacuums (Bags, battery depreciation, replacement filters)
  'dyson-v8-absolute': {
    annualRecurring: 15,
    recurringLabel: 'Washable post-motor filter replacement',
    cadence: 'Every 24 months (~$15/yr avg)',
    accessoriesCost: 0,
  },
  'dyson-v12-detect-slim': {
    annualRecurring: 18,
    recurringLabel: 'HEPA filter replacement',
    cadence: 'Every 24 months (~$18/yr avg)',
    accessoriesCost: 0,
  },
  'dyson-v15-detect': {
    annualRecurring: 20,
    recurringLabel: 'Whole-machine HEPA filter replacement',
    cadence: 'Every 24 months (~$20/yr avg)',
    accessoriesCost: 0,
  },
  'dyson-gen5detect': {
    annualRecurring: 25,
    recurringLabel: '0.1-micron HEPA filter replacement',
    cadence: 'Every 24 months (~$25/yr avg)',
    accessoriesCost: 0,
  },
  'dyson-v15s-detect-submarine': {
    annualRecurring: 35,
    recurringLabel: 'Submarine roller replacement + HEPA',
    cadence: 'Roller & filter annual upkeep (~$35/yr)',
    accessoriesCost: 0,
  },
  'shark-stratos': {
    annualRecurring: 25,
    recurringLabel: 'Anti-odor cartridges & foam filters',
    cadence: 'Odor cartridges every 6 mo (~$25/yr)',
    accessoriesCost: 0,
  },
  'shark-powerdetect-cordless': {
    annualRecurring: 25,
    recurringLabel: 'Odor neutralizer + HEPA filter',
    cadence: 'Cartridges every 6 mo (~$25/yr)',
    accessoriesCost: 0,
  },
  'shark-pet-cordless': {
    annualRecurring: 15,
    recurringLabel: 'Foam & felt filter kit',
    cadence: 'Annual replacement (~$15/yr)',
    accessoriesCost: 0,
  },
  'shark-cordless-pro': {
    annualRecurring: 20,
    recurringLabel: 'Filter & odor neutralizer upkeep',
    cadence: 'Annual replacement (~$20/yr)',
    accessoriesCost: 0,
  },
  'samsung-bespoke-jet-ai': {
    annualRecurring: 45,
    recurringLabel: 'Clean Station disposal bags & micro-filters',
    cadence: '5x dust bags/yr (~$45/yr)',
    accessoriesCost: 0,
  },
  'dreame-z10-station': {
    annualRecurring: 35,
    recurringLabel: 'Auto-empty dust bags & filters',
    cadence: '6x dust bags/yr (~$35/yr)',
    accessoriesCost: 0,
  },
  'lg-cordzero-all-in-one': {
    annualRecurring: 40,
    recurringLabel: 'Auto-empty tower disposal bags',
    cadence: '5x dust bags/yr (~$40/yr)',
    accessoriesCost: 0,
  },
  'tineco-pure-one-s15': {
    annualRecurring: 22,
    recurringLabel: 'Pre-filter & HEPA filter set',
    cadence: 'Annual replacement (~$22/yr)',
    accessoriesCost: 0,
  },
  'tineco-floor-one-s7-pro': {
    annualRecurring: 50,
    recurringLabel: 'Cleaning solution & replacement brush rollers',
    cadence: 'Deodorizing fluid + 2 rollers/yr (~$50/yr)',
    accessoriesCost: 0,
  },

  // TVs (Gallery models omit tabletop stands)
  'lg-g3-oled': {
    annualRecurring: 0,
    recurringLabel: 'No recurring consumables',
    cadence: 'None',
    accessoriesCost: 149,
    accessoriesLabel: 'Optional tabletop stand (wall mount only in box)',
    notes: 'Comes with slim wall bracket; official swivel stand sold separately.',
  },
  'lg-g4-oled': {
    annualRecurring: 0,
    recurringLabel: 'No recurring consumables',
    cadence: 'None',
    accessoriesCost: 149,
    accessoriesLabel: 'Optional tabletop stand (wall mount only in box for 65"+)',
    notes: 'Comes with slim wall bracket; official stand sold separately.',
  },

  // Smartphones (Charger omitted from box)
  'iphone-16-pro': {
    annualRecurring: 0,
    recurringLabel: 'No recurring consumables',
    cadence: 'None',
    accessoriesCost: 29,
    accessoriesLabel: '30W USB-C fast charging brick (no charger in box)',
  },
  'iphone-16-pro-max': {
    annualRecurring: 0,
    recurringLabel: 'No recurring consumables',
    cadence: 'None',
    accessoriesCost: 29,
    accessoriesLabel: '30W USB-C fast charging brick (no charger in box)',
  },
  'iphone-16': {
    annualRecurring: 0,
    recurringLabel: 'No recurring consumables',
    cadence: 'None',
    accessoriesCost: 29,
    accessoriesLabel: '20W USB-C charging brick (no charger in box)',
  },
  'iphone-16-plus': {
    annualRecurring: 0,
    recurringLabel: 'No recurring consumables',
    cadence: 'None',
    accessoriesCost: 29,
    accessoriesLabel: '20W USB-C charging brick (no charger in box)',
  },
  'galaxy-s24-ultra': {
    annualRecurring: 0,
    recurringLabel: 'No recurring consumables',
    cadence: 'None',
    accessoriesCost: 35,
    accessoriesLabel: '45W Super Fast Charging 2.0 brick (no charger in box)',
  },
  'samsung-galaxy-s24': {
    annualRecurring: 0,
    recurringLabel: 'No recurring consumables',
    cadence: 'None',
    accessoriesCost: 25,
    accessoriesLabel: '25W USB-C charging brick (no charger in box)',
  },
  'google-pixel-9-pro': {
    annualRecurring: 0,
    recurringLabel: 'No recurring consumables',
    cadence: 'None',
    accessoriesCost: 30,
    accessoriesLabel: '45W USB-C PPS charging brick (no charger in box)',
  },
  'google-pixel-9': {
    annualRecurring: 0,
    recurringLabel: 'No recurring consumables',
    cadence: 'None',
    accessoriesCost: 30,
    accessoriesLabel: '45W USB-C PPS charging brick (no charger in box)',
  },

  // Laptops (Dongles needed if ports omitted)
  'dell-xps-13-9340': {
    annualRecurring: 0,
    recurringLabel: 'No recurring consumables',
    cadence: 'None',
    accessoriesCost: 35,
    accessoriesLabel: 'USB-C multiport adapter (only 2x Thunderbolt ports, no headphone jack)',
  },
  'dell-xps-14-9440': {
    annualRecurring: 0,
    recurringLabel: 'No recurring consumables',
    cadence: 'None',
    accessoriesCost: 30,
    accessoriesLabel: 'USB-A / HDMI adapter dongle',
  },
  'apple-macbook-air-13': {
    annualRecurring: 0,
    recurringLabel: 'No recurring consumables',
    cadence: 'None',
    accessoriesCost: 25,
    accessoriesLabel: 'USB-C to HDMI/USB-A adapter',
  },
}

export function getProductTco(product: Product, market: MarketId = 'us'): TcoResult | null {
  const priceObj = priceOf(product, market)
  if (!priceObj) return null

  // Special handling for credit cards: annual fee is the recurring cost!
  if (product.subcategory === 'credit-cards') {
    const annualFee = priceObj.amount
    const total3Yr = annualFee * 3
    return {
      basePrice: 0,
      annualRecurring: annualFee,
      recurringLabel: 'Annual card membership fee',
      cadence: annualFee > 0 ? `${formatMoney(annualFee, market)} billed annually` : '$0 annual fee',
      totalRecurring3Yr: total3Yr,
      accessoriesCost: 0,
      total3Yr,
      formattedBase: formatMoney(0, market),
      formattedRecurring3Yr: formatMoney(total3Yr, market),
      formattedAccessories: formatMoney(0, market),
      formattedTotal3Yr: formatMoney(total3Yr, market),
      notes: annualFee > 0 ? `Cost over 3 years in annual fees before rewards or statement credits.` : 'Zero annual fee card.',
    }
  }

  const detail = TCO_REGISTRY[product.id]
  const basePrice = priceObj.amount
  const annualRecurring = detail?.annualRecurring ?? 0
  const totalRecurring3Yr = annualRecurring * 3
  const accessoriesCost = detail?.accessoriesCost ?? 0
  const total3Yr = basePrice + totalRecurring3Yr + accessoriesCost

  return {
    basePrice,
    annualRecurring,
    recurringLabel: detail?.recurringLabel ?? 'No recurring consumables',
    cadence: detail?.cadence ?? 'None',
    totalRecurring3Yr,
    accessoriesCost,
    accessoriesLabel: detail?.accessoriesLabel,
    total3Yr,
    formattedBase: formatMoney(basePrice, market),
    formattedRecurring3Yr: formatMoney(totalRecurring3Yr, market),
    formattedAccessories: formatMoney(accessoriesCost, market),
    formattedTotal3Yr: formatMoney(total3Yr, market),
    notes: detail?.notes,
  }
}

export function compareTco(productA: Product, productB: Product, market: MarketId = 'us'): TcoComparison {
  const a = getProductTco(productA, market)
  const b = getProductTco(productB, market)

  if (!a || !b) {
    return {
      a,
      b,
      savings3Yr: 0,
      cheaper3Yr: null,
      cheaperUpfront: null,
      hasReversal: false,
    }
  }

  const upfrontDiff = a.basePrice - b.basePrice
  const cheaperUpfront = upfrontDiff === 0 ? null : upfrontDiff < 0 ? 'a' : 'b'

  const tcoDiff = a.total3Yr - b.total3Yr
  const cheaper3Yr = tcoDiff === 0 ? null : tcoDiff < 0 ? 'a' : 'b'
  const savings3Yr = Math.abs(tcoDiff)

  // Reversal: Cheaper upfront, but more expensive over 3 years
  const hasReversal = cheaperUpfront !== null && cheaper3Yr !== null && cheaperUpfront !== cheaper3Yr

  let reversalSummary: string | undefined
  if (hasReversal) {
    const upfrontWinner = cheaperUpfront === 'a' ? productA.brand : productB.brand
    const tcoWinner = cheaper3Yr === 'a' ? productA.brand : productB.brand
    reversalSummary = `While the ${upfrontWinner} is cheaper upfront, the ${tcoWinner} saves ${formatMoney(savings3Yr, market)} over 3 years due to lower consumable & maintenance costs.`
  }

  return {
    a,
    b,
    savings3Yr,
    cheaper3Yr,
    cheaperUpfront,
    hasReversal,
    reversalSummary,
  }
}
