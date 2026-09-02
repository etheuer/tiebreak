/** Keys whose magnitude is imperial/metric-sensitive. Others parse as a plain number. */
export type SpecDimension = 'mass' | 'length' | 'area' | 'volume' | 'airflow'

export type SpecUnitRule = {
  dimension: SpecDimension
  canonical: 'g' | 'mm' | 'm2' | 'L' | 'm3h'
}

export const SPEC_UNITS: Record<string, SpecUnitRule> = {
  weight: { dimension: 'mass', canonical: 'g' },
  thickness: { dimension: 'length', canonical: 'mm' },
  screen_size: { dimension: 'length', canonical: 'mm' },
  display_size: { dimension: 'length', canonical: 'mm' },
  coverage: { dimension: 'area', canonical: 'm2' },
  cadr: { dimension: 'airflow', canonical: 'm3h' },
  bin_capacity: { dimension: 'volume', canonical: 'L' },
}
