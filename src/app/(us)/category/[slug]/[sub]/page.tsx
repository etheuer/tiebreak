import {
  generateMetadataForMarket,
  generateStaticParamsForMarket,
  SubcategoryListing,
} from '@/views/subcategory-page'

export function generateStaticParams() {
  return generateStaticParamsForMarket('us')
}

export function generateMetadata(props: { params: Promise<{ slug: string; sub: string }> }) {
  return generateMetadataForMarket(props, 'us')
}

export default function Page(props: { params: Promise<{ slug: string; sub: string }> }) {
  return <SubcategoryListing {...props} market="us" />
}
