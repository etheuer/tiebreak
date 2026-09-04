import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCategories,
  getComparisons,
  getProductsByCategory,
} from "@/lib/data";
import type { MarketId } from "@/lib/markets";
import { pageAlternates, openGraphLocale } from "@/lib/hreflang";
import { categoryHref, homeHref, subLabel } from "@/lib/nav";
import { SITE_NAME } from "@/lib/site";
import { Catalogue } from "@/components/Catalogue";

export async function generateStaticParamsForMarket(market: MarketId) {
  const categories = await getCategories(market);
  return categories.map((cat) => ({ slug: cat.id }));
}

export async function generateMetadataForMarket(
  { params }: { params: Promise<{ slug: string }> },
  market: MarketId,
): Promise<Metadata> {
  const { slug } = await params;
  const [categories, products, comparisons, ukCategories] = await Promise.all([
    getCategories(market),
    getProductsByCategory(slug, market),
    getComparisons(market),
    getCategories("uk"),
  ]);
  const category = categories.find((c) => c.id === slug);
  if (!category) notFound();

  const productIds = new Set(products.map((p) => p.id));
  const categoryComparisons = comparisons.filter(
    (c) => productIds.has(c.productA) && productIds.has(c.productB),
  );
  const subcategoryLabels = [
    ...new Set(products.map((p) => subLabel(p.subcategory))),
  ];
  const description = `Compare ${products.length} ${category.name.toLowerCase()} head to head across ${subcategoryLabels.join(", ")}. ${categoryComparisons.length} published matchups with a spec-by-spec verdict.`;
  const title = `${category.name} comparisons`;
  const canonical = categoryHref(category.id);
  const includeUk = ukCategories.some((candidate) => candidate.id === slug);

  return {
    title,
    description,
    alternates: pageAlternates(canonical, market, includeUk),
    openGraph: {
      title,
      description,
      url: categoryHref(category.id, market),
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

export async function CategoryListing({
  params,
  market,
}: {
  params: Promise<{ slug: string }>;
  market: MarketId;
}) {
  const { slug } = await params;
  const [categories, products, comparisons] = await Promise.all([
    getCategories(market),
    getProductsByCategory(slug, market),
    getComparisons(market),
  ]);
  const category = categories.find((c) => c.id === slug);
  if (!category) notFound();
  const ids = new Set(products.map((p) => p.id));
  const pairs = comparisons.filter(
    (c) => ids.has(c.productA) && ids.has(c.productB),
  );
  return (
    <div className="shell">
      <nav className="cb-breadcrumb" aria-label="Breadcrumb">
        <Link href={homeHref(market)}>Home</Link>
        <span>/</span>
        <span>{category.name}</span>
      </nav>
      <header className="cb-page-intro">
        <p className="eyebrow">{products.length} products to explore</p>
        <h1>
          {category.name},<br />
          with a little more clarity.
        </h1>
        <p>
          Get to know the options. Compare the differences that matter to you,
          with the details behind every choice.
        </p>
      </header>
      <Catalogue products={products} comparisons={pairs} market={market} />
    </div>
  );
}
