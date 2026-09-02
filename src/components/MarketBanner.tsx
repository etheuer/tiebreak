'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  MARKETS,
  marketPath,
  siblingMarket,
  usPathOf,
  type MarketId,
} from '@/lib/markets'

const STORAGE_KEY = 'tiebreak:market'

function publishedInUk(
  usPath: string,
  ukProductIds: Set<string>,
  ukCompareSlugs: Set<string>,
  ukCategoryIds: Set<string>
): boolean {
  if (usPath === '/') return ukProductIds.size > 0
  if (usPath === '/compare/') return ukCompareSlugs.size > 0
  const product = usPath.match(/^\/product\/[^/]+\/([^/]+)\/$/)
  if (product) return ukProductIds.has(product[1])
  const compare = usPath.match(/^\/compare\/([^/]+)\/$/)
  if (compare) return ukCompareSlugs.has(compare[1])
  const category = usPath.match(/^\/category\/([^/]+)\/$/)
  if (category) return ukCategoryIds.has(category[1])
  return false
}

export function MarketBanner({
  market,
  ukProductIds,
  ukCompareSlugs,
  ukCategoryIds,
}: {
  market: MarketId
  ukProductIds: string[]
  ukCompareSlugs: string[]
  ukCategoryIds: string[]
}) {
  const pathname = usePathname() || '/'
  const [remembered, setRemembered] = useState<MarketId | null>(null)
  const usPath = usPathOf(pathname)
  const other = siblingMarket(market)
  const ukProducts = new Set(ukProductIds)
  const ukCompares = new Set(ukCompareSlugs)
  const ukCategories = new Set(ukCategoryIds)

  const otherHref =
    other === 'us'
      ? marketPath('us', usPath)
      : publishedInUk(usPath, ukProducts, ukCompares, ukCategories)
        ? marketPath('uk', usPath)
        : null
  const otherHome = marketPath(other, '/')

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === 'us' || stored === 'uk') setRemembered(stored)
    } catch {
      // ignore
    }
  }, [])

  function remember(next: MarketId) {
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
    setRemembered(next)
  }

  const here = MARKETS[market].label
  const there = MARKETS[other].label
  const storedMismatch = remembered && remembered !== market

  return (
    <div className="border-b border-line bg-surface-2">
      <div className="shell flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-[12.5px] text-ink-2">
        <p>
          You are on the {here} site.
          {otherHref ? (
            <>
              {' '}
              <Link
                href={otherHref}
                className="font-semibold text-ink underline-offset-2 hover:underline"
                onClick={() => remember(other)}
              >
                See {there} prices and units
              </Link>
            </>
          ) : (
            <>
              {' '}
              This page is listed for the {here} only.{' '}
              <Link
                href={otherHome}
                className="font-semibold text-ink underline-offset-2 hover:underline"
                onClick={() => remember(other)}
              >
                Open the {there} home
              </Link>
            </>
          )}
        </p>
        {storedMismatch ? (
          <p>
            Continue on the {MARKETS[remembered].label} site →{' '}
            <Link
              href={remembered === 'uk' ? otherHref ?? otherHome : marketPath('us', usPath)}
              className="font-semibold text-ink underline-offset-2 hover:underline"
            >
              switch
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  )
}
