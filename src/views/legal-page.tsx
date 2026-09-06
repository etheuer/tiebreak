import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { LEGAL_UPDATED, SITE_NAME } from '@/lib/site'
import { defaultOgImages } from '@/lib/seo'

export function legalMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: 'website',
      siteName: SITE_NAME,
      images: defaultOgImages(),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: defaultOgImages().map((image) => image.url),
    },
  }
}

export function LegalPage({
  eyebrow = 'Legal',
  title,
  children,
}: {
  eyebrow?: string
  title: string
  children: ReactNode
}) {
  return (
    <article className="shell max-w-2xl py-12">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="display mt-2 text-h1">{title}</h1>
      <p className="mt-2 text-meta text-ink-3">Last updated {LEGAL_UPDATED}</p>
      <div className="mt-8 grid gap-5 text-body leading-relaxed text-ink-2">{children}</div>
    </article>
  )
}
