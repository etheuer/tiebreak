import { notFound } from 'next/navigation'
import { getComparisonBySlug, getProductById, inMarket } from '@/lib/data'
import { generateStaticParamsForMarket } from '@/views/compare-matchup'
import { buildCompareMarkdown } from '@/lib/llms'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return generateStaticParamsForMarket('us')
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const comparison = await getComparisonBySlug(slug, 'us')
  if (!comparison) notFound()

  const [productA, productB] = await Promise.all([
    getProductById(comparison.productA, 'us'),
    getProductById(comparison.productB, 'us'),
  ])

  if (!productA || !productB || !inMarket(productA, 'us') || !inMarket(productB, 'us')) {
    notFound()
  }

  const markdown = buildCompareMarkdown(comparison, productA, productB, 'us')
  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  })
}
