import { homeMetadata, HomePage } from '@/views/home-page'

export function generateMetadata() {
  return homeMetadata('uk')
}

export default function Page() {
  return <HomePage market="uk" />
}
