import { buildLlmsText } from '@/lib/llms'

export const dynamic = 'force-static'

export async function GET() {
  const text = await buildLlmsText('us')
  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
