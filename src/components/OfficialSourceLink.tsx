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

export function OfficialSourceLink({
  href,
  productId,
  children,
  onClick,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  productId?: string
  children: ReactNode
}) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    capture('product_outbound_clicked', {
      product_id: productId,
      url: href,
      destination_host: hostOf(href),
    })
    onClick?.(event)
  }

  return (
    <a {...rest} href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
      {children}
    </a>
  )
}
