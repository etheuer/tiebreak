'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { marketPath, type MarketId } from '@/lib/markets'
import { buildHref, subLabelSingular } from '@/lib/nav'
import { publishedSlug, type BuilderProduct, type PublishedPairs } from '@/lib/builder-data'
import { capture } from '@/lib/analytics'

/**
 * Compare-any-two picker. Resolves to the published breakdown when the pair
 * ships one, otherwise to the live custom comparison (/compare/build/).
 * Same-subcategory pairs only: lenses and deal-breakers are typed per
 * product type, so cross-type picks would score noise.
 */
export function CompareBuilder({
  products,
  publishedPairs,
  market = 'us',
}: {
  products: BuilderProduct[]
  publishedPairs: PublishedPairs
  market?: MarketId
}) {
  const router = useRouter()
  const [idA, setIdA] = useState('')
  const [idB, setIdB] = useState('')

  const productA = useMemo(() => products.find((p) => p.id === idA) ?? null, [products, idA])

  const optionsB = useMemo(
    () => (productA ? products.filter((p) => p.subcategory === productA.subcategory && p.id !== productA.id) : []),
    [products, productA]
  )

  const productB = useMemo(() => optionsB.find((p) => p.id === idB) ?? null, [optionsB, idB])

  function chooseA(id: string) {
    setIdA(id)
    // Keep the second pick only while it is still a valid partner: same type,
    // and not the product just chosen as the first.
    const next = products.find((p) => p.id === id)
    const current = products.find((p) => p.id === idB)
    if (!next || !current || current.id === next.id || current.subcategory !== next.subcategory) {
      setIdB('')
    }
  }

  const ready = Boolean(productA && productB && productA.id !== productB.id)
  const slug =
    productA && productB ? publishedSlug(products, publishedPairs, productA.id, productB.id) : undefined
  const target =
    productA && productB
      ? slug
        ? marketPath(market, `/compare/${slug}/`)
        : buildHref(productA.id, productB.id, market)
      : null

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (target) {
      capture('compare_started', {
        from: 'builder',
        href: target,
        product_a: productA?.id,
        product_b: productB?.id,
        subcategory: productA?.subcategory,
        is_published: Boolean(slug),
      })
      router.push(target)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="card mt-6 p-5 sm:p-7 border border-line/80 shadow-md"
      aria-label="Compare any two products"
    >
      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        {/* Fighter 1 */}
        <div
          className="rounded-2xl p-4 transition-all"
          style={{
            background: productA ? 'var(--accent-tint)' : 'var(--surface-2)',
            border: `1px solid ${productA ? 'color-mix(in oklab, var(--accent) 30%, transparent)' : 'var(--line)'}`,
          }}
        >
          <div className="flex items-center justify-between pb-2">
            <span className="text-badge font-bold uppercase tracking-wider text-ink-3">Contender 1</span>
            {productA && (
              <span className="rounded-md bg-accent-soft px-2 py-0.5 text-badge font-bold text-accent">
                {productA.priceText}
              </span>
            )}
          </div>
          <label className="block text-meta font-medium text-ink-2">
            <select
              value={idA}
              onChange={(e) => chooseA(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-body font-semibold text-ink shadow-2xs focus:border-accent focus:outline-none"
            >
              <option value="">Select first product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.priceText})
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Center VS Indicator */}
        <div className="flex justify-center">
          <span
            aria-hidden
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-meta font-black text-ink-2 shadow-sm"
          >
            VS
          </span>
        </div>

        {/* Fighter 2 */}
        <div
          className="rounded-2xl p-4 transition-all"
          style={{
            background: productB ? 'var(--rival-tint)' : 'var(--surface-2)',
            border: `1px solid ${productB ? 'color-mix(in oklab, var(--rival) 30%, transparent)' : 'var(--line)'}`,
          }}
        >
          <div className="flex items-center justify-between pb-2">
            <span className="text-badge font-bold uppercase tracking-wider text-ink-3">Contender 2</span>
            {productB && (
              <span className="rounded-md bg-rival-soft px-2 py-0.5 text-badge font-bold text-rival">
                {productB.priceText}
              </span>
            )}
          </div>
          <label className="block text-meta font-medium text-ink-2">
            <select
              value={idB}
              onChange={(e) => setIdB(e.target.value)}
              disabled={!productA}
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-body font-semibold text-ink shadow-2xs focus:border-rival focus:outline-none disabled:opacity-50"
            >
              <option value="">
                {productA ? `Select rival ${subLabelSingular(productA.subcategory)}…` : 'Choose first contender…'}
              </option>
              {optionsB.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.priceText})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Submission bar */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-line/60 pt-4">
        <div>
          {ready ? (
            <p className="flex items-center gap-2 text-cell font-semibold text-ink" aria-live="polite">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Ready: {productA?.name} vs {productB?.name}
              <span className="text-meta font-normal text-ink-3">
                ({slug ? 'Verified Matchup' : 'Instant Live Scoring'})
              </span>
            </p>
          ) : (
            <p className="text-meta text-ink-3">
              Select two products of the same category to generate an instant head-to-head score.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!ready}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-body font-bold text-white shadow-sm transition-all hover:bg-accent-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>Score Matchup</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M2.5 7h9M7.5 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </form>
  )
}
