import type { Theme } from "~/stores/usePreferencesStore";
import { useTranslation } from "~/hooks/useTranslation";
import { SettingsLabel } from "./SettingsShared";

const THEME_OPTIONS: { value: Theme; color: string; ring?: string }[] = [
  { value: "light", color: "#ffffff" },
  { value: "crystal", color: "#ffffff", ring: "#007AFF" },
  { value: "sepia", color: "#f5ead6" },
  { value: "teal", color: "#1c3f44" },
  { value: "dimmed", color: "#22272e" },
  { value: "dark", color: "#1a1a1a" },
  { value: "black", color: "#000000" },
];

interface ThemeSectionProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function ThemeSection({ theme, onThemeChange }: ThemeSectionProps) {
  const { t } = useTranslation();

  const themeLabels: Record<Theme, string> = {
    light: t.theme.light,
    crystal: t.theme.crystal,
    sepia: t.theme.sepia,
    dark: t.theme.dark,
    dimmed: t.theme.dimmed,
    teal: t.theme.teal,
    black: t.theme.black,
  };

  return (
    <>
      <SettingsLabel>{t.theme.settings}</SettingsLabel>
      <div className="mt-2 flex flex-wrap gap-2">
        {THEME_OPTIONS.map((opt) => {
          const active = theme === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onThemeChange(opt.value)}
              className={`flex min-w-[72px] flex-1 flex-col items-center gap-2 rounded-2xl border px-2 py-3 transition-all ${
                active
                  ? "border-primary-500 bg-primary-50 shadow-sm"
                  : "border-[var(--theme-border)] bg-[var(--theme-bg)] hover:border-[var(--theme-divider)]"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                  active ? "border-primary-600" : "border-[var(--theme-divider)]"
                }`}
                style={{ backgroundColor: opt.color, boxShadow: opt.ring ? `inset 0 0 0 2px ${opt.ring}` : undefined }}
              >
                {active && (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke={["dark", "dimmed", "teal", "black"].includes(opt.value) ? "#e5e5e5" : opt.value === "crystal" ? "#007AFF" : "#059669"} strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className={`text-[12px] font-medium ${active ? "text-primary-700" : "text-[var(--theme-text)]"}`}>
                {themeLabels[opt.value]}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
