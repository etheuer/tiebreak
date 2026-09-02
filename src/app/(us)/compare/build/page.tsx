import { CompareBuildPage, buildMetadata } from '@/views/compare-build'

export function generateMetadata() {
  return buildMetadata('us')
}

export default function Page() {
  return <CompareBuildPage market="us" />
}
