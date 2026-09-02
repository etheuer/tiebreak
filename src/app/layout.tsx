import type { Metadata } from 'next'
import { Archivo, JetBrains_Mono } from 'next/font/google'
import { AppShell } from '@/components/AppShell'
import { SITE_NAME, SITE_URL } from '@/lib/site'
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
    'Put two products side by side and get an answer. Spec by spec comparisons for TVs, laptops, phones, headphones, vacuums, air purifiers and credit cards.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Tiebreak - head to head product comparisons',
    description:
      'Put two products side by side and get an answer. Spec by spec comparisons for TVs, laptops, phones, headphones, vacuums, air purifiers and credit cards.',
    type: 'website',
    siteName: SITE_NAME,
    url: '/',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <AppShell market="us">{children}</AppShell>
      </body>
    </html>
  )
}
