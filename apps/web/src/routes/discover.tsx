/**
 * Keşfet — /discover
 * Elifba, Ezberle, Uygulamalar gibi modüllerin giriş noktası.
 */

import { useState, useRef, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSettingsStore } from "~/stores/settings.store";
import { useTranslation } from "~/hooks/useTranslation";
import { useLocaleStore } from "~/stores/locale.store";
import { getAllLocaleConfigs, loadLocaleMessages, type Locale } from "~/locales/registry";

export const Route = createFileRoute("/discover")({
  component: HubPage,
});

interface HubCardProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: number;
  disabled?: boolean;
  labs?: boolean;
}

function HubCard({ to, icon, title, description, badge, disabled, labs }: HubCardProps) {
  const content = (
    <div
      className={`flex items-center gap-3 py-3 px-1 border-b border-[var(--color-border)] transition-colors ${
        disabled
          ? "opacity-40 cursor-default"
          : "hover:bg-[var(--color-surface)] cursor-pointer active:opacity-80"
      }`}
    >
      <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
          {title}
          {badge != null && badge > 0 && (
            <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--color-accent)] text-white text-[9px] font-medium flex items-center justify-center">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
          {disabled && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-border)]/50 text-[var(--color-text-secondary)] font-medium">
              Yakında
            </span>
          )}
          {labs && !disabled && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium">
              Keşif
            </span>
          )}
        </span>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">{description}</p>
      </div>
      <svg className="w-4 h-4 text-[var(--color-text-secondary)]/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );

  if (disabled) return content;

  return (
    <Link to={to} className="block">
      {content}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-widest text-[var(--color-text-secondary)] uppercase mb-2 mt-6 first:mt-0">
      {children}
    </p>
  );
}

function HubPage() {
  const { t } = useTranslation();
  const labsEnabled = useSettingsStore((s) => s.labsEnabled);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20">

      {/* ── Ogrenme ────────────────────────── */}
      <SectionLabel>{t.nav.menuLearning}</SectionLabel>
      <div>
        <HubCard
          to="/hifz"
          title={t.hub.hifz}
          description={t.hub.hifzDesc}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          }
        />
        <HubCard
          to="/alifba/"
          title={t.hub.alifba}
          description={t.hub.alifbaDesc}
          icon={
            <span className="text-base font-bold leading-none" style={{ fontFamily: "var(--font-arabic)" }}>ا ب</span>
          }
        />
        <HubCard
          to="/qaida"
          title={t.hub.qaida}
          description={t.hub.qaidaDesc}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              <path d="M8 7h8M8 11h6" />
            </svg>
          }
        />
        <HubCard
          to="/tajweed"
          title={t.hub.tajweed}
          description={t.hub.tajweedDesc}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />
      </div>

      {/* ── Topluluk & Oyunlar ─────────────── */}
      <SectionLabel>{t.nav.menuExplore}</SectionLabel>
      <div>
        <HubCard
          to="/games"
          title={t.hub.games}
          description={t.hub.gamesDesc}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M7 10v4M5 12h4" />
              <path d="M17 10h.01M19 12h.01" />
            </svg>
          }
        />
        <HubCard
          to="/khatm"
          title={t.hub.hatim}
          description={t.hub.hatimDesc}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
      </div>

      {/* ── Hakkinda ───────────────────────── */}
      <div className="mt-6">
        <HubCard
          to="/about"
          title={t.hub.about}
          description={t.hub.aboutDesc}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          }
        />
      </div>

    </div>
  );
}

function LanguagePicker() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const allLocales = getAllLocaleConfigs();
  const current = allLocales.find((l) => l.code === locale);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleChange = async (code: Locale) => {
    setOpen(false);
    await loadLocaleMessages(code);
    setLocale(code);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-secondary)]">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
        <span className="text-xs font-medium text-[var(--color-text-primary)]">{current?.config.displayName}</span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-[var(--color-text-secondary)]">
          <path d={open ? "M3 7L6 4L9 7" : "M3 5L6 8L9 5"} />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 rounded bg-[var(--color-bg)] border border-[var(--color-border)] shadow-sm z-50 py-1 overflow-hidden">
          {allLocales.map(({ code, config }) => (
            <button
              key={code}
              onClick={() => handleChange(code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                locale === code
                  ? "text-[var(--color-accent)] bg-[var(--color-accent)]/8"
                  : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
              }`}
            >
              <span className="flex-1">{config.displayName}</span>
              {locale === code && (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8.5l3.5 3.5L13 5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
