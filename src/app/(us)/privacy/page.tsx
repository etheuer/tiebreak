import { GITHUB_REPO, SITE_EMAIL } from '@/lib/site'
import { LegalPage, legalMetadata } from '@/views/legal-page'

export const metadata = legalMetadata(
  'Privacy policy',
  'Clinchmark is a static comparison site. We do not run accounts. Analytics load only when configured.',
  '/privacy/'
)

export default function PrivacyPage() {
  const email = SITE_EMAIL || null
  return (
    <LegalPage title="Privacy policy">
      <p>
        Clinchmark is a static website. There are no user accounts, and we do not ask you to create
        one. Product pages are files we generate in advance and host as HTML.
      </p>
      <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-ink">What we collect</h2>
      <p>
        We do not collect names, emails, or payment details through the site. The host that serves
        these files (for example a CDN) may keep ordinary server logs such as IP address, browser
        type, and the page requested. We use those logs only to keep the site up and to investigate
        abuse.
      </p>
      <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-ink">Cookies and storage</h2>
      <p>
        The public US site does not set a tracking cookie. If a market switcher is turned on later,
        it may remember US vs UK in your browser&apos;s local storage so the banner can suggest the
        other catalog. That value never leaves your device.
      </p>
      <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-ink">Analytics</h2>
      <p>
        If the operator has configured PostHog, a small script records page views so we can see
        which matchups are used. It loads only when that key is present at build time. You can
        block it with a standard content blocker.
      </p>
      <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-ink">We do not sell data</h2>
      <p>
        We do not sell personal information. We do not run ads on these pages. There are no
        affiliate checkout links on this launch.
      </p>
      <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-ink">Contact</h2>
      <p>
        Privacy questions:{' '}
        {email ? (
          <a href={`mailto:${email}`} className="text-accent hover:underline">
            {email}
          </a>
        ) : (
          <a href={`${GITHUB_REPO}/issues`} className="text-accent hover:underline">
            open a GitHub issue
          </a>
        )}
        .
      </p>
    </LegalPage>
  )
}
