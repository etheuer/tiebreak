import type { Metadata } from 'next'
import { Archivo, JetBrains_Mono } from 'next/font/google'
import { getCategories, getComparisons, getProducts } from '@/lib/data'
import { buildJumpIndex } from '@/lib/nav'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [products, comparisons, categories] = await Promise.all([
    getProducts(),
    getComparisons(),
    getCategories(),
  ])

  const index = buildJumpIndex(products, comparisons, categories)
  const nav = [
    ...categories.map((category) => ({
      label: category.name,
      href: `/category/${category.id}/`,
    })),
    {
      label: 'Matchups',
      href: '/compare/',
    },
  ]

  const orgWebsiteSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#org`,
        name: 'Tiebreak',
        url: SITE_URL,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'Tiebreak',
        url: SITE_URL,
        publisher: {
          '@id': `${SITE_URL}/#org`,
        },
      },
    ],
  }

  return (
    <html lang="en" className={`${archivo.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgWebsiteSchema) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <SiteHeader index={index} nav={nav} />
        <main id="main">{children}</main>
        <SiteFooter categories={categories} comparisons={comparisons} products={products} />
      </body>
    </html>
  )
}
