# Tiebreak i18n / market-localization plan — cross-family review

Reviewer: Claude Fable 5.1. Author of the plan under review: agy (Gemini 3.7 Flash).
Plan reviewed: the section "Internationalization & Market Localization Plan (Committed by agy)" in `.crew-status.md`.
Reviewed on 2026-09-01 against the source in `src/`, the static export in `.next-static/`, and the installed Next 16.3.4. Read-only review; nothing was edited, spawned, or started.

## Plain language

**Verdict: revise before implementing.** The plan is a list of markets, not an architecture. It never touches the three things the codebase hard-codes: every product has one US-dollar price, every spec is an English sentence with the unit baked in that the verdict and deal-breaker logic parse by regex, and every "buy this one" sentence is an English template. Built as written, the metric markets would show wrong deal-breakers, the French, German and Italian pages would lose every Yes/No verdict, and the URL scheme cannot be produced by Next's static export at all. Cut it to one extra English market first, fix the data model, then add languages.

Side note: the brief says the dev server is live on port 4124. It was not answering at review time. No server was started.

## 1. Verdict

**Revise before implement.** The plan describes target markets and a URL shape, but the codebase stores prices as a single USD integer, stores specs as English strings with embedded units that the scoring code parses, and generates every verdict sentence from English templates; none of that is addressed, and the proposed mixed-depth URL scheme is not expressible in an App Router static export.

## 2. Blockers — things that would ship wrong or blow up the static export

- **The URL scheme is unbuildable.** Mixed depth like `/us/` next to `/ca/fr/` needs an optional segment in the middle of the path, and Next only allows optional segments at the end of a route. You would need two parallel route trees or emit both `/us/` and `/us/en/`, which is duplicate content. The plan also uses `uk` as the market code while the locale is `en-GB`.
- **Every current URL moves and nothing can redirect.** `output: 'export'` has no middleware, redirects or rewrites, so the 164 URLs the SEO work just canonicalised and sitemapped would 404 unless the host adds a redirect map. The plan names no host and says nothing about what `/` becomes.
- **Currency is data, not display.** `price` is a single USD integer per product. Four formatting sites hard-code the dollar sign and `en-US` (`nav.ts` twice, `verdict.ts`, `decision.ts`), the compare and product JSON-LD hard-code `priceCurrency: 'USD'`, and the footer states prices are in USD. Price also decides the price leader, the price gap, the verdict line, the straight answer, the FAQ text and the meta description, so a wrong local price flips the page's conclusion.
- **Units are inside free-text strings.** Of 1,298 spec values, 106 carry only an imperial unit, 111 only a metric one, and 36 carry both. Laptops, vacuums and purifiers list pounds first ("4.7 lb (2.14 kg)") while phones and headphones list grams first ("250 g (8.8 oz)"). Screen sizes are "65 inches" only. There is no canonical numeric value anywhere.
- **Deal-breaker thresholds assume imperial.** `heavy-laptop` trips above 4, `heavy-vacuum` above 7, `heavy-purifier` above 25 and `small-coverage` below 1,000, all reading the first number of the string as pounds or square feet. Re-authoring strings to metric for UK, AU or CH makes those rules fire wrongly or never.
- **Yes/No and unit detection is English-only regex.** `verdict.ts` decides winners on `/^yes\b/` and `/^no\b/`, and `deal-breakers.ts` has five rules built on `isNo` or "none". Translating spec values to French, German or Italian silently disables every yes-is-better rule and those deal-breakers. The unit comparison in `judge()` also returns "no winner" whenever the two sides' unit tokens differ, so a market with half-converted data loses wins at random.
- **Warranty and finance copy is US fact stated as universal.** `warranty` is one manufacturer string per product, scored higher-is-better and used by a vacuum deal-breaker. UK Consumer Rights Act, Australian Consumer Law and Swiss Art. 210 CO change what is true on the page. Credit-card sheets carry FICO-band `credit_needed` thresholds, US APR wording, US sign-up bonuses and US late fees; in the UK, AU and CH these are regulated disclosures, not copy to translate.
- **Route count and payload.** About 1,460 pages instead of 164 (see section 4). Each exported page currently inlines the whole 163-entry search index, roughly 150 KB of HTML per page, and per-market catalogs make that index per-market. Five near-identical English copies of every page (US, CA, UK, AU, CH-en) are duplicate content unless hreflang is perfect.

## 3. Gaps the plan treats as settled but are not

- **Pricing source of truth.** None exists. Today's price is a hand-typed USD list price with a footer disclaimer. `market_pricing` has no source, refresh cadence, or converted-versus-local policy. Four new markets on 46 global products means 184 hand-maintained numbers that each can flip a verdict.
- **SKU variants.** Product id is the URL slug and the comparison file key (`getComparisonBySlug` matches `${productA}-vs-${productB}`). Regional variants (Exynos vs Snapdragon Galaxy, region-specific TV line names, Xiaomi 14 Ultra not officially sold in the US yet present in the US catalog) either share an id with per-market overrides or get new ids. New ids break the same-path-across-markets property hreflang depends on. The plan picks neither.
- **Credit-card isolation.** No product has a market or availability field. `data.ts` filters by category only; home round-robin, footer first-five, the layout search index, the category page, the compare page swap menu and "Other matchups" all read the global lists. Isolation touches every page and three files owned by other agents. Amex Gold also exists in the UK with a different fee and rewards, so isolation by category alone is wrong for shared brands.
- **Translating verdict sentences.** There are 50 English template literals with interpolation across `decision.ts` (32), `verdict.ts` (12) and `faq.ts` (6), plus English list-joining and lowercasing in `listLabels`, and `shortName` strips English suffixes. Deal-breaker labels and reasons, lens labels and jobs, and spec group and field labels are all English in `src/data/`. Key-to-string dictionaries cannot express French gender agreement, German plurals or locale list conjunctions. `DecisionPanel` recomputes `buildAnswer` in the browser, so any dictionary must ship client-side and the panel must take a locale.
- **hreflang vs static export.** Feasible: Next metadata `alternates.languages` emits hreflang link tags and the sitemap API accepts per-URL alternates. But every page must know its sibling URLs across markets, and those do not all exist (cards). No x-default policy is stated. The word hreflang does not appear in the plan.
- **Cookie and geo without a server.** First paint is always the URL's market; there is no request-time cookie, Accept-Language or geo read. A remembered market can only be a client-side redirect after load, which harms crawlers and shared links. The plan's "switch anytime" modal implies memory without saying how.
- **Number formatting.** `toLocaleString('en-US')` appears four times and one `toLocaleString()` has no locale, so it uses the build machine default. Swiss French uses apostrophe thousands separators and Canadian French uses a space separator and comma decimal.
- **Language attribute and layout.** `layout.tsx` hard-codes `<html lang="en">` and `openGraph.locale: 'en_US'`. Per-locale `lang` requires the root layout to receive route params, which means moving every page under a market and locale folder, the same files being edited for SEO right now.

## 4. Cost of the 5-market × 9-locale matrix vs a thinner first slice

Route arithmetic: 46 global products and 90 global compares plus home, 3 categories and the matchup hub give 141 pages per locale, 1,269 across 9 locales. Finance adds 21 pages per market-locale (6 cards, 15 compares) across US 1, CA 2, UK 1, AU 1, CH 4 locales, 189 more. Total about 1,460 static pages, roughly 9× today.

| | Plan as written | Thin slice: US at root plus UK |
|---|---|---|
| Locale-markets | 9 | 2 |
| Static pages | about 1,460 | about 305 |
| New languages | 3 (fr, de, it) | 0 |
| New price points to source and maintain | 184 | 46 |
| Card catalogs to author | 24 cards, 60 compare files, Swiss ones in 4 languages, all regulated copy | 0 |
| Sentence engine | ICU-style templates in 4 languages, shipped to the client | units and currency display layer only |
| Search index | per-market, 9 variants | 2 variants |

Page weight matters more than page count: each page inlines the full search index, so the export grows with locales times markets, not just locales.

**Recommended smallest first market set:** keep the US at `/`, add the UK at `/uk/` in English only, electronics and appliances only, finance stays US-only. The UK forces the currency, metric-unit and warranty-regime data work that every later market needs, with zero translation. Canadian English is cheaper (no unit change, same SKUs) but proves nothing beyond currency, and Canadian French is the expensive half of Canada. Switzerland is four locales for the smallest audience and should be last or never. Cost of not taking this: three translation layers and four regulated card catalogs get built on a data model that still has USD and pounds baked in, and are redone.

## 5. Collision with in-flight SEO-PLAN.md and with DecisionPanel / SpecTables / src/data ownership

- **SEO.** SEO-PLAN T1–T8 is built and exported (export timestamp 16:17 today): root-relative canonicals on every page, a 162-URL `sitemap.xml`, `robots.txt`, `llms.txt`, the `/compare/` hub, English FAQPage JSON-LD, and an `en_US` Open Graph locale. Moving the US under `/us/` invalidates all of it and every i18n page then needs a per-locale canonical, an hreflang cluster, sitemap alternates and per-locale FAQ text. Keeping the US at root avoids redoing the SEO work.
- **Ownership.** The plan needs a market field, market pricing, typed spec values and translated labels, all in `src/data/`, owned by other agents. It needs `DecisionPanel` to accept a locale and dictionaries, and `SpecTables` to stop calling `priceShort`, which hard-codes the dollar sign. Route moves rewrite the exact page files agy is editing for SEO.
- **Sequencing.** The data model must be agreed with the `src/data/` owners before any route work starts, or two agents edit the same schema at once. The layout's global search index and the footer's first-five matchups must become per-market at the same time.

## 6. What must change in the plan before anyone implements, ranked

1. Fix the URL scheme: US at root, every other market at one fixed depth, no default shortcuts. Name the host and its redirect mechanism, since the export cannot redirect.
2. Cut scope to two phases: US plus UK in English first; languages only after that ships and hreflang is verified live.
3. Data model first, agreed with the `src/data/` owners: typed spec values with canonical units, a per-product market availability list, and market pricing with a source and last-checked date. Verdict rules and deal-breaker thresholds operate on canonical units, never on display strings.
4. Define the pricing source of truth and refresh cadence, and how a page degrades honestly when a market price is missing.
5. Make verdict, answer and FAQ generation return structured results rendered by a locale formatter using `Intl.NumberFormat` and `Intl.ListFormat`. Remove every hard-coded dollar sign, `en-US` and `USD`, including JSON-LD and the footer.
6. Write the hreflang, x-default, sitemap-alternates and per-locale canonical spec, including the rule for pages that do not exist in a market.
7. Put warranty and finance copy under per-market legal review. Finance is out of scope for any market without a named owner and a regulated-disclosure source.
8. Define the market selector as a suggestion banner driven by client-side memory, never an automatic redirect.
9. Make the search index, footer picks, home matchups and category shortlists per market.
10. Move the `lang` attribute into a locale-aware layout, and coordinate that file move with the SEO implementer so the two jobs do not edit the same pages concurrently.
