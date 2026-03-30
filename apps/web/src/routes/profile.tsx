/**
 * Profil sayfası — kullanıcı bilgisi, ezber durumu, yer imleri, keşfet.
 */

import { lazy, Suspense } from "react";
import { createFileRoute, Link, useRouter, redirect } from "@tanstack/react-router";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { signOut } from "~/lib/auth-client";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-names-i18n";
import { useLocaleStore } from "~/stores/locale.store";
import { surahSlug } from "~/lib/surah-slugs";

const HifzStatus = lazy(() =>
  import("~/components/profile/HifzStatus").then((m) => ({ default: m.HifzStatus }))
);

export const Route = createFileRoute("/profile")({
  beforeLoad: ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/auth/login", search: { redirect: "/profile" } });
    }
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { session } = Route.useRouteContext();
  const router = useRouter();
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const removeBookmark = useBookmarksStore((s) => s.removeBookmark);

  const user = session!.user;

  // Son 5 yer imi (tarih sırasına göre)
  const recentBookmarks = [...bookmarks]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-32">

      {/* ── Kullanıcı kartı ───────────────────────────── */}
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] mb-6">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || ""}
            className="h-16 w-16 rounded-full object-cover shrink-0 ring-2 ring-[var(--color-accent)]/20"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="h-16 w-16 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-2xl font-semibold text-white shrink-0">
            {user.name?.[0]?.toUpperCase() || "?"}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base truncate">{user.name}</p>
          <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">{user.email}</p>
        </div>
        <button
          onClick={async () => {
            await signOut();
            await router.invalidate();
          }}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-colors border border-red-500/20"
        >
          {t.nav.signOut}
        </button>
      </div>

      {/* ── Ezber Durumu ──────────────────────────────── */}
      <Suspense fallback={<div className="h-32 flex items-center justify-center text-sm text-[var(--color-text-secondary)]">...</div>}>
        <HifzStatus />
      </Suspense>

      {/* ── Yer İmleri ────────────────────────────────── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-accent)]">
              <path d="M5 3H15A1.5 1.5 0 0116.5 4.5V17.5L10.5 13.5L4.5 17.5V4.5A1.5 1.5 0 015 3Z" />
            </svg>
            <h2 className="text-sm font-semibold">{t.profile.viewBookmarks}</h2>
            {bookmarks.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium">
                {bookmarks.length}
              </span>
            )}
          </div>
          {bookmarks.length > 5 && (
            <Link
              to="/bookmarks"
              className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-0.5"
            >
              {t.common.viewAll}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4.5 2.5l3.5 3.5-3.5 3.5" />
              </svg>
            </Link>
          )}
        </div>

        {bookmarks.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-[var(--color-border)] text-center">
            <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--color-border)] mx-auto mb-2">
              <path d="M5 3H15A1.5 1.5 0 0116.5 4.5V17.5L10.5 13.5L4.5 17.5V4.5A1.5 1.5 0 015 3Z" />
            </svg>
            <p className="text-xs text-[var(--color-text-secondary)]">{t.profile.noBookmarks}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden divide-y divide-[var(--color-border)]">
            {recentBookmarks.map((bm) => {
              const name = getSurahName(bm.surahId, locale);
              return (
                <div key={`${bm.surahId}:${bm.ayahNumber}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--color-accent)]/3 transition-colors">
                  {/* Sure/ayet bilgisi — tıklanabilir */}
                  <Link
                    to="/surah/$surahSlug"
                    params={{ surahSlug: surahSlug(bm.surahId) }}
                    search={{ ayah: bm.ayahNumber }}
                    className="flex-1 min-w-0 flex items-center gap-2.5"
                  >
                    <span className="w-7 h-7 rounded-lg bg-[var(--color-accent)]/8 flex items-center justify-center text-[10px] font-bold text-[var(--color-accent)] shrink-0">
                      {bm.surahId}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{name}</p>
                      <p className="text-[10px] text-[var(--color-text-secondary)]">
                        {t.common.verse} {bm.ayahNumber}
                      </p>
                    </div>
                  </Link>

                  {/* Kaldır butonu */}
                  <button
                    onClick={() => removeBookmark(bm.surahId, bm.ayahNumber)}
                    className="shrink-0 p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    aria-label="Kaldır"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
                    </svg>
                  </button>
                </div>
              );
            })}

            {/* Tümünü gör linki */}
            {bookmarks.length > 5 && (
              <Link
                to="/bookmarks"
                className="flex items-center justify-center gap-1 px-3 py-2.5 text-xs text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-colors"
              >
                +{bookmarks.length - 5} {t.bookmarks.nMore.replace("{n}", "")}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4.5 2.5l3.5 3.5-3.5 3.5" />
                </svg>
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ── Keşfet Linki ──────────────────────────────── */}
      <Link
        to="/discover"
        className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-[var(--color-accent)]/8 to-transparent border border-[var(--color-accent)]/15 hover:border-[var(--color-accent)]/30 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/12 text-[var(--color-accent)] flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="10" r="8" />
            <path d="M13.5 6.5L8.5 8.5L6.5 13.5L11.5 11.5L13.5 6.5Z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{t.hub.title}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">{t.hub.guide.subtitle}</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-[var(--color-accent)] shrink-0">
          <path d="M6 4l4 4-4 4" />
        </svg>
      </Link>
    </div>
  );
}
