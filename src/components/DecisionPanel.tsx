"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/data";
import type { UseCase } from "@/data/use-cases";
import {
  buildAnswer,
  lensRows,
  shortName,
  type DealBreakerCheck,
  type LensRow,
} from "@/lib/decision";

import type { MarketId } from "@/lib/markets";
import {
  compareEcosystemImpact,
  ECOSYSTEM_OPTIONS,
  type EcosystemId,
} from "@/data/ecosystems";
import { capture } from "@/lib/analytics";

const OVERALL = "overall";
const lensKey = (sub: string) => `clinchmark:for:${sub}`;
const mattersKey = (sub: string) => `clinchmark:deal-breakers:${sub}`;
const ecosystemKey = "clinchmark:ecosystem";

function hashLens(): string | null {
  const match = window.location.hash.match(/(?:^#|&)for=([a-z0-9-]+)/i);
  return (
    new URLSearchParams(location.search).get("priority") ??
    (match ? match[1] : null)
  );
}

/** Preferences remain shareable in the query string while section anchors can change.
 * Legacy #for= links and stored preferences remain supported. */
export function DecisionPanel({
  productA,
  productB,
  rows,
  useCases,
  checks,
  market = "us",
  children,
}: {
  productA: Product;
  productB: Product;
  rows: LensRow[];
  useCases: UseCase[];
  checks: DealBreakerCheck[];
  market?: MarketId;
  children?: ReactNode;
}) {
  const sub = productA.subcategory;
  const [lensId, setLensId] = useState<string>(OVERALL);
  const [matters, setMatters] = useState<string[]>([]);
  const [ecosystem, setEcosystem] = useState<EcosystemId>("neutral");

  useEffect(() => {
    const valid = new Set([OVERALL, ...useCases.map((useCase) => useCase.id)]);
    const fromHash = hashLens();
    if (fromHash && valid.has(fromHash)) {
      setLensId(fromHash);
    } else {
      try {
        const stored = window.localStorage.getItem(lensKey(sub));
        setLensId(stored && valid.has(stored) ? stored : OVERALL);
      } catch {
        setLensId(OVERALL);
      }
    }
    try {
      const storedEco =
        new URLSearchParams(location.search).get("devices") ??
        window.localStorage.getItem(ecosystemKey);
      if (
        storedEco === "apple" ||
        storedEco === "android-windows" ||
        storedEco === "neutral"
      ) {
        setEcosystem(storedEco);
      }
    } catch {
      // ignore
    }
    try {
      const params = new URLSearchParams(location.search);
      const raw = window.localStorage.getItem(mattersKey(sub));
      const parsed: unknown = params.has("requirements")
        ? params.get("requirements")!.split(",").filter(Boolean)
        : raw
          ? JSON.parse(raw)
          : [];
      if (Array.isArray(parsed))
        setMatters(parsed.filter((id): id is string => typeof id === "string"));
    } catch {
      // ignore
    }

    function onHash() {
      const next = hashLens();
      if (next && valid.has(next)) setLensId(next);
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [sub, useCases]);
  function updatePreference(key: string, value: string) {
    const url = new URL(location.href);
    url.searchParams.set(key, value);
    if (url.hash.startsWith("#for=")) url.hash = "";
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  }
  function chooseLens(id: string) {
    setLensId(id);
    capture("use_case_selected", { use_case: id });
    updatePreference("priority", id);
    window.dispatchEvent(
      new CustomEvent("clinchbench:priority", { detail: id }),
    );
    try {
      localStorage.setItem(lensKey(sub), id);
    } catch {}
  }
  function chooseEcosystem(id: EcosystemId) {
    setEcosystem(id);
    updatePreference("devices", id);
    try {
      localStorage.setItem(ecosystemKey, id);
    } catch {}
  }
  function toggleMatters(id: string) {
    const next = matters.includes(id)
      ? matters.filter((k) => k !== id)
      : [...matters, id];
    setMatters(next);
    updatePreference("requirements", next.join(","));
    try {
      localStorage.setItem(mattersKey(sub), JSON.stringify(next));
    } catch {}
  }
  const useCase = useMemo(
    () => useCases.find((c) => c.id === lensId) ?? null,
    [useCases, lensId],
  );
  const scoreRows = useMemo(
    () => (useCase ? lensRows(rows, useCase) : rows),
    [rows, useCase],
  );
  const mattersSet = useMemo(() => new Set(matters), [matters]);
  const answer = useMemo(
    () =>
      buildAnswer({
        productA,
        productB,
        useCase,
        rows: scoreRows,
        checks,
        matters: mattersSet,
        market,
      }),
    [productA, productB, useCase, scoreRows, checks, mattersSet, market],
  );
  const hasEcosystem = ["headphones", "smartphones", "laptops"].includes(sub);
  const ecosystemComparison = useMemo(
    () => compareEcosystemImpact(productA, productB, ecosystem),
    [productA, productB, ecosystem],
  );
  const names = { a: shortName(productA), b: shortName(productB) };
  const pick =
    answer.pick === "a" ? productA : answer.pick === "b" ? productB : null;
  const tradeoff =
    answer.caveat ||
    (pick?.cons[0]
      ? `${pick.name}: ${pick.cons[0]}`
      : "The best fit depends on the features you value. Open the full specifications to see the details that aren’t ranked.");
  return (
    <>
      <section className="cb-priorities" aria-labelledby="decide">
        <h2 id="decide">What matters most to you?</h2>
        <div className="cb-priority-buttons" aria-label="Your priority">
          <button
            className="chip"
            aria-pressed={lensId === OVERALL}
            onClick={() => chooseLens(OVERALL)}
          >
            The whole picture
          </button>
          {useCases.map((entry) => (
            <button
              className="chip"
              key={entry.id}
              aria-pressed={lensId === entry.id}
              onClick={() => chooseLens(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <p className="cb-priority-note">
          {useCase?.job ??
            "Start with all rankable specifications, or focus on a particular use."}
        </p>
      </section>
      <section className="cb-verdict" aria-label="Your comparison verdict">
        <div aria-live="polite">
          <p className="eyebrow">
            {useCase
              ? `For ${useCase.label.toLowerCase()}`
              : "Your starting point"}
          </p>
          <h2>{answer.headline}</h2>
          <ul>
            {answer.reasons.slice(0, 2).map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <details>
            <summary>How we reached this</summary>
            <p>
              We compare the published specifications relevant to your priority.
              Each rankable specification counts once; your selected
              requirements can rule a product out. This is a guide to the
              numbers, not a laboratory performance score.
            </p>
            {answer.reasons.slice(2).map((reason) => (
              <p className="mt-3" key={reason}>
                {reason}
              </p>
            ))}
          </details>
        </div>
        <div className="cb-tradeoff">
          <p className="eyebrow">The trade-off to know</p>
          <p>{tradeoff}</p>
          <a
            className="link-underline text-meta inline-block mt-5"
            href="#spec-tables"
          >
            Look at the differences ↓
          </a>
        </div>
      </section>
      <details className="cb-refine">
        <summary>Refine your requirements</summary>
        <div className="cb-refine-content">
          {hasEcosystem && (
            <div>
              <h3 className="mb-4">Your other devices</h3>
              <div className="cb-priority-buttons">
                {ECOSYSTEM_OPTIONS.map((opt) => (
                  <button
                    className="chip"
                    key={opt.id}
                    aria-pressed={ecosystem === opt.id}
                    onClick={() => chooseEcosystem(opt.id)}
                  >
                    {opt.id === "neutral" ? "No preference" : opt.shortLabel}
                  </button>
                ))}
              </div>
              {ecosystemComparison.recommendation && (
                <p className="mt-4 text-ink-2">
                  {ecosystemComparison.recommendation}
                </p>
              )}
              {(["a", "b"] as const).map((side) =>
                ecosystemComparison[side].crippledFeatures?.map((feature) => (
                  <p className="mt-2 text-meta text-ink-2" key={feature}>
                    {names[side]}: {feature}
                  </p>
                )),
              )}
            </div>
          )}
          <div>
            <h3>What would rule one out?</h3>
            <p className="text-ink-2 text-meta mt-2 mb-4">
              Select the requirements you can’t compromise on.
            </p>
            {checks.length ? (
              <div className="cb-checklist">
                {checks.map((check) => (
                  <label key={check.id} className="cb-check">
                    <input
                      className="db-check"
                      type="checkbox"
                      checked={mattersSet.has(check.id)}
                      onChange={() => toggleMatters(check.id)}
                    />
                    <span>
                      <strong>{check.label}</strong>
                      <p>{check.why}</p>
                      <span className="cb-check-values">
                        {(["a", "b"] as const).map((side) => (
                          <span key={side}>
                            {names[side]}:{" "}
                            {check[side] === "trips"
                              ? "Does not meet this requirement"
                              : "No listed conflict"}{" "}
                            · {side === "a" ? check.aValue : check.bValue}
                          </span>
                        ))}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-ink-2">
                No category requirements are flagged for this pair.
              </p>
            )}
          </div>
        </div>
      </details>
      {children}
    </>
  );
}
