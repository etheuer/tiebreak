import { GITHUB_REPO, SITE_EMAIL } from '@/lib/site'
import { LegalPage, legalMetadata } from '@/views/legal-page'

export const metadata = legalMetadata(
  'Contact',
  'Report a wrong spec, a stale price, or a broken page on Clinchmark.',
  '/contact/'
)

export default function ContactPage() {
  const email = SITE_EMAIL || null
  return (
    <LegalPage eyebrow="Contact" title="Corrections and questions">
      <p>
        If a spec, price, or verdict looks wrong, tell us. Include the page address and the source
        you trust (manufacturer sheet, issuer terms, or a dated retailer listing).
      </p>
      <ul className="grid gap-2">
        {email ? (
          <li>
            Email:{' '}
            <a href={`mailto:${email}`} className="text-accent hover:underline">
              {email}
            </a>
          </li>
        ) : null}
        <li>
          GitHub:{' '}
          <a href={`${GITHUB_REPO}/issues`} className="text-accent hover:underline">
            {GITHUB_REPO.replace('https://', '')}/issues
          </a>
        </li>
      </ul>
      <p>
        We do not take product applications, we do not sell the products on these pages, and we
        cannot change an issuer&apos;s terms on your behalf.
      </p>
    </LegalPage>
  )
}
