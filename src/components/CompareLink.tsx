'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { capture } from '@/lib/analytics'

type Props = ComponentProps<typeof Link> & {
  useCaseId?: string
}

export function CompareLink({ href, onClick, useCaseId, ...rest }: Props) {
  return (
    <Link
      href={href}
      onClick={(event) => {
        const path = typeof href === 'string' ? href.split('#')[0] : undefined
        const properties: Record<string, unknown> = { href: path }
        if (useCaseId) properties.use_case_id = useCaseId
        capture('compare_started', properties)
        onClick?.(event)
      }}
      {...rest}
    />
  )
}
