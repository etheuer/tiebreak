// Production canonical host. Override with NEXT_PUBLIC_SITE_URL when needed.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://clinchmark.com').replace(/\/$/, '')
export const SITE_NAME = 'Clinchmark'
export const SITE_EMAIL = (process.env.NEXT_PUBLIC_SITE_EMAIL ?? '').trim()
export const GITHUB_REPO = 'https://github.com/etheuer/tiebreak'
export const CATALOG_AS_OF = '2026-09-01'
export const LEGAL_UPDATED = 'September 6, 2026'
export const absUrl = (path: string) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`

export function clip(text: string, max = 158): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…'
}
