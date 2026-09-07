import Link from 'next/link'
import { GITHUB_REPO, SITE_EMAIL } from '@/lib/site'
import { LegalPage, legalMetadata } from '@/views/legal-page'

export const metadata = legalMetadata(
  'Editorial & commercial policy',
  'Zero-bias scoring: no paid placement, no affiliate links today, ENERGY STAR mark disclosure, and how to request corrections.',
  '/editorial-policy/'
)

export default function EditorialPolicyPage() {
  const email = SITE_EMAIL || null
  return (
    <LegalPage eyebrow="Policy" title="Editorial & commercial policy">
      <p>
        Clinchmark aims for zero-bias product comparison: head-to-head published specs, deal-breakers,
        and total cost of ownership — not sponsored rankings.
      </p>

      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">Scores are not for sale</h2>
      <p>
        We do not sell placement in verdicts, lens scores, or &ldquo;winner&rdquo; calls. Catalog
        figures come from manufacturer sheets and other published sources we mark on the page, plus
        ENERGY STAR open data when a model is matched.
      </p>

      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">Affiliate and shopping links</h2>
      <p>
        Affiliate / paid shopping links: <strong>none today</strong>. Product pages link to
        manufacturer (or issuer) sources. If affiliate or paid checkout links are added later, they
        will be disclosed on this page and near the link.
      </p>

      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">ENERGY STAR mark</h2>
      <p>
        ENERGY STAR® is a registered mark of the U.S. Environmental Protection Agency. Listing
        certified models and linking to energystar.gov is not an EPA endorsement of Clinchmark.
        We are not claiming ENERGY STAR partnership on this site today. Badge rules live on the{' '}
        <Link href="/methodology/" className="text-accent hover:underline">
          methodology
        </Link>{' '}
        page and the{' '}
        <Link href="/energy-star/" className="text-accent hover:underline">
          ENERGY STAR hub
        </Link>
        .
      </p>

      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">Corrections</h2>
      <p>
        Found a wrong figure? Email us with the product URL and the manufacturer (or ENERGY STAR)
        source sheet. We fix verified catalog errors. Prefer:{' '}
        {email ? (
          <a href={`mailto:${email}`} className="text-accent hover:underline">
            {email}
          </a>
        ) : (
          <>
            <a href="mailto:erik.theuer@gmail.com" className="text-accent hover:underline">
              erik.theuer@gmail.com
            </a>
            {' '}or{' '}
            <a href={`${GITHUB_REPO}/issues`} className="text-accent hover:underline">
              open a GitHub issue
            </a>
          </>
        )}
        .
      </p>

      <p>
        Related:{' '}
        <Link href="/about/" className="text-accent hover:underline">
          About
        </Link>
        {' · '}
        <Link href="/methodology/" className="text-accent hover:underline">
          Methodology
        </Link>
        {' · '}
        <Link href="/privacy/" className="text-accent hover:underline">
          Privacy
        </Link>
        .
      </p>
    </LegalPage>
  )
}
