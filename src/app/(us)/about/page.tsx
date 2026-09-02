import Link from 'next/link'
import { LegalPage, legalMetadata } from '@/views/legal-page'

export const metadata = legalMetadata(
  'How Tiebreak works',
  'Tiebreak compares two products from manufacturer-published specifications and scores a spec-by-spec verdict. No lab tests, no live prices.',
  '/about/'
)

export default function AboutPage() {
  return (
    <LegalPage eyebrow="About" title="How Tiebreak works">
      <p>
        Tiebreak is for people who have already narrowed a purchase to two options. Each matchup
        scores the specs both products publish, then writes a one-line verdict.
      </p>
      <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-ink">What the numbers are</h2>
      <p>
        Every figure comes from manufacturer-published specifications. We do not run a lab, we do
        not mystery-shop, and we do not convert currencies. A &ldquo;win&rdquo; means the published
        number is better on that row, not that we measured it.
      </p>
      <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-ink">Prices</h2>
      <p>
        Prices on this site are manufacturer list prices in US dollars, stored as a snapshot. They
        are not live offers and they are not a promise that you can buy at that amount today.
        Confirm the current price with the seller.
      </p>
      <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-ink">Credit cards</h2>
      <p>
        Card pages compare annual fees and published terms. That is not financial advice, not an
        offer to lend, and not a recommendation to apply. Fees, APRs, bonuses and credits change.
        Read the issuer&apos;s current terms.
      </p>
      <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-ink">This launch</h2>
      <p>
        The public site is the United States catalog. A UK edition exists in the codebase and is
        not published yet.
      </p>
      <p>
        Found a wrong spec? <Link href="/contact/" className="text-accent hover:underline">Tell us</Link>.
      </p>
    </LegalPage>
  )
}
