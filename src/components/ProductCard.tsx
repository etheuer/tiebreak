import Link from "next/link";
import type { Product } from "@/lib/data";
import type { MarketId } from "@/lib/markets";
import { priceShort, productHref, priceCaption, buildHref } from "@/lib/nav";
import { ProductImage } from "@/components/ProductImage";

export function ProductCard({
  product,
  market,
  compareWith,
}: {
  product: Product;
  market: MarketId;
  compareWith?: string;
}) {
  return (
    <article className="cb-product-card">
      <Link
        href={productHref(product, market)}
        className="cb-product-card-image"
        aria-label={`Explore ${product.name}`}
      >
        <ProductImage product={product} size="lg" />
      </Link>
      <div className="cb-product-card-body">
        <p className="eyebrow">{product.brand}</p>
        <h3>
          <Link href={productHref(product, market)}>{product.name}</Link>
        </h3>
        <p className="cb-card-description">{product.description}</p>
        <div className="cb-card-price">
          <strong>{priceShort(product, market)}</strong>
          <span>{priceCaption(product.subcategory)}</span>
        </div>
        <div className="cb-card-actions">
          <Link href={productHref(product, market)}>
            View details <span aria-hidden>↗</span>
          </Link>
          <Link
            href={buildHref(
              compareWith ?? product.id,
              compareWith ? product.id : "",
              market,
            )}
          >
            Compare
          </Link>
        </div>
      </div>
    </article>
  );
}
