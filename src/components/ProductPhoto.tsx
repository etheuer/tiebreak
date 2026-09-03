'use client'

import { useState } from 'react'
import type { ProductVisual } from '@/lib/product-image'
import { SIZES } from '@/components/ProductMark'
import { Monogram, type ProductImageSize, type ProductImageTone } from '@/components/Monogram'

/**
 * A product photo that steps through its candidate sources on error and lands
 * on the monogram when none load. Only rendered when at least one source
 * exists, so pages with no photos stay fully server-rendered.
 *
 * Callers must key this on `sources` (ProductImage does) so a recycled instance
 * cannot inherit the previous product's failure count.
 */
export function ProductPhoto({
  visual,
  sources,
  size,
  tone,
  className,
  eager,
}: {
  visual: ProductVisual
  sources: string[]
  size: ProductImageSize
  tone: ProductImageTone
  className: string
  eager: boolean
}) {
  const [failed, setFailed] = useState(0)
  const spec = SIZES[size]
  if (failed >= sources.length) {
    return <Monogram visual={visual} size={size} tone={tone} className={className} />
  }
  return (
    // Plain <img> is deliberate: static export has no Next image optimizer.
    // Decorative: the product name always sits beside the tile as a link or heading.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[failed]}
      alt=""
      width={spec.box}
      height={spec.box}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onError={() => setFailed((n) => n + 1)}
      className={`p-photo ${className}`}
      style={{ width: spec.box, height: spec.box, borderRadius: spec.radius }}
    />
  )
}
