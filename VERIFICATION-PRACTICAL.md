# Verification Strategy — Practical Assessment

After extensive testing with Playwright against 43 brand source URLs, here's what works and what doesn't.

## What was tested

| Approach | Result |
|----------|--------|
| Server-side HTTP (curl) | 0/43 — All blocked by Cloudflare/Akamai |
| Playwright headless browser | 90/119 pages loaded, 0 usable specs extracted |
| JSON-LD / schema.org | 1/119 had product metadata (no specs) |
| API inspection (Samsung) | No spec API found |
| CSS selectors | 0/119 — All specs loaded via JS after page render |

## Why automated extraction fails

Modern manufacturer sites have evolved past static HTML spec tables:

1. **Apple** — `/iphone-16-pro/specs/` redirects to generic marketing page
2. **Samsung** — Infinite analytics/tracking prevents `networkidle`, specs are lazy-loaded
3. **LG, Sony, Dyson** — Cloudflare/Akamai challenge even Playwright
4. **Credit cards** — Issuer terms are PDFs or require login
5. **All brands** — No standardised CSS structure, selector approach would require 43 separate reverse-engineered scripts that break on every site redesign

## What the strategy should actually be

### 1. Staleness tracking (automated, already feasible)

Track how long since `asOf` date. Flag products for review after 90 days.

```json
// Add to products.json
"verification": {
  "status": "unverified",    // unverified | spot-checked | sourced | current | planned
  "lastChecked": null,       // ISO date of last manual check
  "method": null,            // "manual" | "structured-data" | "trusted-api"
  "notes": ""                // Human notes about what was verified
}
```

### 2. Structured data extraction (semi-automated)

For brands that embed schema.org `Product` markup, extract what's available. Samsung's JSON-LD had page metadata but no specs. Some brands embed `Product` type with `brand`, `sku`, `offers`, `description`.

Add a check: parse all `script[type="application/ld+json"]` on the source page, look for `@type: "Product"` with properties. This returns partial data but is resilient to page layout changes.

### 3. Human-guided verification (weekly batch)

**Process:**
1. Script generates a daily/weekly list of `unverified` or `stale` products
2. Script opens each product's source URL in a browser (one at a time)
3. Script takes a screenshot and saves it
4. Human views screenshots, compares with stored specs
5. Human marks product as `spot-checked` and updates `lastChecked`

**Tool:**
```bash
node scripts/prep-verification-session.mjs    # generates list
node scripts/open-for-review.mjs              # opens URLs in browser
node scripts/record-verification.mjs --id iphone-16-pro --status verified
```

### 4. User feedback loop (live, low effort)

Add a "Report inaccurate spec" link per comparison row on the site:
- Opens a pre-filled GitHub issue
- Fields: product, spec field, reported value, source URL (optional)
- Automated label: `data-accuracy`

Triage weekly. Build a stats page when volume grows.

## Daily/Weekly workflow

**Daily (automated, 2s):**
```bash
npm run verify
```
- Schema, format, i18n, staleness checks
- Flags products past `asOf + 90 days`

**Weekly (human, 30 min):**
1. `node scripts/prep-verification-session.mjs` → shows overdue products
2. Open source URLs, compare key specs
3. `node scripts/record-verification.mjs --id iphone-16-pro --status spot-checked`
4. Scan GitHub issues for `data-accuracy` label

**Monthly (automated, 1 min):**
```bash
node scripts/verify-sources.mjs --brand samsung
```
- Try Playwright extraction (may fail, may succeed — sites change)
- If extraction works, auto-approve; if not, fall through to weekly workflow

## Products excluded from verification

7 products have placeholder URLs for pre-release models:

| Product | Expected URL | Expected Launch |
|---------|-------------|----------------|
| iPhone 17 Pro | apple.com/iphone-17-pro/specs/ | Future |
| iPhone 17 Pro Max | apple.com/iphone-17-pro/specs/ | Future |
| iPhone 17 | apple.com/iphone-17/specs/ | Future |
| iPhone Air | apple.com/iphone-air/specs/ | Future |
| Galaxy S25 Ultra | samsung.com/.../galaxy-s25-ultra/ | Future |
| Galaxy S25 Plus | samsung.com/.../galaxy-s25/ | Future |
| Galaxy S25 | samsung.com/.../galaxy-s25/ | Future |

Mark these as `planned` in verification status. Re-check monthly for URL resolution.

## Summary: What's realistic

| Check | Automation level | Time cost | Coverage |
|-------|-----------------|-----------|----------|
| Internal consistency | Full (CI) | 10s | 100% |
| Staleness detection | Full (CI) | 1s | 100% |
| Structured data | Partial | 5 min | ~20% of brands |
| Human review | Manual | 30 min/week | 100% |
| User feedback | Manual | 15 min/week | Crowdsourced |

The honest tradeoff: **automated external verification is not achievable** for any of the 43 brands due to anti-bot protections and JS-rendered content. The strategy is: catch internal errors automatically, flag staleness, and make manual verification as fast as possible.