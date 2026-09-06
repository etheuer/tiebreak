import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { MARKETS } from '@/lib/markets'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import { defaultOgImages } from '@/lib/seo'
import '../globals.css'

const uk = MARKETS.uk

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - head to head product comparisons`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Put two products side by side and get an answer. Spec by spec comparisons for TVs, laptops, phones and cordless vacuums.',
  alternates: {
    canonical: '/uk/',
  },
  openGraph: {
    title: `${SITE_NAME} - head to head product comparisons`,
    description:
      'Put two products side by side and get an answer. Spec by spec comparisons for TVs, laptops, phones and cordless vacuums.',
    type: 'website',
    siteName: SITE_NAME,
    url: '/uk/',
    locale: uk.ogLocale,
    images: defaultOgImages(),
  },
  twitter: {
    card: 'summary_large_image',
    images: defaultOgImages().map((image) => image.url),
  },
}

export default function UkLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell market="uk">{children}</AppShell>
}
