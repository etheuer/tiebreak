'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { marketPath, type MarketId } from '@/lib/markets'
import { buildHref, pairKey } from '@/lib/nav'

export type BuilderProduct = {
  id: string
  name: string
  brand: string
  subcategory: string
  subLabel: string
  priceText: string
}

/**
 * Compare-any-two picker. Resolves to the published breakdown when the pair
 * ships one, otherwise to the live custom comparison (/compare/build/).
 * Same-subcategory pairs only: lenses and deal-breakers are typed per
 * product type, so cross-type picks would score noise.
 */
export function CompareBuilder({
  products,
  published,
  market = 'us',
  compact = false,
}: {
  products: BuilderProduct[]
  /** pairKey -> published slug (`a-vs-b` in stored order). */
  published: Record<string, string>
  market?: MarketId
  compact?: boolean
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
    const next = products.find((p) => p.id === id)
    if (next && products.find((p) => p.id === idB)?.subcategory !== next.subcategory) {
      setIdB('')
    }
  }

  const ready = Boolean(productA && productB && productA.id !== productB.id)
  const slug = productA && productB ? published[pairKey(productA.id, productB.id)] : undefined
  const target =
    productA && productB
      ? slug
        ? marketPath(market, `/compare/${slug}/`)
        : buildHref(productA.id, productB.id, market)
      : null

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (target) router.push(target)
  }

  return (
    <form
      onSubmit={submit}
      className={compact ? 'mt-4 flex flex-col gap-2.5' : 'card mt-6 grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end sm:p-5'}
      aria-label="Compare any two products"
    >
      <label className="grid gap-1.5 text-meta font-medium text-ink-2">
        First product
        <select
          value={idA}
          onChange={(e) => chooseA(e.target.value)}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-body text-ink"
        >
          <option value="">Choose…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.priceText}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-meta font-medium text-ink-2">
        Second product
        <select
          value={idB}
          onChange={(e) => setIdB(e.target.value)}
          disabled={!productA}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-body text-ink disabled:opacity-50"
        >
          <option value="">{productA ? `Another ${productA.subLabel.toLowerCase()}…` : 'Pick the first product…'}</option>
          {optionsB.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.priceText}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-1.5">
        <button
          type="submit"
          disabled={!ready}
          className="rounded-lg bg-accent px-5 py-2.5 text-body font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          Compare
        </button>
        {ready && (
          <p className="num text-label text-ink-3" aria-live="polite">
            {slug ? 'Published breakdown' : 'Custom comparison, scored instantly'}
          </p>
        )}
      </div>
    </form>
  )
}
