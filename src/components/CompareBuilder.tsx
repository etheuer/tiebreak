"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { marketPath, type MarketId } from "@/lib/markets";
import { buildHref } from "@/lib/nav";
import {
  publishedSlug,
  type BuilderProduct,
  type PublishedPairs,
} from "@/lib/builder-data";
import { capture } from "@/lib/analytics";

/**
 * Compare-any-two picker. Resolves to the published breakdown when the pair
 * ships one, otherwise to the live custom comparison (/compare/build/).
 * Same-subcategory pairs only: lenses and deal-breakers are typed per
 * product type, so cross-type picks would score noise.
 */
export function CompareBuilder({
  products,
  publishedPairs,
  market = "us",
}: {
  products: BuilderProduct[];
  publishedPairs: PublishedPairs;
  market?: MarketId;
}) {
  const router = useRouter();
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const a = query.get("a") ?? "";
    const b = query.get("b") ?? "";
    if (products.some((p) => p.id === a)) setIdA(a);
    if (products.some((p) => p.id === b)) setIdB(b);
  }, [products]);

  const productA = useMemo(
    () => products.find((p) => p.id === idA) ?? null,
    [products, idA],
  );

  const optionsB = useMemo(
    () =>
      productA
        ? products.filter(
            (p) =>
              p.subcategory === productA.subcategory && p.id !== productA.id,
          )
        : [],
    [products, productA],
  );

  const productB = useMemo(
    () => optionsB.find((p) => p.id === idB) ?? null,
    [optionsB, idB],
  );

  function chooseA(id: string) {
    setIdA(id);
    // Keep the second pick only while it is still a valid partner: same type,
    // and not the product just chosen as the first.
    const next = products.find((p) => p.id === id);
    const current = products.find((p) => p.id === idB);
    if (
      !next ||
      !current ||
      current.id === next.id ||
      current.subcategory !== next.subcategory
    ) {
      setIdB("");
    }
  }

  const ready = Boolean(productA && productB && productA.id !== productB.id);
  const slug =
    productA && productB
      ? publishedSlug(products, publishedPairs, productA.id, productB.id)
      : undefined;
  const target =
    productA && productB
      ? slug
        ? marketPath(market, `/compare/${slug}/`)
        : buildHref(productA.id, productB.id, market)
      : null;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (target) {
      capture("compare_started", {
        from: "builder",
        href: target,
        product_a: productA?.id,
        product_b: productB?.id,
        subcategory: productA?.subcategory,
        is_published: Boolean(slug),
      });
      router.push(target);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="cb-builder"
      aria-label="Compare any two products"
    >
      <div className="cb-builder-pair">
        <div className="cb-builder-field cb-tone-a">
          <label>
            First product
            <select
              value={idA}
              onChange={(event) => chooseA(event.target.value)}
            >
              <option value="">Choose a product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <p className="cb-builder-price">
            {productA?.priceText ?? "Start with something on your shortlist."}
          </p>
        </div>
        <div className="cb-builder-field cb-tone-b">
          <label>
            Second product
            <select
              value={idB}
              disabled={!productA}
              onChange={(event) => setIdB(event.target.value)}
            >
              <option value="">
                {productA
                  ? "Choose another product…"
                  : "Choose the first product above…"}
              </option>
              {optionsB.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <p className="cb-builder-price">
            {productB?.priceText ?? "We’ll show alternatives of the same type."}
          </p>
        </div>
      </div>
      <div className="cb-builder-bottom">
        <p aria-live="polite">
          {ready
            ? `${productA?.name} and ${productB?.name}. Ready when you are.`
            : "Pick two. See the differences. Make your call."}
        </p>
        <button type="submit" disabled={!ready} className="btn btn-primary">
          Compare products <span aria-hidden>→</span>
        </button>
      </div>
    </form>
  );
}
