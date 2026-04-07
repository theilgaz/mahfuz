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
import { LatinRootSearch } from "~/components/LatinRootSearch";

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
      className={`relative flex flex-col items-center gap-2 p-5 rounded-2xl border transition-colors h-full ${
        disabled
          ? "border-[var(--color-border)] opacity-50 cursor-default"
          : labs
            ? "border-dashed border-[var(--color-accent)]/30 hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-surface)] cursor-pointer"
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
      {labs && !disabled && (
        <span className="absolute top-3 right-3 text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium">
          Keşif
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
  const labsEnabled = useSettingsStore((s) => s.labsEnabled);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-32">
      <div className="grid grid-cols-2 gap-3">
        {/* Ezber Takibi */}
        <HubCard
          to="/hifz"
          title={t.hub.hifz}
          description={t.hub.hifzDesc}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          }
        />

        {/* Elifba Öğren */}
        <HubCard
          to="/alifba/"
          title={t.hub.alifba}
          description={t.hub.alifbaDesc}
          icon={
            <span className="text-lg font-bold leading-none" style={{ fontFamily: "var(--font-arabic)" }}>ا ب</span>
          }
        />

      </div>

      {/* Oyunlar */}
      <div className="mt-2">
        <HubCard
          to="/games"
          title={t.hub.games}
          description={t.hub.gamesDesc}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M7 10v4M5 12h4" />
              <path d="M17 10h.01M19 12h.01" />
            </svg>
          }
        />
      </div>

      {/* Baglamsal Aciklamalar */}
      <div className="mt-2">
        <HubCard
          to="/savunma"
          title={t.hub.contextual}
          description={t.hub.contextualDesc}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          }
        />
      </div>

      {/* Kok Aramasi */}
      <div className="mt-6">
        <p className="text-xs font-semibold tracking-widest text-[var(--color-text-secondary)] uppercase mb-3">
          {t.hub.rootSearch}
        </p>
        <LatinRootSearch />
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
        <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-xl z-50 py-1 overflow-hidden">
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
