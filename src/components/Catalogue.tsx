import Link from "next/link";
import type { Product, Comparison } from "@/lib/data";
import type { MarketId } from "@/lib/markets";
import { compareHref, subLabel, productHref } from "@/lib/nav";
import { ProductCard } from "@/components/ProductCard";
import { VsCard } from "@/components/VsCard";
import { CompareBuilder } from "@/components/CompareBuilder";
import { ComparisonDirectory } from "@/components/ComparisonDirectory";
import { FinanceDisclaimer } from "@/components/CatalogNotes";
import { builderData } from "@/lib/builder-data";
import { buildVerdict } from "@/lib/verdict";
import { absUrl } from "@/lib/site";
export function Catalogue({
  products,
  comparisons,
  market,
}: {
  products: Product[];
  comparisons: Comparison[];
  market: MarketId;
}) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const subs = [...new Set(products.map((p) => p.subcategory))];
  const { builderProducts, publishedPairs } = builderData(
    products,
    comparisons,
    market,
  );
  const featured = subs
    .flatMap((sub) =>
      comparisons
        .filter((c) => byId.get(c.productA)?.subcategory === sub)
        .slice(0, Math.max(1, Math.floor(4 / subs.length))),
    )
    .slice(0, 4);
  return (
    <>
      <div className="cb-actions">
        {subs.map((sub) => (
          <a className="chip" key={sub} href={`#products-${sub}`}>
            {subLabel(sub)}
          </a>
        ))}
      </div>
      <section className="cb-section">
        <div className="cb-section-head">
          <div>
            <h2>Bring your shortlist together.</h2>
            <p>Pick two products and explore what sets them apart.</p>
          </div>
        </div>
        <CompareBuilder
          products={builderProducts}
          publishedPairs={publishedPairs}
          market={market}
        />
      </section>
      {featured.length > 0 && (
        <section className="cb-section">
          <div className="cb-section-head">
            <h2>A few places to start.</h2>
            <a href="#all-pairs">All pairs ↓</a>
          </div>
          <div className="cb-grid-pairs">
            {featured.map((comparison) => {
              const a = byId.get(comparison.productA)!;
              const b = byId.get(comparison.productB)!;
              return (
                <VsCard
                  key={comparison.productName}
                  comparison={comparison}
                  productA={a}
                  productB={b}
                  verdict={buildVerdict(a, b, market)}
                  market={market}
                />
              );
            })}
          </div>
        </section>
      )}
      {subs.map((sub) => (
        <section className="cb-section" id={`products-${sub}`} key={sub}>
          <div className="cb-section-head">
            <div>
              <p className="eyebrow">Explore the options</p>
              <h2>{subLabel(sub)}</h2>
            </div>
            {subs.length > 1 && market === "us" && (
              <Link
                href={`/category/${products.find((p) => p.subcategory === sub)!.category}/${sub}/`}
              >
                Explore {subLabel(sub).toLowerCase()} →
              </Link>
            )}
          </div>
          <div className="cb-grid">
            {products
              .filter((p) => p.subcategory === sub)
              .map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  market={market}
                />
              ))}
          </div>
          {sub === "credit-cards" && (
            <FinanceDisclaimer
              products={products.filter((p) => p.subcategory === sub)}
            />
          )}
        </section>
      ))}
      <section className="cb-section" id="all-pairs">
        <h2>Every pair, in one place.</h2>
        <ComparisonDirectory
          groups={subs.map((sub) => ({
            id: `pairs-${sub}`,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: products.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: p.name,
              url: absUrl(productHref(p, market)),
            })),
          }),
        }}
      />
    </>
  );
}
