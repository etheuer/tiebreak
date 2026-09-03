'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { JumpEntry } from '@/lib/nav'
import { SITE_NAME } from '@/lib/site'
import { capture } from '@/lib/analytics'

const KIND_LABEL: Record<JumpEntry['kind'], string> = {
  compare: 'Matchup',
  product: 'Product',
  category: 'Category',
}

function Wordmark({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 shrink-0" aria-label={`${SITE_NAME} home`}>
      <span
        aria-hidden
        className="grid place-items-center rounded-md"
        style={{ width: 26, height: 26, background: 'var(--accent)' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
          <path d="M3 12.6 8.6 3.4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M7.4 12.6 13 3.4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" opacity="0.55" />
        </svg>
      </span>
      <span className="text-title font-bold tracking-[-0.03em] text-ink">{SITE_NAME}</span>
    </Link>
  )
}

export function SiteHeader({
  index,
  nav,
  homeHref = '/',
}: {
  index: JumpEntry[]
  nav: { label: string; href: string }[]
  homeHref?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const openSearch = useCallback((source: 'button' | 'slash' | 'mod_k') => {
    if (!open) capture('search_opened', { source })
    setOpen(true)
    setMenu(false)
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return index.filter((e) => e.kind === 'compare').slice(0, 6)
    const words = q.split(/\s+/)
    return index.filter((e) => words.every((w) => e.terms.includes(w))).slice(0, 8)
  }, [index, query])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setCursor(0)
  }, [])

  const go = useCallback(
    (entry: JumpEntry) => {
      capture('search_result_clicked', {
        kind: entry.kind,
        result_kind: entry.kind,
        query_length: query.trim().length,
      })
      close()
      setMenu(false)
      router.push(entry.href)
    },
    [close, query, router]
  )

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        openSearch('mod_k')
      } else if (event.key === '/' && !typing) {
        event.preventDefault()
        openSearch('slash')
      }
      if (event.key === 'Escape') {
        close()
        setMenu(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, openSearch])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    setCursor(0)
  }, [query])

  useEffect(() => {
    const q = query.trim()
    if (!open || !q) return
    const timer = window.setTimeout(() => {
      capture('search_performed', {
        query_length: q.length,
        result_count: results.length,
        has_results: results.length > 0,
      })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [open, query, results.length])

  function onSearchKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setCursor((c) => Math.min(c + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (event.key === 'Enter' && results[cursor]) {
      event.preventDefault()
      go(results[cursor])
    }
  }

  return (
    <header
      className="sticky top-0 z-50 border-b border-line"
      style={{ background: 'color-mix(in oklab, var(--bg) 88%, transparent)', backdropFilter: 'blur(10px)' }}
    >
      <div className="shell flex items-center gap-3" style={{ height: 'var(--header-h)' }}>
        <Wordmark href={homeHref} />

        <nav className="ml-3 hidden items-center gap-1 md:flex" aria-label="Categories">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2.5 py-1.5 text-cell font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => openSearch('button')}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-meta text-ink-3 transition-colors hover:border-line-2 hover:text-ink-2 sm:w-[248px] md:w-auto lg:w-[292px]"
            aria-label="Search products and matchups"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="7" cy="7" r="4.4" stroke="currentColor" strokeWidth="1.5" />
              <path d="m10.4 10.4 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="hidden whitespace-nowrap sm:inline md:hidden">Search products</span>
            <span className="hidden whitespace-nowrap lg:inline">Search products or matchups</span>
            <kbd className="num ml-auto hidden rounded border border-line px-1.5 py-0.5 text-badge sm:inline md:hidden lg:inline">
              /
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-2 md:hidden"
            aria-label="Menu"
            aria-expanded={menu}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path
                d={menu ? 'M4 4l8 8M12 4l-8 8' : 'M2.5 5h11M2.5 11h11'}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {menu && (
        <div className="border-t border-line bg-surface md:hidden">
          <div className="shell grid gap-1 py-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenu(false)}
                className="rounded-lg px-3 py-2.5 text-body font-medium text-ink hover:bg-surface-2"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-line pt-3">
              <p className="eyebrow mb-2 px-3">Popular matchups</p>
              {index
                .filter((e) => e.kind === 'compare')
                .slice(0, 4)
                .map((entry) => (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    onClick={() => setMenu(false)}
                    className="block rounded-lg px-3 py-2 text-body text-ink-2 hover:bg-surface-2 hover:text-ink"
                  >
                    {entry.label}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Search">
          <button
            type="button"
            aria-label="Close search"
            onClick={close}
            className="absolute inset-0 cursor-default"
            style={{ background: 'color-mix(in oklab, var(--ink) 32%, transparent)' }}
          />
          <div className="relative mx-auto mt-[12vh] w-[min(560px,calc(100%-24px))]">
            <div
              className="overflow-hidden rounded-xl border border-line bg-surface"
              style={{ boxShadow: 'var(--shadow-2)' }}
            >
              <div className="flex items-center gap-3 border-b border-line px-4">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="text-ink-3">
                  <circle cx="7" cy="7" r="4.4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="m10.4 10.4 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onSearchKey}
                  placeholder="Try iPhone, OLED, vacuum"
                  className="w-full bg-transparent py-3.5 text-body text-ink outline-none placeholder:text-ink-3"
                />
              </div>
              <ul className="max-h-[52vh] overflow-y-auto py-1.5">
                {results.length === 0 && (
                  <li className="px-4 py-6 text-center text-cell text-ink-3">
                    Nothing matches that yet.
                  </li>
                )}
                {results.map((entry, i) => (
                  <li key={entry.href}>
                    <button
                      type="button"
                      onMouseEnter={() => setCursor(i)}
                      onClick={() => go(entry)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
                      style={{ background: i === cursor ? 'var(--surface-2)' : 'transparent' }}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body font-medium text-ink">{entry.label}</span>
                        <span className="block truncate text-label text-ink-3">{entry.meta}</span>
                      </span>
                      <span className="eyebrow shrink-0">{KIND_LABEL[entry.kind]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
