import Link from "next/link";
import type { ReactNode } from "react";
import type { Product } from "@/lib/pricing";
import type { MarketId } from "@/lib/markets";
import { priceCaption, priceShort, productHref, subLabel } from "@/lib/nav";
import { ProductImage } from "@/components/ProductImage";

export function ProductStage({
  product,
  side = "a",
  market,
  children,
}: {
  product: Product;
  side?: "a" | "b";
  market: MarketId;
  children?: ReactNode;
}) {
  return (
    <article className={`cb-stage cb-tone-${side}`}>
      <div className="cb-stage-top">
        <span className="cb-product-label">
          <i aria-hidden />
          {product.brand}
        </span>
        {children}
      </div>
      <Link
        href={productHref(product, market)}
        className="cb-stage-image"
        aria-label={`View ${product.name}`}
      >
        <ProductImage product={product} size="hero" tone={side} eager />
      </Link>
      <h2>
        <Link href={productHref(product, market)}>{product.name}</Link>
      </h2>
      <p className="cb-stage-type">{subLabel(product.subcategory)}</p>
      <div className="cb-stage-price">
        <strong>{priceShort(product, market)}</strong>
        <span>{priceCaption(product.subcategory)}</span>
      </div>
      <Link className="cb-stage-link" href={productHref(product, market)}>
        Explore this product <span aria-hidden>↗</span>
      </Link>
    </article>
  );
}
