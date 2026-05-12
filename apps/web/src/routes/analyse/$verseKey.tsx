/**
 * Ayet Tahlili — derin anlam, morfoloji, temalar, benzer ayetler.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getVerseAnalysis, getSimilarVerses } from "~/lib/analyse-service";
import { getThemesForSurah, detectVerseThemes } from "~/lib/themes-data";
import { getVerseContext } from "~/lib/verse-context-data";
import { MealComparisonSheet } from "~/components/MealComparisonSheet";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-names-i18n";
import { splitWords } from "~/lib/split-words";
import { analyseHead } from "~/lib/seo";

// ── Route ────────────────────────────────────────────────

export const Route = createFileRoute("/analyse/$verseKey")({
  head: ({ params }) => analyseHead(params.verseKey),
  component: AnalysePage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as Tab | undefined) ?? "meal",
  }),
});

const TABS = ["meal", "morfoloji", "temalar", "benzer", "bagit"] as const;
type Tab = (typeof TABS)[number];


// ── Benzer Ayetler Tab ───────────────────────────────────

function SimilarVersesTab({ verseKey }: { verseKey: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["similar-verses", verseKey],
    queryFn: () => getSimilarVerses({ data: verseKey }),
    staleTime: Infinity,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="px-4 py-8 rounded border border-dashed border-[var(--color-border)] text-center">
        <div className="flex items-center justify-center mb-3">
          <svg className="w-8 h-8 text-[var(--color-border)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
          {t.analyse.semanticSimilarity}
        </p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          {t.analyse.similarityNotBuilt}
          <br />
          <code className="mt-1 inline-block text-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 rounded">
            pnpm tsx scripts/build-similarity.ts
          </code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--color-text-secondary)] mb-3">
        {t.analyse.mostSimilarVerses.replace("{count}", String(data.length))}
      </p>
      {data.map((v) => (
        <Link
          key={v.verseKey}
          to="/analyse/$verseKey"
          params={{ verseKey: v.verseKey }}
          className="block px-4 py-3 rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 transition-all"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-medium text-[var(--color-accent)]">
              {v.surahName} · {v.ayahNumber}
            </span>
            <span className="text-[10px] text-[var(--color-text-secondary)] shrink-0">
              {t.analyse.percentSimilar.replace("{score}", String(Math.round(v.score * 100)))}
            </span>
          </div>
          <p
            className="text-base text-right leading-loose text-[var(--color-text-primary)] mb-1.5"
            dir="rtl"
            lang="ar"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            {v.textUthmani}
          </p>
          {v.translation && (
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
              {v.translation}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

// ── Bağlam Tab ───────────────────────────────────────────

function BaglamTab({ verseKey }: { verseKey: string }) {
  const { t } = useTranslation();
  const ctx = getVerseContext(verseKey);
  const [open, setOpen] = useState<number | null>(null);

  if (!ctx) {
    return (
      <div className="px-4 py-8 rounded border border-dashed border-[var(--color-border)] text-center">
        <div className="flex items-center justify-center mb-3">
          <svg className="w-8 h-8 text-[var(--color-border)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">{t.analyse.contextAndDefense}</p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          {t.analyse.noContextNote}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Konu */}
      <div className="px-4 py-3 rounded bg-[var(--color-accent)]/8 border border-[var(--color-accent)]/20">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-accent)] mb-0.5">{t.analyse.topic}</p>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{ctx.topic}</p>
      </div>

      {/* Nüzul Sebebi */}
      {ctx.revelationContext && (
        <div className="px-4 py-4 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-secondary)] mb-2">
            {t.analyse.revelationReason}
          </p>
          <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{ctx.revelationContext}</p>
        </div>
      )}

      {/* Tarihsel Bağlam */}
      <div className="px-4 py-4 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-secondary)] mb-2">
          {t.analyse.historicalContext}
        </p>
        <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{ctx.historicalNote}</p>
      </div>

      {/* Yanlış Anlamalar */}
      <div>
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-secondary)] mb-2 px-1">
          {t.analyse.commonObjections}
        </p>
        <div className="space-y-2">
          {ctx.misconceptions.map((m, i) => (
            <div
              key={i}
              className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
            >
              <button
                className="w-full flex items-start gap-3 px-4 py-3 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold">
                  ?
                </span>
                <p className="flex-1 text-sm text-[var(--color-text-primary)] font-medium leading-snug">
                  {m.claim}
                </p>
                <svg
                  className={`w-4 h-4 shrink-0 mt-0.5 text-[var(--color-text-secondary)] transition-transform ${open === i ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === i && (
                <div className="px-4 pb-4 pt-0">
                  <div className="pl-8 border-l-2 border-[var(--color-accent)]/30">
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{m.response}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fıkhi Not */}
      {ctx.legalNote && (
        <div className="px-4 py-4 rounded border border-amber-500/20 bg-amber-500/5">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400 mb-2">
            {t.analyse.legalDiscussion}
          </p>
          <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{ctx.legalNote}</p>
        </div>
      )}

      {/* Karşılaştırmalı Hukuk */}
      {ctx.comparativeLaw && ctx.comparativeLaw.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-secondary)] mb-2 px-1">
            {t.analyse.comparativeLaw}
          </p>
          <div className="rounded border border-[var(--color-border)] overflow-hidden">
            <div className="grid grid-cols-3 bg-[var(--color-surface)] px-3 py-2 border-b border-[var(--color-border)]">
              <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">{t.analyse.system}</span>
              <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">{t.analyse.ruling}</span>
              <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">{t.analyse.protection}</span>
            </div>
            {ctx.comparativeLaw.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 gap-2 px-3 py-2.5 border-b border-[var(--color-border)] last:border-0 ${
                  i === ctx.comparativeLaw!.length - 1
                    ? "bg-[var(--color-accent)]/5"
                    : "bg-[var(--color-bg)]"
                }`}
              >
                <span className={`text-xs font-medium leading-snug ${i === ctx.comparativeLaw!.length - 1 ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"}`}>
                  {row.system}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)] leading-snug">{row.ruling}</span>
                <span className={`text-xs font-medium leading-snug ${row.protection === "Yok" ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {row.protection}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* İlgili Ayetler */}
      {ctx.relatedVerses.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-secondary)] mb-2 px-1">
            {t.analyse.relatedVerses}
          </p>
          <div className="space-y-1.5">
            {ctx.relatedVerses.map((rv) => (
              <Link
                key={rv.verseKey}
                to="/analyse/$verseKey"
                params={{ verseKey: rv.verseKey }}
                className="flex items-start gap-3 px-4 py-3 rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40 transition-all"
              >
                <span className="shrink-0 text-xs font-semibold text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {rv.surahName} {rv.ayahNumber}
                </span>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{rv.note}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Kaynaklar */}
      {ctx.sources && ctx.sources.length > 0 && (
        <div className="px-4 py-3 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-secondary)] mb-2">
            {t.analyse.sources}
          </p>
          <ul className="space-y-1">
            {ctx.sources.map((s, i) => (
              <li key={i} className="text-xs text-[var(--color-text-secondary)] leading-relaxed flex gap-2">
                <span className="text-[var(--color-accent)] shrink-0">·</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Temalar Tab ──────────────────────────────────────────

function ThemesTab({ surahId, translation }: { surahId: number; translation: string }) {
  const { t } = useTranslation();
  const themes = detectVerseThemes(surahId, translation);

  if (themes.length === 0) {
    return (
      <div className="px-4 py-6 rounded border border-dashed border-[var(--color-border)] text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">{t.analyse.loadingThemes}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--color-text-secondary)] mb-3">
        {t.analyse.relatedThemes.replace("{count}", String(themes.length))}
      </p>
      {themes.map((theme, i) => (
        <div
          key={theme.id}
          className={`flex items-center gap-3 px-4 py-3 rounded border transition-all ${
            i === 0
              ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5"
              : "border-[var(--color-border)] bg-[var(--color-surface)]"
          }`}
        >
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 bg-[var(--color-border)]/60 text-[var(--color-text-secondary)]">
            {theme.label.slice(0, 2)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{theme.label}</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{theme.desc}</p>
          </div>
          {i === 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-medium shrink-0">
              {t.analyse.featured}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Ana Bileşen ──────────────────────────────────────────

function AnalysePage() {
  const { t, locale } = useTranslation();
  const { verseKey } = Route.useParams();
  const { tab: initialTab } = Route.useSearch();
  const [tab, setTab] = useState<Tab>(initialTab as Tab ?? "meal");
  const [surahId, verseNum] = verseKey.split(":").map(Number);

  const { data, isLoading } = useQuery({
    queryKey: ["verse-analysis", verseKey],
    queryFn: () => getVerseAnalysis({ data: verseKey }),
    staleTime: Infinity,
  });

  // Temalar için meal metni (ilk Türkçe meal)
  const firstTrMeal = data?.translations.find((tr) => tr.source.language === "tr")?.text ?? "";

  const tabLabels: Record<Tab, string> = {
    meal: t.analyse.translations,
    morfoloji: t.analyse.morphology,
    temalar: t.analyse.themes,
    benzer: t.analyse.similarVerses,
    bagit: t.analyse.context,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Başlık */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          to="/surah/$surahSlug"
          params={{ surahSlug: String(surahId) }}
          search={{ ayah: verseNum }}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">{t.analyse.title}</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {isLoading ? t.common.loading : `${getSurahName(surahId, locale) || data?.surah?.nameSimple || ""} · ${t.analyse.verse.replace("{verseNum}", String(verseNum))}`}
          </p>
        </div>
      </div>

      {/* Arapça metin */}
      {isLoading ? (
        <div className="h-20 rounded bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse mb-5" />
      ) : (
        <div className="px-5 py-5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] mb-5">
          <p
            className="text-2xl text-right leading-loose text-[var(--color-text-primary)]"
            dir="rtl"
            lang="ar"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            {data?.ayah.textUthmani}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2 text-right">
            {data?.surah?.nameArabic} · {verseNum}
          </p>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-[var(--color-surface)] rounded p-1 border border-[var(--color-border)] mb-5 overflow-x-auto">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              tab === tb
                ? "bg-[var(--color-accent)] text-white shadow-sm"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {tabLabels[tb]}
          </button>
        ))}
      </div>

      {/* Mealler */}
      {tab === "meal" && (
        <div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
              ))}
            </div>
          ) : data ? (
            <MealComparisonSheet
              surahId={surahId}
              ayahNumber={verseNum}
              ayahText={data.ayah.textUthmani}
              onClose={() => {}}
              inline
            />
          ) : null}
        </div>
      )}

      {/* Morfoloji */}
      {tab === "morfoloji" && (
        <div className="px-4 py-6 rounded border border-dashed border-[var(--color-border)] text-center">
          <div className="flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-[var(--color-border)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
            {t.analyse.morphAnalysis}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {t.analyse.morphAnalysisDesc}
          </p>
          <div
            className="mt-4 text-right text-lg leading-loose px-4 py-3 rounded bg-[var(--color-surface)] border border-[var(--color-border)]"
            dir="rtl"
            lang="ar"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            {data?.ayah.textUthmani && splitWords(data.ayah.textUthmani).map((word, i) => (
              <span
                key={i}
                className="inline-block mx-1 px-1.5 py-0.5 rounded-lg cursor-pointer hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)] transition-colors"
                title={t.analyse.clickWord}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Temalar */}
      {tab === "temalar" && !isLoading && (
        <ThemesTab surahId={surahId} translation={firstTrMeal} />
      )}

      {/* Benzer Ayetler */}
      {tab === "benzer" && (
        <SimilarVersesTab verseKey={verseKey} />
      )}

      {/* Bağlam & Savunma */}
      {tab === "bagit" && (
        <BaglamTab verseKey={verseKey} />
      )}
    </div>
  );
}
