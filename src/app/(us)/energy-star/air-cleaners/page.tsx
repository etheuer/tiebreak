import { EnergyStarLanding, energyStarMetadata } from '@/views/energy-star-page'

export const metadata = energyStarMetadata(
  '/energy-star/air-cleaners/',
  'ENERGY STAR® room air cleaners',
  'Clinchmark highlights ENERGY STAR certified room air cleaners. Compare matched models and open the official Product Finder.'
)

export default function EnergyStarAirCleanersPage() {
  return <EnergyStarLanding focus="air-cleaners" />
}
