import { homeMetadata, HomePage } from '@/views/home-page'

export function generateMetadata() {
  return homeMetadata('us')
}

export default function Page() {
  return <HomePage market="us" />
}
