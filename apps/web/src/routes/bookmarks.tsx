/**
 * Yer imleri sayfası — /imler
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useSurahs, surahsQueryOptions } from "~/hooks/useQuranQuery";

export const Route = createFileRoute("/bookmarks")({
  loader: ({ context }) => context.queryClient.ensureQueryData(surahsQueryOptions()),
  component: BookmarksPage,
});

function BookmarksPage() {
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const removeBookmark = useBookmarksStore((s) => s.removeBookmark);
  const { data: surahs } = useSurahs();
  const surahMap = new Map(surahs.map((s) => [s.id, s]));

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Başlık + geri */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/"
          className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
          aria-label="Geri"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5L7 10L12 15" />
          </svg>
        </Link>
        <h1 className="text-lg font-medium">Yer İmleri</h1>
        {bookmarks.length > 0 && (
          <span className="text-xs text-[var(--color-text-secondary)] ml-auto">
            {bookmarks.length} ayet
          </span>
        )}
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-16">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--color-border)" strokeWidth="1.5" className="mx-auto mb-4">
            <path d="M12 6H36A2 2 0 0138 8V42L25 33L12 42V8A2 2 0 0112 6Z" />
          </svg>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Henüz yer imi eklemediniz
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Okurken ayet numarasına tıklayıp yer imi ekleyebilirsiniz
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookmarks.map((bm) => (
            <div
              key={`${bm.surahId}:${bm.ayahNumber}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
            >
              <Link
                to="/page/$pageNumber"
                params={{ pageNumber: String(bm.pageNumber) }}
                search={{ ayah: undefined }}
                className="flex-1 min-w-0"
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {surahMap.get(bm.surahId)?.nameSimple ?? `Sure ${bm.surahId}`}
                    <span className="text-[var(--color-text-secondary)] font-normal">, Ayet {bm.ayahNumber}</span>
                  </p>
                  {surahMap.get(bm.surahId) && (
                    <span className="text-sm shrink-0 ml-auto" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
                      {surahMap.get(bm.surahId)!.nameArabic}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Sayfa {bm.pageNumber}
                </p>
              </Link>

              <button
                onClick={() => removeBookmark(bm.surahId, bm.ayahNumber)}
                className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-[var(--color-surface)] transition-colors shrink-0"
                aria-label="Yer imini kaldır"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4l8 8m0-8l-8 8" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
