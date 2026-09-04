import Link from "next/link";
import { categoryHref, homeHref } from "@/lib/nav";
import type { MarketId } from "@/lib/markets";

export function NotFoundBody({ market }: { market: MarketId }) {
  return (
    <div className="shell flex min-h-[52vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display mt-3 text-h1">This page took a different turn.</h1>
      <p className="mt-3 max-w-md text-body leading-relaxed text-ink-2">
        We couldn’t find this page. Start a fresh comparison or browse the
        catalog to find your way.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Link href={homeHref(market)} className="btn btn-primary">
          Back to Clinchmark
        </Link>
        <Link
          href={categoryHref("electronics", market)}
          className="btn btn-ghost"
        >
          Browse electronics
        </Link>
      </div>
    </div>
  );
}
