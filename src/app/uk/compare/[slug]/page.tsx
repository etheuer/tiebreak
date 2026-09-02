import {
  CompareMatchup,
  generateMetadataForMarket,
  generateStaticParamsForMarket,
} from '@/views/compare-matchup'

export function generateStaticParams() {
  return generateStaticParamsForMarket('uk')
}

export function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  return generateMetadataForMarket(props, 'uk')
}

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return <CompareMatchup {...props} market="uk" />
}
