/**
 * Latin harfli Arapça kök araması — Açık Kuran API ile.
 * Türk kullanıcılar "sbr" yazarak sabır kökünü bulabilir.
 */

import { useState, useTransition } from "react";
import { searchRootByLatin, type AcikKuranRootResult } from "~/lib/acik-kuran-client";

const EXAMPLES = [
  { latin: "sbr", tr: "sabır" },
  { latin: "hmd", tr: "hamd" },
  { latin: "ktb", tr: "kitap/yazmak" },
  { latin: "rhm", tr: "rahmet" },
  { latin: "slm", tr: "selam/barış" },
  { latin: "ilm", tr: "ilim" },
];

export function LatinRootSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AcikKuranRootResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSearch(q: string) {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await searchRootByLatin(q);
        setResults(res);
      } catch {
        setError("Arama yapılamadı.");
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Açıklama */}
      <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface)] rounded-xl px-3 py-2 border border-[var(--color-border)]">
        Latin harfleriyle Arapça kök arayın: <span className="font-mono text-[var(--color-accent)]">sbr</span> → صبر
      </div>

      {/* Arama kutusu */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Kök ara: sbr, hmd, ktb..."
          className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] text-sm font-mono focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Örnek aramalar */}
      {query.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.latin}
              type="button"
              onClick={() => handleSearch(ex.latin)}
              className="px-3 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs hover:border-[var(--color-accent)] transition-colors"
            >
              <span className="font-mono text-[var(--color-accent)]">{ex.latin}</span>
              <span className="text-[var(--color-text-secondary)] ml-1.5">— {ex.tr}</span>
            </button>
          ))}
        </div>
      )}

      {/* Hata */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Sonuçlar */}
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((root) => (
            <div
              key={root.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 transition-colors cursor-pointer"
            >
              <span
                className="text-2xl text-[var(--color-text-primary)]"
                style={{ fontFamily: "var(--font-arabic)", direction: "rtl" }}
              >
                {root.arabic}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{root.mean}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  <span className="font-mono">{root.latin}</span>
                  {root.transcription && (
                    <span className="ml-2 opacity-60">{root.transcription}</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && query.length >= 2 && !isPending && !error && (
        <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">
          "{query}" için sonuç bulunamadı
        </p>
      )}
    </div>
  );
}
