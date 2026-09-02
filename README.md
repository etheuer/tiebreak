# Clinchmark

Head-to-head product comparisons. Pick two products, get a spec-by-spec verdict.

The public launch is the **United States** catalog. Pages are static HTML (`output: 'export'`).

## Local

This project uses a pinned port via `dev` (4100–4999). From the repo:

```bash
dev
```

Then open the URL `dev` prints (do not use port 5000).

```bash
npm run verify
```

runs lint, types, catalog checks, the i18n data checks, and a production build.

## Before you deploy

1. Set `NEXT_PUBLIC_SITE_URL` to the real `https://` origin (no trailing slash). Canonicals, sitemap, and share cards bake this in at **build** time.
2. Optional: `NEXT_PUBLIC_SITE_EMAIL` for the contact and privacy pages. If unset, those pages point at GitHub issues.
3. Optional: `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to turn on page-view analytics.
4. Host the contents of `.next-static/` (the `next build` export) behind HTTPS with trailing slashes. `vercel.json` already 301s `/us` and `/uk` to `/`, and sets basic security headers.

## What the pages are

Published specifications, not lab tests we ran. Some comparison rows are other published figures, marked on the page. List prices, not live offers. Credit-card pages are not financial advice.

## Stack

Next.js 16 (App Router, static export), React 19, Tailwind 4, TypeScript.
