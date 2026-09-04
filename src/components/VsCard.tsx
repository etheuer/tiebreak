import type { Comparison, Product } from "@/lib/data";
import { compareHref, priceShort, subLabel } from "@/lib/nav";
import type { Verdict } from "@/lib/verdict";
import type { MarketId } from "@/lib/markets";
import { ProductImage } from "@/components/ProductImage";
import { CompareLink } from "@/components/CompareLink";
export function VsCard({
  comparison,
  productA,
  productB,
  verdict,
  market = "us",
}: {
  comparison: Comparison;
  productA: Product;
  productB: Product;
  verdict: Verdict;
  market?: MarketId;
}) {
  return (
    <CompareLink
      href={compareHref(comparison, market)}
      className="cb-vs-card"
      aria-label={`${productA.name} versus ${productB.name}`}
    >
      <div className="cb-vs-meta">
        <span>{subLabel(productA.subcategory)}</span>
        <span>{verdict.differing} differences</span>
      </div>
      <div className="cb-vs-pair">
        {([productA, productB] as const).map((p, i) => (
          <div
            key={p.id}
            className={`cb-vs-side cb-tone-${i === 0 ? "a" : "b"}`}
          >
            <ProductImage product={p} size="lg" tone={i === 0 ? "a" : "b"} />
            <h3>{p.name}</h3>
            <p>{priceShort(p, market)}</p>
          </div>
        ))}
      </div>
      <div className="cb-vs-cta">
        Compare the differences <span aria-hidden>↗</span>
      </div>
    </CompareLink>
  );
}
