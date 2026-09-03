'use client'

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react'
import { capture } from '@/lib/analytics'

function hostOf(url: string): string | undefined {
  try {
    return new URL(url).host
  } catch {
    return undefined
  }
}

function getMatchupSlug(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const match = window.location.pathname.match(/\/compare\/([^/]+)/)
  return match ? match[1] : undefined
}

export function OfficialSourceLink({
  href,
  productId,
  brand,
  matchupSlug,
  children,
  onClick,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  productId?: string
  brand?: string
  matchupSlug?: string
  children: ReactNode
}) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const slug = matchupSlug ?? getMatchupSlug()
    capture('product_outbound_clicked', {
      product_id: productId,
      url: href,
      destination_host: hostOf(href),
      brand: brand,
      matchup_slug: slug,
    })
    onClick?.(event)
  }

  return (
    <a {...rest} href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
      {children}
    </a>
  )
}
