"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JumpEntry } from "@/lib/nav";
import { BrandLogo } from "@/components/BrandLogo";
import { capture } from "@/lib/analytics";

const KIND_LABEL: Record<JumpEntry["kind"], string> = {
  compare: "Comparison",
  product: "Product",
  category: "Category",
};

export function SiteHeader({
  index,
  nav,
  homeHref = "/",
}: {
  index: JumpEntry[];
  nav: { label: string; href: string }[];
  homeHref?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "compare" | "product" | "category"
  >("all");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchDialog = useRef<HTMLDialogElement>(null);

  const openSearch = useCallback(
    (source: "button" | "slash" | "mod_k") => {
      if (!open) capture("search_opened", { source });
      setOpen(true);
      setMenu(false);
    },
    [open],
  );

  const filteredIndex = useMemo(() => {
    if (filter === "all") return index;
    return index.filter((e) => e.kind === filter);
  }, [index, filter]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      if (filter === "all")
        return index.filter((e) => e.kind === "compare").slice(0, 7);
      return filteredIndex.slice(0, 7);
    }
    const words = q.split(/\s+/);
    return filteredIndex
      .filter((e) => words.every((w) => e.terms.includes(w)))
      .slice(0, 8);
  }, [filteredIndex, filter, index, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setCursor(0);
    setFilter("all");
  }, []);

  const go = useCallback(
    (entry: JumpEntry) => {
      capture("search_result_clicked", {
        kind: entry.kind,
        result_kind: entry.kind,
        query_length: query.trim().length,
      });
      close();
      setMenu(false);
      router.push(entry.href);
    },
    [close, query, router],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        openSearch("mod_k");
      } else if (event.key === "/" && !typing) {
        event.preventDefault();
        openSearch("slash");
      }
      if (event.key === "Escape") {
        close();
        setMenu(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, openSearch]);

  useEffect(() => {
    if (!open) {
      searchDialog.current?.close();
      return;
    }
    searchDialog.current?.showModal();
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [query, filter]);

  useEffect(() => {
    const q = query.trim();
    if (!open || !q) return;
    const timer = window.setTimeout(() => {
      capture("search_performed", {
        query_length: q.length,
        result_count: results.length,
        has_results: results.length > 0,
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [open, query, results.length]);

  // Clamp for the render between a query change and the cursor reset effect.
  const activeCursor = Math.min(cursor, Math.max(0, results.length - 1));

  function onSearchKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (event.key === "Enter" && results[activeCursor]) {
      event.preventDefault();
      go(results[activeCursor]);
    }
  }

  return (
    <header className="cb-header">
      <div className="shell cb-header-inner">
        <BrandLogo href={homeHref} />
        <nav className="cb-main-nav" aria-label="Main navigation">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label === "Matchups" ? "Comparisons" : item.label}
            </Link>
          ))}
        </nav>
        <div className="cb-header-actions">
          <button
            type="button"
            onClick={() => openSearch("button")}
            className="cb-icon-btn"
            aria-label="Search products and comparisons"
            aria-expanded={open}
            aria-controls="site-search-dialog"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 5 5" />
            </svg>
          </button>
          <Link href={`${homeHref}compare/build/`} className="btn btn-primary">
            Build a comparison <span aria-hidden>↗</span>
          </Link>
          <button
            type="button"
            className="cb-icon-btn cb-mobile-menu"
            aria-label="Menu"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden
            >
              <path d={menu ? "m5 5 14 14M19 5 5 19" : "M4 7h16M4 17h16"} />
            </svg>
          </button>
        </div>
      </div>

      {menu && (
        <div className="border-t border-line bg-surface cb-mobile-nav-panel">
          <div className="shell grid gap-1.5 py-4">
            <Link
              href="/compare/build"
              onClick={() => setMenu(false)}
              className="flex items-center justify-between rounded-xl bg-accent-soft px-3.5 py-2.5 text-body font-semibold text-accent"
            >
              <span>+ Build a comparison</span>
              <span className="text-meta">→</span>
            </Link>
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenu(false)}
                className="rounded-lg px-3 py-2 text-body font-medium text-ink hover:bg-surface-2"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-line pt-3">
              <p className="eyebrow mb-2 px-3">Suggested comparisons</p>
              {index
                .filter((e) => e.kind === "compare")
                .slice(0, 5)
                .map((entry) => (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    onClick={() => setMenu(false)}
                    className="block rounded-lg px-3 py-2 text-body text-ink-2 hover:bg-surface-2 hover:text-ink"
                  >
                    {entry.label}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      )}

      <dialog
        ref={searchDialog}
        id="site-search-dialog"
        className="cb-dialog cb-search-dialog"
        aria-label="Search products and comparisons"
        onCancel={close}
      >
        <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-3 border-b border-line px-4 py-1">
            <svg
              width="18"
              height="18"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
              className="text-ink-3"
            >
              <circle
                cx="7"
                cy="7"
                r="4.4"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="m10.4 10.4 3 3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder="Search products, comparisons, categories…"
              aria-label="Search products and matchups"
              role="combobox"
              aria-expanded="true"
              aria-controls="site-search-results"
              aria-activedescendant={
                results.length > 0
                  ? `site-search-option-${activeCursor}`
                  : undefined
              }
              className="w-full bg-transparent py-3.5 text-body text-ink outline-none placeholder:text-ink-3"
            />
            <button
              type="button"
              onClick={close}
              className="rounded-md border border-line px-2 py-0.5 text-badge font-medium text-ink-3 hover:bg-surface-2"
            >
              ESC
            </button>
          </div>

          <div className="flex items-center gap-1.5 border-b border-line/60 bg-surface-2/50 px-4 py-2 text-label">
            {(["all", "compare", "product", "category"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className="rounded-lg px-2.5 py-1 text-meta font-medium transition-colors"
                style={{
                  background: filter === tab ? "var(--surface)" : "transparent",
                  color: filter === tab ? "var(--ink)" : "var(--ink-3)",
                  boxShadow: filter === tab ? "var(--shadow-1)" : "none",
                }}
              >
                {tab === "all"
                  ? "All"
                  : tab === "compare"
                    ? "Matchups"
                    : tab === "product"
                      ? "Products"
                      : "Categories"}
              </button>
            ))}
          </div>

          <ul
            id="site-search-results"
            role="listbox"
            aria-label="Search results"
            className="max-h-[55vh] overflow-y-auto p-2 divide-y divide-line/40"
          >
            {results.length === 0 && (
              <li className="px-4 py-10 text-center text-cell text-ink-3">
                <p className="font-semibold text-ink-2">
                  No matching products or matchups found.
                </p>
                <p className="mt-1 text-meta">
                  Try searching for a brand (e.g. Sony, Apple, Samsung) or
                  category.
                </p>
              </li>
            )}
            {results.map((entry, i) => {
              const isSelected = i === activeCursor;
              return (
                <li key={entry.href} className="pt-1 first:pt-0">
                  <button
                    type="button"
                    id={`site-search-option-${i}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(entry)}
                    className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-colors"
                    style={{
                      background: isSelected
                        ? "var(--surface-2)"
                        : "transparent",
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-body font-semibold text-ink">
                        {entry.label}
                      </span>
                      <span className="block truncate text-label text-ink-3">
                        {entry.meta}
                      </span>
                    </div>
                    <span
                      className="rounded-md px-2 py-0.5 text-badge font-bold uppercase tracking-wider"
                      style={{
                        background:
                          entry.kind === "compare"
                            ? "var(--accent-soft)"
                            : entry.kind === "product"
                              ? "color-mix(in oklab, #3b82f6 12%, transparent)"
                              : "var(--surface-3)",
                        color:
                          entry.kind === "compare"
                            ? "var(--accent-2)"
                            : entry.kind === "product"
                              ? "#2563eb"
                              : "var(--ink-2)",
                      }}
                    >
                      {KIND_LABEL[entry.kind]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between border-t border-line bg-surface-2/60 px-4 py-2.5 text-meta text-ink-3">
            <span className="flex items-center gap-3">
              <span>
                <kbd className="font-mono text-badge">↑</kbd>{" "}
                <kbd className="font-mono text-badge">↓</kbd> navigate
              </span>
              <span>
                <kbd className="font-mono text-badge">↵</kbd> select
              </span>
            </span>
            <span className="num text-label">
              {results.length} result{results.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </dialog>
    </header>
  );
}
