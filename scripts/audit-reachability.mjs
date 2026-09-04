#!/usr/bin/env node
/**
 * Reachability sweep — checks every product's officialSource URL.
 * Returns HTTP status, final URL (after redirects), and a simple body sanity check.
 * Notes anti-bot blocks (Cloudflare/Akamai) so we don't mistake them for missing data.
 *
 * Usage:
 *   node scripts/audit-reachability.mjs            # report only (exit 0)
 *   node scripts/audit-reachability.mjs --strict   # exit 1 on any dead URL or anti-bot block
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const data = JSON.parse(readFileSync(path.join(root, 'src/data/products.json'), 'utf8'))
const products = data.products

const strict = process.argv.includes('--strict')

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const ANTI_BOT_MARKERS = [
  'cf-mitigated',
  'challenge-platform',
  'Verifying you are human',
  'Checking your browser before accessing',
  'cdn-cgi/challenge',
  'akamai',
  'Please enable JavaScript and cookies',
  'access denied',
  'Request Rejected',
  'Pardon Our Interruption',
  'PerimeterX',
  'Perimeter X',
]

function looksLikeAntiBot(html) {
  if (!html) return false
  const lower = html.toLowerCase()
  return ANTI_BOT_MARKERS.some(m => lower.includes(m.toLowerCase()))
}

async function check(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    })
    const finalUrl = res.url
    const status = res.status
    let html = ''
    try {
      html = (await res.text()).slice(0, 60000)
    } catch {}
    const ct = res.headers.get('content-type') || ''
    const blocked = looksLikeAntiBot(html)
    return {
      status,
      finalUrl: finalUrl === url ? null : finalUrl,
      contentType: ct,
      antiBot: blocked,
      bytes: html.length,
    }
  } catch (e) {
    return { status: 0, error: String(e.message || e).slice(0, 140) }
  }
}

const concurrency = 6
let i = 0
const results = []
async function worker() {
  while (i < products.length) {
    const myIdx = i++
    const p = products[myIdx]
    if (!p.officialSource?.url) {
      results[myIdx] = { id: p.id, status: 'no-url' }
      continue
    }
    const r = await check(p.officialSource.url)
    results[myIdx] = { id: p.id, name: p.name, brand: p.brand, subcategory: p.subcategory, url: p.officialSource.url, ...r }
    process.stdout.write(`  ${results.filter(Boolean).length}/${products.length}\r`)
  }
}
await Promise.all(Array.from({ length: concurrency }, worker))

// Summary
const ok = results.filter(r => r.status >= 200 && r.status < 400 && !r.antiBot)
const blocked = results.filter(r => r.status >= 200 && r.antiBot)
const redirected = results.filter(r => r.finalUrl)
const failed = results.filter(r => r.status === 0 || r.status >= 400)

console.log('\nReachability summary:')
console.log(`  ok            ${ok.length}`)
console.log(`  anti-bot page ${blocked.length}`)
console.log(`  http error    ${failed.length}`)
console.log(`  redirected    ${redirected.length}`)

console.log('\nBy brand (ok / total):')
const byBrand = {}
for (const r of results) {
  if (!byBrand[r.brand]) byBrand[r.brand] = { ok: 0, total: 0, blocked: 0, fail: 0 }
  byBrand[r.brand].total++
  if (r.status >= 200 && r.status < 400 && !r.antiBot) byBrand[r.brand].ok++
  else if (r.antiBot) byBrand[r.brand].blocked++
  else byBrand[r.brand].fail++
}
for (const [b, v] of Object.entries(byBrand).sort((a, b) => b[1].total - a[1].total)) {
  console.log(`  ${b.padEnd(18)} ${String(v.ok).padStart(3)}/${String(v.total).padStart(3)} ok, ${v.blocked} blocked, ${v.fail} fail`)
}

console.log('\nFailures:')
for (const r of failed) console.log(`  [${r.status}] ${r.id} ${r.brand} ${r.url}`)
console.log('\nAnti-bot pages:')
for (const r of blocked) console.log(`  ${r.id} ${r.brand} ${r.url}`)

console.log('\nRedirects:')
for (const r of redirected) console.log(`  ${r.id} → ${r.finalUrl}`)

writeFileSync('VERIFICATION-REACHABILITY.json', JSON.stringify(results, null, 2))
console.log('\nWrote VERIFICATION-REACHABILITY.json')

if (strict && (failed.length > 0 || blocked.length > 0)) {
  console.log(`\n\u26a0\ufe0f  --strict: ${failed.length + blocked.length} URL(s) unreachable or blocked`)
  process.exit(1)
}