/**
 * Product photo resolution.
 *
 * Real photos live in `public/images/products/<product-id>.<ext>` and are
 * registered by `scripts/generate-image-manifest.mjs` into
 * `src/data/generated/product-images.json`. Anything else falls back to a
 * branded monogram tile, never to a dead placeholder service.
 *
 * The catalog's `image_url` values all point at via.placeholder.com (long
 * dead), so they are treated as "no photo" on purpose: rendering them would
 * show broken images to shoppers. When a row gains a real manufacturer or
 * studio URL, `isRealImageUrl` lets it through automatically.
 */

const PLACEHOLDER_HOSTS = [
  'via.placeholder.com',
  'placehold.co',
  'placehold.it',
  'dummyimage.com',
  'placehold.jp',
  'example.com',
]

export function isPlaceholderUrl(url: string): boolean {
  const normalized = url.trim().toLowerCase()
  if (!normalized) return true
  if (normalized.startsWith('data:')) return false
  if (normalized.startsWith('/')) return false
  let host = ''
  try {
    host = new URL(normalized).hostname
  } catch {
    return true
  }
  return PLACEHOLDER_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))
}

export function isRealImageUrl(url: string | undefined | null): url is string {
  if (!url || !url.trim()) return false
  return !isPlaceholderUrl(url)
}

/**
 * Minimal product identity for the client-side photo boundary. The full
 * Product (specs, variants, sources) must never cross into client props:
 * it would serialize market variants into the page payload.
 */
export type ProductVisual = {
  id: string
  name: string
  brand: string
  subcategory: string
}

export function toVisual(product: {
  id: string
  name: string
  brand: string
  subcategory: string
}): ProductVisual {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    subcategory: product.subcategory,
  }
}

/** First 1-2 initials of the brand, e.g. "Samsung" -> "S", "Bose" -> "B". */
export function brandInitials(brand: string): string {
  const words = brand.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

/**
 * Deterministic hue per brand so every product from one maker shares a
 * recognizable tile color across cards, tables and compare pages.
 */
export function brandHue(brand: string): number {
  let hash = 0
  for (let i = 0; i < brand.length; i += 1) {
    hash = (hash * 31 + brand.charCodeAt(i)) >>> 0
  }
  return hash % 360
}
