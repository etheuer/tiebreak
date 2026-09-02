import type { Product } from '@/lib/data'
import { fieldOrigin, mergeCatalogs, type SpecField, type SpecGroup, type SpecOrigin } from '@/data/spec-catalog'

export type SpecRow = {
  key: string
  label: string
  a: string
  b: string
  differs: boolean
  origin: SpecOrigin
}

export type RenderedGroup = {
  id: string
  label: string
  rows: SpecRow[]
}

const EMPTY = '—'

export function specValue(product: Product, key: string): string {
  const value = product.specifications[key]
  return value && value.trim() ? value : EMPTY
}

export function highlightFields(groups: SpecGroup[]): SpecField[] {
  return groups.flatMap((group) => group.fields.filter((field) => field.highlight))
}

export function buildComparisonGroups(productA: Product, productB: Product): RenderedGroup[] {
  const groups = mergeCatalogs(productA.subcategory, productB.subcategory)
  return groups.map((group) => ({
    id: group.id,
    label: group.label,
    rows: group.fields.map((field) => {
      const a = specValue(productA, field.key)
      const b = specValue(productB, field.key)
      return {
        key: field.key,
        label: field.label,
        a,
        b,
        differs: a !== b && a !== EMPTY && b !== EMPTY,
        origin: fieldOrigin(field),
      }
    }),
  }))
}

export function buildProductGroups(product: Product): RenderedGroup[] {
  return buildComparisonGroups(product, product).map((group) => ({
    ...group,
    rows: group.rows.map((row) => ({ ...row, differs: false })),
  }))
}
