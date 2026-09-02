import Link from 'next/link'
import { LegalPage, legalMetadata } from '@/views/legal-page'

export const metadata = legalMetadata(
  'Terms of use',
  'Clinchmark is informational. Specs are published figures, prices are list snapshots, and credit-card pages are not financial advice.',
  '/terms/'
)

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use">
      <p>
        By using Clinchmark you agree to these terms. The site is a free information resource. It is
        not a store, a lender, or an advisor.
      </p>
      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">No professional advice</h2>
      <p>
        Nothing here is legal, tax, or financial advice. Credit-card comparisons are not an offer
        to lend and not a recommendation to apply. Product verdicts are not a warranty that a
        device will work for you.
      </p>
      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">Accuracy</h2>
      <p>
        We score published figures: official spec sheets plus some other published numbers that we
        mark on the page. We do not run a lab. Makers change sheets, retailers change prices, and
        issuers change card terms. We do not promise that a page is complete or current. Confirm
        facts with the manufacturer, seller, or issuer before you buy or apply.
        See <Link href="/about/" className="text-accent hover:underline">how Clinchmark works</Link>.
      </p>
      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">Trademarks</h2>
      <p>
        Product names, logos and trademarks belong to their owners. We use them to identify the
        goods we compare. No endorsement is implied.
      </p>
      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">Liability</h2>
      <p>
        The site is provided as is. To the fullest extent the law allows, we are not liable for
        decisions you make from these pages, including purchases, applications, or missed bonuses.
      </p>
      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">Acceptable use</h2>
      <p>
        Do not scrape the site in a way that harms the host, impersonate Clinchmark, or republish
        the verdicts as your own lab results.
      </p>
    </LegalPage>
  )
}
