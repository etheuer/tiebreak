import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategories, getComparisons, getProducts } from "@/lib/data";
import type { MarketId } from "@/lib/markets";
import { pageAlternates, openGraphLocale } from "@/lib/hreflang";
import { categoryHref, homeHref, subLabel } from "@/lib/nav";
import { absUrl, SITE_NAME } from "@/lib/site";
import { Catalogue } from "@/components/Catalogue";

export async function generateStaticParamsForMarket(market: MarketId) {
  const products = await getProducts(market);
  const seen = new Set<string>();
  const params: { slug: string; sub: string }[] = [];
  for (const product of products) {
    const key = `${product.category}/${product.subcategory}`;
    if (!seen.has(key)) {
      seen.add(key);
      params.push({ slug: product.category, sub: product.subcategory });
    }
  }
  return params;
}

export async function generateMetadataForMarket(
  { params }: { params: Promise<{ slug: string; sub: string }> },
  market: MarketId,
): Promise<Metadata> {
  const { slug, sub } = await params;
  const [categories, products, comparisons] = await Promise.all([
    getCategories(market),
    getProducts(market),
    getComparisons(market),
  ]);

  const category = categories.find((c) => c.id === slug);
  const subProducts = products.filter(
    (p) => p.category === slug && p.subcategory === sub,
  );
  if (!category || subProducts.length === 0) return { title: "Not found" };

  const subIds = new Set(subProducts.map((p) => p.id));
  const subComparisons = comparisons.filter(
    (c) => subIds.has(c.productA) && subIds.has(c.productB),
  );

  const title = `${subLabel(sub)} comparisons`;
  const description = `Compare ${subProducts.length} ${subLabel(sub).toLowerCase()} head to head across published specifications. ${subComparisons.length} matchups with spec-by-spec verdicts.`;
  const canonical = `/category/${slug}/${sub}/`;

  return {
    title,
    description,
    alternates: pageAlternates(canonical, market, false),
    openGraph: {
      title,
      description,
      url: absUrl(canonical),
      type: "website",
      siteName: SITE_NAME,
      locale: openGraphLocale(market),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export async function SubcategoryListing({
  params,
  market,
}: {
  params: Promise<{ slug: string; sub: string }>;
  market: MarketId;
}) {
  const { slug, sub } = await params;
  const [categories, all, comparisons] = await Promise.all([
    getCategories(market),
    getProducts(market),
    getComparisons(market),
  ]);
  const category = categories.find((c) => c.id === slug);
  const products = all.filter(
    (p) => p.category === slug && p.subcategory === sub,
  );
  if (!category || !products.length) notFound();
  const ids = new Set(products.map((p) => p.id));
  const pairs = comparisons.filter(
    (c) => ids.has(c.productA) && ids.has(c.productB),
  );
  return (
    <div className="shell">
      <nav className="cb-breadcrumb" aria-label="Breadcrumb">
        <Link href={homeHref(market)}>Home</Link>
        <span>/</span>
        <Link href={categoryHref(slug, market)}>{category.name}</Link>
        <span>/</span>
        <span>{subLabel(sub)}</span>
      </nav>
      <header className="cb-page-intro">
        <p className="eyebrow">
          {products.length} products · {pairs.length} comparisons
        </p>
        <h1>
          {subLabel(sub)},<br />
          side by side.
        </h1>
        <p>
          From your first shortlist to the final detail. Explore the options and
          find what fits your life.
        </p>
      </header>
      <Catalogue products={products} comparisons={pairs} market={market} />
    </div>
  );
}
