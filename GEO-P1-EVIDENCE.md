# GEO P1 (On-Page Citation) Implementation Evidence

## Summary of Changes
Implemented tasks T5 through T11 from `AGY-BRIEF.md` for GEO P1 (On-Page Citation Optimization) in worktree `feat-geo-citation-p1`:
1. **T5 (`llms.txt` spec + `/.well-known/llms.txt`)**:
   - Rewrote `buildLlmsText` in `src/lib/llms.ts` adhering to llmstxt.org specification: `# Tiebreak`, blockquote summary with catalog snapshot date and spec-sheet disclaimer, curated `## Matchups` (~27 featured pairs: 1 per subcategory + flagship pairs), `## All matchups` pointers, `## Methodology`, `## Products`, and `## Optional`.
   - Created static route `src/app/.well-known/llms.txt/route.ts` serving the identical content as `/llms.txt`.
2. **T6 (Markdown twins)**:
   - Implemented `buildCompareMarkdown` in `src/lib/llms.ts` generating concise LLM-friendly factsheets (`Index: /llms.txt`, `# title`, catalog as-of, canonical URL, plain-language verdict, score summary, deal-breakers, best-for lens analysis, markdown table of differing specs, and direct maker source citations).
   - Created route handler `src/app/(us)/compare/[slug]/index.md/route.ts` generating static `.md` files for every published comparison.
3. **T7 (Visible date + `dateModified` JSON-LD)**:
   - Added `formatCatalogDate` helper in `src/lib/format.ts`.
   - Added visible `Catalog as of {formatCatalogDate(CATALOG_AS_OF)}` to compare pages (`src/views/compare-matchup.tsx`) and product pages (`src/views/product-page.tsx`).
   - Added schema.org `WebPage` JSON-LD with `dateModified: CATALOG_AS_OF` on compare pages.
4. **T8 (Numbers + maker source next to claims)**:
   - Added visible "Why, in numbers" section on compare pages (`src/views/compare-matchup.tsx`) citing both products' values and linking directly to manufacturer official sources where available.
5. **T9 (Product FAQ + `FAQPage` schema)**:
   - Added `buildProductFaq` in `src/lib/faq.ts` answering price snapshot (with disclaimer), key highlight specs, and comparison cross-references.
   - Added visible `<h2>Frequently asked</h2>` section and matching `FAQPage` JSON-LD to `src/views/product-page.tsx`.
6. **T10 (Subcategory Hubs)**:
   - Created subcategory hub view component `src/views/subcategory-page.tsx` with H1 `{subLabel} comparisons`, 40–80 word intro lead, flagship link, use-case winner comparison table (`casesFor(sub)`), matchup listing with `verdictLine`, product directory, `BreadcrumbList`, and `CollectionPage` JSON-LD.
   - Created static route `src/app/(us)/category/[slug]/[sub]/page.tsx`.
   - Added category page links to subcategory hubs in `src/views/category-page.tsx`.
   - Updated sitemap generator in `src/app/sitemap.ts` with subcategory hub URLs.
7. **T11 (Answer-first check)**:
   - Confirmed verdict line on compare page and markdown twins is concise, answer-first, and starts immediately with the winner and reasoning without marketing filler.

---

## Verification Commands & Output

### 1. Verification Suite (`npm run verify`)
Command:
```bash
npm run verify
```
Output:
```
> comparison-website@1.0.0 verify
> npm run lint && npm run typecheck && npm run check:catalog && npm run check:i18n && npm run build && npm run check:export


> comparison-website@1.0.0 lint
> eslint src


> comparison-website@1.0.0 typecheck
> tsc --noEmit


> comparison-website@1.0.0 check:catalog
> node scripts/check-catalog.mjs

ok  no duplicate product ids  got=true want=true
ok  no orphan comparisons  got=0 want=0
ok  no duplicate comparison pairs  got=0 want=0
ok  no self comparisons  got=0 want=0
ok  every product has at least one matchup  got=0 want=0
ok  comparison filenames match productA-vs-productB  got=0 want=0
ok  every product has specs  got=0 want=0
ok  required product fields present  got=0 want=0
ok  category lists do not promise empty types  got=0 want=0
ok  popular searches match the catalog  got=0 want=0
ok  all subcategories are known  got=true want=true
ok  credit cards have issuer-terms URLs  got=0 want=0
ok  every product has an official source URL  got=0 want=0

all catalog checks passed (119 products, 1010 comparison files)

> comparison-website@1.0.0 check:i18n
> node scripts/check-i18n.mjs

ok  marketPath us home  got=/ want=/
ok  marketPath uk home  got=/uk/ want=/uk/
ok  marketPath uk compare  got=/uk/compare/a-vs-b/ want=/uk/compare/a-vs-b/
ok  uk availability attestations are valid  got=true want=true
ok  all market variants have valid verification  got=true want=true
ok  uk region-sensitive keys verified or sameAsUs  got=true want=true
ok  sameAsUs never certifies region-specific wording  got=true want=true
ok  sameAsUs keys exist and do not overlap UK overrides  got=true want=true
ok  samsung-galaxy-s24 UK resolved chipset contains Exynos and not Snapdragon  got=true want=true
ok  samsung-galaxy-s24 US/base chipset contains Snapdragon and not Exynos  got=true want=true
ok  none of the six US-only ids include uk  got=true want=true
ok  uk has no cards  got=true want=true
ok  cards us-only  got=true want=true
ok  4.9 lb (2.2 kg) trips  got=true want=true
ok  3.5 lb (1.6 kg) stays  got=true want=true
ok  2.2 kg trips  got=true want=true
ok  900 sq ft trips  got=true want=true
ok  90 m² trips  got=true want=true

all i18n checks passed

> comparison-website@1.0.0 build
> next build

▲ Next.js 16.3.4 (Turbopack)
✓ Running next.config.ts took 107ms

  Creating an optimized production build ...
✓ Compiled successfully in 1418ms
  Running TypeScript ...
  Finished TypeScript in 2.2s ...
  Collecting page data using 9 workers ...
  Generating static pages using 9 workers (0/2164) ...
  Generating static pages using 9 workers (541/2164) 
  Generating static pages using 9 workers (1082/2164) 
  Generating static pages using 9 workers (1623/2164) 
✓ Generating static pages using 9 workers (2164/2164) in 30.7s
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /.well-known/llms.txt
├ ○ /about
├ ○ /apple-icon
├   /category/[slug]
│ ├ ● /category/electronics
│ ├ ● /category/appliances
│ └ ● /category/finance
├   /category/[slug]/[sub]
│ ├ ● /category/electronics/tvs
│ ├ ● /category/electronics/laptops
│ ├ ● /category/electronics/smartphones
│ └ ● [+4 more paths]
├ ○ /compare
├   /compare/[slug]
│ ├ ● /compare/aleno-breathe-smart-75i-vs-blueair-blue-pure-211-plus-auto
│ ├ ● /compare/aleno-breathe-smart-75i-vs-blueair-blue-pure-311i-max
│ ├ ● /compare/aleno-breathe-smart-75i-vs-blueair-protect-7470i
│ └ ● [+1007 more paths]
├   /compare/[slug]/index.md
│ ├ ● /compare/aleno-breathe-smart-75i-vs-blueair-blue-pure-211-plus-auto/index.md
│ ├ ● /compare/aleno-breathe-smart-75i-vs-blueair-blue-pure-311i-max/index.md
│ ├ ● /compare/aleno-breathe-smart-75i-vs-blueair-protect-7470i/index.md
│ └ ● [+1007 more paths]
├ ○ /contact
├ ○ /icon
├ ○ /llms.txt
├ ○ /opengraph-image
├ ○ /privacy
├   /product/[...slug]
│ ├ ● /product/electronics/samsung-q90c
│ ├ ● /product/electronics/lg-g3-oled
│ ├ ● /product/electronics/sony-a95l
│ └ ● [+116 more paths]
├ ○ /robots.txt
├ ○ /sitemap.xml
└ ○ /terms


○  (Static)  prerendered as static content
●  (SSG)     prerendered as static HTML (uses generateStaticParams)


> comparison-website@1.0.0 check:export
> node scripts/check-catalog.mjs --export && node scripts/check-i18n.mjs --export

ok  no duplicate product ids  got=true want=true
ok  no orphan comparisons  got=0 want=0
ok  no duplicate comparison pairs  got=0 want=0
ok  no self comparisons  got=0 want=0
ok  every product has at least one matchup  got=0 want=0
ok  comparison filenames match productA-vs-productB  got=0 want=0
ok  every product has specs  got=0 want=0
ok  required product fields present  got=0 want=0
ok  category lists do not promise empty types  got=0 want=0
ok  popular searches match the catalog  got=0 want=0
ok  all subcategories are known  got=true want=true
ok  credit cards have issuer-terms URLs  got=0 want=0
ok  every product has an official source URL  got=0 want=0
ok  static export has no /uk/  got=true want=true
ok  privacy page exported  got=true want=true
ok  terms page exported  got=true want=true
ok  about page exported  got=true want=true
ok  contact page exported  got=true want=true
ok  legal pages are in the sitemap  got=true want=true
ok  gold card page links issuer terms  got=true want=true
ok  gold card JSON-LD includes sameAs issuer URL  got=true want=true
ok  card matchup links both issuer terms  got=true want=true

all catalog checks passed (119 products, 1010 comparison files)
ok  marketPath us home  got=/ want=/
ok  marketPath uk home  got=/uk/ want=/uk/
ok  marketPath uk compare  got=/uk/compare/a-vs-b/ want=/uk/compare/a-vs-b/
ok  uk availability attestations are valid  got=true want=true
ok  all market variants have valid verification  got=true want=true
ok  uk region-sensitive keys verified or sameAsUs  got=true want=true
ok  sameAsUs never certifies region-specific wording  got=true want=true
ok  sameAsUs keys exist and do not overlap UK overrides  got=true want=true
ok  samsung-galaxy-s24 UK resolved chipset contains Exynos and not Snapdragon  got=true want=true
ok  samsung-galaxy-s24 US/base chipset contains Snapdragon and not Exynos  got=true want=true
ok  none of the six US-only ids include uk  got=true want=true
ok  uk has no cards  got=true want=true
ok  cards us-only  got=true want=true
ok  4.9 lb (2.2 kg) trips  got=true want=true
ok  3.5 lb (1.6 kg) stays  got=true want=true
ok  2.2 kg trips  got=true want=true
ok  900 sq ft trips  got=true want=true
ok  90 m² trips  got=true want=true
ok  static US S24 contains Snapdragon and not Exynos 2400  got=true want=true
ok  US-only export does not emit /uk/  got=true want=true

all i18n checks passed
```

---

### 2. Spot-Check 1: `head` of `llms.txt` is `#` then `>`
Command:
```bash
head -n 5 .next-static/llms.txt
```
Output:
```
# Tiebreak

> Head-to-head product comparisons scored from published specifications for shoppers deciding between two options. Spec-sheet comparisons not lab tests. US catalog. Catalog as of 2026-09-01.

## Matchups
```

---

### 3. Spot-Check 2: `grep -c '^- \['` on `llms.txt` is well under 1010
Command:
```bash
grep -c '^- \[' .next-static/llms.txt
```
Output:
```
36
```

---

### 4. Spot-Check 3: Compare HTML contains catalog-as-of, Why-in-numbers, and official source link
Command:
```bash
grep -o "Catalog as of <!-- -->September 1, 2026" .next-static/compare/sony-a95l-vs-lg-g4-oled/index.html
grep -o "Why, in numbers" .next-static/compare/sony-a95l-vs-lg-g4-oled/index.html
grep -o "https://electronics.sony.com/tv-video/televisions/all-tvs/p/xr65a95l" .next-static/compare/sony-a95l-vs-lg-g4-oled/index.html
```
Output:
```
Catalog as of <!-- -->September 1, 2026
Why, in numbers
https://electronics.sony.com/tv-video/televisions/all-tvs/p/xr65a95l
```

---

### 5. Spot-Check 4: Compare `index.md` contains verdict line and `Index: /llms.txt`
Command:
```bash
head -n 15 .next-static/compare/sony-a95l-vs-lg-g4-oled/index.md
```
Output:
```markdown
Index: /llms.txt

# Sony A95L OLED TV vs LG G4 OLED evo TV
Catalog as of 2026-09-01
Canonical: https://tiebreak.app/compare/sony-a95l-vs-lg-g4-oled/

LG G4 OLED evo TV leads 4 to 0 on the 4 rankable specs and costs $900 less, which makes it the straightforward pick. Most of the 28 attributes tracked here are descriptive rather than numeric.

## Score
- Sony A95L OLED TV: 0 wins
- LG G4 OLED evo TV: 4 wins
- Differing specs: 23 of 28 tracked
- Price gap: $900 (LG G4 OLED evo TV costs less)
```

---

### 6. Spot-Check 5: Product HTML contains `FAQPage` and “Frequently asked”
Command:
```bash
grep -o "Frequently asked" .next-static/product/electronics/sony-a95l/index.html
grep -o '"@type":"FAQPage"' .next-static/product/electronics/sony-a95l/index.html
```
Output:
```
Frequently asked
Frequently asked
"@type":"FAQPage"
```

---

### 7. Spot-Check 6: Subcategory hub HTML exists with `<h1>` containing TVs
Command:
```bash
head -c 2000 .next-static/category/electronics/tvs/index.html | grep -o "<h1[^>]*>[^<]*</h1>"
```
Output:
```html
<h1 class="display mt-2 text-[32px] sm:text-[44px]">TVs<!-- --> comparisons</h1>
```

---

### 8. Spot-Check 7: Sitemap `<loc>` includes subcategory hub
Command:
```bash
grep -o "<loc>[^<]*category/[^<]*/tvs/</loc>" .next-static/sitemap.xml
```
Output:
```xml
<loc>https://tiebreak.app/category/electronics/tvs/</loc>
```

---

## Changed Files List
- `src/lib/format.ts`: Added `formatCatalogDate` helper function.
- `src/lib/llms.ts`: Rewrote `buildLlmsText` (spec-compliant llms.txt with curated matchups) and added `buildCompareMarkdown` helper for markdown twins.
- `src/lib/faq.ts`: Added `buildProductFaq` helper function for product FAQ generation.
- `src/app/.well-known/llms.txt/route.ts`: Static route handler for `/.well-known/llms.txt`.
- `src/app/(us)/compare/[slug]/index.md/route.ts`: Static route handler for comparison markdown twins (`/compare/[slug]/index.md`).
- `src/app/(us)/category/[slug]/[sub]/page.tsx`: Static route for US subcategory hubs (`/category/[slug]/[sub]/`).
- `src/views/subcategory-page.tsx`: View component and metadata generator for subcategory hubs.
- `src/views/compare-matchup.tsx`: Added catalog as-of date, "Why, in numbers" fact list with direct maker source links, and schema.org `WebPage` `dateModified` JSON-LD.
- `src/views/product-page.tsx`: Added catalog as-of date, visible `<h2>Frequently asked</h2>` section, and schema.org `FAQPage` JSON-LD.
- `src/views/category-page.tsx`: Added links from category shortlist headings to subcategory hubs.
- `src/app/sitemap.ts`: Added subcategory hub entries to sitemap generation.
