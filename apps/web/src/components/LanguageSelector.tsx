/**
 * First-visit language selector overlay.
 * Shows once until user confirms; detects browser language as default.
 */

import { useLocaleStore } from "~/stores/locale.store";
import { getAllLocaleConfigs, type Locale } from "~/locales/registry";
import { MahfuzLogo } from "~/components/icons/MahfuzLogo";

const FLAG: Record<string, string> = {
  tr: "\uD83C\uDDF9\uD83C\uDDF7",
  en: "\uD83C\uDDEC\uD83C\uDDE7",
  es: "\uD83C\uDDEA\uD83C\uDDF8",
  fr: "\uD83C\uDDEB\uD83C\uDDF7",
  ar: "\uD83C\uDDF8\uD83C\uDDE6",
  de: "\uD83C\uDDE9\uD83C\uDDEA",
  nl: "\uD83C\uDDF3\uD83C\uDDF1",
};

export function LanguageSelector() {
  const { locale, hasChosenLocale, setLocale, confirmLocale } = useLocaleStore();

  if (hasChosenLocale) return null;

  const locales = getAllLocaleConfigs();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-80 max-w-[calc(100vw-2rem)] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl shadow-lg p-6">
        {/* Logo + title */}
        <div className="flex flex-col items-center gap-2 mb-5">
          <MahfuzLogo size={36} />
          <h2 className="text-base font-semibold">Mahfuz</h2>
        </div>

        {/* Language grid */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {locales.map(({ code, config }) => {
            const active = locale === code;
            return (
              <button
                key={code}
                onClick={() => setLocale(code)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-full text-sm font-medium transition-all ${
                  active
                    ? "bg-[var(--mu-accent-soft)] text-[var(--mu-accent-ink)]"
                    : "bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)]"
                }`}
              >
                <span className="text-lg leading-none">{FLAG[code] ?? ""}</span>
                <span>{config.displayName}</span>
              </button>
            );
          })}
        </div>

        {/* Confirm */}
        <button
          onClick={confirmLocale}
          className="w-full py-2.5 rounded-full bg-[var(--mu-accent-soft)] text-[var(--mu-accent-ink)] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {CONFIRM_LABEL[locale] ?? "Continue"}
        </button>
      </div>
    </div>
  );
}

/** Static confirm labels per locale (no i18n needed). */
const CONFIRM_LABEL: Record<string, string> = {
  tr: "Devam et",
  en: "Continue",
  es: "Continuar",
  fr: "Continuer",
  ar: "\u0645\u062A\u0627\u0628\u0639\u0629",
  de: "Weiter",
  nl: "Doorgaan",
};
