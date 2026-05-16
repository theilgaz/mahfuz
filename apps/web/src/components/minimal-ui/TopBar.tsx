import { Link, useRouterState } from "@tanstack/react-router";
import { useSettingsStore } from "~/stores/settings.store";
import { useTranslation } from "~/hooks/useTranslation";
import { LogoMeem } from "./LogoMeem";
import { MuIcons } from "./icons";
import type { Session } from "~/lib/auth";

interface TopBarProps {
  session: Session | null;
  onSearch?: () => void;
  onSettings?: () => void;
}

export function TopBar({ session, onSearch, onSettings }: TopBarProps) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const navItems = [
    { name: "home", path: "/", icon: MuIcons.home, label: t.nav?.home ?? "Ana Sayfa" },
    { name: "fihrist", path: "/fihrist", icon: MuIcons.book, label: t.nav?.fihrist ?? "Fihrist" },
    { name: "discover", path: "/discover", icon: MuIcons.compass, label: t.hub?.title ?? "Kesfet" },
  ];

  const isActive = (itemPath: string) => {
    if (itemPath === "/") return path === "/";
    return path.startsWith(itemPath);
  };

  const cycleTheme = () => {
    const next = theme === "light" ? "sepia" : theme === "sepia" ? "dark" : "light";
    setTheme(next);
  };

  return (
    <header className="mu-topbar">
      <div className="mu-topbar-inner">
        <Link to="/" className="mu-brand">
          <LogoMeem size={36} />
          <span className="mu-brand-wordmark">
            <span className="mu-brand-latin">Mahfuz</span>
          </span>
        </Link>

        <nav className="mu-topnav">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`mu-tnav ${isActive(item.path) ? "on" : ""}`}
            >
              <span className="mu-tnav-i">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <button className="mu-tnav" onClick={onSearch}>
            <span className="mu-tnav-i">{MuIcons.search}</span>
            <span className="mu-tnav-search-label">{t.nav?.search ?? "Ara"}</span>
            <kbd
              className="mu-tnav-kbd"
              style={{
                fontFamily: "var(--mu-ff-mono)",
                fontSize: 11,
                padding: "2px 6px",
                borderRadius: 4,
                background: "var(--mu-bg-soft)",
                border: "1px solid var(--mu-line)",
                color: "var(--mu-muted)",
              }}
            >
              /
            </kbd>
          </button>
        </nav>

        {/* Right actions */}
        <div className="mu-topright">
          <button className="mu-icon-btn" title="Tema" onClick={cycleTheme}>
            {theme === "dark" ? MuIcons.sun : MuIcons.moon}
          </button>
          <button className="mu-icon-btn mu-icon-btn--settings" title="Ayarlar" onClick={onSettings}>
            {MuIcons.settings}
          </button>
          {session?.user ? (
            <Link to="/profile" className="mu-avatar" title={session.user.name || ""}>
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || ""}
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{session.user.name?.[0]?.toUpperCase() || "?"}</span>
              )}
            </Link>
          ) : (
            <Link to="/auth/login" className="mu-btn small primary" style={{ fontSize: 13 }}>
              {t.auth?.login ?? "Giris yap"}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
