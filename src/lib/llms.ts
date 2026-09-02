import { getCategories, getComparisons, getProducts } from '@/lib/data'
import { buildVerdict, verdictLine } from '@/lib/verdict'
import { categoryHref, compareHref, priceShort, productHref, subLabel } from '@/lib/nav'
import { absUrl, SITE_NAME } from '@/lib/site'
import type { MarketId } from '@/lib/markets'

export async function buildLlmsText(market: MarketId): Promise<string> {
  const [products, comparisons, categories] = await Promise.all([
    getProducts(market),
    getComparisons(market),
    getCategories(market),
  ])

  const byId = new Map(products.map((p) => [p.id, p]))

  const matchupsBySub = new Map<string, typeof comparisons>()
  for (const c of comparisons) {
    const productA = byId.get(c.productA)
    const sub = productA?.subcategory ?? 'other'
    const list = matchupsBySub.get(sub) ?? []
    list.push(c)
    matchupsBySub.set(sub, list)
  }

  const productsBySub = new Map<string, typeof products>()
  for (const p of products) {
    const list = productsBySub.get(p.subcategory) ?? []
    list.push(p)
    productsBySub.set(p.subcategory, list)
  }

  const lines: string[] = []
  lines.push(`# ${SITE_NAME}`)
  lines.push('')
  lines.push(
    market === 'uk'
      ? 'UK English edition. Head-to-head product comparisons scored from published specifications.'
      : 'Head-to-head product comparisons scored from published specifications. Every matchup delivers a spec-by-spec breakdown, highlights critical differences, and provides a clear verdict for shoppers who have already narrowed their choice down to two.'
  )
  lines.push('')
  lines.push(
    `Most figures come from official spec sheets. Some rows (marked on the page) are other published figures that usually do not appear on the maker sheet. ${SITE_NAME} does not run a lab. Rankings reflect published numbers, not measurements we took.`
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
      const claim = a && b ? verdictLine(a, b, buildVerdict(a, b, market), market) : c.description
      lines.push(`- [${c.productName}](${absUrl(compareHref(c, market))}): ${claim}`)
    }
    lines.push('')
  }

  lines.push('## Products')
  lines.push('')
  for (const [sub, prods] of productsBySub.entries()) {
    lines.push(`### ${subLabel(sub)}`)
    lines.push('')
    for (const p of prods) {
      lines.push(`- [${p.name}](${absUrl(productHref(p, market))}): ${priceShort(p, market)} · ${p.description}`)
    }
    lines.push('')
  }

  lines.push('## Categories')
  lines.push('')
  for (const cat of categories) {
    lines.push(`- [${cat.name}](${absUrl(categoryHref(cat.id, market))})`)
  }
  lines.push('')

  lines.push('## About this site')
  lines.push('')
  lines.push('- US catalog only on this launch. Figures are published specs, not lab tests we ran. Some rows are marked as not on the official sheet.')
  lines.push('- Prices are list snapshots, not live offers. Credit-card pages are not financial advice.')
  lines.push(`- [How ${SITE_NAME} works](${absUrl('/about/')})`)
  lines.push(`- [Privacy](${absUrl('/privacy/')}) · [Terms](${absUrl('/terms/')}) · [Contact](${absUrl('/contact/')})`)
  lines.push('')

  lines.push('## Machine-readable')
  lines.push('')
  lines.push(`- [Sitemap](${absUrl('/sitemap.xml')})`)
  lines.push('')

  return lines.join('\n')
}
