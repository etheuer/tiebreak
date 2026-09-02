# Tiebreak LLM-citation plan

Researched 2026-09-02. Goal: when someone asks ChatGPT, Perplexity, Claude, Gemini, Copilot, or Grok an “X vs Y” or “which one for [use]” question, the model cites **Tiebreak’s page** (and repeats our verdict, numbers, and use-case answer), not Versus / GSMArena / RTINGS / a Reddit thread.

This is **not** the same job as “make the brand famous.” For a comparison site, winning means becoming the **source** the model retrieves. Brand-name mentions (“try Tiebreak”) are a later, off-site problem.

The on-page SEO/AEO plumbing from `SEO-PLAN.md` (T1–T8) is already in the codebase: sitemap, robots with AI crawlers allowed, canonicals, FAQ + `FAQPage`, “Best for each use,” `/llms.txt`, `/compare/` hub, Organization/WebSite schema. **That is the floor, not the win.** The remaining gaps are discovery, extractability, off-site mentions, and measurement.

**Working name in the repo is “Tiebreak.” The public name and domain are not chosen yet.** `https://tiebreak.app` in `src/lib/site.ts` is only a build-time fallback; that hostname is **not available to register** and is not ours (it currently serves an unrelated Squarespace site). Do not try to acquire it, and do not treat it as the live origin.

**Blocker:** no public `https://` origin of our own is live. Until the catalog is reachable at an origin we control, Bing/Google/Perplexity cannot index it, and every on-page tactic is inert. A temporary preview host is enough to start P0 measurement; **do not spend P2 entity work** (Wikidata, Crunchbase, Wikipedia, brand prompts) until the public name is locked.

---

## 1. How citation actually works (so we do not optimize the wrong thing)

Two stages, from the Aug 2026 paper *From Citation Selection to Citation Absorption* (602 prompts, 21,143 citations across ChatGPT, Google AI, Perplexity), widely discussed on X by Alex Groberman ([post](https://x.com/alexgroberman/status/2093332352118186264), 18.5k views):

| Stage | What it means | What moves it |
|---|---|---|
| **Selection** | The engine puts your URL in the source list | Being in the retrieval index (Bing for ChatGPT/Copilot, Google for Gemini/AI Overviews, Brave-ish for Claude, live web for Perplexity), plus authority and third-party mentions |
| **Absorption** | The engine **uses** your facts in the answer (winner, numbers, “for gaming buy X”) | Extractable, unique, numbered, comparison-shaped content |

A URL in the footnote with none of your verdict in the prose is a loss. High-absorption pages in that study were long and structured (~1,943 words, ~10.6 headings) and packed with numbers (+61.6% influence), comparisons (+55.3%), definitions (+57.3%), and how-tos (+41.2%). Q&A formatting **alone** did not raise absorption.

Shreyas ([X, 28 Aug 2026](https://x.com/shreyasnivas/status/2093419643482636441), ~1,900 answers): when an engine names a brand, it links **that brand’s own site** only 23% of the time on ChatGPT, 32% on AI Overviews, 39% on Perplexity. The other 60–77% of the time it cites **someone else’s** comparison page, community thread, or trade article. Tiebreak **is** that someone-else page. That is the wedge.

Jeremy Moser (Userp, [X, 13 Mar 2026](https://x.com/jmoserr/status/2032463564775047248), 14.6k views) cites HubSpot: **~92% of AI brand mentions come from third-party sites**, not the brand’s own pages. Treat “add a table to our homepage” as insufficient.

Engines do not share a source pool. Sizhao Yang summarizing Analyze AI (83,670 citations, Nov 2025–Jan 2026): Wikipedia was 12.1% of ChatGPT citations and 0.1% of Claude’s (121× gap); Claude cited the brand’s own site 22.2% of the time vs 13.5% for ChatGPT. One playbook will not cover all five surfaces.

---

## 2. What the high-engagement X posts actually say

Filtered for engagement and for claims that can be checked. Giveaway/tool spam is listed only when it repeats a consensus mechanic.

| Source | Engagement | Claim | How we should treat it |
|---|---|---|---|
| [a16z](https://x.com/a16z/status/1927766844062011834) + [essay](https://a16z.com/geo-over-seo/) (Cohen/Amble, 28 May 2025) | **3,004 likes, 650k views** | Visibility = being cited inside the answer, not ranking #1. ChatGPT queries average ~23 words. | Directionally right. a16z is an investor in Profound; treat the category pitch as marketing, the mechanism as real. |
| [Zeno Rocha](https://x.com/zenorocha/status/2087547759083901252) (12 Aug 2026) | **1,141 likes, 1,681 bookmarks** | `llms.txt`, check **server logs** not analytics, Markdown twin of every page, `Accept: text/markdown`, no JS-only widgets. | Highest-signal practitioner checklist on X. Matches Mintlify’s later benchmark. |
| [Marc Lou](https://x.com/marclou/status/2087872366898827510) quoting that, TrustMRR logs | **392 likes, 472 bookmarks**; n=1M+ AI-bot hits / 30 days | OpenAI and Anthropic used `llms.txt` to answer users, index, and train. Markdown crawled ~50% of the time; bots still fetch HTML. `/mcp` was the hottest path for ChatGPT/Claude **on that product**. | n=1, but first-party logs beat vendor blogs. Confirms `llms.txt` is fetched, not just a fashion. |
| [Mintlify](https://x.com/mintlify/status/2078147956163932269) + [benchmark](https://www.mintlify.com/blog/llms-txt-agent-benchmark) (17 Jul 2026) | 74 likes / 33k views on the post; 2,400 runs, 20 sites | HTML-only: **15–30× more 404s** than markdown + `llms.txt`. Adding an `llms.txt` link cut 404s ~90% (Claude 0.8→0.1, Codex 2.1→0.2 per task). Agents probe `.md` on their own. | Strongest **agent-readability** evidence. Accuracy barely moved; waste (tokens, 404s) did. Directly justifies Markdown twins. |
| [Julian Goldie](https://x.com/JulianGoldieSEO/status/1980030071890223194) (19 Oct 2025) | **440 likes, 820 bookmarks, 75k views** | Turn a post into Q&A, add citations + stats, test in ChatGPT. Before: ignored. After: mentioned first. | Anecdote + lead magnet. The **shape** (Q&A + stats) matches Princeton. Do not copy the “forces AI to cite you” framing. |
| [Alex Groberman](https://x.com/alexgroberman/status/1978487434070667718) (15 Oct 2025) | **242 likes, 567 bookmarks, 47k views** | Rankscale: for “best CRM / top vendor” queries, a large share of citations were **vendor blogs**, not magazines, because they ship structured comparison posts and refresh faster. Gap: “neutral comparison content.” | Directly describes Tiebreak’s category. If we do not occupy “X vs Y,” a vendor blog will. |
| [Jeremy Moser](https://x.com/jmoserr/status/2032463564775047248) | 75 likes, 14.6k views | Most GEO papers confuse correlation with causation. SparkToro: <1 in 100 chance ChatGPT/Google AI return the same shortlist twice. Real lever: mentions + links on sites the engines already pull. | Corrective. Use this as the default skepticism. |
| [Tim Soulo / Ahrefs](https://x.com/timsoulo/status/2084338005884452942) (3 Aug 2026) | 60 likes, 10.5k views | Glen Allsopp + Brand Radar: ChatGPT cited 80 spam sites last month; Perplexity 33; Copilot 122; Google AI Overviews 0. Loopholes will close. | Do not spam. Play the long game (unique data + entity + mentions). |
| [Shaun Anderson](https://x.com/Hobo_Web/status/2046217002889425237) (20 Apr 2026) | **414 likes, 706 bookmarks, 43k views** | Blank white page + 7 layers of JSON-LD / `llms.txt` / signed entity claims → #1 Perplexity cite in 36 hours. | Treat as **unreplicated stunt**. Schema without visible text is a spam vector (see Soulo). We keep schema **in lockstep with visible HTML**. |
| [Harpal Singh](https://x.com/CustomIntent/status/2092575630789321009) (26 Aug 2026) | modest | Pages with “by the team” / no author get skipped. Real Person schema + author page. | Reasonable for editorial sites. Tiebreak’s “author” is a scoring method, not a journalist — encode **methodology + Organization**, not a fake byline. |
| [Flavio Amiel CITED framework](https://x.com/fba/status/2092280085067825477) | 42 likes, 88 bookmarks | Crawlability, intent-first content, trust, entity, measurement. | Useful checklist; not evidence. |

Consensus from the non-spam posts, in one line: **allow the search crawlers, give them Markdown + a map, put unique numbered comparisons on the page, and get other people to write the same facts about you.**

---

## 3. What the web research (primary + case studies) actually supports

### 3.1 Peer-reviewed / first-party (prefer these)

**Princeton GEO paper** — Aggarwal et al., KDD 2024, [arXiv:2311.09735](https://arxiv.org/abs/2311.09735). GEO-bench, ~10k queries, top-5 Google results, GPT-3.5 synthesizer; also tested on live Perplexity.

- Quotation Addition, Statistics Addition, Cite Sources: **+30–40%** on Position-Adjusted Word Count (best single method Quotation Addition, 19.3 → 27.2 PAWC, ~+41%). Keyword stuffing **hurt** (17.7 vs 19.3).
- Live Perplexity: visibility improvements **up to 37%**.
- Lower-ranked pages gained more: Cite Sources gave **+115.1%** visibility to SERP-rank-5 pages; rank-1 often *lost* share.
- Caveat (survey paper [arXiv:2607.14035](https://arxiv.org/html/2607.14035v1) and Formative Digital): “up to 40%” is **share of words in a 5-document simulator**, not traffic or ChatGPT ranking. Still the only peer-reviewed content-edit result.

**Ahrefs, 75k brands** — [May 2025](https://ahrefs.com/blog/ai-overview-brand-correlation/) and [Dec 2025 follow-up](https://ahrefs.com/blog/ai-brand-visibility-correlations/). Spearman correlations with AI Overview / ChatGPT / AI Mode visibility:

| Signal | ρ | Note |
|---|---|---|
| Branded web mentions | **0.664–0.709** | Strongest off-site text signal |
| Branded anchors | 0.511–0.628 | Brand name in the link text |
| Brand search volume | 0.352–0.466 | People searching the name |
| Domain Rating | 0.266–0.326 | Weak–moderate |
| Backlinks | **0.218** | ~3× weaker than mentions |
| Number of site pages | ~0.17–0.194 | More pages ≠ more citations |

Top quartile of web mentions: median **169** AI Overview mentions vs **14** in the next quartile (~10×). Bottom 50%: essentially invisible. Ahrefs themselves: **correlation ≠ causation**; mentions may proxy for brand fame.

**OpenAI crawler docs** — [developers.openai.com](https://platform.openai.com/docs/bots) (quoted across 2026 recaps): `OAI-SearchBot` = ChatGPT **search index** (opt out → not shown in ChatGPT search answers). `GPTBot` = **training**. `ChatGPT-User` = live user fetch; robots.txt may not apply. The three are independent. ChatGPT search historically leans on **Bing**.

**Glasp AEO natural experiment** — [arXiv:2606.04362](https://arxiv.org/html/2606.04362v1) (24 Aug 2026). One domain, treated vs untreated pages, first-party logs. Raw ChatGPT referrals **5.7×**; untreated pages on the **same** domain still **3.5×** (platform tailwind). Treated/control ratio implies ~**1.75–1.82×** extra from the AEO bundle. Placebo-in-time p=0.16 — **suggestive, not conclusive**. Lesson: never report raw “5× ChatGPT traffic” without a control.

**Mintlify docs-url benchmark** — [blog](https://www.mintlify.com/blog/llms-txt-agent-benchmark) + [RESULTS.md](https://github.com/mintlify/docs-url-discovery-bench/blob/main/RESULTS.md). See table in §2.

**`llms.txt` spec** — [llmstxt.org](https://llmstxt.org/) (Jeremy Howard, Sep 2024; v2). Required: H1, **blockquote** summary, `##` sections of `[text](url): note`. Optional `## Optional`. Companion convention: `/llms-full.txt` (full corpus) and `.md` twins. Common Crawl (Jul 2026 crawl) found hundreds of thousands of files; ~half follow the shape; substance (notes after links) is rarer. Not a W3C standard; Anthropic/Stripe/Vercel/Mintlify publish it. Inference-time use is **confirmed in some first-party logs** (Marc Lou, Mintlify), not guaranteed for every engine.

### 3.2 Case studies with before → after (quality varies)

Prefer rows with a control, a named site, or first-party analytics. Discount unnamed agency “80% mention rate” decks.

| Case | Window | Before → after | What they did | Trust |
|---|---|---|---|---|
| Princeton GEO (simulator + Perplexity) | lab | +30–40% PAWC; Perplexity up to +37% | Add quotes, stats, outbound citations | High (peer-reviewed) |
| Glasp Q&A corpus | Jan–May 2026 | Treated 6.1× vs control 3.5× ChatGPT referrals (~1.8× net) | AEO bundle on a subset of pages | High (logs + control; effect not conclusive) |
| [PlushBeds / ResultFirst](https://ranqo.ai/blog/roi-ai-visibility-case-studies) | Feb→Jun 2025 (5 mo) | ChatGPT sessions 143 → 1,232 (**+762%**); AI Overviews 14 → 147 (**+950%**) | `llms.txt`, FAQ/HowTo/Product schema, Q&A blocks, ChatGPT Shopping | Medium (named brand, no control; platform was growing) |
| [RankScope B2B SaaS](https://rankscope.ai/blog/geo-case-studies) | 90 days | Blended citation rate **2.5% → 34%** (ChatGPT 2→31, Perplexity 3→38); prompt coverage 7/40 → 39/40 | Prompt map + extractable rewrites. Note: 30-day check looked like a miss; 60–90 days was the move | Medium (named method, unnamed brand) |
| [Kick Ads](https://www.kickads.co/en/generative-engine-optimization) | 1–24 Jul 2026 | First-party GA4: 46 AI-referral sessions (Gemini 19, Perplexity 16, ChatGPT 7, Claude 4); YouTube-ads guide cited in a Chinese AI Overview | Answer-first + original stats | Medium (tiny n, first-party) |
| Medium GEO playbook (Mehul Jain) | ~3 weeks | One comparison **table** on a pricing page → Perplexity started citing “X vs Y” | Table as the extractable unit | Low–medium (anecdote, but matches absorption paper) |
| [All-EO recruitment](https://www.all-eo.com/hub/articles/aeo-recruitment-agency-case-study-2026) | 94 days | ChatGPT first-cite 0/10 → 7/10; Perplexity 0 → 4/10 | Cut intros 120→60 words, raise factual density (salaries, timelines) | Medium (named niche, no control) |
| LandingBoost ([X](https://x.com/yusukelp/status/2068022471157219402)) | unspecified | Perplexity #1 for a niche tool query | Benchmark pages, FAQ/schema, `llms.txt`, comparison content | Low (self-report, 23 likes) |

Agency decks quoting “49× LLM revenue” or “$2.34M from AI discovery” without a public method or control are omitted from the build list.

**Time-to-signal, if the site is indexed:** Perplexity often days–weeks (freshness bias). ChatGPT search: weeks, gated on Bing. Claude: slower, prefers structured evidence. Brand-name mentions without a Wikipedia/Wikidata entity: months of off-site work.

### 3.3 Engine cheat sheet (what to actually do)

| Engine | Retrieval | Cites | Freshness | Tiebreak lever |
|---|---|---|---|---|
| **ChatGPT Search** | Bing + `OAI-SearchBot` | Selective; high absorption per citation | Moderate; recency helps | Bing Webmaster + IndexNow + unique numbered verdicts |
| **Perplexity** | Live web, 5–10 footnotes | Generous; Reddit-heavy in some studies | **Very high** | Visible `dateModified`, comparison tables, original numbers |
| **Google AI Overviews / Gemini** | Google index + Knowledge Graph | Usually pages already in top ~10 | Moderate | Classic SEO + entity (Wikidata) + tables |
| **Copilot** | Bing | Similar to ChatGPT | Moderate | Same as ChatGPT (Bing) |
| **Claude** | Web search (Brave-reported) + training | Own-site pages more than Wikipedia | Lower | Structured headings, methodology, Markdown, `llms.txt` |
| **Grok** | X firehose + web | Social-weighted | Very high | Founder posts on X that quote Tiebreak URLs + stats |

---

## 4. Where Tiebreak stands today (gap map)

Catalog as of this file: **119 products**, **1,010 matchups**, 7 types (phones, laptops, TVs, headphones, vacuums, purifiers, cards). Verdict, deal-breakers, and use-case answers are computed from published specs — that **is** original, citable data. Crawlers can already see it in HTML.

| # | Gap | Evidence it matters | Now | Priority |
|---|---|---|---|---|
| G0 | **No public origin yet.** Name/domain still TBD; `SITE_URL` fallback `tiebreak.app` is a placeholder and is not registrable. | Nothing else works until crawlers can fetch *our* catalog at an origin we control. | Blocker | **P0** |
| G1 | **No citation baseline.** We have not run a fixed prompt set on ChatGPT / Perplexity / Claude / Gemini / Grok and logged cites. | Every serious case study starts here. RankScope almost quit at day 30. | Missing | **P0** |
| G2 | **Not in Bing / no IndexNow.** ChatGPT Search + Copilot. | OpenAI: opted-out of `OAI-SearchBot` → not in ChatGPT search. IndexNow is Bing’s fast path. | Missing | **P0** |
| G3 | **No AI-referrer measurement.** PostHog is optional; no `chatgpt.com` / `perplexity.ai` / `claude.ai` / `gemini.google.com` segment. GA4 lumps most of this as Direct. | Kick Ads, Glasp, PlushBeds all used first-party logs. Zeno: check **server logs**. | Missing | **P0** |
| G4 | **`llms.txt` is off-spec.** Has H1 + lists, but **no blockquote summary**; links are `[text](url): claim` which is close. 1,010 rows is a map, not a curated index. No `/llms-full.txt`. No `.well-known/llms.txt`. | llmstxt.org; Lighthouse agent audit fails without markdown links; Mintlify/Marc Lou: file is fetched. | Partial | **P1** |
| G5 | **No Markdown twins.** Agents request `…/slug.md` and 404 (Mintlify: that is the #1 HTML-only failure). SEO-PLAN already listed this as “later.” Static export can emit extra `.md` files. | Mintlify 15–30× 404s; Zeno Rocha; yazin/`site-md`. | Missing | **P1** |
| G6 | **No visible dates / `dateModified`.** `CATALOG_AS_OF` exists only in sitemap `lastmod`. Perplexity weights freshness; undated pages lose to dated ones. | Perplexity GEO guides; SE Ranking (pages updated in 2 months: 5.0 vs 3.9 cites). | Missing | **P1** |
| G7 | **Princeton trio only half-done.** Pages have **statistics** (spec tables, win counts). They do **not** quote named sources (“Sony lists 144 Hz on the official sheet”) or put those quotes in the first 80 words. Outbound official-source links exist at the bottom, not next to the claim. | KDD 2024: quotes + cite-sources + stats = the only edits that moved PAWC. | Partial | **P1** |
| G8 | **No “best X for Y” URLs.** Only pairwise `/compare/a-vs-b/`. People ask LLMs “best OLED for gaming,” “best travel card 2026.” Per-lens answers exist **on** the pair page, but there is no crawlable category/use hub. SEO-PLAN L3 (subcategory landings) still later. | Query fan-out: engines split one question into many. Uncovered sub-questions go to RTINGS/Wirecutter. | Missing | **P1** |
| G9 | **Product pages have no FAQ / no `FAQPage`.** “How much does X cost?”, “what does it compare against?” | Same extractability as compare FAQs. Cheap. | Missing | **P1** |
| G10 | **Organization schema is a stub.** Name + URL only. No `sameAs`, logo, description, founding, `knowsAbout`. No Person. No Wikidata. | Ahrefs entity follow-ups; Attrifast: 4+ matched `sameAs` surfaces ~3× citation odds (vendor study). Claude/Gemini lean on Knowledge Graph. | Partial | **P2** |
| G11 | **Zero off-site mentions of “Tiebreak.”** No Wikipedia, Wikidata, Crunchbase, Product Hunt, AlternativeTo, Reddit, YouTube, press. GitHub repo exists (`etheuer/tiebreak`). | Ahrefs 0.664 mentions vs 0.218 links; HubSpot ~92% of AI mentions are third-party; Moser. | Missing | **P2** |
| G12 | **No original research artifact.** The scoring method is unique, but it is not packaged as a citable study (“we scored 1,010 US matchups; 62% of phone pairs the winner is not the cheaper one”). Engines prefer the page that owns the number. | Princeton stats-addition; Perplexity original-data bias; Dupple “original data +40%.” | Missing | **P2** |
| G13 | **Images are placeholders.** Product schema without `image` will not get rich results; some AI cards show images. | SEO-PLAN F16. | Later | **P3** |
| G14 | **HTML weight / RSC payload.** SEO-PLAN F13: 108–194 KB inline search index per page. ChatGPT-cited pages with fast FCP reportedly collect more cites (aidev.com; treat as correlational). | Secondary. | Later | **P3** |
| G15 | **`llms.txt` may not use `:` notes on every line in the Lighthouse sense; MIME is `text/plain`.** Spec wants markdown parsed as markdown. | Search Engine Journal / Lighthouse agent audit. | Small | **P1** |

Already in good shape (do not redo): unique H1/title per route, server-rendered verdict as the first paragraph, spec tables, visible FAQ on compare pages, `FAQPage` matching visible text, AI crawlers allowed in `robots.txt` (including `OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Bingbot`, `Google-Extended`), sitemap, canonicals, compare hub, methodology sentence on About.

---

## 5. Plan — cover the gaps, in order

Do not start P1 content work until P0 is green. A beautiful FAQ on a domain Bing cannot see is theater.

### P0 — Ship and measure (week 1). Owner + implementer.

**T0. Put this catalog on a public origin we control.** Pick any hostname we can actually use (final brand domain once chosen, or a Vercel/Cloudflare preview in the meantime). Set `NEXT_PUBLIC_SITE_URL` at **build** time to that origin — never leave the `tiebreak.app` fallback in a public build. Confirm `https://<origin>/llms.txt`, `/sitemap.xml`, `/robots.txt`, and one compare URL return 200 with trailing slashes. When the real name lands, rebuild with the new origin and 301 the old host at the CDN (static export cannot redirect).

**T1. Submit to both indexes.** Google Search Console + **Bing Webmaster Tools** (this is the ChatGPT Search door). Submit the sitemap. Enable **IndexNow** on each build (static export: a small `scripts/indexnow.mjs` that POSTs the URL list; store the key as `public/<key>.txt`).

**T2. Confirm crawler policy on the live host.** `curl` live `robots.txt`. WAF/host must not block `OAI-SearchBot`, `ChatGPT-User`, `GPTBot`, `PerplexityBot`, `Perplexity-User`, `Claude-SearchBot`, `Claude-User`, `ClaudeBot`, `Google-Extended`, `Bingbot`, `CCBot`. Training vs search is a product decision; for a comparison publisher, **allow both** unless legal says otherwise. Search bots are non-negotiable.

**T3. Baseline citation audit (do this before any content change).** Fixed prompt pack, 3 runs each, log date / engine / cited domains / whether Tiebreak appears / whether the **verdict and numbers** match ours (selection vs absorption).

Prompt pack (25). Swap in the live product names from the catalog:

1. iPhone 16 Pro vs Galaxy S24 Ultra — which should I buy?
2. Best OLED TV for gaming 2026
3. Sony A95L vs Bravia 9
4. MacBook Pro 16 vs Surface Pro 11 for a student
5. Best noise-cancelling headphones under $400
6. Sony WH-1000XM5 vs Bose QC Ultra
7. Dyson V15 vs Shark Stratos — which vacuum?
8. Best cordless vacuum for pet hair
9. Coway vs Blueair vs Dyson air purifier for a bedroom
10. Amex Gold vs Citi Double Cash — which card?
11. Best travel credit card for US residents 2026
12. iPhone 16 vs Pixel 9 camera
13. Best laptop for video editing under $2000
14. Hisense U7N vs TCL QM7
15. Which is better for movies, [TV A] or [TV B]?
16. Deal-breakers: does [vacuum A] have a worse battery than [vacuum B]?
17. Compare [headphone A] and [headphone B] specs
18. Is [card A] worth the annual fee vs [card B]?
19. Best phone for photos 2026
20. RTINGS vs GSMArena vs a spec-sheet comparison — who should I trust? *(entity probe)*
21. Site that compares two products spec by spec and gives a verdict
22. `<chosen-origin>` *(brand/URL probe — skip until a public hostname exists; expect zero at first)*
23. “`<chosen-public-name>`” product comparison *(same: only after the name is locked)*
24. Best air purifier for allergies 2026
25. Galaxy S24 Ultra vs iPhone 16 Pro for travel

Store results in `evidence/geo-baseline-YYYY-MM-DD.md`. Re-run the **same** 25 every two weeks for 90 days. Do not change the prompt text.

**T4. AI-referral tracking.** PostHog: capture `$referrer` host in (`chatgpt.com`, `chat.openai.com`, `perplexity.ai`, `claude.ai`, `gemini.google.com`, `copilot.microsoft.com`, `x.com` if Grok). Also log user-agents for `OAI-SearchBot` / `PerplexityBot` / `Claude-SearchBot` at the **host** (static export cannot see logs; Vercel/Cloudflare will). Zeno is right: analytics miss most bot reads.

**P0 accept:** live 200s on sitemap/robots/llms; Bing + Google property verified; 25×5-engine baseline file exists; PostHog (or host logs) can show an AI referrer if one happens.

---

### P1 — Make pages the thing the model copies (weeks 1–3). Implementer.

These are the Princeton + absorption-paper edits, applied to a comparison site.

**T5. Fix `llms.txt` to the spec, and add a curated sibling.**

- H1 `Tiebreak`
- Blockquote summary (one paragraph: what it is, US catalog, published specs not lab tests, as-of date)
- `## Matchups` — **not all 1,010**. Curate: one featured pair per subcategory + the 20 highest-intent pairs (flagship phones, flagship TVs, fee cards). Each line: `[A vs B](url): <verdictLine>`
- `## All matchups` pointing at `/compare/` and `/sitemap.xml` so agents that want the long tail can walk it
- `## Methodology` linking `/about/`
- Optional `## Optional` for legal
- Keep MIME `text/plain; charset=utf-8` (spec) but content is markdown
- Duplicate at `/.well-known/llms.txt` if the host allows

Do **not** dump 1,010 verdicts into the root file. That is a sitemap, and we already have one. The index should be something an agent can finish in one read.

**T6. Markdown twin per compare (and product) page.** SEO-PLAN “Markdown twins,” now first-class.

- `/compare/<slug>/index.md` (or `/compare/<slug>.md`) returning: title, as-of date, verdict sentence, win counts, price gap, deal-breakers, each use-case headline + 2 reasons, the differing spec rows as a markdown table, official source URLs, canonical HTML URL.
- Link that twin from `llms.txt`.
- At the **top** of each `.md`, one line: `Index: /llms.txt` (Mintlify: the link is what killed 404s).
- Static export can do this with `src/app/compare/[slug]/index.md/route.ts` (`force-static`) the same way `llms.txt` already works.

Skip `Accept: text/markdown` on the HTML URL unless the host can content-negotiate. Static files on Vercel/S3 cannot. Twins are the reliable path.

**T7. Visible as-of + `dateModified` on every compare and product page.** Render `Catalog as of 1 September 2026` near the verdict. JSON-LD `WebPage`/`Article` with `dateModified: CATALOG_AS_OF`. When the catalog changes, bump the constant and rebuild (already how sitemap `lastmod` works). Perplexity’s freshness bias is the point.

**T8. Princeton trio on the compare template** (one component, all 1,010 pages).

After the verdict sentence, a 3–5 bullet “Why, in numbers” list, each bullet **one spec + two numbers + source**:

> Sony lists 144 Hz on the A95L spec sheet; LG lists 120 Hz on the G4. That is why the A95L leads the gaming lens.

Pull `officialSource.url` **next to the claim**, not only in the footer. That is Cite Sources + Statistics + a quotation of the maker, which is the KDD-winning combination, and it is unique to us (we already store the source).

Do not invent quotes. If a row is “other published figure, not the maker sheet,” say so (the page already marks those).

**T9. Product-page FAQ + `FAQPage`.** Three questions, same strings in HTML and schema: price (list snapshot + date), key specs (3 highlights), “what does it compare against?” (list matchup links). Cheap absorption surface for “how much is X” fan-out.

**T10. Subcategory + use-case hubs (the missing query class).**

- `/category/.../tvs/` (or `/tvs/`) titled **TV comparisons**, opening with a 40–80 word answer: how many TVs, how we score, link to the flagship pair.
- `/best/tv-for-gaming/` (or a section on the subcategory page) listing every pair’s **gaming** lens winner in a table. Same for photos, travel, movies, pet hair, etc., but only where `use-cases.ts` already has a lens.

This is the page Perplexity cites for “best OLED for gaming,” which no pairwise URL currently owns. Keep tables; engines copy tables.

**T11. Answer-first already exists — tighten, don’t rewrite.** Compare H1 is the pair name; the next `<p>` is already `verdictLine()`. Keep it under ~40 words where it isn’t. All-EO’s 94-day case cut intros 120→60 and raised fact density; we are already closer to 60 than 120. Do not add a marketing lede above the verdict.

**P1 accept:** live `/llms.txt` starts with `#` then `>`; at least one compare `.md` 200s and contains the verdict table; compare HTML shows as-of date and an inline official-source citation; one subcategory hub exists; product FAQ schema present; re-run the 25 prompts 14 days after indexation.

---

### P2 — Get other people (and entities) to say the same facts (weeks 2–8). Owner-heavy.

On-page work cannot create the Ahrefs 0.664 mention signal. This is the part most GEO checklists skip and the part Moser/Ahrefs say actually predicts brand-level mentions.

**T12. Entity graph for “Tiebreak” the publisher.**

- Expand Organization JSON-LD: `description`, `logo`, `sameAs` (GitHub org/repo, future X, Crunchbase, Wikidata, Product Hunt).
- Create a **Wikidata** item (not Wikipedia — Wikipedia will be declined until there is independent coverage). `sameAs` both ways.
- Crunchbase + Product Hunt “Ship” as a spec-sheet comparison tool. AlternativeTo / Slant if they still take submissions.
- NAP consistency: same one-sentence description on About, GitHub README, Wikidata, Crunchbase.

**T13. One citable research page.** `/method/` or `/research/us-catalog-2026-09/` with original aggregates only we can compute, each with a one-line takeaway:

- Share of pairs where the spec winner is not the cheaper product, by subcategory
- Most common deal-breaker that actually trips in this catalog
- How often the “gaming” lens disagrees with Overall (TVs, laptops)

This is Statistics Addition at site level. Perplexity and Claude prefer the page that owns the number. Cite the catalog date. No fake surveys.

**T14. Third-party mentions, honest and slow.**

- 5–10 useful replies in existing Reddit threads (`r/buildapcsales`, `r/headphones`, `r/CreditCards`, `r/oled_gaming`) that answer the question with **numbers** and a link. No “check out my site.” Perplexity cites Reddit heavily; spam gets you banned and then cited as spam (Soulo).
- One founder X thread per week quoting a **specific** verdict + table screenshot + URL (Grok’s firehose).
- Pitch one journalist/newsletter per subcategory (The Verge / Wirecutter-adjacent / Doctor of Credit / rtings-adjacent blogs) with the research page, not a homepage.
- GitHub README that reads like `llms.txt` (agents already fetch GitHub).

**T15. YouTube only if someone will actually film.** Ahrefs follow-up: YouTube mentions ρ≈0.737 for AI Overviews. A 60-second “how the verdict is scored” screencast per subcategory is enough. Skip if there is no production capacity — do not publish empty accounts.

**P2 accept:** public name locked; Wikidata Q-id live and in `sameAs`; research page indexed; 10+ independent URLs that mention that name in the comparison sense (search `"<name>" -site:<origin>` monthly); brand prompt (#22–23) is no longer zero on at least Perplexity. If the name is still TBD, skip this gate and keep shipping P0–P1 on the preview origin.

---

### P3 — Later / do not do yet

- Licensed product images + `image` on Product schema (SEO-PLAN L5)
- HTML-weight cut (search index out of the layout)
- `llms-full.txt` of all 1,010 pages (too big; if anything, full.txt of **methodology + 20 featured pairs**)
- UK public catalog (i18n is a separate track; do not split the entity)
- Wikipedia article (will be deleted without independent coverage)
- Buying GEO SaaS (Profound, Peec, Scrunch) until the 25-prompt sheet is boringly manual for two cycles
- Blank-page schema stunts, keyword stuffing, fake authors, mass AI articles (Soulo / Princeton: stuffing hurts; Google AI Overviews already filter this)

---

## 6. What “done” looks like (90 days)

Not vanity traffic. Three numbers, same 25 prompts, same engines:

| Metric | Day 0 (today, site not live) | Day 90 target |
|---|---|---|
| **Selection:** Tiebreak URL in the source list | 0 / 125 (25×5) | ≥ 15 / 125, concentrated on exact “A vs B” prompts |
| **Absorption:** answer repeats our winner **and** at least one of our numbers | 0 | ≥ 8 / 125 |
| **AI-referred sessions** (PostHog, not “Direct”) | 0 | Any non-zero, logged by engine |
| **Off-site mentions** of Tiebreak | ~0 | ≥ 10 indexable URLs |

If selection moves and absorption does not, the page is in the index but too vague — go back to T8 (numbers next to claims). If neither moves after Bing confirms indexation, the problem is off-site (T12–T14), not another FAQ.

---

## 7. Recommended sequence (and the cost of skipping)

**Do P0 this week, then T5–T8, then T10, then T12–T13.** That is the 80/20.

Cost of not taking it:

- Skipping **P0 (any public origin + Bing)** means the entire `SEO-PLAN` export never enters ChatGPT Search. Everything else is local HTML. Waiting on the *final* name is fine for Wikidata; it is not a reason to delay a preview host.
- Skipping **Markdown twins (T6)** leaves the #1 agent failure mode in the Mintlify benchmark unfixed — they will 404 `.md` and move on to RTINGS.
- Skipping **off-site mentions (P2)** can still get pairwise “A vs B” citations (we *are* the comparison page), but will never get “use Tiebreak” brand mentions. Ahrefs: bottom half of mention volume ≈ invisible at the brand layer.
- Skipping **measurement (T3)** is how teams declare victory on platform tailwind (Glasp: 3.5× with no changes).

Do not hire a GEO agency to “add schema.” Schema is already on the compare pages. The missing work is **being live, being in Bing, being extractable as Markdown, dating the catalog, quoting makers next to numbers, owning “best X for Y” URLs, and getting ten other sites to say the name.**

---

## 8. Source list

### X (high engagement or high signal)

- https://x.com/a16z/status/1927766844062011834 — GEO thesis, 3,004 likes
- https://x.com/zenorocha/status/2087547759083901252 — 5-step agent-readable site
- https://x.com/marclou/status/2087872366898827510 — TrustMRR bot logs, `llms.txt` fetched
- https://x.com/mintlify/status/2078147956163932269 — markdown + `llms.txt` benchmark
- https://x.com/JulianGoldieSEO/status/1980030071890223194 — Q&A before/after anecdote
- https://x.com/alexgroberman/status/1978487434070667718 — vendor blogs as citation sources
- https://x.com/alexgroberman/status/2093332352118186264 — selection vs absorption
- https://x.com/jmoserr/status/2032463564775047248 — 92% third-party; correlation ≠ causation
- https://x.com/timsoulo/status/2084338005884452942 — spam in ChatGPT/Perplexity/Copilot cites
- https://x.com/shreyasnivas/status/2093419643482636441 — 23–39% of brand mentions link the brand’s own site
- https://x.com/zaoyang/status/2095135533357740330 — engines cite different domains
- https://x.com/Hobo_Web/status/2046217002889425237 — schema-only stunt (do not copy)
- https://x.com/startupideaspod/status/2038707700226466121 — AEO as a customer channel (1,018 likes)

### Web / papers

- Aggarwal et al., *GEO: Generative Engine Optimization*, KDD 2024 — https://arxiv.org/abs/2311.09735
- Critical survey of GEO 2023–2026 — https://arxiv.org/html/2607.14035v1
- Glasp AEO natural experiment — https://arxiv.org/html/2606.04362v1
- Ahrefs 75k-brand study — https://ahrefs.com/blog/ai-overview-brand-correlation/
- Ahrefs ChatGPT / AI Mode follow-up — https://ahrefs.com/blog/ai-brand-visibility-correlations/
- a16z GEO essay — https://a16z.com/geo-over-seo/
- llmstxt.org spec — https://llmstxt.org/
- Mintlify agent URL benchmark — https://www.mintlify.com/blog/llms-txt-agent-benchmark
- OpenAI crawlers — https://platform.openai.com/docs/bots
- PlushBeds before/after — https://ranqo.ai/blog/roi-ai-visibility-case-studies
- RankScope 90-day SaaS — https://rankscope.ai/blog/geo-case-studies
- Kick Ads first-party AI referrals — https://www.kickads.co/en/generative-engine-optimization
- Evil Martians, techniques that work / don’t — https://evilmartians.com/chronicles/how-to-make-your-website-visible-to-llms
- Common Crawl `llms.txt` content analysis — https://commoncrawl.org/blog/a-content-analysis-of-llms-txt-files-from-the-july-2026-crawl-archive
