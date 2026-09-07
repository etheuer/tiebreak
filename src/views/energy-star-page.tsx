import type { Metadata } from 'next'
import Link from 'next/link'
import { getProducts, type Product } from '@/lib/data'
import {
  ENERGY_STAR_AIR_FINDER,
  ENERGY_STAR_BRAND_GUIDELINES,
  ENERGY_STAR_HOME,
  ENERGY_STAR_TV_FINDER,
  formatAnnualKwh,
  getAllEnergyStarMatches,
  getEnergyStarMeta,
  type EnergyStarMatch,
} from '@/lib/energy-star'
import { productHref, subcategoryHref } from '@/lib/nav'
import { absUrl, SITE_NAME } from '@/lib/site'
import { defaultOgImages } from '@/lib/seo'
import { ProductImage } from '@/components/ProductImage'

export function energyStarMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: absUrl(path),
      type: 'website',
      siteName: SITE_NAME,
      images: defaultOgImages(),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: defaultOgImages().map((image) => image.url),
    },
  }
}

function MatchRow({
  match,
  product,
}: {
  match: EnergyStarMatch
  product: Product | undefined
}) {
  return (
    <li className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5">
      {product ? <ProductImage product={product} size="sm" className="hidden sm:grid" /> : null}
      <div className="min-w-0 flex-1">
        <p className="eyebrow">{match.brandName}</p>
        <h3 className="mt-0.5 text-subhead font-semibold tracking-[-0.02em]">
          {product ? (
            <Link href={productHref(product)} className="hover:text-accent">
              {product.name}
            </Link>
          ) : (
            match.productId
          )}
        </h3>
        <p className="mt-1 text-meta text-ink-3">
          ENERGY STAR® model {match.energyStarModelNumber}
          {match.screenSizeInches ? ` · ${match.screenSizeInches}"` : ''}
        </p>
      </div>
      <div className="shrink-0 sm:text-right">
        <p className="num text-body font-semibold text-ink">
          {formatAnnualKwh(match.annualEnergyUseKwh)}
        </p>
        {match.meetsMostEfficient ? (
          <p className="mt-0.5 text-micro font-medium text-accent">Most Efficient</p>
        ) : (
          <p className="mt-0.5 text-micro text-ink-3">Certified</p>
        )}
      </div>
    </li>
  )
}

export async function EnergyStarLanding({ focus }: { focus?: 'air-cleaners' | 'all' } = {}) {
  const [meta, matches, products] = await Promise.all([
    getEnergyStarMeta(),
    getAllEnergyStarMatches(),
    getProducts('us'),
  ])
  const byId = new Map(products.map((p) => [p.id, p]))

  const airMatches = matches.filter((m) => m.subcategory === 'air-purifiers')
  const tvMatches = matches.filter((m) => m.subcategory === 'tvs')
  const showAir = focus !== undefined ? focus === 'air-cleaners' || focus === 'all' : true
  const showTv = focus !== 'air-cleaners'

  const title =
    focus === 'air-cleaners'
      ? 'ENERGY STAR® room air cleaners on Clinchmark'
      : 'Clinchmark helps compare ENERGY STAR certified room air cleaners and televisions'

  return (
    <article className="shell max-w-3xl py-12">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-meta text-ink-3">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>
        <span aria-hidden>/</span>
        {focus === 'air-cleaners' ? (
          <>
            <Link href="/energy-star/" className="hover:text-accent">
              ENERGY STAR®
            </Link>
            <span aria-hidden>/</span>
            <span className="text-ink-2">Room air cleaners</span>
          </>
        ) : (
          <span className="text-ink-2">ENERGY STAR®</span>
        )}
      </nav>

      <header className="mt-5 border-b border-line pb-8">
        <p className="eyebrow">Energy efficiency</p>
        <h1 className="display mt-2 text-h1">{title}</h1>
        <p className="mt-4 text-body leading-relaxed text-ink-2">
          Clinchmark highlights ENERGY STAR® certified room air cleaners and televisions so
          shoppers can find efficient models alongside published specs. We help shoppers compare
          certified models side by side — we do not claim ENERGY STAR partnership until EPA
          approves an application.
        </p>
        {/*
          Logo choice: Brand Guidelines (energystar.gov/partner-resources/brand-guidelines)
          state that in most cases orgs need an active Partnership Agreement to use ENERGY STAR
          marks. Until partnership is approved we use the word mark “ENERGY STAR®” + links only
          (no certification/partnership logo artwork).
        */}
        <p className="mt-3 text-meta text-ink-3">
          Match data as of {meta.asOf} · curated from{' '}
          <a
            href="https://data.energystar.gov"
            className="text-accent hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            data.energystar.gov
          </a>
        </p>
      </header>

      <section className="border-b border-line py-8" aria-labelledby="es-links">
        <h2 id="es-links" className="display text-h3">
          ENERGY STAR® resources
        </h2>
        <p className="mt-3 text-body leading-relaxed text-ink-2">
          Reciprocal links to the official program (required later for Web Linking Policy):
        </p>
        <ul className="mt-4 grid gap-2 text-body text-ink-2">
          <li>
            <a
              href={ENERGY_STAR_HOME}
              className="font-medium text-accent hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              ENERGY STAR® home (energystar.gov)
            </a>
          </li>
          <li>
            <a
              href={ENERGY_STAR_AIR_FINDER}
              className="font-medium text-accent hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              Product Finder — certified room air cleaners
            </a>
          </li>
          <li>
            <a
              href={ENERGY_STAR_TV_FINDER}
              className="font-medium text-accent hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              Product Finder — certified televisions
            </a>
          </li>
          <li>
            <a
              href={ENERGY_STAR_BRAND_GUIDELINES}
              className="font-medium text-accent hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              Brand guidelines
            </a>
          </li>
        </ul>
      </section>

      <section className="border-b border-line py-8" aria-labelledby="es-clinchmark">
        <h2 id="es-clinchmark" className="display text-h3">
          Compare on Clinchmark
        </h2>
        <p className="mt-3 text-body leading-relaxed text-ink-2">
          Browse our category hubs for head-to-head matchups. Certified badges and annual kWh
          appear only when a catalog model is matched to the ENERGY STAR® list — never for
          cordless vacuums.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          <li>
            <Link
              href={subcategoryHref('appliances', 'air-purifiers')}
              className="card block p-4 transition-colors hover:border-line-2"
            >
              <p className="eyebrow">Appliances</p>
              <p className="mt-1 text-subhead font-semibold">Air purifiers</p>
              <p className="mt-1 text-meta text-ink-3">Room air cleaners compare hub →</p>
            </Link>
          </li>
          <li>
            <Link
              href={subcategoryHref('electronics', 'tvs')}
              className="card block p-4 transition-colors hover:border-line-2"
            >
              <p className="eyebrow">Electronics</p>
              <p className="mt-1 text-subhead font-semibold">TVs</p>
              <p className="mt-1 text-meta text-ink-3">Television compare hub →</p>
            </Link>
          </li>
        </ul>
        {focus !== 'air-cleaners' ? (
          <p className="mt-4 text-meta text-ink-3">
            Focused air-cleaner landing:{' '}
            <Link href="/energy-star/air-cleaners/" className="text-accent hover:underline">
              /energy-star/air-cleaners/
            </Link>
          </p>
        ) : null}
      </section>

      {showAir ? (
        <section className="border-b border-line py-8" aria-labelledby="es-air-matches">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="es-air-matches" className="display text-h3">
              Matched room air cleaners
            </h2>
            <p className="num text-label text-ink-3">{airMatches.length} matched</p>
          </div>
          <p className="mt-2 text-meta text-ink-3">
            Curated matches from dataset gaa3-swy6 (high = strong/exact; medium = fuzzy SKU bridge still on the ENERGY STAR list). Vacuums stay unbadged.
          </p>
          <ul className="mt-5 grid gap-2.5">
            {airMatches.map((match) => (
              <MatchRow key={match.productId} match={match} product={byId.get(match.productId)} />
            ))}
          </ul>
        </section>
      ) : null}

      {showTv ? (
        <section className="border-b border-line py-8" aria-labelledby="es-tv-matches">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="es-tv-matches" className="display text-h3">
              Matched televisions
            </h2>
            <p className="num text-label text-ink-3">{tvMatches.length} matched</p>
          </div>
          <p className="mt-2 text-meta text-ink-3">
            Series matches from dataset pd96-rr3d — badge uses a representative 65&quot; listing when the series spans sizes. LG G3/G4 and several Sony / TCL / Hisense catalog TVs remain unmatched in the open-data snapshot.
          </p>
          <ul className="mt-5 grid gap-2.5">
            {tvMatches.map((match) => (
              <MatchRow key={match.productId} match={match} product={byId.get(match.productId)} />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="py-8" aria-labelledby="es-disclaimer">
        <h2 id="es-disclaimer" className="display text-h3">
          Notes
        </h2>
        <ul className="mt-3 grid gap-2 text-meta leading-relaxed text-ink-2">
          <li>
            ENERGY STAR® and the ENERGY STAR mark are registered trademarks owned by the U.S.
            Environmental Protection Agency. Listing a certified product here is not an EPA
            endorsement of Clinchmark.
          </li>
          <li>
            We use the words “ENERGY STAR®” with links only until partnership is approved — no
            partnership or certification logo artwork on this page.
          </li>
          <li>
            Annual kWh figures come from ENERGY STAR® published fields (
            <code className="text-micro">annual_energy_use_kwh_yr</code> for air cleaners,{' '}
            <code className="text-micro">reported_annual_energy_consumption_kwh</code> for TVs).
          </li>
        </ul>
      </section>
    </article>
  )
}
