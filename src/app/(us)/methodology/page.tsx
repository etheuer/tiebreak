import Link from 'next/link'
import { CATALOG_AS_OF } from '@/lib/site'
import { LegalPage, legalMetadata } from '@/views/legal-page'

export const metadata = legalMetadata(
  'How Clinchmark scores products',
  'Wins come from published manufacturer and ENERGY STAR figures, not lab tests. Lenses, prices, badges, and catalog cadence explained.',
  '/methodology/'
)

export default function MethodologyPage() {
  return (
    <LegalPage eyebrow="Methodology" title="How Clinchmark scores products">
      <p>
        Clinchmark is a head-to-head comparison tool. Each matchup scores published figures for two
        products and writes a one-line verdict. We do not run a lab. A &ldquo;win&rdquo; means the
        published number is better on that row, not that we measured the device ourselves.
      </p>

      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">Where the numbers come from</h2>
      <p>
        Most rows come from the manufacturer&apos;s spec sheet (or issuer terms for credit cards).
        Some rows — for example TV input lag or approximate HDR brightness — are other published
        figures that usually do not appear on that sheet. We still use those when they help you
        decide, and we mark them on the page. Confirm anything that matters on the official page
        before you buy.
      </p>

      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">How wins are scored</h2>
      <p>
        Rankable numeric specs score once each (higher or lower depending on the field). Descriptive
        rows are shown for context but are not ranked. Use-case lenses (Photos, Battery, Cleaning,
        and so on) re-score only the rows that matter for that lens. Deal-breakers flag hard
        requirements from the same published sheet.
      </p>

      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">Prices and TCO</h2>
      <p>
        Prices are manufacturer list / MSRP-style snapshots in US dollars when shown — not live
        offers. Where the catalog documents known consumables (filters, bags, and similar), total
        cost of ownership can add those on top of list price. Retail checkout prices vary; confirm
        with the seller.
      </p>

      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">ENERGY STAR badges</h2>
      <p>
        ENERGY STAR badges and annual kWh appear only when a catalog model is matched to EPA open
        data on{' '}
        <a href="https://data.energystar.gov" className="text-accent hover:underline">
          data.energystar.gov
        </a>
        . Matches cover room air cleaners and televisions. Cordless vacuums are never badged —
        they are not an ENERGY STAR product category. TV rows are often series matches across
        screen sizes; the badge shows a representative listing. See the{' '}
        <Link href="/energy-star/" className="text-accent hover:underline">
          ENERGY STAR hub
        </Link>
        .
      </p>

      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">Update cadence</h2>
      <p>
        The catalog is updated continuously as we add products and refresh sheets. Compare pages
        show a verification line such as &ldquo;Verified catalog figures as of …&rdquo; (currently
        keyed to catalog date {CATALOG_AS_OF}). Spec sheets and ENERGY STAR open data change; we do
        not promise every page is complete or current on every visit.
      </p>

      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">Limitations</h2>
      <p>
        No lab measurements. Subjective comfort, build quality, and long-term reliability are not
        scored. Some brands and generations are missing from ENERGY STAR datasets and stay
        unbadged. Credit-card pages are not financial advice.
      </p>

      <p>
        Related:{' '}
        <Link href="/about/" className="text-accent hover:underline">
          About Clinchmark
        </Link>
        {' · '}
        <Link href="/editorial-policy/" className="text-accent hover:underline">
          Editorial &amp; commercial policy
        </Link>
        .
      </p>
    </LegalPage>
  )
}
