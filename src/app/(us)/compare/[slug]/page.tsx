import {
  CompareMatchup,
  generateMetadataForMarket,
  generateStaticParamsForMarket,
} from '@/views/compare-matchup'

export function generateStaticParams() {
  return generateStaticParamsForMarket('us')
}

export function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  return generateMetadataForMarket(props, 'us')
}

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return <CompareMatchup {...props} market="us" />
}
