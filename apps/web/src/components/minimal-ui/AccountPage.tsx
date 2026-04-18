/**
 * Account/Profile page -- editorial design with avatar, stats, nav links.
 * Minimal UI editorial design.
 */

import { Link, useRouter } from "@tanstack/react-router";
import { signOut } from "~/lib/auth-client";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useTranslation } from "~/hooks/useTranslation";
import { MuIcons } from "./icons";

interface AccountPageProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

const LINKS = [
  {
    to: "/bookmarks" as const,
    icon: MuIcons.bookmark,
    labelKey: "bookmarks" as const,
    descKey: "bookmarksDesc" as const,
  },
  {
    to: "/notes" as const,
    icon: MuIcons.note,
    labelKey: "notes" as const,
    descKey: "notesDesc" as const,
  },
];

export function AccountPage({ user }: AccountPageProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const bookmarkCount = useBookmarksStore((s) => s.bookmarks.length);

  const initial = user.name?.[0]?.toUpperCase() || "?";

  return (
    <div className="mu-home">
      {/* Header */}
      <section className="mu-account-head">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || ""}
            className="mu-account-avatar"
            style={{ objectFit: "cover" }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="mu-account-avatar">{initial}</div>
        )}
        <div>
          <p className="mu-eyebrow">
            <span className="mu-eb-line" />
            Hesap
          </p>
          <h1 className="mu-display" style={{ fontSize: 48 }}>
            {user.name || "Kullanici"}
          </h1>
          <p className="mu-muted">{user.email}</p>
        </div>
      </section>

      {/* Stats */}
      <div className="mu-account-stats">
        <div className="mu-alifba-stats" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="mu-astat-n">--</span>
          <span className="mu-astat-l">gün serisi</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="mu-astat-n">--</span>
          <span className="mu-astat-l">toplam XP</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="mu-astat-n">--</span>
          <span className="mu-astat-l">elifba</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="mu-astat-n">{bookmarkCount}</span>
          <span className="mu-astat-l">yer imi</span>
        </div>
      </div>

      {/* Navigation links */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <Link
          to="/bookmarks"
          className="mu-srow"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {MuIcons.bookmark}
            <span>
              <strong style={{ display: "block", fontSize: 14 }}>{t.hub.bookmarks}</strong>
              <span className="mu-muted" style={{ fontSize: 12 }}>{t.hub.bookmarksDesc}</span>
            </span>
          </span>
          {bookmarkCount > 0 && (
            <span style={{ fontSize: 12, color: "var(--mu-accent)", fontWeight: 600 }}>
              {bookmarkCount}
            </span>
          )}
        </Link>

        <Link
          to="/notes"
          className="mu-srow"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {MuIcons.note}
            <span>
              <strong style={{ display: "block", fontSize: 14 }}>{t.hub.notes}</strong>
              <span className="mu-muted" style={{ fontSize: 12 }}>{t.hub.notesDesc}</span>
            </span>
          </span>
        </Link>

        <Link
          to="/premium"
          className="mu-srow"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {MuIcons.settings}
            <span>
              <strong style={{ display: "block", fontSize: 14 }}>{t.hub.premium}</strong>
              <span className="mu-muted" style={{ fontSize: 12 }}>{t.hub.premiumDesc}</span>
            </span>
          </span>
        </Link>
      </div>

      {/* Sign out */}
      <div style={{ paddingTop: 32 }}>
        <button
          className="mu-btn ghost"
          onClick={async () => {
            await signOut();
            await router.invalidate();
          }}
        >
          {t.nav.signOut}
        </button>
      </div>
    </div>
  );
}
