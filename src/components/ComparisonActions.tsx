"use client";

import { useEffect, useRef, useState } from "react";
import { ShareVerdict } from "@/components/ShareVerdict";

export function ComparisonActions({ name }: { name: string }) {
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const [savedItems, setSavedItems] = useState<{ name: string; url: string }[]>(
    [],
  );
  function showSaved() {
    try {
      const items = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("clinchbench:saved:")) {
          try {
            const item = JSON.parse(localStorage.getItem(key)!);
            const url = new URL(item.url, location.origin);
            if (url.origin === location.origin && typeof item.name === "string")
              items.push({ name: item.name, url: url.href });
          } catch {}
        }
      }
      setSavedItems(items);
    } catch {
      setStatus("Saved comparisons are unavailable in this browser.");
    }
    dialog.current?.showModal();
  }
  const storageKey = () => {
    const params = new URLSearchParams(location.search);
    return `clinchbench:saved:${location.pathname}${params.has("a") ? `?a=${params.get("a")}&b=${params.get("b") ?? ""}` : ""}`;
  };
  useEffect(() => {
    try {
      setSaved(localStorage.getItem(storageKey()) !== null);
    } catch {
      /* optional storage */
    }
  }, []);
  function toggle() {
    try {
      const key = storageKey();
      if (saved) localStorage.removeItem(key);
      else
        localStorage.setItem(key, JSON.stringify({ name, url: location.href }));
      setSaved(!saved);
      setStatus(
        saved ? "Removed from saved comparisons." : "Saved on this device.",
      );
    } catch {
      setStatus(
        "Saving is unavailable in this browser. Use Share to keep the link.",
      );
    }
  }
  return (
    <div className="cb-comparison-actions">
      <button className="btn btn-ghost" onClick={toggle} aria-pressed={saved}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden
        >
          <path d="M6 3h12v18l-6-4-6 4z" />
        </svg>
        {saved ? "Saved" : "Save comparison"}
      </button>
      <ShareVerdict />
      <button className="btn btn-ghost" onClick={showSaved}>
        View saved
      </button>
      <span role="status">{status}</span>
      <dialog ref={dialog} className="cb-dialog" aria-label="Saved comparisons">
        <div className="cb-dialog-head">
          <h2>Your saved comparisons</h2>
          <button
            className="cb-icon-btn"
            aria-label="Close saved comparisons"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        <p>Kept in this browser, ready when you are.</p>
        <div className="cb-picker-results">
          {savedItems.map((item) => (
            <a key={item.url} href={item.url}>
              {item.name} ↗
            </a>
          ))}
        </div>
        {!savedItems.length && <p>You haven’t saved a comparison yet.</p>}
      </dialog>
    </div>
  );
}
