import type { Metadata } from "next";
import Link from "next/link";
import { getComparisons, getProducts } from "@/lib/data";
import { compareHref, homeHref, hubHref, subLabel } from "@/lib/nav";
import type { MarketId } from "@/lib/markets";
import { pageAlternates, openGraphLocale } from "@/lib/hreflang";
import { SITE_NAME } from "@/lib/site";
import { builderData } from "@/lib/builder-data";
import { CompareBuilder } from "@/components/CompareBuilder";
import { ComparisonDirectory } from "@/components/ComparisonDirectory";
export async function generateHubMetadata(market: MarketId): Promise<Metadata> {
  const [comparisons, ukComparisons] = await Promise.all([
    getComparisons(market),
    getComparisons("uk"),
  ]);
  const includeUk = ukComparisons.length > 0;
  const description = `Every head-to-head published on ${SITE_NAME}: ${comparisons.length} matchups across TVs, laptops, phones, headphones, cordless vacuums, air purifiers and credit cards, each with a spec-by-spec verdict.`;
  const title = "All product matchups";
  const path = hubHref(market);
  return {
    title,
    description,
    alternates: pageAlternates("/compare/", market, includeUk),
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      siteName: SITE_NAME,
      locale: openGraphLocale(market),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export async function CompareHubPage({ market }: { market: MarketId }) {
  const [products, comparisons] = await Promise.all([
    getProducts(market),
    getComparisons(market),
  ]);
  const { builderProducts, publishedPairs } = builderData(
    products,
    comparisons,
    market,
  );
  const byId = new Map(products.map((p) => [p.id, p]));
  const subs = [...new Set(products.map((p) => p.subcategory))];
  return (
    <div className="shell">
      <nav className="cb-breadcrumb" aria-label="Breadcrumb">
        <Link href={homeHref(market)}>Home</Link>
        <span>/</span>
        <span>Comparisons</span>
      </nav>
      <header className="cb-page-intro">
        <p className="eyebrow">The comparison library</p>
        <h1>
          Your next decision
          <br />
          starts here.
        </h1>
        <p>
          Find a familiar pair, discover an alternative, or bring two products
          together yourself.
        </p>
      </header>
      <CompareBuilder
        products={builderProducts}
        publishedPairs={publishedPairs}
        market={market}
      />
      <section className="cb-section">
        <div className="cb-section-head">
          <h2>Find your pair.</h2>
        </div>
        <ComparisonDirectory
          groups={subs.map((sub) => ({
            id: sub,
            label: subLabel(sub),
            entries: comparisons
              .filter((c) => byId.get(c.productA)?.subcategory === sub)
              .map((c) => ({
                name: c.productName,
                href: compareHref(c, market),
              })),
          }))}
        />
      </section>
    </div>
  );
}
