'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import type { Product } from '@/lib/data'
import type { ScoredGroup, ScoredRow, Side } from '@/lib/verdict'
import { ProductMark } from '@/components/ProductMark'
import { priceShort, productHref } from '@/lib/nav'
import { shortName } from '@/lib/decision'
import { displaySpec } from '@/lib/format'
import type { MarketId } from '@/lib/markets'
import { originNote } from '@/data/spec-catalog'

const STORAGE_KEY = 'tiebreak:hide-identical'

function Cell({ row, side, market }: { row: ScoredRow; side: Side; market: MarketId }) {
  const raw = side === 'a' ? row.a : row.b
  const value = displaySpec(raw, row.key, market)
  const won = row.winner === side
  const lost = row.winner !== null && !won
  const cls = won ? (side === 'a' ? 'val-win-a' : 'val-win-b') : row.differs || lost ? 'val-diff' : 'val-same'

  return (
    <td className={side === 'a' ? 'col-a' : 'col-b'}>
      <span className={cls}>
        {won && (
          <span className="win-flag" aria-hidden>
            ▲
          </span>
        )}
        {value}
      </span>
      {won && <span className="sr-only"> (wins this row: {row.reason})</span>}
    </td>
  )
}

function LeadBadge({ group }: { group: ScoredGroup }) {
  if (!group.leader) {
    return <span className="text-label text-ink-3">{group.diffCount} differences</span>
  }
  const tone = group.leader === 'a' ? 'var(--accent-2)' : 'var(--rival-2)'
  const score = group.leader === 'a' ? `${group.aWins}-${group.bWins}` : `${group.bWins}-${group.aWins}`
  return (
    <span className="num text-label font-semibold" style={{ color: tone }}>
      leads {score}
    </span>
  )
}

export function SpecTables({
  productA,
  productB,
  groups,
  aWins,
  bWins,
  market = 'us',
}: {
  productA: Product
  productB: Product
  groups: ScoredGroup[]
  aWins: number
  bWins: number
  market?: MarketId
}) {
  const [hideSame, setHideSame] = useState(false)
  const [focus, setFocus] = useState<'both' | 'a' | 'b'>('both')
  const [active, setActive] = useState<string>(groups[0]?.id ?? '')

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === '1') setHideSame(true)
    } catch {
      // private mode or blocked storage: the default is fine
    }
  }, [])

  function toggleHideSame() {
    setHideSame((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // ignore
      }
      return next
    })
  }

  const visible = useMemo(() => {
    return groups
      .map((group) => ({
        ...group,
        rows: hideSame ? group.rows.filter((row) => row.differs) : group.rows,
      }))
      .filter((group) => group.rows.length > 0)
  }, [groups, hideSame])

  const totals = useMemo(() => {
    const total = groups.reduce((sum, group) => sum + group.rows.length, 0)
    const differing = groups.reduce((sum, group) => sum + group.diffCount, 0)
    return { total, differing }
  }, [groups])

  const pauseSpy = useRef(false)
  useEffect(() => {
    const headings = visible
      .map((group) => document.getElementById(group.id))
      .filter((el): el is HTMLElement => Boolean(el))
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (pauseSpy.current) return
        const hit = entries.filter((entry) => entry.isIntersecting).sort((x, y) => x.boundingClientRect.top - y.boundingClientRect.top)[0]
        if (hit) setActive(hit.target.id)
      },
      { rootMargin: '-170px 0px -60% 0px', threshold: 0 }
    )
    headings.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [visible])

  const focusClass = focus === 'a' ? 'focus-a' : focus === 'b' ? 'focus-b' : ''

  return (
    <section id="specs" className={focusClass} aria-label="Full specification comparison">
      {/* Persistent column headings, Baymard comparison-table finding #3 */}
      <div
        className="sticky z-30 border-y border-line"
        style={{
          top: 'var(--header-h)',
          background: 'color-mix(in oklab, var(--surface) 94%, transparent)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="shell shell-wide">
          <div className="cmp-grid items-stretch">
            <div className="flex items-center px-2.5 py-2 sm:px-4">
              <button
                type="button"
                onClick={toggleHideSame}
                className="chip"
                data-on={hideSame}
                aria-pressed={hideSame}
                title="Hide rows where both products are identical"
              >
                <span className="num">≠</span>
                <span className="hidden sm:inline">Differences only</span>
                <span className="sm:hidden">Diff</span>
              </button>
            </div>

            {[
              { side: 'a' as const, product: productA, wins: aWins },
              { side: 'b' as const, product: productB, wins: bWins },
            ].map(({ side, product, wins }) => (
              <div
                key={side}
                className={`${side === 'a' ? 'col-a' : 'col-b'} flex items-center gap-2 border-l border-line px-2.5 py-2 sm:gap-2.5 sm:px-4`}
              >
                <ProductMark product={product} size="xs" tone={side} className="hidden sm:grid" />
                <span className="min-w-0">
                  <Link
                    href={productHref(product, market)}
                    className="block truncate text-cell font-semibold leading-tight hover:underline"
                    title={`View ${product.name} spec sheet`}
                  >
                    {shortName(product)}
                  </Link>
                  <span className="num block text-label leading-tight text-ink-3">
                    {priceShort(product, market)}
                    <span
                      className="ml-1.5 font-semibold"
                      style={{ color: side === 'a' ? 'var(--accent-2)' : 'var(--rival-2)' }}
                    >
                      {wins} {wins === 1 ? 'win' : 'wins'}
                    </span>
                  </span>
                </span>
              </div>
            ))}
          </div>

          {/* Jump nav, desktop */}
          <div className="scroll-x hidden gap-1.5 border-t border-line py-1.5 md:flex">
            {visible.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                onClick={() => {
                  setActive(group.id)
                  pauseSpy.current = true
                  setTimeout(() => { pauseSpy.current = false }, 800)
                }}
                className="shrink-0 rounded-md px-2.5 py-1 text-meta font-medium transition-colors"
                style={{
                  background: active === group.id ? 'var(--surface-3)' : 'transparent',
                  color: active === group.id ? 'var(--ink)' : 'var(--ink-3)',
                }}
              >
                {group.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="shell shell-wide">
        {/* Controls, mobile */}
        <div className="flex items-center gap-2 py-3 md:hidden">
          <div className="flex min-w-0 rounded-lg border border-line p-0.5 text-label">
            {(['a', 'both', 'b'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFocus(mode)}
                className="mobile-switch-btn truncate rounded-md px-2.5 py-1 font-medium transition-colors"
                style={{
                  background: focus === mode ? 'var(--surface-3)' : 'transparent',
                  color: focus === mode ? 'var(--ink)' : 'var(--ink-3)',
                }}
                aria-pressed={focus === mode}
              >
                {mode === 'a' ? shortName(productA).split(' ')[0] : mode === 'b' ? shortName(productB).split(' ')[0] : 'Both'}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor="jump-select">
            Jump to a section
          </label>
          <select
            id="jump-select"
            className="ml-auto min-w-0 shrink rounded-lg border border-line bg-surface px-2 py-1.5 text-meta text-ink-2"
            value=""
            onChange={(event) => {
              const id = event.target.value
              if (id) {
                setActive(id)
                pauseSpy.current = true
                setTimeout(() => { pauseSpy.current = false }, 800)
                document.getElementById(id)?.scrollIntoView({ block: 'start' })
              }
            }}
          >
            <option value="">Jump to…</option>
            {visible.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label}
              </option>
            ))}
          </select>
        </div>

        <p className="hidden py-3 text-meta text-ink-3 md:block">
          <span className="num">{totals.differing}</span> of{' '}
          <span className="num">{totals.total}</span> attributes differ.
          {hideSame ? ' Showing differences only.' : ' Identical rows are dimmed.'}
        </p>

        {visible.map((group) => (
          <div key={group.id} className="mb-8 scroll-mt-[168px]" id={group.id}>
            <div className="flex items-baseline justify-between gap-3 border-b-2 border-line pb-2">
              <h3 className="text-body font-semibold tracking-[-0.01em]">{group.label}</h3>
              <LeadBadge group={group} />
            </div>
            <table className="spec-table">
              <caption className="sr-only">
                {group.label} specifications. Middle column is {productA.name}, right column is{' '}
                {productB.name}.
              </caption>
              <colgroup>
                <col className="col-label" />
              </colgroup>
              <tbody>
                {group.rows.map((row) => (
                  <tr key={row.key}>
                    <th scope="row" className="row-label">
                      {row.label}
                      {originNote(row.origin) ? (
                        <span className="mt-0.5 block text-micro font-normal normal-case tracking-normal text-ink-3">
                          {originNote(row.origin)}
                        </span>
                      ) : null}
                      {row.differs && !row.winner && (
                        <span className="ml-1 text-ink-3" aria-hidden>
                          ≠
                        </span>
                      )}
                    </th>
                    <Cell row={row} side="a" market={market} />
                    <Cell row={row} side="b" market={market} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {visible.length === 0 && (
          <p className="card p-8 text-center text-body text-ink-2">
            These two match on every attribute we track. Turn off differences only to see the full
            sheet.
          </p>
        )}
      </div>
    </section>
  )
}
