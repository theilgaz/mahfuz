import { useTranslation } from "~/hooks/useTranslation";
import { SettingsLabel } from "./SettingsShared";
import { getAllLocaleConfigs } from "~/locales/registry";
import type { Locale } from "~/locales/registry";

interface LanguageSectionProps {
  locale: string;
  onLocaleChange: (locale: Locale) => void;
}

export function LanguageSection({
  locale,
  onLocaleChange,
}: LanguageSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <SettingsLabel label={t.settings.language} description={t.settings.languageDesc} />
      <div className="flex items-center gap-1 rounded-lg bg-[var(--theme-input-bg)] p-0.5">
        {getAllLocaleConfigs().map(({ code, config }) => (
          <button
            key={code}
            onClick={() => onLocaleChange(code)}
            className={`rounded-md px-3 py-1 text-[12px] font-medium transition-all ${locale === code ? "bg-[var(--theme-bg-primary)] text-[var(--theme-text)] shadow-sm" : "text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]"}`}
          >
            {config.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}
