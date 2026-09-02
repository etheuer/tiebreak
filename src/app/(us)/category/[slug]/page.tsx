import {
  CategoryListing,
  generateMetadataForMarket,
  generateStaticParamsForMarket,
} from '@/views/category-page'

export function generateStaticParams() {
  return generateStaticParamsForMarket('us')
}

export function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  return generateMetadataForMarket(props, 'us')
}

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return <CategoryListing {...props} market="us" />
}
