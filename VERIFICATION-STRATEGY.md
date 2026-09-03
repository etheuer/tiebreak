# Data Verification Strategy

## Goal

Confirm every spec value on the site matches what the manufacturer publishes. Current state: 0 of 119 products have been verified against their source.

## Why automated scraping won't work alone

Every brand tested blocks server-side HTTP requests (Cloudflare, Akamai, Akamai). Even Playwright (full browser) only loaded 90/119 pages, and extracted **zero usable specs** from page text because:

- Anti-bot systems return captcha/block pages or redirect to generic landing pages
- Spec sheets are loaded via JavaScript after page render
- Each of 43 hostnames has different HTML structure
- Credit-card pages (issuer terms) are often PDFs behind sign-in walls

## Strategy overview

```
Three lanes, running in parallel, feeding one Confidence Score per product
        ┌─────────────────────────────────────────────────┐
        │                  DATA PIPELINE                  │
        ├─────────────────┬─────────────────┬─────────────┤
        │  Lane 1         │  Lane 2         │  Lane 3     │
        │  Automated      │  Curated        │  User       │
        │  Health Checks  │  Verification   │  Feedback   │
        │  (CI on push)   │  (weekly batch) │  (live)     │
        └────────┬────────┴───────┬─────────┴──────┬──────┘
                 │                │                │
                 ▼                ▼                ▼
        ┌─────────────────────────────────────────────────┐
        │          Confidence Score per product           │
        │  unverified → spot-checked → sourced → current  │
        └─────────────────────────────────────────────────┘
```

## Lane 1: Automated health checks (already in CI)

These run on every push. They catch regressions but do **not** verify against external sources.

| Check | What it validates | Status |
|-------|-------------------|--------|
| Schema | Spec keys match `spec-catalog.ts` definitions | ✅ Running |
| Values | Value formats are plausible (inches, nits, mAh) | ✅ Running |
| Consistency | Outliers, duplicates, brand coverage | ✅ Running |
| Comparisons | File structure, duplicate keywords | ✅ Running |
| `sameAsUs` | UK/US spec alignment | ✅ Running |
| Source list | Every product has an `officialSource` URL | ✅ Running |

**Addition needed:** Staleness detection — flag products where `asOf` > 90 days.

## Lane 2: Curated verification (weekly batch)

The core strategy: **build brand-specific extractors that work with Playwright**, verified by a human once.

### Tier 1 — CSS-selector based (works now for some brands)

Brands with stable, server-rendered spec tables:

| Brand | URL pattern | Selector approach | Confidence |
|-------|-------------|-------------------|------------|
| Apple | `apple.com/*/specs/` | `.specs-table` or tech specs section | Known CSS, Apple rarely changes |
| Samsung | `samsung.com/us/...` | `.spec-details` or `#specs` table | Works with Playwright |
| LG | `lg.com/us/...` | Product spec accordion | Works with Playwright |
| Sony | `electronics.sony.com/...` | `.specs-wrapper` | Works with Playwright |
| TCL | `tcl.com/us/...` | `.specifications` table | Loads server-side |
| Hisense | `hisense-usa.com/...` | `.product-specs` | Simple layout |
| Shark | `sharkclean.com/...` | `.specs-section` | Simple layout |
| Dell | `dell.com/en-us/shop/...` | `.tech-specs` table | Requires JS |
| Lenovo | `lenovo.com/us/en/...` | `.specs-table` | Stable |

**Implementation:**
```js
// scripts/verify-brand/[brand].mjs — one per brand
// Example: scripts/verify-brand/apple.mjs
export const hostname = 'www.apple.com'
export const selectors = {
  specs: '.tech-specs tr, .specs-table tr',
  key: 'th',
  value: 'td'
}
export async function extractSpecs(page) {
  // Navigate to product page
  // Use Playwright to get spec table
  // Return {screen_size: "65 inches", ...}
}
```

### Tier 2 — Cloudflare/CAPTCHA sites (manual + fallback)

These brands actively block bots. Strategy: **human once, re-check quarterly**.

| Brand | Protection | Strategy |
|-------|-----------|----------|
| Dyson | Cloudflare challenge | Capture spec table as structured JSON once, store as snapshot. Re-verify quarterly via human. |
| HP | HTTP/2 errors | Open page manually, copy specs |
| Some credit card issuers | Session/PII required | Use issuer terms PDFs stored locally |

### Tier 3 — Future / unreleased products (iPhone 17, Galaxy S25)

These have placeholder URLs. Action: **mark as `planned`** in data, exclude from verification until launch.

### Verification workflow

```
Weekly cron job:
  1. For each product in "unverified" or "stale" (asOf > 90 days):
     a. Route to brand-specific extractor
     b. Playwright fetches page, applies selector
     c. Extract structured specs
     d. Compare with stored specs
     e. If match > 80% → mark as "verified"
     f. If mismatch → flag for human review

Human review (1 hour/week):
  - Review flagged mismatches
  - Update stale brand extractors
  - Verify Cloudflare-blocked brands manually
  - Approve/reject changes
```

## Lane 3: User feedback (live)

The site already has pros/cons. Add a lightweight feedback mechanism:

- **"Spot an error?"** link per comparison row → logged as GitHub issue
- Schema: `{ productId, specKey, reportedValue, sourceUrl, timestamp }`
- Automated triage: if 2+ reports on the same field, flag for review

## Freshness policy

| Status | Definition | Action |
|--------|-----------|--------|
| `unverified` | Never checked against source | Needs verification |
| `spot-checked` | Verified manually once | Next verification in 90 days |
| `sourced` | Extractors produce matches | Next verification in 30 days |
| `current` | Verified in last 7 days | No action |
| `planned` | Pre-release product | Exclude from checks |

**Implementation in products.json:**

```json
{
  "id": "samsung-q90c",
  "verification": {
    "status": "unverified",
    "lastChecked": null,
    "method": null,
    "confidence": null
  },
  "officialSource": {
    "url": "https://...",
    "asOf": "2026-09-02",
    "kind": "spec-sheet"
  }
}
```

## Implementation roadmap

### Phase 1 (this week)
- [ ] Add `verification` field to 3 pilot products (Apple, Samsung, LG)
- [ ] Build Playwright extractor for Apple specs pages (`apple.com/*/specs/`)
- [ ] Verify iPhone 16 Pro specs against source
- [ ] Build Playwright extractor for Samsung specs pages
- [ ] Verify Galaxy S24 Ultra specs against source
- [ ] Add staleness detection to `check:spec:schema`
- [ ] Add `planned` status to exclude iPhone 17 / Galaxy S25

### Phase 2 (next week)
- [ ] Build extractors for top 10 brands (covers 65/119 products)
- [ ] Run batch verification, record results
- [ ] Add `npm run verify:sources` script
- [ ] Integrate verification status into CI output

### Phase 3 (ongoing)
- [ ] Weekly cron job (GitHub Actions) for automated verification
- [ ] Human review rotation
- [ ] User feedback integration
- [ ] Quarterly extractor audit (brands redesign their sites)

## Brand coverage by phase

```
Phase 1 (3 brands): ████████░░░░░░░░░░ 25% of products
Phase 2 (10 brands): ████████████████░░ 55% of products
Phase 3 (all 43):    ██████████████████ 100% of products

The 80/20 rule:
- 10 brands = 65 products (55%)
- Most remaining brands have 1-3 products each
- Manual verification of long-tail brands costs ~30 min/week
```