import { CompareHubPage, generateHubMetadata } from '@/views/compare-hub'

export function generateMetadata() {
  return generateHubMetadata('uk')
}

export default function Page() {
  return <CompareHubPage market="uk" />
}
