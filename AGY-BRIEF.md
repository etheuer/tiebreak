# Implement GEO P1 (on-page citation)

You are the only editor in this worktree. Other agents are on the main checkout (`fix/typography-scale` font audit). Do not touch that tree. Preserve any files you did not mean to change.

## Goal

Make this comparison site’s pages easier for ChatGPT / Perplexity / Claude / Gemini to **cite and copy** (verdict sentence, numbers, use-case winner). Public name/domain is **not chosen** — never hardcode `tiebreak.app` as a live origin. Keep using `SITE_URL` / `absUrl()` / `CATALOG_AS_OF`.

User-visible done: after `npm run verify`, a production export contains spec-compliant `/llms.txt`, Markdown twins for compare pages, visible catalog date + `dateModified`, inline maker-source citations next to numeric claims, product-page FAQs, and subcategory hub pages.

## Repo

- Workdir (only): `/Users/fulanodetal/.herdr/worktrees/comparison-website/feat-geo-citation-p1`
- Branch: `feat/geo-citation-p1` (already created from `d378d50`)
- Plan: `GEO-PLAN.md` sections **P1 T5–T10** (and T11 if trivial). Skip P0 live-domain, Bing submit, P2 Wikidata/PR, T12–T15.
- Stack: Next.js 16 App Router, `output: 'export'`, `trailingSlash: true`, `distDir: '.next-static'`. Read `node_modules/next/dist/docs/01-app/02-guides/static-exports.md` and `.../15-route-handlers.md` before adding routes. Route handlers must `export const dynamic = 'force-static'` and use `generateStaticParams` for dynamic segments. No server that runs at request time. No `redirect()` (unsupported in static export).
- Launchers: never `npx` / `npm run dev` / `npx next`. Use `node_modules/.bin/…`. Verify with `npm run verify` from this worktree. `python3` not `python`. Absolute paths. No `node -e`.
- Do not edit `src/data/` JSON (catalog). Do not redesign. Do not change `DecisionPanel.tsx` behavior. Do not publish UK (`src/app/_uk` stays unpublished; `PUBLISHED_MARKETS` is `['us']`).
- Comments: why only. Match existing style.

## Tasks (do in order)

### T5 — `llms.txt` spec (`src/lib/llms.ts`, `src/app/llms.txt/route.ts`)

llmstxt.org: H1, then a **blockquote** summary (`>`), then `##` sections of `- [text](url): note`.

- Keep MIME `text/plain; charset=utf-8`.
- Do **not** list all ~1010 matchups in the root file. Curate:
  - `## Matchups` — one featured pair per subcategory (first comparison whose productA subcategory matches `SUBCATEGORY_LABEL` order) **plus** up to 20 flagship pairs (prefer names containing iPhone, Galaxy, MacBook, OLED/Bravia/A95, Dyson, Amex, WH-1000, Bose).
  - Each line: `- [A vs B](absUrl): <verdictLine>`
  - `## All matchups` — link `/compare/` hub and `/sitemap.xml`
  - `## Methodology` — `/about/`
  - `## Products` — skip full dump; link category pages
  - `## Optional` — privacy/terms
- Blockquote must include: spec-sheet comparisons not lab tests; US catalog; `Catalog as of ${CATALOG_AS_OF}`.
- If easy, also emit `/.well-known/llms.txt` with the same body (`src/app/.well-known/llms.txt/route.ts`). Skip if Next export rejects the path.

### T6 — Markdown twins

Mirror `src/app/llms.txt/route.ts`. Add `src/app/(us)/compare/[slug]/index.md/route.ts` (or `facts.md` if `index.md` collides with `page.tsx` — Next forbids `route.ts` beside `page.tsx` in the **same** segment; put the md route in a child segment such as `src/app/(us)/compare/[slug]/index.md/route.ts` so the URL is `/compare/<slug>/index.md`).

Each file:

```
Index: /llms.txt

# {productName}
Catalog as of {CATALOG_AS_OF}
Canonical: {html url}

{verdictLine}

## Score
- A wins, B wins, differing, price gap

## Deal-breakers
…

## Best for
### {lens}
{headline}
- reasons

## Specs that differ
markdown table of differing rows (label | A | B)

## Sources
- [name](officialSource.url) (asOf)
```

`generateStaticParams` from `generateStaticParamsForMarket('us')`. Content-Type `text/markdown; charset=utf-8`. Link the twin from `llms.txt` featured rows if the URL is stable.

Optional: same for product pages if cheap. Compare twins are required.

### T7 — Visible date + `dateModified`

Show `Catalog as of {formatted CATALOG_AS_OF}` near the compare (and product) verdict. Add JSON-LD `WebPage` (or Article) on compare pages with `dateModified: CATALOG_AS_OF` and `url`. Use existing `CATALOG_AS_OF` in `src/lib/site.ts`. Do not invent per-page dates.

### T8 — Numbers + maker source next to claims

In `src/views/compare-matchup.tsx`, after the verdict `<p>`, add a short “Why, in numbers” list (3–5 bullets). Each bullet: one differing spec + both values + link to `officialSource.url` when present (`officialSourceUrl()`). Example shape: `{A shortName} lists {value} ({source asOf}); {B} lists {value}.` Do not invent quotes. If a row is marked as not on the official sheet, say so (existing catalog notes). Keep the footer source links.

Reuse `verdict.highlights` / differing rows already computed. Pure helper in `src/lib/` if it stays small.

### T9 — Product FAQ + `FAQPage`

In `src/lib/faq.ts` add `buildProductFaq(product, comparisons, market)`:

1. How much does {name} cost? — list snapshot + as-of, not a live offer
2. What are {name}’s key specs? — 3 highlight fields via existing `highlightFields` / spec helpers
3. What does {name} compare against? — names + links of matchups containing this product (cap ~6)

Render visible `<h2>Frequently asked</h2>` + `<h3>`/`<p>` on `src/views/product-page.tsx` and matching `FAQPage` JSON-LD (same strings).

### T10 — Subcategory hubs

Add US routes `/category/[slug]/[sub]/` (e.g. `/category/electronics/tvs/`) with `generateStaticParams` over categories × subcategories that actually have products.

Page: H1 `{subLabel} comparisons`, 40–80 word lead (how many products, how scoring works, link a flagship pair), list products, list matchups with `verdictLine`. JSON-LD `CollectionPage` + `BreadcrumbList`. Metadata unique per sub.

On each hub, a table of use-case winners from `casesFor(sub)`: one column per lens, rows = matchups (or a compact “Best for {lens}” list of pair winners). Do **not** add a new `/best/...` URL tree unless hubs are done and verify still passes.

Update sitemap (`src/app/sitemap.ts`) with the new URLs. Footer/nav: optional one link per sub from category page; don’t bloat header.

### T11 — only if verdict paragraph is > ~40 words

Do not add a marketing lede above `verdictLine()`.

## Out of scope

- Domain purchase, `NEXT_PUBLIC_SITE_URL` in `.env`, Bing/IndexNow submit
- Wikidata, Crunchbase, Reddit, YouTube, Wikipedia
- UK public catalog
- Product images
- PostHog MCP / dashboard (Analytics.tsx may stay as-is)
- Committing GEO-PLAN.md / this brief unless useful; prefer not to commit AGY-BRIEF.md
- Push / PR (coordinator will handle)
- `src/data/**` catalog JSON
- Installing new npm packages unless verify is impossible without them (this repo has no vitest; do not add a test harness)

## Verify

From this worktree:

```
npm run verify
```

Plus spot-checks after build (paths under `.next-static/`):

- `head` of `llms.txt` is `#` then a `>` blockquote
- `grep -c '^- \['` on `llms.txt` is well under 1010 (curated)
- one compare HTML contains catalog-as-of text, a Why-in-numbers list, and an official-source href near it
- one compare `index.md` (or facts.md)  exists and contains the verdict line and `Index: /llms.txt`
- one product HTML contains `FAQPage` and “Frequently asked”
- one subcategory hub HTML exists (e.g. `category/electronics/tvs/index.html`) with an `<h1>` containing TVs
- sitemap `<loc>` includes at least one `/category/.../tvs/` (or equivalent sub)

If `index.md` as a folder name fails the build, use `facts.md` and note it.

Write `GEO-P1-EVIDENCE.md` in this worktree with commands run, greps, and any build errors you hit.

## Commit

One or more conventional commits on `feat/geo-citation-p1` only (`feat:` / `fix:`). Do not commit to `main`. Do not `--no-verify`. Do not push. Do not amend others’ commits.

When finished, reply with: files changed, verify output summary, evidence path, remaining gaps.
