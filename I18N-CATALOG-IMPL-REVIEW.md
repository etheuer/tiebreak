# Catalog implementation review (phase 1.1)

Reviewer: Claude Fable 5.1 (replaces the Grok 4.6 stand-in written while this session was rate-limited). Implementer: agy (Gemini 3.7 Flash). Coordinator: Grok. Spec: `I18N-CATALOG-PLAN.md`. Prior plan review: `I18N-CATALOG-PLAN-REVIEW.md`. Date: 2026-09-01.

Reviewed against the working tree, `src/data/products.json`, the 105 comparison files, `scripts/check-i18n.mjs`, and the static export in `.next-static/` (every HTML file there is newer than `products.json`, so it reflects the current data). Ran read-only: `node scripts/check-i18n.mjs` (all 15 checks pass) and `node_modules/.bin/tsc --noEmit --incremental false` (exit 0, no tsbuildinfo written). No server started, no agents spawned, no `.env` read, nothing edited except this file.

## Plain language

The catalog change does what the spec asked. Six American-only appliances and TVs are gone from the British site, the British Galaxy S24 page now shows the Exynos chip and the American page shows the Snapdragon, and Google is told the right thing about which pages have a British twin. Two things still make the British site lie about money, and neither is in the catalog change itself: the British home page says a vacuum "saves £450" using a dollar figure, and 34 British matchup pages carry a dollar price gap in the text search engines show. A third problem is inside the change: the sign-off list says six phones have the same 5G radio in Britain as in America, and they do not. All three are small fixes. Fix them before calling the British catalog honest.

## Verdict

**Gaps to fix, then ship.** T1, T3, T4 and T6 match the spec and the build proves it. T2 is done to the letter but the letter was a rubber stamp, and on `cellular` the stamp is false for six phones. T5 catches data regressions and no code regressions. Two spec ground rules ("do not invent GBP", no `$` on UK pages) are broken in the built UK output by view code the catalog diff did not touch. None of this needs a redesign. Three of the fixes are one line each.

## The six review items

| # | Item | Result | Evidence |
|---|---|---|---|
| 1 | `resolveProduct` + `getProductById(id, market)` used on UK pages | **Yes** | `resolveProduct` lives in `src/lib/pricing.ts` (no `fs`). `getProducts` and `getProductById` in `src/lib/data.ts` both resolve. Every UK-rendering call site passes `market`: `src/views/product-page.tsx:39,76` and `src/views/compare-matchup.tsx:53-54,231-232`. Built `/uk/product/electronics/samsung-galaxy-s24/` contains `Exynos 2400 (4 nm)` ×4, `Xclipse 940`, `5G (sub-6)`, and zero `Snapdragon`, `Adreno`, `mmWave`. |
| 2 | Six US-only ids off UK; S24 split | **Yes** | All six are `markets: ["us"]` with no `availability` or `sameAsUs`. UK export has 40 product folders, none of the six; 32 matchups dropped from UK (5 TCL, 17 purifier pairs with the dropped units, 10 finance). Base S24 sheet: `Snapdragon 8 Gen 3 for Galaxy (4 nm)` / Cortex-X4 8-core / `Adreno 750`; `variants.uk` is byte-for-byte the spec's JSON with `verified` present; `sameAsUs: ["charger_in_box"]`. `galaxy-s24-ultra` stays Snapdragon with `chipset, cpu, gpu` in `sameAsUs`. US S24 HTML has zero `Exynos`. `xiaomi-14-ultra` keeps both markets and the grey-import prefix. |
| 3 | `availability.uk` + `sameAsUs` vs rubber stamp | **Rubber stamp, and partly false** | All 40 UK products carry `availability.uk = { asOf: "2026-09-01", source: "manufacturer" }`, exactly as §3 dictated, so the field proves only that agy ran a loop. `sameAsUs` never lists a key absent from the sheet and never overlaps an override (good). But it certifies `cellular` as identical for `iphone-16`, `iphone-16-pro`, `google-pixel-9`, `google-pixel-9-pro`, `samsung-galaxy-z-fold-6`, `oneplus-12` whose base string is `5G (sub-6 + mmWave)`; UK retail units of these phones have no mmWave. The spec knew this (it overrides `cellular` on the S24) and then told agy to stamp the rest. Also stamped: `energy` = `49 W max (Energy Star verified)` on `levoit-core-600s` and `blueair-protect-7470i` (a US/CA label shown to UK shoppers), and the UK iPhone pages render `sim: eSIM (US) / dual nano + eSIM (many other regions)`, which no guard sees because `sim` is not in the region-key list. |
| 4 | hreflang x-default; banner empty-catalog | **Yes** | `pageAlternates` in `src/lib/hreflang.ts`: UK-only case returns `en-GB` + `x-default` both self, no `en-US`; US-without-twin returns `en-US` + `x-default` = US path. Built UK S24 page: canonical self, `en-US` and `x-default` → US path, `en-GB` self. Built US `tcl-qm8` page: `en-US` + `x-default` only, no `en-GB`. Sitemap: 279 URLs, 117 UK (40 + 73 + 2 + home + hub), zero `/uk/.../tcl-qm8`, `lg-c4-oled-vs-tcl-qm8` has no `en-GB` alternate. Home `includeUk = ukProducts.length > 0`, hub `ukComparisons.length > 0`, sitemap `hasUkHome`/`hasUkHub`, banner `publishedInUk('/')` = `ukProductIds.size > 0`. UK home renders "73 published". Finance absent under `/uk/`. |
| 5 | Check-script strength | **Data yes, code no** | See below. |
| 6 | Fix list | Below. |

## Item 5 in full: would the script still pass if UK S24 showed Snapdragon?

- **If the data regressed** (someone edits `variants.uk.specifications.chipset` back to Snapdragon, or deletes `variants.uk`): the script fails. Good.
- **If the code regressed**: the script still passes. `scripts/check-i18n.mjs` carries its own copy of `resolveProduct` and reads `products.json` only. Delete the `market` argument from `resolveProduct(found, market)` in `getProductById`, or from `getProductById(slug[1], market)` in the product view, and the script prints `all i18n checks passed` while the built UK S24 page says Snapdragon. There is not one assertion over `.next-static/`, although the spec's "After build" list has five and the coordinator checked them by hand.
- Other soft spots: `availability.uk.asOf` and `source` are tested for truthiness only (`"x"` passes); `variants.uk.verified` is never asserted (TypeScript requires it but the JSON is cast, not validated); `sameAsUs` accepts any string with no evidence check, which is how the six false `cellular` stamps got through.

## Findings outside the catalog diff, visible in the built UK output

These are in files the catalog work did not touch, but they break the spec's own ground rules on pages the catalog change is supposed to make honest.

- **UK home prints dollar gaps with a pound sign.** `src/views/home-page.tsx:65` calls `buildVerdict(pair.productA, pair.productB)` with no `market`. `buildVerdict` defaults to `us`, so `priceOf(product, 'us')` returns the legacy USD amount and sets `priceGap` and `priceLeader`. `VsCard` then formats the gap with the page's market. Built `/uk/` card: "Dreame Z10 Station · Price not listed · VS · Dyson Gen5detect Absolute · Price not listed · Dyson leads on 4 of 6 rankable specs, but Dreame saves £450." Three cards on the UK home say £300, £400, £450. These are USD figures. The spec forbids inventing GBP. Product page, category page, hub and llms.txt all pass `market` correctly; only the home does not.
- **34 of 73 UK matchup pages carry a `$` figure in their meta description.** `src/views/compare-matchup.tsx:49,224` call `getComparisonBySlug(slug)` with no `market`, so `buildComparisonDescription` runs with US prices. When the verdict line is shorter than 120 characters the metadata appends it. Example, `/uk/compare/dreame-z10-station-vs-dyson-gen5detect/`: "… Compare Dreame Z10 Station vs Dyson Gen5detect Absolute: 6 rankable specs, a $450 price gap, …". Spec §5 says products for the page must be loaded with `market`; agy did that, but the description string that ships in `<head>` still comes from the market-less call. No UK product page has this problem.

## Smaller gaps

- `src/views/category-page.tsx` derives `includeUk` from `slug !== 'finance'`, not from the UK catalog. If appliances ever lost every UK product, the US appliances page would still advertise an `en-GB` twin that the UK build no longer emits. The sitemap does this correctly (`ukCategoryIds`). Latent today.
- Sitemap iterates `usProducts` and `usComparisons` only, so a future `markets: ['uk']` product would be absent from the sitemap entirely, and the UK-only `x-default` branch in `pageAlternates` is unreachable for product and compare pages (they 404 when not in UK). Harmless with today's data; note it before the first UK-only product.
- No comparison file includes `samsung-galaxy-s24`, so the override path is exercised on exactly one page (the UK product sheet). No UK compare table ever renders an Exynos row. Not a defect, but the check script's S24 assertions are the only thing covering the merge.
- The optional "UK model differs on: chipset, cpu, gpu, cellular" line was skipped. Fine per spec.
- No `prices.uk` on any product, so every UK price reads "Price not listed". Per spec, correct until someone cites a URL.

## Ranked fix list

1. **Data: stop certifying mmWave for UK phones.** In `products.json`, for `iphone-16`, `iphone-16-pro`, `google-pixel-9`, `google-pixel-9-pro`, `samsung-galaxy-z-fold-6`, `oneplus-12`: add `variants.uk.specifications.cellular = "5G (sub-6)"` with a `verified` block, and remove `cellular` from `sameAsUs`. Do the same for `galaxy-s24-ultra` (its "region-dependent" hedge is honest but the UK sheet should say sub-6). Decide `energy` on the two purifiers (recommend overriding to the wattage without "Energy Star"). Data-only, no owner conflict.
2. **One token in `src/views/home-page.tsx:65`:** `buildVerdict(pair.productA, pair.productB, market)`. Removes the £-from-USD cards on `/uk/`. Owned by the `fix-layout` crewmate per `.crew-status.md`; hand it to them, do not edit it from here.
3. **Two call sites in `src/views/compare-matchup.tsx:49,224`:** `getComparisonBySlug(slug, market)`. Removes the `$` gap from 34 UK meta descriptions. Same owner as item 2.
4. **Harden `scripts/check-i18n.mjs`:** (a) for every key in `sameAsUs`, fail if the base value matches `/mmWave|\(US|US\/CA|Energy Star/i` (this would have caught item 1); (b) assert `variants.*.verified.asOf` and `.source` exist; (c) assert `availability.uk.asOf` matches `^\d{4}-\d{2}-\d{2}$` and `source` is `manufacturer` or starts with `http`; (d) when `.next-static/` exists, run the spec's five post-build greps plus "no `£` on any UK page while `prices.uk` is absent everywhere" and "no `$` digit in any UK `<meta name="description">`". Item (d) is the only thing that catches a code regression, since the script's resolver is a copy of the real one.
5. **Add `sim` to the region-sensitive key list** (spec amendment) and override it on the two iPhones, or strip the "(US)" hedge from the base string.
6. `category-page.tsx`: compute `includeUk` from `getCategories('uk')` like the sitemap does.
7. Replace the 40 `"manufacturer"` sources with URLs when a human looks each one up. Not blocking; the spec asked for the placeholder.

Items 1 to 3 are the ones that stand between "matches spec" and "the UK site tells the truth". Cost of shipping without them: the British home page quotes savings in pounds that are dollar figures, and six British phone pages certify a radio they do not have.

## Remediation status (2026-09-01)

The blocking findings above are resolved in the current working tree:

- Home-page verdicts and comparison metadata now resolve prices in the active market, so UK pages no longer relabel USD gaps as GBP or emit dollar amounts in descriptions.
- The affected phones now carry explicit, sourced UK cellular/SIM variants, and the two purifiers carry neutral UK wattage variants rather than US certification wording.
- Category alternates are derived from the actual UK catalog.
- `scripts/check-i18n.mjs` now validates attestations, `sameAsUs`, region-sensitive wording, and the emitted static HTML for market-specific products, routes, prices, and metadata.

Final verification passed: TypeScript, all i18n assertions, and the webpack production build with 286/286 static pages generated. The original review remains above as the audit trail; its "gaps to fix" verdict is superseded by this remediation section.
