import type { Product } from '@/lib/pricing'
import { isRealImageUrl, toVisual } from '@/lib/product-image'
import manifest from '@/data/generated/product-images.json'
import { ProductPhoto } from '@/components/ProductPhoto'
import { Monogram, type ProductImageSize, type ProductImageTone } from '@/components/Monogram'

const LOCAL_IMAGES: Record<string, string> = manifest as Record<string, string>

/** Local studio photos first, then a real remote URL when the row has one. */
export function photoSources(product: Product): string[] {
  const sources: string[] = []
  const local = LOCAL_IMAGES[product.id]
  if (local) sources.push(local)
  if (isRealImageUrl(product.image_url)) sources.push(product.image_url)
  return sources
}

/**
 * Drop-in replacement for ProductMark with the same size/tone API.
 * Renders a real photo when one exists, otherwise a branded monogram tile.
 * Uses next/image with unoptimized (static export) and prebuilt derived thumbs.
 */
export function ProductImage({
  product,
  size = 'sm',
  tone = 'neutral',
  className = '',
  eager = false,
}: {
  product: Product
  size?: ProductImageSize
  tone?: ProductImageTone
  className?: string
  eager?: boolean
}) {
  const visual = toVisual(product)
  const sources = photoSources(product)
  if (sources.length === 0) {
    return <Monogram visual={visual} size={size} tone={tone} className={className} />
  }
  return (
    <ProductPhoto
      key={sources.join('|')}
      visual={visual}
      sources={sources}
      size={size}
      tone={tone}
      className={className}
      eager={eager}
    />
  )
}
