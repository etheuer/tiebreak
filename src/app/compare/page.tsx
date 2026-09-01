import type { Metadata } from 'next'
import Link from 'next/link'
import { getComparisons, getProducts } from '@/lib/data'
import { buildVerdict, verdictLine } from '@/lib/verdict'
import { compareHref, SUBCATEGORY_LABEL, subLabel } from '@/lib/nav'
import { absUrl, SITE_NAME } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const comparisons = await getComparisons()
  const description = `Every head-to-head published on Tiebreak: ${comparisons.length} matchups across TVs, laptops, phones, headphones, cordless vacuums, air purifiers and credit cards, each with a spec-by-spec verdict.`
  const title = 'All product matchups'
  return {
    title,
    description,
    alternates: { canonical: '/compare/' },
    openGraph: {
      title,
      description,
      url: '/compare/',
      type: 'website',
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function CompareHubPage() {
  const [products, comparisons] = await Promise.all([
    getProducts(),
    getComparisons(),
  ])

  const byId = new Map(products.map((p) => [p.id, p]))

  // Group by subcategory
  const subcategories = Object.keys(SUBCATEGORY_LABEL)
  const grouped = subcategories
    .map((sub) => {
      const comps = comparisons.filter((c) => {
        const a = byId.get(c.productA)
        return a?.subcategory === sub
      })
      return {
        sub,
        label: subLabel(sub),
        comparisons: comps,
      }
    })
    .filter((g) => g.comparisons.length > 0)

  return (
    <div className="shell">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-6 text-[12.5px] text-ink-3">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>
        <span aria-hidden>/</span>
        <span className="text-ink-2">All matchups</span>
      </nav>

      <header className="mt-5 border-b border-line pb-8">
        <p className="eyebrow">Directory</p>
        <h1 className="display mt-2 text-[32px] sm:text-[44px]">All matchups</h1>
        <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-ink-2">
          Every head-to-head comparison published on Tiebreak, scored from published specifications with a verdict for every pair.
        </p>
      </header>

      <div className="py-8 grid gap-10">
        {grouped.map((group) => (
          <section key={group.sub} id={group.sub} className="scroll-mt-20">
            <h2 className="display text-[21px] sm:text-[25px] border-b-2 border-line pb-2">
              {group.label}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {group.comparisons.map((c) => {
                const productA = byId.get(c.productA)
                const productB = byId.get(c.productB)
                const claim =
                  productA && productB
                    ? verdictLine(productA, productB, buildVerdict(productA, productB))
                    : c.description
                return (
                  <li key={c.productA + c.productB} className="card p-4">
                    <Link
                      href={compareHref(c)}
                      className="text-[15px] font-semibold text-ink hover:text-accent"
                    >
                      {c.productName}
                    </Link>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">{claim}</p>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: absUrl('/'),
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'All matchups',
              },
            ],
          }),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'All product matchups',
            itemListElement: comparisons.map((c, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: c.productName,
              url: absUrl(compareHref(c)),
            })),
          }),
        }}
      />
    </div>
  )
}
