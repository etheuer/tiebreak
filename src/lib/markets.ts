export type MarketId = 'us' | 'uk'

/** Phase-1 public launch is the US catalog only. UK routes stay in `src/app/_uk`. */
export const PUBLISHED_MARKETS: readonly MarketId[] = ['us']

export function isMarketPublished(market: MarketId): boolean {
  return PUBLISHED_MARKETS.includes(market)
}

export type Market = {
  id: MarketId
  locale: 'en-US' | 'en-GB'
  htmlLang: 'en' | 'en-GB'
  ogLocale: 'en_US' | 'en_GB'
  hreflang: 'en-US' | 'en-GB'
  currency: 'USD' | 'GBP'
  unitSystem: 'us' | 'metric'
  prefix: '' | '/uk'
  label: string
}

export const DEFAULT_MARKET: MarketId = 'us'

export const MARKETS: Record<MarketId, Market> = {
  us: {
    id: 'us',
    locale: 'en-US',
    htmlLang: 'en',
    ogLocale: 'en_US',
    hreflang: 'en-US',
    currency: 'USD',
    unitSystem: 'us',
    prefix: '',
    label: 'United States',
  },
  uk: {
    id: 'uk',
    locale: 'en-GB',
    htmlLang: 'en-GB',
    ogLocale: 'en_GB',
    hreflang: 'en-GB',
    currency: 'GBP',
    unitSystem: 'metric',
    prefix: '/uk',
    label: 'United Kingdom',
  },
}

/** Normalize to a trailing-slash path like the static export emits. */
export function normalizePath(path: string): string {
  if (!path || path === '/') return '/'
  const withLead = path.startsWith('/') ? path : `/${path}`
  return withLead.endsWith('/') ? withLead : `${withLead}/`
}

/** `path` is always the US path beginning with `/`. */
export function marketPath(market: MarketId, path: string): string {
  const us = normalizePath(path)
  if (market === 'us') return us
  return us === '/' ? '/uk/' : `/uk${us}`
}

/** Strip a `/uk/` prefix so the rest of the router can share one US path. */
export function usPathOf(pathname: string): string {
  const normalized = normalizePath(pathname)
  if (normalized === '/uk/') return '/'
  if (normalized.startsWith('/uk/')) return normalized.slice(3)
  return normalized
}

export function siblingMarket(market: MarketId): MarketId {
  return market === 'us' ? 'uk' : 'us'
}

export function marketFromPath(pathname: string): MarketId {
  const normalized = normalizePath(pathname)
  return normalized === '/uk/' || normalized.startsWith('/uk/') ? 'uk' : 'us'
}
