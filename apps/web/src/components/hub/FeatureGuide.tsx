/**
 * Özellik rehberi — Mahfuz'un tüm özelliklerini tanıtan kartlar.
 * Yatay scroll (mobil) veya grid (masaüstü).
 */

import { Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";

interface Feature {
  icon: React.ReactNode;
  titleKey: keyof ReturnType<typeof useGuideKeys>;
  descKey: keyof ReturnType<typeof useGuideKeys>;
  to?: string;
  disabled?: boolean;
}

function useGuideKeys() {
  const { t } = useTranslation();
  return t.hub.guide;
}

const ICON_CLASS = "w-8 h-8 text-[var(--color-accent)]";

const FEATURES: Feature[] = [
  {
    titleKey: "reading",
    descKey: "readingDesc",
    to: "/",
    icon: (
      <svg className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
  },
  {
    titleKey: "wbw",
    descKey: "wbwDesc",
    to: "/",
    icon: (
      <svg className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h4M12 7h4M20 7h-1" />
        <path d="M4 12h3M10 12h4M18 12h2" />
        <path d="M4 17h5M13 17h3M20 17h-1" />
        <circle cx="7" cy="20" r="0.5" fill="currentColor" />
        <circle cx="14" cy="20" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    titleKey: "audio",
    descKey: "audioDesc",
    to: "/",
    icon: (
      <svg className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18V12a9 9 0 0118 0v6" />
        <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z" />
      </svg>
    ),
  },
  {
    titleKey: "bookmarksFeature",
    descKey: "bookmarksFeatureDesc",
    to: "/bookmarks",
    icon: (
      <svg className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 3h14a1 1 0 011 1v17l-7.5-5L5 21V4a1 1 0 011-1z" />
      </svg>
    ),
  },
  {
    titleKey: "search",
    descKey: "searchDesc",
    to: "/search",
    icon: (
      <svg className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    titleKey: "alifbaFeature",
    descKey: "alifbaFeatureDesc",
    to: "/alifba",
    icon: (
      <span className="text-base font-bold text-[var(--color-accent)]" style={{ fontFamily: "var(--font-arabic)" }}>ا ب</span>
    ),
  },
  {
    titleKey: "focus",
    descKey: "focusDesc",
    to: "/page/1",
    icon: (
      <svg className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
      </svg>
    ),
  },
  {
    titleKey: "memorize",
    descKey: "memorizeDesc",
    disabled: true,
    icon: (
      <svg className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
  },
];

export function FeatureGuide() {
  const g = useGuideKeys();

  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold mb-0.5">{g.title}</h2>
      <p className="text-xs text-[var(--color-text-secondary)] mb-3">{g.subtitle}</p>

      <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none sm:grid sm:grid-cols-4 sm:overflow-visible">
        {FEATURES.map((f) => {
          const title = g[f.titleKey] as string;
          const desc = g[f.descKey] as string;

          const card = (
            <div
              className={`snap-start shrink-0 w-[8.5rem] h-[8.5rem] sm:w-auto sm:h-full flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border transition-all ${
                f.disabled
                  ? "border-[var(--color-border)] opacity-45 cursor-default"
                  : "border-[var(--color-border)] hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/5 cursor-pointer"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/8 flex items-center justify-center">
                {f.icon}
              </div>
              <span className="text-xs font-medium text-[var(--color-text-primary)] text-center leading-snug">
                {title}
              </span>
              <span className="text-[10px] text-[var(--color-text-secondary)] text-center leading-snug line-clamp-2">
                {desc}
              </span>
              {f.disabled && (
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-text-secondary)] font-medium">
                  Yakında
                </span>
              )}
            </div>
          );

          if (f.disabled || !f.to) return <div key={f.titleKey} className="h-full">{card}</div>;

          return (
            <Link key={f.titleKey} to={f.to} className="block h-full">
              {card}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
