import { isFeeBased } from '@/lib/nav'

export function PriceNote({ subcategory }: { subcategory: string }) {
  if (isFeeBased(subcategory)) {
    return (
      <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-ink-3" role="note">
        Not financial advice. Annual fees, APRs, bonuses and credits change. Confirm current terms
        with the issuer before you apply.
      </p>
    )
  }
  return (
    <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-ink-3" role="note">
      Manufacturer list price, not a live offer. Confirm current pricing before you buy.
    </p>
  )
}

export function FinanceDisclaimer() {
  return (
    <p className="mt-6 max-w-2xl text-[12.5px] leading-relaxed text-ink-3" role="note">
      Credit-card figures are from issuer materials and go stale. This is not an offer to lend, not
      financial advice, and not a recommendation to apply. Verify every fee, APR, bonus and credit
      on the issuer&apos;s site.
    </p>
  )
}
