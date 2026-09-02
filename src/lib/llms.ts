import { getCategories, getComparisons, getProducts, type Comparison, type Product } from '@/lib/data'
import { buildVerdict, verdictLine } from '@/lib/verdict'
import { categoryHref, compareHref, hubHref, isFeeBased, SUBCATEGORY_LABEL } from '@/lib/nav'
import { absUrl, CATALOG_AS_OF } from '@/lib/site'
import type { MarketId } from '@/lib/markets'
import { formatMoney } from '@/lib/format'
import { checkDealBreakers, flattenRows, sentenceCase } from '@/lib/decision'
import { casesFor } from '@/data/use-cases'
import { buildLensAnswers } from '@/lib/faq'

const FLAGSHIP_PATTERN = /(?:iPhone|Galaxy|MacBook|OLED|Bravia|A95|Dyson|Amex|WH-1000|Bose)/i

export async function buildLlmsText(market: MarketId = 'us'): Promise<string> {
  const [products, comparisons, categories] = await Promise.all([
    getProducts(market),
    getComparisons(market),
    getCategories(market),
  ])

  const byId = new Map(products.map((p) => [p.id, p]))

  // Curate matchups: one featured pair per subcategory + up to 20 flagship pairs
  const selectedComps: typeof comparisons = []
  const seenSlugs = new Set<string>()

  for (const sub of Object.keys(SUBCATEGORY_LABEL)) {
    const found = comparisons.find((c) => {
      const pA = byId.get(c.productA)
      return pA?.subcategory === sub
    })
    if (found) {
      const slug = `${found.productA}-vs-${found.productB}`
      selectedComps.push(found)
      seenSlugs.add(slug)
    }
  }

  let flagshipCount = 0
  for (const c of comparisons) {
    if (flagshipCount >= 20) break
    const slug = `${c.productA}-vs-${c.productB}`
    if (seenSlugs.has(slug)) continue
    if (FLAGSHIP_PATTERN.test(c.productName)) {
      selectedComps.push(c)
      seenSlugs.add(slug)
      flagshipCount += 1
    }
  }

  const lines: string[] = []
  lines.push('# Tiebreak')
  lines.push('')
  lines.push(
    `> Head-to-head product comparisons scored from published specifications for shoppers deciding between two options. Spec-sheet comparisons not lab tests. US catalog. Catalog as of ${CATALOG_AS_OF}.`
  )
  lines.push('')
  lines.push('## Matchups')
  lines.push('')

  for (const c of selectedComps) {
    const a = byId.get(c.productA)
    const b = byId.get(c.productB)
    const claim = a && b ? verdictLine(a, b, buildVerdict(a, b, market), market) : c.description
    lines.push(`- [${c.productName}](${absUrl(compareHref(c, market))}): ${claim}`)
  }

  lines.push('')
  lines.push('## All matchups')
  lines.push('')
  lines.push(`- [All comparisons](${absUrl(hubHref(market))}): Full directory of all pairwise product comparisons`)
  lines.push(`- [Sitemap](${absUrl('/sitemap.xml')}): Complete XML index of all comparison, product, and category URLs`)
  lines.push('')
  lines.push('## Methodology')
  lines.push('')
  lines.push(`- [How Tiebreak works](${absUrl('/about/')}): Scoring methodology based entirely on published manufacturer specifications`)
  lines.push('')
  lines.push('## Products')
  lines.push('')
  for (const cat of categories) {
    lines.push(`- [${cat.name}](${absUrl(categoryHref(cat.id, market))}): ${cat.name} comparisons and spec sheets`)
  }
  lines.push('')
  lines.push('## Optional')
  lines.push('')
  lines.push(`- [Privacy Policy](${absUrl('/privacy/')})`)
  lines.push(`- [Terms of Service](${absUrl('/terms/')})`)
  lines.push(`- [Contact](${absUrl('/contact/')})`)
  lines.push('')

  return lines.join('\n')
}

export function buildCompareMarkdown(
  comparison: Comparison,
  productA: Product,
  productB: Product,
  market: MarketId = 'us'
): string {
  const verdict = buildVerdict(productA, productB, market)
  const answer = verdictLine(productA, productB, verdict, market)
  const rows = flattenRows(verdict)
  const checks = checkDealBreakers(productA, productB)
  const useCases = casesFor(productA.subcategory)
  const lenses = buildLensAnswers(productA, productB, rows, checks, useCases, market)

  const diffRows = rows.filter((r) => r.differs)
  const cheaper = verdict.priceLeader === 'a' ? productA : verdict.priceLeader === 'b' ? productB : null
  const fee = isFeeBased(productA.subcategory)

  const lines: string[] = []
  lines.push('Index: /llms.txt')
  lines.push('')
  lines.push(`# ${comparison.productName}`)
  lines.push(`Catalog as of ${CATALOG_AS_OF}`)
  lines.push(`Canonical: ${absUrl(compareHref(comparison, market))}`)
  lines.push('')
  lines.push(answer)
  lines.push('')
  lines.push('## Score')
  lines.push(`- ${productA.name}: ${verdict.aWins} win${verdict.aWins === 1 ? '' : 's'}`)
  lines.push(`- ${productB.name}: ${verdict.bWins} win${verdict.bWins === 1 ? '' : 's'}`)
  lines.push(`- Differing specs: ${verdict.differing} of ${verdict.total} tracked`)
  if (cheaper) {
    lines.push(
      `- Price gap: ${formatMoney(verdict.priceGap, market)} (${cheaper.name} ${fee ? 'charges less a year' : 'costs less'})`
    )
  } else {
    lines.push(`- Price gap: Same ${fee ? 'annual fee' : 'list price'}`)
  }
  lines.push('')
  lines.push('## Deal-breakers')
  const tripped = checks.filter((c) => c.a === 'trips' || c.b === 'trips')
  if (tripped.length > 0) {
    for (const check of tripped) {
      const who = check.a === 'trips' && check.b === 'trips' ? 'Both' : check.a === 'trips' ? productA.name : productB.name
      lines.push(`- ${who}: ${sentenceCase(check.label)}${check.why ? ` (${check.why})` : ''}`)
    }
  } else {
    lines.push('- Neither product triggers standard category deal-breakers.')
  }
  lines.push('')
  if (lenses.length > 0) {
    lines.push('## Best for')
    for (const lens of lenses) {
      lines.push(`### ${lens.label}`)
      lines.push(lens.headline)
      for (const reason of lens.reasons) {
        lines.push(`- ${reason}`)
      }
      lines.push('')
    }
  }
  lines.push('## Specs that differ')
  if (diffRows.length > 0) {
    lines.push(`| Specification | ${productA.name} | ${productB.name} |`)
    lines.push('| --- | --- | --- |')
    for (const r of diffRows) {
      lines.push(`| ${r.label.replace(/\|/g, '\\|')} | ${r.a.replace(/\|/g, '\\|')} | ${r.b.replace(/\|/g, '\\|')} |`)
    }
  } else {
    lines.push('- No tracked specifications differ.')
  }
  lines.push('')
  lines.push('## Sources')
  if (productA.officialSource?.url) {
    lines.push(`- [${productA.name}](${productA.officialSource.url}) (as of ${productA.officialSource.asOf})`)
  }
  if (productB.officialSource?.url) {
    lines.push(`- [${productB.name}](${productB.officialSource.url}) (as of ${productB.officialSource.asOf})`)
  }
  lines.push('')

  return lines.join('\n')
}
