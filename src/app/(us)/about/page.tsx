import Link from 'next/link'
import { GITHUB_REPO, SITE_EMAIL } from '@/lib/site'
import { LegalPage, legalMetadata } from '@/views/legal-page'

export const metadata = legalMetadata(
  'About Clinchmark',
  'Zero-bias head-to-head product comparison from published specs. Categories, operators, and how to reach us.',
  '/about/'
)

export default function AboutPage() {
  const email = SITE_EMAIL || null
  return (
    <LegalPage eyebrow="About" title="About Clinchmark">
      <p>
        Clinchmark is a zero-bias product comparison site for people who have already narrowed a
        purchase to two options. Each matchup scores published specs, surfaces deal-breakers, and
        can show total cost of ownership — then writes a one-line verdict. Spec-sheet comparisons,
        not lab tests we ran.
      </p>

      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">What we cover</h2>
      <p>
        Electronics (phones, TVs, laptops, headphones), appliances (air purifiers, cordless
        vacuums), and finance (credit cards). The public site is the United States catalog. A UK
        edition exists in the codebase and is not published yet.
      </p>

      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">How it works</h2>
      <p>
        Wins and lenses are explained on the{' '}
        <Link href="/methodology/" className="text-accent hover:underline">
          methodology
        </Link>{' '}
        page. Commercial rules — including affiliate status (none today) — are on the{' '}
        <Link href="/editorial-policy/" className="text-accent hover:underline">
          editorial &amp; commercial policy
        </Link>{' '}
        page. Prices on this site are manufacturer list snapshots in US dollars, not live offers.
      </p>

      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">Who builds it</h2>
      <p>
        Clinchmark is built by the Clinchmark team (Erik Theuer / David Vicentin). We keep operator
        detail light on purpose — no home address on this page.
      </p>

      <h2 className="mt-2 text-lead font-semibold tracking-[-0.02em] text-ink">Contact &amp; corrections</h2>
      <p>
        Questions or catalog corrections:{' '}
        {email ? (
          <a href={`mailto:${email}`} className="text-accent hover:underline">
            {email}
          </a>
        ) : (
          <a href="mailto:erik.theuer@gmail.com" className="text-accent hover:underline">
            erik.theuer@gmail.com
          </a>
        )}
        . You can also{' '}
        <a href={`${GITHUB_REPO}/issues`} className="text-accent hover:underline">
          open a GitHub issue
        </a>
        . Include the product URL and a source sheet when reporting a wrong figure.
      </p>
    </LegalPage>
  )
}
