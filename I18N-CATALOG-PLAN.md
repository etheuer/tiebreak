# Tiebreak per-market catalog (phase 1.1)

Rewritten 2026-09-01 from Claude Fable 5.1’s review of the first catalog proposal (`I18N-CATALOG-PLAN-REVIEW.md`). That proposal (one listing per market, empty UK, new `-uk` ids) is **void**. This file is the spec. Implementer: **agy**. Do the **Do now** set in order.

Keeps phase 1 routing: US at `/`, UK at `/uk/`, English only, no FX, no auto-redirect, finance US-only. Does **not** change URL shape. Same product id in both markets when it is the same device.

Ground rules: no `npx` (use `node_modules/.bin/…`), do not start a second dev server, never port 5000, do not git init, do not read `.env`. Do not invent GBP from FX. Do not mint new product ids. Do not empty `/uk/`. You are not alone: another Claude session is in this repo; do not revert SEO or i18n route files you did not mean to touch. Do not edit `src/components/DecisionPanel.tsx` or `SpecTables.tsx` except to pass already-resolved products (they should just work if lookups resolve).

## 0. Plain language

The British site must stop being a photocopy of the American catalog. Most gadgets are the same device in both countries; a few are not (the Galaxy S24’s chip; some US-named vacuums and purifiers that are not sold as that model in the UK). Keep one record per device, mark where it is sold, override only the fields that differ, and refuse to publish a UK page nobody has signed off.

## 1. Locked decisions (Fable)

| Decision | Choice | Cost of the other option |
|---|---|---|
| Identity | One `id` per device across markets. | New `-uk` ids change all 140 UK URLs and break path-based hreflang. |
| Availability | Keep `markets[]`. UK page exists iff `'uk'` is in `markets`. | A second product record for “not sold here” is duplication. |
| Spec differences | `variants.uk` overrides only the keys that differ. | Copying the whole sheet will mix Snapdragon into a UK S24. |
| New ids | Only for a product marketed under a **different name/model** in the UK (none in this slice). | — |
| Prices | Keep `PricePoint` (`amount`, `currency`, `asOf`, `source`). | A bare number drops provenance phase 1 locked. |
| Matchups | Visibility = both products in that market. No `Comparison.market`. | Second source of truth vs `markets[]`. |
| Empty UK | Forbidden as a first step. Minimum: at least one UK category with products, or do not emit `/uk/` at all. | Empty `generateStaticParams` is unsupported in static export; Google would see an empty British home. |
| Equivalence table | None. Same id + `markets[]` is the pairing. No `family` / `equivalentTo`. | Two fields to keep in sync by hand. |
| HomePicks / popular_searches | Out of this slice. | Undefined storage and fallback. |
| Xiaomi 14 Ultra | Stays `['us','uk']` with a grey-import note in `description`. US route count unchanged. | Moving it to UK-only deletes five US compare URLs. |
| Already-exported `/uk/` URLs | Not deployed (placeholder `SITE_URL`, no git). Dropped UK listings simply 404. No host 301 map in this slice. | Pretending they are live invents a redirect job the export cannot do. |

## 2. Data shape

```ts
export type MarketAttestation = { asOf: string; source: string } // YYYY-MM-DD; URL or "manufacturer"

export type ProductVariant = {
  name?: string
  description?: string
  specifications?: Record<string, string> // only keys that differ
  verified: MarketAttestation
}

export type Product = {
  // existing fields, including price (US legacy amount) and markets?: MarketId[]
  availability?: Partial<Record<MarketId, MarketAttestation>>
  prices?: Partial<Record<MarketId, PricePoint>> // keep; do not delete
  variants?: Partial<Record<MarketId, ProductVariant>>
  sameAsUs?: string[] // region-sensitive keys attested identical to the base sheet
}
```

`resolveProduct(product, market): Product` — if `market === 'us'` or no variant, return the product with US-only spec hedges already on the base sheet. If `market === 'uk'` and `variants.uk.specifications` exists, shallow-merge those keys over `specifications`. Views must only see resolved records.

Region-sensitive keys (must be overridden **or** listed in `sameAsUs` whenever the key exists on the product and `'uk'` is in `markets`):

`chipset`, `cpu`, `gpu`, `cellular`, `charger_in_box`, `warranty`, `smart_os`, `voice_assistants`, `energy`

## 3. Availability pass (locked list)

**Remove `uk` from `markets`** (US-only; matchups drop automatically):

`tcl-qm8`, `shark-cordless-pro`, `lg-cordzero-all-in-one`, `winix-5500-2`, `aleno-breathe-smart-75i`, `coway-airmega-400`

**Keep `uk`**, add `availability.uk: { asOf: '2026-09-01', source: 'manufacturer' }` (plus `sameAsUs` for every region-sensitive key present, except the S24 override below): all other current UK products, including `xiaomi-14-ultra`.

On `xiaomi-14-ultra` `description`, prefix: `Grey import in the US; official in other regions. `

## 4. The one override

`samsung-galaxy-s24`:

- Base (US) `specifications.chipset`: `Snapdragon 8 Gen 3 for Galaxy (4 nm)` (drop the `/ Exynos 2400` hedge).
- Base `cpu` / `gpu`: Snapdragon-only strings (cpu stays the Cortex-X4 set; gpu `Adreno 750` only).
- `variants.uk`:
  ```json
  {
    "specifications": {
      "chipset": "Exynos 2400 (4 nm)",
      "cpu": "10-core (1× Cortex-X4 + 2× A720 + 3× A720 + 4× A520)",
      "gpu": "Xclipse 940",
      "cellular": "5G (sub-6)"
    },
    "verified": { "asOf": "2026-09-01", "source": "manufacturer" }
  }
  ```
- `sameAsUs`: the other region-sensitive keys that exist on the sheet (`charger_in_box`, and `warranty` / `smart_os` / `voice_assistants` / `energy` if present).
- UK product page should still render the resolved Exynos strings. Optional one-liner if cheap: “UK model differs on: chipset, cpu, gpu, cellular.” Skip if it requires a DecisionPanel/SpecTables redesign.

`galaxy-s24-ultra` stays Snapdragon in both markets (no Exynos Ultra). `sameAsUs` includes `chipset`, `cpu`, `gpu`.

## 5. Lookups

- `getProducts(market)` returns **resolved** records (`resolveProduct` each).
- `getProductById(id, market = 'us')` resolves. Update every caller that renders a sheet (views already pass `market`).
- `getComparisonBySlug(slug, market = 'us')` unchanged for the file; products loaded for that page must be `getProductById(id, market)`.
- Do not import `fs` from client components. Keep `resolveProduct` in `src/lib/pricing.ts` or a new `src/lib/product-resolve.ts` with no `fs`.

## 6. hreflang / banner / empty catalog

- `pageAlternates(usPath, market, includeUk)`: if `includeUk` is false and `market === 'uk'`, `x-default` is the UK canonical (self), not a missing US path. If `market === 'us'` and no UK twin, `x-default` is the US path (today). UK-only pages: `en-GB` + `x-default` both self; no `en-US`.
- Sitemap: same rule. Do not emit a UK `<loc>` for a product that lost `uk`.
- `MarketBanner.publishedInUk('/', …)` and home/hub `includeUk`: true only when `ukProductIds.size > 0` (and for hub, when `ukCompareSlugs.size > 0`). Do not offer “See UK” on home if the UK catalog is empty.
- Do not delete the UK route tree.

## 7. Prices

Do **not** FX-convert. Do **not** invent GBP. If you can cite a public manufacturer or retailer URL, add `prices.uk` for a product; otherwise leave it absent (UK still shows “Price not listed”). Migrating US `price` into `prices.us` is optional.

## 8. Do-now tasks

T1. Types + `resolveProduct` in a client-safe module. `getProducts` / `getProductById` resolve.
T2. Availability pass (§3) + `availability.uk` + `sameAsUs` on survivors.
T3. S24 override (§4). US sheet loses the Exynos hedge.
T4. hreflang/sitemap/banner empty-catalog and UK-only x-default (§6).
T5. `scripts/check-i18n.mjs` assertions below. Remove the hard-coded `uk.length === 46`.
T6. `node_modules/.bin/tsc --noEmit` and `node_modules/.bin/next build`.

### Check-script assertions (replace the count of 46)

- Every product with `'uk'` in `markets` has `availability.uk.asOf` and `availability.uk.source`.
- Every region-sensitive key present on a UK product is either in `variants.uk.specifications` or in `sameAsUs`.
- `samsung-galaxy-s24` UK resolved chipset contains `Exynos` and not `Snapdragon`.
- `samsung-galaxy-s24` US/base chipset contains `Snapdragon` and not `Exynos`.
- None of the six US-only ids in §3 include `'uk'` in `markets`.
- Cards still `markets: ['us']` only.
- Qty fixtures from phase 1 stay.

After build:

- No `/uk/product/.../tcl-qm8/` (etc. for the six).
- `/uk/product/electronics/samsung-galaxy-s24/` HTML contains `Exynos`.
- US S24 page contains `Snapdragon` and not `Exynos 2400`.
- `/uk/` still 200 with products (not empty).
- Finance still absent on UK.

## 9. Out of scope

HomePicks, per-market `popular_searches`, `Comparison.market`, `family`/`equivalentTo`, languages, CA/AU/CH, UK finance, new UK-only model names (TCL C855), live price feeds.

## 10. Recommendation

Implement T1–T6 in that order. Cost of not taking this: `/uk/` keeps recommending US-named appliances that are not sold as that model, and the S24 page keeps lying about the chip.
