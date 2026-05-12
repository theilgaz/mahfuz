/**
 * Elifba ana sayfası — /alifba
 * Harf ızgarası + harf formları referansı + sıradaki adım.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ARABIC_LETTERS, LETTER_EXAMPLES, getLetterForms, NON_CONNECTORS } from "~/lib/kids-constants";
import type { FormPosition } from "~/lib/kids-constants";
import { useTranslation } from "~/hooks/useTranslation";
import { useAlifbaStore, computeAlifbaStats } from "~/stores/alifba.store";
import { useShallow } from "zustand/react/shallow";
import { AlifbaPage } from "~/components/minimal-ui/AlifbaPage";
import { staticHead } from "~/lib/seo";

export const Route = createFileRoute("/alifba/")({
  head: () => staticHead("alifba"),
  component: () => <AlifbaPage />,
});

// Legacy AlifbaIndexPage kept below for reference

const FORM_COL_KEYS: { key: FormPosition; labelKey: "final" | "medial" | "initial" | "isolated"; formFn: (f: ReturnType<typeof getLetterForms>) => string }[] = [
  { key: "final",    labelKey: "final",    formFn: (f) => f.final    },
  { key: "medial",   labelKey: "medial",   formFn: (f) => f.medial   },
  { key: "initial",  labelKey: "initial",  formFn: (f) => f.initial  },
  { key: "isolated", labelKey: "isolated", formFn: (f) => f.isolated },
];

function LetterFormsSection() {
  const { t } = useTranslation();
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-0.5">{t.alifba.letterForms}</h2>
      <p className="text-xs text-[var(--color-text-secondary)] mb-3">
        {t.alifba.letterFormsDesc}
      </p>

      {/* Kolon başlıkları */}
      <div className="grid grid-cols-[3rem_1fr_1fr_1fr_1fr] px-3 mb-1">
        <div />
        {FORM_COL_KEYS.map(({ key, labelKey }) => (
          <div key={key} className="text-[9px] text-center text-[var(--color-text-secondary)] font-medium uppercase tracking-wide">
            {t.alifba[labelKey]}
          </div>
        ))}
      </div>

      <div className="rounded border border-[var(--color-border)] overflow-hidden">
        {ARABIC_LETTERS.map((letter, i) => {
          const forms = getLetterForms(letter.arabic);
          const isNonConnector = NON_CONNECTORS.has(letter.arabic);
          const examples = LETTER_EXAMPLES[letter.id] ?? [];

          return (
            <Link
              key={letter.id}
              to="/alifba/$letterId"
              params={{ letterId: letter.id }}
              className={`block hover:bg-[var(--color-surface)] active:bg-[var(--color-surface)] transition-colors ${
                i < ARABIC_LETTERS.length - 1 ? "border-b border-[var(--color-border)]" : ""
              }`}
            >
              {/* Harf + formlar */}
              <div className="grid grid-cols-[3rem_1fr_1fr_1fr_1fr] items-center px-3 py-2">
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-[10px] text-[var(--color-text-secondary)] leading-none">{letter.name}</span>
                  <span
                    className="text-lg leading-none text-[var(--color-text-primary)]"
                    style={{ fontFamily: "var(--font-arabic)" }}
                  >
                    {letter.arabic}
                  </span>
                </div>

                {FORM_COL_KEYS.map(({ key, formFn }) => {
                  const isDisabled = isNonConnector && (key === "initial" || key === "medial");
                  const form = formFn(forms);
                  return (
                    <div key={key} className="flex items-center justify-center">
                      <span
                        className={`text-xl leading-none transition-opacity ${
                          isDisabled ? "text-[var(--color-text-secondary)]/30" : "text-[var(--color-text-primary)]"
                        }`}
                        style={{ fontFamily: "var(--font-arabic)" }}
                        dir="rtl"
                        title={isDisabled ? `${letter.name} bağlanmaz` : undefined}
                      >
                        {isDisabled ? letter.arabic : form}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Örnek kelimeler — her sütunun altında hizalı */}
              {examples.length > 0 && (
                <div className="grid grid-cols-[3rem_1fr_1fr_1fr_1fr] px-3 pb-2">
                  <div />
                  {FORM_COL_KEYS.map(({ key }) => {
                    const ex = examples.find((e) => e.position === key);
                    if (!ex) return <div key={key} />;
                    return (
                      <div key={key} className="flex flex-col items-center gap-0.5 text-center">
                        <span
                          className="text-sm text-[var(--color-accent)]"
                          style={{ fontFamily: "var(--font-arabic)" }}
                          dir="rtl"
                        >
                          {ex.arabic}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-secondary)] leading-tight">
                          {ex.meaning}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <p className="text-[10px] text-[var(--color-text-secondary)] mt-2 px-1">
        {t.alifba.nonConnectorNote}
      </p>
    </section>
  );
}

function NextStepsSection() {
  const { t } = useTranslation();
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{t.alifba.nextStep}</h2>
      <p className="text-xs text-[var(--color-text-secondary)] mb-3">{t.alifba.nextStepDesc}</p>

      <div className="space-y-2">
        <Link
          to="/alifba"
          className="flex items-center gap-3 px-4 py-3.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/5 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0 text-[var(--color-accent)]">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{t.alifba.continueWithQaida}</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{t.alifba.continueWithQaidaDesc}</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-[var(--color-border)] shrink-0">
            <path d="M5 3l4 4-4 4" />
          </svg>
        </Link>

        <Link
          to="/games"
          className="flex items-center gap-3 px-4 py-3.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/5 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0 text-[var(--color-accent)]">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect x="2" y="6" width="20" height="12" rx="4" />
              <path d="M7 12h4M9 10v4" />
              <circle cx="16" cy="12" r="1" fill="currentColor" />
              <circle cx="19" cy="12" r="1" fill="currentColor" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{t.alifba.games}</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{t.alifba.gamesDesc}</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-[var(--color-border)] shrink-0">
            <path d="M5 3l4 4-4 4" />
          </svg>
        </Link>

        <Link
          to="/surah/$surahSlug"
          params={{ surahSlug: "al-fatiha" }}
          search={{ ayah: undefined }}
          className="flex items-center gap-3 px-4 py-3.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/5 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0 text-[var(--color-accent)]">
            <span className="text-base leading-none" style={{ fontFamily: "var(--font-arabic)" }}>ا</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{t.alifba.readQuran}</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{t.alifba.readQuranDesc}</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-[var(--color-border)] shrink-0">
            <path d="M5 3l4 4-4 4" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

function AlifbaIndexPage() {
  const { t } = useTranslation();
  const { progress, streak, examHistory, gameHighScores } = useAlifbaStore(
    useShallow((s) => ({
      progress: s.progress,
      streak: s.streak,
      examHistory: s.examHistory,
      gameHighScores: s.gameHighScores,
    })),
  );

  const stats = useMemo(
    () => computeAlifbaStats({ progress, streak, examHistory, gameHighScores, totalDays: 0, lastStudyDate: null }),
    [progress, streak, examHistory, gameHighScores],
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Başlık + istatistikler */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold">{t.alifba.title}</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">{t.alifba.subtitle}</p>
        </div>
        <div className="flex gap-3 text-center">
          <div>
            <p className="text-base font-bold text-[var(--color-accent)]">{stats.mastered}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)]">{t.alifba.mastered}</p>
          </div>
          <div>
            <p className="text-base font-bold text-[var(--color-accent)]">{stats.seen}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)]">{t.alifba.seen}</p>
          </div>
          <div>
            <p className="text-base font-bold text-[var(--color-accent)]">{stats.streak}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)]">{t.alifba.streak}</p>
          </div>
        </div>
      </div>

      {/* Harf ızgarası */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">{t.alifba.learnLetters}</h2>
        <span className="text-xs text-[var(--color-text-secondary)]">{stats.mastered}/{ARABIC_LETTERS.length}</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5" dir="rtl">
        {ARABIC_LETTERS.map((letter) => {
          const prog = progress[letter.id];
          const isSeen = prog?.seen;
          const isMastered = prog?.seen && prog?.tracingDone;
          return (
            <Link
              key={letter.id}
              to="/alifba/$letterId"
              params={{ letterId: letter.id }}
              className={[
                "relative flex flex-col min-w-0 h-[5.75rem] overflow-hidden rounded border",
                "transition-all duration-150 ease-out active:scale-95",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
                isMastered
                  ? "bg-[var(--color-accent)]/8 border-[var(--color-accent)]/50"
                  : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-accent)]/5 hover:-translate-y-px",
              ].join(" ")}
              style={{
                boxShadow: isMastered
                  ? "0 2px 8px color-mix(in srgb, var(--color-accent) 28%, transparent), 0 1px 3px rgba(0,0,0,0.06)"
                  : "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <span className="absolute top-2 left-2 text-[8px] text-[var(--color-text-secondary)]/40 leading-none font-mono select-none">
                {letter.order}
              </span>

              {isMastered && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}

              <div className="flex-1 flex items-center justify-center">
                <span
                  className={`text-4xl leading-none select-none ${isMastered ? "text-[var(--color-accent)]" : ""}`}
                  style={{ fontFamily: "var(--font-arabic)" }}
                >
                  {letter.arabic}
                </span>
              </div>

              <div className={`shrink-0 w-full flex items-center justify-center py-1 border-t-2 ${
                isMastered
                  ? "bg-[var(--color-accent)]/12 border-[var(--color-accent)]/40"
                  : isSeen
                  ? "bg-[var(--color-surface)] border-[var(--color-accent)]/60"
                  : "bg-[var(--color-surface)] border-transparent"
              }`}>
                <span className="text-[9px] font-medium tracking-wide uppercase text-[var(--color-text-secondary)] leading-none select-none">
                  {letter.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <LetterFormsSection />
      <NextStepsSection />
    </div>
  );
}
