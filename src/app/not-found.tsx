import type { Metadata } from 'next'
import { NotFoundBody } from '@/views/not-found'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return <NotFoundBody market="us" />
}
