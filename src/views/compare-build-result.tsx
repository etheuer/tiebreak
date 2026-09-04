"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { buildVerdict } from "@/lib/verdict";
import { checkDealBreakers, flattenRows, shortName } from "@/lib/decision";
import { casesFor } from "@/data/use-cases";
import type { Product } from "@/lib/pricing";
import { subLabel, subLabelSingular } from "@/lib/nav";
import { marketPath, type MarketId } from "@/lib/markets";
import { DecisionPanel } from "@/components/DecisionPanel";
import { SpecTables } from "@/components/SpecTables";
import { ProductStage } from "@/components/ProductStage";
import { ComparisonActions } from "@/components/ComparisonActions";
import { officialSourceUrl } from "@/lib/pricing";
import {
  publishedSlug,
  type BuilderProduct,
  type PublishedPairs,
} from "@/lib/builder-data";

/**
 * Live verdict for an arbitrary ?a=&b= pair. Same scoring, lenses and
 * deal-breakers as published matchups; published-only extras (cost of
 * ownership, fit checks, FAQ) stay on the breakdown pages.
 */
export function CompareBuildResult({
  products,
  catalog,
  publishedPairs,
  market,
}: {
  products: BuilderProduct[];
  /** Already filtered and resolved for `market` on the server: no other market's data crosses. */
  catalog: Product[];
  publishedPairs: PublishedPairs;
  market: MarketId;
}) {
  const params = useSearchParams();
  const idA = params.get("a") ?? "";
  const idB = params.get("b") ?? "";

  const pair = useMemo(() => {
    if (!idA || !idB) return null;
    const byId = new Map(catalog.map((p) => [p.id, p]));
    return { productA: byId.get(idA) ?? null, productB: byId.get(idB) ?? null };
  }, [idA, idB, catalog]);

  if (!idA || !idB) {
    return (
      <p className="py-10 text-body text-ink-3">
        Choose two products above to see their verdict here. The address bar URL
        is shareable.
      </p>
    );
  }

  if (!pair?.productA || !pair?.productB) {
    const known = new Map(products.map((p) => [p.id, p]));
    return (
      <div className="py-10">
        <h2 className="display text-h2">We couldn&apos;t find that pair</h2>
        <p className="mt-2 max-w-xl text-body text-ink-2">
          {!known.get(idA) ? (
            <>
              “{idA}” isn&apos;t in the {market === "uk" ? "UK" : "US"} catalog.
            </>
          ) : (
            <>
              “{idB}” isn&apos;t in the {market === "uk" ? "UK" : "US"} catalog.
            </>
          )}{" "}
          Pick two products above instead.
        </p>
      </div>
    );
  }

  const { productA, productB } = pair;
  if (productA.subcategory !== productB.subcategory) {
    return (
      <div className="py-10">
        <h2 className="display text-h2">Those two can&apos;t be compared</h2>
        <p className="mt-2 max-w-xl text-body text-ink-2">
          {shortName(productA)} is a {subLabelSingular(productA.subcategory)}{" "}
          and {shortName(productB)} is a{" "}
          {subLabelSingular(productB.subcategory)}. Spec lenses and
          deal-breakers are defined per product type, so a verdict across types
          would be noise. Pick two of the same type above.
        </p>
      </div>
    );
  }
  if (productA.id === productB.id) {
    return (
      <div className="py-10">
        <h2 className="display text-h2">Pick two different products</h2>
        <p className="mt-2 text-body text-ink-2">
          A product ties with itself on every spec.
        </p>
      </div>
    );
  }

  const slug = publishedSlug(
    products,
    publishedPairs,
    productA.id,
    productB.id,
  );
  const verdict = buildVerdict(productA, productB, market);
  const rows = flattenRows(verdict);
  const checks = checkDealBreakers(productA, productB);
  const useCases = casesFor(productA.subcategory);
  return (
    <section aria-label="Custom comparison result" className="cb-section">
      <div className="cb-section-head">
        <div>
          <p className="eyebrow">
            Your comparison · {subLabel(productA.subcategory)}
          </p>
          <h2>
            {productA.name} vs {productB.name}
          </h2>
        </div>
      </div>
      <div className="cb-pair">
        <ProductStage product={productA} market={market} />
        <ProductStage product={productB} side="b" market={market} />
      </div>
      <ComparisonActions
        key={`${idA}-${idB}`}
        name={`${productA.name} vs ${productB.name}`}
      />
      {slug && (
        <p className="mt-4 text-ink-2">
          There’s more to this pair.{" "}
          <Link
            className="link-underline text-accent"
            href={marketPath(market, `/compare/${slug}/`)}
          >
            Open the full comparison
          </Link>{" "}
          for ownership details and common questions.
        </p>
      )}
      <DecisionPanel
        key={`${idA}-${idB}`}
        productA={productA}
        productB={productB}
        rows={rows}
        useCases={useCases}
        checks={checks}
        market={market}
      />
      <SpecTables
        productA={productA}
        productB={productB}
        groups={verdict.groups}
        aWins={verdict.aWins}
        bWins={verdict.bWins}
        market={market}
      />
      <section className="cb-evidence" id="sources">
        <h2>About this comparison</h2>
        <p>
          Compared from published specifications, not independent lab tests.
          List prices may change. Use Share to keep this exact pair.
        </p>
        <div className="cb-source-grid">
          {[productA, productB].map((p) =>
            officialSourceUrl(p) ? (
              <a
                key={p.id}
                href={officialSourceUrl(p)!}
                target="_blank"
                rel="noopener noreferrer"
              >
                {p.name}: official source ↗
              </a>
            ) : (
              <p key={p.id}>{p.name}: official source not listed.</p>
            ),
          )}
        </div>
      </section>
    </section>
  );
}
