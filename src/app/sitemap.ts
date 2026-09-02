import type { MetadataRoute } from 'next'
import { getCategories, getComparisons, getProducts } from '@/lib/data'
import { categoryHref, compareHref, hubHref, productHref } from '@/lib/nav'
import { marketPath } from '@/lib/markets'
import { absUrl } from '@/lib/site'

export const dynamic = 'force-static'

function languages(usPath: string, includeUk: boolean): MetadataRoute.Sitemap[number]['alternates'] {
  const langs: Record<string, string> = {
    'en-US': absUrl(usPath),
    'x-default': absUrl(usPath),
  }
  if (includeUk) langs['en-GB'] = absUrl(marketPath('uk', usPath))
  return { languages: langs }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [usProducts, ukProducts, usComparisons, ukComparisons, usCategories, ukCategories] =
    await Promise.all([
      getProducts('us'),
      getProducts('uk'),
      getComparisons('us'),
      getComparisons('uk'),
      getCategories('us'),
      getCategories('uk'),
    ])
  const lastModified = new Date()
  const ukProductIds = new Set(ukProducts.map((product) => product.id))
  const ukCompareSlugs = new Set(
    ukComparisons.map((comparison) => `${comparison.productA}-vs-${comparison.productB}`)
  )
  const ukCategoryIds = new Set(ukCategories.map((category) => category.id))

  const hasUkHome = ukProductIds.size > 0
  const hasUkHub = ukCompareSlugs.size > 0

  const entries: MetadataRoute.Sitemap = [
    {
      url: absUrl('/'),
      lastModified,
      priority: 1,
      alternates: languages('/', hasUkHome),
    },
  ]
  if (hasUkHome) {
    entries.push({
      url: absUrl('/uk/'),
      lastModified,
      priority: 1,
      alternates: languages('/', true),
    })
  }
  entries.push({
    url: absUrl(hubHref('us')),
    lastModified,
    priority: 0.9,
    alternates: languages('/compare/', hasUkHub),
  })
  if (hasUkHub) {
    entries.push({
      url: absUrl(hubHref('uk')),
      lastModified,
      priority: 0.9,
      alternates: languages('/compare/', true),
    })
  }

  for (const category of usCategories) {
    const usPath = categoryHref(category.id)
    const includeUk = ukCategoryIds.has(category.id)
    entries.push({
      url: absUrl(usPath),
      lastModified,
      priority: 0.8,
      alternates: languages(usPath, includeUk),
    })
    if (includeUk) {
      entries.push({
        url: absUrl(categoryHref(category.id, 'uk')),
        lastModified,
        priority: 0.8,
        alternates: languages(usPath, true),
      })
    }
  }

  for (const comparison of usComparisons) {
    const usPath = compareHref(comparison)
    const slug = `${comparison.productA}-vs-${comparison.productB}`
    const includeUk = ukCompareSlugs.has(slug)
    entries.push({
      url: absUrl(usPath),
      lastModified,
      priority: 0.8,
      alternates: languages(usPath, includeUk),
    })
    if (includeUk) {
      entries.push({
        url: absUrl(compareHref(comparison, 'uk')),
        lastModified,
        priority: 0.8,
        alternates: languages(usPath, true),
      })
    }
  }

  for (const product of usProducts) {
    const usPath = productHref(product)
    const includeUk = ukProductIds.has(product.id)
    entries.push({
      url: absUrl(usPath),
      lastModified,
      priority: 0.6,
      alternates: languages(usPath, includeUk),
    })
    if (includeUk) {
      entries.push({
        url: absUrl(productHref(product, 'uk')),
        lastModified,
        priority: 0.6,
        alternates: languages(usPath, true),
      })
    }
  }

  return entries
}
