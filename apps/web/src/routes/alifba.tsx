/**
 * Elifba sayfası — /alifba
 * Arap harflerini tanıma ve yazı alıştırması.
 */

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ARABIC_LETTERS } from "~/lib/kids-constants";
import { LetterTrace } from "~/components/kids/LetterTrace";
import { useTranslation } from "~/hooks/useTranslation";

export const Route = createFileRoute("/alifba")({
  component: AlifbaPage,
});

function AlifbaPage() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<(typeof ARABIC_LETTERS)[number] | null>(null);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          to="/hub"
          className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
          aria-label={t.nav.back}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5L7 10L12 15" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold">{t.hub.alifba}</h1>
      </div>

      {selected ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M10 4L6 8l4 4" />
              </svg>
              {t.nav.back}
            </button>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {selected.order}/28
            </span>
          </div>
          <LetterTrace
            key={selected.id}
            letter={selected}
            onComplete={() => {
              const next = ARABIC_LETTERS.find((l) => l.order === selected.order + 1);
              if (next) {
                setSelected(next);
              } else {
                setSelected(null);
              }
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
          {ARABIC_LETTERS.map((letter) => (
            <button
              key={letter.id}
              onClick={() => setSelected(letter)}
              className="flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-colors active:scale-95"
            >
              <span className="font-arabic text-xl leading-none">{letter.arabic}</span>
              <span className="text-[9px] text-[var(--color-text-secondary)] leading-none">{letter.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
