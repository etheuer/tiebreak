import type { Product } from '@/lib/pricing'
import { toVisual } from '@/lib/product-image'
import manifest from '@/data/generated/product-images.json'
import { ProductPhoto } from '@/components/ProductPhoto'
import { Monogram, type ProductImageSize, type ProductImageTone } from '@/components/Monogram'

const LOCAL_IMAGES: Record<string, string> = manifest as Record<string, string>

/** Only local photos admitted by the image validation and visual review gate. */
export function photoSources(product: Product): string[] {
  const local = LOCAL_IMAGES[product.id]
  return local ? [local] : []
}

/**
 * Drop-in replacement for ProductMark with the same size/tone API.
 * Renders a real photo when one exists (local `public/images/products/` file
 * approved by the image gate), otherwise a branded monogram tile.
 * Plain <img> on purpose: the site is a static export, where Next's default
 * image optimizer is unsupported (see static-exports guide), and every photo
 * degrades to the monogram instead of a broken-image icon.
 *
 * Only five scalar identity fields cross the client boundary: the full
 * product (specs, market variants) stays server-side so regional spec
 * differences never leak into another market's page payload.
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
