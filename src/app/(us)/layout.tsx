import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import '../globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Tiebreak - head to head product comparisons',
    template: '%s | Tiebreak',
  },
  description:
    'Put two products side by side and get an answer. Spec by spec comparisons for TVs, laptops, phones and cordless vacuums.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Tiebreak - head to head product comparisons',
    description:
      'Put two products side by side and get an answer. Spec by spec comparisons for TVs, laptops, phones and cordless vacuums.',
    type: 'website',
    siteName: SITE_NAME,
    url: '/',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
  },
}

export default function UsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell market="us">{children}</AppShell>
}
