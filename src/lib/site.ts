// TODO(owner): set NEXT_PUBLIC_SITE_URL to the real domain before deploying.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiebreak.app').replace(/\/$/, '')
export const SITE_NAME = 'Tiebreak'
export const absUrl = (path: string) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`

export function clip(text: string, max = 158): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…'
}
