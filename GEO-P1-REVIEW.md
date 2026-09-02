# GEO P1 review — `f0bb356` on `feat/geo-citation-p1`

Cross-family review. Author: Gemini 3.7 Flash (agy). Reviewer: Claude Opus 5.
Base `d378d50`. Reviewed against `AGY-BRIEF.md` T5–T10 and `GEO-PLAN.md` P1.

## Gate status

`npm run lint`, `npm run typecheck`, `check:catalog`, `check:i18n`, `check:export` all
re-run in this worktree: **all pass**. Working tree clean. The export in `.next-static/`
is fresh (12:48:55) and newer than the last source edit (12:47:53), so the greps below
describe the committed code.

Green checks are not the review. What follows is what the checks do not catch.

## What is genuinely done

| Task | State | Evidence |
|---|---|---|
| T5 llms.txt spec shape | done | `# ` then `> ` blockquote, 5 `##` sections, 36 bullets (27 matchups), MIME kept, `/.well-known/llms.txt` byte-identical |
| T6 Markdown twins | built, unreachable | 1010 `index.md` files, correct sections, `Index: /llms.txt`, canonical, sources — but see P1-2 |
| T7 visible date + `dateModified` | done | "Catalog as of September 1, 2026" renders once per compare and product page; `WebPage` node carries `dateModified: 2026-09-01` |
| T8 Why-in-numbers | **done well** | 1010/1010 compare pages carry the block; 1008 have 5 bullets, 2 have 4; **0 pages lack a maker-source link**; `origin: 'other'` rows correctly say "not on maker sheet" instead of inventing a citation |
| T9 product FAQ + FAQPage | partial | 119/119 product pages carry `FAQPage`; every schema string verified byte-identical to visible DOM text; no empty `—` spec values. Q3 falls short (P2-4) |
| T10 subcategory hubs | shipped with a broken table | 7 hubs, unique metadata, `CollectionPage` + `BreadcrumbList`, 7 sitemap `<loc>`s. Use-case table is wrong (P0-1) |

---

## P0 — blocking

### P0-1 · Hub use-case table publishes ~3,000 verdicts the site itself contradicts
`src/views/subcategory-page.tsx:141` — **brief unmet (T10)**

`buildAnswer` scores whatever `rows` it is handed. The canonical caller,
`buildLensAnswers` (`src/lib/faq.ts:~30`), narrows them first:

```ts
buildAnswer({ ..., rows: lensRows(rows, useCase), ... })
```

The hub passes the **unfiltered** `flattenRows(verdict)` (line 134) into every lens
iteration. `scoreLens()` therefore returns the same score for Gaming, Movies and Bright
rooms, and `ans.pick` is just the overall winner repeated across the row.

Measured across the whole export: **1010 of 1010 table rows have an identical winner in
every lens column (100%)**, and only 22 rows contain a single "Tie".

Concrete contradiction, same catalog, same build:

| | `/category/electronics/tvs/` table | `/compare/hisense-u8n-vs-hisense-u7n/` |
|---|---|---|
| Gaming | Hisense U8N Mini-LED | "Too close to call on gaming from the spec sheets." |
| Movies | Hisense U8N Mini-LED | "Too close to call on movies from the spec sheets." |
| Bright rooms | Hisense U8N Mini-LED | "Too close to call on bright rooms from the spec sheets." |

And `Hisense U8N vs LG G4`: the hub says LG G4 for all three lenses; the compare page
picks LG G4 for Gaming only and declines to call Movies and Bright rooms.

This is worse than a cosmetic bug for a citation-optimization change. The table is the
one artifact on the hub that an LLM will lift verbatim ("best TV for movies"), and it
asserts a winner precisely where the site's own methodology refuses to. A grep for
"hub exists with an `<h1>` containing TVs" passes either way — this is the finding that
survives the brief's own verify checklist.

Fix (one line plus an import):

```ts
import { buildAnswer, checkDealBreakers, flattenRows, lensRows, shortName } from '@/lib/decision'
// ...
rows: lensRows(rows, uc),
```

Expect many cells to become "Tie" afterwards. That is the correct output, not a
regression — and it makes the `winner !== 'Tie'` styling at line 244 meaningful.

---

## P1

### P1-2 · The 1010 Markdown twins are unreachable
`src/lib/llms.ts:64`, `src/app/sitemap.ts:91-102` — **brief unmet (T6)**

Nothing anywhere links to a `.md` twin. Verified against the export:

- `grep -c index.md` on a compare page's HTML → `0`
- `grep -c index.md` on `llms.txt` → `0`
- `.md` entries in `sitemap.xml` → `0`
- no `<link rel="alternate" type="text/markdown">`, no `Link:` header (impossible anyway, see P2-5)

T6 says *"Link the twin from `llms.txt` featured rows if the URL is stable."* The URL
**is** stable (`/compare/<slug>/index.md`), so the condition is met and the link is
missing. As shipped, a crawler can only find these files by guessing the convention.
The build cost is paid and the citation benefit is zero.

Cheapest fix: append the twin to each featured row in `buildLlmsText`, e.g.
`- [A vs B](url): verdict — Markdown: <url>index.md`, and/or add the 1010 `.md` URLs
to the sitemap.

### P1-3 · llms.txt "flagship" selection is alphabetical, not flagship
`src/lib/llms.ts:38-48` — **brief partially unmet (T5)**

The loop walks `comparisons` in catalog order and takes the first 20 that match
`FLAGSHIP_PATTERN`, so the cap is hit inside the `a…` slugs. The shipped result:

- **8** MacBook Air rows, **7** AirPods Max rows — 15 of the 20 flagship slots
- **0** iPhone matchups (`iPhone 17 Pro vs iPhone 17` is absent entirely)
- **0** Galaxy, **0** Bravia/A95, **0** WH-1000 rows beyond the AirPods Max pairings
- Amex and Dyson appear only via the per-subcategory featured pick

The brief's list ("prefer names containing iPhone, Galaxy, MacBook, OLED/Bravia/A95,
Dyson, Amex, WH-1000, Bose") reads as a spread across those families, not "whichever 20
sort first". The root file is the front door for GPTBot/ClaudeBot/PerplexityBot (all
explicitly allowed in `robots.txt`) and currently presents the catalog as a laptop-and-
headphone site. The bullet-count check (`36`, well under 1010) passes regardless.

Fix: bucket by matched pattern term and round-robin, or sort candidates by term index
before slicing to 20.

---

## P2

### P2-4 · Product FAQ Q3 lists matchup titles instead of rivals, and has no links
`src/lib/faq.ts:121-124` — **brief unmet (T9: "names + links")**

`matching.map((c) => c.productName)` yields the matchup title `"A vs B"`, which includes
the product being described. Rendered output:

> Blue Cash Everyday Card from American Express is compared head to head against **Blue
> Cash Preferred Card from American Express vs Blue Cash Everyday Card from American
> Express**.

An extractor reads the rival as the literal string `"X vs Y"`. Use the *other* product's
name. Links are also absent (the coordinator's suspicion — confirmed); the visible render
is `<p>{a}</p>`, so adding links means restructuring `Qa` to carry parts. Given the
schema/visible parity is otherwise perfect, the rival-name fix is the higher-value half.

Also at `src/lib/faq.ts:97`: `priceShort` already returns `"$0/yr"`, so the fee branch
reads *"has an annual fee of $0/yr"*.

### P2-5 · Static export drops the `Content-Type` header on the `.md` twins
`src/app/(us)/compare/[slug]/index.md/route.ts:32`

`node_modules/next/dist/docs/01-app/02-guides/static-exports.md:235` — a route handler
"will render a static response"; only the body is written to disk. Confirmed: no `.meta`
or headers artifact anywhere in `.next-static/`. The declared
`text/markdown; charset=utf-8` is inert; the host's MIME map decides. `.txt` is safe
everywhere, `.md` is not (S3 defaults unknown extensions to `binary/octet-stream`, which
makes a browser download rather than render). This is a deploy-config item, not a code
bug — worth one line in the deploy notes.

### P2-6 · New code hardcodes US paths in market-aware components
`src/views/subcategory-page.tsx:69,395,409`; `src/views/category-page.tsx:217,227`

Both components take `market` and use `categoryHref(id, market)` / `homeHref(market)` /
`marketPath` everywhere else, but the new hub links and JSON-LD `item`/`url` are built
from a literal `` `/category/${slug}/${sub}/` ``. `pageAlternates` still resolves the
canonical correctly, so metadata is safe; the `<Link>`s and JSON-LD URLs are not.

Related, same commit: `buildLlmsText` lost its `market === 'uk'` blockquote branch
(`src/lib/llms.ts:53-55`), so `src/app/_uk/llms.txt/route.ts` — which calls
`buildLlmsText('uk')` — would now emit "US catalog."

All latent: `_uk` is an underscore-private folder, nothing is routed, and
`check:i18n --export` confirms no `/uk/` is emitted. But there is no `[sub]` route under
`_uk` at all, so publishing UK turns these into 404 links rather than wrong-but-working
ones. Use a `subHubHref(cat, sub, market)` helper in `src/lib/nav.ts` alongside the
existing ones.

### P2-7 · Acronym lowercased in hub lead and meta description
`src/views/subcategory-page.tsx:68,190,307`

`subLabel(sub).toLowerCase()` turns `TVs` into `tvs`. Live output:

- `<meta name="description">`: "Compare 16 **tvs** head to head across published specifications."
- page lead: "Compare 16 **tvs** head to head across 28 tracked specifications."
- `<h2>`: "All **tvs** in the catalog"

The description is what a search result shows. Reads fine for "credit cards" and
"laptops"; only the acronym subs break. A small label map or a
`subLabelLower(sub)` helper fixes all three call sites.

### P2-8 · Finance hub claims "maker spec sheets" for credit cards
`src/views/subcategory-page.tsx:191-192`

`/category/finance/credit-cards/` reads "scored strictly from published maker spec sheets
with no lab test estimates." The repo already distinguishes this case (`isFeeBased`,
`FinanceDisclaimer`, the "issuer terms" wording in `buildProductFaq`). Branch the lead
sentence on `isFeeBased(sub)`.

### P2-9 · Smartphones hub is 1.85 MB
`src/views/subcategory-page.tsx:410-414`

Measured: air-purifiers 854 KB → **smartphones 1,852 KB** (325 matchup cards + a 325-row
table + a 46 KB `CollectionPage.hasPart` array; 1.28 MB of that is the RSC flight
payload, which duplicates the rendered content). Existing category pages are 0.6–1.1 MB,
so this is in family but the phones hub is now the heaviest page on the site. Not a
blocker; consider capping `hasPart` and paginating or collapsing the matchup grid.

### P2-10 · `buildVerdict` runs twice per matchup on every hub
`src/views/subcategory-page.tsx:133` and `:271` — 650 calls per phones hub. Build-time
only, but the first pass already has everything the second needs. Compute once into
`lensTableData` and reuse.

### P2-11 · Inconsistent null handling in the same component
`src/views/subcategory-page.tsx:131-132` uses `byId.get(...)!` while `:268-270` guards
with `if (!productA || !productB) return null` over the same `subComparisons`. Both are
safe today (`subIds` is derived from `products`), but the file disagrees with itself.

### P2-12 · `FLAGSHIP_PATTERN` duplicated
Identical regex literal at `src/lib/llms.ts:11` and `src/views/subcategory-page.tsx:31`.
Export one from `src/lib/nav.ts` or a small shared module — it will drift otherwise, and
P1-3's fix touches one of the two.

### P2-13 · New `WebPage` node is an orphan
`src/views/compare-matchup.tsx:711-721`

The compare page now emits five JSON-LD blocks. The new `WebPage` carries `url` and
`dateModified` but no `@id`, and shares its `url` with the existing `ItemList` node —
so nothing ties the freshness signal to the entity a consumer actually reads. Literally
satisfies T7 ("Add JSON-LD `WebPage` … with `dateModified` and `url`"); adding
`dateModified` to the `ItemList`, or `@id`-linking the two, would make the signal land.

### P2-14 · Origin note duplicated per bullet, and re-worded from the existing helper
`src/views/compare-matchup.tsx:266-269,277-280`

`noteA` and `noteB` are computed from the same row-level `row.origin`, so a non-sheet row
prints the caveat twice in one sentence: *"…lists 280 AW (other published figure, not on
maker sheet); Shark … lists 180 AW (other published figure, not on maker sheet)."* Once
per bullet is enough. The strings are also a second wording of
`originNote()` (`src/data/spec-catalog.ts:17-20`: "Not on the official sheet" / "Our
summary") — two vocabularies for one concept.

### P2-15 · `AGY-BRIEF.md` committed
`AGY-BRIEF.md` (+147). The brief's own Out-of-scope section says *"prefer not to commit
AGY-BRIEF.md"*. `GEO-PLAN.md` and `GEO-P1-EVIDENCE.md` are defensible; the agent brief
is build scaffolding. Drop it before the PR.

### P2-16 · Catalog date is older than every source date it sits next to
`src/lib/site.ts:7` — `CATALOG_AS_OF = '2026-09-01'`, while every `officialSource.asOf`
in the catalog is `2026-09-02`. This commit is what puts them in the same sentence:

> Catalog as of September 1, 2026 … iPhone 17 Pro lists 204 g (Apple sheet, 2026-09-02)

A citing model sees a snapshot that predates its own sources. Data-owned, not introduced
by this diff — but newly visible because of it.

---

## Checked and clear

- **`notFound()` in a static-export route handler** (`.../index.md/route.ts:18,26`) — dead
  code, not a footgun. `generateStaticParams` delegates to
  `generateStaticParamsForMarket('us')`, the same source the compare pages use, so no
  unlisted slug can reach the handler. `dynamic = 'force-static'` is present on all three
  new/edited handlers.
- **`index.md` as a path segment** — no collision. Exports as a real *file* at
  `.next-static/compare/<slug>/index.md` (1010 of them) alongside `index.html`, not as a
  directory. Directory-index resolution still serves `index.html` for `/compare/<slug>/`.
- **UK unpublished** — `PUBLISHED_MARKETS` untouched, `_uk` still underscore-private,
  `check:i18n --export` asserts no `/uk/` in the export. Passes. (Latent UK issues are
  filed under P2-6, which is about market-blind URL construction, not publication.)
- **Schema/HTML mismatch** — none found. All 3 product FAQ Q&A strings verified present
  verbatim in the rendered DOM; 119/119 product pages carry `FAQPage`; no empty `—`
  placeholder leaked into any answer.
- **`canonicals / SITE_URL`** — still the pre-existing `tiebreak.app` fallback behind
  `NEXT_PUBLIC_SITE_URL` with its `TODO(owner)`. Nothing newly hardcoded. Not filed.
- **Import cycles** — `format.ts` → `site.ts` is new; `site.ts` imports nothing. Clean.
- **Sitemap** — 7 sub-hub `<loc>`s, correct `languages(path, false)`, no duplicates
  (`seenSubs` guard), 1145 total locs.
- **No `/best/...` URL tree** was added, per the T10 guard rail.

---

## Verdict

**ship-with-fixes** — P0-1 blocks.

P0-1 is a one-line change (`rows: lensRows(rows, uc)`) and must land before this is
published: the hubs currently assert a per-use-case winner on 1010 matchups × 3–4 lenses
where the site's own compare pages decline to call it, and the brief's verify checklist
cannot see it. P1-2 and P1-3 should land in the same pass — both are small, both are the
difference between "the artifact exists" and "the artifact does the job the P1 plan was
written for". Everything else is follow-up.

T8 is the strongest part of this diff and needs nothing: 1010/1010 pages, sourced,
honest about non-sheet figures.
