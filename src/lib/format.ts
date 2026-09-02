import { SPEC_UNITS } from '@/data/spec-units'
import { MARKETS, type MarketId } from '@/lib/markets'
import { qty } from '@/lib/units'
import { CATALOG_AS_OF } from '@/lib/site'

export function formatCatalogDate(dateStr: string = CATALOG_AS_OF): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date)
}

export function displaySpec(spec: string, key: string, market: MarketId): string {
  if (market === 'us') return spec
  if (!SPEC_UNITS[key]) return spec
  const parsed = qty(spec, key)
  if (!parsed) return spec
  return formatQuantity(parsed.value, parsed.unit, market)
}

export function formatMoney(amount: number, market: MarketId): string {
  const info = MARKETS[market]
  return new Intl.NumberFormat(info.locale, {
    style: 'currency',
    currency: info.currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function listJoin(parts: string[], market: MarketId): string {
  if (parts.length <= 1) return parts.join('')
  return new Intl.ListFormat(MARKETS[market].locale, { style: 'long', type: 'conjunction' }).format(parts)
}

function trimNum(value: number, digits: number): string {
  const fixed = value.toFixed(digits)
  return fixed.replace(/\.?0+$/, '')
}

export function formatQuantity(value: number, canonicalUnit: string, market: MarketId): string {
  const us = MARKETS[market].unitSystem === 'us'
  switch (canonicalUnit) {
    case 'g':
      if (us) return `${trimNum(value / 453.59237, 1)} lb`
      return value >= 1000 ? `${trimNum(value / 1000, 2)} kg` : `${Math.round(value)} g`
    case 'mm':
      if (us) return `${trimNum(value / 25.4, 1)} in`
      return value >= 10 ? `${trimNum(value / 10, 1)} cm` : `${trimNum(value, 0)} mm`
    case 'm2':
      return us ? `${Math.round(value / 0.09290304)} sq ft` : `${trimNum(value, 1)} m²`
    case 'L':
      return us ? `${trimNum(value, 1)} L` : `${trimNum(value, 1)} L`
    case 'm3h':
      return us ? `${Math.round(value / 1.69901082)} CFM` : `${trimNum(value, 0)} m³/h`
    default:
      return String(value)
  }
}
