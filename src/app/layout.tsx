import type { Metadata } from 'next'
import { Archivo, JetBrains_Mono } from 'next/font/google'
import { AppShell } from '@/components/AppShell'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import { defaultOgImages } from '@/lib/seo'
import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - head to head product comparisons`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Put two products side by side and get an answer. Spec by spec comparisons for TVs, laptops, phones, headphones, vacuums, air purifiers and credit cards.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: `${SITE_NAME} - head to head product comparisons`,
    description:
      'Put two products side by side and get an answer. Spec by spec comparisons for TVs, laptops, phones, headphones, vacuums, air purifiers and credit cards.',
    type: 'website',
    siteName: SITE_NAME,
    url: '/',
    locale: 'en_US',
    images: defaultOgImages(),
  },
  twitter: {
    card: 'summary_large_image',
    images: defaultOgImages().map((image) => image.url),
  },
}

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${jetbrains.variable}`}>
      <head>
        {POSTHOG_KEY ? (
          <>
            <link rel="preconnect" href={POSTHOG_HOST} />
            <link rel="dns-prefetch" href={POSTHOG_HOST} />
          </>
        ) : null}
      </head>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <AppShell market="us">{children}</AppShell>
      </body>
    </html>
  )
}
