import { brandHue, brandInitials, type ProductVisual } from '@/lib/product-image'
import { Glyph, SIZES, type ProductMarkSize } from '@/components/ProductMark'

export type ProductImageSize = ProductMarkSize
export type ProductImageTone = 'a' | 'b' | 'neutral'

/**
 * Branded fallback tile for a product with no usable photo.
 *
 * Deliberately server-rendered: no hooks, no handlers, and no 'use client'.
 * Every product without a photo renders one of these, so keeping it out of the
 * client module means listing pages ship static markup instead of hydrating a
 * component per tile.
 *
 * Decorative by design — every call site places the product name next to it as
 * a heading or link, so announcing the tile would repeat that name.
 */
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
      aria-hidden
      className={`p-mark p-monogram ${className}`}
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
      <span className="p-initials" style={{ fontSize: Math.round(spec.box * 0.38) }}>
        {initials}
      </span>
      {showGlyph && (
        <span className="p-glyph">
          <Glyph subcategory={visual.subcategory} size={Math.round(spec.glyph * 0.62)} />
        </span>
      )}
    </span>
  )
}
