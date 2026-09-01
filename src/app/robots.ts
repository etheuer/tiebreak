import type { MetadataRoute } from 'next'
import { absUrl } from '@/lib/site'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/_next/'] },
      { userAgent: ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Amazonbot', 'Bingbot'], allow: '/' },
    ],
    sitemap: absUrl('/sitemap.xml'),
    host: absUrl('/').replace(/\/$/, ''),
  }
}
