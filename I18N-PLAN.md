# Tiebreak i18n + market plan (phase 1: US + UK English)

Rewritten 2026-09-01 from Claude Fable 5.1’s review of the agy market list in `.crew-status.md` (`I18N-PLAN-REVIEW.md`). That list is **void**. This file is the spec. Do the **Do now** set in order; **Later** is out of scope until phase 1 is live with hreflang verified.

This is a static export (`output: 'export'`, Next 16.3.4). There is no middleware, no geo, no cookie at request time, and no redirect the app can issue. Every URL we emit is a real HTML file.

Ground rules for the implementer: no `npx` (use `node_modules/.bin/…`), do not start a second dev server, never port 5000, do not git init, do not read `.env`. Do not invent GBP amounts, FX conversions, or UK credit-card sheets. Do not add French / German / Italian dictionaries. Do not move US URLs under `/us/`. Coordinate with whoever owns SEO: do not rewrite `src/app/**` page files while SEO-PLAN T1–T8 is still being edited; wait until that export is stable, then do T6/T7 as one pass.

## 0. What this means (plain language)

The old plan wanted five countries and four languages on day one. That would reprint every page nine times, put kilograms into rules that still think in pounds, and invent UK/Swiss credit-card pages we are not licensed to write.

Phase 1 keeps the American site exactly where it is (`/` is the US). It adds a British English twin at `/uk/` for TVs, laptops, phones, headphones, vacuums and purifiers. Credit cards stay US-only. Prices are sourced in the local currency, never converted. Specs are compared in one internal unit system, then *shown* as lb or kg depending on the market. A banner can suggest the other market; the site never yanks the visitor there on its own.

Canada, Australia, Switzerland and other languages wait until this slice is true.

## 1. Diagnosis

Three things in the codebase are US facts pretending to be universal:

1. **One USD integer per product** (`price`). `priceShort` / `verdictLine` / `buildAnswer` / JSON-LD / the footer / the search index all hard-code `$` and `en-US` / `USD`. A wrong local price flips the winner sentence.
2. **Specs are English sentences with the unit inside.** Verdict and deal-breakers parse the first number. `heavy-laptop` trips above 4, `heavy-vacuum` above 7, `heavy-purifier` above 25, `small-coverage` below 1,000 — all imperial. Rewrite those strings to metric and the rules fire on the wrong quantity. `yes`/`no` is an English regex (`verdict.ts`, `deal-breakers.ts`).
3. **Every “buy this one” sentence is an English template** (`decision.ts`, `verdict.ts`, `faq.ts`). Phase 1 stays English, so we do not translate those yet — but numbers and currency inside them must follow the market.

The old URL scheme (`/us/` next to `/ca/fr/`) is not expressible as an App Router static export (optional segments only work at the end of a path). Moving `/` to `/us/` would also invalidate the SEO canonicals, sitemap, `llms.txt` and `/compare/` hub that just shipped.

## 2. Locked decisions

| Decision | Choice | Cost of the other option |
|---|---|---|
| Default market | US at `/`. No `/us/` prefix. Host 301s `/us/…` → unprefixed if anyone types it. | Moving 164 canonicals and the sitemap. |
| Extra markets | One extra path segment, always: `/uk/…`. No `/uk/en/` shortcut. | Mixed depth cannot be generated. |
| Locales in phase 1 | `en-US` and `en-GB` only. | Translation breaks yes/no scoring and 50 sentence templates. |
| UK catalog | Electronics + appliances (46 products, 90 compares). Finance omitted. | UK/AU/CH card copy is regulated disclosure, not a dictionary. |
| Product ids | Stable global slugs. No regional SKU ids in phase 1. | New ids break same-path hreflang. |
| Prices | Hand-sourced local list price with `asOf` + `source`. Never FX. Missing UK price → no price winner, honest “UK price not listed”. | Converted USD→GBP would flip verdicts. |
| Units | Compare in canonical SI-ish units; format for display per market. | Display-string thresholds fire on kg as if they were lb. |
| Selector | Suggestion banner + `localStorage`. Never an automatic redirect. | First-paint redirect hides the URL’s market from crawlers and shared links. |
| Host | Named in `src/lib/site.ts` (`NEXT_PUBLIC_SITE_URL`, fallback `https://tiebreak.app`). Redirect map is the host’s job (Cloudflare / Vercel / nginx), not Next. | The export cannot 301. |

Markets we are **not** building now: CA, AU, CH, `fr`, `de`, `it`, UK credit cards, regional chipset SKUs.

## 3. URL, hreflang, host

US path is today’s path. UK path is `/uk` + the same rest.

| Page | US | UK |
|---|---|---|
| Home | `/` | `/uk/` |
| Matchup hub | `/compare/` | `/uk/compare/` |
| Compare | `/compare/{a}-vs-{b}/` | `/uk/compare/{a}-vs-{b}/` |
| Product | `/product/{cat}/{id}/` | `/uk/product/{cat}/{id}/` |
| Category | `/category/{id}/` | `/uk/category/{id}/` (electronics, appliances only) |
| Cards / finance | as today | **no file** (404) |

hreflang (Next `metadata.alternates.languages` + sitemap `alternates.languages`):

- US page that exists in the UK: `en-US` → US URL, `en-GB` → UK URL, `x-default` → US URL. Canonical is the US URL on the US page, the UK URL on the UK page.
- US-only page (any credit card, finance category, a product with `markets: ['us']`): `en-US` + `x-default` only. No `en-GB`. Canonical is the US URL. Do not emit a UK file.
- UK page: canonical is the UK URL; same cluster as its US twin.

`openGraph.locale` is `en_US` on US pages and `en_GB` on UK pages. `<html lang>` is `en` on the root layout (US) and `en-GB` on the UK layout.

Host (owner, at deploy — not in Next):

1. Do **not** geo-redirect, do **not** Accept-Language redirect.
2. 301 `/us` and `/us/…` → the unprefixed path.
3. 301 `/uk` → `/uk/` (trailing slash already required by `next.config.ts`).
4. Leave unknown `/uk/category/finance/` as a real 404.

## 4. Data model

### 4.1 Markets

New file `src/lib/markets.ts`:

```ts
export type MarketId = 'us' | 'uk'

export type Market = {
  id: MarketId
  locale: 'en-US' | 'en-GB'
  htmlLang: 'en' | 'en-GB'
  ogLocale: 'en_US' | 'en_GB'
  hreflang: 'en-US' | 'en-GB'
  currency: 'USD' | 'GBP'
  unitSystem: 'us' | 'metric'
  prefix: '' | '/uk'          // no trailing slash; join with href helpers
  label: string               // "United States" / "United Kingdom"
}

export const MARKETS: Record<MarketId, Market> = { /* us, uk */ }
export const DEFAULT_MARKET: MarketId = 'us'

export function marketPath(market: MarketId, path: string): string
// path is always the US path beginning with `/`. UK → `/uk` + path, except `/` → `/uk/`.
export function siblingPath(market: MarketId, path: string): string | null
// null when the other market does not publish this page.
```

`productHref` / `compareHref` / category hrefs gain an optional `market: MarketId = 'us'`. Existing callers stay US.

### 4.2 Product

Extend `Product` in `src/lib/data.ts` (and the JSON):

```ts
export type PricePoint = {
  amount: number          // major units, same as today's `price`
  currency: 'USD' | 'GBP'
  asOf: string            // YYYY-MM-DD
  source: string          // retailer or manufacturer URL, or "manufacturer-msrp"
}

export type Product = {
  // existing fields…
  price: number           // keep as the US amount during transition; do not use for UK
  markets: MarketId[]     // publish a page only in these markets
  prices?: Partial<Record<MarketId, PricePoint>>
}
```

Rules:

- Credit cards: `markets: ['us']`. No `prices.uk`.
- Electronics / appliances: `markets: ['us', 'uk']` unless we *know* it is not sold in one of those; then omit that market and do not emit the page. Grey-import notes belong in `description`, not a second id.
- `getProducts(market)`, `getComparisons(market)`, `getCategories(market)` drop anything not published there. A comparison publishes in a market only when **both** products do.
- `priceOf(product, market): PricePoint | null` — US may fall back to `{ amount: product.price, currency: 'USD', asOf: '1970-01-01', source: 'legacy-price' }` until migrated. UK never falls back to USD.
- If `priceOf` is null: no `priceLeader` / `priceGap`; money reasons drop out of `buildAnswer` / `verdictLine` / FAQ; UI shows “UK price not listed”; JSON-LD omits `Offer`. Do not show `$` on a `/uk/` page.

Do not fill 46 GBP figures from FX. Leave `prices.uk` absent until a human sources them. Ship the machinery with **two worked examples** (one TV pair that already has a compare page) so formatters and degradation are both testable.

### 4.3 Canonical units

New `src/lib/units.ts` + `src/data/spec-units.ts`.

Canonical dimensions (one unit each):

| Dimension | Canonical | US display | UK display |
|---|---|---|---|
| mass | `g` | lb (1 decimal) + g in parens if useful | kg or g |
| length | `mm` | in | cm / mm |
| area | `m2` | sq ft | m² |
| volume | `L` | gal or L as the sheet already does | L |
| airflow | `m3h` | CFM | m³/h |
| time-min | `min` | min | min |
| already-SI | keep (`Hz`, `nits`, `ms`, `dB`, `W`, `mAh`, `ppi`, counts) | as stored | as stored |

`spec-units.ts` maps every `NUMERIC_RULES` key and every deal-breaker key that reads a magnitude to a dimension. Unmapped keys stay opaque strings.

`qty(spec: string, key: string): { value: number; unit: string } | null`:

1. Parse the leading number and its unit token (`lb`, `kg`, `g`, `oz`, `in`, `inch`, `inches`, `"`, `mm`, `cm`, `sq ft`, `ft²`, `m²`, `cfm`, `m³/h`, `m3/h`, `L`, `min`, …).
2. If the string has a parenthetical second measurement, prefer the one that is already canonical when present (`4.7 lb (2.14 kg)` → 2140 g), otherwise convert the first.
3. Convert to the key’s canonical unit. Unknown unit → null (no winner), same as today’s unit-mismatch path.

`buildVerdict` / `measure` must go through `qty`. Deal-breaker magnitude helpers (`firstAbove`, `firstBelow`, `maxBelow`, …) take a spec key, convert, then compare to a **canonical** threshold:

| Rule | Today (display) | Canonical |
|---|---|---|
| `heavy-laptop` | > 4 (lb) | > 1814 g |
| `heavy-vacuum` | > 7 (lb) | > 3175 g |
| `heavy-purifier` | > 25 (lb) | > 11340 g |
| `small-coverage` | < 1000 (sq ft) | < 92.9 m² |

Labels shown to shoppers stay market-local (“Over 4 lb (1.8 kg)” on US, “Over 1.8 kg” on UK). The trip does not.

Yes/No stays English regex in phase 1. Do not translate spec values.

### 4.4 Warranty and finance

- Do not change `warranty` values or scoring in phase 1.
- UK product + compare pages get one unscored statutory line: “UK buyers also have rights under the Consumer Rights Act 2015; this sheet is manufacturer warranty, not legal advice.”
- Finance is US-only until a named owner supplies regulated UK (or other) copy. Isolation is `markets: ['us']`, not “hide the finance category in CSS”.

## 5. Do-now tasks

### T1. Market module and hrefs

Files: `src/lib/markets.ts` (new), `src/lib/nav.ts`, `src/lib/site.ts`.

- Add `MARKETS`, `DEFAULT_MARKET`, `marketPath`, `siblingPath`.
- `productHref(product, market?)`, `compareHref(comparison, market?)`, and category hrefs prefix from `MARKETS[market].prefix`.
- `buildJumpIndex(..., market)` uses those hrefs and `priceShort(product, market)` (T4). Filter inputs *before* calling it (T3).

Accept: unit tests or a small `node_modules/.bin/tsx`/`node` script are optional; a `tsc --noEmit` pass plus `marketPath('uk', '/') === '/uk/'` and `marketPath('uk', '/compare/a-vs-b/') === '/uk/compare/a-vs-b/'` in a `src/lib/markets.test.ts` if the repo has no test runner yet, put the assertions in a `scripts/check-markets.mjs` that exits 1 on mismatch. Do not add Jest.

### T2. Canonical units in scoring

Files: `src/lib/units.ts` (new), `src/data/spec-units.ts` (new), `src/lib/verdict.ts`, `src/data/deal-breakers.ts`.

- Implement `qty` and conversions.
- `measure` / `judge` compare canonical values; unit-token mismatch after conversion still yields no winner.
- Deal-breaker magnitude rules use the canonical table in §4.3. Labels can still mention both units.
- Add a fixture assertion: a laptop spec `"4.9 lb (2.2 kg)"` trips `heavy-laptop`; `"3.5 lb (1.6 kg)"` does not; a UK-only string `"2.2 kg"` still trips. Same for `"900 sq ft"` vs `"90 m²"` on `small-coverage`.

Accept: those four cases pass; `tsc --noEmit` passes; overall win counts on a sample of 10 compare pages do not change versus current `verdict.ts` for US display strings (the conversion must be lossless for values that already contain both units). If a page’s overall count moves, stop and list it — do not “fix” by editing specs.

### T3. Availability + prices in data

Files: `src/lib/data.ts`, `src/data/products.json`.

- Add `markets` and optional `prices` to the type. Defaulting logic: if `markets` is missing, treat as `['us']` so a partial JSON edit cannot leak a UK page.
- Set `markets: ['us']` on all `credit-cards`. Set `markets: ['us', 'uk']` on the other 46 products.
- Migrate US `price` into `prices.us` for at least the two-example TV pair; others may keep legacy `price` with the fallback in `priceOf`.
- Add real `prices.uk` (amount + asOf + source URL) for **one** existing compare pair only. Leave the rest of UK prices absent on purpose.
- `getProducts(market)`, `getComparisons(market)`, `getCategories(market)` as in §4.2.
- `priceOf(product, market)`.

Accept: `getProducts('uk')` is 46; `getProducts('uk').every(p => p.subcategory !== 'credit-cards')`; `getComparisons('uk')` is 90; `getCategories('uk')` has no `finance`; `priceOf(ukProductWithoutGbp, 'uk')` is null; `priceOf(anyCard, 'uk')` is null.

### T4. Formatters; kill hard-coded dollars

Files: `src/lib/format.ts` (new), `src/lib/nav.ts`, `src/lib/verdict.ts`, `src/lib/decision.ts`, `src/lib/faq.ts`, `src/components/SpecTables.tsx`, `src/components/VsCard.tsx`, `src/components/SiteFooter.tsx`, product + compare pages (JSON-LD `priceCurrency`), `src/app/llms.txt/route.ts`.

```ts
formatMoney(amount: number, market: MarketId): string
// Intl.NumberFormat(locale, { style: 'currency', currency })
formatQuantity(value: number, canonicalUnit: string, market: MarketId): string
listJoin(parts: string[], market: MarketId): string  // Intl.ListFormat
```

Replace every `$${…toLocaleString('en-US')}` and the no-locale `toLocaleString()` in `verdict.ts`. JSON-LD `priceCurrency` comes from `priceOf(…).currency` or the `Offer` block is omitted. Footer drops the universal “prices are in USD” claim; US footer may still say USD, UK footer says GBP list prices, and both keep the manufacturer-spec disclaimer.

`priceShort(product, market)` uses `priceOf`; on null, return `Price not listed`.

Accept: `rg '\$\{|toLocaleString\('en-US'\)|priceCurrency: \'USD\'' src` is 0 except comments or the US-only footer sentence. `rg "toLocaleString\(\)" src` is 0.

### T5. Thread `market` through the decision UI

Files: `src/lib/verdict.ts`, `src/lib/decision.ts`, `src/lib/faq.ts`, `src/components/DecisionPanel.tsx`, `src/components/SpecTables.tsx`.

- `buildVerdict`, `verdictLine`, `buildAnswer`, `buildCompareFaq`, `buildLensAnswers` take `market`.
- Price gap / cheaper / fee wording use `priceOf` + `formatMoney`. Missing price → spec-only headline, no “costs $X less”.
- `DecisionPanel` and `SpecTables` receive `market` as a prop (UK pages pass `'uk'`). Do not read it from the URL in the client if the server already knows; the URL is the source of truth on first paint.
- Display units for weight/coverage/CADR in the table come from `formatQuantity`, not from rewriting `specifications` JSON.

Accept: a UK render of the example TV pair with GBP shows `£` in the VS hero, JSON-LD, and straight answer, and never `$`. A UK render of a pair with no GBP shows “UK price not listed” and a spec-only answer. US pages still show `$` and unchanged overall winners (spot-check `iphone-16-pro-vs-galaxy-s24-ultra` and `lg-c4-oled-vs-samsung-q90c`).

### T6. UK route tree (do not move US)

Files: `src/app/uk/layout.tsx` (new) + `src/app/uk/page.tsx`, `src/app/uk/compare/page.tsx`, `src/app/uk/compare/[slug]/page.tsx`, `src/app/uk/product/[...slug]/page.tsx`, `src/app/uk/category/[slug]/page.tsx`. Extract shared bodies into `src/views/` **only if** it is the cheaper way to keep US files from drifting; otherwise import helpers and duplicate the small `generateStaticParams` wrappers. Do **not** introduce `app/[market]/` in phase 1.

- UK layout: own `<html lang="en-GB">`, own header/footer/search index from `get*( 'uk' )`, `openGraph.locale: 'en_GB'`. Root layout stays `lang="en"` / `en_US`.
- `generateStaticParams` for UK compare/product/category uses the UK-filtered lists. A slug that is US-only must not generate.
- UK finance category and any card product/compare: no generated page.

Accept: `node_modules/.bin/next build` emits `/uk/index.html`, `/uk/compare/index.html`, UK electronics/appliances category pages, 46 UK product pages, 90 UK compare pages, and **zero** `/uk/category/finance/` or `/uk/product/finance/`. US route count stays as after SEO (home, hub, 3 categories, 52 products, 105 compares). Total new UK HTML ≈ 140 files.

### T7. hreflang, sitemap, llms

Files: US + UK page `metadata`, `src/app/sitemap.ts`, `src/app/llms.txt/route.ts`, new `src/app/uk/llms.txt/route.ts`.

- Every page sets `alternates.canonical` to itself and `alternates.languages` per §3.
- Sitemap: one file, every US URL plus every UK URL. Each US URL that has a UK twin carries `alternates.languages` `{ 'en-US', 'en-GB', 'x-default' }`. Card URLs carry `{ 'en-US', 'x-default' }` only.
- Root `llms.txt` stays the US catalog. UK `llms.txt` lists UK matchups/products with UK paths and UK `priceShort`.

Accept: `grep -c '<loc>' .next-static/sitemap.xml` ≈ 165 US + 140 UK (count exactly after the build). A card `<url>` block has no `/uk/` alternate. `.next-static/compare/iphone-16-pro-vs-galaxy-s24-ultra/index.html` contains `hreflang="en-GB"` pointing at `/uk/compare/iphone-16-pro-vs-galaxy-s24-ultra/`. `.next-static/product/finance/` pages have no `en-GB`. `test -f .next-static/uk/llms.txt`.

### T8. Per-market chrome + suggestion banner

Files: `src/app/layout.tsx`, `src/app/uk/layout.tsx`, `src/components/SiteHeader.tsx`, `src/components/SiteFooter.tsx`, `src/components/MarketBanner.tsx` (new), `src/app/page.tsx`, `src/app/uk/page.tsx`.

- Search index, footer picks, home matchups, category shortlists, nav category links: built from `get*(market)` so UK never offers a card or a finance link.
- `MarketBanner` (client island): not a redirect. Copy: “You are on the US site.” / “You are on the UK site.” with a link to `siblingPath` when it exists, otherwise to the other market’s home (“This product is listed for the US only”).
- Remember last *clicked* market in `localStorage` key `tiebreak:market`. If the stored market disagrees with the URL, the banner may say “Continue on the UK site →”; it must not `location.replace`.
- No geo, no Accept-Language, no first-paint bounce.

Accept: US home HTML has no `/uk/product/finance`. UK home HTML has no credit-card names and no `$`. Banner markup is in both layouts. A node check of the banner module does not call `location.replace` / `location.href =`.

## 6. Later / out of scope

- **L1 UK price fill:** remaining 44 GBP list prices with `asOf` + source. Until then those pages stay on the honest missing-price path. Do not FX-fill.
- **L2 Typed quantities in JSON:** migrate scored spec keys from strings to `{ value, unit, note? }` so we stop parsing display text. Parser in T2 is the bridge, not the destination.
- **L3 Languages (fr, de, it):** only after T2 stores yes/no as booleans (or a `Presence` enum), sentence builders return structured results, and `DecisionPanel` takes a dictionary. Key-value JSON cannot do French gender or German plurals.
- **L4 Canada (`/ca/`, `en-CA` then `fr-CA`):** same one-segment prefix. Needs CAD prices. French is an L3 problem. Hybrid units.
- **L5 Australia (`/au/`, `en-AU`):** metric + AUD + Australian Consumer Law note. Same data-model as UK.
- **L6 Switzerland:** four locales, smallest audience, last or never.
- **L7 UK/CA/AU/CH finance:** blocked until a named owner and a regulated-disclosure source exist. Shared brands (Amex Gold) are different products, not a translated US sheet.
- **L8 Regional SKUs:** Exynos vs Snapdragon, region TV names. Either per-market overrides on the same id, or new ids that give up 1:1 hreflang. Do not mix.
- **L9 Lift `uk/` to `[market]/`:** when a third market ships. US still stays at `/`.
- **L10 Search-index weight:** SEO-PLAN L2 (fetch index on open) becomes more important once every page exists twice.
- Not proposed: geo-IP, cookie gating, `app/[lang]/[locale]`, next-intl, a CMS, live FX, automatic redirects, `/us/` aliases as generated files.

## 7. Collision / ownership

| Surface | Who | Rule |
|---|---|---|
| `src/data/products.json`, `deal-breakers.ts`, `spec-catalog.ts` | data owners + this work | T2/T3 need them. Do not add locales or card catalogs in parallel. |
| `DecisionPanel.tsx`, `SpecTables.tsx` | this work | Must take `market`. Other agents: don’t restyle while T5 is in flight. |
| `src/app/**` US pages, `sitemap.ts`, `llms.txt` | SEO just shipped T1–T8 | T6/T7 wait until that export is stable. Keep US canonicals. |
| Auth, payments, secrets | nobody here | Not in scope. List prices are public integers, not charges. |

## 8. How to verify

Run from `/Users/fulanodetal/Developer/comparison-website`. Do not start another server.

```bash
node_modules/.bin/tsc --noEmit
node_modules/.bin/next build
# US still there
test -f .next-static/index.html
test -f .next-static/compare/iphone-16-pro-vs-galaxy-s24-ultra/index.html
test -f .next-static/product/finance/american-express-platinum/index.html
# UK twin, no finance
test -f .next-static/uk/index.html
test -f .next-static/uk/compare/iphone-16-pro-vs-galaxy-s24-ultra/index.html
test ! -e .next-static/uk/category/finance
test ! -e .next-static/uk/product/finance
# money
grep -c '£\|GBP\|Price not listed' .next-static/uk/compare/lg-c4-oled-vs-samsung-q90c/index.html
grep -c '\$' .next-static/uk/index.html          # 0
# hreflang
grep -o 'hreflang="[^"]*"' .next-static/compare/iphone-16-pro-vs-galaxy-s24-ultra/index.html
grep hreflang .next-static/product/finance/american-express-platinum/index.html | grep en-GB   # 0
# sitemap size
grep -c '<loc>' .next-static/sitemap.xml
```

Live (dev server already on http://localhost:4124 if up):

```bash
curl -s -o /tmp/uk.html http://localhost:4124/uk/compare/iphone-16-pro-vs-galaxy-s24-ultra/
grep -c hreflang /tmp/uk.html
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4124/uk/category/finance/
# expect 404
```

Completion report must state: UK route count, US route count still intact, how many products have `prices.uk`, that FX was not used, and that the banner does not redirect.

## 9. Recommendation

Implement T1→T8 in that order. Do not start L3–L8. The first user-visible win is: a shopper in the UK can open `/uk/`, see kg and £ (or an honest “not listed”), and keep the same verdict math as `/`.
