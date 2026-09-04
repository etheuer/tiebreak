"use client";
import { Fragment, useEffect, useState } from "react";
import type { Product } from "@/lib/data";
import type { ScoredGroup } from "@/lib/verdict";
import { displaySpec } from "@/lib/format";
import type { MarketId } from "@/lib/markets";
import { casesFor } from "@/data/use-cases";
export function SpecTables({
  productA,
  productB,
  groups,
  market = "us",
}: {
  productA: Product;
  productB: Product;
  groups: ScoredGroup[];
  aWins: number;
  bWins: number;
  market?: MarketId;
}) {
  const [view, setView] = useState<"key" | "all">("key");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [priority, setPriority] = useState("overall");
  const [differences, setDifferences] = useState(false);
  useEffect(() => {
    const hash = location.hash.match(/(?:^#|&)for=([a-z0-9-]+)/i);
    try {
      setPriority(
        new URLSearchParams(location.search).get("priority") ??
          hash?.[1] ??
          localStorage.getItem(`clinchmark:for:${productA.subcategory}`) ??
          "overall",
      );
    } catch {
      setPriority(
        new URLSearchParams(location.search).get("priority") ??
          hash?.[1] ??
          "overall",
      );
    }
    const update = (e: Event) => setPriority((e as CustomEvent<string>).detail);
    window.addEventListener("clinchbench:priority", update);
    return () => window.removeEventListener("clinchbench:priority", update);
  }, [productA.subcategory]);
  const rows = groups.flatMap((group) =>
    group.rows.map((row) => ({ ...row, group: group.label })),
  );
  const keys =
    casesFor(productA.subcategory).find((c) => c.id === priority)?.keys ?? [];
  const important = [...rows]
    .sort(
      (a, b) =>
        Number(keys.includes(b.key)) * 4 +
        Number(b.highlight) * 2 +
        Number(b.differs) -
        Number(keys.includes(a.key)) * 4 -
        Number(a.highlight) * 2 -
        Number(a.differs),
    )
    .slice(0, 5);
  const q = query.trim().toLowerCase();
  const visible = rows.filter(
    (row) =>
      (q
        ? `${row.label} ${row.group} ${row.a} ${row.b}`
            .toLowerCase()
            .includes(q)
        : view === "all" || important.some((r) => r.key === row.key)) &&
      (!differences || row.differs),
  );
  return (
    <section
      className="cb-section"
      id="spec-tables"
      aria-labelledby="differences"
    >
      <div className="cb-section-head">
        <div>
          <p className="eyebrow">Side by side</p>
          <h2 id="differences">The differences, in detail.</h2>
          <p>Start with the key specs, then explore as much as you need.</p>
        </div>
      </div>
      <div className="cb-spec-toolbar">
        <div className="cb-segment" aria-label="Specification view">
          <button
            aria-pressed={view === "key"}
            onClick={() => {
              setView("key");
              setQuery("");
            }}
          >
            Key differences
          </button>
          <button aria-pressed={view === "all"} onClick={() => setView("all")}>
            All specs ({rows.length})
          </button>
        </div>
        <label className="text-meta flex items-center gap-2">
          <input
            type="checkbox"
            className="db-check"
            checked={differences}
            onChange={(e) => setDifferences(e.target.checked)}
          />
          Hide identical
        </label>
        <label>
          <span className="sr-only">Search specifications</span>
          <input
            className="cb-search-input"
            placeholder="Find a specification…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      {visible.length ? (
        <table className="cb-compare-table">
          <caption className="sr-only">
            {productA.name} versus {productB.name}, {visible.length}{" "}
            specifications
          </caption>
          <thead>
            <tr>
              <th scope="col">What you’re comparing</th>
              <th scope="col">{productA.name}</th>
              <th scope="col">{productB.name}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <Fragment key={row.key}>
                <tr>
                  <th scope="row">
                    {row.label}
                    <button
                      aria-label={`Explain ${row.label}`}
                      aria-expanded={expanded.includes(row.key)}
                      aria-controls={`explain-${row.key}`}
                      onClick={() =>
                        setExpanded((prev) =>
                          prev.includes(row.key)
                            ? prev.filter((k) => k !== row.key)
                            : [...prev, row.key],
                        )
                      }
                    >
                      i
                    </button>
                    <small>{row.group}</small>
                  </th>
                  <td>{displaySpec(row.a, row.key, market)}</td>
                  <td>{displaySpec(row.b, row.key, market)}</td>
                </tr>
                {expanded.includes(row.key) && (
                  <tr className="cb-explanation" id={`explain-${row.key}`}>
                    <td colSpan={3}>
                      <strong>{row.label}: </strong>
                      {row.reason ??
                        (row.differs
                          ? "These values differ, but this specification does not have a single better direction. Consider which fits your needs."
                          : "Both products list the same value for this specification.")}
                      <p className="mt-2">
                        {row.origin === "sheet"
                          ? "From published product specifications."
                          : row.origin === "editorial"
                            ? "This is an editorial assessment, rather than a manufacturer specification."
                            : "From other published information; check the source before deciding."}{" "}
                        A comparison on one specification does not establish
                        overall quality.
                      </p>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="cb-empty">
          <h3>No matching specifications</h3>
          <p>Try a shorter search or include identical values.</p>
          <button
            className="btn btn-ghost mt-4"
            onClick={() => {
              setQuery("");
              setDifferences(false);
            }}
          >
            Reset filters
          </button>
        </div>
      )}
      <p className="cb-table-footnote" aria-live="polite">
        Showing {visible.length} of {rows.length} specifications. Missing values
        stay unlisted.{" "}
        <a className="link-underline" href="#sources">
          About the sources
        </a>
      </p>
    </section>
  );
}
