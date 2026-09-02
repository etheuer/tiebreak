# Tiebreak per-market catalog plan (phase 1.1) — cross-family review

Reviewer: Claude Fable 5.1. Author of the plan under review: Grok 4.6 (xAI).
Plan reviewed: `I18N-CATALOG-PLAN.md` (2026-09-01).
Reviewed on 2026-09-01 against `src/`, the static export in `.next-static/` (built 16:55 today: 302 sitemap URLs, 140 of them under `/uk/`), `scripts/check-i18n.mjs`, and the Next 16.3.4 docs in `node_modules/next/dist/docs/`. Read-only review; nothing was edited, built, spawned, or started. No `.env` was read.

Related: `I18N-PLAN.md` (phase 1, implemented), `I18N-PLAN-REVIEW.md` (my earlier review, which parked regional SKUs as L8 with the note "either per-market overrides on the same id, or new ids that give up 1:1 hreflang. Do not mix").

## Plain language

**Verdict: revise before implementing. Do not start T1–T3 as written.**

The plan is right about the problem. The British site today is the American catalog with a flag on it: a shopper in the UK can open a product that is not sold in Britain, or a phone page whose chip is the American one. The plan is wrong about the cure. It wants every British listing to be a separate product with its own web address, its own hand-copied spec sheet and its own set of matchup files, and it wants to begin by emptying the British site. Built as written, that changes all 140 British addresses we already generated, copies roughly 1,500 lines of specs by hand for devices that are identical in both countries, and for a while tells Google that the British version of our home page is an empty page.

The cheaper and safer fix keeps one record per device, marks which countries it is sold in (the site already does this), lets a reviewer override the few fields that genuinely differ, and adds a build check that refuses to publish a British page nobody has signed off. The first slice is a data pass over the 46 products already on the British site, not a new data model.

## 1. Verdict

**Revise before implement.** The plan's diagnosis is correct and its goals (honest availability, correct regional specs, a curated UK home page) are the right goals. Its central decision, one market per listing with globally unique ids, is internally contradictory, forces a rewrite of the path-based hreflang, sitemap and banner code that shipped this afternoon, duplicates the catalog to solve a problem that affects a handful of fields, and its "start with zero UK products" step is neither designed for users nor proven to build. It also drops price provenance that phase 1 locked. The plan does exactly what my earlier review warned against under L8: new ids *and* an attempt to keep hreflang, in one design.

## 2. Blockers if we built this

Each item names the code that would break or the fact that contradicts the plan.

- **The id rule contradicts the URL rule.** §3 says `id` is "unique globally" and a listing has "exactly one" market. §2 says "ids may differ across markets", which implies they may also be the same. They cannot be both. If ids are unique, the UK iPhone 16 Pro needs a new id (`iphone-16-pro-uk`), so its URL becomes `/uk/product/electronics/iphone-16-pro-uk/` and its matchups become `/uk/compare/google-pixel-9-pro-uk-vs-iphone-16-pro-uk/`. Every one of the 140 exported UK URLs changes, including the ones for devices that are identical in both countries. If instead the same id may appear twice, then `getProductById(id)` and `getComparisonBySlug(slug)` (`src/lib/data.ts`, both global, both called from `src/views/product-page.tsx` and `src/views/compare-matchup.tsx`) return whichever record loads first, and the plan's own type comment is false. The plan must pick one, and T4 is written as if neither cost exists.
- **hreflang, sitemap and banner all derive the twin from the path, not from an id pair.** `pageAlternates(usPath, market, includeUk)` in `src/lib/hreflang.ts`, `languages(usPath, includeUk)` in `src/app/sitemap.ts`, `marketPath` / `usPathOf` in `src/lib/markets.ts`, and `publishedInUk(usPath, …)` in `src/components/MarketBanner.tsx` all compute the other market's URL as `/uk` + the US path. With different ids per market none of them can find the twin. T4 is one line in the plan ("hreflang uses equivalentTo / family table") but it is a rewrite of four modules plus two lookup signatures, and the sitemap's UK entries currently pass the US path as the cluster key.
- **x-default on a UK-only page points at a 404.** The helper hard-codes `x-default` to the US path. A UK-only listing (the plan's Xiaomi case, or any `-uk` id) has no US path. The plan says "x-default + self" but never says what URL x-default carries. Today's helper would emit an x-default to a page that does not exist.
- **"Start with zero UK products" is not proven to build and is not designed for users.** Three UK routes (`/uk/product/[...slug]`, `/uk/compare/[slug]`, `/uk/category/[slug]`) would return an empty array from `generateStaticParams`. The bundled Next docs list "Dynamic Routes with `dynamicParams: true`" and "Dynamic Routes without `generateStaticParams()`" as unsupported in static export, say an empty array means "render all paths the first time they're visited" (there is no runtime in an export), and under Cache Components make an empty array a hard build error. Whether this repo's configuration accepts an empty array is unverified; the plan must prove it with a build or delete the UK route tree in the same change. On the user side, with zero UK products: the header nav is a single "Matchups" link (`AppShell` builds nav from `getCategories('uk')`), the home hero has no chips and reads "0 published", the category grid is empty, the UK 404 page links to `/uk/category/electronics/` which would not exist, `/uk/llms.txt` lists nothing, and the sitemap still emits `/uk/` and `/uk/compare/` as `en-GB` alternates of the US home and hub because `homeMetadata` and `generateHubMetadata` pass `includeUk = true` unconditionally. The banner on every US page keeps offering "See United Kingdom prices and units" for the home and hub because `publishedInUk` returns true for `/` and `/compare/` without checking the catalog. Google would be told the British edition of the home page is an empty page.
- **`Comparison.market` creates a second source of truth.** Today a matchup is visible in a market when both products are (`getComparisons(market)` in `src/lib/data.ts`). Adding `market` to each of the 90 files means a file can say `uk` while a product has been moved to `us`, and the plan does not say which wins. For equivalent devices under unique ids, the plan also needs a second set of ~90 UK compare files whose only difference is the id suffix. Swap menus (`swapOptions`), "Other matchups", the hub and the home grid already filter by market today; the field buys nothing they do not have.
- **Price provenance regresses.** §3 replaces `prices?: Partial<Record<MarketId, PricePoint>>` with a bare `price: number` "in that market's major units". That drops `currency`, `asOf` and `source`, which `I18N-PLAN.md` §2 locked ("hand-sourced local list price with asOf + source") and which `src/lib/pricing.ts` implements. Product and compare JSON-LD take `priceCurrency` from `point.currency` today. Note also that no product has a `prices` entry at all: the two GBP worked examples promised in `I18N-PLAN.md` T3 were never entered, so the plan removes the price map before a single real GBP figure has exercised it.
- **The Xiaomi example contradicts T7.** T7 says "US route count stays". Moving `xiaomi-14-ultra` to `market: 'uk'` removes one US product page and five US compare pages (`galaxy-s24-ultra-vs-xiaomi-14-ultra`, `google-pixel-9-pro-vs-…`, `iphone-16-pro-vs-…`, `oneplus-12-vs-…`, `samsung-galaxy-z-fold-6-vs-…`), all of which are canonical and in the sitemap. Either is defensible; the plan cannot claim both.
- **The headline worked example is factually wrong.** The Galaxy S24 Ultra ships with the Snapdragon 8 Gen 3 for Galaxy in every region. The Snapdragon/Exynos split is on the S24 and S24+, and the catalog already knows this: `samsung-galaxy-s24.specifications.chipset` is `"Snapdragon 8 Gen 3 for Galaxy (US/CA) / Exynos 2400"`, while `galaxy-s24-ultra` is plain Snapdragon. The real case is one field on one product, which is exactly the case the plan's model handles worst (a whole second product, sheet and matchup set for one differing row).
- **The shipped check and the superseded acceptance numbers break silently.** `scripts/check-i18n.mjs` asserts `uk product count === 46` and `I18N-PLAN.md` T3/T6/T7 accept on 46 products, 90 compares and about 140 UK files. The plan says it supersedes one sentence of `I18N-PLAN.md` but leaves the counts and the script in place, so the first honest UK catalog fails the only executable check the project has.

## 3. Gaps the plan treats as settled

- **How `equivalentTo` is maintained.** Nothing says who sets it, on what evidence, which fields must match, or what happens when the US sheet is edited after the pair was marked. The plan asks for it to "point both ways", so it is two fields that can disagree, with no `verifiedAt` and no drift check. `family` and `equivalentTo` express the same relation twice. The acceptance sketch ("no UK sheet byte-identical to a US sheet unless `equivalentTo` is set") is a detector for a drift problem the model itself creates.
- **What "empty UK" looks like to a shopper and to Google.** See the blocker above. There is no designed empty state, no noindex decision, no rule for removing `/uk/` from the sitemap and hreflang clusters when it is below a minimum size, and no banner copy for "the UK site has nothing yet". "Honest empty" is a slogan, not a page.
- **Migration of the `/uk/` URLs that already shipped.** 140 UK URLs (46 products, 90 matchups, 2 categories, hub, home) plus `/uk/llms.txt` exist in the export. Whether they were ever deployed is unknown from this repo: `SITE_URL` still falls back to a placeholder domain with a TODO, and nothing since the first commit is committed. If they were deployed, the export cannot redirect (Next docs: redirects and rewrites are unsupported in static export; `I18N-PLAN.md` §3 already assigns 301s to the host), so the plan needs a host-level 301/410 map from old to new UK paths. If they were not deployed, the plan should say so and the crew status should stop calling them "shipped". The plan's only word on this is the acceptance line "compare URLs that existed only as clones 404".
- **Availability evidence has no field.** §2 says "publish only listings we can defend (availability + spec source)", but the type has no `source`, `asOf` or reviewer attestation for availability. The plan's safety rests on a rule nobody can check mechanically.
- **UK model names.** UK SKUs often carry different suffixes (LG's C4 in the UK is an `OLED65C46LA`, in the US an `OLED65C4PUA`). Is `name` per market? The plan is silent. The override model answers it with `variants.uk.name`; the plan's model answers it with a second record.
- **`HomePicks` and per-market `popular_searches`.** Where `HomePicks` lives (JSON, TS, which file), what happens when a pick's matchup does not exist in that market, and what the UK `popular_searches` strings are, are all unstated. `popular_searches` is rendered on category pages (`src/views/category-page.tsx`), so the type change is real work with no data behind it.
- **Type placeholders.** `prices?: { [K in MarketId]?: never }` is not a data shape, it is a note to delete a field. `Product.market` plus `Comparison.market` plus `getComparisons` filtering on both leaves the precedence undefined.
- **The check script is prose.** The acceptance sketch in §5 is four English sentences. Per the project's own operating rules, invariants that only exist in prose are not enforcement. The plan should name the assertions that go into `scripts/check-i18n.mjs`.

## 4. One market per listing vs per-market overrides on one id

**Recommendation: keep one id per device across markets, keep `markets[]` for availability (already live), add optional per-market overrides plus a reviewer attestation, and give a new id only to a product that is marketed under a different name or model in the UK.** Do not adopt one market per listing.

What the catalog actually needs, by inspection of the 46 UK-cloned products (1,238 spec strings, 237 pros/cons):

| Kind of difference | Examples in the catalog | Right representation |
|---|---|---|
| Identical device, same name | iPhone 16/16 Pro, Pixel 9/9 Pro, MacBooks, XPS 16, ThinkPad, Surface, all six headphones, Dyson V15/Gen5/HP09, LG/Samsung/Sony TVs | one record, `markets: ['us','uk']`, `availability.uk` attested |
| Same name, one or two fields differ | Galaxy S24 (Exynos 2400 in the UK), TV tuners if a tuner row is ever added, `charger_in_box`, `warranty` where retailers differ | one record, `variants.uk.specifications.chipset = …` |
| Not sold in the UK under that name | likely TCL QM8 (UK line is C855/C805), Shark Cordless Pro, LG CordZero All-in-One, Winix 5500-2, Alen BreatheSmart 75i, Coway Airmega 400 (a human must verify each) | `markets: ['us']`; matchups drop out automatically |
| Sold in the UK, not officially in the US | Xiaomi 14 Ultra | `markets: ['uk']`, or keep `['us','uk']` with a grey-import note in `description` as `I18N-PLAN.md` §4.2 already allows; owner's call, with the US route-count change stated |
| Different product sold under a related name | a UK TCL C855 if we ever list it | its own id, `markets: ['uk']` |

Only the second row needs anything beyond the field that already exists, and it is a handful of fields on a handful of products. The plan's model pays for the second row by duplicating rows one and two in full.

Proposed shape (sketch, not implementation):

```ts
type MarketAttestation = { asOf: string; source: string }   // YYYY-MM-DD, URL or "manufacturer"
type ProductVariant = {
  name?: string
  description?: string
  specifications?: Record<string, string>   // only the keys that differ
  pros?: string[]; cons?: string[]
  verified: MarketAttestation
}
type Product = {
  // existing fields …
  markets?: MarketId[]                                   // availability, already live
  availability?: Partial<Record<MarketId, MarketAttestation>>
  prices?: Partial<Record<MarketId, PricePoint>>         // keep; do not regress to a number
  variants?: Partial<Record<MarketId, ProductVariant>>
}
resolveProduct(product, market): Product   // merge variant over base; getProducts(market) returns resolved records
```

The plan's stated fear is that "one sheet with overrides will silently mix Snapdragon/Exynos". That is a real risk and the answer is an executable guard, not duplication: `scripts/check-i18n.mjs` fails the build when a product lists `uk` in `markets` without an `availability.uk` attestation, or when a product in a subcategory with region-sensitive keys (`chipset`, `cpu`, `gpu`, `cellular`, `charger_in_box`, `warranty`, `smart_os`, `voice_assistants`, `energy`, and a `tuner` row if added) has neither a `variants.uk` override for the key nor an explicit `sameAsUs` list naming it. The plan's model has no equivalent guard; a reviewer can paste the US sheet into a UK record and the byte-identical heuristic is the only thing that notices.

Why this is also the honest model for hreflang: Google's hreflang means "this is the version of this page for that region". A UK S24 page that says Exynos and a US S24 page that says Snapdragon are regional versions of the same page. That is the case hreflang exists for, and same-id-same-path keeps every helper that shipped today correct without change.

**Cost of the override model (the option I recommend):** a merge function of about twenty lines; `getProductById` and `getComparisonBySlug` gain a `market` parameter and return resolved records; one new rule set in the check script; reviewers must understand that a UK page is "US sheet plus overrides", which the product page can make visible by listing the overridden keys as "UK model differs on: chipset".

**Cost of the plan's model (one market per listing):** all 140 exported UK URLs change or vanish; about 1,500 hand-copied strings across 46 duplicate records and roughly 90 duplicate compare files; a path-based to id-pair rewrite of `hreflang.ts`, `sitemap.ts`, `MarketBanner.tsx` and the two global lookups; an empty-UK interim that may not build and that advertises an empty page to search engines; a permanent `-uk` suffix in British URLs that cannot be removed later without a second migration; and no mechanical guard against an unreviewed sheet, only a byte-identity heuristic.

## 5. Smallest first slice I would actually ship

One data pass and one check-script change, on the model that is already live. No route changes, no new ids, no deletions of the UK site.

1. **Availability pass over the 46.** A human marks each product sold-in-UK-under-this-name or not, with `availability.uk: { asOf, source }` on the survivors. Products that fail lose `uk` from `markets`; their matchups, sitemap entries, hreflang alternates and banner links drop out through code that already exists. Decide the Xiaomi case explicitly and record the US route-count change if it moves.
2. **One override.** `samsung-galaxy-s24` gets `variants.uk.specifications` for `chipset`, `cpu` and `gpu` (Exynos 2400), and the US string loses its "(US/CA) / Exynos 2400" hedge. This is the only known regional-silicon case in the catalog and it exercises the merge path end to end.
3. **`resolveProduct` and market-aware lookups.** `getProducts(market)` returns resolved records; `getProductById(id, market)` and `getComparisonBySlug(slug, market)` resolve too, so no view can render an unresolved sheet in the UK.
4. **Fix x-default for UK-only pages** in `src/lib/hreflang.ts` and `src/app/sitemap.ts` (x-default is the US page when it exists, otherwise self), and make `publishedInUk('/')` and the home/hub `includeUk` depend on the UK catalog being non-empty.
5. **GBP for the products on the UK home page.** The eight round-robin matchups cover sixteen products. Source their UK list prices with `asOf` and `source`. This is the missing phase 1 T3 deliverable and the first thing a UK visitor notices.
6. **Check script.** Replace the hard-coded 46 with: every UK product has `availability.uk`; every region-sensitive key on a UK product is either overridden or listed as `sameAsUs`; no `$` in any UK HTML; UK route count equals UK products plus UK matchups plus UK categories plus two.

Curated UK home picks (a list of matchup slugs in data with round-robin fallback) is the next slice, after the catalog is honest. `family`, `equivalentTo`, `Comparison.market`, `HomePicks` as a type, and per-market `popular_searches` wait until a real need appears.

## 6. What must change in `I18N-CATALOG-PLAN.md` before anyone implements, ranked

1. **Resolve the id contradiction and reverse the locked decision.** One id per device across markets; `markets[]` for availability; `variants` for per-market overrides; new ids only for differently-marketed models. If the author still wants one market per listing, the plan must specify `(market, id)` as the key, keep the same id for equivalent devices, and rewrite T4 with the four modules and two lookups it changes.
2. **Delete "start with zero UK products".** Replace with the availability and attestation pass over the 46 products already exported, and a stated minimum below which `/uk/` is not emitted at all (and is removed from the sitemap, hreflang clusters and banner when not emitted).
3. **Keep `PricePoint`.** Restore `prices` with `currency`, `asOf` and `source`; drop the bare `price: number` rewrite; add the GBP figures for the home-page pairs to the first slice.
4. **One equivalence mechanism, or none.** Remove `family` or `equivalentTo`. If any pairing survives, it is a single pair table with `verifiedAt` and a drift check, not two fields kept in sync by hand. Under the override model it is unnecessary.
5. **Remove `Comparison.market`.** Matchup visibility derives from product availability, as it does today. Curated ordering is a picks list, not a field on every file.
6. **Correct the worked examples.** S24 Ultra becomes S24 and is shown as a one-field override. The Xiaomi decision states the US route-count consequence or keeps the product US-listed with a grey-import note.
7. **Write the hreflang rules for pages with no twin.** x-default target for UK-only pages, sitemap alternates for UK-only entries, and the banner's behaviour when the UK catalog is empty or the page has no UK sibling.
8. **Make acceptance executable.** Name the assertions that replace the hard-coded 46 in `scripts/check-i18n.mjs`, and amend the `I18N-PLAN.md` T3/T6/T7 counts the plan supersedes.
9. **State the migration policy for the 140 exported UK URLs.** Whether they are live; if so, the host-level 301/410 map, since the export cannot redirect.
10. **Define `HomePicks` and UK `popular_searches` or drop them from phase 1.1.** Storage location, fallback when a pick is not in the market, and the actual strings.
