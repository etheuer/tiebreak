"use client";

import { useRef, useState } from "react";
import Link from "next/link";

export function ProductPicker({
  name,
  options,
}: {
  name: string;
  options: { id: string; name: string; priceText: string; href: string }[];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const filtered = options.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  if (!options.length) return null;
  return (
    <>
      <button
        className="btn btn-ghost"
        onClick={() => dialog.current?.showModal()}
        aria-label={`Replace ${name}`}
      >
        Change <span aria-hidden>↗</span>
      </button>
      <dialog
        aria-label={`Replace ${name}`}
        className="cb-dialog"
        ref={dialog}
        onClose={() => setQuery("")}
      >
        <div className="cb-dialog-head">
          <span>Edit your comparison</span>
          <button
            className="cb-icon-btn"
            onClick={() => dialog.current?.close()}
            aria-label="Close product picker"
          >
            ×
          </button>
        </div>
        <h2>Find the other contender.</h2>
        <p>Replace {name}. Your other product stays selected.</p>
        <label className="cb-search-field">
          <span className="sr-only">Search replacement products</span>
          <input
            className="cb-search-input"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            autoFocus
          />
        </label>
        <div className="cb-picker-results">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              onClick={() => dialog.current?.close()}
            >
              <span>{p.name}</span>
              <small>{p.priceText}</small>
            </Link>
          ))}
          {!filtered.length && (
            <div className="cb-empty">
              <strong>No products found.</strong>
              <p>Try a brand or a shorter model name.</p>
              <button className="btn btn-ghost" onClick={() => setQuery("")}>
                Clear search
              </button>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
