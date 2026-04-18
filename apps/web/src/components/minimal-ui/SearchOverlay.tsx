/**
 * Search overlay -- Cmd+K / "/" triggered modal.
 * Minimal UI editorial design.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { searchQuran, type SearchResult } from "~/lib/search-service";
import { useSettingsStore } from "~/stores/settings.store";
import { useTranslation } from "~/hooks/useTranslation";
import { surahSlug } from "~/lib/surah-slugs";
import { MuIcons } from "./icons";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const SUGGESTIONS = ["Rahman", "Yasin", "Mulk", "Ihlas", "Fatiha", "Kehf"];

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const translationSlugs = useSettingsStore((s) => s.translationSlugs);
  const translationSlug = translationSlugs[0];
  const readingMode = useSettingsStore((s) => s.readingMode);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    if (!open) {
      setQ("");
      setDebouncedQ("");
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleInput = useCallback((value: string) => {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQ(value), 400);
  }, []);

  const { data: results } = useQuery({
    queryKey: ["search", debouncedQ, translationSlug],
    queryFn: () => searchQuran({ data: { query: debouncedQ, translationSlug } }),
    enabled: open && debouncedQ.length >= 2,
    staleTime: 60_000,
  });

  const openResult = useCallback(
    (r: SearchResult) => {
      if (readingMode !== "mushaf") {
        navigate({
          to: "/surah/$surahSlug",
          params: { surahSlug: surahSlug(r.surahId) },
          search: { ayah: r.ayahNumber },
        });
      } else {
        navigate({
          to: "/page/$pageNumber",
          params: { pageNumber: String(r.pageNumber) },
          search: { ayah: `${r.surahId}:${r.ayahNumber}` },
        });
      }
      onClose();
    },
    [readingMode, navigate, onClose],
  );

  if (!open) return null;

  return (
    <div className="mu-sover" onClick={onClose}>
      <div className="mu-sover-box" onClick={(e) => e.stopPropagation()}>
        <div className="mu-sover-input">
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mu-muted)" }}>
            {MuIcons.search}
          </span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => handleInput(e.target.value)}
            placeholder={t.search?.placeholder ?? "Sure, ayet veya konu ara..."}
          />
          <button className="mu-sover-close" onClick={onClose}>
            Esc
          </button>
        </div>

        {q.trim() === "" ? (
          <div style={{ padding: 16 }}>
            <p className="mu-muted" style={{ fontSize: 12, marginBottom: 12 }}>
              Oneriler
            </p>
            <div className="mu-sover-sugg">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => handleInput(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : results && results.length === 0 && debouncedQ.length >= 2 ? (
          <p className="mu-muted" style={{ padding: 24, textAlign: "center", fontSize: 14 }}>
            Sonuc bulunamadi.
          </p>
        ) : results && results.length > 0 ? (
          <ul className="mu-sover-res">
            {(results as SearchResult[]).slice(0, 8).map((r) => (
              <li key={`${r.surahId}:${r.ayahNumber}`}>
                <button onClick={() => openResult(r)}>
                  <span className="mu-sover-n">
                    {String(r.surahId).padStart(3, "0")}
                  </span>
                  <span className="mu-sover-name">
                    {r.surahNameSimple}{" "}
                    <span className="mu-muted">: {r.ayahNumber}</span>
                  </span>
                  <span className="mu-sover-ar" dir="rtl">
                    {r.textUthmani?.slice(0, 60)}
                  </span>
                  <span className="mu-sover-chev">{MuIcons.chev}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
