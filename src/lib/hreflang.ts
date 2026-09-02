import type { Metadata } from 'next'
import { isMarketPublished, marketPath, MARKETS, type MarketId } from '@/lib/markets'

export function pageAlternates(
  usPath: string,
  market: MarketId,
  includeUk: boolean
): NonNullable<Metadata['alternates']> {
  const withUk = includeUk && isMarketPublished('uk')
  const canonical = marketPath(market, usPath)
  if (!withUk && market === 'uk') {
    return {
      canonical,
      languages: {
        'en-GB': canonical,
        'x-default': canonical,
      },
    }
  }
  const languages: Record<string, string> = {
    'en-US': marketPath('us', usPath),
    'x-default': marketPath('us', usPath),
  }
  if (withUk) languages['en-GB'] = marketPath('uk', usPath)
  return {
    canonical,
    languages,
  }
}

export function openGraphLocale(market: MarketId) {
  return MARKETS[market].ogLocale
}
