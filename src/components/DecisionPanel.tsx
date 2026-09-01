'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Product } from '@/lib/data'
import type { UseCase } from '@/data/use-cases'
import { subLabel } from '@/lib/nav'
import {
  buildAnswer,
  lensRows,
  scoreLens,
  shortName,
  type DealBreakerCheck,
  type LensRow,
} from '@/lib/decision'

const OVERALL = 'overall'
const lensKey = (sub: string) => `tiebreak:for:${sub}`
const mattersKey = (sub: string) => `tiebreak:deal-breakers:${sub}`

function hashLens(): string | null {
  const match = window.location.hash.match(/(?:^#|&)for=([a-z0-9-]+)/i)
  return match ? match[1] : null
}

function clipValue(value: string, max = 40): string {
  const head = value.split(' (')[0].trim()
  const text = head.length >= 6 ? head : value.trim()
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

function LensBar({ aWins, bWins }: { aWins: number; bWins: number }) {
  const total = Math.max(1, aWins + bWins)
  return (
    <div className="flex h-1.5 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={`${aWins} to ${bWins}`}>
      <span style={{ width: `${(aWins / total) * 100}%`, background: 'var(--accent)' }} />
      <span style={{ width: `${(bWins / total) * 100}%`, background: 'var(--rival)' }} />
    </div>
  )
}

/**
 * Client island for the three decision aids: a "buying for" lens that
 * re-scores wins, a deal-breaker checklist that can rule a product out, and a
 * straight answer that cites the numbers. `children` (the overall win summary)
 * renders between the decision card and the lens-aware "at a glance" grid.
 * Lens state lives in the URL hash (#for=gaming) so links stay static.
 */
export function DecisionPanel({
  productA,
  productB,
  rows,
  useCases,
  checks,
  children,
}: {
  productA: Product
  productB: Product
  rows: LensRow[]
  useCases: UseCase[]
  checks: DealBreakerCheck[]
  children?: ReactNode
}) {
  const sub = productA.subcategory
  const [lensId, setLensId] = useState<string>(OVERALL)
  const [matters, setMatters] = useState<string[]>([])

  useEffect(() => {
    const valid = new Set(useCases.map((useCase) => useCase.id))
    const fromHash = hashLens()
    if (fromHash && valid.has(fromHash)) {
      setLensId(fromHash)
    } else {
      try {
        const stored = window.localStorage.getItem(lensKey(sub))
        if (stored && valid.has(stored)) setLensId(stored)
      } catch {
        // storage blocked: overall is fine
      }
    }
    try {
      const raw = window.localStorage.getItem(mattersKey(sub))
      const parsed: unknown = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) setMatters(parsed.filter((id): id is string => typeof id === 'string'))
    } catch {
      // ignore
    }

    function onHash() {
      const next = hashLens()
      if (next && valid.has(next)) setLensId(next)
      else if (!next) setLensId(OVERALL)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [sub, useCases])

  function chooseLens(id: string) {
    setLensId(id)
    const url = `${window.location.pathname}${window.location.search}${id === OVERALL ? '' : `#for=${id}`}`
    window.history.replaceState(null, '', url)
    try {
      window.localStorage.setItem(lensKey(sub), id)
    } catch {
      // ignore
    }
  }

  function toggleMatters(id: string) {
    setMatters((prev) => {
      const next = prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]
      try {
        window.localStorage.setItem(mattersKey(sub), JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const useCase = useMemo(() => useCases.find((entry) => entry.id === lensId) ?? null, [useCases, lensId])
  // A lens scores only its own keys; Overall scores every row and shows the highlight rows.
  const focusRows = useMemo(() => lensRows(rows, useCase), [rows, useCase])
  const scoreRows = useMemo(() => (useCase ? focusRows : rows), [useCase, focusRows, rows])
  const score = useMemo(() => scoreLens(scoreRows), [scoreRows])
  const focusDiffering = useMemo(() => focusRows.filter((row) => row.differs).length, [focusRows])
  const mattersSet = useMemo(() => new Set(matters), [matters])
  const answer = useMemo(
    () => buildAnswer({ productA, productB, useCase, rows: scoreRows, checks, matters: mattersSet }),
    [productA, productB, useCase, scoreRows, checks, mattersSet]
  )

  const names = { a: shortName(productA), b: shortName(productB) }
  const pickTint = answer.pick === 'a' ? 'var(--accent)' : answer.pick === 'b' ? 'var(--rival)' : 'var(--line-2)'
  const thing = subLabel(sub).toLowerCase().replace(/s$/, '')
  const eliminated = new Set<'a' | 'b'>()
  for (const check of checks) {
    if (!mattersSet.has(check.id)) continue
    if (check.a === 'trips' && check.b !== 'trips') eliminated.add('a')
    if (check.b === 'trips' && check.a !== 'trips') eliminated.add('b')
  }

  return (
    <>
      <section className="card mt-5 overflow-hidden" aria-labelledby="decide">
        {/* Lens picker */}
        <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:px-5 md:flex-row md:items-center md:gap-4">
          <p id="decide" className="eyebrow shrink-0">
            Buying for
          </p>
          <div className="scroll-x -mx-1 flex gap-1.5 px-1 py-0.5" role="radiogroup" aria-label="What are you buying this for">
            <button
              type="button"
              role="radio"
              aria-checked={lensId === OVERALL}
              data-on={lensId === OVERALL}
              onClick={() => chooseLens(OVERALL)}
              className="chip shrink-0"
            >
              Overall
            </button>
            {useCases.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="radio"
                aria-checked={lensId === entry.id}
                data-on={lensId === entry.id}
                onClick={() => chooseLens(entry.id)}
                className="chip shrink-0"
              >
                {entry.label}
              </button>
            ))}
          </div>
          <p className="text-[12.5px] leading-snug text-ink-3 md:ml-auto md:max-w-[38%] md:text-right">
            {useCase ? useCase.job : `Every rankable spec counts once. Pick a lens to score only what matters for your ${thing}.`}
          </p>
        </div>

        <div className="grid md:grid-cols-[1.15fr_1fr]">
          {/* Straight answer */}
          <div className="p-4 sm:p-5" style={{ borderLeft: `3px solid ${pickTint}` }}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="eyebrow">Straight answer</p>
              {score.scored > 0 ? (
                <p className="num text-[12px] text-ink-3">
                  {useCase ? useCase.label : 'Overall'}: {score.aWins} to {score.bWins}
                </p>
              ) : null}
            </div>
            <p className="mt-2 text-[17px] font-semibold leading-snug tracking-[-0.01em] sm:text-[18.5px]" aria-live="polite">
              {answer.headline}
            </p>
            <ul className="mt-3 grid gap-1.5">
              {answer.reasons.map((reason) => (
                <li key={reason} className="flex gap-2 text-[13.5px] leading-snug text-ink-2">
                  <span aria-hidden className="text-ink-3">
                    –
                  </span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
            {answer.caveat && (
              <p className="mt-3 rounded-md bg-surface-2 px-3 py-2 text-[12.5px] leading-snug text-ink-2">
                {answer.caveat}
              </p>
            )}

            <div className="mt-4">
              <LensBar aWins={score.aWins} bWins={score.bWins} />
              <div className="mt-1.5 flex items-center justify-between gap-3 text-[12px]">
                <span className="num font-semibold" style={{ color: 'var(--accent-2)' }}>
                  {score.aWins} {names.a}
                </span>
                <span className="text-ink-3">
                  {score.scored > 0
                    ? `${score.scored} rankable of ${scoreRows.length} ${useCase ? `${useCase.label.toLowerCase()} ` : ''}specs`
                    : 'nothing here can be ranked honestly'}
                </span>
                <span className="num font-semibold" style={{ color: 'var(--rival-2)' }}>
                  {names.b} {score.bWins}
                </span>
              </div>
            </div>
          </div>

          {/* Deal-breakers */}
          <div className="border-t border-line p-4 sm:p-5 md:border-l md:border-t-0">
            <div className="flex items-baseline justify-between gap-3">
              <p className="eyebrow">Deal-breakers</p>
              {checks.length > 0 && (
                <p className="text-[11.5px] text-ink-3">tick what would make you walk away</p>
              )}
            </div>

            {checks.length === 0 ? (
              <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
                Nothing on either sheet trips a common {thing} deal-breaker. The decision is about degree, not
                missing features.
              </p>
            ) : (
              <ul className="mt-2 grid">
                {checks.map((check) => {
                  const on = mattersSet.has(check.id)
                  return (
                    <li
                      key={check.id}
                      className="db-row -mx-2 rounded-md px-2 py-2"
                      data-on={on}
                    >
                      <div className="flex gap-2.5">
                        <input
                          id={`db-${check.id}`}
                          type="checkbox"
                          className="db-check mt-[3px]"
                          checked={on}
                          onChange={() => toggleMatters(check.id)}
                          aria-describedby={`db-${check.id}-why`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <label htmlFor={`db-${check.id}`} className="cursor-pointer text-[13.5px] font-semibold leading-snug">
                              {check.label}
                            </label>
                            <a href={`#${check.group}`} className="link-underline shrink-0 text-[11px] text-ink-3">
                              row
                            </a>
                          </div>
                          <p id={`db-${check.id}-why`} className="text-[12px] leading-snug text-ink-3">
                            {check.why}
                          </p>
                          <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
                            {(['a', 'b'] as const).map((side) => {
                              const trips = check[side] === 'trips'
                              const value = side === 'a' ? check.aValue : check.bValue
                              const out = on && trips && eliminated.has(side)
                              return (
                                <span
                                  key={side}
                                  className={`db-side ${trips ? 'db-trips' : 'db-clear'}`}
                                  data-out={out}
                                  title={value}
                                >
                                  <span aria-hidden className="shrink-0" style={{ color: trips ? undefined : 'var(--accent)' }}>
                                    {trips ? '✕' : '✓'}
                                  </span>
                                  <span className="sr-only">{trips ? 'Trips:' : 'Clear:'}</span>
                                  <span className="truncate">
                                    {names[side]}
                                    <span className="text-ink-3"> · {clipValue(value)}</span>
                                  </span>
                                  {out && <span className="db-out">out</span>}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      {children}

      {/* Lens-aware at a glance */}
      {focusRows.length > 0 && (
        <section className="mt-10" aria-labelledby="glance">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="glance" className="display text-[20px] sm:text-[23px]">
                {useCase ? `${useCase.label}: the specs that decide it` : 'At a glance'}
              </h2>
              <p className="mt-1.5 text-[13.5px] text-ink-2">
                {useCase ? useCase.job : 'The handful of numbers that decide most purchases in this category.'}
              </p>
            </div>
            <p className="num text-[12.5px] text-ink-3">
              {focusDiffering} of {focusRows.length} differ
            </p>
          </div>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {focusRows.map((row) => (
              <div key={row.key} className="card overflow-hidden">
                <p className="flex items-baseline justify-between gap-2 border-b border-line px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                  <span>{row.label}</span>
                  {row.differs && !row.winner && (
                    <span className="num normal-case tracking-normal" title="Differs, but cannot be ranked honestly" aria-label="differs">
                      ≠
                    </span>
                  )}
                  {!row.differs && <span className="normal-case tracking-normal">same</span>}
                </p>
                <div className="grid grid-cols-2">
                  {(['a', 'b'] as const).map((side) => {
                    const value = side === 'a' ? row.a : row.b
                    const won = row.winner === side
                    return (
                      <div
                        key={side}
                        className={`${side === 'a' ? 'col-a' : 'col-b'} px-3.5 py-3 ${side === 'b' ? 'border-l border-line' : ''}`}
                      >
                        <p
                          className="text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                          style={{ color: side === 'a' ? 'var(--accent-2)' : 'var(--rival-2)' }}
                        >
                          {side === 'a' ? productA.brand : productB.brand}
                        </p>
                        <p
                          className={`mt-1 text-[13.5px] leading-snug ${
                            won ? (side === 'a' ? 'val-win-a' : 'val-win-b') : row.differs ? 'text-ink-2' : 'text-ink-3'
                          }`}
                        >
                          {won && (
                            <span className="win-flag" aria-hidden>
                              ▲
                            </span>
                          )}
                          {value}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
