import { CompareBuildPage, buildMetadata } from '@/views/compare-build'

export function generateMetadata() {
  return buildMetadata('uk')
}

export default function Page() {
  return <CompareBuildPage market="uk" />
}
