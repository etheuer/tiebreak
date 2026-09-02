'use client'

import { useState } from 'react'
import { brandHue, brandInitials, type ProductVisual } from '@/lib/product-image'
import { Glyph, SIZES, type ProductMarkSize } from '@/components/ProductMark'

export type ProductImageSize = ProductMarkSize
export type ProductImageTone = 'a' | 'b' | 'neutral'

export function Monogram({
  visual,
  size = 'sm',
  tone = 'neutral',
  className = '',
}: {
  visual: ProductVisual
  size?: ProductImageSize
  tone?: ProductImageTone
  className?: string
}) {
  const spec = SIZES[size]
  const hue = brandHue(visual.brand)
  const initials = brandInitials(visual.brand)
  const showGlyph = size === 'md' || size === 'lg'
  return (
    <span
      className={`p-mark p-monogram ${className}`}
      role="img"
      aria-label={visual.name}
      title={visual.name}
      style={
        {
          width: spec.box,
          height: spec.box,
          borderRadius: spec.radius,
          '--mark-hue':
            tone === 'a' ? 'var(--accent)' : tone === 'b' ? 'var(--rival)' : 'var(--ink-3)',
          '--brand-hue': `${hue}`,
        } as React.CSSProperties
      }
    >
      <span aria-hidden className="p-initials" style={{ fontSize: Math.round(spec.box * 0.38) }}>
        {initials}
      </span>
      {showGlyph && (
        <span aria-hidden className="p-glyph">
          <Glyph subcategory={visual.subcategory} size={Math.round(spec.glyph * 0.62)} />
        </span>
      )}
    </span>
  )
}

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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[failed]}
      alt={visual.name}
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
