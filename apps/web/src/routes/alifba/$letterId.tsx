/**
 * Harf detay sayfası — /alifba/:letterId
 * 4 form gösterimi, ses butonu, Kuran örnekleri, çizim alıştırması, ileri/geri navigasyon.
 */

import { lazy, Suspense, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ARABIC_LETTERS, LETTER_EXAMPLES } from "~/lib/kids-constants";
import { useTranslation } from "~/hooks/useTranslation";
import { useAlifbaStore } from "~/stores/alifba.store";
import { LetterFormsPanel } from "~/components/alifba/LetterFormsPanel";
import { LetterAudioButton } from "~/components/alifba/LetterAudioButton";
import { alifbaLetterHead } from "~/lib/seo";

const LetterTrace = lazy(() =>
  import("~/components/kids/LetterTrace").then((m) => ({ default: m.LetterTrace }))
);

export const Route = createFileRoute("/alifba/$letterId")({
  head: ({ params }) => alifbaLetterHead(params.letterId),
  component: LetterDetailPage,
});

function LetterDetailPage() {
  const { letterId } = Route.useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const markSeen = useAlifbaStore((s) => s.markSeen);
  const markTracingDone = useAlifbaStore((s) => s.markTracingDone);
  const touchStreak = useAlifbaStore((s) => s.touchStreak);
  const progress = useAlifbaStore((s) => s.progress);

  const letter = ARABIC_LETTERS.find((l) => l.id === letterId);
  const examples = LETTER_EXAMPLES[letterId] ?? [];
  const prevLetter = letter ? ARABIC_LETTERS.find((l) => l.order === letter.order - 1) : null;
  const nextLetter = letter ? ARABIC_LETTERS.find((l) => l.order === letter.order + 1) : null;

  useEffect(() => {
    if (letter) {
      markSeen(letter.id);
      touchStreak();
    }
  }, [letter?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!letter) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24 text-center text-[var(--color-text-secondary)]">
        {t.alifba.letterNotFound}{" "}
        <Link to="/alifba/" className="text-[var(--color-accent)]">
          {t.nav.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Üst bar */}
      <div className="flex items-center justify-between mb-4">
        <Link
          to="/alifba/"
          className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 4L6 8l4 4" />
          </svg>
          {t.nav.back}
        </Link>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {letter.order} {t.alifba.of} 28
        </span>
      </div>

      {/* Harf hero */}
      <div className="relative mb-5 rounded overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)]">
        {/* Subtle radial glow behind the letter */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 38% 55%, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 72%)",
          }}
        />

        {/* Order badge */}
        <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
          {letter.order} / 28
        </span>

        <div className="flex items-center gap-5 px-6 py-7">
          {/* Giant letter */}
          <span
            className="text-[7rem] leading-none select-none shrink-0"
            dir="rtl"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            {letter.arabic}
          </span>

          {/* Meta */}
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-2xl font-bold tracking-tight leading-none">{letter.name}</span>
            <span
              className="text-lg text-[var(--color-text-secondary)] leading-none"
              style={{ fontFamily: "var(--font-arabic)" }}
            >
              {letter.nameAr}
            </span>
            <LetterAudioButton letterId={letter.id} size="md" className="mt-1" />
          </div>
        </div>
      </div>

      {/* 4 Form */}
      <section className="mb-5">
        <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">
          {t.alifba.forms}
        </h2>
        <LetterFormsPanel arabic={letter.arabic} letterId={letter.id} />
      </section>

      {/* Kuran örnekleri */}
      {examples.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">
            {t.alifba.examples}
          </h2>
          <div className="flex flex-col gap-2">
            {examples.map((ex, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)]"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-[var(--color-text-secondary)]">{ex.transliteration}</span>
                  <span className="text-xs text-[var(--color-text-secondary)]">{ex.meaning}</span>
                  {ex.verseRef && (
                    <span className="text-[10px] text-[var(--color-accent)]/70">{ex.verseRef}</span>
                  )}
                </div>
                <span
                  className="text-2xl"
                  dir="rtl"
                  style={{ fontFamily: "var(--font-arabic)" }}
                >
                  {ex.arabic}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Çizim alıştırması */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">
          {t.alifba.tracing}
        </h2>
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <Suspense
            fallback={
              <div className="h-48 flex items-center justify-center text-sm text-[var(--color-text-secondary)]">
                ...
              </div>
            }
          >
            <LetterTrace
              key={letter.id}
              letter={letter}
              onComplete={() => {
                markTracingDone(letter.id);
                if (nextLetter) {
                  navigate({ to: "/alifba/$letterId", params: { letterId: nextLetter.id } });
                }
              }}
            />
          </Suspense>
        </div>

      </section>

      {/* Öğrendim butonu */}
      {!progress[letter.id]?.tracingDone && (
        <button
          type="button"
          onClick={() => {
            markTracingDone(letter.id);
            if (nextLetter) {
              navigate({ to: "/alifba/$letterId", params: { letterId: nextLetter.id } });
            } else {
              navigate({ to: "/alifba/" });
            }
          }}
          className="mb-3 w-full py-3 rounded bg-[var(--mu-accent-soft)] text-[var(--mu-accent-ink)] font-medium text-sm hover:opacity-90 transition-colors"
        >
          {t.alifba.markSeen}
        </button>
      )}

      {/* Önceki / Sonraki navigasyon */}
      <div className="flex items-center gap-2">
        {prevLetter ? (
          <Link
            to="/alifba/$letterId"
            params={{ letterId: prevLetter.id }}
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M10 4L6 8l4 4" />
            </svg>
            <span className="text-sm">{prevLetter.name}</span>
            <span className="ml-auto text-xl" style={{ fontFamily: "var(--font-arabic)" }}>{prevLetter.arabic}</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {nextLetter ? (
          <Link
            to="/alifba/$letterId"
            params={{ letterId: nextLetter.id }}
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/15 transition-colors"
          >
            <span className="text-xl" style={{ fontFamily: "var(--font-arabic)" }}>{nextLetter.arabic}</span>
            <span className="text-sm flex-1 text-right">{nextLetter.name}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </Link>
        ) : (
          <Link
            to="/alifba/"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded bg-[var(--mu-accent-soft)] text-[var(--mu-accent-ink)] transition-colors hover:opacity-90"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 8H3" />
              <path d="M8 3l-5 5 5 5" />
            </svg>
            <span className="text-sm font-medium">{t.alifba.backToAlifba}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
