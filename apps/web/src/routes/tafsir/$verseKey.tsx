/**
 * Tefsir okuyucu — uzun-form tefsir görüntüleme.
 * Diyanet Kur'an Yolu (varsayılan) + ileride Elmalılı, İbn Kesir, Ömer Çelik.
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-names-i18n";
import { getTafsirSources, getTafsirForVerse } from "~/lib/tafsir-service";
import { tafsirHead } from "~/lib/seo";
import { SURAHS } from "~/lib/surah-ayah-counts";

export const Route = createFileRoute("/tafsir/$verseKey")({
  head: ({ params }) => tafsirHead(params.verseKey),
  component: TafsirPage,
  validateSearch: (search: Record<string, unknown>) => ({
    source: typeof search.source === "string" ? search.source : undefined,
  }),
});

function TafsirPage() {
  const { t, locale } = useTranslation();
  const { verseKey } = Route.useParams();
  const { source: searchSource } = Route.useSearch();
  const navigate = useNavigate();
  const [surahId, ayahNumber] = verseKey.split(":").map(Number);

  const sourcesQ = useQuery({
    queryKey: ["tafsir-sources"],
    queryFn: () => getTafsirSources(),
    staleTime: Infinity,
  });

  const tafsirQ = useQuery({
    queryKey: ["tafsir", verseKey, searchSource ?? null],
    queryFn: () => getTafsirForVerse({ data: { verseKey, sourceSlug: searchSource } }),
    staleTime: Infinity,
  });

  const surahName = getSurahName(surahId, locale) || tafsirQ.data?.surah?.nameSimple || "";
  const totalAyahs = useMemo(() => SURAHS.find((s) => s.id === surahId)?.ayahCount ?? 0, [surahId]);
  const prevKey = ayahNumber > 1 ? `${surahId}:${ayahNumber - 1}` : null;
  const nextKey = totalAyahs && ayahNumber < totalAyahs ? `${surahId}:${ayahNumber + 1}` : null;

  function changeSource(slug: string) {
    navigate({
      to: "/tafsir/$verseKey",
      params: { verseKey },
      search: { source: slug },
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Başlık */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          to="/surah/$surahSlug"
          params={{ surahSlug: String(surahId) }}
          search={{ ayah: ayahNumber }}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          aria-label={t.tafsir.backToSurah}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-[var(--color-text-primary)] truncate">
            {t.tafsir.title}
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {surahName} · {t.analyse.verse.replace("{verseNum}", String(ayahNumber))}
          </p>
        </div>
        <Link
          to="/analyse/$verseKey"
          params={{ verseKey }}
          search={{ tab: "meal" }}
          className="text-xs px-3 py-1.5 rounded border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all"
        >
          {t.tafsir.openAnalyse}
        </Link>
      </div>

      {/* Arapça ayet */}
      {tafsirQ.isLoading ? (
        <div className="h-20 rounded bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse mb-5" />
      ) : (
        <div className="px-5 py-5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] mb-5">
          <p
            className="text-2xl text-right leading-loose text-[var(--color-text-primary)]"
            dir="rtl"
            lang="ar"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            {tafsirQ.data?.ayah.textUthmani}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2 text-right">
            {tafsirQ.data?.surah?.nameArabic} · {ayahNumber}
          </p>
        </div>
      )}

      {/* Kaynak seçici (>1 kaynak varsa) */}
      {sourcesQ.data && sourcesQ.data.length > 1 && (
        <div className="flex gap-1 bg-[var(--color-surface)] rounded p-1 border border-[var(--color-border)] mb-5 overflow-x-auto">
          {sourcesQ.data.map((s) => {
            const active = tafsirQ.data?.source?.slug === s.slug;
            return (
              <button
                key={s.id}
                onClick={() => changeSource(s.slug)}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  active
                    ? "bg-[var(--mu-accent-soft)] text-[var(--mu-accent-ink)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Kaynak künyesi (tek kaynak veya bilgi) */}
      {tafsirQ.data?.source && (
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-secondary)] mb-2 px-1">
          {t.tafsir.source}: {tafsirQ.data.source.name} · {tafsirQ.data.source.author}
        </p>
      )}

      {/* Tefsir gövdesi */}
      {tafsirQ.isLoading ? (
        <div className="space-y-3">
          <div className="h-4 rounded bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
          <div className="h-4 rounded bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse w-11/12" />
          <div className="h-4 rounded bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse w-3/4" />
        </div>
      ) : tafsirQ.data?.tafsir ? (
        <div
          className="text-[15px] text-[var(--color-text-primary)] leading-relaxed [&>p]:mb-4 [&>p:last-child]:mb-0 [&_em]:italic [&_strong]:font-semibold"
          // textHtml scraper'da sadece <p><br><em><strong><i><b> taglerine indirgendi.
          dangerouslySetInnerHTML={{ __html: tafsirQ.data.tafsir.textHtml }}
        />
      ) : !tafsirQ.data?.source ? (
        <EmptyState>{t.tafsir.notImported}</EmptyState>
      ) : (
        <EmptyState>{t.tafsir.notFound}</EmptyState>
      )}

      {/* Önceki / sonraki navigasyon */}
      <div className="flex items-center justify-between gap-3 mt-8 pt-4 border-t border-[var(--color-border)]">
        {prevKey ? (
          <Link
            to="/tafsir/$verseKey"
            params={{ verseKey: prevKey }}
            search={{ source: searchSource }}
            className="flex-1 flex items-center gap-2 px-4 py-3 rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40 transition-all text-left"
          >
            <svg className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">{t.tafsir.prevAyah}</p>
              <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                {surahName} {ayahNumber - 1}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {nextKey ? (
          <Link
            to="/tafsir/$verseKey"
            params={{ verseKey: nextKey }}
            search={{ source: searchSource }}
            className="flex-1 flex items-center justify-end gap-2 px-4 py-3 rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40 transition-all text-right"
          >
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">{t.tafsir.nextAyah}</p>
              <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                {surahName} {ayahNumber + 1}
              </p>
            </div>
            <svg className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-8 rounded border border-dashed border-[var(--color-border)] text-center">
      <div className="flex items-center justify-center mb-3">
        <svg className="w-8 h-8 text-[var(--color-border)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)]">{children}</p>
    </div>
  );
}

