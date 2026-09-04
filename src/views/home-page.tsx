import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getComparisons, getProducts } from "@/lib/data";
import { marketPath, type MarketId } from "@/lib/markets";
import { pageAlternates, openGraphLocale } from "@/lib/hreflang";
import { buildVerdict } from "@/lib/verdict";
import { categoryHref, compareHref, subLabel, hubHref } from "@/lib/nav";
import { VsCard } from "@/components/VsCard";
import { CompareBuilder } from "@/components/CompareBuilder";
import { builderData } from "@/lib/builder-data";
import { ProductStage } from "@/components/ProductStage";
import { Glyph } from "@/components/ProductMark";

export async function homeMetadata(market: MarketId): Promise<Metadata> {
  const ukProducts = await getProducts("uk");
  const includeUk = ukProducts.length > 0;
  const path = marketPath(market, "/");
  return {
    alternates: pageAlternates("/", market, includeUk),
    openGraph: { url: path, locale: openGraphLocale(market) },
  };
}

export async function HomePage({ market }: { market: MarketId }) {
  const [products, comparisons, categories] = await Promise.all([
    getProducts(market),
    getComparisons(market),
    getCategories(market),
  ]);
  const byId = new Map(products.map((p) => [p.id, p]));
  const subs = [...new Set(products.map((p) => p.subcategory))];
  const pairs = comparisons.flatMap((comparison) => {
    const productA = byId.get(comparison.productA);
    const productB = byId.get(comparison.productB);
    return productA && productB ? [{ comparison, productA, productB }] : [];
  });
  const featured = subs
    .flatMap((sub) =>
      pairs.filter((p) => p.productA.subcategory === sub).slice(0, 1),
    )
    .slice(0, 6);
  const hero =
    pairs.find(
      (p) =>
        [p.productA.id, p.productB.id].includes("sony-wh-1000xm5") &&
        [p.productA.id, p.productB.id].some((id) =>
          id.includes("bose-quietcomfort-ultra"),
        ),
    ) ??
    featured.find((p) => p.productA.subcategory === "headphones") ??
    featured[0];
  const { builderProducts, publishedPairs } = builderData(
    products,
    comparisons,
    market,
  );
  return (
    <div className="shell">
      <section className="cb-home-hero">
        <div>
          <p className="eyebrow">
            Good decisions start with a clear comparison.
          </p>
          <h1>
            Find your
            <br />
            <em>better fit.</em>
          </h1>
          <p className="cb-intro-copy">
            Two good options. One choice that’s right for you. Put the
            differences in focus and see what matters for the way you live.
          </p>
          <div className="cb-actions">
            <a className="btn btn-primary" href="#build">
              Compare two products <span aria-hidden>→</span>
            </a>
            <Link className="btn btn-ghost" href={hubHref(market)}>
              Explore comparisons
            </Link>
          </div>
        </div>
        {hero && (
          <div>
            <div className="cb-pair">
              <ProductStage product={hero.productA} market={market} />
              <ProductStage product={hero.productB} side="b" market={market} />
            </div>
            <p className="cb-hero-caption">
              <Link href={compareHref(hero.comparison, market)}>
                See how these two compare ↗
              </Link>
            </p>
          </div>
        )}
      </section>
      <section className="cb-section" aria-labelledby="browse">
        <div className="cb-section-head">
          <div>
            <p className="eyebrow">Start where you are</p>
            <h2 id="browse">What are you choosing?</h2>
          </div>
          <span className="eyebrow">
            {products.length} products. Room to be particular.
          </span>
        </div>
        <div className="cb-category-grid">
          {subs.map((sub) => {
            const ps = products.filter((p) => p.subcategory === sub);
            return (
              <Link
                key={sub}
                className="cb-category-tile"
                href={
                  market === "us"
                    ? `/category/${ps[0].category}/${sub}/`
                    : categoryHref(ps[0].category, market)
                }
              >
                <Glyph subcategory={sub} size={30} />
                <span>
                  <strong>{subLabel(sub)}</strong>
                  <small>{ps.length} products</small>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      <section id="build" className="cb-section">
        <div className="cb-section-head">
          <div>
            <p className="eyebrow">Your shortlist, side by side</p>
            <h2>Two on your mind?</h2>
            <p>
              Choose your pair. We’ll bring the relevant specs, costs, and
              trade-offs together.
            </p>
          </div>
        </div>
        <CompareBuilder
          products={builderProducts}
          publishedPairs={publishedPairs}
          market={market}
        />
      </section>
      <section className="cb-section">
        <div className="cb-section-head">
          <div>
            <p className="eyebrow">A little inspiration</p>
            <h2>Good pairs. Interesting differences.</h2>
          </div>
          <Link href={hubHref(market)}>Browse all comparisons →</Link>
        </div>
        <div className="cb-grid-pairs">
          {featured.map((p) => (
            <VsCard
              key={p.comparison.productA + p.comparison.productB}
              {...p}
              verdict={buildVerdict(p.productA, p.productB, market)}
              market={market}
            />
          ))}
        </div>
      </section>
      <section
        className="cb-section cb-steps"
        aria-label="How Clinchmark works"
      >
        <div>
          <b>01 / Bring your shortlist</b>
          <h3>Start with two.</h3>
          <p>
            Browse a category or compare the products you’re already
            considering.
          </p>
        </div>
        <div>
          <b>02 / Make it personal</b>
          <h3>Choose what matters.</h3>
          <p>
            Set your priorities and requirements to see which differences affect
            your decision.
          </p>
        </div>
        <div>
          <b>03 / See the whole picture</b>
          <h3>Understand the trade-off.</h3>
          <p>
            Explore published specifications and their sources. Every
            recommendation comes with its reasoning.
          </p>
        </div>
      </section>
      <nav className="cb-actions" aria-label="All categories">
        {categories.map((c) => (
          <Link className="chip" key={c.id} href={categoryHref(c.id, market)}>
            {c.name} →
          </Link>
        ))}
      </nav>
    </div>
  );
}
