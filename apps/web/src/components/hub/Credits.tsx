/**
 * Credits — veri kaynakları, kütüphaneler, ilhamlar ve teşekkürler.
 */

import { useTranslation } from "~/hooks/useTranslation";

interface CreditItem {
  name: string;
  url: string;
  descKey: string | null;
}

interface CreditGroup {
  titleKey: string;
  icon: React.ReactNode;
  items: CreditItem[];
}

const ICON_CLASS = "w-4 h-4 text-[var(--color-accent)]";

const CREDIT_GROUPS: CreditGroup[] = [
  {
    titleKey: "data",
    icon: (
      <svg className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
      </svg>
    ),
    items: [
      { name: "Quran.com API", url: "https://quran.com", descKey: "quranApiDesc" as const },
      { name: "EveryAyah.com", url: "https://everyayah.com", descKey: "everyAyahDesc" as const },
      { name: "Tanzil.net", url: "https://tanzil.net", descKey: "tanzilDesc" as const },
    ],
  },
  {
    titleKey: "fonts",
    icon: (
      <svg className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7V4h16v3" />
        <path d="M9 20h6" />
        <path d="M12 4v16" />
      </svg>
    ),
    items: [
      { name: "Scheherazade New", url: "https://software.sil.org/scheherazade", descKey: "scheherazadeDesc" as const },
      { name: "Inter", url: "https://rsms.me/inter", descKey: "interDesc" as const },
    ],
  },
  {
    titleKey: "tech",
    icon: (
      <svg className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    items: [
      { name: "React 19", url: "https://react.dev", descKey: null },
      { name: "TanStack Start", url: "https://tanstack.com", descKey: null },
      { name: "Tailwind CSS v4", url: "https://tailwindcss.com", descKey: null },
      { name: "Drizzle ORM", url: "https://orm.drizzle.team", descKey: null },
      { name: "Better Auth", url: "https://better-auth.com", descKey: "betterAuthDesc" as const },
    ],
  },
  {
    titleKey: "inspiration",
    icon: (
      <svg className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
    items: [
      { name: "Quran.com", url: "https://quran.com", descKey: "quranComDesc" as const },
      { name: "Tarteel AI", url: "https://tarteel.ai", descKey: "tarteelDesc" as const },
      { name: "Mushaf Medine", url: "https://qurancomplex.gov.sa", descKey: "mushafDesc" as const },
    ],
  },
];

export function Credits() {
  const { t } = useTranslation();
  const c = t.hub.credits;
  const cr = t.credits;

  return (
    <section className="mt-6 rounded border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/12 flex items-center justify-center">
            <svg className="w-4 h-4 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">
              {c.title}
            </h3>
            <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">
              {c.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Gruplar */}
      <div className="px-4 pb-4 space-y-4">
        {CREDIT_GROUPS.map((group) => (
          <div key={group.titleKey}>
            {/* Grup başlığı */}
            <div className="flex items-center gap-1.5 mb-2">
              {group.icon}
              <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                {c[group.titleKey as keyof typeof c] as string}
              </span>
            </div>

            {/* Öğeler */}
            <div className="space-y-1">
              {group.items.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-baseline gap-2 py-1.5 px-2.5 -mx-1 rounded-lg hover:bg-[var(--color-accent)]/5 transition-colors group"
                >
                  <span className="text-xs font-medium text-[var(--color-accent)] group-hover:underline shrink-0">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] leading-snug truncate">
                    {item.descKey ? (cr[item.descKey as keyof typeof cr] as string) ?? item.name : item.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Alt bilgi */}
      <div className="px-4 py-3 border-t border-[var(--color-border)]/50 text-center">
        <p className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed">
          {c.footer}
        </p>
      </div>
    </section>
  );
}
