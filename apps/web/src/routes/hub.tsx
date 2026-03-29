/**
 * Keşfet hub'ı — /hub
 * Yer imleri, Elifba, Ezberle, Uygulamalar gibi modüllerin giriş noktası.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useTranslation } from "~/hooks/useTranslation";
import { FeatureGuide } from "~/components/hub/FeatureGuide";
import { GitHubContributors } from "~/components/hub/GitHubContributors";

export const Route = createFileRoute("/hub")({
  component: HubPage,
});

interface HubCardProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: number;
  disabled?: boolean;
}

function HubCard({ to, icon, title, description, badge, disabled }: HubCardProps) {
  const content = (
    <div
      className={`relative flex flex-col items-center gap-2 p-5 rounded-2xl border transition-colors h-full ${
        disabled
          ? "border-[var(--color-border)] opacity-50 cursor-default"
          : "border-[var(--color-border)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface)] cursor-pointer"
      }`}
    >
      <div className="w-11 h-11 rounded-xl bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-accent)]">
        {icon}
      </div>
      <span className="text-sm font-medium text-[var(--color-text-primary)]">{title}</span>
      <span className="text-xs text-[var(--color-text-secondary)] text-center leading-snug">{description}</span>
      {badge != null && badge > 0 && (
        <span className="absolute top-3 right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-medium flex items-center justify-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {disabled && (
        <span className="absolute top-3 right-3 text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-text-secondary)] font-medium">
          Yakında
        </span>
      )}
    </div>
  );

  if (disabled) return content;

  return (
    <Link to={to} className="block">
      {content}
    </Link>
  );
}

function HubPage() {
  const { t } = useTranslation();
  const bookmarkCount = useBookmarksStore((s) => s.bookmarks.length);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <h1 className="text-lg font-semibold mb-5">{t.hub.title}</h1>

      <FeatureGuide />

      <div className="grid grid-cols-2 gap-3">
        {/* Yer İmleri */}
        <HubCard
          to="/bookmarks"
          badge={bookmarkCount}
          title={t.hub.bookmarks}
          description={t.hub.bookmarksDesc}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 3H19A1 1 0 0120 4V21L12.5 16L5 21V4A1 1 0 015 3Z" />
            </svg>
          }
        />

        {/* Elifba Öğren */}
        <HubCard
          to="/alifba"
          title={t.hub.alifba}
          description={t.hub.alifbaDesc}
          icon={
            <span className="text-lg font-bold leading-none" style={{ fontFamily: "var(--font-arabic)" }}>ا ب</span>
          }
        />

        {/* Dinleyerek Ezberle */}
        <HubCard
          to="/hub"
          disabled
          title={t.hub.listenMemorize}
          description={t.hub.listenMemorizeDesc}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18V12A9 9 0 0121 12V18" />
              <path d="M21 19C21 20.1 20.1 21 19 21H18C16.9 21 16 20.1 16 19V16C16 14.9 16.9 14 18 14H21V19Z" />
              <path d="M3 19C3 20.1 3.9 21 5 21H6C7.1 21 8 20.1 8 19V16C8 14.9 7.1 14 6 14H3V19Z" />
            </svg>
          }
        />

        {/* Kuran Uygulamaları */}
        <HubCard
          to="/hub"
          disabled
          title={t.hub.apps}
          description={t.hub.appsDesc}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          }
        />
      </div>

      <GitHubContributors />
    </div>
  );
}
