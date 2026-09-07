import { EnergyStarLanding, energyStarMetadata } from '@/views/energy-star-page'

export const metadata = energyStarMetadata(
  '/energy-star/',
  'ENERGY STAR® certified air cleaners & TVs',
  'Clinchmark helps compare ENERGY STAR certified room air cleaners and televisions. Reciprocal links to energystar.gov Product Finders and matched certified models.'
)

export default function EnergyStarPage() {
  return <EnergyStarLanding />
}
