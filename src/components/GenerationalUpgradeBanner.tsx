import type { Product } from "@/lib/data";
import { detectGenerationalPair } from "@/data/generations";
import { shortName } from "@/lib/decision";

export function GenerationalUpgradeBanner({
  productA,
  productB,
}: {
  productA: Product;
  productB: Product;
}) {
  const analysis = detectGenerationalPair(productA, productB);

  if (!analysis.isGenerational) return null;

  const older = analysis.olderProduct
    ? shortName(analysis.olderProduct)
    : productA.name;
  const newer = analysis.newerProduct
    ? shortName(analysis.newerProduct)
    : productB.name;

  const badgeStyles = {
    "major-leap": "bg-accent/10 text-accent-2 border-accent/25",
    "incremental-polish": "bg-surface-2 text-ink-2 border-line",
    sidegrade: "bg-rival/10 text-rival-2 border-rival/25",
  }[analysis.verdictType ?? "incremental-polish"];

  return (
    <section
      className="card mt-5 overflow-hidden p-5 sm:p-7"
      aria-labelledby="upgrade-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 rounded-full bg-accent" aria-hidden />
          <h2 id="upgrade-heading" className="eyebrow text-ink">
            Is the newer model worth it?
          </h2>
        </div>
        {analysis.verdictLabel && (
          <span
            className={`rounded-full border px-2.5 py-0.5 text-label font-semibold uppercase tracking-[0.04em] ${badgeStyles}`}
          >
            {analysis.verdictLabel}
          </span>
        )}
      </div>

      <div className="mt-3">
        <p className="text-lead font-semibold tracking-[-0.01em] text-ink">
          {analysis.headline}
        </p>
        {analysis.recommendation && (
          <p className="mt-1.5 text-cell leading-relaxed text-ink-2">
            <span className="font-semibold text-ink">Our recommendation: </span>
            {analysis.recommendation}
          </p>
        )}
      </div>

      {((analysis.whatChanged && analysis.whatChanged.length > 0) ||
        (analysis.whatStayedSame && analysis.whatStayedSame.length > 0)) && (
        <div className="mt-4 grid gap-4 border-t border-line pt-3 sm:grid-cols-2">
          {analysis.whatChanged && analysis.whatChanged.length > 0 && (
            <div>
              <p className="text-label font-semibold  text-ink-3">
                What Actually Changed ({older} → {newer})
              </p>
              <ul className="mt-2 grid gap-1.5">
                {analysis.whatChanged.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-meta leading-snug text-ink-2"
                  >
                    <span
                      className="shrink-0 text-accent font-bold"
                      aria-hidden
                    >
                      +
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.whatStayedSame && analysis.whatStayedSame.length > 0 && (
            <div>
              <p className="text-label font-semibold  text-ink-3">
                What Remained Identical
              </p>
              <ul className="mt-2 grid gap-1.5">
                {analysis.whatStayedSame.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-meta leading-snug text-ink-2"
                  >
                    <span
                      className="shrink-0 text-ink-3 font-semibold"
                      aria-hidden
                    >
                      =
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
