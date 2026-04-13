/**
 * Profil sayfası — kullanıcı bilgisi, ezber durumu, yer imleri, keşfet.
 */

import { createFileRoute, Link, useRouter, redirect } from "@tanstack/react-router";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { signOut } from "~/lib/auth-client";
import { useTranslation } from "~/hooks/useTranslation";

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
  const bookmarks = useBookmarksStore((s) => s.bookmarks);

  const user = session!.user;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20">

      {/* ── Kullanici karti ───────────────────────────── */}
      <div className="mb-6 py-3 px-1 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-4">
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
            className="shrink-0 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded transition-colors"
          >
            {t.nav.signOut}
          </button>
        </div>
      </div>

      {/* ── Linkler ─────────────────────────────────── */}
      <div>
          <Link to="/hifz" className="flex items-center gap-3 py-3 px-1 border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors active:opacity-80">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t.hub.hifz}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">{t.hub.hifzDesc}</p>
            </div>
            <svg className="w-4 h-4 text-[var(--color-text-secondary)]/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link to="/bookmarks" className="flex items-center gap-3 py-3 px-1 border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors active:opacity-80">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t.hub.bookmarks}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">{t.hub.bookmarksDesc}</p>
            </div>
            {bookmarks.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium mr-1">
                {bookmarks.length}
              </span>
            )}
            <svg className="w-4 h-4 text-[var(--color-text-secondary)]/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link to="/notes" className="flex items-center gap-3 py-3 px-1 border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors active:opacity-80">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t.hub.notes}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">{t.hub.notesDesc}</p>
            </div>
            <svg className="w-4 h-4 text-[var(--color-text-secondary)]/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link to="/stats" className="flex items-center gap-3 py-3 px-1 border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors active:opacity-80">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t.stats.title}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">{t.stats.memorization}</p>
            </div>
            <svg className="w-4 h-4 text-[var(--color-text-secondary)]/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link to="/premium" className="flex items-center gap-3 py-3 px-1 border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors active:opacity-80">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t.hub.premium}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">{t.hub.premiumDesc}</p>
            </div>
            <svg className="w-4 h-4 text-[var(--color-text-secondary)]/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
      </div>
    </div>
  );
}
