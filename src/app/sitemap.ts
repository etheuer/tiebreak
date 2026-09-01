import type { MetadataRoute } from 'next'
import { getCategories, getComparisons, getProducts } from '@/lib/data'
import { compareHref, productHref } from '@/lib/nav'
import { absUrl } from '@/lib/site'

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, comparisons, categories] = await Promise.all([getProducts(), getComparisons(), getCategories()])
  const lastModified = new Date()
  return [
    { url: absUrl('/'), lastModified, priority: 1 },
    { url: absUrl('/compare/'), lastModified, priority: 0.9 },          // hub from T8
    ...categories.map((c) => ({ url: absUrl(`/category/${c.id}/`), lastModified, priority: 0.8 })),
    ...comparisons.map((c) => ({ url: absUrl(compareHref(c)), lastModified, priority: 0.8 })),
    ...products.map((p) => ({ url: absUrl(productHref(p)), lastModified, priority: 0.6 })),
  ]
}
