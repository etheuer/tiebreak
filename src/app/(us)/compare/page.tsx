import { CompareHubPage, generateHubMetadata } from '@/views/compare-hub'

export function generateMetadata() {
  return generateHubMetadata('us')
}

export default function Page() {
  return <CompareHubPage market="us" />
}
