'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import type { ProductVisual } from '@/lib/product-image'
import { DERIVED_WIDTH_FOR_SIZE, derivedProductSrc } from '@/lib/product-image'
import { SIZES } from '@/components/ProductMark'
import { Monogram, type ProductImageSize, type ProductImageTone } from '@/components/Monogram'

/**
 * Product photo with derived-thumb preference and monogram fallback.
 * next/image is unoptimized (static export); thumbs are prebuilt at 80/160/320.
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
  const derivedWidth = DERIVED_WIDTH_FOR_SIZE[size]
  const candidates = useMemo(() => {
    const out: string[] = []
    for (const src of sources) {
      const derived = derivedProductSrc(src, derivedWidth)
      if (derived !== src) out.push(derived)
      out.push(src)
    }
    return out
  }, [sources, derivedWidth])

  if (failed >= candidates.length) {
    return <Monogram visual={visual} size={size} tone={tone} className={className} />
  }

  return (
    <Image
      src={candidates[failed]}
      alt=""
      width={spec.box}
      height={spec.box}
      sizes={`${spec.box}px`}
      priority={eager}
      fetchPriority={eager ? 'high' : 'auto'}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      unoptimized
      onError={() => setFailed((n) => n + 1)}
      className={`p-photo ${className}`}
      style={{ width: spec.box, height: spec.box, borderRadius: spec.radius }}
    />
  )
}
