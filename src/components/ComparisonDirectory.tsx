"use client";
import { useState } from "react";
import Link from "next/link";
export type DirectoryGroup = {
  id: string;
  label: string;
  entries: { name: string; href: string }[];
};
export function ComparisonDirectory({ groups }: { groups: DirectoryGroup[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = groups
    .map((g) => ({
      ...g,
      entries: g.entries.filter((e) =>
        q.split(/\s+/).every((word) => e.name.toLowerCase().includes(word)),
      ),
    }))
    .filter((g) => g.entries.length);
  return (
    <div className="cb-directory">
      <label className="block">
        <span className="sr-only">Search all comparisons</span>
        <input
          className="cb-search-input w-full sm:max-w-md"
          placeholder="Search a model or brand…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <p className="text-meta text-ink-3 mt-3" aria-live="polite">
        {filtered.reduce((n, g) => n + g.entries.length, 0)} comparisons
      </p>
      {filtered.map((group, i) => (
        <details
          key={`${group.id}-${Boolean(q)}`}
          id={group.id}
          open={Boolean(q) || i === 0}
        >
          <summary>
            {group.label}
            <span>{group.entries.length} pairs</span>
          </summary>
          <ul>
            {group.entries.map((entry) => (
              <li key={entry.href}>
                <Link href={entry.href}>
                  {entry.name}
                  <span aria-hidden>↗</span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ))}
      {!filtered.length && (
        <div className="cb-empty mt-6">
          <h3>No comparisons found</h3>
          <p>Try a shorter model name or choose two products above.</p>
          <button className="btn btn-ghost mt-4" onClick={() => setQuery("")}>
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
