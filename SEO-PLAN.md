# Tiebreak SEO + answer-engine plan (80/20)

Audited 2026-09-01 by Claude Fable 5.1 against the source in `src/`, the static export in `.next-static/`, and the live dev server on http://localhost:4124. Implementer: agy. Do the **Do now** set (8 tasks) in order; everything under **Later** is optional.

Ground rules for the implementer: no `npx` (use `node_modules/.bin/…`), do not start a second dev server, do not edit `src/components/DecisionPanel.tsx`, `SpecTables.tsx`, or anything in `src/data/` (other agents own those), do not run `scripts/generate-static-pages.js` (stale, 3 products). New code must be server-side and pure; every pure helper you need already exists in `src/lib/verdict.ts` and `src/lib/decision.ts`.

## 1. Diagnosis

The content layer is already unusually good for crawlers: every one of the 164 exported routes (1 home, 3 category, 52 product, 105 compare) has a unique `<title>` and `<h1>`, breadcrumbs, consistent trailing-slash URLs, the "Straight answer", deal-breakers and all 10 spec tables are server-rendered into the static HTML, and the 404 page is `noindex`. What is missing is the entire discovery and citation layer: no `sitemap.xml`, `robots.txt` or `llms.txt` (all 404 live), no `metadataBase`, no canonical on any page, `og:title`/`og:description` are the site default on all 164 pages (the layout's `openGraph` object shadows page titles), no `og:url`/`og:image`, JSON-LD is thin (compare pages emit an `ItemList` whose items have no `url`; product pages emit `Product` with `brand` as a bare string; no `BreadcrumbList`, `FAQPage`, `WebSite` or `Organization`), there is no FAQ or question-shaped text for answer engines to lift, and the per-use-case answers ("for gaming, buy the …") exist only behind `#for=` hashes, so crawlers and AI agents only ever see the Overall verdict. Secondary issues: 60 of 105 compare titles exceed 60 characters, 99 of 105 compare meta descriptions share one boilerplate tail, there is no hub page listing all 105 matchups, the footer's "Popular matchups" is the first 5 files alphabetically (all air purifiers), and each HTML page carries 108–194 KB of inline RSC payload because the 163-entry search index is serialized into every page.

## 2. Competitor patterns to copy in spirit

1. **Versus.com: the verdict is the first sentence and the "why" is a numbered fact list.** Every "X vs Y" page leads with a one-line winner, then "Why is X better than Y?" bullets that each carry the two numbers. That is the exact shape answer engines quote. Tiebreak already has `verdictLine()` and `buildAnswer()` producing this; the fix is to expose them as question-and-answer text (visible FAQ + `FAQPage` schema) and to put the verdict sentence in the meta description.
2. **GSMArena: one canonical entity page per product with a stable spec vocabulary, cross-linked to every matchup.** Field names are identical across products, URLs never change, and each product page links out to every comparison it appears in. Tiebreak's `spec-catalog.ts` already enforces the vocabulary; what is missing is the crawl plumbing (sitemap, canonical, absolute URLs in `Product` schema, a hub listing all matchups) so the entity graph is discoverable.
3. **RTINGS: usage-based sub-verdicts as visible headings ("Mixed usage", "Gaming", "Movies") plus an explicit methodology line.** Per-use verdicts are what make a page rank for "best TV for gaming" queries and what lets an agent answer "which one for my use". Tiebreak computes these per lens but only client-side; render all three lens answers server-side under `<h3>` headings, and keep the existing "figures are manufacturer published" methodology sentence near them.

## 3. Ranked findings

Rank is expected traffic/citation lift per unit of effort. Effort: S = under 1 hour, M = 1–3 hours, L = more.

| ID | Problem | Why it matters | Effort | Do now? |
|---|---|---|---|---|
| F01 | No `sitemap.xml` (404) | 105 compare pages are 3 clicks deep; without a sitemap, indexing of the long tail is slow and partial | S | Yes (T2) |
| F02 | No `robots.txt` (404) | No sitemap pointer; no explicit allow for AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) | S | Yes (T3) |
| F03 | No `metadataBase`, no canonical on any page | Duplicate-URL risk (`/x` vs `/x/`, http/https, query strings); OG URLs cannot be absolute | S | Yes (T1, T4, T6) |
| F04 | `og:title`/`og:description` are the site default on all 164 pages; no `og:url` | Every share and every link preview says "Tiebreak - head to head product comparisons" instead of the matchup | S | Yes (T4, T6) |
| F05 | No FAQ / question-shaped text; no `FAQPage` schema | Answer engines extract Q→A pairs; today the page has claims but no questions to anchor them | M | Yes (T5) |
| F06 | Per-lens answers (gaming / movies / travel …) are client-only (`#for=` hash) | Crawlers and agents see only the Overall verdict; "best X for gaming" intent is invisible | M | Yes (T5, same section) |
| F07 | No `llms.txt` | AI crawlers have no site map of what can be cited; one file lists all 105 verdicts | S | Yes (T7) |
| F08 | Compare `ItemList` items lack `url`; `Product.brand` is a string; no `BreadcrumbList` anywhere; no `WebSite`/`Organization` | Schema that cannot be resolved to a URL does not build an entity graph; Google expects `Brand` objects | S | Yes (T1, T4, T6) |
| F09 | 99/105 compare meta descriptions share a boilerplate tail; 60/105 titles > 60 chars | Snippets read as templated; the unique, answer-shaped `verdictLine()` sentence is not used anywhere in metadata | S | Yes (T4) |
| F10 | No hub page listing all 105 matchups; footer "Popular matchups" = first 5 files alphabetically (all air purifiers) | Long-tail compare pages depend on category and product pages for links; a hub gives every matchup a link 1 click from home | S | Yes (T8) |
| F11 | Layout `keywords` meta leaks "TV comparison" onto phone and card pages | Harmless to ranking, but noise; remove | S | Yes (T1) |
| F12 | No `og:image` on any page | Link previews are text-only; some AI surfaces show cards | M | Later (L1) |
| F13 | 108–194 KB inline RSC payload per page; search index serialized into every page | HTML weight 146–290 KB; static pages so TTFB is fine, but LCP/TBT on mobile suffers | M | Later (L2) |
| F14 | No subcategory landing pages (`/category/electronics/` mixes TVs, laptops, phones, headphones) | "TV comparisons" intent has no dedicated URL | M | Later (L3) |
| F15 | Credit cards emit `Product` + `Offer.price` = annual fee | Semantically wrong (price is read as purchase price); use `CreditCard` type | S | Later (L4) |
| F16 | No product images (`image_url` is `via.placeholder.com` on all 52; nothing rendered) | Google Product rich results require `image`; also no image search presence | L | Later (L5, needs licensed assets) |
| F17 | 10 products have no compare page (e.g. `samsung-s95d`, `iphone-16`, `google-pixel-9`) | Data gap, not code: they are reachable but never the subject of a matchup | M | Later (L6, data owners) |
| F18 | Home `<h1>` "Two products. One answer." has no keyword | Brand voice; leave unless someone rewrites copy | S | Later (L7) |
| F19 | Category descriptions promise subcategories with no products (Coffee Makers, Loans, Investment Apps) | Thin/misleading snippet; minor | S | Later (L8) |
| F20 | Leftover create-next-app SVGs in `public/`, stale `scripts/generate-static-pages.js`, boilerplate README | Hygiene only | S | Later (L9) |

## 4. Do-now tasks

All new URLs are built from one constant. The real production domain is not in the repo; use the env var and leave a visible TODO. Owner must set `NEXT_PUBLIC_SITE_URL` before deploy.

### T1. Site constant, `metadataBase`, layout schema

Files: `src/lib/site.ts` (new), `src/app/layout.tsx`, `src/app/page.tsx`.

- Create `src/lib/site.ts`:
  ```ts
  // TODO(owner): set NEXT_PUBLIC_SITE_URL to the real domain before deploying.
  export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiebreak.app').replace(/\/$/, '')
  export const SITE_NAME = 'Tiebreak'
  export const absUrl = (path: string) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
  ```
- In `layout.tsx` `metadata`: add `metadataBase: new URL(SITE_URL)`, delete the `keywords` array, add `alternates: { canonical: '/' }`, keep `openGraph` but add `siteName: SITE_NAME, url: '/', locale: 'en_US'`, add `twitter: { card: 'summary' }`.
- In `layout.tsx` body (inside `<body>`, before `<SiteHeader>`): one `<script type="application/ld+json">` with `{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":SITE_URL+"/#org","name":"Tiebreak","url":SITE_URL},{"@type":"WebSite","@id":SITE_URL+"/#website","name":"Tiebreak","url":SITE_URL,"publisher":{"@id":SITE_URL+"/#org"}}]}` via `dangerouslySetInnerHTML={{ __html: JSON.stringify(...) }}`.
- In `src/app/page.tsx`: `export const metadata: Metadata = { alternates: { canonical: '/' }, openGraph: { url: '/' } }`.

Accept: in `.next-static/index.html`, `grep -c 'rel="canonical" href="https://' ` is 1, `grep -c '"@type":"WebSite"'` is 1, `grep -c 'name="keywords"'` is 0.

### T2. Sitemap

File: `src/app/sitemap.ts` (new).

```ts
import type { MetadataRoute } from 'next'
import { getCategories, getComparisons, getProducts } from '@/lib/data'
import { compareHref, productHref } from '@/lib/nav'
import { absUrl } from '@/lib/site'

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, comparisons, categories] = await Promise.all([getProducts(), getComparisons(), getCategories()])
  const lastModified = new Date()
  return [
    { url: absUrl('/'), lastModified, priority: 1 },
    { url: absUrl('/compare/'), lastModified, priority: 0.9 },          // hub from T8
    ...categories.map((c) => ({ url: absUrl(`/category/${c.id}/`), lastModified, priority: 0.8 })),
    ...comparisons.map((c) => ({ url: absUrl(compareHref(c)), lastModified, priority: 0.8 })),
    ...products.map((p) => ({ url: absUrl(productHref(p)), lastModified, priority: 0.6 })),
  ]
}
```

Accept: `test -f .next-static/sitemap.xml` and `grep -c '<loc>' .next-static/sitemap.xml` prints 162 (1 + 1 + 3 + 105 + 52). Every `<loc>` ends with `/`. Live: `curl -s http://localhost:4124/sitemap.xml | head -5` shows `<urlset`. If the export produces a directory instead of a file, fall back to writing `public/sitemap.xml` from a `scripts/build-sitemap.mjs` run in a `prebuild` npm script (JSON data only).

### T3. robots.txt

File: `src/app/robots.ts` (new).

```ts
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
```

Accept: `test -f .next-static/robots.txt`; `grep -c 'Sitemap: https://' .next-static/robots.txt` is 1; `grep -c 'User-Agent: GPTBot' .next-static/robots.txt` is 1 (Next capitalises the key; check case-insensitively if needed).

### T4. Compare page metadata + schema fixes

File: `src/app/compare/[slug]/page.tsx` (only `generateMetadata` and the existing JSON-LD block).

- In `generateMetadata`, load both products, compute `const verdict = buildVerdict(a, b)` and `const answer = verdictLine(a, b, verdict)`. Then:
  - `title`: `comparison.productName` when `productName.length <= 48`, else `{ absolute: comparison.productName }` (drops the " | Tiebreak" suffix so the tag stays near 60 chars).
  - `description`: `clip(answer.length >= 120 ? answer : `${answer} ${comparison.description}`, 158)` where `clip` cuts on the last space before the limit and appends `…`. This makes 105 unique, answer-shaped snippets.
  - `alternates: { canonical: compareHref(comparison) }`
  - `openGraph: { title: comparison.productName, description, url: compareHref(comparison), type: 'website', siteName: 'Tiebreak' }`
  - `twitter: { card: 'summary', title: comparison.productName, description }`
  - keep `keywords`.
- In the existing `ItemList` JSON-LD: add `url: absUrl(compareHref(comparison))` at the top level; for each item add `url: absUrl(productHref(product))`, change `brand` to `{ '@type': 'Brand', name: product.brand }`, add `offers.url: absUrl(productHref(product))`. For `isFeeBased` products, drop `offers` and add `additionalProperty: [{ '@type': 'PropertyValue', name: 'Annual fee', value: product.price, unitText: 'USD/year' }]`.
- Add a second JSON-LD `BreadcrumbList` mirroring the visible breadcrumb exactly: Home → category name → `subLabel(productA.subcategory)` (positions 1–3, `item` = absolute URL for the first two, the third has no `item`).

Accept (on `.next-static/compare/iphone-16-pro-vs-galaxy-s24-ultra/index.html`): `grep -o '<link rel="canonical"[^>]*>'` prints `https://…/compare/iphone-16-pro-vs-galaxy-s24-ultra/`; `grep -o '<meta property="og:title"[^>]*>'` contains "iPhone 16 Pro vs Galaxy S24 Ultra"; `grep -o '<meta name="description"[^>]*>'` contains "leads 8-3"; `grep -c BreadcrumbList` ≥ 1; `grep -c '"@type":"Brand"'` ≥ 2. Also confirm `grep -c 'rel="canonical"'` is 1 (not 2) since the layout also sets one for `/`: the page value must win.

### T5. Server-rendered "Best for" answers + FAQ (the GEO core)

Files: `src/lib/faq.ts` (new, pure), `src/app/compare/[slug]/page.tsx` (add one section + one JSON-LD script).

Create `src/lib/faq.ts` exporting two pure functions. Inputs come from values the page already computes (`verdict`, `rows = flattenRows(verdict)`, `checks`, `useCases`, `answer`).

```ts
import type { Product } from '@/lib/data'
import type { UseCase } from '@/data/use-cases'
import { buildAnswer, lensRows, shortName, type DealBreakerCheck, type LensRow } from '@/lib/decision'
import { priceLabel, type Verdict } from '@/lib/verdict'
import { isFeeBased } from '@/lib/nav'

export type Qa = { q: string; a: string }
export type LensAnswer = { id: string; label: string; job: string; headline: string; reasons: string[] }

export function buildLensAnswers(a: Product, b: Product, rows: LensRow[], checks: DealBreakerCheck[], useCases: UseCase[]): LensAnswer[] {
  return useCases.map((useCase) => {
    const ans = buildAnswer({ productA: a, productB: b, useCase, rows: lensRows(rows, useCase), checks, matters: new Set() })
    return { id: useCase.id, label: useCase.label, job: useCase.job, headline: ans.headline, reasons: ans.reasons }
  })
}

export function buildCompareFaq(a: Product, b: Product, verdict: Verdict, overallHeadline: string, overallReasons: string[], lenses: LensAnswer[], checks: DealBreakerCheck[]): Qa[] {
  const na = shortName(a), nb = shortName(b)
  const fee = isFeeBased(a.subcategory)
  const cheaper = verdict.priceLeader === 'a' ? a : verdict.priceLeader === 'b' ? b : null
  const faq: Qa[] = []
  faq.push({ q: `Which should I buy, the ${na} or the ${nb}?`, a: [overallHeadline, ...overallReasons].join(' ') })
  faq.push({ q: fee ? `Which card has the lower annual fee, ${na} or ${nb}?` : `Which is cheaper, the ${na} or the ${nb}?`,
    a: cheaper ? `${shortName(cheaper)} ${fee ? 'charges' : 'costs'} ${priceLabel(verdict.priceGap)} ${fee ? 'a year less' : 'less at list price'}.` : fee ? 'Both charge the same annual fee.' : 'Both list at the same price.' })
  for (const lens of lenses) faq.push({ q: `Which is better for ${lens.label.toLowerCase()}, the ${na} or the ${nb}?`, a: [lens.headline, ...lens.reasons.slice(0, 2)].join(' ') })
  const diffs = verdict.highlights.filter((r) => r.differs).slice(0, 4)
  faq.push({ q: `What are the main differences between the ${na} and the ${nb}?`, a: `${verdict.differing} of the ${verdict.total} tracked specs differ.${diffs.length ? ' ' + diffs.map((r) => `${r.label}: ${r.a} vs ${r.b}`).join('; ') + '.' : ''}` })
  const trips = checks.filter((c) => c.a === 'trips' || c.b === 'trips')
  faq.push({ q: `Does either one have a deal-breaker?`, a: trips.length ? trips.map((c) => `${c.label}: ${c.a === 'trips' && c.b === 'trips' ? 'both' : c.a === 'trips' ? na : nb}.`).join(' ') : 'Nothing on either spec sheet trips a common deal-breaker for this product type.' })
  return faq
}
```

In `compare/[slug]/page.tsx`, after `checks`/`useCases` are computed, add:
```ts
const overall = buildAnswer({ productA, productB, useCase: null, rows, checks, matters: new Set() })
const lenses = buildLensAnswers(productA, productB, rows, checks, useCases)
const faq = buildCompareFaq(productA, productB, verdict, overall.headline, overall.reasons, lenses, checks)
```
Render, between the "Which one should you buy" section and "Other matchups":

1. `<section aria-labelledby="best-for">` with `<h2 id="best-for">Best for each use</h2>`, then per lens a `card` containing `<h3>{lens.label}</h3>`, `<p class="text-ink-3">{lens.job}</p>`, `<p class="font-semibold">{lens.headline}</p>`, `<ul>` of reasons. Under the grid, one `<p>` methodology line: "Every answer above is computed from manufacturer-published specifications; a lens scores only the specs that matter for that use. Switch lenses interactively in the panel above." (This is the static twin of the client panel; do not remove or change `DecisionPanel`.)
2. `<section aria-labelledby="faq">` with `<h2 id="faq">Frequently asked</h2>` and for each `Qa`: `<h3>{q}</h3><p>{a}</p>` (plain elements, no `<details>`).
3. A JSON-LD script: `{"@context":"https://schema.org","@type":"FAQPage","mainEntity": faq.map(({q,a}) => ({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}}))}`. The strings must be the same `faq` array used for the visible HTML so schema matches text exactly.

Accept (same file as T4): `grep -c 'FAQPage'` = 1; `grep -c '<h2[^>]*>Best for each use'` = 1; `grep -c '<h2[^>]*>Frequently asked'` = 1; `grep -c 'Which is better for'` ≥ 4 (3 visible h3 + schema); the text "For photos, buy the" (phones' first lens is `photos` / "Photos") appears outside the JSON-LD. Spot-check one air-purifier page and one credit-card page for fee wording (`grep -c 'a year less'` on `american-express-gold-card-vs-citi-double-cash`).

### T6. Product + category metadata and schema

Files: `src/app/product/[...slug]/page.tsx`, `src/app/category/[slug]/page.tsx`.

Product `generateMetadata`:
- `title`: `${product.name} specs and price` (keep template suffix).
- `description`: `${product.name} at ${priceShort(product)}: ${product.description}` clipped to 158.
- `alternates: { canonical: productHref(product) }`, `openGraph: { title, description, url: productHref(product), type: 'website', siteName: 'Tiebreak' }`, `twitter: { card: 'summary', title, description }`.

Product JSON-LD: `brand: { '@type': 'Brand', name }`, add `url: absUrl(productHref(product))`, `offers.url` same; for `isFeeBased(product.subcategory)` emit `'@type': 'CreditCard'` (schema.org FinancialProduct subtype) with `name, description, url, provider: { '@type': 'Organization', name: product.brand }, feesAndCommissionsSpecification: `Annual fee $${product.price}`` and no `offers`. Add a `BreadcrumbList` script (Home → category → product name, mirroring the visible breadcrumb).

Category `generateMetadata`:
- `title`: `${category.name} comparisons` (unchanged), `description`: `Compare ${products.length} ${category.name.toLowerCase()} head to head across ${subcategory labels actually present, joined}. ${categoryComparisons.length} published matchups with a spec-by-spec verdict.` (compute from data; do not list subcategories with zero products).
- `alternates.canonical`, `openGraph.url`, `openGraph.title/description`, `twitter` as above.
- Add a `BreadcrumbList` (Home → category) and a `CollectionPage` JSON-LD `{ "@type": "CollectionPage", name, url, hasPart: categoryComparisons.map(c => ({ "@type": "WebPage", name: c.productName, url: absUrl(compareHref(c)) })) }`.

Accept: `.next-static/product/electronics/iphone-16-pro/index.html` has 1 canonical ending in `/product/electronics/iphone-16-pro/`, `og:title` containing "iPhone 16 Pro", `"@type":"Brand"`, `BreadcrumbList`. `.next-static/product/finance/american-express-platinum/index.html` (check the exact id in `products.json`) contains `"@type":"CreditCard"` and no `"@type":"Offer"`. `.next-static/category/electronics/index.html` has canonical, `CollectionPage`, and its description does not contain "Coffee".

### T7. llms.txt

File: `src/app/llms.txt/route.ts` (new).

```ts
import { getCategories, getComparisons, getProducts } from '@/lib/data'
import { buildVerdict, verdictLine } from '@/lib/verdict'
import { compareHref, priceShort, productHref, subLabel } from '@/lib/nav'
import { absUrl } from '@/lib/site'
export const dynamic = 'force-static'
export async function GET() {
  // Build: "# Tiebreak" H1, one-paragraph description, methodology line, then
  // "## Matchups" grouped by subcategory: "- [A vs B](abs url): <verdictLine>"
  // "## Products" grouped by subcategory: "- [name](abs url): <priceShort> · <description>"
  // "## Categories": "- [name](abs url)"
  // "## Machine-readable": sitemap URL.
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
```
Use `verdictLine(a, b, buildVerdict(a, b))` for each of the 105 comparisons so every line is a citable claim. Group matchups by `subLabel(productA.subcategory)`.

Accept: `test -f .next-static/llms.txt`; `grep -c '^- \[' .next-static/llms.txt` ≥ 157 (105 + 52); `head -3` starts with `# Tiebreak`. Live: `curl -s http://localhost:4124/llms.txt | head -5`. If the export writes a directory (`.next-static/llms.txt/…`) instead of a file, fall back to a `scripts/build-llms.mjs` prebuild that writes `public/llms.txt` from the JSON data (drop the verdict lines in that fallback).

### T8. Matchup hub + diversified footer/nav links

Files: `src/app/compare/page.tsx` (new), `src/components/SiteFooter.tsx`, `src/app/layout.tsx` (nav array only).

- New static page at `/compare/`: `metadata` with title `All product matchups`, description `Every head-to-head published on Tiebreak: ${n} matchups across TVs, laptops, phones, headphones, cordless vacuums, air purifiers and credit cards, each with a spec-by-spec verdict.`, canonical `/compare/`, OG as in T4. Body: breadcrumb (Home → All matchups), `<h1>All matchups</h1>`, one `<section>` per subcategory (`<h2>{subLabel}</h2>`, anchor id = subcategory) containing a `<ul>` where each `<li>` is `<a href={compareHref(c)}>{c.productName}</a>` followed by a `<p class="text-ink-3">` with `verdictLine(a, b, buildVerdict(a, b))`. Plain lists, no `VsCard` (keep the page light: this is the crawler hub). Also an `ItemList` JSON-LD of all matchup URLs.
- Footer: replace `comparisons.slice(0, 5)` with one matchup per subcategory (first comparison whose `productA` subcategory matches, iterate `SUBCATEGORY_LABEL` order) plus a final `All matchups → /compare/` link. Footer needs `products` to resolve subcategory; pass it from `layout.tsx` (already loaded there).
- Layout `nav` array: append `{ label: 'Matchups', href: '/compare/' }`.

Accept: `test -f .next-static/compare/index.html`; `grep -o 'href="/compare/[^"]*/"' .next-static/compare/index.html | sort -u | wc -l` ≥ 105; `.next-static/index.html` footer contains `href="/compare/"` and its "Popular matchups" list no longer has 5 air purifiers (`grep -c 'BreatheSmart' .next-static/index.html` should drop). Sitemap `<loc>` count from T2 stays 162.

## 5. Later / out of scope

- **L1 `og:image`** (F12, M): add `src/app/opengraph-image.tsx` using `ImageResponse` from `next/og` with the wordmark and site tagline (one static image for all pages); per-page images for compare routes only if build time stays acceptable. Static export supports it.
- **L2 HTML weight** (F13, M): move `buildJumpIndex` out of layout props; expose it as `src/app/search-index.json/route.ts` (`force-static`) and `fetch` it in `SiteHeader` on first open. Cuts ~50 KB from all 164 pages.
- **L3 Subcategory landing pages** (F14, M): `/category/[slug]/[sub]/` with `generateStaticParams` over the 7 subcategories; title "TV comparisons", list products + all matchups for that type. Adds 7 URLs targeting "X comparison" intent.
- **L4** done inside T6 for product pages; the compare-page `ItemList` variant is in T4. Nothing left unless the data owners rename `price` for cards.
- **L5 Product images** (F16, L): requires licensed assets; until then keep `ProductMark` and do not add `image` to schema. Note that Product rich results will not show without it.
- **L6 Missing matchups** (F17, data): 10 products have zero compare pages. Data owners should add C(n,2) coverage or at least one matchup each.
- **L7 Home H1 / title copy** (F18, S): consider "Tiebreak: side-by-side product comparisons with a verdict" as the default title; leave the H1 unless copy changes.
- **L8 Category copy** (F19, S): the empty-state and description lists include subcategories with no products; filter to those present (partially handled in T6 description).
- **L9 Hygiene** (F20, S): delete `public/{file,globe,next,vercel,window}.svg`, delete or rewrite `scripts/generate-static-pages.js`, replace the boilerplate README. Rename `src/data/comparisons/dyson-v15-vs-shark-stratos.json` to match its ids (`dyson-v15-detect-vs-shark-stratos.json`) only if the data owners agree; the route is unaffected.
- **Markdown twins** (M): `src/app/compare/[slug]/facts.md/route.ts` returning the spec table as Markdown for agents. Only after T5/T7 prove out.
- **Product-page FAQ** (S): "How much does X cost?", "What are X's key specs?", "What does X compare against?" using the same pattern as T5.
- Not proposed: redesign, CMS, live ranking API, auth, reverse-slug duplicate pages (`b-vs-a` must stay a 404 or a redirect; static export cannot redirect, so leave it).

## 6. How agy should verify

Run from `/Users/fulanodetal/Developer/comparison-website`. The dev server on port 4124 writes to `.next-static/dev`, so `next build` can run alongside it; do not start another server.

```bash
node_modules/.bin/tsc --noEmit
node_modules/.bin/next build            # expect 164 static routes + /compare/ hub + sitemap/robots/llms
test -f .next-static/sitemap.xml && grep -c '<loc>' .next-static/sitemap.xml        # 162
test -f .next-static/robots.txt && cat .next-static/robots.txt
test -f .next-static/llms.txt && head -5 .next-static/llms.txt && grep -c '^- \[' .next-static/llms.txt   # >= 157
F=.next-static/compare/iphone-16-pro-vs-galaxy-s24-ultra/index.html
grep -o '<link rel="canonical"[^>]*>' $F
grep -o '<meta property="og:title"[^>]*>' $F
grep -o '<meta name="description"[^>]*>' $F
for k in FAQPage BreadcrumbList '"@type":"Brand"' 'Best for each use' 'Frequently asked' 'Which is better for'; do printf '%s: ' "$k"; grep -c "$k" $F; done
P=.next-static/product/electronics/iphone-16-pro/index.html
grep -o '<link rel="canonical"[^>]*>' $P; grep -c BreadcrumbList $P
C=.next-static/category/electronics/index.html
grep -o '<link rel="canonical"[^>]*>' $C; grep -c CollectionPage $C
grep -o 'href="/compare/[^"]*/"' .next-static/compare/index.html | sort -u | wc -l   # >= 105
grep -c 'name="keywords"' .next-static/index.html   # 0
```

Live checks (dev server hot-reloads; save to a file first, piping `curl` straight into a parser truncates on this machine):

```bash
curl -s -o /tmp/c.html http://localhost:4124/compare/iphone-16-pro-vs-galaxy-s24-ultra/ && grep -c FAQPage /tmp/c.html
curl -s http://localhost:4124/sitemap.xml | head -5
curl -s http://localhost:4124/robots.txt
curl -s http://localhost:4124/llms.txt | head -8
```

Also paste one compare page's three JSON-LD blocks into https://validator.schema.org/ and confirm zero errors (Google's Rich Results Test will not show FAQ rich results for a non-government site; that is expected, the schema is for answer engines).

Completion report must state: the `SITE_URL` fallback in use (owner must set `NEXT_PUBLIC_SITE_URL`), the `<loc>` count, and which acceptance greps passed.
