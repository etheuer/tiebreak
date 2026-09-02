import { isFeeBased } from '@/lib/nav'
import type { Product } from '@/lib/pricing'

function formatAsOf(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}

export function PriceNote({ subcategory }: { subcategory: string }) {
  if (isFeeBased(subcategory)) {
    return (
      <p className="mt-2 max-w-sm text-meta leading-relaxed text-ink-3" role="note">
        Not financial advice. Annual fees, APRs, bonuses and credits change. Confirm current terms
        with the issuer before you apply.
      </p>
    )
  }
  return (
    <p className="mt-2 max-w-sm text-meta leading-relaxed text-ink-3" role="note">
      Manufacturer list price, not a live offer. Confirm current pricing before you buy.
    </p>
  )
}

function IssuerTermsList({ products }: { products: Product[] }) {
  const sourced = products.filter((product) => product.officialSource?.url.startsWith('https://'))
  if (sourced.length === 0) return null
  return (
    <ul className="mt-2 grid gap-1">
      {sourced.map((product) => {
        const source = product.officialSource!
        return (
          <li key={product.id}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              {product.name} issuer terms
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            {source.asOf ? <span> · checked {formatAsOf(source.asOf)}</span> : null}
          </li>
        )
      })}
    </ul>
  )
}

export function FinanceDisclaimer({ products = [] }: { products?: Product[] }) {
  return (
    <div className="mt-6 max-w-2xl text-meta leading-relaxed text-ink-3" role="note">
      <p>
        Credit-card figures are from issuer materials and go stale. This is not an offer to lend, not
        financial advice, and not a recommendation to apply. Verify every fee, APR, bonus and credit
        on the issuer&apos;s site.
      </p>
      <IssuerTermsList products={products} />
    </div>
  )
}
