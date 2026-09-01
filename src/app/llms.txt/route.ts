import { getCategories, getComparisons, getProducts } from '@/lib/data'
import { buildVerdict, verdictLine } from '@/lib/verdict'
import { compareHref, priceShort, productHref, subLabel } from '@/lib/nav'
import { absUrl } from '@/lib/site'

export const dynamic = 'force-static'

export async function GET() {
  const [products, comparisons, categories] = await Promise.all([
    getProducts(),
    getComparisons(),
    getCategories(),
  ])

  const byId = new Map(products.map((p) => [p.id, p]))

  // Group matchups by subcategory
  const matchupsBySub = new Map<string, typeof comparisons>()
  for (const c of comparisons) {
    const productA = byId.get(c.productA)
    const sub = productA?.subcategory ?? 'other'
    const list = matchupsBySub.get(sub) ?? []
    list.push(c)
    matchupsBySub.set(sub, list)
  }

  // Group products by subcategory
  const productsBySub = new Map<string, typeof products>()
  for (const p of products) {
    const sub = p.subcategory
    const list = productsBySub.get(sub) ?? []
    list.push(p)
    productsBySub.set(sub, list)
  }

  const lines: string[] = []
  lines.push('# Tiebreak')
  lines.push('')
  lines.push(
    'Head-to-head product comparisons scored directly from manufacturer-published specifications. Every matchup delivers a spec-by-spec breakdown, highlights critical differences, and provides a clear verdict for shoppers who have already narrowed their choice down to two.'
  )
  lines.push('')
  lines.push(
    'All figures and specifications are derived from official manufacturer datasheets. Differences are objectively calculated, and rankings reflect measurable specification advantages without subjective bias.'
  )
  lines.push('')
  lines.push('## Matchups')
  lines.push('')

  for (const [sub, comps] of matchupsBySub.entries()) {
    lines.push(`### ${subLabel(sub)}`)
    lines.push('')
    for (const c of comps) {
      const a = byId.get(c.productA)
      const b = byId.get(c.productB)
      const claim = a && b ? verdictLine(a, b, buildVerdict(a, b)) : c.description
      lines.push(`- [${c.productName}](${absUrl(compareHref(c))}): ${claim}`)
    }
    lines.push('')
  }

  lines.push('## Products')
  lines.push('')
  for (const [sub, prods] of productsBySub.entries()) {
    lines.push(`### ${subLabel(sub)}`)
    lines.push('')
    for (const p of prods) {
      lines.push(`- [${p.name}](${absUrl(productHref(p))}): ${priceShort(p)} · ${p.description}`)
    }
    lines.push('')
  }

  lines.push('## Categories')
  lines.push('')
  for (const cat of categories) {
    lines.push(`- [${cat.name}](${absUrl(`/category/${cat.id}/`)})`)
  }
  lines.push('')

  lines.push('## Machine-readable')
  lines.push('')
  lines.push(`- [Sitemap](${absUrl('/sitemap.xml')})`)
  lines.push('')

  const text = lines.join('\n')
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
