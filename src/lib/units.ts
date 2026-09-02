import { SPEC_UNITS } from '@/data/spec-units'

export type Quantity = { value: number; unit: string }

const NUMBER = String.raw`\d[\d,]*(?:\.\d+)?`

type UnitDef = { dimension: string; toCanonical: number; canonical: string }

const UNITS: Record<string, UnitDef> = {
  g: { dimension: 'mass', toCanonical: 1, canonical: 'g' },
  gram: { dimension: 'mass', toCanonical: 1, canonical: 'g' },
  kg: { dimension: 'mass', toCanonical: 1000, canonical: 'g' },
  lb: { dimension: 'mass', toCanonical: 453.59237, canonical: 'g' },
  lbs: { dimension: 'mass', toCanonical: 453.59237, canonical: 'g' },
  oz: { dimension: 'mass', toCanonical: 28.349523125, canonical: 'g' },
  mm: { dimension: 'length', toCanonical: 1, canonical: 'mm' },
  cm: { dimension: 'length', toCanonical: 10, canonical: 'mm' },
  m: { dimension: 'length', toCanonical: 1000, canonical: 'mm' },
  in: { dimension: 'length', toCanonical: 25.4, canonical: 'mm' },
  inch: { dimension: 'length', toCanonical: 25.4, canonical: 'mm' },
  inches: { dimension: 'length', toCanonical: 25.4, canonical: 'mm' },
  '"': { dimension: 'length', toCanonical: 25.4, canonical: 'mm' },
  m2: { dimension: 'area', toCanonical: 1, canonical: 'm2' },
  sqft: { dimension: 'area', toCanonical: 0.09290304, canonical: 'm2' },
  l: { dimension: 'volume', toCanonical: 1, canonical: 'L' },
  liter: { dimension: 'volume', toCanonical: 1, canonical: 'L' },
  litre: { dimension: 'volume', toCanonical: 1, canonical: 'L' },
  gal: { dimension: 'volume', toCanonical: 3.785411784, canonical: 'L' },
  m3h: { dimension: 'airflow', toCanonical: 1, canonical: 'm3h' },
  cfm: { dimension: 'airflow', toCanonical: 1.69901082, canonical: 'm3h' },
}

function toNumber(raw: string): number {
  return Number.parseFloat(raw.replace(/,/g, ''))
}

function foldUnit(raw: string): string {
  const compact = raw
    .toLowerCase()
    .replace(/²/g, '2')
    .replace(/³/g, '3')
    .replace(/\s+/g, '')
  if (compact === 'sqft' || compact === 'ft2' || compact === 'ft²') return 'sqft'
  if (compact === 'm²' || compact === 'm2') return 'm2'
  if (compact === 'm3/h' || compact === 'm³/h' || compact === 'm3h' || compact === 'cmh') return 'm3h'
  if (compact === 'lbs') return 'lb'
  return compact
}

const PAIR =
  /(?:(\d[\d,]*(?:\.\d+)?)\s*(lb|lbs|kg|g|oz|inches|inch|in|mm|cm|sq\s*ft|ft²|m²|m2|cfm|m³\/h|m3\/h|m3h|l|liters?|litres?|gal)\b)|(?:(\d[\d,]*(?:\.\d+)?)(?:\s*("|″)))/gi

function extractMeasurements(text: string): Quantity[] {
  const found: Quantity[] = []
  const re = new RegExp(PAIR.source, 'gi')
  let match: RegExpExecArray | null
  while ((match = re.exec(text))) {
    const rawNum = match[1] ?? match[3]
    const rawUnit = match[2] ?? match[4]
    if (!rawNum || !rawUnit) continue
    const value = toNumber(rawNum)
    if (!Number.isFinite(value)) continue
    found.push({ value, unit: foldUnit(rawUnit) })
  }
  return found
}

function firstNumber(text: string): number | null {
  const match = text.match(new RegExp(NUMBER))
  if (!match) return null
  const value = toNumber(match[0])
  return Number.isFinite(value) ? value : null
}

/**
 * Read a spec string as a canonical quantity for `key`. Dual-unit strings
 * ("4.7 lb (2.14 kg)") prefer the already-canonical unit when present.
 */
export function qty(spec: string, key: string): Quantity | null {
  if (!spec || spec.trim() === '' || spec.trim() === '—') return null
  const rule = SPEC_UNITS[key]
  const measurements = extractMeasurements(spec)

  if (!rule) {
    const numbered = firstNumber(spec)
    if (numbered === null) return null
    const unit = measurements[0]?.unit ?? ''
    return { value: numbered, unit }
  }

  const converted: Quantity[] = []
  for (const item of measurements) {
    const def = UNITS[item.unit]
    if (!def || def.dimension !== rule.dimension) continue
    converted.push({ value: item.value * def.toCanonical, unit: rule.canonical })
  }
  if (converted.length === 0) return null
  const alreadyCanonical = measurements.find((item) => {
    const def = UNITS[item.unit]
    return def?.dimension === rule.dimension && def.canonical === rule.canonical
  })
  if (alreadyCanonical) {
    const def = UNITS[alreadyCanonical.unit]
    return { value: alreadyCanonical.value * def.toCanonical, unit: rule.canonical }
  }
  return converted[0]
}

export const HEAVY_LAPTOP_G = 1814
export const HEAVY_VACUUM_G = 3175
export const HEAVY_PURIFIER_G = 11340
export const SMALL_COVERAGE_M2 = 92.903

export function qtyFixtures(): { name: string; ok: boolean; detail: string }[] {
  const laptopHeavy = qty('4.9 lb (2.2 kg)', 'weight')
  const laptopLight = qty('3.5 lb (1.6 kg)', 'weight')
  const laptopKg = qty('2.2 kg', 'weight')
  const coverageSq = qty('900 sq ft', 'coverage')
  const coverageM = qty('90 m²', 'coverage')
  return [
    {
      name: '4.9 lb (2.2 kg) trips heavy-laptop',
      ok: !!laptopHeavy && laptopHeavy.value > HEAVY_LAPTOP_G,
      detail: String(laptopHeavy?.value),
    },
    {
      name: '3.5 lb (1.6 kg) does not trip heavy-laptop',
      ok: !!laptopLight && laptopLight.value <= HEAVY_LAPTOP_G,
      detail: String(laptopLight?.value),
    },
    {
      name: '2.2 kg still trips heavy-laptop',
      ok: !!laptopKg && laptopKg.value > HEAVY_LAPTOP_G,
      detail: String(laptopKg?.value),
    },
    {
      name: '900 sq ft trips small-coverage',
      ok: !!coverageSq && coverageSq.value < SMALL_COVERAGE_M2,
      detail: String(coverageSq?.value),
    },
    {
      name: '90 m² trips small-coverage',
      ok: !!coverageM && coverageM.value < SMALL_COVERAGE_M2,
      detail: String(coverageM?.value),
    },
  ]
}
