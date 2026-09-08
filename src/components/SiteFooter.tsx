import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import type { Category, Comparison, Product } from "@/lib/data";
import {
  categoryHref,
  compareHref,
  hubHref,
  LEGAL_LINKS,
  SUBCATEGORY_LABEL,
} from "@/lib/nav";
import { MARKETS, type MarketId } from "@/lib/markets";
import { SITE_NAME } from "@/lib/site";

export function SiteFooter({
  categories,
  comparisons,
  products = [],
  market = "us",
}: {
  categories: Category[];
  comparisons: Comparison[];
  products?: Product[];
  market?: MarketId;
}) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const subcategories = Object.keys(SUBCATEGORY_LABEL);
  const popular: Comparison[] = [];
  for (const sub of subcategories) {
    const match = comparisons.find(
      (c) => byId.get(c.productA)?.subcategory === sub,
    );
    if (match) {
      popular.push(match);
    }
  }

  return (
    <footer className="cb-footer">
      <div className="shell cb-footer-grid">
        <div>
          <BrandLogo href={market === "uk" ? "/uk/" : "/"} />
          <p>
            A little clarity for your next big decision. Compare published
            specs, understand the trade-offs, and find your better fit.
          </p>
        </div>
        <nav aria-label="Footer categories">
          <h2>Explore</h2>
          <ul>
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={categoryHref(category.id, market)}>
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href={hubHref(market)}>All comparisons</Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Featured comparisons">
          <h2>A few pairs to start with</h2>
          <ul>
            {popular.slice(0, 4).map((comparison) => (
              <li key={comparison.productA + comparison.productB}>
                <Link href={compareHref(comparison, market)}>
                  {comparison.productName}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="shell cb-footer-bottom">
        <p>
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
        <nav aria-label="Legal">
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <p>
          Prices in {MARKETS[market].currency}. Confirm current terms with the
          provider.
        </p>
      </div>
    </footer>
  );
}
