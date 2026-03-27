/**
 * Profil sayfası — kullanıcı bilgisi, yer imleri, uygulama hub'ı.
 */

import { createFileRoute, Link, useRouter, redirect } from "@tanstack/react-router";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { signOut } from "~/lib/auth-client";
import { useTranslation } from "~/hooks/useTranslation";
import { HifzStatus } from "~/components/profile/HifzStatus";

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
  const bookmarkCount = useBookmarksStore((s) => s.bookmarks.length);

  const user = session!.user;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
      {/* Üst bar */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/"
          className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
          aria-label={t.nav.back}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5L7 10L12 15" />
          </svg>
        </Link>
        <h1 className="text-lg font-medium">{t.profile.title}</h1>
      </div>

      {/* Kullanıcı kartı */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] mb-6">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || ""}
            className="h-14 w-14 rounded-full object-cover shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="h-14 w-14 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-xl font-semibold text-white shrink-0">
            {user.name?.[0]?.toUpperCase() || "?"}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{user.name}</p>
          <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.email}</p>
        </div>
        <button
          onClick={async () => {
            await signOut();
            await router.invalidate();
          }}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-colors"
        >
          {t.nav.signOut}
        </button>
      </div>

      {/* Ezber durumu */}
      <HifzStatus />

      {/* Yakında gelecek uygulamalar */}
      <section className="mb-8">
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="6" height="6" rx="1" />
              <rect x="11" y="3" width="6" height="6" rx="1" />
              <rect x="3" y="11" width="6" height="6" rx="1" />
              <rect x="11" y="11" width="6" height="6" rx="1" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{t.profile.apps}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{t.profile.appsComingSoon}</p>
          </div>
        </div>
      </section>

      {/* Yer imleri — link to /bookmarks */}
      <Link
        to="/bookmarks"
        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-surface)] transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-text-secondary)] shrink-0">
          <path d="M5 3H15A1.5 1.5 0 0116.5 4.5V17.5L10.5 13.5L4.5 17.5V4.5A1.5 1.5 0 015 3Z" />
        </svg>
        <span className="flex-1 text-sm font-medium">{t.profile.viewBookmarks}</span>
        {bookmarkCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
            {bookmarkCount}
          </span>
        )}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-[var(--color-text-secondary)] shrink-0">
          <path d="M6 4l4 4-4 4" />
        </svg>
      </Link>
    </div>
  );
}

